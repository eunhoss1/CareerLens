import { countryLabel } from "./job-format";

export type JobFilterState = {
  country: string;
  jobFamily: string;
  query: string;
};

export function JobFilterBar({
  filters,
  countries,
  jobFamilies,
  onChange,
  onReset
}: {
  filters: JobFilterState;
  countries: string[];
  jobFamilies: string[];
  onChange: (filters: JobFilterState) => void;
  onReset: () => void;
}) {
  const activeFilterCount = [filters.country !== "ALL", filters.jobFamily !== "ALL"].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="relative min-w-[260px] flex-1 lg:max-w-[380px]">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-brand">⌕</span>
          <input
            className="h-12 w-full rounded-full border border-line bg-white pl-12 pr-10 text-sm font-black text-night outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
            placeholder="회사, 직무, 스킬 검색"
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
          />
          {filters.query && (
            <button
              type="button"
              aria-label="검색어 지우기"
              className="absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-500 text-xs font-black text-white"
              onClick={() => onChange({ ...filters, query: "" })}
            >
              ×
            </button>
          )}
        </label>

        <SelectPill
          icon="◎"
          label={`근무 국가${filters.country !== "ALL" ? " (1)" : ""}`}
          value={filters.country}
          onChange={(value) => onChange({ ...filters, country: value })}
          onClear={() => onChange({ ...filters, country: "ALL" })}
          active={filters.country !== "ALL"}
          options={[
            { label: "전체 국가", value: "ALL" },
            ...countries.map((country) => ({ label: countryLabel(country), value: country }))
          ]}
        />

        <StaticPill icon="▤" label="근무 형태" />
        <StaticPill icon="↗" label="경력 수준" />

        <SelectPill
          icon="⌘"
          label={`직무 분야${filters.jobFamily !== "ALL" ? " (1)" : ""}`}
          value={filters.jobFamily}
          onChange={(value) => onChange({ ...filters, jobFamily: value })}
          onClear={() => onChange({ ...filters, jobFamily: "ALL" })}
          active={filters.jobFamily !== "ALL"}
          options={[
            { label: "전체 직무 분야", value: "ALL" },
            ...jobFamilies.map((family) => ({ label: family, value: family }))
          ]}
        />

        <button
          type="button"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-brand/15 bg-[#e8f2f1] px-4 text-sm font-black text-brand transition hover:bg-[#dcebe9]"
        >
          상세 필터 ({activeFilterCount + (filters.query ? 1 : 0)})
          <span className="text-lg">⌄</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 pl-1 text-sm font-black text-brand">
        <button type="button" className="transition hover:text-night" onClick={onReset}>
          필터 초기화
        </button>
      </div>
    </div>
  );
}

function SelectPill({
  icon,
  label,
  value,
  options,
  active,
  onChange,
  onClear
}: {
  icon: string;
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  active: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      className={`relative inline-flex h-12 items-center gap-2.5 rounded-full border px-4 text-sm font-black transition ${
        active ? "border-brand/15 bg-[#e8f2f1] text-brand" : "border-line bg-white text-night hover:border-brand/30"
      }`}
    >
      <span className="text-lg text-brand">{icon}</span>
      <span>{label}</span>
      <span className="text-lg">⌄</span>
      <select
        aria-label={label}
        className="absolute inset-0 cursor-pointer opacity-0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {active && (
        <button
          type="button"
          aria-label={`${label} 필터 해제`}
          className="relative z-10 -mr-2 flex size-7 items-center justify-center rounded-full text-xl leading-none hover:bg-white/70"
          onClick={onClear}
        >
          ×
        </button>
      )}
    </div>
  );
}

function StaticPill({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-12 items-center gap-2.5 rounded-full border border-line bg-white px-4 text-sm font-black text-night transition hover:border-brand/30"
    >
      <span className="text-lg text-brand">{icon}</span>
      {label}
      <span className="text-lg">⌄</span>
    </button>
  );
}
