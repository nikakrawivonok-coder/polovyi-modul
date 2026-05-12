# Польовий Модуль — V19.10.4 Player Links Access Fix

Версія виправляє проблеми з посиланнями на окремих гравців і доступом у режимі гравця.

## Що виправлено

- Усі посилання на гравців формуються через одну функцію:
  `?role=player&room=ROOM&player=PLAYER_ID&v=19104`
- Player-link більше не містить `role=gm` або `gmKey=zona-master`.
- Кнопки `Скопіювати: Лис`, `Скопіювати: 1`, `Скопіювати: ...` тепер копіюють відповідний player-link.
- Для `role=player` додано посилений захист:
  - вкладка `Майстер` ховається;
  - екран `Майстер` ховається;
  - записи журналу `Тільки Майстру` не показуються;
  - приватні записи показуються тільки адресованому гравцю.

## Правильні формати

Посилання Майстра:
`?role=gm&room=...&gmKey=zona-master&v=19104`

Посилання гравця:
`?role=player&room=...&player=ID_ГРАВЦЯ&v=19104`

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19104">
<script src="./app.js?v=19104"></script>
```

## Файли для GitHub

Заміни всі 5 файлів:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `ROADMAP.md`

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19104&gmKey=zona-master&v=19104`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19104&player=fox&v=19104`
