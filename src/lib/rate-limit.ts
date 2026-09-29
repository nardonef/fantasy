type Options = { limit: number; windowMs: number; now?: () => number; maxKeys?: number };

export function createRateLimiter({ limit, windowMs, now = Date.now, maxKeys = 10_000 }: Options) {
  const hits = new Map<string, number[]>();

  function sweep(t: number) {
    for (const [k, list] of hits) {
      const last = list[list.length - 1];
      if (last === undefined || t - last >= windowMs) hits.delete(k);
    }
  }

  return {
    check(key: string): boolean {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
      if (recent.length >= limit) {
        if (recent.length === 0) hits.delete(key);
        else hits.set(key, recent);
        return false;
      }
      if (!hits.has(key) && hits.size >= maxKeys) {
        sweep(t);
        while (hits.size >= maxKeys) {
          const oldest = hits.keys().next().value;
          if (oldest === undefined) break;
          hits.delete(oldest);
        }
      }
      recent.push(t);
      hits.set(key, recent);
      return true;
    },
    /** Number of tracked keys. Test/diagnostic only. */
    size(): number {
      return hits.size;
    },
  };
}
