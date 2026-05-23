# Польовий Модуль — V19.29 Global Button/Menu Audit

Це глобальніший UX/QА checkpoint у напрямку Button & Menu Close Audit.

## Важливо

У цій версії quick-panels переведено на централізоване керування, а Test Harness отримав аудит кнопок, навігації й toggle-меню.

## Поточна стабільна база перед цим checkpoint

Остання підтверджена стабільна база: `V19.28.4 — Screen Switch Close Polish`, build/cache `19672`.

Не використовувати експериментальні `V19.26.x` як основу для цього напряму, бо там була проблемна гілка з Debug snapshot.

## Locked Combat Rules

- 1 патрон: `+2` до точності, без розкриття.
- 2 патрони: `-1` до точності; розкриття `-1 Захист` тільки якщо `0` влучань.
- 3 патрони / черга: `-2 / -4 / -6...` за черги поспіль; розкриття `-2 Захист` після кожної черги.
- Постріл 1 або 2 патронами скидає лічильник черг.
- Укриття цілі: `+2` до ефективного Захисту цілі.
- Черга по цілі в укритті: додатково `-1` до точності стрільця.
- Гравець бачить Захист цілі та пояснення модифікаторів.
- Гравець не бачить точні HP ворога.
- Майстер бачить усе.

## Обов’язковий тест перед подальшим розвитком

1. Відкрити Майстра і Гравця.
2. Перевірити, що відображається `V19.29 · 19673`.
3. Перевірити 1 патрон: немає розкриття.
4. Перевірити 2 патрони з 0 влучань: є розкриття `-1`.
5. Перевірити 2 патрони з 1+ влучанням: розкриття немає.
6. Перевірити 3 патрони: є розкриття `-2`.
7. Перевірити прогресію черги: `-2 / -4 / -6`.
8. Перевірити ціль в укритті: Захист цілі має `+2`, черга по укриттю має ще `-1` до точності.
9. Перевірити, що гравець не бачить HP ворога в `Останній дії` і `Журналі`.
10. Перевірити, що Майстер бачить HP ворога.
11. Перевірити `Очистити журнал` у Майстра.
12. Перевірити `Очистити журнал` у гравця.
13. Перевірити, що кнопка `Сигнал модуля` не повернулась.

## Cache-busting

```html
<link rel="stylesheet" href="./styles.css?v=19673">
<script src="./app.js?v=19673"></script>
```


---

## Попередні нотатки / archive

## V19.29 — Global Button/Menu Audit

Глобальніший UX/QА checkpoint для Button & Menu Close Audit.

Що додано:

- build/cache оновлено до `19673`;
- quick-panels тепер керуються централізовано через `setQuickPanelOpen()` і `toggleQuickPanel()`;
- одночасно може бути відкритий тільки один quick-panel;
- клік поза quick-panel закриває відкриту quick-panel;
- quick-panels отримали явні кнопки закриття `×`;
- toggle-кнопки quick-panels отримали `aria-controls` і автоматичний `aria-expanded`;
- Test Harness отримав `runButtonMenuAuditTests()`;
- аудит перевіряє nav targets, `data-open`, `data-toggle-panel`, close-кнопки quick-panels, aria-state і exclusive-open поведінку.

Що не змінювалось:

- бойова математика 1/2/3 патрони;
- `activeWeapon` / `inventory.damage`;
- інвентарі;
- редактор ворогів як структура даних;
- журнал і privacy HP;
- Firebase-схема.

## V19.28.4 — Screen Switch Close Polish

UX/QА checkpoint для майбутнього Button & Menu Close Audit.

Що додано:

- build/cache оновлено до `19672`;
- перехід між вкладками закриває тимчасові lightweight-панелі та швидкі quick-panels;
- Escape закриває `toast`, службові звіти, `Debug snapshot`, quick-panels і відкриті `<details>` у поточній вкладці;
- Escape також згортає компактні секції редактора гравця, якщо користувач не редагує поле;
- захист введення збережено: `input`, `textarea`, `select` і `contenteditable` не втрачають фокус від Escape-close;
- Test Harness розширено перевірками quick-panels і відкритих `<details>`.

Що не змінювалось:

- бойова математика 1/2/3 патрони;
- `activeWeapon` / `inventory.damage`;
- інвентарі;
- редактор ворогів як структура даних;
- журнал і privacy HP;
- Firebase-схема.

## V19.28.3 — Lightweight Close Controls

UX/QА checkpoint для майбутнього Button & Menu Close Audit.

Що додано:

- build/cache оновлено до `19671`;
- `toast` можна закрити кліком або клавішею Escape;
- звіти `Self-check` і `Dev Toolkit` отримали явну кнопку `Закрити звіт`;
- Escape закриває `Self-check`, `Dev Toolkit`, `Debug snapshot` і активний `toast`;
- звичайне введення в `input`, `textarea`, `select` і `contenteditable` захищене від випадкового Escape-закриття;
- додано lightweight close тести до внутрішнього Test Harness;
- виправлено старий helper `Debug snapshot`, щоб snapshot знову будувався у Dev Toolkit.

Що не змінювалось:

- бойова математика 1/2/3 патрони;
- `activeWeapon` / `inventory.damage`;
- інвентарі;
- редактор ворогів;
- журнал і privacy HP;
- Firebase-схема.


## V19.18.10 — Player Journal Visibility Fix

Cleanup-only build. Бойова математика не змінена. Додано легкий helper `prepareCombatBriefResult(input)`, який нормалізує дані бойового результату перед формуванням role-aware підсумку. Це підготовка до майбутнього повного `Combat Result Object`, без переписування стабільної атаки.


Cleanup-only версія на базі V19.18.5.

## Що зроблено

- додано верхній `CODE MAP` в `app.js`;
- додано великі секційні маркери для `DATA DEFAULTS`, `ENEMY TEMPLATES`, `RENDER PIPELINE`, `JOURNAL`, `COMBAT`, `EVENT HANDLERS`;
- підписано активний шлях бойового підсумку:
  - `setCombatBrief(...)`;
  - `addCombatBriefToJournal(...)`;
  - `showCombatBriefToastForCurrentRole(...)`;
- підписано місце, де застосовуються правила recoil/exposure;
- бойову математику не змінено.

## Активний бойовий шлях

```text
resolve shot
→ updateShooterAfterShot(...)
→ setCombatBrief(...)
→ addCombatBriefToJournal(...)
→ showCombatBriefToastForCurrentRole(...)
```

## Cache busting

```html
<link rel="stylesheet" href="./styles.css?v=19642">
<script src="./app.js?v=19642"></script>
```

## Тестові посилання

Майстер:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=gm&room=test19642&gmKey=zona-master&v=19642`

Гравець Лис:
`https://nikakrawivonok-coder.github.io/polovyi-modul/?role=player&room=test19642&player=fox&v=19642`

## Перевірка

```text
node --check app.js
```

Синтаксичних помилок немає.

## V19.18.10

Cleanup-only pass:
- aligned journal helper section markers;
- documented the combat summary contract;
- fixed the standard for test links: use `v=BUILD&hard=BUILD`;
- combat math unchanged.

## V19.18.11 — Code Readability Baseline

База: стабільна `V19.18.10`, а не відкинута гілка з дублюванням тестових посилань.

Зміни:
- додано верхню карту `app.js`;
- додано секційні маркери для journal/combat/event handlers;
- додано contract-коментарі біля бойових функцій;
- бойова математика, журнал, privacy HP і Firebase-схема не змінювались.

Cache-busting:
```html
<link rel="stylesheet" href="./styles.css?v=19643">
<script src="./app.js?v=19643"></script>
```


## V19.18.13 — Local Journal Clear Fix

Hotfix для кнопки `У себе` у журналі Майстра.

Виправлено:
- локальне очищення тепер застосовується і для ролі Майстра;
- `У себе` приховує видимі записи тільки на поточному пристрої/ролі;
- записи не видаляються з Firebase;
- нові записи після очищення мають з’являтися знову.

Не змінювалось:
- бойова математика;
- privacy HP ворогів;
- Firebase-схема;
- кнопка `Сигнал модуля` не повернулась.


## V19.18.14 — Moderate Cleanup Journal Helpers

Сміливіший, але контрольований cleanup journal-секції.

Зміни:
- додано контракт для journal clear / visibility;
- винесено запис локально прихованих journal id в `storeHiddenJournalIdsForCurrentRole(...)`;
- `hideCurrentVisibleJournalForCurrentRole(...)` тепер повертає кількість прихованих записів;
- `У себе` показує окремий toast, якщо немає видимих записів для приховування.

Не змінювалось:
- бойова математика;
- privacy HP ворогів;
- Firebase-схема;
- кнопка `Сигнал модуля` не повернулась.


## V19.19 — Enemy Balance + Weapon Inventory Seed

Перший із трьох погоджених кроків до інвентарної логіки зброї.

Зміни:
- `Автоматник`: Захист `9`, HP `10`;
- `Бандит з обрізом`: Захист `10`, HP `10`;
- обом шаблонним ворогам додано `inventory`;
- обом шаблонним ворогам додано `activeWeapon`;
- у Майстра в деталях ворога показується інвентар і активна зброя;
- бойова шкода ще не береться з інвентарю — це буде окремий майбутній крок.

Не змінювалось:
- бойова математика 1/2/3 патрони;
- віддача;
- розкриття;
- укриття;
- privacy HP ворогів;
- Firebase-схема.


## V19.20 — Active Weapon Damage

Об’єднано два погоджені кроки:
- Player Active Weapon Selection;
- Weapon Damage From Active Weapon.

Зміни:
- персонаж має `activeWeapon`;
- зброя в інвентарі може бути активною;
- у швидкому інвентарі гравець може натиснути `Зробити активною`;
- у панелі Майстра можна вибрати активну зброю гравця;
- шкода гравця і ворога береться з активної зброї / inventory.damage;
- якщо активної зброї в інвентарі немає, працює fallback на старе поле `weapon`.

Не змінювалось:
- математика 1/2/3 патрони;
- віддача;
- розкриття;
- укриття;
- privacy HP ворогів.


## V19.21 — Weapon Inventory Management Pack

Все одразу в межах weapon/inventory напряму:
- гравець може додати ПМ / Обріз / АКС-74У у швидкому інвентарі;
- зброю в інвентарі можна зробити активною;
- назву, шкоду і дистанцію зброї гравця можна редагувати прямо в інвентарі;
- Майстер у деталях ворога може додати зброю ворогу;
- Майстер може вибрати активну зброю ворога;
- шкода й надалі береться з activeWeapon / inventory.damage з fallback на старе поле weapon.

Не змінювалось:
- бойова математика 1/2/3 патрони;
- віддача;
- розкриття;
- укриття;
- privacy HP ворогів.


## V19.21.1 — GM Inventory Authority Fix

Hotfix після тесту V19.21.

Виправлено:
- гравець більше не може сам додавати зброю;
- гравець більше не може редагувати назву/шкоду/дистанцію зброї;
- гравець може тільки зробити активною вже видану зброю;
- інвентар гравця у вкладці Стан отримав внутрішній скрол;
- Майстер у картці гравця бачить повний інвентар;
- Майстер може додавати зброю гравцю;
- Майстер може редагувати назву/шкоду/дистанцію зброї гравця;
- Майстер може вибирати активну зброю гравця.

Не змінювалось:
- бойова математика 1/2/3 патрони;
- віддача;
- розкриття;
- укриття;
- privacy HP ворогів.


## V19.21.2 — Inventory Label + Damage Log Formula Fix

Hotfix:
- секцію Майстра `Інвентар` перейменовано на `Інвентар гравця`;
- у секції явно показано, чий це інвентар;
- рядок кидків шкоди тепер показує формулу активної зброї, зокрема кастомну `d20`;
- новий unified combat summary із `Формула` не має помилково вважатися legacy technical log.

Не змінювалось:
- бойова математика 1/2/3 патрони;
- розрахунок шкоди;
- віддача;
- розкриття;
- укриття;
- privacy HP ворогів.


## V19.21.3 — Remove Old GM Inventory Panel + Damage Text Polish

Hotfix:
- прибрано стару окрему GM-панель `Інвентар` з екрана Майстра;
- інвентар гравця тепер керується тільки через `Майстер → Гравці → Інвентар гравця`;
- інвентар ворога залишається у деталях ворога;
- з бойового тексту прибрано зайве дублювання `Формула: ...`;
- рядок шкоди лишається зрозумілим: `Випало: X на 1d400`.

Не змінювалось:
- розрахунок шкоди;
- бойова математика 1/2/3;
- віддача;
- розкриття;
- укриття;
- privacy HP ворогів.


## V19.21.4 — Weapon Inventory Stability Checkpoint

Стабілізаційний checkpoint після weapon/inventory-пакета.

Зміни:
- додано contract-коментар для weapon/inventory authority;
- зафіксовано, що `activeWeapon` + `inventory.damage` є основною логікою шкоди;
- `weapon` лишається fallback для старих кімнат;
- додано легкий audit-helper, який попереджає в console, якщо випадково повернеться player-side кнопка додавання зброї;
- документацію оновлено під поточну стабільну модель.

Не змінювалось:
- розрахунок шкоди;
- бойова математика 1/2/3;
- віддача;
- розкриття;
- укриття;
- privacy HP ворогів;
- UI інвентарю гравця/Майстра.


## V19.22 — Enemy Full Editor Panel

Додано повноцінний GM-редактор ворога у вкладці `Вороги`.

Майстер у картці ворога може редагувати:
- назву, стан, видимість;
- HP / Max HP;
- Захист / Max Захист;
- броню, втому, зараження;
- набої, мораль, віддачу;
- позицію, небезпеку, поточну дію, лут;
- характеристики ворога;
- інвентар / зброю ворога;
- додавати ПМ / Обріз / АКС-74У;
- редагувати назву, шкоду і дистанцію зброї ворога;
- вибирати активну зброю ворога.

Не змінювалось:
- бойова математика 1/2/3;
- розрахунок шкоди;
- віддача;
- розкриття;
- укриття;
- privacy HP ворогів.


## V19.22.1 — Enemy Editor Journal + Scroll Stability Fix

Hotfix після тесту V19.22:
- при створенні ворога журнал Майстра більше не дублює повний текст луту;
- лут лишається у картці/редакторі ворога;
- додано `renderPreserveScroll()` для випадків, коли render усе ж потрібен після редагування;
- select-зміни в редакторі ворога більше не мають насильно скидати позицію екрана;
- редагування числових/текстових параметрів ворога зберігається без повного render.

Не змінювалось:
- бойова математика;
- розрахунок шкоди;
- activeWeapon / inventory.damage;
- privacy HP ворогів.


## V19.22.2 — Enemy Editor No-Jump Fix

Hotfix:
- редактор ворога зберігає відкритий стан після локального редагування;
- локальний Firebase-echo після редагування ворога більше не викликає повний render;
- додано `suppressRemoteRenderBriefly()`;
- додано збереження стану `<details data-enemy-editor>`;
- має зменшити/прибрати стрибання екрана і закриття редактора при введенні символів.

Не змінювалось:
- бойова математика;
- розрахунок шкоди;
- activeWeapon / inventory.damage;
- privacy HP ворогів.


## V19.23 — Render Firebase Architecture Cleanup

Стабілізаційний cleanup після V19.22.2.

Зміни:
- додано contract-коментар для render/Firebase архітектури;
- додано `quietSaveFieldEdit()` для локального редагування полів без стрибків;
- додано `saveAndRenderPreserveScroll()` для контрольованих змін із перемальовкою без втрати scroll;
- зменшено дублювання `suppressRemoteRenderBriefly(); save();`;
- збережено поведінку enemy editor no-jump;
- оновлено документацію.

Не змінювалось:
- бойова математика;
- розрахунок шкоди;
- activeWeapon / inventory.damage;
- інвентарі;
- privacy HP ворогів.


## V19.24 — Internal Test Harness

Додано три рівні швидкого тестування:
1. Self-check у вкладці Майстра.
2. Combat smoke-test у коді.
3. Окрема сторінка `test.html`.

Як користуватись:
- після завантаження файлів відкрий Майстра;
- натисни `Self-check`;
- якщо немає ❌, зроби лише один ручний постріл;
- альтернативно відкрий `/test.html` і натисни `Запустити тести`.

Тести перевіряють:
- build/version;
- підключення app.js з правильним `v=`;
- відсутність старого `gmInventory`;
- відсутність player-side кнопки додавання зброї;
- activeWeapon / inventory.damage;
- custom damage `d400`;
- відсутність зайвої `Формула:`;
- privacy HP у player combat brief;
- базові locked combat rules 1/2/3.


## V19.24.1 — Expanded Test Harness

Розширено систему тестування.

Додано набори тестів:
- role authority tests;
- inventory / activeWeapon damage tests;
- journal privacy tests;
- UI regression tests;
- expanded combat rule checks.

Тести перевіряють більше регресій без зміни реальної кімнати:
- права гравця/Майстра;
- custom damage d4/d4+1/d6/d20/d400;
- fallback weapon;
- privacy HP;
- legacy combat log filter;
- відсутність старого gmInventory;
- наявність render/Firebase helpers;
- locked combat rules.


## V19.24.2 — Test Harness Runtime Fix

Hotfix після V19.24.1:
- виправлено падіння test.html / Self-check через відсутній helper `prepareCombatBriefText`;
- journal/privacy тест тепер не залежить від цієї функції;
- якщо деякі допоміжні helper-и недоступні, тест показує ⚠️, а не падає;
- ігрова логіка не змінювалась.

Не змінювалось:
- бойова математика;
- activeWeapon / inventory.damage;
- інвентарі;
- редактор ворогів;
- Firebase;
- privacy HP у самій грі.


## V19.24.3 — Test Harness Warning Polish

Hotfix тестової системи:
- прибрано хибне попередження `Build number неочікуваний`;
- build check тепер перевіряє коректність BUILD_NUMBER без старого hardcode;
- legacy combat log test більше не показує зайве ⚠️, якщо фільтр не спрацював на тестовому рядку;
- ігрова логіка не змінювалась.


## V19.25 — Dev Toolkit Pack

Об’єднано три dev/test напрями:
1. Release Preflight + Risk Labels.
2. Dev Mode / Debug Snapshot Lite.
3. Safe Test Room Reset / Test Scenario A.

Додано у вкладку Майстра блок `Dev Toolkit`:
- `Preflight + Tests`;
- `Debug snapshot`;
- `Reset test-room`.

Safe reset:
- доступний тільки Майстру;
- працює тільки в кімнатах, назва яких починається з `test`;
- перезаписує поточну test-room стандартною тестовою сценою.

Debug snapshot:
- збирає version/build/role/room/player/enemies/activeWeapon/target/combat/Firebase status;
- копіює JSON або показує його в textarea.

Не змінювалось:
- бойова математика;
- activeWeapon / inventory.damage;
- інвентарі;
- редактор ворогів;
- privacy HP.


## V19.28.2 — Attribute Check Close Control

Невеликий control-патч після V19.28.1.

Оновлено:
- build/cache до `19670`;
- у панель Майстра додано кнопку `Закрити перевірку`;
- закриття прибирає активну перевірку з player-facing блоку у вкладці `Стан`;
- запис у журналі не видаляється і лишається історією кидка;
- кнопка закриття неактивна, якщо активної перевірки немає;
- Test Harness перевіряє очищення `data.combat.attributeCheck`.

Не змінювалось:
- бойова математика 1/2/3 патрони;
- activeWeapon / inventory.damage;
- інвентарі;
- редактор ворогів;
- privacy HP ворогів;
- Firebase-схема.


## V19.28.1 — Attribute Check UX Polish

Невеликий polish-патч після стабільної V19.28.

Оновлено:
- build/cache до `19669`;
- у панель Майстра додано швидкі кнопки складності `10 / 12 / 14 / 16 / 18`;
- додано швидкі кнопки Умови сцени `-2 / -1 / 0 / +1 / +2`;
- після перекиду картка результату показує попередній кидок і попередній підсумок;
- Test Harness перевіряє, що reroll-картка показує попередній результат.

Не змінювалось:
- бойова математика 1/2/3 патрони;
- activeWeapon / inventory.damage;
- інвентарі;
- редактор ворогів;
- privacy HP ворогів;
- Firebase-схема.


## V19.28 — Attribute Check Roller

Реалізовано перший робочий варіант системи перевірок характеристик.

Додано:
- GM-панель `Перевірка характеристики`;
- вибір гравця, характеристики, складності, Умови сцени і режиму кидка;
- режими `звичайний`, `Перевага`, `Перешкода`;
- helper-и `fatigueCombatPenalty(fatigue)` і `fatigueOtherStatsPenalty(fatigue)`;
- helper `rollAttributeCheck()`;
- запис результату перевірки в журнал;
- player-facing блок останньої перевірки у вкладці `Стан`;
- кнопка `Перекинути за +1 Втома` для відповідного гравця;
- правило natural 1: перекид блокується тільки якщо фінально обраний d20 = 1;
- максимум Втоми піднято до 6;
- тести Attribute Check Roller у Test Harness.
- локальний fallback-синк через `localStorage` для тестування Майстер/гравець, якщо Firebase SDK недоступний у локальному середовищі.

Оновлено schema:
- додано `data.combat.attributeCheck` для останньої активної перевірки і можливості гравця зробити перекид.

Не змінювалось:
- бойова математика 1/2/3 патрони;
- activeWeapon / inventory.damage;
- інвентарі;
- редактор ворогів;
- privacy HP ворогів;
- Firebase Auth / Rules.


## V19.27.1 — ROADMAP Attribute Checks Plan

Документаційний checkpoint після стабільної бази `V19.27 — State Profile Focus + Tap Edit`, build/cache `19666`.

Оновлено:
- build/cache до `19667`;
- ROADMAP для майбутньої системи Attribute Check Roller;
- опис правил Втоми, Умови сцени, Переваги/Перешкоди і Перекиду за +1 Втома.

Не реалізовувалось:
- Attribute Check Roller;
- нова бойова математика;
- зміни activeWeapon / inventory.damage;
- зміни інвентарів;
- зміни редактора ворогів;
- зміни журналу / privacy HP;
- зміни Firebase-схеми.


## V19.27 — State Profile Focus + Tap Edit

Зміни:
- профіль персонажа перенесено всередину вкладки `Стан`, щоб він не дублювався в `Оточенні`, `Журналі` та інших екранах;
- у вкладці `Стан` профіль стає головною КПК-карткою персонажа;
- для Майстра під профілем додано швидке редагування параметрів поточного гравця:
  HP, Max HP, Захист, Max Захист, Втома, Зараження, Набої;
- використано вже наявну command-логіку `data-player-step`, без нової бойової математики;
- Preflight зроблено універсальнішим щодо build/version.

Не змінювалось:
- бойова математика;
- activeWeapon / inventory.damage;
- інвентарі;
- редактор ворогів;
- журнал і privacy HP;
- Firebase-схема.
