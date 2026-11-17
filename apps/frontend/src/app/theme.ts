import { createTheme, type MantineColorsTuple } from "@mantine/core";

/**
 * The register's design system: a stores-ledger look. Graphite ink on warm paper, with
 * safety amber as the one accent, a condensed signage face for headings and a mono face
 * for part codes. The same tokens are exposed as CSS variables in tokens.css.
 */
const amber: MantineColorsTuple = [
  "#fff8e1",
  "#ffefc0",
  "#ffe08a",
  "#ffd04f",
  "#ffc21f",
  "#ffb800",
  "#f2a900",
  "#d18f00",
  "#a87200",
  "#7a5300",
];

const graphite: MantineColorsTuple = [
  "#f3f4f5",
  "#e4e6e8",
  "#c9cdd1",
  "#a9afb5",
  "#88909a",
  "#6b737d",
  "#535a63",
  "#3d434a",
  "#272b31",
  "#16181b",
];

export const theme = createTheme({
  colors: { amber, graphite },
  primaryColor: "amber",
  primaryShade: 6,
  autoContrast: true,
  black: "#16181b",
  defaultRadius: "xs",
  fontFamily: "Archivo, 'Helvetica Neue', Arial, sans-serif",
  fontFamilyMonospace: "'IBM Plex Mono', ui-monospace, Menlo, monospace",
  headings: {
    fontFamily: "'Big Shoulders Display', 'Archivo Narrow', Impact, sans-serif",
    fontWeight: "800",
  },
  components: {
    InputWrapper: {
      styles: {
        label: {
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--mantine-color-graphite-6)",
          marginBottom: 4,
        },
      },
    },
    Pagination: { defaultProps: { color: "graphite.9", size: "sm" } },
    Button: { defaultProps: { radius: "xs" } },
  },
});
