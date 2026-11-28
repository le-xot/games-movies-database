# Ревью батча B-01 — `dc2c1a0` → **CHANGES REQUIRED**

|                  |                                                                                 |
| ---------------- | ------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`                                                            |
| Коммит           | `dc2c1a0` (родитель — `1d250ab`)                                                |
| Ревьюер          | `review-batch1` (не автор коммита; только diff, репозиторий и прогоны)          |
| Дата             | 2026-11-28                                                                      |
| Что сделано мной | исходники не менялись, коммитов нет; единственный созданный файл — этот отчёт   |
| Не запускалось   | backend unit, integration (Postgres), Playwright e2e — вне списка команды ревью |

## Вердикт

**CHANGES REQUIRED.** Один блокирующий пункт, документационный: новый канон в
`frontend/src/AGENTS.md:80` не соответствует коду — в репозитории есть и активно используются
баррели `components/{account,form,palette}`, которые правило объявляет несуществующими. То есть
заявленная часть батча «`frontend/src/AGENTS.md` приведён к факту» не выполнена. Плюс
косметический дефект той же строки: два подряд `- **Imports**:` (было `**Barrel imports**`).

**Кодовая часть батча — чистая.** Все 4 заявленных пункта проверены и подтверждены,
функциональных регрессий не найдено; `bun lint`, `bun typecheck`, frontend unit и vite build
зелёные, в собранном CSS токена нет. После правки одной docs-строки батч можно принимать.

## Что в коммите

23 файла, +27/−70:

- удаления (8): `components/media/badge/BadgeSelect.vue` (23 строки) + 7 баррелей
  (`components/media`, `components/media/badge`, `components/layout`, `components/dialog`,
  `composables`, `stores`, `utils`);
- правки (15): 13 файлов с `bg-[var(--n-action-color)]` (включая `components/media/MediaCard.vue`)
  - `frontend/src/AGENTS.md` + `backend/src/gateway/wordle.ts`.

Полный diff просмотрен: посторонних правок нет, удаления полные (висячих ре-экспортов и
ссылок не осталось).

## Прогоны

| Проверка                       | Результат                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun lint`                     | exit 0 — `Found 0 warnings and 0 errors. Finished in 92ms on 448 files with 95 rules`. В baseline (`progress.md`) было 1 warning (`wordle.ts:247`) — исчез.                                                                                                                                                                                                                                                                                                                                    |
| `bun format:check`             | **exit 1**, но не из-за батча: `docs/refactor/maps/backend.md`, `docs/refactor/maps/contract-data-config.md` (untracked, в коммите отсутствуют) и `docs/refactor/tasks.md` (в рабочем дереве `M` — правка кампании уже после коммита). В коммите `tasks.md` нет: блоб `dc2c1a0:docs/refactor/tasks.md` == `1d250ab:...` (`ebf5f36`) и проходит `bun fmt --check`; 15 изменённых коммитом неудалённых файлов проходят `bun fmt --check` (`All matched files use the correct format`, 15 files). |
| `bun typecheck`                | exit 0 — contract 7 файлов, database 41, backend 277, frontend 2.50 s, ошибок нет.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `cd frontend && bun test src`  | exit 0 — **126 pass / 0 fail**, 21 файл, 199 `expect` (ровно baseline из `progress.md`: 126/21).                                                                                                                                                                                                                                                                                                                                                                                               |
| `cd frontend && bun run build` | exit 0 — vite 8.3.5, 4534 модуля; `dist/assets/index-DJMq119X.css` 89.19 kB. `grep -rn n-action-color frontend/dist` → **пусто**; в CSS присутствует `.bg-card{background-color:var(--card)}`.                                                                                                                                                                                                                                                                                                 |
| `git show --check dc2c1a0`     | чисто (whitespace-ошибок нет).                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

Следствие для DoD: на самом коммите `format:check` был зелёным; красный сейчас — из-за
незакоммиченных документов кампании. Тот, кто будет их коммитить, должен прогнать `bun fmt`.

## Пункт 1. Удаление `bg-[var(--n-action-color)]` (20 мест / 13 файлов)

**Проверено.** В parent-дереве ровно 20 вхождений в 13 файлах:

```
git grep -c 'bg-\[var(--n-action-color)\]' 1d250ab -- frontend
вхождения по файлам: DataCards 2, MediaCard 1, AdminPage 1, CocktailsPage 1, CocktailBarField 1,
CocktailCard 1, FriendsPage 2, MediaPage 1, StatsPage 5, StatsSummaryCards 1,
SuggestionPage 1, SuggestionCard 1, WordleStatsDialog 2   → 20 в 13 файлах
```

На HEAD вхождений в коде нет; единственное упоминание имени в репозитории —
`docs/refactor/maps/frontend.md` (untracked рекогносцировка, не код).

**Доказательства.**

1. Токен нигде не объявлен: repo-wide `grep -rn 'n-action-color'` (без `node_modules`/`.git`,
   включая `frontend/index.html`, `assets/*.css`, `e2e`, `scripts`, `.github`) находит только
   docs-карту; `setProperty` в коде нет. В собранном CSS master (артефакт
   `frontend/dist/assets/index-CGSKGsb0.css` основного чекаута) правило есть, объявления нет:
   `.bg-\[var\(--n-action-color\)\]{background-color:var(--n-action-color)}` — `var()` без
   fallback → invalid at computed-value time → `background-color` = initial (transparent).
2. Для 7 **не-`Card`** элементов удалённый класс был единственным `bg-*` на элементе, других
   источников фона нет (оба состояния — transparent, пиксели идентичны):
   `pages/cocktails/CocktailsPage.vue` (error-панель), `.../CocktailBarField.vue` (корень),
   `.../CocktailCard.vue` (article), `pages/friends/FriendsPage.vue` (skeleton `li` и
   `RouterLink` — у ссылки только inline `backgroundImage`, это другое свойство),
   `pages/media/MediaPage.vue` (error-панель), `pages/suggestion/SuggestionPage.vue`
   (error-панель).
3. Для 13 **`Card`**-вхождений важная поправка к обоснованию коммита: `Card` собирает классы
   через `cn()` = `twMerge(clsx(...))` (`frontend/src/lib/utils.ts:5`,
   `frontend/src/components/ui/card/Card.vue:11`), а tailwind-merge **вытеснял `bg-card`**, когда
   в `props.class` приходил `bg-[var(--n-action-color)]`. Проверено на всех 5 вариантах
   `props.class` из parent-дерева — результат twMerge всегда без `bg-card`
   (`DROPS bg-card`), т.е. до правки карточка была **прозрачной**, а не `bg-card`.
4. Визуальная эквивалентность после правки всё равно держится: `bg-card` = `var(--card)`, а
   поверхность под всеми 13 карточками = `--background`:
   - `--card` == `--background` в обеих темах: `index.css:91,93` (light 1/1) и `127,129`
     (dark 0.145/0.145);
   - `body { @apply bg-background }` (`index.css:216-217`) + inline dark `oklch(0.145 0 0)`
     (`frontend/index.html:91,108`);
   - у контейнеров `.body` / `.body-content` (`LayoutBody.vue:57,67`),
     `.layout-database` / `.layout-main` (`LayoutDatabase.vue:30,36`) фона нет;
   - в 13 затронутых файлах нет `bg-*` у контейнеров (только `bg-zinc-700` у skeleton-плашек
     внутри карточек);
   - карточки в диалоге (`WordleStatsDialog.vue:72` → `DialogScrollContent`) лежат на
     `bg-background` (`DialogScrollContent.vue:31`, `DialogContent.vue:32`);
   - приложение dark-only: `<html lang="ru" class="dark">` (`index.html:2`), кода переключения
     темы в `frontend/src` нет (упоминание «theme» — только `@theme inline` в CSS).

**Риск: low.** В единственной достижимой (тёмной) теме рендер идентичен; для не-`Card`
элементов идентичен безусловно. Потенциальная разница появится только если когда-нибудь
появится светлая тема/карточки на не-`background` поверхности — сейчас таких нет.

## Пункт 2. `BadgeSelect` → `BadgePopover` в `MediaCard`

**Проверено.** Сигнатуры идентичны, замена дословная:

- `BadgePopover.vue:1` — `generic="T extends RecordStatus | RecordGrade | RecordGenre"`,
  props `kind: SelectKind; value: T | undefined; compact?: boolean` (`:16-19`),
  emits `{ update: [ValueSelect] }` (`:21`);
- удалённый `BadgeSelect.vue` (`git show 1d250ab:...`) объявлял ровно те же generic/props/emits
  и пересылал их без изменений; `<slot>` в `BadgePopover` нет (grep → пусто), через
  `BadgeSelect` слоты не передавались;
- `MediaCard.vue` использует только `:value`, `kind`, `compact`, `@update` (строки 219, 261, 268) — атрибутов/классов, которые могли потеряться при прямой замене, нет;
- иных потребителей не было: `git grep BadgeSelect 1d250ab -- frontend` → импорт + 3 тега в
  `MediaCard.vue`, баррель и сам файл; на HEAD — 0.

**Риск: none.** `bun typecheck` (vue-tsc) и build подтверждают типизацию; логика события
`update` не менялась (был лишний hop без преобразования значения).

## Пункт 3. Удаление 7 баррелей `index.ts`

**Проверено.** У каждого из 7 файлов на parent-дереве не было ни одного потребителя
(`git grep` по `@/components/media`, `@/components/media/badge`, `@/components/layout`,
`@/components/dialog`, `@/composables`, `@/stores`, `@/utils` с границей кавычки — единственное
совпадение `@/components/media'` было примером в `frontend/src/AGENTS.md:80`, который и правится
этим батчем). Дополнительно проверено:

- относительные импорты баррелей (`from '../components/media'` и т.п.) — нет;
- динамические импорты: `import(`, `import.meta.glob`, `require(` — на удалённые пути не
  ссылаются (`frontend/src/main.ts`, `router/router.ts` и `media-prefetch.ts` грузят файлы
  напрямую);
- `frontend/vite.config.ts` — единственный alias `@`; `frontend/tsconfig.json` — только
  `@/*` и `@backend/*`; `frontend/components.json:18` (`"composables": "@/composables"`) —
  алиас shadcn-CLI, не импорт;
- `frontend/e2e`, `scripts`, `.github`, `docs` — ссылок нет;
- build и typecheck зелёные → резолв после удаления цел.

**Риск резолва: none.** Но см. проблему №1: текст нового канона в `AGENTS.md` неверен.

## Пункт 4. `wordleModels_` → `wordleRouteModels`

**Проверено.** `grep -rn wordleModels_` по репозиторию → 0; новое имя ровно в двух местах:
`backend/src/gateway/wordle.ts:247` (объявление) и `:250` (`.model({ ...wordleRouteModels, ... })`).
Spread тот же, коллизии имени нет. `bun lint` → 0 warnings: baseline-warning `wordle.ts:247`
устранён, как и заявлено.

**Риск: none.**

## Стиль и целостность коммита

- Сообщение: `refactor(frontend): …` + тело на русском списком — соответствует манере проекта
  и DoD (`refactor(<area>): <что канонизировано>`). Мелочь: область указана только `frontend`,
  хотя в коммит входит `backend/src/gateway/wordle.ts`; прецедентов multi-area в истории нет,
  поэтому это замечание уровня «стиль», не блокер.
- Diff без случайных правок, удаления полные, `git show --check` чист.

## Найденные проблемы

### 1. BLOCKING — `frontend/src/AGENTS.md:80`: канон про баррели не соответствует коду

Строка: «Barrels (`index.ts`) exist only for multi-file UI primitives (`@/components/ui/button`);
feature directories keep no barrels».

Факт: в репозитории живут и импортируются через баррель три не-`ui` директории:

- `frontend/src/app.vue:2` — `import { CommandPalette } from '@/components/palette'`
  (баррель с одним экспортом, т.е. даже не «multi-file»);
- `frontend/src/components/layout/db/LayoutDatabase.vue:3` — `@/components/account`;
- `frontend/src/components/layout/db/LayoutDatabase.vue:5`,
  `LayoutHeader.vue:4`, `LayoutSidebar.vue:4` — `@/components/form`.

**Фикс:** переформулировать фактом, например: «Barrels exist only where they are actually
consumed: `ui/*` primitives and the `account`, `form`, `palette` groups; new feature directories
(`media`, `layout`, `dialog`) keep none». Вариант «удалить и эти баррели» — отдельный батч
(нужно переписать импорты, в B-01 не входит).

### 2. MINOR — `frontend/src/AGENTS.md:80-81`: два подряд `- **Imports**:`

До батча первый пункт назывался `**Barrel imports**`; после правки два соседних пункта имеют
одинаковый ярлык `- **Imports**:` (строки 80 и 81). **Фикс:** переименовать первый в
`**Component imports**` (или объединить оба пункта).

### 3. MINOR (не блокирует код) — обоснование в теле коммита неточно

Тело утверждает «у `<Card>` дефолт `bg-card`», но из-за `tailwind-merge` в `cn()`
(`frontend/src/lib/utils.ts:5`, `ui/card/Card.vue:11`) класс `bg-card` вытеснялся арбитражным
`bg-[var(--n-action-color)]` — до правки карточки были прозрачными. Вывод «визуально
нейтрально» верен, но по другой причине (`--card` == `--background` на единственной тёмной
теме, все поверхности под карточками — `background`). **Фикс:** если ветку ещё можно
переписать — поправить формулировку тела коммита; иначе зафиксировать корректное обоснование
в `progress.md`/карте, чтобы следующее ревью не унаследовало неверную модель.

### 4. LOW / follow-up — `frontend/src/components/ui/slider` остался мёртвым

`Slider.vue` + `index.ts` не имеют потребителей (grep: ни одного импорта вне собственного
`index.ts`); карта F-19 и формулировка B-01 («баррели без потребителей», «неиспользуемый
`ui/slider`») включают его, но батч ограничился 7 не-`ui` баррелями. Это согласуется с новым
каноном «баррели только у ui-примитивов», но сам примитив мёртв. **Фикс:** решить, входит ли
он в B-01; если нет — отдельная задача/строка в карте (G-01 «нет `.ts` без импортёров» поймает
`ui/slider/index.ts`, но не сам `Slider.vue`).

### 5. PROCESS — `format:check` в текущем рабочем дереве красный не из-за коммита

Красные файлы: `docs/refactor/tasks.md` (модифицирован после коммита, `M` в `git status`) и
untracked `docs/refactor/maps/{backend,contract-data-config}.md`. Перед коммитом этих
документов нужно прогнать `bun fmt`. На `dc2c1a0` `format:check` зелёный (доказательство в
таблице прогонов).

### 6. PROCESS / follow-up — ловушки от регрессии нет

Правило кампании 5 требует защиты от повторного появления; для чисто мёртвого кода это
спорно применимо, но кандидат очевиден: запрет `bg-[var(--…)]` с необъявленной переменной
(oxlint-правило или CI-grep) — сейчас вернуть токен ничто не мешает. Предложение внести в
G-02, не блокер B-01.

### 7. PROCESS / follow-up — карта устарела

`docs/refactor/maps/frontend.md` (F-4, строки 28/146-151) всё ещё описывает токен как живой и
рекомендует его «объявить»; по README карту обновляют при закрытии батча. Сам файл untracked и
не отформатирован — учесть при коммите карт.

## Итог

Код и поведение — без нареканий: 4/4 пункта подтверждены, внешние контракты не затронуты,
проверки (lint/typecheck/unit/build) зелёные, CSS-токен из сборки исчез. Блокирует приёмку
только docs-строка `frontend/src/AGENTS.md:80` (проблемы 1-2, правка — одна строка). После неё
вердикт может быть поднят до APPROVE.
