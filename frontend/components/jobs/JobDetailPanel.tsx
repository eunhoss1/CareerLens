"use client";

import { useState } from "react";
import { Badge, Button, Card, ScoreBar } from "@/components/ui";
import { workTypeLabel } from "@/lib/display-labels";
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
          <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-400">No job selected</p>
          <h2 className="mt-3 text-2xl font-black text-night">공고를 선택해 상세 정보를 확인하세요</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">왼쪽 리스트에서 관심 공고를 누르면 지원 조건과 로드맵 생성 버튼이 여기에 표시됩니다.</p>
        </div>
      </Card>
    );
  }

  const sourceUrl = greenhouseSourceUrl(job.external_ref);

  return (
    <Card className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border-slate-200 shadow-panel lg:h-full lg:min-h-0">
      <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-slate-100 p-1">
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overview</TabButton>
            <TabButton active={activeTab === "company"} onClick={() => setActiveTab("company")}>Company</TabButton>
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
              <p className="text-sm font-black text-night">Compensation Overview</p>
              <p className="mt-3 text-2xl font-black text-night">{job.salary_range || "연봉 미기재"}</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">마감: {formatDate(job.application_deadline)} · {daysText(job)}</p>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="직무군" value={job.job_family} />
              <InfoTile label="최소 경력" value={`${job.min_experience_years ?? 0}년`} />
              <InfoTile label="학위 조건" value={job.degree_requirement || "미기재"} />
              <InfoTile label="포트폴리오" value={job.portfolio_required ? "필수" : "선택 또는 미기재"} />
            </section>

            <section className="rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-black text-night">Fit Signals</p>
              <div className="mt-4 space-y-4">
                <NullableScore label="연봉 매력도" value={job.salary_score} />
                <NullableScore label="워라밸" value={job.work_life_balance_score} tone="success" />
                <NullableScore label="기업 가치" value={job.company_value_score} />
              </div>
            </section>

            <SkillCloud title="Required Skills" skills={job.required_skills} />
            <SkillCloud title="Preferred Skills" skills={job.preferred_skills} muted />
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <section className="rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-black text-night">Company Snapshot</p>
              <div className="mt-4 grid gap-3">
                <DetailRow label="회사" value={job.company_name} />
                <DetailRow label="국가" value={countryLabel(job.country)} />
                <DetailRow label="근무 형태" value={workTypeLabel(job.work_type)} />
                <DetailRow label="비자 조건" value={job.visa_requirement || "미기재"} />
                <DetailRow label="필수 언어" value={job.required_languages.length ? job.required_languages.join(", ") : "미기재"} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 bg-panel p-4">
              <p className="text-sm font-black text-night">CareerLens Evaluation</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{job.evaluation_rationale || "아직 평가 근거가 제공되지 않았습니다."}</p>
            </section>
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
          <span className="font-semibold text-slate-500">검수 중</span>
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
          skills.map((skill) => (
            <span
              key={skill}
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
