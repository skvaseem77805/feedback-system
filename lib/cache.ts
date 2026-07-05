type CacheEntry = { v: unknown; e: number };

const DEFAULT_TTL = 30 * 1000; // 30s
const MAX_ENTRIES = Number(process.env.CACHE_MAX_ENTRIES ?? 1000);

class SimpleCache {
  private map = new Map<string, CacheEntry>();

  get<T = unknown>(key: string): T | null {
    const ent = this.map.get(key);
    if (!ent) return null;
    if (ent.e && Date.now() > ent.e) {
      this.map.delete(key);
      return null;
    }
    return ent.v as T;
  }

  set(key: string, value: unknown, ttl = DEFAULT_TTL) {
    if (this.map.size >= MAX_ENTRIES) {
      // simple eviction: remove oldest
      const firstKey = this.map.keys().next().value;
      if (firstKey) this.map.delete(firstKey);
    }
    const expires = ttl > 0 ? Date.now() + ttl : 0;
    this.map.set(key, { v: value, e: expires });
  }

  del(key: string) {
    this.map.delete(key);
  }

  // delete keys by prefix
  delPrefix(prefix: string) {
    for (const k of Array.from(this.map.keys())) {
      if (k.startsWith(prefix)) this.map.delete(k);
    }
  }
}

export const cache = new SimpleCache();

export function cacheKey(prefix: string, obj?: any) {
  if (!obj) return prefix;
  if (typeof obj === 'string' || typeof obj === 'number') return `${prefix}:${String(obj)}`;
  try {
    return `${prefix}:${JSON.stringify(obj)}`;
  } catch {
    return `${prefix}:${String(obj)}`;
  }
}
