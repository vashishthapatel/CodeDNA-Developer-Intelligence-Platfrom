package com.codedna.refactoriq.entity;

import com.codedna.refactoriq.common.enums.IssueType;
import com.codedna.refactoriq.common.enums.Severity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "refactoriq_issues")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long analysisId;
    private String filePath;
    private String methodName;

    @Enumerated(EnumType.STRING)
    private IssueType type;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Column(length = 1000)
    private String message;

    private double metricValue;
    private double threshold;
    private String estimatedImpact;
}
