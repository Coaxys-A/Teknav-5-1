import type { ReactNode } from "react";

export default function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
