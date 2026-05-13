# Польовий Модуль — V19.15.10 Screen Isolation Fix

Версія на базі V19.15.9.

## Що виправлено

У V19.15.9 дубльований блок `Вороги` зі вкладки `Стан` було прибрано, але в акаунті Майстра могла візуально під'їжджати наступна нижня вкладка `Вороги`.

Причина: це вже була не стара секція `stateEnemies`, а окремий екран нижньої навігації `data-screen="enemies"`, який міг візуально сприйматися як продовження `Стану`.

## Що зроблено

Додано жорстку ізоляцію екранів:

```text
активний screen показується;
усі інші screen отримують hidden + display:none;
CSS дублює захист через .screen:not(.active).
```

## Що не змінювалося

Не змінювалися:

- бойова математика;
- віддача;
- шкода;
- крит;
- журнал;
- Firebase-структура;
- бойова панель;
- шаблони ворогів;
- сама нижня вкладка Вороги.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19510">
<script src="./app.js?v=19510"></script>
```

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19510&gmKey=zona-master&v=19510`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19510&player=fox&v=19510`
