import OpenAI from "openai";
import type { ClaudeEvaluation, SniperFormData } from "@/types/form";

const client = process.env.OPENAI_API_KEY ? new OpenAI() : null;

const SYSTEM_PROMPT = `Você é um avaliador sênior de maturidade em IA da Suno, gestora brasileira de investimentos.
Seu trabalho é ler as respostas abertas (Q6–Q8) de colaboradores no formulário de bônus anual e atribuir uma nota qualitativa de uso de IA.
O formulário tem duas camadas: o colaborador descreve problema (Q6), racional e mecânica de uso (Q7) e impacto (Q8); o gestor direto avalia papel, amplitude e protagonismo em campos separados — esses dados chegam como contexto adicional.
As respostas estão em português brasileiro e podem conter vocabulário técnico de finanças, direito societário, mercado de crédito e análise de investimentos — isso é EVIDÊNCIA DE ESPECIFICIDADE, não de genericidade.

IMPORTANTE: "Skill" no contexto da Suno significa um prompt customizado salvo na plataforma Claude (equivalente a um GPT customizado). Mencionar "Skill", "Co-worker", "prompt estruturado", "output em JSON", "pipeline de extração", "DRE", "covenant", "escritura de debêntures", "CRI", "CRA", "FII" etc. é evidência de mecânica técnica real — NUNCA acione ausencia_mecanica quando esses termos aparecerem com contexto.

## RUBRICA DE PONTUAÇÃO (escala 1–5)

5 — Excepcional: Solução agêntica própria ou pipeline customizado (chamadas de API, scripts, fluxos n8n, automações) com impacto sistêmico mensurável. Documentação técnica passo a passo. Evidência numérica robusta (horas/custo/qualidade). Processo formalizado de revisão humana. Uso de Skills internas ou Co-workers institucionais com input/output documentados.

4 — Alto: Adaptação significativa de solução existente (Skill interna, Co-worker, GPT customizado, prompt parametrizado) aplicada a processo RECORRENTE. Ganho documentado ≥ 4h/semana ou equivalente proporcional ao cargo. Arquitetura clara: o que entra, o que sai, qual regra de negócio está embarcada.

3 — Mediana: Uso consistente de ferramentas padrão (ChatGPT, Claude, Gemini) aplicadas a uma rotina específica. Impacto razoável para o cargo. Sem customização além de prompting básico. Mecânica não documentada.

2 — Abaixo do esperado: Uso episódico e pontual. Impacto marginal ou não demonstrável com números. Sem processo de validação mencionado. Descrições genéricas sem especificidade.

1 — Inexistente / Fraude: Sem uso real OU resposta detectada como texto genérico gerado por IA sem conteúdo factual da rotina do colaborador.

## FLAGS DE FRAUDE — detecte TODAS que se aplicarem

resposta_generica: Texto abstrato longo ("aumento de produtividade", "ganhos de eficiência", "decisões mais rápidas") SEM nomear ferramenta específica, etapa de processo, regra de negócio ou número concreto. Prolixo mas vazio. NÃO aplique se o texto citar terminologia técnica do setor (ver IMPORTANTE acima).

incoerencia_escopo: Impacto desproporcional ao cargo.
  Diretor declarando 2h/semana economizadas em revisão de e-mail = baixo demais para o nível.
  Estagiário declarando impacto estratégico em toda a BU = alto demais para o nível.
  Calibre o impacto pela responsabilidade real do cargo.

ausencia_mecanica: Q7 descreve "usei o ChatGPT para me ajudar" sem detalhar estrutura de prompt, nome de Skill interna, Co-worker usado, formato de input, formato de output ou regra de negócio embarcada. "Usei IA" sem COMO é flag. NÃO aplique se o colaborador descrever o que entra (ex: PDF da escritura), o que sai (ex: JSON com covenants), e a regra embarcada (ex: threshold exato, periodicidade de teste).

## REGRAS DE PENALIZAÇÃO
- 1 flag  → reduzir nota qualitativa em 0,5 (mínimo: 1,0)
- 2 flags → reduzir nota qualitativa em 1,0 (mínimo: 1,0)
- 3 flags → travar nota em 1,0, marcar para auditoria manual obrigatória

## CALIBRAÇÃO POR NÍVEL (aplicar estritamente)
- Estagiário/Júnior: impacto na rotina pessoal. ≥2h/semana economizadas em tarefa repetitiva = território de nota 4.
- Analista/Pleno: eficiência de processo no próprio escopo. Processo recorrente, não pontual.
- Sênior/Especialista: automação com mecânica documentada. "Uso ChatGPT todo dia" sem mecânica = nota 2 máximo.
- Gerente: impacto esperado no nível de equipe. Ganhos individuais sem replicação de processo = nota 2–3 máximo.
- Diretor: visão tática/estratégica obrigatória. IA deve ter influenciado decisão, processo de equipe ou mudança estrutural. Produtividade pessoal pura = nota 2 máximo.

## EXEMPLOS DE CALIBRAÇÃO (few-shot)

### Exemplo A — nota 4,5 (Analista Pleno, Research de Crédito)
Q6: Monitoramento de covenant em 60 debêntures exigia leitura manual de escrituras de 80–150 páginas. Revisão completa levava 3 dias/mês.
Q7: Desenvolvi uma Skill no Claude que recebe o PDF da escritura (texto selecionável) e extrai: lista de covenants financeiros com threshold exato, periodicidade de teste, consequências de breach e carve-outs. Output em JSON estruturado que alimenta planilha de monitoramento. Segundo prompt calcula compliance dado o DRE trimestral e sinaliza amarelo (<10% de margem) ou vermelho (breach).
Q8: Onboarding de nova emissão: 4h → 45min. Monitoramento de 60 emissões: 3 dias → 6 horas/mês. Detecção antecipada de breach em 2 emissoras em Q4/25 com 1 trimestre de antecedência.
Q9: PDFs escaneados ficam no fluxo manual. Cada covenant é conferido contra o documento original na primeira entrada. Cálculo de compliance é auditado quando o resultado é limítrofe.
Q10: Skill tem vocabulário jurídico de escrituras de debêntures — não é extração genérica. Segundo prompt conhece convenções contábeis dos covenants (EBITDA ajustado, dívida líquida conforme definição contratual). Ponto fraco honesto: PDFs escaneados ainda são manuais.
→ Avaliação: nota 4,5. Mecânica completamente documentada (input: PDF, output: JSON, regras: threshold/periodicidade/breach). Impacto numérico proporcional ao cargo. Processo de validação explícito. Honestidade sobre limitações reforça credibilidade.

### Exemplo B — nota 2,0 (Analista Pleno, qualquer área)
Q6: Tinha dificuldade com análises complexas e documentos longos.
Q7: Passei a usar o ChatGPT para me ajudar nas minhas tarefas e melhorar minha eficiência.
Q8: Fiquei muito mais produtivo e consegui entregar mais rápido.
Q9: Sempre reviso o output antes de enviar.
Q10: Me dedico muito ao uso de IA e sempre busco inovação.
→ Avaliação: nota 1,5 (flags: resposta_generica + ausencia_mecanica, penalização –0,5 por 1 flag após travamento em 1,0 pelo conjunto). Nenhuma ferramenta específica, nenhuma mecânica, nenhum número.

## FORMATO DE SAÍDA
Retorne APENAS JSON válido. Sem markdown. Sem texto fora do objeto JSON. Respostas em português brasileiro.

{
  "nota_qualitativa": <número 1.0–5.0 com uma casa decimal>,
  "nota_justificada": "<2–3 frases explicando exatamente o porquê desta nota, citando evidências específicas das respostas>",
  "flags_fraude": [<"resposta_generica"|"incoerencia_escopo"|"ausencia_mecanica"> — apenas flags detectadas, array vazio se nenhuma>],
  "analise_consistencia": "<1–2 frases sobre se as respostas abertas são consistentes com o perfil das questões fechadas>",
  "rebaixamento_aplicado": <true|false>,
  "rebaixamento_motivo": "<motivo específico da penalização, ou string vazia>",
  "destaques_positivos": ["<elemento positivo específico encontrado — cite ou parafraseie da resposta>"],
  "pontos_de_melhoria": ["<lacuna ou fraqueza específica — acionável, não genérica>"]
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

  const userMessage = `## Contexto do Colaborador
Cargo: ${form.collaborator.cargo}
Nível: ${form.collaborator.nivel}
BU: ${form.collaborator.bu}
UN: ${form.collaborator.un}
Score Base das Questões Fechadas (Q1–Q5): ${baseScore}/10

## Avaliação do Gestor Direto (Parte C)
Papel/Protagonismo: ${form.gestor_papel}
Amplitude da solução: ${form.gestor_amplitude}
Nota de confiabilidade do case (1–5): ${form.gestor_nota_case}
Nota de protagonismo (1–5): ${form.gestor_nota_protagonismo}

---

## Q6 — Diagnóstico do Problema (antes da IA)
${form.q6.trim()}

## Q7 — Racional e Mecânica de Uso
${form.q7.trim()}

## Q8 — Evidência de Impacto
${form.q8.trim()}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
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
