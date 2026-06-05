/**
 * data/mapNodes.js — definicje węzłów i ścieżek mapy organizacji obozu.
 * Węzły = klikalne obszary (każdy to tablica poligonów).
 * Ścieżki = rzeczywiste linie złożone z wielu punktów.
 */

// ── Obszary klikalne — każdy to tablica poligonów ──────────────────────────

export const NODE_AREAS = {
  '0.1': null,

  '1.x': [
    [{x:282,y:25},{x:232,y:43},{x:221,y:37},{x:213,y:33},{x:206,y:33},{x:199,y:37},{x:195,y:43},{x:193,y:48},{x:191,y:52},{x:182,y:55},{x:171,y:59},{x:155,y:63},{x:141,y:67},{x:127,y:71},{x:126,y:70},{x:118,y:72},{x:116,y:84},{x:124,y:88},{x:124,y:120},{x:124,y:145},{x:124,y:150},{x:119,y:161},{x:113,y:178},{x:107,y:194},{x:101,y:208},{x:109,y:211},{x:115,y:198},{x:122,y:183},{x:124,y:189},{x:124,y:203},{x:124,y:216},{x:123,y:222},{x:131,y:223},{x:130,y:229},{x:136,y:233},{x:141,y:235},{x:147,y:236},{x:157,y:238},{x:167,y:235},{x:172,y:228},{x:171,y:219},{x:170,y:213},{x:167,y:205},{x:162,y:196},{x:154,y:193},{x:148,y:196},{x:142,y:199},{x:139,y:194},{x:146,y:188},{x:159,y:184},{x:167,y:181},{x:170,y:188},{x:182,y:185},{x:182,y:178},{x:206,y:169},{x:234,y:161},{x:263,y:152},{x:275,y:147},{x:276,y:160},{x:276,y:168},{x:281,y:172},{x:290,y:168},{x:289,y:42},{x:295,y:40},{x:294,y:30}],
    [{x:435,y:151},{x:424,y:146},{x:426,y:137},{x:426,y:129},{x:423,y:123},{x:423,y:118},{x:420,y:111},{x:415,y:108},{x:409,y:110},{x:407,y:113},{x:407,y:118},{x:407,y:123},{x:405,y:128},{x:403,y:134},{x:395,y:134},{x:385,y:130},{x:377,y:126},{x:375,y:119},{x:372,y:117},{x:368,y:117},{x:364,y:119},{x:360,y:117},{x:356,y:115},{x:348,y:119},{x:335,y:125},{x:322,y:130},{x:315,y:133},{x:315,y:137},{x:308,y:141},{x:306,y:147},{x:306,y:147},{x:311,y:150},{x:310,y:177},{x:316,y:179},{x:319,y:177},{x:320,y:155},{x:338,y:163},{x:329,y:165},{x:326,y:170},{x:325,y:174},{x:325,y:179},{x:327,y:183},{x:330,y:186},{x:335,y:188},{x:341,y:188},{x:347,y:185},{x:347,y:190},{x:352,y:193},{x:357,y:194},{x:365,y:194},{x:368,y:189},{x:361,y:188},{x:357,y:183},{x:363,y:180},{x:367,y:179},{x:374,y:177},{x:377,y:180},{x:377,y:195},{x:377,y:207},{x:382,y:210},{x:382,y:210},{x:387,y:207},{x:387,y:181},{x:405,y:172},{x:401,y:178},{x:397,y:182},{x:395,y:191},{x:391,y:198},{x:390,y:204},{x:391,y:210},{x:397,y:213},{x:402,y:215},{x:409,y:216},{x:415,y:217},{x:421,y:216},{x:428,y:212},{x:431,y:204},{x:431,y:197},{x:427,y:192},{x:430,y:186},{x:433,y:184},{x:433,y:160}],
  ],

  // ETAP 2 — załączniki PSP
  '2.1': [[{x:82,y:383},{x:95,y:386},{x:108,y:397},{x:113,y:415},{x:104,y:433},{x:92,y:441},{x:80,y:443},{x:70,y:441},{x:60,y:436},{x:54,y:428},{x:51,y:417},{x:52,y:402},{x:54,y:393},{x:68,y:387}]],
  '2.2': [[{x:101,y:472},{x:85,y:462},{x:71,y:462},{x:54,y:473},{x:48,y:490},{x:52,y:508},{x:64,y:519},{x:79,y:522},{x:90,y:520},{x:99,y:514},{x:105,y:505},{x:109,y:493},{x:107,y:484}]],
  // 2.3 + 2.4 współdzielony obszar — wszystkie mapy do PSP
  '2.x': [[{x:127,y:563},{x:124,y:554},{x:119,y:546},{x:116,y:539},{x:110,y:539},{x:102,y:537},{x:92,y:536},{x:84,y:536},{x:74,y:539},{x:69,y:543},{x:64,y:544},{x:56,y:544},{x:55,y:554},{x:62,y:581},{x:64,y:588},{x:74,y:595},{x:89,y:598},{x:101,y:599},{x:113,y:595},{x:120,y:588},{x:127,y:580},{x:131,y:575}]],
  '2.5': [[{x:174,y:629},{x:168,y:615},{x:151,y:605},{x:132,y:605},{x:119,y:612},{x:112,y:621},{x:107,y:638},{x:112,y:649},{x:117,y:658},{x:126,y:663},{x:139,y:668},{x:153,y:665},{x:164,y:659},{x:171,y:653},{x:176,y:642}]],

  // ETAP 3 — PSP
  '3.1': [[{x:481,y:634},{x:469,y:630},{x:467,y:627},{x:427,y:609},{x:422,y:610},{x:411,y:607},{x:411,y:587},{x:399,y:580},{x:389,y:579},{x:385,y:584},{x:382,y:523},{x:367,y:520},{x:368,y:507},{x:377,y:508},{x:387,y:503},{x:387,y:535},{x:408,y:523},{x:411,y:517},{x:415,y:515},{x:421,y:516},{x:468,y:490},{x:472,y:493},{x:507,y:487},{x:538,y:521},{x:542,y:523},{x:543,y:601},{x:520,y:615},{x:525,y:616},{x:536,y:611},{x:541,y:611},{x:548,y:613},{x:548,y:615},{x:553,y:620},{x:556,y:630},{x:555,y:644},{x:551,y:650},{x:544,y:652},{x:538,y:657},{x:534,y:654},{x:517,y:665},{x:515,y:670},{x:508,y:671},{x:499,y:675},{x:487,y:671},{x:477,y:664},{x:476,y:657},{x:478,y:647},{x:475,y:640}]],

  // ETAP 4 — Kuratorium
  '4.1': [[{x:365,y:857},{x:306,y:834},{x:306,y:830},{x:311,y:823},{x:302,y:825},{x:296,y:824},{x:287,y:823},{x:282,y:816},{x:281,y:809},{x:286,y:803},{x:289,y:755},{x:283,y:750},{x:327,y:719},{x:333,y:718},{x:338,y:715},{x:348,y:714},{x:350,y:722},{x:372,y:729},{x:386,y:719},{x:414,y:710},{x:441,y:740},{x:438,y:751},{x:475,y:768},{x:472,y:775},{x:473,y:824},{x:468,y:830},{x:475,y:829},{x:481,y:833},{x:485,y:838},{x:488,y:845},{x:485,y:851},{x:475,y:853},{x:475,y:854},{x:467,y:856},{x:459,y:861},{x:449,y:861},{x:444,y:851},{x:427,y:859},{x:417,y:858},{x:412,y:862},{x:404,y:864},{x:394,y:861},{x:382,y:855},{x:377,y:851}]],
  '4.2': [[{x:115,y:770},{x:99,y:775},{x:81,y:784},{x:69,y:800},{x:67,y:826},{x:76,y:847},{x:91,y:859},{x:114,y:869},{x:137,y:870},{x:153,y:862},{x:172,y:848},{x:177,y:833},{x:181,y:809},{x:173,y:791},{x:149,y:776}]],
  '4.3': [[{x:268,y:881},{x:250,y:869},{x:230,y:861},{x:205,y:864},{x:181,y:874},{x:170,y:886},{x:165,y:903},{x:165,y:920},{x:180,y:939},{x:201,y:948},{x:224,y:953},{x:248,y:946},{x:267,y:934},{x:277,y:916},{x:275,y:899}]],

  // ETAP 5 — pozostałe
  '5.1': [[{x:570,y:909},{x:572,y:919},{x:569,y:920},{x:569,y:945},{x:531,y:965},{x:498,y:950},{x:499,y:926},{x:496,y:924},{x:496,y:916},{x:537,y:894}]],
  '5.2': [[{x:702,y:894},{x:702,y:901},{x:699,y:902},{x:700,y:942},{x:662,y:965},{x:613,y:942},{x:614,y:901},{x:612,y:899},{x:613,y:892},{x:653,y:871}]],
  '5.3': [[{x:732,y:1013},{x:708,y:1024},{x:692,y:1037},{x:697,y:1038},{x:697,y:1081},{x:722,y:1092},{x:745,y:1080},{x:744,y:1043},{x:750,y:1038}],[{x:687,y:1086},{x:730,y:1106},{x:730,y:1117},{x:691,y:1138},{x:649,y:1118},{x:648,y:1108}]],
  '5.4': [[{x:698,y:998},{x:695,y:1000},{x:693,y:971},{x:689,y:966},{x:688,y:966},{x:698,y:962},{x:699,y:927},{x:699,y:927},{x:706,y:923},{x:715,y:919},{x:724,y:920},{x:733,y:921},{x:738,y:925},{x:742,y:930},{x:742,y:940},{x:743,y:960},{x:752,y:965},{x:752,y:969},{x:748,y:969},{x:749,y:998},{x:745,y:999},{x:743,y:993},{x:736,y:990},{x:725,y:1002},{x:725,y:1010},{x:721,y:1010},{x:716,y:1004},{x:707,y:991}]],
  '5.5': [[{x:591,y:1024},{x:591,y:1030},{x:603,y:1036},{x:608,y:1039},{x:608,y:1046},{x:610,y:1057},{x:610,y:1067},{x:599,y:1074},{x:588,y:1080},{x:581,y:1078},{x:574,y:1079},{x:570,y:1074},{x:566,y:1070},{x:554,y:1064},{x:548,y:1066},{x:542,y:1064},{x:533,y:1062},{x:530,y:1056},{x:528,y:1049},{x:522,y:1050},{x:520,y:1043},{x:522,y:1034},{x:524,y:1024},{x:531,y:1018},{x:543,y:1012},{x:549,y:1008},{x:562,y:1010}]],

  // ETAP 7 — Przygotowanie pedagogiczne (niezależne)
  '7.1': [[{x:320,y:250},{x:300,y:235},{x:288,y:240},{x:285,y:250},{x:290,y:265},{x:305,y:275},{x:318,y:270},{x:325,y:258}]],
}

// Mapowanie node ID → area ID
export const NODE_TO_AREA = {
  '1.1': '1.x', '1.2': '1.x', '1.3': '1.x', '1.4': '1.x', '1.5': '1.x',
  '2.3': '2.x', '2.4': '2.x',
  '6.1': '6.x', '6.2': '6.x', '6.3': '6.x', '6.4': '6.x',
}

// ── Ścieżki ─────────────────────────────────────────────────────
export const REAL_PATHS = [
  { id: 'main', points: [
    {x:663,y:148},{x:661,y:151},{x:679,y:172},{x:683,y:188},{x:676,y:202},{x:666,y:218},{x:642,y:230},{x:611,y:239},{x:561,y:252},{x:518,y:263},{x:482,y:270},{x:442,y:277},{x:397,y:291},{x:340,y:307},{x:297,y:325},{x:272,y:336},{x:255,y:347},{x:234,y:368},{x:225,y:405},{x:225,y:435},{x:235,y:465},{x:254,y:492},{x:270,y:512},{x:292,y:530},{x:312,y:552},{x:334,y:572},{x:356,y:599},{x:382,y:614},{x:416,y:634},{x:456,y:650},{x:484,y:673},{x:523,y:691},{x:559,y:698},{x:587,y:720},{x:610,y:740},{x:626,y:763},{x:620,y:793},{x:600,y:821},{x:574,y:842},{x:536,y:859},{x:504,y:877},{x:465,y:891},{x:416,y:914},{x:370,y:929},{x:343,y:956},{x:328,y:978},{x:326,y:1018},{x:354,y:1049},{x:391,y:1059},{x:414,y:1069},{x:448,y:1082},{x:480,y:1095},{x:509,y:1108},{x:533,y:1125},{x:560,y:1146},{x:563,y:1183},{x:566,y:1225},{x:536,y:1249},{x:511,y:1260},{x:508,y:1261},{x:470,y:1269},{x:425,y:1271},{x:396,y:1265},{x:367,y:1249},
  ]},
  { id: 'psp-branch', points: [{x:93,y:442},{x:91,y:433},{x:102,y:452},{x:116,y:454},{x:134,y:461},{x:137,y:472},{x:129,y:482},{x:117,y:488},{x:99,y:492},{x:97,y:501},{x:106,y:508},{x:115,y:513},{x:126,y:519},{x:136,y:527},{x:143,y:534},{x:145,y:549},{x:148,y:560},{x:152,y:573},{x:163,y:583},{x:175,y:593},{x:190,y:599},{x:207,y:604},{x:220,y:605},{x:230,y:605},{x:243,y:604},{x:259,y:607},{x:275,y:614},{x:290,y:622},{x:310,y:626},{x:322,y:623},{x:337,y:619},{x:371,y:609}] },
  { id: 'psp-branch2', points: [{x:244,y:611},{x:246,y:604},{x:232,y:624},{x:212,y:635},{x:188,y:640},{x:163,y:638}] },
  { id: 'psp-branch3', points: [{x:116,y:566},{x:150,y:572}] },
  { id: 'kuratorium-branch1', points: [{x:174,y:827},{x:210,y:825},{x:240,y:833},{x:262,y:844},{x:286,y:852},{x:308,y:856},{x:333,y:846}] },
  { id: 'kuratorium-branch2', points: [{x:267,y:894},{x:289,y:886},{x:305,y:872},{x:325,y:857},{x:334,y:846}] },
  { id: 'side-to-camp', points: [{x:632,y:952},{x:610,y:962},{x:595,y:978},{x:587,y:992},{x:596,y:1008},{x:620,y:1023},{x:631,y:1035},{x:639,y:1049},{x:637,y:1070},{x:628,y:1087},{x:611,y:1096},{x:595,y:1110},{x:573,y:1117},{x:555,y:1127},{x:552,y:1138}] },
  { id: 'police-to-camp', points: [{x:560,y:950},{x:580,y:962},{x:591,y:978}] },
  { id: 'water-to-camp', points: [{x:691,y:992},{x:671,y:1002},{x:639,y:1017},{x:631,y:1034}] },
  { id: 'latrine-to-camp', points: [{x:697,y:1073},{x:672,y:1074},{x:640,y:1081},{x:627,y:1088}] },
]

// ── Helpers ──────────────────────────────────────────────────────────────

export function getAllPolygons(areaId) {
  return NODE_AREAS[areaId] || []
}

export function hitTest(areaId, px, py) {
  const polyList = NODE_AREAS[areaId]
  if (!polyList) return false
  for (const poly of polyList) {
    let inside = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y
      const xj = poly[j].x, yj = poly[j].y
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside
    }
    if (inside) return true
  }
  return false
}

// Punkty dokowania ludzika — precyzyjne współrzędne dla każdego węzła
export const DOCK_POSITIONS = {
  '0.1': { x: 400, y: 160 },
  '1.x': { x: 380, y: 160 },
  '2.1': { x: 80, y: 410 },
  '2.2': { x: 80, y: 490 },
  '2.x': { x: 90, y: 570 },
  '2.5': { x: 140, y: 640 },
  '3.1': { x: 470, y: 590 },
  '4.1': { x: 380, y: 790 },
  '4.2': { x: 120, y: 820 },
  '4.3': { x: 220, y: 910 },
  '5.1': { x: 540, y: 930 },
  '5.2': { x: 660, y: 920 },
  '5.3': { x: 720, y: 1060 },
  '5.4': { x: 720, y: 980 },
  '5.5': { x: 570, y: 1040 },
  '6.x': { x: 290, y: 1180 },
  '7.1': { x: 310, y: 260 },
}

export function getCharPosition(nodeId) {
  const areaId = NODE_TO_AREA[nodeId] || nodeId
  if (DOCK_POSITIONS[areaId]) return DOCK_POSITIONS[areaId]
  const polyList = NODE_AREAS[areaId]
  if (!polyList || !polyList[0] || polyList[0].length === 0) return { x: 200, y: 100 }
  const poly = polyList[0]
  const cx = Math.round(poly.reduce((s, p) => s + p.x, 0) / poly.length)
  const cy = Math.round(poly.reduce((s, p) => s + p.y, 0) / poly.length)
  return { x: cx, y: cy }
}

export const ALL_AREA_IDS = Object.keys(NODE_AREAS).filter(k => NODE_AREAS[k] !== null)

// ── Etykiety / ikony / zależności ───────────────────────────────────────

export const NODE_LABELS = {
  '0.1': 'Miejsce obozu',
  '1.1': 'Jednostka', '1.2': 'Kierownik', '1.3': 'Termin', '1.4': 'Uczestnicy', '1.5': 'Kadra',
  '2.1': 'Regulamin obozu', '2.2': 'Instrukcja ppoż (zał.1-2)', '2.3': 'Mapa zagospodarowania (zał.3)', '2.4': 'Drogi ewakuacyjne (zał.4)', '2.5': 'Łączność + uczestnicy (zał.6)',
  '3.1': 'PSP — Opinia ppoż',
  '4.1': 'Kuratorium Oświaty', '4.2': 'Zaświadczenia o niekaralności', '4.3': 'Liczba uczestników',
  '5.1': 'Policja — zawiadomienie', '5.2': 'Szpital — zawiadomienie', '5.3': 'Latryny / doły chłonne', '5.4': 'Organizacja wody (mauzer)', '5.5': 'Umowa na wywóz śmieci',
  '6.1': 'Plan + jadłospis', '6.2': 'Budżet', '6.3': 'Ubezpieczenie / ZUS', '6.4': 'OBÓZ GOTOWY',
  '7.1': 'Przygotowanie pedagogiczne',
}

export const NODE_ICONS = {
  '0.1': '🌍', '1.1': '🏕️', '1.2': '👤', '1.3': '📅', '1.4': '👥', '1.5': '📋',
  '2.1': '📜', '2.2': '🔥', '2.3': '🗺️', '2.4': '🚪', '2.5': '📡',
  '3.1': '🚒', '4.1': '🏛️', '4.2': '📋', '4.3': '📝',
  '5.1': '👮', '5.2': '🏥', '5.3': '🚽', '5.4': '💧', '5.5': '🗑️',
  '6.1': '📖', '6.2': '💰', '6.3': '🛡️', '6.4': '🏁',
  '7.1': '📚',
}

export const NODE_DETAIL_IMAGE_KEY = {
  '1.x': 'detale-info', '2.1': 'detale-info', '2.2': 'detale-info', '2.3': 'detale-info', '2.4': 'detale-info', '2.5': 'detale-info',
  '3.1': 'detale-psp', '4.1': 'detale-kuratorium', '4.2': 'detale-kuratorium', '4.3': 'detale-kuratorium',
  '5.x': 'detale-ogolny', '6.x': 'detale-ogolny',
  '7.1': 'detale-info',
}

export const DEPENDENCIES = {
  '3.1': ['1.1', '2.1', '2.2', '2.3', '2.4', '2.5'],
  '4.1': ['3.1'],
}

// Węzły zawsze available (misje poboczne — bez blokad)
export const ALWAYS_AVAILABLE = new Set([
  '1.2', '1.3', '1.4', '1.5',
  '2.1', '2.2', '2.3', '2.4', '2.5',
  '4.2', '4.3',
  '5.1', '5.2', '5.3', '5.4', '5.5',
  '6.1', '6.2', '6.3', '6.4',
  '7.1',
])

export const AUTO_CHECK = {
  '0.1': (meta) => !!(meta.coords?.lat && meta.coords?.lng),
  '1.1': (meta) => !!meta.jednostka,
  '1.2': (meta) => !!meta.kierownik,
  '1.3': (meta) => !!(meta.date_start && meta.date_end),
  '1.4': (meta) => !!(meta.uczestnicy),
  '1.5': (meta) => Array.isArray(meta.wychowawcy) && meta.wychowawcy.length > 0,
}

// ── Opisy węzłów (co trzeba zrobić) ───────────────────────────────────────

export const NODE_DESCRIPTIONS = {
  '0.1': 'Wybierz miejsce obozu na mapie w zakładce "Teren". Określ właściciela terenu (prywatny lub nadleśnictwo).',
  '1.1': 'Podaj pełną nazwę jednostki harcerskiej (np. "3 Drużyna Harcerska im. XYZ").',
  '1.2': 'Podaj imię i nazwisko kierownika obozu — osoby odpowiedzialnej za całość.',
  '1.3': 'Ustal dokładne daty rozpoczęcia i zakończenia obozu. Od tego zależy termin zgłoszenia do Kuratorium (21 dni przed).',
  '1.4': 'Podaj liczbę uczestników (harcerzy) biorących udział w obozie.',
  '1.5': 'Wpisz dane kadry: imię, nazwisko, funkcja (kierownik/wychowawca) oraz datę uzyskania zaświadczenia o niekaralności.',
  '2.1': 'Sporządź regulamin obozu. Musi zawierać zasady bezpieczeństwa, porządek dnia, obowiązki uczestników. Załącznik nr 5 do wniosku PSP.',
  '2.2': 'Przygotuj instrukcję postępowania w razie pożaru oraz instrukcję bezpieczeństwa pożarowego (zał. 1 i 2 do wniosku PSP).',
  '2.3': 'Stwórz mapę zagospodarowania terenu obozu (zał. 3 do PSP). Zaznacz namioty, kuchnię, latryny, drogi.',
  '2.4': 'Przygotuj plan dróg ewakuacyjnych wraz z mapą dojazdu do obozu (zał. 4 do PSP).',
  '2.5': 'Określ środki łączności (telefon, radiotelefon) i potwierdź liczbę uczestników (zał. 6 do PSP).',
  '3.1': 'Złóż wniosek o opinię ppoż do właściwej komendy PSP. Dołącz załączniki 1-6. PSP ma do 30 dni na odpowiedź. Może wymagać wizji lokalnej.',
  '4.1': 'Złóż zgłoszenie obozu do Kuratorium Oświaty — najpóźniej 21 dni przed rozpoczęciem. Wymaga pozytywnej opinii PSP + danych kadry. Kuratorium powiadomi Sanepid automatycznie.',
  '4.2': 'Zbierz zaświadczenia o niekaralności od wszystkich członków kadry (wymagane do zgłoszenia do Kuratorium).',
  '4.3': 'Sporządź oficjalną listę uczestników obozu.',
  '5.1': 'Wyślij zawiadomienie do lokalnej jednostki Policji o organizacji obozu. Nie wymaga odpowiedzi zwrotnej.',
  '5.2': 'Poinformuj najbliższy szpital / przychodnię o lokalizacji i terminie obozu.',
  '5.3': 'Uzyskaj zgodę właściciela terenu i gminy na wykopanie latryn i dołów chłonnych.',
  '5.4': 'Zamów mauzer (zbiornik na wodę) lub paletę wody pitnej. Ustal harmonogram dowozu.',
  '5.5': 'Podpisz umowę na wywóz śmieci z lokalną firmą lub gminą.',
  '6.1': 'Stwórz szczegółowy plan zajęć i jadłospis na cały obóz.',
  '6.2': 'Sporządź budżet obozu — koszty wyżywienia, transportu, materiałów.',
  '6.3': 'Wykup ubezpieczenie dla uczestników i kadry (NNW). Opcjonalnie zgłoś do ZUS.',
  '6.4': 'Wszystkie zadania wykonane! Obóz gotowy do startu.',
  '7.1': 'Ukończ kurs przygotowania pedagogicznego dla kierowników i wychowawców. Niezależne od innych zadań.',
}

// Grupy etapów (do sprawdzania kompletności)
export const STAGE_GROUPS = {
  '0': ['0.1'],
  '1': ['1.1','1.2','1.3','1.4','1.5'],
  '2': ['2.1','2.2','2.3','2.4','2.5'],
  '3': ['3.1'],
  '4': ['4.1','4.2','4.3'],
  '5': ['5.1','5.2','5.3','5.4','5.5'],
  '6': ['6.1','6.2','6.3','6.4'],
  '7': ['7.1'],
}

export const FINAL_NODE = '6.4'
export const START_NODE = '1.1'
export const STATUS_COLORS = { locked: '#9ca3af', available: '#3b82f6', done: '#22c55e' }

export const ALL_NODE_IDS = [
  '0.1', '1.1','1.2','1.3','1.4','1.5',
  '2.1','2.2','2.3','2.4','2.5',
  '3.1', '4.1','4.2','4.3',
  '5.1','5.2','5.3','5.4','5.5',
  '6.1','6.2','6.3','6.4',
  '7.1',
]
