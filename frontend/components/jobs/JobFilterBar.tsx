import { SelectInput, TextInput } from "@/components/ui";
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
      <SelectInput
        label="국가"
        value={filters.country}
        onChange={(event) => onChange({ ...filters, country: event.target.value })}
      >
        <option value="ALL">전체 국가</option>
        {countries.map((country) => (
          <option key={country} value={country}>
            {countryLabel(country)}
          </option>
        ))}
      </SelectInput>
      <SelectInput
        label="직무군"
        value={filters.jobFamily}
        onChange={(event) => onChange({ ...filters, jobFamily: event.target.value })}
      >
        <option value="ALL">전체 직무군</option>
        {jobFamilies.map((family) => (
          <option key={family} value={family}>
            {family}
          </option>
        ))}
      </SelectInput>
      <TextInput
        label="공고 검색"
        placeholder="회사명, 직무명, 기술스택 검색"
        value={filters.query}
        onChange={(event) => onChange({ ...filters, query: event.target.value })}
      />
    </div>
  );
}
