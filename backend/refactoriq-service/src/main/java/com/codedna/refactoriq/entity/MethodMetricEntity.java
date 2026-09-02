package com.codedna.refactoriq.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "refactoriq_method_metrics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MethodMetricEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long fileMetricId;
    private String methodName;
    private int startLine;
    private int endLine;
    private int linesOfCode;
    private int cyclomaticComplexity;
    private int nestingDepth;
    private int parameterCount;
}
