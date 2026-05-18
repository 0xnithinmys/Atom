# Atom Assistant - Chat Configuration Summary

## Overview
The in-app AI assistant is configured for streaming chat through Groq and aligned to the Atom goal management workflows.

## Current Configuration

### API Route
- File: `src/app/api/chat/route.ts`
- Method: `POST /api/chat`
- Runtime: Node.js route handler
- Authentication: Requires logged-in session via `auth()`
- Streaming: `streamText(...).toTextStreamResponse()`

### Assistant Settings
- File: `src/lib/assistantConfig.ts`
- App name: `Atom`
- Assistant name: `Atom Assistant`
- Provider: `Groq`
- Default model: `openai/gpt-oss-20b`
- Env overrides:
  - `GROQ_MODEL`
  - `ASSISTANT_TEMPERATURE`

### UI Component
- File: `src/components/AtomAssistant.tsx`
- Mount point: `src/app/(app)/layout.tsx`
- Behavior:
  - Floating launcher
  - Real-time streamed responses
  - Quick prompts for common goal tasks
  - Reset/clear conversation
  - Error handling and loading states

## Reliability and Safety Controls
- Request requires authenticated user.
- Incoming messages are sanitized and trimmed.
- Empty messages are rejected with `400`.
- Context is capped by count and message length.
- Temperature is bounded to `0..1`.

## Recommended Environment Variables
```env
GROQ_API_KEY=...
GROQ_MODEL=openai/gpt-oss-20b
ASSISTANT_TEMPERATURE=0.4
```

## Validation Steps
1. Start app: `npm run dev`
2. Sign in with seeded account.
3. Open assistant from bottom-right launcher.
4. Send a prompt and verify streaming response.
5. Confirm unauthorized access to `/api/chat` is blocked when logged out.

## Notes
- Assistant responses are generated at request time and are not persisted by default.
- For analytics/history, add a conversation persistence table and API route.
