import OpenAI from "openai";
import type { ClaudeEvaluation, SniperFormData } from "@/types/form";

const client = process.env.OPENAI_API_KEY ? new OpenAI() : null;

const SYSTEM_PROMPT = `You are a senior AI maturity evaluator for Suno, a Brazilian financial services firm.
You assess employees' open-ended responses in a performance bonus form to assign a qualitative AI usage score.
You receive employee context (role, seniority, BU/UN) and their answers to Q6–Q10.

## SCORING RUBRIC (1–5 scale)

5 — Exceptional: Own agentic solution or custom pipeline (API calls, scripts, n8n flows) with systemic measurable impact.
  Step-by-step technical documentation of mechanics. Robust numerical evidence (hours/cost/quality).
  Formalized human review process. Uses internal Skills or institutional Co-workers with documented input/output.

4 — High: Significant adaptation of an existing solution (internal Skill, Co-worker, custom GPT, parametrized prompt)
  applied to a RECURRING process. Documented gain ≥ 4h/week or proportional equivalent.
  Architecture clearly described: what goes in, what comes out, what business rule is embedded.

3 — Median: Consistent use of standard tools (ChatGPT, Claude, Gemini) applied to a specific routine.
  Reasonable impact for the role. No customization beyond basic prompting. No mechanics documented.

2 — Below Expected: Episodic, punctual use. Impact marginal or not demonstrable with numbers.
  No validation/review process mentioned. General descriptions without specifics.

1 — Non-existent / Fraud: No real use OR response detected as AI-generated generic text without factual content.

## FRAUD FLAGS — detect ALL that apply

resposta_generica: Long abstract text ("productivity improvement", "efficiency gains", "faster decision-making")
  without naming a specific tool, file name, process step, business rule, or concrete number. Prolific but hollow.

incoerencia_escopo: Impact described is disproportionate to the role.
  Director claiming 2h/week saved on email formatting = too low for their level.
  Intern claiming BU-level strategic impact = too high for their level.
  Match impact scope to role responsibility.

ausencia_mecanica: Q7 describes "I used ChatGPT to help" without detailing prompt structure, internal Skill name,
  Co-worker used, input format, output format, or embedded business rule. "I used AI" without HOW is a flag.

## PENALIZATION RULES
- 1 flag  → reduce qualitative score by 0.5 (floor: 1.0)
- 2 flags → reduce qualitative score by 1.0 (floor: 1.0)
- 3 flags → lock score at 1.0, mark for mandatory manual audit

## SCOPE CALIBRATION (apply strictly — this is the most critical part)
- Estagiário/Júnior: personal routine impact. ≥2h/week saved in repetitive task = score 4 territory.
- Analista/Pleno: process efficiency in their own scope. Recurring process, not one-offs.
- Sênior/Especialista: automation with documented mechanics. "I use ChatGPT daily" without mechanics = score 2 max.
- Gerente: team-level impact expected. Individual gains without process replication = score 2–3 max.
- Diretor: tactical/strategic vision required. AI must have influenced a decision, team process, or structural change.
  Pure personal productivity = score 2 max.

## OUTPUT FORMAT
Return ONLY valid JSON. No markdown. No text outside the JSON object.

{
  "nota_qualitativa": <number 1.0–5.0 with one decimal>,
  "nota_justificada": "<2–3 sentences explaining exactly why this score, citing specific evidence from the responses>",
  "flags_fraude": [<"resposta_generica"|"incoerencia_escopo"|"ausencia_mecanica"> — only flags detected, empty array if none],
  "analise_consistencia": "<1–2 sentences on whether open answers are consistent with the closed-question profile>",
  "rebaixamento_aplicado": <true|false>,
  "rebaixamento_motivo": "<specific reason for penalization, or empty string>",
  "destaques_positivos": ["<specific positive element found — quote or paraphrase from their response>"],
  "pontos_de_melhoria": ["<specific gap or weakness — actionable, not generic>"]
}`;

function mockEvaluation(baseScore: number): ClaudeEvaluation {
  const nota = Math.min(5, Math.max(1, Math.round((1 + (baseScore / 10) * 4) * 10) / 10));
  return {
    nota_qualitativa: nota,
    nota_justificada: `[MOCK — sem OPENAI_API_KEY] Score base ${baseScore}/10 convertido diretamente. Em produção, esta nota reflete a avaliação qualitativa real das respostas abertas.`,
    flags_fraude: [],
    analise_consistencia: "[MOCK] Consistência não avaliada sem API key.",
    rebaixamento_aplicado: false,
    rebaixamento_motivo: "",
    destaques_positivos: ["[MOCK] Avaliação real requer OPENAI_API_KEY"],
    pontos_de_melhoria: [],
  };
}

export async function evaluateWithClaude(
  form: SniperFormData,
  baseScore: number
): Promise<ClaudeEvaluation> {
  if (!client) return mockEvaluation(baseScore);

  const userMessage = `## Employee Context
Role (Cargo): ${form.collaborator.cargo}
Seniority (Nível): ${form.collaborator.nivel}
Business Unit (BU): ${form.collaborator.bu}
Organizational Unit (UN): ${form.collaborator.un}
Closed Questions Base Score (Q1–Q5): ${baseScore}/10

---

## Q6 — Previous Scenario: What problem existed before AI?
${form.q6.trim()}

## Q7 — Solution Architecture: How exactly was AI used?
${form.q7.trim()}

## Q8 — Impact Evidence: What tangible gains resulted?
${form.q8.trim()}

## Q9 — Risk Mitigation: How is output accuracy guaranteed?
${form.q9.trim()}

## Q10 — Differentiation Justification: Why Top 20% or Median?
${form.q10.trim()}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(text) as ClaudeEvaluation;
  } catch {
    return {
      nota_qualitativa: 1.0,
      nota_justificada: "Erro no processamento da avaliação. Revisão manual necessária.",
      flags_fraude: [],
      analise_consistencia: "Não foi possível processar as respostas.",
      rebaixamento_aplicado: false,
      rebaixamento_motivo: "",
      destaques_positivos: [],
      pontos_de_melhoria: ["Resposta não pôde ser avaliada automaticamente."],
    };
  }
}
