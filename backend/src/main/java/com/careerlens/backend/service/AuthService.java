package com.careerlens.backend.service;

import com.careerlens.backend.dto.AuthResponseDto;
import com.careerlens.backend.dto.DuplicateCheckResponseDto;
import com.careerlens.backend.dto.FindLoginIdRequestDto;
import com.careerlens.backend.dto.FindLoginIdResponseDto;
import com.careerlens.backend.dto.LoginRequestDto;
import com.careerlens.backend.dto.PasswordResetGuideRequestDto;
import com.careerlens.backend.dto.PasswordResetGuideResponseDto;
import com.careerlens.backend.dto.PasswordResetRequestDto;
import com.careerlens.backend.dto.PasswordResetResponseDto;
import com.careerlens.backend.dto.SignupRequestDto;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
import com.careerlens.backend.security.JwtClaims;
import com.careerlens.backend.security.JwtTokenService;
import com.careerlens.backend.security.JwtTokenService.TokenIssue;
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

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String SUSPENDED_STATUS = "SUSPENDED";
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final JwtTokenService jwtTokenService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Set<String> adminLoginIds;

    public AuthService(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            JwtTokenService jwtTokenService,
            @Value("${app.auth.admin-login-ids:admin,careerlens-admin}") String adminLoginIds
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.jwtTokenService = jwtTokenService;
        this.adminLoginIds = Arrays.stream(adminLoginIds.split(","))
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());
    }

    @Transactional
    public AuthResponseDto signup(SignupRequestDto request) {
        String loginId = request.loginId().trim().toLowerCase(Locale.ROOT);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String displayName = request.displayName().trim();

        if (!request.password().equals(request.passwordConfirm())) {
            throw new IllegalArgumentException("비밀번호 확인이 일치하지 않습니다.");
        }
        validatePasswordPolicy(request.password());

        userRepository.findByLoginId(loginId).ifPresent(user -> {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        });
        userRepository.findByEmail(email).ifPresent(user -> {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        });

        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setLoginId(loginId);
        user.setDisplayName(displayName);
        user.setEmail(email);
        user.setCountryDialCode(blankToNull(request.countryDialCode()));
        user.setPhoneNumber(blankToNull(request.phoneNumber()));
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(roleFor(loginId));
        user.setAccountStatus(ACTIVE_STATUS);
        user.setEmailVerified(false);
        user.setFailedLoginAttempts(0);
        user.setMarketingOptIn(Boolean.TRUE.equals(request.marketingOptIn()));
        user.setTermsAcceptedAt(now);
        user.setPrivacyAcceptedAt(now);
        user.setSecurityNoticeAcceptedAt(now);
        user.setPasswordChangedAt(now);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        User savedUser = userRepository.save(user);

        return toResponse(savedUser);
    }

    @Transactional
    public AuthResponseDto login(LoginRequestDto request) {
        String loginIdentifier = request.loginId().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByLoginId(loginIdentifier)
                .or(() -> userRepository.findByEmail(loginIdentifier))
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        ensureLoginAllowed(user);
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            registerFailedLogin(user);
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String role = roleFor(user.getLoginId());
        if (user.getRole() == null || user.getRole().isBlank() || "ADMIN".equals(role)) {
            user.setRole(role);
        }
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public FindLoginIdResponseDto findLoginId(FindLoginIdRequestDto request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String displayName = request.displayName().trim();
        User user = userRepository.findByEmailIgnoreCaseAndDisplayNameIgnoreCase(email, displayName)
                .orElseThrow(() -> new IllegalArgumentException("입력한 이름과 이메일로 가입된 계정을 찾을 수 없습니다."));

        return new FindLoginIdResponseDto(
                maskLoginId(user.getLoginId()),
                "가입된 아이디를 확인했습니다."
        );
    }

    @Transactional(readOnly = true)
    public PasswordResetGuideResponseDto passwordResetGuide(PasswordResetGuideRequestDto request) {
        String identifier = request.loginIdOrEmail().trim().toLowerCase(Locale.ROOT);
        userRepository.findByLoginIdIgnoreCaseOrEmailIgnoreCase(identifier, identifier)
                .orElseThrow(() -> new IllegalArgumentException("입력한 정보와 일치하는 계정을 찾을 수 없습니다."));

        // TODO: 이메일 발송 서비스가 준비되면 재설정 토큰을 생성하고 링크를 발송한다.
        return new PasswordResetGuideResponseDto(
                "보안을 위해 기존 비밀번호는 표시할 수 없습니다. 가입한 이메일을 확인한 뒤 비밀번호 재설정 링크 발송 기능을 연결해주세요."
        );
    }

    @Transactional
    public PasswordResetResponseDto resetPassword(PasswordResetRequestDto request) {
        String identifier = request.loginIdOrEmail().trim().toLowerCase(Locale.ROOT);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String displayName = request.displayName().trim();

        if (!request.newPassword().equals(request.newPasswordConfirm())) {
            throw new IllegalArgumentException("새 비밀번호 확인이 일치하지 않습니다.");
        }
        validatePasswordPolicy(request.newPassword());

        User user = userRepository.findByLoginIdIgnoreCaseOrEmailIgnoreCase(identifier, identifier)
                .filter(foundUser -> email.equalsIgnoreCase(foundUser.getEmail()))
                .filter(foundUser -> displayName.equalsIgnoreCase(foundUser.getDisplayName()))
                .orElseThrow(() -> new IllegalArgumentException("입력한 계정 정보가 일치하지 않습니다."));

        LocalDateTime now = LocalDateTime.now();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setPasswordChangedAt(now);
        user.setUpdatedAt(now);

        return new PasswordResetResponseDto("비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.");
    }

    @Transactional(readOnly = true)
    public DuplicateCheckResponseDto checkLoginId(String loginId) {
        String normalizedLoginId = loginId == null ? "" : loginId.trim().toLowerCase(Locale.ROOT);
        if (!normalizedLoginId.matches("^[a-zA-Z0-9._-]{4,30}$")) {
            return new DuplicateCheckResponseDto(false, "4~30자의 영문, 숫자, 점, 밑줄, 하이픈만 사용할 수 있습니다.");
        }
        boolean available = !userRepository.existsByLoginIdIgnoreCase(normalizedLoginId);
        return new DuplicateCheckResponseDto(
                available,
                available ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다."
        );
    }

    @Transactional(readOnly = true)
    public DuplicateCheckResponseDto checkEmail(String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (!normalizedEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return new DuplicateCheckResponseDto(false, "올바른 이메일 형식으로 입력해주세요.");
        }
        boolean available = !userRepository.existsByEmailIgnoreCase(normalizedEmail);
        return new DuplicateCheckResponseDto(
                available,
                available ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다."
        );
    }

    @Transactional(readOnly = true)
    public AuthResponseDto currentUser(JwtClaims claims) {
        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return toResponse(user);
    }

    private void ensureLoginAllowed(User user) {
        String status = user.getAccountStatus() == null || user.getAccountStatus().isBlank()
                ? ACTIVE_STATUS
                : user.getAccountStatus();
        if (SUSPENDED_STATUS.equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("정지된 계정입니다. 관리자에게 문의해주세요.");
        }

        LocalDateTime lockedUntil = user.getLockedUntil();
        if (lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("로그인 실패가 반복되어 계정이 잠시 잠겼습니다. 잠시 후 다시 시도해주세요.");
        }
        if (lockedUntil != null && lockedUntil.isBefore(LocalDateTime.now())) {
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
        }
    }

    private void registerFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts();
        attempts += 1;
        user.setFailedLoginAttempts(attempts);
        user.setUpdatedAt(LocalDateTime.now());
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_MINUTES));
        }
    }

    private AuthResponseDto toResponse(User user) {
        String role = normalizedRole(user);
        TokenIssue token = jwtTokenService.issue(user, role);
        return new AuthResponseDto(
                user.getId(),
                user.getLoginId(),
                user.getDisplayName(),
                user.getEmail(),
                role,
                "ADMIN".equals(role),
                userProfileRepository.findByUserId(user.getId()).isPresent(),
                user.getAccountStatus() == null ? ACTIVE_STATUS : user.getAccountStatus(),
                Boolean.TRUE.equals(user.getEmailVerified()),
                user.getLastLoginAt(),
                token.accessToken(),
                "Bearer",
                token.expiresAt()
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

    private String maskLoginId(String loginId) {
        if (loginId == null || loginId.isBlank()) {
            return "";
        }
        if (loginId.length() <= 2) {
            return loginId.charAt(0) + "*";
        }
        int visiblePrefix = Math.min(3, loginId.length() - 1);
        int visibleSuffix = loginId.length() > 6 ? 2 : 1;
        int maskLength = Math.max(1, loginId.length() - visiblePrefix - visibleSuffix);
        return loginId.substring(0, visiblePrefix)
                + "*".repeat(maskLength)
                + loginId.substring(loginId.length() - visibleSuffix);
    }

    private void validatePasswordPolicy(String password) {
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("비밀번호는 8자 이상이어야 합니다.");
        }
        if (!password.matches(".*[A-Za-z].*")
                || !password.matches(".*\\d.*")
                || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new IllegalArgumentException("비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
