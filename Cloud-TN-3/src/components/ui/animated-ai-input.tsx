"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bot, Check, ChevronDown, Paperclip } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type UseAutoResizeTextareaProps = { minHeight: number; maxHeight?: number };

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY));
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

const OPENAI_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 260" aria-label="OpenAI Icon">
    <path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z" />
  </svg>
);

export function AI_Prompt() {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 96, maxHeight: 260 });
  const [selectedModel, setSelectedModel] = useState("Gpt OSS (120b)");

  const AI_MODELS = ["Gpt OSS (120b)", "Deepseek v3.1"];
  const MODEL_ICONS: Record<string, React.ReactNode> = {
    "Gpt OSS (120b)": OPENAI_ICON,
    "Deepseek v3.1": <Bot className="w-4 h-4 text-slate-500" />,
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && value.trim()) {
      e.preventDefault();
      setValue("");
      adjustHeight(true);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 shadow-[0_10px_40px_-25px_rgba(15,76,129,0.35)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/70">
        <div className="p-4">
          <div className="relative flex flex-col">
            <Textarea
              dir="rtl"
              id="ai-input-teknav"
              value={value}
              placeholder="متن پرسش یا دستور خود را اینجا بنویسید"
              className={cn(
                "w-full rounded-xl bg-slate-50/80 dark:bg-slate-800/70 border border-transparent px-4 py-4 text-center text-base",
                "placeholder:text-slate-400 dark:placeholder:text-slate-300 focus-visible:ring-1 focus-visible:ring-[color:var(--color-brand,#0f4c81)] focus-visible:ring-offset-0",
              )}
              ref={textareaRef}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
            />

            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-50/80 px-3 py-2 dark:bg-slate-800/70">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 h-9 px-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedModel}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.12 }}
                          className="flex items-center gap-2"
                        >
                          {MODEL_ICONS[selectedModel] || <Bot className="w-4 h-4" />}
                          <span className="font-semibold">{selectedModel}</span>
                          <ChevronDown className="w-4 h-4 opacity-60" />
                        </motion.div>
                      </AnimatePresence>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="min-w-[10rem] bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-xl"
                    align="start"
                  >
                    {AI_MODELS.map((model) => (
                      <DropdownMenuItem
                        key={model}
                        onSelect={() => setSelectedModel(model)}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {MODEL_ICONS[model] || <Bot className="w-4 h-4 opacity-60" />}
                          <span>{model}</span>
                        </div>
                        {selectedModel === model && <Check className="w-4 h-4 text-[color:var(--color-brand,#0f4c81)]" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                <label
                  className={cn(
                    "rounded-lg p-2 bg-slate-100 dark:bg-slate-800 cursor-pointer text-slate-500 dark:text-slate-300",
                    "hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:ring-1 focus-visible:ring-[color:var(--color-brand,#0f4c81)] focus-visible:ring-offset-0",
                  )}
                  aria-label="پیوست فایل"
                >
                  <input type="file" className="hidden" />
                  <Paperclip className="w-4 h-4" />
                </label>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-10 rounded-xl bg-[color:var(--color-brand,#0f4c81)] text-white hover:opacity-90"
                aria-label="ارسال پیام"
                disabled={!value.trim()}
                onClick={() => {
                  if (!value.trim()) return;
                  setValue("");
                  adjustHeight(true);
                }}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AI_Prompt_Demo() {
  return <AI_Prompt />;
}
