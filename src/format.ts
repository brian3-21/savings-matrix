import type { Matrix } from "./generate.js";

export interface FormatMatrixOptions {
  /** Caracter para las lineas horizontales. Por defecto `─`. */
  hline?: string;
  /** Caracter para los separadores de columna. Por defecto `│`. */
  vline?: string;
  /** Esquinas de la caja. Por defecto `┌ ┐ └ ┘`. */
  corner?: Partial<Record<"tl" | "tr" | "bl" | "br", string>>;
}

/**
 * Formatea una matriz como tabla alineada en texto plano.
 *
 * ```
 * ┌───────────────┐
 * │   50 │  300   │
 * │   10 │   20   │
 * └───────────────┘
 * ```
 */
export function formatMatrix(
  matrix: Matrix,
  options: FormatMatrixOptions = {},
): string {
  const { hline = "─", vline = "│", corner } = options;

  if (matrix.length === 0) return "";

  const n = matrix.length;
  const width = Math.max(
    4,
    ...matrix.flatMap((row) => row.map((value) => String(value).length)),
  );
  const cells = matrix.map((row) =>
    row.map((value) => String(value).padStart(width)),
  );

  const {
    tl = "┌",
    tr = "┐",
    bl = "└",
    br = "┘",
  } = corner ?? {};

  const rule = hline.repeat(n * (width + 3) + 1);

  const lines = [
    `${tl}${rule}${tr}`,
    ...cells.map((row) => `${vline} ${row.join(` ${vline} `)} ${vline}`),
    `${bl}${rule}${br}`,
  ];

  return lines.join("\n");
}

/** Versiones ASCII para logs y terminales sin soporte de unicode. */
export function formatMatrixAscii(matrix: Matrix): string {
  return formatMatrix(matrix, {
    hline: "-",
    vline: "|",
    corner: { tl: "+", tr: "+", bl: "+", br: "+" },
  });
}