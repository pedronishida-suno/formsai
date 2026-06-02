"use client";

export interface RationaleData {
  dimension: string;
  purpose: string;
  signal: string;
  flagRisk?: string[];
}

interface Props {
  rationale: RationaleData;
  isOpen: boolean;
  onToggle: () => void;
}

export function QuestionRationale({ rationale, isOpen, onToggle }: Props) {
  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 text-xs font-semibold text-suno-700 hover:text-suno-900 transition-colors group"
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-suno-100 text-suno-700 group-hover:bg-suno-200 transition-colors text-[11px]">
            {isOpen ? "▲" : "▼"}
          </span>
          O que o avaliador analisa nesta pergunta
        </span>
        <span className="text-gray-400 font-normal">{isOpen ? "Ocultar" : "Ver racional"}</span>
      </button>

      {isOpen && (
        <div className="mt-3 rounded-lg overflow-hidden border border-suno-100 divide-y divide-suno-100">
          {/* Dimensão */}
          <div className="bg-suno-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-suno-600 mb-1">
              Dimensão Avaliada
            </p>
            <p className="text-sm font-semibold text-suno-900">{rationale.dimension}</p>
          </div>

          {/* Objetivo */}
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Por que esta dimensão importa para a Suno
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{rationale.purpose}</p>
          </div>

          {/* Sinal */}
          <div className="bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Decisão que a resposta habilita
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{rationale.signal}</p>
          </div>

          {/* Flag risks — open questions only */}
          {rationale.flagRisk && rationale.flagRisk.length > 0 && (
            <div className="bg-amber-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2">
                ⚠ O que aciona penalização automática
              </p>
              <ul className="space-y-1.5">
                {rationale.flagRisk.map((risk, i) => (
                  <li key={i} className="text-sm text-amber-800 flex gap-2">
                    <span className="shrink-0 font-bold text-amber-500">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
