import type { AnalysisDepth } from './types';

export const FREE_WEEKLY_EXPLORATIONS = 3;
export const FREE_SAVED_DECISIONS = 5;
export const FREE_MAX_PATHS = 3;
export const PRO_MAX_PATHS = 4;
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Keeps only the generation timestamps inside the rolling 7-day window. */
export function recentExplorations(timestamps: number[], now = Date.now()): number[] {
  return timestamps.filter((t) => t <= now && now - t < WEEK_MS);
}

export function remainingExplorations(timestamps: number[], isPro: boolean, now = Date.now()) {
  if (isPro) return Infinity;
  return Math.max(0, FREE_WEEKLY_EXPLORATIONS - recentExplorations(timestamps, now).length);
}

export function canExplore(timestamps: number[], isPro: boolean, now = Date.now()) {
  return remainingExplorations(timestamps, isPro, now) > 0;
}

/** When the oldest exploration in the window expires, freeing up a slot. */
export function nextFreeSlotAt(timestamps: number[], now = Date.now()): number | null {
  const recent = recentExplorations(timestamps, now).sort((a, b) => a - b);
  if (recent.length < FREE_WEEKLY_EXPLORATIONS) return null;
  return recent[0] + WEEK_MS;
}

export function canSave(savedCount: number, isPro: boolean, alreadySaved: boolean) {
  return isPro || alreadySaved || savedCount < FREE_SAVED_DECISIONS;
}

export function depthFor(isPro: boolean): AnalysisDepth {
  return isPro ? 'deep' : 'standard';
}

export function maxPathsFor(depth: AnalysisDepth) {
  return depth === 'deep' ? PRO_MAX_PATHS : FREE_MAX_PATHS;
}
