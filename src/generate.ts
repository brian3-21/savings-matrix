import { SavingsMatrixError } from "./errors.js";
import {
  sampleDistinctAscending,
  shuffleInPlace,
  type RandomSource,
} from "./random.js";

/** Matriz cuadrada de numeros: `matrix[fila][columna]`. */
export type Matrix = number[][];

export interface GenerateMatrixOptions {
  /** Base de los multiplos. Por defecto `10`. */
  multiple?: number;
  /** Fuente de aleatoriedad. Por defecto `Math.random`. */
  rng?: RandomSource;
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new SavingsMatrixError(
      `${name} debe ser un entero >= 1. Recibido: ${value}`,
    );
  }
}

/**
 * Suma total minima posible para una matriz `n x n` con valores
 * mayores o iguales a `multiple`.
 */
export function minTotalFor(n: number, multiple = 10): number {
  return multiple * n * n;
}

/**
 * Genera una matriz cuadrada `n x n` con valores multiplos de `multiple`,
 * todos >= `multiple`, cuya suma total sea exactamente `total`.
 *
 * Usa stars and bars: reparte `K = total / multiple - n^2` unidades libres
 * entre las `n^2` celdas de forma uniforme.
 *
 * @throws {SavingsMatrixError} si los parametros no son validos.
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
      `total debe ser un numero entero. Recibido: ${total}`,
    );
  }

  if (total % multiple !== 0) {
    throw new SavingsMatrixError(
      `total debe ser multiplo de ${multiple}. Recibido: ${total}`,
    );
  }

  const minTotal = minTotalFor(n, multiple);
  if (total < minTotal) {
    throw new SavingsMatrixError(
      `total debe ser al menos ${minTotal} para una matriz ${n}x${n} con valores >= ${multiple}. Recibido: ${total}`,
    );
  }

  const cells = n * n;
  const targetUnits = total / multiple; // suma objetivo en unidades de `multiple`
  const freeUnits = targetUnits - cells; // >= 0
  const bars = cells - 1;

  // Posiciones de las barras entre las unidades libres y las celdas menos una.
  const positions = freeUnits + bars;
  const barPositions = sampleDistinctAscending(rng, positions, bars);

  // Cada celda es la distancia entre barras consecutivas.
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
      `Error interno: suma = ${sum}, esperado = ${total}`,
    );
  }

  return matrix;
}

/** Suma todos los valores de la matriz. */
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

/** Resumen util para mostrar en una UI: totales por fila, columna y extrema. */
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

/**
 * Convierte la matriz en un array plano, util para `JSON.stringify` o para
 * enviarla a un worker sin metadatos de filas.
 */
export function flattenMatrix(matrix: Matrix): number[] {
  return matrix.flat();
}

/** Reconstruye una matriz plana de ancho `n` a partir de `generateMatrix`. */
export function reshape(flat: readonly number[], n: number): Matrix {
  assertPositiveInteger(n, "n");
  if (flat.length !== n * n) {
    throw new SavingsMatrixError(
      `flat.length (${flat.length}) no coincide con ${n}x${n}`,
    );
  }
  const matrix: Matrix = [];
  for (let i = 0; i < n; i += 1) matrix.push(flat.slice(i * n, i * n + n));
  return matrix;
}