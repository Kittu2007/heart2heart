import { supabaseAdmin } from '../supabase/admin';

export type AiOperationType = 'task_generation' | 'sentiment_analysis';
export type AiLogStatus = 'success' | 'error' | 'fallback';

interface LogAiCallParams {
  coupleId?: string | null;
  operationType: AiOperationType;
  status: AiLogStatus;
  latencyMs?: number;
  errorMessage?: string;
  promptHash?: string;
  tokenCount?: number;
  modelUsed?: string;
}

export async function logAiCall(params: LogAiCallParams): Promise<void> {
  const {
    coupleId = null,
    operationType,
    status,
    latencyMs,
    errorMessage,
    promptHash,
    tokenCount,
    modelUsed = 'gemini-1.5-flash',
  } = params;

  try {
    const query = supabaseAdmin.from('ai_logs') as any;
    const { error } = await query.insert({
      couple_id: coupleId,
      operation_type: operationType,
      status,
      latency_ms: latencyMs ?? null,
      error_message: errorMessage ?? null,
      prompt_hash: promptHash ?? null,
      token_count: tokenCount ?? null,
      model_used: modelUsed,
      timestamp: new Date().toISOString(),
    });
    if (error) console.warn('[logAiCall] Failed to write ai_log:', error.message);
  } catch (err) {
    console.warn('[logAiCall] Unexpected error:', err);
  }
}

export async function hashPrompt(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);
}
