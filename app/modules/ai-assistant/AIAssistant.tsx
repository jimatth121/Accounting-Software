"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Panel } from "@/components/Panel";
import { api } from "@/lib/api";
import type { AppData } from "@/lib/types";
import { clsx } from "@/lib/utils";

interface AIAssistantProps {
  data: AppData;
}

interface Message {
  role: "assistant" | "user";
  content: string;
}

export function AIAssistant({ data }: AIAssistantProps) {
  const [question, setQuestion] = useState("Which customers still owe me money?");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Ask about revenue, expenses, outstanding invoices, or profit. I only use company records available in this workspace."
    }
  ]);

  const [busy, setBusy] = useState(false);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (!question.trim() || busy) return;
    const userMessage: Message = { role: "user", content: question };
    setMessages((current) => [...current, userMessage]);
    setBusy(true);
    try {
      const result = await api<{ answer: string }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ question }),
        silent: true
      });
      setMessages((current) => [...current, { role: "assistant", content: result.answer }]);
      setQuestion("");
    } finally {
      setBusy(false);
    }
  }

  const suggestions = useMemo(
    () => [
      `How much revenue did I make?`,
      `What are my biggest expenses?`,
      `Which customers still owe me money?`
    ],
    []
  );

  return (
    <Panel>
      <div className="mb-4">
        <h3 className="text-base font-bold tracking-tight text-slate-900">AI Assistant ✦</h3>
        <p className="mt-0.5 text-sm text-slate-500">Chat with your finances</p>
      </div>

      <div className="grid gap-2.5 max-h-[480px] min-h-[320px] overflow-y-auto pr-1">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "assistant"
                ? "max-w-[760px] rounded-xl bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-900"
                : "max-w-[760px] justify-self-end rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-3 text-sm leading-relaxed text-white shadow-md"
            }
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setQuestion(item)}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
          >
            {item}
          </button>
        ))}
      </div>

      <form className="mt-4 grid gap-2.5 sm:grid-cols-[1fr_120px]" onSubmit={ask}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about your finances"
          className="w-full min-h-[42px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          disabled={busy}
          className={clsx(
            "inline-flex items-center justify-center gap-1.5 min-h-[42px] rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition",
            busy ? "cursor-not-allowed opacity-60" : "hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(99,102,241,0.45)]"
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Thinking…" : "Ask AI"}
        </button>
      </form>

      <p className="mt-3 text-xs text-slate-500">
        Current data: {data.invoices.length} invoices, {data.expenses.length} expenses, {data.payments.length} payments.
      </p>
    </Panel>
  );
}
