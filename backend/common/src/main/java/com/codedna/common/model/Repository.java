package com.codedna.common.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Repository {
    private Long id;
    private Long userId;
    private String name;
    private String fullName;
    private String description;
    private String primaryLanguage;
    private List<String> languages;
    private Integer stars;
    private Integer forks;
    private Integer commits;
    private Integer pullRequests;
    private Integer issues;
    private Integer contributors;
    private Integer dnaContribution;
    private String visibility;
    private LocalDateTime updatedAt;
    private LocalDateTime syncedAt;
    private RepositoryHealth health;
    private List<String> stack;
    private List<String> patterns;
}
