// Fork AI proxy — Supabase Edge Function (Deno).
// Keeps provider API keys server-side, validates input, calls the configured model,
// and re-validates the result against the app's schema.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from '@anthropic-ai/sdk';

import { parseAnalysis } from './parse.ts';
import { OUTPUT_SCHEMA, SYSTEM_PROMPT, buildUserPrompt, validateRequest } from './prompt.ts';

const PROVIDER = (Deno.env.get('FORK_AI_PROVIDER') ?? (Deno.env.get('GEMINI_API_KEY') ? 'gemini' : 'anthropic')).toLowerCase();
const ANTHROPIC_MODEL = Deno.env.get('FORK_MODEL') ?? 'claude-opus-5';
const GEMINI_MODEL = Deno.env.get('FORK_GEMINI_MODEL') ?? 'gemini-2.5-flash';
const RATE_LIMIT = Number(Deno.env.get('FORK_RATE_LIMIT_PER_10_MIN') ?? '12');
const WINDOW_MS = 10 * 60 * 1000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const hits = new Map<string, number[]>();
function rateLimited(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

let anthropicClient: Anthropic | null = null;
function getAnthropicClient() {
  if (anthropicClient) return anthropicClient;
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return null;
  anthropicClient = new Anthropic({ apiKey, maxRetries: 0 });
  return anthropicClient;
}

const BUDGET_MS = 105_000;
const MIN_RETRY_MS = 45_000;
const EFFORT = (Deno.env.get('FORK_EFFORT') ?? 'low') as 'low' | 'medium' | 'high';
type Mode = 'structured' | 'plain';
type Generated = { refusal: boolean; text: string; truncated?: boolean; model: string };

async function generateAnthropic(userPrompt: string, timeoutMs: number, mode: Mode): Promise<Generated> {
  const anthropic = getAnthropicClient();
  if (!anthropic) throw new Error('provider_not_configured');
  const response = mode === 'structured'
    ? await anthropic.beta.messages.create(
        {
          model: ANTHROPIC_MODEL,
          max_tokens: 12000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          thinking: { type: 'adaptive' },
          output_config: { effort: EFFORT, format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        },
        { timeout: timeoutMs },
      )
    : await anthropic.messages.create(
        {
          model: ANTHROPIC_MODEL,
          max_tokens: 12000,
          output_config: { effort: EFFORT },
          system: `${SYSTEM_PROMPT}\n\nRespond with only one JSON object (no prose, no code fences) matching this JSON schema:\n${JSON.stringify(OUTPUT_SCHEMA)}`,
          messages: [{ role: 'user', content: userPrompt }],
        },
        { timeout: timeoutMs },
      );
  if (response.stop_reason === 'refusal') return { refusal: true, text: '', model: ANTHROPIC_MODEL };
  const text = response.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
  return { refusal: false, text, truncated: response.stop_reason === 'max_tokens', model: ANTHROPIC_MODEL };
}

async function generateGemini(userPrompt: string, timeoutMs: number, mode: Mode): Promise<Generated> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('provider_not_configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  try {
    const generationConfig: Record<string, unknown> = {
      responseMimeType: 'application/json',
      temperature: 0.35,
      maxOutputTokens: 8192,
    };
    if (mode === 'structured') generationConfig.responseJsonSchema = OUTPUT_SCHEMA;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig,
        }),
        signal: controller.signal,
      },
    );
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!response.ok) {
      const detail = JSON.stringify(payload ?? {}).slice(0, 500);
      throw new Error(`gemini_http_${response.status}:${detail}`);
    }
    const candidates = Array.isArray(payload?.candidates) ? payload.candidates as Array<Record<string, unknown>> : [];
    const candidate = candidates[0];
    const finishReason = typeof candidate?.finishReason === 'string' ? candidate.finishReason : '';
    if (['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII'].includes(finishReason)) {
      return { refusal: true, text: '', model: GEMINI_MODEL };
    }
    const content = candidate?.content as Record<string, unknown> | undefined;
    const parts = Array.isArray(content?.parts) ? content.parts as Array<Record<string, unknown>> : [];
    const text = parts.map((part) => (typeof part.text === 'string' ? part.text : '')).join('');
    return { refusal: false, text, truncated: finishReason === 'MAX_TOKENS', model: GEMINI_MODEL };
  } finally {
    clearTimeout(timer);
  }
}

async function generate(userPrompt: string, timeoutMs: number, mode: Mode): Promise<Generated> {
  return PROVIDER === 'gemini'
    ? generateGemini(userPrompt, timeoutMs, mode)
    : generateAnthropic(userPrompt, timeoutMs, mode);
}

const errorText = (error: unknown) => (error instanceof Error ? error.message.slice(0, 500) : 'unknown');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  if (PROVIDER === 'gemini' && !Deno.env.get('GEMINI_API_KEY')) {
    return json(503, { error: 'not_configured', message: 'The AI service is not configured yet.' });
  }
  if (PROVIDER !== 'gemini' && !Deno.env.get('ANTHROPIC_API_KEY')) {
    return json(503, { error: 'not_configured', message: 'The AI service is not configured yet.' });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) return json(429, { error: 'rate_limited', message: 'Too many requests. Try again in a few minutes.' });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'bad_request', message: 'Body must be JSON.' });
  }
  const parsed = validateRequest(body);
  if (!parsed.ok) return json(400, { error: 'bad_request', message: parsed.error });

  const userPrompt = buildUserPrompt(parsed.value);
  const started = Date.now();
  let mode: Mode = 'structured';
  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = BUDGET_MS - (Date.now() - started);
    if (attempt > 0 && remaining < MIN_RETRY_MS) break;
    try {
      const result = await generate(userPrompt, remaining, mode);
      if (result.refusal) return json(422, { error: 'refused', message: 'Fork can’t explore this one. Try describing a different decision.' });
      const analysis = parseAnalysis(result.text);
      if (analysis.ok) return json(200, { analysis: analysis.analysis, model: result.model, provider: PROVIDER });
      console.warn('invalid analysis', { provider: PROVIDER, attempt, reason: analysis.reason, detail: analysis.detail, truncated: result.truncated });
      mode = 'plain';
    } catch (error) {
      const message = errorText(error);
      console.error('model request failed', { provider: PROVIDER, attempt, mode, message });
      if (/provider_not_configured|401|403|API_KEY_INVALID|invalid api key/i.test(message)) {
        return json(503, { error: 'not_configured', message: 'The AI service is not configured correctly.' });
      }
      if (/credit balance|billing|purchase credits|RESOURCE_EXHAUSTED|quota/i.test(message)) {
        return json(503, { error: 'billing', message: 'The AI service has reached its current quota.' });
      }
      if (/429/.test(message)) return json(429, { error: 'rate_limited', message: 'The AI service is busy. Try again shortly.' });
      if (/AbortError|aborted|timeout/i.test(message)) return json(504, { error: 'timeout', message: 'The AI service took too long. Try again.' });
      // A structured-schema incompatibility gets one conservative JSON-only retry.
      if (mode === 'structured' && /400|INVALID_ARGUMENT|schema|responseJsonSchema/i.test(message)) {
        mode = 'plain';
        continue;
      }
      if (attempt === 1) return json(502, { error: 'upstream', message: 'The AI service had a problem. Try again.' });
    }
  }
  if (Date.now() - started >= BUDGET_MS - MIN_RETRY_MS) {
    return json(504, { error: 'timeout', message: 'The AI service took too long. Try again.' });
  }
  return json(502, { error: 'invalid_output', message: 'Fork couldn’t build clear paths this time. Try again.' });
});
