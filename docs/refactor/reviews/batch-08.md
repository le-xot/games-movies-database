# Ревью батча F-02 (batch 8) — `41ae5e6` → **CHANGES REQUIRED**

|                  |                                                                                                                                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ветка            | `chore/code-cleanup`                                                                                                                                                                                                                                                                                                                  |
| Коммит           | `41ae5e6` (родитель — `9042286`), 13 файлов, +110/−97                                                                                                                                                                                                                                                                                 |
| Ревьюер          | `review-batch8` (не автор коммита; только diff, изолированный worktree и прогоны)                                                                                                                                                                                                                                                     |
| Дата             | 2026-11-28                                                                                                                                                                                                                                                                                                                            |
| Что сделано мной | работал в `/tmp/review-b8` (detached `41ae5e6`, `bun install --frozen-lockfile`); отдельно прогнал baseline родителя `9042286`; временно снял 3 мёртвых импорта в worktree, чтобы доказать, что это единственная поломка (правка откачена, worktree удалён); в основном дереве создан только этот отчёт, код не менялся, коммитов нет |
| Не запускалось   | Playwright e2e, `docker build`, backend-прогоны — предмет только фронтовый, backend в diff отсутствует                                                                                                                                                                                                                                |
| Важно            | на старте ревью HEAD ветки = `f793bac`, к концу — `4471595` (параллельные коммиты `5346375`, `90c6c6c`, `4471595`, вне предмета); номера строк относятся к `41ae5e6`, но блокер B1 **жив и на `4471595`, и в рабочем дереве** — три импорта на месте                                                                                  |

## Вердикт

**CHANGES REQUIRED.** Один блокер — механический, чинится удалением трёх строк; содержательная часть батча эквивалентна и корректна.

### Блокер B1 — `bun typecheck` и `cd frontend && bun run build` красные: три мёртвых импорта `RotateCw`

Удалив копии блока «ошибка + Повторить», автор снял `RotateCw` из `@lucide/vue` в четырёх файлах, но **забыл в трёх** — импорт остался без использования, а `frontend/tsconfig.json:14` включает `noUnusedLocals`:

```
frontend:typecheck | src/pages/media/MediaPage.vue(2,1): error TS6133: 'RotateCw' is declared but its value is never read.
frontend:typecheck | src/pages/ratings/UserRatingsPage.vue(2,1): error TS6133: 'RotateCw' is declared but its value is never read.
frontend:typecheck | src/pages/stats/StatsPage.vue(2,1): error TS6133: 'RotateCw' is declared but its value is never read.
frontend:typecheck | Exited with code 2
```

То же в сборке: `build:types` (vue-tsc) падает, `error: script "build" exited with code 1` (vite-часть при этом собирается). Родитель `9042286` зелёный (`bun typecheck` exit 0), т.е. регрессия внесена этим коммитом. Дополнительно: `bun lint` **не** ловит эти импорты — oxlint не видит неиспользуемых импортов в `<script setup>` `.vue` (проверка: `bunx oxlint frontend/src/pages/media/MediaPage.vue` → `0 warnings`, а та же `no-unused-vars` на `.ts`-пробнике даёт предупреждение). Единственный страж — vue-tsc, а CI гоняет `bun typecheck` (`.github/workflows/checks.yaml:77`), поэтому коммит в нынешнем виде ломает CI и нарушает DoD кампании (`bun typecheck` зелёные).

**Фикс** — удалить три строки:

```diff
 frontend/src/pages/media/MediaPage.vue:2        -import { RotateCw } from '@lucide/vue'
 frontend/src/pages/ratings/UserRatingsPage.vue:2 -import { RotateCw } from '@lucide/vue'
 frontend/src/pages/stats/StatsPage.vue:2         -import { RotateCw } from '@lucide/vue'
```

Блокер не исторический: на текущем HEAD ветки `4471595` и в рабочем дереве эти три импорта по-прежнему на месте (`git show 4471595:… | sed -n '1,3p'`), т.е. `bun typecheck` на ветке красный прямо сейчас. Проверено в worktree: после удаления ровно этих трёх строк `bun typecheck` → exit 0 (`frontend:typecheck Done in 3.40s`), `cd frontend && bun run build` → exit 0 (`build:types Done 2.56s`, `build:ci ✓ built in 888ms`), `bun lint`/`bun format:check` остаются зелёными. Других ошибок в diff нет.

## Что в коммите

- `frontend/src/components/feedback/ErrorRetry.vue` (новый, 42 строки): props `message`/`variant: 'bar' | 'block'`, `emit('retry')`; бар — `flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3` (`:32-41`), блок — `flex flex-col items-center gap-3 py-8 text-center` (`:25-31`); кнопка — `<Button variant="outline" size="sm">` с `<RotateCw class="size-4" />` и текстом «Повторить».
- Семь страниц: `MediaPage.vue:79-83`, `SuggestionPage.vue:49-53`, `CocktailsPage.vue:203-207`, `FriendsPage.vue:121`, `UserRatingsPage.vue:35`, `StatsPage.vue:157`, `AdminPage.vue:54` — старые блоки заменены компонентом.
- `CocktailsPage.vue:104-108` — новый `barErrorText` вместо тернарника в шаблоне.
- `use-wordle.ts`: локальный `extractErrorMessage` удалён (`:33-41` в родителе), `parseApiError` в трёх caught-местах (`:216`, `:232`, `:245`), fallback-строки дословно прежние.
- `use-stats.ts:26` — `'Failed to load stats'` → `'Не удалось загрузить статистику'`; `use-suggestion.ts:49` — `'Failed to load suggestions'` → `'Не удалось загрузить советы'`.
- `use-admin-users.ts:58-59` — в catch удаления пользователя добавлен `toast.error`, текст `console.error` переведён на русский.
- `utils/api-error.spec.ts` — 3 теста родителя заменены 5 (конверт, массив, `Error`, fallback, битый JSON).

Новых `any`, `as unknown as`, `@ts-ignore`, `eslint-disable` в diff нет; `git show --check 41ae5e6` чист.

## Прогоны (в `/tmp/review-b8`, detached `41ae5e6`, дерево чистое)

| Проверка                                    | Результат                                                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile`             | exit 0 — `450 packages installed`                                                                                          |
| `bun lint`                                  | exit 0 — `Found 0 warnings and 0 errors`, 438 файлов, 95 правил (мёртвые импорты в `.vue` правилом не покрываются, см. B1) |
| `bun format:check`                          | exit 0 — `All matched files use the correct format`, 616 файлов                                                            |
| `bun typecheck`                             | **exit 2** — frontend: 3× TS6133 (B1); contract 7 / database 41 / backend 272 файла без ошибок                             |
| `cd frontend && bun test src`               | exit 0 — **128 pass / 0 fail**, 21 файл, 200 expect (родитель: 126 pass; +2 = 3→5 тестов в `api-error.spec.ts`)            |
| `cd frontend && bun run build`              | **exit 1** — `build:types` (vue-tsc) TS6133×3, `build:ci` (vite) `✓ built in 984ms`; `script "build" exited with code 1`   |
| baseline `9042286`: `bun typecheck` / tests | exit 0 (`frontend:typecheck Done 3.93s`) / 126 pass — регрессия внесена `41ae5e6`, а не унаследована                       |
| после снятия 3 импортов: typecheck / build  | exit 0 / exit 0 (правка откачена, дерево чистое: `git status` пуст)                                                        |

## Пункт 1. Эквивалентность UX на семи страницах

| Страница   | parent: раскладка, текст, retry, условие                                                                                            | HEAD                                                     | Дельта                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| media      | bar; `span.text-sm.text-destructive` «Не удалось загрузить записи»; `media.records.retry()`; `v-if="media.records.error"`           | bar (default); тот же текст; тот же вызов; то же условие | нет                                               |
| suggestion | bar; «Не удалось загрузить советы»; `suggestion.refetchSuggestions()`; `v-if="suggestion.error"`                                    | bar; то же                                               | нет                                               |
| cocktails  | bar; текст тернарником; `retry`; `v-if="hasCatalogError \|\| hasMatchError \|\| hasBarLoadError"`                                   | bar; `:message="barErrorText"`; `retry`; то же условие   | нет (см. п. 2)                                    |
| friends    | block `py-16`; `error`; `retry`; `v-if="error"` → `ul v-else-if="isLoading"` → …                                                    | block `py-8`; то же; та же цепочка                       | **`py-16` → `py-8`** (недокументированная мелочь) |
| ratings    | block `py-8`; `ratings.refetch()`; `v-if="error"` → `v-else-if="!isLoading && total === 0"` → `template v-else`                     | block `py-8`; тот же вызов; та же цепочка                | нет                                               |
| stats      | block `py-8`; `statsStore.refetch()`; `template v-if="isLoading"` → `v-else-if="error"` → `v-else-if="isEmpty"` → `template v-else` | тот же порядок ветвей и тот же вызов                     | нет                                               |
| admin      | block `py-8`; `fetchUsers()`; `div v-if="isLoading"` → `v-else-if="error"` → `template v-else`                                      | тот же порядок и вызов                                   | нет                                               |

Порядок `v-if`/`v-else-if` нигде не переставлен: stats (`StatsPage.vue:133-163`) и admin (`AdminPage.vue:38-56`) сохранили «загрузка → ошибка → пусто/контент», ветки `v-else-if` приняли компонент с единственным корневым узлом (компилируется: `build:ci` зелёный). Иконка: в cocktails/friends `<RotateCw />` получил `class="size-4"`, но это no-op — база `Button` уже содержит `[&_svg]:size-4` (`components/ui/button/index.ts:7`), т.е. размер и раньше был 16px.

## Пункт 2. Cocktails: приоритеты и ретрай

| Условие           | parent                                                                                                                              | HEAD                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `hasBarLoadError` | `barLoadError` (тип `Ref<string \| null>`, единственное присваивание — `'Не удалось загрузить ваш бар'`, `use-cocktail-bar.ts:196`) | `barLoadError ?? 'Не удалось загрузить бар'` — при ошибке отдаёт то же значение |
| `hasCatalogError` | `'Не удалось загрузить полки'`                                                                                                      | то же                                                                           |
| `hasMatchError`   | `'Не удалось подобрать коктейли'`                                                                                                   | то же                                                                           |

Приоритет `barLoad > catalog > match` совпадает с прежним тернарником; `retry()` не тронут (`CocktailsPage.vue:156-163`: `refetchCatalog`, `refetchSearch`/`refetchMatch`, `reloadBar`), условие показа то же (`:204`). `??`-ветка недостижима (в `barLoadError` никогда не пишется `null` при `hasBarLoadError === true` и не пишется пустая строка) — мёртвая защита, безвредно.

## Пункт 3. Wordle: `extractErrorMessage` → `parseApiError`

Все три wordle-канала бросают `Response`: `unwrap(api.wordle.guess.post / practice.post / practice.guess.post)` (`use-wordle.ts:78`, `:100`, `:108`), а `unwrap` при ошибке делает `throw toErrorResponse(result)` → `new Response(JSON.stringify(body), …)` (`lib/api.ts:38-69`, `unwrap` — `:56-69`). Эмпирическая проверка (пробник в `/tmp`, не в репозитории):

| Вход                                                                 | старый `extractErrorMessage`              | новый `parseApiError`                |
| -------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------ |
| `Response(400, {statusCode, message: 'Слово не найдено в словаре'})` | `'Не удалось отправить слово'` (fallback) | `'Слово не найдено в словаре'`       |
| `Response` с пустым телом                                            | fallback                                  | fallback (+`console.error` из catch) |
| `{ error: { message: 'nested' } }`                                   | `'nested'`                                | `'nested'`                           |
| `{ error: { message: ['a','b'] } }`                                  | `'a'`                                     | `'a; b'`                             |
| `null` / `undefined` / `{}`                                          | fallback                                  | fallback                             |

Ключевой факт: `'error' in new Response(...) === false`, поэтому в проде старый дубль **всегда** отдавал fallback, а новый показывает серверное сообщение. Это единственная UX-дельта батча: все тексты wordle-ошибок на бэкенде — русские пользовательские строки (`wordle.service.ts:93,96,110,115`, `wordle-practice.service.ts:60,63,67,69`), т.е. изменение осмысленное и в пользу пользователя, и оно заявлено в сообщении коммита; формально это расходится с буквой правила «UX не меняются» — стоит зафиксировать в `progress.md`/ADR. Fallback-тексты дословно прежние: `'Не удалось отправить слово'` (`:216`, `:232`), `'Не удалось начать тренировку'` (`:245`). Все три вызова — внутри `async` try/catch с `await`, `toast.error({ description: string })` получает строку, а не Promise (после снятия B1 `vue-tsc` зелёный, т.е. тип сходится). Дельта для массива сообщений (`'a'` → `'a; b'`) в wordle недостижима (там `Response`), а для конверта `ApiErrorDto` массив склеивается так же, как в остальных местах проекта.

## Пункт 4. Admin: удаление пользователя

`use-admin-users.ts:49-61`: успешный путь не изменён — `assertOk(api.users({ id }).delete())` и затем `await fetchUsers()`, ровно по одному вызову. `toast.error('Не удалось удалить пользователя')` — только в `catch`, дублей нет: `Dialog.submitDialog` не имеет собственного тоста и не ждёт `onSubmit` (`components/dialog/composables/use-dialog.ts:27-32`), поэтому одна ошибка = одно уведомление; диалог, как и раньше, закрывается при неудаче (предсуществующее поведение). Импорт `toast` в composable — существующий паттерн (`use-steam-sync.ts`, `use-merge-accounts.ts`, `use-user-ratings.ts`, `use-wordle.ts`).

## Пункт 5. Компонент `ErrorRetry`

Сетевых вызовов, состояния, `onMounted`/`watch` нет: только два импорта (иконка и `Button`), `withDefaults(defineProps)` и `defineEmits`; клик — единственный триггер эмита, запрос выполняет вызывающая страница. Рендерится один корневой `div` (ветки `v-if`/`v-else` — тернарник, лишних узлов/DOM-обёрток нет), классы Tailwind байт-в-байт совпадают с прежними барами (`:34`) и блоками (`:25`, кроме `py-16` у friends). a11y не хуже: настоящий `<Button>` с текстовой подписью «Повторить», `<p>`/`<span>` как раньше; `role="alert"`/`aria-live` не добавлялись, но их не было и в копиях.

## Пункт 6. `utils/api-error.spec.ts`

Все 5 тестов реально исполняются: изолированный прогон `bun test src/utils/api-error.spec.ts` → `5 pass / 0 fail, 6 expect()`; в общем прогоне `src` — 128 pass (родитель 126, +2). Покрытие веток `parseApiError`:

| Ветка `api-error.ts`                                 | Покрыта                        |
| ---------------------------------------------------- | ------------------------------ |
| `Response` + строковый `message` (`:15-17`)          | да, тест 1                     |
| `Response` + массив (`:16` + `normalizeMessage:3-6`) | да, тест 2                     |
| объект/`Error` с `message` (`:19-25`)                | да, тест 3                     |
| объект без сообщения, `null` (`:19-25`)              | да, тест 4                     |
| битый JSON → `catch` → fallback (`:27-30`)           | да, тест 5                     |
| пробельное сообщение → `trim` → fallback (`:2`)      | **нет** (было в spec родителя) |
| `{ error: { message } }` (`:25`)                     | **нет** (было в spec родителя) |
| ветка «объект с `json()`» (`:21-24`)                 | нет (недостижима)              |
| дефолтный fallback `'Неизвестная ошибка'`            | нет                            |

Тесты не тавтологичны: проверяют конкретные строки на конверте `ApiErrorDto` (форма совпадает с `backend/src/gateway/errors.ts:9-13`) и интеграционно подкреплены `lib/api.spec.ts` (`'Ник уже занят'`, `'Нет прав'`) — он зелёный. Замечание: заменив, а не дополнив тесты родителя, автор потерял защиту веток `trim` и `error.message`; кода этих веток коммит не касался, но это ровно та ловушка, которую батч должен был сохранить.

## Пункт 8. Мёртвые остатки

`extractErrorMessage` в репозитории больше не встречается (`grep` по `frontend/src` — 0). Других копий «ошибка + Повторить» в мигрированных страницах нет: `Повторить` осталось внутри `ErrorRetry.vue`, в блоке ошибки тренировки `WordlePractice.vue:90` (см. N5) и в `WordleMiniAppPage.vue:48` (иной UX — перезапрос результата, не блок ошибки). Мёртвые `RotateCw` — B1; `Button` в media/ratings/stats снят корректно, в остальных страницах импорт `Button` действительно используется.

## Замечания

**Блокер**

- **B1.** Три неиспользуемых `import { RotateCw }` (`MediaPage.vue:2`, `UserRatingsPage.vue:2`, `StatsPage.vue:2`) → `bun typecheck` exit 2, `cd frontend && bun run build` exit 1, CI (`checks.yaml:77`) красный. Фикс — удалить три строки (проверено: после этого все прогоны зелёные).

**Не блокеры**

- **N1.** Friends: block `py-16` → `py-8` — единственная реальная визуальная дельта (вертикальные отступы блока ошибки уменьшились с 64 до 32 px, у остальных четырёх страниц и так было `py-8`). Либо осознанная унификация — тогда строка в отчёт/коммит, либо вернуть `py-16` пропом.
- **N2.** Wordle впервые показывает серверный текст ошибки вместо общего fallback (осознанно и лучше; см. п. 3) — зафиксировать в `progress.md`, т.к. это текстовый UX-сдвиг вопреки букве правила 2 README.
- **N3.** Спека потеряла кейсы `{ message: '   ' }` и `{ error: { message: 'nested' } }`, хотя ветки остались в коде; вернуть их — 2 строчки защиты.
- **N4.** `toast.error('Не удалось удалить пользователя')` — общий текст: причина (`409` «нельзя удалить…») теряется. `parseApiError(err, 'Не удалось удалить пользователя')` дал бы пользователю конкретику и остался бы в каноне.
- **N5.** Восьмой визуально близкий блок `WordlePractice.vue:90` не мигрирован. Карта F-5 перечисляет его в скобках, задача F-02 говорит «7 копий», поэтому формально вне scope, но «старый путь удалён» не выполнено до конца — либо миграция (проп тона/варианта кнопки), либо явная запись исключения в карту/ADR.
- **N6.** `barErrorText` (`CocktailsPage.vue:104-108`): `?? 'Не удалось загрузить бар'` недостижим (`barLoadError` — `string | null`, при ошибке строка). Безвредно; можно упростить.
- **N7.** `toUiError`/`useAsyncState` из F-02 не созданы — цель «один путь текста ошибки» достигнута `parseApiError`, по deletion test это оправдано. Но из «пяти способов» F-5 остались нетронутыми `console.error`-only в `ConnectedAccounts.vue:29-38` (загрузка аккаунтов), тихий `catch → null` в `stores/use-user.ts:22-27`, локальные тосты в `MediaCard`. Карта F-5 закрыта частично — записать остаток в `progress.md`/следующий батч.
- **N8.** У `ErrorRetry` нет теста: в проекте нет компонентного тулинга (`@vue/test-utils` не установлен), unit потребовал бы новой инфраструктуры; e2e покрывают успешные пути страниц, но не сам компонент. Ожидаемо, не блокер.
- **N9.** Карты (`maps/frontend.md` F-5), `tasks.md` и `progress.md` не обновлены — как и в batch-07, ожидаемо для closing-коммита.

## Минимальный набор правок для APPROVE

1. Удалить `import { RotateCw } from '@lucide/vue'` в `MediaPage.vue:2`, `UserRatingsPage.vue:2`, `StatsPage.vue:2`.
2. (Желательно, дёшево) вернуть в `api-error.spec.ts` кейсы `trim` и `{ error: { message } }`; решить судьбу `py-16` у friends; зафиксировать в документации UX-дельту wordle и остаток F-5.

После правки 1 все обязательные прогоны зелёные (проверено в изолированном worktree), и коммит можно принимать.
