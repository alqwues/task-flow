# TaskFlow — Jira-lite

Канбан-доска для управления задачами с realtime-обновлениями, авторизацией и совместным доступом.

**Deploy:** https://task-flow-lime-one.vercel.app  
**Стек:** React 19 + TypeScript + Supabase + Ant Design + dnd-kit + Zustand

---

## Запуск

```bash
git clone https://github.com/alqwues/task-flow.git
cd task-flow
npm install
cp .env.example .env   # заполнить ключи Supabase
npm run dev
```

### Переменные окружения

| Переменная | Описание |
|---|---|
| `VITE_SUPABASE_URL` | URL вашего Supabase проекта |
| `VITE_SUPABASE_ANON_KEY` | Anon/public ключ Supabase |

### База данных

Выполнить [`docs/supabase-schema.sql`](docs/supabase-schema.sql) в SQL Editor вашего Supabase проекта — создаст таблицы, RLS-политики, триггер для профилей и бакеты Storage.

---

## Функционал

### Уровень 1 — MVP ✅

- Регистрация / вход / выход (Supabase Auth)
- **Google OAuth** — кнопка «Continue with Google» на экране входа (требует настройки в Supabase Dashboard → Auth → Providers)
- Защита роутов — неавторизованный пользователь перенаправляется на `/auth`
- Список досок, создание, удаление
- Колонки: добавление, переименование, удаление
- Задачи: создание в колонке, drag-and-drop между колонками и внутри, удаление
- Адаптивная вёрстка (desktop + mobile), состояния загрузки, обработка ошибок
- **Тёмная тема** — переключатель в шапке, сохраняется в localStorage

### Уровень 2 — Полный функционал ✅

- **Детали задачи** — модальное окно с полями: название, описание, приоритет, дедлайн, исполнитель
- **Прикрепление файлов** — загрузка файлов до 10 МБ на задачу через Supabase Storage (бакет `task-files`)
- **Комментарии** — список, добавление, удаление (только своих), автор и время
- **Фильтрация** — поиск по тексту, фильтр по приоритету, исполнителю, флаг «Overdue»
- **Realtime** — подписка на изменения через Supabase Realtime с дедупликацией локальных мутаций
- **Совместный доступ** — приглашение участника по email (должен быть зарегистрирован), роли owner/member, удаление участника (только owner)
- **Профиль** — страница `/profile` для редактирования имени и загрузки аватара

### Уровень 3 — Бонус ✅

- **Лог активности** — drawer с историей: кто создал / переместил / удалил задачу и когда (кнопка Activity на доске)
- Горячая клавиша `N` — создать задачу в первой колонке
- `Esc` — закрыть модальное окно задачи

---

## Тесты

```bash
npm test        # watch mode
npm run test:run  # одноразово
```

Покрытие: утилита `filterTasks` (6 тест-кейсов через vitest).

---

## Архитектура

```
src/
├── components/
│   ├── auth/          # LoginForm, RegisterForm (+ Google OAuth)
│   ├── board/         # BoardView, BoardColumn, MembersPanel, ActivityPanel
│   ├── task/          # TaskCard, TaskModal, TaskAttachments
│   └── shared/        # AppLayout, PageLoader, PriorityTag
├── hooks/             # useBoardData, useBoards, useTaskDetail, useMembers, useActivityLog
├── pages/             # AuthPage, BoardsPage, BoardPage, ProfilePage
├── services/          # supabase, auth, boards, tasks, profiles, activityLog, attachments
├── store/             # authStore, boardStore, taskStore, themeStore (Zustand)
├── utils/             # filterTasks
└── types/             # TypeScript типы
```

**State management:** Zustand — по одному стору на домен (auth, board, task, theme).  
**Realtime:** Supabase channel на `board:{id}`, подписки на INSERT/UPDATE/DELETE таблиц `columns` и `tasks`. Деdup через `useBoardStore.getState()` — предотвращает двойное добавление при оптимистичных обновлениях.  
**Dark mode:** antd `theme.darkAlgorithm` + `theme.useToken()` для динамических цветов компонентов.

---

## Что бы улучшили при наличии времени

- **Invite незарегистрированных** — сейчас приглашение работает только для уже зарегистрированных пользователей; для полноценного invite-flow нужен Supabase Edge Function с отправкой письма
- **Rollback при DnD-ошибке** — оптимистичный drag-and-drop не откатывает позицию при сетевой ошибке
- **Пагинация комментариев** — при большом числе комментариев нет подгрузки по страницам
- **Тесты на хуки** — покрыть `useBoardData` и `useTaskDetail` интеграционными тестами с mock Supabase
- **Уведомления о назначении** — push/email при назначении пользователя исполнителем задачи
