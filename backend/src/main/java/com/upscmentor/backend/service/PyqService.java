package com.upscmentor.backend.service;

import com.upscmentor.backend.dto.pyq.CreatePyqRequest;
import com.upscmentor.backend.dto.pyq.PyqDto;
import com.upscmentor.backend.dto.pyq.TopicRefDto;
import com.upscmentor.backend.dto.pyq.UpdatePyqRequest;
import com.upscmentor.backend.entity.Paper;
import com.upscmentor.backend.entity.Pyq;
import com.upscmentor.backend.entity.Topic;
import com.upscmentor.backend.entity.User;
import com.upscmentor.backend.exception.ApiException;
import com.upscmentor.backend.repository.PaperRepository;
import com.upscmentor.backend.repository.PyqRepository;
import com.upscmentor.backend.repository.TopicRepository;
import com.upscmentor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PyqService {

    private final PyqRepository pyqRepository;
    private final PaperRepository paperRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<PyqDto> list(UUID aspirantId, UUID paperIdFilter, UUID topicIdFilter, String attemptStatusFilter) {
        return pyqRepository.findAllWithPaperByAspirantId(aspirantId).stream()
                .filter(p -> paperIdFilter == null || p.getPaper().getId().equals(paperIdFilter))
                .filter(p -> attemptStatusFilter == null || p.getAttemptStatus().name().equals(attemptStatusFilter))
                .filter(p -> topicIdFilter == null
                        || p.getTopics().stream().anyMatch(t -> t.getId().equals(topicIdFilter)))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PyqDto get(UUID aspirantId, UUID id) {
        return toDto(pyqRepository.findByIdAndAspirantId(id, aspirantId)
                .orElseThrow(() -> ApiException.notFound("PYQ")));
    }

    @Transactional
    public PyqDto create(UUID aspirantId, CreatePyqRequest request) {
        User aspirant = userRepository.findById(aspirantId)
                .orElseThrow(() -> ApiException.notFound("Aspirant"));
        Paper paper = paperRepository.findById(request.paperId())
                .orElseThrow(() -> ApiException.notFound("Paper"));

        Pyq pyq = new Pyq();
        pyq.setAspirant(aspirant);
        pyq.setPaper(paper);
        pyq.setYear(request.year());
        pyq.setQuestion(request.question());
        pyq.setMarks(request.marks());
        pyq.setTopics(resolveTopics(request.topicIds()));

        return toDto(pyqRepository.save(pyq));
    }

    @Transactional
    public PyqDto update(UUID aspirantId, UUID id, UpdatePyqRequest request) {
        Pyq pyq = pyqRepository.findByIdAndAspirantId(id, aspirantId)
                .orElseThrow(() -> ApiException.notFound("PYQ"));

        Paper paper = paperRepository.findById(request.paperId())
                .orElseThrow(() -> ApiException.notFound("Paper"));

        pyq.setPaper(paper);
        pyq.setYear(request.year());
        pyq.setQuestion(request.question());
        pyq.setMarks(request.marks());
        pyq.setTopics(resolveTopics(request.topicIds()));
        pyq.setAttemptStatus(parseAttemptStatus(request.attemptStatus()));
        pyq.setAnswerQuality(request.answerQuality());
        pyq.setAnalysisNotes(request.analysisNotes());
        pyq.setModelAnswerReviewed(request.modelAnswerReviewed());
        pyq.setReattempted(request.reattempted());

        return toDto(pyqRepository.save(pyq));
    }

    @Transactional
    public void delete(UUID aspirantId, UUID id) {
        Pyq pyq = pyqRepository.findByIdAndAspirantId(id, aspirantId)
                .orElseThrow(() -> ApiException.notFound("PYQ"));
        pyqRepository.delete(pyq);
    }

    private Set<Topic> resolveTopics(List<UUID> topicIds) {
        if (topicIds == null || topicIds.isEmpty()) return new HashSet<>();
        List<Topic> found = topicRepository.findAllById(topicIds);
        if (found.size() != new HashSet<>(topicIds).size()) {
            throw ApiException.badRequest("One or more topic IDs don't exist.");
        }
        return new HashSet<>(found);
    }

    private Pyq.AttemptStatus parseAttemptStatus(String raw) {
        try {
            return Pyq.AttemptStatus.valueOf(raw);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw ApiException.badRequest(
                    "attemptStatus must be one of NOT_ATTEMPTED, ATTEMPTED, SKIPPED - got '" + raw + "'.");
        }
    }

    private PyqDto toDto(Pyq p) {
        List<TopicRefDto> topicDtos = p.getTopics().stream()
                .map(t -> new TopicRefDto(t.getId(), t.getName()))
                .sorted((a, b) -> a.name().compareToIgnoreCase(b.name()))
                .toList();

        return new PyqDto(
                p.getId(), p.getPaper().getId(), p.getPaper().getCode(), p.getPaper().getName(),
                p.getYear(), p.getQuestion(), p.getMarks(), p.getAttemptStatus().name(),
                p.getAnswerQuality(), p.getAnalysisNotes(), p.isModelAnswerReviewed(), p.isReattempted(),
                topicDtos, p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
