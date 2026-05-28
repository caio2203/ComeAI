# Changelog

Todas as mudanças notáveis do AthleteTrack são documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
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
