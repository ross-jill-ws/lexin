import { Container } from "@mantine/core";
import type { ReactNode } from "react";
import { Link } from "react-router";
import classes from "./AppFrame.module.css";

/** The app's chrome: the graphite masthead with its hazard-stripe edge, then the page. */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <header className={classes.header}>
        <Container size={1440} className={classes.bar}>
          <Link to="/" className={classes.brand}>
            <span className={classes.mark} aria-hidden="true">
              MR
            </span>
            <span className={classes.wordmark}>Material Register</span>
          </Link>
          <span className={classes.meta}>Stores · Maintenance planning</span>
        </Container>
      </header>
      <Container size={1440} component="main" className={classes.main}>
        {children}
      </Container>
    </>
  );
}
