import { Group } from "@mantine/core";
import { MATERIAL_STATUSES, MATERIAL_TYPES, type MaterialsQuery } from "@material-register/shared";
import { formatPlant, materialStatusLabels, materialTypeLabels } from "./format";
import { type FilterOption, MultiSelectFilter } from "./MultiSelectFilter";
import { usePlants } from "./usePlants";

export type Filters = Pick<MaterialsQuery, "type" | "status" | "plant">;

const typeOptions = MATERIAL_TYPES.map((value) => ({ value, label: materialTypeLabels[value] }));
const statusOptions = MATERIAL_STATUSES.map((value) => ({
  value,
  label: materialStatusLabels[value],
}));

type Props = { filters: Filters; onChange: (patch: Partial<Filters>) => void };

/** The type, status and plant filters. Plants come from the API and are keyed by code. */
export function FilterBar({ filters, onChange }: Props) {
  const { data: plants = [] } = usePlants();
  const plantOptions: FilterOption<string>[] = plants.map((plant) => ({
    value: plant.code,
    label: formatPlant(plant),
  }));

  return (
    <Group role="group" aria-label="Filters" align="flex-end">
      <MultiSelectFilter
        label="Type"
        options={typeOptions}
        value={filters.type}
        onChange={(type) => onChange({ type })}
      />
      <MultiSelectFilter
        label="Status"
        options={statusOptions}
        value={filters.status}
        onChange={(status) => onChange({ status })}
      />
      <MultiSelectFilter
        label="Plant"
        options={plantOptions}
        value={filters.plant}
        onChange={(plant) => onChange({ plant })}
      />
    </Group>
  );
}
