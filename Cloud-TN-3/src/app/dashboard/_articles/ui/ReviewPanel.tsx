'use client';

import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { approveArticle, requestChanges } from "../actions";
import { toast } from "@/components/ui/use-toast";

export function ReviewPanel({ articleId }: { articleId: number }) {
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const approve = () => {
    startTransition(async () => {
      await approveArticle({ ids: [articleId] });
      toast({ title: "Approved" });
    });
  };

  const changes = () => {
    startTransition(async () => {
      await requestChanges({ ids: [articleId], payload: { reason: notes } });
      toast({ title: "Requested changes" });
    });
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Textarea placeholder="Review notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="flex gap-2">
        <Button onClick={approve} disabled={isPending}>
          Approve
        </Button>
        <Button variant="outline" onClick={changes} disabled={isPending}>
          Request changes
        </Button>
      </div>
    </div>
  );
}
