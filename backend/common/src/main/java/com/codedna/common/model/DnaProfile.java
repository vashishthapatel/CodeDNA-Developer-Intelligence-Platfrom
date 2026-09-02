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
public class DnaProfile {
    private Long id;
    private Long userId;
    private Integer score;
    private String label;
    private String strongestArea;
    private String recommendedSkill;
    private String archetype;
    private List<Skill> languages;
    private List<Skill> engineering;
    private List<Skill> radial;
    private LocalDateTime calculatedAt;
}
