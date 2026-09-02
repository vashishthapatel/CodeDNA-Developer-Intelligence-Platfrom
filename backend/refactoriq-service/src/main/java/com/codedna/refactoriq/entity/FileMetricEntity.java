package com.codedna.refactoriq.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "refactoriq_file_metrics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMetricEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long analysisId;
    private String filePath;
    private String className;
    private String language;
    private int linesOfCode;
    private int classCount;
    private int methodCount;
    private int cyclomaticComplexity;
    private int maxNestingDepth;
    private int importCount;
    private int dependencyCount;
    private boolean testFile;
    private double testCoverage;
    private double complexityScore;
    private double hotspotScore;
    private int changeFrequency;
}
