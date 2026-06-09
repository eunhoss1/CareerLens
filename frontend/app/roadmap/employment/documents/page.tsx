"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, PageHeader, PageShell, ScoreBar, SelectInput } from "@/components/ui";
import { isMembershipLimitMessage } from "@/lib/membership";
import { fetchUserRoadmaps, type PlannerTask } from "@/lib/planner";
import {
  verifyTaskFile,
  verifyTaskGithub,
  verifyTaskText,
  type VerificationBadge,
  type VerificationResult
} from "@/lib/verifications";

type SubmitMode = "TEXT" | "GITHUB" | "FILE";

type TaskOption = PlannerTask & {
  roadmapTitle: string;
  company: string;
  jobTitle: string;
};

export default function EmploymentDocumentsPage() {
  const auth = useRequiredAuth();
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [submitMode, setSubmitMode] = useState<SubmitMode>("TEXT");
  const [documentType, setDocumentType] = useState("RESUME");
  const [submittedText, setSubmittedText] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubNote, setGithubNote] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (auth.isChecking) {
      return;
    }
    if (!auth.user) {
      setIsLoadingTasks(false);
      return;
    }

    fetchUserRoadmaps(auth.user.user_id)
      .then((roadmaps) => {
        const options = roadmaps.flatMap((roadmap) =>
          roadmap.tasks.map((task) => ({
            ...task,
            roadmapTitle: roadmap.title,
            company: roadmap.target_company,
            jobTitle: roadmap.target_job_title
          }))
        );
        setTasks(options);
        setSelectedTaskId(options[0]?.task_id ?? null);
      })
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setIsLoadingTasks(false));
  }, [auth.isChecking, auth.user]);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.task_id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const selectedRoadmapTaskCount = useMemo(() => {
    if (!selectedTask) return 0;
    return tasks.filter((task) => task.roadmapTitle === selectedTask.roadmapTitle).length;
  }, [selectedTask, tasks]);

  async function handleAnalyze() {
    if (!selectedTask) {
      setErrorMessage("검증할 로드맵 과제를 먼저 선택하세요.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    setResult(null);
    try {
      if (submitMode === "TEXT") {
        if (submittedText.trim().length < 80) {
          throw new Error("분석할 문서 내용은 최소 80자 이상 입력하세요.");
        }
        setResult(await verifyTaskText({ taskId: selectedTask.task_id, documentType, submittedText }));
      }
      if (submitMode === "GITHUB") {
        if (!isRepositoryUrl(githubUrl)) {
          throw new Error("실제 GitHub 프로젝트 repository URL을 입력하세요. 예: https://github.com/owner/repository");
        }
        setResult(await verifyTaskGithub({ taskId: selectedTask.task_id, githubUrl, note: githubNote }));
      }
      if (submitMode === "FILE") {
        if (!selectedFile) {
          throw new Error("분석할 PDF 또는 DOCX 파일을 선택하세요.");
        }
        setResult(await verifyTaskFile({ taskId: selectedTask.task_id, documentType, file: selectedFile }));
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "문서 분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (auth.isChecking) {
    return <AuthCheckingScreen title="AI 문서 분석 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="AI 문서 분석은 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="AI DOCUMENT ANALYSIS"
        title="AI 문서 분석"
        actions={<LinkButton href="/roadmap/employment">취업로드맵으로</LinkButton>}
      />

      <main className="lens-container py-6">
        {isLoadingTasks ? (
          <EmptyState title="로드맵 과제를 불러오는 중입니다." description="생성된 커리어 플래너 과제를 기준으로 문서 분석 대상을 구성하고 있습니다." />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="분석할 로드맵 과제가 없습니다."
            description="적합도 진단 또는 전체 공고에서 로드맵을 먼저 생성하면 문서 분석을 사용할 수 있습니다."
            action={<LinkButton href="/jobs/recommendation">적합도 진단 시작</LinkButton>}
          />
        ) : (
          <div className="space-y-5">
            <DocumentTopPanel
              selectedTask={selectedTask}
              totalTaskCount={tasks.length}
              selectedRoadmapTaskCount={selectedRoadmapTaskCount}
              result={result}
            />

            <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <ReviewTargetPanel
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                selectedTask={selectedTask}
                documentType={documentType}
                onSelectTask={setSelectedTaskId}
                onSelectDocumentType={setDocumentType}
              />

              <section className="space-y-4">
                <SubmissionPanel
                  submitMode={submitMode}
                  submittedText={submittedText}
                  githubUrl={githubUrl}
                  githubNote={githubNote}
                  selectedFile={selectedFile}
                  isAnalyzing={isAnalyzing}
                  onSubmitModeChange={setSubmitMode}
                  onTextChange={setSubmittedText}
                  onGithubUrlChange={setGithubUrl}
                  onGithubNoteChange={setGithubNote}
                  onFileChange={setSelectedFile}
                  onAnalyze={handleAnalyze}
                />

                {errorMessage && (
                  <div role="alert" className="rounded-2xl border border-coral/30 bg-red-50 px-4 py-3 text-sm font-semibold text-coral">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span>{errorMessage}</span>
                      {isMembershipLimitMessage(errorMessage) && <LinkButton href="/membership">Pro 멤버십 보기</LinkButton>}
                    </div>
                  </div>
                )}

                {result ? (
                  <AnalysisResult result={result} />
                ) : (
                  <EmptyPreview />
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </PageShell>
  );
}

function DocumentTopPanel({
  selectedTask,
  totalTaskCount,
  selectedRoadmapTaskCount,
  result
}: {
  selectedTask: TaskOption | null;
  totalTaskCount: number;
  selectedRoadmapTaskCount: number;
  result: VerificationResult | null;
}) {
  return (
    <Card className="rounded-3xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Review Workspace</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-night">{selectedTask ? selectedTask.company : "제출물 점검"}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {selectedTask ? `${selectedTask.jobTitle} · ${selectedTask.week_number}주차 과제 기준` : "로드맵 과제를 선택해 문서 분석을 시작하세요."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricBox label="전체 과제" value={`${totalTaskCount}개`} />
          <MetricBox label="선택 로드맵" value={`${selectedRoadmapTaskCount}개`} />
          <MetricBox label="최근 점수" value={result ? `${result.verification_score}점` : "-"} />
        </div>
      </div>
    </Card>
  );
}

function ReviewTargetPanel({
  tasks,
  selectedTaskId,
  selectedTask,
  documentType,
  onSelectTask,
  onSelectDocumentType
}: {
  tasks: TaskOption[];
  selectedTaskId: number | null;
  selectedTask: TaskOption | null;
  documentType: string;
  onSelectTask: (taskId: number) => void;
  onSelectDocumentType: (documentType: string) => void;
}) {
  return (
    <aside className="h-fit space-y-4 xl:sticky xl:top-24">
      <Card className="rounded-3xl border-slate-200 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Review Target</p>
        <h2 className="mt-2 text-xl font-black text-night">점검 기준 선택</h2>
        <div className="mt-5 space-y-4">
          <SelectInput label="기준 과제" value={selectedTaskId ?? ""} onChange={(event) => onSelectTask(Number(event.target.value))}>
            {tasks.map((task) => (
              <option key={task.task_id} value={task.task_id}>
                {task.company} · {task.week_number}주차 · {shortTitle(task.title)}
              </option>
            ))}
          </SelectInput>
          <SelectInput label="문서 유형" value={documentType} onChange={(event) => onSelectDocumentType(event.target.value)}>
            <option value="RESUME">이력서</option>
            <option value="COVER_LETTER">자기소개서</option>
            <option value="PORTFOLIO">포트폴리오 설명</option>
            <option value="GITHUB_README">GitHub README</option>
            <option value="TASK_OUTPUT">과제 산출물</option>
          </SelectInput>
        </div>
      </Card>

      {selectedTask && (
        <Card className="rounded-3xl border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Review Brief</p>
          <h3 className="mt-3 text-lg font-black leading-7 text-night">{shortTitle(selectedTask.title)}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selectedTask.description}</p>
          <div className="mt-5 grid gap-3">
            <ReviewPoint label="확인할 내용" value={selectedTask.expected_outputs} />
            <ReviewPoint label="검증 기준" value={selectedTask.verification_criteria} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="muted">{selectedTask.week_number}주차</Badge>
            <Badge tone="muted">예상 {selectedTask.estimated_hours ?? 0}시간</Badge>
            <Badge tone="warning">{difficultyLabel(selectedTask.difficulty)}</Badge>
          </div>
        </Card>
      )}
    </aside>
  );
}

function SubmissionPanel({
  submitMode,
  submittedText,
  githubUrl,
  githubNote,
  selectedFile,
  isAnalyzing,
  onSubmitModeChange,
  onTextChange,
  onGithubUrlChange,
  onGithubNoteChange,
  onFileChange,
  onAnalyze
}: {
  submitMode: SubmitMode;
  submittedText: string;
  githubUrl: string;
  githubNote: string;
  selectedFile: File | null;
  isAnalyzing: boolean;
  onSubmitModeChange: (mode: SubmitMode) => void;
  onTextChange: (value: string) => void;
  onGithubUrlChange: (value: string) => void;
  onGithubNoteChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onAnalyze: () => void;
}) {
  return (
    <Card className="rounded-3xl border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Submit Evidence</p>
          <h2 className="mt-2 text-xl font-black text-night">제출물 입력</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
          <ModeButton active={submitMode === "TEXT"} label="직접 입력" onClick={() => onSubmitModeChange("TEXT")} />
          <ModeButton active={submitMode === "GITHUB"} label="GitHub 프로젝트" onClick={() => onSubmitModeChange("GITHUB")} />
          <ModeButton active={submitMode === "FILE"} label="파일 업로드" onClick={() => onSubmitModeChange("FILE")} />
        </div>
      </div>

      <div className="mt-5">
        {submitMode === "TEXT" && (
          <label className="block">
            <span className="text-sm font-black text-night">검토할 내용</span>
            <textarea
              className="mt-2 min-h-[340px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              placeholder="이력서 bullet, 자기소개서 문단, README 주요 내용, 포트폴리오 설명을 붙여넣으세요."
              value={submittedText}
              onChange={(event) => onTextChange(event.target.value)}
            />
            <span className="mt-2 block text-xs font-semibold text-slate-500">{submittedText.trim().length}자 입력</span>
          </label>
        )}

        {submitMode === "GITHUB" && (
          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-black text-night">GitHub repository URL</span>
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                placeholder="https://github.com/owner/repository"
                value={githubUrl}
                onChange={(event) => onGithubUrlChange(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-black text-night">프로젝트 설명 메모</span>
              <textarea
                className="mt-2 min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                placeholder="본인이 구현한 부분, 공고와 연결되는 기능, 실행 가능한 결과물을 적어주세요."
                value={githubNote}
                onChange={(event) => onGithubNoteChange(event.target.value)}
              />
            </label>
          </div>
        )}

        {submitMode === "FILE" && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-[#f8fbfa] p-6">
            <p className="text-base font-black text-night">PDF 또는 DOCX 파일</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              이력서, 자기소개서, 포트폴리오 설명, README를 PDF/DOCX로 올리면 공고 과제 기준으로 분석합니다.
            </p>
            <input
              className="mt-5 block w-full text-sm font-semibold text-slate-700 file:mr-4 file:rounded-xl file:border file:border-slate-200 file:bg-white file:px-4 file:py-2 file:text-sm file:font-black file:text-night"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
            {selectedFile && <p className="mt-3 text-xs font-semibold text-slate-500">선택 파일: {selectedFile.name}</p>}
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="button" className="rounded-2xl px-6" onClick={onAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? "분석 중" : "제출물 분석"}
        </Button>
      </div>
    </Card>
  );
}

function AnalysisResult({ result }: { result: VerificationResult }) {
  const score = result.verification_score ?? 0;

  return (
    <Card className="rounded-3xl border-slate-200 p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Analysis Result</p>
          <h3 className="mt-2 text-2xl font-black text-night">문서 검증 결과</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{result.analysis_summary}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#f8fbfa] p-4">
          <ScoreBar label="검증 점수" value={score} tone={scoreTone(score)} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="muted">{result.reviewer_mode}</Badge>
            <Badge tone="success">{result.status}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoBlock title="강점" value={result.strengths} />
        <InfoBlock title="보완할 점" value={result.improvement_items} />
      </div>

      {result.issued_badges?.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f8fbfa] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-night">발급된 검증 배지</p>
            <LinkButton href="/mypage/badges" variant="secondary" className="min-h-8 rounded-xl px-3 py-1 text-xs">
              배지 보기
            </LinkButton>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {result.issued_badges.map((badge) => (
              <BadgeCard key={badge.badge_id} badge={badge} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function EmptyPreview() {
  return (
    <Card className="rounded-3xl border-slate-200 p-8 text-center shadow-sm">
      <p className="text-lg font-black text-night">아직 분석 결과가 없습니다.</p>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        과제 기준과 제출물을 선택한 뒤 분석을 실행하면 강점, 보완점, 검증 점수가 이 영역에 표시됩니다.
      </p>
    </Card>
  );
}

function BadgeCard({ badge }: { badge: VerificationBadge }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-black text-night">{badge.label}</p>
        <Badge tone={badgeTone(badge.badge_type)}>{badge.score_at_issue}점</Badge>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{badge.description}</p>
    </div>
  );
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`min-h-12 rounded-2xl border px-4 py-3 text-sm font-black transition ${
        active ? "border-night bg-night text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function ReviewPoint({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f8fbfa] p-4">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-night">{value || "미기재"}</p>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f8fbfa] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">{title}</p>
      <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-slate-700">{value || "미기재"}</p>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-panel px-4 py-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-night">{value}</p>
    </div>
  );
}

function difficultyLabel(value?: string) {
  if (value === "EASY") return "난이도 낮음";
  if (value === "HARD") return "난이도 높음";
  return "난이도 보통";
}

function scoreTone(value: number) {
  if (value >= 80) return "success";
  if (value >= 60) return "warning";
  return "risk";
}

function badgeTone(type: string) {
  if (type.includes("GOLD") || type.includes("GITHUB")) return "success";
  if (type.includes("SILVER")) return "brand";
  return "warning";
}

function shortTitle(title: string) {
  return title
    .replaceAll("PatternProfile", "직무 패턴")
    .replaceAll("공고 요구사항과 직무 패턴 근거 정리", "공고 요구사항 정리")
    .replaceAll("공고 요구사항과 PatternProfile 근거 정리", "공고 요구사항 정리");
}

function isRepositoryUrl(value: string) {
  return /^https:\/\/(?:www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(value.trim());
}
