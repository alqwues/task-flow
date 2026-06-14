# TaskFlow — Jira-lite

Канбан-доска для управления задачами с realtime-обновлениями, авторизацией и совместным доступом.

**Стек:** React 18 + TypeScript + Supabase + Ant Design + dnd-kit

---

## Запуск

```bash
git clone <repo-url>
cd lite-jira
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

Выполнить [`docs/supabase-schema.sql`](docs/supabase-schema.sql) в SQL Editor вашего Supabase проекта — создаст таблицы, RLS-политики и триггер для профилей.

---

## Реализованные уровни

### Уровень 1 — MVP ✅

- Регистрация / вход / выход (Supabase Auth)
- Защита роутов — неавторизованный пользователь перенаправляется на `/auth`
- Список досок, создание, удаление
- Колонки: 3 по умолчанию при создании доски, добавление, переименование, удаление
- Задачи: создание в колонке, drag-and-drop между колонками и внутри, удаление
- Адаптивная вёрстка (desktop + mobile), состояния загрузки, обработка ошибок

### Уровень 2 — Полный функционал ✅

- **Детали задачи** — модальное окно с полями: название, описание, приоритет (low/medium/high), дедлайн, исполнитель (выбор из участников доски)
- **Комментарии** — список, добавление, удаление (только своих), автор и время
- **Realtime** — подписка на `columns` и `tasks` через Supabase Realtime; изменения другого пользователя появляются мгновенно без перезагрузки
- **Совместный доступ** — приглашение участника по email, роли owner/member, удаление участника (только owner)
- **Профиль** — страница `/profile` для редактирования имени и загрузки аватара (Supabase Storage)

### Уровень 3 — Бонус (частично) ✅

- Горячая клавиша `N` — создать задачу в первой колонке
- `Esc` — закрыть модальное окно задачи

---

## Архитектура

```
src/
├── components/
│   ├── auth/          # LoginForm, RegisterForm
│   ├── board/         # BoardView, BoardColumn, MembersPanel
│   ├── task/          # TaskCard, TaskModal
│   └── shared/        # AppLayout, PageLoader, PriorityTag
├── hooks/             # useBoardData, useBoards, useTaskDetail, useMembers
├── pages/             # AuthPage, BoardsPage, BoardPage, ProfilePage
├── services/          # supabase, auth, boards, tasks, profiles
├── store/             # authStore, boardStore, taskStore (Zustand)
└── types/             # TypeScript типы
```

**State management:** Zustand — по одному стору на домен (auth, board, task).  
**Realtime:** Supabase channel на `board:{id}`, подписка на events INSERT/UPDATE/DELETE таблиц `columns` и `tasks`.

---

## Что можно улучшить

- Email invite members
- Фильтрация и поиск задач по приоритету / исполнителю / названию
- Лог активности на доске
- Прикрепление файлов (Supabase Storage)
- Тёмная тема
- Google OAuth
- Оптимистичные обновления для drag-and-drop (сейчас есть, но без rollback при ошибке)
- Пагинация комментариев при большом количестве
