import { maxPathsFor } from '../../domain/limits';
import { parseAnalysis } from '../../domain/parse';
import type { DecisionAnalysis } from '../../domain/schema';
import type { AnalysisDepth, DecisionInput } from '../../domain/types';
import { config } from '../config';

export type AnalysisErrorKind =
  | 'not_configured'
  | 'offline'
  | 'timeout'
  | 'rate_limited'
  | 'refused'
  | 'bad_request'
  | 'invalid_output'
  | 'server'
  | 'cancelled';

export class AnalysisError extends Error {
  constructor(
    public kind: AnalysisErrorKind,
    message?: string,
  ) {
    super(message ?? kind);
    this.name = 'AnalysisError';
  }
}

export const ERROR_COPY: Record<AnalysisErrorKind, { title: string; body: string }> = {
  not_configured: {
    title: 'Live analysis isn’t set up',
    body: 'This build isn’t connected to Fork’s AI service yet. You can still explore the sample decision.',
  },
  offline: {
    title: 'You’re offline',
    body: 'Building new paths needs a connection. Your saved decisions are still available.',
  },
  timeout: {
    title: 'That took too long',
    body: 'Fork didn’t hear back in time. Your description is still here — try again.',
  },
  rate_limited: {
    title: 'Fork is busy',
    body: 'Too many requests right now. Give it a minute and try again.',
  },
  refused: {
    title: 'Fork can’t explore this one',
    body: 'Try describing a different decision.',
  },
  bad_request: {
    title: 'Add a little more detail',
    body: 'Describe the decision in a sentence or two so Fork has something to work with.',
  },
  invalid_output: {
    title: 'Fork couldn’t build clear paths',
    body: 'The analysis came back incomplete. Trying again usually works.',
  },
  server: {
    title: 'Something went wrong',
    body: 'Fork’s AI service had a problem. Try again in a moment.',
  },
  cancelled: { title: 'Cancelled', body: '' },
};

type Endpoint = { url?: string; key?: string };

type Options = {
  /** Defaults to the build-time config; injectable for tests. */
  endpoint?: Endpoint;
  signal?: AbortSignal;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  retries?: number;
};

// Timeouts are not retried: a second full-length attempt would double the wait.
const RETRYABLE: AnalysisErrorKind[] = ['invalid_output', 'server'];

async function requestOnce(
  input: DecisionInput,
  depth: AnalysisDepth,
  { signal, timeoutMs = 125_000, fetchImpl = fetch, endpoint = { url: config.aiUrl, key: config.aiKey } }: Options,
): Promise<DecisionAnalysis> {
  const { url, key } = endpoint;
  if (!url) throw new AnalysisError('not_configured');

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { Authorization: `Bearer ${key}`, apikey: key } : {}),
      },
      body: JSON.stringify({ ...input, depth }),
      signal: controller.signal,
    });
  } catch {
    if (signal?.aborted) throw new AnalysisError('cancelled');
    if (timedOut) throw new AnalysisError('timeout');
    throw new AnalysisError('offline');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const code = (payload as { error?: string } | null)?.error;
    if (response.status === 429) throw new AnalysisError('rate_limited');
    // 504 from our function, 546 from the Supabase gateway when a worker hits its limit.
    if (code === 'timeout' || response.status === 504 || response.status === 546) throw new AnalysisError('timeout');
    // 401/403 come from the Supabase gateway when the public key is missing or wrong.
    if (code === 'not_configured' || [401, 403, 404].includes(response.status)) throw new AnalysisError('not_configured');
    if (code === 'refused') throw new AnalysisError('refused');
    if (response.status === 400) throw new AnalysisError('bad_request');
    if (code === 'invalid_output') throw new AnalysisError('invalid_output');
    throw new AnalysisError('server', `HTTP ${response.status}`);
  }

  // The server already validated this, but the app never renders unvalidated data.
  const result = parseAnalysis((payload as { analysis?: unknown } | null)?.analysis);
  if (!result.ok) throw new AnalysisError('invalid_output', result.detail);

  const analysis = result.analysis;
  const maxPaths = maxPathsFor(depth);
  return {
    ...analysis,
    scenarios: analysis.scenarios.slice(0, maxPaths).map((s) =>
      depth === 'deep' ? s : { ...s, branches: undefined },
    ),
  };
}

/** Calls the Fork AI proxy, retrying once on transient or malformed responses. */
export async function analyzeDecision(
  input: DecisionInput,
  depth: AnalysisDepth,
  options: Options = {},
): Promise<DecisionAnalysis> {
  const retries = options.retries ?? 1;
  let lastError: AnalysisError | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestOnce(input, depth, options);
    } catch (error) {
      lastError = error instanceof AnalysisError ? error : new AnalysisError('server');
      if (!RETRYABLE.includes(lastError.kind) || options.signal?.aborted) break;
    }
  }
  throw lastError ?? new AnalysisError('server');
}
