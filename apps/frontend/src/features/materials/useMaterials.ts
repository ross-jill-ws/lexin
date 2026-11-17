import type { MaterialsQuery } from "@material-register/shared";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";

export function useMaterials(query: MaterialsQuery) {
  return useQuery({
    queryKey: ["materials", query],
    queryFn: () => api.listMaterials(query),
    placeholderData: keepPreviousData,
  });
}
