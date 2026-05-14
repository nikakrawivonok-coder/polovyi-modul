# Польовий Модуль — V19.16.6 Enemy Loot Polish / Target Player Select

Версія на базі V19.16.5.

## Що додано

- Додано `DATA_SCHEMA.md`.
- У картці ворога Майстра додано вибір гравця: `Кому передати`.
- `Передати лут`, `Передати набої`, `Передати все` працюють для обраного гравця.
- Додано позначки `Лут передано` / `Лут ще не передано`.
- Додано позначки `Набої передано` / `Набої ще не передано`.

## Що не змінювалося

Не змінювалися:

- бойова математика;
- віддача;
- шкода;
- крит;
- Firebase-структура;
- вкладка Стан;
- видимі цілі;
- шаблон Автоматника як бойова модель.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19606">
<script src="./app.js?v=19606"></script>
```

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19606&gmKey=zona-master&v=19606`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19606&player=fox&v=19606`
