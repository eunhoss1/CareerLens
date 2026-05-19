"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, PageHeader, PageShell, SectionHeader, StepCard } from "@/components/ui";
import {
  countryMatches,
  isAdministrationChecklistItem,
  roadmapContentFor,
  stageMatchesChecklist,
  type AdminRoadmapContent,
  type AdminStage
} from "@/lib/administration-roadmap";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import { countryLabel } from "@/lib/display-labels";
import { fetchUserProfile, type UserProfileSummary } from "@/lib/recommendation";
import {
  fetchSettlementChecklists,
  generateSettlementGuidance,
  updateSettlementChecklistStatus,
  type SettlementChecklistItem,
  type SettlementGuidance,
  type SettlementStatus
} from "@/lib/settlement";
import { statusOptions } from "./_lib/constants";
import { statusLabel, statusTone } from "./_lib/display";
import { SettlementGuidanceSection } from "./_lib/settlement-guidance-section";
import { SettlementMetrics } from "./_lib/settlement-metrics";
import { timeline } from "./_lib/constants";

export default function SettlementPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfileSummary | null>(null);
  const [items, setItems] = useState<SettlementChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<SettlementGuidance | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      fetchUserProfile(storedUser.user_id),
      fetchSettlementChecklists(storedUser.user_id)
    ])
      .then(([loadedProfile, loadedItems]) => {
        setProfile(loadedProfile);
        setItems(loadedItems);
        return refreshGuidance(storedUser.user_id);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "정착 체크리스트를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  const targetCountry = countryLabel(profile?.target_country);
  const roadmapContent = useMemo(() => roadmapContentFor(targetCountry), [targetCountry]);
  const countryItems = useMemo(() => {
    return items.filter((item) => countryMatches(item.country, targetCountry));
  }, [items, targetCountry]);
  const administrationItems = useMemo(() => {
    return countryItems.filter(isAdministrationChecklistItem);
  }, [countryItems]);
  const doneCount = administrationItems.filter((item) => item.status === "DONE").length;
  const inProgressCount = administrationItems.filter((item) => item.status === "IN_PROGRESS").length;

  async function changeStatus(item: SettlementChecklistItem, status: SettlementStatus) {
    setUpdatingId(item.item_id);
    setErrorMessage(null);
    try {
      const updated = await updateSettlementChecklistStatus(item.item_id, status);
      setItems((current) => current.map((candidate) => (candidate.item_id === updated.item_id ? updated : candidate)));
      setGuidance(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "정착 체크리스트 상태를 변경하지 못했습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function refreshGuidance(userId = user?.user_id) {
    if (!userId) {
      return;
    }
    setIsGuidanceLoading(true);
    setGuidanceError(null);
    try {
      const result = await generateSettlementGuidance(userId);
      setGuidance(result);
    } catch (error) {
      setGuidanceError(error instanceof Error ? error.message : "정착 준비 요약을 생성하지 못했습니다.");
    } finally {
      setIsGuidanceLoading(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="SETTLEMENT SUPPORT"
        title="정착 지원"
        description="해외취업 준비가 지원에서 끝나지 않도록 비자, 출국 행정, 초기 생활 준비 항목을 사용자별 체크리스트로 관리합니다."
        actions={
          <>
            <LinkButton href="/roadmap/administration" variant="secondary">행정로드맵으로</LinkButton>
            <LinkButton href="/applications">지원 관리로</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        <div className="grid gap-3 md:grid-cols-3">
          {timeline.map((step, index) => (
            <StepCard key={step.title} index={index + 1} title={step.title} description={step.description} />
          ))}
        </div>

        <SettlementMetrics totalCount={administrationItems.length} inProgressCount={inProgressCount} doneCount={doneCount} />

        {!isLoading && user && (
          <AdministrationSettlementSection
            content={roadmapContent}
            items={administrationItems}
            targetCountry={targetCountry}
          />
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-2 lg:items-start">
          <SettlementGuidanceSection
            className="lg:sticky lg:top-5"
            guidance={guidance}
            guidanceError={guidanceError}
            isGuidanceLoading={isGuidanceLoading}
            isUserReady={Boolean(user)}
            onRefreshGuidance={() => refreshGuidance()}
          />

          <div>
            <SectionHeader
              kicker="COUNTRY CHECKLIST"
              title={`${roadmapContent.country} 비자/행정 체크리스트`}
              description="해외 취업 프로필의 희망국가와 행정로드맵 기준에 맞는 비자/행정/출국 전 준비 항목만 표시합니다. 상태 변경은 저장되므로 다시 접속해도 이어서 확인할 수 있습니다."
            />

            {isLoading && (
              <div className="mt-6">
                <EmptyState title="정착 체크리스트를 불러오는 중입니다." description="로그인 사용자 기준으로 국가별 준비 항목을 확인하고 있습니다." />
              </div>
            )}

            {!isLoading && !user && (
              <div className="mt-6">
                <EmptyState
                  title="로그인이 필요합니다."
                  description="정착 체크리스트는 사용자별 준비 상태를 저장하므로 로그인 후 사용할 수 있습니다."
                  action={<LinkButton href="/login">로그인으로 이동</LinkButton>}
                />
              </div>
            )}

            {errorMessage && (
              <div className="mt-6">
                <EmptyState title="정착 지원 데이터를 처리하지 못했습니다." description={errorMessage} />
              </div>
            )}

            {!isLoading && user && targetCountry === "미기재" && (
              <div className="mt-6">
                <EmptyState
                  title="희망국가 설정이 필요합니다."
                  description="해외 취업 프로필 설정에서 희망국가를 저장하면 해당 국가의 비자/행정 체크리스트를 확인할 수 있습니다."
                  action={<LinkButton href="/onboarding/profile">프로필 설정으로 이동</LinkButton>}
                />
              </div>
            )}

            {!isLoading && user && targetCountry !== "미기재" && administrationItems.length === 0 && (
              <div className="mt-6">
                <EmptyState
                  title={`${targetCountry} 행정 체크리스트가 아직 없습니다.`}
                  description="행정로드맵의 공식자료 확인 원칙을 기준으로 필요한 비자/행정 항목을 먼저 확인하세요."
                  action={<LinkButton href="/roadmap/administration">행정로드맵으로 이동</LinkButton>}
                />
              </div>
            )}

            {administrationItems.length > 0 && (
              <RoadmapLinkedChecklist
                content={roadmapContent}
                items={administrationItems}
                updatingId={updatingId}
                onStatusChange={changeStatus}
              />
            )}
          </div>
        </section>
      </section>
    </PageShell>
  );
}

function RoadmapLinkedChecklist({
  content,
  items,
  updatingId,
  onStatusChange
}: {
  content: AdminRoadmapContent;
  items: SettlementChecklistItem[];
  updatingId: number | null;
  onStatusChange: (item: SettlementChecklistItem, status: SettlementStatus) => void | Promise<void>;
}) {
  const assignedItems = assignItemsToStages(content.stages, items);

  return (
    <div className="mt-6 space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="lens-kicker">OFFICIAL SOURCE</p>
            <h3 className="mt-3 text-lg font-semibold text-night">공식 자료 확인 원칙</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{content.officialDescription}</p>
          </div>
          <Badge tone="brand">{content.country}</Badge>
        </div>
        <ul className="mt-4 space-y-2">
          {content.officialPrinciples.map((principle) => (
            <li key={principle} className="text-sm leading-6 text-slate-700">- {principle}</li>
          ))}
        </ul>
      </Card>

      {content.stages.map((stage) => (
        <Card key={stage.phase} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge tone="brand">{stage.label}</Badge>
              <h3 className="mt-3 text-lg font-semibold text-night">{stage.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{stage.description}</p>
            </div>
            <Badge tone={stageCompletionTone(assignedItems[stage.phase])}>
              {assignedItems[stage.phase].filter((item) => item.status === "DONE").length}/{assignedItems[stage.phase].length}
            </Badge>
          </div>

          <div className="mt-4 rounded-xl border border-line bg-panel p-4">
            <p className="text-xs font-bold text-slate-500">행정로드맵 연결 기준</p>
            <ul className="mt-3 space-y-2">
              {stage.actions.map((action) => (
                <li key={action} className="text-sm leading-6 text-slate-700">- {action}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-3">
            {assignedItems[stage.phase].map((item) => (
              <RoadmapChecklistRow
                key={item.item_id}
                item={item}
                isUpdating={updatingId === item.item_id}
                onStatusChange={onStatusChange}
              />
            ))}
            {assignedItems[stage.phase].length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-panel p-4">
                <p className="text-sm leading-6 text-slate-600">이 단계에 연결된 저장 체크 항목은 아직 없습니다. 위 행정로드맵 기준을 확인 항목으로 사용하세요.</p>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function RoadmapChecklistRow({
  item,
  isUpdating,
  onStatusChange
}: {
  item: SettlementChecklistItem;
  isUpdating: boolean;
  onStatusChange: (item: SettlementChecklistItem, status: SettlementStatus) => void | Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-night">{item.checklist_title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
        <Badge tone={statusTone(item.status)} className={item.status === "NOT_STARTED" ? "min-w-[55px] justify-center" : ""}>
          {statusLabel(item.status)}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={item.status === option.value ? "primary" : "secondary"}
            disabled={isUpdating}
            onClick={() => onStatusChange(item, option.value)}
            className={`min-h-9 px-3 text-xs ${option.value === "NOT_STARTED" ? "min-w-[55px]" : ""}`}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function assignItemsToStages(stages: AdminStage[], items: SettlementChecklistItem[]) {
  const assigned = stages.reduce<Record<AdminStage["phase"], SettlementChecklistItem[]>>((acc, stage) => {
    acc[stage.phase] = [];
    return acc;
  }, {} as Record<AdminStage["phase"], SettlementChecklistItem[]>);

  const usedItemIds = new Set<number>();
  for (const stage of stages) {
    for (const item of items) {
      if (usedItemIds.has(item.item_id) || !stageMatchesChecklist(stage.phase, item)) continue;
      assigned[stage.phase].push(item);
      usedItemIds.add(item.item_id);
    }
  }

  return assigned;
}

function stageCompletionTone(items: SettlementChecklistItem[]) {
  if (items.length === 0) return "muted";
  return items.every((item) => item.status === "DONE") ? "success" : "warning";
}

function AdministrationSettlementSection({
  content,
  items,
  targetCountry
}: {
  content: AdminRoadmapContent;
  items: SettlementChecklistItem[];
  targetCountry: string;
}) {
  const completionRate = items.length === 0
    ? 0
    : Math.round((items.filter((item) => item.status === "DONE").length / items.length) * 100);
  const assignedItems = assignItemsToStages(content.stages, items);

  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="lens-kicker">ADMIN ROADMAP LINK</p>
            <h2 className="mt-3 text-2xl font-semibold text-night">{content.country} 정착 행정 기준</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {targetCountry === "미기재"
                ? "해외 취업 프로필의 희망국가를 저장하면 행정로드맵 기반 체크 항목을 국가별로 볼 수 있습니다."
                : "행정로드맵의 공식자료 확인 원칙과 단계별 준비 항목을 정착 체크리스트로 이어서 관리합니다."}
            </p>
          </div>
          <Badge tone={completionRate >= 70 ? "success" : "warning"}>{completionRate}% 완료</Badge>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-panel p-4">
          <p className="text-sm font-semibold text-night">{content.officialTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{content.officialDescription}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {content.officialTags.map((tag) => <Badge key={tag} tone="muted">{tag}</Badge>)}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeader
          kicker="VISA / ADMIN CHECK"
          title="행정로드맵 기반 체크 범위"
          description="각 단계의 기준을 보고 아래 국가별 체크리스트에서 준비 전, 진행 중, 완료 상태를 변경할 수 있습니다."
        />
        <div className="mt-5 grid gap-3">
          {content.stages.map((stage) => (
            <AdminStageSummary key={stage.phase} stage={stage} items={assignedItems[stage.phase]} />
          ))}
        </div>
      </Card>
    </section>
  );
}

function AdminStageSummary({ stage, items }: { stage: AdminStage; items: SettlementChecklistItem[] }) {
  const doneCount = items.filter((item) => item.status === "DONE").length;

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone="brand">{stage.label}</Badge>
          <h3 className="mt-3 text-base font-semibold text-night">{stage.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{stage.description}</p>
        </div>
        <Badge tone={items.length > 0 && doneCount === items.length ? "success" : "warning"}>
          {doneCount}/{items.length}
        </Badge>
      </div>
      <ul className="mt-3 space-y-2">
        {stage.actions.slice(0, 2).map((action) => (
          <li key={action} className="text-sm leading-6 text-slate-700">- {action}</li>
        ))}
      </ul>
    </div>
  );
}
