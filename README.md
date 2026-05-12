# Польовий Модуль — V19.11.2 GM Combat Docked Bar Polish

Фікс-поліш після V19.11.1.

## Що виправлено

Панель бою Майстра більше не виглядає як велика окрема картка посеред екрана.

Тепер це компактна docked-панель:

- прикріплена до нижньої навігації;
- виглядає як додатковий тонкий ряд керування;
- займає менше висоти;
- містить кнопку наступного ходу;
- містить активного учасника;
- містить компактну горизонтальну чергу.

## Що вже працювало і лишилося

- для гравця панель не показується;
- тап по учаснику робить його активним;
- кнопка запускає початок/наступний хід.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19112">
<script src="./app.js?v=19112"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19112&gmKey=zona-master&v=19112`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19112&player=fox&v=19112`
