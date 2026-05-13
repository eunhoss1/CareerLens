"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, LinkButton, PageHeader, PageShell, SectionHeader, StepCard } from "@/components/ui";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import {
  fetchSettlementChecklists,
  generateSettlementGuidance,
  updateSettlementChecklistStatus,
  type SettlementChecklistItem,
  type SettlementGuidance,
  type SettlementStatus
} from "@/lib/settlement";
import { CountryPanel } from "./_lib/country-panel";
import { SettlementGuidanceSection } from "./_lib/settlement-guidance-section";
import { SettlementMetrics } from "./_lib/settlement-metrics";
import { timeline } from "./_lib/constants";

export default function SettlementPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
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

    fetchSettlementChecklists(storedUser.user_id)
      .then((loadedItems) => {
        setItems(loadedItems);
        return refreshGuidance(storedUser.user_id);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "정착 체크리스트를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  const groupedByCountry = useMemo(() => {
    return items.reduce<Record<string, SettlementChecklistItem[]>>((acc, item) => {
      acc[item.country] = [...(acc[item.country] ?? []), item];
      return acc;
    }, {});
  }, [items]);

  const doneCount = items.filter((item) => item.status === "DONE").length;
  const inProgressCount = items.filter((item) => item.status === "IN_PROGRESS").length;

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
        actions={<LinkButton href="/applications">지원 관리로</LinkButton>}
      />

      <section className="lens-container py-6">
        <div className="grid gap-3 md:grid-cols-3">
          {timeline.map((step, index) => (
            <StepCard key={step.title} index={index + 1} title={step.title} description={step.description} />
          ))}
        </div>

        <SettlementMetrics totalCount={items.length} inProgressCount={inProgressCount} doneCount={doneCount} />

        <SettlementGuidanceSection
          guidance={guidance}
          guidanceError={guidanceError}
          isGuidanceLoading={isGuidanceLoading}
          isUserReady={Boolean(user)}
          onRefreshGuidance={() => refreshGuidance()}
        />

        <div className="mt-8">
          <SectionHeader
            kicker="COUNTRY CHECKLIST"
            title="국가별 정착 준비 체크리스트"
            description="처음 조회할 때 사용자별 기본 체크리스트가 DB에 생성됩니다. 상태 변경은 저장되므로 다시 접속해도 이어서 확인할 수 있습니다."
          />
        </div>

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

        {items.length > 0 && (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {Object.entries(groupedByCountry).map(([country, countryItems]) => (
              <CountryPanel
                key={country}
                country={country}
                items={countryItems}
                updatingId={updatingId}
                onStatusChange={changeStatus}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
