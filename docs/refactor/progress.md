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
- Собраны карты: backend, frontend, contract/data/config, hygiene.
- Пул задач сформирован: см. [tasks.md](tasks.md).
