# Roadmap da plataforma Labs — v4

Atualizado em 2026-07-30.

## Escopo e governança

- Pasta local de trabalho: `C:\Users\Christian\Desktop\Codex\v4`
- Repositório: `cloretti55-hue/analysis_dashboard_v3`
- Domínio: `labs.generalchannels.co`
- Branch inicial: `labs-platform-foundation`
- Fora do escopo: `analysis_dashboard_v2` e `platform.generalchannels.co`
- A pasta local `v3` permanece congelada.

## Princípios

- Evolução incremental, sem reconstrução total.
- JavaScript e React continuam sendo usados nesta etapa.
- Python continua responsável pelos pipelines.
- Nenhum dado ausente será inventado ou preenchido silenciosamente.
- Fallbacks metodologicamente válidos devem registrar origem, data e estado `stale`.
- Falhas de publicação não devem ser mascaradas por fallback do navegador para GitHub Raw.
- Mudanças serão validadas localmente antes de commit, push ou deploy.

## Fase 0 — Baseline Git e inventário

Status: concluída localmente.

Entregas:

- `v4` vinculada a `analysis_dashboard_v3`;
- branch `labs-platform-foundation`;
- JSONs locais alinhados à `origin/main`;
- `.gitignore` para caches, instaladores e artefatos temporários;
- assets extras preservados fora do commit até decisão editorial.

Critério de passagem:

- nenhuma divergência não intencional em arquivos rastreados.

## Fase 1 — Contratos, completude e manifesto

Status: concluída e validada no GitHub Actions.

Primeira evidência:

- os 11 instrumentos de renda fixa estavam com `status: error` no
  `etf-performance.json` por timeout;
- os 11 estavam disponíveis no `fixed-income-performance.json`, com datas de
  22–23/07/2026;
- o fallback era necessário, mas não tinha produtor ou workflow próprio.

Primeira correção:

- processar renda fixa antes dos demais instrumentos;
- usar dados anteriores válidos como fallback marcado `stale`;
- usar o snapshot de renda fixa para semear instrumentos ainda sem histórico
  válido no payload principal;
- só substituir o snapshot de renda fixa quando a cobertura estiver completa e
  houver ao menos um instrumento atualizado ao vivo;
- versionar o payload principal e o snapshot de renda fixa no mesmo workflow.

Entregas implementadas:

- validador comum de schemas, cobertura, chaves e datas;
- `data/manifest.json` determinístico;
- status padronizados: `ok`, `stale`, `partial`, `error` e `manual`;
- freshness por dataset e por componente;
- validação antes de qualquer commit automático.

Validação contínua:

- todos os workflows de atualização regeneram e versionam o manifesto;
- mudanças em dados, scripts ou workflows executam `validate-data.yml`;
- cada workflow só é bloqueado por erro estrutural no dataset que ele próprio
  produz;
- erros em datasets não relacionados permanecem visíveis no manifesto sem
  interromper outras atualizações;
- estados `stale` e `partial` ficam visíveis sem bloquear atualizações válidas;
- o manifesto só muda quando os dados mudam ou quando um dataset cruza o
  limite de freshness.

Critério de passagem:

- todo dataset consumido tem produtor, contrato, data, origem e política de
  fallback explícitos.

## Fase 2 — Cliente de dados e Data Lab observável

Status: concluída e validada no GitHub Actions em 2026-08-04.

Entregas:

- função única de carregamento e validação de datasets;
- remoção de fallbacks de runtime para GitHub Raw;
- fonte, data, benchmark, metodologia e estado do dado apresentados em linguagem pública adequada;
- diagnóstico técnico preservado no GitHub Actions, sem expor mensagens internas aos visitantes.

Implementação:

- `DataClient` concentra todos os carregamentos JSON e consulta
  `data/manifest.json` para obter status, data, produtor e avisos;
- os módulos recebem resultados isolados com `data`, `meta` e `error`;
- nenhuma URL de runtime aponta para GitHub Raw;
- o Data Lab identifica internamente a base principal e a contingência de renda fixa;
- instrumentos carregados pela contingência preservam origem, data e estado
  `stale` ou `partial`;
- Valuation, curvas, Fed e geografia mantêm os módulos disponíveis sem publicar
  mensagens técnicas brutas;
- um resumo operacional em português é produzido em todos os workflows;
- a composição geográfica é consultada mensalmente nas fontes oficiais da
  Vanguard, iShares e SPDR e preserva o último dado válido quando uma fonte falha;
- testes automatizados impedem a reintrodução de carregamentos dispersos ou
  dependências do GitHub Raw.

Critério de passagem:

- a interface informa origem e data de forma apropriada ao visitante, enquanto
  os detalhes de falha e contingência ficam disponíveis ao operador no Actions.

## Fase 3 — Modularização do `index.html`

Status: concluída em 2026-08-20.

Primeira entrega:

- estilos globais extraídos para `assets/css/app.css`;
- aplicação React extraída para `assets/js/app.js`;
- `index.html` passou a carregar os arquivos locais sem alterar a interface ou
  o comportamento.

Segunda entrega:

- contratos dos nove datasets extraídos para `assets/js/core/data-client.js`;
- carregamento, manifesto, status e validação de estrutura centralizados no
  arquivo de dados;
- `index.html` carrega o cliente de dados antes da aplicação React.

Terceira entrega:

- navegação, seletor de tema, Home, avisos educacionais e estados públicos dos
  dados extraídos para `assets/js/components/common.js`;
- cabeçalho desktop e controles de tema reutilizados entre Home, desktop e
  celular;
- `index.html` carrega os componentes compartilhados antes da aplicação React.

Quarta entrega:

- módulo de Curvas e Fed extraído para `assets/js/modules/curves-fed.js`;
- carregamento de `curve-us` e `fed-policy`, cálculos, gráficos e telas desktop e
  celular reunidos no módulo;
- `app.js` passou a coordenar o módulo por meio do namespace explícito
  `window.GCCurvesFed`;
- o quadro público de probabilidades do Fed permanece oculto até a adoção de
  uma fonte específica para cada reunião.

Quinta entrega:

- módulo de Valuation extraído para `assets/js/modules/valuation.js`;
- carregamento de valuation amplo, S&P 500, histórico de P/L e Magnificent 7,
  normalização, fallbacks e telas reunidos no módulo;
- `app.js` passou a coordenar Valuation por meio do namespace explícito
  `window.GCValuation`;
- fontes, datas, metodologia e nota sobre divergências de Forward P/E foram
  preservadas na interface.

Sexta entrega:

- área de ETFs extraída para `assets/js/modules/etfs.js`;
- as sete áreas — Fixed Income, Core Equities, Setoriais, Satélites EUA, Temas
  Europeus, China / China+1 e Hedge — e suas interações foram reunidas no módulo;
- o carregamento da composição geográfica passou a ser responsabilidade do
  módulo de ETFs;
- `app.js` passou a coordenar a área por meio do namespace explícito
  `window.GCEtfs`, sem alteração de visual ou conteúdo.

Sétima entrega:

- Data Lab extraído para `assets/js/modules/data-lab.js`;
- filtros, agrupamentos, métricas, gráfico histórico e seleção de instrumentos
  foram reunidos no módulo;
- carregamento da base principal e contingência de renda fixa, proveniência,
  datas e estados dos dados foram preservados;
- `app.js` passou a coordenar o Data Lab por meio do namespace explícito
  `window.GCDataLab`, sem alteração de visual, cálculos ou conteúdo.

Oitava entrega:

- área de Temas extraída para `assets/js/modules/themes.js`;
- biblioteca de páginas temáticas, matrizes de ciclos, galerias, imagens e
  conteúdo educacional foram reunidos no módulo;
- abertura de imagens, bloqueio da rolagem da página, histórico e zoom de 50% a
  250% foram preservados;
- `app.js` passou a coordenar Temas por meio do namespace explícito
  `window.GCThemes`, sem alteração de visual ou conteúdo.

Nona entrega:

- estilos divididos em camadas explícitas de base, estrutura, componentes,
  celular, responsividade e áreas analíticas;
- Curvas/Fed, Valuation, ETFs, Data Lab e Temas passaram a ter arquivos CSS
  identificáveis e independentes;
- `assets/css/app.css` passou a coordenar a ordem de carregamento dos estilos;
- a concatenação dos novos arquivos foi validada como idêntica ao CSS anterior,
  preservando regras, cascata, visual e comportamento responsivo.

Entregas:

- separar cliente de dados;
- separar módulos de Yield Curves, Valuation, ETFs, Data Lab e Temas;
- separar estilos globais e estilos por módulo;
- manter comportamento, visual e URLs durante a extração.

Tecnologia:

- JavaScript e React permanecem;
- TypeScript ou Vite só serão avaliados depois da separação e dos testes.

Critério de passagem:

- o `index.html` deixa de concentrar lógica, conteúdo, dados e estilos sem uma
  migração disruptiva.

## Fase 4 — Consolidação, testes e estabilidade

Status: concluída em 2026-08-20.

Nota de escopo:

- a proposta anterior de Fase 4, dedicada a navegação e linguagem, foi
  abortada e integralmente revertida;
- esta fase não alterou visual, textos públicos, dados ou cálculos.

Entregas:

- o workflow de validação de dados passou a ser acionado também por mudanças
  em `index.html`, `assets/`, `tests/` e `vercel.json`;
- 54 testes automatizados de dados, contratos, fallbacks, carregadores,
  módulos e estrutura foram executados com sucesso;
- `scripts/validate-interface.py` passou a verificar a interface em navegador
  real nas larguras de computador e celular;
- Home, Curvas, Valuation, ETFs, Data Lab e Temas passaram a ter navegação
  verificada automaticamente;
- seletor de tema, ausência de rolagem horizontal indevida e erros de execução
  no navegador passaram a fazer parte da validação;
- `.github/workflows/validate-interface.yml` passou a executar a verificação de
  interface automaticamente quando o frontend ou o próprio teste muda;
- as verificações permanecem restritas ao projeto Labs e não modificam
  `analysis_dashboard_v2` ou `platform.generalchannels.co`.

Critério de passagem:

- testes estruturais sem falhas;
- cinco áreas acessíveis em computador e celular;
- temas claro e escuro funcionais;
- nenhuma rolagem horizontal indevida ou erro de execução detectado.
