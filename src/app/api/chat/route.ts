import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  ASSISTANT_FALLBACK_MODELS,
  ASSISTANT_SYSTEM_PROMPT,
  DEFAULT_ASSISTANT_MODEL,
} from "@/lib/assistantConfig";

export const maxDuration = 60;
export const runtime = "nodejs";

const MAX_MESSAGES = 24;
const MAX_CONTENT_LENGTH = 4000;
type ChatMessage = { role: "assistant" | "user"; content: string };

function parseTemperature(raw: string | undefined) {
  const value = Number(raw ?? "0.4");
  if (!Number.isFinite(value)) return 0.4;
  return Math.min(Math.max(value, 0), 1);
}

function uniqueModelList(primary: string, fallbacks: string[]) {
  return [primary, ...fallbacks].filter((model, index, list) => model && list.indexOf(model) === index);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const rawMessages: Array<{ role?: string; content?: unknown }> = Array.isArray(body.messages) ? body.messages : [];

    const messages: ChatMessage[] = rawMessages
      .filter((m: { role?: string; content?: unknown }) => typeof m === "object" && m !== null)
      .map((obj: { role?: string; content?: unknown }): ChatMessage => {
        const role = obj.role === "assistant" ? "assistant" : "user";
        const content = typeof obj.content === "string" ? obj.content.trim() : "";
        return { role, content };
      })
      .filter((m) => m.content.length > 0)
      .slice(-MAX_MESSAGES)
      .map((m) => ({ ...m, content: m.content.slice(0, MAX_CONTENT_LENGTH) }));

    if (!messages.length) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const configuredModel = process.env.GROQ_MODEL?.trim() || DEFAULT_ASSISTANT_MODEL;
    const modelCandidates = uniqueModelList(configuredModel, ASSISTANT_FALLBACK_MODELS);
    const userRole = (session.user as { role?: string }).role;
    const roleContext = userRole ? `\nCurrent user role: ${userRole}.` : "";
    const systemPrompt = `${ASSISTANT_SYSTEM_PROMPT}${roleContext}`;
    const temperature = parseTemperature(process.env.ASSISTANT_TEMPERATURE);

    let lastError: unknown = null;
    for (const modelId of modelCandidates) {
      try {
        const result = streamText({
          model: groq(modelId),
          system: systemPrompt,
          messages,
          temperature,
          maxOutputTokens: 900,
        });
        return result.toTextStreamResponse();
      } catch (error: unknown) {
        lastError = error;
      }
    }

    throw lastError ?? new Error("No available model for chat response.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process chat request.";
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
