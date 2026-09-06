package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.TopicProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TopicProgressRepository extends JpaRepository<TopicProgress, UUID> {

    Optional<TopicProgress> findByTopicIdAndAspirantId(UUID topicId, UUID aspirantId);

    List<TopicProgress> findAllByAspirantId(UUID aspirantId);

    long countByAspirantIdAndStatus(UUID aspirantId, TopicProgress.Status status);

    /** paperId, completedTopicCount for this aspirant - one query, not one per paper. */
    @Query("select p.id, count(tp) from TopicProgress tp join tp.topic t join t.area a join a.paper p " +
           "where tp.aspirant.id = :aspirantId and tp.status = 'COMPLETED' " +
           "group by p.id")
    List<Object[]> countCompletedTopicsPerPaper(UUID aspirantId);

    /** Fetch-joins topic/area/paper so the priority engine doesn't N+1 across ~hundreds of completed topics. */
    @Query("select tp from TopicProgress tp " +
           "join fetch tp.topic t join fetch t.area a join fetch a.paper p " +
           "where tp.aspirant.id = :aspirantId and tp.status = 'COMPLETED'")
    List<TopicProgress> findCompletedWithHierarchyByAspirantId(UUID aspirantId);
}
