package com.codedna.auth.service;

import com.codedna.auth.entity.UserEntity;
import com.codedna.auth.repository.UserRepository;
import com.codedna.auth.security.JwtTokenProvider;
import com.codedna.common.dto.AuthResponse;
import com.codedna.common.dto.LoginRequest;
import com.codedna.common.dto.RegisterRequest;
import com.codedna.common.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        String handle = generateHandle(request.getName());

        UserEntity user = UserEntity.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .handle(handle)
                .title("Developer")
                .joinedAt(LocalDateTime.now())
                .githubConnected(false)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: {}", user.getId());

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getId());
        String refreshToken = jwtTokenProvider.generateToken(user.getEmail(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .user(mapToUser(user))
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        log.info("User login attempt: {}", request.getEmail());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getId());
        String refreshToken = jwtTokenProvider.generateToken(user.getEmail(), user.getId());

        log.info("User logged in successfully: {}", user.getId());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .user(mapToUser(user))
                .build();
    }

    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUser(user);
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUser(user);
    }

    private String generateHandle(String name) {
        String baseHandle = name.toLowerCase()
                .replaceAll("[^a-z0-9]", "")
                .substring(0, Math.min(name.length(), 15));

        String handle = baseHandle;
        int suffix = 1;

        while (userRepository.existsByHandle(handle)) {
            handle = baseHandle + suffix++;
        }

        return handle;
    }

    private User mapToUser(UserEntity entity) {
        return User.builder()
                .id(entity.getId())
                .name(entity.getName())
                .email(entity.getEmail())
                .handle(entity.getHandle())
                .title(entity.getTitle())
                .bio(entity.getBio())
                .avatarUrl(entity.getAvatarUrl())
                .location(entity.getLocation())
                .company(entity.getCompany())
                .joinedAt(entity.getJoinedAt())
                .githubConnected(entity.isGithubConnected())
                .githubUsername(entity.getGithubUsername())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
