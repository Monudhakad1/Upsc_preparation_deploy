package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface AreaRepository extends JpaRepository<Area, UUID> {

    List<Area> findAllByOrderByDisplayOrder();

    // Fetch-joins the parent Paper so the tree endpoint doesn't N+1 per area.
    @Query("select a from Area a join fetch a.paper order by a.paper.displayOrder, a.displayOrder")
    List<Area> findAllWithPaperOrdered();
}
