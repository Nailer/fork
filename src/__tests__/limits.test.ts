import {
  FREE_SAVED_DECISIONS,
  FREE_WEEKLY_EXPLORATIONS,
  WEEK_MS,
  canExplore,
  canSave,
  depthFor,
  maxPathsFor,
  nextFreeSlotAt,
  recentExplorations,
  remainingExplorations,
} from '../domain/limits';

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

describe('free usage limit', () => {
  it('gives three explorations per rolling week', () => {
    expect(FREE_WEEKLY_EXPLORATIONS).toBe(3);
    expect(remainingExplorations([], false, NOW)).toBe(3);
    expect(remainingExplorations([NOW - DAY, NOW - 2 * DAY], false, NOW)).toBe(1);
    expect(canExplore([NOW - 1, NOW - 2, NOW - 3], false, NOW)).toBe(false);
  });

  it('forgets explorations older than seven days', () => {
    const old = NOW - WEEK_MS - 1;
    expect(recentExplorations([old, NOW - DAY], NOW)).toEqual([NOW - DAY]);
    expect(canExplore([old, old, old], false, NOW)).toBe(true);
  });

  it('ignores timestamps from the future (clock changes)', () => {
    expect(recentExplorations([NOW + DAY], NOW)).toEqual([]);
  });

  it('is unlimited for Pro', () => {
    const many = Array.from({ length: 50 }, (_, i) => NOW - i);
    expect(remainingExplorations(many, true, NOW)).toBe(Infinity);
    expect(canExplore(many, true, NOW)).toBe(true);
  });

  it('reports when the next free slot opens', () => {
    const stamps = [NOW - 3 * DAY, NOW - DAY, NOW - 2 * DAY];
    expect(nextFreeSlotAt(stamps, NOW)).toBe(NOW - 3 * DAY + WEEK_MS);
    expect(nextFreeSlotAt([NOW - DAY], NOW)).toBeNull();
  });
});

describe('saved decision limit and depth', () => {
  it('caps free saves but always allows re-saving an existing decision', () => {
    expect(canSave(FREE_SAVED_DECISIONS - 1, false, false)).toBe(true);
    expect(canSave(FREE_SAVED_DECISIONS, false, false)).toBe(false);
    expect(canSave(FREE_SAVED_DECISIONS, false, true)).toBe(true);
    expect(canSave(999, true, false)).toBe(true);
  });

  it('maps entitlement to analysis depth', () => {
    expect(depthFor(false)).toBe('standard');
    expect(depthFor(true)).toBe('deep');
    expect(maxPathsFor('standard')).toBe(3);
    expect(maxPathsFor('deep')).toBe(4);
  });
});
