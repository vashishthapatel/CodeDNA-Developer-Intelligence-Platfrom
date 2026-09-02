package com.codedna.refactoriq.controller;

import com.codedna.refactoriq.common.enums.AnalysisStatus;
import com.codedna.refactoriq.common.enums.SessionStatus;
import com.codedna.refactoriq.comparison.AnalysisComparisonService;
import com.codedna.refactoriq.entity.*;
import com.codedna.refactoriq.parser.JavaSourceParser;
import com.codedna.refactoriq.parser.SourceFileModel;
import com.codedna.refactoriq.refactoring.RefactoringEngine;
import com.codedna.refactoriq.refactoring.RefactoringPlanService;
import com.codedna.refactoriq.repository.*;
import com.codedna.refactoriq.service.AnalysisOrchestrator;
import com.codedna.refactoriq.service.RepositoryDownloader;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/refactoriq")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "RefactorIQ", description = "Deterministic Static Analysis, Refactoring Recommendations & Comparison API")
public class RefactorIqController {

    private final RepositoryEntityRepository repositoryRepo;
    private final AnalysisEntityRepository analysisRepo;
    private final FileMetricEntityRepository fileMetricRepo;
    private final MethodMetricEntityRepository methodMetricRepo;
    private final IssueEntityRepository issueRepo;
    private final RecommendationEntityRepository recommendationRepo;
    private final RefactoringSessionEntityRepository sessionRepo;

    private final AnalysisOrchestrator analysisOrchestrator;
    private final AnalysisComparisonService comparisonService;
    private final RefactoringPlanService planService;
    private final RefactoringEngine refactoringEngine;
    private final JavaSourceParser javaSourceParser;
    private final RepositoryDownloader repositoryDownloader;

    @GetMapping("/repositories")
    @Operation(summary = "Get all repositories analyzed by RefactorIQ")
    public ResponseEntity<List<RepositoryEntity>> getRepositories() {
        return ResponseEntity.ok(repositoryRepo.findAll());
    }

    @PostMapping("/repositories/{id}/analyze")
    @Operation(summary = "Trigger deterministic static analysis for repository")
    public ResponseEntity<?> analyzeRepository(@PathVariable Long id) {
        RepositoryEntity repo = repositoryRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Repository not found: " + id));

        AnalysisEntity analysis = analysisRepo.save(AnalysisEntity.builder()
                .repositoryId(repo.getId())
                .commitSha(UUID.randomUUID().toString().substring(0, 8))
                .status(AnalysisStatus.PENDING)
                .overallScore(0.0)
                .build());

        // No server-side file fetcher for stored repositories yet.
        // Callers should use POST /analyze/code with explicit file contents
        // or the Live GitHub analyzer (client-side) for remote repos.
        Map<String, Object> err = new HashMap<>();
        err.put("message", "No source files available for this repository. Use POST /api/v1/refactoriq/analyze/code with file contents or the Live GitHub analyzer.");
        err.put("analysisId", analysis.getId());
        // Mark the placeholder analysis as FAILED so it does not pollute history
        analysis.setStatus(AnalysisStatus.FAILED);
        analysis.setSummary((String) err.get("message"));
        analysisRepo.save(analysis);
        return ResponseEntity.badRequest().body(err);
    }

    @GetMapping("/repositories/{id}/analyses")
    @Operation(summary = "Get analysis history for a repository")
    public ResponseEntity<List<AnalysisEntity>> getRepositoryAnalyses(@PathVariable Long id) {
        return ResponseEntity.ok(analysisRepo.findByRepositoryIdOrderByCreatedAtDesc(id));
    }

    @GetMapping("/analyses/{id}")
    @Operation(summary = "Get analysis details and overall score")
    public ResponseEntity<AnalysisEntity> getAnalysis(@PathVariable Long id) {
        return analysisRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/analyses/{id}/metrics")
    @Operation(summary = "Get file and method metrics for analysis")
    public ResponseEntity<Map<String, Object>> getAnalysisMetrics(@PathVariable Long id) {
        List<FileMetricEntity> fileMetrics = fileMetricRepo.findByAnalysisIdOrderByHotspotScoreDesc(id);
        Map<Long, List<MethodMetricEntity>> methodMetricsMap = new HashMap<>();

        for (FileMetricEntity fm : fileMetrics) {
            methodMetricsMap.put(fm.getId(), methodMetricRepo.findByFileMetricId(fm.getId()));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("analysisId", id);
        result.put("fileMetrics", fileMetrics);
        result.put("methodMetrics", methodMetricsMap);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/analyses/{id}/issues")
    @Operation(summary = "Get detected code issues for analysis")
    public ResponseEntity<List<IssueEntity>> getAnalysisIssues(@PathVariable Long id) {
        return ResponseEntity.ok(issueRepo.findByAnalysisId(id));
    }

    @GetMapping("/analyses/{id}/recommendations")
    @Operation(summary = "Get refactoring recommendations for analysis")
    public ResponseEntity<List<RecommendationEntity>> getAnalysisRecommendations(@PathVariable Long id) {
        List<IssueEntity> issues = issueRepo.findByAnalysisId(id);
        List<Long> issueIds = issues.stream().map(IssueEntity::getId).toList();
        return ResponseEntity.ok(recommendationRepo.findByIssueIdIn(issueIds));
    }

    @GetMapping("/issues/{id}/refactoring-plan")
    @Operation(summary = "Generate structured refactoring plan for an issue")
    public ResponseEntity<RefactoringPlanService.PlanDto> getRefactoringPlan(@PathVariable Long id) {
        IssueEntity issue = issueRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + id));

        RecommendationEntity rec = recommendationRepo.findByIssueId(id).orElse(null);
        FileMetricEntity fileMetric = fileMetricRepo.findByAnalysisId(issue.getAnalysisId()).stream()
                .filter(f -> f.getFilePath().equals(issue.getFilePath()))
                .findFirst().orElse(null);

        RefactoringPlanService.PlanDto plan = planService.buildPlan(issue, rec, fileMetric, null);
        return ResponseEntity.ok(plan);
    }

    @PostMapping("/issues/{id}/refactoring-session")
    @Operation(summary = "Create a refactoring session for an issue")
    public ResponseEntity<RefactoringSessionEntity> createSession(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        IssueEntity issue = issueRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + id));

        AnalysisEntity beforeAnalysis = analysisRepo.findById(issue.getAnalysisId())
                .orElseThrow(() -> new IllegalArgumentException("Analysis not found: " + issue.getAnalysisId()));

        RefactoringSessionEntity session = sessionRepo.save(RefactoringSessionEntity.builder()
                .repositoryId(beforeAnalysis.getRepositoryId())
                .beforeAnalysisId(beforeAnalysis.getId())
                .issueId(issue.getId())
                .status(SessionStatus.IN_PROGRESS)
                .build());

        return ResponseEntity.ok(session);
    }

    @GetMapping("/refactoring/{id}")
    @Operation(summary = "Get refactoring session details")
    public ResponseEntity<RefactoringSessionEntity> getSession(@PathVariable Long id) {
        return sessionRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/refactoring/{id}/complete")
    @Operation(summary = "Complete a refactoring session and trigger re-analysis")
    public ResponseEntity<?> completeSession(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> refactoredCodeMap
    ) {
        RefactoringSessionEntity session = sessionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + id));

        if (refactoredCodeMap == null || refactoredCodeMap.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Refactored code map is required. Send { \"path/to/File.java\": \"<source>\" } as JSON body."
            ));
        }

        List<SourceFileModel> parsed = repositoryDownloader.parseExplicitFiles(refactoredCodeMap);

        AnalysisEntity afterAnalysis = analysisRepo.save(AnalysisEntity.builder()
                .repositoryId(session.getRepositoryId())
                .commitSha(UUID.randomUUID().toString().substring(0, 8))
                .status(AnalysisStatus.PENDING)
                .overallScore(0.0)
                .build());

        AnalysisEntity completedAfter = analysisOrchestrator.runAnalysis(afterAnalysis.getId(), parsed);

        session.setAfterAnalysisId(completedAfter.getId());
        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());
        session.setNotes("Re-analysis executed after applying refactoring transformations.");

        return ResponseEntity.ok(sessionRepo.save(session));
    }

    @Data
    public static class TransformRequest {
        private String sourceCode;
        private String className;
        private String transformationType;
    }

    @PostMapping("/refactoring/transform")
    @Operation(summary = "Apply safe AST code transformations (Level 2 automated refactoring)")
    public ResponseEntity<RefactoringEngine.RefactorResult> transformCode(@RequestBody TransformRequest req) {
        if ("GUARD_CLAUSE".equalsIgnoreCase(req.getTransformationType()) || "INTRODUCE_GUARD_CLAUSES".equalsIgnoreCase(req.getTransformationType())) {
            return ResponseEntity.ok(refactoringEngine.applyGuardClauseTransformation(req.getSourceCode()));
        } else if ("EXTRACT_CLASS".equalsIgnoreCase(req.getTransformationType())) {
            return ResponseEntity.ok(refactoringEngine.generateExtractedClassScaffold(
                    req.getClassName() != null ? req.getClassName() : "ExtractedValidator.java",
                    req.getSourceCode()
            ));
        }

        return ResponseEntity.ok(refactoringEngine.applyGuardClauseTransformation(req.getSourceCode()));
    }

    @GetMapping("/comparisons/{beforeId}/{afterId}")
    @Operation(summary = "Compare two analysis runs, detect regressions, and compute impact score")
    public ResponseEntity<AnalysisComparisonService.ComparisonReport> compareAnalyses(
            @PathVariable Long beforeId,
            @PathVariable Long afterId
    ) {
        return ResponseEntity.ok(comparisonService.compareAnalyses(beforeId, afterId));
    }

    @Data
    public static class CodeAnalysisRequest {
        private String fileName;
        private String code;
    }

    @PostMapping("/analyze/code")
    @Operation(summary = "Analyze custom Java code snippet directly")
    public ResponseEntity<Map<String, Object>> analyzeSnippet(@RequestBody CodeAnalysisRequest req) {
        String fileName = req.getFileName() != null ? req.getFileName() : "CustomCode.java";
        String code = req.getCode() != null ? req.getCode() : "";

        SourceFileModel model = javaSourceParser.parseSource(fileName, code)
                .orElseGet(() -> SourceFileModel.builder().path(fileName).rawContent(code).build());

        RepositoryEntity repo = repositoryRepo.save(RepositoryEntity.builder()
                .name("custom-snippet")
                .fullName("user/custom-snippet")
                .language("Java")
                .build());

        AnalysisEntity analysis = analysisRepo.save(AnalysisEntity.builder()
                .repositoryId(repo.getId())
                .status(AnalysisStatus.PENDING)
                .build());

        AnalysisEntity completed = analysisOrchestrator.runAnalysis(analysis.getId(), List.of(model));
        List<FileMetricEntity> metrics = fileMetricRepo.findByAnalysisId(completed.getId());
        List<IssueEntity> issues = issueRepo.findByAnalysisId(completed.getId());
        List<RecommendationEntity> recs = recommendationRepo.findByIssueIdIn(issues.stream().map(IssueEntity::getId).toList());

        Map<String, Object> resp = new HashMap<>();
        resp.put("analysis", completed);
        resp.put("metrics", metrics);
        resp.put("issues", issues);
        resp.put("recommendations", recs);

        return ResponseEntity.ok(resp);
    }
}
