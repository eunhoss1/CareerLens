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

type AssistantStatus = "READY" | "CHECK" | "AI_DRAFT" | "EXTERNAL" | "SENSITIVE";

type AssistantField = {
  label: string;
  description: string;
  status: AssistantStatus;
  source: string;
};

type AssistantSection = {
  title: string;
  description: string;
  fields: AssistantField[];
};

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

  const assistantSections = useMemo(() => {
    return record ? buildApplyAssistant(record) : [];
  }, [record]);

  const assistantSummary = useMemo(() => {
    const fields = assistantSections.flatMap((section) => section.fields);
    return {
      total: fields.length,
      ready: fields.filter((field) => field.status === "READY").length,
      aiDraft: fields.filter((field) => field.status === "AI_DRAFT").length,
      check: fields.filter((field) => field.status === "CHECK").length,
      sensitive: fields.filter((field) => field.status === "SENSITIVE").length
    };
  }, [assistantSections]);

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
        description="공고 원문, 제출 서류, 로드맵 진행도, 실제 Apply Form 준비 항목을 한 화면에서 관리합니다. CareerLens는 지원서 작성을 보조하고, 최종 제출은 공식 Apply 페이지에서 진행합니다."
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
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {record.country} · {record.work_type} · {record.salary_range || "연봉 미기재"}
                </p>

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

              <Card className="p-5">
                <p className="lens-kicker">APPLY FORM</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MetricCard label="확인 항목" value={`${assistantSummary.total}개`} />
                  <MetricCard label="AI 초안" value={`${assistantSummary.aiDraft}개`} />
                  <MetricCard label="확인 필요" value={`${assistantSummary.check}개`} />
                  <MetricCard label="민감정보 제외" value={`${assistantSummary.sensitive}개`} />
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
                  kicker="APPLY FORM ASSISTANT"
                  title="실제 지원서 입력 항목 대비표"
                  description="Webflow, Mixpanel, GitLab, Duolingo, Discord, Asana, DoorDash, Figma, Databricks, Reddit, Anthropic 지원폼에서 반복되는 공통 구조를 기준으로 준비 항목을 나눴습니다."
                  actions={<LinkButton href="/roadmap/employment/documents" variant="secondary">AI 답변 초안 준비</LinkButton>}
                />
                <div className="mt-5 grid gap-3 md:grid-cols-5">
                  <MetricCard label="자동/프로필 기반" value={`${assistantSummary.ready}개`} helper="마이페이지 정보로 준비 가능" />
                  <MetricCard label="사용자 확인" value={`${assistantSummary.check}개`} helper="외부 Apply에서 직접 확인" />
                  <MetricCard label="AI 초안" value={`${assistantSummary.aiDraft}개`} helper="Why/Additional 답변" />
                  <MetricCard label="외부 입력" value={`${assistantSummary.total - assistantSummary.ready - assistantSummary.check - assistantSummary.aiDraft - assistantSummary.sensitive}개`} helper="파일/ATS 입력" />
                  <MetricCard label="민감정보" value={`${assistantSummary.sensitive}개`} helper="자동화 제외" />
                </div>

                <div className="mt-5 space-y-4">
                  {assistantSections.map((section) => (
                    <ApplyAssistantSection key={section.title} section={section} />
                  ))}
                </div>

                <div className="mt-5 border border-amber/30 bg-amber-50 p-4 text-sm leading-6 text-amber">
                  EEO, 장애, 군복무, 성별, 인종/민족, 성적 지향 등 선택형 인구통계 항목은 민감정보입니다. CareerLens는 해당 항목을 자동 작성하거나 추천하지 않고, 사용자가 외부 Apply 페이지에서 직접 판단하도록 안내합니다.
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

function ApplyAssistantSection({ section }: { section: AssistantSection }) {
  return (
    <section className="border border-line bg-panel p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-night">{section.title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{section.description}</p>
        </div>
        <Badge tone="muted">{section.fields.length}개 항목</Badge>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {section.fields.map((field) => (
          <div key={`${section.title}-${field.label}`} className="border border-line bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-night">{field.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{field.source}</p>
              </div>
              <Badge tone={assistantTone(field.status)}>{assistantLabel(field.status)}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{field.description}</p>
          </div>
        ))}
      </div>
    </section>
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

function buildApplyAssistant(record: ApplicationRecord): AssistantSection[] {
  const company = record.company_name || "지원 기업";
  const jobTitle = record.job_title || "지원 직무";
  const hasPortfolio = record.document_checklist.some((item) => item.key === "portfolio" && (item.status === "DONE" || item.status === "VERIFIED"));
  const hasGithub = record.document_checklist.some((item) => item.key === "github" && item.status === "VERIFIED");
  const hasResume = record.document_checklist.some((item) => item.key === "resume" && (item.status === "DONE" || item.status === "VERIFIED"));
  const visaUnclear = !record.risk_notes.every((note) => !note.includes("비자"));

  return [
    {
      title: "기본 정보",
      description: "대부분의 ATS에서 반복되는 이름, 이메일, 연락처, 현재 위치 항목입니다.",
      fields: [
        {
          label: "First Name / Last Name",
          description: "회원 기본 정보와 영문 표기명을 기준으로 외부 Apply 페이지에 직접 입력합니다.",
          status: "READY",
          source: "Webflow, GitLab, Discord, DoorDash, Figma 공통"
        },
        {
          label: "Email / Phone / Country",
          description: "마이페이지의 이메일, 국가, 전화번호 정보를 기준으로 확인합니다. 전화번호 국가 코드는 외부 Apply에서 직접 검토해야 합니다.",
          status: "CHECK",
          source: "모든 샘플 Apply Form 공통"
        },
        {
          label: "Location / City",
          description: "근무 가능 지역, 현재 거주지, 재배치 의사를 묻는 항목과 연결됩니다.",
          status: "CHECK",
          source: "Webflow, Discord, Asana, Figma 공통"
        }
      ]
    },
    {
      title: "제출 자료",
      description: "Resume/CV, Cover Letter, LinkedIn, Website, GitHub 등 제출 패키지 준비 상태입니다.",
      fields: [
        {
          label: "Resume / CV",
          description: hasResume ? "이력서 준비 기록이 있습니다. 외부 Apply에는 파일 업로드 또는 직접 입력 방식으로 제출합니다." : "영문 이력서 준비가 필요합니다. AI 문서 분석에서 공고 키워드 반영 여부를 먼저 확인하세요.",
          status: hasResume ? "READY" : "CHECK",
          source: "모든 샘플 Apply Form 공통"
        },
        {
          label: "Cover Letter / Additional Information",
          description: `${company}와 ${jobTitle}에 맞춘 커버레터 또는 추가 설명 문장은 AI 초안 생성 대상으로 분리하는 것이 좋습니다.`,
          status: "AI_DRAFT",
          source: "Webflow, Mixpanel, GitLab, Discord, Asana, DoorDash, Reddit 공통"
        },
        {
          label: "LinkedIn Profile",
          description: "대부분 선택 또는 필수에 가깝게 요구됩니다. 프로필 URL과 이력서 내용의 일관성을 확인하세요.",
          status: "CHECK",
          source: "GitLab, Discord, Asana, DoorDash, Figma, Databricks, Reddit 공통"
        },
        {
          label: "Website / GitHub / Portfolio",
          description: hasGithub || hasPortfolio ? "프로젝트 링크 준비 기록이 있습니다. README와 대표 성과가 공고 요구 기술과 연결되는지 확인하세요." : "포트폴리오 또는 GitHub 검증 기록이 부족합니다. AI 문서 분석/GitHub 검증으로 보강하세요.",
          status: hasGithub || hasPortfolio ? "READY" : "CHECK",
          source: "Webflow, Figma, Asana, Databricks 공통"
        }
      ]
    },
    {
      title: "근무 조건 / 비자",
      description: "해외취업 지원에서 반복적으로 등장하는 근무 자격, 비자 스폰서십, 시작 가능 시점, 재배치 관련 항목입니다.",
      fields: [
        {
          label: "Work Authorization",
          description: "지원 국가에서 합법적으로 근무 가능한지 묻는 항목입니다. 사용자가 직접 사실관계를 확인해야 합니다.",
          status: "CHECK",
          source: "Webflow, Mixpanel, GitLab, Discord, DoorDash, Figma, Databricks, Reddit 공통"
        },
        {
          label: "Visa Sponsorship",
          description: visaUnclear ? "공고의 비자 조건이 명확하지 않습니다. 외부 Apply의 스폰서십 질문을 직접 확인하세요." : "비자 조건 메모를 기준으로 답변 방향을 정리하되, 최종 선택은 사용자가 직접 해야 합니다.",
          status: "CHECK",
          source: "Anthropic, Webflow, GitLab, DoorDash, Databricks, Reddit 공통"
        },
        {
          label: "Start Date / Timeline",
          description: "입사 가능 시점과 개인 일정 제약을 묻는 항목입니다. 마이페이지 입사 가능 시점과 일치하는지 확인합니다.",
          status: "CHECK",
          source: "Anthropic, DoorDash, Asana 계열 폼에서 반복"
        },
        {
          label: "Relocation / Office Availability",
          description: "현지 오피스 근무, 하이브리드, 재배치 가능 여부를 묻습니다. 공고의 근무 형태와 사용자 선호 조건을 비교하세요.",
          status: "CHECK",
          source: "Anthropic, Discord, Figma, DoorDash 공통"
        }
      ]
    },
    {
      title: "회사별 질문",
      description: "회사마다 표현은 다르지만 Why company, How did you hear, Previous employment/interview 질문이 반복됩니다.",
      fields: [
        {
          label: `Why ${company}?`,
          description: `${company}의 제품/시장/기술 방향과 본인의 프로젝트 경험을 연결하는 200~400단어 답변 초안을 준비합니다.`,
          status: "AI_DRAFT",
          source: "Anthropic, Discord, Figma, Duolingo 공통"
        },
        {
          label: "Why this role?",
          description: `${jobTitle} 공고의 요구 기술과 본인 경험을 연결하는 답변입니다. 추천 진단의 강점/부족 요소를 근거로 삼을 수 있습니다.`,
          status: "AI_DRAFT",
          source: "회사별 직무 질문으로 반복"
        },
        {
          label: "How did you hear about this job?",
          description: "Greenhouse 공개 공고, 회사 채용 페이지, LinkedIn 등 실제 유입 경로를 사용자가 직접 선택합니다.",
          status: "EXTERNAL",
          source: "Webflow, Mixpanel, Duolingo, Databricks, Reddit 공통"
        },
        {
          label: "Previous employment / interview",
          description: "해당 회사에서 근무했거나 이전에 인터뷰한 적이 있는지 묻는 항목입니다. 사실 기반으로 직접 입력해야 합니다.",
          status: "EXTERNAL",
          source: "GitLab, Figma, DoorDash, Reddit 공통"
        }
      ]
    },
    {
      title: "직무별 검증 질문",
      description: "경력 연차, 특정 기술 경험, 보안/수출통제, 기술 평가 선호 언어 같은 직무 검증 질문입니다.",
      fields: [
        {
          label: "Years of Experience",
          description: `${record.job_family} 직무 관련 경력 연차를 확인합니다. 공고 최소 경력과 실제 프로젝트 경력을 구분해서 준비하세요.`,
          status: "CHECK",
          source: "GitLab, Figma, DoorDash, Anthropic 공통"
        },
        {
          label: "Role-specific Skills",
          description: "Python, LLM, AI tools, infrastructure, engineering management 등 공고별 핵심 기술 질문에 대비합니다.",
          status: "AI_DRAFT",
          source: "Anthropic, Duolingo, GitLab, Figma, Databricks 공통"
        },
        {
          label: "Security / Export / Sanctions",
          description: "보안 인가, 제재 국가, 정부기관 근무 이력 등 법적 확인 항목은 사용자가 직접 사실 기반으로 답해야 합니다.",
          status: "EXTERNAL",
          source: "Anthropic, Asana, Databricks 공통"
        }
      ]
    },
    {
      title: "민감정보 / 선택 정보",
      description: "EEO, 장애, 군복무, 성별, 인종/민족 등 선택형 인구통계 항목입니다.",
      fields: [
        {
          label: "Gender / Race / Ethnicity",
          description: "채용 판단에 사용되지 않는 선택형 인구통계 항목입니다. CareerLens는 자동 추천하거나 작성하지 않습니다.",
          status: "SENSITIVE",
          source: "미국 소재 Greenhouse/ATS Apply Form에서 반복"
        },
        {
          label: "Veteran / Disability Status",
          description: "법적 고지와 함께 제공되는 선택 항목입니다. 사용자가 외부 Apply 페이지에서 직접 판단해야 합니다.",
          status: "SENSITIVE",
          source: "Webflow, Mixpanel, GitLab, Figma, Databricks 공통"
        },
        {
          label: "LGBTQ+ / Pronouns / Preferred Name",
          description: "선택형 자기 식별 정보입니다. 선호 이름이나 발음 표기는 사용자가 원하는 경우 직접 입력합니다.",
          status: "SENSITIVE",
          source: "Webflow, Mixpanel, Asana, Reddit 공통"
        }
      ]
    }
  ];
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

function assistantLabel(status: AssistantStatus) {
  if (status === "READY") return "준비 가능";
  if (status === "CHECK") return "확인 필요";
  if (status === "AI_DRAFT") return "AI 초안";
  if (status === "SENSITIVE") return "자동화 제외";
  return "외부 입력";
}

function assistantTone(status: AssistantStatus) {
  if (status === "READY") return "success";
  if (status === "AI_DRAFT") return "brand";
  if (status === "CHECK") return "warning";
  if (status === "SENSITIVE") return "risk";
  return "muted";
}

function scoreTone(score: number) {
  if (score >= 80) return "success";
  if (score >= 65) return "brand";
  if (score >= 50) return "warning";
  return "risk";
}
