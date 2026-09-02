package com.codedna.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositorySyncedEvent {
    private Long userId;
    private Long repositoryId;
    private String repositoryName;
    private Integer commitsAnalyzed;
    private LocalDateTime syncedAt;
}
