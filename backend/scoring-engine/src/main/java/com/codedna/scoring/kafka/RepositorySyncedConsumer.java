package com.codedna.scoring.kafka;

import com.codedna.common.event.RepositorySyncedEvent;
import com.codedna.scoring.service.ScoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RepositorySyncedConsumer {

    private final ScoringService scoringService;

    @KafkaListener(topics = "repository.synced", groupId = "scoring-engine")
    public void handleRepositorySynced(RepositorySyncedEvent event) {
        log.info("Received repository synced event: {}", event);

        try {
            scoringService.calculateDnaScore(event.getUserId());
            log.info("DNA score recalculated for user: {}", event.getUserId());
        } catch (Exception e) {
            log.error("Failed to calculate DNA score", e);
        }
    }
}
