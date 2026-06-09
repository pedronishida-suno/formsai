"use client";

import { useState } from "react";
import type {
  ClosedAnswer,
  SniperFormData,
  SubmissionResult,
  PapelColaborador,
  AmplitudeSolucao,
  GestorScore,
} from "@/types/form";
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
        "Cada degrau representa uma ordem de grandeza diferente de valor para a empresa: (A) ChatGPT genérico = ganho individual não escalável, sem retenção de IP; (B) Co-workers institucionais = uso governado; (C) Skills internas = o colaborador gera IP institucional que outros consomem; (D) API / agentes / scripts = o colaborador constrói infraestrutura. É a pergunta com maior peso no Score Base (25%) porque alavancagem técnica é o ativo escasso.",
      signal:
        "Identifica o núcleo de criadores técnicos (C+D) que sustenta o programa de IA Champions e a biblioteca interna de Skills. Esses perfis são prioridade de retenção.",
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
        "A Suno precisa de criadores (que geram IP e solucionam problemas inéditos) e de replicadores eficientes (que escalam inovação existente). Os dois papéis têm valor, mas precisam ser identificados separadamente para gestão de carreira e composição de squads.",
      signal:
        "Define o pipeline de IA Champions: criadores (C+D) são os candidatos naturais a liderar workshops, documentar Skills e mentorar pares.",
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
        "IA em correção gramatical gera ganho marginal e invisível para o P&L. IA em pipelines e governança muda estrutura de custo. A métrica de Eficiência (Despesas com Pessoal / ROL) só é movida por ganhos no núcleo — não por produtividade cosmética.",
      signal:
        "Cruzado com as chaves únicas do colaborador (CPF × Família × Canal × BU × UN): quem responde D em chaves de Receita ou Rentabilidade é o candidato direto a case de replicação cross-BU.",
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
        "O padrão-ouro em TI corporativa para medir valor de qualquer sistema é o teste de remoção: se a retirada não dói, o sistema é decorativo. Isso detecta cargo culting: uso de IA como sinalização de modernidade sem ganho operacional real.",
      signal:
        "Opção D (impacto crítico) é o maior sinalizador de retenção prioritária do formulário. Esses colaboradores tornaram a IA parte da operação da sua cadeira — se saírem, levam infraestrutura.",
    },
  },
];

const OPEN_QUESTIONS: Array<{
  id: "q6" | "q7" | "q8";
  label: string;
  text: string;
  hint: string;
  rationale: RationaleData;
}> = [
  {
    id: "q6",
    label: "Q6 — Diagnóstico do Problema",
    text: "Descreva com precisão o problema, gargalo ou ineficiência que existia na sua rotina antes da aplicação da IA. O que tornava esse processo custoso, lento ou propenso a erros?",
    hint: "Seja específico. Indique o tempo gasto ou a frequência com que o problema ocorria (ex: 'Gastava 6h toda sexta consolidando planilhas manuais...').",
    rationale: {
      dimension: "Baseline quantificável — existência real do problema",
      purpose:
        "Toda reivindicação de impacto exige um before/after falsificável. Q6 é o débito (custo do problema), Q8 é o crédito (ganho da solução). Sem baseline quantificado com frequência, horas ou custo específico — qualquer ganho declarado em Q8 vira narrativa sem âncora.",
      signal:
        "O avaliador usa Q6 para verificar se o case foi construído com metodologia ou inventado retrospectivamente. A especificidade do problema é diretamente proporcional à credibilidade do restante.",
      flagRisk: [
        "Resposta sem número ou frequência específica aciona a flag resposta_generica → rebaixamento automático de –0,5 ponto.",
        "Problema incompatível com a área/cargo do colaborador aciona incoerencia_escopo.",
      ],
    },
  },
  {
    id: "q7",
    label: "Q7 — Racional e Mecânica de Uso",
    text: "Qual foi o racional para escolher essa abordagem de IA? Explique o passo a passo da solução: qual ferramenta, como foi configurada, o que entra como input, o que sai como output e qual regra de negócio está embarcada.",
    hint: "Evite respostas vagas como 'usei o ChatGPT para me ajudar'. Explique a mecânica e o porquê da escolha: ferramenta, estrutura de prompt/Skill, input, output, regra embarcada.",
    rationale: {
      dimension: "Domínio técnico real — o colaborador é dono ou apenas operador?",
      purpose:
        "Quem não consegue explicar a mecânica não é dono da solução. Em setor regulado (CVM), isso é risco de governança. Além disso, Q7 bem escrita é documentação técnica reutilizável — as melhores alimentam a biblioteca interna de Skills da Suno.",
      signal:
        "É a pergunta que mais diferencia Top 20% de Mediana: Mediana descreve uso; Top descreve arquitetura e racional.",
      flagRisk: [
        "Ausência de ferramenta específica, regra de negócio ou formato de input/output aciona ausencia_mecanica → nota travada em 1,0.",
        "Resposta que parece gerada por IA genérica sem conteúdo factual da rotina é marcada para auditoria manual.",
      ],
    },
  },
  {
    id: "q8",
    label: "Q8 — Evidência de Impacto",
    text: "Descreva a situação atual do processo após a implementação. Quais foram os ganhos tangíveis de tempo (horas liberadas), de qualidade do output ou de redução de custos?",
    hint: "O impacto deve ser proporcional à sua cadeira. Estagiário: foque nas horas economizadas na sua rotina. Analista/Gestor: foque no impacto do processo da subárea.",
    rationale: {
      dimension: "ROI individual proporcional ao cargo e à chave de indicador",
      purpose:
        "Esta pergunta fecha o circuito econômico do formulário. O somatório de Q8 de 300 colaboradores, após auditoria, é o número que a Suno usará para defender o investimento em IA perante o Conselho.",
      signal:
        "Cases com Q8 robusta em chaves de Receita/EBITDA são candidatos ao Painel do Jean como exemplos de replicação cross-BU.",
      flagRisk: [
        "Diretor declarando '2h economizadas em revisão de e-mail' → impacto pequeno demais para o cargo → incoerencia_escopo.",
        "Ausência de número concreto → resposta_generica.",
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Manager question definitions
// ---------------------------------------------------------------------------

const PAPEL_OPTIONS: Array<{ value: PapelColaborador; label: string; description: string }> = [
  { value: "replicador",    label: "Replicador",    description: "Adotou solução pronta desenvolvida por outro colaborador ou Champion." },
  { value: "adaptador",     label: "Adaptador",     description: "Personalizou solução existente para sua cadeira específica." },
  { value: "criador",       label: "Criador",       description: "Desenvolveu solução nova (Skill, agente, script ou fluxo próprio)." },
  { value: "multiplicador", label: "Multiplicador", description: "Criou solução adotada por outros colaboradores ou áreas." },
];

const AMPLITUDE_OPTIONS: Array<{ value: AmplitudeSolucao; label: string; description: string }> = [
  { value: "individual", label: "Individual",   description: "Impacto restrito à própria rotina do colaborador." },
  { value: "subarea",    label: "Subárea",      description: "Adotada por membros diretos da mesma subárea." },
  { value: "area",       label: "Área",         description: "Replicável ou já replicada em toda a área/equipe." },
  { value: "cross_bu",   label: "Cross-BU",     description: "Extrapolou a área e foi adotada em outra BU ou canal." },
  { value: "empresa",    label: "Empresa",      description: "Solução estratégica adotada ou recomendada para toda a Suno." },
];

const GESTOR_SCALE: Array<{ value: GestorScore; label: string }> = [
  { value: 1, label: "1 — Muito baixo" },
  { value: 2, label: "2 — Abaixo do esperado" },
  { value: 3, label: "3 — Adequado" },
  { value: 4, label: "4 — Acima do esperado" },
  { value: 5, label: "5 — Excepcional" },
];

// ---------------------------------------------------------------------------
// Default collaborator (in production: injected via Orbit SSO/JWT query params)
// ---------------------------------------------------------------------------

const NIVEL_OPTIONS: Array<{ value: import("@/types/form").Nivel; label: string }> = [
  { value: "estagiario",   label: "Estagiário" },
  { value: "junior",       label: "Júnior" },
  { value: "pleno",        label: "Pleno" },
  { value: "senior",       label: "Sênior" },
  { value: "especialista", label: "Especialista" },
  { value: "gerente",      label: "Gerente" },
  { value: "diretor",      label: "Diretor" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FormState = {
  cargo: string;
  nivel: import("@/types/form").Nivel;
  q1: ClosedAnswer | "";
  q2: ClosedAnswer | "";
  q3: ClosedAnswer | "";
  q4: ClosedAnswer | "";
  q5: ClosedAnswer | "";
  q6: string;
  q7: string;
  q8: string;
  gestor_papel: PapelColaborador | "";
  gestor_amplitude: AmplitudeSolucao | "";
  gestor_nota_case: GestorScore | 0;
  gestor_nota_protagonismo: GestorScore | 0;
};

const EMPTY_FORM: FormState = {
  cargo: "", nivel: "pleno",
  q1: "", q2: "", q3: "", q4: "", q5: "",
  q6: "", q7: "", q8: "",
  gestor_papel: "",
  gestor_amplitude: "",
  gestor_nota_case: 0,
  gestor_nota_protagonismo: 0,
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

  function setOpenAnswer(key: "q6" | "q7" | "q8", value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function isFormValid(): boolean {
    if (!form.cargo.trim()) return false;
    const closedComplete = (["q1", "q2", "q3", "q4", "q5"] as const).every((k) => form[k] !== "");
    const openComplete = (["q6", "q7", "q8"] as const).every((k) => form[k].trim().length >= 50);
    const gestorComplete =
      form.gestor_papel !== "" &&
      form.gestor_amplitude !== "" &&
      form.gestor_nota_case !== 0 &&
      form.gestor_nota_protagonismo !== 0;
    return closedComplete && openComplete && gestorComplete;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid()) return;

    setSubmitting(true);
    setError(null);

    const payload: SniperFormData = {
      collaborator: {
        name: "Colaborador",
        cpf_hash: "",
        cargo: form.cargo.trim(),
        nivel: form.nivel,
        bu: "",
        un: "",
      },
      q1: form.q1 as ClosedAnswer,
      q2: form.q2 as ClosedAnswer,
      q3: form.q3 as ClosedAnswer,
      q4: form.q4 as ClosedAnswer,
      q5: form.q5 as ClosedAnswer,
      q6: form.q6,
      q7: form.q7,
      q8: form.q8,
      gestor_papel: form.gestor_papel as PapelColaborador,
      gestor_amplitude: form.gestor_amplitude as AmplitudeSolucao,
      gestor_nota_case: form.gestor_nota_case as GestorScore,
      gestor_nota_protagonismo: form.gestor_nota_protagonismo as GestorScore,
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
          <h1 className="text-3xl font-bold text-gray-900">Formulário de Avaliação de IA</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Preenchimento em duas camadas: o colaborador responde as Partes A e B; o gestor direto preenche a Parte C.
            As respostas são processadas automaticamente por IA — seja específico e factual.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Identificação */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Identificação</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo / Função <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.cargo}
                  onChange={(e) => setForm((prev) => ({ ...prev, cargo: e.target.value }))}
                  placeholder="Ex: Analista de Research, Crédito Privado"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-suno-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                <select
                  value={form.nivel}
                  onChange={(e) => setForm((prev) => ({ ...prev, nivel: e.target.value as import("@/types/form").Nivel }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-suno-500"
                >
                  {NIVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Part A — Mapeamento */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-suno-900 text-white text-xs font-bold px-3 py-1 rounded">PARTE A</span>
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Mapeamento e Contexto — preenchido pelo colaborador
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

          {/* Part B — Colaborador open questions */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded">PARTE B</span>
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Diagnóstico, Racional e Impacto — preenchido pelo colaborador
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

          {/* Part C — Manager evaluation */}
          <section>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-indigo-700 text-white text-xs font-bold px-3 py-1 rounded">PARTE C</span>
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Avaliação do Gestor Direto
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Esta seção é preenchida exclusivamente pelo gestor direto do colaborador, após a leitura das respostas das Partes A e B.
            </p>

            <div className="space-y-6">
              {/* C1 — Papel do colaborador */}
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
                <p className="font-semibold text-gray-900 mb-1">
                  <span className="text-indigo-700 mr-2">C1.</span>
                  Qual melhor descreve o papel deste colaborador na solução de IA apresentada?
                </p>
                <p className="text-xs text-gray-500 mb-4 italic">
                  Considere o protagonismo real, não o cargo. Um estagiário que criou uma Skill adotada pela equipe é Multiplicador.
                </p>
                <div className="space-y-3">
                  {PAPEL_OPTIONS.map((opt) => {
                    const selected = form.gestor_papel === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selected
                            ? "border-indigo-600 bg-white"
                            : "border-indigo-100 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gestor_papel"
                          value={opt.value}
                          checked={selected}
                          onChange={() => setForm((prev) => ({ ...prev, gestor_papel: opt.value }))}
                          className="mt-0.5 accent-indigo-600 shrink-0"
                        />
                        <span className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-900 mr-1">{opt.label}:</span>
                          {opt.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* C2 — Amplitude da solução */}
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
                <p className="font-semibold text-gray-900 mb-1">
                  <span className="text-indigo-700 mr-2">C2.</span>
                  Qual foi a amplitude de alcance da solução implementada?
                </p>
                <p className="text-xs text-gray-500 mb-4 italic">
                  Considere o alcance real verificado — não o potencial declarado pelo colaborador.
                </p>
                <div className="space-y-3">
                  {AMPLITUDE_OPTIONS.map((opt) => {
                    const selected = form.gestor_amplitude === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selected
                            ? "border-indigo-600 bg-white"
                            : "border-indigo-100 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gestor_amplitude"
                          value={opt.value}
                          checked={selected}
                          onChange={() => setForm((prev) => ({ ...prev, gestor_amplitude: opt.value }))}
                          className="mt-0.5 accent-indigo-600 shrink-0"
                        />
                        <span className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-900 mr-1">{opt.label}:</span>
                          {opt.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* C3 — Confiabilidade do case */}
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
                <p className="font-semibold text-gray-900 mb-1">
                  <span className="text-indigo-700 mr-2">C3.</span>
                  Quão confiável e verificável é o case apresentado pelo colaborador?
                </p>
                <p className="text-xs text-gray-500 mb-4 italic">
                  Avalie se os fatos descritos condizem com o que você observou no dia a dia do colaborador.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {GESTOR_SCALE.map((opt) => {
                    const selected = form.gestor_nota_case === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                          selected
                            ? "border-indigo-600 bg-white font-semibold text-indigo-700"
                            : "border-indigo-100 bg-white hover:border-indigo-300 text-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gestor_nota_case"
                          value={opt.value}
                          checked={selected}
                          onChange={() => setForm((prev) => ({ ...prev, gestor_nota_case: opt.value }))}
                          className="sr-only"
                        />
                        <span className="text-xl font-bold">{opt.value}</span>
                        <span className="text-xs leading-tight">{opt.label.split(" — ")[1]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* C4 — Nota de protagonismo */}
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
                <p className="font-semibold text-gray-900 mb-1">
                  <span className="text-indigo-700 mr-2">C4.</span>
                  Considerando o conjunto, qual nota você atribui ao protagonismo deste colaborador no uso de IA este ano?
                </p>
                <p className="text-xs text-gray-500 mb-4 italic">
                  Esta é sua avaliação síntese como gestor — pondere frequência, qualidade, impacto e iniciativa.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {GESTOR_SCALE.map((opt) => {
                    const selected = form.gestor_nota_protagonismo === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                          selected
                            ? "border-indigo-600 bg-white font-semibold text-indigo-700"
                            : "border-indigo-100 bg-white hover:border-indigo-300 text-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gestor_nota_protagonismo"
                          value={opt.value}
                          checked={selected}
                          onChange={() => setForm((prev) => ({ ...prev, gestor_nota_protagonismo: opt.value }))}
                          className="sr-only"
                        />
                        <span className="text-xl font-bold">{opt.value}</span>
                        <span className="text-xs leading-tight">{opt.label.split(" — ")[1]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
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
                Preencha todas as seções: questões fechadas, respostas abertas (mín. 50 caracteres) e avaliação do gestor.
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
