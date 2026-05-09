package com.careerlens.backend.service;

import com.careerlens.backend.dto.AuthResponseDto;
import com.careerlens.backend.dto.LoginRequestDto;
import com.careerlens.backend.dto.SignupRequestDto;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Set<String> adminLoginIds;

    public AuthService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            @Value("${app.auth.admin-login-ids:admin,careerlens-admin}") String adminLoginIds
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.adminLoginIds = Arrays.stream(adminLoginIds.split(","))
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());
    }

    @Transactional
    public AuthResponseDto signup(SignupRequestDto request) {
        String loginId = request.loginId().trim().toLowerCase();
        String email = request.email().trim().toLowerCase();
        String displayName = request.displayName().trim();

        if (!request.password().equals(request.passwordConfirm())) {
            throw new IllegalArgumentException("비밀번호 확인이 일치하지 않습니다.");
        }

        userRepository.findByLoginId(loginId).ifPresent(user -> {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다: " + loginId);
        });
        userRepository.findByEmail(email).ifPresent(user -> {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + email);
        });

        User user = new User();
        user.setLoginId(loginId);
        user.setDisplayName(displayName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(roleFor(loginId));
        user.setCreatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        return toResponse(savedUser);
    }

    @Transactional
    public AuthResponseDto login(LoginRequestDto request) {
        String loginIdentifier = request.loginId().trim().toLowerCase();
        User user = userRepository.findByLoginId(loginIdentifier)
                .or(() -> userRepository.findByEmail(loginIdentifier))
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        String role = roleFor(user.getLoginId());
        if (user.getRole() == null || user.getRole().isBlank() || "ADMIN".equals(role)) {
            user.setRole(role);
        }
        return toResponse(user);
    }

    private AuthResponseDto toResponse(User user) {
        return new AuthResponseDto(
                user.getId(),
                user.getLoginId(),
                user.getDisplayName(),
                user.getEmail(),
                normalizedRole(user),
                "ADMIN".equals(normalizedRole(user)),
                userProfileRepository.findByUserId(user.getId()).isPresent()
        );
    }

    private String roleFor(String loginId) {
        String normalizedLoginId = loginId == null ? "" : loginId.trim().toLowerCase(Locale.ROOT);
        return adminLoginIds.contains(normalizedLoginId) ? "ADMIN" : "USER";
    }

    private String normalizedRole(User user) {
        if (user.getRole() == null || user.getRole().isBlank()) {
            return roleFor(user.getLoginId());
        }
        return user.getRole().trim().toUpperCase(Locale.ROOT);
    }
}
