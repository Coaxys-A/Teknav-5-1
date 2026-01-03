type WrapperProps = {
  children: React.ReactNode;
};

type SectionContentProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function SectionWrapper({ children }: WrapperProps) {
  return <div className="flex flex-1 flex-col gap-6">{children}</div>;
}

export function SectionContent({ title, description, children }: SectionContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}
