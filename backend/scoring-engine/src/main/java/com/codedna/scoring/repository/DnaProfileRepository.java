package com.codedna.scoring.repository;

import com.codedna.scoring.entity.DnaProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DnaProfileRepository extends JpaRepository<DnaProfileEntity, Long> {
    Optional<DnaProfileEntity> findByUserId(Long userId);
}
