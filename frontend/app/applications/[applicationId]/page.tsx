"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  MetricCard,
  PageHeader,
  PageShell,
  ScoreBar,
  SectionHeader
} from "@/components/ui";
import {
  fetchApplication,
  updateApplicationStatus,
  updateApplicationWorkspace,
  type ApplicationRecord,
  type ApplicationStatus
} from "@/lib/applications";

const statusOptions: Array<{ value: ApplicationStatus; label: string; description: string }> = [
  { value: "INTERESTED", label: "관심 공고", description: "지원 후보로 저장" },
  { value: "PREPARING_DOCUMENTS", label: "서류 준비", description: "제출 패키지 정리" },
  { value: "APPLIED", label: "지원 완료", description: "외부 Apply 제출 완료" },
  { value: "INTERVIEW", label: "면접 진행", description: "면접/과제 대응" },
  { value: "CLOSED", label: "종료", description: "결과 회고 및 마감" }
];

export default function ApplicationWorkspacePage() {
  const params = useParams<{ applicationId: string }>();
  const applicationId = Number(params.applicationId);
  const [record, setRecord] = useState<ApplicationRecord | null>(null);
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    setIsLoading(true);
    setErrorMessage(null);
    fetchApplication(applicationId)
      .then((data) => {
        setRecord(data);
        setNotes(data.candidate_notes ?? "");
        setNextAction(data.next_action ?? "");
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "지원 워크스페이스를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [applicationId]);

  const completedDocuments = useMemo(() => {
    return record?.document_checklist.filter((item) => item.status === "DONE" || item.status === "VERIFIED").length ?? 0;
  }, [record]);

  async function changeStatus(status: ApplicationStatus) {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateApplicationStatus(record.application_id, status);
      setRecord(updated);
      setNextAction(updated.next_action ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "지원 상태를 변경하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveWorkspace() {
    if (!record) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = await updateApplicationWorkspace(record.application_id, {
        candidate_notes: notes,
        next_action: nextAction
      });
      setRecord(updated);
      setNotes(updated.candidate_notes ?? "");
      setNextAction(updated.next_action ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "지원 메모를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="APPLICATION WORKSPACE"
        title="지원 워크스페이스"
        description="공고 원문, 제출 서류, 로드맵 진행도, 다음 액션을 한 화면에서 관리합니다. 실제 제출은 공식 Apply 페이지에서 진행합니다."
        actions={
          <>
            <LinkButton href="/applications" variant="secondary">지원관리 목록</LinkButton>
            <LinkButton href="/roadmap/employment/documents" variant="secondary">AI 문서 분석</LinkButton>
            {record?.application_url && (
              <a
                href={record.application_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center justify-center bg-night px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#24343a]"
              >
                외부 Apply 페이지 열기
              </a>
            )}
          </>
        }
      />

      <section className="lens-container py-6">
        {isLoading && <EmptyState title="지원 워크스페이스를 불러오는 중입니다." description="공고와 지원 준비 데이터를 확인하고 있습니다." />}
        {errorMessage && (
          <div className="mb-5">
            <EmptyState title="요청을 처리하지 못했습니다." description={errorMessage} />
          </div>
        )}

        {record && (
          <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
            <aside className="h-fit space-y-4 lg:sticky lg:top-5">
              <Card className="p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={deadlineTone(record.deadline_status)}>{deadlineLabel(record)}</Badge>
                  <Badge tone={statusTone(record.status)}>{statusLabel(record.status)}</Badge>
                  <Badge tone="muted">{record.job_family}</Badge>
                </div>
                <p className="mt-4 text-sm font-semibold text-brand">{record.company_name}</p>
                <h1 className="mt-1 text-2xl font-semibold leading-8 text-night">{record.job_title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">{record.country} · {record.work_type} · {record.salary_range || "연봉 미기재"}</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MetricCard label="지원 준비도" value={`${record.readiness_score}점`} />
                  <MetricCard label="로드맵 완료" value={`${record.roadmap_completion_rate}%`} />
                  <MetricCard label="완료 과제" value={`${record.completed_task_count}/${record.total_task_count}`} />
                  <MetricCard label="검증 과제" value={`${record.verified_task_count}개`} />
                </div>

                <div className="mt-5 space-y-3">
                  <ScoreBar label="지원 준비도" value={record.readiness_score} tone={scoreTone(record.readiness_score)} />
                  <ScoreBar label="로드맵 완료율" value={record.roadmap_completion_rate} tone="brand" />
                </div>
              </Card>

              <Card className="p-5">
                <p className="lens-kicker">STATUS</p>
                <div className="mt-4 space-y-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isSaving}
                      onClick={() => changeStatus(option.value)}
                      className={`w-full border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        record.status === option.value
                          ? "border-night bg-night text-white"
                          : "border-line bg-white text-night hover:border-night"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className={`mt-1 block text-xs ${record.status === option.value ? "text-white/75" : "text-slate-500"}`}>{option.description}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </aside>

            <div className="space-y-5">
              <Card className="p-5">
                <SectionHeader
                  kicker="JOB EVIDENCE"
                  title="공고 원문 기반 지원 요약"
                  description="CareerLens에 저장된 공고 정보와 외부 공고 링크를 기준으로 지원 준비 기준을 정리합니다."
                  actions={record.application_url ? (
                    <a href={record.application_url} target="_blank" rel="noreferrer" className="border border-line bg-white px-4 py-2 text-sm font-semibold text-night hover:border-night">
                      원문 공고 확인
                    </a>
                  ) : undefined}
                />
                <div className="mt-5 border border-line bg-panel p-4 text-sm leading-6 text-slate-700">{record.company_brief}</div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <InfoBox label="비자 조건" value={record.risk_notes.some((item) => item.includes("비자")) ? "원문 확인 필요" : "공고 정보 기준 확인"} />
                  <InfoBox label="마감 상태" value={deadlineLabel(record)} />
                  <InfoBox label="외부 출처" value={record.external_ref?.startsWith("greenhouse:") ? "Greenhouse 공개 공고" : "수동/seed 공고"} />
                  <InfoBox label="지원 링크" value={record.application_url ? "공식 Apply 링크 연결 가능" : "원문 링크 미기재"} />
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeader
                  kicker="APPLICATION PACKAGE"
                  title="제출 패키지 체크리스트"
                  description="커리어 플래너 과제와 AI 검증 결과를 지원 서류 준비 상태로 연결합니다."
                  actions={<Badge tone="brand">{completedDocuments}/{record.document_checklist.length} 준비됨</Badge>}
                />
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {record.document_checklist.map((item) => (
                    <div key={item.key} className="border border-line bg-panel p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold text-night">{item.label}</h3>
                        <Badge tone={documentTone(item.status)}>{documentLabel(item.status)}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.helper_text}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeader
                  kicker="FOCUS"
                  title="지원 전 확인할 항목"
                  description="현재 준비도와 공고 특성 기준으로 우선 확인해야 하는 항목입니다."
                />
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  <Checklist title="우선 액션" items={record.workspace_focus_items} tone="brand" />
                  <Checklist title="리스크 메모" items={record.risk_notes.length > 0 ? record.risk_notes : ["현재 기록된 주요 리스크가 없습니다."]} tone="warning" />
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeader
                  kicker="WORK NOTES"
                  title="지원 메모와 다음 액션"
                  description="외부 Apply 페이지에서 확인한 요구사항, 제출일, 채용 담당자 응답, 보완점을 기록합니다."
                />
                <div className="mt-5 grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">다음 액션</span>
                    <textarea
                      value={nextAction}
                      onChange={(event) => setNextAction(event.target.value)}
                      className="min-h-24 w-full border border-line bg-white p-3 text-sm leading-6 text-ink focus:border-brand"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">지원 메모</span>
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="예: Apply 페이지에서 확인한 추가 질문, 제출한 파일명, 담당자 응답, 면접 일정 등을 기록"
                      className="min-h-36 w-full border border-line bg-white p-3 text-sm leading-6 text-ink focus:border-brand"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" disabled={isSaving} onClick={saveWorkspace}>
                    {isSaving ? "저장 중" : "워크스페이스 저장"}
                  </Button>
                  <LinkButton href="/roadmap/employment/documents" variant="secondary">AI 문서 분석으로 이동</LinkButton>
                  {record.roadmap_id && <LinkButton href={`/planner/${record.roadmap_id}`} variant="subtle">연결된 로드맵 보기</LinkButton>}
                </div>
              </Card>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-night">{value}</p>
    </div>
  );
}

function Checklist({ title, items, tone }: { title: string; items: string[]; tone: "brand" | "warning" }) {
  return (
    <div className="border border-line bg-panel p-4">
      <h3 className="text-base font-semibold text-night">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
            <Badge tone={tone} className="mt-0.5">확인</Badge>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusLabel(status: ApplicationStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function statusTone(status: ApplicationStatus) {
  if (status === "APPLIED" || status === "INTERVIEW") return "brand";
  if (status === "CLOSED") return "muted";
  if (status === "PREPARING_DOCUMENTS") return "warning";
  return "default";
}

function deadlineLabel(record: ApplicationRecord) {
  if (record.deadline_status === "ONGOING") return "상시/미기재";
  if (record.deadline_status === "EXPIRED") return "마감";
  if (record.days_until_deadline === 0) return "오늘 마감";
  return `D-${record.days_until_deadline}`;
}

function deadlineTone(status: ApplicationRecord["deadline_status"]) {
  if (status === "URGENT" || status === "EXPIRED") return "risk";
  if (status === "SOON") return "warning";
  return "muted";
}

function documentLabel(status: string) {
  if (status === "VERIFIED") return "검증됨";
  if (status === "DONE") return "완료";
  return "준비 전";
}

function documentTone(status: string) {
  if (status === "VERIFIED") return "brand";
  if (status === "DONE") return "success";
  return "muted";
}

function scoreTone(score: number) {
  if (score >= 80) return "success";
  if (score >= 65) return "brand";
  if (score >= 50) return "warning";
  return "risk";
}
