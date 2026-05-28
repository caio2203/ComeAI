# AthleteTrack

> Controle calórico inteligente para atletas. Registre refeições em linguagem natural (voz ou texto) e o app calcula tudo via IA.

Mobile-first PWA, 100% gratuita, sem backend. Toda a inteligência roda no dispositivo + Gemini Flash (free tier).

---

## Por que existe

Apps de calorias tradicionais exigem buscar cada alimento e digitar gramas. Atletas precisam de algo mais rápido. AthleteTrack aceita:

> *"almocei arroz, feijão, frango grelhado, salada e um copo de suco"*

…e devolve calorias, proteína, carboidrato e gordura calculados, com confirmação rápida.

---

## Stack

| Camada            | Tecnologia                              | Custo  |
| ----------------- | --------------------------------------- | ------ |
| UI                | React 18 + Vite 5                       | Free   |
| Estilo            | Tailwind CSS                            | Free   |
| Motion            | Framer Motion                           | Free   |
| Charts            | Recharts                                | Free   |
| Cache local       | IndexedDB via `idb-keyval`              | Free   |
| Busca fuzzy       | Fuse.js                                 | Free   |
| Voz               | Web Speech API (nativa do browser)      | Free   |
| Parser nutricional | Gemini 1.5 / 2.0 Flash (1500 req/dia) | Free   |
| Base nutricional  | TACO (embarcada) + Open Food Facts API  | Free   |
| Hosting           | PWA — qualquer static host              | Free   |

Sem backend, sem banco, sem servidor. Dados ficam em `localStorage` + IndexedDB.

---

## PWA

- Manifesto standalone, orientação retrato, ícone maskable.
- Service Worker:
  - `cache-first` para a shell estática (boot instantâneo offline).
  - `network-first` com fallback para Gemini e Open Food Facts (dados frescos online, app funciona offline).
  - Navegação cai em `index.html` para o React Router rodar offline.
- Install prompt customizado com cooldown de 14 dias.
- Safe-area para notch e barra de gestos do iOS.

---

## Roadmap (8 etapas)

| #   | Etapa                                                | Status      |
| --- | ---------------------------------------------------- | ----------- |
| 1   | Estrutura PWA base (shell mobile + SW)               | Concluída   |
| 2   | Módulo de IA (parsing + confirmação + salvar)        | Concluída   |
| 3   | Diário do dia + painel de macros                     | Concluída   |
| 4   | Calculadora TMB / TDEE                               | Concluída   |
| 5   | Hidratação                                           | Concluída   |
| 6   | Evolução com gráficos (7 / 30 dias)                  | Concluída   |
| 7   | Perfil + exportação JSON                             | Próxima     |
| 8   | App unificado final                                  | Pendente    |

---

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173 — acesse pelo IP da máquina no celular
npm run build    # build de produção
npm run preview  # serve o dist com host habilitado
```

Para abrir no celular: rode `npm run dev`, descubra o IP da máquina na rede (`ip addr` no Linux, `ipconfig` no Windows) e acesse `http://<seu-ip>:5173`.

---

## Chave Gemini

A chave é configurada **no app**, pela tela de Perfil. É armazenada apenas em `localStorage` — nunca sai do dispositivo.

Crie a chave grátis em [aistudio.google.com](https://aistudio.google.com/app/apikey).

Cota gratuita: 1500 requisições/dia no Gemini 2.0 Flash — o suficiente para uso pessoal intensivo.

---

## Estrutura

```
ComeAI/
├── public/
│   ├── manifest.json     PWA manifest (standalone, pt-BR, shortcuts)
│   ├── icon.svg          ícone vetorial
│   └── sw.js             Service Worker (shell + APIs)
└── src/
    ├── main.jsx          monta React + registra SW
    ├── App.jsx           rotas
    ├── index.css         Tailwind + safe-area
    ├── data/
    │   └── taco-mini.json   subconjunto TACO embarcado
    ├── lib/
    │   ├── settings.js      chave Gemini + perfil em localStorage
    │   ├── db.js            IndexedDB por dia local
    │   ├── format.js        helpers (kcal, g, %, uuid)
    │   ├── units.js         parser pt-BR de quantidades
    │   ├── taco.js          loader TACO + Fuse.js
    │   ├── openfoodfacts.js cliente OFF v2 com cache
    │   ├── gemini.js        cliente Gemini Flash (fetch + JSON schema)
    │   ├── nutritionEngine.js  cascata TACO → OFF → Gemini
    │   ├── hydration.js     persistência de água + meta diária
    │   └── speech.js        wrapper Web Speech API
    ├── components/
    │   ├── Layout.jsx        shell mobile (480px) com transições
    │   ├── TopBar.jsx        header sticky + data + título
    │   ├── BottomTabBar.jsx  4 tabs + slot central para FAB
    │   ├── FAB.jsx           botão flutuante central
    │   ├── QuickLogSheet.jsx bottom sheet com fluxo de IA
    │   ├── InstallPrompt.jsx prompt PWA customizado
    │   ├── PagePlaceholder.jsx
    │   ├── ai/               VoiceButton, ConfidenceBadge, FoodItemCard, ConfirmationView
    │   ├── diary/            DaySelector, MacroRing, MealCard, MealSection, DayDelta
    │   └── hydration/        WaterRing, QuickAdd, CustomAdd, EntryList
    └── pages/            Diary, Hydration, Progress, Profile, Calculator
```

---

## Decisões de arquitetura

- **Sem backend**: dados sensíveis (refeições, peso, chave de API) ficam no dispositivo. Reduz custo a zero e elimina vetor de privacidade.
- **Cascata nutricional**: TACO → Open Food Facts → estimativa Gemini. Sempre tenta a fonte mais confiável e barata primeiro.
- **480px max-width**: app renderiza com formato mobile mesmo no desktop, sem branch de layout extra.
- **Tab bar com 5 colunas e slot central vazio**: padrão consagrado (Strava, MyFitnessPal); FAB se sobrepõe sem cobrir ícones.
- **`ring-4 ring-bg` no FAB**: cria recorte concavo na tab bar sem precisar de SVG mask.
- **Dark mode por padrão**: economia em OLED + reduz fadiga (atletas registram jantar tarde).
- **Swipe-to-delete no Diary**: gesto natural mobile (commit em `−60 px` ou velocidade `< −400 px/s`).
- **IndexedDB bucketado por dia local**: carrega só o dia consultado, evita scan completo.

---

## Licença

Licenciado sob a **[GNU General Public License v3.0](LICENSE)** (GPL-3.0).

Em resumo: você pode usar, estudar, modificar e redistribuir o código,
desde que qualquer trabalho derivado também seja distribuído sob a GPL-3.0
e preserve este aviso de licença.
