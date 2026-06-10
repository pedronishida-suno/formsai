import { type NextRequest, NextResponse } from "next/server";
import type { SniperFormData, SubmissionResult } from "@/types/form";
import { computeBaseScore, computeFinalScore, classifyScore } from "@/lib/scoring";
import { evaluateWithClaude } from "@/lib/claude";
import { pushToOrbit } from "@/lib/orbit";

export async function POST(req: NextRequest) {
  let form: SniperFormData;

  try {
    form = (await req.json()) as SniperFormData;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate open-ended fields (Part B)
  const openFields = [form.q6, form.q7];
  if (openFields.some((f) => !f || f.trim().length < 50)) {
    return NextResponse.json(
      { error: "Respostas abertas (Q6–Q7) precisam ter no mínimo 50 caracteres cada." },
      { status: 422 }
    );
  }

  // Validate manager fields (Part C)
  if (!form.gestor_papel || !form.gestor_amplitude) {
    return NextResponse.json(
      { error: "Campos de avaliação do gestor (C1–C2) são obrigatórios." },
      { status: 422 }
    );
  }
  if (!form.gestor_nota_case || !form.gestor_nota_protagonismo) {
    return NextResponse.json(
      { error: "Notas do gestor (C3–C4) são obrigatórias." },
      { status: 422 }
    );
  }

  const baseScore = computeBaseScore(form);
  const evaluation = await evaluateWithClaude(form, baseScore);
  const notaGestor = (form.gestor_nota_case + form.gestor_nota_protagonismo) / 2;
  const notaFinal = computeFinalScore(baseScore, evaluation.nota_qualitativa, notaGestor);
  const { faixa, percentual_bonus } = classifyScore(notaFinal);

  const result: SubmissionResult = {
    score_base: baseScore,
    nota_qualitativa: evaluation.nota_qualitativa,
    nota_gestor: notaGestor,
    nota_final: notaFinal,
    faixa,
    percentual_bonus,
    evaluation,
    submitted_at: new Date().toISOString(),
    orbit_webhook_queued: false,
  };

  // Fire-and-forget — Orbit is updated asynchronously
  pushToOrbit({
    cpf_hash: form.collaborator.cpf_hash,
    indicator_key: "indicador_ia_2026",
    nota_final: notaFinal,
    faixa,
    percentual_bonus,
    evaluation_summary: evaluation.nota_justificada,
    flags_fraude: evaluation.flags_fraude,
    submitted_at: result.submitted_at,
    is_locked: true,
  }).catch(console.error);

  result.orbit_webhook_queued = true;

  return NextResponse.json(result);
}
