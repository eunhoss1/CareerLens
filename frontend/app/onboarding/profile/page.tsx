"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, storeUser, type AuthUser } from "@/lib/auth";
import { demoProfile, saveUserProfile, type UserProfileRequest } from "@/lib/recommendation";

export default function ProfileOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfileRequest>(demoProfile);
  const [skillsText, setSkillsText] = useState(demoProfile.tech_stack.join(", "));
  const [certText, setCertText] = useState(demoProfile.certifications.join(", "));
  const [prefText, setPrefText] = useState(demoProfile.preferences.join(", "));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push("/signup");
      return;
    }
    setUser(storedUser);
    setProfile((current) => ({
      ...current,
      user_id: storedUser.user_id,
      display_name: storedUser.display_name,
      email: storedUser.email
    }));
  }, [router]);

  async function submit() {
    if (!user) {
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload: UserProfileRequest = {
        ...profile,
        tech_stack: splitList(skillsText),
        certifications: splitList(certText),
        preferences: splitList(prefText)
      };
      await saveUserProfile(user.user_id, payload);
      storeUser({ ...user, profile_completed: true });
      router.push("/jobs/recommendation");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#edf3f7]">
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-brand">CareerLens Onboarding</p>
            <Link href="/" className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              홈으로
            </Link>
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-ink">해외취업 프로필 설정</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            추천 진단 결과가 사용자별로 달라지도록 국가, 직무 목표, 경력, 기술, 언어, 포트폴리오, 비자 조건을 입력합니다.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <FormSection title="1. 기본 정보">
            <Field label="이름" value={profile.display_name} onChange={(value) => setProfile({ ...profile, display_name: value })} />
            <Field label="이메일" value={profile.email} onChange={(value) => setProfile({ ...profile, email: value })} />
            <Field label="현재 거주 국가" value={profile.current_country ?? ""} onChange={(value) => setProfile({ ...profile, current_country: value })} />
            <Field label="국적" value={profile.nationality ?? ""} onChange={(value) => setProfile({ ...profile, nationality: value })} />
          </FormSection>

          <FormSection title="2. 해외 취업 목표">
            <Select label="희망 국가" value={profile.target_country} options={["United States", "Japan"]} onChange={(value) => setProfile({ ...profile, target_country: value })} />
            <Field label="희망 도시" value={profile.target_city ?? ""} onChange={(value) => setProfile({ ...profile, target_city: value })} />
            <Select label="희망 직무군" value={profile.target_job_family} options={["Backend", "Frontend"]} onChange={(value) => setProfile({ ...profile, target_job_family: value })} />
            <Field label="희망 직무명" value={profile.desired_job_title ?? ""} onChange={(value) => setProfile({ ...profile, desired_job_title: value })} />
            <Select label="희망 근무 형태" value={profile.preferred_work_type ?? "Hybrid"} options={["Remote", "Hybrid", "Onsite"]} onChange={(value) => setProfile({ ...profile, preferred_work_type: value })} />
            <Field label="희망 연봉 범위" value={profile.expected_salary_range ?? ""} onChange={(value) => setProfile({ ...profile, expected_salary_range: value })} />
            <Field label="입사 가능 시점" value={profile.available_start_date ?? ""} onChange={(value) => setProfile({ ...profile, available_start_date: value })} />
            <Toggle label="비자 스폰서십 필요" checked={Boolean(profile.visa_sponsorship_needed)} onChange={(checked) => setProfile({ ...profile, visa_sponsorship_needed: checked })} />
          </FormSection>

          <FormSection title="3. 경력과 프로젝트">
            <NumberField label="총 경력 연차" value={profile.experience_years} onChange={(value) => setProfile({ ...profile, experience_years: value })} />
            <NumberField label="직무 관련 경력 연차" value={profile.related_experience_years ?? 0} onChange={(value) => setProfile({ ...profile, related_experience_years: value })} />
            <TextArea label="대표 프로젝트 경험" value={profile.project_experience_summary ?? ""} onChange={(value) => setProfile({ ...profile, project_experience_summary: value })} />
            <TextArea label="산업/도메인 경험" value={profile.domain_experience ?? ""} onChange={(value) => setProfile({ ...profile, domain_experience: value })} />
          </FormSection>

          <FormSection title="4. 기술, 언어, 학력">
            <Field label="기술스택" value={skillsText} onChange={setSkillsText} />
            <Field label="자격증" value={certText} onChange={setCertText} />
            <Select label="영어 수준" value={profile.english_level ?? profile.language_level} options={["BASIC", "CONVERSATIONAL", "BUSINESS", "FLUENT", "NATIVE"]} onChange={(value) => setProfile({ ...profile, english_level: value, language_level: value })} />
            <Select label="일본어 수준" value={profile.japanese_level ?? "BASIC"} options={["BASIC", "CONVERSATIONAL", "BUSINESS", "FLUENT", "NATIVE"]} onChange={(value) => setProfile({ ...profile, japanese_level: value })} />
            <Field label="공인 언어 점수" value={profile.language_test_scores ?? ""} onChange={(value) => setProfile({ ...profile, language_test_scores: value })} />
            <Field label="최종 학력" value={profile.education} onChange={(value) => setProfile({ ...profile, education: value })} />
            <Field label="전공" value={profile.major ?? ""} onChange={(value) => setProfile({ ...profile, major: value })} />
            <Field label="졸업 상태" value={profile.graduation_status ?? ""} onChange={(value) => setProfile({ ...profile, graduation_status: value })} />
          </FormSection>

          <FormSection title="5. 검증 자료와 선호 조건">
            <Toggle label="GitHub 보유" checked={profile.github_present} onChange={(checked) => setProfile({ ...profile, github_present: checked })} />
            <Field label="GitHub URL" value={profile.github_url ?? ""} onChange={(value) => setProfile({ ...profile, github_url: value })} />
            <Toggle label="포트폴리오 보유" checked={profile.portfolio_present} onChange={(checked) => setProfile({ ...profile, portfolio_present: checked })} />
            <Field label="포트폴리오 URL" value={profile.portfolio_url ?? ""} onChange={(value) => setProfile({ ...profile, portfolio_url: value })} />
            <TextArea label="클라우드 경험" value={profile.cloud_experience ?? ""} onChange={(value) => setProfile({ ...profile, cloud_experience: value })} />
            <TextArea label="DB 경험" value={profile.database_experience ?? ""} onChange={(value) => setProfile({ ...profile, database_experience: value })} />
            <TextArea label="배포/협업 경험" value={profile.deployment_experience ?? ""} onChange={(value) => setProfile({ ...profile, deployment_experience: value })} />
            <Field label="선호 조건" value={prefText} onChange={setPrefText} />
          </FormSection>
        </div>

        <aside className="h-fit rounded-lg border border-line bg-white p-5 shadow-sm lg:sticky lg:top-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile Flow</p>
          <h2 className="mt-2 text-lg font-semibold text-ink">진단 연결 준비</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li>1. 계정 생성 또는 로그인</li>
            <li>2. 해외취업 프로필 저장</li>
            <li>3. 저장 프로필 기반 추천 진단</li>
            <li>4. 부족 요소 분석</li>
            <li>5. 커리어 플래너 연결</li>
          </ol>
          {errorMessage && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="mt-5 h-11 w-full rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:bg-slate-400"
          >
            {isLoading ? "저장 중" : "프로필 저장 후 추천 진단"}
          </button>
        </aside>
      </section>
    </main>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm" />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-slate-700 md:col-span-2">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-line bg-white px-3 py-2 text-sm" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex h-10 items-center justify-between rounded-md border px-3 text-sm font-semibold ${
        checked ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-line bg-white text-slate-600"
      }`}
    >
      <span>{label}</span>
      <span>{checked ? "ON" : "OFF"}</span>
    </button>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
