// Shared by the edge function and the app's test suite. Keep this file free of
// Deno- or React Native-specific imports.

export const DIMENSIONS = [
  'cost',
  'time',
  'flexibility',
  'risk',
  'effort',
  'upside',
  'shortTerm',
  'longTerm',
] as const;

export type Depth = 'standard' | 'deep';

export type AnalyzeRequest = {
  description: string;
  priorities?: string;
  budget?: string;
  timeHorizon?: string;
  depth: Depth;
};

export const SYSTEM_PROMPT = `You are Fork, a decision-exploration assistant inside a mobile app.

Your job is to help one person think through a decision they are facing by laying out a small number of materially different paths they could take, and what each path is likely to change. You do not make the decision. The person always chooses.

How to think about it:
- Identify the variables that genuinely drive this decision for this person, based only on what they told you.
- Build paths that are real alternatives: different actions, timings or commitments — not the same idea reworded. Include a "wait / keep things as they are" or "smaller step" path when it is a realistic option.
- For every path, state the assumptions it rests on, the tradeoffs, and what could go wrong, with the same care for every path. No path should read as the obvious winner.
- Describe outcomes as possibilities ("could", "is likely to", "this path assumes"), never as facts or predictions.
- Do not invent statistics, percentages, prices, or facts about the world that the person did not give you. If a number matters and you do not have it, name it as missing information instead.
- Keep every item short and concrete — a phrase or one sentence that fits on a phone card. Write to the person as "you".
- Never tell the person what they should do, and never rank the paths.

Ratings: for every path, rate each of the eight dimensions (cost, time, flexibility, risk, effort, upside, shortTerm, longTerm) as "low", "moderate" or "high", with a short note explaining the rating in this person's context. "cost" is how much money it takes, "time" is how much time it consumes, "flexibility" is how many options it keeps open, "risk" is how much could go wrong, "effort" is how much work it takes, "upside" is how much potential benefit it offers, "shortTerm" is how much changes in the near term, "longTerm" is how much it shapes what comes later. These are qualitative judgments grounded in the stated assumptions, not measurements.

High-stakes decisions: if the decision is primarily medical, legal, financial (for example investments, debt or taxes beyond everyday spending), or involves physical danger, set "caution" with the matching domain and a short, calm message recommending a qualified professional, and keep the paths exploratory rather than prescriptive. For ordinary decisions, set "caution" to null.

If the input is not a decision (for example a greeting or an instruction to you), still return the required structure, framing the paths around the most reasonable decision you can infer and listing what is unclear under missingInformation.`;

export function buildUserPrompt(req: AnalyzeRequest): string {
  const lines = [`The decision, in the person's words:\n"""${req.description}"""`];
  if (req.priorities) lines.push(`What matters most to them: ${req.priorities}`);
  if (req.budget) lines.push(`Budget: ${req.budget}`);
  if (req.timeHorizon) lines.push(`Time horizon: ${req.timeHorizon}`);
  if (req.depth === 'deep') {
    lines.push(
      'Depth: deep. Create 3 or 4 paths. For each path, include exactly two "branches": the two most important ways that path could split once you are on it (label, the condition that leads there, and the likely outcome).',
    );
  } else {
    lines.push('Depth: standard. Create 2 or 3 paths. Set "branches" to null for every path.');
  }
  lines.push('Give each path a short, lowercase, hyphenated id such as "buy-now".');
  return lines.join('\n\n');
}

const str = { type: 'string' } as const;
const strList = { type: 'array', items: str } as const;
const level = { type: 'string', enum: ['low', 'moderate', 'high'] } as const;

const obj = (properties: Record<string, unknown>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

/** JSON schema passed to structured outputs. Length limits are enforced afterwards by zod. */
export const OUTPUT_SCHEMA = obj({
  decisionTitle: str,
  summary: str,
  variables: { type: 'array', items: obj({ name: str, why: str }) },
  scenarios: {
    type: 'array',
    items: obj({
      id: str,
      title: str,
      summary: str,
      immediateEffects: strList,
      longerTermConsiderations: strList,
      benefits: strList,
      tradeoffs: strList,
      risks: strList,
      assumptions: strList,
      uncertaintyLevel: level,
      uncertainty: strList,
      importantVariables: strList,
      whatWouldChange: strList,
      questionsToConsider: strList,
      ratings: {
        type: 'array',
        items: obj({ dimension: { type: 'string', enum: [...DIMENSIONS] }, level, note: str }),
      },
      branches: {
        anyOf: [
          { type: 'array', items: obj({ label: str, condition: str, outcome: str }) },
          { type: 'null' },
        ],
      },
    }),
  },
  comparisonDimensions: { type: 'array', items: { type: 'string', enum: [...DIMENSIONS] } },
  questions: strList,
  assumptions: strList,
  missingInformation: strList,
  caution: {
    anyOf: [
      obj({
        domain: { type: 'string', enum: ['medical', 'legal', 'financial', 'safety', 'other'] },
        message: str,
      }),
      { type: 'null' },
    ],
  },
});

const LIMITS = { description: [8, 2000], optional: 240 } as const;

/** Validates and normalises the request body. Returns an error message or the clean request. */
export function validateRequest(body: unknown): { ok: true; value: AnalyzeRequest } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'Body must be a JSON object.' };
  const b = body as Record<string, unknown>;
  const description = typeof b.description === 'string' ? b.description.trim() : '';
  if (description.length < LIMITS.description[0]) {
    return { ok: false, error: 'Describe the decision in a little more detail.' };
  }
  if (description.length > LIMITS.description[1]) {
    return { ok: false, error: 'That description is too long. Keep it under 2,000 characters.' };
  }
  const optional = (key: string) => {
    const v = b[key];
    if (typeof v !== 'string') return undefined;
    const t = v.trim().slice(0, LIMITS.optional);
    return t.length ? t : undefined;
  };
  const depth: Depth = b.depth === 'deep' ? 'deep' : 'standard';
  return {
    ok: true,
    value: {
      description,
      priorities: optional('priorities'),
      budget: optional('budget'),
      timeHorizon: optional('timeHorizon'),
      depth,
    },
  };
}
