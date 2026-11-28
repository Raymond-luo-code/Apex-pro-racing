// ============================================================================
// APEX PRO RACING // MODULE 6: ASPHALT-STYLE GAME LIFECYCLE CONTROLLER
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('flow.js', 'START');

const CAR_CATALOG = [
  {
    id: 'procedural',
    carClass: 'GT3',
    brand: 'BMW',
    subGroup: 'eu',
    classLabel: 'GT3 · CLASS S',
    name: 'BMW M4 GT3 EVO // APEX WORKS',
    shortTag: '高精度 3D 模型 · 3.0L 雙渦輪直六',
    origin: '🇩🇪 慕尼黑廠隊研發 · 3.0L P58 雙渦輪直列六缸 · 前中置後驅 (FMR)',
    desc: '巴伐利亞廠隊頂級 GT3 賽道武器！搭載 3.0L 雙渦輪增壓直列六缸引擎與六速序列式變速箱，寬體碳纖維空力套件與大尺寸天鵝頸尾翼帶來均衡的高速下壓力 (~650 kgf@250) 與精準入彎指向。',
    specs: { topSpeed: '305 km/h', accel: '3.5 s', power: '590 HP', weight: '1,245 kg' },
    bars: { speed: 72, accel: 78, handling: 74, braking: 70 },
    defaultPaint: '#ef4444',
    unlocked: true
  },
  {
    id: 'ferrari458',
    carClass: 'GT3',
    brand: 'Ferrari',
    subGroup: 'eu',
    classLabel: 'GT3 · CLASS S',
    name: 'FERRARI 458 ITALIA GT3',
    shortTag: '高精度 3D 模型 · 4.5L V8 超跑',
    origin: '🇮🇹 義大利馬拉內羅 · 4.5L V8 自然進氣 · 中置後驅 (MR)',
    desc: '源自義大利傳奇躍馬血統的 GT3 統規賽車。中置 8,800 rpm 高轉速 V8 引擎兼顧迷人聲浪與出彎爆發力，搭配專屬碳纖維 GT3 天鵝頸大尾翼、前定風翼與後擴散器。',
    specs: { topSpeed: '308 km/h', accel: '3.4 s', power: '570 HP', weight: '1,215 kg' },
    bars: { speed: 73, accel: 80, handling: 73, braking: 70 },
    defaultPaint: '#dc2626',
    unlocked: true
  },
  {
    id: 'porsche911',
    carClass: 'GT3',
    brand: 'Porsche',
    subGroup: 'eu',
    classLabel: 'GT3 · CLASS S',
    name: 'PORSCHE 911 GT3 R (992)',
    shortTag: '高精度 3D 模型 · 斯圖加特 RR 六缸',
    origin: '🇩🇪 斯圖加特 · 4.2L 水平對臥六缸 · 後置後驅 (RR)',
    desc: '經典 RR 後置引擎賽道機器（2024 992 GT3 R 廠隊式樣）！短軸距搭配後軸配重帶來無可比擬的入彎指向性與出彎縱向抓地力，重煞循跡入彎（Trail Braking）極限極高。',
    specs: { topSpeed: '306 km/h', accel: '3.3 s', power: '565 HP', weight: '1,250 kg' },
    bars: { speed: 72, accel: 81, handling: 76, braking: 72 },
    defaultPaint: '#10b981',
    unlocked: true
  },
  {
    id: 'amggt3',
    carClass: 'GT3',
    brand: 'Mercedes-AMG',
    subGroup: 'eu',
    classLabel: 'GT3 · CLASS S',
    name: 'MERCEDES-AMG GT3 EVO',
    shortTag: '高精度 3D 模型 · 前中置 6.2L V8',
    origin: '🇩🇪 阿法爾特巴赫 · 6.2L V8 自然進氣 · 前中置後驅 (FMR)',
    desc: '大排量 6.2L 自然進氣 V8 重裝猛獸！超長車頭與寬體底盤賦予極為穩定的高速巡航表現與 GT3 組別最高直線尾速，最適合蒙札與富士長直線超車。',
    specs: { topSpeed: '312 km/h', accel: '3.4 s', power: '600 HP', weight: '1,285 kg' },
    bars: { speed: 75, accel: 80, handling: 72, braking: 71 },
    defaultPaint: '#eab308',
    unlocked: true
  },
  {
    id: 'ferrari_296_gt3',
    carClass: 'GT3',
    brand: 'Ferrari',
    subGroup: 'eu',
    classLabel: 'GT3 · CLASS S',
    name: 'FERRARI 296 GT3',
    shortTag: '本地高模 GLB · 3.0L V6 雙渦輪新世代',
    origin: '🇮🇹 義大利馬拉內羅 · 3.0L V6 雙渦輪 · 中置後驅 (MR)',
    desc: '躍馬新世代 GT3 統規旗艦！取消公路版油電單元後由 ORECA 全新打造輕量化底盤與高下壓力空力套件，中低轉充沛扭力與銳利彎中姿態兼具。',
    specs: { topSpeed: '308 km/h', accel: '3.4 s', power: '600 HP', weight: '1,250 kg' },
    bars: { speed: 73, accel: 80, handling: 75, braking: 71 },
    defaultPaint: '#dc2626',
    unlocked: true
  },
  {
    id: 'ferrari_488_gt3',
    carClass: 'GT3',
    brand: 'Ferrari',
    subGroup: 'eu',
    classLabel: 'GT3 · CLASS S',
    name: 'FERRARI 488 GT3 EVO',
    shortTag: '本地高模 GLB · 3.9L V8 雙渦輪耐力王',
    origin: '🇮🇹 義大利馬拉內羅 · 3.9L V8 雙渦輪 · 中置後驅 (MR)',
    desc: '締造利曼與斯帕 24 小時大賽百餘勝戰績的耐力賽神話！EVO 套件針對前保險桿與側裙導流優化，在高速變向與輪胎管理間取得絕佳平衡。',
    specs: { topSpeed: '307 km/h', accel: '3.4 s', power: '600 HP', weight: '1,260 kg' },
    bars: { speed: 73, accel: 79, handling: 74, braking: 71 },
    defaultPaint: '#ef4444',
    unlocked: true
  },
  {
    id: 'lamborghini_huracan_gt3',
    carClass: 'GT3',
    brand: 'Lamborghini',
    subGroup: 'eu',
    classLabel: 'GT3 · CLASS S',
    name: 'LAMBORGHINI HURACAN GT3 EVO2',
    shortTag: '本地高模 GLB · 5.2L V10 NA 蠻牛戦車',
    origin: '🇮🇹 聖亞加塔 · 5.2L V10 自然進氣 · 中置後驅 (MR)',
    desc: '承襲 Super Trofeo EVO2 空力設計與車頂六角形進氣導管，高轉速 5.2L V10 引擎輸出線性可控，搭配大型後擴散器在技術彎角展現驚人循跡穩定度。',
    specs: { topSpeed: '309 km/h', accel: '3.3 s', power: '585 HP', weight: '1,230 kg' },
    bars: { speed: 74, accel: 80, handling: 75, braking: 71 },
    defaultPaint: '#22c55e',
    unlocked: true
  },
  {
    id: 'mclaren_650s_gt3',
    carClass: 'GT3',
    brand: 'McLaren',
    subGroup: 'eu',
    classLabel: 'GT3 · CLASS S',
    name: 'MCLAREN 650S GT3',
    shortTag: '本地高模 GLB · 3.8L V8 碳纖單體座艙',
    origin: '🇬🇧 英國沃金 · 3.8L V8 雙渦輪 · 中置後驅 (MR)',
    desc: '以 MonoCell 碳纖維單體浴盆車架為核心的英倫 GT3 戰駒，極致輕量化車頭帶來敏捷入彎反應，於銀石與鈴鹿等高速連彎賽道如魚得水。',
    specs: { topSpeed: '306 km/h', accel: '3.4 s', power: '540 HP', weight: '1,240 kg' },
    bars: { speed: 72, accel: 79, handling: 76, braking: 72 },
    defaultPaint: '#f97316',
    unlocked: true
  },
  // --- TRACK / CLASS R+ ---
  {
    id: 'aston_vulcan',
    carClass: 'TRACK',
    brand: 'Aston Martin',
    subGroup: 'modern',
    classLabel: 'TRACK · CLASS R+',
    name: 'ASTON MARTIN VULCAN AMR PRO',
    shortTag: '本地高模 GLB · 7.0L V12 賽道限定',
    origin: '🇬🇧 英國蓋登 · 7.0L V12 NA · 前中置後驅 (FMR)',
    desc: '僅限賽道奔馳的英倫 820 匹 V12 狂獸！AMR Pro 雙層巨型尾翼於高速產生突破 1,100 kgf 的真實空力壓地力，中後段推力與高速彎道大幅輾壓 GT3。',
    specs: { topSpeed: '320 km/h', accel: '3.1 s', power: '820 HP', weight: '1,350 kg' },
    bars: { speed: 78, accel: 84, handling: 82, braking: 80 },
    defaultPaint: '#10b981',
    unlocked: true
  },
  {
    id: 'mclaren_senna',
    carClass: 'TRACK',
    brand: 'McLaren',
    subGroup: 'modern',
    classLabel: 'TRACK · CLASS R+',
    name: 'MCLAREN SENNA GTR-SPEC',
    shortTag: '本地高模 GLB · 4.0L V8 極致空力',
    origin: '🇬🇧 沃金 MTC · 4.0L V8 雙渦輪 · 中置後驅 (MR)',
    desc: '以傳奇車神命名的終極賽道兵器！Monocage III 碳纖維車體僅重 1,198kg，主動式前後空力在高速彎道產生超過 1,000 kgf 下壓力與 2.7G 級過彎實力。',
    specs: { topSpeed: '330 km/h', accel: '2.9 s', power: '814 HP', weight: '1,198 kg' },
    bars: { speed: 83, accel: 87, handling: 84, braking: 82 },
    defaultPaint: '#f97316',
    unlocked: true
  },
  {
    id: 'zenvo_tsrs',
    carClass: 'TRACK',
    brand: 'Zenvo',
    subGroup: 'modern',
    classLabel: 'TRACK · CLASS R+',
    name: 'ZENVO TSR-S ACTIVE WING',
    shortTag: '本地高模 GLB · 5.8L 主動傾角尾翼',
    origin: '🇩🇰 丹麥普雷斯特 · 5.8L V8 雙機械增壓 · 中置後驅 (MR)',
    desc: '搭載舉世聞名 Centripetal Wing 雙軸向傾角尾翼的北歐超跑！1,177 HP 狂暴中段再加速橫掃直線，過彎尾翼主動向內傾側抑制內輪浮舉。',
    specs: { topSpeed: '336 km/h', accel: '2.9 s', power: '1,177 HP', weight: '1,495 kg' },
    bars: { speed: 85, accel: 88, handling: 77, braking: 76 },
    defaultPaint: '#0284c7',
    unlocked: true
  },
  {
    id: 'pagani_huayra_r',
    carClass: 'TRACK',
    brand: 'Pagani',
    subGroup: 'modern',
    classLabel: 'TRACK · CLASS R+',
    name: 'PAGANI HUAYRA R EVO ROADSTER',
    shortTag: '本地高模 GLB · HWA 6.0L V12 長尾',
    origin: '🇮🇹 摩德納 · 6.0L V12-R EVO · 中置後驅 (MR)',
    desc: '將藝術與 Le Mans 原型車空力融為一體的義大利結晶！僅 1,060kg 乾燥車重與 9,200 rpm 尖銳 V12 輸出讓 0-200 與高速長彎全面凌駕傳統 GT 賽車。',
    specs: { topSpeed: '348 km/h', accel: '2.8 s', power: '900 HP', weight: '1,060 kg' },
    bars: { speed: 91, accel: 91, handling: 86, braking: 84 },
    defaultPaint: '#cbd5e1',
    unlocked: true
  },
  {
    id: 'mclaren_p1_gtr',
    carClass: 'TRACK',
    brand: 'McLaren',
    subGroup: 'modern',
    classLabel: 'TRACK · CLASS R+',
    name: 'MCLAREN P1 GTR TRACK',
    shortTag: '本地高模 GLB · 986 HP 油電賽道限定',
    origin: '🇬🇧 英國沃金 · 3.8L V8 + 電機 IPAS · 中置後驅 (MR)',
    desc: '徹底解除街道法規束縛的賽道限定 P1！加寬前輪距、固定式巨型雙柱碳纖尾翼與光頭熱熔胎，提供狂暴的 986 HP 油電出彎衝刺與 2.5G 彎速。',
    specs: { topSpeed: '342 km/h', accel: '2.8 s', power: '986 HP', weight: '1,350 kg' },
    bars: { speed: 88, accel: 89, handling: 82, braking: 80 },
    defaultPaint: '#eab308',
    unlocked: true
  },
  {
    id: 'ferrari_fxxk_evo',
    carClass: 'TRACK',
    brand: 'Ferrari',
    subGroup: 'modern',
    classLabel: 'TRACK · CLASS R+',
    name: 'FERRARI FXX-K EVO',
    shortTag: '本地高模 GLB · 1,036 HP XX 賽道研發',
    origin: '🇮🇹 馬拉內羅 XX 實驗計畫 · 6.3L V12 HY-KERS · 中置後驅',
    desc: 'Ferrari 頂級 XX 實驗計畫終極演化！中央鯊魚鰭配雙層固定尾翼較標準版大增下壓力 (~1,150 kgf@250)，1,036 HP V12 油電於蒙札與斯帕同時碾壓極速與彎速。',
    specs: { topSpeed: '345 km/h', accel: '2.7 s', power: '1,036 HP', weight: '1,255 kg' },
    bars: { speed: 89, accel: 91, handling: 85, braking: 83 },
    defaultPaint: '#dc2626',
    unlocked: true
  },
  {
    id: 'lamborghini_essenza',
    carClass: 'TRACK',
    brand: 'Lamborghini',
    subGroup: 'modern',
    classLabel: 'TRACK · CLASS R+',
    name: 'LAMBORGHINI ESSENZA SCV12',
    shortTag: '本地高模 GLB · 最強自然進氣 V12',
    origin: '🇮🇹 Squadra Corse · 6.5L V12 NA · 中置後驅 (MR)',
    desc: '全球僅 40 輛的純種賽道毒藥！碳纖單體殼車架符合 FIA 原型車規範，250 km/h 即產出接近 1,200 kgf 的真實空力壓地力，高速穩定性直追原型賽車。',
    specs: { topSpeed: '324 km/h', accel: '3.0 s', power: '830 HP', weight: '1,280 kg' },
    bars: { speed: 80, accel: 85, handling: 84, braking: 82 },
    defaultPaint: '#10b981',
    unlocked: true
  },
  {
    id: 'ferrari_laferrari',
    carClass: 'HYPER',
    brand: 'Ferrari',
    subGroup: 'hybrid',
    classLabel: 'HYPER · CLASS R',
    name: 'FERRARI LAFERRARI',
    shortTag: '本地高模 GLB · 950 HP 油電馬王旗艦',
    origin: '🇮🇹 義大利馬拉內羅 · 6.3L V12 + HY-KERS · 中置後驅',
    desc: '「三大神車」之一的躍馬公路旗艦！0-200 km/h 僅 ~6 秒出頭、直線極速高達 353 km/h 遠超 GT3；但受限公路胎與較溫和的主動空力，低速與中速彎極限反而略遜純 GT3 廠車。',
    specs: { topSpeed: '353 km/h', accel: '2.8 s', power: '950 HP', weight: '1,365 kg' },
    bars: { speed: 93, accel: 90, handling: 64, braking: 64 },
    defaultPaint: '#dc2626',
    unlocked: true
  },
  {
    id: 'mclaren_p1',
    carClass: 'HYPER',
    brand: 'McLaren',
    subGroup: 'hybrid',
    classLabel: 'HYPER · CLASS R',
    name: 'MCLAREN P1',
    shortTag: '本地高模 GLB · 903 HP IPAS 油電神車',
    origin: '🇬🇧 英國沃金 · 3.8L V8 雙渦輪油電 · 中置後驅',
    desc: 'Race Mode 可產出高達 570+ kgf 主動尾翼下壓力的三大神車！直線極速 350 km/h 與狂暴油電中段加速令 GT3 望塵莫及，但公路胎特性仍需要細膩煞車點控制。',
    specs: { topSpeed: '350 km/h', accel: '2.9 s', power: '903 HP', weight: '1,395 kg' },
    bars: { speed: 92, accel: 89, handling: 68, braking: 67 },
    defaultPaint: '#f97316',
    unlocked: true
  },
  {
    id: 'ferrari_sf90_xx',
    carClass: 'HYPER',
    brand: 'Ferrari',
    subGroup: 'hybrid',
    classLabel: 'HYPER · CLASS R',
    name: 'FERRARI SF90 XX STRADALE',
    shortTag: '本地高模 GLB · 1,016 HP 街車化 XX',
    origin: '🇮🇹 義大利馬拉內羅 · 4.0L V8 PHEV 三馬達 · 四驅',
    desc: '可上路且搭載固定大尾翼的四驅怪獸！1,016 匹三電機起跑 0-100 僅 2.3s 傲視公路組別，但 1,560 kg 車重讓重煞進彎需要比輕量化賽車更早踩煞車。',
    specs: { topSpeed: '338 km/h', accel: '2.3 s', power: '1,016 HP', weight: '1,560 kg' },
    bars: { speed: 86, accel: 94, handling: 69, braking: 68 },
    defaultPaint: '#ef4444',
    unlocked: true
  },
  {
    id: 'lamborghini_revuelto',
    carClass: 'HYPER',
    brand: 'Lamborghini',
    subGroup: 'hybrid',
    classLabel: 'HYPER · CLASS R',
    name: 'LAMBORGHINI REVUELTO V12 HYBRID',
    shortTag: '本地高模 GLB · 1,001 HP 旗艦 HPEV 大牛',
    origin: '🇮🇹 聖亞加塔 · 6.5L V12 + 前軸雙電機 · 四驅',
    desc: '9,500 rpm 高轉速 V12 配八速雙離合與四驅出彎彈射！351 km/h 直線猛爆無比，但 1,772 kg 滿載重量使其彎道極限與煞車距離明顯重於純種廠車。',
    specs: { topSpeed: '351 km/h', accel: '2.5 s', power: '1,001 HP', weight: '1,772 kg' },
    bars: { speed: 92, accel: 92, handling: 63, braking: 62 },
    defaultPaint: '#f97316',
    unlocked: true
  },
  {
    id: 'lamborghini_centenario',
    carClass: 'HYPER',
    brand: 'Lamborghini',
    subGroup: 'vmax',
    classLabel: 'HYPER · CLASS R',
    name: 'LAMBORGHINI CENTENARIO LP 770-4',
    shortTag: '本地高模 GLB · 百年紀念碳纖旗艦',
    origin: '🇮🇹 聖亞加塔 · 6.5L V12 自然進氣 · 全輪轉向四驅',
    desc: '百年紀念鍛造碳纖維公路旗艦！全輪驅動起步 2.8s 衝出，長直線可拉升至 350 km/h，適合在寬廣高速賽道展現大排量 NA 聲浪。',
    specs: { topSpeed: '350 km/h', accel: '2.8 s', power: '759 HP', weight: '1,520 kg' },
    bars: { speed: 92, accel: 87, handling: 62, braking: 61 },
    defaultPaint: '#1e293b',
    unlocked: true
  },
  {
    id: 'lamborghini_veneno',
    carClass: 'HYPER',
    brand: 'Lamborghini',
    subGroup: 'vmax',
    classLabel: 'HYPER · CLASS R',
    name: 'LAMBORGHINI VENENO',
    shortTag: '本地高模 GLB · 極罕原型車空力外型',
    origin: '🇮🇹 聖亞加塔 · 6.5L V12 NA · 全輪驅動',
    desc: '極致低風阻高速飛彈！從車頭擾流刀刃到可調大型尾翼皆為衝破 354 km/h 公路極速而生，直線強勢、彎道屬於硬派街道超跑節奏。',
    specs: { topSpeed: '354 km/h', accel: '2.8 s', power: '740 HP', weight: '1,450 kg' },
    bars: { speed: 93, accel: 88, handling: 64, braking: 63 },
    defaultPaint: '#cbd5e1',
    unlocked: true
  },
  {
    id: 'lamborghini_sc20',
    carClass: 'HYPER',
    brand: 'Lamborghini',
    subGroup: 'vmax',
    classLabel: 'HYPER · CLASS R',
    name: 'LAMBORGHINI SC20 SQUADRA CORSE',
    shortTag: '本地高模 GLB · 全球唯一無前檔風玻璃 Barchetta',
    origin: '🇮🇹 Squadra Corse · 6.5L V12 NA · 開放式座艙',
    desc: 'Squadra Corse 賽車部門手工客製之 One-Off 無車頂 Barchetta！較強的下壓力尾翼換取高於 Aventador 的貼地表現與 338 km/h 暢快加速。',
    specs: { topSpeed: '338 km/h', accel: '2.8 s', power: '759 HP', weight: '1,510 kg' },
    bars: { speed: 86, accel: 87, handling: 65, braking: 63 },
    defaultPaint: '#f8fafc',
    unlocked: true
  },
  // --- LMP1 / VISION GT / CLASS X ---
  {
    id: 'amg_one',
    carClass: 'HYPER',
    brand: 'Mercedes-AMG',
    subGroup: 'hybrid',
    classLabel: 'HYPER · CLASS R',
    name: 'MERCEDES-AMG ONE F1 E-HYBRID',
    shortTag: '本地高模 GLB · F1 1.6T V6 11,000rpm 油電四驅',
    origin: '🇩🇪 阿法爾特巴赫 / 布里克斯沃斯 · F1 PU106 混合動力 · 四驅',
    desc: '直接移植 F1 世界冠軍動力單元的紐北量產王者！11,000 rpm F1 V6 引擎配四電機，352 km/h 極速與主動空力可擊敗所有公路超跑，歸入 HYPER 公路神車組可公平對決三神車。',
    specs: { topSpeed: '352 km/h', accel: '2.7 s', power: '1,063 HP', weight: '1,695 kg' },
    bars: { speed: 92, accel: 90, handling: 77, braking: 75 },
    defaultPaint: '#94a3b8',
    unlocked: true
  },
  {
    id: 'porsche_919_evo',
    carClass: 'LMP1',
    brand: 'Porsche',
    subGroup: 'wec',
    classLabel: 'LMP1 · CLASS X',
    name: 'PORSCHE 919 HYBRID EVO LMP1',
    shortTag: '本地高模 GLB · 斯帕 / 紐北終極無限制原型車',
    origin: '🇩🇪 魏薩赫賽車部門 · 2.0L V4 渦輪 + 800V 動能回收 · 全輪驅動',
    desc: '解放所有 FIA WEC 規則限制的史上最快閉輪神獸！僅 849kg 配 1,160 HP 四驅爆發 (0-100 2.1s / 0-200 4.2s) 與超過 2,100 kgf 超狂地面效應，斯帕單圈與 F1 分庭抗禮！',
    specs: { topSpeed: '369 km/h', accel: '2.1 s', power: '1,160 HP', weight: '849 kg' },
    bars: { speed: 100, accel: 100, handling: 98, braking: 98 },
    defaultPaint: '#f8fafc',
    unlocked: true
  },
  {
    id: 'mazda_furai',
    carClass: 'LMP1',
    brand: 'Mazda',
    subGroup: 'vision',
    classLabel: 'LMP1 · CLASS X',
    name: 'MAZDA FURAI CONCEPT PROTOTYPE',
    shortTag: '本地高模 GLB · 675kg 三轉子利曼原型底盤',
    origin: '🇯🇵 廣島 Mazda / Courage C65 LMP2 · 三轉子 20B · 後驅',
    desc: '結合 LMP2 原型賽車底盤與僅 675kg 羽毛級車重的傳奇概念原型！450 匹三轉子 9,800 rpm 引擎在彎道擁有驚人推重比與 ~3.2G 過彎實力。',
    specs: { topSpeed: '318 km/h', accel: '2.9 s', power: '450 HP', weight: '675 kg' },
    bars: { speed: 77, accel: 86, handling: 90, braking: 88 },
    defaultPaint: '#1e293b',
    unlocked: true
  },
  {
    id: 'alpine_vision',
    carClass: 'LMP1',
    brand: 'Alpine',
    subGroup: 'vision',
    classLabel: 'LMP1 · CLASS X',
    name: 'ALPINE VISION GRAN TURISMO',
    shortTag: '本地高模 GLB · 900kg 法系開放單座原型',
    origin: '🇫🇷 法國迪耶普 · 4.5L V8 · 開放單座極低重心',
    desc: '向 A220 利曼耐力賽車致敬之單座 Vision GT 原型機器！900kg 超輕車體配上大型風煞側翼，高速彎極限高達 3.0G 並擁有銳利進彎敏捷度。',
    specs: { topSpeed: '322 km/h', accel: '3.0 s', power: '450 HP', weight: '900 kg' },
    bars: { speed: 79, accel: 84, handling: 88, braking: 86 },
    defaultPaint: '#0284c7',
    unlocked: true
  },
  {
    id: 'lamborghini_terzo',
    carClass: 'LMP1',
    brand: 'Lamborghini',
    subGroup: 'vision',
    classLabel: 'LMP1 · CLASS X',
    name: 'LAMBORGHINI TERZO MILLENNIO',
    shortTag: '本地高模 GLB · MIT 聯名超電容四輪輪轂電機',
    origin: '🇮🇹 聖亞加塔 / 🇺🇸 MIT · 超級電容 + 四輪輪轂電機 · 全輪驅動',
    desc: '突破當代電機結構的概念未來超跑！地面效應風道貫穿碳纖車體與四輪瞬時全扭力矢量化分配，0-100 僅 2.2s 帶來軌道列車般的貼地加速感。',
    specs: { topSpeed: '350 km/h', accel: '2.2 s', power: '1,200 HP', weight: '1,200 kg' },
    bars: { speed: 92, accel: 98, handling: 92, braking: 90 },
    defaultPaint: '#1e293b',
    unlocked: true
  },
  {
    id: 'mazda_lm_vision',
    carClass: 'LMP1',
    brand: 'Mazda',
    subGroup: 'vision',
    classLabel: 'LMP1 · CLASS X',
    name: 'MAZDA LM55 VISION GRAN TURISMO',
    shortTag: '本地高模 GLB · 致敬 787B 利曼耐力原型戰車',
    origin: '🇯🇵 廣島 Mazda Design · 利曼 LMP1-H 等級碳纖原型',
    desc: '向 1991 年利曼冠軍 787B 致敬的現代化 LMP1 原型車！880kg 碳纖單體車架搭配高效率文丘里地面效應通道，0-200 僅 4.7s 堪稱全能高速刷圈神器。',
    specs: { topSpeed: '358 km/h', accel: '2.4 s', power: '850 HP', weight: '880 kg' },
    bars: { speed: 95, accel: 97, handling: 95, braking: 94 },
    defaultPaint: '#ef4444',
    unlocked: true
  },
  // --- STREET / CLASS A ---
  {
    id: 'lamborghini_aventador',
    carClass: 'STREET',
    brand: 'Lamborghini',
    subGroup: 'supercar',
    classLabel: 'STREET · CLASS A',
    name: 'LAMBORGHINI AVENTADOR LP 700-4',
    shortTag: '本地高模 GLB · 6.5L V12 四驅超跑',
    origin: '🇮🇹 聖亞加塔 · 6.5L L539 V12 · Haldex 四輪驅動',
    desc: '蠻牛經典世代旗艦公路超跑！700 匹自然進氣 V12 配四驅起步 2.9s 與 348 km/h 極速依然兇猛，但公路胎、1,575kg 車重與低空力使彎道與煞車大幅落後於純種 GT3 賽車。',
    specs: { topSpeed: '348 km/h', accel: '2.9 s', power: '700 HP', weight: '1,575 kg' },
    bars: { speed: 90, accel: 86, handling: 52, braking: 52 },
    defaultPaint: '#eab308',
    unlocked: true
  },
  {
    id: 'ferrari_f40_lbw',
    carClass: 'STREET',
    brand: 'Ferrari',
    subGroup: 'classic',
    classLabel: 'STREET · CLASS A',
    name: 'LB-WORKS FERRARI F40 WIDEBODY',
    shortTag: '本地高模 GLB · 自由步寬體 2.9L V8 經典',
    origin: '🇮🇹 馬拉內羅 / 🇯🇵 Liberty Walk · 2.9L V8 雙渦輪 · 後驅',
    desc: '80 年代最後一輛由 Enzo Ferrari 親自審核的傳奇超跑注入日本寬體暴龜靈魂！純機械 5 速手排、1,220kg 與無電子輔助雙渦輪爆發感極富挑戰樂趣。',
    specs: { topSpeed: '324 km/h', accel: '4.1 s', power: '478 HP', weight: '1,220 kg' },
    bars: { speed: 80, accel: 70, handling: 48, braking: 46 },
    defaultPaint: '#dc2626',
    unlocked: true
  },
  {
    id: 'lamborghini_countach',
    carClass: 'STREET',
    brand: 'Lamborghini',
    subGroup: 'classic',
    classLabel: 'STREET · CLASS A',
    name: 'LAMBORGHINI COUNTACH 5000 QV',
    shortTag: '本地高模 GLB · 80 年代海報之王 5.2L V12',
    origin: '🇮🇹 義大利聖亞加塔 · 5.2L Quattrovalvole V12 · 中置後驅',
    desc: '定義超級跑車楔形比例的 80 年代海報之王！老派 5 速手排、無 ABS 與無空力下壓力設計讓極限操控與重煞距離充滿真實的經典挑戰感。',
    specs: { topSpeed: '293 km/h', accel: '4.9 s', power: '455 HP', weight: '1,490 kg' },
    bars: { speed: 67, accel: 58, handling: 36, braking: 34 },
    defaultPaint: '#f8fafc',
    unlocked: true
  },
  {
    id: 'nissan_xtrail',
    carClass: 'SPORT',
    brand: 'Nissan',
    subGroup: 'daily',
    classLabel: 'SPORT · CLASS C',
    name: 'NISSAN X-TRAIL e-POWER SUV',
    shortTag: '本地高模 GLB · 家用休旅下場趣味挑戰',
    origin: '🇯🇵 日本橫濱 · 1.5L VC-Turbo e-POWER 雙馬達電驅 SUV',
    desc: '真正比照原廠數據的家用休旅！0-100 需約 7.3 秒、185 km/h 極速封頂、零空力下壓力加上 1.68 噸高重心大幅側傾 (~0.85G 彎道)，現在獨立於日常 SPORT 組與入門跑車同場競逐！',
    specs: { topSpeed: '185 km/h', accel: '7.3 s', power: '213 HP', weight: '1,680 kg' },
    bars: { speed: 20, accel: 24, handling: 22, braking: 24 },
    defaultPaint: '#cbd5e1',
    unlocked: true
  },
  // --- F1 / CLASS F1 ---
  {
    id: 'f1_2026_sf26',
    carClass: 'F1',
    brand: 'Ferrari',
    subGroup: 'modern',
    classLabel: 'F1 · CLASS F1',
    name: 'SCUDERIA FERRARI SF-26 F1 (2026)',
    shortTag: '本地高模 GLB · 15,000rpm 8速 一級方程式',
    origin: '🇮🇹 義大利馬拉內羅 F1 · 1.6L V6 + 350kW MGU-K 混合動力',
    desc: '地球上最快的場地彎道機器！768kg 配 1,000+ HP (0-200 僅 4.6s)、八速 15,000 rpm 嘶吼，配合超過 2,300 kgf 下壓力實現高達 5G 的恐怖高速過彎與碳煞減速，斯帕單圈比 GT3 快上三十多秒！',
    specs: { topSpeed: '364 km/h', accel: '2.3 s', power: '1,000+ HP', weight: '768 kg' },
    bars: { speed: 98, accel: 99, handling: 100, braking: 100 },
    defaultPaint: '#dc2626',
    unlocked: true
  }
];

(function appendExpandedCatalogEntries() {
  const CLASS_LABELS = {
    SPORT: 'SPORT · CLASS C',
    STREET: 'STREET · CLASS A',
    GT3: 'GT3 · CLASS S',
    HYPER: 'HYPER · CLASS R',
    TRACK: 'TRACK · CLASS R+',
    LMP1: 'LMP1 · CLASS X',
    F1: 'F1 · CLASS F1'
  };
  // [id, carClass, subGroup, brand, name, shortTag, origin, desc, topSpeed, accel, power, weight, bars, paint]
  const extras = [
    // --- SPORT (6) ---
    ['toyota_ae86', 'SPORT', 'daily', 'Toyota', 'TOYOTA COROLLA AE86 TRUENO GT-APEX', '本地高模 GLB · 940kg 輕量 FR 傳奇', '🇯🇵 日本豐田 · 1.6L 4A-GEU DOHC 16V · 前置後驅 (FR)', '無電子輔助、僅 940 kg 的極致輕量化駕駛教室！靠純粹動能走線與降檔補油在技術連續彎追回馬力落差。', '195 km/h', '8.2 s', '130 HP', '940 kg', [24, 22, 34, 30], '#f8fafc'],
    ['mazda_mx5', 'SPORT', 'daily', 'Mazda', 'MAZDA MX-5 MIATA (ND2)', '本地高模 GLB · 1,050kg 50:50 FR 小跑', '🇯🇵 廣島 Mazda · 2.0L Skyactiv-G NA · 六速手排 FR', '人馬一體配重代表！精準入彎與線性自然進氣高轉銜接，極適合練習循跡煞車與出彎銜接。', '220 km/h', '6.5 s', '181 HP', '1,050 kg', [32, 34, 42, 36], '#dc2626'],
    ['honda_civic_type_r', 'SPORT', 'hothatch', 'Honda', 'HONDA CIVIC TYPE R (FL5)', '本地高模 GLB · 前驅 FF 最速鋼砲', '🇯🇵 日本本田 · 2.0L K20C1 VTEC 渦輪 · 前置前驅 (FF)', '遊戲首台正統 FF 前驅廠鋼砲！收油與輕點煞車即可犀利帶入車頭，但彎中過早全油會出現前輪動力推頭。', '275 km/h', '5.4 s', '329 HP', '1,430 kg', [58, 52, 50, 48], '#f8fafc'],
    ['subaru_wrx_sti', 'SPORT', 'hothatch', 'Subaru', 'SUBARU WRX STI TYPE RA', '本地高模 GLB · 水平對臥＋對稱 AWD', '🇯🇵 日本富士重工 · 2.5L EJ25 渦輪 · 全時四驅 (AWD)', '低重心水平對臥渦輪搭配高牽引力對稱四驅，出彎全油穩定且起步迅猛，適合複雜高低速混合賽道。', '255 km/h', '4.8 s', '310 HP', '1,560 kg', [52, 62, 46, 44], '#0284c7'],
    ['mercedes_amg_c63', 'SPORT', 'muscle', 'Mercedes-AMG', 'MERCEDES-AMG C63 S COUPE', '本地高模 GLB · 4.0L V8 雙渦輪轎跑', '🇩🇪 阿法爾特巴赫 · 4.0L M177 V8 Biturbo · 前置後驅', '飽滿低中轉 V8 雙渦輪扭力與寬體穩重姿態，直線速度壓制一般鋼砲，需留意 1,730kg 煞車點。', '290 km/h', '3.9 s', '510 HP', '1,730 kg', [66, 70, 44, 45], '#94a3b8'],
    ['dodge_challenger_srt', 'SPORT', 'muscle', 'Dodge', 'DODGE CHALLENGER SRT HELLCAT', '本地高模 GLB · 717 HP 地獄貓美式肌肉', '🇺🇸 美國底特律 · 6.2L 機械增壓 HEMI V8 · 前置後驅', '無與倫比的直線怒吼與暴躁後輪扭矩！2 噸車重考驗極早煞車與標準晩彎心 V-Line 走法。', '315 km/h', '3.7 s', '717 HP', '2,015 kg', [76, 72, 34, 34], '#ef4444'],
    // --- STREET (8) ---
    ['porsche_959', 'STREET', 'classic', 'Porsche', 'PORSCHE 959 S KOMFORT', '本地高模 GLB · 80 年代 B 組四驅雙渦輪科技標竿', '🇩🇪 斯圖加特 · 2.85L 水平對臥六缸雙渦輪 · 電控 AWD', '當年地表最快量產車之一！經典渦輪延遲與後偏四驅特性讓它與 Countach、F40 展開跨世紀較量。', '317 km/h', '3.7 s', '450 HP', '1,450 kg', [76, 70, 46, 44], '#cbd5e1'],
    ['honda_nsx_r', 'STREET', 'classic', 'Honda', 'HONDA NSX-R (NA2)', '本地高模 GLB · 1,230kg 鈴鹿調校純 NA 中置神車', '🇯🇵 日本栃木 · 3.2L C32B DOHC VTEC V6 · 中置後驅', '極速不如大馬力對手，但輕量化碳纖引擎蓋與純中置平衡在技術彎角具備越級追擊實力。', '275 km/h', '4.7 s', '290 HP', '1,230 kg', [60, 58, 56, 52], '#f8fafc'],
    ['toyota_supra_mk4', 'STREET', 'classic', 'Toyota', 'TOYOTA SUPRA RZ MK4 (A80)', '本地高模 GLB · 2JZ-GTE 序列雙渦輪傳奇', '🇯🇵 日本愛知 · 3.0L 2JZ-GTE 直六雙渦輪 · 前置後驅', '經典 2JZ 中高轉雙渦輪爆發曲線搭配圓潤低風阻 GT 車身，大直線尾速與穩定巡航兼備。', '285 km/h', '4.6 s', '326 HP', '1,510 kg', [64, 62, 44, 44], '#f97316'],
    ['aston_vantage_59_amr', 'STREET', 'supercar', 'Aston Martin', 'ASTON MARTIN VANTAGE AMR 59', '本地高模 GLB · 510 HP 英倫前置 V8 雙渦輪特仕', '🇬🇧 英國蓋登 · 4.0L V8 雙渦輪 · 前中置後驅 (FMR)', '靈活短軸前置佈局結合英倫 GT 底盤調校，中速彎節奏穩健優雅，極適合長距離跑山與賽道。', '314 km/h', '3.6 s', '510 HP', '1,530 kg', [75, 74, 54, 54], '#10b981'],
    ['nissan_gtr_nismo', 'STREET', 'supercar', 'Nissan', 'NISSAN GT-R NISMO (R35)', '本地高模 GLB · 東瀛戰神 600 HP AWD 彈射器', '🇯🇵 栃木 / NISMO · 3.8L VR38DETT V6 雙渦輪 · AWD', 'ATTESA E-TS 四輪驅動帶來幾乎同組最快的起跑與出彎推力，重煞進彎需適度保留前輪荷載。', '315 km/h', '2.7 s', '600 HP', '1,720 kg', [76, 86, 56, 56], '#cbd5e1'],
    ['ferrari_812_competizione', 'STREET', 'supercar', 'Ferrari', 'FERRARI 812 COMPETIZIONE', '本地高模 GLB · 9,500 rpm 830 HP 前置 NA V12 藝術品', '🇮🇹 馬拉內羅 · 6.5L F140HB NA V12 · 前中置後驅', '9,500轉高亢 NA V12 輸出加上 340 km/h 極速，修長車頭具備強烈 V-Line 滑移與出彎激情。', '340 km/h', '2.85 s', '830 HP', '1,487 kg', [87, 87, 58, 58], '#eab308'],
    ['mclaren_765lt', 'STREET', 'supercar', 'McLaren', 'MCLAREN 765LT', '本地高模 GLB · 1,339kg 輕量化中置 765 HP 長尾猛獸', '🇬🇧 英國沃金 · 4.0L M840T V8 雙渦輪 · 中置後驅', '極輕碳纖車身讓 765 匹馬力揮灑得淋漓盡致，中後段再加速與中高速彎反應位居 STREET 頂點。', '330 km/h', '2.8 s', '765 HP', '1,339 kg', [84, 89, 62, 62], '#f97316'],
    ['porsche_911_gt3_rs', 'STREET', 'supercar', 'Porsche', 'PORSCHE 911 GT3 RS (992)', '本地高模 GLB · 860 kgf 主動 DRS 巨翼・紐北街車彎道王', '🇩🇪 斯圖加特 · 4.0L NA 水平對臥六缸 9,000 rpm · RR', '雖極速僅 296 km/h，卻擁有街道組壓倒性的真實賽車級下壓力與 9,000 rpm RR 循跡過彎實力！', '296 km/h', '3.2 s', '525 HP', '1,450 kg', [70, 82, 70, 70], '#f8fafc'],
    // --- GT3 (6, strict BoP) ---
    ['audi_r8_lms_evo', 'GT3', 'eu', 'Audi', 'AUDI R8 LMS GT3 EVO II', '本地高模 GLB · 5.2L V10 中置耐力常勝軍', '🇩🇪 英戈爾施塔特 · 5.2L V10 NA · 中置後驅 (MR)', '與 Huracan GT3 共享血統的德系中置猛將，EVO II 頂置進氣導管兼顧線性輸出與彎中平衡。', '309 km/h', '3.3 s', '585 HP', '1,235 kg', [74, 80, 75, 72], '#dc2626'],
    ['acura_nsx_gt3_evo', 'GT3', 'jp', 'Honda/Acura', 'ACURA NSX GT3 EVO22', '本地高模 GLB · 3.5L V6 雙渦輪輕巧中置 GT3', '🇯🇵🇺🇸 Honda Performance · 3.5L V6 Biturbo · MR', '取消量產版前軸電機並大幅強化空力與入彎靈活度，連續 S 彎變向在 GT3 組別屬頂尖水準。', '306 km/h', '3.4 s', '550 HP', '1,240 kg', [72, 79, 76, 72], '#0284c7'],
    ['lexus_rc_f_gt3', 'GT3', 'jp', 'Lexus', 'LEXUS RC F GT3', '本地高模 GLB · 5.0L 自然進氣 V8 日系前置 GT3', '🇯🇵 豐田 GAZOO · 5.0L 2UR-GSE V8 · 前中置後驅 (FMR)', '大排量自然進氣 V8 搭配長軸寬體底盤，高速穩定度與直線尾速突出、長距離保護輪胎優異。', '311 km/h', '3.4 s', '540 HP', '1,300 kg', [74, 79, 73, 71], '#1e293b'],
    ['nissan_gtr_gt3', 'GT3', 'jp', 'Nissan', 'NISSAN GT-R NISMO GT3 (R35)', '本地高模 GLB · 3.8L V6 雙渦輪日系重裝 GT3', '🇯🇵 橫濱 NISMO · 3.8L VR38DETT GT3 · 前中置後驅', '前中置重心後移改造後的純後驅戰馬！扭力充沛且高速直道極強，堪稱東洋版 AMG GT3。', '312 km/h', '3.4 s', '550 HP', '1,285 kg', [75, 80, 72, 71], '#f8fafc'],
    ['corvette_z06_gt3r', 'GT3', 'us', 'Chevrolet', 'CHEVROLET CORVETTE Z06 GT3.R', '本地高模 GLB · 5.5L 平面曲軸 V8 中置新世代 GT3', '🇺🇸 Pratt Miller · 5.5L LT6 NA V8 · 中置後驅 (MR)', 'Corvette 史上首款全新中置量產架構 GT3！高亢 8,600 rpm 平面曲軸 V8 配優異底盤剛性，全能無短板。', '308 km/h', '3.3 s', '570 HP', '1,250 kg', [73, 80, 75, 72], '#eab308'],
    ['ford_mustang_gt3', 'GT3', 'us', 'Ford', 'FORD MUSTANG GT3', '本地高模 GLB · 5.4L Coyote NA V8 美系前置巨獸', '🇺🇸 Multimatic · 5.4L Coyote V8 · 前中置後驅 (FMR)', 'Multimatic 與 M-Sport 聯合研發，擁有全 GT3 組最高直線終速與渾厚自然進氣美式聲浪。', '313 km/h', '3.3 s', '580 HP', '1,290 kg', [75, 80, 72, 71], '#0284c7'],
    // --- HYPER (10) ---
    ['porsche_918_spyder', 'HYPER', 'hybrid', 'Porsche', 'PORSCHE 918 SPYDER WEISSACH', '本地高模 GLB · 三大神車唯一四驅高轉 V8 油電', '🇩🇪 魏薩赫 · 4.6L V8 9,150rpm + 雙電機 · 四驅', '集齊「三大神車」最後拼圖！四驅起步與低速出彎牽引力最強，適合混合技術型賽道。', '345 km/h', '2.6 s', '887 HP', '1,674 kg', [89, 93, 68, 66], '#cbd5e1'],
    ['bugatti_tourbillon', 'HYPER', 'hybrid', 'Bugatti', 'BUGATTI TOURBILLON V16 HYBRID', '本地高模 GLB · 8.3L NA V16＋三馬達 1,800 HP', '🇫🇷 法國莫爾塞姆 · 8.3L V16 + 三電機 · 全輪驅動', '捨棄渦輪改搭 9,000rpm 自然進氣 V16 與強悍三電驅動，445 km/h 極速表現為當代 Hypercar 新標竿。', '445 km/h', '2.0 s', '1,800 HP', '1,995 kg', [100, 99, 66, 66], '#0284c7'],
    ['rimac_nevera', 'HYPER', 'hybrid', 'Rimac', 'RIMAC NEVERA EV', '本地高模 GLB · 1,914 HP 四馬達純電加速王者', '🇭🇷 克羅埃西亞 · 四輪獨立電機矢量分配 · AWD', '毫無換檔頓挫的 1,914 匹瞬時純電彈射！0-200 加速稱霸全公路組，2.3 噸車重需要極早重煞。', '412 km/h', '1.85 s', '1,914 HP', '2,300 kg', [97, 100, 62, 60], '#0284c7'],
    ['mclaren_speedtail', 'HYPER', 'hybrid', 'McLaren', 'MCLAREN SPEEDTAIL', '本地高模 GLB · 403 km/h 超低風阻水滴三座神車', '🇬🇧 英國沃金 · 4.0L V8 雙渦輪油電 · 中置後驅', '長達 5.1 公尺的流線型無尾翼設計專注極致低風阻加速，蒙札直線表現堪稱奇蹟。', '403 km/h', '2.9 s', '1,055 HP', '1,430 kg', [98, 91, 61, 62], '#94a3b8'],
    ['bugatti_chiron_pur_sport', 'HYPER', 'vmax', 'Bugatti', 'BUGATTI CHIRON PUR SPORT', '本地高模 GLB · 短齒比＋固定巨翼彎道強化 Chiron', '🇫🇷 莫爾塞姆 · 8.0L W16 四渦輪 · 全輪驅動', '捨棄 420km/h 尾速換來激進密齒比與固定式 1.9m 碳纖尾翼，過彎與中段出彎加速大幅提升。', '350 km/h', '2.3 s', '1,500 HP', '1,945 kg', [92, 95, 70, 68], '#0284c7'],
    ['bugatti_veyron_ss', 'HYPER', 'vmax', 'Bugatti', 'BUGATTI VEYRON 16.4 SUPER SPORT', '本地高模 GLB · 431 km/h 世代傳奇四渦輪極速王', '🇫🇷 莫爾塞姆 · 8.0L W16 四渦輪 · 全輪驅動', '定義 21 世紀 400 km/h 門檻的里程碑巨獸，極低風阻高速直道吞噬能力極強。', '431 km/h', '2.5 s', '1,200 HP', '1,838 kg', [99, 92, 60, 60], '#f97316'],
    ['koenigsegg_jesko_attack', 'HYPER', 'vmax', 'Koenigsegg', 'KOENIGSEGG JESKO ATTACK', '本地高模 GLB · 1,600 HP + 1,400 kgf 高空力瑞典猛獸', '🇸🇪 瑞典恩厄爾霍爾姆 · 5.0L V8 雙渦輪 + 9速 LST', '將 1,600 匹馬力與雙層大尾翼完美融合的頂尖公路神獸！兼具極快換檔與高速彎貼地極限。', '365 km/h', '2.5 s', '1,600 HP', '1,420 kg', [95, 96, 75, 74], '#10b981'],
    ['koenigsegg_one1', 'HYPER', 'vmax', 'Koenigsegg', 'KOENIGSEGG ONE:1', '本地高模 GLB · 1:1 馬力重量比 1,360 HP / 1,360 kg', '🇸🇪 瑞典恩厄爾霍爾姆 · 5.0L V8 雙渦輪 · 中置後驅', '史上第一台實現 1 MW 對 1,360kg 的極端 Megacar！主動作動尾翼與猛爆中段推力直追 TRACK 組。', '400 km/h', '2.7 s', '1,360 HP', '1,360 kg', [97, 94, 72, 71], '#f8fafc'],
    ['koenigsegg_agera', 'HYPER', 'vmax', 'Koenigsegg', 'KOENIGSEGG AGERA R', '本地高模 GLB · 1,140 HP 純後驅 V-Max 飛彈', '🇸🇪 瑞典恩厄爾霍爾姆 · 5.0L V8 雙渦輪 · 中置後驅', '無 TC 控制下的雙渦輪 1,140 匹純後驅考驗！需要極細膩油門控管，換來幾乎 400km/h 的驚人尾速。', '395 km/h', '2.8 s', '1,140 HP', '1,435 kg', [96, 91, 65, 65], '#ef4444'],
    ['mclaren_f1', 'HYPER', 'vmax', 'McLaren', 'MCLAREN F1 ROAD CAR (1994)', '本地高模 GLB · 三座中置 6.1L V12 自然進氣傳奇', '🇬🇧 英國沃金 · BMW S70/2 6.1L V12 · 六速手排 MR', '僅 1,138kg、無 ABS/TC、純自然進氣 V12 與 386 km/h 史上最傳奇的機械純粹超級跑車。', '386 km/h', '3.2 s', '627 HP', '1,138 kg', [95, 84, 58, 56], '#eab308'],
    // --- TRACK (3) ---
    ['bugatti_bolide', 'TRACK', 'modern', 'Bugatti', 'BUGATTI BOLIDE TRACK CONCEPT', '本地高模 GLB · 1,600 HP W16 極致碳纖賽道怪物', '🇫🇷 莫爾塞姆 Motorsport · 8.0L W16 四渦輪 · AWD', '以 1,450kg 承載 W16 與高下壓力空力套件的賽道狂獸，在 TRACK 組與 FXX-K Evo 正面對決！', '380 km/h', '2.17 s', '1,600 HP', '1,450 kg', [96, 98, 86, 85], '#0284c7'],
    ['pagani_zonda_r', 'TRACK', 'gt1', 'Pagani', 'PAGANI ZONDA R TRACK', '本地高模 GLB · 6.0L AMG NA V12 紐北破紀錄神作', '🇮🇹 摩德納 · 6.0L M120 V12 NA · 1,070kg 中置後驅', '最純粹的碳鈦單體殼＋9,000 rpm NA V12 狂哮，與 McLaren F1 GTR 領銜經典賽道神獸組。', '350 km/h', '2.7 s', '750 HP', '1,070 kg', [89, 89, 84, 82], '#1e293b'],
    ['mclaren_f1_gtr_longtail', 'TRACK', 'gt1', 'McLaren', 'MCLAREN F1 GTR LONGTAIL', '本地高模 GLB · 915kg 利曼 FIA GT1 長尾經典賽車', '🇬🇧 英國沃金 GT1 · BMW 6.0L V12 NA · 915kg 無電控 MR', '無 ABS/TC 搭配僅 915kg 極輕量化長尾空力，需靠精準循跡煞車感受 90 年代 GT1 純粹操控魅力。', '330 km/h', '3.0 s', '600 HP', '915 kg', [83, 86, 81, 79], '#f97316'],
    // --- LMP1 / WEC / VISION GT (7) ---
    ['ferrari_499p', 'LMP1', 'wec', 'Ferrari', 'FERRARI 499P LMH', '本地高模 GLB · 利曼 24 小時大賽衛冕冠軍紅軍 LMH', '🇮🇹 馬拉內羅 WEC · 3.0L V6 雙渦輪 + 前軸 ERS · AWD', '現役利曼 Hypercar 冠軍標竿！高效率地面效應與前軸四驅輔助帶來極度平衡的長距離耐力戰力。', '342 km/h', '2.7 s', '680 HP', '1,030 kg', [87, 92, 91, 90], '#dc2626'],
    ['porsche_963', 'LMP1', 'wec', 'Porsche', 'PORSCHE 963 LMDh', '本地高模 GLB · Penske WEC/IMSA 冠軍 4.6L V8 混動後驅', '🇩🇪 魏薩赫 / Multimatic · 4.6L V8 雙渦輪 LMDh · 後驅', '純後驅架構賦予極輕車頭慣性與極犀利入彎反應，於技術型與中高速複合彎角極具優勢。', '338 km/h', '2.8 s', '680 HP', '1,030 kg', [85, 91, 92, 91], '#ef4444'],
    ['cadillac_v_seriesr', 'LMP1', 'wec', 'Cadillac', 'CADILLAC V-SERIES.R LMDh', '本地高模 GLB · 5.5L 自然進氣 V8 美系 LMDh 怒吼', '🇺🇸 通用賽車 / Dallara · 5.5L NA DOHC V8 · 後驅', '全場最獨特的低沉高轉 NA V8 聲浪！出彎扭矩飽滿直接，正面對決 Ferrari 499P 與 Porsche 963。', '340 km/h', '2.8 s', '680 HP', '1,030 kg', [86, 91, 91, 90], '#eab308'],
    ['mercedes_sauber_c9', 'LMP1', 'wec', 'Mercedes-Benz', 'SAUBER MERCEDES C9 GROUP C', '本地高模 GLB · 1989 利曼冠軍 400km/h C 組經典怪獸', '🇩🇪🇨🇭 Sauber / AMG · 5.0L M119 V8 雙渦輪 · 893kg 無電控', '僅 893kg 配雙渦輪暴衝與近 400 km/h 直道尾速，無 ABS/TC 的 C 組暴力美學極富挑戰性。', '398 km/h', '2.8 s', '760 HP', '893 kg', [97, 92, 86, 84], '#cbd5e1'],
    ['mclaren_ultimate_vgt', 'LMP1', 'vision', 'McLaren', 'MCLAREN ULTIMATE VISION GT', '本地高模 GLB · 俯臥式戰機座艙 1,150 PS VGT 原型', '🇬🇧 英國沃金 Design · 4.0L V8 + 雙電機四驅 · 1,000kg', '以戰鬥機視野與極低重心打造的概念超跑，主動作動翼面與 1,150 匹四驅直接媲美 919 Evo！', '368 km/h', '2.2 s', '1,150 HP', '1,000 kg', [96, 97, 95, 94], '#f97316'],
    ['mclaren_x2', 'LMP1', 'vision', 'McLaren', 'MCLAREN-HONDA X2 CONCEPT', '本地高模 GLB · 820kg 封閉單座電動地面效應原型', '🇬🇧🇯🇵 未來方程式探索計畫 · 純電封閉座艙 · 820kg', '兼具 F1 級極高空力與 820kg 超輕車體的終極電動單座，過彎極限直逼四輪軌道列車。', '385 km/h', '2.0 s', '1,200 HP', '820 kg', [98, 99, 97, 96], '#f8fafc'],
    ['mercedes_silver_lightning', 'LMP1', 'vision', 'Mercedes-Benz', 'MERCEDES-BENZ SILVER LIGHTNING', '本地高模 GLB · 全能輪轂矢量純電銀箭概念原型', '🇩🇪 斯圖加特 Advanced Design · 未來地面效應純電四驅', '全透明碳纖空力車殼搭配瞬時 900 HP 四輪電控，高速穩定度與出彎抓地極為順暢。', '355 km/h', '2.3 s', '900 HP', '1,100 kg', [91, 95, 92, 90], '#cbd5e1'],
    // --- F1 (6) ---
    ['f1_2026_rb22', 'F1', 'modern', 'Red Bull', 'RED BULL RACING RB22 F1 (2026)', '本地高模 GLB · 紅牛 2026 地面效應高效率旗艦 F1', '🇦🇹🇬🇧 米爾頓凱恩斯 · 2026 Red Bull Ford 混合動力 · 768kg', '極致地面效應空力效率與頂尖高速彎極限，中高速 S 彎變向與直線極速同樣犀利。', '366 km/h', '2.25 s', '1,000+ HP', '768 kg', [98, 99, 100, 100], '#0284c7'],
    ['f1_2026_w17', 'F1', 'modern', 'Mercedes-AMG', 'MERCEDES-AMG W17 F1 (2026)', '本地高模 GLB · 銀箭原廠動力高尾速 F1 單座戰車', '🇩🇪🇬🇧 布拉克利 / 布里克斯沃斯 · Mercedes HPP 2026 PU · 768kg', '優異的低阻空力效率與強大混動直道尾速（368 km/h），在蒙札與斯帕極具長直線超車優勢。', '368 km/h', '2.3 s', '1,000+ HP', '768 kg', [99, 99, 99, 100], '#94a3b8'],
    ['f1_2026_r26', 'F1', 'modern', 'Audi', 'AUDI F1 TEAM R26 (2026)', '本地高模 GLB · 四環廠隊首發低轉高牽引 F1 賽車', '🇩🇪🇨🇭 諾伊堡 / 欣維爾 · Audi Formula Racing PU · 768kg', '穩健出彎機械牽引力搭配 MGU-K 瞬時扭矩分配，低速髮夾彎加速極為乾脆。', '362 km/h', '2.25 s', '1,000+ HP', '768 kg', [97, 99, 99, 100], '#cbd5e1'],
    ['f1_2026_mac26', 'F1', 'modern', 'Cadillac', 'CADILLAC F1 MAC-26 (2026)', '本地高模 GLB · 美系 2026 新規全能單座 F1 賽車', '🇺🇸🇬🇧 凱迪拉克 / 銀石 F1 分部 · 2026 混合動力 · 768kg', '重煞入彎極端穩定且對路緣石包容度高，技術型多彎賽道表現穩健搶眼。', '365 km/h', '2.3 s', '1,000+ HP', '768 kg', [98, 98, 99, 100], '#1e293b'],
    ['f1_2025_mcl39', 'F1', 'modern', 'McLaren', 'MCLAREN MCL39 F1 (2025)', '本地高模 GLB · 木瓜橘極致高下壓力連彎殺手 F1', '🇬🇧 英國沃金 MTC · 2025 巔峰地面效應底盤 · 800kg', '同組最高下壓力設定之一！雖然直道風阻稍大（358 km/h），但在鈴鹿與銀石高速連彎宛如貼地飛行。', '358 km/h', '2.3 s', '1,000+ HP', '800 kg', [95, 99, 100, 100], '#f97316'],
    ['ferrari_f2004', 'F1', 'classic', 'Ferrari', 'FERRARI F2004 V10 F1 (2004)', '本地高模 GLB · 605kg＋19,000 rpm 經典 V10 史上最速戰馬', '🇮🇹 馬拉內羅 · 3.0L Tipo 053 V10 NA 900HP · 605kg 7速', '605 公斤羽毛級車身與 19,000 rpm 高頻天籟！低速機械抓地與靈活軸距壓過現代 F1，僅缺低轉電機助推。', '362 km/h', '2.4 s', '900 HP', '605 kg', [97, 96, 100, 100], '#dc2626']
  ];
  extras.forEach(([id, carClass, subGroup, brand, name, shortTag, origin, desc, topSpeed, accel, power, weight, bars, defaultPaint]) => {
    CAR_CATALOG.push({
      id,
      carClass,
      brand,
      subGroup,
      classLabel: CLASS_LABELS[carClass] || (carClass + ' · CLASS S'),
      name,
      shortTag,
      origin,
      desc,
      specs: { topSpeed, accel, power, weight },
      bars: { speed: bars[0], accel: bars[1], handling: bars[2], braking: bars[3] },
      defaultPaint,
      unlocked: true
    });
  });

  if (typeof window !== 'undefined' && window.CAR_PI_AND_CLASS_TABLE) {
    const tbl = window.CAR_PI_AND_CLASS_TABLE;
    const bands = window.PI_CLASS_BANDS || {};
    CAR_CATALOG.forEach(c => {
      const info = tbl[c.id];
      if (!info) return;
      c.pi = info[0];
      c.carClass = info[1];
      c.subGroup = info[2];
      const b = bands[info[1]];
      c.classLabel = b ? `${b.label} · ${b.range}` : `${info[1]} · PI ${info[0]}`;
    });
  }
})();

const PAINT_SWATCHES = [
  { hex: '#ef4444', name: '競速緋紅' },
  { hex: '#0284c7', name: '海灣湛藍' },
  { hex: '#10b981', name: '曼巴毒綠' },
  { hex: '#eab308', name: '烈日耀黃' },
  { hex: '#cbd5e1', name: '極光鈦銀' },
  { hex: '#1e293b', name: '暗夜消光黑' }
];

const RIM_SWATCHES = [
  { hex: '#94a3b8', name: '機械鈦銀' },
  { hex: '#d97706', name: '曜石香檳金' },
  { hex: '#18181b', name: '鍛造消光黑' },
  { hex: '#06b6d4', name: '電光賽道青' }
];

const GARAGE_CLASS_META = [
  { id: 'D', label: 'D 入門輕跑', short: 'D', icon: '🩵', color: '#2dd4bf', subOptions: [{ id: 'all', label: '全部 D 級' }, { id: 'daily', label: '🚙 日常 / 入門 FR' }, { id: 'classic', label: '🏛 經典街跑' }] },
  { id: 'C', label: 'C 鋼砲/經典', short: 'C', icon: '🟢', color: '#34d399', subOptions: [{ id: 'all', label: '全部 C 級' }, { id: 'hothatch', label: '🔥 鋼砲 / 四驅' }, { id: 'classic', label: '🏛 80-90s 經典' }, { id: 'muscle', label: '💪 雙門性能 / 肌肉' }] },
  { id: 'B', label: 'B 現代超跑', short: 'B', icon: '💚', color: '#a3e635', subOptions: [{ id: 'all', label: '全部 B 級' }, { id: 'supercar', label: '🏎 超級跑車' }, { id: 'gt', label: '🛡 前置 V8/V12' }, { id: 'track_road', label: '🌪 街車空力王' }] },
  { id: 'GT3', label: 'GT3 統規', short: 'GT3', icon: '🟠', color: '#fb923c', subOptions: [{ id: 'all', label: '全部 GT3' }, { id: 'eu', label: '🇪🇺 歐系廠隊' }, { id: 'jp', label: '🇯🇵 日系 GT3' }, { id: 'us', label: '🇺🇸 美系 V8' }] },
  { id: 'A', label: 'A 公路神車', short: 'A', icon: '🟣', color: '#c084fc', subOptions: [{ id: 'all', label: '全部 A 級' }, { id: 'hybrid', label: '⚡ 油電神車' }, { id: 'vmax', label: '🚀 極速旗艦' }] },
  { id: 'S', label: 'S 終極神獸', short: 'S', icon: '💜', color: '#e879f9', subOptions: [{ id: 'all', label: '全部 S 級' }, { id: 'aero', label: '🌪 空力彎道' }, { id: 'vmax', label: '🚀 極速猛獸' }] },
  { id: 'R', label: 'R 賽道頂尖', short: 'R', icon: '🟡', color: '#f59e0b', subOptions: [{ id: 'all', label: '全部 R 級' }, { id: 'track', label: '🏁 現代賽道版' }, { id: 'gt1', label: '🏆 經典 GT1' }, { id: 'proto', label: '✨ 輕量原型' }] },
  { id: 'LMH', label: 'LMH 耐力原型', short: 'LMH', icon: '🔵', color: '#38bdf8', subOptions: [{ id: 'all', label: '全部 LMH' }, { id: 'wec', label: '🏆 WEC / Group C' }, { id: 'concept', label: '✨ 概念 / 無限制' }] },
  { id: 'X', label: 'X 終極原型', short: 'X', icon: '🔷', color: '#818cf8', subOptions: [{ id: 'all', label: '全部 X 級' }, { id: 'vgt', label: '✨ Vision GT' }, { id: 'unlimited', label: '👑 破紀錄神獸' }] },
  { id: 'F1', label: 'F1 方程式', short: 'F1', icon: '🔴', color: '#f43f5e', subOptions: [{ id: 'all', label: '全部 F1' }, { id: 'modern', label: '⚡ 2025-2026 混動' }, { id: 'classic', label: '🔊 V10 經典世代' }] },
  { id: 'all', label: '全部車庫', short: 'ALL', icon: '🌍', color: '#94a3b8', subOptions: [] }
];

function getClassAccentColor(carClass) {
  const hit = GARAGE_CLASS_META.find(g => g.id === carClass);
  return hit ? hit.color : '#fb923c';
}

function getActiveCarMeta() {
  const found = CAR_CATALOG.find(c => c.id === carAssetState.presetId);
  if (found) return found;
  return {
    id: carAssetState.presetId,
    classLabel: 'GT3 · CUSTOM',
    name: (carAssetState.label || 'CUSTOM GT3').toUpperCase(),
    shortTag: '自訂匯入 3D 模型',
    origin: '🔧 自訂 glTF / GLB 賽車資產 · GT3 統規底盤',
    desc: '由玩家自訂載入之 3D 賽車模型，已自動對齊 GT3 軸距並綁定四輪轉向與滾動骨骼。',
    specs: { topSpeed: '306 km/h', accel: '3.5 s', power: '610 HP', weight: '1,240 kg' },
    bars: { speed: 90, accel: 91, handling: 93, braking: 93 },
    unlocked: true
  };
}

function getCarDrivingStyleMeta(carId) {
  const cp = (typeof CAR_HANDLING_PROFILES !== 'undefined' && (CAR_HANDLING_PROFILES[carId] || CAR_HANDLING_PROFILES.procedural)) || {};
  const tr = (typeof getCarChassisTraits === 'function')
    ? getCarChassisTraits(cp)
    : { layout: 'FMR', absMode: 'motorsport_abs', tcMode: 'gt3_tc', torqueCurve: 'gt3_flat', lineBias: 0.0 };
  const layoutLabels = {
    FF: '前輪驅動 FF',
    RR: '後置後驅 RR',
    MR: '中置後驅 MR',
    FMR: '前中置後驅 FMR',
    AWD: '四輪驅動 AWD',
    OPEN_WHEEL: '開輪方程式 F1',
    SUV: '日常休旅 SUV'
  };
  const absLabels = {
    motorsport_abs: '競技 ABS',
    street_abs: '街車 ABS',
    none: '無 ABS 需防鎖死'
  };
  const tcLabels = {
    gt3_tc: '賽事 TC',
    awd_vectored: '四驅矢量',
    none: '無 TC 需控油'
  };
  const torqueLabels = {
    gt3_flat: '線性賽事扭矩',
    turbo_lag_classic: '渦輪遲滯暴衝',
    na_screamer: '萬轉高轉衝刺',
    hybrid_instant: '油電瞬時扭力'
  };
  const bias = tr.lineBias || 0;
  let lineTag = tr.layout === 'FF' ? '前驅節奏線（收油帶頭）' : 'GT3 標準外內外';
  let tip = tr.layout === 'FF'
    ? '收油／輕煞帶入車頭，出彎等方向回正再全油防前輪推頭'
    : '適用 空白鍵 (75%) 循跡煞車穩定帶入彎心';
  if (bias <= -0.2) {
    lineTag = tr.layout === 'SUV' ? '保守滑行大弧線' : 'U-Line 高速大弧線';
    tip = tr.layout === 'SUV' ? '早煞車減速、避免急打方向推頭' : '大空力高速彎吃滿寬弧線，盡早滾油門出彎';
  } else if (bias >= 0.7) {
    lineTag = 'V-Line 晚煞晚入彎';
    tip = '直線重煞到極限後深含 空白鍵 尖轉入彎、提早回正加速';
  } else if (bias >= 0.2) {
    lineTag = 'V-Line 點射晚彎心';
    tip = '偏晚彎心切換，利用高下壓力與煞車轉向銳利切入';
  }
  return {
    layoutLabel: layoutLabels[tr.layout] || tr.layout,
    absLabel: absLabels[tr.absMode] || tr.absMode,
    tcLabel: tcLabels[tr.tcMode] || tr.tcMode,
    torqueLabel: torqueLabels[tr.torqueCurve] || tr.torqueCurve,
    lineTag,
    tip
  };
}

let personalRecords = {};
try {
  personalRecords = JSON.parse(localStorage.getItem('apexpro.records') || '{}') || {};
} catch (e) { personalRecords = {}; }

function savePersonalRecord(key, lapTime) {
  const prev = personalRecords[key];
  if (!prev || lapTime < prev) {
    personalRecords[key] = lapTime;
    try { localStorage.setItem('apexpro.records', JSON.stringify(personalRecords)); } catch (e) { /* ignore */ }
    return true;
  }
  return false;
}

// --- 3. Flow State & Screen Transitions ---
const ALL_FLOW_SCREENS = ['scr-splash', 'scr-loading', 'scr-home', 'scr-garage', 'scr-setup', 'scr-pause', 'scr-results', 'scr-records', 'scr-multiplayer'];
const flowState = {
  screen: 'splash',       // 'splash' | 'home' | 'garage' | 'setup' | 'racing' | 'pause' | 'results' | 'records' | 'multiplayer'
  garageReturnTo: 'home', // 'home' | 'setup' | 'multiplayer'
  recordsReturnTo: 'home',// 'home' | 'results'
  setupStep: 1,           // 1: edition, 2: mode, 3: circuit, 4: garage
  trackCategory: 'all',   // 'all' | 'f1_real' | 'original'
  garageClassTab: 'GT3',  // 'STREET' | 'GT3' | 'HYPER' | 'LMP1' | 'F1' | 'all'
  garageSubFilter: 'all', // e.g. 'all' | 'track' | 'road' | 'prototype' | 'vision' | 'classic' | 'suv'
  garageBrandFilter: 'all',
  garageSearch: '',
  garageGridOpen: false,
  recFilter: {
    tab: 'leaderboard',
    circuitId: 'monza',
    carClass: 'GT3',
    edition: 'realistic',
    weather: 'dry',
    dedupeMode: 'per_car',
    tireFilter: 'all',
    pinnedOnly: false
  },
  resultPage: 0,          // 0, 1, 2
  lastResult: null,
  loadingActive: false
};

const LOADING_TIPS = [
  '入彎前請留意上方「彎道極限速度」，提前在直線尾端重踩煞車減速，避免超速推頭外拋。',
  '娛樂氮氣模式中，按住 Shift（或手遊「💨甩尾」鈕）滑入彎心即可快速充能氮氣 NOS！',
  '真實沉浸模式遵循 GT3 荷重轉移：煞車時前輪抓地力增加，微帶煞車入彎（Trail Braking）能顯著提升指向性。',
  '在主頁或車庫畫面中，您可以直接用滑鼠或手指左右拖曳 3D 賽車，360° 檢視車身細節。',
  '追近前車 28 公尺內可觸發「⚡ 尾流效應 (Slipstream)」，風阻降低 28% 助您直線抽頭超車！',
  '偏離賽道陷入草地或護欄時，可隨時按下 [R] 鍵或點擊頂部橫幅立即重回賽道中央。'
];

function showFlowScreen(target) {
  if (window.__apexTrace) window.__apexTrace('flow.js', 'showFlowScreen:' + target);
  if (simState.inspectMode && typeof exitInspectMode === 'function') {
    exitInspectMode();
  }
  flowState.screen = target;
  const map = {
    splash: 'scr-splash',
    home: 'scr-home',
    garage: 'scr-garage',
    setup: 'scr-setup',
    pause: 'scr-pause',
    results: 'scr-results',
    records: 'scr-records',
    multiplayer: 'scr-multiplayer'
  };
  const activeId = map[target] || null;
  ALL_FLOW_SCREENS.forEach(id => {
    if (id === 'scr-loading') return;
    const el = document.getElementById(id);
    if (!el) return;
    if (id === activeId) {
      el.classList.remove('hidden');
      requestAnimationFrame(() => el.classList.add('af-in'));
    } else {
      el.classList.remove('af-in');
      el.classList.add('hidden');
    }
  });

  // Hide legacy modals whenever switching flow screens
  ['modal-menu', 'modal-telemetry', 'modal-spec', 'modal-garage'].forEach(id => {
    const m = document.getElementById(id);
    if (m) m.classList.add('hidden');
  });

  const pauseBtn = document.getElementById('btn-pause-race');
  const hudHeader = document.getElementById('game-hud-header');

  if (target === 'racing') {
    simState.inShowcaseMode = false;
    simState.paused = false;
    if (hudHeader) hudHeader.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.remove('hidden');
    setInputMode(clientDevice.isMobile);
  } else if (target === 'pause') {
    simState.inShowcaseMode = false;
    simState.paused = true;
    if (hudHeader) hudHeader.classList.remove('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
  } else {
    // Showcase screens (splash / home / garage / setup / results)
    simState.inShowcaseMode = true;
    simState.paused = true;
    simState.countdownActive = false;
    simState.showcaseStyle = target === 'garage' ? 'garage' : (target === 'results' ? 'results' : 'home');
    if (hudHeader) hudHeader.classList.add('hidden');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    const startOverlay = document.getElementById('start-lights-overlay');
    if (startOverlay) startOverlay.classList.add('hidden');
    const mobileOverlay = document.getElementById('mobile-gamepad-overlay');
    if (mobileOverlay) mobileOverlay.classList.add('hidden');
    const pcBottomHud = document.getElementById('pc-bottom-hud');
    if (pcBottomHud) {
      pcBottomHud.classList.add('hidden');
      pcBottomHud.classList.remove('flex');
    }
  }
}

function clearAllHeldInputs() {
  Object.keys(keyboardKeys).forEach(k => { keyboardKeys[k] = false; });
  Object.keys(touchKeys).forEach(k => { touchKeys[k] = false; });
  simState.throttleInput = 0;
  simState.brakeInput = 0;
}

function runLoadingTransition(opts, onMidpoint, onComplete) {
  if (flowState.loadingActive) return;
  flowState.loadingActive = true;
  const scr = document.getElementById('scr-loading');
  const titleEl = document.getElementById('lbl-loading-title');
  const subEl = document.getElementById('lbl-loading-sub');
  const tipEl = document.getElementById('lbl-loading-tip');
  const barEl = document.getElementById('bar-loading');
  const pctEl = document.getElementById('lbl-loading-pct');

  if (titleEl) titleEl.textContent = (opts && opts.title) || 'LOADING';
  if (subEl) subEl.textContent = (opts && opts.sub) || '正在準備 3D 賽道與車輛資源…';
  if (tipEl) tipEl.textContent = LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
  if (barEl) barEl.style.width = '0%';
  if (pctEl) pctEl.textContent = '0%';

  if (scr) {
    scr.classList.remove('hidden');
    requestAnimationFrame(() => scr.classList.add('af-in'));
  }

  const duration = (opts && opts.duration) || 950;
  const t0 = performance.now();
  let midCalled = false;
  let finished = false;

  // Failsafe watchdog timer (max duration + 600ms)
  const watchdog = setTimeout(() => {
    if (!finished) {
      finished = true;
      flowState.loadingActive = false;
      if (scr) {
        scr.classList.remove('af-in');
        scr.classList.add('hidden');
      }
      try { if (!midCalled && onMidpoint) onMidpoint(); } catch (e) { console.error(e); }
      try { if (onComplete) onComplete(); } catch (e) { console.error(e); }
    }
  }, duration + 650);

  function tick(now) {
    if (finished) return;
    const p = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 2.2);
    const pct = Math.round(eased * 100);
    if (barEl) barEl.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';

    if (!midCalled && p >= 0.45) {
      midCalled = true;
      try { if (onMidpoint) onMidpoint(); } catch (e) { console.error(e); }
    }
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      finished = true;
      clearTimeout(watchdog);
      setTimeout(() => {
        if (scr) scr.classList.remove('af-in');
        setTimeout(() => {
          if (scr) scr.classList.add('hidden');
          flowState.loadingActive = false;
          if (onComplete) onComplete();
        }, 220);
      }, 120);
    }
  }
  requestAnimationFrame(tick);
}

// --- 4. Home Screen (Garage Showcase) ---
function renderHomeScreen() {
  const meta = getActiveCarMeta();
  const clsEl = document.getElementById('lbl-home-class');
  const nameEl = document.getElementById('lbl-home-carname');
  const statsEl = document.getElementById('home-mini-stats');
  const recEl = document.getElementById('lbl-home-records');

  if (clsEl) {
    clsEl.textContent = meta.classLabel;
    clsEl.style.color = getClassAccentColor(meta.carClass);
  }
  if (nameEl) nameEl.textContent = meta.name;
  if (recEl) {
    const dbCount = (window.ApexRecords && typeof window.ApexRecords.getTotalValidCount === 'function')
      ? window.ApexRecords.getTotalValidCount()
      : 0;
    recEl.textContent = String(Math.max(dbCount, Object.keys(personalRecords).length));
  }

  if (statsEl) {
    const items = [
      { k: 'TOP SPEED 極速', v: meta.specs.topSpeed },
      { k: '0-100 KM/H', v: meta.specs.accel },
      { k: 'POWER 馬力', v: meta.specs.power },
      { k: 'HANDLING 操控', v: meta.bars.handling + ' / 100' }
    ];
    statsEl.innerHTML = items.map(it =>
      `<div class="af-mini-stat"><div class="k">${it.k}</div><div class="v">${it.v}</div></div>`
    ).join('');
  }
}

function enterHomeScreen(withLoading, loadingOpts) {
  clearAllHeldInputs();
  if (typeof simState !== 'undefined' && simState && simState.mode === 'multiplayer') {
    if (window.apexNet) window.apexNet.leaveRoom();
    if (typeof setGameMode === 'function') setGameMode('time_attack');
    else simState.mode = 'time_attack';
    simState._mpRaceStartServerMs = 0;
  }
  const doEnter = () => {
    resetSession(false);
    renderHomeScreen();
    showFlowScreen('home');
  };
  if (withLoading) {
    runLoadingTransition(
      loadingOpts || { title: 'RETURNING TO GARAGE', sub: '正在載入主頁車庫展示中心…', duration: 850 },
      doEnter
    );
  } else {
    doEnter();
  }
}

// --- 5. Garage Screen (Car Inspection & Selection) ---
function selectCarById(presetId) {
  const cat = CAR_CATALOG.find(c => c.id === presetId);
  if (cat && !cat.unlocked) return;
  const preset = CAR_MODEL_PRESETS.find(p => p.id === presetId);
  if (preset) {
    const needsLoad = (carAssetState.loadedPresetId !== preset.id) || !carAssetState.template;
    carAssetState.presetId = preset.id;
    carAssetState.label = preset.label;
    if (preset.defaultPaint) carAssetState.paintHex = preset.defaultPaint;
    carAssetState.livery = 'original';
    if (!preset.urls) {
      useProceduralVehicle(preset.id, preset.label, preset.defaultPaint || (cat && cat.defaultPaint) || null);
    } else if (needsLoad) {
      loadVehicleFromURLs(preset.urls, preset.label, preset.id);
    } else if (typeof applyCustomLiveryColors === 'function') {
      applyCustomLiveryColors(null, null);
    }
  }
  if (typeof window.syncAIMultiCarModels === 'function') {
    window.syncAIMultiCarModels(presetId);
  }
  if (typeof simState !== 'undefined' && simState) {
    simState.gear = 1;
    const cpSel = (typeof getCurrentCarHandling === 'function') ? getCurrentCarHandling() : null;
    const dtSel = (typeof getCarDrivetrainSpec === 'function') ? getCarDrivetrainSpec(cpSel) : { idleRpm: 1200 };
    simState.rpm = dtSel.idleRpm || 1200;
  }
  if (typeof window.rebuildProBenchmarkForCurrentCar === 'function') {
    window.rebuildProBenchmarkForCurrentCar();
  }
  if (cat && cat.carClass) {
    if (flowState.garageClassTab !== 'all' && flowState.garageClassTab !== cat.carClass) {
      flowState.garageClassTab = cat.carClass;
      flowState.garageSubFilter = 'all';
      flowState.garageBrandFilter = 'all';
    }
    if (flowState.garageSubFilter !== 'all' && cat.subGroup !== flowState.garageSubFilter) {
      flowState.garageSubFilter = 'all';
    }
    if (flowState.garageBrandFilter !== 'all' && cat.brand !== flowState.garageBrandFilter) {
      flowState.garageBrandFilter = 'all';
    }
  }
  renderGarageScreen();
  renderHomeScreen();
}

function renderGarageScreen() {
  const meta = getActiveCarMeta();
  const isRaceSelect = (flowState.garageReturnTo === 'setup');

  const kickerEl = document.getElementById('lbl-garage-kicker');
  const titleEl = document.getElementById('lbl-garage-title');
  const stepsEl = document.getElementById('garage-steps');
  const confirmBtn = document.getElementById('btn-garage-confirm');
  const backBtn = document.getElementById('btn-garage-back');

  if (isRaceSelect) {
    if (kickerEl) kickerEl.textContent = 'STEP 4 / 4 · CAR SELECTION';
    if (titleEl) titleEl.textContent = '選擇出戰賽車';
    if (stepsEl) stepsEl.innerHTML = '<i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i>';
    if (confirmBtn) confirmBtn.innerHTML = '🏁 確認出戰・進入賽道 ➔';
    if (backBtn) backBtn.textContent = '◀ 上一步 (選賽道)';
  } else {
    if (kickerEl) kickerEl.textContent = 'GARAGE & PERFORMANCE';
    if (titleEl) titleEl.textContent = '車庫與性能檢視';
    if (stepsEl) stepsEl.innerHTML = '';
    if (confirmBtn) confirmBtn.innerHTML = '✔ 確認座駕・返回主頁';
    if (backBtn) backBtn.textContent = '◀ 返回主頁';
  }

  const clsEl = document.getElementById('lbl-gar-class');
  const nameEl = document.getElementById('lbl-gar-name');
  const origEl = document.getElementById('lbl-gar-origin');
  const descEl = document.getElementById('lbl-gar-desc');
  const specGrid = document.getElementById('gar-spec-grid');
  const statBars = document.getElementById('gar-stat-bars');
  const stripEl = document.getElementById('gar-car-strip');

  if (clsEl) {
    clsEl.textContent = meta.classLabel;
    clsEl.style.color = getClassAccentColor(meta.carClass);
  }
  if (nameEl) nameEl.textContent = meta.name;
  if (origEl) origEl.textContent = meta.origin;
  if (descEl) descEl.textContent = meta.desc;

  const perfProfEl = document.getElementById('gar-perf-profile');
  if (perfProfEl && typeof getCarPerformanceProfile === 'function') {
    const pf = getCarPerformanceProfile(carAssetState.presetId);
    const accCol = getClassAccentColor(pf.carClass);
    perfProfEl.innerHTML = `
      <div class="af-perf-pi-row">
        <span class="af-perf-pi-num" style="--pi-accent:${accCol};"><small>PI</small>${pf.pi}</span>
        <span style="font-size:11px;font-weight:800;color:${accCol};">${pf.carClass} 級 · ${pf.band ? pf.band.range : ''}</span>
      </div>
      <div class="af-strength-chips">
        ${pf.strengthTags.map(t => `<span class="af-strength-chip">${t}</span>`).join('')}
        <span class="af-tradeoff-chip">${pf.tradeoffTag}</span>
      </div>
      <div class="af-perf-track-note">${pf.bestTrackType}</div>
      <div style="font-size:10px;color:#94a3b8;margin-top:3px;">同級距 PI 接近但性格迥異，請依賽道特性搭配強項選車</div>
    `;
  }

  if (specGrid) {
    const specs = [
      { k: '最高極速 TOP SPEED', v: meta.specs.topSpeed },
      { k: '0–100 KM/H 加速', v: meta.specs.accel },
      { k: '最大馬力 POWER', v: meta.specs.power },
      { k: '空車重量 WEIGHT', v: meta.specs.weight }
    ];
    specGrid.innerHTML = specs.map(s =>
      `<div class="af-spec"><div class="k">${s.k}</div><div class="v">${s.v}</div></div>`
    ).join('');
  }

  if (statBars) {
    const rows = [
      { label: '極速表現', val: meta.bars.speed },
      { label: '加速爆發', val: meta.bars.accel },
      { label: '過彎操控', val: meta.bars.handling },
      { label: '煞車制動', val: meta.bars.braking }
    ];
    statBars.innerHTML = rows.map(r =>
      `<div class="af-stat-row">
              <span>${r.label}</span>
              <div class="af-stat-track"><div class="af-stat-fill" style="width:${r.val}%"></div></div>
              <b>${r.val}</b>
            </div>`
    ).join('');
  }

  const paintCustEl = document.getElementById('gar-paint-customizer');
  if (paintCustEl) {
    const isOrigLivery = (carAssetState.livery === 'original');
    const curPaint = (carAssetState.paintHex || '#ef4444').toLowerCase();
    const curRim = (carAssetState.rimHex || '#94a3b8').toLowerCase();
    const curPat = carAssetState.liveryPattern || 'solid';
    const curAcc = (carAssetState.accentHex || '#f8fafc').toLowerCase();
    const LIVERY_PATTERNS = [
      { id: 'solid', label: '單色清漆' },
      { id: 'duotone', label: '雙色金屬' },
      { id: 'stripes', label: '賽車條紋' },
      { id: 'esports', label: '電競幾何' }
    ];
    const ACCENT_SWATCHES = ['#f8fafc', '#fbbf24', '#38bdf8', '#ef4444'];
    paintCustEl.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;">
              <span style="font-size:11px;color:#cbd5e1;font-weight:700;">🎨 車身烤漆 (Clearcoat)</span>
              <div style="display:flex;align-items:center;gap:5px;">
                <button type="button" data-pick-paint="original" title="保留賽車原廠彩繪貼圖 / 出廠配色"
                  style="padding:2px 7px;border-radius:6px;font-size:10px;font-weight:700;background:${isOrigLivery ? 'rgba(56,189,248,0.22)' : 'rgba(15,23,42,0.85)'};color:${isOrigLivery ? '#38bdf8' : '#cbd5e1'};border:1px solid ${isOrigLivery ? '#38bdf8' : 'rgba(148,163,184,0.3)'};cursor:pointer;">
                  🏁 原廠
                </button>
                ${PAINT_SWATCHES.map(s => {
      const active = !isOrigLivery && (s.hex.toLowerCase() === curPaint);
      return `<button type="button" data-pick-paint="${s.hex}" title="${s.name} (MeshPhysical 清漆烤漆)"
                    style="width:21px;height:21px;border-radius:999px;background:${s.hex};border:${active ? '2.5px solid #fff' : '1.5px solid rgba(255,255,255,0.25)'};box-shadow:${active ? '0 0 10px ' + s.hex : 'none'};cursor:pointer;transition:transform 0.15s;transform:${active ? 'scale(1.14)' : 'scale(1)'};"></button>`;
    }).join('')}
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;flex-wrap:wrap;">
              <span style="font-size:11px;color:#cbd5e1;font-weight:700;">🏁 賽車彩繪樣式</span>
              <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
                ${LIVERY_PATTERNS.map(p => {
      const active = !isOrigLivery && (curPat === p.id);
      return `<button type="button" data-pick-pattern="${p.id}"
                    style="padding:2px 7px;border-radius:6px;font-size:10px;font-weight:700;background:${active ? 'rgba(249,115,22,0.22)' : 'rgba(15,23,42,0.85)'};color:${active ? '#fb923c' : '#cbd5e1'};border:1px solid ${active ? '#fb923c' : 'rgba(148,163,184,0.3)'};cursor:pointer;">${p.label}</button>`;
    }).join('')}
                ${ACCENT_SWATCHES.map(hex => {
      const active = !isOrigLivery && (curAcc === hex.toLowerCase());
      return `<button type="button" data-pick-accent="${hex}" title="副色塗裝 ${hex}"
                    style="width:15px;height:15px;border-radius:4px;background:${hex};border:${active ? '2px solid #fff' : '1px solid rgba(255,255,255,0.25)'};cursor:pointer;"></button>`;
    }).join('')}
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <span style="font-size:11px;color:#cbd5e1;font-weight:700;">⚙️ 輪框塗裝</span>
              <div style="display:flex;gap:6px;">
                ${RIM_SWATCHES.map(s => {
      const active = s.hex.toLowerCase() === curRim;
      return `<button type="button" data-pick-rim="${s.hex}" title="${s.name}"
                    style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:${active ? 'rgba(56,189,248,0.2)' : 'rgba(15,23,42,0.85)'};color:${active ? '#38bdf8' : '#cbd5e1'};border:1px solid ${active ? '#38bdf8' : 'rgba(148,163,184,0.3)'};cursor:pointer;display:flex;align-items:center;gap:4px;">
                    <i style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${s.hex};"></i>${s.name}
                  </button>`;
    }).join('')}
              </div>
            </div>
            ${typeof TIRE_COMPOUNDS !== 'undefined' ? `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span style="font-size:11px;color:#cbd5e1;font-weight:700;">🛞 輪胎配方</span>
              <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
                ${Object.values(TIRE_COMPOUNDS).map(tc => {
      const active = (simState.tireCompound || 'medium') === tc.id;
      return `<button type="button" data-pick-tire="${tc.id}" title="${tc.summary}"
                    style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:${active ? 'rgba(15,23,42,0.95)' : 'rgba(15,23,42,0.75)'};color:${active ? tc.color : '#94a3b8'};border:1px solid ${active ? tc.color : 'rgba(148,163,184,0.28)'};cursor:pointer;display:flex;align-items:center;gap:4px;">
                    <i style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${tc.color};"></i>${tc.code} · ${tc.peakMuG.toFixed(2)}G
                  </button>`;
    }).join('')}
              </div>
            </div>` : ''}
            ${typeof simState !== 'undefined' && simState.carSetup ? (() => {
        const cs = simState.carSetup;
        const aeroLabels = { 1: '1 極低', 2: '2 低', 3: '3 均衡', 4: '4 高', 5: '5 極高' };
        const matchPreset = (typeof CAR_SETUP_PRESETS !== 'undefined')
          ? Object.values(CAR_SETUP_PRESETS).find(p => p.aeroWing === cs.aeroWing && p.brakeBias === cs.brakeBias && p.gearRatio === cs.gearRatio && p.suspension === cs.suspension)
          : null;
        return `
              <div class="af-setup-box">
                <div class="af-tune-row">
                  <span style="font-weight:700;">🛠 賽車設定調校</span>
                  <div class="af-pill-grp">
                    ${Object.values(CAR_SETUP_PRESETS).map(p =>
          `<button type="button" data-setup-preset="${p.id}" class="af-pill-btn is-amber ${matchPreset && matchPreset.id === p.id ? 'is-active' : ''}">${p.label}</button>`
        ).join('')}
                  </div>
                </div>
                <div class="af-tune-row">
                  <span>✈ 空力下壓</span>
                  <div class="af-pill-grp">
                    ${[1, 2, 3, 4, 5].map(w =>
          `<button type="button" data-setup-aero="${w}" class="af-pill-btn ${cs.aeroWing === w ? 'is-active' : ''}">${aeroLabels[w]}</button>`
        ).join('')}
                  </div>
                </div>
                <div class="af-tune-row">
                  <span>🛑 煞車平衡 (前軸)</span>
                  <div class="af-pill-grp">
                    ${[54, 56, 58, 60, 62].map(b =>
          `<button type="button" data-setup-bias="${b}" class="af-pill-btn ${cs.brakeBias === b ? 'is-active' : ''}">${b}%</button>`
        ).join('')}
                  </div>
                </div>
                <div class="af-tune-row">
                  <span>⚙ 終傳齒比</span>
                  <div class="af-pill-grp">
                    ${[['short', '密齒 (加速)'], ['standard', '標準'], ['long', '疏齒 (極速)']].map(([id, lbl]) =>
          `<button type="button" data-setup-gear="${id}" class="af-pill-btn ${cs.gearRatio === id ? 'is-active' : ''}">${lbl}</button>`
        ).join('')}
                  </div>
                </div>
                <div class="af-tune-row">
                  <span>🔩 懸吊防傾</span>
                  <div class="af-pill-grp">
                    ${[['soft', '偏軟 (吃路緣)'], ['balanced', '均衡'], ['stiff', '偏硬 (指向)']].map(([id, lbl]) =>
          `<button type="button" data-setup-susp="${id}" class="af-pill-btn ${cs.suspension === id ? 'is-active' : ''}">${lbl}</button>`
        ).join('')}
                  </div>
                </div>
              </div>`;
      })() : ''}
          `;
    paintCustEl.querySelectorAll('[data-setup-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof applyCarSetupPreset === 'function') applyCarSetupPreset(btn.getAttribute('data-setup-preset'));
        renderGarageScreen();
      });
    });
    paintCustEl.querySelectorAll('[data-setup-aero]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof setCarSetup === 'function') setCarSetup({ aeroWing: Number(btn.getAttribute('data-setup-aero')) });
        renderGarageScreen();
      });
    });
    paintCustEl.querySelectorAll('[data-setup-bias]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof setCarSetup === 'function') setCarSetup({ brakeBias: Number(btn.getAttribute('data-setup-bias')) });
        renderGarageScreen();
      });
    });
    paintCustEl.querySelectorAll('[data-setup-gear]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof setCarSetup === 'function') setCarSetup({ gearRatio: btn.getAttribute('data-setup-gear') });
        renderGarageScreen();
      });
    });
    paintCustEl.querySelectorAll('[data-setup-susp]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof setCarSetup === 'function') setCarSetup({ suspension: btn.getAttribute('data-setup-susp') });
        renderGarageScreen();
      });
    });
    paintCustEl.querySelectorAll('[data-pick-paint]').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.getAttribute('data-pick-paint');
        if (typeof applyCustomLiveryColors === 'function') {
          applyCustomLiveryColors(hex, null);
        }
        renderGarageScreen();
      });
    });
    paintCustEl.querySelectorAll('[data-pick-pattern]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pat = btn.getAttribute('data-pick-pattern');
        if (typeof applyCustomLiveryColors === 'function') {
          applyCustomLiveryColors(null, null, pat, null);
        }
        renderGarageScreen();
      });
    });
    paintCustEl.querySelectorAll('[data-pick-accent]').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.getAttribute('data-pick-accent');
        if (typeof applyCustomLiveryColors === 'function') {
          applyCustomLiveryColors(null, null, null, hex);
        }
        renderGarageScreen();
      });
    });
    paintCustEl.querySelectorAll('[data-pick-rim]').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.getAttribute('data-pick-rim');
        if (typeof applyCustomLiveryColors === 'function') {
          applyCustomLiveryColors(null, hex);
        }
        renderGarageScreen();
      });
    });
    paintCustEl.querySelectorAll('[data-pick-tire]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = btn.getAttribute('data-pick-tire');
        if (typeof setTireCompound === 'function') {
          setTireCompound(tid);
        } else {
          simState.tireCompound = tid;
        }
        renderGarageScreen();
      });
    });
  }

  const chassisNoteEl = document.getElementById('lbl-gar-chassis-note');
  if (chassisNoteEl && typeof getCurrentCarHandling === 'function') {
    const hp = getCurrentCarHandling();
    const tp = (typeof getCurrentTireProfile === 'function') ? getCurrentTireProfile() : { label: 'Medium', peakMuG: 1.52 };
    const effMuG = hp.baseMuLat * (tp.peakMuG / 1.52);
    const ds = getCarDrivingStyleMeta(carAssetState.presetId);
    chassisNoteEl.innerHTML =
      `✔ ${meta.carClass || 'GT3'} 底盤：軸距 ${hp.wheelbase.toFixed(2)}m · ${tp.label} (${effMuG.toFixed(2)}G) · ${hp.weightKg}kg<br>` +
      `<span style="color:#fbbf24;font-weight:700;">🎯 ${ds.layoutLabel} · ${ds.absLabel} · ${ds.tcLabel} · ${ds.torqueLabel}</span> · ` +
      `<span style="color:#38bdf8;font-weight:700;">最佳路線：${ds.lineTag}</span><br>` +
      `<span style="color:#94a3b8;">💡 駕駛建議：${ds.tip}</span>`;
  }

  const catBarEl = document.getElementById('gar-category-bar');
  const bottomDockEl = document.getElementById('gar-bottom-dock');
  if (bottomDockEl) {
    bottomDockEl.classList.toggle('is-grid-open', !!flowState.garageGridOpen);
  }

  const activeTab = flowState.garageClassTab || 'GT3';
  const classPool = activeTab === 'all' ? CAR_CATALOG : CAR_CATALOG.filter(c => c.carClass === activeTab);
  const tabMeta = GARAGE_CLASS_META.find(g => g.id === activeTab) || GARAGE_CLASS_META[1];
  const subOpts = tabMeta.subOptions || [];
  if (flowState.garageSubFilter !== 'all' && !subOpts.some(s => s.id === flowState.garageSubFilter)) {
    flowState.garageSubFilter = 'all';
  }
  const subPool = (flowState.garageSubFilter === 'all')
    ? classPool
    : classPool.filter(c => c.subGroup === flowState.garageSubFilter);

  const brandCounts = {};
  subPool.forEach(c => {
    const b = c.brand || 'Other';
    brandCounts[b] = (brandCounts[b] || 0) + 1;
  });
  const availableBrands = Object.keys(brandCounts).sort();
  if (flowState.garageBrandFilter !== 'all' && !brandCounts[flowState.garageBrandFilter]) {
    flowState.garageBrandFilter = 'all';
  }

  const q = (flowState.garageSearch || '').trim().toLowerCase();
  const filteredCars = subPool.filter(c => {
    if (flowState.garageBrandFilter !== 'all' && c.brand !== flowState.garageBrandFilter) return false;
    if (!q) return true;
    const pf = (typeof getCarPerformanceProfile === 'function') ? getCarPerformanceProfile(c.id) : null;
    const pfStr = pf ? (pf.strengthTags.join(' ') + ' ' + pf.tradeoffTag + ' ' + pf.bestTrackType + ' pi ' + pf.pi).toLowerCase() : '';
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.brand || '').toLowerCase().includes(q) ||
      (c.shortTag || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q) ||
      pfStr.includes(q)
    );
  });

  if (catBarEl) {
    if (!document.getElementById('gar-cat-tabs-wrap')) {
      catBarEl.innerHTML = `
              <div class="af-gar-cls-row">
                <div class="af-gar-cls-tabs" id="gar-cat-tabs-wrap"></div>
                <div class="af-gar-actions">
                  <input id="input-gar-search" class="af-gar-search" type="search" placeholder="🔎 搜尋車廠 / 車型 / 強項..." autocomplete="off">
                  <span id="lbl-gar-match-count" style="font-size:11px;color:#94a3b8;font-variant-numeric:tabular-nums;padding:0 4px;"></span>
                  <button type="button" id="btn-gar-scroll-l" class="af-pill-btn" title="向左捲動">◀</button>
                  <button type="button" id="btn-gar-scroll-r" class="af-pill-btn" title="向右捲動">▶</button>
                  <button type="button" id="btn-gar-grid-toggle" class="af-pill-btn is-amber">⊞ 展開全部網格</button>
                </div>
              </div>
              <div class="af-gar-tools-row" id="gar-subfilter-wrap"></div>
            `;
      const inpSearch = document.getElementById('input-gar-search');
      if (inpSearch) {
        inpSearch.addEventListener('input', (ev) => {
          flowState.garageSearch = ev.target.value || '';
          renderGarageCarGridOnly();
        });
        inpSearch.addEventListener('keydown', (ev) => ev.stopPropagation());
      }
      const btnGrid = document.getElementById('btn-gar-grid-toggle');
      if (btnGrid) {
        btnGrid.addEventListener('click', () => {
          flowState.garageGridOpen = !flowState.garageGridOpen;
          renderGarageScreen();
        });
      }
      const btnL = document.getElementById('btn-gar-scroll-l');
      const btnR = document.getElementById('btn-gar-scroll-r');
      if (btnL) btnL.addEventListener('click', () => { if (stripEl) stripEl.scrollBy({ left: -380, behavior: 'smooth' }); });
      if (btnR) btnR.addEventListener('click', () => { if (stripEl) stripEl.scrollBy({ left: 380, behavior: 'smooth' }); });
    }

    const tabsWrap = document.getElementById('gar-cat-tabs-wrap');
    if (tabsWrap) {
      tabsWrap.innerHTML = GARAGE_CLASS_META.map(g => {
        const cnt = g.id === 'all' ? CAR_CATALOG.length : CAR_CATALOG.filter(c => c.carClass === g.id).length;
        const isAct = activeTab === g.id;
        return `<button type="button" data-gar-class="${g.id}" class="af-gar-cls-tab ${isAct ? 'is-active' : ''}" style="--tab-accent:${g.color};">
                <span>${g.icon}</span><span>${g.label}</span><span class="cnt">${cnt}</span>
              </button>`;
      }).join('');
    }

    const subWrap = document.getElementById('gar-subfilter-wrap');
    if (subWrap) {
      const subHtml = subOpts.length
        ? `<div class="af-gar-subfilters">
                  <span style="font-size:10px;color:#94a3b8;font-weight:700;">細分：</span>
                  ${subOpts.map(s => `<button type="button" data-gar-sub="${s.id}" class="af-pill-btn is-purple ${flowState.garageSubFilter === s.id ? 'is-active' : ''}">${s.label}</button>`).join('')}
                </div>`
        : '<div></div>';
      const brandHtml = availableBrands.length > 1
        ? `<div class="af-gar-subfilters">
                  <span style="font-size:10px;color:#94a3b8;font-weight:700;">車廠：</span>
                  <button type="button" data-gar-brand="all" class="af-pill-btn ${flowState.garageBrandFilter === 'all' ? 'is-active' : ''}">全部品牌</button>
                  ${availableBrands.map(b => `<button type="button" data-gar-brand="${b}" class="af-pill-btn ${flowState.garageBrandFilter === b ? 'is-active' : ''}">${b} (${brandCounts[b]})</button>`).join('')}
                </div>`
        : '';
      subWrap.innerHTML = `${subHtml}${brandHtml}`;
    }

    const inpSearch = document.getElementById('input-gar-search');
    if (inpSearch && document.activeElement !== inpSearch) {
      inpSearch.value = flowState.garageSearch || '';
    }
    const btnGrid = document.getElementById('btn-gar-grid-toggle');
    if (btnGrid) {
      btnGrid.classList.toggle('is-active', !!flowState.garageGridOpen);
      btnGrid.textContent = flowState.garageGridOpen ? '⊟ 收合單行' : '⊞ 展開網格';
    }
  }

  renderGarageCarGridOnly(filteredCars, classPool.length);
}

function renderGarageCarGridOnly(precomputedList, totalInClass) {
  const stripEl = document.getElementById('gar-car-strip');
  const activeTab = flowState.garageClassTab || 'GT3';
  let filteredCars = precomputedList;
  let poolTotal = totalInClass;
  if (!filteredCars) {
    const classPool = activeTab === 'all' ? CAR_CATALOG : CAR_CATALOG.filter(c => c.carClass === activeTab);
    poolTotal = classPool.length;
    const subPool = (flowState.garageSubFilter === 'all') ? classPool : classPool.filter(c => c.subGroup === flowState.garageSubFilter);
    const q = (flowState.garageSearch || '').trim().toLowerCase();
    filteredCars = subPool.filter(c => {
      if (flowState.garageBrandFilter !== 'all' && c.brand !== flowState.garageBrandFilter) return false;
      if (!q) return true;
      const pf = (typeof getCarPerformanceProfile === 'function') ? getCarPerformanceProfile(c.id) : null;
      const pfStr = pf ? (pf.strengthTags.join(' ') + ' ' + pf.tradeoffTag + ' ' + pf.bestTrackType + ' pi ' + pf.pi).toLowerCase() : '';
      return (c.name || '').toLowerCase().includes(q) || (c.brand || '').toLowerCase().includes(q) || (c.shortTag || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q) || pfStr.includes(q);
    });
  }
  const sortedCars = filteredCars.slice().sort((a, b) => {
    const pa = (typeof a.pi === 'number') ? a.pi : ((typeof getCarPerformanceProfile === 'function') ? getCarPerformanceProfile(a.id).pi : 600);
    const pb = (typeof b.pi === 'number') ? b.pi : ((typeof getCarPerformanceProfile === 'function') ? getCarPerformanceProfile(b.id).pi : 600);
    return pa - pb;
  });
  const matchLbl = document.getElementById('lbl-gar-match-count');
  if (matchLbl) {
    matchLbl.textContent = `顯示 ${sortedCars.length} / ${poolTotal} 台`;
  }
  if (stripEl) {
    const cards = sortedCars.map(c => {
      const active = (c.id === carAssetState.presetId);
      const accCol = getClassAccentColor(c.carClass);
      const pf = (typeof getCarPerformanceProfile === 'function') ? getCarPerformanceProfile(c.id) : { pi: c.pi || 600, strengthTags: ['⚖ 全能均衡'] };
      const cls = ['af-car-card', active ? 'is-active' : '', !c.unlocked ? 'is-locked' : ''].filter(Boolean).join(' ');
      return `<button type="button" class="${cls}" data-car-id="${c.id}" style="--car-accent:${accCol};">
              <div class="c"><span>${c.carClass}</span><span class="af-pi-badge">PI ${pf.pi}</span><span class="brand-tag">${c.brand || 'CUSTOM'}</span></div>
              <div class="n" title="${c.name}">${c.name}</div>
              <div class="m-specs"><span>⚡ ${c.specs.topSpeed}</span><span>🐎 ${c.specs.power}</span></div>
              <div class="af-strength-chips">${pf.strengthTags.map(t => `<span class="af-strength-chip">${t}</span>`).join('')}</div>
              <div class="t">${active && c.unlocked ? '✔ 目前座駕 · ' : ''}${c.shortTag}</div>
            </button>`;
    });
    if ((carAssetState.presetId === 'custom-file' || carAssetState.presetId === 'custom-url') && (activeTab === 'all' || activeTab === 'GT3')) {
      cards.push(`<button type="button" class="af-car-card is-active" data-car-id="${carAssetState.presetId}" style="--car-accent:#94a3b8;">
              <div class="c"><span>CUSTOM</span><span class="brand-tag">GLB</span></div>
              <div class="n">${carAssetState.label}</div>
              <div class="t">✔ 自訂 3D 模型使用中</div>
            </button>`);
    }
    stripEl.innerHTML = cards.length
      ? cards.join('')
      : `<div style="padding:18px 20px;color:#94a3b8;font-size:12px;">找不到符合條件的車輛，請嘗試清除搜尋字詞或切換分類。</div>`;
  }
}

window.__apexFlowOnGarageRefresh = function () {
  if (flowState.screen === 'garage') renderGarageScreen();
  if (flowState.screen === 'home') renderHomeScreen();
};

function openGarageScreen(fromWhere) {
  flowState.garageReturnTo = fromWhere || 'home';
  const activeMeta = getActiveCarMeta();
  flowState.garageClassTab = activeMeta.carClass || 'GT3';
  flowState.garageSubFilter = 'all';
  flowState.garageBrandFilter = 'all';
  flowState.garageSearch = '';
  flowState.garageGridOpen = false;
  renderGarageScreen();
  showFlowScreen('garage');
}

// --- 6. Step-by-Step Race Setup Wizard (Step 1: Edition -> Step 2: Mode -> Step 3: Track -> Step 4: Garage Car) ---
function openSetupStep(step) {
  flowState.setupStep = step;
  if (step === 4) {
    openGarageScreen('setup');
    return;
  }
  renderSetupStep(step);
  showFlowScreen('setup');
}

function renderSetupStep(step) {
  const kickerEl = document.getElementById('lbl-setup-kicker');
  const titleEl = document.getElementById('lbl-setup-title');
  const stepsEl = document.getElementById('setup-steps');
  const bodyEl = document.getElementById('setup-body');
  const backBtn = document.getElementById('btn-setup-back');

  if (stepsEl) {
    stepsEl.innerHTML = [1, 2, 3, 4].map(i => `<i class="${i <= step ? 'on' : ''}"></i>`).join('');
  }
  if (backBtn) {
    backBtn.textContent = step === 1 ? '◀ 返回主頁' : '◀ 上一步';
  }

  if (step === 1) {
    if (kickerEl) kickerEl.textContent = 'STEP 1 / 4 · DRIVING EXPERIENCE';
    if (titleEl) titleEl.textContent = '選擇駕駛模式';
    const isArcade = (simState.edition === 'arcade');
    bodyEl.innerHTML = `
            <div class="af-choice-grid" style="max-width:860px;">
              <div class="af-choice ${isArcade ? 'is-active' : ''}" style="--accent:#06b6d4;" data-pick-edition="arcade">
                <div class="ico">🔥</div>
                <div class="tag">ARCADE NITROUS EDITION</div>
                <div class="ttl">娛樂氮氣模式</div>
                <div class="dsc">
                  狂野飆車風格爽快調校！彎中按住甩尾鍵即可滑入彎心並自動充能氮氣（NOS），直線噴射極速突破 <strong>345 km/h</strong>，輪胎抓地力容錯更高、上手即享極速快感。
                </div>
                <div class="meta">
                  <span>💨 甩尾充能氮氣</span>
                  <span>🔥 NOS 極速 345 km/h</span>
                  <span>🛡 高抓地力防失控</span>
                </div>
                <div class="go">選擇娛樂模式 ➔</div>
              </div>

              <div class="af-choice ${!isArcade ? 'is-active' : ''}" style="--accent:#f59e0b;" data-pick-edition="realistic">
                <div class="ico">🏁</div>
                <div class="tag">REALISTIC GT3 SIMULATION</div>
                <div class="ttl">真實沉浸模式</div>
                <div class="dsc">
                  嚴格遵循真實 GT3 物理動力學（0–100 km/h 3.5 秒、0–300 km/h 40 秒）。體驗真實四輪荷重轉移、循跡煞車（Trail Braking）與超速入彎慣性推頭外拋，挑戰純粹賽道極限。
                </div>
                <div class="meta">
                  <span>⚖ 真實四輪荷重轉移</span>
                  <span>🛑 擬真煞車距離</span>
                  <span>📐 純粹抓地力極限</span>
                </div>
                <div class="go">選擇真實沉浸模式 ➔</div>
              </div>
            </div>`;
  } else if (step === 2) {
    if (kickerEl) kickerEl.textContent = 'STEP 2 / 4 · RACE FORMAT';
    if (titleEl) titleEl.textContent = '選擇賽事類型';
    const isTA = (simState.mode === 'time_attack');
    const diff = simState.aiDifficulty || 1.0;
    const ghost = simState.ghostTarget || 'both';
    bodyEl.innerHTML = `
            <div class="af-choice-grid" style="max-width:860px;">
              <div class="af-choice ${isTA ? 'is-active' : ''}" style="--accent:#ef4444;" data-pick-mode="time_attack">
                <div class="ico">⏱️</div>
                <div class="tag">SOLO CHRONO CHALLENGE</div>
                <div class="ttl">計時挑戰賽 (Time Attack)</div>
                <div class="dsc">
                  單圈極限刷圈模式！賽道上同時投射 <strong>PRO 官方基準幽靈車</strong>與您的<strong>個人最佳 PB 幽靈車</strong>，專注磨練最佳走線、煞車點與出彎時機。
                </div>
                <div class="af-diff-row" data-stop-prop="1">
                  <button type="button" class="af-diff ${ghost === 'both' ? 'is-active' : ''}" data-ghost="both">PRO + PB 雙幽靈</button>
                  <button type="button" class="af-diff ${ghost === 'pro' ? 'is-active' : ''}" data-ghost="pro">僅 PRO 幽靈</button>
                  <button type="button" class="af-diff ${ghost === 'pb' ? 'is-active' : ''}" data-ghost="pb">僅個人 PB</button>
                </div>
                <div class="go">進入賽道選擇 ➔</div>
              </div>

              <div class="af-choice ${!isTA ? 'is-active' : ''}" style="--accent:#f59e0b;" data-pick-mode="ai_race">
                <div class="ico">🏆</div>
                <div class="tag">2-LAP GT3 GRID CHAMPIONSHIP</div>
                <div class="ttl">與電腦競賽 (AI Race)</div>
                <div class="dsc">
                  與 3 位具備尾流超車與真實剛體碰撞防線的零失誤 GT3 AI 車手進行 <strong>2 圈爭先錦標賽</strong>！貼近卡位、輪對輪碰撞皆真實反映物理動量，考驗純粹走線與防守實力。
                </div>
                <div class="af-diff-row" data-stop-prop="1">
                  <button type="button" class="af-diff ${diff < 0.96 ? 'is-active' : ''}" data-aidiff="0.92">業餘 (新手友善)</button>
                  <button type="button" class="af-diff ${diff >= 0.96 && diff <= 1.04 ? 'is-active' : ''}" data-aidiff="1.0">專業 (標準 PRO AI)</button>
                  <button type="button" class="af-diff ${diff > 1.04 ? 'is-active' : ''}" data-aidiff="1.10">頂尖 (極限挑戰)</button>
                </div>
                <div class="go">進入賽道選擇 ➔</div>
              </div>
            </div>`;
  } else if (step === 3) {
    if (kickerEl) kickerEl.textContent = 'STEP 3 / 4 · CIRCUIT SELECTION';
    if (titleEl) titleEl.textContent = '選擇比賽賽道';
    const buildTrackSvg = (circuit, accent) => {
      const pts = circuit && circuit.points;
      if (!pts || !pts.length) return '';
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      pts.forEach(p => {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
      });
      const w = Math.max(1, maxX - minX), h = Math.max(1, maxZ - minZ);
      const pad = 14, vw = 180, vh = 96;
      const sc = Math.min((vw - pad * 2) / w, (vh - pad * 2) / h);
      const ox = (vw - w * sc) * 0.5 - minX * sc;
      const oy = (vh - h * sc) * 0.5 - minZ * sc;
      const coords = pts.map(p => `${(p.x * sc + ox).toFixed(1)},${(p.z * sc + oy).toFixed(1)}`).join(' ');
      const sx = (pts[0].x * sc + ox).toFixed(1), sy = (pts[0].z * sc + oy).toFixed(1);
      return `<svg viewBox="0 0 ${vw} ${vh}" class="af-track-svg" aria-hidden="true">
              <polygon points="${coords}" fill="none" stroke="rgba(148,163,184,0.22)" stroke-width="7" stroke-linejoin="round"/>
              <polygon points="${coords}" fill="none" stroke="${accent}" stroke-width="2.6" stroke-linejoin="round"/>
              <circle cx="${sx}" cy="${sy}" r="4.2" fill="#ffffff" stroke="${accent}" stroke-width="2"/>
            </svg>`;
    };
    const carClassTag = (typeof getActiveCarMeta().carClass === 'string' && getActiveCarMeta().carClass) || 'GT3';
    const isWet = (simState.weather === 'wet');
    const curSurf = simState.surfaceState || 'fast';
    const curCat = flowState.trackCategory || 'all';
    const cond = (typeof getSessionConditionsSnapshot === 'function') ? getSessionConditionsSnapshot() : null;
    const visibleCircuits = CIRCUITS.map((c, idx) => ({ c, idx })).filter(item =>
      curCat === 'all' || (item.c.category || 'f1_real') === curCat
    );
    const f1Count = CIRCUITS.filter(c => c.category === 'f1_real').length;
    const origCount = CIRCUITS.length - f1Count;
    bodyEl.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:0 auto 10px;flex-wrap:wrap;">
              <span style="font-size:12px;font-weight:800;color:#cbd5e1;">🌦 天候：</span>
              <button type="button" data-pick-weather="dry" style="padding:5px 12px;border-radius:10px;font-size:11px;font-weight:800;cursor:pointer;border:1.5px solid ${!isWet ? '#fbbf24' : 'rgba(148,163,184,0.28)'};background:${!isWet ? 'rgba(251,191,36,0.18)' : 'rgba(15,23,42,0.85)'};color:${!isWet ? '#fde68a' : '#94a3b8'};">
                ☀ 乾地 DRY
              </button>
              <button type="button" data-pick-weather="wet" style="padding:5px 12px;border-radius:10px;font-size:11px;font-weight:800;cursor:pointer;border:1.5px solid ${isWet ? '#38bdf8' : 'rgba(148,163,184,0.28)'};background:${isWet ? 'rgba(56,189,248,0.2)' : 'rgba(15,23,42,0.85)'};color:${isWet ? '#7dd3fc' : '#94a3b8'};">
                🌧 雨戰 WET (-28% 抓地)
              </button>
              <span style="font-size:12px;font-weight:800;color:#cbd5e1;margin-left:6px;">🛣 路面狀態：</span>
              ${[['green', '綠地 98%'], ['fast', '標準 100%'], ['optimum', '最佳橡膠 102%']].map(([sid, slbl]) =>
      `<button type="button" data-pick-surface="${sid}" ${isWet ? 'disabled' : ''} class="af-pill-btn is-amber ${!isWet && curSurf === sid ? 'is-active' : ''}">${slbl}</button>`
    ).join('')}
              ${cond ? `<span class="af-chip" style="font-size:10px;">🌡 氣溫 ${cond.ambientTempC}°C / 路面 ${cond.trackTempC}°C</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:0 auto 14px;flex-wrap:wrap;">
              <button type="button" data-pick-cat="all" class="af-pill-btn is-amber ${curCat === 'all' ? 'is-active' : ''}">🌍 全部賽道 (${CIRCUITS.length})</button>
              <button type="button" data-pick-cat="f1_real" class="af-pill-btn is-amber ${curCat === 'f1_real' ? 'is-active' : ''}">🏎 F1 1:1 真實遙測 (${f1Count})</button>
              <button type="button" data-pick-cat="original" class="af-pill-btn is-amber ${curCat === 'original' ? 'is-active' : ''}">🗻 經典特色山道 (${origCount})</button>
            </div>
            <div class="af-choice-grid" style="max-width:1240px;">
              ${visibleCircuits.map(({ c, idx }) => {
      const accent = c.cardAccent || '#38bdf8';
      let pbVal = null;
      if (window.ApexRecords && typeof window.ApexRecords.getClassLeaderboard === 'function') {
        const board = window.ApexRecords.getClassLeaderboard({
          circuitId: c.id,
          carClass: carClassTag,
          edition: simState.edition,
          weather: simState.weather,
          dedupeMode: 'all'
        });
        if (board && board.entries && board.entries.length > 0) {
          pbVal = board.entries[0].record.timing.lapTime;
        }
      }
      if (!pbVal && !isWet) {
        const pbKey = `${idx}_${simState.edition}_${carClassTag}`;
        const legacyPbKey = `${idx}_${simState.edition}`;
        pbVal = personalRecords[pbKey] || (carClassTag === 'GT3' ? personalRecords[legacyPbKey] : null);
      }
      const estPro = (typeof window.estimateClassProLapTime === 'function')
        ? window.estimateClassProLapTime(idx, carClassTag, simState.weather)
        : c.proLapTime;
      return `
                  <div class="af-choice ${currentCircuitIndex === idx ? 'is-active' : ''}" style="--accent:${accent};" data-pick-track="${idx}">
                    ${buildTrackSvg(c, accent)}
                    <div class="ico">${c.cardIcon || '🏁'}</div>
                    <div class="tag">${c.country || ''} · ${c.cardTag || c.badgeText}</div>
                    <div class="ttl">${c.cardTitle || c.name}</div>
                    <div class="dsc">${c.cardDesc || ''}</div>
                    <div class="meta">
                      <span>📏 ${c.lengthKm || '--'}km · 寬${c.width}m</span>
                      <span>⛰ 高差 ${c.elevationM || '--'}m</span>
                      <span>⏱ PRO(${carClassTag}) ${formatLapTime(estPro)}</span>
                      ${pbVal ? `<span style="color:#fbbf24;">🏆 最佳(${carClassTag}) ${formatLapTime(pbVal)}</span>` : ''}
                    </div>
                    <div class="go">選擇此賽道・前往選車 ➔</div>
                  </div>`;
    }).join('')}
            </div>`;
  }
}

// --- 7. Launch Race & In-Game Pause ---
function startConfiguredRace(withLoading) {
  soundEngine.init();
  clearAllHeldInputs();
  if (typeof window.rebuildProBenchmarkForCurrentCar === 'function') {
    window.rebuildProBenchmarkForCurrentCar();
  }
  const carMeta = getActiveCarMeta();
  const modeTitle = simState.mode === 'ai_race' ? '2 圈電腦錦標賽' : '單圈計時挑戰賽';
  const edTitle = simState.edition === 'arcade' ? '娛樂氮氣模式' : '真實沉浸模式';

  const beginSession = () => {
    showFlowScreen('racing');
    resetSession(true);
  };

  if (withLoading) {
    runLoadingTransition(
      {
        title: currentCircuit.name,
        sub: `${edTitle} · ${modeTitle} · 座駕：${carMeta.name}`,
        duration: 1150
      },
      beginSession
    );
  } else {
    beginSession();
  }
}

function openPauseMenu() {
  if (flowState.screen !== 'racing') return;
  clearAllHeldInputs();
  const carMeta = getActiveCarMeta();
  const edTitle = simState.edition === 'arcade' ? '🔥 娛樂氮氣模式' : '🏁 真實沉浸模式';
  const modeTitle = simState.mode === 'ai_race' ? `🏆 電腦錦標賽 (第 ${simState.lap}/${simState.totalRaceLaps} 圈)` : '⏱️ 計時挑戰賽';
  const infoEl = document.getElementById('lbl-pause-info');
  if (infoEl) {
    infoEl.innerHTML = `<div><strong>${currentCircuit.name}</strong> (${currentCircuit.difficultyStars})</div>
            <div>${edTitle} · ${modeTitle}</div>
            <div>座駕：${carMeta.name}</div>`;
  }
  showFlowScreen('pause');
}

function resumeFromPause() {
  if (flowState.screen !== 'pause') return;
  soundEngine.init();
  showFlowScreen('racing');
}

// Authoritative ESC / Pause Menu Handler
function toggleMenuModal() {
  if (flowState.loadingActive) return;
  const modalTel = document.getElementById('modal-telemetry');
  if (modalTel && !modalTel.classList.contains('hidden')) {
    modalTel.classList.add('hidden');
    if (flowState.screen === 'racing') simState.paused = false;
    return;
  }
  const modalGar = document.getElementById('modal-garage');
  if (modalGar && !modalGar.classList.contains('hidden')) {
    modalGar.classList.add('hidden');
    if (flowState.screen === 'racing') simState.paused = false;
    return;
  }
  const modalSpec = document.getElementById('modal-spec');
  if (modalSpec && !modalSpec.classList.contains('hidden')) {
    modalSpec.classList.add('hidden');
    if (flowState.screen === 'racing') simState.paused = false;
    return;
  }

  if (flowState.screen === 'splash') {
    dismissSplashScreen();
  } else if (flowState.screen === 'racing') {
    openPauseMenu();
  } else if (flowState.screen === 'pause') {
    resumeFromPause();
  } else if (flowState.screen === 'records') {
    if (flowState.recordsReturnTo === 'results') showFlowScreen('results');
    else enterHomeScreen(false);
  } else if (flowState.screen === 'garage') {
    if (flowState.garageReturnTo === 'setup') openSetupStep(3);
    else enterHomeScreen(false);
  } else if (flowState.screen === 'setup') {
    if (flowState.setupStep > 1) openSetupStep(flowState.setupStep - 1);
    else enterHomeScreen(false);
  }
}

window.__apexFlowRestart = function () {
  startConfiguredRace(false);
};

// --- 8. Multi-Page Sequential Post-Race Results (3 Pages + Skip) ---
window.__apexFlowFinish = function (finalLapTime) {
  clearAllHeldInputs();
  simState.paused = true;

  const jumpPenaltySec = simState.jumpStartPenaltySec || 0;
  const lapTimes = (simState.sessionLapTimes && simState.sessionLapTimes.length)
    ? simState.sessionLapTimes.slice()
    : [finalLapTime];
  const rawBestLap = Math.min.apply(null, lapTimes);
  const bestSessionLap = (simState.mode === 'time_attack') ? (rawBestLap + jumpPenaltySec) : rawBestLap;
  const totalSessionTime = lapTimes.reduce((a, b) => a + b, 0) + jumpPenaltySec;

  const activeMeta = getActiveCarMeta();
  const carClassKey = (window.ApexRecords && typeof window.ApexRecords.resolveCarClass === 'function')
    ? window.ApexRecords.resolveCarClass(carAssetState.presetId, activeMeta.carClass)
    : (activeMeta.carClass || 'GT3');
  const pbKey = `${currentCircuitIndex}_${simState.edition}_${carClassKey}`;
  const prevPB = personalRecords[pbKey] || (carClassKey === 'GT3' ? personalRecords[`${currentCircuitIndex}_${simState.edition}`] : null) || null;
  const isNewPB = (simState.weather === 'dry') ? savePersonalRecord(pbKey, bestSessionLap) : false;
  if (carClassKey === 'GT3' && simState.weather === 'dry') {
    savePersonalRecord(`${currentCircuitIndex}_${simState.edition}`, bestSessionLap);
  }

  let maxV = simState.sessionTopSpeed || 0;
  const telSamples = (simState.lastCompletedLapSamples && simState.lastCompletedLapSamples.length >= 2)
    ? simState.lastCompletedLapSamples
    : simState.currentLapSamples;
  telSamples.forEach(s => { if (s.speed > maxV) maxV = s.speed; });
  const avgV = (totalTrackLength / Math.max(1, bestSessionLap)) * 3.6;

  const s1 = simState.sector1Time || (bestSessionLap * 0.33);
  const s2 = simState.sector2Time || (bestSessionLap * 0.35);
  const s3 = simState.sector3Time || Math.max(0.1, bestSessionLap - s1 - s2);
  const proLap = currentCircuit.proLapTime;
  const proS1 = proLap * 0.338;
  const proS2 = proLap * 0.342;
  const proS3 = proLap - proS1 - proS2;

  // Driver Grade Calculation
  const deltaPro = bestSessionLap - proLap;
  const penalty = simState.lockupCount * 1.2 + simState.understeerCount * 1.0;
  const scoreMetric = deltaPro + penalty * 0.4;
  let grade = 'A', gradeColor = '#38bdf8', gradeTitle = 'PRO LEVEL 職業車手水準';
  if (scoreMetric <= 0.5) {
    grade = 'S+'; gradeColor = '#fbbf24'; gradeTitle = 'ALIEN PACE 賽道傳奇紀錄！';
  } else if (scoreMetric <= 3.5) {
    grade = 'S'; gradeColor = '#f97316'; gradeTitle = 'PODIUM MASTER 頒獎台統治級表現';
  } else if (scoreMetric <= 8.0) {
    grade = 'A'; gradeColor = '#34d399'; gradeTitle = 'SMOOTH RACER 穩定流暢的賽道駕馭';
  } else if (scoreMetric <= 15.0) {
    grade = 'B'; gradeColor = '#60a5fa'; gradeTitle = 'CLUBMAN 具潛力的進階車手';
  } else {
    grade = 'C'; gradeColor = '#94a3b8'; gradeTitle = 'ROOKIE 建議多參考煞車提示線練習';
  }

  const condSnap = (typeof getSessionConditionsSnapshot === 'function')
    ? getSessionConditionsSnapshot()
    : { weather: simState.weather || 'dry', surfaceState: simState.surfaceState || 'fast', ambientTempC: 23, trackTempC: 35, timeOfDay: 'day', effectiveGrip: simState.effectiveGrip || 1.0 };
  const setupSnap = Object.assign({
    tireCompound: simState.tireCompound || 'medium',
    transmission: simState.autoTransmission ? 'AT' : 'MT'
  }, simState.carSetup || { aeroWing: 3, brakeBias: 58, gearRatio: 'standard', suspension: 'balanced' });

  let savedRecResult = null;
  if (window.ApexRecords && typeof window.ApexRecords.recordCompletedLap === 'function') {
    savedRecResult = window.ApexRecords.recordCompletedLap({
      circuitId: currentCircuit.id,
      circuitName: currentCircuit.name,
      trackLengthM: totalTrackLength,
      edition: simState.edition,
      mode: simState.mode,
      car: {
        presetId: carAssetState.presetId,
        carName: activeMeta.name,
        carClass: carClassKey,
        livery: carAssetState.livery || 'original',
        paintHex: carAssetState.paintHex || '#ef4444'
      },
      setup: setupSnap,
      conditions: condSnap,
      timing: {
        lapTime: bestSessionLap,
        s1, s2, s3,
        jumpPenaltySec,
        isValidLap: simState.isLapValid !== false,
        topSpeedKmh: maxV,
        avgSpeedKmh: avgV,
        bench0to100: simState.bench0to100,
        bench0to200: simState.bench0to200,
        lockups: simState.lockupCount,
        understeers: simState.understeerCount,
        oversteers: simState.oversteerCount,
        driverGrade: grade
      },
      telemetry: telSamples
    });
  }

  // Compute AI / Multiplayer standings snapshot (accounting for Jump Start +5.0s time penalty if any)
  const playerProgress = simState.totalRaceLaps * totalTrackLength - (jumpPenaltySec * 65);
  let standings = [{
    name: 'YOU (' + activeMeta.name + ')',
    progress: playerProgress,
    isPlayer: true,
    timeStr: formatLapTime(totalSessionTime)
  }];
  if (simState.mode === 'ai_race') {
    aiCars.forEach(ai => {
      const p = (ai.lap - 1) * totalTrackLength + ai.s;
      const gapM = playerProgress - p;
      const estGapSec = gapM / Math.max(45, ai.speedMs || 55);
      standings.push({
        name: ai.name,
        progress: p,
        isPlayer: false,
        gapSec: estGapSec,
        timeStr: estGapSec >= 0 ? `+${estGapSec.toFixed(2)}s` : `${estGapSec.toFixed(2)}s`
      });
    });
    standings.sort((a, b) => b.progress - a.progress);
  } else if (simState.mode === 'multiplayer' && window.apexNet) {
    const mpStandings = window.apexNet.getLiveStandings();
    if (mpStandings.length) {
      standings = mpStandings.map(s => ({
        name: s.name + (s.isPlayer ? ' (YOU)' : ''),
        progress: s.progress,
        isPlayer: !!s.isPlayer,
        timeStr: (s.finished && s.finishTime) ? formatLapTime(s.finishTime) : (s.isPlayer ? formatLapTime(totalSessionTime) : 'RACING')
      }));
    }
  }
  const playerRank = Math.max(1, standings.findIndex(s => s.isPlayer) + 1);

  flowState.lastResult = {
    mode: simState.mode,
    edition: simState.edition,
    weather: condSnap.weather,
    circuitId: currentCircuit.id,
    circuitName: currentCircuit.name,
    difficultyStars: currentCircuit.difficultyStars,
    carName: activeMeta.name,
    carClass: carClassKey,
    savedRecord: savedRecResult ? savedRecResult.record : null,
    rankInClass: savedRecResult ? savedRecResult.rankInClass : null,
    totalInClass: savedRecResult ? savedRecResult.totalInClass : 0,
    isNewClassPB: !!(savedRecResult && savedRecResult.isNewClassPB),
    bestLap: bestSessionLap,
    totalTime: totalSessionTime,
    lapTimes,
    proLap,
    deltaPro,
    isNewPB: isNewPB || !!(savedRecResult && savedRecResult.isNewClassPB),
    prevPB,
    playerRank,
    standings,
    s1, s2, s3,
    proS1, proS2, proS3,
    maxV: Math.round(maxV),
    avgV: Math.round(avgV),
    b100: simState.bench0to100,
    b200: simState.bench0to200,
    lockups: simState.lockupCount,
    understeers: simState.understeerCount,
    jumpPenaltySec,
    grade, gradeColor, gradeTitle
  };

  // Flash "FINISH" banner then open Page 1 of Results
  soundEngine.playCountdownBeep(true);
  const flash = document.getElementById('af-finish-flash');
  if (flash) flash.classList.remove('hidden');

  setTimeout(() => {
    if (flash) flash.classList.add('hidden');
    flowState.resultPage = 0;
    renderResultPage(0);
    showFlowScreen('results');
  }, 1150);
};

function fmtDelta(d) {
  const sign = d >= 0 ? '+' : '';
  const cls = d <= 0 ? 'af-pos' : 'af-neg';
  return `<span class="${cls}">${sign}${d.toFixed(3)}s</span>`;
}

function renderResultPage(pageIdx) {
  const r = flowState.lastResult;
  if (!r) return;
  flowState.resultPage = pageIdx;

  const kickerEl = document.getElementById('lbl-res-kicker');
  const titleEl = document.getElementById('lbl-res-title');
  const dotsEl = document.getElementById('res-dots');
  const bodyEl = document.getElementById('res-body');
  const nextBtn = document.getElementById('btn-res-next');
  const retryBtn = document.getElementById('btn-res-retry');

  if (dotsEl) {
    dotsEl.innerHTML = [0, 1, 2].map(i => `<i class="${i <= pageIdx ? 'on' : ''}"></i>`).join('');
  }
  if (retryBtn) {
    retryBtn.classList.toggle('hidden', pageIdx < 2);
  }
  if (nextBtn) {
    nextBtn.innerHTML = pageIdx < 2 ? '下一頁 NEXT ➔' : '返回主頁 HOME ➔';
  }

  if (pageIdx === 0) {
    if (kickerEl) kickerEl.textContent = `RESULT 1 / 3 · ${r.circuitName}`;
    const isRaceStandingsMode = (r.mode === 'ai_race' || r.mode === 'multiplayer');
    if (titleEl) titleEl.textContent = r.mode === 'multiplayer' ? '多人連線完賽名次榜' : (r.mode === 'ai_race' ? '錦標賽完賽名次榜' : '單圈計時挑戰結算');

    if (isRaceStandingsMode) {
      const rankLabels = ['🏆 冠軍 WINNER', '🥈 亞軍 P2 PODIUM', '🥉 季軍 P3 PODIUM', '完賽 FINISHED'];
      const totalRacers = Math.max(1, (r.standings && r.standings.length) || 1);
      bodyEl.innerHTML = `
              <div class="af-res-page af-res-hero">
                <div class="af-kicker">${rankLabels[r.playerRank - 1] || 'FINISHED'}</div>
                <div class="af-res-pos">P${r.playerRank}<small> / ${totalRacers}</small></div>
                <div class="af-res-sub">
                  總完賽時間 <strong>${formatLapTime(r.totalTime)}</strong> · 最佳單圈 <strong>${formatLapTime(r.bestLap)}</strong> · 座駕 ${r.carName}
                </div>
                ${r.jumpPenaltySec > 0 ? `<div class="af-res-badge" style="background:rgba(225,29,72,0.22);border-color:#fb7185;color:#fecdd3;">🚨 JUMP START 偷跑罰時 +${r.jumpPenaltySec.toFixed(1)}s 已計入總成績</div>` : ''}
                ${r.isNewPB ? '<div class="af-res-badge">★ NEW PERSONAL BEST 刷新個人最佳單圈！</div>' : ''}
                <div class="af-standings">
                  ${r.standings.map((s, idx) => `
                    <div class="af-standing ${s.isPlayer ? 'me' : ''}" style="animation-delay:${idx * 0.08}s">
                      <div class="p">P${idx + 1}</div>
                      <div><strong>${s.name}</strong></div>
                      <div class="g">${s.isPlayer ? formatLapTime(r.totalTime) : s.timeStr}</div>
                    </div>
                  `).join('')}
                </div>
              </div>`;
    } else {
      bodyEl.innerHTML = `
              <div class="af-res-page af-res-hero">
                <div class="af-kicker">OFFICIAL LAP TIME · ${r.edition === 'arcade' ? 'ARCADE EDITION' : 'REALISTIC SIM'}</div>
                <div class="af-res-time">${formatLapTime(r.bestLap)}</div>
                ${r.jumpPenaltySec > 0 ? `<div class="af-res-badge" style="background:rgba(225,29,72,0.22);border-color:#fb7185;color:#fecdd3;">🚨 JUMP START 偷跑罰時 +${r.jumpPenaltySec.toFixed(1)}s 已計入圈速</div>` : ''}
                ${r.isNewPB ? '<div class="af-res-badge">★ NEW PERSONAL BEST 刷新個人最佳紀錄！</div>' : ''}
                <div class="af-res-sub">
                  與 PRO 官方基準圈 (${formatLapTime(r.proLap)}) 差距：${fmtDelta(r.deltaPro)}
                </div>
                <div class="af-standings">
                  <div class="af-standing me">
                    <div class="p">YOU</div>
                    <div><strong>本次完賽單圈 (${r.carName})</strong></div>
                    <div class="g">${formatLapTime(r.bestLap)}</div>
                  </div>
                  <div class="af-standing">
                    <div class="p">PRO</div>
                    <div><strong>賽道官方 PRO 基準幽靈車</strong></div>
                    <div class="g">${formatLapTime(r.proLap)} (${fmtDelta(r.deltaPro)})</div>
                  </div>
                  ${r.prevPB ? `
                  <div class="af-standing">
                    <div class="p">PB</div>
                    <div><strong>原先個人最佳紀錄</strong></div>
                    <div class="g">${formatLapTime(r.prevPB)} (${fmtDelta(r.bestLap - r.prevPB)})</div>
                  </div>` : ''}
                </div>
                <div style="margin-top:14px;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;align-items:center;">
                  ${r.rankInClass ? `<span class="af-chip" style="border-color:rgba(56,189,248,0.45);color:#7dd3fc;">🔒 ${r.carClass} · ${r.edition === 'arcade' ? '娛樂NOS' : '真實版'} · ${r.weather === 'wet' ? '濕地' : '乾地'} 第 <b>#${r.rankInClass}</b> / ${r.totalInClass} 名</span>` : ''}
                  <button type="button" id="btn-res-open-board" class="af-btn af-btn-ghost af-btn-sm">
                    🏆 查看本組別分級排行榜與遙測存檔
                  </button>
                </div>
              </div>`;
    }
    const boardBtn = document.getElementById('btn-res-open-board');
    if (boardBtn) {
      boardBtn.addEventListener('click', () => {
        openRecordsScreen({
          returnTo: 'results',
          circuitId: r.circuitId,
          carClass: r.carClass,
          edition: r.edition,
          weather: r.weather || 'dry'
        });
      });
    }
  } else if (pageIdx === 1) {
    if (kickerEl) kickerEl.textContent = `RESULT 2 / 3 · SECTOR & SPEED TELEMETRY`;
    if (titleEl) titleEl.textContent = '分段計時與極速表現';

    const sectors = [
      { lbl: 'S1', cur: r.s1, pro: r.proS1 },
      { lbl: 'S2', cur: r.s2, pro: r.proS2 },
      { lbl: 'S3', cur: r.s3, pro: r.proS3 }
    ];

    bodyEl.innerHTML = `
            <div class="af-res-page">
              <div class="af-panel" style="padding:18px 22px;">
                <div class="af-kicker">SECTOR SPLITS VS PRO BENCHMARK</div>
                ${sectors.map(s => {
      const d = s.cur - s.pro;
      const pct = Math.max(25, Math.min(100, Math.round((s.pro / Math.max(0.1, s.cur)) * 88)));
      const col = d <= 0 ? '#10b981' : '#f97316';
      return `
                    <div class="af-sector-row">
                      <span class="lbl">${s.lbl}</span>
                      <div class="af-stat-track"><div class="af-stat-fill" style="width:${pct}%;background:${col};"></div></div>
                      <strong>${s.cur.toFixed(3)}s</strong>
                      <span>${fmtDelta(d)}</span>
                    </div>`;
    }).join('')}
              </div>

              <div class="af-res-grid">
                <div class="af-panel af-res-card">
                  <div class="k">TOP SPEED 最高尾速</div>
                  <div class="v">${r.maxV} <small style="font-size:13px;">km/h</small></div>
                  <div class="d">賽道直線極速紀錄</div>
                </div>
                <div class="af-panel af-res-card">
                  <div class="k">AVG SPEED 平均時速</div>
                  <div class="v">${r.avgV} <small style="font-size:13px;">km/h</small></div>
                  <div class="d">全場綜合巡航節奏</div>
                </div>
                <div class="af-panel af-res-card">
                  <div class="k">0–100 KM/H 加速</div>
                  <div class="v">${r.b100 ? r.b100.toFixed(2) + 's' : '3.50s'}</div>
                  <div class="d">起跑彈射測試</div>
                </div>
                <div class="af-panel af-res-card">
                  <div class="k">0–200 KM/H 加速</div>
                  <div class="v">${r.b200 ? r.b200.toFixed(2) + 's' : '--.--s'}</div>
                  <div class="d">中高速域推進表現</div>
                </div>
              </div>
              <div style="margin-top:14px;display:flex;justify-content:center;">
                <button type="button" id="btn-res-open-motec-p2" class="af-btn af-btn-ghost af-btn-sm">
                  📊 展開 MoTeC 專業遙測覆盤圖表
                </button>
              </div>
            </div>`;

    const motecBtnP2 = document.getElementById('btn-res-open-motec-p2');
    if (motecBtnP2) {
      motecBtnP2.addEventListener('click', () => {
        openTelemetryModal('current', r.bestLap);
      });
    }
  } else {
    if (kickerEl) kickerEl.textContent = `RESULT 3 / 3 · DRIVER RATING & ENGINEER DEBRIEF`;
    if (titleEl) titleEl.textContent = '駕駛技術評級與總評';

    const tips = [];
    tips.push(`<div>🏎️ <strong>完賽座駕：</strong>${r.carName} · <strong>賽道：</strong>${r.circuitName} (${r.difficultyStars})</div>`);
    if (r.lockups === 0) {
      tips.push('<div class="af-pos">✔ <strong>煞車控制完美：</strong>全程未發生重煞車輪鎖死，前輪循跡抓地力發揮極佳！</div>');
    } else {
      tips.push(`<div class="af-neg">⚠ <strong>重煞鎖死提醒：</strong>本場共發生 ${r.lockups} 次輪胎鎖死，入彎前可稍微提早收放煞車。</div>`);
    }
    if (r.understeers === 0) {
      tips.push('<div class="af-pos">✔ <strong>精準入彎速度：</strong>每個彎道均控制在抓地力極限內通過，零推頭外拋失誤！</div>');
    } else {
      tips.push(`<div style="color:#fbbf24;">⚠ <strong>入彎超速推頭：</strong>出現 ${r.understeers} 次慣性推頭外拋，請盯緊上方「彎道極限」數字減速。</div>`);
    }

    bodyEl.innerHTML = `
            <div class="af-res-page">
              <div class="af-grade-wrap">
                <div style="text-align:center;">
                  <div class="af-kicker">OVERALL RATING</div>
                  <div class="af-grade" style="color:${r.gradeColor};text-shadow:0 0 40px ${r.gradeColor}66;">${r.grade}</div>
                  <div style="font-weight:800;font-size:14px;color:${r.gradeColor};">${r.gradeTitle}</div>
                </div>
                <div class="af-panel af-tips">
                  <div class="af-kicker" style="margin-bottom:8px;">RACE ENGINEER DEBRIEF 賽道工程師總評</div>
                  ${tips.join('')}
                  <div style="margin-top:14px;">
                    <button type="button" id="btn-res-open-motec" class="af-btn af-btn-ghost af-btn-sm">
                      📊 檢視完整 MoTeC 遙測曲線圖 (選用)
                    </button>
                  </div>
                </div>
              </div>
            </div>`;

    const motecBtn = document.getElementById('btn-res-open-motec');
    if (motecBtn) {
      motecBtn.addEventListener('click', () => {
        openTelemetryModal('current', r.bestLap);
      });
    }
  }
}

// --- 9. RFC Module 1: Interactive 3D Car Raycast Click, Inspect Mode & Orbit Controls ---
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();
let orbitDrag = {
  active: false,
  startX: 0,
  startY: 0,
  moved: false,
  baseAzimuth: 0,
  basePolar: 0
};

function enterInspectMode() {
  if (!simState.inShowcaseMode) return;
  simState.inspectMode = true;
  if (window.soundEngine && window.soundEngine.init) {
    try { window.soundEngine.init(); } catch (e) { }
  }
  document.body.classList.add('inspect-active');
  const overlay = document.getElementById('inspect-mode-overlay');
  if (overlay) overlay.classList.remove('hidden');
  if (window.showroomCam) {
    window.showroomCam.targetDistance = 5.2; // Smooth camera lerp closer to car
  }
}

function exitInspectMode() {
  simState.inspectMode = false;
  document.body.classList.remove('inspect-active');
  const overlay = document.getElementById('inspect-mode-overlay');
  if (overlay) overlay.classList.add('hidden');
  if (window.showroomCam) {
    const style = simState.showcaseStyle || 'home';
    window.showroomCam.targetDistance = style === 'garage' ? 5.6 : (style === 'results' ? 8.2 : 6.6);
    const DEG2RAD = Math.PI / 180;
    window.showroomCam.polar = Math.max(75 * DEG2RAD, Math.min(85 * DEG2RAD, window.showroomCam.polar));
  }
}

window.enterInspectMode = enterInspectMode;
window.exitInspectMode = exitInspectMode;

// Escape key to exit inspect mode
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && simState.inspectMode) {
    exitInspectMode();
    e.stopPropagation();
  }
});

// Pointer Orbit Controls (Turntable: 75°-85° clamped pitch; Inspect: 15°-85° clamped pitch, 360° unconstrained azimuth)
window.addEventListener('pointerdown', (e) => {
  if (!simState.inShowcaseMode) return;
  // Ignore clicks on UI buttons/links/panels
  if (e.target.closest('button, a, aside, .af-topbar, .af-home-bottom, .af-garage-bottom, .af-setup-panel, #inspect-mode-overlay button')) return;
  orbitDrag.active = true;
  orbitDrag.startX = e.clientX;
  orbitDrag.startY = e.clientY;
  orbitDrag.moved = false;
  const cam = window.showroomCam;
  orbitDrag.baseAzimuth = cam ? cam.azimuth : (simState.showcaseAngleOffset || 0);
  orbitDrag.basePolar = cam ? cam.polar : (80 * Math.PI / 180);
});

window.addEventListener('pointermove', (e) => {
  if (!orbitDrag.active || !window.showroomCam) return;
  const dx = e.clientX - orbitDrag.startX;
  const dy = e.clientY - orbitDrag.startY;
  if (Math.hypot(dx, dy) > 5) orbitDrag.moved = true;
  if (orbitDrag.moved) {
    const isInspect = !!simState.inspectMode;
    const DEG2RAD = Math.PI / 180;
    // Unconstrained 360° azimuth orbit
    window.showroomCam.azimuth = orbitDrag.baseAzimuth - dx * 0.0075;
    simState.showcaseAngleOffset = window.showroomCam.azimuth;

    // Polar angle pitch clamping:
    // Default turntable: near-horizontal min 75°, max 85° (RFC Module 1.A)
    // Inspect mode: min 15°, max 85° (RFC Module 1.B)
    const minP = (isInspect ? 15 : 75) * DEG2RAD;
    const maxP = 85 * DEG2RAD;
    window.showroomCam.polar = Math.max(minP, Math.min(maxP, orbitDrag.basePolar + dy * 0.0055));
  }
});

window.addEventListener('pointerup', (e) => {
  if (!orbitDrag.active) return;
  const wasMoved = orbitDrag.moved;
  orbitDrag.active = false;
  if (wasMoved || !simState.inShowcaseMode) return;
  if (e.target.closest('button, a, aside, .af-topbar, .af-home-bottom, .af-garage-bottom, #inspect-mode-overlay button')) return;

  // Raycasting to enter Focus/Inspect Mode on clicking the car body mesh
  if (!simState.inspectMode && (flowState.screen === 'home' || flowState.screen === 'garage')) {
    pointerNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointerNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointerNDC, camera);
    const hits = (typeof playerCarGroup !== 'undefined' && playerCarGroup.children)
      ? raycaster.intersectObjects(playerCarGroup.children, true)
      : [];
    const nearCenter = Math.abs(pointerNDC.x) < 0.42 && Math.abs(pointerNDC.y) < 0.42;
    if (hits.length > 0 || nearCenter) {
      enterInspectMode();
    }
  }
});

// Scroll wheel zoom: clamped between 3.5m and 8.0m in inspect mode; disabled in default turntable
window.addEventListener('wheel', (e) => {
  if (!simState.inShowcaseMode) return;
  if (!simState.inspectMode) {
    // RFC Module 1.A: Disable scroll-wheel zooming in default state
    return;
  }
  // RFC Module 1.B: Strict distance clamping [3.5m, 8.0m] in inspect mode
  e.preventDefault();
  if (window.showroomCam) {
    const delta = Math.sign(e.deltaY) * 0.45;
    window.showroomCam.targetDistance = Math.max(3.5, Math.min(8.0, (window.showroomCam.targetDistance || 5.2) + delta));
  }
}, { passive: false });

// Touch pinch-to-zoom for mobile/tablets in inspect mode
let touchDistanceStart = 0;
let touchDistBaseTarget = 5.2;
window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2 && simState.inspectMode && window.showroomCam) {
    touchDistanceStart = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    touchDistBaseTarget = window.showroomCam.targetDistance || 5.2;
  }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2 && simState.inspectMode && window.showroomCam && touchDistanceStart > 0) {
    const distNow = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const ratio = touchDistanceStart / Math.max(10, distNow);
    window.showroomCam.targetDistance = Math.max(3.5, Math.min(8.0, touchDistBaseTarget * ratio));
  }
}, { passive: true });

// --- 10. Wire All New Screen Buttons ---
let pendingInviteRoomCode = (window.apexNet && typeof window.apexNet.parseInviteRoomFromSearch === 'function')
  ? window.apexNet.parseInviteRoomFromSearch(typeof window !== 'undefined' && window.location ? window.location.search : '')
  : '';

function dismissSplashScreen() {
  flowState.loadingActive = false;
  window.__apexPendingSplashDismiss = false;
  try {
    if (typeof soundEngine !== 'undefined' && soundEngine.init) {
      soundEngine.init();
      soundEngine.playCountdownBeep(false);
    }
  } catch (e) {
    console.warn('Audio unlock warning:', e);
  }
  if (pendingInviteRoomCode) {
    const inviteCode = pendingInviteRoomCode;
    pendingInviteRoomCode = '';
    enterHomeScreen(false);
    openMultiplayerScreen({ autoJoinCode: inviteCode });
    return;
  }
  enterHomeScreen(true, {
    title: 'ENTERING GARAGE HUB',
    sub: '正在啟動 3D 展示車庫與物理引擎…',
    duration: 900
  });
}

window.dismissSplashScreen = dismissSplashScreen;

const btnSplashStart = document.getElementById('btn-splash-start');
if (btnSplashStart) {
  if (pendingInviteRoomCode) {
    btnSplashStart.textContent = `🌐 受邀加入房號 #${pendingInviteRoomCode} · 點擊進入`;
  }
  btnSplashStart.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissSplashScreen();
  });
  btnSplashStart.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    dismissSplashScreen();
  });
}

const scrSplash = document.getElementById('scr-splash');
if (scrSplash) {
  scrSplash.addEventListener('click', (e) => {
    if (e.target.closest('#lnk-splash-github, .af-dev-btn, .af-device-badge')) return;
    dismissSplashScreen();
  });
}
window.addEventListener('keydown', (e) => {
  if (flowState.screen === 'splash' && !flowState.loadingActive) {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      dismissSplashScreen();
    }
  }
});

// Home screen buttons
const homeDeviceChip = document.getElementById('lbl-home-device');
if (homeDeviceChip) {
  homeDeviceChip.addEventListener('click', () => {
    applyDeviceProfile(!clientDevice.isMobile);
  });
}
const btnHomeHint = document.getElementById('btn-home-hint');
if (btnHomeHint) btnHomeHint.addEventListener('click', () => enterInspectMode());
const btnHomeInspect = document.getElementById('btn-home-inspect');
if (btnHomeInspect) btnHomeInspect.addEventListener('click', () => enterInspectMode());
const btnHomeRecords = document.getElementById('btn-home-records');
if (btnHomeRecords) btnHomeRecords.addEventListener('click', () => openRecordsScreen({ returnTo: 'home' }));
const btnHomeRecordsChip = document.getElementById('btn-home-records-chip');
if (btnHomeRecordsChip) btnHomeRecordsChip.addEventListener('click', () => openRecordsScreen({ returnTo: 'home' }));
const btnHomeGarage = document.getElementById('btn-home-garage');
if (btnHomeGarage) btnHomeGarage.addEventListener('click', () => openGarageScreen('home'));
const btnHomeMultiplayer = document.getElementById('btn-home-multiplayer');
if (btnHomeMultiplayer) btnHomeMultiplayer.addEventListener('click', () => openMultiplayerScreen());
const btnHomePlay = document.getElementById('btn-home-play');
if (btnHomePlay) btnHomePlay.addEventListener('click', () => openSetupStep(1));

// --- 12. Local & LAN Multiplayer Lobby & Staging Room ---
const mpDraftOpts = {
  carClass: 'GT3',
  circuitIdx: 0,
  edition: 'realistic',
  weather: 'dry',
  laps: 2,
  collisionMode: 'soft',
  isPublic: true
};

function escHtmlMp(str) {
  return String(str == null ? '' : str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function openMultiplayerScreen(opts = {}) {
  const activeMeta = getActiveCarMeta();
  mpDraftOpts.carClass = activeMeta.carClass || 'GT3';
  mpDraftOpts.circuitIdx = (typeof currentCircuitIndex === 'number') ? currentCircuitIndex : 0;
  mpDraftOpts.edition = (simState && simState.edition) ? simState.edition : 'realistic';
  mpDraftOpts.weather = (simState && simState.weather) ? simState.weather : 'dry';

  showFlowScreen('multiplayer');
  renderMultiplayerScreen();

  if (window.apexNet) {
    if (opts && opts.autoJoinCode) {
      window.apexNet.setTransport('p2p');
      renderMultiplayerScreen();
      await window.apexNet.joinRoom(opts.autoJoinCode);
      renderMultiplayerScreen();
      return;
    }
    const snap = window.apexNet.getSnapshot();
    if (!snap.connected && !snap.connecting) {
      const mode = (typeof window.apexNet.autoSelectTransport === 'function')
        ? await window.apexNet.autoSelectTransport()
        : 'ws';
      if (mode === 'ws') {
        await window.apexNet.connect();
      }
      renderMultiplayerScreen();
    } else if (snap.connected && snap.transport === 'ws') {
      window.apexNet.refreshRoomList();
    }
  }
}

function launchMultiplayerRace(roomSnap) {
  if (!roomSnap) return;
  soundEngine.init();
  clearAllHeldInputs();

  const circuitIdx = Number(roomSnap.circuitIdx) || 0;
  if (typeof selectCircuit === 'function' && currentCircuitIndex !== circuitIdx) {
    selectCircuit(circuitIdx);
  }
  if (typeof setPhysicsEdition === 'function') {
    setPhysicsEdition(roomSnap.edition === 'arcade' ? 'arcade' : 'realistic');
  }
  if (typeof setWeatherMode === 'function') {
    setWeatherMode(roomSnap.weather === 'wet' ? 'wet' : 'dry');
  }
  if (typeof setGameMode === 'function') {
    setGameMode('multiplayer');
  }
  simState.totalRaceLaps = Math.max(1, Number(roomSnap.laps) || 2);

  const netSnap = window.apexNet ? window.apexNet.getSnapshot() : { playerId: null };
  const myId = netSnap.playerId;
  const players = Array.isArray(roomSnap.players) ? roomSnap.players : [];
  const me = players.find(p => p.id === myId);
  const mySlot = me ? (me.gridSlot || 0) : 0;
  const grid = window.apexNet
    ? window.apexNet.getGridSlotCoords(mySlot, players.length)
    : { s: 0, d: 0 };

  simState._mpGridS = grid.s;
  simState._mpGridD = grid.d;
  simState._mpRaceStartServerMs = roomSnap.raceStartServerMs || 0;

  if (typeof window.rebuildProBenchmarkForCurrentCar === 'function') {
    window.rebuildProBenchmarkForCurrentCar();
  }

  showFlowScreen('racing');
  resetSession(true);
}

function updateMultiplayerConnBadge(snap) {
  const badgeEl = document.getElementById('lbl-mp-conn-badge');
  if (!badgeEl || !snap) return;
  if (snap.transport === 'p2p') {
    if (snap.connecting) {
      badgeEl.textContent = `◌ ${snap.p2pConnectingMsg || 'P2P 連線中…'}`;
      badgeEl.style.borderColor = 'rgba(251,191,36,0.55)';
      badgeEl.style.color = '#fbbf24';
    } else if (snap.connected && snap.room) {
      const roleTxt = snap.isP2PHost ? '房主' : (snap.rttMs ? `${snap.rttMs} ms` : '已同步');
      badgeEl.textContent = `● P2P 已連線 (${roleTxt})`;
      badgeEl.style.borderColor = 'rgba(52,211,153,0.55)';
      badgeEl.style.color = '#34d399';
    } else {
      badgeEl.textContent = '● 代碼直連就緒 (免伺服器)';
      badgeEl.style.borderColor = 'rgba(56,189,248,0.55)';
      badgeEl.style.color = '#7dd3fc';
    }
    return;
  }
  if (snap.connected) {
    badgeEl.textContent = `● 已連線 (${snap.rttMs} ms)`;
    badgeEl.style.borderColor = 'rgba(52,211,153,0.55)';
    badgeEl.style.color = '#34d399';
  } else if (snap.connecting) {
    badgeEl.textContent = '◌ 連線中…';
    badgeEl.style.borderColor = 'rgba(251,191,36,0.55)';
    badgeEl.style.color = '#fbbf24';
  } else {
    badgeEl.textContent = '● 未連線';
    badgeEl.style.borderColor = 'rgba(244,63,94,0.55)';
    badgeEl.style.color = '#fb7185';
  }
}

function getShareableGameUrl(snap) {
  const info = snap && snap.serverInfo;
  if (snap && snap.transport === 'p2p' && snap.room && snap.room.code) {
    const baseP2P = (typeof window !== 'undefined' && window.location && window.location.href)
      ? window.location.href.split('#')[0]
      : 'https://raymond-luo-code.github.io/Apex-pro-racing/';
    try {
      const u = new URL(baseP2P);
      u.searchParams.delete('ws');
      u.searchParams.set('room', snap.room.code);
      return u.toString();
    } catch (e) { /* fallback */ }
  }
  if (info && info.lanMode && Array.isArray(info.lanIps) && info.lanIps.length) {
    const portPart = info.httpPort ? `:${info.httpPort}` : '';
    return `http://${info.lanIps[0]}${portPart}/index.html`;
  }
  const base = (typeof window !== 'undefined' && window.location && window.location.href)
    ? window.location.href.split('#')[0]
    : 'http://127.0.0.1:8765/index.html';
  if (snap && snap.serverUrl && String(snap.serverUrl).toLowerCase().startsWith('wss://')) {
    try {
      const u = new URL(base);
      u.searchParams.set('ws', snap.serverUrl);
      return u.toString();
    } catch (e) { /* fallback to base */ }
  }
  return base;
}

window.getShareableGameUrl = getShareableGameUrl;

function copyTextWithFallback(text, triggerBtn) {
  const val = String(text || '');
  const flash = (ok) => {
    if (!triggerBtn) return;
    const orig = triggerBtn.dataset.origText || triggerBtn.textContent;
    triggerBtn.dataset.origText = orig;
    triggerBtn.textContent = ok ? '✔ 已複製' : '⚠ 請手動選取';
    setTimeout(() => {
      if (triggerBtn) triggerBtn.textContent = orig;
    }, 1400);
  };
  const fallbackExec = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = val;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      flash(!!ok);
    } catch (e) {
      flash(false);
    }
  };
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(val).then(() => flash(true)).catch(fallbackExec);
  } else {
    fallbackExec();
  }
}

function renderMultiplayerScreen() {
  const bodyEl = document.getElementById('mp-body');
  if (!bodyEl || !window.apexNet) return;

  const snap = window.apexNet.getSnapshot();
  updateMultiplayerConnBadge(snap);

  // Preserve active input focus value so network events never wipe what the user is typing
  const activeEl = document.activeElement;
  if (activeEl && bodyEl.contains(activeEl) && activeEl.tagName === 'INPUT') {
    if (activeEl.id === 'input-mp-name' && activeEl.value) {
      window.apexNet.setPlayerName(activeEl.value);
    }
  }

  const driverName = (typeof window.apexNet.getPlayerName === 'function')
    ? window.apexNet.getPlayerName()
    : ((window.ApexRecords && typeof window.ApexRecords.getDriverName === 'function') ? window.ApexRecords.getDriverName() : 'PLAYER');
  const shareUrl = getShareableGameUrl(snap);
  const wsUrl = snap.serverUrl || snap.autoDiscoveredUrl || 'ws://127.0.0.1:8766';
  const activeMeta = getActiveCarMeta();
  const classTabs = ['D', 'C', 'B', 'GT3', 'A', 'S', 'R', 'LMH', 'X', 'F1'];
  const room = snap.room;
  const isP2P = (snap.transport !== 'ws');
  const busy = !!snap.connecting;

  if (!room) {
    const roomsHtml = (snap.roomList && snap.roomList.length)
      ? snap.roomList.map(r => {
        const cObj = CIRCUITS[r.circuitIdx] || CIRCUITS[0];
        return `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.22);margin-bottom:8px;">
              <div>
                <div style="font-size:13px;font-weight:800;color:#f8fafc;">#${escHtmlMp(r.code)} · ${escHtmlMp(cObj.shortLabel || cObj.name)}</div>
                <div style="font-size:11px;color:#94a3b8;">房主 ${escHtmlMp(r.hostName)} · ${escHtmlMp(r.carClass)} · ${r.edition === 'arcade' ? '娛樂NOS' : '真實版'} · ${r.weather === 'wet' ? '雨天' : '乾地'} · ${r.laps}圈</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="af-chip">${r.playerCount} / ${r.maxPlayers}</span>
                <button type="button" class="af-btn af-btn-primary af-btn-sm" data-mp-join="${escHtmlMp(r.code)}">加入</button>
              </div>
            </div>`;
      }).join('')
      : `<div style="padding:18px;text-align:center;color:#94a3b8;font-size:12px;">目前尚無公開等待中的房間 — 點擊左側「快速配對」或「建立房間」即可立即開局。</div>`;

    const wsControlsHtml = !isP2P ? `
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding-top:8px;border-top:1px solid rgba(148,163,184,0.16);margin-top:8px;">
          <span style="font-size:11px;color:#94a3b8;font-weight:700;">WS 位址</span>
          <input id="input-mp-ws-url" type="text" value="${escHtmlMp(wsUrl)}" placeholder="wss://通道位址 或 ws://127.0.0.1:8766"
            style="width:230px;padding:5px 10px;border-radius:8px;background:rgba(15,23,42,0.9);border:1px solid rgba(148,163,184,0.35);color:#7dd3fc;font-size:11px;font-family:monospace;">
          <button type="button" id="btn-mp-copy-ws-url" class="af-pill-btn">📋 複製 WS</button>
          <button type="button" id="btn-mp-connect" class="af-pill-btn is-active">${snap.connected ? '↻ 重連' : '⚡ 連線'}</button>
          <span style="font-size:11px;color:#94a3b8;font-weight:700;margin-left:6px;">🔗 邀請網址</span>
          <input id="input-mp-share-url" type="text" readonly value="${escHtmlMp(shareUrl)}" class="af-copyable"
            style="flex:1;min-width:190px;padding:5px 10px;border-radius:8px;background:rgba(15,23,42,0.75);border:1px solid rgba(56,189,248,0.28);color:#e2e8f0;font-size:11px;font-family:monospace;">
          <button type="button" id="btn-mp-copy-game-url" class="af-pill-btn is-active">📋 複製網址</button>
        </div>` : '';

    const staticWsBannerHtml = (!isP2P && snap.isStaticHost && !snap.connected) ? `
      <div style="padding:10px 14px;border-radius:10px;background:rgba(14,165,233,0.12);border:1px solid rgba(56,189,248,0.42);color:#e0f2fe;font-size:11.5px;line-height:1.55;margin-bottom:12px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;">
          <strong style="color:#7dd3fc;">ℹ 目前正透過靜態網頁開啟，建議切換上方「🌐 代碼直連（免伺服器）」即可直接對戰</strong>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" data-mp-transport="p2p" class="af-pill-btn is-active">🌐 切回代碼直連</button>
            <button type="button" id="btn-mp-use-local-ws" class="af-pill-btn">⚡ 連本機 ws://127.0.0.1:8766</button>
          </div>
        </div>
        <div>• 若要自架區網房間，請執行 <code style="color:#fbbf24;">launch_apex_lan_host.bat</code> 並以終端顯示的 <code style="color:#7dd3fc;">http://&lt;區網IP&gt;:8765</code> 開啟。</div>
      </div>` : '';

    const createReady = isP2P ? !busy : !!snap.connected;
    const optionBHtml = isP2P ? `
        <div class="af-panel" style="padding:16px;">
          <div class="af-kicker">OPTION B · JOIN BY 6-CHAR CODE</div>
          <div class="af-h2" style="margin-bottom:10px;">🔑 輸入朋友的 6 碼代碼加入</div>

          <div style="display:flex;gap:8px;margin-bottom:14px;">
            <input id="input-mp-join-code" type="text" maxlength="8" placeholder="輸入 6 碼代碼 (例: A7K9M2)"
              style="flex:1;padding:10px 14px;border-radius:8px;background:rgba(15,23,42,0.9);border:1px solid rgba(56,189,248,0.45);color:#fff;font-size:15px;font-weight:800;letter-spacing:3px;text-transform:uppercase;font-family:monospace;">
            <button type="button" id="btn-mp-join-code" class="af-btn af-btn-primary" ${busy ? 'disabled' : ''}>🚀 加入房間</button>
          </div>

          <div style="padding:12px 14px;border-radius:10px;background:rgba(15,23,42,0.72);border:1px solid rgba(56,189,248,0.22);font-size:12px;color:#cbd5e1;line-height:1.7;">
            <div style="font-weight:800;color:#7dd3fc;margin-bottom:4px;">🌐 免架站 · 三步驟代碼互聯：</div>
            <div>1. 房主點左側「<strong>➕ 建立房間</strong>」取得 <strong>6 碼代碼</strong> 或 <strong>一鍵邀請連結</strong>。</div>
            <div>2. 朋友開啟同一網頁，輸入 6 碼代碼按加入（或直接點連結自動連線）。</div>
            <div>3. 不需開本機伺服器或輸入 IP，手機與電腦跨網即可開跑；同 Wi-Fi 若偏好區網伺服器可隨時切右側模式。</div>
          </div>
        </div>` : `
        <div class="af-panel" style="padding:16px;">
          <div class="af-kicker">OPTION B · JOIN BY CODE OR LOBBY</div>
          <div class="af-h2" style="margin-bottom:10px;">🔑 輸入共同代碼 ／ 公開房列表</div>

          <div style="display:flex;gap:8px;margin-bottom:14px;">
            <input id="input-mp-join-code" type="text" maxlength="8" placeholder="輸入 6 碼房號 (例: A7K9M2)"
              style="flex:1;padding:8px 12px;border-radius:8px;background:rgba(15,23,42,0.9);border:1px solid rgba(56,189,248,0.45);color:#fff;font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;font-family:monospace;">
            <button type="button" id="btn-mp-join-code" class="af-btn af-btn-primary" ${snap.connected ? '' : 'disabled'}>加入房間</button>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:11px;color:#cbd5e1;font-weight:700;">公開大廳等候中房間</span>
            <button type="button" id="btn-mp-refresh-list" class="af-pill-btn" ${snap.connected ? '' : 'disabled'}>↻ 重新整理</button>
          </div>
          <div style="max-height:220px;overflow-y:auto;">${roomsHtml}</div>
        </div>`;

    bodyEl.innerHTML = `
      <div class="af-panel" style="padding:14px 16px;margin-bottom:12px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
            <span style="font-size:11px;color:#94a3b8;font-weight:700;">車手代號</span>
            <input id="input-mp-name" type="text" maxlength="20" value="${escHtmlMp(driverName)}"
              style="width:130px;padding:6px 10px;border-radius:8px;background:rgba(15,23,42,0.9);border:1px solid rgba(148,163,184,0.35);color:#fff;font-size:12px;font-weight:700;">
            <button type="button" id="btn-mp-apply-name" class="af-pill-btn">✔ 套用</button>
            <div class="af-pill-grp" style="margin-left:6px;">
              <button type="button" data-mp-transport="p2p" class="af-pill-btn ${isP2P ? 'is-active' : ''}">🌐 代碼直連 (免伺服器)</button>
              <button type="button" data-mp-transport="ws" class="af-pill-btn ${!isP2P ? 'is-active' : ''}">🖥 本機 / 區網伺服器</button>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;color:#cbd5e1;">目前座駕：<strong style="color:#fbbf24;">${escHtmlMp(activeMeta.name)}</strong> (${escHtmlMp(activeMeta.carClass)})</span>
            <button type="button" id="btn-mp-garage" class="af-pill-btn">🔧 換車</button>
          </div>
        </div>
        ${wsControlsHtml}
      </div>

      ${snap.lastError ? `<div style="padding:10px 14px;border-radius:10px;background:rgba(225,29,72,0.18);border:1px solid #fb7185;color:#fecdd3;font-size:12px;margin-bottom:12px;">⚠ ${escHtmlMp(snap.lastError)}</div>` : ''}
      ${staticWsBannerHtml}

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:12px;">
        <div class="af-panel" style="padding:16px;">
          <div class="af-kicker">${isP2P ? 'OPTION A · CREATE CODE ROOM' : 'OPTION A · QUICK MATCH & CREATE ROOM'}</div>
          <div class="af-h2" style="margin-bottom:10px;">${isP2P ? '➕ 建立房間（取得 6 碼代碼）' : '⚡ 快速配對 ／ 建立房間'}</div>

          <div class="af-tune-row" style="margin-bottom:8px;">
            <span>車輛級別</span>
            <div class="af-pill-grp">
              ${classTabs.map(c => `<button type="button" data-mp-opt-class="${c}" class="af-pill-btn ${mpDraftOpts.carClass === c ? 'is-active' : ''}">${c}</button>`).join('')}
            </div>
          </div>

          <div class="af-tune-row" style="margin-bottom:8px;">
            <span>賽道與天候</span>
            <div class="af-pill-grp" style="flex-wrap:wrap;">
              <select id="sel-mp-circuit" style="padding:4px 8px;border-radius:6px;background:rgba(15,23,42,0.9);border:1px solid rgba(148,163,184,0.35);color:#fff;font-size:11px;">
                ${CIRCUITS.map((c, idx) => `<option value="${idx}" ${mpDraftOpts.circuitIdx === idx ? 'selected' : ''}>${escHtmlMp(c.shortLabel || c.name)}</option>`).join('')}
              </select>
              <button type="button" data-mp-opt-weather="dry" class="af-pill-btn ${mpDraftOpts.weather === 'dry' ? 'is-active' : ''}">☀ 乾地</button>
              <button type="button" data-mp-opt-weather="wet" class="af-pill-btn ${mpDraftOpts.weather === 'wet' ? 'is-active' : ''}">🌧 濕地</button>
            </div>
          </div>

          <div class="af-tune-row" style="margin-bottom:8px;">
            <span>物理與碰撞</span>
            <div class="af-pill-grp" style="flex-wrap:wrap;">
              <button type="button" data-mp-opt-ed="realistic" class="af-pill-btn ${mpDraftOpts.edition === 'realistic' ? 'is-active' : ''}">真實版</button>
              <button type="button" data-mp-opt-ed="arcade" class="af-pill-btn ${mpDraftOpts.edition === 'arcade' ? 'is-active' : ''}">娛樂NOS</button>
              <button type="button" data-mp-opt-col="soft" class="af-pill-btn ${mpDraftOpts.collisionMode === 'soft' ? 'is-active' : ''}">柔和接觸</button>
              <button type="button" data-mp-opt-col="ghost" class="af-pill-btn ${mpDraftOpts.collisionMode === 'ghost' ? 'is-active' : ''}">幽靈無碰撞</button>
            </div>
          </div>

          ${isP2P ? `
          <div style="margin-top:14px;">
            <button type="button" id="btn-mp-create-room" class="af-btn af-btn-primary af-btn-block" ${createReady ? '' : 'disabled'}>${busy ? '◌ 正在建立 6 碼房間…' : '➕ 建立房間（立即拿 6 碼代碼）'}</button>
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-top:8px;">💡 建房後會產生 6 碼代碼與一鍵邀請網址，分享給朋友即可立刻加入。</div>` : `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;">
            <button type="button" id="btn-mp-quick-match" class="af-btn af-btn-primary" ${snap.connected ? '' : 'disabled'}>⚡ 一鍵快速配對</button>
            <button type="button" id="btn-mp-create-room" class="af-btn af-btn-ghost" ${snap.connected ? '' : 'disabled'}>➕ 建立房間 (拿代碼)</button>
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-top:8px;">💡 快速配對會自動加入同級別等候中房間；若無可用房間則自動開新公開房。</div>`}
        </div>

        ${optionBHtml}
      </div>`;
  } else {
    const isHost = (room.hostId === snap.playerId);
    const me = (room.players || []).find(p => p.id === snap.playerId);
    const cObj = CIRCUITS[room.circuitIdx] || CIRCUITS[0];

    bodyEl.innerHTML = `
      <div class="af-panel" style="padding:16px;margin-bottom:12px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
          <div>
            <div class="af-kicker">STAGING ROOM · ${isP2P ? 'P2P CODE DIRECT' : 'LAN WEBSOCKET'} · READY CHECK</div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <div class="af-h1 af-copyable" style="font-size:24px;letter-spacing:2px;color:#38bdf8;">房號 #${escHtmlMp(room.code)}</div>
              <button type="button" id="btn-mp-copy-code" class="af-pill-btn is-active" data-copy-val="${escHtmlMp(room.code)}">📋 複製代碼</button>
              <button type="button" id="btn-mp-copy-room-url" class="af-pill-btn" data-copy-val="${escHtmlMp(shareUrl)}">🔗 複製邀請連結</button>
              <span class="af-chip">${room.players.length} / ${room.maxPlayers} 人</span>
              <span class="af-chip" style="color:#fbbf24;">${escHtmlMp(room.carClass)} · ${escHtmlMp(cObj.shortLabel || cObj.name)}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" id="btn-mp-garage" class="af-btn af-btn-ghost af-btn-sm">🔧 更換賽車 / 烤漆</button>
            <button type="button" id="btn-mp-leave" class="af-btn af-btn-danger af-btn-sm">◀ 離開房間</button>
          </div>
        </div>

        ${isHost ? `
        <div style="padding:12px;border-radius:10px;background:rgba(15,23,42,0.75);border:1px solid rgba(56,189,248,0.28);margin-bottom:12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;">
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
            <span style="font-size:11px;color:#fbbf24;font-weight:700;">👑 房主設定：</span>
            <select id="sel-mp-room-circuit" style="padding:4px 8px;border-radius:6px;background:rgba(15,23,42,0.9);border:1px solid rgba(148,163,184,0.35);color:#fff;font-size:11px;">
              ${CIRCUITS.map((c, idx) => `<option value="${idx}" ${room.circuitIdx === idx ? 'selected' : ''}>${escHtmlMp(c.shortLabel || c.name)}</option>`).join('')}
            </select>
            <select id="sel-mp-room-class" style="padding:4px 8px;border-radius:6px;background:rgba(15,23,42,0.9);border:1px solid rgba(148,163,184,0.35);color:#fff;font-size:11px;">
              ${classTabs.map(c => `<option value="${c}" ${room.carClass === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <select id="sel-mp-room-laps" style="padding:4px 8px;border-radius:6px;background:rgba(15,23,42,0.9);border:1px solid rgba(148,163,184,0.35);color:#fff;font-size:11px;">
              ${[1, 2, 3, 5].map(l => `<option value="${l}" ${room.laps === l ? 'selected' : ''}>${l} 圈</option>`).join('')}
            </select>
            <button type="button" data-mp-room-weather="${room.weather === 'wet' ? 'dry' : 'wet'}" class="af-pill-btn ${room.weather === 'wet' ? 'is-active' : ''}">${room.weather === 'wet' ? '🌧 濕地' : '☀ 乾地'}</button>
            <button type="button" data-mp-room-col="${room.collisionMode === 'ghost' ? 'soft' : 'ghost'}" class="af-pill-btn">${room.collisionMode === 'ghost' ? '👻 幽靈無碰撞' : '🛡 柔和接觸'}</button>
          </div>
        </div>` : `
        <div style="padding:10px 12px;border-radius:10px;background:rgba(15,23,42,0.75);border:1px solid rgba(148,163,184,0.2);margin-bottom:12px;font-size:12px;color:#cbd5e1;">
          📍 賽道：<strong>${escHtmlMp(cObj.name)}</strong> · 組別：<strong>${escHtmlMp(room.carClass)}</strong> · ${room.laps} 圈 · ${room.weather === 'wet' ? '🌧 濕地' : '☀ 乾地'} · ${room.collisionMode === 'ghost' ? '👻 幽靈無碰撞' : '🛡 柔和接觸'}
        </div>`}

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;margin-bottom:14px;">
          ${(room.players || []).map(p => {
      const pCar = CAR_CATALOG.find(c => c.id === p.presetId);
      const isMe = (p.id === snap.playerId);
      return `
              <div style="padding:10px 12px;border-radius:10px;background:rgba(15,23,42,0.9);border:1px solid ${isMe ? '#38bdf8' : 'rgba(148,163,184,0.22)'};">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                  <strong style="color:${isMe ? '#7dd3fc' : '#f8fafc'};font-size:13px;">${p.isHost ? '👑 ' : ''}${escHtmlMp(p.name)}${isMe ? ' (你)' : ''}</strong>
                  <span style="font-size:10px;font-weight:800;color:${p.ready ? '#34d399' : '#fbbf24'};">${p.ready ? '✔ READY' : '⏳ 等待'}</span>
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-top:4px;">🏎 ${escHtmlMp(pCar ? pCar.name : p.presetId)} (${escHtmlMp(p.carClass)})</div>
              </div>`;
    }).join('')}
        </div>

        <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
          ${!isHost ? `<button type="button" id="btn-mp-toggle-ready" class="af-btn ${me && me.ready ? 'af-btn-ghost' : 'af-btn-primary'}">${me && me.ready ? '取消準備' : '✔ 我已準備就緒'}</button>` : ''}
          ${isHost ? `<button type="button" id="btn-mp-start-race" class="af-btn af-btn-primary af-btn-xl">🏁 全員同步起跑（啟動發車燈）➔</button>` : ''}
        </div>
      </div>`;
  }
}

if (window.apexNet) {
  window.apexNet.onStateChange((snap, reason) => {
    if (flowState.screen !== 'multiplayer') return;
    updateMultiplayerConnBadge(snap);
    // Heartbeat ping only refreshes RTT badge; never rebuild DOM while user edits inputs or copies URLs
    if (reason === 'ping') return;
    renderMultiplayerScreen();
  });
  window.apexNet.onRaceEvent((type, payload) => {
    if (type === 'race_start') {
      launchMultiplayerRace(payload);
    } else if (type === 'race_standings' && flowState.screen === 'results' && flowState.resultPage === 0) {
      if (flowState.lastResult) {
        flowState.lastResult.standings = window.apexNet.getLiveStandings();
        const me = flowState.lastResult.standings.findIndex(s => s.isPlayer);
        if (me >= 0) flowState.lastResult.playerRank = me + 1;
        renderResultPage(0);
      }
    }
  });
}

const btnMpBack = document.getElementById('btn-mp-back');
if (btnMpBack) {
  btnMpBack.addEventListener('click', () => {
    if (window.apexNet) window.apexNet.leaveRoom();
    enterHomeScreen(false);
  });
}

const mpBodyEl = document.getElementById('mp-body');
if (mpBodyEl) {
  mpBodyEl.addEventListener('keydown', async (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && e.target.id === 'input-mp-ws-url' && window.apexNet) {
      e.preventDefault();
      await window.apexNet.connect(e.target.value);
      renderMultiplayerScreen();
    } else if (e.key === 'Enter' && e.target.id === 'input-mp-join-code' && window.apexNet) {
      e.preventDefault();
      if (e.target.value && e.target.value.trim()) {
        await window.apexNet.joinRoom(e.target.value.trim());
        renderMultiplayerScreen();
      }
    }
  });
  mpBodyEl.addEventListener('input', (e) => {
    if (e.target.id === 'input-mp-name') {
      if (window.apexNet && typeof window.apexNet.setPlayerName === 'function') window.apexNet.setPlayerName(e.target.value);
      if (window.ApexRecords) window.ApexRecords.setDriverName(e.target.value);
    }
  });
  mpBodyEl.addEventListener('change', (e) => {
    if (e.target.id === 'sel-mp-circuit') {
      mpDraftOpts.circuitIdx = parseInt(e.target.value, 10) || 0;
    } else if (e.target.id === 'sel-mp-room-circuit' && window.apexNet) {
      window.apexNet.updateRoom({ circuitIdx: parseInt(e.target.value, 10) || 0 });
    } else if (e.target.id === 'sel-mp-room-class' && window.apexNet) {
      window.apexNet.updateRoom({ carClass: e.target.value });
    } else if (e.target.id === 'sel-mp-room-laps' && window.apexNet) {
      window.apexNet.updateRoom({ laps: parseInt(e.target.value, 10) || 2 });
    } else if (e.target.id === 'input-mp-name') {
      if (window.apexNet && typeof window.apexNet.setPlayerName === 'function') window.apexNet.setPlayerName(e.target.value);
      if (window.ApexRecords) window.ApexRecords.setDriverName(e.target.value);
    }
  });
  mpBodyEl.addEventListener('click', async (e) => {
    const t = e.target;
    const nameInp = document.getElementById('input-mp-name');
    if (nameInp && nameInp.value.trim()) {
      if (window.apexNet && typeof window.apexNet.setPlayerName === 'function') window.apexNet.setPlayerName(nameInp.value);
      if (window.ApexRecords) window.ApexRecords.setDriverName(nameInp.value);
    }

    const applyNameBtn = t.closest('#btn-mp-apply-name');
    if (applyNameBtn && window.apexNet) {
      if (typeof window.apexNet.sendIdentityUpdate === 'function') window.apexNet.sendIdentityUpdate();
      const orig = applyNameBtn.textContent;
      applyNameBtn.textContent = '✔ 已套用';
      setTimeout(() => { if (applyNameBtn) applyNameBtn.textContent = orig; }, 1200);
      return;
    }

    const copyWsBtn = t.closest('#btn-mp-copy-ws-url');
    if (copyWsBtn) {
      const wsInp = document.getElementById('input-mp-ws-url');
      copyTextWithFallback(wsInp ? wsInp.value : '', copyWsBtn);
      return;
    }
    const copyGameBtn = t.closest('#btn-mp-copy-game-url');
    if (copyGameBtn) {
      const shareInp = document.getElementById('input-mp-share-url');
      copyTextWithFallback(shareInp ? shareInp.value : getShareableGameUrl(window.apexNet && window.apexNet.getSnapshot()), copyGameBtn);
      return;
    }
    const copyCodeBtn = t.closest('#btn-mp-copy-code') || t.closest('#btn-mp-copy-room-url');
    if (copyCodeBtn) {
      copyTextWithFallback(copyCodeBtn.dataset.copyVal || '', copyCodeBtn);
      return;
    }

    const transportBtn = t.closest('[data-mp-transport]');
    if (transportBtn && window.apexNet) {
      const mode = transportBtn.dataset.mpTransport === 'ws' ? 'ws' : 'p2p';
      window.apexNet.setTransport(mode);
      renderMultiplayerScreen();
      if (mode === 'ws') {
        await window.apexNet.connect();
        renderMultiplayerScreen();
      }
      return;
    }
    if (t.closest('#btn-mp-connect') && window.apexNet) {
      const urlInp = document.getElementById('input-mp-ws-url');
      await window.apexNet.connect(urlInp ? urlInp.value : '');
      renderMultiplayerScreen();
      return;
    }
    if (t.closest('#btn-mp-use-local-ws') && window.apexNet) {
      const localWs = 'ws://127.0.0.1:8766';
      const urlInp = document.getElementById('input-mp-ws-url');
      if (urlInp) urlInp.value = localWs;
      await window.apexNet.connect(localWs);
      renderMultiplayerScreen();
      return;
    }
    if (t.closest('#btn-mp-garage')) {
      openGarageScreen('multiplayer');
      return;
    }
    const clsBtn = t.closest('[data-mp-opt-class]');
    if (clsBtn) { mpDraftOpts.carClass = clsBtn.dataset.mpOptClass; renderMultiplayerScreen(); return; }
    const wBtn = t.closest('[data-mp-opt-weather]');
    if (wBtn) { mpDraftOpts.weather = wBtn.dataset.mpOptWeather; renderMultiplayerScreen(); return; }
    const edBtn = t.closest('[data-mp-opt-ed]');
    if (edBtn) { mpDraftOpts.edition = edBtn.dataset.mpOptEd; renderMultiplayerScreen(); return; }
    const colBtn = t.closest('[data-mp-opt-col]');
    if (colBtn) { mpDraftOpts.collisionMode = colBtn.dataset.mpOptCol; renderMultiplayerScreen(); return; }

    if (t.closest('#btn-mp-quick-match') && window.apexNet) {
      await window.apexNet.quickMatch(mpDraftOpts);
      renderMultiplayerScreen();
      return;
    }
    if (t.closest('#btn-mp-create-room') && window.apexNet) {
      await window.apexNet.createRoom(mpDraftOpts);
      renderMultiplayerScreen();
      return;
    }
    if (t.closest('#btn-mp-join-code') && window.apexNet) {
      const codeInp = document.getElementById('input-mp-join-code');
      if (codeInp && codeInp.value.trim()) {
        await window.apexNet.joinRoom(codeInp.value.trim());
        renderMultiplayerScreen();
      }
      return;
    }
    const joinCardBtn = t.closest('[data-mp-join]');
    if (joinCardBtn && window.apexNet) {
      window.apexNet.joinRoom(joinCardBtn.dataset.mpJoin);
      return;
    }
    if (t.closest('#btn-mp-refresh-list') && window.apexNet) {
      window.apexNet.refreshRoomList();
      return;
    }
    if (t.closest('#btn-mp-leave') && window.apexNet) {
      window.apexNet.leaveRoom();
      return;
    }
    const rwBtn = t.closest('[data-mp-room-weather]');
    if (rwBtn && window.apexNet) {
      window.apexNet.updateRoom({ weather: rwBtn.dataset.mpRoomWeather });
      return;
    }
    const rcBtn = t.closest('[data-mp-room-col]');
    if (rcBtn && window.apexNet) {
      window.apexNet.updateRoom({ collisionMode: rcBtn.dataset.mpRoomCol });
      return;
    }
    if (t.closest('#btn-mp-toggle-ready') && window.apexNet) {
      const st = window.apexNet.getSnapshot();
      const me = st.room && (st.room.players || []).find(p => p.id === st.playerId);
      window.apexNet.updateMyPlayer({ ready: !(me && me.ready) });
      return;
    }
    if (t.closest('#btn-mp-start-race') && window.apexNet) {
      window.apexNet.startRace();
      return;
    }
  });
}

// --- 11. Reviewable Lap Records & Anti-Pollution Class Leaderboard Hub ---
function formatSetupTags(setup) {
  if (!setup) return '--';
  const tMap = { soft: 'S軟胎', medium: 'M中性胎', hard: 'H硬胎', wet: 'W雨胎' };
  const gMap = { short: '密齒', standard: '標準齒', long: '疏齒' };
  const sMap = { soft: '軟懸吊', balanced: '均衡懸吊', stiff: '硬懸吊' };
  return `${tMap[setup.tireCompound] || setup.tireCompound} · 尾翼${setup.aeroWing || 3} · 煞車前${setup.brakeBias || 58}% · ${gMap[setup.gearRatio] || '標準齒'} · ${sMap[setup.suspension] || '均衡懸吊'} · ${setup.transmission || 'AT'}`;
}

function formatCondTags(cond) {
  if (!cond) return '--';
  const wIco = cond.weather === 'wet' ? '🌧 濕地' : '☀ 乾地';
  const surfMap = { green: '綠地98%', fast: '標準100%', optimum: '最佳102%', wet: '積水72%' };
  return `${wIco} · ${surfMap[cond.surfaceState] || ''} · 氣${cond.ambientTempC ?? '--'}°/地${cond.trackTempC ?? '--'}°C`;
}

function loadRecordAsGhost(rec, autoLaunch = false) {
  if (!rec) return false;
  const cIdx = CIRCUITS.findIndex(c => c.id === rec.circuitId);
  if (cIdx < 0) return false;
  const tel = Array.isArray(rec.telemetry) ? rec.telemetry : [];
  if (tel.length < 4) {
    alert('此紀錄為舊版遷移成績，無 3D 軌跡遙測可供作為幽靈車。');
    return false;
  }
  simState.customGhostMeta = {
    id: rec.id,
    circuitId: rec.circuitId,
    carName: rec.car.carName,
    driverName: rec.driverName,
    lapTime: rec.timing.lapTime
  };
  simState.bestLapTime = rec.timing.lapTime;
  simState.pbTelemetrySamples = tel.slice();
  simState.ghostTarget = 'both';
  const selGhost = document.getElementById('select-ghost-target');
  if (selGhost) selGhost.value = 'both';
  if (currentCircuitIndex !== cIdx) {
    selectCircuit(cIdx);
  } else {
    const hudBest = document.getElementById('hud-best-time');
    if (hudBest) hudBest.textContent = formatLapTime(rec.timing.lapTime);
  }
  if (autoLaunch) {
    setGameMode('time_attack');
    startConfiguredRace(true);
  }
  return true;
}

function openRecordsScreen(opts = {}) {
  const curMeta = getActiveCarMeta();
  flowState.recordsReturnTo = opts.returnTo || 'home';
  if (opts.circuitId) flowState.recFilter.circuitId = opts.circuitId;
  else if (typeof currentCircuit !== 'undefined' && currentCircuit) flowState.recFilter.circuitId = currentCircuit.id;
  if (opts.carClass) flowState.recFilter.carClass = opts.carClass;
  else if (curMeta && curMeta.carClass) flowState.recFilter.carClass = curMeta.carClass;
  if (opts.edition) flowState.recFilter.edition = opts.edition;
  else if (simState.edition) flowState.recFilter.edition = simState.edition;
  if (opts.weather) flowState.recFilter.weather = opts.weather;
  else if (simState.weather) flowState.recFilter.weather = simState.weather;
  if (opts.tab) flowState.recFilter.tab = opts.tab;

  if (window.ApexRecords && typeof window.ApexRecords.init === 'function') {
    window.ApexRecords.init().then(() => {
      if (flowState.screen === 'records') renderRecordsScreen();
    });
  }
  renderRecordsScreen();
  showFlowScreen('records');
}

function renderRecordsScreen() {
  const f = flowState.recFilter;
  const isBoard = (f.tab !== 'history');

  document.querySelectorAll('[data-rec-tab]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.recTab === f.tab);
  });

  const driverInput = document.getElementById('input-driver-name');
  if (driverInput && window.ApexRecords) {
    driverInput.value = window.ApexRecords.getDriverName();
  }

  const cirSelect = document.getElementById('rec-filter-circuit');
  if (cirSelect) {
    const optsHtml = (isBoard ? [] : ['<option value="all">全部賽道</option>'])
      .concat(CIRCUITS.map(c => `<option value="${c.id}">${c.country || ''} ${c.cardTitle || c.name}</option>`));
    cirSelect.innerHTML = optsHtml.join('');
    if (isBoard && f.circuitId === 'all') f.circuitId = CIRCUITS[0].id;
    cirSelect.value = f.circuitId;
  }

  const btnClassAll = document.getElementById('btn-rec-class-all');
  if (btnClassAll) btnClassAll.classList.toggle('hidden', isBoard);
  if (isBoard && f.carClass === 'all') f.carClass = 'GT3';

  document.querySelectorAll('[data-rec-class]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.recClass === f.carClass);
  });
  document.querySelectorAll('[data-rec-edition]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.recEdition === f.edition);
  });
  document.querySelectorAll('[data-rec-weather]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.recWeather === f.weather);
  });

  const dedupeEl = document.getElementById('rec-filter-dedupe');
  if (dedupeEl) {
    dedupeEl.disabled = !isBoard;
    dedupeEl.value = f.dedupeMode;
  }
  const tireEl = document.getElementById('rec-filter-tire');
  if (tireEl) tireEl.value = f.tireFilter;
  const pinBtn = document.getElementById('btn-rec-pinned-only');
  if (pinBtn) pinBtn.classList.toggle('is-active', !!f.pinnedOnly);

  const benchStrip = document.getElementById('rec-benchmark-strip');
  const tableWrap = document.getElementById('rec-table-container');
  if (!window.ApexRecords || !tableWrap) return;

  if (isBoard) {
    const res = window.ApexRecords.getClassLeaderboard({
      circuitId: f.circuitId,
      carClass: f.carClass,
      edition: f.edition,
      weather: f.weather,
      dedupeMode: f.dedupeMode,
      tireFilter: f.tireFilter,
      pinnedOnly: f.pinnedOnly
    });
    const bm = res.benchmarks;
    if (benchStrip) {
      benchStrip.classList.remove('hidden');
      benchStrip.innerHTML = `
              <div class="af-bench-card" style="border-color:rgba(251,191,36,0.45);"><span>🏆 <strong>PRO 官方基準 (100%)</strong></span><strong style="color:#fbbf24;">${formatLapTime(bm.proTime)}</strong></div>
              <div class="af-bench-card"><span>🥇 金牌門檻 (102%)</span><strong style="color:#fde68a;">${formatLapTime(bm.goldTime)}</strong></div>
              <div class="af-bench-card"><span>🥈 銀牌門檻 (105%)</span><strong style="color:#e2e8f0;">${formatLapTime(bm.silverTime)}</strong></div>
              <div class="af-bench-card"><span>🥉 銅牌門檻 (110%)</span><strong style="color:#fdba74;">${formatLapTime(bm.bronzeTime)}</strong></div>`;
    }

    if (!res.entries.length) {
      tableWrap.innerHTML = `<div style="padding:36px;text-align:center;color:#94a3b8;font-size:13px;">此獨立分榜（${f.circuitId.toUpperCase()} · ${f.carClass} · ${f.edition === 'arcade' ? '娛樂NOS' : '真實版'} · ${f.weather === 'wet' ? '濕地' : '乾地'}）目前尚無合法完賽紀錄。去跑一圈建立標竿吧！</div>`;
      return;
    }

    tableWrap.innerHTML = `
            <table class="af-rec-table">
              <thead>
                <tr>
                  <th>名次</th><th>車手</th><th>賽車 / 組別</th><th>單圈時間</th><th>秒差 / vs PRO</th><th>分段 S1 · S2 · S3</th><th>極速</th><th>賽車調校設定</th><th>當日賽道環境</th><th>日期</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                ${res.entries.map(e => {
      const r = e.record;
      const clsMeta = window.ApexRecords.CLASS_META[r.carClass] || window.ApexRecords.CLASS_META.GT3;
      const rankStr = e.rank === 1 ? '🥇 #1' : (e.rank === 2 ? '🥈 #2' : (e.rank === 3 ? '🥉 #3' : `#${e.rank}`));
      const dLead = e.rank === 1 ? '<span style="color:#fbbf24;">LEADER</span>' : `+${e.deltaLeader.toFixed(3)}s`;
      const dPro = `${e.deltaPro >= 0 ? '+' : ''}${e.deltaPro.toFixed(3)}s`;
      const hasTel = r.telemetry && r.telemetry.length >= 4;
      const secStr = (r.timing.s1 && r.timing.s2 && r.timing.s3)
        ? `${r.timing.s1.toFixed(2)} / ${r.timing.s2.toFixed(2)} / ${r.timing.s3.toFixed(2)}`
        : (r.isLegacyMigrated ? '舊版遷移' : '--');
      const dtStr = (r.recordedAt || '').slice(0, 16).replace('T', ' ');
      return `
                    <tr>
                      <td><strong>${rankStr}</strong></td>
                      <td><strong>${r.driverName}</strong></td>
                      <td>
                        <div style="font-weight:800;color:#fff;">${r.car.carName}</div>
                        <span class="af-rec-badge-sm" style="color:${clsMeta.color};background:${clsMeta.bg};border-color:${clsMeta.color}55;">${r.carClass}</span>
                      </td>
                      <td>
                        <div class="af-rec-time">${formatLapTime(r.timing.lapTime)}</div>
                        ${r.timing.jumpPenaltySec > 0 ? `<div style="font-size:10px;color:#fb7185;">含起跑罰時 +${r.timing.jumpPenaltySec}s</div>` : ''}
                      </td>
                      <td style="font-variant-numeric:tabular-nums;"><div>${dLead}</div><div style="font-size:10px;color:${e.deltaPro <= 0 ? '#34d399' : '#94a3b8'};">vs PRO: ${dPro}</div></td>
                      <td style="font-variant-numeric:tabular-nums;font-size:11px;color:#cbd5e1;">${secStr}</td>
                      <td><strong>${r.timing.topSpeedKmh || '--'}</strong> <small>km/h</small></td>
                      <td style="font-size:11px;color:#cbd5e1;max-width:210px;">${formatSetupTags(r.setup)}</td>
                      <td style="font-size:11px;color:#7dd3fc;max-width:190px;">${formatCondTags(r.conditions)}</td>
                      <td style="font-size:10px;color:#94a3b8;white-space:nowrap;">${dtStr}</td>
                      <td style="white-space:nowrap;">
                        <button type="button" class="af-pill-btn" data-rec-review="${r.id}" ${hasTel ? '' : 'disabled'} title="MoTeC 覆盤與雙圈對比">📊 覆盤</button>
                        <button type="button" class="af-pill-btn" data-rec-ghost="${r.id}" ${hasTel ? '' : 'disabled'} title="載入此圈作為目標幽靈車">👻 幽靈</button>
                        <button type="button" class="af-pill-btn ${r.pinned ? 'is-amber is-active' : ''}" data-rec-pin="${r.id}" title="收藏此圈">⭐</button>
                        <button type="button" class="af-pill-btn" data-rec-del="${r.id}" title="刪除紀錄">🗑</button>
                      </td>
                    </tr>`;
    }).join('')}
              </tbody>
            </table>`;
  } else {
    if (benchStrip) benchStrip.classList.add('hidden');
    const rows = window.ApexRecords.getAllHistory({
      circuitId: f.circuitId,
      carClass: f.carClass,
      edition: 'all',
      weather: 'all',
      tireFilter: f.tireFilter,
      pinnedOnly: f.pinnedOnly
    });
    if (!rows.length) {
      tableWrap.innerHTML = `<div style="padding:36px;text-align:center;color:#94a3b8;font-size:13px;">尚無符合篩選條件的歷史紀錄。</div>`;
      return;
    }
    tableWrap.innerHTML = `
            <table class="af-rec-table">
              <thead>
                <tr>
                  <th>日期時間</th><th>賽道</th><th>組別 / 車款</th><th>版別 / 評級</th><th>單圈時間</th><th>極速</th><th>賽車調校設定</th><th>當日賽道環境</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(r => {
      const clsMeta = window.ApexRecords.CLASS_META[r.carClass] || window.ApexRecords.CLASS_META.GT3;
      const hasTel = r.telemetry && r.telemetry.length >= 4;
      const dtStr = (r.recordedAt || '').slice(0, 16).replace('T', ' ');
      return `
                    <tr>
                      <td style="font-size:10px;color:#94a3b8;white-space:nowrap;">${dtStr}<div>${r.driverName}</div></td>
                      <td><strong>${r.circuitName}</strong></td>
                      <td>
                        <div style="font-weight:800;color:#fff;">${r.car.carName}</div>
                        <span class="af-rec-badge-sm" style="color:${clsMeta.color};background:${clsMeta.bg};border-color:${clsMeta.color}55;">${r.carClass}</span>
                      </td>
                      <td>
                        <div>${r.edition === 'arcade' ? '🔥 娛樂' : '🏁 真實'}</div>
                        <div style="font-size:10px;color:#fbbf24;">評級 ${r.timing.driverGrade}</div>
                      </td>
                      <td><div class="af-rec-time">${formatLapTime(r.timing.lapTime)}</div>${r.timing.isValidLap ? '' : '<span style="color:#fb7185;font-size:10px;">未完檢無效</span>'}</td>
                      <td><strong>${r.timing.topSpeedKmh || '--'}</strong> <small>km/h</small></td>
                      <td style="font-size:11px;color:#cbd5e1;max-width:210px;">${formatSetupTags(r.setup)}</td>
                      <td style="font-size:11px;color:#7dd3fc;max-width:190px;">${formatCondTags(r.conditions)}</td>
                      <td style="white-space:nowrap;">
                        <button type="button" class="af-pill-btn" data-rec-review="${r.id}" ${hasTel ? '' : 'disabled'}>📊 覆盤</button>
                        <button type="button" class="af-pill-btn" data-rec-ghost="${r.id}" ${hasTel ? '' : 'disabled'}>👻 幽靈</button>
                        <button type="button" class="af-pill-btn ${r.pinned ? 'is-amber is-active' : ''}" data-rec-pin="${r.id}">⭐</button>
                        <button type="button" class="af-pill-btn" data-rec-del="${r.id}">🗑</button>
                      </td>
                    </tr>`;
    }).join('')}
              </tbody>
            </table>`;
  }
}

// Wire Records Hub controls
const btnRecBack = document.getElementById('btn-records-back');
if (btnRecBack) {
  btnRecBack.addEventListener('click', () => {
    if (flowState.recordsReturnTo === 'results') showFlowScreen('results');
    else enterHomeScreen(false);
  });
}
const inpDriver = document.getElementById('input-driver-name');
if (inpDriver) {
  inpDriver.addEventListener('change', () => {
    if (window.ApexRecords) window.ApexRecords.setDriverName(inpDriver.value);
  });
}
document.querySelectorAll('[data-rec-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    flowState.recFilter.tab = btn.dataset.recTab;
    renderRecordsScreen();
  });
});
const selRecCir = document.getElementById('rec-filter-circuit');
if (selRecCir) {
  selRecCir.addEventListener('change', () => {
    flowState.recFilter.circuitId = selRecCir.value;
    renderRecordsScreen();
  });
}
document.querySelectorAll('[data-rec-class]').forEach(btn => {
  btn.addEventListener('click', () => {
    flowState.recFilter.carClass = btn.dataset.recClass;
    renderRecordsScreen();
  });
});
document.querySelectorAll('[data-rec-edition]').forEach(btn => {
  btn.addEventListener('click', () => {
    flowState.recFilter.edition = btn.dataset.recEdition;
    renderRecordsScreen();
  });
});
document.querySelectorAll('[data-rec-weather]').forEach(btn => {
  btn.addEventListener('click', () => {
    flowState.recFilter.weather = btn.dataset.recWeather;
    renderRecordsScreen();
  });
});
const selDedupe = document.getElementById('rec-filter-dedupe');
if (selDedupe) {
  selDedupe.addEventListener('change', () => {
    flowState.recFilter.dedupeMode = selDedupe.value;
    renderRecordsScreen();
  });
}
const selRecTire = document.getElementById('rec-filter-tire');
if (selRecTire) {
  selRecTire.addEventListener('change', () => {
    flowState.recFilter.tireFilter = selRecTire.value;
    renderRecordsScreen();
  });
}
const btnPinOnly = document.getElementById('btn-rec-pinned-only');
if (btnPinOnly) {
  btnPinOnly.addEventListener('click', () => {
    flowState.recFilter.pinnedOnly = !flowState.recFilter.pinnedOnly;
    renderRecordsScreen();
  });
}
const btnExport = document.getElementById('btn-records-export');
if (btnExport) {
  btnExport.addEventListener('click', () => {
    if (!window.ApexRecords) return;
    const jsonStr = window.ApexRecords.exportRecordsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apex_pro_records_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
const btnImport = document.getElementById('btn-records-import');
const inpImport = document.getElementById('input-records-import');
if (btnImport && inpImport) {
  btnImport.addEventListener('click', () => inpImport.click());
  inpImport.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file || !window.ApexRecords) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = window.ApexRecords.importRecordsJSON(String(reader.result || ''));
      if (res.ok) {
        alert(`成功匯入 ${res.imported} 筆紀錄（略過重複 ${res.skipped} 筆）！`);
        renderRecordsScreen();
        renderHomeScreen();
      } else {
        alert('匯入失敗：' + res.error);
      }
      inpImport.value = '';
    };
    reader.readAsText(file);
  });
}
const recTableContainer = document.getElementById('rec-table-container');
if (recTableContainer) {
  recTableContainer.addEventListener('click', (e) => {
    const revBtn = e.target.closest('[data-rec-review]');
    if (revBtn && window.ApexRecords) {
      const rec = window.ApexRecords.getRecordById(revBtn.dataset.recReview);
      if (rec && typeof window.openTelemetryModal === 'function') {
        window.openTelemetryModal('record', rec.timing.lapTime, rec);
      }
      return;
    }
    const ghBtn = e.target.closest('[data-rec-ghost]');
    if (ghBtn && window.ApexRecords) {
      const rec = window.ApexRecords.getRecordById(ghBtn.dataset.recGhost);
      if (rec) loadRecordAsGhost(rec, true);
      return;
    }
    const pinBtn = e.target.closest('[data-rec-pin]');
    if (pinBtn && window.ApexRecords) {
      window.ApexRecords.togglePin(pinBtn.dataset.recPin);
      renderRecordsScreen();
      return;
    }
    const delBtn = e.target.closest('[data-rec-del]');
    if (delBtn && window.ApexRecords) {
      window.ApexRecords.deleteRecord(delBtn.dataset.recDel);
      renderRecordsScreen();
      renderHomeScreen();
    }
  });
}

// Inspect overlay exit button
const btnExitInspect = document.getElementById('btn-exit-inspect');
if (btnExitInspect) btnExitInspect.addEventListener('click', () => exitInspectMode());

// Garage screen buttons
const btnGarInspect = document.getElementById('btn-garage-inspect');
if (btnGarInspect) btnGarInspect.addEventListener('click', () => enterInspectMode());
const btnGarBack = document.getElementById('btn-garage-back');
if (btnGarBack) {
  btnGarBack.addEventListener('click', () => {
    if (flowState.garageReturnTo === 'setup') openSetupStep(3);
    else if (flowState.garageReturnTo === 'multiplayer') openMultiplayerScreen();
    else enterHomeScreen(false);
  });
}
const btnGarConfirm = document.getElementById('btn-garage-confirm');
if (btnGarConfirm) {
  btnGarConfirm.addEventListener('click', () => {
    if (flowState.garageReturnTo === 'setup') {
      startConfiguredRace(true);
    } else if (flowState.garageReturnTo === 'multiplayer') {
      if (window.apexNet) window.apexNet.updateMyPlayer({});
      openMultiplayerScreen();
    } else {
      enterHomeScreen(false);
    }
  });
}
const garCatBar = document.getElementById('gar-category-bar');
if (garCatBar) {
  garCatBar.addEventListener('click', (e) => {
    const clsBtn = e.target.closest('[data-gar-class]');
    if (clsBtn) {
      flowState.garageClassTab = clsBtn.getAttribute('data-gar-class') || 'GT3';
      flowState.garageSubFilter = 'all';
      flowState.garageBrandFilter = 'all';
      renderGarageScreen();
      return;
    }
    const subBtn = e.target.closest('[data-gar-sub]');
    if (subBtn) {
      flowState.garageSubFilter = subBtn.getAttribute('data-gar-sub') || 'all';
      flowState.garageBrandFilter = 'all';
      renderGarageScreen();
      return;
    }
    const brandBtn = e.target.closest('[data-gar-brand]');
    if (brandBtn) {
      flowState.garageBrandFilter = brandBtn.getAttribute('data-gar-brand') || 'all';
      renderGarageScreen();
    }
  });
}
const garStrip = document.getElementById('gar-car-strip');
if (garStrip) {
  garStrip.addEventListener('click', (e) => {
    const card = e.target.closest('[data-car-id]');
    if (!card) return;
    selectCarById(card.dataset.carId);
  });
  garStrip.addEventListener('wheel', (e) => {
    if (!flowState.garageGridOpen && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      garStrip.scrollLeft += e.deltaY;
      e.preventDefault();
    }
    e.stopPropagation();
  }, { passive: false });
}
const btnGarAdv = document.getElementById('btn-garage-advanced');
if (btnGarAdv) {
  btnGarAdv.addEventListener('click', () => {
    garageUI.refresh();
    document.getElementById('modal-garage').classList.remove('hidden');
  });
}

// Setup wizard buttons & delegation
const btnSetupBack = document.getElementById('btn-setup-back');
if (btnSetupBack) {
  btnSetupBack.addEventListener('click', () => {
    if (flowState.setupStep > 1) openSetupStep(flowState.setupStep - 1);
    else enterHomeScreen(false);
  });
}
const setupBody = document.getElementById('setup-body');
if (setupBody) {
  setupBody.addEventListener('click', (e) => {
    const ghostBtn = e.target.closest('[data-ghost]');
    if (ghostBtn) {
      e.stopPropagation();
      simState.ghostTarget = ghostBtn.dataset.ghost;
      const sel = document.getElementById('select-ghost-target');
      if (sel) sel.value = simState.ghostTarget;
      renderSetupStep(2);
      return;
    }
    const diffBtn = e.target.closest('[data-aidiff]');
    if (diffBtn) {
      e.stopPropagation();
      simState.aiDifficulty = parseFloat(diffBtn.dataset.aidiff) || 1.0;
      const sel = document.getElementById('select-ai-diff');
      if (sel) sel.value = String(simState.aiDifficulty);
      renderSetupStep(2);
      return;
    }
    const edCard = e.target.closest('[data-pick-edition]');
    if (edCard) {
      setPhysicsEdition(edCard.dataset.pickEdition);
      openSetupStep(2);
      return;
    }
    const modeCard = e.target.closest('[data-pick-mode]');
    if (modeCard) {
      setGameMode(modeCard.dataset.pickMode);
      openSetupStep(3);
      return;
    }
    const catBtn = e.target.closest('[data-pick-cat]');
    if (catBtn) {
      e.stopPropagation();
      flowState.trackCategory = catBtn.dataset.pickCat || 'all';
      renderSetupStep(3);
      return;
    }
    const surfBtn = e.target.closest('[data-pick-surface]');
    if (surfBtn) {
      e.stopPropagation();
      if (typeof setTrackSurfaceState === 'function') setTrackSurfaceState(surfBtn.dataset.pickSurface);
      renderSetupStep(3);
      return;
    }
    const wBtn = e.target.closest('[data-pick-weather]');
    if (wBtn) {
      e.stopPropagation();
      if (typeof setWeatherMode === 'function') setWeatherMode(wBtn.dataset.pickWeather);
      const wtBtn = document.getElementById('btn-weather-toggle');
      if (wtBtn) {
        const isW = (simState.weather === 'wet');
        wtBtn.textContent = isW ? '🌧 雨天濕地 WET' : '☀ 晴朗乾地 DRY';
        wtBtn.className = `px-2 py-1 rounded bg-slate-800 ${isW ? 'text-sky-400' : 'text-amber-300'} font-mono-tech text-[11px]`;
      }
      renderSetupStep(3);
      return;
    }
    const trackCard = e.target.closest('[data-pick-track]');
    if (trackCard) {
      const idx = parseInt(trackCard.dataset.pickTrack, 10) || 0;
      selectCircuit(idx);
      openSetupStep(4);
    }
  });
}

// Pause menu buttons
const btnPauseRace = document.getElementById('btn-pause-race');
if (btnPauseRace) btnPauseRace.addEventListener('click', openPauseMenu);
const btnPauseResume = document.getElementById('btn-pause-resume');
if (btnPauseResume) btnPauseResume.addEventListener('click', resumeFromPause);
const btnPauseRestart = document.getElementById('btn-pause-restart');
if (btnPauseRestart) {
  btnPauseRestart.addEventListener('click', () => {
    startConfiguredRace(false);
  });
}
const btnPauseQuit = document.getElementById('btn-pause-quit');
if (btnPauseQuit) {
  btnPauseQuit.addEventListener('click', () => {
    enterHomeScreen(true, {
      title: 'RETURNING TO HOME',
      sub: '正在退出賽事並載入車庫展示中心…',
      duration: 900
    });
  });
}

// Results screen buttons
const btnResSkip = document.getElementById('btn-res-skip');
if (btnResSkip) {
  btnResSkip.addEventListener('click', () => {
    enterHomeScreen(true, {
      title: 'LOADING GARAGE SHOWCASE',
      sub: '正在返回主頁車庫展示中心…',
      duration: 900
    });
  });
}
const btnResNext = document.getElementById('btn-res-next');
if (btnResNext) {
  btnResNext.addEventListener('click', () => {
    if (flowState.resultPage < 2) {
      renderResultPage(flowState.resultPage + 1);
    } else {
      enterHomeScreen(true, {
        title: 'LOADING GARAGE SHOWCASE',
        sub: '正在返回主頁車庫展示中心…',
        duration: 900
      });
    }
  });
}
const btnResRetry = document.getElementById('btn-res-retry');
if (btnResRetry) {
  btnResRetry.addEventListener('click', () => {
    startConfiguredRace(true);
  });
}

window.CAR_CATALOG = CAR_CATALOG;
window.selectCarById = selectCarById;
window.personalRecords = personalRecords;
window.savePersonalRecord = savePersonalRecord;
window.flowState = flowState;
window.showFlowScreen = showFlowScreen;
window.runLoadingTransition = runLoadingTransition;
window.enterHomeScreen = enterHomeScreen;
window.renderHomeScreen = renderHomeScreen;
window.renderGarageScreen = renderGarageScreen;
window.openGarageScreen = openGarageScreen;
window.openSetupStep = openSetupStep;
window.renderSetupStep = renderSetupStep;
window.startConfiguredRace = startConfiguredRace;
window.openPauseMenu = openPauseMenu;
window.resumeFromPause = resumeFromPause;
window.toggleMenuModal = toggleMenuModal;
window.dismissSplashScreen = dismissSplashScreen;
window.renderResultPage = renderResultPage;
window.openRecordsScreen = openRecordsScreen;
window.renderRecordsScreen = renderRecordsScreen;
window.openMultiplayerScreen = openMultiplayerScreen;
window.loadRecordAsGhost = loadRecordAsGhost;
if (window.__apexTrace) window.__apexTrace('flow.js', 'OK');