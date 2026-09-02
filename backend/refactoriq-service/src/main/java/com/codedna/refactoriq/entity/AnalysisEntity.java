package com.codedna.refactoriq.entity;

import com.codedna.refactoriq.common.enums.AnalysisStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "refactoriq_analyses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long repositoryId;
    private String commitSha;
    private double overallScore; // 0 - 100
    private int totalFiles;
    private int totalLines;
    private int totalClasses;
    private int totalMethods;
    private double averageComplexity;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AnalysisStatus status = AnalysisStatus.PENDING;

    @Column(length = 2000)
    private String summary;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
