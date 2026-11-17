import { Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import classes from "./Notice.module.css";

type Props = {
  /** The big outlined figure, e.g. "404". */
  code: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
};

/** A full-width notice card with a hazard-striped edge, for not-found and broken pages. */
export function Notice({ code, eyebrow, title, children }: Props) {
  return (
    <section className={classes.notice} aria-labelledby="notice-title">
      <span className={classes.code} aria-hidden="true">
        {code}
      </span>
      <Stack gap="sm" align="flex-start">
        <Text className={classes.eyebrow}>{eyebrow}</Text>
        <Title id="notice-title" order={1} className={classes.title}>
          {title}
        </Title>
        {children}
      </Stack>
    </section>
  );
}

export const noticeClasses = classes;
