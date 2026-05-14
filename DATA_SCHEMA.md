# DATA_SCHEMA.md — Польовий Модуль V19.16.6

Цей файл описує поточну робочу структуру даних, щоб під час подальшої розробки не губити логіку.

## Build

```js
BUILD_VERSION = "V19.16.6"
BUILD_NUMBER = "19606"
BUILD_NAME = "Enemy Loot Polish / Target Player Select"
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
