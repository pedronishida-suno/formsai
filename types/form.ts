export type ClosedAnswer = "a" | "b" | "c" | "d";

export type Nivel =
  | "estagiario"
  | "junior"
  | "pleno"
  | "senior"
  | "especialista"
  | "gerente"
  | "diretor";

export type PapelColaborador = "criador" | "adaptador" | "replicador" | "multiplicador";
export type AmplitudeSolucao = "individual" | "subarea" | "area" | "cross_bu" | "empresa";
export type GestorScore = 1 | 2 | 3 | 4 | 5;

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
  // Part A — fechadas (Q1–Q5): mapeamento e contexto
  q1: ClosedAnswer;
  q2: ClosedAnswer;
  q3: ClosedAnswer;
  q4: ClosedAnswer;
  q5: ClosedAnswer;
  // Part B — abertas do colaborador (Q6–Q7): visão geral dos 3 usos + mecânica detalhada
  q6: string;
  q7: string;
  // Part C — avaliação do gestor (escala / lista)
  gestor_papel: PapelColaborador;
  gestor_amplitude: AmplitudeSolucao;
  gestor_nota_case: GestorScore;
  gestor_nota_protagonismo: GestorScore;
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
  nota_qualitativa: number;  // 1–5, IA
  nota_gestor: number;       // 1–5, média das notas do gestor
  nota_final: number;        // 1–5, ponderada
  faixa: Faixa;
  percentual_bonus: number;  // 100, 80 ou 0
  evaluation: ClaudeEvaluation;
  submitted_at: string;
  orbit_webhook_queued: boolean;
}
