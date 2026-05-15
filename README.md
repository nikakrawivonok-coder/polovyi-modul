# Польовий Модуль — V19.18.5 Journal Clear Button Fix

Hotfix на базі V19.18.4.

## Що виправлено

- Відновлено роботу кнопки `Очистити журнал`.
- Для Майстра кнопка очищає журнал усієї кімнати після підтвердження.
- Для гравця кнопка очищає журнал тільки локально на цьому пристрої: нові записи будуть з’являтися далі, а спільний журнал кімнати не видаляється для Майстра та інших гравців.
- Кнопка `Сигнал модуля` не повернута.
- Бойова математика не змінювалась.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19637">
<script src="./app.js?v=19637"></script>
```

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19637&gmKey=zona-master&v=19637`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19637&player=fox&v=19637`
