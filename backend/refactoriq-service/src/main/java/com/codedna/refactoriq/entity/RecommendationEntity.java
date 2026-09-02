package com.codedna.refactoriq.entity;

import com.codedna.refactoriq.common.enums.RefactoringType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "refactoriq_recommendations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long issueId;
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    private RefactoringType refactoringType;

    private String estimatedImpact;
    private int priority; // e.g. 1-100

    @Lob
    @Column(columnDefinition = "TEXT")
    private String stepsJson; // JSON array of steps
}
