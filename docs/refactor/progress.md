# Журнал раундов

Формат записи:

```
## Раунд N — YYYY-MM-DD
- Батчи: <ids> (<commit-ссылки>)
- Изменено: <файлы/модули>
- Удалено: <что и почему>
- Проверки: lint/format/typecheck/unit/integration/e2e
- Ревью: <агент>, вердикт
- Защита от регрессии: <тест/lint/тип>
- Осталось/дальше: <следующие кандидаты>
```

## Раунд 0 — 2026-11-28: рекон

- Ветка `chore/code-cleanup` от `master` @ `e73dcfb`.
- Baseline: typecheck зелёный, format зелёный, lint — 1 warning (`wordle.ts:247`,
  dangling `_`).
- Baseline тестов: backend unit 646 pass / 0 fail (79 файлов, 36k expect), frontend unit
  126 pass / 0 fail (21 файл). Интеграционные (Postgres) и e2e (Playwright) пока не
  поднимались — нужны infra/e2e-стенды.
- PR: [#264](https://github.com/le-xot/games-movies-database/pull/264) (draft, `chore/code-cleanup` → `master`).
- Собраны карты: backend, frontend, contract/data/config, hygiene.
- Пул задач сформирован: см. [tasks.md](tasks.md).

## Раунд 1 — 2026-11-28: рекон + батч 1

- **Рекон** (4 параллельных агента): `maps/backend.md` (17 находок), `maps/frontend.md` (19),
  `maps/contract-data-config.md` (16), `maps/hygiene.md` (сводка). Пул задач собран в `tasks.md`.
- **Батч 1** (`dc2c1a0`): удалён мёртвый CSS-токен `--n-action-color` (20 вхождений / 13 файлов),
  удалены 7 feature-баррелей без потребителей, `BadgeSelect` схлопнут в `BadgePopover`,
  `wordleModels_` → `wordleRouteModels` (baseline-warning oxlint снят).
- **Независимое ревью** (`review-batch1`, свежий контекст, `reviews/batch-01.md`): **CHANGES REQUIRED**
  — один docs-блокер: правило о баррелях в `frontend/src/AGENTS.md` было сформулировано неверно
  (`components/{form,account,palette}` импортируются через баррели). Исправлено follow-up коммитом.
  Код проверен: 0 остатков токена/имён, замена `BadgePopover` точная, build зелёный.
- **Уточнение к коммиту**: `cn()` — это `twMerge`, поэтому `bg-[var(--n-action-color)]` вытеснял
  `bg-card` у `Card`; эквивалентность держится на `--card == --background` в обеих темах и
  dark-only окружении, а не на «Card и так несёт `bg-card`». Формулировка в сообщении коммита неточная,
  исправлена здесь.
- **Проверки батча 1**: `bun lint` 0 warnings, `bun typecheck` зелёный, backend 646 pass / frontend
  126 pass, `frontend` vite build зелёный; в собранном CSS `--n-action-color` отсутствует.
- **Дальше**: батч 2 — удаление мёртвого Nest-наследия (B-02), затем B-04 (ошибки) и guard-тесты.
