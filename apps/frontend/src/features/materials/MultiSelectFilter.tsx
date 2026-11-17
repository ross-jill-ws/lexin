import { MultiSelect } from "@mantine/core";

export type FilterOption<Value extends string> = { value: Value; label: string };

type Props<Value extends string> = {
  label: string;
  options: FilterOption<Value>[];
  /** The selected values; undefined when the filter is not applied. */
  value: Value[] | undefined;
  onChange: (values: Value[] | undefined) => void;
};

/** A clearable multi-value filter. An empty selection reports undefined (no filter). */
export function MultiSelectFilter<Value extends string>({
  label,
  options,
  value,
  onChange,
}: Props<Value>) {
  return (
    <MultiSelect
      label={label}
      placeholder={value?.length ? undefined : "Any"}
      data={options}
      value={value ?? []}
      // The options are exactly `options`, so every selected string is a Value.
      onChange={(next) => onChange(next.length > 0 ? (next as Value[]) : undefined)}
      clearable
      // Mantine hides its clear button from keyboard and screen readers; expose it.
      clearButtonProps={{
        "aria-label": `Clear ${label} filter`,
        "aria-hidden": false,
        tabIndex: 0,
      }}
      w={230}
      // One line of pills, however many are picked, so the toolbar never grows taller.
      styles={{ pillsList: { flexWrap: "nowrap", overflow: "hidden" } }}
    />
  );
}
