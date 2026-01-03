import { cx } from "@/lib/utils";
import type { ReactNode } from "react";

const baseColumns: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

const responsiveColumns: Record<"sm" | "md" | "lg", Record<number, string>> = {
  sm: {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
  },
  md: {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  },
  lg: {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  },
};

interface GridProps {
  cols: {
    base: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  children: ReactNode;
}

export default function Grid({ cols, children }: GridProps) {
  const classes = cx(
    "grid gap-6",
    baseColumns[cols.base],
    cols.sm ? responsiveColumns.sm[cols.sm] : "",
    cols.md ? responsiveColumns.md[cols.md] : "",
    cols.lg ? responsiveColumns.lg[cols.lg] : "",
  );

  return <div className={classes}>{children}</div>;
}
