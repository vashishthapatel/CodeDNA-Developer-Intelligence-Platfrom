package com.codedna.repository.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GitHubRepo {
    private Long id;
    private String name;

    @JsonProperty("full_name")
    private String fullName;

    private String description;

    @JsonProperty("private")
    private boolean isPrivate;

    @JsonProperty("stargazers_count")
    private Integer stars;

    @JsonProperty("forks_count")
    private Integer forks;

    @JsonProperty("open_issues_count")
    private Integer openIssues;

    private String language;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    @JsonProperty("pushed_at")
    private LocalDateTime pushedAt;
}
