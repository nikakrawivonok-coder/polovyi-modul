# Польовий Модуль — V19.18.10 Player Journal Visibility Fix

## V19.18.10 — Player Journal Visibility Fix

Cleanup-only build. Бойова математика не змінена. Додано легкий helper `prepareCombatBriefResult(input)`, який нормалізує дані бойового результату перед формуванням role-aware підсумку. Це підготовка до майбутнього повного `Combat Result Object`, без переписування стабільної атаки.


Cleanup-only версія на базі V19.18.5.

## Що зроблено

- додано верхній `CODE MAP` в `app.js`;
- додано великі секційні маркери для `DATA DEFAULTS`, `ENEMY TEMPLATES`, `RENDER PIPELINE`, `JOURNAL`, `COMBAT`, `EVENT HANDLERS`;
- підписано активний шлях бойового підсумку:
  - `setCombatBrief(...)`;
  - `addCombatBriefToJournal(...)`;
  - `showCombatBriefToastForCurrentRole(...)`;
- підписано місце, де застосовуються правила recoil/exposure;
- бойову математику не змінено.

## Активний бойовий шлях

```text
resolve shot
→ updateShooterAfterShot(...)
→ setCombatBrief(...)
→ addCombatBriefToJournal(...)
→ showCombatBriefToastForCurrentRole(...)
```

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19642">
<script src="./app.js?v=19642"></script>
```

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19642&gmKey=zona-master&v=19642`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19642&player=fox&v=19642`

## Перевірка

```text
node --check app.js
```

Синтаксичних помилок немає.

## V19.18.10

Cleanup-only pass:
- aligned journal helper section markers;
- documented the combat summary contract;
- fixed the standard for test links: use `v=BUILD&hard=BUILD`;
- combat math unchanged.