package com.codedna.common.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recommendation {
    private Long id;
    private Long userId;
    private String title;
    private String reason;
    private String difficulty;
    private String duration;
    private String category;
    private Integer matchScore;
    private List<String> tags;
    private LocalDateTime createdAt;
}
