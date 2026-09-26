import { DIMENSION_KEYS, DecisionAnalysisSchema, type DecisionAnalysis } from './schema';

export type ParseResult =
  | { ok: true; analysis: DecisionAnalysis }
  | { ok: false; reason: 'not_json' | 'invalid_shape'; detail?: string };

/** Pulls the first JSON object out of a string that may contain code fences or prose. */
export function extractJson(raw: string): unknown | undefined {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through to recovery
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return undefined;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return undefined;
  }
}

const LIST_LIMITS: Record<string, number> = {
  immediateEffects: 5,
  longerTermConsiderations: 5,
  benefits: 5,
  tradeoffs: 5,
  risks: 5,
  assumptions: 5,
  uncertainty: 4,
  importantVariables: 5,
  whatWouldChange: 4,
  questionsToConsider: 4,
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const cleanStrings = (v: unknown, max: number): unknown =>
  Array.isArray(v)
    ? v.filter((s) => typeof s === 'string' && s.trim().length > 0).slice(0, max)
    : v;

/**
 * Forgiving pre-pass: repairs harmless deviations (too many list items, duplicate ids,
 * unknown dimensions) so a mostly-correct model response still renders. Anything
 * structurally wrong is left alone for the schema to reject.
 */
export function normalizeAnalysis(input: unknown): unknown {
  if (!isObject(input)) return input;
  const out: Record<string, unknown> = { ...input };
  const dims = new Set<string>(DIMENSION_KEYS);

  if (Array.isArray(out.scenarios)) {
    const seen = new Set<string>();
    out.scenarios = out.scenarios.slice(0, 4).map((s, index) => {
      if (!isObject(s)) return s;
      const scenario: Record<string, unknown> = { ...s };
      let id = typeof scenario.id === 'string' && scenario.id.trim() ? scenario.id.trim() : '';
      if (!id || seen.has(id)) id = `path-${index + 1}`;
      seen.add(id);
      scenario.id = id;
      for (const [key, max] of Object.entries(LIST_LIMITS)) {
        scenario[key] = cleanStrings(scenario[key], max);
      }
      if (typeof scenario.uncertaintyLevel === 'string') {
        scenario.uncertaintyLevel = scenario.uncertaintyLevel.toLowerCase();
      }
      if (Array.isArray(scenario.ratings)) {
        const seenDims = new Set<string>();
        scenario.ratings = scenario.ratings
          .filter(isObject)
          .map((r) => ({
            ...r,
            level: typeof r.level === 'string' ? r.level.toLowerCase() : r.level,
          }))
          .filter((r) => {
            const d = r.dimension as string;
            if (!dims.has(d) || seenDims.has(d)) return false;
            seenDims.add(d);
            return true;
          });
      }
      if (Array.isArray(scenario.branches)) {
        scenario.branches = scenario.branches.slice(0, 2);
        if ((scenario.branches as unknown[]).length === 0) delete scenario.branches;
      } else if (scenario.branches === null) {
        delete scenario.branches;
      }
      return scenario;
    });
  }

  if (Array.isArray(out.comparisonDimensions)) {
    out.comparisonDimensions = Array.from(
      new Set(out.comparisonDimensions.filter((d) => typeof d === 'string' && dims.has(d))),
    );
  }
  out.questions = cleanStrings(out.questions, 5);
  out.assumptions = cleanStrings(out.assumptions, 5);
  out.missingInformation = cleanStrings(out.missingInformation ?? [], 4);
  if (Array.isArray(out.variables)) out.variables = out.variables.slice(0, 6);
  if (out.caution === undefined) out.caution = null;
  return out;
}

export function parseAnalysis(raw: unknown): ParseResult {
  const value = typeof raw === 'string' ? extractJson(raw) : raw;
  if (value === undefined) return { ok: false, reason: 'not_json' };
  const result = DecisionAnalysisSchema.safeParse(normalizeAnalysis(value));
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false,
      reason: 'invalid_shape',
      detail: issue ? `${issue.path.join('.')}: ${issue.message}` : undefined,
    };
  }
  return { ok: true, analysis: result.data };
}
