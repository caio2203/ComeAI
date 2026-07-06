# Changelog

Todas as mudanças notáveis do ComeAI são documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Changed
- **Renomeado para ComeAI**: o app, o manifesto PWA, o título, o Service Worker,
  os namespaces de armazenamento (`comeai:*`, stores IndexedDB) e o User-Agent do
  Open Food Facts passaram de `AthleteTrack` para `ComeAI`. Dados locais e backups
  criados sob o nome antigo não são lidos pela versão nova (recomeço limpo,
  aceitável em pré-distribuição).

### Fixed
- **Altura em telas modernas (Samsung / iPhone)**: shell passou a usar `100dvh`
  (viewport dinâmico) em vez de `100%`, para a barra de abas não ficar escondida
  atrás da barra de endereço retrátil do navegador.
- **Área segura inferior**: o padding de rodapé do conteúdo agora inclui
  `env(safe-area-inset-bottom)`, garantindo que o último item da lista não fique
  sob a barra de abas em iPhones com indicador de home.
- **Zoom / acessibilidade**: removido `user-scalable=no` do viewport (pinça de
  zoom voltou a funcionar). Para o iOS não dar zoom automático ao focar um
  campo, todos os controles de texto foram fixados em 16px via CSS.

### Added
- **Guia de distribuição como APK** no README (PWABuilder / Bubblewrap) para
  compartilhar com amigos e família sem passar por loja de apps.
- **App unificado final (etapa 8)**: revisão geral de navegação e fechamento
  de pontas soltas para deixar o app pronto para uso.
  - Ícones PWA `icon-192.png` e `icon-512.png` gerados a partir do `icon.svg`
    (o manifesto os referenciava mas os arquivos nao existiam — a instalacao
    como app nao tinha icone). Adicionados tambem ao precache do Service Worker.
  - Atalho "Registrar refeicao" do manifesto (`/?action=quick-log`) agora abre
    de fato o registro por IA: o `Layout` le o parametro, abre o QuickLogSheet
    e limpa a URL.
  - Avatar do `TopBar` mostra a inicial do nome do perfil e virou atalho para a
    tela de Perfil.
  - Botoes "Salvar dados" e "Salvar meta" do Perfil agora tem confirmacao
    independente (antes compartilhavam o mesmo estado e piscavam juntos).
- **Perfil + exportação JSON (etapa 7)**: tela de Perfil completa.
  - Formulário de dados pessoais editável (nome, sexo, peso, altura, idade,
    nível de atividade, objetivo) gravando direto no `profile` — o MacroRing
    do diário e a meta de hidratação passam a usar esses valores.
  - Override manual da meta diária de água (em branco volta ao automático de
    35 ml/kg).
  - Resumo read-only das metas atuais (kcal / P / C / G) com atalho para a
    Calculadora recalcular.
  - Backup completo em `src/lib/backup.js`: exporta refeições, hidratação,
    perfil e modelo em um único JSON e restaura de arquivo (merge — nunca
    apaga dias que só existem no dispositivo). A chave Gemini é
    deliberadamente excluída do arquivo (regra: chave só em `localStorage`).
  - Importação valida a etiqueta do app antes de gravar para um JSON qualquer
    não sobrescrever os dados.
  - "Apagar tudo" com confirmação em dois toques, limpando IndexedDB
    (refeições + água) e todas as configurações.
  - `importAll` / `clearAll` adicionados a `db.js` e `hydration.js`;
    `exportAll` de hidratação espelhando o de refeições.
  - Primitivos de formulário (`Section`, `ChipRow`, `ToggleButton`,
    `NumberField`) extraídos para `src/components/forms/Fields.jsx` e
    reaproveitados por Calculadora e Perfil, eliminando a duplicação.
- **Evolução com gráficos (etapa 6)**: página de Progresso lê os buckets
  históricos do IndexedDB (uma leitura por dia da janela) e monta a evolução
  de 7 ou 30 dias.
  - Chips 7 dias / 30 dias com o mesmo padrão visual da Calculadora.
  - Gráfico de calorias (linha) e gráfico de hidratação (barras) via Recharts
    `ResponsiveContainer`, cada um com `ReferenceLine` tracejada na meta diária.
  - Tooltip estilizado com a shell do app (fundo `bg-elev`, borda `white/10`,
    separador de milhar pt-BR) e `animationDuration` de 600 ms.
  - Macros médios do período (mini barras P/C/G) calculados sobre os dias com
    refeições registradas, com as metas do perfil como referência.
  - Card "Aderência": percentual dos dias rastreados dentro de ±10% da meta de
    calorias E com pelo menos 80% da meta de água. Dias sem registro ficam fora
    do denominador para não contarem como falha.
  - Estado vazio com card pontilhado ("Registre refeições e água para ver sua
    evolução") quando ainda não há dados na janela.
  - `Progress` carregada via `React.lazy` + `Suspense`: o Recharts fica num
    chunk separado (~107 KB gz) baixado só ao abrir a Evolução, mantendo o
    bundle inicial do diário em ~118 KB gz.
- **Hidratação (etapa 5)**: registro de água com persistência em IndexedDB
  bucketada por dia local (`hydration:day:YYYY-MM-DD`), mesma estratégia do
  diário de refeições.
  - `WaterRing` SVG animado com gradiente azul (mesma técnica do `MacroRing`
    para manter linguagem visual unificada).
  - Botões rápidos de 150 / 250 / 500 ml (copo, copo grande, garrafa) com
    ícone de gota dimensionado pela quantidade.
  - Campo personalizado com stepper ±50 ml e validação 1-2000 ml.
  - Lista de registros com swipe-to-delete (mesmo gesto e mesmo threshold do
    `MealCard`).
  - Reuso de `DaySelector` para navegar entre dias e bloqueio de dias futuros.
  - Meta diária calculada como 35 ml × peso (FAO/EFSA), arredondada para o
    múltiplo de 50 ml mais próximo e limitada a [1500, 4500] ml. Override
    via `profile.waterTargetMl` quando o usuário definir manualmente.
  - Token `water` (`#60A5FA`) e `water-deep` (`#2563EB`) adicionados ao
    Tailwind ao lado de `protein` / `carb` / `fat`.
- **Calculadora TMB / TDEE (etapa 4)**: três fórmulas (Mifflin-St Jeor,
  Harris-Benedict revisada, Katch-McArdle), cinco níveis de atividade
  (PAL FAO/WHO) e três objetivos (cutting −500 / manutenção / bulk +300).
  - Distribuição de macros padrão por objetivo (proteína 2.2 g/kg em
    cutting, 1.8 g/kg em manutenção/bulk; gordura 25% das calorias;
    carbo no restante).
  - Preview ao vivo de TMB, TDEE, meta diária e gramas de cada macro
    enquanto o usuário altera qualquer campo.
  - Botão "Aplicar no perfil" grava as metas em `profile` e leva o
    usuário direto ao Diário — o MacroRing passa a usar as metas
    personalizadas automaticamente.
- **Diário completo (etapa 3)**: substitui a versão mínima da etapa 2.
  - `DaySelector` para navegar entre dias (com bloqueio de dias futuros e
    atalho "Voltar para hoje").
  - `MacroRing`: anel SVG animado para calorias com barras de P/C/G ao lado.
  - `DayDelta` comparativo com o dia anterior (estilo neutro — variação
    pode ser boa ou ruim dependendo do objetivo).
  - `MealSection` agrupa refeições por tipo na ordem canônica
    (Café → Pré → Almoço → Pós → Jantar → Lanche) com soma de kcal por seção.
  - `MealCard` com **swipe-to-delete** via Framer Motion drag (commit em
    `−60 px` ou velocidade `< −400 px/s`).
  - Helper `shiftISO(iso, delta)` em `db.js` para navegação por dia sem
    drift em DST.

- **Módulo de IA (etapa 2)**: pipeline completo de registro de refeição em
  linguagem natural.
  - Entrada por texto **ou** voz (Web Speech API pt-BR, com fallback gracioso
    em browsers sem suporte).
  - Parser NLP via Gemini Flash com `response_schema` JSON estruturado
    (chave configurada pelo usuário em Perfil, armazenada apenas em
    `localStorage`).
  - Cascata nutricional **TACO → Open Food Facts → Gemini**: tenta a fonte
    mais barata/confiável primeiro, só chama a próxima se a confiança for
    baixa. Reduz consumo da cota Gemini.
  - Tabela TACO mini embarcada (~65 alimentos brasileiros comuns) com busca
    fuzzy via Fuse.js. Funciona 100% offline.
  - Open Food Facts client com cache de 30 dias em IndexedDB.
  - Parser de quantidades pt-BR ("2 colheres de sopa", "uma concha",
    "200g", "meio mamão") como rede de segurança quando o Gemini falha ou
    a chave não está configurada.
  - Tela de confirmação com cards editáveis: ajustar gramas via slider
    (macros rescalam ao vivo), remover itens, escolher tipo de refeição.
  - Persistência em IndexedDB via `idb-keyval`, bucketada por dia local
    (`YYYY-MM-DD`) para carregar só o dia consultado.
- **Diary (versão mínima)**: lista refeições do dia + painel de macros com
  metas (padrão 2500 kcal / 180 P / 280 C / 75 G até a etapa 4 entregar
  TDEE personalizado).
- **Profile (versão mínima)**: campo para chave Gemini + seleção de modelo
  (2.0 Flash / 1.5 Flash).
- Bootstrap do projeto Vite + React 18 + Tailwind.
- Assets PWA: `manifest.json` (standalone, pt-BR, com shortcuts para refeição
  e água), ícone SVG inline e `sw.js` com estratégia dupla de cache
  (cache-first para shell, network-first para Gemini e Open Food Facts).
- Shell mobile: container centralizado 480px, `TopBar` sticky, `BottomTabBar`
  com slot central reservado, `FAB` flutuante sobreposto à tab bar.
- Mapa de rotas para as cinco destinações top-level (Diário, Hidratação,
  Evolução, Perfil, Calculadora) com páginas placeholder.
- `QuickLogSheet`: bottom sheet com drag-to-dismiss (host para o fluxo de IA
  da etapa 2).
- `InstallPrompt` com cooldown de 14 dias para o dismiss.
- Suporte a safe-area do iOS via `env(safe-area-inset-*)`.
- Transições entre rotas via Framer Motion `AnimatePresence` chaveadas por
  `pathname`.
- Documentação inicial: `README.md`, `CHANGELOG.md`.

### Changed
- Removidos emojis do README; status do roadmap agora em texto
  (Concluída / Próxima / Pendente).
- Seção de licença do README alinhada à GPL-3.0 do `LICENSE`.
