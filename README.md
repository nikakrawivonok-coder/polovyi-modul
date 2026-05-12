# Польовий Модуль — V19.10.3 Journal Dynamic Fix

Версія виправляє ситуацію, коли у вкладці **Журнал** не з’явився блок швидкого запису Майстра.

## Причина

У V19.10.2 блок був доданий у `index.html`. Якщо GitHub/Telegram/Safari показує стару HTML-розмітку або якщо на GitHub не було замінено `index.html`, кнопки не з’являються, навіть якщо логіка в `app.js` уже є.

## Виправлення

Тепер блок швидкого запису:

1. Є в `index.html`.
2. Додатково створюється самим `app.js`, якщо його немає в HTML.

Це страховка від кешу або неповної заміни файлів.

## Функції журналу

Майстер у вкладці `Журнал` може:

- написати всім;
- написати тільки Майстру;
- написати приватно конкретному гравцю.

Гравці бачать:

- публічні записи;
- тільки свої приватні записи.

## Важливо про посилання гравців

Посилання Майстра має формат:

```text
?role=gm&room=...&gmKey=zona-master&v=...
```

Посилання гравця має формат:

```text
?role=player&room=...&player=ID_ГРАВЦЯ&v=...
```

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19103">
<script src="./app.js?v=19103"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19103&gmKey=zona-master&v=19103`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19103&player=fox&v=19103`
