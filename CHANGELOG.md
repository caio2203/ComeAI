# Changelog

Todas as mudanças notáveis do AthleteTrack são documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
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
