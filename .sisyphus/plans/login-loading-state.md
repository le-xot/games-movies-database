# Login Loading State — Loading Indicators for Twitch Auth Flow

## TL;DR

> **Quick Summary**: Добавить loading-индикаторы в два момента Twitch OAuth флоу, где пользователь видит чёрный экран: на кнопке "Логин" при редиректе и на странице callback пока идёт API-запрос.
>
> **Deliverables**:
> - Кнопка "Логин" показывает спиннер и становится disabled при нажатии
> - Страница `/auth/callback` показывает спиннер вместо пустого экрана во время обработки
>
> **Estimated Effort**: Quick
> **Parallel Execution**: YES — 2 tasks, 1 wave (independent files)
> **Critical Path**: Task 1 ∥ Task 2 → Final Verification

---

## Context

### Original Request
Пользователь видит чёрный экран в двух моментах при логине через Twitch:
1. После нажатия кнопки "Логин" — пока браузер редиректит на `/api/auth/twitch`
2. На странице `/auth/callback` — пока идёт API-запрос `userLogin({ code })`

### Interview Summary
**Key Discussions**:
- Пользователь подтвердил, что оба момента нужно исправить
- Задача чисто фронтенд — бэкенд изменений не нужно

**Research Findings**:
- `Loader2Icon` + `animate-spin` — устоявшийся паттерн спиннера в проекте (`Sonner.vue:44-47`)
- `AdminPage.vue` использует `isLoading` ref паттерн с `"Загрузка..."` текстом
- В проекте нет shared LoadingSpinner компонента — спиннеры инлайнятся
- `Button` компонент поддерживает `disabled` через `PrimitiveProps` с готовыми стилями `disabled:pointer-events-none disabled:opacity-50`
- `AuthCallback.vue` template полностью пуст во время загрузки — рендерится только `v-if="error"`

### Metis Review
**Identified Gaps** (addressed):
- Early return paths в `AuthCallback.vue` (`loginError` и `"Incorrect code"`) не сбрасывают loading — нужно обработать
- Двойной клик по кнопке — решается через `disabled` состояние

### Momus Review (Round 1)
**Blocking Issues** (fixed):
- Task 1: `window.location.href` вызывает навигацию до рендера спиннера — добавлен `await nextTick()` перед редиректом + мок роута в QA
- Task 2: API клиент (`api.ts:413`) бросает `HttpResponse` объект, не `Error` — catch блок расширен для обработки обоих типов

---

## Work Objectives

### Core Objective
Устранить чёрный экран при Twitch OAuth флоу, добавив визуальные индикаторы загрузки.

### Concrete Deliverables
- `frontend/src/components/form/LoginForm.vue` — кнопка с loading-спиннером
- `frontend/src/pages/auth/AuthCallback.vue` — страница с loading-спиннером

### Definition of Done
- [x] `bun build` завершается без ошибок
- [x] `bun lint` проходит без новых предупреждений
- [x] Кнопка "Логин" показывает спиннер и disabled при нажатии
- [x] Страница callback показывает спиннер вместо пустого экрана

### Must Have
- Spinner icon (`Loader2Icon` + `animate-spin`) — проектный паттерн
- Disabled состояние кнопки во время loading
- Обработка всех early return paths в AuthCallback (loginError, incorrect code)

### Must NOT Have (Guardrails)
- НЕ создавать shared `LoadingSpinner.vue` компонент — инлайнить спиннер
- НЕ модифицировать `Button.vue` / `button/index.ts` — не добавлять loading prop
- НЕ модифицировать `DataTable.vue` или его `isLoading` prop
- НЕ модифицировать `use-user.ts` store
- НЕ добавлять retry/timeout логику в AuthCallback
- НЕ устанавливать новые зависимости
- НЕ трогать backend файлы
- НЕ создавать тест-файлы (нет test framework)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: none

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **Build verification**: Use Bash — `bun build`, `bun lint`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — both tasks are independent):
├── Task 1: LoginForm.vue — button loading state [quick]
└── Task 2: AuthCallback.vue — page loading spinner [quick]

Wave FINAL (After ALL tasks):
├── Task F1: Build + lint verification [quick]
└── Task F2: Visual QA via Playwright [quick]
-> Present results -> Get explicit user okay

Critical Path: Task 1 ∥ Task 2 → F1 ∥ F2 → user okay
Parallel Speedup: Tasks run simultaneously
Max Concurrent: 2
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1    | —         | F1, F2 |
| 2    | —         | F1, F2 |
| F1   | 1, 2      | —      |
| F2   | 1, 2      | —      |

### Agent Dispatch Summary

- **Wave 1**: **2** — T1 → `quick`, T2 → `quick`
- **FINAL**: **2** — F1 → `quick`, F2 → `quick`

---

## TODOs

- [x] 1. LoginForm.vue — Добавить loading state на кнопку "Логин"

  **What to do**:
  - Добавить `import { ref } from 'vue'` (сейчас `ref` НЕ импортирован — только `storeToRefs` из `pinia`)
  - Добавить `Loader2` в существующий импорт из `lucide-vue-next` (строка 2: `import { CircleUserRound, Loader2, Lock, LogOutIcon } from 'lucide-vue-next'`)
  - Создать `const isLoading = ref(false)`
  - В `handleLogin()`: установить `isLoading.value = true`, затем использовать `await nextTick()` (импорт из `vue`) ПЕРЕД `window.location.href = loginHref` — это гарантирует что Vue обновит DOM и спиннер отрендерится до начала навигации
  - Сделать `handleLogin` async: `async function handleLogin()`
  - Добавить `import { nextTick, ref } from 'vue'`
  - Обновить Button в template: добавить `:disabled="isLoading"`, внутри показать `<Loader2 v-if="isLoading" class="animate-spin" />` или текст "Логин"

  **Must NOT do**:
  - НЕ создавать shared компонент спиннера
  - НЕ модифицировать `Button.vue`
  - НЕ менять размер кнопки — спиннер внутри существующих границ
  - НЕ пропускать `await nextTick()` — без него DOM может не обновиться до навигации

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Однофайловое изменение, добавление 3-4 строк кода, прямолинейная задача
  - **Skills**: []
    - Нет необходимости в специализированных скиллах

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: F1, F2
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `frontend/src/components/ui/sonner/Sonner.vue:44-47` — паттерн спиннера: `<Loader2Icon class="size-4 animate-spin" />`. Использовать `Loader2` (имя иконки) с `animate-spin` классом
  - `frontend/src/components/form/LoginForm.vue:18-21` — текущая функция `handleLogin()` куда добавить `isLoading.value = true` + `await nextTick()` перед редиректом
  - `frontend/src/components/form/LoginForm.vue:57` — текущий Button без loading state: `<Button v-else @click="handleLogin"> Логин </Button>`

  **API/Type References**:
  - `frontend/src/components/ui/button/Button.vue` — Button принимает стандартные HTML атрибуты через `PrimitiveProps`, включая `disabled`. CVA содержит `disabled:pointer-events-none disabled:opacity-50`

  **WHY Each Reference Matters**:
  - Sonner.vue — единственное место где используется Loader2 спиннер, показывает правильное имя иконки и класс анимации
  - LoginForm.vue:18-21 — точное место куда вставить `isLoading.value = true` и `await nextTick()`. Без `nextTick()` Vue может не успеть обновить DOM до `window.location.href` навигации
  - Button.vue — подтверждение что `disabled` атрибут работает из коробки с правильными стилями

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Кнопка показывает спиннер при нажатии
    Tool: Playwright
    Preconditions: Пользователь не залогинен, dev server запущен
    Steps:
      1. Перехватить навигацию на `/api/auth/twitch` и ЗАДЕРЖАТЬ ответ (не отвечать, не abort):
         `await page.route('**/api/auth/twitch', async route => { await new Promise(() => {}) })`
         Это заставляет браузер ждать ответа бесконечно — текущий DOM остаётся на месте.
      2. Навигация на http://localhost:5173/db
      3. Найти кнопку по тексту "Логин" — селектор: `button:has-text("Логин")`
      4. Клик по кнопке — использовать `locator.click()` без await (fire-and-forget через `button.click().catch(() => {})`),
         либо `button.dispatchEvent('click')`, чтобы Playwright не блокировался ожиданием завершения навигации
      5. Подождать появления спиннера: `await page.waitForSelector('button svg.animate-spin', { timeout: 3000 })`
      6. Проверить что кнопка имеет атрибут `disabled`: `await expect(button).toBeDisabled()`
      7. Сделать скриншот
    Expected Result: Кнопка показывает вращающийся спиннер и неактивна (disabled). Навигация pending (ожидает ответ от route)
    Failure Indicators: Кнопка не содержит SVG с animate-spin, кнопка не disabled
    Evidence: .sisyphus/evidence/task-1-button-spinner.png

  Scenario: Кнопка блокирует повторные клики
    Tool: Playwright
    Preconditions: Пользователь не залогинен, route `/api/auth/twitch` задержан (pending)
    Steps:
      1. Перехватить навигацию: `await page.route('**/api/auth/twitch', async route => { await new Promise(() => {}) })`
      2. Навигация на http://localhost:5173/db
      3. Найти кнопку "Логин"
      4. Вызвать клик без ожидания навигации (fire-and-forget)
      5. Проверить атрибут `disabled` на кнопке — `await expect(button).toBeDisabled()`
    Expected Result: Кнопка имеет `disabled` атрибут, pointer-events-none
    Failure Indicators: Кнопка кликабельна повторно
    Evidence: .sisyphus/evidence/task-1-button-disabled.png
  ```

  **Evidence to Capture:**
  - [x] task-1-button-spinner.png — скриншот кнопки со спиннером
  - [x] task-1-button-disabled.png — скриншот disabled кнопки

  **Commit**: YES
  - Message: `feat: add loading state to login button during Twitch redirect`
  - Files: `frontend/src/components/form/LoginForm.vue`
  - Pre-commit: `bun build && bun lint`

- [x] 2. AuthCallback.vue — Добавить loading спиннер на страницу callback

  **What to do**:
  - Добавить `import { Loader2 } from 'lucide-vue-next'`
  - `ref` уже импортирован из `vue` (строка 2: `import { onMounted, ref } from 'vue'`)
  - Добавить `const isLoading = ref(true)` — страница начинает в loading состоянии
  - **КРИТИЧНО**: обработать ВСЕ early return paths:
    - После `if (loginError)` (строка 15-18): добавить `isLoading.value = false` ПЕРЕД `error.value = loginError`
    - После `if (typeof code !== 'string')` (строка 21-24): добавить `isLoading.value = false` ПЕРЕД `error.value = 'Incorrect code'`
  - В try/catch/finally: добавить `finally { isLoading.value = false }` блок (покрывает и success, и error paths)
  - **КРИТИЧНО — FIX ERROR HANDLING**: Текущий catch блок (`if (e instanceof Error)`) НЕ поймает ошибки от API клиента. API клиент (`frontend/src/lib/api.ts:413`) бросает `HttpResponse` объект (не `Error`) при non-2xx ответах. Нужно изменить catch блок:
    ```typescript
    catch (e) {
      if (e instanceof Error) {
        error.value = e.toString()
      } else {
        error.value = 'Ошибка авторизации'
      }
    }
    ```
    Это гарантирует что ошибка отобразится при ЛЮБОМ типе исключения (и `Error`, и `HttpResponse`).
  - Обновить template:
    ```vue
    <div v-if="isLoading" class="flex h-screen items-center justify-center">
      <Loader2 class="size-8 animate-spin text-muted-foreground" />
    </div>
    <div v-else-if="error" class="flex h-screen items-center justify-center bg-zinc-800">
      {{ error }}
    </div>
    ```

  **Must NOT do**:
  - НЕ добавлять текст "Загрузка..." — только спиннер
  - НЕ добавлять retry/timeout логику
  - НЕ создавать shared компонент
  - НЕ менять поведение success path — только улучшить catch для не-Error объектов

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Однофайловое изменение, добавление loading ref + template обновление
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: F1, F2
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `frontend/src/components/ui/sonner/Sonner.vue:44-47` — паттерн спиннера: `Loader2Icon` с `animate-spin`
  - `frontend/src/pages/auth/AuthCallback.vue:12-37` — текущий `onMounted` с try/catch и early returns. Нужно добавить `isLoading.value = false` в каждый early return И в `finally` блок
  - `frontend/src/pages/auth/AuthCallback.vue:40-43` — текущий template с `v-if="error"`, который нужно заменить на `v-if="isLoading"` / `v-else-if="error"` структуру

  **API/Type References**:
  - `frontend/src/stores/use-user.ts:42-48` — `userLogin()` — `useMutation` обёртка над `api.auth.authControllerTwitchAuthCallback`. НЕ МОДИФИЦИРОВАТЬ
  - `frontend/src/lib/api.ts:413` — `if (!response.ok) throw data` — API клиент бросает `HttpResponse` объект (НЕ `Error`) при non-2xx ответах. Это причина почему текущий `catch (e) { if (e instanceof Error) }` не ловит ошибки API

  **WHY Each Reference Matters**:
  - Sonner.vue — паттерн спиннера для consistency
  - AuthCallback.vue:12-37 — КРИТИЧНО понимать flow: 2 early returns (строки 15-18 и 21-24) происходят ДО async вызова. Если не сбросить `isLoading` в этих paths, спиннер будет крутиться вечно при ошибке
  - AuthCallback.vue:40-43 — текущий template, нужно понять существующую структуру для правильного `v-if`/`v-else-if`
  - api.ts:413 — КРИТИЧНО: объясняет почему нужно расширить catch блок. Без `else` ветки ошибка API не будет отображена пользователю

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Спиннер отображается во время загрузки
    Tool: Playwright
    Preconditions: Dev server запущен
    Steps:
      1. Навигация на http://localhost:5173/auth/callback?code=testinvalidcode
      2. Немедленно проверить наличие SVG с `animate-spin` — селектор: `svg.animate-spin`
      3. Сделать скриншот до завершения загрузки
    Expected Result: Центрированный вращающийся спиннер (Loader2) на странице
    Failure Indicators: Пустая страница / чёрный экран / нет SVG с animate-spin
    Evidence: .sisyphus/evidence/task-2-callback-loading.png

  Scenario: Ошибка отображается после неудачного запроса
    Tool: Playwright
    Preconditions: Dev server запущен
    Steps:
      1. Навигация на http://localhost:5173/auth/callback?code=invalidcode
      2. Ожидание исчезновения спиннера — `await page.waitForSelector('svg.animate-spin', { state: 'hidden', timeout: 10000 })`
      3. Проверить что отображается текст ошибки — `await expect(page.locator('div')).toContainText('Ошибка авторизации')` (fallback текст для non-Error объектов)
      4. Проверить что спиннер НЕ отображается
      5. Сделать скриншот
    Expected Result: Текст ошибки виден (может быть "Ошибка авторизации" для HttpResponse или toString() для Error), спиннер скрыт
    Failure Indicators: Спиннер крутится вечно, ошибка не отображается, пустой экран
    Evidence: .sisyphus/evidence/task-2-callback-error.png

  Scenario: Error параметр в URL показывает ошибку без зависания спиннера
    Tool: Playwright
    Preconditions: Dev server запущен
    Steps:
      1. Навигация на http://localhost:5173/auth/callback?error=access_denied
      2. Ожидание рендера — `await page.waitForTimeout(500)`
      3. Проверить что текст "access_denied" отображается
      4. Проверить что спиннер НЕ отображается — `await expect(page.locator('svg.animate-spin')).toHaveCount(0)`
      5. Сделать скриншот
    Expected Result: Текст ошибки "access_denied" виден, спиннера нет
    Failure Indicators: Спиннер крутится вечно, текст ошибки не виден
    Evidence: .sisyphus/evidence/task-2-callback-error-param.png

  Scenario: Отсутствие code параметра показывает ошибку без зависания спиннера
    Tool: Playwright
    Preconditions: Dev server запущен
    Steps:
      1. Навигация на http://localhost:5173/auth/callback (без параметров)
      2. Ожидание рендера — `await page.waitForTimeout(500)`
      3. Проверить что текст "Incorrect code" отображается
      4. Проверить что спиннер НЕ отображается
      5. Сделать скриншот
    Expected Result: Текст "Incorrect code" виден, спиннера нет
    Failure Indicators: Спиннер крутится вечно
    Evidence: .sisyphus/evidence/task-2-callback-no-code.png
  ```

  **Evidence to Capture:**
  - [x] task-2-callback-loading.png — спиннер на callback странице
  - [x] task-2-callback-error.png — ошибка после неудачного запроса
  - [x] task-2-callback-error-param.png — ошибка из URL параметра
  - [x] task-2-callback-no-code.png — ошибка при отсутствии code

  **Commit**: YES
  - Message: `feat: add loading spinner to auth callback page`
  - Files: `frontend/src/pages/auth/AuthCallback.vue`
  - Pre-commit: `bun build && bun lint`

---

## Final Verification Wave

> 2 review tasks run in PARALLEL. Both must pass.

- [x] F1. **Build & Lint Verification** — `quick`
  Run `bun build` and `bun lint` from project root. Both must pass with zero errors/warnings on modified files. Also run `lsp_diagnostics` on both modified files.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Types [PASS/FAIL] | VERDICT`

- [x] F2. **Visual QA** — `quick` (+ `playwright` skill)
  Start dev server, test both loading states visually:
  1. Intercept `/api/auth/twitch` route with pending delay (`await new Promise(() => {})`) → navigate to app logged out → trigger click on "Логин" (fire-and-forget, no await navigation) → verify spinner appears on button and button is disabled → screenshot
  2. Navigate to `/auth/callback?code=test` → verify spinner is shown → verify error displays after API fails
  3. Navigate to `/auth/callback?error=access_denied` → verify error is shown (no infinite spinner)
  Screenshot evidence for each scenario.
  Output: `Scenarios [N/N pass] | VERDICT`

---

## Commit Strategy

- **Commit 1**: `feat: add loading state to login button during Twitch redirect` — `frontend/src/components/form/LoginForm.vue` — `bun build && bun lint`
- **Commit 2**: `feat: add loading spinner to auth callback page` — `frontend/src/pages/auth/AuthCallback.vue` — `bun build && bun lint`

---

## Success Criteria

### Verification Commands
```bash
bun build       # Expected: zero errors
bun lint        # Expected: zero new warnings
```

### Final Checklist
- [x] Кнопка "Логин" показывает Loader2Icon спиннер при нажатии
- [x] Кнопка disabled во время loading (блокирует повторные клики)
- [x] AuthCallback показывает центрированный спиннер во время загрузки
- [x] AuthCallback корректно показывает ошибку после загрузки
- [x] Early return paths (loginError, incorrect code) не оставляют спиннер навсегда
- [x] Нет новых зависимостей
- [x] Изменены ровно 2 файла
