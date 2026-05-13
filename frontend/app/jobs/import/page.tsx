"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, SelectInput, TextInput } from "@/components/ui";
import { getStoredUser, isAdminUser, type AuthUser } from "@/lib/auth";
import {
  importGreenhouseJobs,
  fetchGreenhouseSyncStatus,
  previewGreenhouseJobs,
  runGreenhouseSync,
  type ExternalJobImportResponse,
  type ExternalJobPreview,
  type ExternalJobSyncStatus
} from "@/lib/external-jobs";
import { countryLabel, workTypeLabel } from "@/lib/display-labels";
import { defaultGreenhouseBoardTokens, greenhouseBoardPresets } from "@/lib/greenhouse-board-registry";
import { jobFamilies } from "@/lib/job-families";

const countryFilters = [
  "ALL",
  "United States",
  "Japan",
  "South Korea",
  "United Kingdom",
  "Singapore",
  "Italy",
  "Brazil",
  "India",
  "China",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Ireland",
  "Netherlands"
];

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
  defaultCountry: "ALL",
  defaultJobFamily: "ALL",
  limit: "50",
  defaultDeadline: "",
  createPatternProfile: true
};

export default function JobImportPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [previews, setPreviews] = useState<ExternalJobPreview[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ExternalJobImportResponse | null>(null);
  const [syncStatus, setSyncStatus] = useState<ExternalJobSyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isAdmin = isAdminUser(user);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    if (!isAdminUser(storedUser)) {
      return;
    }
    fetchGreenhouseSyncStatus()
      .then(setSyncStatus)
      .catch(() => {
        setSyncStatus(null);
      });
  }, []);

  async function handlePreview() {
    setLoading(true);
    setErrorMessage("");
    setImportResult(null);
    try {
      const result = await previewGreenhouseJobs(toRequest(form));
      setPreviews(result);
      setSelectedRefs(result.filter((job) => job.already_imported).map((job) => job.external_ref));
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
      if (selectedRefs.length === 0) {
        throw new Error("DB에 저장할 공고를 먼저 선택해주세요.");
      }
      const result = await importGreenhouseJobs(toRequest(form, selectedRefs, true));
      setImportResult(result);
      setPreviews([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Greenhouse 공고 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImportPresetSet() {
    setLoading(true);
    setErrorMessage("");
    setImportResult(null);
    setPreviews([]);
    try {
      let fetched = 0;
      let imported = 0;
      let updated = 0;
      let lastResult: ExternalJobImportResponse | null = null;
      const failedTokens: string[] = [];
      for (const boardToken of defaultGreenhouseBoardTokens) {
        try {
          const result = await importGreenhouseJobs(toRequest({ ...form, boardToken, limit: "50" }, undefined, false));
          fetched += result.fetched_count;
          imported += result.imported_count;
          updated += result.updated_count;
          lastResult = result;
        } catch {
          failedTokens.push(boardToken);
        }
      }
      setImportResult({
        provider: "greenhouse",
        board_token: `${defaultGreenhouseBoardTokens.length} boards`,
        fetched_count: fetched,
        imported_count: imported,
        updated_count: updated,
        jobs: lastResult?.jobs ?? []
      });
      if (failedTokens.length > 0) {
        setErrorMessage(`일부 board token은 조회에 실패해 건너뛰었습니다: ${failedTokens.join(", ")}`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Greenhouse 프리셋 일괄 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRunSync() {
    setSyncing(true);
    setErrorMessage("");
    try {
      const result = await runGreenhouseSync();
      setSyncStatus(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Greenhouse 자동 동기화 실행 중 오류가 발생했습니다.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        kicker="JOB PROVIDER"
        title="외부 공고 API 가져오기"
        description="관리자용 데이터 관리 화면입니다. Greenhouse 공개 Job Board API에서 공고를 읽어 CareerLens의 JobPosting과 기본 PatternProfile로 정규화합니다."
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

      {!isAdmin ? (
        <div className="lens-container py-8">
          <EmptyState
            title="관리자 권한이 필요한 화면입니다."
            description="외부 공고 API 조회와 DB 등록은 공고 데이터 품질에 직접 영향을 주므로 관리자 계정으로만 접근할 수 있습니다. 로컬 개발 환경에서는 login_id가 admin 또는 careerlens-admin인 계정을 생성해 사용합니다."
            action={<LinkButton href="/login">관리자 로그인</LinkButton>}
          />
        </div>
      ) : !user?.access_token ? (
        <div className="lens-container py-8">
          <EmptyState
            title="다시 로그인이 필요합니다"
            description="관리자 공고 API는 JWT 토큰으로 보호됩니다. 이전 버전에서 저장된 로그인 정보에는 토큰이 없을 수 있으니 admin 계정으로 다시 로그인해주세요."
            action={<LinkButton href="/login">관리자 로그인</LinkButton>}
          />
        </div>
      ) : (
      <div className="lens-container grid gap-6 py-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-brand">PROVIDER CONFIG</p>
            <h2 className="mt-2 text-lg font-semibold text-night">Greenhouse Board Token</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              예시로 `airbnb`, `doordashusa`, `reddit`처럼 Greenhouse 채용 페이지의 board token을 넣어 확인합니다. 국가/직무군은 실제 필터로 적용됩니다.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">검수된 board token 프리셋</p>
                <div className="grid max-h-[260px] gap-2 overflow-y-auto border border-line bg-panel p-2">
                  {greenhouseBoardPresets.map((preset) => (
                    <button
                      key={preset.boardToken}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, boardToken: preset.boardToken }))}
                      className={`border px-3 py-2 text-left text-xs transition hover:border-brand hover:bg-white ${
                        form.boardToken === preset.boardToken ? "border-brand bg-white text-brand" : "border-line bg-white text-slate-600"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-night">{preset.company}</span>
                      <span className="mt-1 block">{preset.boardToken} · {preset.domain}</span>
                      <span className="mt-1 block text-slate-500">{preset.note}</span>
                    </button>
                  ))}
                </div>
              </div>
              <TextInput
                label="Board token"
                helper="회사별 Greenhouse 채용보드 토큰"
                value={form.boardToken}
                onChange={(event) => setForm((current) => ({ ...current, boardToken: event.target.value }))}
              />
              <SelectInput
                label="국가 필터"
                value={form.defaultCountry}
                onChange={(event) => setForm((current) => ({ ...current, defaultCountry: event.target.value }))}
              >
                {countryFilters.map((country) => (
                  <option key={country} value={country}>
                    {country === "ALL" ? "전체 국가" : countryLabel(country)}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                label="직무군 필터"
                value={form.defaultJobFamily}
                onChange={(event) => setForm((current) => ({ ...current, defaultJobFamily: event.target.value }))}
              >
                <option value="ALL">전체 직무군</option>
                {jobFamilies.map((family) => (
                  <option key={family} value={family}>
                    {family}
                  </option>
                ))}
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
                helper="비워두면 공고별 내부 검토 마감일 자동 산정"
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
            <Button type="button" variant="secondary" className="mt-2 w-full" onClick={handleImportPresetSet} disabled={loading}>
              프리셋 10개 회사 기등록 공고 업데이트
            </Button>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              일괄 업데이트는 새 공고를 자동 저장하지 않고, 관리자가 이미 검증해 DB에 등록한 공고만 최신 원문 기준으로 갱신합니다.
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-brand">AUTO SYNC</p>
                <h2 className="mt-2 text-lg font-semibold text-night">자동 동기화 상태</h2>
              </div>
              <Badge tone={syncStatus?.enabled ? "success" : "muted"}>{syncStatus?.enabled ? "ON" : "OFF"}</Badge>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <StatusLine label="대상 board" value={syncStatus?.board_tokens?.length ? syncStatus.board_tokens.join(", ") : "미설정"} />
              <StatusLine label="동기화 주기" value={syncStatus?.fixed_delay_minutes ? `${syncStatus.fixed_delay_minutes}분` : "기본 360분"} />
              <StatusLine label="마지막 상태" value={syncStatus?.last_status ?? "IDLE"} />
              <StatusLine label="마지막 결과" value={syncStatus ? `가져옴 ${syncStatus.last_fetched_count} / 신규 ${syncStatus.last_imported_count} / 갱신 ${syncStatus.last_updated_count}` : "아직 없음"} />
              <p className="border border-line bg-panel p-3 text-xs leading-5 text-slate-500">
                {syncStatus?.last_message ?? "환경변수 GREENHOUSE_SYNC_ENABLED=true와 GREENHOUSE_SYNC_BOARD_TOKENS를 설정하면 서버 실행 중 자동으로 DB에 반영됩니다."}
              </p>
            </div>
            <Button type="button" variant="secondary" className="mt-4 w-full" onClick={handleRunSync} disabled={syncing}>
              {syncing ? "동기화 실행 중" : "수동 동기화 실행"}
            </Button>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-brand">DATA POLICY</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>공개 GET API만 사용합니다.</li>
              <li>지원서 제출 API는 사용하지 않습니다.</li>
              <li>관리자가 검수 후 DB에 등록하는 흐름을 전제로 합니다.</li>
              <li>추천 엔진은 외부 API가 아니라 내부 JobPosting만 봅니다.</li>
              <li>실제 발표에서는 seed-data와 API provider를 병행 구조로 설명합니다.</li>
            </ul>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold tracking-[0.16em] text-brand">AI REVIEW IDEA</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              다음 단계에서는 원문 공고, 정규화 결과, PatternProfile 초안을 AI에 넘겨 직무군/국가/기술스택/경력 추론 신뢰도를 점수화하고, 낮은 항목은 관리자 검수 대상으로 표시할 수 있습니다.
            </p>
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

          {previews.length > 0 && !importResult && (
            <Card className="p-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <MetricCard label="조회 공고" value={`${previews.length}개`} />
                <MetricCard label="선택 공고" value={`${selectedRefs.length}개`} />
                <MetricCard label="기등록" value={`${previews.filter((job) => job.already_imported).length}개`} />
                <MetricCard label="국가 수" value={`${new Set(previews.map((job) => job.country)).size}개`} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedRefs(previews.map((job) => job.external_ref))}
                >
                  전체 선택
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedRefs(previews.filter((job) => job.already_imported).map((job) => job.external_ref))}
                >
                  기등록만 선택
                </Button>
                <Button type="button" variant="secondary" onClick={() => setSelectedRefs([])}>
                  선택 해제
                </Button>
                <Button type="button" onClick={handleImport} disabled={loading || selectedRefs.length === 0}>
                  선택 공고만 DB 저장
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {Array.from(new Set(previews.map((job) => job.job_family))).map((family) => (
                  <Badge key={family} tone="brand">{family}</Badge>
                ))}
                {Array.from(new Set(previews.map((job) => job.country))).map((country) => (
                  <Badge key={country} tone="muted">{countryLabel(country)}</Badge>
                ))}
              </div>
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
                <ExternalJobCard
                  key={job.external_ref}
                  job={job}
                  selected={selectedRefs.includes(job.external_ref)}
                  onToggle={(checked) => {
                    setSelectedRefs((current) =>
                      checked
                        ? Array.from(new Set([...current, job.external_ref]))
                        : current.filter((ref) => ref !== job.external_ref)
                    );
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      )}
    </PageShell>
  );
}

function ExternalJobCard({
  job,
  selected,
  onToggle
}: {
  job: ExternalJobPreview;
  selected: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <label className="mb-3 flex w-fit items-center gap-2 border border-line bg-panel px-3 py-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={selected} onChange={(event) => onToggle(event.target.checked)} />
            검수 후 DB 저장 대상
          </label>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{job.provider}</Badge>
            <Badge tone="muted">{countryLabel(job.country)}</Badge>
            <Badge tone="muted">{job.job_family}</Badge>
            {job.already_imported ? <Badge tone="success">DB 등록됨</Badge> : <Badge tone="warning">신규 후보</Badge>}
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
          <Info label="근무형태" value={workTypeLabel(job.work_type)} />
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

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-night">{value}</span>
    </div>
  );
}

function toRequest(form: FormState, selectedExternalRefs?: string[], importNew = true) {
  return {
    board_token: form.boardToken.trim(),
    default_country: form.defaultCountry,
    default_job_family: form.defaultJobFamily,
    limit: Number.parseInt(form.limit, 10) || 8,
    default_deadline: form.defaultDeadline || undefined,
    create_pattern_profile: form.createPatternProfile,
    selected_external_refs: selectedExternalRefs,
    import_new: importNew
  };
}
