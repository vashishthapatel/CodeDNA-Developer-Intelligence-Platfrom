package com.codedna.recommendation.repository;

import com.codedna.recommendation.entity.RecommendationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<RecommendationEntity, Long> {
    List<RecommendationEntity> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
