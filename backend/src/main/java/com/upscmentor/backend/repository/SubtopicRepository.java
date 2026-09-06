package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.Subtopic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SubtopicRepository extends JpaRepository<Subtopic, UUID> {
    List<Subtopic> findAllByOrderByDisplayOrder();
}
