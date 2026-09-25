# Telegram Chat — GREEN-API (тестовое задание)

Минимальный React-интерфейс для отправки и получения текстовых сообщений в **Telegram** через [GREEN-API](https://green-api.com/).

## Важно про приём сообщений

Long-poll (`receiveNotification`) работает только если у инстанса:

- `webhookUrl` пустой
- `incomingWebhook = yes`

При входе приложение само вызывает `setSettings` и включает эти флаги.

Консоль GREEN-API использует свой UI (там чаты уже есть). Нам **не нужен WebSocket** — по [документации](https://green-api.com/docs/api/receiving/technology-http-api/) достаточно HTTP long-poll.

## Telegram chatId

У Telegram `chatId` — это числовой id (`189274038`), а не `7999…@c.us`.

Поэтому новый чат создаётся через `checkAccount` по номеру телефона.

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте http://localhost:3100

Введите `idInstance` и `apiTokenInstance`.  
`apiUrl` можно не указывать: для `4100…` подставится `https://4100.api.green-api.com`.

## API

| Действие               | Метод                                        |
| ---------------------- | -------------------------------------------- |
| Включение входящих     | `setSettings`                                |
| Список чатов при входе | `getChats`                                   |
| Новый чат по телефону  | `checkAccount`                               |
| Отправка               | `sendMessage`                                |
| Приём                  | `receiveNotification` + `deleteNotification` |

## Скрипты

```bash
npm run lint
npm run lint:fix
npm run format
npm run ts:check
npm run build
```
