"use client";

import { useState } from "react";
import type { ClosedAnswer, SniperFormData, SubmissionResult } from "@/types/form";
import { ResultCard } from "@/app/components/ResultCard";
import { QuestionRationale, type RationaleData } from "@/app/components/QuestionRationale";

// ---------------------------------------------------------------------------
// Question definitions
// ---------------------------------------------------------------------------

const CLOSED_QUESTIONS: Array<{
  id: "q1" | "q2" | "q3" | "q4" | "q5";
  text: string;
  options: Array<{ value: string; label: string }>;
  rationale: RationaleData;
}> = [
  {
    id: "q1",
    text: "Com qual frequência você utiliza Inteligência Artificial ativamente nas suas rotinas de trabalho na Suno?",
    options: [
      { value: "a", label: "Raramente — menos de 1x por semana / consultas pontuais." },
      { value: "b", label: "Ocasionalmente — 1 a 2x por semana para tarefas específicas." },
      { value: "c", label: "Frequentemente — quase todo dia, integrada a pelo menos uma rotina principal." },
      { value: "d", label: "Intensamente — múltiplas vezes ao dia, base fundamental do meu fluxo de trabalho." },
    ],
    rationale: {
      dimension: "Hábito e regularidade de uso real",
      purpose:
        "Adoção de IA segue curva de aprendizado composto: quem usa diariamente acumula competência exponencial e gera ganho operacional mensurável; quem usa esporadicamente permanece num platô. Sem frequência real, o ganho de produtividade não aparece na métrica de Eficiência de Pessoal (Despesas com Pessoal / ROL) — que é o termômetro financeiro do modelo de bônus.",
      signal:
        "O agregado das 300 respostas calibra a maturidade média da empresa. Se a maioria está nas opções A–B, o problema é de capacitação, não de avaliação — e o Comitê de Liderança precisa revisar o programa de treinamento antes de aplicar a curva forçada.",
    },
  },
  {
    id: "q2",
    text: "Qual das alternativas abaixo melhor descreve a sua principal ferramenta de trabalho com IA este ano?",
    options: [
      { value: "a", label: "Consultas textuais básicas em ferramentas de mercado (ChatGPT, Claude, Gemini) sem personalização." },
      { value: "b", label: "Uso de Co-workers institucionais ou assistentes nativos integrados em softwares da empresa." },
      { value: "c", label: "Criação de Custom GPTs, parametrização de instruções customizadas ou uso de Skills internas na Suno." },
      { value: "d", label: "Desenvolvimento de automações via projetos no Cloud, chamadas de API, scripts próprios ou fluxos agênticos." },
    ],
    rationale: {
      dimension: "Escada de sofisticação técnica: consumidor → construtor",
      purpose:
        "Cada degrau representa uma ordem de grandeza diferente de valor para a empresa: (A) ChatGPT genérico = ganho individual não escalável, sem retenção de IP; (B) Co-workers institucionais = uso governado; (C) Skills internas = o colaborador gera IP institucional que outros consomem; (D) API / agentes / scripts = o colaborador constrói infraestrutura. É a pergunta com maior peso no Score Base (25%) porque alavancagem técnica é o ativo escasso — equipa uma pessoa para multiplicar a capacidade de várias.",
      signal:
        "Identifica o núcleo de criadores técnicos (C+D) que sustenta o programa de IA Champions e a biblioteca interna de Skills. Esses perfis são prioridade de retenção — se saírem, levam conhecimento construtivo consigo. Também evita que a empresa pague o mesmo bônus para quem consome e para quem constrói.",
    },
  },
  {
    id: "q3",
    text: "Qual foi a origem da solução de IA que você implementou para resolver o seu principal gargalo?",
    options: [
      { value: "a", label: "Utilizo apenas ferramentas e prompts padrão disponíveis publicamente." },
      { value: "b", label: "Peguei uma solução desenvolvida por um colega ou IA Champion e repliquei na minha rotina." },
      { value: "c", label: "Adaptei e personalizei uma solução existente para a realidade específica da minha cadeira." },
      { value: "d", label: "Desenvolvi/arquiteturei uma solução totalmente nova (ou agente do zero) para o meu processo." },
    ],
    rationale: {
      dimension: "Autoria: replicador vs. adaptador vs. criador",
      purpose:
        "A Suno precisa de criadores (que geram IP e solucionam problemas inéditos) e de replicadores eficientes (que escalam inovação existente). Os dois papéis têm valor, mas precisam ser identificados separadamente para gestão de carreira e composição de squads. Sem essa pergunta, um colaborador que replicou a Skill do colega receberia o mesmo crédito de quem a criou — destruindo o incentivo a criar.",
      signal:
        "Define o pipeline de IA Champions: criadores (C+D) são os candidatos naturais a liderar workshops, documentar Skills e mentora pares. A opção D é o requisito quase obrigatório para sustentar argumento na Banca de Validação do Top 20%.",
    },
  },
  {
    id: "q4",
    text: "Onde a solução de IA foi implementada no seu fluxo de trabalho?",
    options: [
      { value: "a", label: "Em tarefas secundárias de suporte (correção gramatical, tradução, geração de ideias)." },
      { value: "b", label: "Na execução operacional de uma tarefa de rotina (e-mails pontuais, relatórios simples)." },
      { value: "c", label: "Na automação pontual de um processo recorrente (base de dados semanal, e-mails em lote)." },
      { value: "d", label: "Na reestruturação completa de um fluxo de trabalho (pipelines, governança automatizada, sistemas agênticos)." },
    ],
    rationale: {
      dimension: "Profundidade de integração: suporte superficial vs. núcleo do processo",
      purpose:
        "IA em correção gramatical gera ganho marginal e invisível para o P&L. IA em pipelines e governança muda estrutura de custo. A métrica de Eficiência (Despesas com Pessoal / ROL) só é movida por ganhos no núcleo — não por produtividade cosmética. Sem essa pergunta, a empresa pagaria bônus por 'produtividade' que não aparece em nenhum indicador financeiro.",
      signal:
        "Cruzado com as chaves únicas do colaborador (CPF × Família × Canal × BU × UN): quem responde D em chaves de Receita ou Rentabilidade é o candidato direto a case de replicação cross-BU no Painel do Jean.",
    },
  },
  {
    id: "q5",
    text: "Se a solução de IA que você usa hoje fosse desativada amanhã, qual seria o impacto no escopo da sua cadeira?",
    options: [
      { value: "a", label: "Nenhum impacto. Meu trabalho continuaria no mesmo ritmo." },
      { value: "b", label: "Impacto leve. Gastaria algumas horas a mais por semana." },
      { value: "c", label: "Impacto moderado. Uma rotina importante atrasaria ou perderia qualidade." },
      { value: "d", label: "Impacto crítico. A eficiência do meu escopo despencaria — meu processo principal depende disso." },
    ],
    rationale: {
      dimension: "Teste de remoção — a IA virou infraestrutura ou é acessório?",
      purpose:
        "O padrão-ouro em TI corporativa para medir valor de qualquer sistema é o teste de remoção: se a retirada não dói, o sistema é decorativo. Aplicado à competência individual de IA, a lógica é a mesma. Se a resposta for 'nenhum impacto', o uso era performance social — não leverage real. Isso detecta cargo culting: uso de IA como sinalização de modernidade sem ganho operacional, que corrompe a métrica e fragiliza o discurso da liderança perante o Conselho.",
      signal:
        "Opção D (impacto crítico) é o maior sinalizador de retenção prioritária do formulário inteiro. Esses colaboradores tornaram a IA parte da operação da sua cadeira — se saírem, levam infraestrutura. O RH cruza esse dado com o risco de turnover para priorizar planos de retenção.",
    },
  },
];

const OPEN_QUESTIONS: Array<{
  id: "q6" | "q7" | "q8" | "q9" | "q10";
  label: string;
  text: string;
  hint: string;
  rationale: RationaleData;
}> = [
  {
    id: "q6",
    label: "Q6 — Diagnóstico do Cenário Anterior",
    text: "Descreva com precisão o problema, gargalo ou ineficiência que existia na sua rotina antes da aplicação da IA. O que tornava esse processo custoso, lento ou propenso a erros?",
    hint: "Seja específico. Indique o tempo gasto ou a frequência com que o problema ocorria (ex: 'Gastava 6 horas toda sexta consolidando planilhas manuais...').",
    rationale: {
      dimension: "Baseline quantificável — existência real do problema",
      purpose:
        "Toda reivindicação de impacto exige um before/after falsificável. Q6 e Q8 formam um par contábil: Q6 é o débito (custo do problema), Q8 é o crédito (ganho da solução). Sem baseline quantificado aqui — com frequência, horas ou custo específico — qualquer ganho declarado em Q8 vira narrativa sem âncora e não pode ser auditado.",
      signal:
        "O avaliador usa Q6 para verificar se o case foi construído com metodologia ou inventado retrospectivamente para encaixar uma ferramenta já utilizada. A especificidade do problema descrito é diretamente proporcional à credibilidade de tudo que vem depois.",
      flagRisk: [
        "Resposta sem número ou frequência específica (ex: 'tinha dificuldade com análises complexas') aciona a flag resposta_generica → rebaixamento automático de –0,5 ponto na nota qualitativa.",
        "Descrição de problema que não corresponde à família de indicador do colaborador (ex: Analista de Compliance descrevendo problema de vendas) aciona incoerencia_escopo.",
      ],
    },
  },
  {
    id: "q7",
    label: "Q7 — Arquitetura da Solução",
    text: "Como a IA foi utilizada para resolver o problema citado acima? Explique o passo a passo da solução que você estruturou ou utilizou.",
    hint: "Evite respostas vagas como 'usei o ChatGPT para me ajudar'. Explique a mecânica: qual ferramenta, qual estrutura de prompt/Skill, qual input recebe, qual output gera, qual regra de negócio está embarcada.",
    rationale: {
      dimension: "Domínio técnico real — o colaborador é dono ou apenas operador da solução?",
      purpose:
        "Quem não consegue explicar a mecânica não é dono da solução — está operando algo que não compreende. Em setor regulado (CVM), isso é risco de governança: o colaborador não consegue defender, auditar ou corrigir o que entrega via IA. Além disso, Q7 bem escrita é literalmente documentação técnica reutilizável — ao longo do ciclo, as melhores Q7s alimentam a biblioteca interna de Skills da Suno.",
      signal:
        "É a pergunta que mais diferencia Top 20% de Mediana: Mediana descreve uso; Top descreve arquitetura. Diretamente confrontada com Q2: quem marcou 'API/agentes' em Q2 e escreve Q7 vaga é o falso positivo mais perigoso do sistema — e o Claude tem instrução específica para detectar essa incoerência.",
      flagRisk: [
        "Ausência de menção a ferramenta específica, regra de negócio embarcada ou formato de input/output aciona ausencia_mecanica → nota travada em 1,0 (Bottom automático).",
        "Suspeita de resposta gerada por IA genérica sem conteúdo factual da rotina do colaborador aciona resposta_generica e é marcada para auditoria manual obrigatória.",
        "2 ou 3 flags simultâneas: nota travada em 1,0 independente do Score Base + case enviado para revisão do CPTO.",
      ],
    },
  },
  {
    id: "q8",
    label: "Q8 — Evidência de Impacto e Ganhos Reais",
    text: "Descreva a situação atual do processo após a implementação. Quais foram os ganhos tangíveis de tempo (horas liberadas), de qualidade do output ou de redução de custos?",
    hint: "O impacto deve ser proporcional à sua cadeira. Estagiário: foque nas horas economizadas na sua rotina. Analista/Gestor: foque no impacto do processo da subárea.",
    rationale: {
      dimension: "ROI individual proporcional ao cargo e à chave de indicador",
      purpose:
        "Esta é a pergunta que fecha o circuito econômico do formulário. O somatório de Q8 de 300 colaboradores, após auditoria, é o número que a Suno usará para defender o investimento em IA perante o Conselho e para calcular o impacto real na métrica Despesas com Pessoal / ROL. O avaliador compara o impacto declarado com o nível hierárquico do colaborador para verificar proporcionalidade.",
      signal:
        "Cases com Q8 robusta em chaves de Receita/EBITDA são candidatos diretos ao Painel do Jean como exemplos de replicação cross-BU. Casos com impacto desproporcional ao cargo — para cima ou para baixo — comprometem a credibilidade do agregado e são flagados.",
      flagRisk: [
        "Diretor declarando '2h economizadas em revisão de e-mail' → impacto pequeno demais para o cargo → incoerencia_escopo.",
        "Estagiário declarando 'transformei o EBITDA de toda a BU' → impacto grande demais para o cargo → incoerencia_escopo.",
        "Ausência de número concreto (ex: 'melhorei muito minha produtividade') → resposta_generica.",
      ],
    },
  },
  {
    id: "q9",
    label: "Q9 — Mitigação de Riscos e Casos de Exceção",
    text: "Explique como você garante a acurácia, segurança e revisão humana dos resultados gerados. O que você faz para que o output não contenha alucinações ou erros de processo?",
    hint: "Detalhe seu processo de checagem ou os filtros de validação que você aplica antes de considerar a entrega concluída.",
    rationale: {
      dimension: "Maturidade operacional e consciência de falhas de IA",
      purpose:
        "Em uma gestora de investimentos, alucinação de IA não é inconveniência — é risco regulatório. Uma recomendação errada gerada por IA sem checagem pode resultar em sanção da CVM, processo de cliente ou exposição pública. Quem usa IA em rotina sensível sem processo de validação é um passivo operacional, não um ativo. Diferentemente de outros setores, na Suno essa pergunta tem peso implícito de compliance.",
      signal:
        "Colaboradores de áreas sensíveis (research, advisory, compliance, jurídico) com Q9 vaga recebem sinalização independente para a área de Compliance — independente da nota final do formulário. O agregado de Q9 também alimenta o programa de governança de IA da Suno: as melhores práticas de checagem descritas aqui viram protocolo institucional.",
      flagRisk: [
        "Q9 completamente ausente ou vaga ('reviso o output antes de enviar') em colaborador de área regulada gera flag de atenção para o Compliance, fora do sistema de notas.",
        "Não há rebaixamento automático de nota por Q9 fraca isoladamente — mas combina com outras flags para acionar auditoria manual.",
      ],
    },
  },
  {
    id: "q10",
    label: "Q10 — Justificativa de Diferenciação do Case",
    text: "Por que o seu uso de IA neste ano merece ser classificado como destaque (Top 20% ou Mediana)? O que diferencia sua abordagem de uma simples consulta automatizada?",
    hint: "Seja honesto e específico. A banca de validação questionará ao vivo se você for indicado ao Top 20%.",
    rationale: {
      dimension: "Autoavaliação calibrada e aderência cultural ao modelo de curva",
      purpose:
        "A curva forçada 20-70-10 só funciona se a maioria entende e aceita que ser Mediana é positivo — não é punição, é o resultado esperado de quem faz o que se espera do cargo. Q10 obriga o colaborador a articular sua diferenciação em vez de deixar essa responsabilidade para o gestor (que tende à leniência). Se o colaborador não consegue articular por que é Top, ele provavelmente não é Top. Isso também é o roteiro direto para a Banca de Validação presencial.",
      signal:
        "Resposta genérica em Q10 ('me dedico muito à IA e sempre busco inovação') sinaliza que o colaborador não internalizou a régua da empresa — é oportunidade de treinamento, não fraude. Esse dado, agregado por BU, mostra onde o programa de comunicação do lançamento não foi eficaz e onde refazer o briefing.",
      flagRisk: [
        "Q10 que reivindica Top 20% sem critério técnico específico (sem nomear mecânica, ferramenta ou impacto concreto) é cruzada com Q7 e Q8 — incoerência entre as três aciona revisão da nota.",
        "A Banca de Validação usará Q10 como roteiro de perguntas ao vivo. O colaborador que escrever algo diferente do que demonstra ao vivo é rebaixado para Mediana independente da nota do Claude.",
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Default collaborator (in production: injected via Orbit SSO/JWT query params)
// ---------------------------------------------------------------------------

const DEFAULT_COLLABORATOR = {
  name: "Colaborador",
  cpf_hash: "",
  cargo: "",
  nivel: "pleno" as const,
  bu: "",
  un: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FormState = {
  q1: ClosedAnswer | "";
  q2: ClosedAnswer | "";
  q3: ClosedAnswer | "";
  q4: ClosedAnswer | "";
  q5: ClosedAnswer | "";
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
};

const EMPTY_FORM: FormState = {
  q1: "", q2: "", q3: "", q4: "", q5: "",
  q6: "", q7: "", q8: "", q9: "", q10: "",
};

export default function SniperForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openRationale, setOpenRationale] = useState<Set<string>>(new Set());

  function toggleRationale(id: string) {
    setOpenRationale((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setClosedAnswer(key: "q1" | "q2" | "q3" | "q4" | "q5", value: ClosedAnswer) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setOpenAnswer(key: "q6" | "q7" | "q8" | "q9" | "q10", value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function isFormValid(): boolean {
    const closedComplete = ["q1", "q2", "q3", "q4", "q5"].every(
      (k) => form[k as keyof FormState] !== ""
    );
    const openComplete = ["q6", "q7", "q8", "q9", "q10"].every(
      (k) => (form[k as keyof FormState] as string).trim().length >= 50
    );
    return closedComplete && openComplete;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid()) return;

    setSubmitting(true);
    setError(null);

    const payload: SniperFormData = {
      collaborator: DEFAULT_COLLABORATOR,
      ...(form as Omit<FormState, "q1"|"q2"|"q3"|"q4"|"q5"> & {
        q1: ClosedAnswer; q2: ClosedAnswer; q3: ClosedAnswer; q4: ClosedAnswer; q5: ClosedAnswer;
      }),
    };

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `Erro ${res.status}`);
      }

      const data = (await res.json()) as SubmissionResult;
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar formulário.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <ResultCard result={result} onReset={() => { setResult(null); setForm(EMPTY_FORM); }} />;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-suno-900 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            BÔNUS ANUAL 2026 — INDICADOR DE IA (10%)
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Formulário Sniper de IA</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Preenchimento obrigatório e individual. As respostas são processadas automaticamente
            por IA — seja específico e factual.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Part A */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-suno-900 text-white text-xs font-bold px-3 py-1 rounded">PARTE A</span>
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Mapeamento e Contexto
              </span>
            </div>

            <div className="space-y-8">
              {CLOSED_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <p className="font-semibold text-gray-900 mb-4">
                    <span className="text-suno-600 mr-2">Q{idx + 1}.</span>
                    {q.text}
                  </p>
                  <div className="space-y-3">
                    {q.options.map((opt) => {
                      const selected = form[q.id] === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selected
                              ? "border-suno-600 bg-suno-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.value}
                            checked={selected}
                            onChange={() => setClosedAnswer(q.id, opt.value as ClosedAnswer)}
                            className="mt-0.5 accent-suno-600 shrink-0"
                          />
                          <span className="text-sm text-gray-700">
                            <span className="font-semibold text-gray-900 mr-1">
                              {opt.value.toUpperCase()})
                            </span>
                            {opt.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <QuestionRationale
                    rationale={q.rationale}
                    isOpen={openRationale.has(q.id)}
                    onToggle={() => toggleRationale(q.id)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Part B */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded">PARTE B</span>
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Validação Qualitativa
              </span>
            </div>

            <div className="space-y-6">
              {OPEN_QUESTIONS.map((q) => {
                const val = form[q.id];
                const charCount = val.trim().length;
                const isShort = charCount > 0 && charCount < 50;

                return (
                  <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <label className="block">
                      <span className="block font-semibold text-suno-700 text-sm mb-1">{q.label}</span>
                      <span className="block text-gray-900 font-medium mb-2">{q.text}</span>
                      <span className="block text-xs text-gray-500 mb-3 italic">
                        Orientação: {q.hint}
                      </span>
                      <textarea
                        value={val}
                        onChange={(e) => setOpenAnswer(q.id, e.target.value)}
                        rows={5}
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 transition ${
                          isShort
                            ? "border-amber-400 focus:ring-amber-300"
                            : "border-gray-300 focus:ring-suno-500"
                        }`}
                        placeholder="Escreva aqui..."
                      />
                      <div className="mt-1 flex justify-between text-xs text-gray-400">
                        <span>{isShort && <span className="text-amber-600 font-medium">Mínimo: 50 caracteres</span>}</span>
                        <span>{charCount} chars</span>
                      </div>
                    </label>
                    <QuestionRationale
                      rationale={q.rationale}
                      isOpen={openRationale.has(q.id)}
                      onToggle={() => toggleRationale(q.id)}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col items-end gap-3 pb-12">
            {!isFormValid() && (
              <p className="text-xs text-gray-400">
                Preencha todas as questões fechadas e escreva ao menos 50 caracteres em cada resposta aberta.
              </p>
            )}
            <button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="bg-suno-900 text-white font-semibold px-8 py-3 rounded-lg hover:bg-suno-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Processando avaliação..." : "Enviar Formulário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
