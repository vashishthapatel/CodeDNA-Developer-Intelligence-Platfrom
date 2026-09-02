package com.codedna.refactoriq.service;

import com.codedna.refactoriq.common.enums.AnalysisStatus;
import com.codedna.refactoriq.entity.*;
import com.codedna.refactoriq.issue.IssueDetectionEngine;
import com.codedna.refactoriq.metrics.DuplicationAnalyzer;
import com.codedna.refactoriq.metrics.MetricsEngine;
import com.codedna.refactoriq.parser.SourceFileModel;
import com.codedna.refactoriq.recommendation.RecommendationEngine;
import com.codedna.refactoriq.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisOrchestrator {

    private final AnalysisEntityRepository analysisRepository;
    private final FileMetricEntityRepository fileMetricRepository;
    private final MethodMetricEntityRepository methodMetricRepository;
    private final IssueEntityRepository issueRepository;
    private final RecommendationEntityRepository recommendationRepository;

    private final MetricsEngine metricsEngine;
    private final DuplicationAnalyzer duplicationAnalyzer;
    private final IssueDetectionEngine issueDetectionEngine;
    private final RecommendationEngine recommendationEngine;

    @Transactional
    public AnalysisEntity runAnalysis(Long analysisId, List<SourceFileModel> sourceFiles) {
        AnalysisEntity analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new IllegalArgumentException("Analysis not found: " + analysisId));

        analysis.setStatus(AnalysisStatus.RUNNING);
        analysisRepository.save(analysis);

        try {
            if (sourceFiles == null || sourceFiles.isEmpty()) {
                analysis.setStatus(AnalysisStatus.COMPLETED);
                analysis.setOverallScore(10.0);
                analysis.setSummary("No Java source files were found to analyze.");
                return analysisRepository.save(analysis);
            }

            // Duplication across files
            List<String> rawContents = sourceFiles.stream()
                    .map(SourceFileModel::getRawContent)
                    .filter(c -> c != null && !c.isEmpty())
                    .collect(Collectors.toList());
            double repoDuplication = duplicationAnalyzer.calculateDuplicationPercentage(rawContents);

            int totalLoc = 0;
            int totalClasses = 0;
            int totalMethods = 0;
            double weightedScoreSum = 0.0;
            int totalComplexitySum = 0;

            List<FileMetricEntity> savedFileMetrics = new ArrayList<>();
            List<IssueEntity> allIssues = new ArrayList<>();

            for (SourceFileModel sf : sourceFiles) {
                MetricsEngine.FileAnalysisResult result = metricsEngine.analyzeFile(
                        sf, analysisId, sourceFiles, repoDuplication
                );

                FileMetricEntity savedFm = fileMetricRepository.save(result.fileMetric);
                savedFileMetrics.add(savedFm);

                for (MethodMetricEntity mm : result.methodMetrics) {
                    mm.setFileMetricId(savedFm.getId());
                    methodMetricRepository.save(mm);
                }

                totalLoc += savedFm.getLinesOfCode();
                totalClasses += savedFm.getClassCount();
                totalMethods += savedFm.getMethodCount();
                totalComplexitySum += savedFm.getCyclomaticComplexity();
                weightedScoreSum += savedFm.getComplexityScore() * Math.max(10, savedFm.getLinesOfCode());

                // Detect issues
                List<IssueEntity> issues = issueDetectionEngine.detectIssues(
                        analysisId, sf, savedFm, result.methodMetrics, repoDuplication
                );

                for (IssueEntity issue : issues) {
                    IssueEntity savedIssue = issueRepository.save(issue);
                    allIssues.add(savedIssue);

                    // Generate recommendation for issue
                    RecommendationEntity rec = recommendationEngine.generateRecommendation(savedIssue, savedFm);
                    rec.setIssueId(savedIssue.getId());
                    recommendationRepository.save(rec);
                }
            }

            double overallScore = totalLoc > 0 ? (weightedScoreSum / (double) totalLoc) : 10.0;
            overallScore = Math.max(5.0, Math.min(100.0, Math.round(overallScore * 10.0) / 10.0));
            double avgComplexity = sourceFiles.isEmpty() ? 1.0 : (double) totalComplexitySum / sourceFiles.size();

            analysis.setOverallScore(overallScore);
            analysis.setTotalFiles(sourceFiles.size());
            analysis.setTotalLines(totalLoc);
            analysis.setTotalClasses(totalClasses);
            analysis.setTotalMethods(totalMethods);
            analysis.setAverageComplexity(Math.round(avgComplexity * 10.0) / 10.0);
            analysis.setStatus(AnalysisStatus.COMPLETED);
            analysis.setSummary(String.format("Analysis completed for %d files (%d LOC). Detected %d issues across %d classes.",
                    sourceFiles.size(), totalLoc, allIssues.size(), totalClasses));

            return analysisRepository.save(analysis);

        } catch (Exception e) {
            log.error("Analysis execution failed for ID: {}", analysisId, e);
            analysis.setStatus(AnalysisStatus.FAILED);
            analysis.setSummary("Analysis failed: " + e.getMessage());
            return analysisRepository.save(analysis);
        }
    }
}
