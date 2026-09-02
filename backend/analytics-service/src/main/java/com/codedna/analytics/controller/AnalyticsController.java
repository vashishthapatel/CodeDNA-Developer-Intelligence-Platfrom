package com.codedna.analytics.controller;

import com.codedna.analytics.dto.AnalyticsOverview;
import com.codedna.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Analytics and Insights API")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get comprehensive analytics for a user")
    public ResponseEntity<AnalyticsOverview> getUserAnalytics(@PathVariable Long userId) {
        return ResponseEntity.ok(analyticsService.getUserAnalytics(userId));
    }

    @PostMapping("/refresh/{userId}")
    @Operation(summary = "Refresh analytics data")
    public ResponseEntity<AnalyticsOverview> refreshAnalytics(@PathVariable Long userId) {
        return ResponseEntity.ok(analyticsService.refreshAnalytics(userId));
    }
}
