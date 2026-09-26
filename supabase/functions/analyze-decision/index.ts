// Fork AI proxy — Supabase Edge Function (Deno).
// Keeps the model API key server-side, validates input, calls Claude with
// structured outputs, and re-validates the result against the app's schema.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Anthropic from '@anthropic-ai/sdk';

import { parseAnalysis } from './parse.ts';
import { OUTPUT_SCHEMA, SYSTEM_PROMPT, buildUserPrompt, validateRequest } from './prompt.ts';

const MODEL = Deno.env.get('FORK_MODEL') ?? 'claude-opus-5';
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

// Best-effort, per-instance rate limit. Good enough to stop accidental loops.
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

let client: Anthropic | null = null;
function getClient() {
  if (client) return client;
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return null;
  client = new Anthropic({ apiKey, timeout: 110_000, maxRetries: 1 });
  return client;
}

async function generate(anthropic: Anthropic, userPrompt: string) {
  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });
  if (response.stop_reason === 'refusal') return { refusal: true as const };
  const text = response.content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('');
  return { refusal: false as const, text, truncated: response.stop_reason === 'max_tokens' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const anthropic = getClient();
  if (!anthropic) return json(503, { error: 'not_configured', message: 'The AI service is not configured yet.' });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) {
    return json(429, { error: 'rate_limited', message: 'Too many requests. Try again in a few minutes.' });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'bad_request', message: 'Body must be JSON.' });
  }
  const parsed = validateRequest(body);
  if (!parsed.ok) return json(400, { error: 'bad_request', message: parsed.error });

  const userPrompt = buildUserPrompt(parsed.value);
  // One retry if the model's output does not pass validation.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await generate(anthropic, userPrompt);
      if (result.refusal) {
        return json(422, {
          error: 'refused',
          message: 'Fork can’t explore this one. Try describing a different decision.',
        });
      }
      const analysis = parseAnalysis(result.text);
      if (analysis.ok) return json(200, { analysis: analysis.analysis, model: MODEL });
      console.warn('invalid analysis', { attempt, reason: analysis.reason, detail: analysis.detail, truncated: result.truncated });
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) {
        return json(429, { error: 'rate_limited', message: 'The AI service is busy. Try again shortly.' });
      }
      if (error instanceof Anthropic.AuthenticationError) {
        console.error('model auth failed');
        return json(503, { error: 'not_configured', message: 'The AI service is not configured correctly.' });
      }
      if (error instanceof Anthropic.APIError) {
        console.error('model api error', error.status);
      } else {
        console.error('unexpected error', error instanceof Error ? error.name : 'unknown');
      }
      if (attempt === 1) return json(502, { error: 'upstream', message: 'The AI service had a problem. Try again.' });
    }
  }
  return json(502, { error: 'invalid_output', message: 'Fork couldn’t build clear paths this time. Try again.' });
});
