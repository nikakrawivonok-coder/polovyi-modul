# Польовий Модуль — V19.18.6 Code Map + Combat Readability Pass

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
<link rel="stylesheet" href="./styles.css?v=19638">
<script src="./app.js?v=19638"></script>
```

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19638&gmKey=zona-master&v=19638`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19638&player=fox&v=19638`

## Перевірка

```text
node --check app.js
```

Синтаксичних помилок немає.
