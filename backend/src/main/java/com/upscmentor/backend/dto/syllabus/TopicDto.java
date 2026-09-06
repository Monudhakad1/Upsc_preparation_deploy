package com.upscmentor.backend.dto.syllabus;

import java.util.List;
import java.util.UUID;

public record TopicDto(UUID id, String name, int displayOrder, List<SubtopicDto> subtopics) {}
