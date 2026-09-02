package com.codedna.refactoriq.entity;

import com.codedna.refactoriq.common.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "refactoriq_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefactoringSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long repositoryId;
    private Long beforeAnalysisId;
    private Long afterAnalysisId;
    private Long issueId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SessionStatus status = SessionStatus.PLANNED;

    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant completedAt;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String notes;
}
