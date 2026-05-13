"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, PageHeader, PageShell, ScoreBar, SelectInput } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
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
    const user = getStoredUser();
    if (!user) {
      setIsLoadingTasks(false);
      return;
    }

    fetchUserRoadmaps(user.user_id)
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
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.task_id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  async function handleAnalyze() {
    if (!selectedTask) {
      setErrorMessage("검증할 플래너 과제를 먼저 선택하세요.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");
    setResult(null);
    try {
      if (submitMode === "TEXT") {
        if (submittedText.trim().length < 80) {
          throw new Error("분석할 문서 내용을 최소 80자 이상 입력하세요.");
        }
        setResult(await verifyTaskText({ taskId: selectedTask.task_id, documentType, submittedText }));
      }
      if (submitMode === "GITHUB") {
        if (!isRepositoryUrl(githubUrl)) {
          throw new Error("GitHub 프로필 주소가 아니라 https://github.com/owner/repository 형태의 실제 프로젝트 repository URL을 입력하세요.");
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

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="AI DOCUMENT ANALYSIS"
        title="AI 문서 분석"
        actions={<LinkButton href="/roadmap/employment">취업로드맵으로</LinkButton>}
      />

      <section className="lens-container py-6">
        {isLoadingTasks ? (
          <EmptyState title="로드맵 과제를 불러오는 중입니다" description="생성된 커리어 플래너 과제를 기준으로 문서 분석 대상을 구성합니다." />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="분석할 플래너 과제가 없습니다"
            description="맞춤채용정보 진단 또는 전체 공고에서 로드맵을 먼저 생성하면 문서 점검을 사용할 수 있습니다."
            action={<LinkButton href="/jobs/recommendation">추천 진단 시작</LinkButton>}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
            <aside className="space-y-4">
              <Card className="rounded-2xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-extrabold tracking-[0.14em] text-brand">REVIEW TARGET</p>
                <h2 className="mt-3 text-xl font-bold text-night">점검 기준 선택</h2>

                <div className="mt-5 space-y-4">
                  <SelectInput
                    label="기준 과제"
                    value={selectedTaskId ?? ""}
                    onChange={(event) => setSelectedTaskId(Number(event.target.value))}
                  >
                    {tasks.map((task) => (
                      <option key={task.task_id} value={task.task_id}>
                        {task.company} · {task.week_number}주차 · {publicTaskTitle(task.title)}
                      </option>
                    ))}
                  </SelectInput>
                  <SelectInput label="문서 유형" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                    <option value="RESUME">이력서</option>
                    <option value="COVER_LETTER">자기소개서</option>
                    <option value="PORTFOLIO">포트폴리오 설명</option>
                    <option value="GITHUB_README">GitHub README</option>
                    <option value="TASK_OUTPUT">과제 산출물</option>
                  </SelectInput>
                </div>
              </Card>

              {selectedTask && (
                <Card className="rounded-2xl border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-extrabold tracking-[0.14em] text-brand">REVIEW BRIEF</p>
                  <h3 className="mt-3 text-lg font-bold text-night">{selectedTask.company}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{selectedTask.jobTitle}</p>
                  <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-500">이번 점검 목표</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-night">{publicTaskTitle(selectedTask.title)}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{publicTaskDescription(selectedTask.description)}</p>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm">
                    <ReviewPoint title="공고와의 연결성" description="요구 기술과 경험이 제출물에 드러나는지 확인합니다." />
                    <ReviewPoint title="증빙의 구체성" description="프로젝트, 수치, 역할, 결과가 충분히 설명되는지 봅니다." />
                    <ReviewPoint title="수정 우선순위" description="바로 고칠 항목과 보완이 필요한 항목을 나눕니다." />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="muted">{selectedTask.week_number}주차</Badge>
                    <Badge tone="muted">{selectedTask.estimated_hours ?? 0}시간 예상</Badge>
                    <Badge tone="warning">{difficultyLabel(selectedTask.difficulty)}</Badge>
                  </div>
                </Card>
              )}
            </aside>

            <div className="space-y-4">
              <Card className="rounded-2xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="grid gap-2 sm:grid-cols-3">
                  <ModeButton active={submitMode === "TEXT"} onClick={() => setSubmitMode("TEXT")} label="직접 입력" />
                  <ModeButton active={submitMode === "GITHUB"} onClick={() => setSubmitMode("GITHUB")} label="GitHub 프로젝트" />
                  <ModeButton active={submitMode === "FILE"} onClick={() => setSubmitMode("FILE")} label="파일 업로드" />
                </div>

                <div className="mt-5">
                  {submitMode === "TEXT" && (
                    <label className="block">
                      <span className="text-sm font-semibold text-night">검토할 내용</span>
                      <textarea
                        className="mt-2 min-h-[360px] w-full rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                        placeholder="이력서 bullet, 자기소개서 문단, README 주요 내용, 포트폴리오 설명을 붙여넣으세요."
                        value={submittedText}
                        onChange={(event) => setSubmittedText(event.target.value)}
                      />
                      <span className="mt-2 block text-xs text-slate-500">{submittedText.trim().length}자 입력됨</span>
                    </label>
                  )}

                  {submitMode === "GITHUB" && (
                    <div className="space-y-4">
                      <label className="block">
                        <span className="text-sm font-semibold text-night">GitHub 프로젝트 repository URL</span>
                        <input
                          className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                          placeholder="https://github.com/owner/repository"
                          value={githubUrl}
                          onChange={(event) => setGithubUrl(event.target.value)}
                        />
                        <span className="mt-2 block text-xs text-slate-500">프로필 주소, 조직 홈, topic 주소는 허용하지 않습니다.</span>
                      </label>
                      <label className="block">
                        <span className="text-sm font-semibold text-night">프로젝트 설명 메모</span>
                        <textarea
                          className="mt-2 min-h-[160px] w-full rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                          placeholder="이 repository에서 본인이 구현한 부분, 과제와 연결되는 기능, 실행 가능한 결과물을 적어주세요."
                          value={githubNote}
                          onChange={(event) => setGithubNote(event.target.value)}
                        />
                      </label>
                    </div>
                  )}

                  {submitMode === "FILE" && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-semibold text-night">PDF 또는 DOCX 파일</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        이력서, 자기소개서, 프로젝트 사례서, README를 PDF/DOCX로 올리면 텍스트를 추출해 점검합니다. 최대 5MB까지 지원합니다.
                      </p>
                      <input
                        className="mt-4 block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-night"
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                      />
                      {selectedFile && <p className="mt-3 text-xs text-slate-500">선택됨: {selectedFile.name}</p>}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <Button type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? "분석 중" : "제출물 분석"}
                  </Button>
                </div>
              </Card>

              {errorMessage && (
                <div role="alert" className="border border-coral/30 bg-red-50 px-4 py-3 text-sm font-medium text-coral">
                  {errorMessage}
                </div>
              )}

              {result && <AnalysisResult result={result} />}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function AnalysisResult({ result }: { result: VerificationResult }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-brand">ANALYSIS RESULT</p>
          <h3 className="mt-2 text-xl font-semibold text-night">문서 검증 결과</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{result.analysis_summary}</p>
        </div>
        <div className="min-w-[170px] border border-line bg-panel p-4">
          <ScoreBar label="검증 점수" value={result.verification_score ?? 0} tone={scoreTone(result.verification_score ?? 0)} />
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoBlock title="좋은 점" value={result.strengths} />
        <InfoBlock title="보완할 점" value={result.improvement_items} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone="muted">{result.reviewer_mode}</Badge>
        <Badge tone="success">{result.status}</Badge>
        <Badge tone="brand">{result.request_type}</Badge>
      </div>
      {result.issued_badges?.length > 0 && (
        <div className="mt-5 border border-line bg-panel p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-night">발급된 검증 배지</p>
            <LinkButton href="/mypage/badges" variant="secondary" className="min-h-8 px-3 py-1 text-xs">
              배지함 보기
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

function BadgeCard({ badge }: { badge: VerificationBadge }) {
  return (
    <div className="border border-line bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-night">{badge.label}</p>
        <Badge tone={badgeTone(badge.badge_type)}>{badge.score_at_issue}점</Badge>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{badge.description}</p>
      <p className="mt-2 text-xs text-slate-500">{badge.badge_type}</p>
    </div>
  );
}

function ModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
        active ? "border-night bg-night text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-night"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ReviewPoint({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className="text-sm font-bold text-night">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value?: string }) {
  return (
    <div className="border border-line bg-panel p-3">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{value || "미기재"}</p>
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

function publicTaskTitle(title: string) {
  return title
    .replaceAll("PatternProfile", "직무 패턴")
    .replace("공고 요구사항과 직무 패턴 근거 정리", "공고 요구사항 정리")
    .replace("공고 요구사항과 PatternProfile 근거 정리", "공고 요구사항 정리");
}

function publicTaskDescription(description: string) {
  return description
    .replaceAll("PatternProfile", "직무 패턴")
    .replaceAll("내 프로필", "내 프로필")
    .replace(/이 문서는 이후.*$/, "이 내용을 기준으로 제출물을 점검합니다.");
}

function isRepositoryUrl(value: string) {
  return /^https:\/\/(?:www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(value.trim());
}
