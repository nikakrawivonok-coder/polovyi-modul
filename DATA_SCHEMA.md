# DATA_SCHEMA.md — Польовий Модуль V19.18.10

Цей файл описує поточну робочу структуру даних, щоб під час подальшої розробки не губити логіку.

## Build

```js
BUILD_VERSION = "V19.26.2"
BUILD_NUMBER = "19665"
BUILD_NAME = "Debug Snapshot Display Fix"
```

## appSession

```js
appSession = {
  role: "gm" | "player",
  room: string,
  player: string,
  access: "gm" | "player" | "denied",
  syncMode: string
}
```

## data.players

```js
data.players = {
  fox: {
    name: "Лис",
    hp: number,
    hpMax: number,
    defense: number,
    ammo: number,
    fatigue: number,
    infection: number,
    armor: number,
    weapon: string,
    inventory: [
      { item: string, count: number, note: string }
    ]
  }
}
```

## data.enemies

```js
data.enemies = [
  {
    id: string,
    name: string,
    visible: boolean,
    state: string,
    color: "green" | "orange" | "red" | "yellow",
    defense: number,
    armor: number,
    fatigue: number,
    infection: number,
    weapon: string,
    position: string,
    danger: string,
    action: string,
    visibleDescription: string,
    stats: {
      endurance: number,
      accuracy: number,
      agility: number,
      perception: number,
      intuition: number,
      charisma: number
    },
    gm: {
      hp: number,
      hpMax: number,
      ammo: number,
      morale: string,
      recoilLevel: number,
      lootText: string,
      lootTargetPlayer: string,
      lootTakenText: boolean,
      lootTakenTextBy: string,
      lootTakenTextAt: string,
      lootTakenAmmo: boolean,
      lootTakenAmmoBy: string,
      lootTakenAmmoAt: string,
      imageKey: string
    }
  }
]
```

## Важливі правила видимості

Гравець не має бачити точні HP, набої, мораль, лут і небезпеку ворога.  
Майстер бачить усіх ворогів, включно з прихованими.

## Лут V19.16.6

- `lootTargetPlayer` — обраний гравець для передачі луту.
- `lootTakenText` — текстовий лут уже передано.
- `lootTakenAmmo` — набої вже передано.
- `lootTakenTextBy`, `lootTakenAmmoBy` — кому передано.
- `lootTakenTextAt`, `lootTakenAmmoAt` — коли передано.

Лут поки не розбивається автоматично на окремі предмети. Він додається в інвентар як `Лут: <назва ворога>` з описом у `note`.

## Поточні важливі функції

```js
updateEnemyStateByHp(enemy)
enemyCardGm(e)
enemyCardPublic(e)
transferEnemyLootNote(enemyId, playerId)
transferEnemyAmmoLoot(enemyId, playerId)
transferEnemyAllLoot(enemyId, playerId)
selectedLootPlayerIdForEnemy(enemy)
playerOptionsHtml(selectedId)
formatBriefHtml(brief)
burstRecoilInfoForShooter(shooter)
```


## V19.16.7 — Journal display polish

Журнал тепер має різну подачу службових міток залежно від ролі:

- Майстер бачить `Публічно`, `Приватно`, `Майстру`;
- гравець не бачить `Публічно`;
- гравець бачить `Приватно`;
- візуальний відступ після службової мітки додається CSS;
- початкове ім'я/ID гравця в деяких записах береться в лапки для читабельності.


## V19.17 — Enemy Template: Бандит з обрізом

Структура `enemyTemplates.shotgun` доведена до повнішого шаблону за зразком `enemyTemplates.auto`.

Додані/уточнені поля шаблону:

```js
enemyTemplates.shotgun = {
  templateId: "shotgun",
  name: "Бандит з обрізом",
  type: "human",
  faction: "бандити",
  role: string,
  weapon: "obrez",
  range: "near",
  weaponCondition: "normal",
  weaponJammed: false,
  defense: 12,
  defenseMax: 12,
  fatigue: 0,
  infection: 0,
  armor: 0,
  stats: {
    endurance: 2,
    accuracy: 2,
    agility: 1,
    perception: 1,
    intuition: 2,
    charisma: 2
  },
  gm: {
    hp: 8,
    hpMax: 8,
    ammo: 3,
    morale: string,
    behavior: string,
    lootText: string,
    imageKey: "bandit_obrez",
    lastAttackType: string,
    recoilLevel: number,
    exposedUntilNextTurn: boolean,
    exposurePenalty: number
  },
  attacks: [
    { id: string, name: string, ammo: number, dice: string, note: string }
  ],
  special: string,
  weakness: string,
  tags: string[]
}
```

UI-зміна:

- `renderEnemyTemplateDock()` тепер показує grid із двома шаблонами: `auto` і `shotgun`;
- додано допоміжну функцію `renderEnemyTemplateCard(templateId, avatar)`;
- нова структура не змінює Firebase-схему кімнати радикально, бо створений ворог і далі проходить через `makeEnemyFromTemplate()` і нормалізується наявними полями.

## V19.17.2 — Combat Brief Privacy Fields

У `data.combat` додано розділення короткого бойового підсумку за видимістю:

```js
combat: {
  lastBrief: string,        // player-safe fallback
  lastBriefPublic: string,  // публічна версія без точних HP ворогів
  lastBriefGm: string       // GM-версія з точними HP ворогів
}
```

Правило видимості:

- `lastBriefGm` показується тільки Майстру;
- `lastBriefPublic` показується гравцям;
- `lastBrief` лишається як fallback і має зберігатися у player-safe форматі;
- V19.17.2+: якщо legacy/cached `lastBrief` усе ж містить точні HP ворога, клієнт гравця редагує його перед рендером через `sanitizePlayerCombatBrief()`.

Це не змінює бойову математику і не змінює основну структуру ворогів/гравців.
Build/cache: `19620`.



## V19.17.3 — Damage Roll Line in Combat Brief

`setCombatBrief()` приймає додаткові поля для відображення шкоди у вкладці `Стан`:

```js
setCombatBrief({
  damageRoll: object | null,
  crits: number
})
```

Відображення:

- якщо атака влучила і `damageRoll.rolls` існує, після рядка d20-кидків додається рядок `Випало: ... на ...`;
- цей рядок однаковий для `lastBriefPublic` і `lastBriefGm`;
- рядок не містить точних HP ворога і тому безпечний для гравця;
- при критичній шкоді критичний кубик показується окремо;
- бойова математика не змінена, використовується вже наявний об’єкт `damageRoll`.

Build/cache: `19620`.


## V19.17.4 — Combat Clarity / Cover and Exposure

Build/cache: `19621`.

Додані/уточнені поля не змінюють схему Firebase як обов’язкову структуру, але бойовий підсумок тепер активніше використовує розділення:

- `combat.lastBriefPublic` — без точних HP ворогів;
- `combat.lastBriefGm` — з точними HP ворогів для Майстра;
- `combat.lastBrief` — player-safe fallback;
- `player.exposedUntilNextTurn`, `player.exposurePenalty`;
- `enemy.gm.exposedUntilNextTurn`, `enemy.gm.exposurePenalty`;
- `enemy.cover` або effect `inCover` — укриття ворога, що дає +2 до ефективного Захисту.

Поточний очікуваний формат короткого бойового підсумку:

```text
Лис: Черга → Автоматник
🎲 8, 14, 20 → 6, 12, 18
Випало: 3, 3 на 2d4 + 3 на крит. 1d4
2 влуч., шкода 9. Автоматник: вибув.
Набої: 11.
Точність: черга, 1-а поспіль — -2.
Лис розкрився: Захист 12 → 10 до його наступного ходу.
```

Якщо ціль в укритті, додається рядок на кшталт:

```text
Укриття цілі: Захист Автоматник 12 → 14.
```


## V19.17.5 — Recoil Progression Note

Build/cache: `19622`.

Дані стрільця вже містять лічильник послідовних черг:

- гравець: `player.recoilLevel`;
- ворог/NPC: `enemy.gm.recoilLevel`.

Правило: під час `shoot_burst`/`burst` наступний штраф рахується як `-(recoilLevel + 1) * 2`. Після пострілу чергою лічильник збільшується на 1. Постріл 1 або 2 патронами скидає лічильник у 0. Початок бою скидає стару віддачу через `resetAllRecoilState()`.


## V19.17.6 — Effective defense + compact GM meta

- `playerDefenseValue(player)` лишається джерелом істини для ефективного Захисту гравця.
- У UI Захист гравця може показуватись як `ефективний / баз. базовий`, якщо на нього впливають укриття або розкриття.
- Діагностика Майстра скорочена: дубльовані `Build / Cache / Room / Role / Player / Sync` прибрані з debug-панелі, бо їх уже видно в meta-блоці.


## V19.17.7 — Shield sync + cover accuracy text

- `playerDefenseDisplay(player)` показує `ефективний/максимальний · причина`, коли Захист змінено тимчасовими факторами.
- Основний `#defenseNow` у вкладці `Стан` тепер використовує `playerDefenseDisplay(...)`, а не сире `player.defense`.
- Штраф черги по цілі в укритті виводиться окремим зрозумілим рядком: `Через укриття цілі: -1 до точності Лиса при стрільбі чергою.`


## V19.17.9 — Unified Combat Summary Real Fix

- V19.17.8 пропущена як невдала тестова версія.
- `setCombatBrief()` тепер формує єдиний короткий бойовий підсумок для пострілів 1 / 2 / 3 патронами.
- `showCombatBriefToastForCurrentRole()` показує той самий role-aware підсумок у toast.
- `lastBriefGm` містить HP ворога; `lastBriefPublic` лишається без точних HP ворога.
- Бойова математика не змінена.


## V19.17.10 — Exposure Trigger Fix

- `shotCausesExposure(action, hits)` визначає, чи поточний постріл має створювати рядок розкриття.
- 1 патрон / `shoot_aimed`: не створює розкриття.
- 2 патрони / `shoot_normal`: створює розкриття -1 тільки при 0 влучань.
- 3 патрони / `shoot_burst`: створює розкриття -2 після кожної черги.


## V19.17.11 — Combat Text Cleanup / Journal Privacy Audit

- `setCombatBrief(...)` лишається основним джерелом короткого бойового підсумку.
- `lastBriefPublic` — безпечний текст для гравців: показує Захист цілі та модифікатори, але не точні HP ворогів.
- `lastBriefGm` — повний текст для Майстра, включно з HP ворогів.
- `addCombatBriefToJournal()` переносить ці role-aware версії в журнал: public + окремі GM-деталі.


## V19.17.12 — Journal legacy cleanup

- `isLegacyCombatTechnicalLog(text)` приховує старі технічні бойові записи журналу, створені попередніми форматами.
- `journalTextForCurrentRole(j)` додатково очищує текст журналу для гравця через `sanitizePlayerCombatBrief`.
- Бойова математика не змінювалась.


## V19.17.13.1 — ROADMAP Reorder + Combat Architecture Plan

Документаційно-архітектурний checkpoint. Схема даних і бойова математика не змінювались.

Зафіксовано майбутній напрям:

- `combatResult` як єдиний об’єкт результату атаки;
- role-aware view filters для Майстра/гравця;
- гравець може бачити Захист цілі та пояснення модифікаторів;
- гравець не бачить точні HP ворога;
- Майстер бачить усе;
- майбутні режими: чесний тест, атмосферна гра, кастомна видимість Майстра.


## V19.17.13.1 — ROADMAP Preserve Fix

- Бойова математика не змінювалась.
- Код бою не переписувався.
- Повний `ROADMAP.md` із V19.17.12 збережено внизу нового ROADMAP як `Detailed Backlog / Archive`.
- Зверху ROADMAP залишено короткий упорядкований план із locked combat rules, technical debt і architecture plan.


## V19.18 — First Architecture Cleanup

Архітектурний cleanup без зміни бойової математики.

Важливо:
- `setCombatBrief(...)` є головним джерелом короткого бойового підсумку для State/Toast/Journal.
- Legacy `staticShotResultLines(...)`, `setStaticRollResult(...)`, `damageRollsTextForStatic(...)` прибрані.
- `showRollToast(...)` поки лишається для небойових дій, наприклад усунення клину.
- `addCombatBriefToJournal()` лишається точкою запису role-aware бойового результату в журнал.


## V19.18.1 — Dead RollResult Cleanup

- Hidden legacy `#rollResult` panel removed from HTML.
- `clearStateRollResult()` removed.
- Combat attack summaries remain centralized through `setCombatBrief(...)`, `addCombatBriefToJournal(...)`, and `showCombatBriefToastForCurrentRole(...)`.
- `showRollToast(...)` remains only for utility/non-combat checks such as jam clearing.


## V19.18.3 — Journal render helper cleanup

- `isJournalEntryVisibleForCurrentRole(j)` — централізована перевірка видимості запису журналу для поточної ролі.
- `visibleJournalEntriesForCurrentRole()` — єдине джерело списку записів, які можна рендерити в журналі.
- `isLegacyCombatTechnicalLog(text)` лишається захисним фільтром проти старих технічних бойових записів.
- Бойова математика не змінювалась.


## V19.18.3 — Unused Helper Cleanup

- Прибрані невикористані helper-функції: `safeCall`, `enemyRow`, `weaponConditionText`, `damageFormulaText`, `randomModuleWarning`.
- Активний бойовий підсумок лишається через `setCombatBrief(...)`, `addCombatBriefToJournal(...)`, `showCombatBriefToastForCurrentRole(...)`.
- Бойова математика і Firebase-схема не змінювались.


## V19.18.5 — Remove Module Signal Button

Cleanup-only підхід після V19.18.3.

- Кнопку `Сигнал модуля` прибрано з вкладки `Журнал` як неочевидний legacy UI-елемент.
- Кнопку очищення журналу перейменовано на `Очистити журнал`.
- З `updateBuildDebug()` прибрано залишкові оновлення debug-полів, яких уже немає в HTML після compact GM diagnostics.
- Бойова математика, privacy HP, журнал як система записів і Firebase-схема не змінювались.


## V19.18.5 — Journal Clear Button Fix

- `clearJournalForCurrentRole()` керує кнопкою очищення журналу.
- Майстер очищає `data.journal` для всієї кімнати.
- Гравець не змінює shared Firebase-журнал: видимі записи приховуються локально через `localStorage` за ключем кімнати й player id.
- `Сигнал модуля` не повертався.


## V19.18.6 — Code Map + Combat Readability Pass

- Додано `CODE MAP` на початку `app.js`.
- Додано секційні заголовки для основних зон коду.
- Активний бойовий шлях додатково підписаний коментарями:
  `setCombatBrief(...)`, `addCombatBriefToJournal(...)`, `showCombatBriefToastForCurrentRole(...)`.
- Бойова математика не змінювалась.


## V19.18.10 — Combat Result Object Preparation

No schema change.

Maintenance notes:
- Test links must use `v=BUILD&hard=BUILD`.
- Journal helper sections in `app.js` are separated into display/clear/privacy and visibility/privacy filters.
- Combat summary contract is documented near `setCombatBrief(...)`.
- Combat math and Firebase structure unchanged.


## V19.18.10 — Combat Result Object Preparation

- `prepareCombatBriefResult(input)` нормалізує вхідні поля бойового підсумку для `setCombatBrief(input)`.
- Це не нова Firebase-схема і не зміна бойової математики.
- Мета: підготувати поступовий перехід до структурованого `Combat Result Object`, з якого будуть будуватись `Остання дія`, toast, Journal, GM view і Player view.


## V19.18.10 — Journal Clear Options

- Схема Firebase не змінена.
- `data.journal` лишається масивом записів із `visibility`: `public`, `gm`, `private`.
- Локальне очищення журналу зберігається в `localStorage` як перелік прихованих ID записів для ролі/гравця.


## V19.18.10 — Player Journal Visibility Fix

- Схема Firebase не змінювалась.
- Локальний journal clear і надалі використовує ключ `pm_journal_hidden_<room>_<role/player>`.
- Виправлено лише клієнтський фільтр видимості: `hiddenJournalIdsForCurrentRole()` є актуальним helper для GM і player.


## V19.18.11 — Code Readability Baseline

- База: стабільна `V19.18.10`.
- Відкинута гілка з дубльованими тестовими посиланнями не використовується.
- Додано code map / section markers / contract comments.
- Логіка бою, privacy HP, журнал і Firebase-схема не змінювались.


## V19.18.12 — Documentation Consistency Pass

- Runtime-логіку не змінювати.
- Оновлено документацію, locked combat rules і checklist.
- Перед подальшою розробкою користувач має перевірити V19.18.12.


## V19.18.13 — Local Journal Clear Fix

- Виправлено локальне приховування журналу для ролі Майстра.
- Runtime-схема Firebase не змінена.


## V19.18.14 — Moderate Cleanup Journal Helpers

- Firebase-схема не змінена.
- Локальне очищення журналу працює через localStorage id-list.
- Shared clear для Майстра й надалі змінює `data.journal`.


## V19.19 — Enemy Balance + Weapon Inventory Seed

Enemy template additions:
- `activeWeapon: string`
- `inventory: Array<{id,type,name,damage,range,ammoType,equipped,note}>`

Current limitation:
- бойова шкода поки не обчислюється з `inventory`;
- `activeWeapon` поки seed/metadata для наступного кроку.


## V19.20 — Active Weapon Damage

Player/enemy weapon fields:
- `weapon`: fallback weapon id;
- `activeWeapon`: active weapon id;
- `inventory[].type === "weapon"` marks weapon items;
- `inventory[].damage` can override catalog damage, e.g. `d4+1`, `d6`;
- `inventory[].equipped` marks active weapon item.

Fallback:
- if active inventory weapon is missing, old `weapon` field is used.


## V19.21 — Weapon Inventory Management Pack

Inventory weapon item:
- `id`
- `type: "weapon"`
- `name`
- `item`
- `count`
- `damage`, e.g. `d4`, `d4+1`, `d6`
- `range: "near" | "far"`
- `ammoType`
- `equipped`
- `note`

Characters:
- `activeWeapon` controls active damage source.
- `weapon` remains fallback for old rooms.


## V19.21.1 — GM Inventory Authority Fix

Authority model:
- Player can view inventory and select active owned weapon.
- GM controls adding and editing weapon parameters.
- Weapon damage remains sourced from `activeWeapon` / `inventory.damage`.


## V19.21.2 — Inventory Label + Damage Log Formula Fix

- Schema не змінена.
- `inventory.damage` як і раніше може містити кастомну формулу типу `d20`.
- UI/Journal тепер явно показує формулу у combat summary.


## V19.21.3 — Remove Old GM Inventory Panel + Damage Text Polish

- Schema не змінена.
- Видалено лише старий дублюючий GM UI-блок інвентарю.
- `inventory.damage` продовжує підтримувати кастомні формули типу `d400`.


## V19.21.4 — Weapon Inventory Stability Checkpoint

Schema не змінена.

Authority model:
- Player: view inventory, choose active owned weapon.
- GM: add/edit player weapons.
- GM: add/change enemy weapons.
- Damage source: `activeWeapon` + matching `inventory[].damage`.
- Fallback: old `weapon` field.


## V19.22 — Enemy Full Editor Panel

Schema не змінена.

UI тепер редагує вже наявні поля enemy:
- `gm.hp`, `gm.hpMax`, `gm.ammo`, `gm.morale`, `gm.recoilLevel`;
- `defense`, `defenseMax`, `armor`, `fatigue`, `infection`;
- `stats.*`;
- `inventory[]`, `activeWeapon`.


## V19.22.1 — Enemy Editor Journal + Scroll Stability Fix

Schema не змінена.
Зміни тільки в UI/log behavior:
- shorter add-enemy GM log;
- scroll-preserving render path for enemy editor.


## V19.22.2 — Enemy Editor No-Jump Fix

Schema не змінена.
UI/runtime only:
- `suppressRemoteRenderUntil`;
- `suppressRemoteRenderBriefly()`;
- enemy editor details open-state tracking.


## V19.23 — Render Firebase Architecture Cleanup

Schema не змінена.

Runtime helper additions:
- `quietSaveFieldEdit(ms=900)`
- `saveAndRenderPreserveScroll(ms=900)`

Purpose:
- reduce render/Firebase echo bugs during local editing.


## V19.24 — Internal Test Harness

Schema не змінена.

New public test API:
- `window.POLOVYI_MODUL_TESTS.runInternalSelfCheck()`
- `window.POLOVYI_MODUL_TESTS.runCombatSmokeTest()`
- `window.POLOVYI_MODUL_TESTS.runFullInternalTests()`
- `window.POLOVYI_MODUL_TESTS.renderTestReport(title, results)`


## V19.24.1 — Expanded Test Harness

Schema не змінена.

Expanded test API additions:
- `runExpandedCombatRuleTests()`
- `runInventoryDamageTests()`
- `runRoleAuthorityTests()`
- `runJournalPrivacyTests()`
- `runUiRegressionTests()`


## V19.24.2 — Test Harness Runtime Fix

Schema не змінена.
Test harness runtime-only hotfix:
- removed dependency on `prepareCombatBriefText` from `runJournalPrivacyTests`.


## V19.24.3 — Test Harness Warning Polish

Schema не змінена.
Тільки polish тестової системи.


## V19.25 — Dev Toolkit Pack

Schema не змінена.

New dev APIs:
- `runReleasePreflight()`
- `buildDebugSnapshot()`
- `makeTestScenarioData()`

Dev UI:
- `#runDevToolkit`
- `#copyDebugSnapshot`
- `#resetSafeTestRoom`


## V19.26 — GM Comfort Dashboard

Schema не змінена.
UI additions:
- `gmComfortDashboardHtml()`
- `applyGmComfortAction()`
- quick GM journal notes/actions.


## V19.26.1 — Dev Toolkit Preflight Snapshot Fix

Schema не змінена.
Dev Toolkit hotfix:
- generalized Preflight checks;
- improved Debug snapshot visibility.


## V19.26.2 — Debug Snapshot Display Fix

Schema не змінена.
Dev Toolkit UI-only hotfix:
- `#debugSnapshotPanel`
- robust `showDebugSnapshot()`
