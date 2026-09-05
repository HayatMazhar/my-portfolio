"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Sparkles, X } from "lucide-react";
import ChatInput from "./ChatInput";
import ChatMessages, { ChatMessage } from "./ChatMessages";
import { useChat } from "./ChatContext";

const QUICK_CHIPS = [
  "What AI projects has he shipped?",
  "Tell me about the RAG system at SCAD",
  "Is he available for hire?",
  "What's his tech stack?",
  "How does he reduce GPT-4 costs?",
  "Why hire him over other AI engineers?",
];

export default function ChatWidget() {
  const { open, openChat, closeChat, consumePendingPrompt } = useChat();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followups, setFollowups] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || loading) return;

      setError(null);
      setFollowups([]);

      const userMsg: ChatMessage = { role: "user", content: text };
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "",
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant") {
              next[next.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
            }
            return next;
          });
        }

        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, streaming: false };
          }
          return next;
        });

        // Fetch suggested follow-ups in background (fire-and-forget)
        setFollowups([]);
        fetch("/api/chat/followups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        })
          .then((r) => r.json())
          .then((d: { followups?: string[] }) => {
            if (d.followups?.length) setFollowups(d.followups);
          })
          .catch(() => null);
      } catch (err) {
        const msg =
          err instanceof Error && err.name === "AbortError"
            ? null
            : "Sorry — I couldn't reach the AI right now. Please try again, or email Mazhar1783@outlook.com.";
        if (msg) setError(msg);
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant" && last.streaming) {
            if (last.content) {
              next[next.length - 1] = { ...last, streaming: false };
            } else {
              next.pop();
            }
          }
          return next;
        });
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [messages, loading],
  );

  useEffect(() => {
    if (!open) return;
    const pending = consumePendingPrompt();
    if (pending) {
      void sendMessage(pending);
    }
  }, [open, consumePendingPrompt, sendMessage]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="chat-fab"
            initial={{ opacity: 0, scale: 0.6, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 30 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            onClick={() => openChat()}
            aria-label="Open AI chat"
            className="group fixed bottom-5 right-5 z-50 flex h-12 items-center gap-2 rounded-full border border-[#b8e8ce] bg-white px-4 text-sm text-[#0e0e0d] shadow-[0_12px_28px_-12px_rgba(45,153,97,0.30)] backdrop-blur transition hover:border-[#6dcc99] hover:bg-[#f3fbf7] sm:bottom-8 sm:right-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3fb578] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3fb578]" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.18em]">
              Ask AI
            </span>
            <Sparkles className="h-3.5 w-3.5 text-[#3fb578] transition group-hover:scale-110" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="fixed inset-0 z-50 flex flex-col border border-[#e0dfd8] bg-white sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:inset-auto sm:h-[600px] sm:w-[420px] sm:rounded-3xl sm:shadow-[0_24px_60px_-20px_rgba(14,14,13,0.20)]"
          >
            <header className="flex items-center justify-between border-b border-[#e0dfd8] bg-white px-4 py-3 sm:rounded-t-3xl">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#ebf8f1] text-[#2d9961]">
                  <Bot className="h-4 w-4" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#3fb578] ring-2 ring-white" />
                </div>
                <div className="leading-tight">
                  <p className="font-jakarta text-sm font-bold text-[#0e0e0d]">
                    Mazhar&apos;s AI
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#9a9a96]">
                    <span className="text-[#3fb578]">●</span> Online · Groq GPT-OSS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeChat}
                aria-label="Close chat"
                className="rounded-md p-1.5 text-[#525251] transition hover:bg-[#fafaf7] hover:text-[#0e0e0d]"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto bg-[#fafaf7]">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col gap-5 overflow-y-auto px-5 py-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#b8e8ce] bg-[#ebf8f1] text-[#2d9961]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-[#e0dfd8] bg-white px-4 py-3 text-sm leading-relaxed text-[#0e0e0d] shadow-[0_4px_10px_-6px_rgba(14,14,13,0.06)]">
                      <p>
                        Hey — I&apos;m Mazhar&apos;s AI assistant. I know
                        everything in his CV: projects, stack, the systems he
                        shipped at SCAD, his availability, and his approach.
                      </p>
                      <p className="mt-2 text-[#525251]">
                        Ask me anything, or tap a suggestion below 👇
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9a9a96]">
                      Try asking
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {QUICK_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => sendMessage(chip)}
                          className="group flex items-center justify-between rounded-xl border border-[#e0dfd8] bg-white px-3.5 py-2.5 text-left text-[13px] text-[#0e0e0d] transition hover:border-[#6dcc99] hover:bg-[#f3fbf7]"
                        >
                          <span>{chip}</span>
                          <span className="font-mono text-[#9a9a96] transition group-hover:text-[#2d9961]">
                            ↵
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <ChatMessages messages={messages} loading={loading} />
              )}
            </div>

            {followups.length > 0 && !loading && (
              <div className="border-t border-[#e0dfd8] bg-white px-3 py-2.5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9a9a96]">
                  Suggested
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {followups.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setFollowups([]);
                        sendMessage(q);
                      }}
                      className="rounded-full border border-[#e0dfd8] bg-[#fafaf7] px-2.5 py-1 text-[11px] text-[#525251] transition hover:border-[#6dcc99] hover:bg-[#f3fbf7] hover:text-[#0e0e0d]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => sendMessage(input)}
              disabled={loading}
            />

            <p className="border-t border-[#e0dfd8] bg-white px-4 py-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#9a9a96] sm:rounded-b-3xl">
              Powered by GPT-OSS 120B · Groq
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
