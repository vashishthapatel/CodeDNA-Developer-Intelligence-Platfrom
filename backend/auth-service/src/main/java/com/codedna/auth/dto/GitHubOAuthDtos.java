package com.codedna.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class GitHubOAuthDtos {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CodeRequest {
        private String code;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuthorizeUrlResponse {
        private String url;
    }

    // GitHub → our backend: POST https://github.com/login/oauth/access_token
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class GitHubTokenResponse {
        @JsonProperty("access_token")
        private String accessToken;
        @JsonProperty("token_type")
        private String tokenType;
        private String scope;
        private String error;
        @JsonProperty("error_description")
        private String errorDescription;
    }

    // GitHub user returned from https://api.github.com/user
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class GitHubUserDto {
        private String login;
        private Long id;
        private String name;
        private String email;
        @JsonProperty("avatar_url")
        private String avatarUrl;
        private String bio;
        private String location;
        private String company;
        @JsonProperty("html_url")
        private String htmlUrl;
    }
}
