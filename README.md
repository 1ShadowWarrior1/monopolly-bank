# Monopoly Bank (PWA)

Мобильный банк для Monopoly: React, Vite, Tailwind, PWA, Web NFC.

## Локально

```bash
npm install
npm run dev
```

## Сборка под GitHub Pages

В CI задаётся `VITE_BASE=/<имя-репозитория>/`. Локально для проверки:

```bash
set VITE_BASE=/monopolly-bank/
npm run build
npm run preview
```

## Деплой

Push в ветку `main` запускает GitHub Actions (`.github/workflows/deploy.yml`). В настройках репозитория: **Settings → Pages → Source: GitHub Actions**.

Сайт: `https://1shadowwarrior1.github.io/monopolly-bank/`
