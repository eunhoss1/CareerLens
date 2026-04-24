package com.careerlens.backend.service;

import com.careerlens.backend.dto.JobRecommendationDto;
import com.careerlens.backend.dto.RecommendationDiagnoseRequestDto;
import com.careerlens.backend.dto.RecommendationDiagnosisResponseDto;
import com.careerlens.backend.dto.ScoreBreakdownDto;
import com.careerlens.backend.dto.UserProfileRequestDto;
import com.careerlens.backend.dto.UserProfileSummaryDto;
import com.careerlens.backend.entity.DiagnosisResult;
import com.careerlens.backend.entity.DiagnosisResult.ReadinessStatus;
import com.careerlens.backend.entity.JobPosting;
import com.careerlens.backend.entity.PatternProfile;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.UserProfile;
import com.careerlens.backend.repository.DiagnosisResultRepository;
import com.careerlens.backend.repository.JobPostingRepository;
import com.careerlens.backend.repository.PatternProfileRepository;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationServiceV2 {

    private static final Map<String, Integer> LANGUAGE_RANK = Map.of(
            "BASIC", 1,
            "CONVERSATIONAL", 2,
            "BUSINESS", 3,
            "FLUENT", 4,
            "NATIVE", 5
    );

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final JobPostingRepository jobPostingRepository;
    private final PatternProfileRepository patternProfileRepository;
    private final DiagnosisResultRepository diagnosisResultRepository;
    private final AiExplanationService aiExplanationService;

    public RecommendationServiceV2(
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            JobPostingRepository jobPostingRepository,
            PatternProfileRepository patternProfileRepository,
            DiagnosisResultRepository diagnosisResultRepository,
            AiExplanationService aiExplanationService
    ) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.patternProfileRepository = patternProfileRepository;
        this.diagnosisResultRepository = diagnosisResultRepository;
        this.aiExplanationService = aiExplanationService;
    }

    @Transactional
    public RecommendationDiagnosisResponseDto diagnose(RecommendationDiagnoseRequestDto request) {
        UserProfileRequestDto profileRequest = request.userProfile();
        User user = upsertUser(profileRequest);
        UserProfile profile = upsertProfile(user, profileRequest);

        List<JobPosting> candidates = jobPostingRepository.findByCountryIgnoreCaseAndJobFamilyIgnoreCase(
                profile.getTargetCountry(),
                profile.getTargetJobFamily()
        ).stream()
                .filter(job -> passesHardFilter(profile, job))
                .collect(Collectors.toCollection(ArrayList::new));

        diagnosisResultRepository.deleteByUserId(user.getId());

        List<DiagnosisResult> savedResults = candidates.stream()
                .map(job -> diagnoseJob(user, profile, job))
                .filter(result -> result != null)
                .sorted(Comparator.comparing(DiagnosisResult::getTotalScore).reversed())
                .limit(5)
                .map(diagnosisResultRepository::save)
                .collect(Collectors.toCollection(ArrayList::new));

        return buildResponse(user, profile, candidates.size(), savedResults, LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public RecommendationDiagnosisResponseDto getLatestRecommendations(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found: " + userId));
        List<DiagnosisResult> results = diagnosisResultRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId).stream()
                .sorted(Comparator.comparing(DiagnosisResult::getTotalScore).reversed())
                .collect(Collectors.toCollection(ArrayList::new));
        return buildResponse(user, profile, results.size(), results, LocalDateTime.now());
    }

    private User upsertUser(UserProfileRequestDto request) {
        if (request.userId() != null) {
            return userRepository.findById(request.userId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.userId()));
        }

        String email = valueOrDefault(request.email(), "demo@careerlens.local");
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        user.setEmail(email);
        user.setDisplayName(valueOrDefault(request.displayName(), "CareerLens Demo User"));
        return userRepository.save(user);
    }

    private UserProfile upsertProfile(User user, UserProfileRequestDto request) {
        Optional<UserProfile> existingProfile = userProfileRepository.findByUserId(user.getId());
        UserProfile profile = existingProfile.orElseGet(UserProfile::new);
        profile.setUser(user);
        profile.setTargetCountry(request.targetCountry());
        profile.setTargetCity(request.targetCity());
        profile.setTargetJobFamily(request.targetJobFamily());
        profile.setDesiredJobTitle(request.desiredJobTitle());
        profile.setCurrentCountry(request.currentCountry());
        profile.setNationality(request.nationality());
        profile.setExperienceYears(request.experienceYears());
        profile.setRelatedExperienceYears(request.relatedExperienceYears());
        profile.setLanguageLevel(valueOrDefault(request.languageLevel(), request.englishLevel()));
        profile.setEnglishLevel(request.englishLevel());
        profile.setJapaneseLevel(request.japaneseLevel());
        profile.setEducation(valueOrDefault(request.education(), "Bachelor"));
        profile.setMajor(request.major());
        profile.setGraduationStatus(request.graduationStatus());
        profile.setPreferredWorkType(request.preferredWorkType());
        profile.setExpectedSalaryRange(request.expectedSalaryRange());
        profile.setAvailableStartDate(request.availableStartDate());
        profile.setVisaSponsorshipNeeded(Boolean.TRUE.equals(request.visaSponsorshipNeeded()));
        profile.setTechStack(normalizeList(request.techStack()));
        profile.setCertifications(normalizeList(request.certifications()));
        profile.setGithubPresent(Boolean.TRUE.equals(request.githubPresent()));
        profile.setPortfolioPresent(Boolean.TRUE.equals(request.portfolioPresent()));
        profile.setGithubUrl(request.githubUrl());
        profile.setPortfolioUrl(request.portfolioUrl());
        profile.setProjectExperienceSummary(request.projectExperienceSummary());
        profile.setDomainExperience(request.domainExperience());
        profile.setCloudExperience(request.cloudExperience());
        profile.setDatabaseExperience(request.databaseExperience());
        profile.setDeploymentExperience(request.deploymentExperience());
        profile.setLanguageTestScores(request.languageTestScores());
        profile.setPreferences(normalizeList(request.preferences()));
        return existingProfile.isPresent() ? profile : userProfileRepository.save(profile);
    }

    @Transactional
    public RecommendationDiagnosisResponseDto diagnoseStoredProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found: " + userId));
        return diagnoseProfile(user, profile);
    }

    private RecommendationDiagnosisResponseDto diagnoseProfile(User user, UserProfile profile) {
        List<JobPosting> candidates = jobPostingRepository.findByCountryIgnoreCaseAndJobFamilyIgnoreCase(
                profile.getTargetCountry(),
                profile.getTargetJobFamily()
        ).stream()
                .filter(job -> passesHardFilter(profile, job))
                .collect(Collectors.toCollection(ArrayList::new));

        diagnosisResultRepository.deleteByUserId(user.getId());

        List<DiagnosisResult> savedResults = candidates.stream()
                .map(job -> diagnoseJob(user, profile, job))
                .filter(result -> result != null)
                .sorted(Comparator.comparing(DiagnosisResult::getTotalScore).reversed())
                .limit(5)
                .map(diagnosisResultRepository::save)
                .collect(Collectors.toCollection(ArrayList::new));

        return buildResponse(user, profile, candidates.size(), savedResults, LocalDateTime.now());
    }

    private boolean passesHardFilter(UserProfile profile, JobPosting job) {
        if (!same(profile.getTargetCountry(), job.getCountry()) || !same(profile.getTargetJobFamily(), job.getJobFamily())) {
            return false;
        }
        int userLanguage = languageRank(profile.getLanguageLevel());
        int requiredLanguage = job.getRequiredLanguages().stream()
                .mapToInt(this::languageRankFromRequirement)
                .max()
                .orElse(1);
        if (requiredLanguage - userLanguage > 1) {
            return false;
        }
        Integer userExperience = profile.getExperienceYears() == null ? 0 : profile.getExperienceYears();
        Integer minExperience = job.getMinExperienceYears() == null ? 0 : job.getMinExperienceYears();
        return minExperience - userExperience <= 2;
    }

    private DiagnosisResult diagnoseJob(User user, UserProfile profile, JobPosting job) {
        List<PatternProfile> patterns = patternProfileRepository.findByJobPostingId(job.getId());
        if (patterns.isEmpty()) {
            return null;
        }

        PatternScore bestScore = patterns.stream()
                .map(pattern -> scorePattern(profile, job, pattern))
                .max(Comparator.comparing(PatternScore::totalScore))
                .orElse(null);
        if (bestScore == null) {
            return null;
        }

        ReadinessStatus readinessStatus = readinessStatus(bestScore.totalScore());
        DiagnosisResult result = new DiagnosisResult();
        result.setUser(user);
        result.setJobPosting(job);
        result.setTotalScore(bestScore.totalScore());
        result.setSkillScore(bestScore.skillScore());
        result.setExperienceScore(bestScore.experienceScore());
        result.setLanguageScore(bestScore.languageScore());
        result.setEducationScore(bestScore.educationScore());
        result.setPortfolioScore(bestScore.portfolioScore());
        result.setRecommendationGrade(grade(bestScore.totalScore()));
        result.setReadinessStatus(readinessStatus);
        result.setMissingItems(bestScore.missingItems());
        result.setRecommendationSummary(aiExplanationService.buildRecommendationSummary(
                job,
                bestScore.totalScore(),
                bestScore.matchedSkills(),
                bestScore.missingItems()
        ));
        result.setNextActionSummary(aiExplanationService.buildNextActionSummary(readinessStatus, bestScore.missingItems()));
        result.setCreatedAt(LocalDateTime.now());
        return result;
    }

    private PatternScore scorePattern(UserProfile profile, JobPosting job, PatternProfile pattern) {
        Set<String> userSkills = normalizedSet(profile.getTechStack());
        List<String> coreSkills = normalizeList(pattern.getCoreSkills());
        List<String> preferredSkills = normalizeList(pattern.getPreferredSkills());

        List<String> matchedCore = coreSkills.stream()
                .filter(skill -> containsIgnoreCase(userSkills, skill))
                .collect(Collectors.toCollection(ArrayList::new));
        List<String> matchedPreferred = preferredSkills.stream()
                .filter(skill -> containsIgnoreCase(userSkills, skill))
                .collect(Collectors.toCollection(ArrayList::new));
        List<String> missingItems = new ArrayList<>();

        coreSkills.stream()
                .filter(skill -> !containsIgnoreCase(userSkills, skill))
                .limit(4)
                .forEach(skill -> missingItems.add("핵심 기술 보완: " + skill));

        int coreScore = coreSkills.isEmpty() ? 100 : (matchedCore.size() * 100) / coreSkills.size();
        int preferredScore = preferredSkills.isEmpty() ? 100 : (matchedPreferred.size() * 100) / preferredSkills.size();
        int skillScore = (int) Math.round(coreScore * 0.75 + preferredScore * 0.25);

        int profileExperienceYears = profile.getRelatedExperienceYears() == null
                ? safe(profile.getExperienceYears())
                : profile.getRelatedExperienceYears();
        int experienceGap = Math.max(0, safe(pattern.getTargetExperienceYears()) - profileExperienceYears);
        int experienceScore = clamp(100 - experienceGap * 22);
        if (experienceGap > 0) {
            missingItems.add("경력/프로젝트 밀도 " + experienceGap + "년 수준 보완");
        }

        int languageScore = languageScore(profile.getLanguageLevel(), pattern.getLanguageBenchmark());
        if (languageScore < 75) {
            missingItems.add("언어 수준: " + pattern.getLanguageBenchmark() + " 기준 보완");
        }

        int educationScore = educationScore(profile, pattern);
        if (educationScore < 80) {
            missingItems.add("학력/자격: " + pattern.getEducationBenchmark() + " 또는 관련 자격 보완");
        }

        int portfolioScore = portfolioScore(profile, job, pattern);
        if (portfolioScore < 80) {
            if (Boolean.TRUE.equals(pattern.getGithubExpected()) && !Boolean.TRUE.equals(profile.getGithubPresent())) {
                missingItems.add("GitHub 공개 저장소 보완");
            }
            if ((Boolean.TRUE.equals(pattern.getPortfolioExpected()) || Boolean.TRUE.equals(job.getPortfolioRequired()))
                    && !Boolean.TRUE.equals(profile.getPortfolioPresent())) {
                missingItems.add("포트폴리오/대표 프로젝트 정리");
            }
        }

        int totalScore = (int) Math.round(
                skillScore * 0.35
                        + experienceScore * 0.20
                        + languageScore * 0.15
                        + educationScore * 0.10
                        + portfolioScore * 0.20
        );

        return new PatternScore(
                totalScore,
                skillScore,
                experienceScore,
                languageScore,
                educationScore,
                portfolioScore,
                deduplicate(missingItems),
                deduplicateSkills(matchedCore, matchedPreferred)
        );
    }

    private RecommendationDiagnosisResponseDto buildResponse(
            User user,
            UserProfile profile,
            int candidateCount,
            List<DiagnosisResult> results,
            LocalDateTime diagnosedAt
    ) {
        List<JobRecommendationDto> recommendations = results.stream()
                .map(this::toRecommendationDto)
                .collect(Collectors.toCollection(ArrayList::new));
        ReadinessStatus overall = results.stream()
                .map(DiagnosisResult::getReadinessStatus)
                .min(Comparator.comparingInt(this::readinessOrder))
                .orElse(ReadinessStatus.LONG_TERM_PREPARE);

        return new RecommendationDiagnosisResponseDto(
                user.getId(),
                toProfileDto(user, profile),
                "국가/직무/언어/최소 경력으로 1차 필터링 후, 공고별 seed 패턴과 사용자 프로필을 비교했습니다.",
                candidateCount,
                recommendations.size(),
                overall.name(),
                readinessLabel(overall),
                recommendations,
                diagnosedAt
        );
    }

    private JobRecommendationDto toRecommendationDto(DiagnosisResult result) {
        JobPosting job = result.getJobPosting();
        return new JobRecommendationDto(
                result.getId(),
                job.getId(),
                job.getCompanyName(),
                job.getCountry(),
                job.getJobTitle(),
                job.getJobFamily(),
                job.getSalaryRange(),
                job.getWorkType(),
                job.getVisaRequirement(),
                result.getRecommendationGrade(),
                result.getReadinessStatus().name(),
                readinessLabel(result.getReadinessStatus()),
                result.getRecommendationSummary(),
                result.getNextActionSummary(),
                result.getMissingItems(),
                new ScoreBreakdownDto(
                        result.getTotalScore(),
                        result.getSkillScore(),
                        result.getExperienceScore(),
                        result.getLanguageScore(),
                        result.getEducationScore(),
                        result.getPortfolioScore()
                )
        );
    }

    private UserProfileSummaryDto toProfileDto(User user, UserProfile profile) {
        return new UserProfileSummaryDto(
                user.getId(),
                user.getDisplayName(),
                profile.getTargetCountry(),
                profile.getTargetCity(),
                profile.getTargetJobFamily(),
                profile.getDesiredJobTitle(),
                profile.getCurrentCountry(),
                profile.getNationality(),
                profile.getExperienceYears(),
                profile.getRelatedExperienceYears(),
                profile.getLanguageLevel(),
                profile.getEnglishLevel(),
                profile.getJapaneseLevel(),
                profile.getEducation(),
                profile.getMajor(),
                profile.getGraduationStatus(),
                profile.getPreferredWorkType(),
                profile.getExpectedSalaryRange(),
                profile.getAvailableStartDate(),
                profile.getVisaSponsorshipNeeded(),
                profile.getTechStack(),
                profile.getCertifications(),
                profile.getGithubPresent(),
                profile.getPortfolioPresent(),
                profile.getGithubUrl(),
                profile.getPortfolioUrl(),
                profile.getProjectExperienceSummary(),
                profile.getDomainExperience(),
                profile.getCloudExperience(),
                profile.getDatabaseExperience(),
                profile.getDeploymentExperience(),
                profile.getLanguageTestScores(),
                profile.getPreferences()
        );
    }

    private int languageScore(String userLevel, String benchmark) {
        int gap = Math.max(0, languageRank(benchmark) - languageRank(userLevel));
        return clamp(100 - gap * 25);
    }

    private int educationScore(UserProfile profile, PatternProfile pattern) {
        if (containsAny(profile.getEducation(), "master", "phd", "석사", "박사")) {
            return 100;
        }
        if (containsAny(pattern.getEducationBenchmark(), "master", "석사")) {
            boolean hasCert = profile.getCertifications() != null && !profile.getCertifications().isEmpty();
            return hasCert ? 80 : 62;
        }
        return 90;
    }

    private int portfolioScore(UserProfile profile, JobPosting job, PatternProfile pattern) {
        int checks = 0;
        int passed = 0;
        if (Boolean.TRUE.equals(pattern.getGithubExpected())) {
            checks++;
            if (Boolean.TRUE.equals(profile.getGithubPresent())) {
                passed++;
            }
        }
        if (Boolean.TRUE.equals(pattern.getPortfolioExpected()) || Boolean.TRUE.equals(job.getPortfolioRequired())) {
            checks++;
            if (Boolean.TRUE.equals(profile.getPortfolioPresent())) {
                passed++;
            }
        }
        return checks == 0 ? 100 : (passed * 100) / checks;
    }

    private ReadinessStatus readinessStatus(int totalScore) {
        if (totalScore >= 78) {
            return ReadinessStatus.IMMEDIATE_APPLY;
        }
        if (totalScore >= 58) {
            return ReadinessStatus.PREPARE_THEN_APPLY;
        }
        return ReadinessStatus.LONG_TERM_PREPARE;
    }

    private String grade(int totalScore) {
        if (totalScore >= 85) {
            return "A";
        }
        if (totalScore >= 70) {
            return "B";
        }
        if (totalScore >= 55) {
            return "C";
        }
        return "D";
    }

    private String readinessLabel(ReadinessStatus status) {
        return switch (status) {
            case IMMEDIATE_APPLY -> "즉시 지원 가능";
            case PREPARE_THEN_APPLY -> "준비 후 지원 가능";
            case LONG_TERM_PREPARE -> "장기 준비 필요";
        };
    }

    private int readinessOrder(ReadinessStatus status) {
        return switch (status) {
            case IMMEDIATE_APPLY -> 1;
            case PREPARE_THEN_APPLY -> 2;
            case LONG_TERM_PREPARE -> 3;
        };
    }

    private int languageRankFromRequirement(String requirement) {
        if (requirement == null) {
            return 1;
        }
        String[] tokens = requirement.split(":");
        return languageRank(tokens[tokens.length - 1].trim());
    }

    private int languageRank(String value) {
        if (value == null) {
            return 1;
        }
        return LANGUAGE_RANK.getOrDefault(value.trim().toUpperCase(Locale.ROOT), 1);
    }

    private boolean same(String left, String right) {
        return left != null && right != null && left.equalsIgnoreCase(right);
    }

    private boolean containsAny(String source, String... values) {
        if (source == null) {
            return false;
        }
        String lower = source.toLowerCase(Locale.ROOT);
        for (String value : values) {
            if (lower.contains(value.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private boolean containsIgnoreCase(Set<String> values, String target) {
        return values.contains(normalize(target));
    }

    private Set<String> normalizedSet(List<String> values) {
        Set<String> set = new LinkedHashSet<>();
        normalizeList(values).forEach(value -> set.add(normalize(value)));
        return set;
    }

    private List<String> normalizeList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private List<String> deduplicate(List<String> values) {
        return new ArrayList<>(new LinkedHashSet<>(values));
    }

    private List<String> deduplicateSkills(List<String> first, List<String> second) {
        List<String> combined = new ArrayList<>();
        combined.addAll(first);
        combined.addAll(second);
        return deduplicate(combined);
    }

    private int clamp(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private record PatternScore(
            int totalScore,
            int skillScore,
            int experienceScore,
            int languageScore,
            int educationScore,
            int portfolioScore,
            List<String> missingItems,
            List<String> matchedSkills
    ) {
    }
}
