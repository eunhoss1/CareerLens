"use client";

import { useState } from "react";
import { Badge, Button, Card, ScoreBar } from "@/components/ui";
import { languageLevelLabel, workTypeLabel } from "@/lib/display-labels";
import type { JobPosting } from "@/lib/jobs";
import { countryLabel, daysText, deadlineText, deadlineTone, formatDate } from "./job-format";

type DetailTab = "overview" | "company";

export function JobDetailPanel({
  job,
  creating,
  onCreateRoadmap
}: {
  job: JobPosting | null;
  creating: boolean;
  onCreateRoadmap: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  if (!job) {
    return (
      <Card className="flex min-h-[520px] items-center justify-center rounded-xl border-dashed border-slate-300 p-8 text-center lg:h-full">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">공고 선택</p>
          <h2 className="mt-3 text-2xl font-black text-night">왼쪽 목록에서 공고를 선택하세요</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            선택한 공고의 조건, 기술스택, 지원 기준을 확인하고 로드맵을 만들 수 있습니다.
          </p>
        </div>
      </Card>
    );
  }

  const sourceUrl = greenhouseSourceUrl(job.external_ref);
  const evaluationMemo = publicEvaluationMemo(job.evaluation_rationale);

  return (
    <Card className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border-slate-200 shadow-panel lg:h-full lg:min-h-0">
      <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-slate-100 p-1">
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
              공고 요약
            </TabButton>
            <TabButton active={activeTab === "company"} onClick={() => setActiveTab("company")}>
              기업 정보
            </TabButton>
          </div>
          <Badge tone={deadlineTone(job.deadline_status)}>{deadlineText(job)}</Badge>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-night text-2xl font-black text-white">
            {companyInitial(job.company_name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-brand">{job.company_name}</p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-night">{job.job_title}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {countryLabel(job.country)} · {workTypeLabel(job.work_type)}
            </p>
          </div>
        </div>

        {activeTab === "overview" ? (
          <div className="mt-6 space-y-5">
            <section className="rounded-xl border border-slate-100 bg-panel p-4">
              <p className="text-sm font-black text-night">연봉 및 마감</p>
              <p className="mt-3 text-2xl font-black text-night">{job.salary_range || "연봉 미기재"}</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                마감: {formatDate(job.application_deadline)} · {daysText(job)}
              </p>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="직무 분야" value={job.job_family} />
              <InfoTile label="최소 경력" value={`${job.min_experience_years ?? 0}년`} />
              <InfoTile label="학위 조건" value={degreeRequirementLabel(job.degree_requirement)} />
              <InfoTile label="포트폴리오" value={job.portfolio_required ? "필수" : "선택 또는 미기재"} />
            </section>

            <section className="rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-black text-night">평가 지표</p>
              <div className="mt-4 space-y-4">
                <NullableScore label="연봉 매력도" value={job.salary_score} />
                <NullableScore label="워라밸" value={job.work_life_balance_score} tone="success" />
                <NullableScore label="기업 가치" value={job.company_value_score} />
              </div>
            </section>

            <SkillCloud title="필수 기술" skills={job.required_skills} />
            <SkillCloud title="우대 기술" skills={job.preferred_skills} muted />
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <section className="rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-black text-night">기업/지원 조건</p>
              <div className="mt-4 grid gap-3">
                <DetailRow label="회사" value={job.company_name} />
                <DetailRow label="국가" value={countryLabel(job.country)} />
                <DetailRow label="근무 형태" value={workTypeLabel(job.work_type)} />
                <DetailRow label="비자 조건" value={visaRequirementLabel(job.visa_requirement)} />
                <DetailRow label="필수 언어" value={languageRequirementsLabel(job.required_languages)} />
              </div>
            </section>

            {evaluationMemo && (
              <section className="rounded-xl border border-slate-100 bg-panel p-4">
                <p className="text-sm font-black text-night">공고 메모</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{evaluationMemo}</p>
              </section>
            )}
          </div>
        )}
      </div>

      <div className="grid shrink-0 gap-2 border-t border-slate-100 bg-white p-4 sm:grid-cols-[1fr_1.2fr]">
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-night transition hover:border-night"
          >
            원문 보기
          </a>
        ) : (
          <Button type="button" variant="secondary" disabled>
            원문 없음
          </Button>
        )}
        <Button type="button" onClick={onCreateRoadmap} disabled={creating || job.deadline_status === "CLOSED"} className="min-h-11">
          {creating ? "로드맵 생성 중" : "로드맵 생성"}
        </Button>
      </div>
    </Card>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`rounded-full px-4 py-2 text-sm font-black transition ${
        active ? "bg-white text-night shadow-sm" : "text-slate-500 hover:text-night"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-black text-night">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className="text-right text-sm font-black text-night">{value}</p>
    </div>
  );
}

function NullableScore({ label, value, tone = "brand" }: { label: string; value: number | null; tone?: "brand" | "success" }) {
  if (value === null || value === undefined) {
    return (
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">{label}</span>
          <span className="font-semibold text-slate-500">검수 필요</span>
        </div>
        <div className="mt-2 h-2 border border-line bg-white" />
      </div>
    );
  }
  return <ScoreBar label={label} value={value} tone={tone} />;
}

function SkillCloud({ title, skills, muted = false }: { title: string; skills: string[]; muted?: boolean }) {
  return (
    <section className="rounded-xl border border-slate-100 p-4">
      <p className="text-sm font-black text-night">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.length ? (
          skills.map((skill, index) => (
            <span
              key={`${skill}-${index}`}
              className={`rounded border px-2.5 py-1 text-xs font-bold ${
                muted ? "border-slate-200 bg-slate-50 text-slate-500" : "border-brand/20 bg-[#e8f2f1] text-brand"
              }`}
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="text-sm font-semibold text-slate-400">미기재</span>
        )}
      </div>
    </section>
  );
}

function companyInitial(companyName: string) {
  return companyName.trim().slice(0, 1).toUpperCase() || "C";
}

function degreeRequirementLabel(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return "미기재";
  const labels: Record<string, string> = {
    "Bachelor or equivalent": "학사 또는 동등 경력",
    Bachelor: "학사",
    "Bachelor's degree": "학사",
    "Master's degree": "석사",
    "No strict degree": "학위 제한 없음",
    "Not specified": "미기재"
  };
  return labels[normalized] ?? normalized;
}

function visaRequirementLabel(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return "미기재";
  const labels: Record<string, string> = {
    "Visa sponsorship available": "비자 스폰서십 가능",
    "Visa support available": "비자 지원 가능",
    "Visa support limited": "비자 지원 제한",
    "Visa sponsorship mentioned": "비자 관련 언급 있음",
    "Work authorization mentioned": "근로 자격 확인 필요",
    "Not specified": "미기재",
    "Not specified in public posting": "공개 공고 미기재"
  };
  return labels[normalized] ?? normalized;
}

function languageRequirementsLabel(languages: string[]) {
  if (!languages.length) return "미기재";
  return languages.map(languageRequirementLabel).join(", ");
}

function languageRequirementLabel(value: string) {
  const [language, level] = value.split(":").map((part) => part.trim());
  const languageLabels: Record<string, string> = {
    English: "영어",
    Japanese: "일본어",
    Korean: "한국어",
    Chinese: "중국어",
    German: "독일어",
    French: "프랑스어"
  };
  const languageName = languageLabels[language] ?? language;
  return level ? `${languageName} ${languageLevelLabel(level)}` : languageName;
}

function publicEvaluationMemo(value: string | null | undefined) {
  const memo = value?.trim();
  if (!memo) return "";
  const lower = memo.toLowerCase();
  if (lower.includes("generated evaluation weights")) return "";
  if (lower.includes("prototype recommendation scoring")) return "";
  return memo;
}

function greenhouseSourceUrl(externalRef?: string) {
  if (!externalRef?.startsWith("greenhouse:")) {
    return null;
  }
  const [, boardToken, jobId] = externalRef.split(":");
  if (!boardToken || !jobId) {
    return null;
  }
  return `https://boards.greenhouse.io/${boardToken}/jobs/${jobId}`;
}
