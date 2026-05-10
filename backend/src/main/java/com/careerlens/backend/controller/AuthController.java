package com.careerlens.backend.controller;

import com.careerlens.backend.dto.AuthResponseDto;
import com.careerlens.backend.dto.LoginRequestDto;
import com.careerlens.backend.dto.SignupRequestDto;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public AuthResponseDto signup(@Valid @RequestBody SignupRequestDto request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponseDto login(@Valid @RequestBody LoginRequestDto request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthResponseDto me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtClaims claims)) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        return authService.currentUser(claims);
    }
}
