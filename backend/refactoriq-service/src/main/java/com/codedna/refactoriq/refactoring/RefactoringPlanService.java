package com.codedna.refactoriq.refactoring;

import com.codedna.refactoriq.common.enums.RefactoringType;
import com.codedna.refactoriq.entity.FileMetricEntity;
import com.codedna.refactoriq.entity.IssueEntity;
import com.codedna.refactoriq.entity.RecommendationEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class RefactoringPlanService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanDto {
        private Long issueId;
        private String fileName;
        private String title;
        private String problem;
        private String impact;
        private int priority;
        private RefactoringType refactoringType;
        @Builder.Default
        private List<String> steps = new ArrayList<>();
        private String beforeCodeSnippet;
        private String proposedCodeSnippet;
        private String diffPreview;
    }

    public PlanDto buildPlan(IssueEntity issue, RecommendationEntity recommendation, FileMetricEntity fileMetric, String sourceCode) {
        String fileName = extractFileName(issue.getFilePath());
        List<String> steps = new ArrayList<>();

        if (recommendation != null && recommendation.getStepsJson() != null) {
            try {
                steps = objectMapper.readValue(recommendation.getStepsJson(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse steps JSON", e);
            }
        }

        if (steps.isEmpty()) {
            steps.add("Review identified code smell and dependencies");
            steps.add("Extract responsibilities into modular methods or classes");
            steps.add("Add unit test coverage for refactored units");
            steps.add("Re-run analysis to measure complexity improvement");
        }

        String problem = String.format("Class '%s' exhibits %s. %s", fileName, issue.getType(), issue.getMessage());
        String title = recommendation != null ? recommendation.getTitle() : "Refactor " + fileName;
        String impact = recommendation != null ? recommendation.getEstimatedImpact() : "HIGH";
        int priority = recommendation != null ? recommendation.getPriority() : 80;
        RefactoringType type = recommendation != null ? recommendation.getRefactoringType() : RefactoringType.EXTRACT_CLASS;

        return PlanDto.builder()
                .issueId(issue.getId())
                .fileName(fileName)
                .title(title)
                .problem(problem)
                .impact(impact)
                .priority(priority)
                .refactoringType(type)
                .steps(steps)
                .build();
    }

    private String extractFileName(String path) {
        if (path == null) return "SourceFile.java";
        String normalized = path.replace("\\", "/");
        int lastSlash = normalized.lastIndexOf('/');
        return lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
    }
}
