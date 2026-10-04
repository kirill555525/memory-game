const STORAGE_KEY = 'memory-game.results.v1';
const MAX_RESULTS = 10;

function rankResults(results) {
  const ids = new Set();
  return results.filter((entry) => {
    if (!entry || typeof entry.id !== 'string' || !entry.id
      || !Number.isInteger(entry.moves) || entry.moves < 8
      || !Number.isFinite(entry.timestamp) || entry.timestamp <= 0
      || !Number.isFinite(new Date(entry.timestamp).getTime()) || ids.has(entry.id)) return false;
    ids.add(entry.id);
    return true;
  }).sort((a, b) => a.moves - b.moves || a.timestamp - b.timestamp).slice(0, MAX_RESULTS);
}

export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()]
    .map((part) => String(part).padStart(2, '0')).join('.');
}

export class ResultStore {
  constructor(getStorage = () => globalThis.localStorage) {
    this.getStorage = getStorage;
    this.results = [];
    this.available = true;
    this.read();
  }

  read() {
    try {
      const saved = this.getStorage().getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        this.results = Array.isArray(parsed) ? rankResults(parsed) : [];
      }
      this.available = true;
    } catch {
      this.available = false;
    }
    return [...this.results];
  }

  add(result) {
    this.read();
    this.results = rankResults([...this.results, result]);
    try {
      this.getStorage().setItem(STORAGE_KEY, JSON.stringify(this.results));
      this.available = true;
    } catch {
      this.available = false;
    }
    return [...this.results];
  }
}
