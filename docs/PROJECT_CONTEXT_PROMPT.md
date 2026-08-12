# Prompt mestre de continuidade — AI Vocabulary Platform

> Atualizado em 12 de agosto de 2026. Use este documento para transferir o contexto do projeto a uma
> nova sessão de desenvolvimento. Antes de agir, confirme o estado real do Git e do ambiente; este
> arquivo descreve a direção e o estado conhecido, mas o código continua sendo a fonte operacional
> de verdade.

## Prompt para copiar e usar

Quero que você continue, corrija e evolua o projeto existente AI Vocabulary Platform. Não recomece
do zero, não crie um projeto paralelo e não entregue apenas sugestões. Inspecione o código atual,
preserve alterações existentes, implemente uma etapa pequena e verificável, rode testes
proporcionais ao risco e faça commits Conventional Commits em checkpoints coerentes. Não faça push
sem autorização.

### Repositório e ambiente local

- Repositório local: C:\Users\lulu-\Downloads\ai-vocabulary-platform
- GitHub: github.com/GabrielModa/ai-vocabulary-platform
- Branch principal usada atualmente: main
- Monorepo: pnpm + Turbo
- Node.js exigido: 22 ou superior
- pnpm exigido: 11 ou superior
- Web: Next.js em apps/web
- API modular: apps/api e rotas server-side da web
- Domínio lexical e exercícios: packages/vocabulary
- Integrações locais de IA: packages/ai
- Worker de imagens: services/image-worker
- Ollama local: qwen2.5:3b; o usuário também baixou/avaliou qwen2.5vl:3b
- Python do worker: 3.12.10, venv em services/image-worker/.venv
- Modelo OpenVINO local: services/image-worker/models/lcm-dreamshaper-int8
- Hardware conhecido: Intel Iris Xe; OpenVINO detecta CPU e GPU
- Aplicação local: http://localhost:3000
- Worker de imagem: http://127.0.0.1:8765

Nunca mova, apague ou versione venvs, modelos, caches, imagens temporárias, quarentena, logs,
arquivos .env ou segredos. Confirme o .gitignore ao tocar nessas áreas.

### Visão do produto

Construir uma plataforma premium de vocabulário em inglês A2–C2 que transforme temas, interesses,
palavras e futuramente fotografias em aprendizagem durável. O diferencial não é pedir que uma IA
invente fatos lexicais; é combinar fontes confiáveis, personalização e um motor pedagógico
adaptativo.

O produto deve priorizar, nesta ordem:

1. eficácia real de aprendizagem;
2. fatos lexicais corretos e rastreáveis;
3. fluxo rápido e confiável;
4. UX acessível e clara;
5. personalização por contexto, nível e domínio;
6. imagens e polimento visual;
7. gamificação, sem confundir XP com domínio.

Princípios pedagógicos: recuperação ativa, efeito de teste, repetição espaçada, codificação dupla,
variação de contexto, feedback imediato, dificuldade progressiva, intercalação, prática prioritária
de erros e exemplos adequados ao CEFR.

### Decisão arquitetural central

A arquitetura é híbrida. A IA é um gerador e seletor criativo, nunca a autoridade final.

- Palavra, sentido, classe e definição: evidência lexical confiável.
- Pronúncia: CMUdict ou outra fonte verificável; áudio do navegador como apresentação, sem IPA
  inventado.
- CEFR: frequência, listas curadas e regras determinísticas; o prompt do LLM não certifica nível.
- Exemplos: corpus licenciado quando disponível; geração local provisória como fallback validado.
- Tema e personalização: IA local + validação.
- Exercícios e distratores: composição determinística sobre conteúdo verificado; IA apenas como
  fallback estrito.
- Imagens: opcionais no MVP atual; biblioteca licenciada e geração local futura.
- Histórico, domínio e repetição espaçada: motor próprio versionado.

Todo conteúdo deve poder guardar provider, sourceId, sourceUrl, license, attribution, retrievedAt,
generated, adaptedFrom e validationStatus. Dado desconhecido permanece ausente; nunca completar
silenciosamente com invenção.

### Fluxo funcional atual

Tema, nível e quantidade → candidatos confiáveis por tema quando disponíveis → Ollama gera somente o
déficit → normalização e deduplicação → lookup lexical local no Open English WordNet → evidência de
frequência local SUBTLEX → ranking temático e compatibilidade CEFR → reposição apenas do déficit até
limite de tentativas → resolução contextual do sentido lexical → exemplos verificados do provider
quando existentes → exemplo local provisório para lacunas → validação individual e retry somente dos
exemplos inválidos → revisão Study ou Test → confirmação de palavras e sentidos → composição
determinística de cloze ou definition-choice → persistência de draft e snapshot imutável da sessão →
exercício público sem resposta exposta → avaliação server-side contra a resposta persistida →
feedback imediato e contraste verificado → registro local versionado de tentativa → atualização de
domínio → planejamento adaptativo e repetição espaçada → relatório, histórico e prática das erradas.

### O que já existe de verdade

- Geração local de candidatos com JSON estruturado e limites.
- Caminho trusted-first para temas cobertos, reduzindo dependência e latência do Ollama.
- Geração em déficit: itens bons não são refeitos quando faltam candidatos.
- Contagem exata quando possível e resultado parcial honesto quando não for.
- Open English WordNet local para sentidos, definições e relações.
- Resolução contextual de sentidos usando tema e contexto do aprendiz.
- Frequência local SUBTLEX e ranking determinístico.
- Quality gate lexical com decisões aceitar, revisar ou rejeitar.
- CMU Pronouncing Dictionary integrado para pronúncia verificável.
- Apresentação corrigida de pronúncia; não mostrar mojibake nem fonética inventada.
- Exemplos verificados preservados e exemplos Ollama marcados como provisórios.
- Retry de exemplos somente para candidatos ausentes ou inválidos, com limite.
- Cloze determinístico baseado em exemplo e sentido.
- Definition-choice determinístico como fallback.
- Distratores selecionados e filtrados por evidência; não há alegação de unicidade semântica
  absoluta.
- Revisão Study/Test; Test oculta significado antes da tentativa.
- Sessões persistidas com snapshot imutável e propriedade do aprendiz.
- Respostas avaliadas no servidor sem expor o gabarito na projeção pública.
- Áudio por Web Speech API, interrupção de reprodução anterior e proteção do clique do speaker.
- Feedback imediato, navegação, relatório, repetir erradas e repetir todas.
- Histórico local versionado, progresso visível, domínio e agendamento espaçado.
- Progressão adaptativa incluindo reconhecimento e typed recall.
- Launcher local Windows e modo sem imagens.
- Pipeline opcional de imagens OpenVINO com fila, cache, segurança, quarentena e fallback; imagens
  estão deliberadamente fora do caminho crítico do MVP atual.
- Benchmarks locais de geração e cobertura temática.
- Gate congelado do MVP revisado: pnpm mvp:verify.

### Estado conhecido em 12 de agosto de 2026

- Último commit antes da etapa atual: 512cd63 feat(ai): retry only missing study examples.
- A branch main estava 10 commits à frente de origin/main.
- Task 136 foi concluída e commitada.
- Task 137 está implementada localmente: quality screen determinístico para exemplos gerados.
- Task 138 está implementada localmente: diagnóstico de prontidão do conjunto para aprendizagem.
- Task 139 torna falhas finais de publicação acionáveis e identifica palavras omitidas.
- O release gate do MVP sem imagens passou em 12 de agosto de 2026.
- O MVP sem imagens está funcionalmente avançado; imagens não devem bloquear testes do fluxo
  principal.
- A estimativa útil é aproximadamente 90% do MVP sem imagens e 65–70% da visão completa. Percentuais
  são aproximações de produto, não métricas de engenharia.

### Macroetapa atual — Tasks 137 e 138

Objetivo: impedir que exemplos formalmente válidos, mas pedagogicamente fracos, entrem no estudo.

Implementar e verificar:

- avaliação pura por item;
- tamanho máximo por nível: A2 mais curto, depois B1, B2, C1 e C2;
- mínimo de contexto fora da palavra-alvo;
- exatamente uma ocorrência natural do termo;
- pontuação terminal;
- rejeição de gaps, URLs, controles e meta-definições;
- score e reasonCodes mensuráveis;
- integração com o retry de déficit existente;
- sem alegar certificação CEFR oficial ou prova de naturalidade.

Task 138 separa qualidade lexical de prontidão real para treinamento. O relatório pós-enriquecimento
mede cobertura de sentidos verificados, exemplos contextuais, exemplos provisórios, cloze,
definition-choice, quantidade solicitada e mínimo de quatro questões. A revisão mostra `ready`,
`partial` ou `blocked` com recomendações honestas.

### Próximas macroetapas recomendadas

1. Fechar Task 137 com testes e benchmark real de football/travel/work/kitchen em A2, B1 e C1.
2. Criar métrica de qualidade de conjunto: cobertura lexical, cobertura de exemplos, adequação de
   nível, ambiguidade detectável, taxa de retry, latência e resultado parcial.
3. Integrar uma fonte licenciada de exemplos por etapas, preservando ID, autoria, licença, origem e
   texto original; geração local continua fallback.
4. Expandir pools confiáveis para temas comuns e medir cobertura antes de adicionar centenas de
   palavras.
5. Criar suíte pedagógica de regressão com casos aprovados e rejeitados por nível, classe e sentido.
6. Melhorar UX de falhas parciais: dizer exatamente quantas palavras/exemplos foram obtidos e
   permitir começar com o conjunto utilizável.
7. Fazer teste E2E real do MVP sem imagens: gerar, revisar Test, iniciar, responder, navegar,
   finalizar, praticar erradas, reabrir histórico.
8. Só depois recolocar imagens no caminho de evolução: qualidade semântica da pista, desenho
   autoexplicativo, preferência por ilustração pedagógica, prefetch e fallback.
9. Futuro: entrada por foto com confirmação humana, importadores lexicais adicionais, backend/cloud
   e autenticação de produção. Não antecipar infraestrutura paga no MVP local.

### Critérios de produto por CEFR

- A2: palavras frequentes, frases curtas e concretas, sintaxe simples, pista clara, alternativas
  distintas.
- B1: vocabulário cotidiano intermediário, collocations comuns, contexto familiar e alternativas
  plausíveis sem ambiguidade.
- B2: maior precisão, phrasal verbs/collocations relevantes, contexto parcialmente abstrato,
  alternativas mais próximas.
- C1: nuance, registro, linguagem profissional ou acadêmica pertinente e distinções finas.
- C2: precisão estilística e contextual, sofisticação natural, sem obscuridade artificial.

Essas regras devem virar métricas e testes. Não confiar apenas no texto do prompt enviado ao modelo.

### Regras de exercícios

- Uma questão deve ter uma única resposta publicável.
- A frase deve conter um gap real e apenas um.
- A resposta e distratores não podem duplicar ou conter uns aos outros de forma trivial.
- Preferir mesma classe gramatical quando a estratégia exigir.
- Speaker não seleciona alternativa.
- O áudio da frase não diz blank, underscore ou caracteres do gap; usa pausa natural.
- Navegação preserva respostas.
- Erro não reinicia a sessão.
- Feedback mostra resposta correta, explicação curta e áudio, sem linguagem de derrota.
- Respostas públicas nunca revelam o gabarito antes da avaliação.

### Segurança e privacidade

Trate input do usuário, output de IA, fotos e conteúdo de providers como não confiáveis. Use schemas
Zod, parsing controlado, limites, moderação, normalização e retries limitados. Não fazer scraping de
páginas. Antes de integrar uma fonte, verificar documentação e licença atuais. Não registrar
conteúdo sensível em telemetria.

Para imagens: prompt controlado no servidor, moderação antes e depois, safety checker real,
quarentena, servir somente aprovadas, IDs opacos, bloqueio de path traversal e nenhum caminho local
exposto. A imagem não pode escrever ou revelar a resposta.

### Organização do código

- apps/web: interface Next.js, rotas do fluxo local e composição runtime.
- apps/api: aplicação/API modular compartilhada.
- packages/vocabulary: regras de domínio lexical, ranking, quality gates, composição e validação de
  exercícios.
- packages/ai: adapters locais Ollama, schemas, timeouts, exemplos e prompts seguros.
- packages/auth, database, api-contract, observability, ui e config: capacidades transversais.
- services/image-worker: serviço Python/OpenVINO isolado para geração segura de imagens.
- tasks: checkpoints pequenos e verificáveis.
- docs/adr e docs/decisions: decisões arquiteturais; atualizar junto com mudanças de contrato.

Não colocar regra de negócio em componentes React, controllers ou adapters de provider. O domínio
depende de portas e contratos, não de SDKs.

### Forma de trabalho esperada

1. Ler estado do Git e arquivos relevantes antes de editar.
2. Preservar mudanças existentes do usuário.
3. Definir uma tarefa pequena e seus arquivos.
4. Escrever/ajustar testes antes da implementação quando viável.
5. Implementar a causa real, sem mocks como prova final.
6. Rodar testes direcionados e depois gates proporcionais.
7. Informar macro atual, percentual aproximado, arquivos, testes, riscos e próximo passo.
8. Criar commit pequeno e convencional quando o checkpoint estiver verde.
9. Não fazer push automaticamente.
10. Não usar git reset --hard nem apagar artefatos locais.

### Comandos principais

```powershell
cd C:Userslulu-Downloadsai-vocabulary-platform
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm mvp:verify
```

Para testar sem imagens:

```powershell
pnpm dev:local:no-images
```

Para testar com o runtime completo, quando o worker estiver pronto:

```powershell
pnpm dev:local
```

Antes de commit, verificar:

```powershell
git status --short --branch
git diff --check
git diff --stat
```

### Problemas ambientais conhecidos

- O PowerShell do usuário já apresentou erro preexistente no profile com Test-Path e -and; não
  confundir com falha do projeto.
- Em algumas sessões sandboxadas, Vitest/esbuild não consegue ler vitest.config.ts e retorna Access
  is denied. Registrar como bloqueio ambiental e não declarar testes aprovados.
- O pnpm/Turbo já tentou consultar registry.npmjs.org durante tarefa local; em rede bloqueada isso
  pode interromper typecheck apesar do tsc direto passar.
- O build Next.js pode alterar apps/web/next-env.d.ts para uma rota de tipos de build; revisar antes
  de versionar.
- A geração Ollama local pode ser lenta em hardware integrado; trusted-first, cache, keep_alive,
  pequenos lotes e retry apenas do déficit são decisões intencionais.

### Definição da meta final

O produto final deve receber tema, palavras ou fotografia; selecionar candidatos relevantes;
verificar fatos lexicais; calibrar nível; criar exercícios e contextos validados; enriquecer com
áudio e imagem opcional; registrar tentativas; atualizar domínio; e agendar revisões. O aprendiz
deve conseguir usar o MVP sem imagens com rapidez, confiança e continuidade, enquanto imagens e
visão entram depois como enriquecimento, nunca como bloqueio.

Ao continuar, não volte às imagens antes de fechar a qualidade dos exercícios e exemplos, salvo
pedido explícito do usuário. Comece sempre pelo estado real do repositório e pela próxima tarefa
incompleta.
