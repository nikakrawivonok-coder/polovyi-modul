# Польовий Модуль — V19.11.6 GM Combat Action Override

Версія на основі V19.11.5.

## Головна причина фіксу

Старі кнопки пострілу `[data-action]` все ще могли проходити через стару `doAction()` і брати `currentPlayer()` зі старої вкладки Майстра.

Через це:

- набої могли списуватися з активного гравця у вкладці Майстра;
- не з того персонажа, який обраний у новій бойовій панелі як `Хід`;
- вороги могли не атакувати гравців через стару маршрутизацію.

## Що виправлено

Для Майстра тепер є примусовий перехоплювач:

```text
gmCombatActionOverride(action)
```

Якщо роль `gm` і натиснуто кнопку пострілу:

- стара `doAction()` не запускається;
- стрілець береться тільки з `Хід`;
- ціль береться тільки з `Ціль`.

## Підтримано

- гравець → ворог;
- ворог → гравець.

## Заблоковано до окремої реалізації

- гравець → гравець;
- ворог → ворог.

## Панель

Панель ще трохи опущена нижче:

- було `bottom: 70px`;
- стало `bottom: 64px`.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19116">
<script src="./app.js?v=19116"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19116&gmKey=zona-master&v=19116`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19116&player=fox&v=19116`
