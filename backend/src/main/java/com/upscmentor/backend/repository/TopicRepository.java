package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface TopicRepository extends JpaRepository<Topic, UUID> {

    @Query("select t from Topic t order by t.area.paper.displayOrder, t.area.displayOrder, t.displayOrder")
    List<Topic> findAllOrdered();

    /** paperId, code, name, displayOrder, totalTopicCount - one query for the whole subject breakdown. */
    @Query("select p.id, p.code, p.name, p.displayOrder, count(t) " +
           "from Topic t join t.area a join a.paper p " +
           "group by p.id, p.code, p.name, p.displayOrder " +
           "order by p.displayOrder")
    List<Object[]> countTopicsPerPaper();
}
