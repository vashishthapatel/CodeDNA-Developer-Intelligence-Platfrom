package com.codedna.refactoriq.metrics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

@Component
public class ComplexityScoreEngine {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreBreakdown {
        private double totalScore;
        private double cyclomaticComponent;
        private double locComponent;
        private double nestingComponent;
        private double couplingComponent;
        private double classSizeComponent;
        private double duplicationComponent;
        private double coverageRiskComponent;
        private String explanation;
    }

    public ScoreBreakdown calculateScore(
            int cyclomaticComplexity,
            int loc,
            int maxNesting,
            int importCount,
            int methodCount,
            double duplicationPercent,
            double testCoveragePercent
    ) {
        // 25% Cyclomatic Complexity: 1-5 is baseline, >20 is max (25 pts)
        double compNorm = Math.min(1.0, Math.max(0.0, (cyclomaticComplexity - 1) / 22.0));
        double cyclomaticComponent = compNorm * 25.0;

        // 20% LOC: <100 baseline, >500 max (20 pts)
        double locNorm = Math.min(1.0, Math.max(0.0, (loc - 50) / 450.0));
        double locComponent = locNorm * 20.0;

        // 15% Nesting: <=2 baseline, >=5 max (15 pts)
        double nestingNorm = Math.min(1.0, Math.max(0.0, (maxNesting - 1) / 4.0));
        double nestingComponent = nestingNorm * 15.0;

        // 15% Coupling: <=5 baseline, >=25 max (15 pts)
        double couplingNorm = Math.min(1.0, Math.max(0.0, (importCount - 5) / 20.0));
        double couplingComponent = couplingNorm * 15.0;

        // 10% Class Size (Method count & structural size): <=5 baseline, >=20 max (10 pts)
        double sizeNorm = Math.min(1.0, Math.max(0.0, (methodCount - 3) / 17.0));
        double classSizeComponent = sizeNorm * 10.0;

        // 10% Duplication: 0% baseline, >=20% max (10 pts)
        double dupNorm = Math.min(1.0, Math.max(0.0, duplicationPercent / 20.0));
        double duplicationComponent = dupNorm * 10.0;

        // 5% Test Coverage Risk: 100% coverage = 0 risk pts, 0% coverage = 5 risk pts
        double coverageNorm = Math.min(1.0, Math.max(0.0, (100.0 - testCoveragePercent) / 100.0));
        double coverageRiskComponent = coverageNorm * 5.0;

        double total = cyclomaticComponent + locComponent + nestingComponent
                + couplingComponent + classSizeComponent + duplicationComponent + coverageRiskComponent;

        // Round to 1 decimal place or clamp between 5 and 100 for non-empty files
        double totalScore = Math.max(5.0, Math.min(100.0, Math.round(total * 10.0) / 10.0));

        StringBuilder expl = new StringBuilder();
        expl.append(String.format("Complexity Score: %.0f/100 (", totalScore));
        expl.append(String.format("Complexity: %.1f/25, ", cyclomaticComponent));
        expl.append(String.format("LOC: %.1f/20, ", locComponent));
        expl.append(String.format("Nesting: %.1f/15, ", nestingComponent));
        expl.append(String.format("Coupling: %.1f/15, ", couplingComponent));
        expl.append(String.format("Class Size: %.1f/10, ", classSizeComponent));
        expl.append(String.format("Duplication: %.1f/10, ", duplicationComponent));
        expl.append(String.format("Coverage Risk: %.1f/5)", coverageRiskComponent));

        return ScoreBreakdown.builder()
                .totalScore(totalScore)
                .cyclomaticComponent(Math.round(cyclomaticComponent * 10.0) / 10.0)
                .locComponent(Math.round(locComponent * 10.0) / 10.0)
                .nestingComponent(Math.round(nestingComponent * 10.0) / 10.0)
                .couplingComponent(Math.round(couplingComponent * 10.0) / 10.0)
                .classSizeComponent(Math.round(classSizeComponent * 10.0) / 10.0)
                .duplicationComponent(Math.round(duplicationComponent * 10.0) / 10.0)
                .coverageRiskComponent(Math.round(coverageRiskComponent * 10.0) / 10.0)
                .explanation(expl.toString())
                .build();
    }

    public double calculateHotspotScore(
            double complexityScore,
            int loc,
            int changeFrequency,
            double testCoverage,
            int coupling
    ) {
        // Hotspot Score = 40% Complexity + 20% LOC + 15% Change Frequency + 15% Low Coverage + 10% Coupling
        double cWeight = (complexityScore / 100.0) * 40.0;
        double locWeight = Math.min(1.0, loc / 500.0) * 20.0;
        double changeWeight = Math.min(1.0, Math.max(1, changeFrequency) / 20.0) * 15.0;
        double covWeight = ((100.0 - testCoverage) / 100.0) * 15.0;
        double coupWeight = Math.min(1.0, coupling / 25.0) * 10.0;

        double total = cWeight + locWeight + changeWeight + covWeight + coupWeight;
        return Math.max(5.0, Math.min(100.0, Math.round(total * 10.0) / 10.0));
    }
}
