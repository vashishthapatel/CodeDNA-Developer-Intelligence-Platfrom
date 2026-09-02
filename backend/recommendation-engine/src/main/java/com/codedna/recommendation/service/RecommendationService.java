package com.codedna.recommendation.service;

import com.codedna.common.model.DnaProfile;
import com.codedna.common.model.Recommendation;
import com.codedna.recommendation.entity.RecommendationEntity;
import com.codedna.recommendation.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final RestTemplate restTemplate;
    private static final String SCORING_SERVICE_URL = "http://localhost:8084/api/v1/dna";

    @Transactional
    public List<Recommendation> generateRecommendations(Long userId) {
        log.info("Generating recommendations for user: {}", userId);

        // Fetch DNA profile
        String url = SCORING_SERVICE_URL + "/user/" + userId;
        DnaProfile dnaProfile = restTemplate.getForObject(url, DnaProfile.class);

        if (dnaProfile == null) {
            return Collections.emptyList();
        }

        // Clear existing recommendations
        recommendationRepository.deleteByUserId(userId);

        // Generate new recommendations
        List<RecommendationEntity> recommendations = new ArrayList<>();

        // Skill-based recommendations
        recommendations.addAll(generateSkillRecommendations(userId, dnaProfile));

        // Save all
        List<RecommendationEntity> saved = recommendationRepository.saveAll(recommendations);
        log.info("Generated {} recommendations for user {}", saved.size(), userId);

        return saved.stream()
                .map(this::mapToRecommendation)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Recommendation> getUserRecommendations(Long userId) {
        return recommendationRepository.findByUserId(userId).stream()
                .map(this::mapToRecommendation)
                .collect(Collectors.toList());
    }

    private List<RecommendationEntity> generateSkillRecommendations(Long userId, DnaProfile profile) {
        List<RecommendationEntity> recommendations = new ArrayList<>();

        // Distributed Systems
        recommendations.add(RecommendationEntity.builder()
                .userId(userId)
                .title("Distributed Systems")
                .reason("Your backend architecture score is high, but your repositories show limited evidence of distributed-system patterns.")
                .difficulty("Advanced")
                .duration("6–8 weeks")
                .category("Architecture")
                .matchScore(94)
                .tags(Arrays.asList("Consensus", "Sharding", "CAP"))
                .build());

        // Kubernetes
        recommendations.add(RecommendationEntity.builder()
                .userId(userId)
                .title("Kubernetes")
                .reason("You containerize with Docker frequently, but orchestration patterns are missing across your services.")
                .difficulty("Intermediate")
                .duration("4–6 weeks")
                .category("Infrastructure")
                .matchScore(89)
                .tags(Arrays.asList("Helm", "Operators", "Autoscaling"))
                .build());

        // System Design
        recommendations.add(RecommendationEntity.builder()
                .userId(userId)
                .title("System Design")
                .reason("Strong implementation skills — formalizing high-level design will round out your senior profile.")
                .difficulty("Advanced")
                .duration("5–7 weeks")
                .category("Architecture")
                .matchScore(86)
                .tags(Arrays.asList("Scalability", "Trade-offs", "Modeling"))
                .build());

        // Observability
        recommendations.add(RecommendationEntity.builder()
                .userId(userId)
                .title("Observability")
                .reason("Metrics and tracing appear in only a few repos; strengthening this improves production readiness.")
                .difficulty("Intermediate")
                .duration("3–4 weeks")
                .category("Operations")
                .matchScore(81)
                .tags(Arrays.asList("Tracing", "Metrics", "Logging"))
                .build());

        return recommendations;
    }

    private Recommendation mapToRecommendation(RecommendationEntity entity) {
        return Recommendation.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .title(entity.getTitle())
                .reason(entity.getReason())
                .difficulty(entity.getDifficulty())
                .duration(entity.getDuration())
                .category(entity.getCategory())
                .matchScore(entity.getMatchScore())
                .tags(entity.getTags())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
