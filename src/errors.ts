/**
 * Error thrown when the inputs given to the matrix generator are not valid.
 */
export class SavingsMatrixError extends Error {
  override readonly name = "SavingsMatrixError";

  constructor(message: string) {
    super(message);
  }
}