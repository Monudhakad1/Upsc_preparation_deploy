package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.Revision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface RevisionRepository extends JpaRepository<Revision, UUID> {

    List<Revision> findAllByTopicProgressIdOrderByRevisionNumber(UUID topicProgressId);

    int countByTopicProgressId(UUID topicProgressId);

    // Used by the bulk /api/syllabus/progress endpoint so the syllabus tree
    // can show revision counts without one query per topic.
    @Query("select r.topicProgress.id, count(r) from Revision r where r.topicProgress.aspirant.id = :aspirantId group by r.topicProgress.id")
    List<Object[]> countAllByAspirantId(UUID aspirantId);

    /** topicProgressId -> most recent revision date, for the dashboard priority engine. */
    @Query("select r.topicProgress.id, max(r.revisionDate) from Revision r where r.topicProgress.aspirant.id = :aspirantId group by r.topicProgress.id")
    List<Object[]> maxRevisionDateByAspirantId(UUID aspirantId);
}
