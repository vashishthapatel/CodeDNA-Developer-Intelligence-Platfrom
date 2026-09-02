package com.codedna.analytics.service;

import com.codedna.analytics.dto.AnalyticsOverview;
import com.codedna.common.model.Repository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final RestTemplate restTemplate;
    private static final String REPOSITORY_SERVICE_URL = "http://localhost:8082/api/v1/repositories";

    public AnalyticsOverview getUserAnalytics(Long userId) {
        log.info("Generating analytics for user: {}", userId);

        // Fetch user repositories
        String url = REPOSITORY_SERVICE_URL + "/user/" + userId;
        Repository[] repositories = restTemplate.getForObject(url, Repository[].class);

        if (repositories == null || repositories.length == 0) {
            return createEmptyAnalytics();
        }

        List<Repository> repoList = Arrays.asList(repositories);

        return AnalyticsOverview.builder()
                .activity(generateActivity(repoList))
                .languages(generateLanguageDistribution(repoList))
                .quality(generateQualityTrend())
                .complexity(generateComplexityAnalysis(repoList))
                .heatmap(generateHeatmap())
                .collaboration(generateCollaborationStats(repoList))
                .build();
    }

    public AnalyticsOverview refreshAnalytics(Long userId) {
        log.info("Refreshing analytics for user: {}", userId);
        return getUserAnalytics(userId);
    }

    private List<AnalyticsOverview.ActivityPoint> generateActivity(List<Repository> repos) {
        List<AnalyticsOverview.ActivityPoint> activity = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

        Random random = new Random(42);
        for (String month : months) {
            activity.add(AnalyticsOverview.ActivityPoint.builder()
                    .date(month)
                    .commits(80 + random.nextInt(100))
                    .prs(8 + random.nextInt(16))
                    .build());
        }
        return activity;
    }

    private List<AnalyticsOverview.LanguageSlice> generateLanguageDistribution(List<Repository> repos) {
        Map<String, Integer> languageCounts = new HashMap<>();

        for (Repository repo : repos) {
            if (repo.getPrimaryLanguage() != null) {
                languageCounts.merge(repo.getPrimaryLanguage(), 1, Integer::sum);
            }
        }

        int total = languageCounts.values().stream().mapToInt(Integer::intValue).sum();
        String[] colors = {"#8B5CF6", "#6366F1", "#A78BFA", "#C4B5FD", "#3F3F52"};

        List<AnalyticsOverview.LanguageSlice> slices = new ArrayList<>();
        int colorIndex = 0;

        for (Map.Entry<String, Integer> entry : languageCounts.entrySet()) {
            int percentage = (int) ((entry.getValue() * 100.0) / total);
            slices.add(AnalyticsOverview.LanguageSlice.builder()
                    .name(entry.getKey())
                    .value(percentage)
                    .color(colors[colorIndex++ % colors.length])
                    .build());
        }

        return slices.stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .collect(Collectors.toList());
    }

    private List<AnalyticsOverview.QualityPoint> generateQualityTrend() {
        List<AnalyticsOverview.QualityPoint> quality = new ArrayList<>();
        String[] quarters = {"Q1 24", "Q2 24", "Q3 24", "Q4 24", "Q1 25", "Q2 25", "Q3 25"};

        int baseQuality = 62;
        int baseCoverage = 48;

        for (String quarter : quarters) {
            quality.add(AnalyticsOverview.QualityPoint.builder()
                    .date(quarter)
                    .quality(baseQuality)
                    .coverage(baseCoverage)
                    .build());
            baseQuality += 4;
            baseCoverage += 4;
        }

        return quality;
    }

    private List<AnalyticsOverview.ComplexityBar> generateComplexityAnalysis(List<Repository> repos) {
        return repos.stream()
                .limit(6)
                .map(repo -> AnalyticsOverview.ComplexityBar.builder()
                        .repo(repo.getName())
                        .complexity(repo.getHealth() != null ? repo.getHealth().getComplexity() : 70)
                        .maintainability(repo.getHealth() != null ? repo.getHealth().getMaintainability() : 75)
                        .build())
                .collect(Collectors.toList());
    }

    private List<AnalyticsOverview.HeatCell> generateHeatmap() {
        List<AnalyticsOverview.HeatCell> heatmap = new ArrayList<>();
        LocalDate start = LocalDate.now().minusDays(364);
        Random random = new Random(7);

        for (int i = 0; i < 365; i++) {
            LocalDate date = start.plusDays(i);
            int count = random.nextInt(12);
            int level = count == 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 9 ? 3 : 4;

            heatmap.add(AnalyticsOverview.HeatCell.builder()
                    .date(date.format(DateTimeFormatter.ISO_DATE))
                    .count(count)
                    .level(level)
                    .build());
        }

        return heatmap;
    }

    private AnalyticsOverview.CollaborationStats generateCollaborationStats(List<Repository> repos) {
        int totalPRs = repos.stream().mapToInt(Repository::getPullRequests).sum();
        int totalIssues = repos.stream().mapToInt(Repository::getIssues).sum();
        int totalContributors = repos.stream().mapToInt(Repository::getContributors).sum();

        return AnalyticsOverview.CollaborationStats.builder()
                .pullRequests(totalPRs)
                .reviews((int) (totalPRs * 1.15))
                .issues(totalIssues)
                .contributors(totalContributors)
                .build();
    }

    private AnalyticsOverview createEmptyAnalytics() {
        return AnalyticsOverview.builder()
                .activity(Collections.emptyList())
                .languages(Collections.emptyList())
                .quality(Collections.emptyList())
                .complexity(Collections.emptyList())
                .heatmap(Collections.emptyList())
                .collaboration(AnalyticsOverview.CollaborationStats.builder()
                        .pullRequests(0)
                        .reviews(0)
                        .issues(0)
                        .contributors(0)
                        .build())
                .build();
    }
}
