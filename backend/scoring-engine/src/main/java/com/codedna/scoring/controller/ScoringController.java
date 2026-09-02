package com.codedna.scoring.controller;

import com.codedna.common.model.DnaProfile;
import com.codedna.scoring.service.ScoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dna")
@RequiredArgsConstructor
@Tag(name = "DNA Scoring", description = "Developer DNA Scoring API")
public class ScoringController {

    private final ScoringService scoringService;

    @PostMapping("/calculate/{userId}")
    @Operation(summary = "Calculate DNA score for user")
    public ResponseEntity<DnaProfile> calculateScore(@PathVariable Long userId) {
        return ResponseEntity.ok(scoringService.calculateDnaScore(userId));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get DNA profile for user")
    public ResponseEntity<DnaProfile> getDnaProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(scoringService.getUserDnaProfile(userId));
    }
}
