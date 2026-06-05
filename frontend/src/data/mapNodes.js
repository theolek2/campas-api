/**
 * data/mapNodes.js — definicje węzłów, ścieżek, punktów dokowania.
 */
export const MAP_WIDTH = 784
export const MAP_HEIGHT = 1360

// ── Obszary klikalne (poligony — zachowane ze starych danych) ────────────

export const NODE_AREAS = {
  '0.1': null,
  '1.x': [
    [{x:282,y:25},{x:232,y:43},{x:221,y:37},{x:213,y:33},{x:206,y:33},{x:199,y:37},{x:195,y:43},{x:193,y:48},{x:191,y:52},{x:182,y:55},{x:171,y:59},{x:155,y:63},{x:141,y:67},{x:127,y:71},{x:126,y:70},{x:118,y:72},{x:116,y:84},{x:124,y:88},{x:124,y:120},{x:124,y:145},{x:124,y:150},{x:119,y:161},{x:113,y:178},{x:107,y:194},{x:101,y:208},{x:109,y:211},{x:115,y:198},{x:122,y:183},{x:124,y:189},{x:124,y:203},{x:124,y:216},{x:123,y:222},{x:131,y:223},{x:130,y:229},{x:136,y:233},{x:141,y:235},{x:147,y:236},{x:157,y:238},{x:167,y:235},{x:172,y:228},{x:171,y:219},{x:170,y:213},{x:167,y:205},{x:162,y:196},{x:154,y:193},{x:148,y:196},{x:142,y:199},{x:139,y:194},{x:146,y:188},{x:159,y:184},{x:167,y:181},{x:170,y:188},{x:182,y:185},{x:182,y:178},{x:206,y:169},{x:234,y:161},{x:263,y:152},{x:275,y:147},{x:276,y:160},{x:276,y:168},{x:281,y:172},{x:290,y:168},{x:289,y:42},{x:295,y:40},{x:294,y:30}],
    [{x:435,y:151},{x:424,y:146},{x:426,y:137},{x:426,y:129},{x:423,y:123},{x:423,y:118},{x:420,y:111},{x:415,y:108},{x:409,y:110},{x:407,y:113},{x:407,y:118},{x:407,y:123},{x:405,y:128},{x:403,y:134},{x:395,y:134},{x:385,y:130},{x:377,y:126},{x:375,y:119},{x:372,y:117},{x:368,y:117},{x:364,y:119},{x:360,y:117},{x:356,y:115},{x:348,y:119},{x:335,y:125},{x:322,y:130},{x:315,y:133},{x:315,y:137},{x:308,y:141},{x:306,y:147},{x:306,y:147},{x:311,y:150},{x:310,y:177},{x:316,y:179},{x:319,y:177},{x:320,y:155},{x:338,y:163},{x:329,y:165},{x:326,y:170},{x:325,y:174},{x:325,y:179},{x:327,y:183},{x:330,y:186},{x:335,y:188},{x:341,y:188},{x:347,y:185},{x:347,y:190},{x:352,y:193},{x:357,y:194},{x:365,y:194},{x:368,y:189},{x:361,y:188},{x:357,y:183},{x:363,y:180},{x:367,y:179},{x:374,y:177},{x:377,y:180},{x:377,y:195},{x:377,y:207},{x:382,y:210},{x:382,y:210},{x:387,y:207},{x:387,y:181},{x:405,y:172},{x:401,y:178},{x:397,y:182},{x:395,y:191},{x:391,y:198},{x:390,y:204},{x:391,y:210},{x:397,y:213},{x:402,y:215},{x:409,y:216},{x:415,y:217},{x:421,y:216},{x:428,y:212},{x:431,y:204},{x:431,y:197},{x:427,y:192},{x:430,y:186},{x:433,y:184},{x:433,y:160}],
  ],
  '2.1': [[{x:82,y:383},{x:95,y:386},{x:108,y:397},{x:113,y:415},{x:104,y:433},{x:92,y:441},{x:80,y:443},{x:70,y:441},{x:60,y:436},{x:54,y:428},{x:51,y:417},{x:52,y:402},{x:54,y:393},{x:68,y:387}]],
  '2.2': [[{x:101,y:472},{x:85,y:462},{x:71,y:462},{x:54,y:473},{x:48,y:490},{x:52,y:508},{x:64,y:519},{x:79,y:522},{x:90,y:520},{x:99,y:514},{x:105,y:505},{x:109,y:493},{x:107,y:484}]],
  '2.x': [[{x:127,y:563},{x:124,y:554},{x:119,y:546},{x:116,y:539},{x:110,y:539},{x:102,y:537},{x:92,y:536},{x:84,y:536},{x:74,y:539},{x:69,y:543},{x:64,y:544},{x:56,y:544},{x:55,y:554},{x:62,y:581},{x:64,y:588},{x:74,y:595},{x:89,y:598},{x:101,y:599},{x:113,y:595},{x:120,y:588},{x:127,y:580},{x:131,y:575}]],
  '2.5': [[{x:174,y:629},{x:168,y:615},{x:151,y:605},{x:132,y:605},{x:119,y:612},{x:112,y:621},{x:107,y:638},{x:112,y:649},{x:117,y:658},{x:126,y:663},{x:139,y:668},{x:153,y:665},{x:164,y:659},{x:171,y:653},{x:176,y:642}]],
  '3.1': [[{x:481,y:634},{x:469,y:630},{x:467,y:627},{x:427,y:609},{x:422,y:610},{x:411,y:607},{x:411,y:587},{x:399,y:580},{x:389,y:579},{x:385,y:584},{x:382,y:523},{x:367,y:520},{x:368,y:507},{x:377,y:508},{x:387,y:503},{x:387,y:535},{x:408,y:523},{x:411,y:517},{x:415,y:515},{x:421,y:516},{x:468,y:490},{x:472,y:493},{x:507,y:487},{x:538,y:521},{x:542,y:523},{x:543,y:601},{x:520,y:615},{x:525,y:616},{x:536,y:611},{x:541,y:611},{x:548,y:613},{x:548,y:615},{x:553,y:620},{x:556,y:630},{x:555,y:644},{x:551,y:650},{x:544,y:652},{x:538,y:657},{x:534,y:654},{x:517,y:665},{x:515,y:670},{x:508,y:671},{x:499,y:675},{x:487,y:671},{x:477,y:664},{x:476,y:657},{x:478,y:647},{x:475,y:640}]],
  '4.1': [[{x:365,y:857},{x:306,y:834},{x:306,y:830},{x:311,y:823},{x:302,y:825},{x:296,y:824},{x:287,y:823},{x:282,y:816},{x:281,y:809},{x:286,y:803},{x:289,y:755},{x:283,y:750},{x:327,y:719},{x:333,y:718},{x:338,y:715},{x:348,y:714},{x:350,y:722},{x:372,y:729},{x:386,y:719},{x:414,y:710},{x:441,y:740},{x:438,y:751},{x:475,y:768},{x:472,y:775},{x:473,y:824},{x:468,y:830},{x:475,y:829},{x:481,y:833},{x:485,y:838},{x:488,y:845},{x:485,y:851},{x:475,y:853},{x:475,y:854},{x:467,y:856},{x:459,y:861},{x:449,y:861},{x:444,y:851},{x:427,y:859},{x:417,y:858},{x:412,y:862},{x:404,y:864},{x:394,y:861},{x:382,y:855},{x:377,y:851}]],
  '4.2': [[{x:115,y:770},{x:99,y:775},{x:81,y:784},{x:69,y:800},{x:67,y:826},{x:76,y:847},{x:91,y:859},{x:114,y:869},{x:137,y:870},{x:153,y:862},{x:172,y:848},{x:177,y:833},{x:181,y:809},{x:173,y:791},{x:149,y:776}]],
  '4.3': [[{x:268,y:881},{x:250,y:869},{x:230,y:861},{x:205,y:864},{x:181,y:874},{x:170,y:886},{x:165,y:903},{x:165,y:920},{x:180,y:939},{x:201,y:948},{x:224,y:953},{x:248,y:946},{x:267,y:934},{x:277,y:916},{x:275,y:899}]],
  '5.1': [[{x:570,y:909},{x:572,y:919},{x:569,y:920},{x:569,y:945},{x:531,y:965},{x:498,y:950},{x:499,y:926},{x:496,y:924},{x:496,y:916},{x:537,y:894}]],
  '5.2': [[{x:702,y:894},{x:702,y:901},{x:699,y:902},{x:700,y:942},{x:662,y:965},{x:613,y:942},{x:614,y:901},{x:612,y:899},{x:613,y:892},{x:653,y:871}]],
  '5.3': [[{x:732,y:1013},{x:708,y:1024},{x:692,y:1037},{x:697,y:1038},{x:697,y:1081},{x:722,y:1092},{x:745,y:1080},{x:744,y:1043},{x:750,y:1038}],[{x:687,y:1086},{x:730,y:1106},{x:730,y:1117},{x:691,y:1138},{x:649,y:1118},{x:648,y:1108}]],
  '5.4': [[{x:698,y:998},{x:695,y:1000},{x:693,y:971},{x:689,y:966},{x:688,y:966},{x:698,y:962},{x:699,y:927},{x:699,y:927},{x:706,y:923},{x:715,y:919},{x:724,y:920},{x:733,y:921},{x:738,y:925},{x:742,y:930},{x:742,y:940},{x:743,y:960},{x:752,y:965},{x:752,y:969},{x:748,y:969},{x:749,y:998},{x:745,y:999},{x:743,y:993},{x:736,y:990},{x:725,y:1002},{x:725,y:1010},{x:721,y:1010},{x:716,y:1004},{x:707,y:991}]],
  '5.5': [[{x:591,y:1024},{x:591,y:1030},{x:603,y:1036},{x:608,y:1039},{x:608,y:1046},{x:610,y:1057},{x:610,y:1067},{x:599,y:1074},{x:588,y:1080},{x:581,y:1078},{x:574,y:1079},{x:570,y:1074},{x:566,y:1070},{x:554,y:1064},{x:548,y:1066},{x:542,y:1064},{x:533,y:1062},{x:530,y:1056},{x:528,y:1049},{x:522,y:1050},{x:520,y:1043},{x:522,y:1034},{x:524,y:1024},{x:531,y:1018},{x:543,y:1012},{x:549,y:1008},{x:562,y:1010}]],
  '6.x': [[{x:340,y:1268},{x:294,y:1291},{x:272,y:1301},{x:223,y:1315},{x:151,y:1314},{x:108,y:1298},{x:69,y:1276},{x:51,y:1250},{x:40,y:1211},{x:53,y:1176},{x:76,y:1158},{x:97,y:1128},{x:125,y:1120},{x:135,y:1118},{x:137,y:1086},{x:135,y:1073},{x:138,y:1071},{x:137,y:1062},{x:133,y:1059},{x:162,y:1035},{x:189,y:1055},{x:183,y:1059},{x:184,y:1072},{x:186,y:1072},{x:188,y:1083},{x:183,y:1086},{x:186,y:1096},{x:204,y:1106},{x:227,y:1110},{x:241,y:1107},{x:248,y:1103},{x:261,y:1093},{x:273,y:1096},{x:277,y:1100},{x:315,y:1078},{x:351,y:1067},{x:378,y:1102},{x:375,y:1135},{x:381,y:1138},{x:380,y:1138},{x:409,y:1125},{x:420,y:1150},{x:429,y:1158},{x:433,y:1160},{x:434,y:1178},{x:431,y:1198},{x:426,y:1219},{x:402,y:1247},{x:375,y:1260}]],
  // Nowy obszar 7.1 z danych
  '7.1': [[{x:423,y:287},{x:403,y:323},{x:388,y:332},{x:379,y:346},{x:399,y:358},{x:413,y:374},{x:410,y:381},{x:415,y:389},{x:427,y:400},{x:442,y:407},{x:459,y:410},{x:472,y:404},{x:486,y:400},{x:503,y:398},{x:519,y:401},{x:522,y:408},{x:545,y:410},{x:565,y:412},{x:582,y:417},{x:597,y:411},{x:621,y:408},{x:636,y:415},{x:650,y:424},{x:673,y:421},{x:687,y:417},{x:696,y:403},{x:707,y:392},{x:724,y:388},{x:731,y:375},{x:722,y:357},{x:714,y:346},{x:722,y:337},{x:723,y:337},{x:710,y:319},{x:696,y:300},{x:689,y:289},{x:674,y:297},{x:655,y:300},{x:644,y:289},{x:628,y:269},{x:627,y:259},{x:611,y:261},{x:583,y:273},{x:576,y:284},{x:575,y:285},{x:567,y:292},{x:555,y:299},{x:549,y:314},{x:542,y:319},{x:539,y:307},{x:529,y:304},{x:525,y:297},{x:525,y:286},{x:510,y:287},{x:497,y:291},{x:499,y:301},{x:494,y:311},{x:493,y:324},{x:491,y:330},{x:489,y:331},{x:479,y:324},{x:468,y:314},{x:462,y:299}]],
}

export const NODE_TO_AREA = {
  '1.1': '1.x', '1.2': '1.x', '1.3': '1.x', '1.4': '1.x', '1.5': '1.x',
  '2.3': '2.x', '2.4': '2.x',
  '6.1': '6.x', '6.2': '6.x', '6.3': '6.x', '6.4': '6.x',
}

// ── Punkty dokowania (NOWE z pickera) ────────────────────────────────────

export const DOCK_POSITIONS = {
  '0.1': { x: 518, y: 259 },
  '1.x': { x: 248, y: 207 },
  '7.1': { x: 617, y: 420 },
  '3.1': { x: 432, y: 625 },
  '2.1': { x: 84, y: 413 },
  '2.2': { x: 80, y: 499 },
  '2.x': { x: 96, y: 575 },
  '2.5': { x: 144, y: 635 },
  '4.1': { x: 325, y: 853 },
  '4.3': { x: 221, y: 915 },
  '4.2': { x: 119, y: 833 },
  '6.x': { x: 409, y: 1265 },
  '5.5': { x: 545, y: 1075 },
  '5.3': { x: 676, y: 1075 },
  '5.4': { x: 673, y: 1001 },
  '5.2': { x: 623, y: 955 },
  '5.1': { x: 568, y: 962 },
}

export function getCharPosition(nodeId) {
  const areaId = NODE_TO_AREA[nodeId] || nodeId
  return DOCK_POSITIONS[areaId] || { x: 380, y: 160 }
}

// ── Ścieżki (NOWE) ──────────────────────────────────────────────────────

export const REAL_PATHS = [
  { id: 'main', points: [{x:518,y:259},{x:435,y:279},{x:374,y:299},{x:303,y:327},{x:278,y:343},{x:247,y:355},{x:232,y:376},{x:221,y:398},{x:223,y:419},{x:226,y:464},{x:250,y:495},{x:274,y:517},{x:302,y:541},{x:336,y:569},{x:356,y:595},{x:374,y:611},{x:411,y:629},{x:441,y:642},{x:466,y:664},{x:489,y:677},{x:521,y:683},{x:543,y:690},{x:584,y:707},{x:617,y:737},{x:630,y:763},{x:631,y:786},{x:620,y:807},{x:601,y:823},{x:565,y:847},{x:530,y:865},{x:492,y:880},{x:450,y:895},{x:411,y:907},{x:379,y:914},{x:358,y:937},{x:332,y:959},{x:320,y:983},{x:328,y:1013},{x:346,y:1039},{x:374,y:1051},{x:415,y:1070},{x:453,y:1080},{x:481,y:1091},{x:511,y:1098},{x:534,y:1113},{x:574,y:1119},{x:571,y:1142},{x:578,y:1198},{x:564,y:1231},{x:546,y:1245},{x:527,y:1258},{x:502,y:1265},{x:465,y:1270},{x:424,y:1272},{x:410,y:1266}] },
  { id: 'etap1-to-main', points: [{x:247,y:205},{x:292,y:216},{x:317,y:244},{x:340,y:279},{x:378,y:298}] },
  { id: 'pedag-to-main', points: [{x:616,y:415},{x:585,y:433},{x:538,y:423},{x:496,y:427},{x:463,y:419},{x:413,y:415},{x:361,y:434},{x:297,y:413},{x:221,y:418}] },
  { id: 'psp-to-main', points: [{x:429,y:623},{x:409,y:631}] },
  { id: 'psp-branch', points: [{x:359,y:598},{x:334,y:619},{x:306,y:623},{x:281,y:618},{x:256,y:608},{x:245,y:605},{x:223,y:604},{x:203,y:601},{x:179,y:594},{x:154,y:583},{x:153,y:575},{x:148,y:553},{x:140,y:534},{x:140,y:516}] },
  { id: 'psp-branch-srodki', points: [{x:242,y:605},{x:235,y:617},{x:219,y:628},{x:202,y:635},{x:178,y:640},{x:144,y:636}] },
  { id: 'psp-branch-mapy', points: [{x:153,y:573},{x:137,y:571},{x:110,y:567},{x:98,y:574}] },
  { id: 'psp-branch-instr', points: [{x:137,y:518},{x:116,y:513},{x:91,y:503},{x:82,y:497}] },
  { id: 'psp-branch-reg', points: [{x:137,y:514},{x:139,y:502},{x:137,y:483},{x:127,y:461},{x:108,y:447},{x:81,y:431},{x:83,y:413}] },
  { id: 'main-to-kur-junc', points: [{x:380,y:911},{x:361,y:888},{x:328,y:871},{x:311,y:861}] },
  { id: 'kur-junc-to-kur', points: [{x:328,y:851},{x:314,y:859}] },
  { id: 'kur-junc-to-list', points: [{x:311,y:859},{x:302,y:873},{x:285,y:883},{x:258,y:896},{x:218,y:912}] },
  { id: 'kur-junc-to-zasw', points: [{x:122,y:833},{x:156,y:824},{x:189,y:824},{x:205,y:828},{x:232,y:835},{x:259,y:842},{x:288,y:854},{x:311,y:858}] },
  { id: 'stage5-branch', points: [{x:572,y:1118},{x:618,y:1097},{x:641,y:1069},{x:628,y:1028},{x:600,y:1010},{x:590,y:991},{x:593,y:974}] },
  { id: 'stage5-smieci', points: [{x:616,y:1092},{x:579,y:1083},{x:543,y:1072}] },
  { id: 'stage5-latryna', points: [{x:641,y:1067},{x:673,y:1072}] },
  { id: 'stage5-mauzer', points: [{x:630,y:1025},{x:650,y:1012},{x:675,y:1003}] },
  { id: 'stage5-szpital', points: [{x:596,y:971},{x:621,y:957}] },
  { id: 'stage5-policja', points: [{x:591,y:976},{x:567,y:963}] },
]

// ── Węzły ścieżek (junctions) — miejsca łączenia się ścieżek ────────────

const JUNCTIONS = [
  { id: 'j_main_start',    x: 518, y: 261 },
  { id: 'j_etap1_main',    x: 377, y: 302 },
  { id: 'j_pedag_main',    x: 223, y: 419 },
  { id: 'j_psp_main',      x: 412, y: 631 },
  { id: 'j_zal_psp_main',  x: 358, y: 599 },
  { id: 'j_kuratorium_main', x: 383, y: 915 },
  { id: 'j_stage5_main',   x: 574, y: 1119 },
  { id: 'j_main_end',      x: 414, y: 1268 },
  { id: 'j_zal_psp_instr', x: 138, y: 519 },
  { id: 'j_zal_psp_mapy',  x: 155, y: 575 },
  { id: 'j_zal_psp_srodki', x: 245, y: 607 },
  { id: 'j_kuratorium_cross', x: 313, y: 861 },
  { id: 'j_stage5_smieci', x: 619, y: 1097 },
  { id: 'j_stage5_latryna', x: 643, y: 1070 },
  { id: 'j_stage5_mauzer', x: 629, y: 1027 },
  { id: 'j_stage5_szp_pol', x: 595, y: 973 },
]

// Połączenia obszarów z węzłami (ręcznie zmapowane na podstawie ścieżek)
const AREA_JUNCTION_MAP = {
  '0.1': 'j_main_start',   '1.x': 'j_etap1_main',
  '7.1': 'j_pedag_main',   '3.1': 'j_psp_main',
  '2.1': 'j_zal_psp_instr','2.2': 'j_zal_psp_instr',
  '2.x': 'j_zal_psp_mapy', '2.5': 'j_zal_psp_srodki',
  '4.1': 'j_kuratorium_main', '4.2': 'j_kuratorium_cross', '4.3': 'j_kuratorium_cross',
  '5.1': 'j_stage5_szp_pol','5.2': 'j_stage5_szp_pol',
  '5.3': 'j_stage5_latryna','5.4': 'j_stage5_mauzer',
  '5.5': 'j_stage5_smieci', '6.x': 'j_main_end',
}

const TOLERANCE = 8

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) }

// ── Budowa zunifikowanego grafu ──────────────────────────────────────────

let _routeCache = null

function buildRouteGraph() {
  if (_routeCache) return _routeCache

  // Wszystkie węzły grafu: dock_id + junction_id
  const allNodes = new Map() // id → { id, x, y, type: 'dock'|'junction' }
  for (const [areaId, pos] of Object.entries(DOCK_POSITIONS)) {
    allNodes.set(areaId, { id: areaId, x: pos.x, y: pos.y, type: 'dock' })
  }
  for (const j of JUNCTIONS) {
    allNodes.set(j.id, { id: j.id, x: j.x, y: j.y, type: 'junction' })
  }

  // Dla każdego węzła, znajdź sąsiednie węzły i zbierz waypointy ścieżek między nimi
  const adjacency = new Map() // nodeId → [{ to, via: [{x,y}...] }]

  for (const [nid] of allNodes) {
    adjacency.set(nid, [])
  }

  // Dla każdej ścieżki: znajdź węzły przy jej początku i końcu
  for (const path of REAL_PATHS) {
    const { points } = path
    if (points.length < 2) continue
    const start = points[0], end = points[points.length - 1]

    let startNode = null, endNode = null
    let startDist = Infinity, endDist = Infinity

    for (const [nid, node] of allNodes) {
      const ds = dist(start, node), de = dist(end, node)
      if (ds < startDist) { startDist = ds; startNode = nid }
      if (de < endDist) { endDist = de; endNode = nid }
    }

    if (startNode && startDist < TOLERANCE * 2 && endNode && endDist < TOLERANCE * 2 && startNode !== endNode) {
      adjacency.get(startNode).push({ to: endNode, via: [...points] })
      adjacency.get(endNode).push({ to: startNode, via: [...points].reverse() })
    }

    // Dodatkowo: znajdź węzły, które leżą W ŚRODKU ścieżki (blisko dowolnego punktu)
    for (const [nid, node] of allNodes) {
      if (nid === startNode || nid === endNode) continue
      let closestPt = null, closestDist = Infinity
      let closestIdx = -1
      for (let i = 0; i < points.length; i++) {
        const d = dist(points[i], node)
        if (d < closestDist) { closestDist = d; closestPt = points[i]; closestIdx = i }
      }
      if (closestDist < TOLERANCE * 2 && closestIdx > 1 && closestIdx < points.length - 2) {
        // Podziel ścieżkę na 2 części w tym węźle
        const firstHalf = points.slice(0, closestIdx + 1)
        const secondHalf = points.slice(closestIdx)
        adjacency.get(startNode).push({ to: nid, via: firstHalf })
        adjacency.get(nid).push({ to: startNode, via: [...firstHalf].reverse() })
        adjacency.get(nid).push({ to: endNode, via: secondHalf })
        adjacency.get(endNode).push({ to: nid, via: [...secondHalf].reverse() })
        // Usuń oryginalną krawędź
        const edgesFromStart = adjacency.get(startNode)
        const origIdx = edgesFromStart.findIndex(e => e.to === endNode && e.via.length > 2)
        if (origIdx >= 0) edgesFromStart.splice(origIdx, 1)
        const edgesFromEnd = adjacency.get(endNode)
        const origIdx2 = edgesFromEnd.findIndex(e => e.to === startNode && e.via.length > 2)
        if (origIdx2 >= 0) edgesFromEnd.splice(origIdx2, 1)
      }
    }
  }

  // Połącz dock z jego junction (jeśli zmapowane)
  for (const [areaId, jId] of Object.entries(AREA_JUNCTION_MAP)) {
    const dockNode = allNodes.get(areaId)
    const juncNode = allNodes.get(jId)
    if (dockNode && juncNode) {
      adjacency.get(areaId).push({ to: jId, via: [{ x: dockNode.x, y: dockNode.y }, { x: juncNode.x, y: juncNode.y }] })
      adjacency.get(jId).push({ to: areaId, via: [{ x: juncNode.x, y: juncNode.y }, { x: dockNode.x, y: dockNode.y }] })
    }
  }

  _routeCache = { adjacency, allNodes }
  return _routeCache
}

// BFS na zunifikowanym grafie — zwraca tablicę waypointów (nieprzerwaną ścieżkę)
export function findPathWaypoints(fromArea, toArea) {
  if (fromArea === toArea || !fromArea || !toArea) return []
  const { adjacency } = buildRouteGraph()

  if (!adjacency.has(fromArea) || !adjacency.has(toArea)) return []

  const visited = new Set()
  const queue = [[{ node: fromArea, waypoints: [] }]]
  visited.add(fromArea)

  while (queue.length) {
    const path = queue.shift()
    const last = path[path.length - 1]
    const edges = adjacency.get(last.node) || []

    for (const { to, via } of edges) {
      if (to === toArea) {
        // Zbierz wszystkie waypointy z całej ścieżki
        const allWps = []
        for (const step of path) {
          if (step.waypoints.length > 0) allWps.push(...step.waypoints)
        }
        allWps.push(...via)
        return allWps
      }
      if (!visited.has(to)) {
        visited.add(to)
        queue.push([...path, { node: to, waypoints: via }])
      }
    }
  }
  return []
}

// Invalidate cache (np. przy zmianie danych)
export function clearRouteCache() { _routeCache = null }

// ── Helpers ──────────────────────────────────────────────────────────────

export function getAllPolygons(areaId) { return NODE_AREAS[areaId] || [] }

export function hitTest(areaId, px, py) {
  const polyList = NODE_AREAS[areaId]
  if (!polyList) return false
  for (const poly of polyList) {
    let inside = false
    for (let i=0,j=poly.length-1; i<poly.length; j=i++) {
      const xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y
      if ((yi>py)!==(yj>py) && px<(xj-xi)*(py-yi)/(yj-yi)+xi) inside=!inside
    }
    if (inside) return true
  }
  return false
}

export const ALL_AREA_IDS = Object.keys(NODE_AREAS).filter(k => NODE_AREAS[k] !== null)

// ── Etykiety, ikony, opisy, zależności ──────────────────────────────────

export const NODE_LABELS = {
  '0.1': 'Miejsce obozu', '1.1': 'Jednostka', '1.2': 'Kierownik', '1.3': 'Termin', '1.4': 'Uczestnicy', '1.5': 'Kadra',
  '2.1': 'Regulamin obozu', '2.2': 'Instrukcja ppoż (zał.1-2)', '2.3': 'Mapa zagospodarowania (zał.3)', '2.4': 'Drogi ewakuacyjne (zał.4)', '2.5': 'Łączność + uczestnicy (zał.6)',
  '3.1': 'PSP', '4.1': 'Kuratorium', '4.2': 'Zaświadczenia o niekaralności', '4.3': 'Liczba uczestników',
  '5.1': 'Policja', '5.2': 'Szpital', '5.3': 'Latryny', '5.4': 'Woda (mauzer)', '5.5': 'Wywóz śmieci',
  '6.1': 'Plan + jadłospis', '6.2': 'Budżet', '6.3': 'Ubezpieczenie / ZUS', '6.4': 'OBÓZ GOTOWY',
  '7.1': 'Przygotowanie pedagogiczne',
}

export const NODE_ICONS = {
  '0.1': '🌍', '1.1': '🏕️', '1.2': '👤', '1.3': '📅', '1.4': '👥', '1.5': '📋',
  '2.1': '📜', '2.2': '🔥', '2.3': '🗺️', '2.4': '🚪', '2.5': '📡',
  '3.1': '🚒', '4.1': '🏛️', '4.2': '📋', '4.3': '📝',
  '5.1': '👮', '5.2': '🏥', '5.3': '🚽', '5.4': '💧', '5.5': '🗑️',
  '6.1': '📖', '6.2': '💰', '6.3': '🛡️', '6.4': '🏁', '7.1': '📚',
}

export const NODE_DETAIL_IMAGE_KEY = {
  '1.x': 'detale-info', '2.1': 'detale-info', '2.2': 'detale-info', '2.x': 'detale-info', '2.5': 'detale-info',
  '3.1': 'detale-psp', '4.1': 'detale-kuratorium', '4.2': 'detale-kuratorium', '4.3': 'detale-kuratorium',
  '5.x': 'detale-ogolny', '6.x': 'detale-ogolny', '7.1': 'detale-info',
}

export const DEPENDENCIES = {
  '3.1': ['1.1', '2.1', '2.2', '2.3', '2.4', '2.5'],
  '4.1': ['3.1'],
}

export const ALWAYS_AVAILABLE = new Set([
  '1.2','1.3','1.4','1.5','2.1','2.2','2.3','2.4','2.5',
  '4.2','4.3','5.1','5.2','5.3','5.4','5.5','6.1','6.2','6.3','6.4','7.1',
])

export const AUTO_CHECK = {
  '0.1': (m) => !!(m.coords?.lat && m.coords?.lng), '1.1': (m) => !!m.jednostka, '1.2': (m) => !!m.kierownik,
  '1.3': (m) => !!(m.date_start && m.date_end), '1.4': (m) => !!(m.uczestnicy),
  '1.5': (m) => Array.isArray(m.wychowawcy) && m.wychowawcy.length > 0,
}

export const NODE_DESCRIPTIONS = {
  '0.1': 'Wybierz miejsce obozu na mapie w zakładce "Teren".',
  '1.1': 'Podaj pełną nazwę jednostki harcerskiej.',
  '1.2': 'Podaj imię i nazwisko kierownika obozu.',
  '1.3': 'Ustal dokładne daty obozu.',
  '1.4': 'Podaj liczbę uczestników.',
  '1.5': 'Wpisz dane kadry: imię, nazwisko, funkcja, data niekaralności.',
  '2.1': 'Sporządź regulamin obozu (zał. 5 do PSP).',
  '2.2': 'Przygotuj instrukcję ppoż (zał. 1 i 2 do PSP).',
  '2.3': 'Stwórz mapę zagospodarowania terenu (zał. 3 do PSP).',
  '2.4': 'Przygotuj drogi ewakuacyjne + mapę dojazdu (zał. 4 do PSP).',
  '2.5': 'Określ środki łączności i liczbę uczestników (zał. 6 do PSP).',
  '3.1': 'Złóż wniosek o opinię ppoż do PSP. Dołącz załączniki 1-6. PSP ma do 30 dni.',
  '4.1': 'Zgłoś obóz do Kuratorium — najpóźniej 21 dni przed. Wymaga opinii PSP + danych kadry.',
  '4.2': 'Zbierz zaświadczenia o niekaralności od kadry.',
  '4.3': 'Sporządź oficjalną listę uczestników.',
  '5.1': 'Wyślij zawiadomienie do Policji.',
  '5.2': 'Poinformuj szpital / przychodnię.',
  '5.3': 'Uzyskaj zgodę na latryny i doły chłonne.',
  '5.4': 'Zamów mauzer / paletę wody.',
  '5.5': 'Podpisz umowę na wywóz śmieci.',
  '6.1': 'Stwórz plan zajęć i jadłospis.',
  '6.2': 'Sporządź budżet obozu.',
  '6.3': 'Wykup ubezpieczenie (NNW), opcjonalnie ZUS.',
  '6.4': 'Wszystko gotowe! Obóz start.',
  '7.1': 'Ukończ kurs przygotowania pedagogicznego.',
}

export const STAGE_GROUPS = {
  '0': ['0.1'], '1': ['1.1','1.2','1.3','1.4','1.5'], '2': ['2.1','2.2','2.3','2.4','2.5'],
  '3': ['3.1'], '4': ['4.1','4.2','4.3'], '5': ['5.1','5.2','5.3','5.4','5.5'],
  '6': ['6.1','6.2','6.3','6.4'], '7': ['7.1'],
}

export const FINAL_NODE = '6.4'
export const START_NODE = '1.1'
export const STATUS_COLORS = { locked: '#9ca3af', available: '#3b82f6', done: '#22c55e' }

export const ALL_NODE_IDS = [
  '0.1','1.1','1.2','1.3','1.4','1.5','2.1','2.2','2.3','2.4','2.5',
  '3.1','4.1','4.2','4.3','5.1','5.2','5.3','5.4','5.5',
  '6.1','6.2','6.3','6.4','7.1',
]
