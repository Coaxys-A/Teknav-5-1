import { useEffect, useRef, useState } from "react";

type AutosavePayload = { title: string; content: string };

export function useAutosave(articleId: number, initial: AutosavePayload) {
  const [data, setData] = useState<AutosavePayload>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const scheduleSave = (next: AutosavePayload) => {
    setData(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(next), 1200);
  };

  const save = async (payload: AutosavePayload) => {
    try {
      setStatus("saving");
      await fetch(`/articles/${articleId}/autosave/cache`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1200);
    } catch (error) {
      setStatus("error");
    }
  };

  const recover = async () => {
    const res = await fetch(`/articles/${articleId}/autosave/cache`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.cached as AutosavePayload | null;
  };

  return { data, scheduleSave, status, recover };
}
