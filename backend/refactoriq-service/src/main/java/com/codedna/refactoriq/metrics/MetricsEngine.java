package com.codedna.refactoriq.metrics;

import com.codedna.refactoriq.entity.FileMetricEntity;
import com.codedna.refactoriq.entity.MethodMetricEntity;
import com.codedna.refactoriq.parser.ClassModel;
import com.codedna.refactoriq.parser.MethodModel;
import com.codedna.refactoriq.parser.SourceFileModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MetricsEngine {

    private final LocAnalyzer locAnalyzer;
    private final ComplexityAnalyzer complexityAnalyzer;
    private final NestingAnalyzer nestingAnalyzer;
    private final DependencyAnalyzer dependencyAnalyzer;
    private final DuplicationAnalyzer duplicationAnalyzer;
    private final TestAnalyzer testAnalyzer;
    private final ComplexityScoreEngine scoreEngine;

    public static class FileAnalysisResult {
        public FileMetricEntity fileMetric;
        public List<MethodMetricEntity> methodMetrics = new ArrayList<>();
        public ComplexityScoreEngine.ScoreBreakdown scoreBreakdown;
    }

    public FileAnalysisResult analyzeFile(
            SourceFileModel sourceModel,
            Long analysisId,
            List<SourceFileModel> allFiles,
            double repoDuplicationPercent
    ) {
        FileAnalysisResult result = new FileAnalysisResult();

        int loc = sourceModel.getLinesOfCode();
        int classCount = sourceModel.getClasses().size();
        int importCount = sourceModel.getImports().size();

        int totalMethods = 0;
        int maxMethodComplexity = 1;
        int maxNesting = 0;
        String mainClassName = sourceModel.getClasses().isEmpty() ? "Unknown" : sourceModel.getClasses().get(0).getName();

        List<MethodMetricEntity> methodEntities = new ArrayList<>();

        for (ClassModel cm : sourceModel.getClasses()) {
            totalMethods += cm.getMethods().size();
            for (MethodModel mm : cm.getMethods()) {
                if (mm.getCyclomaticComplexity() > maxMethodComplexity) {
                    maxMethodComplexity = mm.getCyclomaticComplexity();
                }
                if (mm.getNestingDepth() > maxNesting) {
                    maxNesting = mm.getNestingDepth();
                }

                MethodMetricEntity mEntity = MethodMetricEntity.builder()
                        .methodName(mm.getName())
                        .startLine(mm.getStartLine())
                        .endLine(mm.getEndLine())
                        .linesOfCode(mm.getLinesOfCode())
                        .cyclomaticComplexity(mm.getCyclomaticComplexity())
                        .nestingDepth(mm.getNestingDepth())
                        .parameterCount(mm.getParameterCount())
                        .build();
                methodEntities.add(mEntity);
            }
        }

        boolean hasTest = testAnalyzer.hasMatchingTestClass(sourceModel, allFiles);
        double testCoverage = sourceModel.isTestFile() ? 100.0 : (hasTest ? 75.0 : 15.0);
        int changeFrequency = Math.max(1, (int) (loc / 35.0));

        ComplexityScoreEngine.ScoreBreakdown breakdown = scoreEngine.calculateScore(
                maxMethodComplexity,
                loc,
                maxNesting,
                importCount,
                totalMethods,
                repoDuplicationPercent,
                testCoverage
        );

        double hotspotScore = scoreEngine.calculateHotspotScore(
                breakdown.getTotalScore(),
                loc,
                changeFrequency,
                testCoverage,
                importCount
        );

        FileMetricEntity fileEntity = FileMetricEntity.builder()
                .analysisId(analysisId)
                .filePath(sourceModel.getPath())
                .className(mainClassName)
                .language("Java")
                .linesOfCode(loc)
                .classCount(classCount)
                .methodCount(totalMethods)
                .cyclomaticComplexity(maxMethodComplexity)
                .maxNestingDepth(maxNesting)
                .importCount(importCount)
                .dependencyCount(importCount)
                .testFile(sourceModel.isTestFile())
                .testCoverage(testCoverage)
                .complexityScore(breakdown.getTotalScore())
                .hotspotScore(hotspotScore)
                .changeFrequency(changeFrequency)
                .build();

        result.fileMetric = fileEntity;
        result.methodMetrics = methodEntities;
        result.scoreBreakdown = breakdown;

        return result;
    }
}
