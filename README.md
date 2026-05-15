# Польовий Модуль — V19.18.12 Documentation Consistency Pass

Це документаційний checkpoint після V19.18.11.

## Важливо

У цій версії не планувались runtime-зміни логіки. Оновлено build/cache і документацію, щоб зафіксувати поточні правила та порядок подальшої перевірки.

## Поточна стабільна база перед цим checkpoint

Остання повністю підтверджена стабільна версія: `V19.18.10 — Player Journal Visibility Fix`, build/cache `19642`.

`V19.18.11` і `V19.18.12` — cleanup/documentation candidates, які треба перевірити перед подальшим рухом.

## Locked Combat Rules

- 1 патрон: `+2` до точності, без розкриття.
- 2 патрони: `-1` до точності; розкриття `-1 Захист` тільки якщо `0` влучань.
- 3 патрони / черга: `-2 / -4 / -6...` за черги поспіль; розкриття `-2 Захист` після кожної черги.
- Постріл 1 або 2 патронами скидає лічильник черг.
- Укриття цілі: `+2` до ефективного Захисту цілі.
- Черга по цілі в укритті: додатково `-1` до точності стрільця.
- Гравець бачить Захист цілі та пояснення модифікаторів.
- Гравець не бачить точні HP ворога.
- Майстер бачить усе.

## Обов’язковий тест перед подальшим розвитком

1. Відкрити Майстра і Гравця.
2. Перевірити, що відображається `V19.18.12 · 19644`.
3. Перевірити 1 патрон: немає розкриття.
4. Перевірити 2 патрони з 0 влучань: є розкриття `-1`.
5. Перевірити 2 патрони з 1+ влучанням: розкриття немає.
6. Перевірити 3 патрони: є розкриття `-2`.
7. Перевірити прогресію черги: `-2 / -4 / -6`.
8. Перевірити ціль в укритті: Захист цілі має `+2`, черга по укриттю має ще `-1` до точності.
9. Перевірити, що гравець не бачить HP ворога в `Останній дії` і `Журналі`.
10. Перевірити, що Майстер бачить HP ворога.
11. Перевірити `Очистити журнал` у Майстра.
12. Перевірити `Очистити журнал` у гравця.
13. Перевірити, що кнопка `Сигнал модуля` не повернулась.

## Cache-busting

```html
<link rel="stylesheet" href="./styles.css?v=19644">
<script src="./app.js?v=19644"></script>
```


---

## Попередні нотатки / archive


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

## V19.18.11 — Code Readability Baseline

База: стабільна `V19.18.10`, а не відкинута гілка з дублюванням тестових посилань.

Зміни:
- додано верхню карту `app.js`;
- додано секційні маркери для journal/combat/event handlers;
- додано contract-коментарі біля бойових функцій;
- бойова математика, журнал, privacy HP і Firebase-схема не змінювались.

Cache-busting:
```html
<link rel="stylesheet" href="./styles.css?v=19643">
<script src="./app.js?v=19643"></script>
```
