package com.codedna.gateway.websocket;

import com.codedna.common.event.DnaCalculatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "dna.calculated", groupId = "api-gateway")
    public void handleDnaCalculated(DnaCalculatedEvent event) {
        log.info("Broadcasting DNA update to user: {}", event.getUserId());

        messagingTemplate.convertAndSend(
                "/topic/user/" + event.getUserId() + "/dna",
                event
        );
    }
}
