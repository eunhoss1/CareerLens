package com.careerlens.backend.service;

import com.careerlens.backend.dto.UserProfileRequestDto;
import com.careerlens.backend.dto.UserProfileSummaryDto;
import com.careerlens.backend.entity.User;
import com.careerlens.backend.entity.UserProfile;
import com.careerlens.backend.repository.UserProfileRepository;
import com.careerlens.backend.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public UserProfileService(UserRepository userRepository, UserProfileRepository userProfileRepository) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public UserProfileSummaryDto saveProfile(Long userId, UserProfileRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        Optional<UserProfile> existingProfile = userProfileRepository.findByUserId(userId);
        UserProfile profile = existingProfile.orElseGet(UserProfile::new);
        apply(profile, user, request);
        UserProfile savedProfile = existingProfile.isPresent() ? profile : userProfileRepository.save(profile);
        return toDto(user, savedProfile);
    }

    @Transactional(readOnly = true)
    public UserProfileSummaryDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("User profile not found: " + userId));
        return toDto(user, profile);
    }

    private void apply(UserProfile profile, User user, UserProfileRequestDto request) {
        profile.setUser(user);
        profile.setTargetCountry(request.targetCountry());
        profile.setTargetCity(request.targetCity());
        profile.setTargetJobFamily(request.targetJobFamily());
        profile.setDesiredJobTitle(request.desiredJobTitle());
        profile.setCurrentCountry(request.currentCountry());
        profile.setNationality(request.nationality());
        profile.setExperienceYears(request.experienceYears());
        profile.setRelatedExperienceYears(request.relatedExperienceYears());
        profile.setLanguageLevel(request.languageLevel());
        profile.setEnglishLevel(request.englishLevel());
        profile.setJapaneseLevel(request.japaneseLevel());
        profile.setEducation(request.education());
        profile.setMajor(request.major());
        profile.setGraduationStatus(request.graduationStatus());
        profile.setPreferredWorkType(request.preferredWorkType());
        profile.setExpectedSalaryRange(request.expectedSalaryRange());
        profile.setAvailableStartDate(request.availableStartDate());
        profile.setVisaSponsorshipNeeded(Boolean.TRUE.equals(request.visaSponsorshipNeeded()));
        profile.setTechStack(mutableList(request.techStack()));
        profile.setCertifications(mutableList(request.certifications()));
        profile.setGithubPresent(Boolean.TRUE.equals(request.githubPresent()));
        profile.setPortfolioPresent(Boolean.TRUE.equals(request.portfolioPresent()));
        profile.setGithubUrl(request.githubUrl());
        profile.setPortfolioUrl(request.portfolioUrl());
        profile.setPrioritizeSalary(Boolean.TRUE.equals(request.prioritizeSalary()));
        profile.setPrioritizeAcceptanceProbability(Boolean.TRUE.equals(request.prioritizeAcceptanceProbability()));
        profile.setPrioritizeWorkLifeBalance(Boolean.TRUE.equals(request.prioritizeWorkLifeBalance()));
        profile.setPrioritizeCompanyValue(Boolean.TRUE.equals(request.prioritizeCompanyValue()));
        profile.setPrioritizeJobFit(Boolean.TRUE.equals(request.prioritizeJobFit()));
        profile.setProjectExperienceSummary(request.projectExperienceSummary());
        profile.setDomainExperience(request.domainExperience());
        profile.setCloudExperience(request.cloudExperience());
        profile.setDatabaseExperience(request.databaseExperience());
        profile.setDeploymentExperience(request.deploymentExperience());
        profile.setLanguageTestScores(request.languageTestScores());
        profile.setPreferences(mutableList(request.preferences()));
    }

    public UserProfileSummaryDto toDto(User user, UserProfile profile) {
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
                mutableList(profile.getTechStack()),
                mutableList(profile.getCertifications()),
                profile.getGithubPresent(),
                profile.getPortfolioPresent(),
                profile.getGithubUrl(),
                profile.getPortfolioUrl(),
                profile.getPrioritizeSalary(),
                profile.getPrioritizeAcceptanceProbability(),
                profile.getPrioritizeWorkLifeBalance(),
                profile.getPrioritizeCompanyValue(),
                profile.getPrioritizeJobFit(),
                profile.getProjectExperienceSummary(),
                profile.getDomainExperience(),
                profile.getCloudExperience(),
                profile.getDatabaseExperience(),
                profile.getDeploymentExperience(),
                profile.getLanguageTestScores(),
                mutableList(profile.getPreferences())
        );
    }

    private List<String> mutableList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
