package com.upscmentor.backend.service;

import com.upscmentor.backend.dto.syllabus.AreaDto;
import com.upscmentor.backend.dto.syllabus.PaperDto;
import com.upscmentor.backend.dto.syllabus.SubtopicDto;
import com.upscmentor.backend.dto.syllabus.TopicDto;
import com.upscmentor.backend.entity.Area;
import com.upscmentor.backend.entity.Paper;
import com.upscmentor.backend.entity.Subtopic;
import com.upscmentor.backend.entity.Topic;
import com.upscmentor.backend.repository.AreaRepository;
import com.upscmentor.backend.repository.PaperRepository;
import com.upscmentor.backend.repository.SubtopicRepository;
import com.upscmentor.backend.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SyllabusService {

    private final PaperRepository paperRepository;
    private final AreaRepository areaRepository;
    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;

    /**
     * Builds the whole syllabus tree in exactly 4 queries (one per level) and
     * groups everything in memory, rather than walking each Area's lazy
     * Topic list one at a time (which would be 1 + N + M queries against a
     * tree with ~470 topics). Fine to load in full: this is a private app
     * with one syllabus, not a paginated multi-tenant catalog.
     */
    @Transactional(readOnly = true)
    public List<PaperDto> getFullTree() {
        List<Paper> papers = paperRepository.findAllByOrderByDisplayOrder();
        List<Area> areas = areaRepository.findAllByOrderByDisplayOrder();
        List<Topic> topics = topicRepository.findAllOrdered();
        List<Subtopic> subtopics = subtopicRepository.findAllByOrderByDisplayOrder();

        Map<UUID, List<Subtopic>> subtopicsByTopic = subtopics.stream()
                .collect(Collectors.groupingBy(s -> s.getTopic().getId()));

        Map<UUID, List<Topic>> topicsByArea = topics.stream()
                .collect(Collectors.groupingBy(t -> t.getArea().getId()));

        Map<UUID, List<Area>> areasByPaper = areas.stream()
                .collect(Collectors.groupingBy(a -> a.getPaper().getId()));

        return papers.stream()
                .map(paper -> toPaperDto(paper, areasByPaper, topicsByArea, subtopicsByTopic))
                .toList();
    }

    private PaperDto toPaperDto(
            Paper paper,
            Map<UUID, List<Area>> areasByPaper,
            Map<UUID, List<Topic>> topicsByArea,
            Map<UUID, List<Subtopic>> subtopicsByTopic) {

        List<AreaDto> areaDtos = areasByPaper.getOrDefault(paper.getId(), List.of()).stream()
                .map(area -> toAreaDto(area, topicsByArea, subtopicsByTopic))
                .toList();

        return new PaperDto(
                paper.getId(),
                paper.getCode(),
                paper.getName(),
                paper.getExamStage().name(),
                paper.getDisplayOrder(),
                areaDtos
        );
    }

    private AreaDto toAreaDto(
            Area area,
            Map<UUID, List<Topic>> topicsByArea,
            Map<UUID, List<Subtopic>> subtopicsByTopic) {

        List<TopicDto> topicDtos = topicsByArea.getOrDefault(area.getId(), List.of()).stream()
                .map(topic -> toTopicDto(topic, subtopicsByTopic))
                .toList();

        return new AreaDto(area.getId(), area.getName(), area.getDisplayOrder(), topicDtos);
    }

    private TopicDto toTopicDto(Topic topic, Map<UUID, List<Subtopic>> subtopicsByTopic) {
        List<SubtopicDto> subtopicDtos = subtopicsByTopic.getOrDefault(topic.getId(), List.of()).stream()
                .map(s -> new SubtopicDto(s.getId(), s.getName(), s.getDisplayOrder()))
                .toList();

        return new TopicDto(topic.getId(), topic.getName(), topic.getDisplayOrder(), subtopicDtos);
    }
}
