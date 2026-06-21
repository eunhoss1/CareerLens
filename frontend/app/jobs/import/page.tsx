"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  MetricCard,
  PageHeader,
  PageShell,
  SelectInput,
  TextInput,
} from "@/components/ui";
import { getStoredUser, isAdminUser, type AuthUser } from "@/lib/auth";
import {
  importGreenhouseJobs,
  fetchGreenhouseSyncStatus,
  previewGreenhouseJobs,
  runGreenhouseSync,
  type ExternalJobImportResponse,
  type ExternalJobPreview,
  type ExternalJobSyncStatus,
} from "@/lib/external-jobs";
import { countryLabel, workTypeLabel } from "@/lib/display-labels";
import {
  defaultGreenhouseBoardTokens,
  greenhouseBoardPresets,
} from "@/lib/greenhouse-board-registry";
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
  "Netherlands",
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
  createPatternProfile: true,
};

export default function JobImportPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [previews, setPreviews] = useState<ExternalJobPreview[]>([]);
  const [selectedRefs, setSelectedRefs] = useState<string[]>([]);
  const [importResult, setImportResult] =
    useState<ExternalJobImportResponse | null>(null);
  const [syncStatus, setSyncStatus] = useState<ExternalJobSyncStatus | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isAdmin = isAdminUser(user);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    if (!isAdminUser(storedUser)) return;
    fetchGreenhouseSyncStatus()
      .then(setSyncStatus)
      .catch(() => setSyncStatus(null));
  }, []);

  async function handlePreview() {
    setLoading(true);
    setErrorMessage("");
    setImportResult(null);
    try {
      const result = await previewGreenhouseJobs(toRequest(form));
      setPreviews(result);
      setSelectedRefs(
        result
          .filter((job) => job.already_imported)
          .map((job) => job.external_ref)
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Greenhouse 공고 미리보기 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setLoading(true);
    setErrorMessage("");
    try {
      if (selectedRefs.length === 0)
        throw new Error("DB에 저장할 공고를 먼저 선택해주세요.");
      const result = await importGreenhouseJobs(
        toRequest(form, selectedRefs, true)
      );
      setImportResult(result);
      setPreviews([]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Greenhouse 공고 등록 중 오류가 발생했습니다."
      );
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
      let fetched = 0,
        imported = 0,
        updated = 0;
      let lastResult: ExternalJobImportResponse | null = null;
      const failedTokens: string[] = [];
      for (const boardToken of defaultGreenhouseBoardTokens) {
        try {
          const result = await importGreenhouseJobs(
            toRequest({ ...form, boardToken, limit: "50" }, undefined, false)
          );
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
        jobs: lastResult?.jobs ?? [],
      });
      if (failedTokens.length > 0)
        setErrorMessage(
          `일부 board token 조회 실패: ${failedTokens.join(", ")}`
        );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Greenhouse 프리셋 일괄 등록 중 오류가 발생했습니다."
      );
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
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Greenhouse 자동 동기화 실행 중 오류가 발생했습니다."
      );
    } finally {
      setSyncing(false);
    }
  }

  return (
    <PageShell>
      {/* JOB PROVIDER 텍스트 스타일 수정 (박스 제거, 인디고 텍스트 적용) */}
      <style jsx global>{`
        .lens-kicker {
          border: none !important;
          background: transparent !important;
          color: #4f46e5 !important;
          padding: 0 !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          font-size: 11px !important;
        }
      `}</style>

      <PageHeader
        kicker="JOB PROVIDER"
        title="외부 공고 API 가져오기"
        description="관리자용 데이터 관리 화면입니다. Greenhouse 공개 Job Board API에서 공고를 읽어 CareerLens의 JobPosting과 기본 PatternProfile로 정규화합니다."
        actions={
          <>
            <Link
              href="/jobs"
              className="border border-line bg-white px-4 py-2 text-sm font-semibold text-night hover:border-night"
            >
              전체 공고로
            </Link>
            <Link
              href="/jobs/recommendation"
              className="bg-night px-4 py-2 text-sm font-semibold text-white hover:bg-[#24343a]"
            >
              추천 진단으로
            </Link>
          </>
        }
      />

      {!isAdmin ? (
        <div className="lens-container py-8">
          <EmptyState
            title="관리자 권한이 필요한 화면입니다."
            description="관리자 계정으로 접근 가능합니다."
            action={<LinkButton href="/login">관리자 로그인</LinkButton>}
          />
        </div>
      ) : !user?.access_token ? (
        <div className="lens-container py-8">
          <EmptyState
            title="다시 로그인이 필요합니다"
            description="JWT 토큰이 필요합니다."
            action={<LinkButton href="/login">관리자 로그인</LinkButton>}
          />
        </div>
      ) : (
        <div className="lens-container grid gap-6 py-8 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            <Card className="p-5">
              <p className="text-xs font-bold tracking-[0.16em] text-brand">
                PROVIDER CONFIG
              </p>
              <h2 className="mt-2 text-lg font-semibold text-night">
                Greenhouse Board Token
              </h2>
              <div className="mt-5 space-y-4">
                <TextInput
                  label="Board token"
                  value={form.boardToken}
                  onChange={(e) =>
                    setForm({ ...form, boardToken: e.target.value })
                  }
                />
                <SelectInput
                  label="국가 필터"
                  value={form.defaultCountry}
                  onChange={(e) =>
                    setForm({ ...form, defaultCountry: e.target.value })
                  }
                >
                  {countryFilters.map((c) => (
                    <option key={c} value={c}>
                      {c === "ALL" ? "전체 국가" : countryLabel(c)}
                    </option>
                  ))}
                </SelectInput>
                <SelectInput
                  label="직무군 필터"
                  value={form.defaultJobFamily}
                  onChange={(e) =>
                    setForm({ ...form, defaultJobFamily: e.target.value })
                  }
                >
                  <option value="ALL">전체 직무군</option>
                  {jobFamilies.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </SelectInput>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={handlePreview}
                    disabled={loading}
                  >
                    미리보기
                  </Button>
                  <Button onClick={handleImport} disabled={loading}>
                    DB 등록
                  </Button>
                </div>
              </div>
            </Card>
          </aside>

          <section className="space-y-5">
            {errorMessage && (
              <div className="border border-coral/30 bg-red-50 px-4 py-3 text-sm text-coral">
                {errorMessage}
              </div>
            )}
            {previews.map((job) => (
              <ExternalJobCard
                key={job.external_ref}
                job={job}
                selected={selectedRefs.includes(job.external_ref)}
                onToggle={(c: boolean) =>
                  setSelectedRefs(
                    c
                      ? [...selectedRefs, job.external_ref]
                      : selectedRefs.filter((r) => r !== job.external_ref)
                  )
                }
              />
            ))}
          </section>
        </div>
      )}
    </PageShell>
  );
}

function ExternalJobCard({ job, selected, onToggle }: any) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <label className="mb-3 flex w-fit items-center gap-2 border border-line bg-panel px-3 py-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onToggle(e.target.checked)}
            />
            검수 후 DB 저장 대상
          </label>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{job.provider}</Badge>
            <Badge tone="muted">{countryLabel(job.country)}</Badge>
            <Badge tone="muted">{job.job_family}</Badge>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-night">
            {job.company_name}
          </h2>
          <p className="mt-1 text-base text-ink">{job.job_title}</p>
        </div>
        <a
          href={job.source_url}
          target="_blank"
          className="border border-line px-3 py-2 text-sm text-night"
        >
          원문 보기
        </a>
      </div>
    </Card>
  );
}

function toRequest(form: FormState, refs?: string[], importNew = true) {
  return {
    board_token: form.boardToken.trim(),
    default_country: form.defaultCountry,
    default_job_family: form.defaultJobFamily,
    limit: Number.parseInt(form.limit, 10) || 8,
    create_pattern_profile: form.createPatternProfile,
    selected_external_refs: refs,
    import_new: importNew,
  };
}
