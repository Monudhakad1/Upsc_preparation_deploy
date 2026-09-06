package com.upscmentor.backend.service;

import com.upscmentor.backend.dto.progress.AddRevisionRequest;
import com.upscmentor.backend.dto.progress.TopicProgressDetailDto;
import com.upscmentor.backend.entity.Revision;
import com.upscmentor.backend.entity.TopicProgress;
import com.upscmentor.backend.repository.RevisionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RevisionService {

    private final RevisionRepository revisionRepository;
    private final TopicProgressService topicProgressService;

    /**
     * revisionNumber is assigned as (current count + 1) - always sequential,
     * never reused even if a future phase adds deletion, and with no upper
     * limit (spec section 36: R6, R7, R8... indefinitely).
     */
    @Transactional
    public TopicProgressDetailDto addRevision(UUID topicId, UUID aspirantId, AddRevisionRequest request) {
        TopicProgress progress = topicProgressService.requireCompleted(topicId, aspirantId);

        int nextNumber = revisionRepository.countByTopicProgressId(progress.getId()) + 1;

        Revision revision = new Revision();
        revision.setTopicProgress(progress);
        revision.setRevisionNumber(nextNumber);
        revision.setRevisionDate(request.revisionDate() != null ? request.revisionDate() : LocalDate.now());
        revision.setDurationMinutes(request.durationMinutes());
        revision.setConfidence(request.confidence());
        revision.setNotes(request.notes());
        revision.setMentorNote(request.mentorNote());
        revisionRepository.save(revision);

        // A fresh revision is a natural moment to also refresh the topic's
        // current confidence, if the aspirant provided one on this revision.
        if (request.confidence() != null) {
            progress.setConfidence(request.confidence());
        }

        return topicProgressService.toDetailDto(progress);
    }
}
