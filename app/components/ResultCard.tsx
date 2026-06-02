"use client";

import type { SubmissionResult, Faixa } from "@/types/form";

const FAIXA_CONFIG: Record<Faixa, { label: string; color: string; bg: string; border: string }> = {
  top:          { label: "Top 20%",       color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-300" },
  mediana:      { label: "Mediana",       color: "text-blue-700",    bg: "bg-blue-50",     border: "border-blue-300"   },
  mediana_ruim: { label: "Mediana-Ruim",  color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-300"  },
  bottom:       { label: "Bottom",        color: "text-red-700",     bg: "bg-red-50",      border: "border-red-300"    },
};

const FLAG_LABELS: Record<string, string> = {
  resposta_generica:  "Resposta genérica / sem dados factuais",
  incoerencia_escopo: "Impacto incompatível com o escopo do cargo",
  ausencia_mecanica:  "Ausência de detalhamento técnico da solução",
};

interface Props {
  result: SubmissionResult;
  onReset: () => void;
}

export function ResultCard({ result, onReset }: Props) {
  const faixa = FAIXA_CONFIG[result.faixa];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Main score card */}
        <div className={`rounded-xl border-2 ${faixa.border} ${faixa.bg} p-8 text-center`}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
            Sua Nota Final — Indicador de IA 2026
          </p>
          <div className={`text-7xl font-black ${faixa.color} mb-2`}>{result.nota_final}</div>
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${faixa.border} ${faixa.color} font-semibold text-sm mb-4`}>
            {faixa.label} — {result.percentual_bonus}% do peso recebido
          </div>
          <p className="text-sm text-gray-600 max-w-md mx-auto">{result.evaluation.nota_justificada}</p>
        </div>

        {/* Score breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Composição da Nota</h2>
          <div className="grid grid-cols-3 divide-x divide-gray-100 text-center">
            <div className="px-4">
              <p className="text-2xl font-bold text-gray-900">{result.score_base}<span className="text-sm font-normal text-gray-500">/10</span></p>
              <p className="text-xs text-gray-500 mt-1">Score Base (Q1–Q5)<br/><span className="font-medium">peso 40%</span></p>
            </div>
            <div className="px-4">
              <p className="text-2xl font-bold text-gray-900">{result.nota_qualitativa}<span className="text-sm font-normal text-gray-500">/5</span></p>
              <p className="text-xs text-gray-500 mt-1">Avaliação Qualitativa<br/><span className="font-medium">peso 60%</span></p>
            </div>
            <div className="px-4">
              <p className="text-2xl font-bold text-gray-900">{result.nota_final}<span className="text-sm font-normal text-gray-500">/5</span></p>
              <p className="text-xs text-gray-500 mt-1">Nota Final<br/><span className="font-medium">ponderada</span></p>
            </div>
          </div>
        </div>

        {/* Fraud flags — only if any */}
        {result.evaluation.flags_fraude.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="font-semibold text-red-800 mb-3">
              ⚠ Flags de Atenção Detectadas
            </h2>
            {result.evaluation.rebaixamento_aplicado && (
              <p className="text-sm text-red-700 mb-3">{result.evaluation.rebaixamento_motivo}</p>
            )}
            <ul className="space-y-1">
              {result.evaluation.flags_fraude.map((flag) => (
                <li key={flag} className="text-sm text-red-700 flex gap-2">
                  <span>•</span>
                  <span>{FLAG_LABELS[flag] ?? flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Consistency analysis */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Análise de Consistência</h2>
          <p className="text-sm text-gray-600">{result.evaluation.analise_consistencia}</p>
        </div>

        {/* Positives and improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.evaluation.destaques_positivos.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <h3 className="font-semibold text-emerald-800 text-sm mb-3">Destaques Positivos</h3>
              <ul className="space-y-2">
                {result.evaluation.destaques_positivos.map((d, i) => (
                  <li key={i} className="text-sm text-emerald-700 flex gap-2">
                    <span className="shrink-0">✓</span>{d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.evaluation.pontos_de_melhoria.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-700 text-sm mb-3">Pontos de Melhoria</h3>
              <ul className="space-y-2">
                {result.evaluation.pontos_de_melhoria.map((p, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="shrink-0">→</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Top 20% alert */}
        {result.faixa === "top" && (
          <div className="bg-emerald-900 text-white rounded-xl p-5 text-sm">
            <p className="font-semibold mb-1">Você está no Top 20% preliminar.</p>
            <p className="text-emerald-200">
              Sua nota será validada em banca presencial. Prepare-se para demonstrar ao vivo
              a solução descrita — o Diretor e um IA Champion farão perguntas técnicas.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Submetido em {new Date(result.submitted_at).toLocaleString("pt-BR")}
          {result.orbit_webhook_queued && " · Nota enviada ao Orbit"}
        </p>

        <div className="text-center pb-12">
          <button
            onClick={onReset}
            className="text-sm text-gray-400 underline hover:text-gray-600 transition-colors"
          >
            Preencher novamente (apenas para testes)
          </button>
        </div>
      </div>
    </div>
  );
}
