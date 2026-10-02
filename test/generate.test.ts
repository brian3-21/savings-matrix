import { describe, expect, it } from "vitest";
import {
  SavingsMatrixError,
  createSeededRandom,
  flattenMatrix,
  formatMatrix,
  formatMatrixAscii,
  generateMatrix,
  matrixTotals,
  minTotalFor,
  reshape,
  sampleDistinctAscending,
  shuffleInPlace,
  sumMatrix,
} from "../src/index.js";

function assertValid(
  matrix: number[][],
  total: number,
  n: number,
  multiple: number,
): void {
  expect(matrix.length).toBe(n);
  for (const row of matrix) {
    expect(row.length).toBe(n);
    for (const value of row) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(multiple);
      expect(value % multiple).toBe(0);
    }
  }
  expect(sumMatrix(matrix)).toBe(total);
}

describe("generateMatrix", () => {
  it("builds a valid matrix with the exact sum", () => {
    assertValid(generateMatrix(1000, 5, { multiple: 10 }), 1000, 5, 10);
  });

  it("accepts the minimum sum, where every cell equals `multiple`", () => {
    const n = 4;
    const multiple = 5;
    const total = minTotalFor(n, multiple);
    const matrix = generateMatrix(total, n, { multiple });

    assertValid(matrix, total, n, multiple);
    expect(matrix.flat().every((value) => value === multiple)).toBe(true);
  });

  it("works with n = 1", () => {
    expect(generateMatrix(70, 1)).toEqual([[70]]);
  });

  it("works with multiples other than 10", () => {
    assertValid(generateMatrix(255, 5, { multiple: 5 }), 255, 5, 5);
    assertValid(generateMatrix(144, 4, { multiple: 9 }), 144, 4, 9);
    assertValid(generateMatrix(64, 8, { multiple: 1 }), 64, 8, 1);
  });

  it("spreads values unevenly", () => {
    const matrix = generateMatrix(1000, 5);
    expect(new Set(flattenMatrix(matrix)).size).toBeGreaterThan(1);
  });

  it("is deterministic for the same seed", () => {
    const a = generateMatrix(2000, 6, { rng: createSeededRandom(42) });
    const b = generateMatrix(2000, 6, { rng: createSeededRandom(42) });
    expect(a).toEqual(b);
  });

  it("produces different matrices for different seeds", () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 10; seed += 1) {
      const matrix = generateMatrix(2000, 6, { rng: createSeededRandom(seed) });
      seen.add(JSON.stringify(matrix));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("handles large totals", () => {
    assertValid(
      generateMatrix(1_000_000_000, 10, { multiple: 10 }),
      1_000_000_000,
      10,
      10,
    );
  });

  it("throws when n is not an integer >= 1", () => {
    expect(() => generateMatrix(100, 0)).toThrow(SavingsMatrixError);
    expect(() => generateMatrix(100, -3)).toThrow(/n must be an integer/);
    expect(() => generateMatrix(100, 2.5)).toThrow(SavingsMatrixError);
  });

  it("throws when multiple is not an integer >= 1", () => {
    expect(() => generateMatrix(100, 2, { multiple: 0 })).toThrow(
      /multiple must be an integer/,
    );
    expect(() => generateMatrix(100, 2, { multiple: 2.5 })).toThrow(
      SavingsMatrixError,
    );
  });

  it("throws when total is not a multiple of `multiple`", () => {
    expect(() => generateMatrix(105, 3, { multiple: 10 })).toThrow(
      /total must be a multiple of 10/,
    );
  });

  it("throws when total is below multiple * n^2", () => {
    expect(() => generateMatrix(50, 3, { multiple: 10 })).toThrow(
      /total must be at least 90/,
    );
  });

  it("throws an Error subclass", () => {
    expect(() => generateMatrix(10, 5)).toThrow(Error);
  });
});

describe("sampleDistinctAscending", () => {
  it("returns `count` distinct sorted values", () => {
    const rng = createSeededRandom(7);
    for (let i = 0; i < 50; i += 1) {
      const sample = sampleDistinctAscending(rng, 40, 10);
      expect(sample).toHaveLength(10);
      expect(new Set(sample).size).toBe(10);
      expect([...sample].sort((x, y) => x - y)).toEqual(sample);
      for (const value of sample) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(40);
      }
    }
  });

  it("can pick every value in the range", () => {
    expect(sampleDistinctAscending(createSeededRandom(1), 5, 5)).toEqual([
      0, 1, 2, 3, 4,
    ]);
  });

  it("returns an empty list when count = 0", () => {
    expect(sampleDistinctAscending(Math.random, 5, 0)).toEqual([]);
  });

  it("throws when count > total", () => {
    expect(() => sampleDistinctAscending(Math.random, 3, 4)).toThrow(RangeError);
  });

  it("covers the whole range given enough samples", () => {
    const rng = createSeededRandom(99);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i += 1) {
      for (const value of sampleDistinctAscending(rng, 6, 3)) seen.add(value);
    }
    expect([...seen].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("shuffleInPlace", () => {
  it("keeps every element", () => {
    const values = shuffleInPlace([1, 2, 3, 4, 5], createSeededRandom(3));
    expect([...values].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles 0 and 1 elements", () => {
    expect(shuffleInPlace([], Math.random)).toEqual([]);
    expect(shuffleInPlace([7], Math.random)).toEqual([7]);
  });
});

describe("matrix helpers", () => {
  it("matrixTotals returns rows, columns and extremes", () => {
    const totals = matrixTotals([
      [10, 20],
      [30, 40],
    ]);
    expect(totals.rows).toEqual([30, 70]);
    expect(totals.columns).toEqual([40, 60]);
    expect(totals.total).toBe(100);
    expect(totals.min).toBe(10);
    expect(totals.max).toBe(40);
  });

  it("flatten and reshape round-trip", () => {
    const matrix = generateMatrix(500, 5, { rng: createSeededRandom(11) });
    const flat = flattenMatrix(matrix);
    expect(flat).toHaveLength(25);
    expect(reshape(flat, 5)).toEqual(matrix);
  });

  it("reshape validates the length", () => {
    expect(() => reshape([1, 2, 3], 2)).toThrow(SavingsMatrixError);
  });
});

describe("formatMatrix", () => {
  it("renders an aligned table", () => {
    const lines = formatMatrix([
      [50, 300],
      [10, 20],
    ]).split("\n");
    const width = Math.max(4, "300".length);
    const rule = "─".repeat(2 * (width + 3) + 1);

    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe(`┌${rule}┐`);
    expect(lines[1]).toBe("│   50 │  300 │");
    expect(lines[2]).toBe("│   10 │   20 │");
    expect(lines[3]).toBe(`└${rule}┘`);
  });

  it("returns an empty string for an empty matrix", () => {
    expect(formatMatrix([])).toBe("");
  });

  it("has an ascii variant", () => {
    const output = formatMatrixAscii([[10, 20]]);
    expect(output).toContain("+");
    expect(output).not.toContain("─");
  });
});