# Польовий Модуль — V19.18.2 Journal Render Helper Cleanup

## V19.18.2 — Dead RollResult Cleanup

Малий cleanup-підхід після V19.18. Бойова математика не змінювалась.

- повністю прибрано прихований legacy-блок `#rollResult` з HTML;
- прибрано `clearStateRollResult()` і залишкові виклики очищення старої панелі;
- `showRollToast()` позначено як utility-only toast для неосновних перевірок, наприклад усунення клину;
- бойові атаки й надалі використовують `setCombatBrief(...)`, `addCombatBriefToJournal(...)`, `showCombatBriefToastForCurrentRole(...)`;
- оновлено cache-busting до `19634`.


Малий архітектурний cleanup на базі стабільної гілки V19.17.13.1 / V19.17.12.

## Що зроблено

- Бойова математика не змінювалася.
- Прибрано legacy-шлях `staticShotResultLines(...)`, який формував старий прихований бойовий текст для `rollResult`.
- Прибрано legacy-виклики `setStaticRollResult(...)`; короткий бойовий підсумок тепер іде через `setCombatBrief(...)`.
- Прибрано старий невикористаний formatter `damageRollsTextForStatic(...)`.
- У `app.js` додано логічні секції:
  - `COMBAT: recoil / exposure helpers`;
  - `COMBAT: result text / role-aware summary`.
- Поточне джерело короткого бойового тексту: `setCombatBrief(...)` + `addCombatBriefToJournal(...)` + `showCombatBriefToastForCurrentRole(...)`.

## Що не змінювалося

- правила 1 / 2 / 3 патрони;
- віддача `-2 / -4 / -6`;
- розкриття після пострілів;
- укриття `+2` до Захисту цілі;
- `-1` до точності при черзі по цілі в укритті;
- privacy HP ворогів;
- шаблони ворогів;
- Firebase-схема.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19634">
<script src="./app.js?v=19634"></script>
```

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19634&gmKey=zona-master&v=19634`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19634&player=fox&v=19634`

## Що перевірити

1. Додаток відкривається і показує `V19.18 · 19632`.
2. 1 патрон — без розкриття.
3. 2 патрони + 0 влучань — розкриття `-1`.
4. 3 патрони — розкриття `-2`, віддача прогресує.
5. Гравець бачить Захист цілі, але не бачить HP ворога.
6. Журнал не показує старий технічний бойовий запис.

## V19.18.2 — Journal Render Helper Cleanup

- Логіку видимості журналу винесено в `isJournalEntryVisibleForCurrentRole()` та `visibleJournalEntriesForCurrentRole()`.
- Inline-фільтр журналу в `render()` замінено на один контрольований виклик.
- Старі технічні бойові записи й далі приховуються централізовано.
- Бойова математика не змінювалась.
