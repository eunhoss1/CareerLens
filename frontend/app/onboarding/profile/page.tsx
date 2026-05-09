"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, MetricCard, PageHeader, PageShell, SelectInput, TextInput } from "@/components/ui";
import { getStoredUser, storeUser, type AuthUser } from "@/lib/auth";
import { domainSuggestionsFor, jobFamilies, projectSuggestionsFor, skillSuggestionsFor } from "@/lib/job-families";
import { demoProfile, fetchUserProfile, saveUserProfile, type UserProfileRequest } from "@/lib/recommendation";

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
  "Not specified"
];
const citiesByCountry: Record<string, string[]> = {
  "United States": ["San Francisco", "Seattle", "New York", "Austin", "Los Angeles", "Remote", "Not specified"],
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
  "Not specified": ["Not specified"]
};
const languageLevels = ["BASIC", "CONVERSATIONAL", "BUSINESS", "FLUENT", "NATIVE"];
const workTypes = ["Onsite", "Hybrid", "Remote", "Not specified"];
const startDates = ["Immediately", "Within 1 month", "Within 3 months", "After 6 months"];
const certSuggestions = ["AWS Cloud Practitioner", "AWS SAA", "TOEIC", "JLPT N2", "JLPT N1", "정보처리기사", "PMP"];
const preferenceSuggestions = ["Visa support", "Hybrid", "Remote", "Relocation support", "Global team", "High salary"];

export default function ProfileOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfileRequest>(demoProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push("/signup");
      return;
    }

    setUser(storedUser);
    const baseProfile = {
      ...demoProfile,
      user_id: storedUser.user_id,
      display_name: storedUser.display_name,
      email: storedUser.email
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
          preferences: cleanTags(storedProfile.preferences)
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [router]);

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
        project_experience_summary: normalizeText(profile.project_experience_summary),
        domain_experience: normalizeText(profile.domain_experience)
      });
      storeUser({ ...user, profile_completed: true });
      router.push("/jobs/recommendation");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "프로필 저장 중 오류가 발생했습니다.");
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
      target_city: nextCities.includes(current.target_city ?? "") ? current.target_city : nextCities[0]
    }));
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="CAREERLENS PROFILE"
        title="해외 취업 프로필 설정"
        description="이 정보는 맞춤채용정보 추천 진단의 기준 데이터로 저장됩니다. 공고별 평가기준과 함께 반영되므로 기술, 경력, 언어, 포트폴리오와 우선순위를 구체적으로 입력합니다."
        actions={<Button type="button" onClick={submit} disabled={isLoading}>{isLoading ? "저장 중" : "저장하고 추천 진단으로"}</Button>}
      />

      <section className="lens-container grid gap-5 py-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-5">
          <Card className="p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-brand">PROFILE DOSSIER</p>
            <h2 className="mt-3 text-xl font-semibold text-night">{profile.display_name}</h2>
            <p className="mt-1 text-sm text-slate-600">{profile.email}</p>
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">프로필 완성도</span>
                <span className="font-bold text-night">{completion}%</span>
              </div>
              <div className="mt-2 h-2 border border-line bg-white">
                <div className="h-full bg-brand" style={{ width: `${completion}%` }} />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <MetricCard label="희망 국가" value={profile.target_country} />
              <MetricCard label="직무군" value={profile.target_job_family} />
              <MetricCard label="경력" value={`${profile.experience_years ?? 0}년`} />
              <MetricCard label="언어" value={profile.language_level} />
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-night">추천 우선순위</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">선택한 항목은 공고별 기본 가중치에 추가 반영됩니다.</p>
            <div className="mt-4 space-y-2">
              <PriorityToggle label="연봉" checked={Boolean(profile.prioritize_salary)} onChange={(value) => setProfile({ ...profile, prioritize_salary: value })} />
              <PriorityToggle label="합격 가능성" checked={Boolean(profile.prioritize_acceptance_probability)} onChange={(value) => setProfile({ ...profile, prioritize_acceptance_probability: value })} />
              <PriorityToggle label="워라밸" checked={Boolean(profile.prioritize_work_life_balance)} onChange={(value) => setProfile({ ...profile, prioritize_work_life_balance: value })} />
              <PriorityToggle label="기업 가치" checked={Boolean(profile.prioritize_company_value)} onChange={(value) => setProfile({ ...profile, prioritize_company_value: value })} />
              <PriorityToggle label="직무 적합도" checked={Boolean(profile.prioritize_job_fit)} onChange={(value) => setProfile({ ...profile, prioritize_job_fit: value })} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {priorities.map((priority) => <Badge key={priority} tone="brand">{priority}</Badge>)}
              {priorities.length === 0 && <Badge tone="muted">우선순위 미선택</Badge>}
            </div>
          </Card>
        </aside>

        <div className="space-y-5">
          {errorMessage && (
            <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <Section step="01" title="기본 정보" description="회원 정보와 해외 취업 기준을 입력합니다.">
            <TextInput label="이름" value={profile.display_name} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} />
            <TextInput label="이메일" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
            <SelectField label="희망 국가" helper="외부 공고 국가 반영" value={profile.target_country} options={countries} onChange={handleTargetCountryChange} />
            <SelectField label="희망 도시" helper="Remote 선택 가능" value={profile.target_city ?? ""} options={availableCities} onChange={(value) => setProfile({ ...profile, target_city: value })} />
            <SelectField label="희망 직무군" value={profile.target_job_family} options={jobFamilies} onChange={(value) => setProfile({ ...profile, target_job_family: value })} />
            <TextInput label="희망 직무명" value={profile.desired_job_title ?? ""} onChange={(event) => setProfile({ ...profile, desired_job_title: event.target.value })} />
            <SelectField label="선호 근무형태" value={profile.preferred_work_type ?? "Hybrid"} options={workTypes} onChange={(value) => setProfile({ ...profile, preferred_work_type: value })} />
            <SelectField label="입사 가능 시점" value={profile.available_start_date ?? "Within 3 months"} options={startDates} onChange={(value) => setProfile({ ...profile, available_start_date: value })} />
          </Section>

          <Section step="02" title="경력과 역량" description="추천 점수에서 가장 크게 쓰이는 직무 관련 데이터를 입력합니다.">
            <NumberField label="총 경력 연차" value={profile.experience_years ?? 0} onChange={(value) => setProfile({ ...profile, experience_years: value })} />
            <NumberField label="직무 관련 경력 연차" value={profile.related_experience_years ?? 0} onChange={(value) => setProfile({ ...profile, related_experience_years: value })} />
            <TextTagInput label="대표 프로젝트 경험" helper={`${profile.target_job_family} 직무 기준`} value={profile.project_experience_summary ?? ""} suggestions={projectSuggestionsFor(profile.target_job_family)} onChange={(value) => setProfile({ ...profile, project_experience_summary: value })} />
            <TextTagInput label="산업/도메인 경험" helper="공고 도메인 매칭에 사용" value={profile.domain_experience ?? ""} suggestions={domainSuggestionsFor(profile.target_job_family)} onChange={(value) => setProfile({ ...profile, domain_experience: value })} />
            <TagInput label="기술 스택" helper={`${profile.target_job_family} 추천 태그`} tags={profile.tech_stack} suggestions={skillSuggestionsFor(profile.target_job_family)} onChange={(tags) => setProfile({ ...profile, tech_stack: tags })} />
            <TagInput label="자격증/시험" tags={profile.certifications} suggestions={certSuggestions} onChange={(tags) => setProfile({ ...profile, certifications: tags })} />
          </Section>

          <Section step="03" title="언어와 학력" description="해외 취업에서 1차 필터링과 보완 요소 분석에 사용됩니다.">
            <SelectField label="대표 언어 수준" value={profile.language_level} options={languageLevels} onChange={(value) => setProfile({ ...profile, language_level: value })} />
            <SelectField label="영어 수준" value={profile.english_level ?? "BUSINESS"} options={languageLevels} onChange={(value) => setProfile({ ...profile, english_level: value })} />
            <SelectField label="일본어 수준" value={profile.japanese_level ?? "BASIC"} options={languageLevels} onChange={(value) => setProfile({ ...profile, japanese_level: value })} />
            <TextInput label="어학 점수" value={profile.language_test_scores ?? ""} onChange={(event) => setProfile({ ...profile, language_test_scores: event.target.value })} placeholder="예: TOEIC 860, JLPT N2" />
            <TextInput label="최종 학력" value={profile.education} onChange={(event) => setProfile({ ...profile, education: event.target.value })} />
            <TextInput label="전공" value={profile.major ?? ""} onChange={(event) => setProfile({ ...profile, major: event.target.value })} />
          </Section>

          <Section step="04" title="지원 조건과 증빙" description="비자, 포트폴리오, 희망 조건은 공고 카드와 부족 요소에 함께 표시됩니다.">
            <TextInput label="희망 연봉" helper="공고 미기재가 많으면 비워도 됩니다" value={profile.expected_salary_range ?? ""} onChange={(event) => setProfile({ ...profile, expected_salary_range: event.target.value })} placeholder="예: USD 100k-130k / Not specified" />
            <Toggle label="비자 스폰서십 필요 또는 확인 필요" checked={Boolean(profile.visa_sponsorship_needed)} onChange={(value) => setProfile({ ...profile, visa_sponsorship_needed: value })} />
            <Toggle label="GitHub 보유" checked={profile.github_present} onChange={(value) => setProfile({ ...profile, github_present: value })} />
            <Toggle label="포트폴리오 보유" checked={profile.portfolio_present} onChange={(value) => setProfile({ ...profile, portfolio_present: value })} />
            <TextInput label="GitHub URL" value={profile.github_url ?? ""} onChange={(event) => setProfile({ ...profile, github_url: event.target.value })} />
            <TextInput label="포트폴리오 URL" value={profile.portfolio_url ?? ""} onChange={(event) => setProfile({ ...profile, portfolio_url: event.target.value })} />
            <TagInput label="선호 조건" tags={profile.preferences} suggestions={preferenceSuggestions} onChange={(tags) => setProfile({ ...profile, preferences: tags })} />
          </Section>

          <div className="flex justify-end">
            <Button type="button" onClick={submit} disabled={isLoading}>{isLoading ? "저장 중" : "저장하고 추천 진단으로"}</Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Section({ step, title, description, children }: { step: string; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-5 flex gap-4">
        <span className="mt-1 h-fit border border-line bg-panel px-2.5 py-1 text-xs font-bold text-brand">{step}</span>
        <div>
          <h2 className="text-lg font-semibold text-night">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
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
  onChange
}: {
  label: string;
  helper?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <SelectInput label={label} helper={helper} value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option}>{option}</option>)}
    </SelectInput>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <TextInput label={label} type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} />
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`mt-6 flex h-10 items-center justify-between border px-3 text-sm font-semibold ${
        checked ? "border-mint/20 bg-emerald-50 text-mint" : "border-line bg-white text-slate-600"
      }`}
    >
      <span>{label}</span>
      <span>{checked ? "ON" : "OFF"}</span>
    </button>
  );
}

function PriorityToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full border p-3 text-left transition ${
        checked ? "border-brand bg-[#e8f2f1] text-brand" : "border-line bg-white text-slate-600 hover:border-brand"
      }`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="mt-1 block text-xs">{checked ? "추천 점수에 우선 반영" : "클릭해서 우선순위 선택"}</span>
    </button>
  );
}

function TagInput({
  label,
  helper,
  tags,
  suggestions,
  onChange
}: {
  label: string;
  helper?: string;
  tags: string[];
  suggestions: string[];
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
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {helper && <p className="text-xs text-slate-400">{helper}</p>}
      </div>
      <div className="mt-1 border border-line bg-white p-2">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button key={tag} type="button" onClick={() => onChange(tags.filter((item) => item !== tag))} className="bg-[#e8f2f1] px-3 py-1 text-sm font-semibold text-brand">
              {tag} x
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
            className="h-8 min-w-36 flex-1 border-0 bg-transparent px-1 text-sm outline-none"
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => addTag(suggestion)} className="border border-line px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand hover:text-brand">
            + {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextTagInput({
  label,
  helper,
  value,
  suggestions,
  onChange
}: {
  label: string;
  helper?: string;
  value: string;
  suggestions: string[];
  onChange: (value: string) => void;
}) {
  return <TagInput label={label} helper={helper} tags={tagsFromText(value)} suggestions={suggestions} onChange={(tags) => onChange(tags.join(", "))} />;
}

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
    .filter((value, index, array) => array.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);
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
    priorityLabels(profile).length > 0
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
