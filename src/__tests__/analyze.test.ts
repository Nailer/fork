import { SAMPLE_ANALYSIS } from '../domain/sample';
import { analyzeDecision } from '../services/ai/analyze';

const endpoint = { url: 'https://example.test/analyze', key: 'public-key' };

const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

const input = { description: 'Should I buy a new laptop now or wait a year?' };

describe('analyzeDecision', () => {
  it('reports not_configured when no AI endpoint is set', async () => {
    await expect(analyzeDecision(input, 'standard', { fetchImpl: jest.fn(), endpoint: {} })).rejects.toMatchObject({ kind: 'not_configured' });
  });

  it('sends the input and depth with the public key, and returns a validated analysis', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(json(200, { analysis: SAMPLE_ANALYSIS }));
    const result = await analyzeDecision(input, 'deep', { fetchImpl, endpoint });
    expect(result.decisionTitle).toBe(SAMPLE_ANALYSIS.decisionTitle);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://example.test/analyze');
    expect(JSON.parse(init.body)).toMatchObject({ description: input.description, depth: 'deep' });
    expect(init.headers.Authorization).toBe('Bearer public-key');
  });

  it('strips deeper branches from standard-depth results and caps paths', async () => {
    const four = { ...SAMPLE_ANALYSIS, scenarios: [...SAMPLE_ANALYSIS.scenarios, { ...SAMPLE_ANALYSIS.scenarios[0], id: 'extra' }] };
    const fetchImpl = jest.fn().mockResolvedValue(json(200, { analysis: four }));
    const result = await analyzeDecision(input, 'standard', { fetchImpl, endpoint });
    expect(result.scenarios).toHaveLength(3);
    expect(result.scenarios.every((s) => s.branches === undefined)).toBe(true);
  });

  it('retries once when the output is malformed, then succeeds', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(json(200, { analysis: { nonsense: true } }))
      .mockResolvedValueOnce(json(200, { analysis: SAMPLE_ANALYSIS }));
    await expect(analyzeDecision(input, 'standard', { fetchImpl, endpoint })).resolves.toBeTruthy();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('gives up with invalid_output after the retry', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(json(200, { analysis: 'not an object' }));
    await expect(analyzeDecision(input, 'standard', { fetchImpl, endpoint })).rejects.toMatchObject({ kind: 'invalid_output' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('maps HTTP errors to user-facing kinds without retrying non-transient ones', async () => {
    const cases: [number, unknown, string][] = [
      [429, { error: 'rate_limited' }, 'rate_limited'],
      [422, { error: 'refused' }, 'refused'],
      [400, { error: 'bad_request' }, 'bad_request'],
      [503, { error: 'not_configured' }, 'not_configured'],
    ];
    for (const [status, body, kind] of cases) {
      const fetchImpl = jest.fn().mockResolvedValue(json(status, body));
      await expect(analyzeDecision(input, 'standard', { fetchImpl, endpoint })).rejects.toMatchObject({ kind });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    }
  });

  it('treats a network failure as offline', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await expect(analyzeDecision(input, 'standard', { fetchImpl, endpoint })).rejects.toMatchObject({ kind: 'offline' });
  });

  it('times out slow requests', async () => {
    const fetchImpl = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    );
    await expect(analyzeDecision(input, 'standard', { fetchImpl: fetchImpl as unknown as typeof fetch, endpoint, timeoutMs: 20, retries: 0 })).rejects.toMatchObject({
      kind: 'timeout',
    });
  });

  it('reports cancellation when the caller aborts', async () => {
    const controller = new AbortController();
    const fetchImpl = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    );
    const pending = analyzeDecision(input, 'standard', { fetchImpl: fetchImpl as unknown as typeof fetch, endpoint, signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ kind: 'cancelled' });
  });
});
