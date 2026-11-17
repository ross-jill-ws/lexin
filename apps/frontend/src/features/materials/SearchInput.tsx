import { CloseButton, TextInput } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { searchQueryShape } from "@material-register/shared";
import { useState } from "react";

export const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  /** The search term in the URL. */
  value: string | undefined;
  onChange: (q: string | undefined) => void;
};

/** The term `text` would search for: trimmed, or undefined when blank. */
const toTerm = (text: string) => searchQueryShape.q.safeParse(text);

/**
 * Holds the typed text locally and writes the term to the URL once typing pauses. Follows the
 * URL when it changes from elsewhere (back/forward, a shared link).
 */
export function SearchInput({ value, onChange }: Props) {
  const [text, setText] = useState(value ?? "");
  const [lastValue, setLastValue] = useState(value);
  const writeToUrl = useDebouncedCallback(onChange, SEARCH_DEBOUNCE_MS);
  const term = toTerm(text);

  // The URL moved: show its term, unless it is just the trimmed form of what is typed.
  if (value !== lastValue) {
    setLastValue(value);
    if (!term.success || term.data !== value) {
      writeToUrl.cancel();
      setText(value ?? "");
    }
  }

  const handleChange = (next: string) => {
    setText(next);
    const nextTerm = toTerm(next);
    if (nextTerm.success && nextTerm.data !== value) writeToUrl(nextTerm.data);
    else writeToUrl.cancel();
  };

  const clear = () => {
    writeToUrl.cancel();
    setText("");
    if (value !== undefined) onChange(undefined);
  };

  return (
    <TextInput
      label="Search materials"
      placeholder="Material #, description or MPN"
      value={text}
      onChange={(event) => handleChange(event.currentTarget.value)}
      error={term.error?.issues[0]?.message}
      rightSection={text && <CloseButton aria-label="Clear search" onClick={clear} />}
      w={360}
    />
  );
}
