// ============================================================================
// APEX PRO RACING // MODULE 1: CIRCUITS & FIA 3D GEOMETRY
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('circuits.js', 'START');

function formatLapTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '00:00.000';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec - Math.floor(sec)) * 1000);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
window.formatLapTime = formatLapTime;

      const CIRCUITS = [
        {
          id: 'monza',
          name: 'MONZA HIGH-SPEED RING',
          shortLabel: '入門:蒙札高速',
          badgeText: 'MONZA ★☆☆',
          difficultyStars: '★☆☆',
          width: 24.0,
          proLapTime: 80.456,
          elevationAmp1: 2.2,
          elevationAmp2: 1.0,
          glbUrl: 'assets/models/tracks/monza.glb',
          glbTransform: { pos: [-265, -3.6, -266.5], rotX: 0, rotY: Math.PI, scale: 1.0 },
          theme: {
            skyColor: 0x1e3a5f,
            fogColor: 0x1e3a5f,
            fogDensity: 0.00055,
            hemiSky: 0xf0f9ff,
            hemiGround: 0x1e293b,
            hemiIntensity: 1.18,
            sunColor: 0xffffff,
            sunIntensity: 1.35,
            sunPos: [450, 680, 180],
            grassColor: 0x132e1c,
            treePrimary: 0x15803d,
            treeSecondary: 0x166534,
            isNight: false,
            hasSunsetFlare: false
          },
          points: [
            { x: 0, z: 0, vTarget: 300, name: "T1 蒙札起跑超長直道 // 24m 寬路面全油門衝刺，測試 0-300km/h 極速！" },
            { x: 650, z: 0, vTarget: 300, name: "T1 高速直道尾端 // 準備進入 Curva Grande 大曲率高速彎" },
            { x: 1180, z: 140, vTarget: 215, name: "T2 格蘭德高速弧形彎 (極限 210km/h) // 僅需微收油門即可高速貼內線通過" },
            { x: 1320, z: 560, vTarget: 158, name: "T3 羅吉亞中速彎 (極限 155km/h) // 輕踩煞車降速，順著綠色走線入彎" },
            { x: 960, z: 980, vTarget: 175, name: "T4 萊斯莫一號彎 (極限 172km/h) // 寬闊雙車道，出彎提早全油門" },
            { x: 380, z: 1080, vTarget: 265, name: "T5 塞拉利奧全油門加速段 // 穿越森林綠蔭隧道長直道" },
            { x: -320, z: 1020, vTarget: 142, name: "T6 阿斯卡里高速連續彎入口 (極限 140km/h) // 中度煞車後保持平順轉向" },
            { x: -860, z: 780, vTarget: 185, name: "T7 阿斯卡里出彎加速段 // 利用 24m 寬路面外內外全油門出彎" },
            { x: -1180, z: 360, vTarget: 128, name: "T8 帕拉波利卡拋物線彎 (極限 126km/h) // 全場唯一重煞彎，減速至 125km/h 貼Apex" },
            { x: -820, z: 20, vTarget: 260, name: "T9 帕拉波利卡出彎衝刺 // 車頭回正全油門衝向終點大直線！" },
            { x: -350, z: 0, vTarget: 295, name: "起跑大直線極速區 // 善用尾流挑戰 300km/h 終端速度" }
          ]
        },
        {
          id: 'fuji',
          name: 'MOUNT FUJI TECHNICAL GP',
          shortLabel: '中階:富士GP',
          badgeText: 'FUJI GP ★★★',
          difficultyStars: '★★★',
          width: 20.0,
          proLapTime: 86.379,
          elevationAmp1: 5.5,
          elevationAmp2: 2.8,
          theme: {
            skyColor: 0x1a162b,
            fogColor: 0x281b2d,
            fogDensity: 0.00068,
            hemiSky: 0xfde68a,
            hemiGround: 0x1f1624,
            hemiIntensity: 1.05,
            sunColor: 0xff9e44,
            sunIntensity: 1.42,
            sunPos: [520, 260, 880],
            grassColor: 0x112419,
            treePrimary: 0x14532d,
            treeSecondary: 0xf472b6,
            isNight: false,
            hasSunsetFlare: true
          },
          points: [
            { x: 0, z: 0, vTarget: 298, name: "T1 富士大直線 // 黃金夕陽逆光衝刺 — 準備 150m 牌重煞入 T2" },
            { x: 480, z: 0, vTarget: 298, name: "T2 髮夾彎重煞區 (150m牌) // 務必重煞降至 80km/h 以下，不煞車必衝出賽道！" },
            { x: 920, z: 8, vTarget: 76, name: "T2 富士第一髮夾彎 (極限 78km/h) // 控制車速與循跡煞車咬住內側紅白路緣石" },
            { x: 1020, z: 135, vTarget: 122, name: "T2 出彎加速區 // 車頭回正後再補滿油門，避免前輪抓地力耗盡外拋" },
            { x: 760, z: 270, vTarget: 195, name: "T3 可口可樂高速彎 (極限 190km/h) // 入彎前輕點煞車，感受真實離心慣性" },
            { x: 520, z: 490, vTarget: 138, name: "T4 連續 S 彎入口 (極限 138km/h) // 琥珀橘色走線：請減速並收油門至 50% 入彎" },
            { x: 640, z: 720, vTarget: 132, name: "T5 連續 S 彎重心轉換 (極限 132km/h) // 細膩收放油門，超速將直接推頭外拋！" },
            { x: 460, z: 960, vTarget: 128, name: "T6 連續 S 彎出口 (極限 128km/h) // 對準最後一個綠色 Apex 標竿後加速出彎" },
            { x: 140, z: 1180, vTarget: 156, name: "T7 100R 雙頂點複合長彎 (極限 155km/h) // 維持半油門對抗持續側向離心力" },
            { x: -240, z: 1120, vTarget: 178, name: "T8 100R 出彎加速段 // 貼近外側路緣石全油門進入後直道" },
            { x: -680, z: 860, vTarget: 275, name: "T9 後直道全油門尾流區 // 利用長直道推升尾速，準備 T10 鄧祿普重煞" },
            { x: -1080, z: 540, vTarget: 72, name: "T10 鄧祿普重煞髮夾彎 (極限 72km/h) // 全場最急彎！必須重煞減速才能轉過" },
            { x: -920, z: 360, vTarget: 124, name: "T11 第十三號技術彎 (極限 124km/h) // 維持穩定車速對準晚頂點 Late Apex" },
            { x: -640, z: 95, vTarget: 138, name: "T12 松下最終彎道 (極限 138km/h) // 減速入彎、提早回正油門全開衝上大直線！" },
            { x: -300, z: 2, vTarget: 265, name: "起跑大直線衝刺段 // 全油門挑戰 300km/h 終端極速" }
          ]
        },
        {
          id: 'hakone',
          name: 'HAKONE MIDNIGHT TOUGE GP',
          shortLabel: '魔鬼:箱根夜景',
          badgeText: 'HAKONE ★★★★★',
          difficultyStars: '★★★★★',
          width: 16.5,
          proLapTime: 95.171,
          elevationAmp1: 12.5,
          elevationAmp2: 6.4,
          theme: {
            skyColor: 0x040711,
            fogColor: 0x040711,
            fogDensity: 0.00095,
            hemiSky: 0x38bdf8,
            hemiGround: 0x090d16,
            hemiIntensity: 0.72,
            sunColor: 0x60a5fa,
            sunIntensity: 0.85,
            sunPos: [-300, 420, -200],
            grassColor: 0x07120e,
            treePrimary: 0x064e3b,
            treeSecondary: 0x312e81,
            isNight: true,
            hasSunsetFlare: false
          },
          points: [
            { x: 0, z: 0, vTarget: 275, name: "T1 箱根山頂霓虹直線 // 夜間車頭遠光燈全開 — 前方下坡急煞一號彎！" },
            { x: 420, z: -10, vTarget: 260, name: "T2 蘆之湖下坡重煞區 // 16.5m 窄山道！務必提前重煞降至 68km/h" },
            { x: 820, z: 45, vTarget: 66, name: "T2 第一號魔鬼髮夾彎 (極限 66km/h) // 極急右彎，嚴禁帶全油門入彎！" },
            { x: 680, z: 280, vTarget: 108, name: "T3 杉木林反折左彎 (極限 105km/h) // 連續重心轉換，點放煞車壓住車頭" },
            { x: 960, z: 520, vTarget: 72, name: "T4 溫泉街二號髮夾彎 (極限 70km/h) // 重煞退至 2 檔，貼緊螢光綠 Apex" },
            { x: 640, z: 860, vTarget: 125, name: "T5 仙石原連續 S 型山道 // 考驗窄路面精準轉向與油門收放" },
            { x: 240, z: 740, vTarget: 92, name: "T6 峽谷盲彎 (極限 90km/h) // 下坡重心前移，注意煞車力道避免鎖死" },
            { x: -120, z: 1080, vTarget: 64, name: "T7 大涌谷死亡髮夾彎 (極限 62km/h) // 全場最窄急彎！徹底減速再轉向" },
            { x: -580, z: 920, vTarget: 168, name: "T8 湖畔高速觀景長彎 (極限 165km/h) // 半油門穩定貼住內側路緣石" },
            { x: -980, z: 620, vTarget: 245, name: "T9 箱根收費站全油門下坡直道 // 高速夜戰衝刺區" },
            { x: -1120, z: 240, vTarget: 68, name: "T10 七曲最終髮夾彎 (極限 68km/h) // 重煞減速後準備反打切入終點彎" },
            { x: -740, z: 160, vTarget: 118, name: "T11 鳥居拱門技術彎 (極限 115km/h) // 對準出彎路線準備全油門爬坡" },
            { x: -360, z: 5, vTarget: 235, name: "山頂終點衝刺段 // 全油門加速通過霓虹龍門架" }
          ]
        },
        {
          id: 'spa',
          name: 'CIRCUIT DE SPA-FRANCORCHAMPS',
          shortLabel: '殿堂:斯帕森林',
          badgeText: 'SPA GP ★★★★',
          difficultyStars: '★★★★',
          width: 18.5,
          proLapTime: 84.820,
          elevationAmp1: 14.0,
          elevationAmp2: 6.5,
          glbUrl: 'assets/models/tracks/spa_francorchamps.glb',
          glbTransform: { pos: [-959, -77, 912], rotX: 0, rotY: 1.5708, scale: 0.25 },
          theme: {
            skyColor: 0x162a45,
            fogColor: 0x1e334d,
            fogDensity: 0.00058,
            hemiSky: 0xe0f2fe,
            hemiGround: 0x14261c,
            hemiIntensity: 1.15,
            sunColor: 0xfff7ed,
            sunIntensity: 1.32,
            sunPos: [480, 540, -320],
            grassColor: 0x0f291a,
            treePrimary: 0x065f46,
            treeSecondary: 0x14532d,
            isNight: false,
            hasSunsetFlare: false
          },
          points: [
            { x: 0, y: 0, z: 0, vTarget: 285, name: "T1 斯帕起跑下坡直道 // 對準 La Source 髮夾彎重煞區" },
            { x: 440, y: -2, z: 0, vTarget: 68, name: "T1 拉索斯髮夾彎 La Source (極限 68km/h) // 重煞貼緊內側路緣石、提早回正出彎" },
            { x: 740, y: -4, z: 150, vTarget: 235, name: "T1B 拉索斯出彎加速段 // 順著下坡直衝紅水河谷" },
            { x: 540, y: -9, z: 360, vTarget: 255, name: "T2 紅水河谷下坡衝刺 // 準備挑戰傳奇 Eau Rouge 艾爾羅格全油門上坡彎！" },
            { x: 260, y: 18, z: 560, vTarget: 242, name: "T3-T4 艾爾羅格與雷迪永陡坡彎 Eau Rouge / Raidillon // 谷底壓縮後爬升 35m 盲彎頂點" },
            { x: -140, y: 35, z: 860, vTarget: 285, name: "T5 凱梅爾大直道前段 Kemmel Straight // 衝上阿登高原全油門加速" },
            { x: -680, y: 38, z: 1020, vTarget: 302, name: "T5 凱梅爾大直道尾流區 // 高原全油門極速超車區！" },
            { x: -1120, y: 34, z: 880, vTarget: 132, name: "T6-T7 萊斯康布減速彎 Les Combes (極限 132km/h) // 大直道末端重煞切入右-左連續彎" },
            { x: -1280, y: 24, z: 520, vTarget: 112, name: "T8 布魯塞爾長右彎 Bruxelles (極限 112km/h) // 下坡複合右彎，耐心維持半油門" },
            { x: -1020, y: 16, z: 200, vTarget: 198, name: "T10 普昂雙左高速彎 Pouhon (極限 195km/h) // 考驗高下壓力側向極限的五檔高速左彎！" },
            { x: -1260, y: 10, z: -140, vTarget: 145, name: "T12 法格尼奧連續彎 Campus / Fagnes (極限 145km/h) // 節奏明快的右-左重心轉移" },
            { x: -1040, y: 4, z: -460, vTarget: 162, name: "T14 斯塔夫洛彎 Stavelot (極限 160km/h) // 出彎全油門加速決定回程尾速！" },
            { x: -560, y: 6, z: -420, vTarget: 280, name: "T16-T17 布朗希蒙高速彎 Blanchimont // 膽量測試！全油門高速森林長彎" },
            { x: -620, y: 3, z: -120, vTarget: 76, name: "T18 公車站減速彎 Bus Stop Chicane (極限 76km/h) // 全場最後重煞超車點！" },
            { x: -340, y: 1, z: -4, vTarget: 255, name: "T19 斯帕終點直線衝刺 // 全油門加速衝過龍門架" }
          ]
        },
        {
          id: 'suzuka',
          name: 'SUZUKA INTERNATIONAL RACING COURSE',
          shortLabel: '傳奇:鈴鹿八字',
          badgeText: 'SUZUKA ★★★★',
          difficultyStars: '★★★★',
          width: 18.0,
          proLapTime: 83.640,
          elevationAmp1: 9.5,
          elevationAmp2: 4.5,
          glbUrl: 'assets/models/tracks/suzuka_circuit.glb',
          glbTransform: { pos: [-654.5, 21.8, -379.7], rotX: 0, rotY: -1.49365, scale: 0.9673 },
          theme: {
            skyColor: 0x172554,
            fogColor: 0x1e293b,
            fogDensity: 0.00055,
            hemiSky: 0xfef3c7,
            hemiGround: 0x1e293b,
            hemiIntensity: 1.16,
            sunColor: 0xffedd5,
            sunIntensity: 1.38,
            sunPos: [380, 520, 420],
            grassColor: 0x142e1b,
            treePrimary: 0x15803d,
            treeSecondary: 0xd97706,
            isNight: false,
            hasSunsetFlare: false
          },
          points: [
            { x: 0, y: 0, z: 0, vTarget: 275, name: "T1 鈴鹿起跑大直道 // 全油門下坡衝向第一彎高速煞車區" },
            { x: 440, y: -2, z: 0, vTarget: 170, name: "T1 第一彎 First Curve (極限 170km/h) // 高速帶煞入彎、準備銜接第二彎" },
            { x: 720, y: -4, z: 180, vTarget: 126, name: "T2 第二彎 (極限 126km/h) // 貼緊內側路緣石、控制出彎油門避免推頭" },
            { x: 560, y: 2, z: 380, vTarget: 142, name: "T3-T4 蛇行連續彎前段 S-Curves (極限 142km/h) // 左右重心高速轉換、保持流暢節奏！" },
            { x: 640, y: 6, z: 580, vTarget: 148, name: "T5-T6 蛇行連續彎後段 // 順暢帶油通過連續複合彎" },
            { x: 360, y: 10, z: 720, vTarget: 168, name: "T7 鄧祿普長左彎 Dunlop Curve (極限 168km/h) // 上坡高G力長左彎、小心外拋！" },
            { x: 80, y: 2, z: 540, vTarget: 162, name: "T8 德格納一號彎 Degner 1 (極限 162km/h) // 快速精準切入方角右彎" },
            { x: -200, y: -4, z: 380, vTarget: 125, name: "T9 德格納二號彎 Degner 2 (極限 125km/h) // 穿過立體交叉橋下涵洞、小心外側草地！" },
            { x: -560, y: -4, z: 220, vTarget: 210, name: "T10 立體交叉橋下加速段 // 穿越涵洞後重煞準備進入髮夾彎" },
            { x: -900, y: 0, z: 200, vTarget: 64, name: "T11 鈴鹿髮夾彎 Hairpin (極限 64km/h) // 全場最慢重煞點！耐心等待車頭對準出彎" },
            { x: -1140, y: 6, z: 440, vTarget: 225, name: "T12 200R 高速右弧彎 // 全油門貼內線高速爬升衝向湯匙彎" },
            { x: -1120, y: 12, z: 760, vTarget: 132, name: "T13-T14 湯匙雙頂點彎 Spoon Curve (極限 132km/h) // 雙頂點長左彎、出彎尾速決定西直道極速！" },
            { x: -720, y: 14, z: 640, vTarget: 278, name: "西直道立體交叉上橋段 West Straight // 全油門加速衝上 8 字形跨線大橋！" },
            { x: -420, y: 14, z: 320, vTarget: 228, name: "T15 130R 高速立體交叉橋彎 (極限 225km/h) // 跨越德格納涵洞上方、考驗極限膽量的高速彎！" },
            { x: -380, y: 6, z: 80, vTarget: 82, name: "T16-T17 卡西歐三角減速彎 Casio Triangle (極限 82km/h) // 下橋重煞切入右-左最後減速彎" },
            { x: -200, y: 1, z: 0, vTarget: 245, name: "T18 最終下坡右彎 // 全油門出彎衝刺鈴鹿起跑終點線！" }
          ]
        }
      ];

      let currentCircuitIndex = 1;
      let currentCircuit = CIRCUITS[currentCircuitIndex];
      let TRACK_WIDTH = currentCircuit.width;
      const TRACK_SAMPLES = 1040;
      const trackNodes = [];
      let totalTrackLength = 0;

      function catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        return 0.5 * (
          (2 * p1) +
          (-p0 + p2) * t +
          (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
          (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
      }

      function buildTrackGeometryData() {
        trackNodes.length = 0;
        const pts = currentCircuit.points;
        TRACK_WIDTH = currentCircuit.width;
        const N = pts.length;
        const hasExplicitY = pts.some(p => typeof p.y === 'number');
        const rawPts = [];

        for (let i = 0; i < TRACK_SAMPLES; i++) {
          const u = (i / TRACK_SAMPLES) * N;
          const idx = Math.floor(u);
          const frac = u - idx;
          const p0 = pts[(idx - 1 + N) % N];
          const p1 = pts[idx % N];
          const p2 = pts[(idx + 1) % N];
          const p3 = pts[(idx + 2) % N];

          const x = catmullRom(p0.x, p1.x, p2.x, p3.x, frac);
          const z = catmullRom(p0.z, p1.z, p2.z, p3.z, frac);
          const vTarget = p1.vTarget * (1 - frac) + p2.vTarget * frac;
          const y = hasExplicitY
            ? catmullRom(p0.y || 0, p1.y || 0, p2.y || 0, p3.y || 0, frac)
            : (Math.sin((i / TRACK_SAMPLES) * Math.PI * 2) * currentCircuit.elevationAmp1 +
              Math.cos((i / TRACK_SAMPLES) * Math.PI * 4) * currentCircuit.elevationAmp2);
          rawPts.push({ x, y, z, vTarget, name: p1.name });
        }

        let cumS = 0;
        for (let i = 0; i < TRACK_SAMPLES; i++) {
          const prev = rawPts[(i - 1 + TRACK_SAMPLES) % TRACK_SAMPLES];
          const curr = rawPts[i];
          const next = rawPts[(i + 1) % TRACK_SAMPLES];

          if (i > 0) {
            cumS += Math.hypot(curr.x - prev.x, curr.z - prev.z);
          }

          const tx = next.x - prev.x;
          const tz = next.z - prev.z;
          const tLen = Math.hypot(tx, tz) || 1;
          const dirX = tx / tLen;
          const dirZ = tz / tLen;
          const rightX = -dirZ;
          const rightZ = dirX;

          const prev2 = rawPts[(i - 3 + TRACK_SAMPLES) % TRACK_SAMPLES];
          const next2 = rawPts[(i + 3) % TRACK_SAMPLES];
          const ang1 = Math.atan2(curr.z - prev2.z, curr.x - prev2.x);
          const ang2 = Math.atan2(next2.z - curr.z, next2.x - curr.x);
          let dAng = ang2 - ang1;
          while (dAng > Math.PI) dAng -= Math.PI * 2;
          while (dAng < -Math.PI) dAng += Math.PI * 2;
          const segDist = Math.hypot(next2.x - prev2.x, next2.z - prev2.z) || 1;
          const curvature = dAng / segDist;

          const maxApex = TRACK_WIDTH * 0.36;
          const apexOffset = Math.max(-maxApex, Math.min(maxApex, curvature * 310));

          trackNodes.push({
            s: cumS,
            x: curr.x,
            y: curr.y,
            z: curr.z,
            dirX,
            dirZ,
            rightX,
            rightZ,
            heading: Math.atan2(dirZ, dirX),
            curvature,
            vTarget: curr.vTarget,
            optimalD: apexOffset,
            name: curr.name
          });
        }

        const last = rawPts[TRACK_SAMPLES - 1];
        const first = rawPts[0];
        totalTrackLength = cumS + Math.hypot(first.x - last.x, first.z - last.z);

        // Multi-pass Out-In-Out (外-內-外) Optimal Racing Line Solver (true arc-length meters):
        // Swings wide to outside kerb (-sign(k)*maxD) on corner entry (65m-135m before apex),
        // clips inside kerb (+sign(k)*maxD) at apex, and tracks out to outside kerb on exit.
        const maxD = TRACK_WIDTH * 0.38;
        const dRaw = new Float64Array(TRACK_SAMPLES);
        for (let i = 0; i < TRACK_SAMPLES; i++) {
          const s = trackNodes[i].s;
          let localPeak = 0.0020;
          for (let ds = -150; ds <= 150; ds += 10) {
            const cAbs = Math.abs(sampleTrackAtS(s + ds).curvature);
            if (cAbs > localPeak) localPeak = cAbs;
          }
          let kApex = 0;
          for (let ds = -10; ds <= 10; ds += 5) {
            kApex += sampleTrackAtS(s + ds).curvature;
          }
          kApex /= 5.0;
          let kEntry = 0, kExit = 0;
          for (let ds = 65; ds <= 135; ds += 10) {
            kEntry += sampleTrackAtS(s + ds).curvature;
            kExit += sampleTrackAtS(s - ds).curvature;
          }
          kEntry /= 8.0;
          kExit /= 8.0;
          const kApexEff = kApex * Math.pow(Math.min(1.0, Math.abs(kApex) / localPeak), 1.15);
          const normVal = (2.40 * kApexEff - 1.35 * kEntry - 1.25 * kExit) / localPeak;
          dRaw[i] = Math.max(-maxD, Math.min(maxD, normVal * maxD));
        }
        let dSmooth = Array.from(dRaw);
        for (let pass = 0; pass < 6; pass++) {
          const nextD = new Array(TRACK_SAMPLES);
          for (let i = 0; i < TRACK_SAMPLES; i++) {
            nextD[i] = 0.25 * dSmooth[(i - 2 + TRACK_SAMPLES) % TRACK_SAMPLES]
                     + 0.50 * dSmooth[i]
                     + 0.25 * dSmooth[(i + 2) % TRACK_SAMPLES];
          }
          dSmooth = nextD;
        }
        for (let i = 0; i < TRACK_SAMPLES; i++) {
          trackNodes[i].optimalD = dSmooth[i];
        }
      }

      function sampleTrackAtS(s) {
        if (!Number.isFinite(s) || totalTrackLength <= 0) s = 0;
        let normS = s % totalTrackLength;
        if (normS < 0) normS += totalTrackLength;
        let idx = Math.floor((normS / totalTrackLength) * TRACK_SAMPLES) % TRACK_SAMPLES;
        while (idx < TRACK_SAMPLES - 1 && trackNodes[idx + 1].s < normS) idx++;
        while (idx > 0 && trackNodes[idx].s > normS) idx--;

        const n0 = trackNodes[idx];
        const n1 = trackNodes[(idx + 1) % TRACK_SAMPLES];
        const segLen = (idx === TRACK_SAMPLES - 1) ? (totalTrackLength - n0.s) : (n1.s - n0.s);
        const t = segLen > 0.001 ? Math.max(0, Math.min(1, (normS - n0.s) / segLen)) : 0;

        let dHead = n1.heading - n0.heading;
        while (dHead > Math.PI) dHead -= Math.PI * 2;
        while (dHead < -Math.PI) dHead += Math.PI * 2;

        const nPrev = trackNodes[(idx - 1 + TRACK_SAMPLES) % TRACK_SAMPLES];
        const nNext = trackNodes[(idx + 2) % TRACK_SAMPLES];
        const dySmooth = ((n1.y || 0) - (n0.y || 0)) * 0.65 + (((nNext.y || 0) - (nPrev.y || 0)) / 3.0) * 0.35;
        const slopePitch = Math.atan2(dySmooth, Math.max(1.0, segLen));

        return {
          s: normS,
          idx,
          x: n0.x + (n1.x - n0.x) * t,
          y: n0.y + (n1.y - n0.y) * t,
          z: n0.z + (n1.z - n0.z) * t,
          dirX: n0.dirX + (n1.dirX - n0.dirX) * t,
          dirZ: n0.dirZ + (n1.dirZ - n0.dirZ) * t,
          rightX: n0.rightX + (n1.rightX - n0.rightX) * t,
          rightZ: n0.rightZ + (n1.rightZ - n0.rightZ) * t,
          heading: n0.heading + dHead * t,
          slopePitch,
          curvature: n0.curvature + (n1.curvature - n0.curvature) * t,
          vTarget: n0.vTarget + (n1.vTarget - n0.vTarget) * t,
          optimalD: n0.optimalD + (n1.optimalD - n0.optimalD) * t,
          name: n0.name
        };
      }

      function sdToWorld(s, d) {
        const node = sampleTrackAtS(s);
        return {
          x: node.x + node.rightX * d,
          y: node.y,
          z: node.z + node.rightZ * d,
          heading: node.heading,
          slopePitch: node.slopePitch,
          node
        };
      }

      function getCornerLineCutFactor() {
        return TRACK_WIDTH >= 22.0 ? 0.62 : (TRACK_WIDTH >= 19.0 ? 0.70 : 0.85);
      }

      function getUpcomingCornerMaxSpeedKmh(s) {
        let maxCurv = 0;
        for (let offset = -10; offset <= 20; offset += 5) {
          const n = sampleTrackAtS(s + offset);
          if (Math.abs(n.curvature) > maxCurv) maxCurv = Math.abs(n.curvature);
        }
        const effectiveCurv = maxCurv * getCornerLineCutFactor();
        if (effectiveCurv < 0.00155) return 300;
        const gLat = effectiveCurv < 0.0032 ? 1.56 : (effectiveCurv < 0.0075 ? 1.46 : 1.24);
        const vMsMax = Math.sqrt((gLat * 9.81) / effectiveCurv);
        return Math.min(300, Math.max(64, Math.round(vMsMax * 3.6)));
      }

      // --------------------------------------------------------------------------
      // 2. PRE-COMPUTED PRO BENCHMARK GHOST LAP & TELEMETRY
      // --------------------------------------------------------------------------
      let PRO_LAP_TIME = currentCircuit.proLapTime;
      const proTelemetrySamples = [];

      function generateProBenchmarkLap(classSpec) {
        proTelemetrySamples.length = 0;
        const spec = classSpec || (typeof window !== 'undefined' && window.selectedCarClassSpec) || {
          cornerGripMult: 1.0,
          accelMult: 1.0,
          brakeDecelMult: 1.0,
          topSpeedKmh: 300
        };
        const cornerMult = spec.cornerGripMult || 1.0;
        const accelMult = spec.accelMult || 1.0;
        const brakeMult = spec.brakeDecelMult || 1.0;
        const topCapMs = (spec.topSpeedKmh || 300) / 3.6;

        const stepM = 10; // High-resolution 10m spatial integration
        const numSteps = Math.floor(totalTrackLength / stepM);
        const nodes = [];
        const vLimitMs = new Array(numSteps);

        // Step 1: Compute true physical cornering speed limit directly from Out-In-Out curvature
        // (no artificial waypoint vTarget cap on straights or flat-out sweepers)
        for (let i = 0; i < numSteps; i++) {
          const s = i * stepM;
          const node = sampleTrackAtS(s);
          nodes.push(node);
          const localMaxKmh = getUpcomingCornerMaxSpeedKmh(s) * cornerMult;
          vLimitMs[i] = Math.min(topCapMs, Math.max(64 / 3.6, localMaxKmh / 3.6));
        }

        // Step 2: Backward Pass — Enforce realistic class braking deceleration (GT3 base = 17.2 m/s^2)
        const vProfileMs = vLimitMs.slice();
        const maxBrakeDecel = 17.2 * brakeMult; // ~1.75G+ aero + mechanical braking
        for (let pass = 0; pass < 2; pass++) {
          for (let i = numSteps - 1; i >= 0; i--) {
            const nextIdx = (i + 1) % numSteps;
            const vNext = vProfileMs[nextIdx];
            const vMaxAllowed = Math.sqrt(vNext * vNext + 2 * maxBrakeDecel * stepM);
            if (vProfileMs[i] > vMaxAllowed) {
              vProfileMs[i] = vMaxAllowed;
            }
          }
        }

        // Step 3A: Closed-Loop Flying Pass (for spatial target lookup getProProfileAtDistance)
        // Matches Player's exact engine curve, 0.08s upshift ignition-cut efficiency (0.955), and latG * 0.38 corner scrub
        const vFlyingMs = vProfileMs.slice();
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < numSteps; i++) {
            const nextIdx = (i + 1) % numSteps;
            const vCurr = vFlyingMs[i];
            const vEff = Math.max(vCurr, 12.5);
            const shiftEff = (vCurr * 3.6 < 252) ? 0.955 : 1.0;
            const engineAccel = Math.min(8.25 * accelMult, (338.0 * accelMult) / vEff) * shiftEff;
            const curv = Math.abs(nodes[i].curvature);
            const latG = (vCurr * vCurr * curv * getCornerLineCutFactor()) / 9.81;
            const dragDecel = 0.000557 * vCurr * vCurr + 0.14 + latG * 0.38;
            const tractionFactor = Math.max(0.28, 1.0 - Math.max(0, (latG - 0.30) / 1.35) * 0.68);
            const netAccel = Math.max(0.22, engineAccel * tractionFactor - dragDecel);
            const vNextMax = Math.sqrt(vCurr * vCurr + 2 * netAccel * stepM);
            if (vFlyingMs[nextIdx] > vNextMax) {
              vFlyingMs[nextIdx] = vNextMax;
            }
          }
        }

        // Step 3B: Standing-Start Lap 1 Pass for PRO Benchmark Ghost (0 km/h launch + 0.35s throttle ramp)
        for (let i = 0; i < numSteps; i++) vProfileMs[i] = vFlyingMs[i];
        vProfileMs[0] = 0.0;
        for (let i = 0; i < numSteps - 1; i++) {
          const vCurr = vProfileMs[i];
          const vEff = Math.max(vCurr, 12.5);
          const launchRamp = (i === 0) ? 0.78 : (i === 1 ? 0.94 : 1.0);
          const shiftEff = (vCurr * 3.6 < 252) ? 0.955 : 1.0;
          const engineAccel = Math.min(8.25 * accelMult, (338.0 * accelMult) / vEff) * launchRamp * shiftEff;
          const curv = Math.abs(nodes[i].curvature);
          const latG = (vCurr * vCurr * curv * getCornerLineCutFactor()) / 9.81;
          const dragDecel = 0.000557 * vCurr * vCurr + 0.14 + latG * 0.38;
          const tractionFactor = Math.max(0.28, 1.0 - Math.max(0, (latG - 0.30) / 1.35) * 0.68);
          const netAccel = Math.max(0.22, engineAccel * tractionFactor - dragDecel);
          const vNextMax = Math.sqrt(vCurr * vCurr + 2 * netAccel * stepM);
          if (vProfileMs[i + 1] > vNextMax) {
            vProfileMs[i + 1] = vNextMax;
          }
        }

        // Step 4: Integrate exact physical lap time & pedal telemetry traces
        // Includes 0.22s human visual reaction delay at Lights Out (s = 0)
        let simTime = 0.22;
        const proPaceFactor = currentCircuit.id === 'monza' ? 1.005 : (currentCircuit.id === 'hakone' ? 0.980 : 0.996);
        for (let i = 0; i < numSteps; i++) {
          const nextIdx = (i + 1) % numSteps;
          const s = i * stepM;
          const node = nodes[i];
          const vCurr = vProfileMs[i];
          const vNext = (i === numSteps - 1) ? vFlyingMs[0] : vProfileMs[nextIdx];
          const vAvg = (i === 0) ? Math.max(5.9, 0.55 * vNext) : Math.max(10.0, 0.5 * (vCurr + vNext));
          const dt = (i === 0) ? (stepM / vAvg) : (stepM / (vAvg * proPaceFactor));
          const fCurr = vFlyingMs[i];
          const fNext = vFlyingMs[nextIdx];
          const longAccel = (fNext * fNext - fCurr * fCurr) / (2 * stepM);

          let throttle = 0;
          let brake = 0;
          if (longAccel < -1.2) {
            brake = Math.min(86, Math.max(15, Math.round((-longAccel / maxBrakeDecel) * 84)));
            throttle = 0;
          } else if (Math.abs(node.curvature) * getCornerLineCutFactor() > 0.0045 && longAccel < 1.0) {
            throttle = Math.max(45, Math.min(85, Math.round(62 + longAccel * 14)));
            brake = 0;
          } else {
            throttle = 100;
            brake = 0;
          }

          const steerDeg = Math.max(-240, Math.min(240, node.curvature * 14500));
          const d = node.optimalD;
          const world = sdToWorld(s, d);

          proTelemetrySamples.push({
            s,
            t: (i === 0) ? 0 : simTime,
            d,
            x: world.x,
            y: world.y,
            z: world.z,
            heading: world.heading,
            speed: vCurr * 3.6,
            refSpeed: fCurr * 3.6,
            throttle,
            brake,
            steer: Math.round(steerDeg),
            latG: (vCurr * vCurr * node.curvature) / 9.81
          });

          simTime += dt;
        }

        // Set true physical PRO_LAP_TIME from the forward-backward solver
        PRO_LAP_TIME = Number(simTime.toFixed(3));
        currentCircuit.proLapTime = PRO_LAP_TIME;
        if (typeof window !== 'undefined') window.PRO_LAP_TIME = PRO_LAP_TIME;
      }

      function sampleGhostAtTime(samples, lapElapsed) {
        if (!samples || samples.length < 2) return null;
        const maxT = samples[samples.length - 1].t || PRO_LAP_TIME;
        const t = lapElapsed % maxT;
        let i = 0;
        while (i < samples.length - 2 && samples[i + 1].t < t) i++;
        const a = samples[i];
        const b = samples[i + 1];
        const span = Math.max(0.0001, b.t - a.t);
        const f = Math.max(0, Math.min(1, (t - a.t) / span));
        let dh = b.heading - a.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        return {
          s: a.s + (b.s - a.s) * f,
          d: a.d + (b.d - a.d) * f,
          x: a.x + (b.x - a.x) * f,
          y: a.y + (b.y - a.y) * f,
          z: a.z + (b.z - a.z) * f,
          heading: a.heading + dh * f,
          speed: a.speed + (b.speed - a.speed) * f,
          brake: a.brake + (b.brake - a.brake) * f
        };
      }

      function getProProfileAtDistance(s) {
        const normS = ((s % totalTrackLength) + totalTrackLength) % totalTrackLength;
        const idx = Math.min(
          proTelemetrySamples.length - 2,
          Math.max(0, Math.floor((normS / totalTrackLength) * proTelemetrySamples.length))
        );
        const a = proTelemetrySamples[idx];
        const b = proTelemetrySamples[idx + 1];
        const f = Math.max(0, Math.min(1, (normS - a.s) / Math.max(1, b.s - a.s)));
        const spdA = (a.refSpeed !== undefined) ? a.refSpeed : a.speed;
        const spdB = (b.refSpeed !== undefined) ? b.refSpeed : b.speed;
        return {
          speedKmh: spdA + (spdB - spdA) * f,
          brake: a.brake + (b.brake - a.brake) * f,
          optimalD: a.d + (b.d - a.d) * f
        };
      }

      function getProTimeAtDistance(s) {
        const normS = ((s % totalTrackLength) + totalTrackLength) % totalTrackLength;
        const idx = Math.min(
          proTelemetrySamples.length - 2,
          Math.max(0, Math.floor((normS / totalTrackLength) * proTelemetrySamples.length))
        );
        const a = proTelemetrySamples[idx];
        const b = proTelemetrySamples[idx + 1];
        const f = Math.max(0, Math.min(1, (normS - a.s) / Math.max(1, b.s - a.s)));
        return a.t + (b.t - a.t) * f;
      }

window.selectedCarClassSpec = window.selectedCarClassSpec || null;
window.rebuildProBenchmarkForCurrentCar = function rebuildProBenchmarkForCurrentCar() {
  if (typeof getCurrentCarHandling === 'function') {
    const h = getCurrentCarHandling();
    window.selectedCarClassSpec = (h && h.classSpec) ? h.classSpec : null;
  }
  generateProBenchmarkLap(window.selectedCarClassSpec);
  if (typeof simState !== 'undefined' && simState) {
    simState.bestLapTime = PRO_LAP_TIME;
    const hudBest = typeof document !== 'undefined' && document.getElementById('hud-best-time');
    if (hudBest) hudBest.textContent = formatLapTime(PRO_LAP_TIME);
  }
};
window.CIRCUITS = CIRCUITS;
window.currentCircuitIndex = currentCircuitIndex;
window.currentCircuit = currentCircuit;
window.sampleTrackAtS = sampleTrackAtS;
window.sdToWorld = sdToWorld;
window.buildTrackGeometryData = buildTrackGeometryData;
window.generateProBenchmarkLap = generateProBenchmarkLap;
window.sampleGhostAtTime = sampleGhostAtTime;
window.proTelemetrySamples = proTelemetrySamples;
window.PRO_LAP_TIME = PRO_LAP_TIME;
window.getCornerLineCutFactor = getCornerLineCutFactor;
window.getUpcomingCornerMaxSpeedKmh = getUpcomingCornerMaxSpeedKmh;
window.getProProfileAtDistance = getProProfileAtDistance;
window.getProTimeAtDistance = getProTimeAtDistance;
if (window.__apexTrace) window.__apexTrace('circuits.js', 'OK');