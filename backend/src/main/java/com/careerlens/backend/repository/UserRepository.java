package com.careerlens.backend.repository;

import com.careerlens.backend.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByLoginId(String loginId);

    Optional<User> findByEmailIgnoreCaseAndDisplayNameIgnoreCase(String email, String displayName);

    Optional<User> findByLoginIdIgnoreCaseOrEmailIgnoreCase(String loginId, String email);

    boolean existsByLoginIdIgnoreCase(String loginId);

    boolean existsByEmailIgnoreCase(String email);
}
