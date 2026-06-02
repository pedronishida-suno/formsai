export type ClosedAnswer = "a" | "b" | "c" | "d";

export type Nivel =
  | "estagiario"
  | "junior"
  | "pleno"
  | "senior"
  | "especialista"
  | "gerente"
  | "diretor";

export interface Collaborator {
  name: string;
  cpf_hash: string;
  cargo: string;
  nivel: Nivel;
  bu: string;
  un: string;
}

export interface SniperFormData {
  collaborator: Collaborator;
  // Part A — closed
  q1: ClosedAnswer;
  q2: ClosedAnswer;
  q3: ClosedAnswer;
  q4: ClosedAnswer;
  q5: ClosedAnswer;
  // Part B — open
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
}

export type FraudFlag =
  | "resposta_generica"
  | "incoerencia_escopo"
  | "ausencia_mecanica";

export interface ClaudeEvaluation {
  nota_qualitativa: number;
  nota_justificada: string;
  flags_fraude: FraudFlag[];
  analise_consistencia: string;
  rebaixamento_aplicado: boolean;
  rebaixamento_motivo: string;
  destaques_positivos: string[];
  pontos_de_melhoria: string[];
}

export type Faixa = "top" | "mediana" | "mediana_ruim" | "bottom";

export interface SubmissionResult {
  score_base: number;        // 0–10, Q1–Q5
  nota_qualitativa: number;  // 1–5, Claude
  nota_final: number;        // 1–5, weighted
  faixa: Faixa;
  percentual_bonus: number;  // 100, 80, or 0
  evaluation: ClaudeEvaluation;
  submitted_at: string;
  orbit_webhook_queued: boolean;
}
