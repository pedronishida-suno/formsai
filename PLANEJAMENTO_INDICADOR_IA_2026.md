# PLANEJAMENTO E ESCOPO DO PROJETO
## Indicador de IA & Automação de Dados via Orbit — Suno 2026

**Versão:** 1.0  
**Data:** 22/05/2026  
**Classificação:** Documento Interno — Restrito Liderança  
**Patrocinador:** CPO / CEO  
**Escala-alvo:** 300 colaboradores

---

## PREMISSAS E REGRAS DE OURO

| Parâmetro | Definição |
|---|---|
| Peso no bônus anual | **10%** |
| Distribuição (curva forçada) | **20% Top / 70% Mediana / 10% Bottom** |
| Métrica de Eficiência | **Despesas com Pessoal / ROL** (acumulado ano) — substitui Receita/Colaborador |
| Painel de Desvios | Top **15** chaves responsáveis por desvio de EBITDA/Receita |
| Anti-fraude | Auditoria punitiva com responsabilização direta do Diretor |
| Princípio central | **Diferenciação real**: Top 20% premiado por inovação, Mediana protegida, Bottom zerado por omissão |

---

## FASE 1: ARQUITETURA TECNOLÓGICA & INTEGRAÇÃO DE DADOS
### Mês 1 — Fundação do Pipeline e Governança de Dados

---

### 1.1 Pipeline Snowflake ➔ Orbit: Fluxo ELT Automatizado e Dados Travados

**Objetivo:** Eliminar o input manual humano em todos os indicadores quantitativos de qualidade e P&L, injetando dados diretamente do Snowflake no Orbit com lock de edição.

#### Arquitetura do Fluxo

```
[Fontes Transacionais]          [Camada de Staging]         [Camada de Serving]        [Orbit API]
  - Core bancário          ──►  Snowflake RAW Schema   ──►  Snowflake GOLD Schema  ──►  POST /indicators
  - CRM / HubSpot          ──►  (ingestão via Fivetran)      (dbt transformations)       (webhook diário)
  - Dados de Qualidade     ──►  Atualização: D-1             Agregações por chave        Lock: read-only
  - Folha de Pagamento     ──►                               única CPF + dimensão        no Orbit UI
```

**Etapas técnicas:**

1. **Extração (Extract):** Jobs agendados via dbt Cloud ou Airflow em frequência diária (D-1). Cada fonte transacional tem um conector dedicado. A folha de pagamento (Despesas com Pessoal) e o ROL são extraídos da camada contábil com granularidade mensal, acumulados no ano-corrente.

2. **Transformação (Transform):** Camada `GOLD` no Snowflake executa as seguintes lógicas:
   - Cálculo da métrica `Eficiência de Pessoal = SUM(Despesas_Pessoal_YTD) / SUM(ROL_YTD)` por chave única (ver 1.2).
   - Cálculo do indicador de qualidade por BU/Canal/UN, normalizado para score 0–100.
   - Flags de SLA e anomalias via window functions (`LAG`, `STDDEV`) para alimentar o motor de desvio (ver 1.3).

3. **Carga no Orbit (Load):** API REST do Orbit recebe um `POST /indicators/bulk` diário com payload estruturado por `chave_cpf`. O campo `is_locked: true` é setado em todos os campos quantitativos — o Orbit renderiza esses campos como read-only na interface do gestor, impedindo sobrescrita manual.

4. **Rollback e Auditoria:** Toda carga gera um `batch_id` no Snowflake com timestamp, hash dos registros e status de resposta da API. Em caso de falha de ingestão, o campo permanece com o último valor válido e a equipe de Data Quality é alertada via PagerDuty/Slack com SLA de resolução de 4h.

**Governance gate:** Nenhum indicador quantitativo pode ser inserido manualmente no Orbit pelo gestor ou pelo RH. Qualquer tentativa de edição de campo travado gera log de auditoria e notificação ao CPTO.

---

### 1.2 Matriz de Chaves Únicas: Chave CPF como Identificador Dimensional

**Objetivo:** Garantir unicidade, rastreabilidade e granularidade dos indicadores, permitindo análise cross-dimensional sem ambiguidade de atribuição.

#### Estrutura da Chave Composta

A chave única é um hash determinístico gerado pela concatenação das seguintes dimensões:

```
CHAVE_UNICA = HASH(CPF + FAMILIA_INDICADOR + CANAL + BU + UN + ANO_VIGENCIA)
```

| Dimensão | Domínio de Valores | Exemplo |
|---|---|---|
| **CPF** | Identificador do colaborador (mascarado: `***.XXX.XXX-**`) | `123.456.789-00` |
| **Família de Indicador** | `RECEITA`, `QUALIDADE`, `SATISFACAO`, `RENTABILIDADE` | `RENTABILIDADE` |
| **Canal** | `ASSESSORIA`, `DIGITAL`, `INSTITUCIONAL`, `CORPORATIVO` | `ASSESSORIA` |
| **BU** | Business Unit interna (mapeada via HR master data) | `RENDA_VARIAVEL` |
| **UN** | Unidade de Negócio ou filial | `SP_ITAIM` |
| **Ano** | Ano de vigência do ciclo | `2026` |

**Regras de integridade:**

- Um colaborador pode ter **N chaves únicas**, uma para cada combinação de `(Família × Canal × BU × UN)` que pertença ao seu escopo.
- A nota final do colaborador no Orbit é um **agregado ponderado** das chaves a ele atribuídas, com pesos definidos pela área de RH no cadastro do cargo.
- A atribuição de chaves a CPFs é gerenciada na tabela `DIM_COLABORADOR_INDICADORES` no Snowflake, atualizada pelo RH via formulário de onboarding/offboarding. É o único input manual permitido no sistema — e requer aprovação de dois níveis (RH + Diretor da BU).

**Tabela de mapeamento (exemplo):**

```sql
SELECT
    cpf_hash,
    familia_indicador,
    canal,
    bu,
    un,
    ano_vigencia,
    MD5(CONCAT_WS('|', cpf_hash, familia_indicador, canal, bu, un, CAST(ano_vigencia AS VARCHAR))) AS chave_unica
FROM dim_colaborador_indicadores
WHERE ano_vigencia = 2026
  AND ativo = TRUE;
```

---

### 1.3 Motor de Análise Automatizada de Desvios: O Painel do Jean

**Objetivo:** Ao identificar que EBITDA ou Receita não bateu no acumulado do mês, o algoritmo varre automaticamente as chaves únicas e entrega ao Diretor/CEO os **15 principais desvios** responsáveis pelo resultado, eliminando a necessidade de análise manual.

#### Lógica do Algoritmo

**Passo 1 — Trigger de Desvio:**  
Um job diário no Snowflake calcula o desvio entre o realizado e o orçado (budget) para as métricas `RECEITA_ACUMULADA` e `EBITDA_ACUMULADO` por BU/UN. Se `|DESVIO_PERCENTUAL| > THRESHOLD` (ex: ±5%), o painel é ativado automaticamente.

```sql
-- Trigger condition
WITH desvio AS (
    SELECT
        bu,
        un,
        SUM(receita_realizado_ytd) AS realizado,
        SUM(receita_orcado_ytd)    AS orcado,
        (realizado - orcado) / NULLIF(orcado, 0) AS desvio_pct
    FROM fct_resultado_financeiro
    WHERE ano_mes_ref = DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY bu, un
)
SELECT * FROM desvio WHERE ABS(desvio_pct) > 0.05;
```

**Passo 2 — Varredura de Chaves Responsáveis:**  
Para cada BU/UN em desvio, o algoritmo cruza as chaves únicas ativas e calcula a **contribuição marginal de cada chave** para o desvio total:

```sql
SELECT
    c.chave_unica,
    c.cpf_hash,
    c.colaborador_nome,
    c.cargo,
    c.bu,
    c.un,
    f.familia_indicador,
    SUM(r.valor_realizado_ytd - r.valor_orcado_ytd) AS contribuicao_desvio_abs,
    SUM(r.valor_realizado_ytd - r.valor_orcado_ytd) / SUM(SUM(r.valor_realizado_ytd - r.valor_orcado_ytd)) 
        OVER (PARTITION BY c.bu, c.un) AS pct_contrib_desvio
FROM fct_resultado_por_chave r
JOIN dim_colaborador_indicadores c ON r.chave_unica = c.chave_unica
WHERE r.ano_mes_ref = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY ABS(contribuicao_desvio_abs) DESC
LIMIT 15;
```

**Passo 3 — Renderização no Orbit:**  
O resultado da query é enviado via API para um painel exclusivo no Orbit, visível apenas para o Diretor da BU e o CEO. O painel exibe:

| Rank | Colaborador | Cargo | BU/UN | Família Indicador | Desvio (R$) | % Contrib. | Alerta |
|---|---|---|---|---|---|---|---|
| 1 | João S. | Assessor Sr. | RV / SP Itaim | RECEITA | -R$ 480k | 18,3% | 🔴 Crítico |
| 2 | Maria L. | Gestora Digital | Digital / Nacional | SATISFAÇÃO | -R$ 210k | 8,0% | 🟡 Atenção |
| ... | | | | | | | |

**Semáforo de criticidade** calculado por z-score do desvio em relação à distribuição histórica dos últimos 12 meses da chave.

**Passo 4 — Drill-down e Nota de Contexto:**  
Cada linha do painel tem um botão de drill-down que abre o histórico da chave (últimos 12 meses), o target do colaborador no ciclo vigente e a nota de IA preenchida no formulário Sniper (ver Fase 2). Isso permite ao Diretor distinguir entre desvio por contexto de mercado vs. desvio por performance individual.

---

## FASE 2: ENGENHARIA DA CADEIA DE INCENTIVOS
### Mês 2 — Motor de IA, Protocolo da Curva e Matriz Financeira

---

### 2.1 Mecanismo Antigambiarra no Formulário Sniper de IA

**Objetivo:** Usar o modelo de linguagem (Claude) para processar as respostas abertas (Q6–Q10) do Formulário Sniper de 10 Perguntas, gerar uma nota de 1 a 5 com rastreabilidade e detectar fraudes — incluindo tentativas de Prompt Injection via textos gerados por IA corporativa.

#### O Formulário Sniper (Estrutura Completa)

O formulário é dividido em duas partes complementares:

**Parte A — Mapeamento Quantitativo (Q1–Q5, respostas fechadas):**

| Questão | Dimensão Avaliada | Peso no Score Base |
|---|---|---|
| Q1 | Frequência de uso de IA | 15% |
| Q2 | Ferramenta/ambiente utilizado | 25% |
| Q3 | Origem da solução (replicado vs. desenvolvido) | 20% |
| Q4 | Onde foi implementado no fluxo | 20% |
| Q5 | Criticidade se removida | 20% |

Cada resposta (`a` → `d`) mapeia para 1, 2, 3 ou 4 pontos. O **Score Base** é o somatório ponderado, normalizado de 0 a 10.

**Parte B — Validação Qualitativa (Q6–Q10, respostas abertas):**

- **Q6:** Diagnóstico do cenário anterior (problema real, com métricas de frequência/tempo).
- **Q7:** Arquitetura da solução (mecânica do prompt, da Skill interna ou do Co-worker institucional utilizado).
- **Q8:** Evidência de impacto (horas liberadas, redução de custo, ganho de qualidade — proporcional ao cargo).
- **Q9:** Mitigação de riscos (processo de checagem humana, filtros de alucinação).
- **Q10:** Justificativa de diferenciação (por que é Top 20% e não mediana burocrática).

#### Pipeline de Processamento pelo Claude

```
[Orbit: Submissão do Formulário]
        │
        ▼
[Pré-processamento]
  - Injeção do contexto do colaborador: cargo, BU, UN, nível hierárquico
  - Injeção das respostas fechadas (Q1–Q5) para contexto
  - Normalização de encoding, remoção de HTML
        │
        ▼
[Claude API — Prompt de Avaliação]
  System: Você é um avaliador sênior de maturidade em IA corporativa.
          Cargo do colaborador: {cargo}. Nível: {nivel}. BU: {bu}.
          Score base das questões fechadas: {score_base}/10.
          Gabarito: [ver abaixo]
  User: [Q6 a Q10 verbatim]
        │
        ▼
[Output Estruturado — JSON]
  {
    "nota_final": 3.8,
    "nota_justificada": "...",
    "flags_fraude": ["resposta_generica_q7", "ausencia_metrica_q8"],
    "analise_consistencia": "Baixa: Q7 descreve mecânica vaga sem nomear ferramenta...",
    "rebaixamento_aplicado": true,
    "rebaixamento_motivo": "Cargo Analista Sênior com ganho descrito inferior ao esperado..."
  }
```

#### Gabarito de Notas (1 a 5) por Rubrica

| Nota | Classificação | Critério |
|---|---|---|
| **5** | Excepcional | Solução própria/agêntica com impacto sistêmico mensurável, documentação técnica de mecânica, evidência numérica robusta, processo de checagem formalizado. |
| **4** | Alto | Adaptação significativa de solução existente (Skill interna / Co-worker institucional) com ganho documentado ≥ 4h/semana ou equivalente proporcional ao cargo. Arquitetura detalhada. |
| **3** | Mediana | Uso recorrente de ferramenta padrão (ChatGPT/Claude/Gemini) com aplicação consistente a uma rotina. Impacto razoável, mas sem inovação na mecânica. |
| **2** | Abaixo do Esperado | Uso episódico e pontual. Impacto marginal ou não demonstrável. Sem processo de validação. |
| **1** | Inexistente/Fraud | Ausência de uso real OU detecção de resposta gerada por IA padrão sem conteúdo factual. |

#### Detecção de Fraude e Prompt Injection

O Claude avalia três vetores de fraude:

1. **Genericidade Prolíxa:** Respostas longas que descrevem benefícios de IA em termos abstratos ("melhoria de produtividade", "ganhos de eficiência") sem nomear ferramenta, processo, arquivo, regra de negócio ou número concreto. Flag: `resposta_generica`.

2. **Inconsistência Cargo × Impacto:** Um Diretor que descreve 2h economizadas em revisão de e-mail; um Estagiário que descreve impacto estratégico em toda a BU. O Claude, tendo o cargo como contexto, rebaixa a nota quando o nível de impacto descrito é desproporcional — para cima ou para baixo. Flag: `incoerencia_escopo`.

3. **Ausência de Especificidade Técnica em Q7:** Respostas que descrevem "usar o ChatGPT" sem detalhar o prompt, a Skill interna, o Co-worker institucional, o formato de input/output ou a regra de negócio embarcada são classificadas como superficiais. Flag: `ausencia_mecanica`.

**Protocolo de rebaixamento automático:**
- 1 flag: nota reduzida em 0,5 ponto.
- 2 flags: nota reduzida em 1,0 ponto e gestor notificado para revisão.
- 3 flags: nota travada em 1,0 e caso marcado para auditoria manual obrigatória.

**A nota final** é a média ponderada entre Score Base das questões fechadas (40%) e nota da avaliação qualitativa do Claude (60%), arredondada para uma casa decimal.

---

### 2.2 Manual da Curva Forçada para Gestores

**Objetivo:** Protocolo operacional claro, com mecanismos de compliance, para que o gestor distribua o time na matriz 20-70-10 sem subjetividade excessiva e com responsabilização direta por fraudes.

#### Distribuição Obrigatória

| Faixa | % do Time | Critério de Elegibilidade |
|---|---|---|
| **Top 20%** | 20% (arredondado para baixo) | Nota IA ≥ 4,0 + aprovação na Banca de Cases |
| **Mediana** | 70% | Nota IA entre 2,5 e 3,9 |
| **Bottom Flexível** | Até 10% | Nota IA < 2,5 OU ausência de submissão no prazo |

**Regra de arredondamento:** Times de ≤ 5 pessoas: mínimo 1 Top e máximo 1 Bottom. Times de 6–10: mínimo 1 Top e máximo 1 Bottom. Times de ≥ 11: aplicar a proporção exata.

**Vedações absolutas:**
- O gestor **não pode** classificar como Top 20% colaborador com nota IA < 3,5, mesmo que o argumento seja "performance operacional excepcional". O indicador de IA é um indicador autônomo com critério próprio.
- O gestor **não pode** deixar o campo Bottom em branco se houver colaboradores com nota < 2,5 no formulário.

#### Banca de Validação de Cases — Top 20%

Todo colaborador classificado como Top 20% passa por uma banca trimestral presencial (ou remota com gravação obrigatória):

**Composição da banca:**
- Diretor da BU (obrigatório)
- Um IA Champion da área (peer)
- Um representante do RH (observador de compliance)

**Protocolo da apresentação (15 min):**
1. O colaborador demonstra ao vivo a solução (5 min).
2. A banca faz 3 perguntas técnicas sobre a mecânica (5 min).
3. A banca delibera e homologa ou rebaixa para Mediana (5 min).

**A banca tem poder de rebaixamento, não de elevação.** Nenhum colaborador fora do Top 20% pode ser elevado pela banca — a porta de entrada é exclusivamente a nota IA gerada pelo Claude.

#### Compliance e Auditoria Punitiva

O sistema de auditoria opera em dois níveis:

**Nível 1 — Auditoria Automática:**  
O Orbit cruzará automaticamente a classificação do gestor com a nota gerada pelo Claude. Qualquer divergência de mais de 1 nível (ex: gestor classifica como Top, nota Claude = 2,1) gera um **Alerta de Inconsistência** enviado ao Diretor da BU e ao CPTO.

**Nível 2 — Auditoria Manual do CPTO:**  
Amostragem de 20% dos cases Top 20% de cada BU revisada pelo CPTO ou equipe designada. Se um case for invalidado como fraude (colaborador não consegue demonstrar o uso ao vivo):

- **Colaborador:** rebaixado para Bottom, bônus zerado no indicador de IA.
- **Gestor imediato:** advertência formal registrada no sistema de RH + desconto de 10% na sua própria nota de liderança no próximo ciclo.
- **Diretor da BU:** notificação formal com registro em prontuário. Na reincidência (≥ 2 cases invalidados na mesma BU em um ciclo), o Diretor perde o bônus integralmente no indicador de governança de equipe.

**Princípio:** O ônus da validação é do Diretor. Aprovar um case falso é mais custoso politicamente do que não ter ninguém no Top 20%.

---

### 2.3 Matriz de Impacto Financeiro: Notas ➔ Percentual de Bônus

**Premissa:** O indicador de IA representa **10% do bônus anual total**. A nota de 1 a 5 gerada pelo pipeline determina qual percentual desse peso o colaborador efetivamente recebe.

#### Tabela de Conversão

| Faixa da Curva | Nota IA | % do Peso Recebido | Recebimento Real (% do bônus total) |
|---|---|---|---|
| **Top 20%** | 4,0 – 5,0 | **100%** | 10% do bônus total |
| **Mediana** | 2,5 – 3,9 | **100%** | 10% do bônus total |
| **Mediana-Ruim** | 2,0 – 2,4 | **80%** | 8% do bônus total |
| **Bottom** | < 2,0 ou não submeteu | **0%** | 0% do bônus total |

#### Racional da Estrutura

**Por que Top e Mediana recebem 100%:**  
O colaborador que entregou o que se esperava do seu nível de senioridade não deve ser penalizado pela existência de colegas excepcionais. A curva forçada serve para **identificar o topo**, não para **punir a maioria competente**. Um Analista que usa IA de forma consistente e documentada 3x por semana é Mediana — e Mediana é positivo.

**Por que existe a faixa Mediana-Ruim (80%):**  
Colaboradores com nota 2,0–2,4 demonstraram uso incipiente e sem impacto demonstrável. O desconto de 20% é um sinal de alerta sem punição terminal — existe um ciclo para correção de rota antes do Bottom definitivo.

**Por que Bottom = 0%:**  
Ausência de submissão ou nota < 2,0 sinaliza desobediência ao processo ou uso puramente cosmético de IA. O indicador tem peso de 10% no bônus; zerá-lo é uma consequência proporcional e comunicada com antecedência. Não é surpresa — é contrato.

**Simulação de impacto (colaborador com bônus alvo de R$ 20.000):**

| Faixa | Nota IA | Impacto no Bônus |
|---|---|---|
| Top 20% | 4,5 | R$ 2.000 recebidos no indicador de IA |
| Mediana | 3,2 | R$ 2.000 recebidos no indicador de IA |
| Mediana-Ruim | 2,2 | R$ 1.600 recebidos no indicador de IA |
| Bottom | 1,8 | R$ 0 no indicador de IA |

---

## FASE 3: DESDOBRAMENTO PARA DIRETORIA
### Mês 3 — Liderança pelo Exemplo

---

### 3.1 Avaliação Qualitativa de IA para Diretores: A Régua do Exemplo

**Premissa:** O Diretor não é avaliado pela média de IA do seu time. Ele é avaliado pelo seu **nível de aprofundamento prático, testes e capacidade de influência técnica** sobre as estruturas que lidera.

**Rationale:** Um Diretor que nunca testou um agente ou nunca customizou uma Skill não tem legitimidade para validar um case do seu Analista na banca. A avaliação de Diretores corrige essa assimetria e cria accountability no topo da hierarquia.

#### Dimensões de Avaliação (Curva Forçada Exclusiva para Diretores)

A avaliação é conduzida pelo CEO/CPTO em formato de entrevista estruturada semestral (30 min). Não há formulário aberto — é uma conversa técnica com rubrica de scoring.

**Dimensão 1 — Profundidade Técnica Pessoal (40% da nota):**

| Nível | Critério |
|---|---|
| **4** | O Diretor operou ao menos uma solução agêntica ou pipeline com chamadas de API. Consegue explicar a mecânica de um fluxo com ferramentas como n8n, Claude Projects, ou similar. |
| **3** | O Diretor customizou e usa regularmente uma Skill interna ou Co-worker institucional. Consegue descrever o prompt e o output esperado. |
| **2** | O Diretor usa ferramentas de IA como consulta regular, mas sem customização. Não tem solução própria. |
| **1** | Uso incipiente ou inexistente. |

**Dimensão 2 — Disseminação na Estrutura (35% da nota):**

| Nível | Critério |
|---|---|
| **4** | O Diretor implementou ao menos 1 sessão formal de capacitação ou revisão de processo de IA com seu time. Cases do time foram documentados e compartilhados entre BUs. |
| **3** | O Diretor acompanha os cases dos seus colaboradores, participa das bancas de validação e dá feedback técnico (não apenas homologatório). |
| **2** | O Diretor homologa os cases mas não participa ativamente da validação técnica. |
| **1** | O Diretor delegou integralmente o tema para o RH ou IA Champion sem envolvimento. |

**Dimensão 3 — Tomada de Decisão Orientada por IA (25% da nota):**

| Nível | Critério |
|---|---|
| **4** | O Diretor apresentou ao menos 1 decisão estratégica de médio prazo (ex: priorização de produto, alocação de headcount) suportada por análise gerada ou augmentada por IA, com documentação do processo. |
| **3** | O Diretor usa IA regularmente em análises de rotina (ex: sínteses de relatórios, análise de desvio de P&L) com evidência de uso. |
| **2** | Uso pontual em situações de baixo risco/impacto. |
| **1** | Ausência de uso em decisões. |

#### Conversão para Curva Forçada de Diretores

A curva dos Diretores segue o mesmo modelo 20-70-10, avaliada pelo CEO em conjunto com o Conselho (se aplicável) ou pelo CPTO.

| Faixa | Nota Composta | Implicação |
|---|---|---|
| **Top 20%** | ≥ 3,5 | Reconhecimento formal na All-Hands + peso integral no bônus de liderança |
| **Mediana** | 2,5 – 3,4 | Peso integral no bônus de liderança |
| **Bottom** | < 2,5 | Desconto de 15% no bônus de liderança + plano de desenvolvimento obrigatório em 90 dias |

**Efeito cascata:** O Diretor com nota Bottom na avaliação de IA não pode ter nenhum colaborador classificado como Top 20% em sua BU validado automaticamente — todos os cases do seu time passam por auditoria do CPTO.

---

## FASE 4: CRONOGRAMA DE GO-TO-MARKET INTERNO
### Mês 4 — Comunicação, Lançamento e Data Quality

---

### 4.1 Plano de Comunicação e Lançamento

#### Régua de Comunicação Pós-Liberação do Orbit

| Semana | Ação | Responsável | Canal | Audiência |
|---|---|---|---|---|
| **S-2** (pré-lançamento) | Briefing de alinhamento com IA Champions | CPTO + RH | Reunião fechada | IA Champions (≈ 15 pessoas) |
| **S-2** | Treinamento dos IA Champions no formulário Sniper e na mecânica do Claude | CPTO | Workshop 2h | IA Champions |
| **S-1** | Preview para Diretores: demonstração ao vivo do Painel do Jean e da curva forçada | CEO + CPTO | Reunião de diretoria | Diretores |
| **S0 (Lançamento)** | Comunicado institucional via Orbit + e-mail corporativo | RH | Orbit + e-mail | 300 colaboradores |
| **S0** | Publicação do FAQ e do Manual da Curva Forçada no Orbit | RH | Orbit Wiki | Todos |
| **S+1** | Office Hours assíncrono via canal dedicado (Slack/Teams) | IA Champions | Slack | Todos |
| **S+2** | Primeiro checkpoint de preenchimento (% de submissões) | RH | Dashboard Orbit | Gestores |
| **S+4** | Prazo final de submissão do formulário Sniper | RH | Orbit | Todos |
| **S+5** | Início do processamento pelo Claude (batch noturno) | Eng. Dados | Automático | — |
| **S+6** | Gestores recebem nota preliminar para calibração da curva forçada | RH | Orbit | Gestores |
| **S+8** | Prazo de distribuição da curva pelo gestor | RH | Orbit | Gestores |
| **S+10** | Bancas de validação Top 20% (agendamento pelo Orbit) | Diretores + RH | Orbit | Top 20% candidatos |
| **S+12** | Homologação final e travamento das notas | RH + CPTO | Orbit | — |

#### Parâmetros de Cobrança e Alertas Automáticos

- **Cobrança por não-submissão:** 72h antes do prazo, colaboradores sem submissão recebem push notification via Orbit. 24h antes, o gestor é notificado sobre os pendentes do seu time.
- **Cobrança por prazo perdido:** Nota automática = 1,0 (Bottom). Sem exceção, salvo licença médica documentada.
- **Dashboard de acompanhamento:** O RH terá um painel em tempo real com % de submissão por BU, distribuição preliminar de notas e alertas de inconsistência detectados pelo Claude.

---

### 4.2 Entregas de Data Quality: Cronograma e Marcos

#### Entrega 1 — Catálogo OpenMetadata e Linhagem de Dados

**Objetivo:** Garantir que todos os indicadores que alimentam o Orbit tenham origem rastreada no catálogo, com linhagem completa desde a fonte transacional até o campo no formulário de desempenho.

| Marco | Prazo | Entregável | Critério de Aceite |
|---|---|---|---|
| M1.1 | Semana 2 | Inventário de ativos no Snowflake relevantes ao modelo de bônus | Planilha com schema, tabela, coluna, owner e SLA de atualização |
| M1.2 | Semana 4 | Catálogo publicado no OpenMetadata com metadados de negócio | 100% dos ativos do modelo com descrição, owner e tag de classificação |
| M1.3 | Semana 6 | Linhagem de dados ativa (source → staging → gold → Orbit) | DAGs do dbt com lineage graph publicado; zero "orphan nodes" |
| M1.4 | Semana 8 | Alertas de data freshness e qualidade configurados | PagerDuty/Slack ativo para falhas de SLA em ativos críticos |

#### Entrega 2 — Checklist de Padronização de Entregas

**Objetivo:** Estabelecer contrato de qualidade entre a área de Dados e os consumidores (RH, Finanças, Diretores) para cada indicador injetado no Orbit.

**Itens obrigatórios do checklist por indicador:**

- [ ] Definição de negócio documentada (o que mede, o que não mede).
- [ ] Fórmula de cálculo homologada pelo owner de negócio.
- [ ] Granularidade mínima (CPF, BU, Canal, UN, Mês).
- [ ] Frequência de atualização e janela de processamento.
- [ ] Regra de tratamento de nulos e outliers.
- [ ] Responsável técnico (Eng. Dados) e responsável de negócio (owner do KPI).
- [ ] Histórico de retrocompatibilidade: mudanças de fórmula exigem versionamento (`v1`, `v2`) e comunicação com 30 dias de antecedência.

**Prazo:** Checklist completo para todos os indicadores do modelo de bônus publicado até a Semana 6.

#### Entrega 3 — Estudo de Sobreposição de Banco de Dados

**Objetivo:** Mapear e eliminar (ou documentar como intencional) redundâncias de tabelas e métricas no Snowflake que possam gerar inconsistências entre o Orbit e outros sistemas de BI (ex: Power BI, Looker).

**Escopo do estudo:**
- Identificar tabelas com nomes similares e colunas equivalentes em schemas distintos.
- Cruzar com os queries que alimentam o modelo de bônus.
- Classificar cada sobreposição: (a) redundância a eliminar, (b) fonte de verdade a definir, (c) diferença intencional documentada.

| Fase | Prazo | Entregável |
|---|---|---|
| Discovery | Semana 3 | Mapa de sobreposições (≥ 80% das tabelas críticas cobertas) |
| Análise | Semana 5 | Classificação de cada sobreposição (a/b/c) com recomendação |
| Resolução | Semana 9 | Plano de execução aprovado + primeiras depreciações realizadas |
| Documentação | Semana 12 | Registro final no OpenMetadata com decisões e deprecations |

---

## RESUMO EXECUTIVO: CRONOGRAMA CONSOLIDADO

| Mês | Fase | Principais Marcos |
|---|---|---|
| **Mês 1** | Arquitetura Tecnológica | Pipeline Snowflake→Orbit live; Chave CPF ativa; Painel do Jean operacional |
| **Mês 2** | Engenharia de Incentivos | Motor Claude em produção; Manual da Curva publicado; Matriz financeira homologada pelo CEO |
| **Mês 3** | Desdobramento Diretoria | Protocolo de avaliação de Diretores aprovado; primeira rodada de entrevistas agendada |
| **Mês 4** | Go-to-Market | Lançamento para 300 colaboradores; Formulário Sniper aberto; Entregas de Data Quality concluídas |

---

## RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| API Orbit sem suporte a `is_locked` por campo | Média | Alto | Validar capabilities da API na Semana 1; fallback: campo travado por RBAC de role "data_pipeline" |
| Claude com taxa de falso positivo alta em detecção de fraude | Média | Médio | Calibração do prompt com 50 respostas reais anotadas antes de ir para produção; threshold de auditoria manual ajustável |
| Gestores não distribuindo Bottom (leniência) | Alta | Alto | Orbit bloqueia homologação da curva se `sum(bottom%) < threshold_minimo` e notifica CPTO |
| Diretores resistindo à avaliação pessoal de IA | Baixa | Alto | CEO conduz a primeira rodada de entrevistas pessoalmente, sinalizando que o próprio está sujeito à mesma régua |
| Inconsistência entre métricas Orbit vs. Power BI | Alta | Médio | Entrega 3 (Sobreposição de BD) é pre-requisito para lançamento; Semana 9 é hard deadline |

---

*Documento gerado em 22/05/2026. Revisão prevista em 30 dias após lançamento ou mediante alteração de premissas pelo Comitê de Liderança.*
