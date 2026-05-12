# Польовий Модуль — V19.11.10 Enemy Weapon Key Audit Fix

Контрольний фікс після V19.11.9.

## Що виправлено

Після статичного тестування V19.11.9 знайдено потенційну проблему: не всі ключі зброї ворогів розпізнавалися однаково надійно.

Тепер `enemyWeaponKey(enemy)` чітко розпізнає:

- `pm`, `ПМ`, `пістолет` → ПМ;
- `obrez`, `обріз`, `shotgun` → обріз;
- `doublebarrel`, `двостволка` → двостволка;
- `aks74u`, `АКС-74У`, `АКС`, `автомат` → АКС-74У;
- `ak74`, `АК-74` → АК-74;
- `grenade`, `граната` → граната.

## Що не змінювалося

Не змінювалися:

- логіка `Хід / Ціль`;
- застосування шкоди;
- списання набоїв;
- Firebase;
- журнал;
- player-посилання;
- розташування бойової панелі.

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19120">
<script src="./app.js?v=19120"></script>
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
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19120&gmKey=zona-master&v=19120`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19120&player=fox&v=19120`
