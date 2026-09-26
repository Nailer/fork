import { availableDimensions, buildComparison, keyDifferences, spreadOf, toggleDimension } from '../domain/compare';
import { ALL_DIMENSIONS } from '../domain/dimensions';
import { SAMPLE_ANALYSIS } from '../domain/sample';

const scenarios = SAMPLE_ANALYSIS.scenarios;

describe('comparison logic', () => {
  it('measures how far apart paths are', () => {
    expect(spreadOf(['low', 'high'])).toBe(2);
    expect(spreadOf(['moderate', 'moderate'])).toBe(0);
    expect(spreadOf(['low'])).toBe(0);
  });

  it('only includes the dimensions the user selected', () => {
    const rows = buildComparison(scenarios, ['cost', 'risk']);
    expect(rows.map((r) => r.dimension).sort()).toEqual(['cost', 'risk']);
    expect(rows[0].cells).toHaveLength(scenarios.length);
  });

  it('puts the biggest differences first without scoring paths', () => {
    // cost: high/low/moderate (spread 2); risk: low/moderate/moderate (spread 1)
    const rows = buildComparison(scenarios, ['risk', 'cost']);
    expect(rows[0].dimension).toBe('cost');
    expect(rows[0].spread).toBe(2);
    expect(rows[1].spread).toBe(1);
    expect(rows.every((r) => !('score' in r))).toBe(true);
  });

  it('keeps the original order for ties', () => {
    const rows = buildComparison(scenarios, ['flexibility', 'cost']);
    expect(rows.map((r) => r.dimension)).toEqual(['flexibility', 'cost']);
  });

  it('handles a dimension a path did not rate', () => {
    const partial = scenarios.map((s, i) => (i === 0 ? { ...s, ratings: s.ratings.filter((r) => r.dimension !== 'cost') } : s));
    const [row] = buildComparison(partial, ['cost']);
    expect(row.cells[0].rating).toBeNull();
    expect(row.cells[1].rating?.level).toBe('low');
  });

  it('toggles dimensions but never empties the selection', () => {
    expect(toggleDimension(['cost', 'risk'], 'risk')).toEqual(['cost']);
    expect(toggleDimension(['cost'], 'cost')).toEqual(['cost']);
    expect(toggleDimension(['cost'], 'time')).toEqual(['cost', 'time']);
  });

  it('lists available dimensions in canonical order', () => {
    expect(availableDimensions(scenarios, ALL_DIMENSIONS)).toEqual(ALL_DIMENSIONS);
  });

  it('summarises only the rows where paths actually differ', () => {
    const same = scenarios.map((s) => ({ ...s, ratings: s.ratings.map((r) => ({ ...r, level: 'moderate' as const })) }));
    expect(keyDifferences(buildComparison(same, ['cost', 'risk']))).toHaveLength(0);
    expect(keyDifferences(buildComparison(scenarios, ALL_DIMENSIONS), 2)).toHaveLength(2);
  });
});
