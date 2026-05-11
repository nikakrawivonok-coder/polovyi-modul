# Польовий Модуль — V19.8.5 Hide GM Tab For Players

Версія на основі робочої V19.8.4.

## Головна зміна

У режимі `role=player` нижня вкладка **Майстер** більше не має відображатися.

Для `role=gm` вкладка **Майстер** лишається на нижній панелі.

## Додатковий захист

Додано два рівні захисту:

1. CSS:
   - `body.role-player .gm-only { display:none !important; }`
   - нижня панель гравця перебудовується на 4 вкладки.

2. JS:
   - якщо гравець якимось чином натисне/відкриє `master`, система поверне його на `Стан`.

## Що не змінювалося

Не змінювалися:

- Firebase;
- бойова математика;
- вороги;
- Оточення;
- інтерфейс Майстра;
- редактор гравців;
- Command Core.

## Cache busting

В `index.html`:

```html
<link rel="stylesheet" href="./styles.css?v=1985">
<script src="./app.js?v=1985"></script>
```

## Файли для GitHub

Заміни / додай усі файли:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `ROADMAP.md`

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test1985&gmKey=zona-master&v=1985`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test1985&player=fox&v=1985`

Гравець Сірий:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test1985&player=grey&v=1985`
