"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  MetricCard,
  PageHeader,
  PageShell,
  ScoreBar,
  SectionHeader,
  TimelineCard
} from "@/components/ui";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import { countryLabel } from "@/lib/display-labels";
import { fetchUserProfile, type UserProfileSummary } from "@/lib/recommendation";
import {
  countryMatches,
  isAdministrationChecklistItem,
  roadmapContentFor,
  stageMatchesChecklist,
  type AdminStage
} from "@/lib/administration-roadmap";
import {
  fetchSettlementChecklists,
  generateSettlementGuidance,
  type SettlementChecklistItem,
  type SettlementGuidance
} from "@/lib/settlement";

export default function AdministrationRoadmapPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfileSummary | null>(null);
  const [items, setItems] = useState<SettlementChecklistItem[]>([]);
  const [guidance, setGuidance] = useState<SettlementGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      fetchUserProfile(storedUser.user_id),
      fetchSettlementChecklists(storedUser.user_id),
      generateSettlementGuidance(storedUser.user_id)
    ])
      .then(([loadedProfile, loadedItems, generatedGuidance]) => {
        setProfile(loadedProfile);
        setItems(loadedItems);
        setGuidance(generatedGuidance);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "행정로드맵 데이터를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  const targetCountry = countryLabel(profile?.target_country);
  const roadmapContent = useMemo(() => roadmapContentFor(targetCountry), [targetCountry]);

  const adminItems = useMemo(() => {
    return items.filter((item) =>
      countryMatches(item.country, targetCountry)
      && isAdministrationChecklistItem(item)
    );
  }, [items, targetCountry]);

  const countryGuidance = guidance?.country_summaries.find((summary) => countryMatches(summary.country, targetCountry));
  const priorityActions = countryGuidance?.next_actions.length
    ? countryGuidance.next_actions
    : adminItems.slice(0, 4).map((item) => `${item.country} - ${item.checklist_title}`);

  const doneCount = adminItems.filter((item) => item.status === "DONE").length;
  const inProgressCount = adminItems.filter((item) => item.status === "IN_PROGRESS").length;
  const completionRate = adminItems.length === 0 ? 0 : Math.round((doneCount / adminItems.length) * 100);
  // const groupedByCountry = adminItems.reduce<Record<string, SettlementChecklistItem[]>>((acc, item) => {
  //   acc[item.country] = [...(acc[item.country] ?? []), item];
  //   return acc;
  // }, {});

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="ADMINISTRATION ROADMAP"
        title="행정로드맵"
        actions={
          <>
            <LinkButton href="/roadmap/departure" variant="secondary">출국로드맵으로</LinkButton>
            <LinkButton href="/settlement">정착 체크리스트로</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        {isLoading && <EmptyState title="행정로드맵을 불러오는 중입니다." description="사용자별 정착 체크리스트와 AI/규칙 기반 안내를 조합하고 있습니다." />}

        {!isLoading && !user && (
          <EmptyState
            title="로그인이 필요합니다."
            description="행정로드맵은 사용자별 체크리스트 상태를 바탕으로 구성되므로 로그인 후 사용할 수 있습니다."
            action={<LinkButton href="/login">로그인으로 이동</LinkButton>}
          />
        )}

        {errorMessage && <EmptyState title="행정로드맵 데이터 처리 실패" description={errorMessage} />}

        {!isLoading && user && (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="희망 국가" value={targetCountry} helper="해외 취업 프로필 기준" />
              <MetricCard label="행정 체크 항목" value={adminItems.length} helper={`${targetCountry} 비자/행정 중심`} />
              <MetricCard label="진행 중" value={inProgressCount} helper="확인 또는 처리 중" />
              <MetricCard label="완료" value={doneCount} helper="사용자별 저장 상태" />
            </div>

            <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <Card className="p-5">
                <p className="lens-kicker">ADMIN READINESS</p>
                <h2 className="mt-3 text-2xl font-semibold text-night">행정 준비율</h2>
                <div className="mt-5">
                  <ScoreBar label="비자/행정 준비율" value={completionRate} tone={completionRate >= 70 ? "success" : "warning"} />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {targetCountry === "미기재"
                    ? "해외 취업 프로필 설정에서 희망국가를 먼저 저장하면 해당 국가 기준 행정로드맵을 생성합니다."
                    : `${targetCountry} 희망국가를 기준으로 공식자료 확인 원칙, 오퍼/고용계약, 비자/체류자격, 출국 전 서류, 입국 후 초기 행정을 정리합니다.`}
                </p>
                <div className="mt-5 rounded-xl border border-line bg-panel p-4">
                  <p className="text-xs font-bold text-slate-500">우선 확인 항목</p>
                  <ul className="mt-3 space-y-2">
                    {priorityActions.slice(0, 4).map((action) => (
                      <li key={action} className="text-sm leading-6 text-slate-700">- {action}</li>
                    ))}
                    {priorityActions.length === 0 && (
                      <li className="text-sm leading-6 text-slate-700">- 해외 취업 프로필의 희망국가와 희망도시를 저장한 뒤 공식기관 자료를 확인하세요.</li>
                    )}
                  </ul>
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeader
                  kicker="OFFICIAL SOURCE POLICY"
                  title="공식 자료 확인 원칙"
                  description={`${roadmapContent.country} 행정 절차는 공식기관과 고용주 안내를 기준으로 최종 확인합니다.`}
                />
                <div className="mt-5 rounded-xl border border-line bg-panel p-4">
                  <Badge tone="brand">{roadmapContent.country}</Badge>
                  <h3 className="mt-3 text-base font-semibold text-night">{roadmapContent.officialTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{roadmapContent.officialDescription}</p>
                  <ul className="mt-3 space-y-2">
                    {roadmapContent.officialPrinciples.map((principle) => (
                      <li key={principle} className="text-sm leading-6 text-slate-700">- {principle}</li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {roadmapContent.officialTags.map((tag) => <Badge key={tag} tone="muted">{tag}</Badge>)}
                  </div>
                </div>
              </Card>
            </section>

            <section className="border-l border-night pl-4">
              <div className="space-y-4">
                {roadmapContent.stages.map((stage) => (
                  <TimelineCard key={stage.phase} label={stage.label} title={stage.title}>
                    <p className="text-sm leading-6 text-slate-600">{stage.description}</p>
                    <ul className="mt-3 space-y-2">
                      {stage.actions.map((action) => (
                        <li key={action} className="text-sm leading-6 text-slate-700">- {action}</li>
                      ))}
                    </ul>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {matchingItems(stage.phase, adminItems).map((item) => (
                        <div key={item.item_id} className="rounded-xl border border-line bg-panel p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-night">{item.country} · {item.checklist_title}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                            </div>
                            <Badge tone={statusTone(item.status)} className={item.status === "NOT_STARTED" ? "min-w-[55px] justify-center" : ""}>
                              {statusLabel(item.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {matchingItems(stage.phase, adminItems).length === 0 && (
                        <div className="rounded-xl border border-dashed border-line bg-panel p-4">
                          <p className="text-sm leading-6 text-slate-600">프로필 희망국가에 연결된 저장 체크리스트가 아직 없습니다. 위 생성 항목을 기준으로 공식자료와 고용주 안내를 확인하세요.</p>
                        </div>
                      )}
                    </div>
                  </TimelineCard>
                ))}
              </div>
            </section>

            {/* <Card className="p-5">
              <SectionHeader kicker="COUNTRY DOSSIER" title="국가별 행정 항목" />
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {Object.entries(groupedByCountry).map(([country, countryItems]) => (
                  <div key={country} className="rounded-xl border border-line bg-panel p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-night">{country}</h3>
                      <Badge tone={countryItems.every((item) => item.status === "DONE") ? "success" : "warning"}>
                        {countryItems.filter((item) => item.status === "DONE").length}/{countryItems.length}
                      </Badge>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {countryItems.map((item) => (
                        <li key={item.item_id} className="flex items-start justify-between gap-3 border-b border-line pb-2 text-sm last:border-b-0 last:pb-0">
                          <span className="leading-6 text-slate-700">{item.checklist_title}</span>
                          <Badge tone={statusTone(item.status)} className={item.status === "NOT_STARTED" ? "min-w-[55px] justify-center" : ""}>
                            {statusLabel(item.status)}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card> */}

            <Card className="p-5">
              <p className="text-xs leading-5 text-slate-500">
                이 행정로드맵은 CareerLens에 저장된 체크리스트와 사용자 입력을 바탕으로 만든 시연용 안내입니다.
                비자, 세금, 체류자격, 입국 요건, 행정 절차의 최신 판단은 반드시 공식기관과 전문가를 통해 확인해야 합니다.
              </p>
            </Card>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function matchingItems(phase: AdminStage["phase"], items: SettlementChecklistItem[]) {
  return items.filter((item) => stageMatchesChecklist(phase, item)).slice(0, 3);
}

function statusLabel(status: string) {
  if (status === "DONE") return "완료";
  if (status === "IN_PROGRESS") return "진행 중";
  return "준비 전";
}

function statusTone(status: string) {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "warning";
  return "muted";
}
