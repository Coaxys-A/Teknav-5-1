'use client';

import { Badge } from "@/components/ui/badge";

export function DraftStatusBar({ status }: { status: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2">
      <div className="text-sm text-muted-foreground">Status</div>
      <Badge>{status}</Badge>
    </div>
  );
}
