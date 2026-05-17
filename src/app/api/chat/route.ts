import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract messages from request body
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!messages.length) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400 }
      );
    }

    // Use Groq with openai/gpt-oss-20b model
    const model = groq("openai/gpt-oss-20b");

    const result = streamText({
      model,
      system: `You are the AtomQuest Copilot, a helpful AI assistant for the Atomberg Goal Tracking Portal.
You help employees formulate SMART goals, summarize check-ins, and help managers write constructive feedback.
You can also answer questions about the goal-setting process.
Be concise, professional, encouraging, and use markdown for formatting.`,
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || "Failed to process chat request." 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
