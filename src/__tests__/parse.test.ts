import { extractJson, parseAnalysis } from '../domain/parse';
import { SAMPLE_ANALYSIS } from '../domain/sample';
import { DecisionAnalysisSchema } from '../domain/schema';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

describe('decision analysis schema', () => {
  it('accepts the bundled sample decision', () => {
    expect(DecisionAnalysisSchema.safeParse(SAMPLE_ANALYSIS).success).toBe(true);
  });

  it('requires at least two scenarios', () => {
    const one = clone(SAMPLE_ANALYSIS);
    one.scenarios = one.scenarios.slice(0, 1);
    expect(parseAnalysis(one)).toMatchObject({ ok: false, reason: 'invalid_shape' });
  });

  it('rejects unknown uncertainty levels', () => {
    const bad = clone(SAMPLE_ANALYSIS) as unknown as { scenarios: { uncertaintyLevel: string }[] };
    bad.scenarios[0].uncertaintyLevel = 'certain';
    expect(parseAnalysis(bad).ok).toBe(false);
  });
});

describe('parseAnalysis — malformed model output', () => {
  it('returns not_json for prose', () => {
    expect(parseAnalysis('I think you should buy it.')).toEqual({ ok: false, reason: 'not_json' });
  });

  it('returns not_json for truncated JSON', () => {
    const text = JSON.stringify(SAMPLE_ANALYSIS).slice(0, 500);
    expect(parseAnalysis(text)).toEqual({ ok: false, reason: 'not_json' });
  });

  it('recovers JSON wrapped in a code fence and prose', () => {
    const text = `Here you go:\n\`\`\`json\n${JSON.stringify(SAMPLE_ANALYSIS)}\n\`\`\`\nHope it helps.`;
    const result = parseAnalysis(text);
    expect(result.ok).toBe(true);
  });

  it('never throws on odd input', () => {
    for (const input of [null, undefined, 42, [], {}, '', '{', '{"scenarios": null}']) {
      expect(() => parseAnalysis(input)).not.toThrow();
      expect(parseAnalysis(input).ok).toBe(false);
    }
  });

  it('repairs harmless deviations instead of failing', () => {
    const messy = clone(SAMPLE_ANALYSIS) as unknown as Record<string, any>;
    messy.scenarios[1].id = messy.scenarios[0].id; // duplicate id
    messy.scenarios[0].benefits = ['a', 'b', 'c', 'd', 'e', 'f', 'g']; // too many
    messy.scenarios[0].ratings.push({ dimension: 'vibes', level: 'high', note: 'n/a' }); // unknown dimension
    messy.scenarios[0].uncertaintyLevel = 'LOW'; // wrong case
    messy.scenarios[2].branches = null; // null instead of absent
    delete messy.caution; // missing optional-ish field

    const result = parseAnalysis(messy);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ids = result.analysis.scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.analysis.scenarios[0].benefits).toHaveLength(5);
    expect(result.analysis.scenarios[0].ratings.some((r) => (r.dimension as string) === 'vibes')).toBe(false);
    expect(result.analysis.scenarios[0].uncertaintyLevel).toBe('low');
    expect(result.analysis.scenarios[2].branches).toBeUndefined();
    expect(result.analysis.caution).toBeNull();
  });

  it('extractJson finds an object inside surrounding text', () => {
    expect(extractJson('noise {"a": 1} trailing')).toEqual({ a: 1 });
    expect(extractJson('no braces here')).toBeUndefined();
  });
});
