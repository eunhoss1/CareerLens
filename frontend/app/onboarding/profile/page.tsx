"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  AuthCheckingScreen,
  AuthRequiredScreen,
  useRequiredAuth,
} from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Button,
  Card,
  MetricCard,
  PageShell,
  SelectInput,
  TextInput,
} from "@/components/ui";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { storeUser, type AuthUser } from "@/lib/auth";
import {
  countryLabel,
  languageLevelLabel,
  preferenceLabel,
  startDateLabel,
  workTypeLabel,
} from "@/lib/display-labels";
import {
  domainSuggestionsFor,
  jobFamilies,
  projectSuggestionsFor,
  skillSuggestionsFor,
} from "@/lib/job-families";
import {
  demoProfile,
  fetchUserProfile,
  saveUserProfile,
  type UserProfileRequest,
} from "@/lib/recommendation";

const countries = [
  "United States",
  "Japan",
  "South Korea",
  "United Kingdom",
  "Singapore",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Netherlands",
  "Ireland",
  "Italy",
  "Brazil",
  "India",
  "China",
  "Not specified",
];

const citiesByCountry: Record<string, string[]> = {
  "United States": [
    "San Francisco",
    "Seattle",
    "New York",
    "Austin",
    "Los Angeles",
    "Remote",
    "Not specified",
  ],
  Japan: ["Tokyo", "Osaka", "Fukuoka", "Nagoya", "Remote", "Not specified"],
  "South Korea": ["Seoul", "Pangyo", "Remote", "Not specified"],
  "United Kingdom": ["London", "Manchester", "Remote", "Not specified"],
  Singapore: ["Singapore", "Remote", "Not specified"],
  Canada: ["Toronto", "Vancouver", "Montreal", "Remote", "Not specified"],
  Australia: ["Sydney", "Melbourne", "Remote", "Not specified"],
  Germany: ["Berlin", "Munich", "Hamburg", "Remote", "Not specified"],
  France: ["Paris", "Remote", "Not specified"],
  Netherlands: ["Amsterdam", "Remote", "Not specified"],
  Ireland: ["Dublin", "Remote", "Not specified"],
  Italy: ["Milan", "Rome", "Remote", "Not specified"],
  Brazil: ["Sao Paulo", "Remote", "Not specified"],
  India: ["Bengaluru", "Hyderabad", "Gurugram", "Remote", "Not specified"],
  China: ["Shanghai", "Beijing", "Shenzhen", "Remote", "Not specified"],
  "Not specified": ["Not specified"],
};

const languageLevels = [
  "BASIC",
  "CONVERSATIONAL",
  "BUSINESS",
  "FLUENT",
  "NATIVE",
];
const workTypes = ["Onsite", "Hybrid", "Remote", "Not specified"];
const startDates = [
  "Immediately",
  "Within 1 month",
  "Within 3 months",
  "After 6 months",
];
const certSuggestions = [
  "AWS Cloud Practitioner",
  "AWS SAA",
  "TOEIC",
  "JLPT N2",
  "JLPT N1",
  "정보처리기사",
  "PMP",
];
const preferenceSuggestions = [
  "Visa support",
  "Hybrid",
  "Remote",
  "Relocation support",
  "Global team",
  "High salary",
];

export default function ProfileOnboardingPage() {
  const router = useRouter();
  const auth = useRequiredAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfileRequest>(demoProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (auth.isChecking) {
      return;
    }
    if (!auth.user) {
      return;
    }

    const storedUser = auth.user;
    setUser(storedUser);
    const baseProfile = {
      ...demoProfile,
      user_id: storedUser.user_id,
      display_name: storedUser.display_name,
      email: storedUser.email,
    };
    setProfile(baseProfile);

    fetchUserProfile(storedUser.user_id)
      .then((storedProfile) => {
        if (cancelled) return;
        setProfile({
          ...baseProfile,
          ...storedProfile,
          email: storedUser.email,
          tech_stack: cleanTags(storedProfile.tech_stack),
          certifications: cleanTags(storedProfile.certifications),
          preferences: cleanTags(storedProfile.preferences),
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [auth.isChecking, auth.user]);

  async function submit() {
    if (!user) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await saveUserProfile(user.user_id, {
        ...profile,
        user_id: user.user_id,
        email: user.email,
        tech_stack: cleanTags(profile.tech_stack),
        certifications: cleanTags(profile.certifications),
        preferences: cleanTags(profile.preferences),
        project_experience_summary: normalizeText(
          profile.project_experience_summary
        ),
        domain_experience: normalizeText(profile.domain_experience),
      });
      storeUser({ ...user, profile_completed: true });
      router.push("/jobs/recommendation");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "프로필 저장 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const completion = profileCompletion(profile);
  const priorities = priorityLabels(profile);
  const availableCities = cityOptionsFor(profile.target_country);

  function handleTargetCountryChange(value: string) {
    const nextCities = cityOptionsFor(value);
    setProfile((current) => ({
      ...current,
      target_country: value,
      target_city: nextCities.includes(current.target_city ?? "")
        ? current.target_city
        : nextCities[0],
    }));
  }

  if (auth.isChecking) {
    return (
      <AuthCheckingScreen title="프로필 설정 접근 권한을 확인하는 중입니다." />
    );
  }

  if (!auth.user) {
    return (
      <AuthRequiredScreen title="해외 취업 프로필은 로그인 후 설정할 수 있습니다." />
    );
  }

  return (
    <PageShell>
      <SiteHeader />

      <main className="min-h-screen bg-slate-50/50">
        {/* 상단 타이틀 배너 영역 */}
        <section className="border-b border-slate-200 bg-white">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col gap-5 py-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
                Careerlens Profile
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                내 프로필
              </h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500">
                맞춤 공고 추천과 적합도 진단에 사용할 정보를 관리합니다.
              </p>
            </div>
            <Button
              type="button"
              className="w-fit bg-indigo-600 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm shadow-indigo-600/10 hover:bg-indigo-700 transition-all"
              onClick={submit}
              disabled={isLoading}
            >
              {isLoading ? "저장 중" : "저장하고 추천 보기"}
            </Button>
          </div>
        </section>

        {/* 메인 콘텐츠 양분할 레이아웃 */}
        <section className="max-w-[1200px] mx-auto px-6 grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
          {/* 사이드바 대시보드 영역 */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* 프로필 및 작성 진행률 */}
            <Card className="rounded-2xl p-5 border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                    작성 현황
                  </p>
                  <h2 className="mt-2 text-base font-bold text-slate-900 tracking-tight">
                    {profile.display_name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {profile.email}
                  </p>
                </div>
                <span className="text-lg font-black text-slate-900">
                  {completion}%
                </span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <MetricCard
                  label="경력"
                  value={`${profile.experience_years ?? 0}년`}
                  className="rounded-xl border-slate-100"
                />
                <MetricCard
                  label="직무"
                  value={profile.target_job_family}
                  className="rounded-xl border-slate-100"
                />
              </div>
            </Card>

            {/* 추천 필터 가중치 설정 */}
            <Card className="rounded-2xl p-5 border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <p className="text-xs font-bold text-slate-900 tracking-tight mb-3">
                추천 기준 설정
              </p>
              <div className="space-y-1.5">
                <PriorityToggle
                  label="연봉"
                  checked={Boolean(profile.prioritize_salary)}
                  onChange={(value) =>
                    setProfile({ ...profile, prioritize_salary: value })
                  }
                />
                <PriorityToggle
                  label="합격 가능성"
                  checked={Boolean(profile.prioritize_acceptance_probability)}
                  onChange={(value) =>
                    setProfile({
                      ...profile,
                      prioritize_acceptance_probability: value,
                    })
                  }
                />
                <PriorityToggle
                  label="워라밸"
                  checked={Boolean(profile.prioritize_work_life_balance)}
                  onChange={(value) =>
                    setProfile({
                      ...profile,
                      prioritize_work_life_balance: value,
                    })
                  }
                />
                <PriorityToggle
                  label="기업 가치"
                  checked={Boolean(profile.prioritize_company_value)}
                  onChange={(value) =>
                    setProfile({ ...profile, prioritize_company_value: value })
                  }
                />
                <PriorityToggle
                  label="직무 적합도"
                  checked={Boolean(profile.prioritize_job_fit)}
                  onChange={(value) =>
                    setProfile({ ...profile, prioritize_job_fit: value })
                  }
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {priorities.map((priority) => (
                  <Badge
                    key={priority}
                    tone="brand"
                    className="rounded-md text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium px-2 py-0.5"
                  >
                    {priority}
                  </Badge>
                ))}
                {priorities.length === 0 && (
                  <Badge
                    tone="muted"
                    className="rounded-md text-[10px] bg-slate-50 border border-slate-200 text-slate-400 px-2 py-0.5"
                  >
                    우선순위 미선택
                  </Badge>
                )}
              </div>
            </Card>
          </aside>

          {/* 실 입력 폼 필드 영역 */}
          <div className="space-y-6">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs font-semibold text-red-600 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {errorMessage}
              </div>
            )}

            <Section
              step="01"
              title="기본 정보"
              description="희망 국가와 직무 기준을 입력합니다."
            >
              <ProfileTextInput
                label="이름"
                value={profile.display_name}
                onChange={(event) =>
                  setProfile({ ...profile, display_name: event.target.value })
                }
              />
              <ProfileTextInput
                label="이메일"
                value={profile.email}
                onChange={(event) =>
                  setProfile({ ...profile, email: event.target.value })
                }
              />
              <SelectField
                label="희망 국가"
                value={profile.target_country}
                options={countries}
                optionLabel={countryLabel}
                onChange={handleTargetCountryChange}
              />
              <SelectField
                label="희망 도시"
                value={profile.target_city ?? ""}
                options={availableCities}
                onChange={(value) =>
                  setProfile({ ...profile, target_city: value })
                }
              />
              <SelectField
                label="희망 직무군"
                value={profile.target_job_family}
                options={jobFamilies}
                onChange={(value) =>
                  setProfile({ ...profile, target_job_family: value })
                }
              />
              <ProfileTextInput
                label="희망 직무명"
                value={profile.desired_job_title ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    desired_job_title: event.target.value,
                  })
                }
              />
              <SelectField
                label="선호 근무형태"
                value={profile.preferred_work_type ?? "Hybrid"}
                options={workTypes}
                optionLabel={workTypeLabel}
                onChange={(value) =>
                  setProfile({ ...profile, preferred_work_type: value })
                }
              />
              <SelectField
                label="입사 가능 시점"
                value={profile.available_start_date ?? "Within 3 months"}
                options={startDates}
                optionLabel={startDateLabel}
                onChange={(value) =>
                  setProfile({ ...profile, available_start_date: value })
                }
              />
            </Section>

            <Section
              step="02"
              title="경력과 역량"
              description="경력, 프로젝트, 기술 정보를 추천 기준에 반영합니다."
            >
              <NumberField
                label="총 경력 연차"
                value={profile.experience_years ?? 0}
                onChange={(value) =>
                  setProfile({ ...profile, experience_years: value })
                }
              />
              <NumberField
                label="직무 관련 경력 연차"
                value={profile.related_experience_years ?? 0}
                onChange={(value) =>
                  setProfile({ ...profile, related_experience_years: value })
                }
              />
              <TextTagInput
                label="대표 프로젝트 경험"
                value={profile.project_experience_summary ?? ""}
                suggestions={projectSuggestionsFor(profile.target_job_family)}
                onChange={(value) =>
                  setProfile({ ...profile, project_experience_summary: value })
                }
              />
              <TextTagInput
                label="산업/도메인 경험"
                value={profile.domain_experience ?? ""}
                suggestions={domainSuggestionsFor(profile.target_job_family)}
                onChange={(value) =>
                  setProfile({ ...profile, domain_experience: value })
                }
              />
              <TagInput
                label="기술 스택"
                tags={profile.tech_stack}
                suggestions={skillSuggestionsFor(profile.target_job_family)}
                onChange={(tags) =>
                  setProfile({ ...profile, tech_stack: tags })
                }
              />
              <TagInput
                label="자격증/시험"
                tags={profile.certifications}
                suggestions={certSuggestions}
                onChange={(tags) =>
                  setProfile({ ...profile, certifications: tags })
                }
              />
            </Section>

            <Section
              step="03"
              title="언어와 학력"
              description="언어 수준과 학력 정보는 국가별 공고 조건 비교에 사용됩니다."
            >
              <SelectField
                label="대표 언어 수준"
                value={profile.language_level}
                options={languageLevels}
                optionLabel={languageLevelLabel}
                onChange={(value) =>
                  setProfile({ ...profile, language_level: value })
                }
              />
              <SelectField
                label="영어 수준"
                value={profile.english_level ?? "BUSINESS"}
                options={languageLevels}
                optionLabel={languageLevelLabel}
                onChange={(value) =>
                  setProfile({ ...profile, english_level: value })
                }
              />
              <SelectField
                label="일본어 수준"
                value={profile.japanese_level ?? "BASIC"}
                options={languageLevels}
                optionLabel={languageLevelLabel}
                onChange={(value) =>
                  setProfile({ ...profile, japanese_level: value })
                }
              />
              <ProfileTextInput
                label="어학 점수"
                value={profile.language_test_scores ?? ""}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    language_test_scores: event.target.value,
                  })
                }
                placeholder="예: TOEIC 860, JLPT N2"
              />
              <ProfileTextInput
                label="최종 학력"
                value={profile.education}
                onChange={(event) =>
                  setProfile({ ...profile, education: event.target.value })
                }
              />
              <ProfileTextInput
                label="전공"
                value={profile.major ?? ""}
                onChange={(event) =>
                  setProfile({ ...profile, major: event.target.value })
                }
              />
            </Section>

            <Section
              step="04"
              title="지원 조건과 증빙"
              description="연봉, 비자, GitHub, 포트폴리오 정보를 입력합니다."
            >
              <div className="grid gap-4 md:col-span-2 lg:grid-cols-2">
                {/* 왼쪽 카드 단락 */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-5">
                  <div>
                    <p className="text-sm font-bold text-slate-900 tracking-tight">
                      지원 조건
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      연봉, 비자, 근무 선호 조건을 정리합니다.
                    </p>
                  </div>
                  <ProfileTextInput
                    label="희망 연봉"
                    value={profile.expected_salary_range ?? ""}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        expected_salary_range: event.target.value,
                      })
                    }
                    placeholder="예: USD 100k-130k / Not specified"
                  />
                  <Toggle
                    label="비자 스폰서십 필요 또는 확인 필요"
                    checked={Boolean(profile.visa_sponsorship_needed)}
                    onChange={(value) =>
                      setProfile({ ...profile, visa_sponsorship_needed: value })
                    }
                  />
                  <TagInput
                    label="선호 조건"
                    tags={profile.preferences}
                    suggestions={preferenceSuggestions}
                    tagLabel={preferenceLabel}
                    onChange={(tags) =>
                      setProfile({ ...profile, preferences: tags })
                    }
                  />
                </div>

                {/* 오른쪽 카드 단락 */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-5">
                  <div>
                    <p className="text-sm font-bold text-slate-900 tracking-tight">
                      증빙 자료
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      GitHub와 포트폴리오 보유 여부 및 링크를 입력합니다.
                    </p>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <Toggle
                      label="GitHub 보유"
                      checked={profile.github_present}
                      onChange={(value) =>
                        setProfile({ ...profile, github_present: value })
                      }
                    />
                    <Toggle
                      label="포트폴리오 보유"
                      checked={profile.portfolio_present}
                      onChange={(value) =>
                        setProfile({ ...profile, portfolio_present: value })
                      }
                    />
                  </div>
                  <ProfileTextInput
                    label="GitHub URL"
                    value={profile.github_url ?? ""}
                    onChange={(event) =>
                      setProfile({ ...profile, github_url: event.target.value })
                    }
                  />
                  <ProfileTextInput
                    label="포트폴리오 URL"
                    value={profile.portfolio_url ?? ""}
                    onChange={(event) =>
                      setProfile({
                        ...profile,
                        portfolio_url: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </Section>

            {/* 하단 플로팅 보정형 고정 하단바 */}
            <div className="sticky bottom-0 z-10 -mx-5 border-t border-slate-200 bg-slate-50/80 backdrop-blur px-5 py-4 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-slate-500">
                  저장 후 맞춤추천 화면으로 이동합니다.
                </p>
                <Button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all"
                  onClick={submit}
                  disabled={isLoading}
                >
                  {isLoading ? "저장 중" : "프로필 저장 후 추천 보기"}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

/* 내부 하위 컴포넌트 마크업 구조 정돈 */

function Section({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-2xl p-6 border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
      <div className="mb-5 flex gap-3 border-b border-slate-100 pb-4">
        <span className="mt-0.5 h-fit rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
          {step}
        </span>
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

function SelectField({
  label,
  helper,
  value,
  options,
  optionLabel,
  onChange,
}: {
  label: string;
  helper?: string;
  value: string;
  options: string[];
  optionLabel?: (value: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <ProfileSelect
      label={label}
      helper={helper}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {optionLabel ? optionLabel(option) : option}
        </option>
      ))}
    </ProfileSelect>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <ProfileTextInput
      label={label}
      type="number"
      min={0}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}

function ProfileTextInput({
  label,
  helper,
  className = "",
  ...props
}: Parameters<typeof TextInput>[0]) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel label={label} helper={helper} />
      <input
        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 disabled:bg-slate-100"
        {...props}
      />
    </label>
  );
}

function ProfileSelect({
  label,
  helper,
  children,
  className = "",
  ...props
}: Parameters<typeof SelectInput>[0]) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel label={label} helper={helper} />
      <select
        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition duration-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 disabled:bg-slate-100"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex min-h-10 items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition duration-200 ${
        checked
          ? "border-indigo-200 bg-indigo-50/50 text-indigo-600"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
          checked
            ? "bg-white border border-indigo-200 text-indigo-600"
            : "bg-slate-50 border border-slate-200 text-slate-400"
        }`}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}

function PriorityToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition duration-200 ${
        checked
          ? "border-indigo-200 bg-indigo-50/40 text-indigo-600"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
      }`}
    >
      <span className="block text-xs font-medium">{label}</span>
      <span
        className={`h-2 w-2 rounded-full transition ${
          checked ? "bg-indigo-600" : "bg-slate-200 group-hover:bg-slate-300"
        }`}
      />
    </button>
  );
}

function TagInput({
  label,
  helper,
  tags,
  suggestions,
  tagLabel,
  onChange,
}: {
  label: string;
  helper?: string;
  tags: string[];
  suggestions: string[];
  tagLabel?: (value: string) => string;
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addTag(value: string) {
    const next = value.trim();
    if (!next || tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, next]);
    setDraft("");
  }

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-700">{label}</p>
        {helper && <p className="text-[10px] text-slate-400">{helper}</p>}
      </div>
      <div className="mt-1.5 rounded-xl border border-slate-200 bg-white p-2 transition duration-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onChange(tags.filter((item) => item !== tag))}
              className="rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100/60"
            >
              {tagLabel ? tagLabel(tag) : tag}{" "}
              <span className="opacity-60 ml-0.5">×</span>
            </button>
          ))}
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag(draft);
              }
            }}
            onBlur={() => addTag(draft)}
            placeholder="입력 후 Enter"
            className="h-7 min-w-32 flex-1 border-0 bg-transparent px-1 text-xs text-slate-800 outline-none"
          />
        </div>
      </div>

      {suggestions.length > 0 && (
        <details className="mt-2 rounded-xl border border-slate-200 bg-slate-50/50 transition duration-200 open:border-indigo-200 open:bg-indigo-50/10">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-bold text-slate-600 transition duration-200 hover:text-indigo-600 [&::-webkit-details-marker]:hidden">
            <span>추천 항목</span>
            <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
              {suggestions.length}개 보기
            </span>
          </summary>
          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 py-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 transition duration-200 hover:border-indigo-500 hover:text-indigo-600"
              >
                + {tagLabel ? tagLabel(suggestion) : suggestion}
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function TextTagInput({
  label,
  helper,
  value,
  suggestions,
  tagLabel,
  onChange,
}: {
  label: string;
  helper?: string;
  value: string;
  suggestions: string[];
  tagLabel?: (value: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <TagInput
      label={label}
      helper={helper}
      tags={tagsFromText(value)}
      suggestions={suggestions}
      tagLabel={tagLabel}
      onChange={(tags) => onChange(tags.join(", "))}
    />
  );
}

/* 유틸리티 매핑 및 파싱 스크립트 단락 */

function cityOptionsFor(country: string) {
  return citiesByCountry[country] ?? ["Remote", "Not specified"];
}

function tagsFromText(value: string) {
  return cleanTags(value.split(","));
}

function cleanTags(values: string[] | undefined) {
  if (!values) return [];
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .filter(
      (value, index, array) =>
        array.findIndex(
          (item) => item.toLowerCase() === value.toLowerCase()
        ) === index
    );
}

function normalizeText(value: string | undefined) {
  return tagsFromText(value ?? "").join(", ");
}

function profileCompletion(profile: UserProfileRequest) {
  const checks = [
    profile.target_country,
    profile.target_job_family,
    profile.experience_years !== undefined,
    profile.language_level,
    profile.education,
    profile.tech_stack.length > 0,
    profile.certifications.length > 0,
    profile.github_present,
    profile.portfolio_present,
    priorityLabels(profile).length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function priorityLabels(profile: UserProfileRequest) {
  const labels = [];
  if (profile.prioritize_salary) labels.push("연봉");
  if (profile.prioritize_acceptance_probability) labels.push("합격 가능성");
  if (profile.prioritize_work_life_balance) labels.push("워라밸");
  if (profile.prioritize_company_value) labels.push("기업 가치");
  if (profile.prioritize_job_fit) labels.push("직무 적합도");
  return labels;
}
