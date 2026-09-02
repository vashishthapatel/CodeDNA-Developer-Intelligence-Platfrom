package com.codedna.auth.controller;

import com.codedna.auth.dto.GitHubOAuthDtos.AuthorizeUrlResponse;
import com.codedna.auth.dto.GitHubOAuthDtos.CodeRequest;
import com.codedna.auth.service.GitHubOAuthService;
import com.codedna.common.dto.AuthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/github")
@RequiredArgsConstructor
@Tag(name = "GitHub OAuth", description = "GitHub OAuth code → JWT. No PAT paste.")
public class GitHubOAuthController {

    private final GitHubOAuthService gitHubOAuthService;

    @GetMapping("/authorize")
    @Operation(summary = "Get the github.com/authorize URL to redirect the browser to")
    public ResponseEntity<AuthorizeUrlResponse> authorizeUrl() {
        String url = gitHubOAuthService.buildAuthorizeUrl();
        return ResponseEntity.ok(new AuthorizeUrlResponse(url));
    }

    @PostMapping("/callback")
    @Operation(summary = "Exchange ?code= from GitHub for a CodeDNA JWT")
    public ResponseEntity<AuthResponse> callback(@RequestBody CodeRequest req) {
        if (req.getCode() == null || req.getCode().isBlank()) {
            throw new RuntimeException("Missing code from GitHub redirect");
        }
        AuthResponse auth = gitHubOAuthService.authenticateWithCode(req.getCode().trim());
        return ResponseEntity.ok(auth);
    }

    /** For backends that prefer a straight redirect instead of SPA handling. */
    @GetMapping("/callback")
    @Operation(summary = "GET variant — same as POST but via query ?code=")
    public ResponseEntity<AuthResponse> callbackGet(@RequestParam("code") String code) {
        AuthResponse auth = gitHubOAuthService.authenticateWithCode(code.trim());
        return ResponseEntity.ok(auth);
    }
}
