import { NativeSelect } from "@mantine/core";
import { PAGE_SIZES, type PageSize, paginationQueryShape } from "@material-register/shared";

const options = PAGE_SIZES.map(String);

type Props = { value: PageSize; onChange: (pageSize: PageSize) => void };

export function PageSizePicker({ value, onChange }: Props) {
  return (
    <NativeSelect
      label="Rows per page"
      data={options}
      value={String(value)}
      onChange={(event) => onChange(paginationQueryShape.pageSize.parse(event.currentTarget.value))}
      w={120}
    />
  );
}
