import type { Env } from '../../types';
import type { AiSourcePayload, HistoryEntry } from './types';

type WorkersAiRunOptions = {
  gateway?: {
    id: string;
    skipCache?: boolean;
    metadata?: Record<string, unknown>;
  };
};

/**
 * Optional AI Gateway options for Workers AI (`env.AI.run` only).
 * Enable by setting AI_GATEWAY_ID in wrangler — AutoRAG indexing stays ungated.
 */
function workersAiGatewayOptions(aiEnv: Env): WorkersAiRunOptions | undefined {
  if (!aiEnv.AI_GATEWAY_ID) return undefined;
  return {
    gateway: {
      id: aiEnv.AI_GATEWAY_ID,
      // Conversational answers should stay fresh; use gateway for observability.
      skipCache: true,
      metadata: {
        source: 'website-chat',
        path: 'workers-ai',
      },
    },
  };
}

/**
 * Conversational Workers AI path — answers from verified Blake expertise.
 * Do NOT pass SYSTEM/retrieval-junk as the user message.
 */
export async function handleSimpleQueryWithWorkersAI(
  userQuestion: string,
  hist: HistoryEntry[],
  aiEnv: Env
) {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are Blake Oxford's friendly AI assistant on blakeoxford.com.

  Answer conversationally about Blake, his work, and this site. Be specific and useful.

  Blake's verified expertise and work includes:
  - Healthcare technology (AdvancedMD EHR implementation, clinical documentation systems)
  - Enterprise systems (Microsoft Fabric, Google Workspace → Microsoft 365 migration, ADP Workforce Now)
  - Cloud platforms (Cloudflare Workers, Azure, Microsoft 365)
  - AI/ML applications (OpenAI integration for clinical documentation, RAG/AutoRAG)
  - Full-stack development (React, TypeScript, Python, SwiftUI)
  - Finance/ops automation (bank projections modeling, Power BI, Power Platform)

  Guidelines:
  1. Prefer concrete project examples and outcomes from the list above.
  2. If asked what Blake does well, summarize strengths across automation, enterprise systems, AI, and healthcare IT with 2–4 crisp points.
  3. Do not invent employers, clients, or projects that are not listed.
  4. Keep answers to 2–5 short sentences unless the user asks for more detail.
  5. Warm, professional tone — like a knowledgeable colleague, not a legal disclaimer.
  6. Plain text only. Do not use markdown: no **bold**, no *italics*, no # headings, no code fences. Use short sentences or simple "- " bullets if listing points.`,
      },
      ...hist.slice(-3),
      { role: 'user', content: userQuestion },
    ];

    // llama-3.1-8b-instruct was deprecated 2026-05-30; use the active -fast variant
    // Gateway options are supported by Workers AI bindings; installed workers-types
    // may lag the third-argument overload — cast keeps Env typing honest.
    const gatewayOptions = workersAiGatewayOptions(aiEnv);
    const runWorkersAi = aiEnv.AI.run as (
      model: string,
      inputs: {
        messages: Array<{ role: string; content: string }>;
        max_tokens: number;
        temperature: number;
      },
      options?: WorkersAiRunOptions
    ) => Promise<unknown>;
    const response = await runWorkersAi(
      '@cf/meta/llama-3.1-8b-instruct-fast',
      {
        messages,
        max_tokens: 420,
        temperature: 0.65,
      },
      gatewayOptions
    );

    const responseObj =
      response && typeof response === 'object' ? (response as { response?: unknown }) : null;
    const text =
      typeof responseObj?.response === 'string'
        ? responseObj.response
        : typeof response === 'string'
          ? response
          : '';

    if (text.trim()) {
      return {
        message: text.trim(),
        sources: [] as AiSourcePayload[],
        fromWorkersAI: true,
        model: 'llama-3.1-8b-instruct-fast',
      };
    }

    return null;
  } catch (error) {
    console.warn('Workers AI failed, falling back to AutoRAG:', error);
    return null;
  }
}

export function looksLikeEmptyRetrieval(message: string, sourceCount: number): boolean {
  return (
    sourceCount === 0 &&
    /\b(don'?t have that information|no documents|not (found|available) in|cannot provide an answer based on)\b/i.test(
      message
    )
  );
}
