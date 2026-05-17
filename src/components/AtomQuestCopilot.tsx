"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X, Send, Loader2, Sparkles, RotateCcw, ChevronDown,
  Bot, User, Zap, MessageSquare, Target, ClipboardList, TrendingUp
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  {
    icon: Target,
    label: "Write a SMART goal",
    prompt: "Help me write a SMART goal for improving team productivity this quarter.",
  },
  {
    icon: TrendingUp,
    label: "Weightage strategy",
    prompt: "I have 5 goals this FY. How should I distribute my 100% weightage across them?",
  },
  {
    icon: ClipboardList,
    label: "Log achievement",
    prompt: "Help me write a quarterly achievement log for Q2. My goal was to reduce response time by 20%.",
  },
  {
    icon: MessageSquare,
    label: "Rework feedback",
    prompt: "Help me write constructive rework feedback for a goal that lacks measurable metrics.",
  },
];

export function AtomQuestCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();

    try {
      abortRef.current = new AbortController();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Request failed (${res.status})`);
      }

      // Add placeholder assistant message
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        // toTextStreamResponse() streams raw text — just decode and append
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { id: assistantId, role: "assistant", content: accumulated },
        ]);
      }

      // If we got nothing, show a fallback
      if (!accumulated) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { id: assistantId, role: "assistant", content: "I received your message but couldn't generate a response. Please try again." },
        ]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      // Remove the empty assistant placeholder if it was added
      setMessages((prev) =>
        prev[prev.length - 1]?.content === "" ? prev.slice(0, -1) : prev
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsLoading(false);
  };

  // ── Floating trigger button ─────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
        title="Open AtomQuest Copilot"
        aria-label="Open AI Copilot"
      >
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-700 shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-indigo-500/40">
          <Sparkles size={22} className="text-white group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-20" />
        </div>
        <span className="absolute -top-10 right-0 bg-slate-900 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-500/30 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          AtomQuest Copilot
        </span>
      </button>
    );
  }

  // ── Chat window ─────────────────────────────────────────────────────────
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-indigo-500/20 bg-slate-950 shadow-2xl shadow-indigo-900/30 transition-all duration-300 overflow-hidden ${
        isMinimized ? "h-14 w-80" : "h-[640px] w-96"
      }`}
    >
      {/* Header */}
      <div className="shrink-0 bg-gradient-to-r from-indigo-600/90 via-violet-600/90 to-purple-700/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <Sparkles size={16} className="text-indigo-200" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-none">AtomQuest Copilot</h3>
            <p className="text-xs text-indigo-200 mt-0.5 leading-none">
              {isLoading ? "Thinking…" : "Powered by GPT-OSS-20B · Groq"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleReset}
              className="p-1.5 hover:bg-white/15 rounded-md transition-colors text-indigo-200 hover:text-white"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className="p-1.5 hover:bg-white/15 rounded-md transition-colors text-indigo-200 hover:text-white"
            aria-label={isMinimized ? "Expand" : "Minimize"}
          >
            <ChevronDown size={16} className={`transition-transform duration-200 ${isMinimized ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => { setIsOpen(false); setIsMinimized(false); }}
            className="p-1.5 hover:bg-white/15 rounded-md transition-colors text-indigo-200 hover:text-white"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-gradient-to-b from-slate-900/80 to-slate-950/80">

            {/* Welcome state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 text-center space-y-5 py-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center">
                  <Bot size={32} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Hey! I&apos;m your AtomQuest Copilot</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[240px] mx-auto">
                    I help you write SMART goals, log achievements, craft feedback, and navigate the portal.
                  </p>
                </div>
                <div className="w-full grid grid-cols-2 gap-2">
                  {QUICK_PROMPTS.map((qp) => (
                    <button
                      key={qp.label}
                      onClick={() => handleQuickPrompt(qp.prompt)}
                      className="flex flex-col items-start gap-1.5 p-2.5 rounded-xl bg-slate-800/60 border border-indigo-500/20 hover:border-indigo-400/40 hover:bg-slate-800 transition-all text-left group"
                    >
                      <qp.icon size={14} className="text-indigo-400 group-hover:text-indigo-300 shrink-0" />
                      <span className="text-xs text-slate-300 font-medium leading-tight group-hover:text-slate-100">
                        {qp.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages list */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap size={13} className="text-indigo-400" />
                  </div>
                )}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words max-w-[78%] ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tr-sm shadow-md"
                      : "bg-slate-800/90 text-slate-200 rounded-tl-sm border border-indigo-500/15 shadow-sm"
                  }`}
                >
                  {message.content ? (
                    message.role === "user" ? (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-indigo-200">{children}</strong>,
                          em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
                          h1: ({ children }) => <h1 className="text-base font-bold text-slate-100 mt-3 mb-1.5 first:mt-0">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold text-slate-100 mt-3 mb-1 first:mt-0 border-b border-indigo-500/20 pb-1">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold text-indigo-300 mt-2.5 mb-1 first:mt-0">{children}</h3>,
                          ul: ({ children }) => <ul className="list-none space-y-1 my-2 pl-0">{children}</ul>,
                          ol: ({ children }) => <ol className="list-none space-y-1 my-2 pl-0 counter-reset-item">{children}</ol>,
                          li: ({ children }) => (
                            <li className="flex gap-2 items-start text-slate-300">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                              <span>{children}</span>
                            </li>
                          ),
                          code: ({ children }) => <code className="bg-slate-700/70 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                          pre: ({ children }) => <pre className="bg-slate-900 border border-indigo-500/20 rounded-lg p-3 my-2 overflow-x-auto text-xs">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-400 pl-3 my-2 text-slate-400 italic">{children}</blockquote>,
                          hr: () => <hr className="border-indigo-500/20 my-3" />,
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-2 rounded-lg border border-indigo-500/20">
                              <table className="w-full text-xs">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-indigo-900/40">{children}</thead>,
                          tbody: ({ children }) => <tbody className="divide-y divide-indigo-500/10">{children}</tbody>,
                          tr: ({ children }) => <tr className="">{children}</tr>,
                          th: ({ children }) => <th className="px-3 py-2 text-left text-indigo-300 font-semibold whitespace-nowrap">{children}</th>,
                          td: ({ children }) => <td className="px-3 py-2 text-slate-300">{children}</td>,
                          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">{children}</a>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )
                  ) : (
                    <div className="flex gap-1.5 items-center py-0.5">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={13} className="text-violet-400" />
                  </div>
                )}
              </div>
            ))}

            {/* Standalone loading indicator (before first token) */}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Loader2 size={13} className="text-indigo-400 animate-spin" />
                </div>
                <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm bg-slate-800/90 border border-indigo-500/15">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex gap-2.5 justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-red-900/30 border border-red-500/30 text-red-200 text-sm max-w-[80%]">
                  <p className="font-medium text-red-300">Something went wrong</p>
                  <p className="text-xs mt-1 text-red-400">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt shortcut bar (shows early in conversation) */}
          {messages.length > 0 && messages.length < 4 && (
            <div className="shrink-0 px-3 py-2 flex gap-2 overflow-x-auto border-t border-indigo-500/10 bg-slate-900/60">
              {QUICK_PROMPTS.slice(0, 3).map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => handleQuickPrompt(qp.prompt)}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-indigo-500/20 text-xs text-slate-300 hover:text-white hover:border-indigo-400/40 transition-all whitespace-nowrap"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 border-t border-indigo-500/20 bg-slate-900/80 p-3">
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your goals…"
                disabled={isLoading}
                className="flex-1 bg-slate-800/80 border border-indigo-500/25 focus:border-indigo-400/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white rounded-xl transition-all flex items-center justify-center shadow-md disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
            <p className="text-center text-slate-600 text-[10px] mt-2">
              Llama 4 Maverick · Groq · May produce inaccurate info
            </p>
          </div>
        </>
      )}
    </div>
  );
}
