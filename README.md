# Польовий Модуль — V19.16.3 Enemy HP Control Runtime Fix

Версія на базі V19.16.2.

## Що виправлено

У V19.16.2 кнопки HP могли виглядати так, ніби не працюють одразу.

Причина:

```text
HP у data змінювався,
але після цього код викликав updateEnemyStateByHp(enemy),
а цієї функції не було визначено.
```

Через це виконання зупинялося до `save()` і `render()`.

Коли потім натискалися кнопки набоїв, вони запускали новий render, і накопичені HP-зміни ставали видимими.

## Що зроблено

Додано відсутню функцію:

```text
updateEnemyStateByHp(enemy)
```

Вона оновлює стан ворога за HP:

```text
0 HP = вибув
<= 30% HP = ледь стоїть
менше максимуму = поранений
повний HP = цілий
```

## Що не змінювалося

Не змінювалися:

- бойова математика;
- віддача;
- шкода;
- крит;
- журнал;
- Firebase-структура;
- вкладка Стан;
- видимі цілі;
- шаблон Автоматника.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19603">
<script src="./app.js?v=19603"></script>
```

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19603&gmKey=zona-master&v=19603`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19603&player=fox&v=19603`
