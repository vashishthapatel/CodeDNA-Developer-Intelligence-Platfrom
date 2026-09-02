package com.codedna.repository.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GitHubCommit {
    private String sha;

    @JsonProperty("commit")
    private CommitDetail commitDetail;

    @Data
    public static class CommitDetail {
        private Author author;
        private String message;

        @Data
        public static class Author {
            private String name;
            private String email;
            private LocalDateTime date;
        }
    }
}
