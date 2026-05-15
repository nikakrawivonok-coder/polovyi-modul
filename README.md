# Польовий Модуль — V19.18 First Architecture Cleanup

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
<link rel="stylesheet" href="./styles.css?v=19632">
<script src="./app.js?v=19632"></script>
```

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19632&gmKey=zona-master&v=19632`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19632&player=fox&v=19632`

## Що перевірити

1. Додаток відкривається і показує `V19.18 · 19632`.
2. 1 патрон — без розкриття.
3. 2 патрони + 0 влучань — розкриття `-1`.
4. 3 патрони — розкриття `-2`, віддача прогресує.
5. Гравець бачить Захист цілі, але не бачить HP ворога.
6. Журнал не показує старий технічний бойовий запис.
