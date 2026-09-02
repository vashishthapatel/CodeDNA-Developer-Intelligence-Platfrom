package com.codedna.refactoriq.repository;

import com.codedna.refactoriq.entity.MethodMetricEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MethodMetricEntityRepository extends JpaRepository<MethodMetricEntity, Long> {
    List<MethodMetricEntity> findByFileMetricId(Long fileMetricId);
}
