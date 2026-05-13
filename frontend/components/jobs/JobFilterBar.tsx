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
  onChange
}: {
  filters: JobFilterState;
  countries: string[];
  jobFamilies: string[];
  onChange: (filters: JobFilterState) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr]">
      <label className="block">
        <span className="text-xs font-semibold text-slate-500">국가</span>
        <select
          className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-night outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
          value={filters.country}
          onChange={(event) => onChange({ ...filters, country: event.target.value })}
        >
          <option value="ALL">전체 국가</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {countryLabel(country)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-500">직무군</span>
        <select
          className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-night outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
          value={filters.jobFamily}
          onChange={(event) => onChange({ ...filters, jobFamily: event.target.value })}
        >
          <option value="ALL">전체 직무군</option>
          {jobFamilies.map((family) => (
            <option key={family} value={family}>
              {family}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-500">공고 검색</span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-night outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/10"
          placeholder="회사명, 기술스택 등으로 검색"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </label>
    </div>
  );
}
