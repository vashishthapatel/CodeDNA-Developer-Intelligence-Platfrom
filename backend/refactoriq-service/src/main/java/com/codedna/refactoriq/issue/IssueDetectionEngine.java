package com.codedna.refactoriq.issue;

import com.codedna.refactoriq.common.enums.IssueType;
import com.codedna.refactoriq.common.enums.Severity;
import com.codedna.refactoriq.entity.FileMetricEntity;
import com.codedna.refactoriq.entity.IssueEntity;
import com.codedna.refactoriq.entity.MethodMetricEntity;
import com.codedna.refactoriq.metrics.DependencyAnalyzer;
import com.codedna.refactoriq.parser.SourceFileModel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class IssueDetectionEngine {

    private final DependencyAnalyzer dependencyAnalyzer;

    public List<IssueEntity> detectIssues(
            Long analysisId,
            SourceFileModel sourceModel,
            FileMetricEntity fileMetric,
            List<MethodMetricEntity> methodMetrics,
            double repoDuplication
    ) {
        List<IssueEntity> issues = new ArrayList<>();
        if (sourceModel.isTestFile()) {
            return issues; // Focus refactoring issues on production code
        }

        String path = sourceModel.getPath();

        // 1. High Complexity + Low Coverage Combined Rule (Critical candidate)
        if (fileMetric.getCyclomaticComplexity() > 15 && fileMetric.getTestCoverage() < 30.0) {
            issues.add(IssueEntity.builder()
                    .analysisId(analysisId)
                    .filePath(path)
                    .methodName(null)
                    .type(IssueType.LOW_COVERAGE_HIGH_COMPLEXITY)
                    .severity(Severity.CRITICAL)
                    .message(String.format("Critical risk: High complexity (%d) with low test coverage (%.0f%%). Add unit tests before refactoring.",
                            fileMetric.getCyclomaticComplexity(), fileMetric.getTestCoverage()))
                    .metricValue(fileMetric.getCyclomaticComplexity())
                    .threshold(15.0)
                    .estimatedImpact("CRITICAL")
                    .build());
        }

        // 2. High Cyclomatic Complexity
        if (fileMetric.getCyclomaticComplexity() > 20) {
            issues.add(IssueEntity.builder()
                    .analysisId(analysisId)
                    .filePath(path)
                    .methodName(null)
                    .type(IssueType.HIGH_COMPLEXITY)
                    .severity(Severity.CRITICAL)
                    .message(String.format("Class contains high decision complexity (%d > threshold 20). High branch count increases cognitive load and defect probability.",
                            fileMetric.getCyclomaticComplexity()))
                    .metricValue(fileMetric.getCyclomaticComplexity())
                    .threshold(20.0)
                    .estimatedImpact("HIGH")
                    .build());
        } else if (fileMetric.getCyclomaticComplexity() >= 12) {
            issues.add(IssueEntity.builder()
                    .analysisId(analysisId)
                    .filePath(path)
                    .methodName(null)
                    .type(IssueType.HIGH_COMPLEXITY)
                    .severity(Severity.HIGH)
                    .message(String.format("Elevated cyclomatic complexity (%d). Methods contain multiple branching paths.",
                            fileMetric.getCyclomaticComplexity()))
                    .metricValue(fileMetric.getCyclomaticComplexity())
                    .threshold(10.0)
                    .estimatedImpact("MEDIUM")
                    .build());
        }

        // 3. Large Class
        if (fileMetric.getLinesOfCode() > 400 || fileMetric.getMethodCount() > 15) {
            Severity sev = (fileMetric.getLinesOfCode() > 600) ? Severity.CRITICAL : Severity.HIGH;
            issues.add(IssueEntity.builder()
                    .analysisId(analysisId)
                    .filePath(path)
                    .methodName(null)
                    .type(IssueType.LARGE_CLASS)
                    .severity(sev)
                    .message(String.format("Large Class smell: %d LOC and %d methods. Violates Single Responsibility Principle.",
                            fileMetric.getLinesOfCode(), fileMetric.getMethodCount()))
                    .metricValue(fileMetric.getLinesOfCode())
                    .threshold(400.0)
                    .estimatedImpact("HIGH")
                    .build());
        }

        // 4. Deep Nesting
        if (fileMetric.getMaxNestingDepth() >= 4) {
            Severity sev = (fileMetric.getMaxNestingDepth() > 4) ? Severity.CRITICAL : Severity.HIGH;
            issues.add(IssueEntity.builder()
                    .analysisId(analysisId)
                    .filePath(path)
                    .methodName(null)
                    .type(IssueType.DEEP_NESTING)
                    .severity(sev)
                    .message(String.format("Deep nesting detected (level %d > threshold 3). Deeply nested conditionals reduce readability.",
                            fileMetric.getMaxNestingDepth()))
                    .metricValue(fileMetric.getMaxNestingDepth())
                    .threshold(3.0)
                    .estimatedImpact("HIGH")
                    .build());
        }

        // 5. High Coupling / Dependencies
        if (fileMetric.getImportCount() > 20) {
            issues.add(IssueEntity.builder()
                    .analysisId(analysisId)
                    .filePath(path)
                    .methodName(null)
                    .type(IssueType.HIGH_COUPLING)
                    .severity(Severity.HIGH)
                    .message(String.format("High coupling: imports %d external packages. Indicates tight coupling and broad responsibilities.",
                            fileMetric.getImportCount()))
                    .metricValue(fileMetric.getImportCount())
                    .threshold(20.0)
                    .estimatedImpact("MEDIUM")
                    .build());
        }

        // 6. Layer Violations
        List<String> layerViolations = dependencyAnalyzer.detectArchitecturalViolations(sourceModel);
        for (String violation : layerViolations) {
            issues.add(IssueEntity.builder()
                    .analysisId(analysisId)
                    .filePath(path)
                    .methodName(null)
                    .type(IssueType.LAYER_VIOLATION)
                    .severity(Severity.HIGH)
                    .message(violation)
                    .metricValue(1.0)
                    .threshold(0.0)
                    .estimatedImpact("HIGH")
                    .build());
        }

        // 7. Method-level Large Method & Complexity
        for (MethodMetricEntity mm : methodMetrics) {
            if (mm.getLinesOfCode() > 50) {
                issues.add(IssueEntity.builder()
                        .analysisId(analysisId)
                        .filePath(path)
                        .methodName(mm.getMethodName())
                        .type(IssueType.LARGE_METHOD)
                        .severity(Severity.MEDIUM)
                        .message(String.format("Method '%s' is overly long (%d LOC). Split into focused helper methods.",
                                mm.getMethodName(), mm.getLinesOfCode()))
                        .metricValue(mm.getLinesOfCode())
                        .threshold(50.0)
                        .estimatedImpact("MEDIUM")
                        .build());
            }
        }

        // 8. Duplication
        if (repoDuplication > 10.0) {
            issues.add(IssueEntity.builder()
                    .analysisId(analysisId)
                    .filePath(path)
                    .methodName(null)
                    .type(IssueType.DUPLICATION)
                    .severity(Severity.MEDIUM)
                    .message(String.format("Duplicate code blocks detected in repository (%.1f%% duplicate chunk ratio).", repoDuplication))
                    .metricValue(repoDuplication)
                    .threshold(8.0)
                    .estimatedImpact("MEDIUM")
                    .build());
        }

        return issues;
    }
}
