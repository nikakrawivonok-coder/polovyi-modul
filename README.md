# Польовий Модуль — V19.11 GM Combat Sticky Bar MVP

Версія на основі стабільної V19.10.6.

## Головна зміна

Додано тонку sticky-панель бою тільки для Майстра, щоб зменшити скрол під час живої сцени.

## Що є в MVP

- показ активного учасника;
- показ раунду;
- кнопка `Наступний хід` / `Почати бій`;
- компактна горизонтальна черга учасників;
- тап по учаснику в черзі робить його активним;
- якщо обрано гравця — він стає активним гравцем Майстра;
- якщо обрано ворога — він стає активною ціллю/ворогом.

## Що не змінювалося

Не змінювалися бойова математика, атаки ворогів, журнал, player-посилання, Firebase-архітектура, шаблони ворогів та інтерфейс гравця.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=1911">
<script src="./app.js?v=1911"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test1911&gmKey=zona-master&v=1911`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test1911&player=fox&v=1911`
