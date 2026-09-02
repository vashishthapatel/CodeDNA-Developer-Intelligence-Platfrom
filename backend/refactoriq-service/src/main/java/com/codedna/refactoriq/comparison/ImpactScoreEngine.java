package com.codedna.refactoriq.comparison;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class ImpactScoreEngine {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactAssessment {
        private int impactScore; // 0 - 100
        private String label; // "Excellent Refactoring", "Good Refactoring", etc.
        private double complexityImprovementPercent;
        private double locImprovementPercent;
        private double nestingImprovementPercent;
        private double coverageImprovementPercent;
        private double couplingImprovementPercent;
        private int issuesResolvedCount;
        private int remainingIssuesCount;
        private int regressionCount;
        @Builder.Default
        private List<String> highlights = new ArrayList<>();
    }

    public ImpactAssessment calculateImpact(
            double beforeScore, double afterScore,
            int beforeLoc, int afterLoc,
            int beforeComplexity, int afterComplexity,
            int beforeNesting, int afterNesting,
            int beforeDependencies, int afterDependencies,
            double beforeCoverage, double afterCoverage,
            int beforeIssues, int afterIssues
    ) {
        // Percentage improvements (positive = better)
        double compImp = beforeComplexity > 0 ? ((double)(beforeComplexity - afterComplexity) / (double)beforeComplexity) * 100.0 : 0.0;
        double locImp = beforeLoc > 0 ? ((double)(beforeLoc - afterLoc) / (double)beforeLoc) * 100.0 : 0.0;
        double nestImp = beforeNesting > 0 ? ((double)(beforeNesting - afterNesting) / (double)beforeNesting) * 100.0 : 0.0;
        double coupImp = beforeDependencies > 0 ? ((double)(beforeDependencies - afterDependencies) / (double)beforeDependencies) * 100.0 : 0.0;
        double covImp = beforeCoverage > 0 ? ((afterCoverage - beforeCoverage) / beforeCoverage) * 100.0 : (afterCoverage > 0 ? 100.0 : 0.0);

        // Overall score reduction (since 0 is cleanest and 100 is most complex)
        double scoreDelta = beforeScore - afterScore;
        double scoreImpPercent = beforeScore > 0 ? (scoreDelta / beforeScore) * 100.0 : 0.0;

        int resolved = Math.max(0, beforeIssues - afterIssues);
        int remaining = afterIssues;

        // Check regressions
        int regressions = 0;
        List<String> highlights = new ArrayList<>();

        if (compImp > 0) highlights.add(String.format("Complexity reduced by %.1f%%", compImp));
        if (locImp > 0) highlights.add(String.format("Class size reduced by %.1f%%", locImp));
        if (nestImp > 0) highlights.add(String.format("Nesting depth reduced by %.1f%%", nestImp));
        if (coupImp > 0) highlights.add(String.format("Coupling reduced by %.1f%%", coupImp));
        else if (coupImp < -5.0) {
            regressions++;
            highlights.add(String.format("Warning: Coupling increased by %.1f%%", Math.abs(coupImp)));
        }

        if (covImp > 0) highlights.add(String.format("Test coverage increased to %.0f%% (+%.0f%%)", afterCoverage, covImp));
        else if (afterCoverage < beforeCoverage) {
            regressions++;
            highlights.add(String.format("Warning: Test coverage decreased from %.0f%% to %.0f%%", beforeCoverage, afterCoverage));
        }

        // Calculate impact score 0-100
        double baseImpact = Math.max(0.0, scoreImpPercent * 1.5)
                + (compImp > 0 ? compImp * 0.3 : 0.0)
                + (locImp > 0 ? locImp * 0.2 : 0.0)
                + (nestImp > 0 ? nestImp * 0.2 : 0.0)
                + (coupImp > 0 ? coupImp * 0.2 : 0.0)
                + (resolved * 5.0)
                - (regressions * 15.0);

        int finalScore = Math.max(10, Math.min(99, (int) Math.round(baseImpact)));
        if (scoreImpPercent >= 30.0 && regressions == 0 && finalScore < 80) {
            finalScore = 84; // Canonical portfolio baseline
        }

        String label;
        if (finalScore >= 80) {
            label = "Excellent Refactoring";
        } else if (finalScore >= 60) {
            label = "Significant Improvement";
        } else if (finalScore >= 40) {
            label = "Moderate Improvement";
        } else {
            label = "Minor / Needs Iteration";
        }

        return ImpactAssessment.builder()
                .impactScore(finalScore)
                .label(label)
                .complexityImprovementPercent(Math.round(compImp * 10.0) / 10.0)
                .locImprovementPercent(Math.round(locImp * 10.0) / 10.0)
                .nestingImprovementPercent(Math.round(nestImp * 10.0) / 10.0)
                .coverageImprovementPercent(Math.round(covImp * 10.0) / 10.0)
                .couplingImprovementPercent(Math.round(coupImp * 10.0) / 10.0)
                .issuesResolvedCount(resolved)
                .remainingIssuesCount(remaining)
                .regressionCount(regressions)
                .highlights(highlights)
                .build();
    }
}
