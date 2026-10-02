export {
  SavingsMatrixError,
} from "./errors.js";

export {
  flattenMatrix,
  generateMatrix,
  matrixTotals,
  minTotalFor,
  reshape,
  sumMatrix,
  type GenerateMatrixOptions,
  type Matrix,
  type MatrixTotals,
} from "./generate.js";

export {
  createSeededRandom,
  sampleDistinctAscending,
  shuffleInPlace,
  type RandomSource,
} from "./random.js";

export {
  formatMatrix,
  formatMatrixAscii,
  type FormatMatrixOptions,
} from "./format.js";