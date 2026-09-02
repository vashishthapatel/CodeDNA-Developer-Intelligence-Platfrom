package com.codedna.scoring.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "dna_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DnaProfileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    private Integer score;
    private String label;
    private String strongestArea;
    private String recommendedSkill;
    private String archetype;

    private LocalDateTime calculatedAt;
}
