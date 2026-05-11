# Польовий Модуль — V19.8.4 Remove Legacy Current Player Panel

Версія на основі робочої V19.8.3.

## Головна зміна

З вкладки **Майстер** прибрано старий дубльований блок:

- `Стан поточного персонажа`

Він дублював:

- верхню Панель Майстра;
- вкладку `Майстер → Гравці`;
- швидке керування активним гравцем.

## Що залишилося

Редагування гравців тепер має бути тільки у двох місцях:

1. **Верхня Панель Майстра** — швидкі зміни під час гри.
2. **Майстер → Гравці** — компактний редактор із розгортними секціями.

## Що не змінювалося

Не змінювалися:

- Firebase;
- бойова математика;
- вороги;
- Оточення;
- інтерфейс гравця;
- Command Core;
- Майстер → Гравці.

## Cache busting

В `index.html`:

```html
<link rel="stylesheet" href="./styles.css?v=1984">
<script src="./app.js?v=1984"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test1984&gmKey=zona-master&v=1984`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test1984&player=fox&v=1984`

Гравець Сірий:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test1984&player=grey&v=1984`
