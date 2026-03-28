# Monopoly Bank (PWA)

Мобильный банк для настольной игры Monopoly. Поддерживает до 15 игроков, NFC-карты для быстрого доступа и историю операций.

## Технологии

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion
- **PWA:** Оффлайн-режим, установка на устройство
- **NFC:** Web NFC для чтения карт (Chrome на Android)
- **Хранение:** localStorage

## Возможности

- 💰 Переводы между игроками и банком
- 📱 Адаптивный мобильный интерфейс
- 🏷️ Привязка NFC-карт к игрокам
- 📜 История последних 100 операций
- ⚙️ Настройка стартового баланса
- 🔒 Защита от дублирования NFC-карт

## NFC-карты

Для использования NFC:
- Требуется Android с Chrome (Web NFC не поддерживается на iOS)
- HTTPS соединение или localhost
- В настройках нажмите «Считать NFC-карту» и приложите карту к устройству

**Важно:** Одна NFC-карта может быть привязана только к одному игроку.

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
