# Польовий Модуль — V19.8.3 Cache Bust + Collapse Fix

Ця версія виправляє ситуацію, коли Telegram/iPhone міг підтягувати старий `app.js` з кешу, тому V19.8.2 виглядала так, ніби нічого не змінилося.

## Головне виправлення

В `index.html` тепер файли підключаються з cache-busting:

```html
<link rel="stylesheet" href="./styles.css?v=1983">
<script src="./app.js?v=1983"></script>
```

## Також збережено виправлення V19.8.2

У вкладці `Майстер → Гравці`:

- секції не мають виглядати як світлі сірі кнопки;
- усі секції за замовчуванням згорнуті;
- бойові поля сховані всередині `Бойові налаштування`;
- поля зброї сховані всередині `Зброя`;
- характеристики сховані всередині `Характеристики`;
- тап по заголовку секції розгортає / згортає її.

## Що не змінювалося

Не змінювалися Firebase, бойова математика, вороги, Оточення, інтерфейс гравця і Command Core.

## Файли для GitHub

Заміни / додай усі файли:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `ROADMAP.md`

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test1983&gmKey=zona-master&v=1983`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test1983&player=fox&v=1983`

Гравець Сірий:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test1983&player=grey&v=1983`
