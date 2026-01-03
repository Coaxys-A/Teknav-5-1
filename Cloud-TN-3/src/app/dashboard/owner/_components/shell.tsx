import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type ShellProps = {
  children: React.ReactNode;
};

export function OwnerShell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
