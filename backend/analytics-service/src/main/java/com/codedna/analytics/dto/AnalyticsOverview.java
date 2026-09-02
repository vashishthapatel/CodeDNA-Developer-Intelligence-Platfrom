package com.codedna.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverview {
    private List<ActivityPoint> activity;
    private List<LanguageSlice> languages;
    private List<QualityPoint> quality;
    private List<ComplexityBar> complexity;
    private List<HeatCell> heatmap;
    private CollaborationStats collaboration;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityPoint {
        private String date;
        private Integer commits;
        private Integer prs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LanguageSlice {
        private String name;
        private Integer value;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityPoint {
        private String date;
        private Integer quality;
        private Integer coverage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComplexityBar {
        private String repo;
        private Integer complexity;
        private Integer maintainability;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HeatCell {
        private String date;
        private Integer count;
        private Integer level;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollaborationStats {
        private Integer pullRequests;
        private Integer reviews;
        private Integer issues;
        private Integer contributors;
    }
}
