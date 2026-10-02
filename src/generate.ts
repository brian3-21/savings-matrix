import { SavingsMatrixError } from "./errors.js";
import {
  sampleDistinctAscending,
  shuffleInPlace,
  type RandomSource,
} from "./random.js";

/** Square matrix: `matrix[row][column]`. */
export type Matrix = number[][];

export interface GenerateMatrixOptions {
  /** Base for every value. Defaults to `10`. */
  multiple?: number;
  /** Randomness source. Defaults to `Math.random`. */
  rng?: RandomSource;
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new SavingsMatrixError(
      `${name} must be an integer >= 1. Received: ${value}`,
    );
  }
}

/**
 * Lowest total possible for an `n x n` matrix whose values are all
 * greater than or equal to `multiple`.
 */
export function minTotalFor(n: number, multiple = 10): number {
  return multiple * n * n;
}

/**
 * Generates a square `n x n` matrix whose values are all multiples of
 * `multiple`, all >= `multiple`, and sum to exactly `total`.
 *
 * Uses stars and bars to spread `K = total / multiple - n^2` free units
 * uniformly across the `n^2` cells.
 *
 * @throws {SavingsMatrixError} if the arguments are not valid.
 */
export function generateMatrix(
  total: number,
  n: number,
  options: GenerateMatrixOptions = {},
): Matrix {
  const { multiple = 10, rng = Math.random } = options;

  assertPositiveInteger(n, "n");
  assertPositiveInteger(multiple, "multiple");

  if (!Number.isFinite(total) || !Number.isInteger(total)) {
    throw new SavingsMatrixError(
      `total must be an integer. Received: ${total}`,
    );
  }

  if (total % multiple !== 0) {
    throw new SavingsMatrixError(
      `total must be a multiple of ${multiple}. Received: ${total}`,
    );
  }

  const minTotal = minTotalFor(n, multiple);
  if (total < minTotal) {
    throw new SavingsMatrixError(
      `total must be at least ${minTotal} for an ${n}x${n} matrix with values >= ${multiple}. Received: ${total}`,
    );
  }

  const cells = n * n;
  const targetUnits = total / multiple;
  const freeUnits = targetUnits - cells;
  const bars = cells - 1;
  const positions = freeUnits + bars;
  const barPositions = sampleDistinctAscending(rng, positions, bars);

  // Each cell holds the gap between two consecutive bars.
  const units: number[] = [];
  let previous = -1;
  for (const bar of barPositions) {
    units.push(bar - previous);
    previous = bar;
  }
  units.push(positions - previous);

  const values = shuffleInPlace(
    units.map((unitsForCell) => unitsForCell * multiple),
    rng,
  );

  const matrix: Matrix = [];
  for (let row = 0; row < n; row += 1) {
    matrix.push(values.slice(row * n, row * n + n));
  }

  const sum = sumMatrix(matrix);
  if (sum !== total) {
    throw new SavingsMatrixError(
      `internal error: sum = ${sum}, expected = ${total}`,
    );
  }

  return matrix;
}

/** Sums every value in the matrix. */
export function sumMatrix(matrix: Matrix): number {
  let sum = 0;
  for (const row of matrix) {
    for (const value of row) sum += value;
  }
  return sum;
}

export interface MatrixTotals {
  rows: number[];
  columns: number[];
  total: number;
  min: number;
  max: number;
}

/** Row, column and extreme totals, handy for rendering in a UI. */
export function matrixTotals(matrix: Matrix): MatrixTotals {
  const n = matrix.length;
  const rows = new Array<number>(n).fill(0);
  const columns = new Array<number>(n).fill(0);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const value = matrix[i]?.[j] ?? 0;
      rows[i] = (rows[i] ?? 0) + value;
      columns[j] = (columns[j] ?? 0) + value;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  return { rows, columns, total: sumMatrix(matrix), min, max };
}

/** Flattens the matrix into a single array of values. */
export function flattenMatrix(matrix: Matrix): number[] {
  return matrix.flat();
}

/** Rebuilds an `n` wide matrix from the output of {@link flattenMatrix}. */
export function reshape(flat: readonly number[], n: number): Matrix {
  assertPositiveInteger(n, "n");
  if (flat.length !== n * n) {
    throw new SavingsMatrixError(
      `flat.length (${flat.length}) does not match ${n}x${n}`,
    );
  }
  const matrix: Matrix = [];
  for (let i = 0; i < n; i += 1) matrix.push(flat.slice(i * n, i * n + n));
  return matrix;
}