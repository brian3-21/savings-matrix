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
  it("genera una matriz valida con la suma exacta", () => {
    const matrix = generateMatrix(1000, 5, { multiple: 10 });
    assertValid(matrix, 1000, 5, 10);
  });

  it("acepta la suma minima: todas las celdas valen `multiple`", () => {
    const n = 4;
    const multiple = 5;
    const total = minTotalFor(n, multiple);
    const matrix = generateMatrix(total, n, { multiple });

    assertValid(matrix, total, n, multiple);
    expect(matrix.flat().every((v) => v === multiple)).toBe(true);
  });

  it("funciona con n = 1", () => {
    expect(generateMatrix(70, 1)).toEqual([[70]]);
  });

  it("funciona con multiples distintos de 10", () => {
    assertValid(generateMatrix(255, 5, { multiple: 5 }), 255, 5, 5);
    assertValid(generateMatrix(144, 4, { multiple: 9 }), 144, 4, 9);
    assertValid(generateMatrix(64, 8, { multiple: 1 }), 64, 8, 1);
  });

  it("reparte el valor de forma desigual", () => {
    const matrix = generateMatrix(1000, 5);
    const values = new Set(flattenMatrix(matrix));
    expect(values.size).toBeGreaterThan(1);
  });

  it("es determinista con la misma semilla", () => {
    const a = generateMatrix(2000, 6, { rng: createSeededRandom(42) });
    const b = generateMatrix(2000, 6, { rng: createSeededRandom(42) });
    expect(a).toEqual(b);
  });

  it("produce matrices distintas entre semillas distintas", () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 10; seed += 1) {
      const matrix = generateMatrix(2000, 6, { rng: createSeededRandom(seed) });
      seen.add(JSON.stringify(matrix));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("aguanta totales grandes", () => {
    assertValid(generateMatrix(1_000_000_000, 10, { multiple: 10 }), 1_000_000_000, 10, 10);
  });

  it("lanza error si n no es un entero >= 1", () => {
    expect(() => generateMatrix(100, 0)).toThrow(SavingsMatrixError);
    expect(() => generateMatrix(100, -3)).toThrow(/n debe ser un entero/);
    expect(() => generateMatrix(100, 2.5)).toThrow(SavingsMatrixError);
  });

  it("lanza error si multiple no es un entero >= 1", () => {
    expect(() => generateMatrix(100, 2, { multiple: 0 })).toThrow(
      /multiple debe ser un entero/,
    );
    expect(() => generateMatrix(100, 2, { multiple: 2.5 })).toThrow(
      SavingsMatrixError,
    );
  });

  it("lanza error si total no es multiplo de `multiple`", () => {
    expect(() => generateMatrix(105, 3, { multiple: 10 })).toThrow(
      /total debe ser multiplo de 10/,
    );
  });

  it("lanza error si total es menor que multiple * n^2", () => {
    expect(() => generateMatrix(50, 3, { multiple: 10 })).toThrow(
      /total debe ser al menos 90/,
    );
  });

  it("el error es instancia de Error", () => {
    expect(() => generateMatrix(10, 5)).toThrow(Error);
  });
});

describe("sampleDistinctAscending", () => {
  it("devuelve `count` elementos distintos y ordenados", () => {
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

  it("puede elegir todos los elementos", () => {
    expect(sampleDistinctAscending(createSeededRandom(1), 5, 5)).toEqual([
      0, 1, 2, 3, 4,
    ]);
  });

  it("devuelve lista vacia si count = 0", () => {
    expect(sampleDistinctAscending(Math.random, 5, 0)).toEqual([]);
  });

  it("lanza error si count > total", () => {
    expect(() => sampleDistinctAscending(Math.random, 3, 4)).toThrow(RangeError);
  });

  it("cubre todo el rango con suficientes muestras", () => {
    const rng = createSeededRandom(99);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i += 1) {
      for (const value of sampleDistinctAscending(rng, 6, 3)) seen.add(value);
    }
    expect([...seen].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("shuffleInPlace", () => {
  it("conserva todos los elementos", () => {
    const values = shuffleInPlace([1, 2, 3, 4, 5], createSeededRandom(3));
    expect([...values].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5]);
  });

  it("no lanza con 0 o 1 elemento", () => {
    expect(shuffleInPlace([], Math.random)).toEqual([]);
    expect(shuffleInPlace([7], Math.random)).toEqual([7]);
  });
});

describe("helpers de matriz", () => {
  it("matrixTotals devuelve filas, columnas y extremos", () => {
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

  it("flatten + reshape es reversible", () => {
    const matrix = generateMatrix(500, 5, { rng: createSeededRandom(11) });
    const flat = flattenMatrix(matrix);
    expect(flat).toHaveLength(25);
    expect(reshape(flat, 5)).toEqual(matrix);
  });

  it("reshape valida la longitud", () => {
    expect(() => reshape([1, 2, 3], 2)).toThrow(SavingsMatrixError);
  });
});

describe("formatMatrix", () => {
  it("genera una tabla alineada", () => {
    const output = formatMatrix([
      [50, 300],
      [10, 20],
    ]);
const lines = output.split("\n");
  const width = Math.max(4, "300".length);
  const rule = "─".repeat(2 * (width + 3) + 1);

  expect(lines).toHaveLength(4);
  expect(lines[0]).toBe(`┌${rule}┐`);
  expect(lines[1]).toBe("│   50 │  300 │");
  expect(lines[2]).toBe("│   10 │   20 │");
  expect(lines[3]).toBe(`└${rule}┘`);
  });

  it("devuelve cadena vacia para matriz vacia", () => {
    expect(formatMatrix([])).toBe("");
  });

  it("tiene variante ascii", () => {
    const output = formatMatrixAscii([[10, 20]]);
    expect(output).toContain("+");
    expect(output).not.toContain("─");
  });
});