const SCHEMA_VERSION_KEY = 'unlock_schema_version';
const CURRENT_VERSION = 1;

export function checkAndMigrate(): void {
  const stored = localStorage.getItem(SCHEMA_VERSION_KEY);
  const version = stored ? parseInt(stored, 10) : 0;

  if (version < CURRENT_VERSION) {
    // Run migrations here when schema changes
    // For v1, no migrations needed
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_VERSION));
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function exportAllData(): string {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('unlock_'));
  const data: Record<string, unknown> = {};
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): void {
  const data = JSON.parse(json) as Record<string, unknown>;
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('unlock_')) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }
}

export function resetAllData(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('unlock_'));
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}
