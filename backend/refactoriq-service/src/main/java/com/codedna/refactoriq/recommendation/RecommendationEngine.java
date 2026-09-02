package com.codedna.refactoriq.recommendation;

import com.codedna.refactoriq.common.enums.RefactoringType;
import com.codedna.refactoriq.common.enums.Severity;
import com.codedna.refactoriq.entity.FileMetricEntity;
import com.codedna.refactoriq.entity.IssueEntity;
import com.codedna.refactoriq.entity.RecommendationEntity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecommendationEngine {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public RecommendationEntity generateRecommendation(IssueEntity issue, FileMetricEntity fileMetric) {
        String title;
        String description;
        RefactoringType refactoringType;
        String estimatedImpact;
        List<String> steps = new ArrayList<>();

        String simpleName = extractSimpleName(issue.getFilePath());

        switch (issue.getType()) {
            case LOW_COVERAGE_HIGH_COMPLEXITY:
                title = "Add Unit Tests & Decompose " + simpleName;
                description = String.format("%s combines high complexity (%d) with low test coverage (%.0f%%). Establishing test coverage first prevents regressions before modularizing logic.",
                        simpleName, fileMetric != null ? fileMetric.getCyclomaticComplexity() : (int) issue.getMetricValue(), fileMetric != null ? fileMetric.getTestCoverage() : 15.0);
                refactoringType = RefactoringType.ADD_UNIT_TESTS;
                estimatedImpact = "CRITICAL";
                steps.add("Write unit test harness covering current baseline behaviors");
                steps.add("Isolate edge cases and branch coverage with mock fixtures");
                steps.add("Extract high-complexity branches into dedicated helper methods");
                steps.add("Re-run tests and verify zero regressions");
                break;

            case HIGH_COMPLEXITY:
                title = "Decompose Complex Logic in " + simpleName;
                description = String.format("%s has high cyclomatic complexity (%d). Extract nested decision trees into separate strategy handlers or early-exit guard clauses.",
                        simpleName, (int) issue.getMetricValue());
                refactoringType = RefactoringType.INTRODUCE_GUARD_CLAUSES;
                estimatedImpact = "HIGH";
                steps.add("Apply early return guard clauses to eliminate nested conditional branches");
                steps.add("Extract discrete validation and domain calculation steps into helper methods");
                steps.add("Consider Strategy Pattern for dynamic branching logic");
                steps.add("Run regression test suite");
                break;

            case LARGE_CLASS:
                title = "Extract " + simpleName + " Responsibilities";
                description = String.format("%s contains multiple concerns across %d LOC and %d methods. Split into single-responsibility delegates.",
                        simpleName, fileMetric != null ? fileMetric.getLinesOfCode() : (int) issue.getMetricValue(), fileMetric != null ? fileMetric.getMethodCount() : 16);
                refactoringType = RefactoringType.EXTRACT_CLASS;
                estimatedImpact = "HIGH";
                steps.add("Identify cohesive clusters of methods and state");
                steps.add(String.format("Extract validation logic into dedicated %sValidator", simpleName.replace("Service", "").replace("Controller", "")));
                steps.add(String.format("Extract external notifications/clients into dedicated %sNotificationService", simpleName.replace("Service", "")));
                steps.add("Inject extracted collaborators into main coordinator");
                steps.add("Re-run analysis to verify LOC and complexity drop");
                break;

            case DEEP_NESTING:
                title = "Flatten Deep Nesting via Guard Clauses in " + simpleName;
                description = String.format("Nesting level reaches depth %d. Invert negative assertions and exit early to keep execution flow linear.",
                        (int) issue.getMetricValue());
                refactoringType = RefactoringType.INTRODUCE_GUARD_CLAUSES;
                estimatedImpact = "HIGH";
                steps.add("Identify outermost preconditions and invert to early return / throw");
                steps.add("Eliminate cascading else-if ladders");
                steps.add("Extract deeply nested inner loops into dedicated query functions");
                break;

            case HIGH_COUPLING:
                title = "Decouple External Dependencies for " + simpleName;
                description = String.format("%s imports %d external packages. Introduce Facades or Dependency Inversion to minimize direct coupling.",
                        simpleName, (int) issue.getMetricValue());
                refactoringType = RefactoringType.REDUCE_DEPENDENCIES;
                estimatedImpact = "MEDIUM";
                steps.add("Group related downstream repository/service dependencies into a Facade");
                steps.add("Define clean interfaces for third-party adapters");
                steps.add("Remove obsolete or wildcard imports");
                break;

            case LAYER_VIOLATION:
                title = "Fix Architecture Layer Violation in " + simpleName;
                description = issue.getMessage() + ". Architecture requires strict separation: Controller -> Service -> Repository.";
                refactoringType = RefactoringType.FIX_LAYER_VIOLATION;
                estimatedImpact = "HIGH";
                steps.add("Remove direct Repository dependency from Controller");
                steps.add("Delegate domain queries and mutations through Service interface");
                steps.add("Inject Service layer dependency via constructor");
                break;

            case LARGE_METHOD:
                title = "Extract Sub-methods from '" + (issue.getMethodName() != null ? issue.getMethodName() : "method") + "'";
                description = String.format("Method exceeds length thresholds (%d LOC). Extract distinct computational steps.", (int) issue.getMetricValue());
                refactoringType = RefactoringType.EXTRACT_METHOD;
                estimatedImpact = "MEDIUM";
                steps.add("Identify self-contained logical sections");
                steps.add("Use Extract Method refactoring to create private helpers with descriptive names");
                steps.add("Pass only required parameters to keep scope minimal");
                break;

            case DUPLICATION:
                title = "Consolidate Duplicate Logic across " + simpleName;
                description = "Duplicate code blocks detected across files. Consolidate into a reusable utility or shared service.";
                refactoringType = RefactoringType.EXTRACT_SHARED_LOGIC;
                estimatedImpact = "MEDIUM";
                steps.add("Identify matching token sequences across classes");
                steps.add("Create parameterized shared method or component");
                steps.add("Replace duplicate sites with calls to common helper");
                break;

            default:
                title = "Refactor " + simpleName;
                description = issue.getMessage();
                refactoringType = RefactoringType.EXTRACT_METHOD;
                estimatedImpact = "MEDIUM";
                steps.add("Review method responsibilities");
                steps.add("Refactor identified code smells");
                break;
        }

        int priority = calculatePriority(issue, fileMetric);

        String stepsJson = "[]";
        try {
            stepsJson = objectMapper.writeValueAsString(steps);
        } catch (JsonProcessingException e) {
            log.error("Error serializing steps", e);
        }

        return RecommendationEntity.builder()
                .issueId(issue.getId())
                .title(title)
                .description(description)
                .refactoringType(refactoringType)
                .estimatedImpact(estimatedImpact)
                .priority(priority)
                .stepsJson(stepsJson)
                .build();
    }

    private int calculatePriority(IssueEntity issue, FileMetricEntity fileMetric) {
        // Priority Score = Issue Severity + Complexity + Low Coverage Risk + Potential Improvement
        int severityPoints = 10;
        if (issue.getSeverity() == Severity.CRITICAL) severityPoints = 40;
        else if (issue.getSeverity() == Severity.HIGH) severityPoints = 30;
        else if (issue.getSeverity() == Severity.MEDIUM) severityPoints = 20;

        int complexityPoints = fileMetric != null ? Math.min(25, fileMetric.getCyclomaticComplexity()) : 10;
        int coverageRisk = (fileMetric != null && fileMetric.getTestCoverage() < 30.0) ? 20 : 5;
        int potentialImprovement = 15;

        int total = severityPoints + complexityPoints + coverageRisk + potentialImprovement;
        return Math.min(99, Math.max(20, total));
    }

    private String extractSimpleName(String path) {
        if (path == null) return "Class";
        String normalized = path.replace("\\", "/");
        int lastSlash = normalized.lastIndexOf('/');
        String filename = lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
        return filename;
    }
}
