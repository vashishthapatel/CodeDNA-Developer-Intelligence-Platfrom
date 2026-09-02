package com.codedna.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DnaCalculatedEvent {
    private Long userId;
    private Integer previousScore;
    private Integer newScore;
    private String label;
    private LocalDateTime calculatedAt;
}
