import { MultiSelect, Pill } from "@mantine/core";

export type FilterOption<Value extends string> = { value: Value; label: string };

type Props<Value extends string> = {
  label: string;
  options: FilterOption<Value>[];
  /** The selected values; undefined when the filter is not applied. */
  value: Value[] | undefined;
  onChange: (values: Value[] | undefined) => void;
};

/**
 * A clearable multi-value filter. An empty selection reports undefined (no filter). Only the
 * first selection shows as a pill; the rest collapse into a "+N" pill, so the toolbar stays one
 * line however many values are picked. The open dropdown shows every selection.
 */
export function MultiSelectFilter<Value extends string>({
  label,
  options,
  value,
  onChange,
}: Props<Value>) {
  const selected = value ?? [];
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const rest = selected.slice(1);

  return (
    <MultiSelect
      label={label}
      placeholder={selected.length ? undefined : "Any"}
      data={options}
      value={selected}
      // The options are exactly `options`, so every selected string is a Value.
      onChange={(next) => onChange(next.length > 0 ? (next as Value[]) : undefined)}
      renderPill={({ value: pillValue, onRemove }) => {
        if (pillValue === undefined) return null;
        if (pillValue === selected[0]) {
          return (
            <Pill withRemoveButton onRemove={onRemove}>
              {labelOf(pillValue)}
            </Pill>
          );
        }
        if (pillValue === rest[0]) {
          return (
            <Pill
              title={`Also selected: ${rest.map(labelOf).join(", ")}`}
            >{`+${rest.length}`}</Pill>
          );
        }
        return null;
      }}
      clearable
      // Mantine hides its clear button from keyboard and screen readers; expose it.
      clearButtonProps={{
        "aria-label": `Clear ${label} filter`,
        "aria-hidden": false,
        tabIndex: 0,
      }}
      w={230}
      styles={{ pillsList: { flexWrap: "nowrap", overflow: "hidden" } }}
    />
  );
}
