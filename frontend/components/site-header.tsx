"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearStoredUser,
  getStoredUser,
  isAdminUser,
  type AuthUser,
} from "@/lib/auth";
import { mainMenus, type MenuChild } from "@/lib/menu";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const isAdmin = isAdminUser(user);
  const visibleMenus = mainMenus.map((menu) => ({
    ...menu,
    children: filterVisibleChildren(menu.children, isAdmin),
  }));

  function logout() {
    clearStoredUser();
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md text-slate-900 shadow-sm transition-all">
      <div className="max-w-[1200px] mx-auto px-6 flex min-h-[72px] items-center justify-between gap-4 py-3">
        {/* 로고 영역 */}
        <Link href="/" className="flex min-w-fit items-center gap-3 group">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-md shadow-indigo-100 group-hover:bg-indigo-700 transition-colors">
            CL
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight text-slate-900">
              CareerLens
            </span>
            <span className="hidden text-[11px] font-medium text-slate-400 sm:block tracking-wide">
              Overseas Career Intelligence
            </span>
          </span>
        </Link>

        {/* 주요 메뉴 네비게이션 */}
        <nav
          className="hidden flex-1 items-center justify-center gap-1 xl:flex"
          aria-label="주요 메뉴"
        >
          {visibleMenus.map((menu) => {
            const active = isActive(
              pathname,
              menu.href,
              flattenHrefs(menu.children)
            );
            return (
              <div key={menu.title} className="group relative py-2">
                <Link
                  href={menu.href}
                  className={`inline-flex min-h-10 items-center px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-white"
                  }`}
                  aria-label={menu.title}
                >
                  {menu.title}
                </Link>

                {/* 드롭다운 모달: '준비로드맵' 자체 설명 배너는 삭제, 하위 목록의 디테일은 유지 */}
                {menu.children && menu.children.length > 0 && (
                  <div className="invisible absolute left-0 top-full w-[320px] translate-y-2 rounded-2xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-xl shadow-slate-200/60 transition-all duration-200 group-hover:visible group-hover:translate-y-1 group-hover:opacity-100">
                    <div className="py-1 space-y-0.5">
                      {menu.children.map((child) => {
                        const childActive = isActive(
                          pathname,
                          child.href,
                          flattenHrefs(child.children ?? [])
                        );
                        return (
                          <Link
                            key={child.title}
                            href={child.href}
                            className={`block px-4 py-3 rounded-xl transition-colors ${
                              childActive
                                ? "bg-indigo-50 text-indigo-600"
                                : "hover:bg-slate-50 text-slate-800"
                            }`}
                          >
                            <span className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold">
                                {child.title}
                              </span>
                              {child.adminOnly && (
                                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                                  ADMIN
                                </span>
                              )}
                            </span>

                            {/* 개별 서브 메뉴 설명글 복구 완료 */}
                            {child.description && (
                              <span className="mt-0.5 block text-xs leading-normal text-slate-400">
                                {child.description}
                              </span>
                            )}

                            {/* 서브 메뉴 하위 태그(하드스킬/컬처핏 등 세부항목) 복구 완료 */}
                            {child.children && (
                              <span className="mt-2 flex flex-wrap gap-1">
                                {child.children.map((grandChild) => (
                                  <span
                                    key={grandChild.title}
                                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500"
                                  >
                                    {grandChild.title}
                                  </span>
                                ))}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 우측 회원관리 영역 */}
        <div className="flex items-center gap-2">
          <div className="hidden max-w-[52vw] gap-1.5 overflow-x-auto md:flex xl:hidden pb-1">
            {visibleMenus.map((menu) => (
              <Link
                key={menu.title}
                href={menu.href}
                className="whitespace-nowrap border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {menu.title}
              </Link>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/mypage"
                className="hidden items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors sm:inline-flex shadow-sm"
                title={`${user.display_name} 계정으로 로그인 중`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {user.display_name}
                <span className="ml-1 text-[10px] font-bold text-slate-400">
                  {isAdmin ? "ADMIN" : "USER"}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 shadow-sm"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 shadow-md shadow-slate-900/10"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function PageKicker({ children }: { children: React.ReactNode }) {
  return <span className="lens-kicker">{children}</span>;
}

function isActive(pathname: string, href: string, childHrefs: string[]) {
  if (pathname.startsWith("/jobs/recommendation")) {
    return (
      href === "/jobs/recommendation" ||
      childHrefs.includes("/jobs/recommendation")
    );
  }
  if (pathname === href) {
    return true;
  }
  if (
    childHrefs.some(
      (childHref) =>
        pathname === childHref ||
        (childHref !== "/" && pathname.startsWith(`${childHref}/`))
    )
  ) {
    return true;
  }
  return href !== "/" && href !== "/jobs" && pathname.startsWith(`${href}/`);
}

function filterVisibleChildren(
  children: MenuChild[],
  isAdmin: boolean
): MenuChild[] {
  return children
    .filter((child) => !child.adminOnly || isAdmin)
    .map((child) => ({
      ...child,
      children: child.children
        ? filterVisibleChildren(child.children, isAdmin)
        : undefined,
    }));
}

function flattenHrefs(children: MenuChild[]): string[] {
  return children.flatMap((child) => [
    child.href,
    ...(child.children ? flattenHrefs(child.children) : []),
  ]);
}
