import { LEVEL_VALUE } from './dimensions';
import type { DimensionKey, Level, Rating, Scenario } from './schema';

export type ComparisonCell = { scenarioId: string; rating: Rating | null };

export type ComparisonRow = {
  dimension: DimensionKey;
  cells: ComparisonCell[];
  /** 0 = every path looks the same here, 2 = paths sit at opposite ends. */
  spread: number;
};

export function ratingFor(scenario: Scenario, dimension: DimensionKey): Rating | null {
  return scenario.ratings.find((r) => r.dimension === dimension) ?? null;
}

export function spreadOf(levels: Level[]): number {
  if (levels.length < 2) return 0;
  const values = levels.map((l) => LEVEL_VALUE[l]);
  return Math.max(...values) - Math.min(...values);
}

/**
 * Builds the comparison table for the dimensions the user cares about.
 * Rows where the paths genuinely differ come first — that's where the decision lives.
 * This deliberately does not total or score paths: Fork never ranks the options.
 */
export function buildComparison(scenarios: Scenario[], selected: DimensionKey[]): ComparisonRow[] {
  const rows = selected.map((dimension, order) => {
    const cells = scenarios.map((s) => ({ scenarioId: s.id, rating: ratingFor(s, dimension) }));
    const levels = cells.flatMap((c) => (c.rating ? [c.rating.level] : []));
    return { dimension, cells, spread: spreadOf(levels), order };
  });
  rows.sort((a, b) => b.spread - a.spread || a.order - b.order);
  return rows.map(({ order: _order, ...row }) => row);
}

/** Dimensions any scenario has a rating for, in canonical order. */
export function availableDimensions(scenarios: Scenario[], canonical: DimensionKey[]): DimensionKey[] {
  const present = new Set(scenarios.flatMap((s) => s.ratings.map((r) => r.dimension)));
  return canonical.filter((d) => present.has(d));
}

export function toggleDimension(selected: DimensionKey[], key: DimensionKey): DimensionKey[] {
  if (selected.includes(key)) {
    return selected.length > 1 ? selected.filter((k) => k !== key) : selected;
  }
  return [...selected, key];
}

/** The rows where paths differ most, for the decision summary. */
export function keyDifferences(rows: ComparisonRow[], limit = 3): ComparisonRow[] {
  return rows.filter((r) => r.spread > 0).slice(0, limit);
}
