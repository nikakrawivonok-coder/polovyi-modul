// Польовий Модуль — V19.11.4 Actor Target Combat Routing Fix
// Extracted from Stable V18.12.1. Functional behavior should match V18.12.1.
// No gameplay logic intentionally changed in this version.

(function(){
      var q = new URLSearchParams(location.search);
      var r = (q.get('role') || 'player').toLowerCase().trim();
      document.body.classList.add(r === 'gm' ? 'role-gm' : 'role-player');
    })();

function safeSetText(selector, value){
  const el = qs(selector);
  if(el) el.textContent = value ?? "";
  return el;
}

function safeSetHTML(selector, value){
  const el = qs(selector);
  if(el) el.innerHTML = value ?? "";
  return el;
}

function safeCall(name, fn){
  try{
    return fn();
  }catch(err){
    console.error(`[${name}] failed`, err);
    try{
      const t = qs("#toast");
      if(t){
        t.textContent = `Помилка інтерфейсу: ${name}`;
        t.hidden = false;
        clearTimeout(showToast._timer);
        showToast._timer = setTimeout(() => t.hidden = true, 5000);
      }
    }catch(_){}
  }
}


window.POLOVYI_MODUL_JS_LOADED = true;
const STORAGE_PREFIX = "polovyi_modul_v5_room";

function nowTime(){
  const d = new Date();
  return d.toLocaleTimeString("uk-UA", {hour:"2-digit", minute:"2-digit"});
}

function getQueryParams(){
  const href = window.location.href || "";
  const search = window.location.search || (href.includes("?") ? "?" + href.split("?")[1].split("#")[0] : "");
  return new URLSearchParams(search);
}

const params = getQueryParams();
const requestedRole = String(params.get("role") || "player").trim().toLowerCase();

/*
  V7: простий ключ Майстра.
  Це домашній app-level захист, щоб гравець не відкрив Майстра випадково.
  Для бойового продакшну потрібні Firebase Auth + закриті Rules.
*/
const DEFAULT_GM_KEY = "zona-master";
const providedGmKey = String(params.get("gmKey") || sessionStorage.getItem("polovyi_modul_gm_key") || "").trim();
const wantsGm = requestedRole === "gm" || requestedRole === "master" || requestedRole === "майстер";
const hasGmAccess = wantsGm && providedGmKey === DEFAULT_GM_KEY;

if(providedGmKey) sessionStorage.setItem("polovyi_modul_gm_key", providedGmKey);

const appSession = {
  requestedRole,
  role: hasGmAccess ? "gm" : "player",
  access: hasGmAccess ? "gm" : (wantsGm ? "denied" : "player"),
  room: String(params.get("room") || "local").trim() || "local",
  player: String(params.get("player") || "fox").trim() || "fox",
  syncMode: "local"
};

window.POLOVYI_MODUL_SESSION = appSession;

const firebaseConfig = {
  apiKey: "AIzaSyCkJP6qzFQZNeOtS_o8rZ2t0ZVqtOz7OsM",
  authDomain: "polovyi-modul.firebaseapp.com",
  databaseURL: "https://polovyi-modul-default-rtdb.firebaseio.com",
  projectId: "polovyi-modul",
  storageBucket: "polovyi-modul.firebasestorage.app",
  messagingSenderId: "277368859767",
  appId: "1:277368859767:web:3b8df539f783df5769ea72",
  measurementId: "G-16GHC058E0"
};

let isApplyingRemote = false;
let isBootstrappingRemote = true;
let pendingSaveTimer = null;
let expandedStateEnemyDetails = {};
let journalFilter = "all";
let gmCombatBarMode = "actor";
let expandedPlayerEditorSections = { profile:false, combat:false, weapon:false, stats:false, inventory:false };

const defaultRoomData = {
  schemaVersion: 5,
  meta: {
    app: "Польовий Модуль",
    roomId: "local",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncMode: "local",
    activePlayerId: "fox"
  },
  players: {
    fox: {
      id: "fox",
      name: "Лис",
      hp: 8,
      hpMax: 12,
      fatigue: 2,
      infection: 1,
      ammo: 15, weapon: "pm", range: "far", weaponCondition: "normal", weaponJammed: false,
      defense: 12,
      defenseMax: 12,
      armor: 0,
      activeEffects: [],
      stats: { endurance: 0, accuracy: 0, agility: 0, perception: 0, intuition: 0, charisma: 0 },
      inventory: [
        { item: "Аптечка", count: 2, note: "лікує поранення під час перепочинку" },
        { item: "Антирад", count: 1, note: "знижує зараження за рішенням майстра" },
        { item: "Болти", count: 6, note: "для перевірки аномалій" },
        { item: "Автомат", count: 1, note: "дозволяє стріляти чергою" }
      ]
    }
  },
  scene: {
    name: "Старий блокпост",
    description: "Туман стелиться між бетонними плитами. Біля іржавої вантажівки чути приглушені голоси. З підвалу тягне холодом, мокрим бетоном і металом.",
    sounds: "Тріск лічильника Гейгера, далекий гавкіт, металевий стукіт з підвалу.",
    smells: "Мокрий бетон, гар, іржа, стара кров.",
    objects: ["іржава вантажівка", "бетонні плити", "розбитий шлагбаум", "вхід у підвал", "кущі праворуч"]
  },
  enemies: [
    { id: "enemy_auto_1", name: "Автоматник", state: "цілий", color: "green", position: "біля воріт", danger: "дуже висока", action: "готує чергу", visible: true, gm: { hp: 12, hpMax: 12, ammo: 15, morale: "тримається" } },
    { id: "enemy_shotgun_1", name: "Бандит з обрізом", state: "поранений", color: "orange", position: "за машиною", danger: "висока зблизька", action: "перезаряджається", visible: true, gm: { hp: 5, hpMax: 8, ammo: 2, morale: "нервує" } },
    { id: "enemy_coward_1", name: "Боягуз", state: "наляканий", color: "yellow", position: "біля паркану", danger: "низька", action: "відступає", visible: true, gm: { hp: 8, hpMax: 8, ammo: 3, morale: "ламається" } }
  ],
  combat: {
    active: false,
    round: 0,
    turnIndex: 0,
    turnOrder: [],
    lastEvent: "Бій ще не почався.",
    strictTurns: true
  },
  journal: [
    { id: makeId("log"), visibility: "public", time: nowTime(), text: "Польовий модуль активовано. Сигнал нестабільний. Дані сцени завантажено." }
  ]
};


const sceneTemplates = {
  blockpost: {
    name: "Старий блокпост",
    description: "Туман стелиться між бетонними плитами. Іржава вантажівка стоїть боком до розбитого шлагбаума. З підвалу тягне холодом, мокрим бетоном і металом.",
    sounds: "Тріск лічильника Гейгера, далекий гавкіт, металевий стукіт з підвалу.",
    smells: "Мокрий бетон, гар, іржа, стара кров.",
    objects: ["іржава вантажівка", "бетонні плити", "розбитий шлагбаум", "вхід у підвал", "кущі праворуч"],
    enemies: ["auto", "shotgun", "coward"]
  },
  anomaly_field: {
    name: "Поле аномалій",
    description: "Низька трава лежить плямами, ніби її придавило невидимою рукою. Повітря блимає над калюжами, а кинуті болти дзвенять ще до падіння.",
    sounds: "Низький електричний гул, потріскування, далекий металевий дзвін.",
    smells: "Озон, мокра земля, палена гума.",
    objects: ["мерехтлива калюжа", "розірваний рюкзак", "кістяк біля дерева", "безпечна стежка", "аномальний вихор"],
    enemies: []
  },
  abandoned_basement: {
    name: "Підвал під блокпостом",
    description: "Вузькі бетонні сходи ведуть униз. На стінах цвіль, старі сліди куль і дитячі написи. У темряві блимає лампа, хоча дротів до неї не видно.",
    sounds: "Краплі води, скрегіт металу, приглушене шепотіння у вентиляції.",
    smells: "Пліснява, холодна іржа, стара олія.",
    objects: ["лампа без дротів", "металеві шафи", "замкнені двері", "вентиляційна решітка", "калюжа з райдужною плівкою"],
    enemies: ["coward"]
  },
  bandit_camp: {
    name: "Стоянка бандитів",
    description: "Між деревами натягнуто брезент. Горить маленьке багаття, поруч лежать порожні консерви, гільзи й чужі наплічники. Хтось сміється занадто голосно.",
    sounds: "Матюки, потріскування багаття, клацання затвора, радіо з перешкодами.",
    smells: "Дим, тушонка, дешевий спирт, мокрий одяг.",
    objects: ["багаття", "ящик з хабарем", "натягнутий брезент", "полонений сталкер", "стежка в ліс"],
    enemies: ["leader", "bandit", "shotgun", "auto"]
  }
};

const enemyTemplates = {
  coward: { name: "Боягуз", state: "наляканий", color: "yellow", position: "тримається позаду", danger: "низька", action: "шукає шлях втечі", visible: true, defense: 12, gm: { hp: 8, hpMax: 8, ammo: 3, morale: "ламається" }, tags:["бандит","мораль"] },
  bandit: { name: "Бандит", state: "цілий", color: "green", position: "за укриттям", danger: "середня", action: "цілиться", visible: true, defense: 12, gm: { hp: 9, hpMax: 9, ammo: 6, morale: "нервує" }, tags:["бандит"] },
  shotgun: { name: "Бандит з обрізом", state: "цілий", color: "green", position: "близько до проходу", danger: "висока зблизька", action: "чекає зближення", visible: true, defense: 12, gm: { hp: 8, hpMax: 8, ammo: 2, morale: "агресивний" }, tags:["бандит","обріз"] },
  auto: { name: "Автоматник", state: "цілий", color: "green", position: "на відкритій лінії вогню", danger: "дуже висока", action: "готує чергу", visible: true, defense: 12, gm: { hp: 12, hpMax: 12, ammo: 15, morale: "тримається" }, tags:["бандит","автомат"] },
  leader: { name: "Ватажок", state: "цілий", color: "green", position: "біля центру групи", danger: "висока", action: "кричить накази", visible: true, defense: 12, gm: { hp: 14, hpMax: 14, ammo: 8, morale: "контролює інших" }, tags:["бандит","лідер"] },
  ambusher: { name: "Засадник", state: "цілий", color: "green", position: "у тіні збоку", danger: "середня, якщо його не помітили", action: "чекає нагоди для першого пострілу", visible: true, defense: 13, gm: { hp: 8, hpMax: 8, ammo: 5, morale: "терплячий" }, tags:["бандит","засідка"] },
  finisher: { name: "Добивач", state: "цілий", color: "green", position: "шукає поранених", danger: "висока для слабких цілей", action: "тисне на найслабшого", visible: true, defense: 12, gm: { hp: 9, hpMax: 9, ammo: 5, morale: "жорстокий" }, tags:["бандит","тиск"] },
  blinddog: { name: "Сліпий пес", state: "цілий", color: "green", position: "нишпорить зграєю", danger: "середня", action: "заходить збоку", visible: true, defense: 11, gm: { hp: 6, hpMax: 6, ammo: 0, morale: "інстинкт зграї" }, tags:["мутант","зграя"] },
  pseudodog: { name: "Псевдособака", state: "цілий", color: "green", position: "попереду зграї", danger: "висока", action: "стрибає і збиває з ніг", visible: true, defense: 12, gm: { hp: 12, hpMax: 12, ammo: 0, morale: "хижа впевненість" }, tags:["мутант","ривок"] },
  tushkan: { name: "Тушкан", state: "цілий", color: "green", position: "у траві біля ніг", danger: "низька, але настирлива", action: "стрибає під ноги", visible: true, defense: 10, gm: { hp: 4, hpMax: 4, ammo: 0, morale: "метушня" }, tags:["мутант","малий"] },
  npc: { name: "Озброєний NPC", state: "насторожений", color: "yellow", position: "тримає дистанцію", danger: "залежить від розмови", action: "вимагає пояснень", visible: true, defense: 12, gm: { hp: 10, hpMax: 10, ammo: 6, morale: "обережний" }, tags:["npc","людина"] }
};

const lootTables = {
  ammo: [
    { text: "Знайдено коробку старих набоїв: +6 набоїв поточному гравцю.", item: "Набої", count: 6, note: "знайдено у схроні" },
    { text: "У кишені бандита знайшлись 3 придатні набої.", item: "Набої", count: 3, note: "трофей" },
    { text: "Під сидінням вантажівки лежить неповна пачка: +9 набоїв.", item: "Набої", count: 9, note: "пачка з вантажівки" }
  ],
  meds: [
    { text: "Знайдена стара аптечка. Виглядає придатною.", item: "Аптечка", count: 1, note: "польова аптечка" },
    { text: "У металевій шафі лежить антирад.", item: "Антирад", count: 1, note: "пожовкла етикетка" },
    { text: "Брудний бинт і знеболювальне. Краще, ніж нічого.", item: "Бинт", count: 1, note: "сумнівна якість" }
  ],
  junk: [
    { text: "Хабар: 120 дрібними купюрами й монетами.", item: "Хабар", count: 120, note: "дрібні гроші" },
    { text: "Знайдено старий годинник. Може зацікавити торговця.", item: "Старий годинник", count: 1, note: "можна продати" },
    { text: "Понівечений КПК. Екран тріснув, але пам’ять може бути цілою.", item: "Понівечений КПК", count: 1, note: "потрібна перевірка" }
  ],
  artifact_hint: [
    { text: "У траві щось тепле. Детектор мовчить, але шкіра поколює.", item: "Теплий уламок", count: 1, note: "дивна знахідка" },
    { text: "Болт завис у повітрі на мить довше, ніж мав би.", item: "Аномальний болт", count: 1, note: "неприродна поведінка" },
    { text: "Пляма на бетоні світиться під певним кутом.", item: "Світний пил", count: 1, note: "слід аномалії" }
  ]
};


const adventurePacks = {
  bandit_blockpost: {
    title: "Бандитський блокпост",
    scene: "blockpost",
    intro: "Модуль: попереду бандитський блокпост. На дорозі видно свіжі гільзи, сліди крові й розкидані речі.",
    playerEffect: { fatigue: 0, infection: 0 },
    rewardHint: "У вантажівці може бути схрон або полонений сталкер."
  },
  anomaly_route: {
    title: "Маршрут через аномалії",
    scene: "anomaly_field",
    intro: "Модуль: маршрут нестабільний. Рекомендація — рухатися повільно, використовувати болти, не довіряти прямій дорозі.",
    playerEffect: { fatigue: 1, infection: 0 },
    rewardHint: "Десь у полі може бути дивна знахідка або слід артефакту."
  },
  lost_stalker: {
    title: "Зниклий сталкер",
    scene: "abandoned_basement",
    intro: "Модуль: останній сигнал зниклого сталкера йшов знизу. Запис обривається на звуці металевого стуку.",
    playerEffect: { fatigue: 0, infection: 0 },
    rewardHint: "У підвалі можна знайти КПК, запис або живого свідка."
  }
};

const defeatScenes = {
  robbed: {
    title: "Пограбовані бандитами",
    scene: {
      name: "Канава біля старої дороги",
      description: "Персонажі приходять до тями в мокрій канаві. Руки болять від мотузок, губи розбиті, у вухах ще стоїть регіт бандитів. Небо сіре, поряд валяється порожня пачка від цигарок і чийсь старий бинт.",
      sounds: "Далекий мотор, каркання ворон, краплі з іржавої труби.",
      smells: "Мокра земля, кров, дим і дешевий тютюн.",
      objects: ["розрізана мотузка", "слід шин", "порожня пачка цигарок", "загублений ніж", "кров на траві"]
    },
    journal: "Поразка: бандити пограбували групу. Персонажі вижили, але частину спорядження втрачено.",
    apply(players){
      Object.values(players).forEach(p => {
        p.hp = Math.max(1, Math.min(Number(p.hpMax || 10), Math.ceil(Number(p.hpMax || 10) * 0.25)));
        p.fatigue = clamp(Number(p.fatigue || 0) + 2, 0, 5);
        p.ammo = Math.max(0, Math.floor(Number(p.ammo || 0) / 2));
      });
    }
  },
  anomaly: {
    title: "Викинуті аномалією",
    scene: {
      name: "Тиха вирва",
      description: "Персонажі лежать навколо неглибокої вирви. Усе навколо підозріло тихе. Металеві предмети стали теплими, а на шкірі залишився ледь помітний пил, що світиться в тіні.",
      sounds: "Глуха тиша, далекий гул, рідкісний тріск детектора.",
      smells: "Озон, палена трава, мокрий метал.",
      objects: ["теплі гільзи", "світний пил", "зламана гілка", "аномальний болт", "слід волочіння"]
    },
    journal: "Поразка: аномалія викинула групу з бою. Всі вижили, але отримали втому й зараження.",
    apply(players){
      Object.values(players).forEach(p => {
        p.hp = Math.max(1, Math.min(Number(p.hpMax || 10), Math.ceil(Number(p.hpMax || 10) * 0.35)));
        p.fatigue = clamp(Number(p.fatigue || 0) + 1, 0, 5);
        p.infection = clamp(Number(p.infection || 0) + 1, 0, 7);
      });
    }
  },
  captured: {
    title: "Прокинулись у полоні",
    scene: {
      name: "Сирий підвал",
      description: "Персонажі прокидаються на холодній підлозі. Двері зачинені, під стелею тремтить лампа. За стіною чути голоси — хтось сперечається, чи варто чекати викуп.",
      sounds: "Краплі води, кроки над головою, голоси за дверима.",
      smells: "Пліснява, іржа, стара картопля, волога тканина.",
      objects: ["зачинені двері", "іржавий цвях", "відро", "труба під стелею", "щілина у стіні"]
    },
    journal: "Поразка: група прокинулась у полоні. Зброю відібрано, але є шанс утекти.",
    apply(players){
      Object.values(players).forEach(p => {
        p.hp = Math.max(1, Math.min(Number(p.hpMax || 10), Math.ceil(Number(p.hpMax || 10) * 0.3)));
        p.fatigue = clamp(Number(p.fatigue || 0) + 2, 0, 5);
        p.ammo = 0;
      });
    }
  },
  saved: {
    title: "Їх витягнув незнайомець",
    scene: {
      name: "Покинутий вагончик",
      description: "Персонажі приходять до тями у старому вагончику. На столі стоїть теплий чай у металевій кружці. Біля дверей лежить записка: «Другого разу я вас не витягну».",
      sounds: "Стук дощу по даху, потріскування буржуйки, далекий гавкіт.",
      smells: "Дим, чай, мокра куртка, машинне мастило.",
      objects: ["металева кружка", "записка", "буржуйка", "старий спальник", "свіжі сліди біля дверей"]
    },
    journal: "Поразка: невідомий витягнув групу. Персонажі вижили, але тепер мають борг.",
    apply(players){
      Object.values(players).forEach(p => {
        p.hp = Math.max(2, Math.min(Number(p.hpMax || 10), Math.ceil(Number(p.hpMax || 10) * 0.45)));
        p.fatigue = clamp(Number(p.fatigue || 0) + 1, 0, 5);
      });
    }
  }
};

function loadAdventurePack(packId){
  const pack = adventurePacks[packId];
  if(!pack) return;
  loadSceneTemplate(pack.scene);
  Object.values(data.players || {}).forEach(p => {
    p.fatigue = clamp(Number(p.fatigue || 0) + Number(pack.playerEffect?.fatigue || 0), 0, 5);
    p.infection = clamp(Number(p.infection || 0) + Number(pack.playerEffect?.infection || 0), 0, 7);
  });
  addLog(`Пак пригоди: ${pack.title}. ${pack.intro}`, "public");
  addLog(`Зачіпка: ${pack.rewardHint}`, "gm");
  render();
}

function applyDefeatScene(defeatId){
  const defeat = defeatScenes[defeatId];
  if(!defeat) return;
  data.scene = clone(defeat.scene);
  data.enemies = [];
  data.combat = data.combat || {};
  data.combat.active = false;
  data.combat.lastEvent = defeat.title;
  defeat.apply(data.players || {});
  addLog(defeat.journal, "public");
  addLog(`Тиха сцена: ${defeat.title}.`, "gm");
  render();
}

function downloadTextFile(filename, text){
  const blob = new Blob([text], {type: "application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


function makeEnemyFromTemplate(templateId){
  const base = enemyTemplates[templateId] || enemyTemplates.bandit;
  const enemy = clone(base);
  enemy.id = makeId(`enemy_${templateId}`);
  enemy.defense = enemy.defense || 12;
  return enemy;
}


function restoreBaseScenePreservePlayers(){
  const base = ensureRoomData(null);
  const preservedPlayers = clone(data.players || base.players || {});
  const activePlayerId = data.meta?.activePlayerId;

  data.scene = clone(base.scene);
  data.enemies = clone(base.enemies || []);
  data.combat = clone(base.combat || {});
  data.journal = [
    { id: makeId("log"), visibility: "public", time: nowTime(), text: "Базову сцену відновлено. Вороги, оточення і бойовий стан повернуті до стартового стану." }
  ];

  data.players = preservedPlayers;
  data.meta = data.meta || {};
  data.meta.roomId = appSession.room;
  data.meta.syncMode = appSession.syncMode;
  data.meta.updatedAt = new Date().toISOString();

  if(activePlayerId && data.players[activePlayerId]){
    data.meta.activePlayerId = activePlayerId;
  } else {
    const firstPlayer = Object.keys(data.players || {})[0];
    data.meta.activePlayerId = firstPlayer || appSession.player || "fox";
  }

  render();
  save();
  showToast("Базову сцену відновлено.");
}


function loadSceneTemplate(templateId){
  const tpl = sceneTemplates[templateId];
  if(!tpl) return;
  data.scene = {
    name: tpl.name,
    description: tpl.description,
    sounds: tpl.sounds,
    smells: tpl.smells,
    objects: clone(tpl.objects)
  };
  data.enemies = (tpl.enemies || []).map(makeEnemyFromTemplate);
  if(data.combat?.active) buildTurnOrder();
  addLog(`Майстер завантажив сцену: ${tpl.name}.`, "public");
  render();
}

function addEnemyTemplate(templateId){
  const enemy = makeEnemyFromTemplate(templateId);
  data.enemies = Array.isArray(data.enemies) ? data.enemies : [];
  data.enemies.push(enemy);
  if(data.combat?.active) buildTurnOrder();
  addLog(`Майстер додав ворога: ${enemy.name}.`, "public");
  render();
}

function rollLoot(type){
  const table = lootTables[type] || lootTables.junk;
  const result = clone(table[Math.floor(Math.random() * table.length)]);
  const pid = targetPlayerId();
  const p = playerById(pid);
  const inv = inventoryForPlayer(pid);

  if(result.item === "Набої"){
    p.ammo = Number(p.ammo || 0) + Number(result.count || 0);
  } else {
    const existing = inv.find(i => i.item === result.item && i.note === result.note);
    if(existing) existing.count = Number(existing.count || 0) + Number(result.count || 1);
    else inv.push({ item: result.item, count: result.count || 1, note: result.note || "" });
  }

  addLog(`${p.name || pid}: ${result.text}`, "public");
  showToast("Лут додано.");
  render();
}


function storageKey(){
  return `${STORAGE_PREFIX}:${appSession.room}`;
}

function makeId(prefix="id"){
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function clone(obj){
  return JSON.parse(JSON.stringify(obj));
}

function migrateToRoomData(raw){
  if(!raw) return null;

  if(raw.schemaVersion >= 5 && raw.players && raw.scene){
    raw.meta = raw.meta || {};
    raw.meta.roomId = appSession.room;
    raw.meta.syncMode = appSession.syncMode;
    raw.players = raw.players || {};
    raw.enemies = raw.enemies || [];
    raw.journal = raw.journal || [];
    return raw;
  }

  // Migration from V3/V4 local structure: { player, scene, enemies, inventory, journal }
  if(raw.player && raw.scene){
    const migrated = clone(defaultRoomData);
    migrated.meta.roomId = appSession.room;
    migrated.players[appSession.player] = {
      id: appSession.player,
      name: raw.player.name || "Сталкер",
      hp: Number(raw.player.hp ?? 8),
      hpMax: Number(raw.player.hpMax ?? 12),
      fatigue: Number(raw.player.fatigue ?? 0),
      infection: Number(raw.player.infection ?? raw.player.radiation ?? 0),
      ammo: Number(raw.player.ammo ?? 0),
      activeEffects: raw.player.activeEffects || [],
      inventory: Array.isArray(raw.inventory) ? raw.inventory : clone(defaultRoomData.players.fox.inventory)
    };
    migrated.scene = raw.scene;
    migrated.enemies = raw.enemies || [];
    migrated.journal = (raw.journal || []).map(j => ({ id: j.id || makeId("log"), visibility: j.visibility || "public", time: j.time || nowTime(), text: j.text || "" }));
    return migrated;
  }

  return null;
}


function normalizeRoomDataLight(roomData){
  if(!roomData) return roomData;
  roomData.players = roomData.players || {};
  Object.entries(roomData.players).forEach(([pid,p]) => {
    if(!p.id) p.id = pid;
    if(!p.name) p.name = pid;
    p.hp = Number(p.hp ?? 10);
    p.hpMax = Number(p.hpMax ?? p.hp ?? 10);
    p.fatigue = Number(p.fatigue ?? 0);
    p.infection = Number(p.infection ?? 0);
    p.ammo = Number(p.ammo ?? 0);
    if(!p.weapon) p.weapon = "pm";
    if(!p.range) p.range = "far";
    if(!p.weaponCondition) p.weaponCondition = "normal";
    if(typeof p.weaponJammed !== "boolean") p.weaponJammed = false;
    p.defense = Number(p.defense ?? 12);
    p.defenseMax = Number(p.defenseMax ?? p.defense ?? 12);
    p.armor = Number(p.armor ?? 0);
    p.stats = p.stats || {};
    ["endurance","accuracy","agility","perception","intuition","charisma"].forEach(k => {
      p.stats[k] = Number(p.stats[k] ?? 0);
    });
    p.activeEffects = Array.isArray(p.activeEffects) ? p.activeEffects : [];
    p.inventory = Array.isArray(p.inventory) ? p.inventory : [];
  });

  roomData.enemies = Array.isArray(roomData.enemies) ? roomData.enemies : [];
  roomData.enemies.forEach((e,idx) => {
    if(!e.id) e.id = makeId("enemy");
    if(!e.name) e.name = `Ворог ${idx+1}`;
    if(!e.state) e.state = "цілий";
    if(!e.color) e.color = "green";
    e.defense = Number(e.defense ?? 12);
    e.visible = e.visible !== false;
    e.gm = e.gm || {};
    e.gm.hp = Number(e.gm.hp ?? 8);
    e.gm.hpMax = Number(e.gm.hpMax ?? e.gm.hp ?? 8);
    e.gm.ammo = Number(e.gm.ammo ?? 0);
    if(!e.gm.morale) e.gm.morale = "невідомо";
    e.effects = Array.isArray(e.effects) ? e.effects : [];
  });

  roomData.scene = roomData.scene || {};
  roomData.journal = Array.isArray(roomData.journal) ? roomData.journal : [];
  roomData.combat = roomData.combat || {};
  roomData.meta = roomData.meta || {};
  return roomData;
}


function ensureRoomData(roomData){
  const data = migrateToRoomData(roomData) || clone(defaultRoomData);
  data.schemaVersion = 5;
  data.meta = data.meta || {};
  data.meta.roomId = appSession.room;
  data.meta.syncMode = appSession.syncMode;
  data.players = data.players || {};
  data.meta.activePlayerId = data.meta.activePlayerId || appSession.player || Object.keys(data.players)[0] || "fox";
  data.combat = data.combat || { active: false, round: 0, turnIndex: 0, turnOrder: [], lastEvent: "Бій ще не почався.",
    strictTurns: true };

  Object.values(data.players || {}).forEach(p => {
    if(!p.weapon) p.weapon = "pm";
    if(!p.range) p.range = "far";
    if(!p.weaponCondition) p.weaponCondition = "normal";
    if(typeof p.weaponJammed !== "boolean") p.weaponJammed = false;
  });
  if(!data.players[appSession.player]){
    data.players[appSession.player] = {
      id: appSession.player,
      name: appSession.player,
      hp: 10,
      hpMax: 10,
      fatigue: 0,
      infection: 0,
      ammo: 10,
      defense: 12,
      defenseMax: 12,
      armor: 0,
      activeEffects: [],
      stats: { endurance: 0, accuracy: 0, agility: 0, perception: 0, intuition: 0, charisma: 0 },
      inventory: clone(defaultRoomData.players.fox.inventory)
    };
  }
  return normalizeRoomDataLight(data);
}

function load(){
  try {
    const saved = localStorage.getItem(storageKey());
    if(saved) return ensureRoomData(JSON.parse(saved));

    // Try to migrate older room/player-specific V4.1 storage.
    const oldSpecific = localStorage.getItem(`polovyi_modul_v4_1:${appSession.room}:${appSession.player}`);
    if(oldSpecific) return ensureRoomData(JSON.parse(oldSpecific));

    // Try to migrate earliest MVP storage.
    const oldGlobal = localStorage.getItem("kpk_zony_styled_mvp_v1");
    if(oldGlobal) return ensureRoomData(JSON.parse(oldGlobal));
  } catch(e){}
  return ensureRoomData(null);
}

let data = load();

const syncAdapter = {
  mode: "firebase",
  status: "онлайн",
  app: null,
  db: null,
  roomRef: null,
  unsubscribe: null,
  init(){
    appSession.syncMode = "firebase";

    if(!window.firebase || !window.firebase.database){
      return Promise.reject(new Error("Firebase SDK не завантажився. Перевір інтернет або блокувальники скриптів."));
    }

    if(!firebase.apps.length){
      this.app = firebase.initializeApp(firebaseConfig);
    } else {
      this.app = firebase.app();
    }

    this.db = firebase.database();
    this.roomRef = this.db.ref(`rooms/${appSession.room}`);

    return this.roomRef.get().then(snapshot => {
      if(!snapshot.exists()){
        const firstData = ensureRoomData(data);
        firstData.meta.syncMode = "firebase";
        firstData.meta.roomId = appSession.room;
        firstData.meta.createdAt = firstData.meta.createdAt || new Date().toISOString();
        firstData.meta.updatedAt = new Date().toISOString();
        return this.roomRef.set(firstData);
      }
    }).then(() => {
      this.subscribe();
    });
  },
  save(roomData){
    if(isApplyingRemote || !this.roomRef) return;

    roomData.meta.updatedAt = new Date().toISOString();
    roomData.meta.roomId = appSession.room;
    roomData.meta.syncMode = "firebase";

    localStorage.setItem(storageKey(), JSON.stringify(roomData));

    clearTimeout(pendingSaveTimer);
    pendingSaveTimer = setTimeout(() => {
      this.roomRef.set(roomData).catch(err => {
        console.error("Firebase save error", err);
        showToast("Не вдалося записати в Firebase.");
      });
    }, 180);
  },
  subscribe(){
    if(!this.roomRef) return () => {};
    this.roomRef.on("value", snapshot => {
      if(!snapshot.exists()) return;
      const remote = snapshot.val();
      isApplyingRemote = true;
      data = ensureRoomData(remote);
      localStorage.setItem(storageKey(), JSON.stringify(data));
      render();
      isApplyingRemote = false;
      isBootstrappingRemote = false;
    }, err => {
      console.error("Firebase subscribe error", err);
      const runtimeError = document.querySelector("#runtimeError");
      if(runtimeError) runtimeError.textContent = "Firebase помилка: " + err.message;
      showToast("Помилка Firebase: " + err.message);
    });
    this.unsubscribe = () => this.roomRef.off("value");
    return this.unsubscribe;
  }
};

function save(){
  if(isApplyingRemote) return;
  syncAdapter.save(data);
}

function currentPlayerId(){
  if(appSession.role === "gm"){
    const ids = Object.keys(data.players || {});
    const active = data.meta?.activePlayerId;
    if(active && data.players[active]) return active;
    return ids[0] || appSession.player;
  }
  return appSession.player;
}

function setActivePlayer(playerId){
  if(!data.players[playerId]) return;
  data.meta.activePlayerId = playerId;
  addLog(`Майстер обрав активного персонажа: ${data.players[playerId].name || playerId}.`, "gm");
  render();
}

function targetPlayerId(){
  const select = document.querySelector("#lootTargetPlayer");
  if(select && data.players[select.value]) return select.value;
  return currentPlayerId();
}

function playerById(playerId){
  if(!data.players[playerId]) return currentPlayer();
  return data.players[playerId];
}

function inventoryForPlayer(playerId){
  const p = playerById(playerId);
  p.inventory = Array.isArray(p.inventory) ? p.inventory : [];
  return p.inventory;
}

function currentPlayer(){
  if(!data.players[currentPlayerId()]){
    data.players[currentPlayerId()] = {
      id: currentPlayerId(),
      name: currentPlayerId(),
      hp: 10,
      hpMax: 10,
      fatigue: 0,
      infection: 0,
      ammo: 10,
      defense: 12,
      defenseMax: 12,
      armor: 0,
      activeEffects: [],
      stats: { endurance: 0, accuracy: 0, agility: 0, perception: 0, intuition: 0, charisma: 0 },
      inventory: []
    };
  }
  return data.players[currentPlayerId()];
}

function currentInventory(){
  return inventoryForPlayer(currentPlayerId());
}


function enforcePlayerAccessGuards(){
  const isGm = appSession.role === "gm";

  document.querySelectorAll(".gm-only").forEach(el => {
    if(!isGm){
      el.hidden = true;
      el.style.display = "none";
      el.classList.remove("active");
    } else {
      el.hidden = false;
      el.style.removeProperty("display");
    }
  });

  if(!isGm){
    const masterScreen = document.querySelector('[data-screen="master"]');
    if(masterScreen){
      masterScreen.hidden = true;
      masterScreen.classList.remove("active");
      masterScreen.style.display = "none";
    }

    const masterBtn = document.querySelector('.nav-btn[data-target="master"]');
    if(masterBtn){
      masterBtn.hidden = true;
      masterBtn.classList.remove("active");
      masterBtn.style.display = "none";
    }

    const activeMasterScreen = document.querySelector('.screen.active[data-screen="master"]');
    if(activeMasterScreen) switchScreen("state");
  }
}

function applyRoleMode(){
  document.body.classList.toggle("role-gm", appSession.role === "gm");
  document.body.classList.toggle("role-player", appSession.role !== "gm");
  document.body.classList.toggle("sync-local", appSession.syncMode === "local");
  document.body.classList.toggle("sync-online", appSession.syncMode === "firebase");

  const roomLabel = document.querySelector("#roomLabel");
  const roleLabel = document.querySelector("#roleLabel");
  const playerLabel = document.querySelector("#playerLabel");
  const syncLabel = document.querySelector("#syncLabel");
  const accessLabel = document.querySelector("#accessLabel");

  if(roomLabel) roomLabel.textContent = appSession.room;
  if(roleLabel) roleLabel.textContent = appSession.role === "gm" ? "Майстер" : "Гравець";
  if(playerLabel) playerLabel.textContent = appSession.role === "gm" ? currentPlayerId() : appSession.player;
  if(syncLabel) syncLabel.textContent = syncAdapter.status;
  if(accessLabel) accessLabel.textContent = appSession.access === "gm" ? "ключ Майстра" : (appSession.access === "denied" ? "ключ відхилено" : "звичайний");

  if(appSession.role !== "gm"){
    const activeMaster = document.querySelector('.screen.active[data-screen="master"]');
    if(activeMaster) switchScreen("state");
  }
  enforcePlayerAccessGuards();

}

function clamp(num, min, max){ return Math.max(min, Math.min(max, Number(num)||0)); }

function dots(current, max, mode="normal"){
  const val = clamp(current,0,max);
  let out = "";
  for(let i=1;i<=max;i++){
    let cls = "dot";
    if(i<=val) cls += " filled";
    if(mode==="rad" && i<=val) cls += val>=4 ? " danger" : " warn";
    if(mode==="fatigue" && i<=val) cls += val>=4 ? " danger" : "";
    out += `<span class="${cls}"></span>`;
  }
  return out;
}

function enemyColorClass(color){
  if(color === "green") return "state-green";
  if(color === "orange") return "state-orange";
  if(color === "yellow") return "state-yellow";
  if(color === "red") return "state-red";
  return "";
}



function playerTurnId(playerId = appSession.player){
  return `player:${playerId}`;
}

function activeCombatantId(){
  const combat = data.combat || {};
  const order = combat.turnOrder || [];
  if(!combat.active || !order.length) return null;
  return order[combat.turnIndex % order.length] || null;
}

function isCurrentPlayerTurn(){
  if(appSession.role === "gm") return true;
  if(!data.combat?.active) return true;
  if(!data.combat.strictTurns) return true;
  return activeCombatantId() === playerTurnId(appSession.player);
}

function activeTurnName(){
  const active = activeCombatant();
  return active ? active.name : "невідомо";
}

function turnLockMessage(){
  if(!data.combat?.active) return "";
  if(!data.combat.strictTurns) return "";
  return `Зараз не твій хід. Активний хід: ${activeTurnName()}.`;
}

function refreshActionLocks(){
  const locked = appSession.role !== "gm" && data.combat?.active && data.combat.strictTurns && !isCurrentPlayerTurn();
  document.querySelectorAll("[data-action]").forEach(btn => {
    btn.classList.toggle("locked", locked);
    btn.setAttribute("aria-disabled", locked ? "true" : "false");
  });
}

function toggleStrictTurns(){
  data.combat = data.combat || {};
  data.combat.strictTurns = !data.combat.strictTurns;
  addLog(data.combat.strictTurns ? "Бойовий режим: строгі ходи увімкнено." : "Бойовий режим: вільні дії увімкнено.", "public");
  render();
}


function getCombatants(){
  const playerCombatants = Object.keys(data.players || {}).map(pid => ({
    id: `player:${pid}`,
    type: "player",
    ref: pid,
    name: data.players[pid].name || pid,
    state: `${data.players[pid].hp}/${data.players[pid].hpMax} HP`
  }));

  const enemyCombatants = (data.enemies || []).filter(e => e.visible !== false && e.state !== "вибув").map(e => ({
    id: `enemy:${e.id}`,
    type: "enemy",
    ref: e.id,
    name: e.name,
    state: e.state || "цілий"
  }));

  return [...playerCombatants, ...enemyCombatants];
}

function buildTurnOrder(){
  data.combat.turnOrder = getCombatants().map(c => c.id);
  data.combat.turnIndex = 0;
}

function activeCombatant(){
  const combat = data.combat || {};
  const order = combat.turnOrder || [];
  if(!order.length) return null;
  const id = order[combat.turnIndex % order.length];
  return getCombatants().find(c => c.id === id) || null;
}

function startCombat(){
  data.combat = data.combat || {};
  data.combat.active = true;
  if(typeof data.combat.strictTurns !== "boolean") data.combat.strictTurns = true;
  data.combat.round = 1;
  buildTurnOrder();
  const active = activeCombatant();
  data.combat.lastEvent = active ? `Перший хід: ${active.name}.` : "Бій почався.";
  addLog(`Бій почався. Раунд 1.${active ? " Перший хід: " + active.name + "." : ""}`, "public");
  render();
}

function nextTurn(){
  if(!data.combat?.active){
    startCombat();
    return;
  }
  if(!data.combat.turnOrder?.length) buildTurnOrder();
  data.combat.turnIndex = Number(data.combat.turnIndex || 0) + 1;
  if(data.combat.turnIndex >= data.combat.turnOrder.length){
    data.combat.turnIndex = 0;
    data.combat.round = Number(data.combat.round || 1) + 1;
    addLog(`Раунд ${data.combat.round}.`, "public");
  }
  const active = activeCombatant();
  data.combat.lastEvent = active ? `Активний хід: ${active.name}.` : "Наступний хід.";
  addLog(active ? `Хід: ${active.name}.` : "Наступний хід.", "public");
  render();
}

function endCombat(){
  data.combat = data.combat || {};
  data.combat.active = false;
  data.combat.lastEvent = "Бій завершено.";
  addLog("Бій завершено.", "public");
  render();
}

function findEnemyById(enemyId){
  return (data.enemies || []).find(e => e.id === enemyId);
}

function damageEnemy(enemyId, amount){
  const enemy = findEnemyById(enemyId);
  if(!enemy) return;
  enemy.gm = enemy.gm || { hp: 8, hpMax: 8, ammo: 0, morale: "невідомо" };
  enemy.gm.hp = clamp(Number(enemy.gm.hp || enemy.gm.hpMax || 8) - amount, 0, Number(enemy.gm.hpMax || 8));

  if(enemy.gm.hp <= 0){
    enemy.state = "вибув";
    enemy.color = "red";
    enemy.visible = true;
    addLog(`${enemy.name} вибув із бою.`, "public");
  } else if(enemy.gm.hp <= Math.ceil(Number(enemy.gm.hpMax || 8) * 0.3)){
    enemy.state = "ледь стоїть";
    enemy.color = "red";
    addLog(`${enemy.name}: ледь стоїть.`, "public");
  } else if(enemy.gm.hp < Number(enemy.gm.hpMax || 8)){
    enemy.state = "поранений";
    enemy.color = "orange";
    addLog(`${enemy.name}: поранений.`, "public");
  }
  render();
}

function healEnemy(enemyId, amount){
  const enemy = findEnemyById(enemyId);
  if(!enemy) return;
  enemy.gm = enemy.gm || { hp: 8, hpMax: 8, ammo: 0, morale: "невідомо" };
  enemy.gm.hp = clamp(Number(enemy.gm.hp || 0) + amount, 0, Number(enemy.gm.hpMax || 8));
  if(enemy.gm.hp >= Number(enemy.gm.hpMax || 8)){
    enemy.state = "цілий";
    enemy.color = "green";
  } else {
    enemy.state = "поранений";
    enemy.color = "orange";
  }
  addLog(`${enemy.name}: HP ${enemy.gm.hp}/${enemy.gm.hpMax}.`, "gm");
  render();
}

function toggleEnemyCover(enemyId){
  const enemy = findEnemyById(enemyId);
  if(!enemy) return;
  enemy.cover = !enemy.cover;
  enemy.action = enemy.cover ? "в укритті" : "вийшов з укриття";
  addLog(`${enemy.name}: ${enemy.action}.`, "public");
  render();
}

function moraleCheck(){
  const visibleEnemies = (data.enemies || []).filter(e => e.visible !== false && e.state !== "вибув");
  if(!visibleEnemies.length){
    addLog("Мораль ворогів: перевіряти нікого.", "gm");
    render();
    return;
  }
  const weak = visibleEnemies.filter(e => ["наляканий", "ледь стоїть", "тікає"].includes(e.state)).length;
  const roll = rollDie(20);
  let result = "тримаються";
  if(roll <= 6 + weak) result = "ламаються або відступають";
  else if(roll <= 10 + weak) result = "нервують і шукають укриття";
  addLog(`Перевірка моралі ворогів: d20=${roll}. Результат: ${result}.`, "public");
  showToast(`Мораль: ${result}`);
  render();
}


function enemyAttackTargetId(){
  const select = qs("#enemyAttackTarget");
  if(select && data.players[select.value]) return select.value;
  if(data.combat?.enemyTargetPlayerId && data.players[data.combat.enemyTargetPlayerId]) return data.combat.enemyTargetPlayerId;
  return currentPlayerId();
}


function enemyIsMutant(enemy){
  const tags = Array.isArray(enemy?.tags) ? enemy.tags.join(" ").toLowerCase() : "";
  const name = String(enemy?.name || "").toLowerCase();
  return tags.includes("мутант") || ["тушкан","сліпий пес","псевдособака","кровосос","контролер"].some(x => name.includes(x));
}

function enemyMutantKind(enemy){
  const name = String(enemy?.name || "").toLowerCase();
  if(name.includes("тушкан")) return "tushkan";
  if(name.includes("сліпий пес")) return "blinddog";
  if(name.includes("псевдособака")) return "pseudodog";
  if(name.includes("кровосос")) return "bloodsucker";
  if(name.includes("контролер")) return "controller";
  return enemyIsMutant(enemy) ? "mutant" : "human";
}

function rollDamageFormula(formula){
  if(formula === "1") return { value:1, text:"1" };
  const m = String(formula || "d4").match(/^d(\d+)([+-]\d+)?$/);
  if(!m) return { value:1, text:"1" };
  const sides = Number(m[1]);
  const bonus = Number(m[2] || 0);
  const die = rollDie(sides);
  return { value: Math.max(0, die + bonus), text: `d${sides}${bonus ? (bonus > 0 ? "+" : "") + bonus : ""} = ${die}${bonus ? (bonus > 0 ? "+" : "") + bonus : ""}` };
}

function resolveMutantDamage(enemy, mode, hits, target){
  const kind = enemyMutantKind(enemy);
  const notes = [];
  let damage = 0;
  let formulaText = "";

  if(hits <= 0) return { damage:0, notes:["промах"], formulaText:"" };

  if(kind === "tushkan"){
    damage = hits;
    formulaText = `${hits}×1`;
    if(hits >= 2) notes.push("ціль втрачає темп: -1 до наступної перевірки Вправності або +1 Втома за рішенням Майстра");
  } else if(kind === "blinddog"){
    for(let i=0;i<hits;i++){
      const r = rollDamageFormula("d4");
      damage += r.value;
      formulaText += (formulaText ? "; " : "") + r.text;
    }
    if(mode === "burst" && hits >= 2) notes.push("зграя рве: ціль у поганій позиції");
  } else if(kind === "pseudodog"){
    const r = rollDamageFormula("d4+1");
    damage = r.value;
    formulaText = r.text;
    if(hits >= 2){
      target.fatigue = clamp(Number(target.fatigue || 0) + 1, 0, 5);
      notes.push("+1 Втома або падіння");
    }
    if(mode === "burst" && hits >= 3){
      damage += 2;
      notes.push("+2 шкоди за повний наскок");
    }
  } else if(kind === "bloodsucker"){
    if(mode === "aimed"){
      const r = rollDamageFormula("d6");
      damage = r.value;
      formulaText = r.text;
      enemy.gm = enemy.gm || {};
      enemy.gm.hp = clamp(Number(enemy.gm.hp || 0) + 1, 0, Number(enemy.gm.hpMax || 26));
      notes.push("кровосос лікується на 1 HP");
    } else if(mode === "normal"){
      const r = rollDamageFormula("d6");
      damage = r.value;
      formulaText = r.text;
      if(hits >= 2){
        target.fatigue = clamp(Number(target.fatigue || 0) + 1, 0, 5);
        notes.push("хватка: +1 Втома або утримання");
      }
      enemy.gm = enemy.gm || {};
      enemy.gm.hp = clamp(Number(enemy.gm.hp || 0) + 1, 0, Number(enemy.gm.hpMax || 26));
      notes.push("кровосос лікується на 1 HP");
    } else {
      const r = rollDamageFormula("d6+2");
      damage = r.value;
      formulaText = r.text;
      if(hits >= 2){
        enemy.gm = enemy.gm || {};
        enemy.gm.hp = clamp(Number(enemy.gm.hp || 0) + 2, 0, Number(enemy.gm.hpMax || 26));
        notes.push("кровосос лікується на 2 HP або ціль отримує +1 Втома");
      }
      if(hits >= 3){
        damage += 2;
        notes.push("+2 шкоди за повний розрив");
      }
    }
  } else if(kind === "controller"){
    damage = mode === "aimed" ? 0 : (mode === "normal" ? 0 : 0);
    formulaText = "контроль";
    target.fatigue = clamp(Number(target.fatigue || 0) + 1, 0, 5);
    if(mode === "aimed") notes.push("Погляд: +1 Втома або -1 до наступного кидка");
    if(mode === "normal") notes.push("Наказ у голові: відкриття / паніка / втрата реакції");
    if(mode === "burst") notes.push("Ментальний злам: предмет / постріл не туди / короткий контроль при 3 влучаннях");
  } else {
    const r = rollDamageFormula("d4");
    damage = r.value;
    formulaText = r.text;
    if(hits >= 2) notes.push("додаткове влучання дає стан або втрату позиції");
  }

  return { damage, notes, formulaText };
}

function applyFierceEnemyDebuff(enemy, rolls, hits){
  addEnemyEffect(enemy, "exposed");
  enemy.action = "розкрився після лютої атаки";
  enemy.lastFierceAttack = true;
  const criticalFail = hits === 0 && rolls.includes(1);
  if(criticalFail){
    enemy.defense = Math.max(1, Number(enemy.defense || 12) - 1);
    enemy.action = "провалив ривок і відкрився";
  }
  return criticalFail;
}

function attackModeConfig(mode, enemy){
  const mutant = enemyIsMutant(enemy);
  if(mutant){
    const configs = {
      aimed: { label: "обережна атака", dice: 1, mod: 2, ammo: 0, damage: 0 },
      normal: { label: "стандартна атака", dice: 2, mod: 0, ammo: 0, damage: 0 },
      burst: { label: "люта атака", dice: 3, mod: -2, ammo: 0, damage: 0 }
    };
    return configs[mode] || configs.normal;
  }

  const configs = {
    aimed: { label: "точний постріл", dice: 1, mod: 2, ammo: 1, damage: 1 },
    normal: { label: "бойовий постріл", dice: 2, mod: 0, ammo: 2, damage: 1 },
    burst: { label: "черга", dice: 3, mod: -2, ammo: 3, damage: 1 },
    shotgun: { label: "обріз зблизька", dice: 1, mod: 1, ammo: 1, damage: 3 }
  };
  return configs[mode] || configs.normal;
}

function enemyAttack(enemyId, mode){
  const enemy = findEnemyById(enemyId);
  if(!enemy) return;
  const targetId = enemyAttackTargetId();
  const target = playerById(targetId);
  const cfg = attackModeConfig(mode, enemy);
  const mutant = enemyIsMutant(enemy);
  enemy.gm = enemy.gm || { hp: 8, hpMax: 8, ammo: 0, morale: "невідомо" };

  if(!mutant && Number(enemy.gm.ammo || 0) < cfg.ammo){
    addLog(`${enemy.name} намагається виконати ${cfg.label}, але бракує набоїв.`, "public");
    showToast("У ворога бракує набоїв.");
    render();
    return;
  }

  if(!mutant) enemy.gm.ammo = Number(enemy.gm.ammo || 0) - cfg.ammo;

  const rolls = Array.from({length: cfg.dice}, () => rollDie(20));
  const suppressionPenalty = enemyEffects(enemy).includes("suppressed") ? -1 : 0;
  const totals = rolls.map(r => r + cfg.mod + suppressionPenalty);
  if(suppressionPenalty) removeEnemyEffect(enemy, "suppressed");

  const targetNumber = Number(target.defense || 12) + (target.cover ? 2 : 0);
  const hits = totals.filter(t => t >= targetNumber).length;

  let rawDamage = 0;
  let notes = [];
  let damageFormula = "";

  if(mutant){
    const resolved = resolveMutantDamage(enemy, mode, hits, target);
    rawDamage = resolved.damage;
    notes = resolved.notes || [];
    damageFormula = resolved.formulaText || "";
  } else {
    rawDamage = hits * cfg.damage;
    damageFormula = hits ? `${hits}×${cfg.damage}` : "";
  }

  const armor = Number(target.armor || 0);
  const totalDamage = Math.max(0, rawDamage - armor);

  if(totalDamage > 0){
    target.hp = clamp(Number(target.hp || 0) - totalDamage, 0, Number(target.hpMax || 10));
  }

  let criticalFail = false;
  if(mode === "burst"){
    criticalFail = applyFierceEnemyDebuff(enemy, rolls, hits);
    if(!mutant){
      enemy.recoil = true;
      enemy.action = "розкрив позицію після черги";
    }
  }

  const rollText = rolls.map((r,i) => `${r}→${totals[i]}`).join(", ");
  const targetName = target.name || targetId;
  let result = `${enemy.name}: ${cfg.label} по ${targetName}. Кидки: ${rollText}. Ціль: ${targetNumber}. `;
  result += hits ? `Влучань: ${hits}. Шкода: ${totalDamage}${damageFormula ? ` (${damageFormula})` : ""}${armor ? `, броня ${armor}` : ""}. ${targetName}: HP ${target.hp}/${target.hpMax}.` : "Промах.";
  if(notes.length) result += ` Ефекти: ${notes.join("; ")}.`;
  if(mode === "burst") result += criticalFail ? " Провал лютої атаки: ворог розкрився і втратив позицію." : " Після атаки ворог розкрився: атаки по ньому +1 до його наступного ходу.";
  if(!mutant) result += ` Набої ворога: ${enemy.gm.ammo}.`;

  data.combat = data.combat || {};
  data.combat.lastEvent = result;
  addLog(result, "public");

  if(target.hp <= 0){
    addLog(`${targetName} вибув зі сцени. Майстер вирішує наслідок: поранення, полон, втрата спорядження або тиха сцена.`, "public");
  }

  const toastHtml = `<div class="toast-roll"><strong>${escapeHtml(enemy.name)}: ${escapeHtml(cfg.label)}</strong><br>🎲 ${escapeHtml(rollText)}<br>Ціль: ${escapeHtml(String(targetNumber))} · Влучань: ${escapeHtml(String(hits))}<br>Шкода: ${escapeHtml(String(totalDamage))} · ${escapeHtml(targetName)} HP ${escapeHtml(String(target.hp))}/${escapeHtml(String(target.hpMax))}${notes.length ? `<br>${escapeHtml(notes.join("; "))}` : ""}</div>`;
  showToast(toastHtml, true, 8000);

  render();
}



function ensureGmCombatFixedBar(){
  let bar = qs("#gmCombatStickyBar");
  if(bar) return bar;

  bar = document.createElement("div");
  bar.id = "gmCombatStickyBar";
  bar.className = "gm-combat-sticky gm-only";
  bar.hidden = true;
  document.body.appendChild(bar);
  return bar;
}


function combatantById(combatantId){
  return getCombatants().find(c => c.id === combatantId) || null;
}

function combatTargetId(){
  const combat = data.combat || {};
  if(combat.targetCombatantId && combatantById(combat.targetCombatantId)) return combat.targetCombatantId;

  if(combat.targetEnemyId && combatantById(`enemy:${combat.targetEnemyId}`)) return `enemy:${combat.targetEnemyId}`;
  if(combat.enemyTargetPlayerId && combatantById(`player:${combat.enemyTargetPlayerId}`)) return `player:${combat.enemyTargetPlayerId}`;

  const active = activeCombatant();
  if(active) return active.id;

  const first = getCombatants()[0];
  return first?.id || "";
}

function combatTargetName(){
  const target = combatantById(combatTargetId());
  return target ? target.name : "немає";
}

function setCombatTargetById(combatantId){
  const target = combatantById(combatantId);
  if(!target) return;

  data.combat = data.combat || {};
  data.combat.targetCombatantId = combatantId;

  if(target.type === "enemy"){
    data.combat.targetEnemyId = target.ref;
  }
  if(target.type === "player"){
    data.combat.enemyTargetPlayerId = target.ref;
  }

  data.combat.lastEvent = `Ціль: ${target.name}.`;
  addLog(`Майстер обрав ціль: ${target.name}.`, "gm");
  render();
}

function setActiveCombatantById(combatantId){
  data.combat = data.combat || {};
  const combatants = getCombatants();
  const order = combatants.map(c => c.id);
  if(!order.length) return;

  data.combat.turnOrder = order;
  const idx = order.indexOf(combatantId);
  if(idx < 0) return;

  data.combat.turnIndex = idx;
  const active = activeCombatant();

  if(active?.type === "player"){
    data.meta = data.meta || {};
    data.meta.activePlayerId = active.ref;
  }

  data.combat.lastEvent = active ? `Активний хід: ${active.name}.` : "Активний учасник змінений.";
  addLog(active ? `Майстер обрав активний хід: ${active.name}.` : "Майстер змінив активний хід.", "gm");
  render();
}

function renderGmCombatStickyBar(){
  const bar = ensureGmCombatFixedBar();
  if(!bar) return;

  if(appSession.role !== "gm"){
    bar.hidden = true;
    bar.innerHTML = "";
    return;
  }

  const combat = data.combat || {};
  const combatants = getCombatants();
  const active = activeCombatant();
  const activeId = active?.id || "";
  const targetId = combatTargetId();
  const targetName = combatTargetName();
  const round = combat.active ? Number(combat.round || 1) : 0;
  const mode = gmCombatBarMode === "target" ? "target" : "actor";

  bar.hidden = false;
  bar.innerHTML = `
    <div class="gm-dock-main two-row">
      <button class="gm-dock-next" id="gmStickyNextTurn" type="button" title="Почати / наступний хід">▶</button>

      <div class="gm-dock-current">
        <div><span>${combat.active ? `Р${escapeHtml(String(round))}` : "Бій"}</span><strong>Хід: ${active ? escapeHtml(active.name) : "немає"}</strong></div>
        <div><span>Ціль</span><strong>${escapeHtml(targetName)}</strong></div>
      </div>

      <div class="gm-dock-modes">
        <button type="button" class="gm-mode-btn ${mode === "actor" ? "active" : ""}" data-gm-combat-mode="actor">Хід</button>
        <button type="button" class="gm-mode-btn ${mode === "target" ? "active" : ""}" data-gm-combat-mode="target">Ціль</button>
      </div>

      <div class="gm-dock-order">
        ${combatants.map(c => {
          const isActive = activeId === c.id;
          const isTarget = targetId === c.id;
          const cls = [c.type, isActive ? "active" : "", isTarget ? "target" : ""].filter(Boolean).join(" ");
          return `<button type="button" class="gm-turn-chip ${cls}" data-sticky-combatant="${escapeAttr(c.id)}">
            <span>${escapeHtml(c.name)}</span>
          </button>`;
        }).join("") || `<span class="gm-turn-empty">немає учасників</span>`}
      </div>
    </div>
  `;
}
function renderCombatSummary(){
  const target = qs("#combatSummary");
  if(!target) return;
  const combat = data.combat || {active:false};
  const active = activeCombatant();
  const order = getCombatants();
  target.innerHTML = `
    <div class="turn-banner">${combat.active ? `Бій активний · Раунд ${combat.round || 1}${active ? " · Хід: " + escapeHtml(active.name) : ""}` : "Бій не активний"}</div>
    <div><span class="turn-mode ${combat.strictTurns ? "strict" : "free"}">${combat.strictTurns ? "Строгі ходи" : "Вільні дії"}</span>${!isCurrentPlayerTurn() && appSession.role !== "gm" ? `<span class="turn-mode strict">Дії заблоковано</span>` : ""}</div>
    <div>${order.map(c => `<span class="combat-pill ${active && active.id === c.id ? "active" : ""}">${escapeHtml(c.name)}</span>`).join("") || '<span class="combat-pill">Немає учасників</span>'}</div>
    <div class="copy-mini">${escapeHtml(combat.lastEvent || "")}</div>
  `;
}

function renderGmCombatPanel(){
  const target = qs("#gmCombatPanel");
  if(!target) return;
  const combat = data.combat || {active:false};
  const active = activeCombatant();
  const enemies = data.enemies || [];
  target.innerHTML = `
    <div class="turn-banner">${combat.active ? `Раунд ${combat.round || 1}${active ? " · активний: " + escapeHtml(active.name) : ""}` : "Бій не активний"}</div>
    <div class="target-line"><strong>Режим:</strong> ${combat.strictTurns ? "строгі ходи — гравці діють тільки у свій хід" : "вільні дії — гравці можуть діяти будь-коли"}</div>
    <div class="enemy-action-target"><label>Ціль атак ворогів <select id="enemyAttackTarget"></select></label></div>
    <div class="combat-roster">
      ${enemies.map(e => {
        const gm = e.gm || {};
        return `<div class="combat-card">
          <h4>${escapeHtml(e.name)} <small>${escapeHtml(e.state || "")}</small></h4>
          <div class="combat-stats">
            <span>HP: ${escapeHtml(String(gm.hp ?? "?"))}/${escapeHtml(String(gm.hpMax ?? "?"))}</span>
            <span>Набої: ${escapeHtml(String(gm.ammo ?? "?"))}</span>
            <span>Мораль: ${escapeHtml(gm.morale || "невідомо")}</span>
            <span>${e.cover ? "В укритті" : "Без укриття"}</span>
          </div>
          <div class="combat-actions">
            <button class="metal-btn danger" data-enemy-attack="${escapeAttr(e.id)}" data-mode="aimed">Точний постріл</button>
            <button class="metal-btn danger" data-enemy-attack="${escapeAttr(e.id)}" data-mode="normal">Бойовий постріл</button>
            <button class="metal-btn danger" data-enemy-attack="${escapeAttr(e.id)}" data-mode="burst">Черга</button>
            <button class="metal-btn danger" data-enemy-attack="${escapeAttr(e.id)}" data-mode="shotgun">Обріз</button>
            <button class="metal-btn danger" data-damage-enemy="${escapeAttr(e.id)}" data-amount="1">-1 HP</button>
            <button class="metal-btn danger" data-damage-enemy="${escapeAttr(e.id)}" data-amount="3">-3 HP</button>
            <button class="metal-btn" data-heal-enemy="${escapeAttr(e.id)}" data-amount="1">+1 HP</button>
            <button class="metal-btn" data-toggle-cover="${escapeAttr(e.id)}">${e.cover ? "Без укриття" : "В укриття"}</button>
            <button class="metal-btn danger" data-enemy-state-by-id="${escapeAttr(e.id)}" data-state="вибув" data-color="red">Вибув</button>
          </div>
        </div>`;
      }).join("") || '<div class="combat-card">Ворогів у сцені немає.</div>'}
    </div>
  `;
}



function captureFocusState(){
  const el = document.activeElement;
  if(!el || !["INPUT","TEXTAREA","SELECT"].includes(el.tagName)) return null;

  const state = {
    tag: el.tagName,
    id: el.id || "",
    name: el.name || "",
    value: el.value,
    selectionStart: typeof el.selectionStart === "number" ? el.selectionStart : null,
    selectionEnd: typeof el.selectionEnd === "number" ? el.selectionEnd : null,
    attrs: {}
  };

  ["data-player","data-enemy","data-item","data-field"].forEach(attr => {
    if(el.hasAttribute(attr)) state.attrs[attr] = el.getAttribute(attr);
  });

  return state;
}

function selectorFromFocusState(state){
  if(!state) return "";
  if(state.id) return `#${CSS.escape(state.id)}`;

  const parts = Object.entries(state.attrs || {}).map(([k,v]) => `[${k}="${CSS.escape(v)}"]`);
  if(parts.length) return `${state.tag.toLowerCase()}${parts.join("")}`;

  return "";
}

function restoreFocusState(state){
  if(!state) return;
  const selector = selectorFromFocusState(state);
  if(!selector) return;

  requestAnimationFrame(() => {
    const el = document.querySelector(selector);
    if(!el) return;
    if(document.activeElement !== el) el.focus({preventScroll:true});
    if(typeof el.selectionStart === "number" && state.selectionStart !== null){
      const posStart = Math.min(state.selectionStart, el.value.length);
      const posEnd = Math.min(state.selectionEnd ?? posStart, el.value.length);
      try { el.setSelectionRange(posStart, posEnd); } catch(e) {}
    }
  });
}



function renderCharacterDetails(p = currentPlayer()){
  const target = qs("#characterDetails");
  if(!target) return;
  const effects = Array.isArray(p.activeEffects) && p.activeEffects.length ? p.activeEffects.join(", ") : "немає активних ефектів";
  target.innerHTML = `<div class="character-details-grid">
    <div class="detail-card"><strong>Захист</strong><span>${escapeHtml(String(p.defense ?? 12))}</span></div>
    <div class="detail-card"><strong>Броня</strong><span>${escapeHtml(String(p.armor ?? 0))}</span></div>
    <div class="detail-card"><strong>Укриття</strong><span>${p.cover ? "так" : "ні"}</span></div>
    <div class="detail-card"><strong>Набої</strong><span>${escapeHtml(String(p.ammo ?? 0))}</span></div>
    <div class="detail-card full"><strong>Поточні стани</strong><span>HP ${escapeHtml(String(p.hp ?? 0))}/${escapeHtml(String(p.hpMax ?? 10))}, Втома ${escapeHtml(String(p.fatigue ?? 0))}/5, Зараження ${escapeHtml(String(p.infection ?? 0))}/7</span></div>
    <div class="detail-card full"><strong>Характеристики</strong>
      <div class="attr-grid">
        <div class="attr-pill"><strong>Витривалість</strong><span>${attrValue(p, "endurance")}</span></div>
        <div class="attr-pill"><strong>Точність</strong><span>${attrValue(p, "accuracy")}</span></div>
        <div class="attr-pill"><strong>Вправність</strong><span>${attrValue(p, "agility")}</span></div>
        <div class="attr-pill"><strong>Сприйняття</strong><span>${attrValue(p, "perception")}</span></div>
        <div class="attr-pill"><strong>Інтуїція</strong><span>${attrValue(p, "intuition")}</span></div>
        <div class="attr-pill"><strong>Харизма</strong><span>${attrValue(p, "charisma")}</span></div>
      </div>
    </div>
    <div class="detail-card full"><strong>Особливості / ефекти</strong><span>${escapeHtml(effects)}</span></div>
  </div>`;
}




async function copyTextToClipboard(text, label="Посилання"){
  const value = String(text || "");
  if(!value){
    showToast(`${label}: порожній текст.`);
    return false;
  }

  try{
    if(navigator.clipboard && window.isSecureContext !== false){
      await navigator.clipboard.writeText(value);
      showToast(`${label} скопійовано.`);
      return true;
    }
  }catch(err){
    console.warn("navigator.clipboard failed", err);
  }

  try{
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    showToast(ok ? `${label} скопійовано.` : `Скопіюй вручну: ${value}`);
    return ok;
  }catch(err){
    console.warn("fallback copy failed", err);
    showToast(`Скопіюй вручну: ${value}`);
    return false;
  }
}

function playerSpecificUrl(pid){
  const safePid = String(pid || "").trim();
  return `${location.origin}${location.pathname}?role=player&room=${encodeURIComponent(appSession.room)}&player=${encodeURIComponent(safePid)}&v=19114`;
}

function renderPlayerSpecificLinks(){
  const box = qs("#playerSpecificLinks");
  if(!box) return;
  const players = data.players || {};
  const playerIds = Object.keys(players);
  if(!playerIds.length){
    box.innerHTML = `<span class="copy-mini">Гравців ще немає.</span>`;
    return;
  }
  box.innerHTML = playerIds.map(pid => {
    const p = players[pid] || {};
    const label = p.name || pid;
    const url = playerSpecificUrl(pid);
    return `<div class="player-link-row">
      <button type="button" class="metal-btn player-link-btn" data-copy-player-specific="${escapeAttr(pid)}" data-copy-url="${escapeAttr(url)}">Скопіювати: ${escapeHtml(label)}</button>
      <code class="player-link-code">${escapeHtml(url)}</code>
    </div>`;
  }).join("");
}




/* === V19.5 Command Core ===
   Centralized command dispatcher for future buttons, voice commands and AI actions.
   Current UI may still contain legacy direct handlers, but new systems should call doCommand().
*/
function doCommand(command){
  if(!command || !command.type) return { ok:false, error:"empty_command" };

  const type = command.type;
  const payload = command.payload || command;
  let changed = false;

  try{
    if(type === "setActivePlayer"){
      const playerId = payload.playerId;
      if(!data.players?.[playerId]) return { ok:false, error:"player_not_found" };
      data.meta = data.meta || {};
      data.meta.activePlayerId = playerId;
      changed = true;
    }

    else if(type === "setTargetEnemy"){
      const enemyId = payload.enemyId;
      const enemy = findEnemyById(enemyId);
      if(!enemy) return { ok:false, error:"enemy_not_found" };
      data.combat = data.combat || {};
      data.combat.targetEnemyId = enemyId;
      changed = true;
    }

    else if(type === "stepPlayerStat"){
      const p = data.players?.[payload.playerId];
      if(!p) return { ok:false, error:"player_not_found" };
      const field = payload.field;
      const delta = Number(payload.delta || 0);

      if(field === "hp") p.hp = clamp(Number(p.hp ?? p.hpMax ?? 10) + delta, 0, Number(p.hpMax ?? 10));
      else if(field === "hpMax"){
        p.hpMax = Math.max(1, Number(p.hpMax ?? 10) + delta);
        p.hp = clamp(Number(p.hp ?? p.hpMax), 0, p.hpMax);
      }
      else if(field === "defense"){
        if(typeof p.defenseMax !== "number") p.defenseMax = Number(p.defense ?? 12);
        p.defense = clamp(Number(p.defense ?? 12) + delta, 1, Number(p.defenseMax ?? 12));
      }
      else if(field === "defenseMax"){
        p.defenseMax = Math.max(1, Number(p.defenseMax ?? p.defense ?? 12) + delta);
        p.defense = clamp(Number(p.defense ?? p.defenseMax), 1, p.defenseMax);
      }
      else if(field === "fatigue") p.fatigue = clamp(Number(p.fatigue ?? 0) + delta, 0, 5);
      else if(field === "infection") p.infection = Math.max(0, Number(p.infection ?? 0) + delta);
      else if(field === "ammo") p.ammo = Math.max(0, Number(p.ammo ?? 0) + delta);
      else return { ok:false, error:"unknown_player_field" };

      changed = true;
    }

    else if(type === "stepEnemyStat"){
      const enemy = findEnemyById(payload.enemyId);
      if(!enemy) return { ok:false, error:"enemy_not_found" };
      enemy.gm = enemy.gm || {};
      const field = payload.field;
      const delta = Number(payload.delta || 0);

      if(field === "hp"){
        enemy.gm.hp = clamp(Number(enemy.gm.hp ?? enemy.gm.hpMax ?? 8) + delta, 0, Number(enemy.gm.hpMax ?? 8));
        if(enemy.gm.hp <= 0){ enemy.state = "вибув"; enemy.color = "red"; }
        else if(enemy.gm.hp < Number(enemy.gm.hpMax ?? 8)){
          enemy.state = enemy.gm.hp <= Math.ceil(Number(enemy.gm.hpMax ?? 8)*0.3) ? "ледь стоїть" : "поранений";
          enemy.color = enemy.state === "ледь стоїть" ? "red" : "orange";
        } else { enemy.state = "цілий"; enemy.color = "green"; }
      }
      else if(field === "hpMax"){
        enemy.gm.hpMax = Math.max(1, Number(enemy.gm.hpMax ?? 8) + delta);
        enemy.gm.hp = clamp(Number(enemy.gm.hp ?? enemy.gm.hpMax), 0, enemy.gm.hpMax);
      }
      else if(field === "defense") enemy.defense = Math.max(1, Number(enemy.defense ?? 12) + delta);
      else if(field === "ammo") enemy.gm.ammo = Math.max(0, Number(enemy.gm.ammo ?? 0) + delta);
      else return { ok:false, error:"unknown_enemy_field" };

      changed = true;
    }

    else if(type === "setEnemyField"){
      const enemy = findEnemyById(payload.enemyId);
      if(!enemy) return { ok:false, error:"enemy_not_found" };
      enemy.gm = enemy.gm || {};
      const field = payload.field;
      const value = payload.value;

      if(field === "state"){
        enemy.state = value;
        enemy.color = enemy.state === "вибув" || enemy.state === "ледь стоїть" ? "red" : enemy.state === "поранений" ? "orange" : "green";
        if(enemy.state === "вибув") enemy.gm.hp = 0;
      }
      else if(field === "morale") enemy.gm.morale = value;
      else if(field === "action") enemy.action = value;
      else return { ok:false, error:"unknown_enemy_field" };

      changed = true;
    }

    else if(type === "toggleEnemyEffect"){
      const enemy = findEnemyById(payload.enemyId);
      if(!enemy) return { ok:false, error:"enemy_not_found" };
      const effect = payload.effect;

      if(effect === "visible") enemy.visible = enemy.visible === false ? true : false;
      else{
        enemy.effects = Array.isArray(enemy.effects) ? enemy.effects : [];
        if(enemy.effects.includes(effect)) enemy.effects = enemy.effects.filter(x => x !== effect);
        else enemy.effects.push(effect);
        if(effect === "panic"){
          enemy.gm = enemy.gm || {};
          enemy.gm.morale = enemy.effects.includes("panic") ? "паніка" : (enemy.gm.morale || "невідомо");
        }
      }
      changed = true;
    }

    else if(type === "setEnemyQuickState"){
      const enemy = findEnemyById(payload.enemyId);
      if(!enemy) return { ok:false, error:"enemy_not_found" };
      const state = payload.state;
      enemy.gm = enemy.gm || {};
      enemy.state = state;
      enemy.color = state === "вибув" || state === "ледь стоїть" ? "red" : state === "поранений" ? "orange" : "green";
      if(state === "вибув") enemy.gm.hp = 0;
      if(state === "ледь стоїть" && Number(enemy.gm.hp ?? 0) > Math.ceil(Number(enemy.gm.hpMax ?? 8)*0.3)){
        enemy.gm.hp = Math.max(1, Math.ceil(Number(enemy.gm.hpMax ?? 8)*0.3));
      }
      if(state === "поранений" && Number(enemy.gm.hp ?? 0) >= Number(enemy.gm.hpMax ?? 8)){
        enemy.gm.hp = Math.max(1, Number(enemy.gm.hpMax ?? 8) - 1);
      }
      changed = true;
    }

    else if(type === "addJournalLog"){
      const text = String(payload.text || "").trim();
      if(!text) return { ok:false, error:"empty_text" };
      addLog(text, payload.visibility || "public");
      changed = true;
    }

    else if(type === "addComplication"){
      const text = String(payload.text || "").trim();
      if(!text) return { ok:false, error:"empty_text" };
      addLog(`Ускладнення: ${text}`, "public");
      changed = true;
    }

    else return { ok:false, error:"unknown_command_type" };

    if(changed){
      render();
      save();
      return { ok:true, changed:true };
    }
    return { ok:true, changed:false };
  }catch(err){
    console.error("Command failed", command, err);
    showToast?.(`Помилка команди: ${type}`);
    return { ok:false, error:String(err?.message || err) };
  }
}


function renderGmQuickPanel(){
  const box = qs("#gmQuickPanel");
  if(!box) return;
  if(appSession.role !== "gm"){ box.hidden = true; return; }
  box.hidden = false;

  const playerIds = Object.keys(data.players || {});
  const activePlayerId = currentPlayerId();
  const activePlayer = data.players?.[activePlayerId] || null;
  const visibleEnemies = getVisibleEnemies();
  const activeEnemy = selectedTargetEnemy() || visibleEnemies[0] || null;
  const activeEnemyId = activeEnemy?.id || "";

  const playersMini = playerIds.map(pid => {
    const p = data.players[pid] || {};
    return `<button class="gm-mini-card ${pid === activePlayerId ? "active" : ""}" data-gm-mini-player="${escapeAttr(pid)}">
      <strong>${escapeHtml(p.name || pid)}</strong>
      <span>HP ${escapeHtml(String(p.hp ?? "?"))}/${escapeHtml(String(p.hpMax ?? "?"))} · 🛡 ${escapeHtml(String(p.defense ?? "?"))} · 🎒 ${escapeHtml(String(p.ammo ?? "?"))}</span>
    </button>`;
  }).join("");

  const playerControl = activePlayer ? `
    <div class="gm-player-control" data-active-player-panel="${escapeAttr(activePlayerId)}">
      <div class="gm-dashboard-title">Активний гравець: ${escapeHtml(activePlayer.name || activePlayerId)}</div>

      <div class="gm-enemy-line">
        <span>HP</span>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="hp" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activePlayer.hp ?? "?"))}/${escapeHtml(String(activePlayer.hpMax ?? "?"))}</strong>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="hp" data-delta="1">+</button>
      </div>

      <div class="gm-enemy-line">
        <span>Max HP</span>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="hpMax" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activePlayer.hpMax ?? "?"))}</strong>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="hpMax" data-delta="1">+</button>
      </div>

      <div class="gm-enemy-line">
        <span>Захист</span>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="defense" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activePlayer.defense ?? 12))}/${escapeHtml(String(activePlayer.defenseMax ?? activePlayer.defense ?? 12))}</strong>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="defense" data-delta="1">+</button>
      </div>

      <div class="gm-enemy-line">
        <span>Max Зах.</span>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="defenseMax" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activePlayer.defenseMax ?? activePlayer.defense ?? 12))}</strong>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="defenseMax" data-delta="1">+</button>
      </div>

      <div class="gm-enemy-line">
        <span>Втома</span>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="fatigue" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activePlayer.fatigue ?? 0))}/5</strong>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="fatigue" data-delta="1">+</button>
      </div>

      <div class="gm-enemy-line">
        <span>Зараж.</span>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="infection" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activePlayer.infection ?? 0))}</strong>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="infection" data-delta="1">+</button>
      </div>

      <div class="gm-enemy-line">
        <span>Набої</span>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="ammo" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activePlayer.ammo ?? 0))}</strong>
        <button class="micro-btn" data-player-step="${escapeAttr(activePlayerId)}" data-field="ammo" data-delta="1">+</button>
      </div>

    </div>
  ` : `<div class="gm-player-control"><div class="gm-empty-line">Активного гравця немає.</div></div>`;

  const enemiesMini = visibleEnemies.length ? visibleEnemies.map(e => {
    const defense = typeof enemyDefenseValue === "function" ? enemyDefenseValue(e) : (e.defense || 12);
    const effects = typeof enemyEffectsText === "function" ? enemyEffectsText(e) : "";
    return `<button class="gm-mini-card enemy ${e.id === activeEnemyId ? "active" : ""}" data-gm-mini-enemy="${escapeAttr(e.id)}">
      <strong>${escapeHtml(e.name)}</strong>
      <span>${escapeHtml(e.state || "стан?")} · HP ${escapeHtml(String(e.gm?.hp ?? "?"))}/${escapeHtml(String(e.gm?.hpMax ?? "?"))} · Захист ${escapeHtml(String(defense))}${effects && effects !== "немає" ? " · " + escapeHtml(effects) : ""}</span>
    </button>`;
  }).join("") : `<div class="gm-empty-line">Видимих ворогів немає.</div>`;

  const enemyControl = activeEnemy ? `
    <div class="gm-enemy-control" data-active-enemy-panel="${escapeAttr(activeEnemy.id)}">
      <div class="gm-dashboard-title">Активний ворог: ${escapeHtml(activeEnemy.name)}</div>

      <div class="gm-enemy-line">
        <span>HP</span>
        <button class="micro-btn" data-enemy-step="${escapeAttr(activeEnemy.id)}" data-field="hp" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activeEnemy.gm?.hp ?? "?"))}/${escapeHtml(String(activeEnemy.gm?.hpMax ?? "?"))}</strong>
        <button class="micro-btn" data-enemy-step="${escapeAttr(activeEnemy.id)}" data-field="hp" data-delta="1">+</button>
      </div>

      <div class="gm-enemy-line">
        <span>Max HP</span>
        <button class="micro-btn" data-enemy-step="${escapeAttr(activeEnemy.id)}" data-field="hpMax" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activeEnemy.gm?.hpMax ?? "?"))}</strong>
        <button class="micro-btn" data-enemy-step="${escapeAttr(activeEnemy.id)}" data-field="hpMax" data-delta="1">+</button>
      </div>

      <div class="gm-enemy-line">
        <span>Захист</span>
        <button class="micro-btn" data-enemy-step="${escapeAttr(activeEnemy.id)}" data-field="defense" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activeEnemy.defense ?? 12))}${enemyEffects(activeEnemy).includes("inCover") ? " (+укр.)" : ""}</strong>
        <button class="micro-btn" data-enemy-step="${escapeAttr(activeEnemy.id)}" data-field="defense" data-delta="1">+</button>
      </div>

      <div class="gm-enemy-line">
        <span>Набої</span>
        <button class="micro-btn" data-enemy-step="${escapeAttr(activeEnemy.id)}" data-field="ammo" data-delta="-1">−</button>
        <strong>${escapeHtml(String(activeEnemy.gm?.ammo ?? 0))}</strong>
        <button class="micro-btn" data-enemy-step="${escapeAttr(activeEnemy.id)}" data-field="ammo" data-delta="1">+</button>
      </div>

      <div class="gm-enemy-grid">
        <label>Стан
          <select data-enemy-control="${escapeAttr(activeEnemy.id)}" data-field="state">
            ${["цілий","поранений","ледь стоїть","вибув"].map(s => `<option value="${escapeAttr(s)}" ${activeEnemy.state === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
          </select>
        </label>

        <label>Мораль
          <select data-enemy-control="${escapeAttr(activeEnemy.id)}" data-field="morale">
            ${["тримається","нервує","паніка","тікає","невідомо"].map(s => `<option value="${escapeAttr(s)}" ${(activeEnemy.gm?.morale || "невідомо") === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
          </select>
        </label>
      </div>

      <label class="gm-enemy-action">Поточна дія
        <input data-enemy-control="${escapeAttr(activeEnemy.id)}" data-field="action" value="${escapeAttr(activeEnemy.action || "")}" placeholder="що робить ворог зараз">
      </label>

      <div class="gm-enemy-toggles">
        <button class="metal-btn small ${activeEnemy.visible !== false ? "active-choice" : ""}" data-enemy-toggle="${escapeAttr(activeEnemy.id)}" data-effect="visible">${activeEnemy.visible !== false ? "Видимий" : "Схований"}</button>
        <button class="metal-btn small ${enemyEffects(activeEnemy).includes("inCover") ? "active-choice" : ""}" data-enemy-toggle="${escapeAttr(activeEnemy.id)}" data-effect="inCover">Укриття</button>
        <button class="metal-btn small ${enemyEffects(activeEnemy).includes("suppressed") ? "active-choice" : ""}" data-enemy-toggle="${escapeAttr(activeEnemy.id)}" data-effect="suppressed">Пригнічений</button>
        <button class="metal-btn small ${enemyEffects(activeEnemy).includes("panic") ? "active-choice" : ""}" data-enemy-toggle="${escapeAttr(activeEnemy.id)}" data-effect="panic">Паніка</button>
      </div>

      <div class="gm-enemy-toggles">
        <button class="metal-btn small" data-enemy-quick-state="${escapeAttr(activeEnemy.id)}" data-state="поранений">Поранити</button>
        <button class="metal-btn small" data-enemy-quick-state="${escapeAttr(activeEnemy.id)}" data-state="ледь стоїть">Ледь стоїть</button>
        <button class="metal-btn small danger" data-enemy-quick-state="${escapeAttr(activeEnemy.id)}" data-state="вибув">Вибув</button>
      </div>
    </div>
  ` : `<div class="gm-enemy-control"><div class="gm-empty-line">Активного ворога немає. Додай або покажи ворога.</div></div>`;

  box.innerHTML = `
    <div class="gm-quick-head">
      <strong>Панель Майстра</strong>
      <span>${data.combat?.active ? `Бій · Раунд ${data.combat.round || 1}` : "Поза боєм"}</span>
    </div>

    <div class="gm-active-line">
      <span>Активний: <strong>${escapeHtml(activePlayer?.name || activePlayerId || "немає")}</strong></span>
      <span>Ціль: <strong>${activeEnemy ? escapeHtml(activeEnemy.name) : "немає"}</strong></span>
    </div>

    <div class="gm-dashboard-block">
      <div class="gm-dashboard-title">Гравці</div>
      <div class="gm-mini-grid">${playersMini || `<div class="gm-empty-line">Гравців ще немає.</div>`}</div>
    </div>

    ${playerControl}

    <div class="gm-dashboard-block">
      <div class="gm-dashboard-title">Вороги</div>
      <div class="gm-mini-grid">${enemiesMini}</div>
    </div>

    ${enemyControl}

    <div class="gm-quick-actions">
      <button class="metal-btn small" id="gmQuickCombatToggle">${data.combat?.active ? "Завершити бій" : "Почати бій"}</button>
      <button class="metal-btn small" id="gmQuickNextTurn">Наступний хід</button>
      <button class="metal-btn small" id="gmQuickRestore">Відновити сцену</button>
      <button class="metal-btn small" id="gmQuickCopyPlayer">Посилання гравця</button>
    </div>

    <div class="gm-fast-tools">
      <label>Швидкий запис
        <textarea id="gmQuickLogText" placeholder="Наприклад: у тумані чути тріск гілки..."></textarea>
      </label>
      <div class="gm-fast-buttons">
        <button class="metal-btn small" id="gmQuickAddPublicLog">У журнал гравців</button>
        <button class="metal-btn small" id="gmQuickAddGmLog">Нотатка Майстра</button>
      </div>

      <label>Швидка подія / ускладнення
        <select id="gmQuickComplication">
          <option value="">обрати ускладнення...</option>
          <option value="У повітрі наростає низький гул. Десь поруч змінюється аномальне поле.">Аномальний гул</option>
          <option value="Чути чужі кроки. До сцени наближається невідомий.">Хтось наближається</option>
          <option value="Зброя, спорядження або укриття дає небезпечний збій.">Технічний збій</option>
          <option value="Ворог міняє позицію і намагається зайти з флангу.">Фланговий маневр</option>
          <option value="Зона ніби завмирає. Наступна дія матиме наслідки.">Тиша перед ривком</option>
        </select>
      </label>
      <button class="metal-btn small" id="gmQuickAddComplication">Додати ускладнення</button>
    </div>
  `;
}

function render(){
  const focusState = captureFocusState();
  const p = currentPlayer();
  qs("#characterName").textContent = p.name;
  qs("#hpNow").textContent = p.hp;
  qs("#hpMax").textContent = p.hpMax;
  qs("#fatigueNow").textContent = p.fatigue;
  qs("#defenseNow").textContent = p.defense ?? 12;
  qs("#radiationNow").textContent = p.infection ?? p.radiation ?? 0;
  qs("#ammoNow").textContent = p.ammo;
  qs("#hpDots").innerHTML = dots(p.hp, p.hpMax);
  qs("#fatigueDots").innerHTML = dots(p.fatigue, 5, "fatigue");
  qs("#radDots").innerHTML = dots(p.infection ?? p.radiation ?? 0, 7, "rad");
  qs("#ammoDots").innerHTML = dots(Math.min(p.ammo, 6), 6);
  renderCharacterDetails(p);

  const s = data.scene;
  safeSetText("#sceneNameShort", s.name);
  safeSetText("#sceneDescShort", shortText(s.description || "", 70));
  qs("#sceneName").textContent = s.name;
  qs("#sceneDescription").textContent = s.description || "";
  qs("#sceneSounds").textContent = s.sounds || "";
  qs("#sceneSmells").textContent = s.smells || "";
  qs("#sceneObjects").innerHTML = (s.objects || []).map(o => `<li>${escapeHtml(o)}</li>`).join("");

  const visible = (data.enemies || []).filter(e => e.visible !== false);
  safeSetHTML("#stateEnemies", visible.map(enemyRow).join(""));
  safeSetHTML("#enemyCards", visible.map(enemyCard).join(""));
  qs("#inventoryList").innerHTML = currentInventory().map(invItem).join("");
  const inlineInv = qs("#inventoryInlineList");
  if(inlineInv) inlineInv.innerHTML = currentInventory().map(invItem).join("");
  renderTargetSelector();
  ensureJournalComposer();
  renderJournalPrivateTargets();
  qs("#journalList").innerHTML = (data.journal || []).filter(j => {
    if(appSession.role !== "gm"){
      if(j.visibility === "gm") return false;
      if(j.visibility === "private") return j.targetPlayerId === appSession.player;
      return true;
    }
    if(journalFilter === "public") return j.visibility !== "gm" && j.visibility !== "private";
    if(journalFilter === "gm") return j.visibility === "gm";
    return true;
  }).slice().reverse().map(logItem).join("");

  qsa("[data-journal-filter]").forEach(btn => btn.classList.toggle("active-filter", btn.dataset.journalFilter === journalFilter));

  renderCombatSummary();
  renderGmCombatStickyBar();
  renderGmCombatPanel();
  fillMaster();
  renderGmQuickPanel();
  renderPlayerSpecificLinks();
  applyRoleMode();
  enforcePlayerAccessGuards();
  refreshActionLocks();
  save();
  restoreFocusState(focusState);
}



function ensureJournalComposer(){
  if(appSession.role !== "gm") return;
  if(qs("#journalQuickText")) return;

  const journalScreen = qs('[data-screen="journal"]');
  const controls = qs(".journal-controls");
  if(!journalScreen || !controls) return;

  const box = document.createElement("div");
  box.className = "journal-compose gm-only";
  box.innerHTML = `
    <label>Швидкий запис Майстра
      <textarea id="journalQuickText" rows="3" placeholder="Напиши подію, підказку, шум, наслідок або приватну нотатку..."></textarea>
    </label>
    <div class="journal-compose-grid">
      <button class="metal-btn" id="journalPostPublic" type="button">Написати всім</button>
      <button class="metal-btn" id="journalPostGm" type="button">Тільки Майстру</button>
    </div>
    <div class="journal-compose-private">
      <select id="journalPrivateTarget"></select>
      <button class="metal-btn" id="journalPostPrivate" type="button">Приватно гравцю</button>
    </div>
  `;
  controls.parentNode.insertBefore(box, controls);
}

function renderJournalPrivateTargets(){
  const sel = qs("#journalPrivateTarget");
  if(!sel) return;
  const players = Object.entries(data.players || {});
  sel.innerHTML = players.map(([pid,p]) => `<option value="${escapeAttr(pid)}">${escapeHtml(p.name || pid)}</option>`).join("");
}

function submitJournalQuickNote(visibility){
  const input = qs("#journalQuickText");
  if(!input) return;
  const text = String(input.value || "").trim();
  if(!text){
    showToast("Журнал: порожній запис.");
    return;
  }

  if(visibility === "private"){
    const targetId = qs("#journalPrivateTarget")?.value || currentPlayerId();
    const target = playerById(targetId);
    data.journal.push({
      id: makeId("log"),
      visibility: "private",
      targetPlayerId: targetId,
      time: nowTime(),
      text: `Приватно для ${target.name || targetId}: ${text}`
    });
  } else {
    addLog(text, visibility);
  }

  input.value = "";
  if(data.journal.length > 120) data.journal = data.journal.slice(-120);
  save();
  render();
  showToast(visibility === "gm" ? "Записано тільки для Майстра." : visibility === "private" ? "Приватне повідомлення додано." : "Публічний запис додано.");
}

function enemyRow(e){
  const icon = e.color === "green" ? "⌁" : e.color === "orange" ? "✚" : e.color === "yellow" ? ")))" : "!";
  return `<div class="enemy-row">
    <div class="enemy-thumb"></div>
    <div><h4>${escapeHtml(e.name)}</h4><p class="${enemyColorClass(e.color)}">${escapeHtml(e.state)}</p></div>
    <div class="enemy-icon ${enemyColorClass(e.color)}">${icon}</div><div class="chev">›</div>
  </div>`;
}

function enemyCard(e){
  return `<article class="enemy-card">
    <h4>${escapeHtml(e.name)}</h4>
    <p><strong>Стан:</strong> <span class="${enemyColorClass(e.color)}">${escapeHtml(e.state)}</span></p>
    <p><strong>Позиція:</strong> ${escapeHtml(e.position)}</p>
    <p><strong>Небезпека:</strong> ${escapeHtml(e.danger)}</p>
    <p><strong>Що робить:</strong> ${escapeHtml(e.action)}</p>
  </article>`;
}

function invItem(i){
  return `<div class="inventory-item"><div><h4>${escapeHtml(i.item)}</h4><p>${escapeHtml(i.note || "")}</p></div><div class="inventory-count">${escapeHtml(String(i.count))}</div></div>`;
}

function logItem(j){
  const badge = j.visibility === "gm" ? `<span class="journal-badge gm">Майстру</span>` : j.visibility === "private" ? `<span class="journal-badge private">Приватно</span>` : `<span class="journal-badge public">Публічно</span>`;
  return `<div class="journal-entry"><time>${escapeHtml(j.time)}</time>${badge}${escapeHtml(j.text)}</div>`;
}


function renderEnemyTemplateButtons(){
  const box = qs("#enemyTemplateButtons");
  if(!box) return;

  const groups = [
    ["Люди", ["coward","bandit","shotgun","auto","leader","ambusher","finisher","npc"]],
    ["Мутанти", ["blinddog","pseudodog","tushkan"]]
  ];

  box.innerHTML = groups.map(([group, ids]) => `
    <div class="enemy-template-group">
      <div class="enemy-template-group-title">${escapeHtml(group)}</div>
      <div class="enemy-template-grid">
        ${ids.map(id => {
          const tpl = enemyTemplates[id];
          if(!tpl) return "";
          const hp = tpl.gm?.hpMax ?? tpl.gm?.hp ?? "?";
          const defense = tpl.defense ?? 12;
          return `<button class="metal-btn enemy-template-btn" data-add-enemy-template="${escapeAttr(id)}">
            <strong>${escapeHtml(tpl.name)}</strong>
            <small>HP ${escapeHtml(String(hp))} · Захист ${escapeHtml(String(defense))}</small>
          </button>`;
        }).join("")}
      </div>
    </div>
  `).join("");
}

function fillMaster(){
  renderEnemyTemplateButtons();
  const p = currentPlayer(), s = data.scene;
  setVal("#gmName", p.name); setVal("#gmHp", p.hp); setVal("#gmHpMax", p.hpMax);
  setVal("#gmFatigue", p.fatigue); setVal("#gmRad", p.infection ?? p.radiation ?? 0); setVal("#gmAmmo", p.ammo);
  setVal("#gmPlayerId", currentPlayerId());
  setVal("#gmSceneName", s.name); setVal("#gmSceneDescription", s.description || ""); setVal("#gmSceneSounds", s.sounds || "");
  setVal("#gmSceneSmells", s.smells || ""); setVal("#gmSceneObjects", (s.objects || []).join(", "));

  qs("#gmEnemies").innerHTML = (data.enemies || []).map((e, idx) => `
    <div class="gm-row">
      <label>Назва <input data-enemy="${idx}" data-field="name" value="${escapeAttr(e.name)}"></label>
      <label>Стан <input data-enemy="${idx}" data-field="state" value="${escapeAttr(e.state)}"></label>
      <label>Колір
        <select data-enemy="${idx}" data-field="color">
          ${["green","orange","yellow","red"].map(c => `<option value="${c}" ${e.color===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </label>
      <label>Позиція <input data-enemy="${idx}" data-field="position" value="${escapeAttr(e.position)}"></label>
      <label>Небезпека <input data-enemy="${idx}" data-field="danger" value="${escapeAttr(e.danger)}"></label>
      <label>Дія <input data-enemy="${idx}" data-field="action" value="${escapeAttr(e.action)}"></label>
      <label><input type="checkbox" data-enemy="${idx}" data-field="visible" ${e.visible!==false?"checked":""}> Видимий</label>
      <div class="quick-state-row">
        <button class="metal-btn" data-enemy-state="${idx}" data-state="цілий" data-color="green">Цілий</button>
        <button class="metal-btn" data-enemy-state="${idx}" data-state="поранений" data-color="orange">Поранений</button>
        <button class="metal-btn" data-enemy-state="${idx}" data-state="ледь стоїть" data-color="red">Ледь стоїть</button>
        <button class="metal-btn" data-enemy-state="${idx}" data-state="наляканий" data-color="yellow">Наляканий</button>
        <button class="metal-btn danger" data-enemy-state="${idx}" data-state="тікає" data-color="yellow">Тікає</button>
      </div>
      <button class="metal-btn danger" data-remove-enemy="${idx}">Прибрати</button>
    </div>
  `).join("");

  renderGmPlayers();

  const lootTarget = qs("#lootTargetPlayer");
  if(lootTarget){
    const ids = Object.keys(data.players || {});
    lootTarget.innerHTML = ids.map(pid => `<option value="${escapeAttr(pid)}" ${pid === currentPlayerId() ? "selected" : ""}>${escapeHtml(data.players[pid]?.name || pid)} (${escapeHtml(pid)})</option>`).join("");
  }

  const enemyTarget = qs("#enemyAttackTarget");
  if(enemyTarget){
    const ids = Object.keys(data.players || {});
    const current = data.combat?.enemyTargetPlayerId || currentPlayerId();
    enemyTarget.innerHTML = ids.map(pid => `<option value="${escapeAttr(pid)}" ${pid === current ? "selected" : ""}>${escapeHtml(data.players[pid]?.name || pid)} (${escapeHtml(pid)})</option>`).join("");
  }

  qs("#gmInventory").innerHTML = currentInventory().map((it, idx) => `
    <div class="gm-row">
      <label>Річ <input data-item="${idx}" data-field="item" value="${escapeAttr(it.item)}"></label>
      <label>Кількість <input type="number" data-item="${idx}" data-field="count" value="${escapeAttr(String(it.count))}"></label>
      <label>Примітка <input data-item="${idx}" data-field="note" value="${escapeAttr(it.note || "")}"></label>
      <button class="metal-btn danger" data-remove-item="${idx}">Прибрати</button>
    </div>
  `).join("");
}


function renderGmPlayers(){
  const container = qs("#gmPlayers");
  if(!container) return;

  const playerIds = Object.keys(data.players || {});
  const activeId = currentPlayerId();

  const sectionOpen = key => !!expandedPlayerEditorSections?.[key];
  const section = (key, title, subtitle, bodyHtml) => `
    <div class="pm-collapse-section ${sectionOpen(key) ? "is-open" : ""}">
      <div class="pm-collapse-head" data-toggle-player-section="${escapeAttr(key)}">
        <div class="pm-collapse-main"><span class="pm-collapse-arrow">${sectionOpen(key) ? "▼" : "▶"}</span><strong>${escapeHtml(title)}</strong></div>
        ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
      </div>
      <div class="pm-collapse-body" ${sectionOpen(key) ? "" : "hidden"}>${bodyHtml}</div>
    </div>`;

  const switcher = `<div class="target-line"><strong>Активний персонаж Майстра:</strong> ${escapeHtml(data.players[activeId]?.name || activeId)}</div>
    <div class="player-switch-row compact-switcher">
      ${playerIds.map(pid => `<button class="metal-btn ${pid === activeId ? "active-choice" : ""}" data-select-player="${escapeAttr(pid)}">${escapeHtml(data.players[pid]?.name || pid)}</button>`).join("")}
    </div>
    <div class="copy-mini">Нижче — компактний редактор активного персонажа. Тапни секцію, щоб розгорнути її.</div>`;

  container.innerHTML = switcher + playerIds.filter(pid => pid === activeId).map(pid => {
    const p = data.players[pid];
    const playerUrl = `${location.origin}${location.pathname}?role=player&room=${encodeURIComponent(appSession.room)}&player=${encodeURIComponent(pid)}&v=19114`;
    const invCount = (p.inventory || []).length;

    const profileBody = `<div class="compact-form-grid profile-grid"><label>Ім’я <input data-player="${escapeAttr(pid)}" data-field="name" value="${escapeAttr(p.name || "")}"></label><label>ID <input value="${escapeAttr(pid)}" disabled></label></div>`;
    const combatBody = `<div class="compact-form-grid combat-grid">
        <label>HP <input type="number" data-player="${escapeAttr(pid)}" data-field="hp" value="${escapeAttr(String(p.hp ?? 0))}"></label>
        <label>Макс. HP <input type="number" data-player="${escapeAttr(pid)}" data-field="hpMax" value="${escapeAttr(String(p.hpMax ?? 10))}"></label>
        <label>Втома <input type="number" data-player="${escapeAttr(pid)}" data-field="fatigue" value="${escapeAttr(String(p.fatigue ?? 0))}"></label>
        <label>Зараження <input type="number" data-player="${escapeAttr(pid)}" data-field="infection" value="${escapeAttr(String(p.infection ?? 0))}"></label>
        <label>Набої <input type="number" data-player="${escapeAttr(pid)}" data-field="ammo" value="${escapeAttr(String(p.ammo ?? 0))}"></label>
        <label>Броня <input type="number" data-player="${escapeAttr(pid)}" data-field="armor" value="${escapeAttr(String(p.armor ?? 0))}"></label>
        <label>Захист <input type="number" data-player="${escapeAttr(pid)}" data-field="defense" value="${escapeAttr(String(p.defense ?? 12))}"><span class="defense-note">Поріг d20.</span></label>
        <label>Макс. захист <input type="number" data-player="${escapeAttr(pid)}" data-field="defenseMax" value="${escapeAttr(String(p.defenseMax ?? p.defense ?? 12))}"><span class="defense-note">Для штрафів/бонусів.</span></label>
      </div>`;
    const weaponBody = `<div class="compact-form-grid weapon-grid">
        <label>Зброя<select data-player="${escapeAttr(pid)}" data-field="weapon">${Object.entries(WEAPON_CATALOG).map(([key,w]) => `<option value="${escapeAttr(key)}" ${p.weapon === key ? "selected" : ""}>${escapeHtml(w.name)}</option>`).join("")}</select></label>
        <label>Дистанція<select data-player="${escapeAttr(pid)}" data-field="range"><option value="near" ${p.range === "near" ? "selected" : ""}>близько</option><option value="mid" ${p.range === "mid" ? "selected" : ""}>середньо</option><option value="far" ${(!p.range || p.range === "far") ? "selected" : ""}>далеко</option></select></label>
        <label>Стан зброї<select data-player="${escapeAttr(pid)}" data-field="weaponCondition">${Object.entries(WEAPON_CONDITIONS).map(([key,c]) => `<option value="${escapeAttr(key)}" ${p.weaponCondition === key ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select></label>
        <label class="compact-checkbox"><input type="checkbox" data-player="${escapeAttr(pid)}" data-field="weaponJammed" ${p.weaponJammed ? "checked" : ""}> Клин</label>
      </div>`;
    const statsBody = `<div class="compact-form-grid stats-grid">
        <label>Витр. <input type="number" data-player-stat="${escapeAttr(pid)}" data-stat-field="endurance" value="${escapeAttr(String(p.stats?.endurance ?? 0))}"></label>
        <label>Точн. <input type="number" data-player-stat="${escapeAttr(pid)}" data-stat-field="accuracy" value="${escapeAttr(String(p.stats?.accuracy ?? 0))}"></label>
        <label>Вправ. <input type="number" data-player-stat="${escapeAttr(pid)}" data-stat-field="agility" value="${escapeAttr(String(p.stats?.agility ?? 0))}"></label>
        <label>Сприйн. <input type="number" data-player-stat="${escapeAttr(pid)}" data-stat-field="perception" value="${escapeAttr(String(p.stats?.perception ?? 0))}"></label>
        <label>Інтуїц. <input type="number" data-player-stat="${escapeAttr(pid)}" data-stat-field="intuition" value="${escapeAttr(String(p.stats?.intuition ?? 0))}"></label>
        <label>Хар. <input type="number" data-player-stat="${escapeAttr(pid)}" data-stat-field="charisma" value="${escapeAttr(String(p.stats?.charisma ?? 0))}"></label>
      </div>`;
    const inventoryBody = `<div class="copy-mini">${invCount ? `${invCount} позицій. Детально — у вкладці “Інвентар”.` : "Інвентар порожній."}</div>`;

    return `<div class="gm-player-card compact-player-editor collapsible-player-editor ${pid === currentPlayerId() ? "active-selected" : ""}">
      <h4>${escapeHtml(p.name || pid)} <small>(${escapeHtml(pid)})</small>${pid === currentPlayerId() ? `<span class="active-player-chip">активний</span>` : ""}</h4>
      ${section("profile", "Профіль", p.name || pid, profileBody)}
      ${section("combat", "Бойові налаштування", `HP ${p.hp ?? 0}/${p.hpMax ?? 10} · Втома ${p.fatigue ?? 0} · Набої ${p.ammo ?? 0}`, combatBody)}
      ${section("weapon", "Зброя", `${WEAPON_CATALOG[p.weapon]?.name || p.weapon || "немає"} · ${p.weaponCondition ? (WEAPON_CONDITIONS[p.weaponCondition]?.name || p.weaponCondition) : "стан?"}`, weaponBody)}
      ${section("stats", "Характеристики", `Витр. ${p.stats?.endurance ?? 0} · Точн. ${p.stats?.accuracy ?? 0} · Спр. ${p.stats?.perception ?? 0}`, statsBody)}
      ${section("inventory", "Інвентар", `${invCount} позицій`, inventoryBody)}
      <div class="button-row compact-action-row"><button class="metal-btn" data-select-player="${escapeAttr(pid)}">Обрати активним</button><button class="metal-btn" data-copy-player-link="${escapeAttr(pid)}">Скопіювати посилання</button><button class="metal-btn" data-toggle-player-cover="${escapeAttr(pid)}">${p.cover ? "Без укриття" : "В укриття"}</button>${pid !== currentPlayerId() ? `<button class="metal-btn danger" data-remove-player="${escapeAttr(pid)}">Видалити</button>` : ""}</div>
      <div class="copy-mini">${escapeHtml(playerUrl)}</div>
    </div>`;
  }).join("");
}
function setVal(sel, val){
  const el = qs(sel);
  if(el && el.value !== String(val)) el.value = val;
}

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return [...document.querySelectorAll(sel)]; }
function shortText(t, n){ return t.length > n ? t.slice(0,n-1) + "…" : t; }
function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function escapeAttr(str){ return escapeHtml(str).replace(/"/g, "&quot;");}

function switchScreen(target){
  if(target === "master" && appSession.role !== "gm") target = "state";
  qsa(".screen").forEach(s => s.classList.toggle("active", s.dataset.screen === target));
  qsa(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.target === target));
  qs("#rollResult").hidden = true;
  window.scrollTo({top:0, behavior:"smooth"});
}

function rollDie(sides=20){ return Math.floor(Math.random()*sides)+1; }

function rollD20(count, modifier=0){
  const dice = Array.from({length:count}, () => rollDie(20));
  return { dice, totals: dice.map(d => d + modifier), modifier };
}



const WEAPON_CATALOG = {
  pm: { name: "ПМ", far: { dice: "d4", bonus: 0 }, near: { dice: "d4", bonus: 1 } },
  obrez: { name: "Обріз", far: { dice: "d4", bonus: 0 }, near: { dice: "d6", bonus: 1 } },
  doublebarrel: { name: "Двостволка", far: { dice: "d4", bonus: 0 }, near: { dice: "d8", bonus: 0 } },
  aks74u: { name: "АКС-74У", far: { dice: "d6", bonus: 0 }, near: { dice: "d6", bonus: 1 } },
  ak74: { name: "АК-74", far: { dice: "d6", bonus: 1 }, near: { dice: "d6", bonus: 2 } },
  grenade: { name: "Граната", far: { dice: "d12", bonus: 0 }, near: { dice: "d12", bonus: 0 } }
};


const WEAPON_CONDITIONS = {
  good: { name: "добра", jamOn: [], damageMod: 0 },
  normal: { name: "нормальна", jamOn: [], damageMod: 0 },
  worn: { name: "зношена", jamOn: [1], damageMod: 0 },
  rusty: { name: "іржава", jamOn: [1,2], damageMod: -1 }
};

function weaponConditionInfo(player){
  return WEAPON_CONDITIONS[player.weaponCondition || "normal"] || WEAPON_CONDITIONS.normal;
}

function weaponConditionText(player){
  const c = weaponConditionInfo(player);
  return `${c.name}${player.weaponJammed ? " · КЛИН" : ""}`;
}

function shouldWeaponJam(player, dice){
  const c = weaponConditionInfo(player);
  return dice.some(d => c.jamOn.includes(d));
}

function criticalCount(dice){
  return dice.filter(d => d === 20).length;
}


function weaponInfo(player){
  const key = player.weapon || "pm";
  return WEAPON_CATALOG[key] || WEAPON_CATALOG.pm;
}

function weaponRange(player){
  return player.range === "near" ? "near" : "far";
}

function weaponDamageProfile(player){
  const weapon = weaponInfo(player);
  const range = weaponRange(player);
  return weapon[range] || weapon.far || WEAPON_CATALOG.pm.far;
}

function damageFormulaText(player, hits=1){
  const weapon = weaponInfo(player);
  const range = weaponRange(player);
  const profile = weaponDamageProfile(player);
  const die = profile.dice || "d4";
  const sides = Number(String(die).replace("d","")) || 4;
  const bonus = Number(profile.bonus || 0);
  const dicePart = hits > 1 ? `${hits}d${sides}` : `d${sides}`;
  const bonusPart = bonus ? `${bonus > 0 ? "+" : ""}${bonus}` : "";
  return `${weapon.name} · ${range === "near" ? "зблизька" : "здалека"} · ${dicePart}${bonusPart}`;
}

function rollWeaponDamage(player, hits, extraDice=0){
  const profile = weaponDamageProfile(player);
  const condition = weaponConditionInfo(player);
  const sides = Number(String(profile.dice || "d4").replace("d","")) || 4;
  const bonus = Number(profile.bonus || 0);
  const conditionMod = Number(condition.damageMod || 0);
  const totalDice = Math.max(1, Number(hits || 1) + Number(extraDice || 0));
  const rolls = [];
  let sum = 0;
  for(let i=0; i<totalDice; i++){
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    sum += roll;
  }
  sum += bonus + conditionMod;
  if(sum < 1) sum = 1;
  const formulaBase = damageFormulaText(player, hits);
  const critPart = extraDice ? ` + крит ${extraDice}d${sides}` : "";
  const condPart = conditionMod ? ` ${conditionMod > 0 ? "+" : ""}${conditionMod} стан` : "";
  return { rolls, bonus, conditionMod, extraDice, total: sum, sides, formula: `${formulaBase}${critPart}${condPart}` };
}


function attrValue(player, key){
  player.stats = player.stats || {};
  return Number(player.stats[key] || 0);
}
function attrLabel(key){
  return {endurance:"Витривалість", accuracy:"Точність", agility:"Вправність", perception:"Сприйняття", intuition:"Інтуїція", charisma:"Харизма"}[key] || "";
}
function getVisibleEnemies(){
  return (data.enemies || []).filter(e => e.visible !== false && e.state !== "вибув");
}
function currentTargetEnemyId(){
  if(data.combat?.targetEnemyId && getVisibleEnemies().some(e => e.id === data.combat.targetEnemyId)) return data.combat.targetEnemyId;
  const first = getVisibleEnemies()[0];
  if(first){
    data.combat = data.combat || {};
    data.combat.targetEnemyId = first.id;
    return first.id;
  }
  return null;
}
function selectedTargetEnemy(){
  const id = currentTargetEnemyId();
  return getVisibleEnemies().find(e => e.id === id) || null;
}
function renderTargetSelector(){
  const box = qs("#targetSelector");
  if(!box) return;
  const visible = getVisibleEnemies();
  const active = currentTargetEnemyId();
  if(!visible.length){
    box.innerHTML = `<div class="detail-card full"><strong>Видимі цілі</strong><span>ворогів у полі зору немає</span></div>`;
    return;
  }
  box.innerHTML = visible.map(e => `<button class="target-btn state-enemy-card ${e.id === active ? "active-target" : ""}" data-state-enemy="${escapeAttr(e.id)}">
    <span class="state-enemy-main">
      <span class="state-enemy-avatar">☠</span>
      <span class="state-enemy-text">
        <strong>${escapeHtml(e.name)}</strong>
        <small>${escapeHtml(e.state || "стан невідомий")} · Захист ${escapeHtml(String(enemyDefenseValue(e)))}</small>
      </span>
    </span>
    <span class="state-enemy-hint">${expandedStateEnemyDetails[e.id] ? (e.id === active ? "ЦІЛЬ" : "ще тап — обрати") : "інфо"}</span>
    <span class="state-enemy-detail" ${expandedStateEnemyDetails[e.id] ? "" : "hidden"}>
      <span><b>Стан:</b> ${escapeHtml(e.state || "невідомо")}</span>
      <span><b>Позиція:</b> ${escapeHtml(e.position || "невідомо")}</span>
      <span><b>Небезпека:</b> ${escapeHtml(e.danger || "невідомо")}</span>
      <span><b>Що робить:</b> ${escapeHtml(e.action || "невідомо")}</span>
      <span><b>HP:</b> ${escapeHtml(String(e.gm?.hp ?? "?"))}/${escapeHtml(String(e.gm?.hpMax ?? "?"))}</span>
      <span><b>Набої:</b> ${escapeHtml(String(e.gm?.ammo ?? "?"))}</span>
      <span><b>Мораль:</b> ${escapeHtml(e.gm?.morale || "невідомо")}</span>
      <span><b>Ефекти:</b> ${escapeHtml(enemyEffectsText(e))}</span>
    </span>
  </button>`).join("");
}
function showRollToast(title, dice, totals, attrName="", attrMod=0, extra=""){
  const cls = attrMod > 0 ? "mod-pos" : attrMod < 0 ? "mod-neg" : "mod-zero";
  const sign = attrMod > 0 ? "+" : "";
  const attrLine = attrName ? `<br><span>${escapeHtml(attrName)}: <b class="${cls}">${sign}${attrMod}</b></span>` : "";
  showToast(`<div class="toast-roll"><strong>${escapeHtml(title)}</strong><br>🎲 ${escapeHtml(dice.join(" · "))}<br>Результат: ${escapeHtml(totals.join(" · "))}${attrLine}${extra ? `<br>${extra}` : ""}</div>`, true);
}

const ENEMY_EFFECT_LABELS = {
  inCover: "в укритті",
  suppressed: "пригнічений",
  panic: "панікує",
  retreating: "відступає",
  exposed: "розкритий"
};

function enemyEffects(enemy){
  enemy.effects = Array.isArray(enemy.effects) ? enemy.effects : [];
  return enemy.effects;
}

function addEnemyEffect(enemy, effect){
  const effects = enemyEffects(enemy);
  if(!effects.includes(effect)) effects.push(effect);
}

function removeEnemyEffect(enemy, effect){
  enemy.effects = enemyEffects(enemy).filter(e => e !== effect);
}

function enemyEffectsText(enemy){
  const effects = enemyEffects(enemy);
  if(!effects.length) return "немає";
  return effects.map(e => ENEMY_EFFECT_LABELS[e] || e).join(", ");
}

function enemyDefenseValue(enemy){
  return Number(enemy.defense || 12) + (enemyEffects(enemy).includes("inCover") ? 2 : 0);
}

function applyEnemyReactionsAfterDamage(enemy, hits, damage){
  const reactions = [];
  if(!enemy || !enemy.gm || enemy.gm.hp <= 0) return reactions;

  if(hits >= 2){
    addEnemyEffect(enemy, "suppressed");
    enemy.action = "пригнічений вогнем";
    reactions.push("пригнічений");
  }

  const hp = Number(enemy.gm.hp || 0);
  const hpMax = Number(enemy.gm.hpMax || 8);
  const hpRatio = hpMax ? hp / hpMax : 1;

  if(hpRatio <= 0.3){
    addEnemyEffect(enemy, "panic");
    enemy.gm.morale = "паніка";
    enemy.action = "панікує та шукає вихід";
    reactions.push("панікує");
  } else if(hits >= 1 && !enemyEffects(enemy).includes("inCover")){
    addEnemyEffect(enemy, "inCover");
    enemy.action = "ховається в укриття";
    reactions.push("пішов в укриття");
  }

  if(hpRatio <= 0.5 && hits >= 2){
    addEnemyEffect(enemy, "retreating");
    enemy.action = "відступає під вогнем";
    reactions.push("відступає");
  }

  return reactions;
}


function applyPlayerHitsToEnemy(enemy, hits, damageAmount){
  if(!enemy || hits <= 0) return 0;
  enemy.gm = enemy.gm || {hp: 8, hpMax: 8, ammo: 0, morale: "невідомо"};
  const totalDamage = Math.max(1, Number(damageAmount || hits));
  enemy.gm.hp = clamp(Number(enemy.gm.hp ?? enemy.gm.hpMax ?? 8) - totalDamage, 0, Number(enemy.gm.hpMax ?? 8));
  enemy.lastReactions = [];

  if(enemy.gm.hp <= 0){
    enemy.state = "вибув";
    enemy.color = "red";
    enemy.effects = [];
  } else if(enemy.gm.hp <= Math.ceil(Number(enemy.gm.hpMax || 8) * 0.3)){
    enemy.state = "ледь стоїть";
    enemy.color = "red";
    enemy.lastReactions = applyEnemyReactionsAfterDamage(enemy, hits, totalDamage);
  } else if(enemy.gm.hp < Number(enemy.gm.hpMax || 8)){
    enemy.state = "поранений";
    enemy.color = "orange";
    enemy.lastReactions = applyEnemyReactionsAfterDamage(enemy, hits, totalDamage);
  }

  return totalDamage;
}



function currentCombatActorForAction(){
  if(appSession.role === "gm" && data.combat?.active){
    const active = activeCombatant();
    if(active) return active;
  }
  return { id:`player:${currentPlayerId()}`, type:"player", ref:currentPlayerId(), name:currentPlayer().name || currentPlayerId() };
}

function currentCombatTargetForAction(){
  const target = combatantById(combatTargetId());
  if(target) return target;

  const enemy = selectedTargetEnemy();
  if(enemy) return { id:`enemy:${enemy.id}`, type:"enemy", ref:enemy.id, name:enemy.name, state:enemy.state || "цілий" };

  return null;
}

function actionToEnemyAttackMode(action){
  if(action === "shoot_aimed") return "aimed";
  if(action === "shoot_normal") return "normal";
  if(action === "shoot_burst") return "burst";
  return "normal";
}

function isDefeatedCombatant(c){
  if(!c) return true;
  if(c.type === "enemy"){
    const e = findEnemyById(c.ref);
    return !e || e.state === "вибув" || Number(e.gm?.hp ?? 1) <= 0;
  }
  if(c.type === "player"){
    const p = data.players?.[c.ref];
    return !p || Number(p.hp ?? 1) <= 0;
  }
  return false;
}

function routeAttackByActorTarget(action){
  const actor = currentCombatActorForAction();
  const target = currentCombatTargetForAction();

  if(!actor || !target){
    showToast("Немає активного ходу або цілі.");
    addLog("Постріл не виконано: немає активного ходу або цілі.", "gm");
    return { routed:true };
  }

  if(isDefeatedCombatant(actor)){
    showToast("Цей учасник вибув і не може діяти.", false, 4000);
    addLog(`${actor.name}: дія заблокована — учасник вибув.`, "gm");
    return { routed:true };
  }

  if(isDefeatedCombatant(target)){
    showToast("Ціль уже вибула.", false, 4000);
    addLog(`${actor.name}: дія заблокована — ціль ${target.name} уже вибула.`, "gm");
    return { routed:true };
  }

  if(actor.id === target.id){
    showToast("Учасник не може атакувати сам себе.", false, 4000);
    addLog(`${actor.name}: постріл у самого себе заблоковано.`, "gm");
    return { routed:true };
  }

  if(actor.type === "enemy"){
    if(target.type !== "player"){
      showToast("Ворог → ворог ще не підключено. Це буде окрема логіка дружнього вогню.", false, 4500);
      addLog(`${actor.name}: атака по ${target.name} заблокована — дружній вогонь ворогів ще не підключено.`, "gm");
      return { routed:true };
    }

    data.combat = data.combat || {};
    data.combat.enemyTargetPlayerId = target.ref;
    enemyAttack(actor.ref, actionToEnemyAttackMode(action));
    return { routed:true };
  }

  if(actor.type === "player"){
    if(target.type !== "enemy"){
      showToast("Гравець → гравець ще не підключено. Поки заблоковано, щоб не ламати PvP.", false, 4500);
      addLog(`${actor.name}: атака по ${target.name} заблокована — PvP ще не підключено.`, "gm");
      return { routed:true };
    }

    data.meta = data.meta || {};
    data.meta.activePlayerId = actor.ref;
    data.combat = data.combat || {};
    data.combat.targetEnemyId = target.ref;
    return { routed:false, playerId: actor.ref, enemyId: target.ref };
  }

  return { routed:false };
}

function doAction(action){
  if(!isCurrentPlayerTurn()){
    const msg = turnLockMessage();
    showToast(msg || "Зараз не твій хід.");
    addLog(`${currentPlayer().name}: спроба дії поза ходом заблокована. ${msg}`, "gm");
    return;
  }

  let p = currentPlayer();
  let count = 1, baseMod = 0, cost = 0, title = "", extra = "", attrKey = "", damagePerHit = 1, isAttack = false;

  if(action === "shoot_aimed"){ count = 1; baseMod = 2; cost = 1; title = "Точний постріл"; extra = "1 набій, +2 до точності."; attrKey = "accuracy"; isAttack = true; }
  if(action === "shoot_normal"){ count = 2; baseMod = 0; cost = 2; title = "Бойовий постріл"; extra = "2 набої, кожне влучання окремо."; attrKey = "accuracy"; isAttack = true; }
  if(action === "shoot_burst"){ count = 3; baseMod = -2; cost = 3; title = "Черга"; extra = "3 набої, -2, після черги діє Віддача."; attrKey = "accuracy"; isAttack = true; }

  if(action === "look"){ title = "Огляд"; extra = "1d20 + Сприйняття."; attrKey = "perception"; }
  if(action === "throw_bolt"){ title = "Кинути болт"; extra = "1d20 + Сприйняття. Перевірка аномалії."; attrKey = "perception"; }
  if(action === "intuition"){ title = "Інтуїція"; extra = "1d20 + Інтуїція."; attrKey = "intuition"; }
  if(action === "check_friend"){ title = "Оглянути товариша"; extra = "1d20 + Сприйняття."; attrKey = "perception"; }
  if(action === "push"){ title = "Поштовх"; extra = "1d20 + Витривалість."; attrKey = "endurance"; }
  if(action === "listen"){ title = "Прислухатись"; extra = "1d20 + Сприйняття."; attrKey = "perception"; }
  if(action === "clear_jam"){ title = "Усунути клин"; extra = "1d20 + Вправність. 10+ — клин усунуто."; attrKey = "agility"; }

  if(!title) return;

  let routedAttack = null;
  if(isAttack){
    routedAttack = routeAttackByActorTarget(action);
    if(routedAttack?.routed) return;
    if(routedAttack?.playerId) p = playerById(routedAttack.playerId);
  }

  if(action === "clear_jam"){
    const attrModClear = attrValue(p, "agility");
    const rClear = rollD20(1, attrModClear);
    const cleared = rClear.totals[0] >= 10;
    p.weaponJammed = !cleared;
    showRollToast("Усунути клин", rClear.dice, rClear.totals, "Вправність", attrModClear, cleared ? "Клин усунуто." : "Клин лишається.");
    addLog(`${p.name}: усунення клину. Результат ${rClear.totals[0]}. ${cleared ? "Клин усунуто." : "Клин лишається."}`, "public");
    render();
    return;
  }

  if(isAttack && p.weaponJammed){
    showToast("Зброю заклинило. У меню Дії натисни «Усунути клин».", false, 4000);
    addLog(`${p.name}: не може стріляти — зброю заклинило.`, "public");
    render();
    return;
  }

  if(cost && p.ammo < cost){
    showToast("Недостатньо набоїв.");
    addLog(`Спроба дії «${title}»: недостатньо набоїв.`, "public");
    render();
    return;
  }

  const attrMod = attrKey ? attrValue(p, attrKey) : 0;
  const totalMod = baseMod + attrMod;
  const r = rollD20(count, totalMod);
  const rollText = totalMod ? `${count}d20 ${totalMod>0?"+":""}${totalMod}` : `${count}d20`;
  const attrName = attrKey ? attrLabel(attrKey) : "";

  let targetText = "";
  let hitText = "";
  if(isAttack){
    const targetCombatant = currentCombatTargetForAction();
    const enemy = targetCombatant?.type === "enemy" ? findEnemyById(targetCombatant.ref) : selectedTargetEnemy();
    if(!enemy){
      showToast("Немає видимої цілі для пострілу.");
      addLog(`${p.name}: ${title}. Постріл не виконано — немає видимої цілі.`, "public");
      return;
    }
    if(cost) p.ammo -= cost;

    const threshold = enemyDefenseValue(enemy);
    const crits = criticalCount(r.dice);
    const jammedNow = shouldWeaponJam(p, r.dice);
    const critMiss = r.dice.includes(1);
    const hits = r.totals.filter(t => t >= threshold).length;
    let damage = 0;
    let damageRoll = null;
    if(hits){
      damageRoll = rollWeaponDamage(p, hits, crits);
      damage = applyPlayerHitsToEnemy(enemy, hits, damageRoll.total);
    }
    if(jammedNow) p.weaponJammed = true;

    targetText = ` Ціль: ${enemy.name}. Захист цілі: ${threshold}.`;
    hitText = hits ? ` Влучань: ${hits}. Шкода: ${damage}. Формула: ${damageRoll.formula}. Кубики шкоди: ${damageRoll.rolls.join(", ")}${damageRoll.bonus ? " +" + damageRoll.bonus : ""}${damageRoll.conditionMod ? " " + damageRoll.conditionMod : ""}.` : " Промах.";
    if(crits) hitText += ` Крит: +${crits} кубик шкоди.`;
    if(enemy.lastReactions?.length) hitText += ` Реакція ворога: ${enemy.lastReactions.join(", ")}.`;
    if(enemyEffects(enemy).length) hitText += ` Ефекти ворога: ${enemyEffectsText(enemy)}.`;
    if(critMiss) hitText += " Критичний промах: Майстер може ускладнити ситуацію.";
    if(jammedNow) hitText += " Зброю заклинило.";
    if(enemy.state === "вибув") hitText += " Ціль вибула.";
    showRollToast(`${title} → ${enemy.name}`, r.dice, r.totals, attrName, attrMod, `${hits ? "Влучань: " + hits + ", шкода: " + damage + " · " + damageRoll.formula : "Промах"}${enemy.lastReactions?.length ? " · " + enemy.lastReactions.join(", ") : ""}${crits ? " · КРИТ" : ""}${jammedNow ? " · КЛИН" : ""} · Набої: ${p.ammo}`);
  } else {
    showRollToast(title, r.dice, r.totals, attrName, attrMod, extra);
  }

  const result = qs("#rollResult");
  result.hidden = false;
  result.innerHTML = `<h4>${title}</h4>
    <div>${escapeHtml(extra)}</div>
    <div class="roll-dice">🎲 ${r.dice.join(" · ")}</div>
    <div><strong>Кидок:</strong> ${rollText}</div>
    <div><strong>Підсумок:</strong> ${r.totals.join(" · ")}</div>
    ${attrKey ? `<div><strong>${escapeHtml(attrName)}:</strong> ${attrMod > 0 ? "+" : ""}${attrMod}</div>` : ""}
    ${targetText ? `<div>${escapeHtml(targetText)}</div>` : ""}
    ${hitText ? `<div>${escapeHtml(hitText)}</div>` : ""}
    ${cost ? `<div><strong>Набої:</strong> -${cost}, лишилось ${p.ammo}</div>` : ""}`;

  addLog(`${p.name}: ${title}. ${rollText}. Кубики: ${r.dice.join(", ")}. Підсумок: ${r.totals.join(", ")}${attrKey ? `. ${attrName}: ${attrMod > 0 ? "+" : ""}${attrMod}` : ""}${targetText}${hitText}${cost ? `. Набої: ${p.ammo}` : ""}.`, "public");
  render();
  triggerFlicker();
}

function addLog(text, visibility="public"){
  data.journal.push({id: makeId("log"), visibility, time: nowTime(), text});
  if(data.journal.length > 120) data.journal = data.journal.slice(-120);
  save();
}

function showToast(text, html=false, duration=3000){
  const t = qs("#toast");
  if(html) t.innerHTML = text;
  else t.textContent = text;
  t.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.hidden = true, duration);
}

function triggerFlicker(){
  document.body.animate([
    { filter:"brightness(1)" },
    { filter:"brightness(1.16) contrast(1.07)" },
    { filter:"brightness(.92)" },
    { filter:"brightness(1)" }
  ], { duration: 420, easing:"steps(3)" });
}

function randomModuleWarning(){
  const options = [
    "Модуль: зафіксовано аномальну активність. Болти рекомендовано тримати напоготові.",
    "Модуль: рівень перешкод зріс. Радіосигнал нестабільний.",
    "Модуль: рух праворуч. Джерело не ідентифіковано.",
    "Модуль: температура впала. Можлива прихована аномалія.",
    "Модуль: пульс нестабільний. Перевір стан персонажа."
  ];
  const msg = options[Math.floor(Math.random()*options.length)];
  addLog(msg, "public");
  showToast(msg);
  triggerFlicker();
  render();
}

document.addEventListener("click", e => {

  if(e.target.closest("#gmStickyNextTurn")){
    nextTurn();
    return;
  }

  const gmCombatModeBtn = e.target.closest("[data-gm-combat-mode]");
  if(gmCombatModeBtn){
    gmCombatBarMode = gmCombatModeBtn.dataset.gmCombatMode === "target" ? "target" : "actor";
    renderGmCombatStickyBar();
    return;
  }

  const stickyCombatant = e.target.closest("[data-sticky-combatant]");
  if(stickyCombatant){
    const cid = stickyCombatant.dataset.stickyCombatant;
    if(gmCombatBarMode === "target") setCombatTargetById(cid);
    else setActiveCombatantById(cid);
    return;
  }


  const copySpecificPlayer = e.target.closest("[data-copy-player-specific]");
  if(copySpecificPlayer){
    const pid = copySpecificPlayer.dataset.copyPlayerSpecific;
    const url = copySpecificPlayer.dataset.copyUrl || playerSpecificUrl(pid);
    copyTextToClipboard(url, `Посилання ${data.players?.[pid]?.name || pid}`);
    return;
  }

if(e.target.closest("#journalPostPublic")){
    submitJournalQuickNote("public");
    return;
  }

  if(e.target.closest("#journalPostGm")){
    submitJournalQuickNote("gm");
    return;
  }

  if(e.target.closest("#journalPostPrivate")){
    submitJournalQuickNote("private");
    return;
  }



  const forbiddenMasterNav = e.target.closest('.nav-btn[data-target="master"]');
  if(forbiddenMasterNav && appSession.role !== "gm"){
    showToast?.("Панель Майстра доступна тільки Майстру.");
    return;
  }



  const playerSectionToggle = e.target.closest("[data-toggle-player-section]");
  if(playerSectionToggle){
    const key = playerSectionToggle.dataset.togglePlayerSection;
    expandedPlayerEditorSections = expandedPlayerEditorSections || {};
    expandedPlayerEditorSections[key] = !expandedPlayerEditorSections[key];
    render();
    return;
  }


const playerStep = e.target.closest("[data-player-step]");
  if(playerStep){
    doCommand({
      type:"stepPlayerStat",
      playerId: playerStep.dataset.playerStep,
      field: playerStep.dataset.field,
      delta: Number(playerStep.dataset.delta || 0)
    });
    return;
  }
const enemyStep = e.target.closest("[data-enemy-step]");
  if(enemyStep){
    doCommand({
      type:"stepEnemyStat",
      enemyId: enemyStep.dataset.enemyStep,
      field: enemyStep.dataset.field,
      delta: Number(enemyStep.dataset.delta || 0)
    });
    return;
  }


  const enemyToggle = e.target.closest("[data-enemy-toggle]");
  if(enemyToggle){
    doCommand({
      type:"toggleEnemyEffect",
      enemyId: enemyToggle.dataset.enemyToggle,
      effect: enemyToggle.dataset.effect
    });
    return;
  }


  const enemyQuickState = e.target.closest("[data-enemy-quick-state]");
  if(enemyQuickState){
    doCommand({
      type:"setEnemyQuickState",
      enemyId: enemyQuickState.dataset.enemyQuickState,
      state: enemyQuickState.dataset.state
    });
    return;
  }




  const miniPlayer = e.target.closest("[data-gm-mini-player]");
  if(miniPlayer){
    doCommand({type:"setActivePlayer", playerId: miniPlayer.dataset.gmMiniPlayer});
    return;
  }

  const miniEnemy = e.target.closest("[data-gm-mini-enemy]");
  if(miniEnemy){
    doCommand({type:"setTargetEnemy", enemyId: miniEnemy.dataset.gmMiniEnemy});
    return;
  }

  if(e.target.id === "gmQuickAddPublicLog"){
    const field = qs("#gmQuickLogText");
    const text = field?.value?.trim();
    if(text){
      doCommand({type:"addJournalLog", text, visibility:"public"});
      field.value = "";
      showToast("Запис додано в журнал гравців.");
    }
    return;
  }

  if(e.target.id === "gmQuickAddGmLog"){
    const field = qs("#gmQuickLogText");
    const text = field?.value?.trim();
    if(text){
      doCommand({type:"addJournalLog", text, visibility:"gm"});
      field.value = "";
      showToast("Нотатку Майстра додано.");
    }
    return;
  }

  if(e.target.id === "gmQuickAddComplication"){
    const select = qs("#gmQuickComplication");
    const text = select?.value?.trim();
    if(text){
      doCommand({type:"addComplication", text});
      select.value = "";
      showToast("Ускладнення додано.");
    }
    return;
  }



  if(e.target.id === "gmQuickCombatToggle"){
    if(data.combat?.active){
      endCombat();
    } else {
      startCombat();
    }
    render();
    return;
  }

  if(e.target.id === "gmQuickNextTurn"){
    nextTurn();
    render();
    return;
  }

  if(e.target.id === "gmQuickRestore"){
    if(confirm("Відновити базову сцену? Персонажі гравців залишаться.")){
      restoreBaseScenePreservePlayers();
    }
    return;
  }

  if(e.target.id === "gmQuickCopyPlayer"){
    const pid = currentPlayerId();
    const url = playerSpecificUrl(pid);
    copyTextToClipboard(url, `Посилання ${data.players?.[pid]?.name || pid}`);
    return;
  }


  const nav = e.target.closest(".nav-btn");
  if(nav) switchScreen(nav.dataset.target);

  const open = e.target.closest("[data-open]");
  if(open) switchScreen(open.dataset.open);


  const stateEnemyBtn = e.target.closest("[data-state-enemy]");
  if(stateEnemyBtn){
    const enemyId = stateEnemyBtn.dataset.stateEnemy;
    if(enemyId){
      data.combat = data.combat || {};
      const enemy = findEnemyById(enemyId);

      if(!expandedStateEnemyDetails[enemyId]){
        expandedStateEnemyDetails[enemyId] = true;
        render();
        return;
      }

      data.combat.targetEnemyId = enemyId;
      showToast(`Ціль пострілу: ${enemy?.name || enemyId}`);
      render();
    }
    return;
  }


  const targetBtn = e.target.closest("[data-select-target]");
  if(targetBtn){
    data.combat = data.combat || {};
    data.combat.targetEnemyId = targetBtn.dataset.selectTarget;
    render();
  }

  const panelToggle = e.target.closest("[data-toggle-panel]");
  if(panelToggle){
    const panel = qs(`#${panelToggle.dataset.togglePanel}`);
    if(panel) panel.hidden = !panel.hidden;
  }

  const action = e.target.closest("[data-action]");
  if(action) doAction(action.dataset.action);



  const selectPlayerBtn = e.target.closest("[data-select-player]");
  if(selectPlayerBtn){
    setActivePlayer(selectPlayerBtn.dataset.selectPlayer);
  }


  const pDelta = e.target.closest("[data-player-delta]");
  if(pDelta){
    const pid = pDelta.dataset.playerDelta;
    const stat = pDelta.dataset.stat;
    const delta = Number(pDelta.dataset.delta);
    if(data.players[pid]){
      const max = stat === "hp" ? (data.players[pid].hpMax ?? 10) : (stat === "fatigue" ? 5 : (stat === "infection" ? 7 : 999));
      data.players[pid][stat] = clamp((Number(data.players[pid][stat]) || 0) + delta, 0, max);
      addLog(`${data.players[pid].name || pid}: ${stat} ${data.players[pid][stat]}.`, "public");
      render();
    }
  }

  if(e.target.id === "addPlayer"){
    const id = prompt("ID нового гравця латиницею, наприклад grey або doc:");
    if(id){
      const clean = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if(!clean){
        showToast("ID має містити латинські літери або цифри.");
      } else if(data.players[clean]){
        showToast("Такий гравець уже існує.");
      } else {
        data.players[clean] = {id: clean, name: clean, hp: 10, hpMax: 10, fatigue: 0, infection: 0, ammo: 10, weapon: "pm", range: "far", weaponCondition: "normal", weaponJammed: false, defense: 12, defenseMax: 12, armor: 0, activeEffects: [], stats: { endurance: 0, accuracy: 0, agility: 0, perception: 0, intuition: 0, charisma: 0 }, inventory: clone(defaultRoomData.players.fox.inventory)};
        data.meta.activePlayerId = clean;
        addLog(`Майстер додав гравця: ${clean}.`, "public");
        render();
      }
    }
  }


  const playerCoverBtn = e.target.closest("[data-toggle-player-cover]");
  if(playerCoverBtn){
    const pid = playerCoverBtn.dataset.togglePlayerCover;
    if(data.players[pid]){
      data.players[pid].cover = !data.players[pid].cover;
      addLog(`${data.players[pid].name || pid}: ${data.players[pid].cover ? "в укритті" : "без укриття"}.`, "public");
      render();
    }
  }


  const copyPlayer = e.target.closest("[data-copy-player-link]");
  if(copyPlayer){
    const pid = copyPlayer.dataset.copyPlayerLink;
    const url = playerSpecificUrl(pid);
    copyTextToClipboard(url, "Посилання гравця");
  return;
  }

  const removePlayer = e.target.closest("[data-remove-player]");
  if(removePlayer){
    const pid = removePlayer.dataset.removePlayer;
    if(pid !== currentPlayerId() && confirm(`Видалити гравця ${pid}?`)){
      delete data.players[pid];
      if(data.meta.activePlayerId === pid) data.meta.activePlayerId = Object.keys(data.players)[0] || appSession.player;
      addLog(`Майстер видалив гравця: ${pid}.`, "gm");
      render();
    }
  }

  const enemyState = e.target.closest("[data-enemy-state]");
  if(enemyState){
    const idx = Number(enemyState.dataset.enemyState);
    if(data.enemies[idx]){
      data.enemies[idx].state = enemyState.dataset.state;
      data.enemies[idx].color = enemyState.dataset.color;
      addLog(`Стан ворога «${data.enemies[idx].name}»: ${data.enemies[idx].state}.`, "public");
      render();
    }
  }





  const adventureButton = e.target.closest("[data-load-adventure]");
  if(adventureButton){
    if(confirm("Завантажити пак пригоди? Поточна сцена й вороги будуть замінені, гравці залишаться.")){
      loadAdventurePack(adventureButton.dataset.loadAdventure);
    }
  }

  const defeatButton = e.target.closest("[data-defeat]");
  if(defeatButton){
    if(confirm("Застосувати тиху сцену після поразки? Це змінить сцену, стан гравців і очистить ворогів.")){
      applyDefeatScene(defeatButton.dataset.defeat);
    }
  }

  if(e.target.id === "downloadCampaign"){
    const filename = `polovyi-modul-${appSession.room}-${new Date().toISOString().slice(0,10)}.json`;
    downloadTextFile(filename, JSON.stringify(data, null, 2));
    showToast("JSON кампанії завантажено.");
  }

  if(e.target.id === "copyCampaignJson"){
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
    showToast("JSON кампанії скопійовано.");
  }


  if(e.target.id === "startCombat"){
    startCombat();
  }

  if(e.target.id === "nextTurn"){
    nextTurn();
  }

  if(e.target.id === "toggleStrictTurns"){
    toggleStrictTurns();
  }

  if(e.target.id === "endCombat"){
    endCombat();
  }

  if(e.target.id === "moraleCheck"){
    moraleCheck();
  }


  const enemyAttackBtn = e.target.closest("[data-enemy-attack]");
  if(enemyAttackBtn){
    enemyAttack(enemyAttackBtn.dataset.enemyAttack, enemyAttackBtn.dataset.mode);
  }


  const damageBtn = e.target.closest("[data-damage-enemy]");
  if(damageBtn){
    damageEnemy(damageBtn.dataset.damageEnemy, Number(damageBtn.dataset.amount || 1));
  }

  const healBtn = e.target.closest("[data-heal-enemy]");
  if(healBtn){
    healEnemy(healBtn.dataset.healEnemy, Number(healBtn.dataset.amount || 1));
  }

  const coverBtn = e.target.closest("[data-toggle-cover]");
  if(coverBtn){
    toggleEnemyCover(coverBtn.dataset.toggleCover);
  }

  const enemyStateById = e.target.closest("[data-enemy-state-by-id]");
  if(enemyStateById){
    const enemy = findEnemyById(enemyStateById.dataset.enemyStateById);
    if(enemy){
      if(enemyStateById.dataset.state === "вибув" && !confirm(`Позначити «${enemy.name}» як вибув?`)) return;
      enemy.state = enemyStateById.dataset.state;
      enemy.color = enemyStateById.dataset.color;
      addLog(`${enemy.name}: ${enemy.state}.`, "public");
      render();
    }
  }


  const sceneButton = e.target.closest("[data-load-scene]");
  if(sceneButton){
    if(confirm("Завантажити шаблон сцени? Поточна сцена і вороги будуть замінені.")){
      loadSceneTemplate(sceneButton.dataset.loadScene);
    }
  }

  const enemyTemplateButton = e.target.closest("[data-add-enemy-template]");
  if(enemyTemplateButton){
    addEnemyTemplate(enemyTemplateButton.dataset.addEnemyTemplate);
  }

  if(e.target.id === "clearEnemies"){
    if(confirm("Очистити всіх ворогів поточної сцени?")){
      data.enemies = [];
      addLog("Майстер очистив список ворогів сцени.", "public");
      render();
    }
  }

  const lootButton = e.target.closest("[data-loot]");
  if(lootButton){
    rollLoot(lootButton.dataset.loot);
  }

  if(e.target.id === "addCustomLoot"){
    const item = qs("#customLootName")?.value.trim();
    const count = Math.max(1, Number(qs("#customLootCount")?.value || 1));
    const note = qs("#customLootNote")?.value.trim() || "";
    if(!item){
      showToast("Введи назву предмета.");
    } else {
      const pid = targetPlayerId();
      const p = playerById(pid);
      inventoryForPlayer(pid).push({item, count, note});
      addLog(`Майстер додав предмет для ${p.name || pid}: ${item} x${count}.`, "public");
      qs("#customLootName").value = "";
      qs("#customLootCount").value = 1;
      qs("#customLootNote").value = "";
      render();
    }
  }


  const hpDelta = e.target.closest("[data-delta-hp]");
  if(hpDelta){ const p = currentPlayer(); p.hp = clamp(p.hp + Number(hpDelta.dataset.deltaHp), 0, p.hpMax); addLog(`${p.name}: HP ${p.hp}/${p.hpMax}.`, "public"); render(); }

  const fDelta = e.target.closest("[data-delta-fatigue]");
  if(fDelta){ const p = currentPlayer(); p.fatigue = clamp(p.fatigue + Number(fDelta.dataset.deltaFatigue), 0, 5); addLog(`${p.name}: Втома ${p.fatigue}/5.`, "public"); render(); }
if(e.target.id === "copyPlayerLink"){
    const pid = appSession.role === "gm" ? currentPlayerId() : appSession.player;
    const url = playerSpecificUrl(pid);
    copyTextToClipboard(url, "Посилання поточного Гравця");
    return;
  }

  if(e.target.id === "restoreBaseScene"){
    if(confirm("Відновити базову сцену? Персонажі гравців залишаться, але оточення, вороги, бій і журнал сцени будуть скинуті.")){
      restoreBaseScenePreservePlayers();
    }
  }

  if(e.target.id === "resetFirebaseRoom"){
    if(confirm("Очистити поточну кімнату Firebase і повернути стартовий стан? Це скине також персонажів.")){
      const fresh = ensureRoomData(null);
      fresh.meta.roomId = appSession.room;
      fresh.meta.syncMode = "firebase";
      data = fresh;
      if(syncAdapter.roomRef){
        syncAdapter.roomRef.set(data).then(() => showToast("Кімнату очищено."));
      } else {
        render();
      }
    }
  }

});

document.addEventListener("input", e => {


  if(e.target.id === "lootTargetPlayer"){
    if(data.players[e.target.value]){
      data.meta.activePlayerId = e.target.value;
      save();
      render();
    }
    return;
  }

  if(e.target.id === "enemyAttackTarget"){
    if(data.players[e.target.value]){
      data.combat = data.combat || {};
      data.combat.enemyTargetPlayerId = e.target.value;
      save();
      render();
    }
    return;
  }

  const playerInput = e.target.closest("[data-player]");
  if(playerInput){
    const pid = playerInput.dataset.player;
    const field = playerInput.dataset.field;
    if(data.players[pid]){
      const numeric = ["hp","hpMax","fatigue","infection","ammo","defense","defenseMax","armor"].includes(field);
      if(numeric && playerInput.value === "") return;
      data.players[pid][field] = numeric ? Number(playerInput.value) : playerInput.value;
      if(field === "hpMax") data.players[pid].hp = clamp(data.players[pid].hp, 0, data.players[pid].hpMax);
      if(field === "defenseMax") data.players[pid].defense = Math.min(Number(data.players[pid].defense ?? 12), Number(data.players[pid].defenseMax ?? 12));
      if(field === "defense") data.players[pid].defenseMax = Math.max(Number(data.players[pid].defenseMax ?? data.players[pid].defense ?? 12), Number(data.players[pid].defense ?? 12));
    }
    return;
  }

  const statInput = e.target.closest("[data-player-stat]");
  if(statInput){
    const pid = statInput.dataset.playerStat;
    const field = statInput.dataset.statField;
    if(data.players[pid]){
      if(statInput.value === "") return;
      data.players[pid].stats = data.players[pid].stats || {};
      data.players[pid].stats[field] = Number(statInput.value);
    }
    return;
  }

  const enemyInput = e.target.closest("[data-enemy]");
  if(enemyInput){
    const idx = Number(enemyInput.dataset.enemy);
    const field = enemyInput.dataset.field;
    if(field === "visible") data.enemies[idx][field] = enemyInput.checked;
    else data.enemies[idx][field] = enemyInput.value;
    if(field === "visible" || enemyInput.tagName === "SELECT") { save(); render(); }
    return;
  }

  const itemInput = e.target.closest("[data-item]");
  if(itemInput){
    const idx = Number(itemInput.dataset.item);
    const field = itemInput.dataset.field;
    const inv = currentInventory();
    if(field === "count" && itemInput.value === "") return;
    inv[idx][field] = field === "count" ? Number(itemInput.value) : itemInput.value;
  }
});


document.addEventListener("change", e => {

  // weaponJammed checkbox V19.7
  const playerCheckbox = e.target.closest('input[type="checkbox"][data-player][data-field="weaponJammed"]');
  if(playerCheckbox){
    const p = data.players?.[playerCheckbox.dataset.player];
    if(p){
      p.weaponJammed = playerCheckbox.checked;
      save();
      render();
    }
    return;
  }



  const enemyControl = e.target.closest("[data-enemy-control]");
  if(enemyControl){
    doCommand({
      type:"setEnemyField",
      enemyId: enemyControl.dataset.enemyControl,
      field: enemyControl.dataset.field,
      value: e.target.value
    });
    return;
  }
if(e.target.closest("[data-player]") || e.target.closest("[data-player-stat]") || e.target.closest("[data-enemy]") || e.target.closest("[data-item]")){
    save();
  }
});

const importInput = qs("#importData");
if(importInput) importInput.addEventListener("change", async e => {
  const file = e.target.files[0];
  if(!file) return;
  try{
    const text = await file.text();
    const imported = ensureRoomData(JSON.parse(text));
    if(!imported.players || !imported.scene) throw new Error("bad file");
    data = imported;
    addLog("Імпортовано дані кімнати з JSON.", "public");
    render();
    showToast("Імпорт виконано.");
  }catch(err){
    showToast("Не вдалося імпортувати JSON.");
  }
});


const importCampaignInput = qs("#importCampaignFile");
if(importCampaignInput) importCampaignInput.addEventListener("change", async e => {
  const file = e.target.files[0];
  if(!file) return;
  try{
    const text = await file.text();
    const imported = ensureRoomData(JSON.parse(text));
    if(!imported.players || !imported.scene) throw new Error("bad campaign");
    data = imported;
    data.meta.roomId = appSession.room;
    data.meta.syncMode = "firebase";
    addLog("Імпортовано JSON кампанії.", "public");
    render();
    showToast("Кампанію імпортовано.");
  }catch(err){
    showToast("Не вдалося імпортувати кампанію.");
  }
});


setInterval(() => {
  const d = new Date();
  qs("#clock").textContent = d.toLocaleTimeString("uk-UA", {hour:"2-digit", minute:"2-digit"});
}, 10000);


syncAdapter.init().then(() => {
  const runtimeError = document.querySelector("#runtimeError");
  if(runtimeError) runtimeError.remove();
  applyRoleMode();
  showToast(`Firebase: кімната ${appSession.room} підключена.`);
  if(appSession.access === "denied"){
    showToast("Ключ Майстра неправильний або відсутній. Відкрито режим Гравця.");
    addLog("Спроба входу як Майстер без правильного ключа.", "gm");
  }
}).catch(err => {
  const runtimeError = document.querySelector("#runtimeError");
  if(runtimeError) runtimeError.textContent = "Помилка Firebase: " + (err && err.message ? err.message : err);
  console.error(err);
});
