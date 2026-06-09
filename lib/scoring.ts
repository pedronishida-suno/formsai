import type { ClosedAnswer, Faixa, SniperFormData } from "@/types/form";

const ANSWER_POINTS: Record<ClosedAnswer, number> = { a: 1, b: 2, c: 3, d: 4 };

// Q1-Q5 weights (sum = 1.0)
const WEIGHTS = { q1: 0.15, q2: 0.25, q3: 0.20, q4: 0.20, q5: 0.20 } as const;

/** Returns 0–10. Raw score range 1.0–4.0 normalized to 0–10. */
export function computeBaseScore(
  form: Pick<SniperFormData, "q1" | "q2" | "q3" | "q4" | "q5">
): number {
  const raw =
    ANSWER_POINTS[form.q1] * WEIGHTS.q1 +
    ANSWER_POINTS[form.q2] * WEIGHTS.q2 +
    ANSWER_POINTS[form.q3] * WEIGHTS.q3 +
    ANSWER_POINTS[form.q4] * WEIGHTS.q4 +
    ANSWER_POINTS[form.q5] * WEIGHTS.q5;
  return Math.round(((raw - 1) / 3) * 10 * 10) / 10;
}

/**
 * Final score: 30% base (scaled 1–5) + 40% qualitative IA (1–5) + 30% manager (1–5).
 * Returns 1–5 with one decimal.
 */
export function computeFinalScore(baseScore: number, qualitativeScore: number, gestorScore: number): number {
  const baseScaled = 1 + (baseScore / 10) * 4;
  return Math.round((baseScaled * 0.3 + qualitativeScore * 0.4 + gestorScore * 0.3) * 10) / 10;
}

export function classifyScore(nota: number): { faixa: Faixa; percentual_bonus: number } {
  if (nota >= 4.0) return { faixa: "top",          percentual_bonus: 100 };
  if (nota >= 2.5) return { faixa: "mediana",       percentual_bonus: 100 };
  if (nota >= 2.0) return { faixa: "mediana_ruim",  percentual_bonus: 80  };
  return            { faixa: "bottom",       percentual_bonus: 0   };
}
