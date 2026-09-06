package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.Paper;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaperRepository extends JpaRepository<Paper, UUID> {
    List<Paper> findAllByOrderByDisplayOrder();
}
