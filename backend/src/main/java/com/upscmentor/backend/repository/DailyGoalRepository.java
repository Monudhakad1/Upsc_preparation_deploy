package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.DailyGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyGoalRepository extends JpaRepository<DailyGoal, UUID> {

    List<DailyGoal> findAllByAspirantIdOrderByGoalDateDescCreatedAtDesc(UUID aspirantId);

    Optional<DailyGoal> findByIdAndAspirantId(UUID id, UUID aspirantId);

    long countByAspirantIdAndGoalDateBetween(UUID aspirantId, LocalDate start, LocalDate end);

    @Query("select count(g) from DailyGoal g where g.aspirant.id = :aspirantId " +
           "and g.goalDate between :start and :end and g.status = 'COMPLETED'")
    long countCompletedInRange(UUID aspirantId, LocalDate start, LocalDate end);
}
