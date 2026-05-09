"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, EmptyState, MetricCard, PageHeader, PageShell, SelectInput, TextInput } from "@/components/ui";
import {
  importGreenhouseJobs,
  previewGreenhouseJobs,
  type ExternalJobImportResponse,
  type ExternalJobPreview
} from "@/lib/external-jobs";

type FormState = {
  boardToken: string;
  defaultCountry: string;
  defaultJobFamily: string;
  limit: string;
  defaultDeadline: string;
  createPatternProfile: boolean;
};

const initialForm: FormState = {
  boardToken: "airbnb",
  defaultCountry: "United States",
  defaultJobFamily: "Backend",
  limit: "8",
  defaultDeadline: "",
  createPatternProfile: true
};

export default function JobImportPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [previews, setPreviews] = useState<ExternalJobPreview[]>([]);
  const [importResult, setImportResult] = useState<ExternalJobImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handlePreview() {
    setLoading(true);
    setErrorMessage("");
    setImportResult(null);
    try {
      const result = await previewGreenhouseJobs(toRequest(form));
      setPreviews(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Greenhouse 공고 미리보기 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await importGreenhouseJobs(toRequest(form));
      setImportResult(result);
      setPreviews([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Greenhouse 공고 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        kicker="JOB PROVIDER"
        title="외부 공고 API 가져오기"
        description="Greenhouse 공개 Job Board API에서 공고를 읽어 CareerLens의 JobPosting과 기본 PatternProfile로 정규화합니다. 무단 크롤링이 아니라 공개 API provider 구조를 검증하는 시연용 화면입니다."
        actions={
          <>
            <Link href="/jobs" className="border border-line bg-white px-4 py-2 text-sm font-semibold text-night hover:border-night">
              전체 공고로
            </Link>
            <Link href="/jobs/recommendation" className="bg-night px-4 py-2 text-sm font-semibold text-white hover:bg-[#24343a]">
              추천 진단으로
            </Link>
          </>
        }
      />

      <div className="lens-container grid gap-6 py-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-brand">PROVIDER CONFIG</p>
            <h2 className="mt-2 text-lg font-semibold text-night">Greenhouse Board Token</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              예시로 `airbnb`, `doordash`, `reddit`처럼 Greenhouse 채용 페이지의 board token을 넣어 확인합니다.
            </p>
            <div className="mt-5 space-y-4">
              <TextInput
                label="Board token"
                value={form.boardToken}
                onChange={(event) => setForm((current) => ({ ...current, boardToken: event.target.value }))}
              />
              <SelectInput
                label="기본 국가"
                value={form.defaultCountry}
                onChange={(event) => setForm((current) => ({ ...current, defaultCountry: event.target.value }))}
              >
                <option value="United States">미국</option>
                <option value="Japan">일본</option>
              </SelectInput>
              <SelectInput
                label="기본 직무군"
                value={form.defaultJobFamily}
                onChange={(event) => setForm((current) => ({ ...current, defaultJobFamily: event.target.value }))}
              >
                <option value="Backend">백엔드</option>
                <option value="Frontend">프론트엔드</option>
              </SelectInput>
              <TextInput
                label="가져올 개수"
                type="number"
                min={1}
                max={50}
                value={form.limit}
                onChange={(event) => setForm((current) => ({ ...current, limit: event.target.value }))}
              />
              <TextInput
                label="기본 마감일"
                helper="선택"
                type="date"
                value={form.defaultDeadline}
                onChange={(event) => setForm((current) => ({ ...current, defaultDeadline: event.target.value }))}
              />
              <label className="flex items-start gap-3 border border-line bg-panel p-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.createPatternProfile}
                  onChange={(event) => setForm((current) => ({ ...current, createPatternProfile: event.target.checked }))}
                />
                <span>
                  <span className="block font-semibold text-night">기본 PatternProfile 생성</span>
                  <span className="mt-1 block leading-5">공고 키워드를 기반으로 추천 진단이 동작할 최소 패턴을 함께 저장합니다.</span>
                </span>
              </label>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" onClick={handlePreview} disabled={loading || !form.boardToken.trim()}>
                미리보기
              </Button>
              <Button type="button" onClick={handleImport} disabled={loading || !form.boardToken.trim()}>
                DB 등록
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-brand">DATA POLICY</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>공개 GET API만 사용합니다.</li>
              <li>지원서 제출 API는 사용하지 않습니다.</li>
              <li>추천 엔진은 외부 API가 아니라 내부 JobPosting만 봅니다.</li>
              <li>실제 발표에서는 seed-data와 API provider를 병행 구조로 설명합니다.</li>
            </ul>
          </Card>
        </aside>

        <section className="space-y-5">
          {errorMessage && (
            <div role="alert" className="border border-coral/30 bg-red-50 px-4 py-3 text-sm font-medium text-coral">
              {errorMessage}
            </div>
          )}

          {importResult && (
            <Card className="p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard label="가져온 공고" value={`${importResult.fetched_count}개`} />
                <MetricCard label="신규 등록" value={`${importResult.imported_count}개`} />
                <MetricCard label="기존 업데이트" value={`${importResult.updated_count}개`} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                등록된 공고는 전체 공고 조회와 추천 진단에서 기존 seed-data 공고와 같은 구조로 사용됩니다.
              </p>
            </Card>
          )}

          {loading ? (
            <Card className="p-8 text-center text-sm text-slate-600">Greenhouse 공개 API를 확인하는 중입니다.</Card>
          ) : previews.length === 0 && !importResult ? (
            <EmptyState
              title="아직 미리보기 결과가 없습니다."
              description="Board token을 입력하고 미리보기를 실행하면 외부 공고가 내부 JobPosting으로 어떻게 정규화되는지 확인할 수 있습니다."
            />
          ) : (
            <div className="space-y-4">
              {previews.map((job) => (
                <ExternalJobCard key={job.external_ref} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function ExternalJobCard({ job }: { job: ExternalJobPreview }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{job.provider}</Badge>
            <Badge tone="muted">{job.country}</Badge>
            <Badge tone="muted">{job.job_family}</Badge>
            {job.already_imported && <Badge tone="success">등록됨</Badge>}
          </div>
          <h2 className="mt-4 text-xl font-semibold leading-7 text-night">{job.company_name}</h2>
          <p className="mt-1 text-base font-medium text-ink">{job.job_title}</p>
          <p className="mt-2 text-sm text-slate-600">{job.location}</p>
        </div>
        <a href={job.source_url} target="_blank" rel="noreferrer" className="border border-line bg-white px-3 py-2 text-sm font-semibold text-night hover:border-night">
          원문 보기
        </a>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{job.content_summary || "공고 본문 요약이 없습니다."}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-brand">NORMALIZED SKILLS</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {job.required_skills.map((skill) => (
              <span key={skill} className="border border-line bg-panel px-2.5 py-1 text-xs font-medium text-slate-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <Info label="경력" value={`${job.min_experience_years ?? 0}년 이상`} />
          <Info label="근무형태" value={job.work_type} />
          <Info label="연봉" value={job.salary_range} />
          <Info label="비자" value={job.visa_requirement} />
        </div>
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-panel p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-night">{value || "미기재"}</p>
    </div>
  );
}

function toRequest(form: FormState) {
  return {
    board_token: form.boardToken.trim(),
    default_country: form.defaultCountry,
    default_job_family: form.defaultJobFamily,
    limit: Number.parseInt(form.limit, 10) || 8,
    default_deadline: form.defaultDeadline || undefined,
    create_pattern_profile: form.createPatternProfile
  };
}
