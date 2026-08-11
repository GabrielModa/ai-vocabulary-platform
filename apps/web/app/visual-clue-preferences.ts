export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const VISUAL_CLUES_STORAGE_KEY = "lexi.visual-clues.enabled.v1";

export function readVisualCluesEnabled(storage: PreferenceStorage): boolean {
  try {
    const stored = storage.getItem(VISUAL_CLUES_STORAGE_KEY);
    if (stored === "false") return false;
    return true;
  } catch {
    return true;
  }
}

export function writeVisualCluesEnabled(storage: PreferenceStorage, enabled: boolean): void {
  try {
    storage.setItem(VISUAL_CLUES_STORAGE_KEY, String(enabled));
  } catch {
    // Storage is optional; the in-memory preference still applies to this session.
  }
}
