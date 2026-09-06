package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.Pyq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PyqRepository extends JpaRepository<Pyq, UUID> {

    @Query("select p from Pyq p join fetch p.paper where p.aspirant.id = :aspirantId order by p.year desc, p.createdAt desc")
    List<Pyq> findAllWithPaperByAspirantId(UUID aspirantId);

    @Query("select p from Pyq p join fetch p.paper where p.id = :id and p.aspirant.id = :aspirantId")
    Optional<Pyq> findByIdAndAspirantId(UUID id, UUID aspirantId);

    /** paperId, code, name, displayOrder, totalPyqs, attemptedPyqs - powers "PYQ coverage by subject" (spec section 16). */
    @Query("select pa.id, pa.code, pa.name, pa.displayOrder, count(p), " +
           "sum(case when p.attemptStatus = 'ATTEMPTED' then 1 else 0 end) " +
           "from Pyq p join p.paper pa where p.aspirant.id = :aspirantId " +
           "group by pa.id, pa.code, pa.name, pa.displayOrder order by pa.displayOrder")
    List<Object[]> countCoveragePerPaper(UUID aspirantId);
}
