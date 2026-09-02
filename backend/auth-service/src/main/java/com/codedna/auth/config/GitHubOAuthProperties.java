package com.codedna.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Reads GitHub OAuth credentials from env — never from code.
 * Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in the environment
 * that runs auth-service (local shell, docker-compose, or prod secrets).
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "github.oauth")
public class GitHubOAuthProperties {
    /** From https://github.com/settings/developers → OAuth Apps → Client ID */
    private String clientId;
    /** Client secret — only shown once at creation, keep in env */
    private String clientSecret;
    /** Frontend callback that receives ?code= — e.g. http://localhost:5173/auth/callback */
    private String frontendCallbackUrl = "http://localhost:5173/auth/callback";
}
