import { useState } from "react";

/** The latest value that wasn't undefined, so a view can outlive a failed reload. */
export function useLastDefined<T>(value: T | undefined): T | undefined {
  const [last, setLast] = useState(value);
  if (value !== undefined && value !== last) setLast(value);
  return value ?? last;
}
