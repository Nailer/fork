import type { DimensionKey, Level } from './schema';

export type DimensionMeta = {
  key: DimensionKey;
  label: string;
  /** What each qualitative level reads as, so meaning never depends on colour alone. */
  levels: Record<Level, string>;
  pro: boolean;
};

export const DIMENSIONS: Record<DimensionKey, DimensionMeta> = {
  cost: {
    key: 'cost',
    label: 'Cost',
    levels: { low: 'Low cost', moderate: 'Some cost', high: 'High cost' },
    pro: false,
  },
  time: {
    key: 'time',
    label: 'Time',
    levels: { low: 'Little time', moderate: 'Some time', high: 'A lot of time' },
    pro: false,
  },
  flexibility: {
    key: 'flexibility',
    label: 'Flexibility',
    levels: { low: 'Locks you in', moderate: 'Some room', high: 'Keeps options open' },
    pro: false,
  },
  risk: {
    key: 'risk',
    label: 'Risk',
    levels: { low: 'Low risk', moderate: 'Some risk', high: 'Higher risk' },
    pro: false,
  },
  effort: {
    key: 'effort',
    label: 'Effort',
    levels: { low: 'Light lift', moderate: 'Some effort', high: 'Heavy lift' },
    pro: true,
  },
  upside: {
    key: 'upside',
    label: 'Potential upside',
    levels: { low: 'Modest upside', moderate: 'Some upside', high: 'Big upside' },
    pro: true,
  },
  shortTerm: {
    key: 'shortTerm',
    label: 'Short-term impact',
    levels: { low: 'Small change now', moderate: 'Noticeable now', high: 'Big change now' },
    pro: true,
  },
  longTerm: {
    key: 'longTerm',
    label: 'Long-term impact',
    levels: { low: 'Fades over time', moderate: 'Lasting effect', high: 'Shapes what comes next' },
    pro: true,
  },
};

export const FREE_DIMENSIONS: DimensionKey[] = ['cost', 'time', 'flexibility', 'risk'];
export const ALL_DIMENSIONS = Object.keys(DIMENSIONS) as DimensionKey[];

export const LEVEL_LABEL: Record<Level, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

export const LEVEL_VALUE: Record<Level, number> = { low: 1, moderate: 2, high: 3 };
