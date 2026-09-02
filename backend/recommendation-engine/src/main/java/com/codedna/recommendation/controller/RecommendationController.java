package com.codedna.recommendation.controller;

import com.codedna.common.model.Recommendation;
import com.codedna.recommendation.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations", description = "Skill Recommendations API")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @PostMapping("/generate/{userId}")
    @Operation(summary = "Generate recommendations for user")
    public ResponseEntity<List<Recommendation>> generateRecommendations(@PathVariable Long userId) {
        return ResponseEntity.ok(recommendationService.generateRecommendations(userId));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get recommendations for user")
    public ResponseEntity<List<Recommendation>> getUserRecommendations(@PathVariable Long userId) {
        return ResponseEntity.ok(recommendationService.getUserRecommendations(userId));
    }
}
