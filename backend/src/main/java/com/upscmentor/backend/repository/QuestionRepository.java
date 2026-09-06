package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

    @Query("select q from Question q " +
           "left join fetch q.topic left join fetch q.paper " +
           "where q.aspirant.id = :aspirantId " +
           "order by q.deadline asc nulls last, q.createdAt desc")
    List<Question> findAllWithRefsByAspirantId(UUID aspirantId);

    @Query("select q from Question q " +
           "left join fetch q.topic left join fetch q.paper " +
           "where q.id = :id and q.aspirant.id = :aspirantId")
    Optional<Question> findByIdAndAspirantId(UUID id, UUID aspirantId);
}
