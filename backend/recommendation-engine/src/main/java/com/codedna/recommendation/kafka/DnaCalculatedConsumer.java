package com.codedna.recommendation.kafka;

import com.codedna.common.event.DnaCalculatedEvent;
import com.codedna.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DnaCalculatedConsumer {

    private final RecommendationService recommendationService;

    @KafkaListener(topics = "dna.calculated", groupId = "recommendation-engine")
    public void handleDnaCalculated(DnaCalculatedEvent event) {
        log.info("Received DNA calculated event: {}", event);

        try {
            recommendationService.generateRecommendations(event.getUserId());
            log.info("Recommendations generated for user: {}", event.getUserId());
        } catch (Exception e) {
            log.error("Failed to generate recommendations", e);
        }
    }
}
