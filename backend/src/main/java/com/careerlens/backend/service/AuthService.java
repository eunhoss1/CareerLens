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
        userRepository.findByLoginId(request.loginId()).ifPresent(user -> {
            throw new IllegalArgumentException("Login ID already exists: " + request.loginId());
        });
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            throw new IllegalArgumentException("Email already exists: " + request.email());
        });

        User user = new User();
        user.setLoginId(request.loginId());
        user.setDisplayName(request.displayName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setCreatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        return toResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponseDto login(LoginRequestDto request) {
        User user = userRepository.findByLoginId(request.loginId())
                .or(() -> userRepository.findByEmail(request.loginId()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid login ID or password."));
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid login ID or password.");
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
