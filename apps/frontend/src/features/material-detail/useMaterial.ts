import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";

export function useMaterial(materialNumber: string) {
  return useQuery({
    queryKey: ["material", materialNumber],
    queryFn: () => api.getMaterial(materialNumber),
  });
}
