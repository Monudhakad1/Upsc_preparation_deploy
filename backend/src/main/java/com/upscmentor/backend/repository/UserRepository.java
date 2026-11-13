package com.upscmentor.backend.repository;

import com.upscmentor.backend.entity.Role;
import com.upscmentor.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByIdAndRole(UUID id, Role role);
    List<User> findAllByOrderByCreatedAtDesc();
}
