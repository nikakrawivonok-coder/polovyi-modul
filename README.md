# Польовий Модуль — V19.10.6 Player Link Copy Full Audit

Контрольна версія після V19.10.5.

## Що перевірено й виправлено

Усі player-link кнопки мають працювати через один шлях:

```text
playerSpecificUrl(pid) → copyTextToClipboard(url)
```

Додатково виправлено стару кнопку:

- `Скопіювати посилання поточного Гравця`

Вона теж тепер використовує `copyTextToClipboard()` і `playerSpecificUrl(pid)`.

## Формат player-посилання

```text
?role=player&room=ROOM&player=PLAYER_ID&v=19106
```

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19106">
<script src="./app.js?v=19106"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19106&gmKey=zona-master&v=19106`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19106&player=fox&v=19106`
