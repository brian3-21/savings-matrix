/**
 * Minimal source of randomness. Any function returning a float in [0, 1) works,
 * which keeps the generator testable and lets callers plug in `Math.random`,
 * a seeded PRNG or a crypto-backed generator.
 */
export type RandomSource = () => number;

/**
 * Creates a deterministic pseudo random generator (mulberry32) so the same
 * seed always produces the same matrix. Handy for tests and shareable links.
 */
export function createSeededRandom(seed: number): RandomSource {
  if (!Number.isFinite(seed)) {
    throw new RangeError("seed must be a finite number");
  }

  let state = seed >>> 0;

  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Picks `count` distinct integers from [0, total) with uniform probability
 * using Floyd's algorithm (a set of already-picked values instead of a
 * reshuffled pool). Returns them in ascending order.
 *
 * Cost is O(count) expected, not O(total), so a total of 10^8 stays cheap.
 */
export function sampleDistinctAscending(
  rng: RandomSource,
  total: number,
  count: number,
): number[] {
  if (count > total) {
    throw new RangeError(
      `cannot pick ${count} distinct values out of ${total}`,
    );
  }

  const chosen = new Set<number>();

  for (let k = total - count; k < total; k += 1) {
    const j = Math.floor(rng() * (k + 1));
    chosen.add(chosen.has(j) ? k : j);
  }

  return [...chosen].sort((a, b) => a - b);
}

/**
 * In-place Fisher-Yates shuffle using the provided random source.
 */
export function shuffleInPlace<T>(values: T[], rng: RandomSource): T[] {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = values[i]!;
    const b = values[j]!;
    values[i] = b;
    values[j] = a;
  }
  return values;
}