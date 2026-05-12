# Польовий Модуль — V19.11.1 GM Combat Fixed Bar Fix

Фікс після V19.11.

## Що було не так

У V19.11 бойова панель була зроблена як `position: sticky` і розміщена внизу HTML-документа. Через це вона могла не бути видимою на першому екрані й з’являтися лише після скролу.

## Що виправлено

Панель Майстра тепер:

- `position: fixed`;
- постійно знаходиться над нижньою навігацією;
- створюється через `app.js`, якщо її немає в HTML;
- показується тільки для `role=gm`;
- приховується для `role=player`.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19111">
<script src="./app.js?v=19111"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19111&gmKey=zona-master&v=19111`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19111&player=fox&v=19111`
