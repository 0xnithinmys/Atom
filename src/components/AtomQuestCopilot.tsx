"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AtomQuestCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: "user", content: input },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let messageId = (Date.now() + 1).toString();
      let messageAdded = false;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              
              // Handle different possible formats from the AI SDK
              let textContent = "";
              if (parsed.type === "text-delta" && parsed.textDelta) {
                textContent = parsed.textDelta;
              } else if (parsed.delta && typeof parsed.delta === "string") {
                textContent = parsed.delta;
              } else if (typeof parsed === "string") {
                textContent = parsed;
              } else if (parsed.choices && parsed.choices[0]?.delta?.content) {
                textContent = parsed.choices[0].delta.content;
              }

              if (textContent && textContent !== "undefined") {
                assistantMessage += textContent;

                if (!messageAdded) {
                  setMessages((prev) => [
                    ...prev,
                    { id: messageId, role: "assistant", content: assistantMessage },
                  ]);
                  messageAdded = true;
                } else {
                  setMessages((prev) => [
                    ...prev.slice(0, -1),
                    { id: messageId, role: "assistant", content: assistantMessage },
                  ]);
                }
              }
            } catch (e) {
              // Silently ignore parse errors
            }
          }
        }
      }
    } catch (err: any) {
      setError({ message: err.message || "Failed to fetch response" });
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200 group"
        title="Open AtomQuest Copilot"
      >
        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] rounded-2xl border border-indigo-500/30 bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 text-white flex justify-between items-center border-b border-indigo-500/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-400/20 flex items-center justify-center">
            <Sparkles size={18} className="text-indigo-300" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AtomQuest Copilot</h3>
            <p className="text-xs text-indigo-300">Powered by Groq AI</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1.5 rounded-md transition-colors"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-900/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Sparkles size={24} className="text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">Welcome to AtomQuest Copilot</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ask me about:
                <br />• Formulating SMART goals
                <br />• Goal-setting strategies
                <br />• Writing constructive feedback
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
          >
            {message.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Sparkles size={14} className="text-indigo-400" />
              </div>
            )}

            <div
              className={`px-3 py-2 rounded-lg max-w-xs text-sm leading-relaxed break-words ${
                message.role === "user"
                  ? "bg-indigo-600/80 text-slate-50 rounded-br-none shadow-md"
                  : "bg-slate-800/80 text-slate-200 rounded-bl-none border border-indigo-500/20 shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && messages.length > 0 && (
          <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Loader2 size={14} className="text-indigo-400 animate-spin" />
            </div>
            <div className="px-3 py-2 rounded-lg bg-slate-800/80 text-slate-300 text-sm rounded-bl-none border border-indigo-500/20 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-3 justify-start animate-in fade-in">
            <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
              <X size={14} className="text-red-400" />
            </div>
            <div className="px-3 py-2 rounded-lg bg-red-900/30 text-red-200 text-sm rounded-bl-none border border-red-500/30 shadow-sm">
              <p className="font-medium">Error</p>
              <p className="text-xs mt-1">{error.message}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-indigo-500/30 bg-slate-900/50 p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 bg-slate-800 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
