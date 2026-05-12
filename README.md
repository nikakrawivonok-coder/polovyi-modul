# Польовий Модуль — V19.10.2 Journal Quick Notes

Версія на основі V19.10.1 / V19.10.

## Головна зміна

У вкладці **Журнал** додано швидкий блок запису для Майстра.

Майстер може прямо з журналу:

- написати публічний запис для всіх;
- написати запис тільки для Майстра;
- написати приватне повідомлення конкретному гравцю.

## Поведінка

- `Написати всім` створює запис `public`.
- `Тільки Майстру` створює запис `gm`.
- `Приватно гравцю` створює запис `private` з `targetPlayerId`.
- Гравці бачать публічні записи і свої приватні записи.
- Гравці не бачать записи `Тільки Майстру`.
- Майстер бачить усі записи.

## Що не змінювалося

Не змінювалися:

- бойова математика;
- атаки ворогів;
- Firebase-архітектура;
- шаблони ворогів;
- Оточення;
- нижня навігація;
- Command Core.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19102">
<script src="./app.js?v=19102"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19102&gmKey=zona-master&v=19102`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19102&player=fox&v=19102`

Гравець Сірий:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19102&player=grey&v=19102`
