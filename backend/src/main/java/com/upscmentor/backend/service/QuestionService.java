package com.upscmentor.backend.service;

import com.upscmentor.backend.dto.question.QuestionDto;
import com.upscmentor.backend.dto.question.SubmissionSummaryDto;
import com.upscmentor.backend.dto.question.UpsertQuestionRequest;
import com.upscmentor.backend.entity.Paper;
import com.upscmentor.backend.entity.Question;
import com.upscmentor.backend.entity.Topic;
import com.upscmentor.backend.entity.User;
import com.upscmentor.backend.exception.ApiException;
import com.upscmentor.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final QuestionSubmissionRepository submissionRepository;
    private final PaperRepository paperRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<QuestionDto> list(UUID aspirantId) {
        List<Question> questions = questionRepository.findAllWithRefsByAspirantId(aspirantId);
        Map<UUID, SubmissionSummaryDto> submissionsByQuestion = loadSubmissionSummaries(aspirantId);

        return questions.stream()
                .map(q -> toDto(q, submissionsByQuestion.get(q.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionDto get(UUID aspirantId, UUID id) {
        Question question = questionRepository.findByIdAndAspirantId(id, aspirantId)
                .orElseThrow(() -> ApiException.notFound("Question"));
        SubmissionSummaryDto submission = loadSubmissionSummaries(aspirantId).get(id);
        return toDto(question, submission);
    }

    @Transactional
    public QuestionDto create(UUID mentorId, UUID aspirantId, UpsertQuestionRequest request) {
        User mentor = userRepository.findById(mentorId).orElseThrow(() -> ApiException.notFound("Mentor"));
        User aspirant = userRepository.findById(aspirantId).orElseThrow(() -> ApiException.notFound("Aspirant"));

        Question question = new Question();
        question.setMentor(mentor);
        question.setAspirant(aspirant);
        applyRequest(question, request);

        return toDto(questionRepository.save(question), null);
    }

    @Transactional
    public QuestionDto update(UUID aspirantId, UUID id, UpsertQuestionRequest request) {
        Question question = questionRepository.findByIdAndAspirantId(id, aspirantId)
                .orElseThrow(() -> ApiException.notFound("Question"));
        applyRequest(question, request);
        SubmissionSummaryDto submission = loadSubmissionSummaries(aspirantId).get(id);
        return toDto(questionRepository.save(question), submission);
    }

    @Transactional
    public void delete(UUID aspirantId, UUID id) {
        Question question = questionRepository.findByIdAndAspirantId(id, aspirantId)
                .orElseThrow(() -> ApiException.notFound("Question"));
        questionRepository.delete(question);
    }

    private void applyRequest(Question question, UpsertQuestionRequest request) {
        Topic topic = null;
        if (request.topicId() != null) {
            topic = topicRepository.findById(request.topicId())
                    .orElseThrow(() -> ApiException.notFound("Topic"));
        }
        Paper paper = null;
        if (request.paperId() != null) {
            paper = paperRepository.findById(request.paperId())
                    .orElseThrow(() -> ApiException.notFound("Paper"));
        }

        question.setTopic(topic);
        question.setPaper(paper);
        question.setQuestion(request.question());
        question.setType(parseEnum(Question.Type.class, request.type(), "type"));
        question.setMarks(request.marks());
        question.setDifficulty(request.difficulty() == null ? null
                : parseEnum(Question.Difficulty.class, request.difficulty(), "difficulty"));
        question.setTimeLimitMinutes(request.timeLimitMinutes());
        question.setDeadline(request.deadline());
        question.setInstructions(request.instructions());
        question.setPriority(request.priority() == null ? Question.Priority.MEDIUM
                : parseEnum(Question.Priority.class, request.priority(), "priority"));
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String raw, String fieldName) {
        try {
            return Enum.valueOf(type, raw);
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid " + fieldName + ": '" + raw + "'.");
        }
    }

    private Map<UUID, SubmissionSummaryDto> loadSubmissionSummaries(UUID aspirantId) {
        Map<UUID, SubmissionSummaryDto> result = new HashMap<>();
        for (Object[] row : submissionRepository.findSummariesByAspirantId(aspirantId)) {
            UUID questionId = (UUID) row[0];
            result.put(questionId, new SubmissionSummaryDto(
                    (UUID) row[1],
                    (String) row[2],
                    row[3] != null, // fileName present => has an attachment
                    (String) row[3],
                    (String) row[4],
                    (String) row[5],
                    (Boolean) row[6],
                    (Instant) row[7]
            ));
        }
        return result;
    }

    private QuestionDto toDto(Question q, SubmissionSummaryDto submission) {
        return new QuestionDto(
                q.getId(),
                q.getTopic() != null ? q.getTopic().getId() : null,
                q.getTopic() != null ? q.getTopic().getName() : null,
                q.getPaper() != null ? q.getPaper().getId() : null,
                q.getPaper() != null ? q.getPaper().getCode() : null,
                q.getQuestion(),
                q.getType().name(),
                q.getMarks(),
                q.getDifficulty() != null ? q.getDifficulty().name() : null,
                q.getTimeLimitMinutes(),
                q.getDeadline(),
                q.getInstructions(),
                q.getPriority().name(),
                submission,
                q.getCreatedAt()
        );
    }
}
