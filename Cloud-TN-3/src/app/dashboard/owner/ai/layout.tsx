import { SectionWrapper } from "../_components/section-wrapper";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SectionWrapper>{children}</SectionWrapper>;
}
