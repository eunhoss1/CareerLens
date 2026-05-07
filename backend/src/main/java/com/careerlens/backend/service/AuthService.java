package com.careerlens.backend.service;

import com.careerlens.backend.dto.AuthResponseDto;
import com.careerlens.backend.dto.LoginRequestDto;
import com.careerlens.backend.dto.SignupRequestDto;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
import java.time.LocalDateTime;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
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
        return toResponse(user);
    }

    private AuthResponseDto toResponse(User user) {
        return new AuthResponseDto(
                user.getId(),
                user.getLoginId(),
                user.getDisplayName(),
                user.getEmail(),
                userProfileRepository.findByUserId(user.getId()).isPresent()
        );
    }
}
