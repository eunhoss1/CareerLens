"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainMenus, statusLabel } from "@/lib/menu";
import { LinkButton } from "@/components/ui";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[#24343a] bg-night text-white">
      <div className="lens-container flex min-h-[76px] items-center justify-between gap-4 py-3">
        <Link href="/" className="flex min-w-fit items-center gap-3">
          <span className="grid h-10 w-10 place-items-center border border-white/30 bg-white text-sm font-black text-night">
            CL
          </span>
          <span>
            <span className="block text-base font-semibold tracking-wide">CareerLens</span>
            <span className="hidden text-xs text-slate-300 sm:block">Overseas Career Intelligence</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 xl:flex" aria-label="주요 메뉴">
          {mainMenus.map((menu) => {
            const active = isActive(pathname, menu.href, flattenHrefs(menu.children));
            return (
              <div key={menu.title} className="group relative">
                <Link
                  href={menu.href}
                  className={`inline-flex min-h-10 items-center px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-white text-night" : "text-slate-100 hover:bg-white/10"
                  }`}
                  aria-label={`${menu.title} ${statusLabel(menu.status)}`}
                >
                  {menu.title}
                  <span className="ml-1 text-xs text-slate-300 group-hover:text-white">v</span>
                </Link>

                <div className="invisible absolute left-0 top-full w-[300px] translate-y-2 border border-night bg-white text-night opacity-0 shadow-dossier transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="border-b border-line bg-panel px-4 py-3">
                    <p className="text-xs font-bold tracking-[0.16em] text-brand">{menu.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{menu.summary}</p>
                  </div>
                  <div className="py-2">
                    {menu.children.map((child) => {
                      const childActive = pathname === child.href || (child.href !== "/" && pathname.startsWith(child.href));
                      return (
                        <Link
                          key={child.title}
                          href={child.href}
                          className={`block px-4 py-3 transition hover:bg-panel ${childActive ? "bg-[#e8f2f1]" : ""}`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-night">{child.title}</span>
                            <span className="text-[11px] font-bold text-slate-400">{statusLabel(child.status)}</span>
                          </span>
                          {child.description && <span className="mt-1 block text-xs leading-5 text-slate-500">{child.description}</span>}
                          {child.children && (
                            <span className="mt-2 flex flex-wrap gap-1.5">
                              {child.children.map((grandChild) => (
                                <span key={grandChild.title} className="border border-line bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
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
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden max-w-[52vw] gap-2 overflow-x-auto md:flex xl:hidden">
            {mainMenus.map((menu) => (
              <Link key={menu.title} href={menu.href} className="whitespace-nowrap border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-slate-100">
                {menu.title}
              </Link>
            ))}
          </div>
          <LinkButton href="/login" variant="secondary" className="border-white/25 bg-white text-night hover:bg-slate-100">
            로그인
          </LinkButton>
        </div>
      </div>
    </header>
  );
}

export function PageKicker({ children }: { children: React.ReactNode }) {
  return <span className="lens-kicker">{children}</span>;
}

function isActive(pathname: string, href: string, childHrefs: string[]) {
  if (pathname === href || (href !== "/" && pathname.startsWith(href))) {
    return true;
  }
  return childHrefs.some((childHref) => pathname === childHref || (childHref !== "/" && pathname.startsWith(childHref)));
}

function flattenHrefs(children: Array<{ href: string; children?: Array<{ href: string }> }>) {
  return children.flatMap((child) => [child.href, ...(child.children?.map((grandChild) => grandChild.href) ?? [])]);
}
