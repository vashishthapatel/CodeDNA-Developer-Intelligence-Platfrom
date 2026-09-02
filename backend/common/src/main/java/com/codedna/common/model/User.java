package com.codedna.common.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String name;
    private String email;
    private String handle;
    private String title;
    private String bio;
    private String avatarUrl;
    private String location;
    private String company;
    private LocalDateTime joinedAt;
    private boolean githubConnected;
    private String githubUsername;
    private String githubAccessToken;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
