# Польовий Модуль — V19.15.8 Brief Newline Sanitizer

Версія на базі V19.15.7.

## Що виправлено

У короткому підсумку `Остання дія` для Майстра могли відображатися буквальні символи:

```text
\n
```

Причина: частина старих записів `lastBrief` могла залишитися в Firebase/кімнаті після попередніх версій, де переноси рядків записувалися як текстові `\n`.

## Що зроблено

Додано безпечний форматер:

```text
formatBriefHtml()
```

Він перетворює на нормальні переноси рядків:

```text
реальні переноси
\n
\\n
```

## Що не змінювалося

Не змінювалися:

- бойова математика;
- віддача;
- шкода;
- крит;
- Firebase-структура;
- бойова панель;
- картки ворогів;
- шаблони ворогів.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19508">
<script src="./app.js?v=19508"></script>
```

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19508&gmKey=zona-master&v=19508`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19508&player=fox&v=19508`
