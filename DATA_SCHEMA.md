# DATA_SCHEMA.md — Польовий Модуль V19.17.1

Цей файл описує поточну робочу структуру даних, щоб під час подальшої розробки не губити логіку.

## Build

```js
BUILD_VERSION = "V19.17.1"
BUILD_NUMBER = "19618"
BUILD_NAME = "Enemy HP Privacy Patch"
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

## V19.17.1 — Combat Brief Privacy Fields

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
- `lastBrief` лишається як fallback і зберігається у player-safe форматі.

Це не змінює бойову математику і не змінює основну структуру ворогів/гравців.
Build/cache: `19618`.

