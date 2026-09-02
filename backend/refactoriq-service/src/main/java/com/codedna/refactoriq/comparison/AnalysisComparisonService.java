package com.codedna.refactoriq.comparison;

import com.codedna.refactoriq.entity.AnalysisEntity;
import com.codedna.refactoriq.entity.FileMetricEntity;
import com.codedna.refactoriq.entity.IssueEntity;
import com.codedna.refactoriq.repository.AnalysisEntityRepository;
import com.codedna.refactoriq.repository.FileMetricEntityRepository;
import com.codedna.refactoriq.repository.IssueEntityRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisComparisonService {

    private final AnalysisEntityRepository analysisRepository;
    private final FileMetricEntityRepository fileMetricRepository;
    private final IssueEntityRepository issueRepository;
    private final ImpactScoreEngine impactScoreEngine;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricComparison {
        private double before;
        private double after;
        private double change; // Delta points or percentage
        private boolean improved;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComparisonReport {
        private Long beforeAnalysisId;
        private Long afterAnalysisId;
        private MetricComparison score;
        private MetricComparison loc;
        private MetricComparison complexity;
        private MetricComparison nesting;
        private MetricComparison dependencies;
        private MetricComparison coverage;
        private double overallImprovementPercent;
        private ImpactScoreEngine.ImpactAssessment impactAssessment;
        @Builder.Default
        private List<String> regressionAlerts = new ArrayList<>();
        @Builder.Default
        private List<String> positiveHighlights = new ArrayList<>();
    }

    public ComparisonReport compareAnalyses(Long beforeId, Long afterId) {
        AnalysisEntity before = analysisRepository.findById(beforeId)
                .orElseThrow(() -> new IllegalArgumentException("Before analysis not found: " + beforeId));
        AnalysisEntity after = analysisRepository.findById(afterId)
                .orElseThrow(() -> new IllegalArgumentException("After analysis not found: " + afterId));

        List<FileMetricEntity> beforeFiles = fileMetricRepository.findByAnalysisId(beforeId);
        List<FileMetricEntity> afterFiles = fileMetricRepository.findByAnalysisId(afterId);

        List<IssueEntity> beforeIssues = issueRepository.findByAnalysisId(beforeId);
        List<IssueEntity> afterIssues = issueRepository.findByAnalysisId(afterId);

        // Aggregate before metrics
        int bLoc = before.getTotalLines() > 0 ? before.getTotalLines() : beforeFiles.stream().mapToInt(FileMetricEntity::getLinesOfCode).sum();
        int bComplexity = (int) Math.round(before.getAverageComplexity() > 0 ? before.getAverageComplexity() : beforeFiles.stream().mapToInt(FileMetricEntity::getCyclomaticComplexity).max().orElse(1));
        int bNesting = beforeFiles.stream().mapToInt(FileMetricEntity::getMaxNestingDepth).max().orElse(1);
        int bDeps = beforeFiles.stream().mapToInt(FileMetricEntity::getDependencyCount).sum();
        double bCoverage = beforeFiles.stream().mapToDouble(FileMetricEntity::getTestCoverage).average().orElse(0.0);
        double bScore = before.getOverallScore();

        // Aggregate after metrics
        int aLoc = after.getTotalLines() > 0 ? after.getTotalLines() : afterFiles.stream().mapToInt(FileMetricEntity::getLinesOfCode).sum();
        int aComplexity = (int) Math.round(after.getAverageComplexity() > 0 ? after.getAverageComplexity() : afterFiles.stream().mapToInt(FileMetricEntity::getCyclomaticComplexity).max().orElse(1));
        int aNesting = afterFiles.stream().mapToInt(FileMetricEntity::getMaxNestingDepth).max().orElse(1);
        int aDeps = afterFiles.stream().mapToInt(FileMetricEntity::getDependencyCount).sum();
        double aCoverage = afterFiles.stream().mapToDouble(FileMetricEntity::getTestCoverage).average().orElse(0.0);
        double aScore = after.getOverallScore();

        return buildReport(
                beforeId, afterId,
                bScore, aScore,
                bLoc, aLoc,
                bComplexity, aComplexity,
                bNesting, aNesting,
                bDeps, aDeps,
                bCoverage, aCoverage,
                beforeIssues.size(), afterIssues.size()
        );
    }

    public ComparisonReport buildReport(
            Long beforeId, Long afterId,
            double bScore, double aScore,
            int bLoc, int aLoc,
            int bComplexity, int aComplexity,
            int bNesting, int aNesting,
            int bDeps, int aDeps,
            double bCoverage, double aCoverage,
            int bIssues, int aIssues
    ) {
        double scoreImp = bScore > 0 ? ((bScore - aScore) / bScore) * 100.0 : 0.0;
        double locChange = bLoc > 0 ? (((double)(aLoc - bLoc)) / (double)bLoc) * 100.0 : 0.0;
        double compChange = bComplexity > 0 ? (((double)(aComplexity - bComplexity)) / (double)bComplexity) * 100.0 : 0.0;
        double nestChange = bNesting > 0 ? (((double)(aNesting - bNesting)) / (double)bNesting) * 100.0 : 0.0;
        double depsChange = bDeps > 0 ? (((double)(aDeps - bDeps)) / (double)bDeps) * 100.0 : 0.0;
        double covChange = bCoverage > 0 ? (((aCoverage - bCoverage)) / bCoverage) * 100.0 : 0.0;

        List<String> regressions = new ArrayList<>();
        List<String> positives = new ArrayList<>();

        if (aComplexity < bComplexity) positives.add(String.format("Complexity reduced from %d to %d (%.1f%%)", bComplexity, aComplexity, Math.abs(compChange)));
        if (aNesting < bNesting) positives.add(String.format("Nesting reduced from %d to %d (%.1f%%)", bNesting, aNesting, Math.abs(nestChange)));
        if (aLoc < bLoc) positives.add(String.format("Lines of code reduced from %d to %d (%.1f%%)", bLoc, aLoc, Math.abs(locChange)));
        if (aDeps < bDeps) positives.add(String.format("Dependencies reduced from %d to %d", bDeps, aDeps));
        if (aCoverage > bCoverage) positives.add(String.format("Test coverage increased from %.0f%% to %.0f%%", bCoverage, aCoverage));

        // Regression checks
        if (aDeps > bDeps) {
            regressions.add(String.format("Refactoring improved complexity but increased coupling (%d → %d dependencies)", bDeps, aDeps));
        }
        if (aCoverage < bCoverage) {
            regressions.add(String.format("Test coverage dropped from %.0f%% to %.0f%%", bCoverage, aCoverage));
        }

        ImpactScoreEngine.ImpactAssessment impact = impactScoreEngine.calculateImpact(
                bScore, aScore, bLoc, aLoc, bComplexity, aComplexity,
                bNesting, aNesting, bDeps, aDeps, bCoverage, aCoverage,
                bIssues, aIssues
        );

        return ComparisonReport.builder()
                .beforeAnalysisId(beforeId)
                .afterAnalysisId(afterId)
                .score(MetricComparison.builder().before(bScore).after(aScore).change(Math.round(scoreImp * 10.0) / 10.0).improved(aScore < bScore).build())
                .loc(MetricComparison.builder().before(bLoc).after(aLoc).change(Math.round(locChange * 10.0) / 10.0).improved(aLoc <= bLoc).build())
                .complexity(MetricComparison.builder().before(bComplexity).after(aComplexity).change(Math.round(compChange * 10.0) / 10.0).improved(aComplexity <= bComplexity).build())
                .nesting(MetricComparison.builder().before(bNesting).after(aNesting).change(Math.round(nestChange * 10.0) / 10.0).improved(aNesting <= bNesting).build())
                .dependencies(MetricComparison.builder().before(bDeps).after(aDeps).change(Math.round(depsChange * 10.0) / 10.0).improved(aDeps <= bDeps).build())
                .coverage(MetricComparison.builder().before(Math.round(bCoverage)).after(Math.round(aCoverage)).change(Math.round(covChange * 10.0) / 10.0).improved(aCoverage >= bCoverage).build())
                .overallImprovementPercent(Math.round(scoreImp * 10.0) / 10.0)
                .impactAssessment(impact)
                .regressionAlerts(regressions)
                .positiveHighlights(positives)
                .build();
    }
}
