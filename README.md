# savings-matrix

Generate an `n x n` matrix of multiples where the **sum is exactly** the total you ask for.

```bash
npm install savings-matrix
```

```ts
import { generateMatrix, sumMatrix, formatMatrix } from "savings-matrix";

const matrix = generateMatrix(1000, 5);
sumMatrix(matrix); // 1000, exact
```

## API

```ts
generateMatrix(total, n, { multiple?, rng? })
```

- `multiple` — base for every value (default `10`)
- `rng` — random source; use `createSeededRandom(seed)` for reproducible output
- Throws `SavingsMatrixError` if `total` is not a multiple of `multiple` or is below `multiple * n²`

Also exports `minTotalFor`, `sumMatrix`, `matrixTotals`, `flattenMatrix`, `reshape`, `formatMatrix`, `formatMatrixAscii`, `createSeededRandom`.

ESM + CJS, typed, zero dependencies.

## Algorithm

Stars and bars: `K = total / multiple - n²` free units are distributed uniformly across the `n²` cells.

Heads up: uniform over compositions means a few cells can take most of the total. That is inherent to the algorithm. For a smoother spread, split the total across several calls.

## Development

```bash
npm install
npm run typecheck && npm test && npm run build
```