# Польовий Модуль — V19.9 Enemy Templates

Версія на основі стабільної V19.8.5.

## Головна зміна

У вкладці **Майстер → Вороги** додано блок **Шаблони ворогів**.

Шаблон створює звичайного ворога у списку ворогів сцени.

## Додані шаблони

### Люди

- Боягуз
- Бандит
- Бандит з обрізом
- Автоматник
- Ватажок
- Засадник
- Добивач
- Озброєний NPC

### Мутанти

- Сліпий пес
- Псевдособака
- Тушкан

## Що не змінювалося

Не змінювалися:

- Firebase-архітектура;
- бойова математика;
- Оточення;
- інтерфейс гравця;
- Command Core;
- логіка пострілу.

## Cache busting

В `index.html`:

```html
<link rel="stylesheet" href="./styles.css?v=199">
<script src="./app.js?v=199"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test199&gmKey=zona-master&v=199`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test199&player=fox&v=199`

Гравець Сірий:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test199&player=grey&v=199`
