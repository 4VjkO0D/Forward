import type { AppState } from '../types';
import { APP_VERSION, createSeedState } from './reducer';

const STORAGE_KEY = 'forward.state.v1';

/** Restore the last session, or seed a fresh one on first ever launch. */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();

    const parsed = JSON.parse(raw) as Partial<AppState> | null;
    if (!parsed || parsed.version !== APP_VERSION || !Array.isArray(parsed.categories)) {
      return createSeedState();
    }
    return parsed as AppState;
  } catch {
    // Corrupt or unavailable storage (private mode, quota) — start clean.
    return createSeedState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persisting is best-effort; the app still works in-memory.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
