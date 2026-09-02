package com.codedna.auth.service;

import com.codedna.auth.config.GitHubOAuthProperties;
import com.codedna.auth.dto.GitHubOAuthDtos.GitHubTokenResponse;
import com.codedna.auth.dto.GitHubOAuthDtos.GitHubUserDto;
import com.codedna.auth.entity.UserEntity;
import com.codedna.auth.repository.UserRepository;
import com.codedna.auth.security.JwtTokenProvider;
import com.codedna.common.dto.AuthResponse;
import com.codedna.common.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Exchanges the temporary {@code code} GitHub sends to the frontend
 * for a long-lived access token — then turns that into a CodeDNA JWT.
 *
 * Flow:
 *  frontend redirect → github.com/login/oauth/authorize → ?code= on frontend
 *  frontend POST /api/v1/auth/github/callback {code} → here
 *  here → github.com/login/oauth/access_token → access_token
 *  here → api.github.com/user (+ /user/emails) → GitHubUserDto
 *  here → upsert UserEntity → JwtTokenProvider → AuthResponse → frontend
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GitHubOAuthService {

    private final GitHubOAuthProperties props;
    private final RestTemplate restTemplate;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    /** GitHub → backend token exchange. */
    public String exchangeCodeForToken(String code) {
        if (props.getClientId() == null || props.getClientId().isBlank()
                || props.getClientSecret() == null || props.getClientSecret().isBlank()) {
            throw new IllegalStateException(
                    "GitHub OAuth not configured — set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET env vars (or github.oauth.client-id/client-secret in properties).");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        Map<String, String> body = Map.of(
                "client_id", props.getClientId(),
                "client_secret", props.getClientSecret(),
                "code", code
        );
        HttpEntity<Map<String, String>> req = new HttpEntity<>(body, headers);
        ResponseEntity<GitHubTokenResponse> res = restTemplate.exchange(
                "https://github.com/login/oauth/access_token",
                HttpMethod.POST, req, GitHubTokenResponse.class);

        GitHubTokenResponse token = res.getBody();
        if (token == null || token.getAccessToken() == null) {
            String err = token != null ? token.getErrorDescription() : "empty response";
            if (token != null && token.getError() != null) err = token.getError() + ": " + token.getErrorDescription();
            throw new RuntimeException("GitHub token exchange failed — " + err);
        }
        log.info("GitHub token exchanged (scope={})", token.getScope());
        return token.getAccessToken();
    }

    public GitHubUserDto fetchGitHubUser(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.valueOf("application/vnd.github+json")));
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        HttpEntity<Void> req = new HttpEntity<>(headers);

        ResponseEntity<GitHubUserDto> res = restTemplate.exchange(
                "https://api.github.com/user", HttpMethod.GET, req, GitHubUserDto.class);
        GitHubUserDto user = res.getBody();
        if (user == null || user.getLogin() == null) {
            throw new RuntimeException("GitHub /user returned empty profile");
        }
        if (user.getEmail() == null) {
            String primary = fetchPrimaryEmail(accessToken);
            user.setEmail(primary);
        }
        return user;
    }

    private String fetchPrimaryEmail(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            HttpEntity<Void> req = new HttpEntity<>(headers);
            ResponseEntity<List<Map<String, Object>>> res = restTemplate.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET, req, new ParameterizedTypeReference<>() {});
            List<Map<String, Object>> emails = res.getBody();
            if (emails != null) {
                for (Map<String, Object> e : emails) {
                    if (Boolean.TRUE.equals(e.get("primary")) && e.get("email") instanceof String s) return s;
                }
                if (!emails.isEmpty() && emails.get(0).get("email") instanceof String s) return s;
            }
        } catch (Exception ex) {
            log.warn("Could not fetch GitHub emails: {}", ex.getMessage());
        }
        return null;
    }

    /** Full handshake: code → token → GitHub user → local user → JWT → AuthResponse. */
    @Transactional
    public AuthResponse authenticateWithCode(String code) {
        String accessToken = exchangeCodeForToken(code);
        GitHubUserDto gh = fetchGitHubUser(accessToken);
        UserEntity entity = upsertUser(gh, accessToken);
        String token = jwtTokenProvider.generateToken(entity.getEmail(), entity.getId());
        String refreshToken = jwtTokenProvider.generateToken(entity.getEmail(), entity.getId());
        log.info("GitHub OAuth success: login={} localUserId={}", gh.getLogin(), entity.getId());
        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .user(mapToUser(entity))
                .build();
    }

    private UserEntity upsertUser(GitHubUserDto gh, String accessToken) {
        UserEntity existing = null;
        if (gh.getLogin() != null) {
            existing = userRepository.findByGithubUsername(gh.getLogin()).orElse(null);
        }
        if (existing == null && gh.getEmail() != null) {
            existing = userRepository.findByEmail(gh.getEmail()).orElse(null);
        }

        if (existing != null) {
            existing.setGithubConnected(true);
            existing.setGithubUsername(gh.getLogin());
            existing.setGithubAccessToken(accessToken);
            if (gh.getAvatarUrl() != null) existing.setAvatarUrl(gh.getAvatarUrl());
            if (gh.getName() != null) existing.setName(gh.getName());
            if (gh.getBio() != null) existing.setBio(gh.getBio());
            if (gh.getLocation() != null) existing.setLocation(gh.getLocation());
            if (gh.getCompany() != null) existing.setCompany(gh.getCompany());
            return userRepository.save(existing);
        }

        String handle = generateHandle(gh.getLogin() != null ? gh.getLogin() : gh.getName());
        String email = gh.getEmail() != null ? gh.getEmail() : gh.getLogin() + "@github.local";
        String uniqueEmail = email;
        int suffix = 1;
        while (userRepository.existsByEmail(uniqueEmail)) uniqueEmail = email.replace("@", "+" + suffix++ + "@");

        UserEntity created = UserEntity.builder()
                .name(gh.getName() != null ? gh.getName() : gh.getLogin())
                .email(uniqueEmail)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .handle(handle)
                .title("Developer")
                .bio(gh.getBio())
                .avatarUrl(gh.getAvatarUrl())
                .location(gh.getLocation())
                .company(gh.getCompany())
                .githubConnected(true)
                .githubUsername(gh.getLogin())
                .githubAccessToken(accessToken)
                .joinedAt(LocalDateTime.now())
                .build();
        return userRepository.save(created);
    }

    private String generateHandle(String raw) {
        String base = (raw == null ? "user" : raw.toLowerCase().replaceAll("[^a-z0-9]", ""));
        if (base.isEmpty()) base = "user";
        base = base.substring(0, Math.min(base.length(), 15));
        String handle = base;
        int i = 1;
        while (userRepository.existsByHandle(handle)) handle = base + i++;
        return handle;
    }

    private User mapToUser(UserEntity e) {
        return User.builder()
                .id(e.getId())
                .name(e.getName())
                .email(e.getEmail())
                .handle(e.getHandle())
                .title(e.getTitle())
                .bio(e.getBio())
                .avatarUrl(e.getAvatarUrl())
                .location(e.getLocation())
                .company(e.getCompany())
                .joinedAt(e.getJoinedAt())
                .githubConnected(e.isGithubConnected())
                .githubUsername(e.getGithubUsername())
                .githubAccessToken(e.getGithubAccessToken())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    /** Builds the github.com/authorize URL the frontend should redirect to. */
    public String buildAuthorizeUrl() {
        if (props.getClientId() == null || props.getClientId().isBlank()) {
            throw new IllegalStateException("Set GITHUB_CLIENT_ID / github.oauth.client-id first.");
        }
        String scope = "repo,read:user,read:org";
        String redirect = props.getFrontendCallbackUrl();
        return "https://github.com/login/oauth/authorize"
                + "?client_id=" + props.getClientId()
                + "&scope=" + scope
                + "&redirect_uri=" + java.net.URLEncoder.encode(redirect, java.nio.charset.StandardCharsets.UTF_8);
    }
}
