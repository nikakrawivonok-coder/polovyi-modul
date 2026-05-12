# Польовий Модуль — V19.12.1 Damage Dice Transparency Patch

Точкова правка на базі V19.12 Final Combat UI Polish.

## Що змінено

У нижньому інформативному блоці вкладки `Стан` після пострілу під рядком:

```text
Шкода зброї: 12 (АКС-74У · здалека · 1d6)
```

додано рядок із фактичними значеннями кубиків шкоди:

```text
Випало: 3, 4
```

Якщо була критична шкода:

```text
Випало: 3, 4 +3 за крит. шкоду
```

## Що не змінювалося

Не змінювалися:

- механіка шкоди;
- формули шкоди;
- критична шкода;
- popup / спливаюче повідомлення;
- інтерфейс;
- Firebase-структура;
- логіка `Хід / Ціль`;
- списання набоїв;
- журнал;
- бойова панель.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19201">
<script src="./app.js?v=19201"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19201&gmKey=zona-master&v=19201`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19201&player=fox&v=19201`
