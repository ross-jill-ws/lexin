import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";

/** Plants rarely change, so they are fetched once per session. */
export function usePlants() {
  return useQuery({ queryKey: ["plants"], queryFn: api.listPlants, staleTime: Infinity });
}
