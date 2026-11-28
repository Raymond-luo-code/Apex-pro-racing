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
          name: 'AUTODROMO NAZIONALE MONZA',
          shortLabel: '極速殿堂:蒙札1:1',
          badgeText: 'MONZA ★★☆',
          difficultyStars: '★★☆',
          country: '🇮🇹 義大利',
          category: 'f1_real',
          lengthKm: 5.79,
          elevationM: 12.5,
          turns: 11,
          cardAccent: '#10b981',
          cardIcon: '🌲',
          cardTag: '★★☆ F1 1:1 速度神殿 · 雙重減速彎',
          cardTitle: '蒙札國家賽車場 MONZA (1:1)',
          cardDesc: '全長 5.79 km 真實重製！結合 1.1km 315+ km/h 大直線、T1 Rettifilo 重煞減速彎、Curva Grande、Roggia、雙萊斯莫與 Ascari 高速 S 彎。',
          defaultTempC: { ambient: 27, track: 41 },
          width: 16.0,
          proLapTime: 103.751,
          elevationAmp1: 2.2,
          elevationAmp2: 1.0,
          glbUrl: 'assets/models/tracks/monza.glb',
          glbTransform: { pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 },
          theme: {
            biome: 'monza_park',
            skyColor: 0x1e3a5f,
            skyTop: 0x0b3c78,
            skyMid: 0x2b6cb0,
            skyHorizon: 0x90cdf4,
            cloudTint: 0xffffff,
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
            { x: 0.00, y: 0.00, z: 0.00, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 46.50, y: 0.21, z: -0.00, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 92.50, y: 0.45, z: 0.01, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 139.00, y: 0.67, z: 0.07, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 185.51, y: 0.97, z: 0.20, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 231.51, y: 1.15, z: 0.34, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 278.01, y: 1.38, z: 0.44, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 324.51, y: 1.65, z: 0.42, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 370.51, y: 1.86, z: 0.24, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 417.01, y: 2.11, z: -0.09, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 463.01, y: 2.36, z: -0.54, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 509.51, y: 2.59, z: -1.08, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 556.01, y: 2.81, z: -1.68, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 602.00, y: 3.05, z: -2.30, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 648.50, y: 3.31, z: -2.91, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 695.00, y: 3.55, z: -3.50, vTarget: 295, name: "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區" },
            { x: 741.00, y: 3.82, z: -4.03, vTarget: 295, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 787.49, y: 4.06, z: -4.56, vTarget: 295, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 833.99, y: 4.30, z: -5.15, vTarget: 295, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 874.75, y: 4.66, z: 0.44, vTarget: 157, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 902.39, y: 4.84, z: 21.98, vTarget: 153, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 940.39, y: 5.18, z: 27.08, vTarget: 170, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 983.38, y: 5.39, z: 10.71, vTarget: 295, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 1027.73, y: 5.66, z: -3.17, vTarget: 295, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 1073.63, y: 5.90, z: -10.26, vTarget: 295, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 1119.60, y: 6.18, z: -11.68, vTarget: 295, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 1166.09, y: 6.34, z: -12.74, vTarget: 295, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 1212.08, y: 6.38, z: -13.39, vTarget: 295, name: "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）" },
            { x: 1258.38, y: 6.37, z: -9.51, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1303.13, y: 6.43, z: 2.85, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1345.57, y: 6.37, z: 20.53, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1384.46, y: 6.50, z: 45.90, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1418.92, y: 6.62, z: 77.07, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1448.76, y: 6.82, z: 112.05, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1474.11, y: 7.06, z: 150.98, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1493.69, y: 7.39, z: 193.13, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1509.22, y: 7.83, z: 236.42, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1521.27, y: 8.27, z: 281.32, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1530.32, y: 8.56, z: 326.92, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1538.31, y: 8.88, z: 372.23, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1546.38, y: 9.22, z: 418.02, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1554.82, y: 9.44, z: 463.75, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1562.96, y: 9.48, z: 509.03, vTarget: 295, name: "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力" },
            { x: 1570.22, y: 9.48, z: 554.96, vTarget: 295, name: "T4-T5 羅吉亞第二減速彎 Variante della Roggia // 林蔭重煞左-右緊湊切換" },
            { x: 1576.70, y: 9.38, z: 601.00, vTarget: 295, name: "T4-T5 羅吉亞第二減速彎 Variante della Roggia // 林蔭重煞左-右緊湊切換" },
            { x: 1583.24, y: 9.22, z: 646.54, vTarget: 147, name: "T4-T5 羅吉亞第二減速彎 Variante della Roggia // 林蔭重煞左-右緊湊切換" },
            { x: 1612.97, y: 8.98, z: 674.71, vTarget: 295, name: "T4-T5 羅吉亞第二減速彎 Variante della Roggia // 林蔭重煞左-右緊湊切換" },
            { x: 1638.35, y: 8.83, z: 706.93, vTarget: 215, name: "T4-T5 羅吉亞第二減速彎 Variante della Roggia // 林蔭重煞左-右緊湊切換" },
            { x: 1653.87, y: 8.55, z: 750.73, vTarget: 295, name: "T4-T5 羅吉亞第二減速彎 Variante della Roggia // 林蔭重煞左-右緊湊切換" },
            { x: 1672.58, y: 8.26, z: 793.30, vTarget: 295, name: "T4-T5 羅吉亞第二減速彎 Variante della Roggia // 林蔭重煞左-右緊湊切換" },
            { x: 1691.76, y: 8.08, z: 835.12, vTarget: 295, name: "T4-T5 羅吉亞第二減速彎 Variante della Roggia // 林蔭重煞左-右緊湊切換" },
            { x: 1710.66, y: 7.87, z: 877.60, vTarget: 295, name: "T4-T5 羅吉亞第二減速彎 Variante della Roggia // 林蔭重煞左-右緊湊切換" },
            { x: 1729.48, y: 7.77, z: 920.12, vTarget: 295, name: "T6 第一萊斯莫右彎 Lesmo 1 // 吃進紅白路緣石後提早補油" },
            { x: 1747.60, y: 7.14, z: 962.40, vTarget: 221, name: "T6 第一萊斯莫右彎 Lesmo 1 // 吃進紅白路緣石後提早補油" },
            { x: 1751.29, y: 6.70, z: 1007.97, vTarget: 156, name: "T6 第一萊斯莫右彎 Lesmo 1 // 吃進紅白路緣石後提早補油" },
            { x: 1727.34, y: 6.45, z: 1047.07, vTarget: 155, name: "T6 第一萊斯莫右彎 Lesmo 1 // 吃進紅白路緣石後提早補油" },
            { x: 1685.37, y: 6.43, z: 1064.31, vTarget: 291, name: "T6 第一萊斯莫右彎 Lesmo 1 // 吃進紅白路緣石後提早補油" },
            { x: 1639.80, y: 6.17, z: 1073.56, vTarget: 295, name: "T6 第一萊斯莫右彎 Lesmo 1 // 吃進紅白路緣石後提早補油" },
            { x: 1594.10, y: 6.07, z: 1082.15, vTarget: 295, name: "T6 第一萊斯莫右彎 Lesmo 1 // 吃進紅白路緣石後提早補油" },
            { x: 1548.96, y: 6.06, z: 1091.04, vTarget: 295, name: "T6 第一萊斯莫右彎 Lesmo 1 // 吃進紅白路緣石後提早補油" },
            { x: 1503.29, y: 6.01, z: 1099.80, vTarget: 295, name: "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速" },
            { x: 1457.55, y: 5.74, z: 1108.05, vTarget: 144, name: "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速" },
            { x: 1420.10, y: 5.71, z: 1085.68, vTarget: 190, name: "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速" },
            { x: 1393.63, y: 5.56, z: 1047.44, vTarget: 295, name: "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速" },
            { x: 1367.38, y: 5.24, z: 1009.66, vTarget: 295, name: "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速" },
            { x: 1340.87, y: 5.28, z: 971.46, vTarget: 295, name: "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速" },
            { x: 1314.28, y: 5.21, z: 933.31, vTarget: 295, name: "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速" },
            { x: 1287.97, y: 5.18, z: 895.58, vTarget: 295, name: "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速" },
            { x: 1261.56, y: 5.27, z: 857.30, vTarget: 295, name: "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速" },
            { x: 1234.75, y: 5.32, z: 819.31, vTarget: 295, name: "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速" },
            { x: 1206.46, y: 5.47, z: 783.05, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 1174.97, y: 5.39, z: 748.86, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 1141.21, y: 4.64, z: 716.88, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 1107.48, y: 3.57, z: 685.60, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 1073.60, y: 2.43, z: 653.75, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 1039.68, y: 1.39, z: 621.94, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 1006.10, y: 0.47, z: 590.50, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 972.15, y: 0.36, z: 558.72, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 938.21, y: 0.63, z: 526.93, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 904.66, y: 1.46, z: 495.47, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 870.73, y: 2.20, z: 463.67, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 837.15, y: 2.81, z: 432.22, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 803.20, y: 3.34, z: 400.44, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 769.29, y: 3.62, z: 368.63, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 735.66, y: 3.66, z: 337.24, vTarget: 176, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 693.83, y: 3.46, z: 326.11, vTarget: 193, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 647.99, y: 3.27, z: 333.26, vTarget: 208, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 603.35, y: 2.92, z: 323.69, vTarget: 193, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 566.17, y: 2.68, z: 296.38, vTarget: 295, name: "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區" },
            { x: 527.54, y: 2.58, z: 274.60, vTarget: 180, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 481.58, y: 2.42, z: 272.74, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 435.09, y: 2.20, z: 271.85, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 388.60, y: 1.95, z: 270.82, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 342.61, y: 1.71, z: 269.84, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 296.11, y: 1.33, z: 269.25, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 249.61, y: 1.12, z: 268.98, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 203.61, y: 0.77, z: 268.90, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 157.11, y: 0.48, z: 268.85, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 110.60, y: 0.21, z: 268.76, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 64.60, y: -0.02, z: 268.62, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: 18.10, y: -0.34, z: 268.45, vTarget: 295, name: "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換" },
            { x: -27.90, y: -0.63, z: 268.30, vTarget: 295, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -74.40, y: -0.77, z: 268.15, vTarget: 295, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -120.90, y: -1.04, z: 268.02, vTarget: 295, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -166.90, y: -1.29, z: 267.91, vTarget: 295, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -213.40, y: -1.61, z: 267.80, vTarget: 295, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -259.90, y: -1.87, z: 267.70, vTarget: 295, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -305.91, y: -2.11, z: 267.61, vTarget: 295, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -352.41, y: -2.30, z: 267.51, vTarget: 295, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -398.91, y: -2.51, z: 267.37, vTarget: 295, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -444.75, y: -2.77, z: 264.76, vTarget: 176, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -483.62, y: -2.94, z: 240.45, vTarget: 171, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -504.92, y: -2.94, z: 199.72, vTarget: 164, name: "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎" },
            { x: -500.82, y: -2.84, z: 154.33, vTarget: 208, name: "T11 帕拉波利卡拋物線右彎 Parabolica / Alboreto // 漸進收油帶煞滑入 Apex 再全油門出彎" },
            { x: -480.39, y: -2.66, z: 112.75, vTarget: 239, name: "T11 帕拉波利卡拋物線右彎 Parabolica / Alboreto // 漸進收油帶煞滑入 Apex 再全油門出彎" },
            { x: -449.15, y: -2.55, z: 78.49, vTarget: 257, name: "T11 帕拉波利卡拋物線右彎 Parabolica / Alboreto // 漸進收油帶煞滑入 Apex 再全油門出彎" },
            { x: -410.93, y: -2.30, z: 53.05, vTarget: 283, name: "T11 帕拉波利卡拋物線右彎 Parabolica / Alboreto // 漸進收油帶煞滑入 Apex 再全油門出彎" },
            { x: -367.90, y: -1.98, z: 35.59, vTarget: 295, name: "T11 帕拉波利卡拋物線右彎 Parabolica / Alboreto // 漸進收油帶煞滑入 Apex 再全油門出彎" },
            { x: -323.16, y: -1.75, z: 25.04, vTarget: 295, name: "T11 帕拉波利卡拋物線右彎 Parabolica / Alboreto // 漸進收油帶煞滑入 Apex 再全油門出彎" },
            { x: -277.10, y: -1.56, z: 18.70, vTarget: 295, name: "T11 帕拉波利卡拋物線右彎 Parabolica / Alboreto // 漸進收油帶煞滑入 Apex 再全油門出彎" },
            { x: -230.83, y: -1.24, z: 14.06, vTarget: 295, name: "T11 帕拉波利卡拋物線右彎 Parabolica / Alboreto // 漸進收油帶煞滑入 Apex 再全油門出彎" },
            { x: -185.13, y: -1.01, z: 8.87, vTarget: 295, name: "起終點大直線衝刺 // 全油門通過終點龍門架" },
            { x: -138.87, y: -0.69, z: 4.09, vTarget: 295, name: "起終點大直線衝刺 // 全油門通過終點龍門架" },
            { x: -92.49, y: -0.40, z: 0.80, vTarget: 295, name: "起終點大直線衝刺 // 全油門通過終點龍門架" },
            { x: -46.50, y: -0.19, z: -0.01, vTarget: 295, name: "起終點大直線衝刺 // 全油門通過終點龍門架" }
          ]
        },
{
          id: 'fuji',
          name: 'MOUNT FUJI TECHNICAL GP',
          shortLabel: '中階:富士GP',
          badgeText: 'FUJI GP ★★★',
          difficultyStars: '★★★',
          country: '🇯🇵 日本',
          category: 'original',
          lengthKm: 5.42,
          elevationM: 12.5,
          turns: 15,
          cardAccent: '#6366f1',
          cardIcon: '🗻',
          cardTag: '★★★ 中階技術 · 黃金夕陽',
          cardTitle: '富士山國際大獎賽道 FUJI',
          cardDesc: '全長 5.42 km，結合 1.1km 大直線、2 座重煞髮夾彎（極限 74 km/h）與連續高速 S 彎重心轉移區，夕陽斜射下極富競技張力。',
          defaultTempC: { ambient: 19, track: 26 },
          country: '🇯🇵 日本',
          category: 'original',
          lengthKm: 5.42,
          elevationM: 12.5,
          turns: 15,
          cardAccent: '#6366f1',
          cardIcon: '🗻',
          cardTag: '★★★ 中階技術 · 黃金夕陽',
          cardTitle: '富士山國際大獎賽道 FUJI',
          cardDesc: '全長 5.42 km，結合 1.1km 大直線、2 座重煞髮夾彎（極限 74 km/h）與連續高速 S 彎重心轉移區，夕陽斜射下極富競技張力。',
          defaultTempC: { ambient: 19, track: 26 },
          width: 20.0,
          proLapTime: 86.270,
          elevationAmp1: 5.5,
          elevationAmp2: 2.8,
          theme: {
            biome: 'fuji_sunset',
            skyColor: 0x1a162b,
            skyTop: 0x161233,
            skyMid: 0x6b274b,
            skyHorizon: 0xfb923c,
            cloudTint: 0xffd7b5,
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
          country: '🇯🇵 日本',
          category: 'original',
          lengthKm: 5.50,
          elevationM: 28.4,
          turns: 12,
          cardAccent: '#f43f5e',
          cardIcon: '🌙',
          cardTag: '★★★★★ 魔鬼山道 · 午夜霓虹',
          cardTitle: '箱根午夜山道大獎賽 HAKONE',
          cardDesc: '全長 5.50 km，高低落差劇烈（28m），遍布急促連髮夾彎與盲彎。夜間開啟遠光頭燈束與霓虹拱門，極度考驗精準重煞控制！',
          defaultTempC: { ambient: 14, track: 17 },
          country: '🇯🇵 日本',
          category: 'original',
          lengthKm: 5.50,
          elevationM: 28.4,
          turns: 12,
          cardAccent: '#f43f5e',
          cardIcon: '🌙',
          cardTag: '★★★★★ 魔鬼山道 · 午夜霓虹',
          cardTitle: '箱根午夜山道大獎賽 HAKONE',
          cardDesc: '全長 5.50 km，高低落差劇烈（28m），遍布急促連髮夾彎與盲彎。夜間開啟遠光頭燈束與霓虹拱門，極度考驗精準重煞控制！',
          defaultTempC: { ambient: 14, track: 17 },
          width: 16.5,
          proLapTime: 94.983,
          elevationAmp1: 12.5,
          elevationAmp2: 6.4,
          theme: {
            biome: 'hakone_night',
            skyColor: 0x040711,
            skyTop: 0x020617,
            skyMid: 0x0b1630,
            skyHorizon: 0x172554,
            cloudTint: 0x1e3a5f,
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
          country: '🇧🇪 比利時',
          category: 'f1_real',
          lengthKm: 7.00,
          elevationM: 102.3,
          turns: 19,
          cardAccent: '#f59e0b',
          cardIcon: '⛰️',
          cardTag: '★★★★ F1 1:1 真實遙測 · 高低差 102m',
          cardTitle: '斯帕-弗朗科爾尚 SPA GP (1:1)',
          cardDesc: '真實 7.0 km × 102.3 m 高低落差阿登森林殿堂！從 La Source 俯衝紅水河谷再爬升 Eau Rouge / Raidillon、凱梅爾高原直奔 Pouhon 與公車站減速彎。',
          defaultTempC: { ambient: 20, track: 29 },
          country: '🇧🇪 比利時',
          category: 'f1_real',
          lengthKm: 7.00,
          elevationM: 102.3,
          turns: 19,
          cardAccent: '#f59e0b',
          cardIcon: '⛰️',
          cardTag: '★★★★ F1 1:1 真實遙測 · 高低差 102m',
          cardTitle: '斯帕-弗朗科爾尚 SPA GP (1:1)',
          cardDesc: '真實 7.0 km × 102.3 m 高低落差阿登森林殿堂！從 La Source 俯衝紅水河谷再爬升 Eau Rouge / Raidillon、凱梅爾高原直奔 Pouhon 與公車站減速彎。',
          defaultTempC: { ambient: 20, track: 29 },
          width: 16.0,
          proLapTime: 138.139,
          elevationAmp1: 14.0,
          elevationAmp2: 6.5,
          glbUrl: 'assets/models/tracks/spa_francorchamps.glb',
          glbTransform: { pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 },
          theme: {
            biome: 'spa_ardennes',
            skyColor: 0x162a45,
            skyTop: 0x132b4f,
            skyMid: 0x3b638c,
            skyHorizon: 0xa5c3db,
            cloudTint: 0xe2e8f0,
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
            { x: 0.00, y: 0.00, z: 0.00, vTarget: 295, name: "T1 斯帕起跑下坡直道 // 對準 La Source 髮夾彎重煞區" },
            { x: 82.50, y: 1.52, z: 0.11, vTarget: 295, name: "T1 斯帕起跑下坡直道 // 對準 La Source 髮夾彎重煞區" },
            { x: 164.51, y: 3.09, z: 0.19, vTarget: 295, name: "T1 斯帕起跑下坡直道 // 對準 La Source 髮夾彎重煞區" },
            { x: 232.77, y: 5.15, z: 2.58, vTarget: 251, name: "T1 拉索斯髮夾彎 La Source // 重煞貼緊內側路緣石、提早回正出彎" },
            { x: 262.52, y: 8.10, z: 12.11, vTarget: 177, name: "T1 拉索斯髮夾彎 La Source // 重煞貼緊內側路緣石、提早回正出彎" },
            { x: 280.16, y: 8.15, z: 24.27, vTarget: 105, name: "T1 拉索斯髮夾彎 La Source // 重煞貼緊內側路緣石、提早回正出彎" },
            { x: 286.43, y: 7.97, z: 39.39, vTarget: 116, name: "T1 拉索斯髮夾彎 La Source // 重煞貼緊內側路緣石、提早回正出彎" },
            { x: 285.85, y: 7.57, z: 56.64, vTarget: 148, name: "T1 拉索斯髮夾彎 La Source // 重煞貼緊內側路緣石、提早回正出彎" },
            { x: 279.24, y: 4.60, z: 75.84, vTarget: 145, name: "T1B 拉索斯出彎下坡加速段 // 順著下坡直衝紅水河谷" },
            { x: 244.98, y: -0.27, z: 105.32, vTarget: 295, name: "T1B 拉索斯出彎下坡加速段 // 順著下坡直衝紅水河谷" },
            { x: 187.10, y: -4.39, z: 136.97, vTarget: 295, name: "T1B 拉索斯出彎下坡加速段 // 順著下坡直衝紅水河谷" },
            { x: 125.43, y: -8.58, z: 163.13, vTarget: 295, name: "T1B 拉索斯出彎下坡加速段 // 順著下坡直衝紅水河谷" },
            { x: 69.40, y: -11.57, z: 181.40, vTarget: 295, name: "T1B 拉索斯出彎下坡加速段 // 順著下坡直衝紅水河谷" },
            { x: -2.72, y: -15.02, z: 195.54, vTarget: 295, name: "T1B 拉索斯出彎下坡加速段 // 順著下坡直衝紅水河谷" },
            { x: -82.88, y: -19.36, z: 210.27, vTarget: 295, name: "T2 艾爾羅格河谷壓縮點 Eau Rouge // 全油門壓入左彎谷底" },
            { x: -163.58, y: -22.91, z: 224.86, vTarget: 295, name: "T2 艾爾羅格河谷壓縮點 Eau Rouge // 全油門壓入左彎谷底" },
            { x: -232.27, y: -25.22, z: 238.30, vTarget: 293, name: "T2 艾爾羅格河谷壓縮點 Eau Rouge // 全油門壓入左彎谷底" },
            { x: -259.81, y: -25.02, z: 249.83, vTarget: 295, name: "T3-T4 雷迪永陡坡盲彎 Raidillon (+14.5%) // 全油門爬升盲彎頂點" },
            { x: -300.09, y: -22.14, z: 271.95, vTarget: 233, name: "T3-T4 雷迪永陡坡盲彎 Raidillon (+14.5%) // 全油門爬升盲彎頂點" },
            { x: -328.49, y: -18.36, z: 279.50, vTarget: 206, name: "T3-T4 雷迪永陡坡盲彎 Raidillon (+14.5%) // 全油門爬升盲彎頂點" },
            { x: -366.89, y: -11.54, z: 278.85, vTarget: 245, name: "T3-T4 雷迪永陡坡盲彎 Raidillon (+14.5%) // 全油門爬升盲彎頂點" },
            { x: -407.96, y: -6.98, z: 268.27, vTarget: 295, name: "T3-T4 雷迪永陡坡盲彎 Raidillon (+14.5%) // 全油門爬升盲彎頂點" },
            { x: -453.32, y: -2.16, z: 251.23, vTarget: 228, name: "T3-T4 雷迪永陡坡盲彎 Raidillon (+14.5%) // 全油門爬升盲彎頂點" },
            { x: -488.60, y: -0.08, z: 248.40, vTarget: 295, name: "T3-T4 雷迪永陡坡盲彎 Raidillon (+14.5%) // 全油門爬升盲彎頂點" },
            { x: -563.51, y: 3.15, z: 252.04, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -645.42, y: 7.06, z: 256.05, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -724.83, y: 10.76, z: 259.80, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -781.26, y: 13.13, z: 258.44, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -841.08, y: 15.93, z: 246.71, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -920.23, y: 19.41, z: 227.26, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -999.86, y: 23.12, z: 207.70, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -1080.00, y: 27.01, z: 188.07, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -1159.63, y: 30.74, z: 168.50, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -1239.73, y: 34.57, z: 148.74, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -1319.83, y: 38.45, z: 128.96, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -1399.93, y: 42.21, z: 109.21, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -1479.57, y: 46.08, z: 89.65, vTarget: 295, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -1546.47, y: 48.77, z: 72.80, vTarget: 266, name: "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區" },
            { x: -1566.83, y: 49.55, z: 62.35, vTarget: 128, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1577.88, y: 50.27, z: 48.37, vTarget: 123, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1582.68, y: 51.14, z: 27.52, vTarget: 197, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1583.24, y: 51.75, z: 4.08, vTarget: 141, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1590.71, y: 52.15, z: -13.81, vTarget: 140, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1604.15, y: 52.61, z: -28.48, vTarget: 130, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1624.69, y: 53.10, z: -37.25, vTarget: 295, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1693.08, y: 53.80, z: -56.34, vTarget: 295, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1721.00, y: 53.72, z: -68.32, vTarget: 142, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1734.25, y: 53.58, z: -82.91, vTarget: 139, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1742.60, y: 53.46, z: -106.99, vTarget: 246, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1748.45, y: 52.75, z: -150.70, vTarget: 295, name: "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換" },
            { x: -1755.64, y: 50.20, z: -230.88, vTarget: 295, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1762.87, y: 46.44, z: -312.57, vTarget: 295, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1769.87, y: 41.62, z: -391.26, vTarget: 295, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1768.88, y: 39.91, z: -418.56, vTarget: 121, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1756.59, y: 38.32, z: -436.59, vTarget: 151, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1740.37, y: 36.77, z: -448.94, vTarget: 134, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1722.69, y: 35.35, z: -454.01, vTarget: 128, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1704.41, y: 34.06, z: -452.04, vTarget: 127, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1688.28, y: 32.75, z: -443.23, vTarget: 128, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1676.88, y: 31.39, z: -429.43, vTarget: 134, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1670.27, y: 29.95, z: -409.08, vTarget: 201, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1669.47, y: 26.70, z: -361.64, vTarget: 295, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1667.61, y: 21.63, z: -290.67, vTarget: 295, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1663.11, y: 20.00, z: -267.73, vTarget: 137, name: "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油" },
            { x: -1653.04, y: 18.81, z: -252.33, vTarget: 130, name: "T11 雙向速度轉換區 // 準備高速切入雙左普昂彎" },
            { x: -1637.09, y: 17.59, z: -241.33, vTarget: 167, name: "T11 雙向速度轉換區 // 準備高速切入雙左普昂彎" },
            { x: -1601.40, y: 15.52, z: -231.96, vTarget: 295, name: "T11 雙向速度轉換區 // 準備高速切入雙左普昂彎" },
            { x: -1524.33, y: 9.29, z: -217.03, vTarget: 295, name: "T11 雙向速度轉換區 // 準備高速切入雙左普昂彎" },
            { x: -1459.19, y: 4.62, z: -201.46, vTarget: 295, name: "T11 雙向速度轉換區 // 準備高速切入雙左普昂彎" },
            { x: -1390.86, y: -0.31, z: -178.77, vTarget: 295, name: "T11 雙向速度轉換區 // 準備高速切入雙左普昂彎" },
            { x: -1313.11, y: -5.91, z: -151.18, vTarget: 295, name: "T11 雙向速度轉換區 // 準備高速切入雙左普昂彎" },
            { x: -1238.27, y: -11.77, z: -124.36, vTarget: 295, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1188.02, y: -15.71, z: -107.71, vTarget: 234, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1157.17, y: -17.73, z: -106.08, vTarget: 184, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1130.14, y: -19.46, z: -112.93, vTarget: 184, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1102.98, y: -21.22, z: -129.70, vTarget: 178, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1084.21, y: -23.12, z: -152.95, vTarget: 295, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1052.47, y: -27.62, z: -201.45, vTarget: 285, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1038.37, y: -30.29, z: -237.70, vTarget: 219, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1034.79, y: -32.29, z: -273.42, vTarget: 230, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1040.45, y: -34.44, z: -311.90, vTarget: 231, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1055.56, y: -35.89, z: -347.75, vTarget: 259, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1086.69, y: -37.35, z: -389.94, vTarget: 295, name: "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗" },
            { x: -1133.52, y: -39.15, z: -449.16, vTarget: 295, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1183.70, y: -39.44, z: -512.76, vTarget: 295, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1233.18, y: -38.68, z: -575.62, vTarget: 295, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1264.52, y: -38.35, z: -617.06, vTarget: 222, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1274.09, y: -38.15, z: -641.65, vTarget: 161, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1274.96, y: -37.93, z: -665.02, vTarget: 154, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1267.98, y: -37.76, z: -687.35, vTarget: 150, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1255.80, y: -37.62, z: -703.70, vTarget: 183, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1225.63, y: -37.41, z: -725.81, vTarget: 295, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1198.54, y: -37.42, z: -741.70, vTarget: 168, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1181.57, y: -37.59, z: -762.57, vTarget: 158, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1174.38, y: -37.76, z: -782.17, vTarget: 159, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1173.61, y: -38.00, z: -808.55, vTarget: 162, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1181.18, y: -38.18, z: -832.24, vTarget: 295, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1214.91, y: -39.24, z: -894.72, vTarget: 295, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1250.86, y: -41.17, z: -964.50, vTarget: 295, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1266.37, y: -42.80, z: -1000.58, vTarget: 295, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1275.70, y: -43.41, z: -1028.37, vTarget: 113, name: "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移" },
            { x: -1270.30, y: -44.02, z: -1045.91, vTarget: 132, name: "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速" },
            { x: -1256.21, y: -44.87, z: -1062.69, vTarget: 155, name: "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速" },
            { x: -1224.53, y: -46.05, z: -1078.50, vTarget: 295, name: "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速" },
            { x: -1158.79, y: -47.90, z: -1109.06, vTarget: 295, name: "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速" },
            { x: -1121.20, y: -48.44, z: -1123.83, vTarget: 192, name: "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速" },
            { x: -1092.85, y: -48.42, z: -1125.25, vTarget: 193, name: "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速" },
            { x: -1061.81, y: -48.15, z: -1117.93, vTarget: 183, name: "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速" },
            { x: -1038.28, y: -47.61, z: -1103.90, vTarget: 211, name: "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速" },
            { x: -1004.90, y: -46.05, z: -1066.75, vTarget: 295, name: "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速" },
            { x: -968.56, y: -44.11, z: -1018.43, vTarget: 295, name: "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速" },
            { x: -942.80, y: -42.47, z: -969.90, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -922.30, y: -40.44, z: -913.01, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -902.34, y: -38.17, z: -840.72, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -891.46, y: -36.68, z: -785.33, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -889.81, y: -35.13, z: -728.41, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -893.11, y: -33.60, z: -651.48, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -896.23, y: -32.04, z: -578.05, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -896.43, y: -30.93, z: -523.62, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -886.97, y: -29.82, z: -472.04, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -869.26, y: -28.59, z: -423.21, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -842.33, y: -27.18, z: -378.81, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -796.92, y: -24.87, z: -316.01, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -755.75, y: -23.19, z: -259.39, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -728.48, y: -22.33, z: -233.08, vTarget: 223, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -699.46, y: -21.57, z: -216.58, vTarget: 224, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -653.36, y: -20.32, z: -205.47, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -575.33, y: -19.35, z: -193.10, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -494.85, y: -18.09, z: -180.21, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -432.58, y: -16.45, z: -167.96, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -375.49, y: -14.46, z: -148.04, vTarget: 295, name: "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎" },
            { x: -309.05, y: -11.62, z: -117.80, vTarget: 295, name: "T18-T19 公車站減速彎 Bus Stop Chicane // 全場最後重煞超車點！" },
            { x: -256.92, y: -8.85, z: -89.70, vTarget: 295, name: "T18-T19 公車站減速彎 Bus Stop Chicane // 全場最後重煞超車點！" },
            { x: -221.98, y: -7.75, z: -66.51, vTarget: 149, name: "T18-T19 公車站減速彎 Bus Stop Chicane // 全場最後重煞超車點！" },
            { x: -212.15, y: -7.15, z: -48.85, vTarget: 295, name: "T18-T19 公車站減速彎 Bus Stop Chicane // 全場最後重煞超車點！" },
            { x: -204.50, y: -6.36, z: -33.88, vTarget: 294, name: "T18-T19 公車站減速彎 Bus Stop Chicane // 全場最後重煞超車點！" },
            { x: -195.87, y: -5.72, z: -19.48, vTarget: 119, name: "T18-T19 公車站減速彎 Bus Stop Chicane // 全場最後重煞超車點！" },
            { x: -180.00, y: -4.92, z: -8.69, vTarget: 155, name: "T18-T19 公車站減速彎 Bus Stop Chicane // 全場最後重煞超車點！" },
            { x: -149.67, y: -3.46, z: -1.41, vTarget: 286, name: "T18-T19 公車站減速彎 Bus Stop Chicane // 全場最後重煞超車點！" },
            { x: -82.00, y: -1.53, z: 0.21, vTarget: 295, name: "T20 斯帕終點直線衝刺 // 全油門衝過起終點龍門架" }
          ]
        },
        {
          id: 'suzuka',
          name: 'SUZUKA INTERNATIONAL RACING COURSE',
          shortLabel: '傳奇八字:鈴鹿1:1',
          badgeText: 'SUZUKA ★★★★',
          difficultyStars: '★★★★',
          country: '🇯🇵 日本',
          category: 'f1_real',
          lengthKm: 5.80,
          elevationM: 40.3,
          turns: 18,
          cardAccent: '#06b6d4',
          cardIcon: '🌉',
          cardTag: '★★★★ F1 1:1 經典八字立體橋 · 高差 40m',
          cardTitle: '鈴鹿國際賽道 SUZUKA (1:1)',
          cardDesc: '全長 5.80 km 真實重製！傳奇八字立體交叉、高速連續 S 彎、Degner 涵洞下穿、髮夾彎、湯匙雙頂點與高架橋上直奔 130R 與卡西歐三角彎。',
          defaultTempC: { ambient: 22, track: 33 },
          width: 16.0,
          proLapTime: 116.334,
          elevationAmp1: 9.5,
          elevationAmp2: 4.5,
          glbUrl: 'assets/models/tracks/suzuka_circuit.glb',
          glbTransform: { pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 },
          theme: {
            biome: 'suzuka_bay',
            skyColor: 0x172554,
            skyTop: 0x0f2f6b,
            skyMid: 0x2c639e,
            skyHorizon: 0x9bd0f5,
            cloudTint: 0xf8fafc,
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
            { x: 0.00, y: 0.00, z: 0.00, vTarget: 295, name: "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎" },
            { x: 43.00, y: -1.17, z: 0.14, vTarget: 295, name: "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎" },
            { x: 86.00, y: -2.34, z: 0.33, vTarget: 295, name: "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎" },
            { x: 129.00, y: -3.67, z: 0.47, vTarget: 295, name: "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎" },
            { x: 172.00, y: -4.84, z: 0.60, vTarget: 295, name: "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎" },
            { x: 215.00, y: -6.01, z: 0.76, vTarget: 295, name: "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎" },
            { x: 257.99, y: -7.23, z: 0.95, vTarget: 295, name: "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎" },
            { x: 300.99, y: -8.47, z: 1.17, vTarget: 295, name: "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎" },
            { x: 343.99, y: -9.64, z: 1.43, vTarget: 295, name: "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎" },
            { x: 386.99, y: -10.86, z: 1.74, vTarget: 295, name: "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎" },
            { x: 429.99, y: -11.93, z: 2.11, vTarget: 295, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 472.99, y: -13.27, z: 2.54, vTarget: 295, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 515.98, y: -14.37, z: 3.04, vTarget: 295, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 558.98, y: -15.59, z: 3.48, vTarget: 295, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 601.98, y: -16.69, z: 3.43, vTarget: 295, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 644.85, y: -17.86, z: 5.78, vTarget: 207, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 684.08, y: -19.15, z: 22.30, vTarget: 171, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 710.88, y: -19.78, z: 55.63, vTarget: 295, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 731.95, y: -19.78, z: 92.98, vTarget: 159, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 729.86, y: -19.13, z: 134.95, vTarget: 140, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 701.05, y: -18.01, z: 165.64, vTarget: 137, name: "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）" },
            { x: 658.84, y: -16.96, z: 168.99, vTarget: 262, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 616.25, y: -16.38, z: 163.10, vTarget: 295, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 574.04, y: -15.66, z: 158.09, vTarget: 295, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 531.39, y: -14.87, z: 152.63, vTarget: 295, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 488.55, y: -14.25, z: 152.45, vTarget: 172, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 451.03, y: -13.23, z: 172.27, vTarget: 212, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 421.58, y: -11.74, z: 203.57, vTarget: 197, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 383.30, y: -9.80, z: 221.49, vTarget: 149, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 341.81, y: -8.16, z: 213.16, vTarget: 254, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 302.69, y: -5.46, z: 195.31, vTarget: 295, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 262.18, y: -3.77, z: 181.63, vTarget: 181, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 219.87, y: -1.96, z: 186.75, vTarget: 171, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 185.08, y: -0.06, z: 211.40, vTarget: 252, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 156.75, y: 1.39, z: 243.74, vTarget: 216, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 120.15, y: 1.82, z: 265.34, vTarget: 172, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 77.63, y: 1.47, z: 267.22, vTarget: 165, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 40.03, y: 0.54, z: 247.57, vTarget: 169, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: 16.45, y: -0.16, z: 211.78, vTarget: 295, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: -5.23, y: 0.77, z: 174.64, vTarget: 228, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: -36.10, y: 3.68, z: 145.49, vTarget: 165, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: -77.50, y: 6.67, z: 135.77, vTarget: 172, name: "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋" },
            { x: -118.79, y: 9.68, z: 146.75, vTarget: 277, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -157.38, y: 12.07, z: 165.65, vTarget: 295, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -192.34, y: 13.50, z: 190.39, vTarget: 257, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -220.97, y: 14.08, z: 222.44, vTarget: 295, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -243.71, y: 13.83, z: 258.80, vTarget: 240, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -256.36, y: 13.34, z: 299.87, vTarget: 295, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -264.04, y: 12.77, z: 342.07, vTarget: 252, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -261.68, y: 12.22, z: 384.94, vTarget: 295, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -254.46, y: 11.62, z: 427.32, vTarget: 295, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -246.55, y: 11.14, z: 469.59, vTarget: 295, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -238.58, y: 10.50, z: 511.84, vTarget: 295, name: "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎" },
            { x: -236.04, y: 9.85, z: 554.20, vTarget: 146, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -260.39, y: 8.91, z: 589.59, vTarget: 295, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -285.13, y: 7.63, z: 624.75, vTarget: 295, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -309.84, y: 5.89, z: 659.94, vTarget: 139, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -346.52, y: 4.93, z: 669.91, vTarget: 132, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -384.41, y: 4.81, z: 649.58, vTarget: 295, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -422.27, y: 5.39, z: 629.19, vTarget: 295, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -459.95, y: 4.77, z: 608.48, vTarget: 295, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -497.57, y: 6.04, z: 587.65, vTarget: 295, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -535.25, y: 7.83, z: 566.95, vTarget: 295, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -572.98, y: 10.11, z: 546.32, vTarget: 295, name: "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞" },
            { x: -607.89, y: 12.19, z: 521.45, vTarget: 197, name: "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎" },
            { x: -629.64, y: 14.34, z: 488.63, vTarget: 165, name: "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎" },
            { x: -644.92, y: 16.47, z: 477.77, vTarget: 99, name: "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎" },
            { x: -658.84, y: 17.63, z: 476.96, vTarget: 87, name: "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎" },
            { x: -669.70, y: 18.35, z: 483.26, vTarget: 89, name: "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎" },
            { x: -676.27, y: 18.57, z: 495.93, vTarget: 108, name: "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎" },
            { x: -675.73, y: 18.72, z: 516.18, vTarget: 203, name: "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎" },
            { x: -663.28, y: 18.96, z: 557.33, vTarget: 295, name: "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎" },
            { x: -653.39, y: 19.19, z: 599.09, vTarget: 284, name: "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎" },
            { x: -651.39, y: 19.52, z: 641.94, vTarget: 238, name: "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎" },
            { x: -660.60, y: 19.99, z: 683.80, vTarget: 211, name: "T11 鈴鹿髮夾彎 Hairpin // 全場最慢低速左髮夾，耐心等待車頭回正再全油門" },
            { x: -683.05, y: 19.98, z: 720.35, vTarget: 295, name: "T11 鈴鹿髮夾彎 Hairpin // 全場最慢低速左髮夾，耐心等待車頭回正再全油門" },
            { x: -709.81, y: 19.19, z: 753.96, vTarget: 295, name: "T11 鈴鹿髮夾彎 Hairpin // 全場最慢低速左髮夾，耐心等待車頭回正再全油門" },
            { x: -741.07, y: 17.64, z: 783.43, vTarget: 295, name: "T11 鈴鹿髮夾彎 Hairpin // 全場最慢低速左髮夾，耐心等待車頭回正再全油門" },
            { x: -775.63, y: 15.59, z: 808.98, vTarget: 295, name: "T11 鈴鹿髮夾彎 Hairpin // 全場最慢低速左髮夾，耐心等待車頭回正再全油門" },
            { x: -812.40, y: 14.62, z: 831.27, vTarget: 295, name: "T11 鈴鹿髮夾彎 Hairpin // 全場最慢低速左髮夾，耐心等待車頭回正再全油門" },
            { x: -850.69, y: 14.84, z: 850.72, vTarget: 295, name: "T11 鈴鹿髮夾彎 Hairpin // 全場最慢低速左髮夾，耐心等待車頭回正再全油門" },
            { x: -891.52, y: 16.01, z: 864.10, vTarget: 295, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -933.92, y: 17.50, z: 870.89, vTarget: 293, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -976.86, y: 18.49, z: 870.20, vTarget: 293, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1019.03, y: 19.28, z: 862.05, vTarget: 295, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1060.29, y: 19.88, z: 849.98, vTarget: 295, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1101.58, y: 20.21, z: 837.94, vTarget: 295, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1142.83, y: 20.33, z: 825.82, vTarget: 264, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1185.06, y: 20.29, z: 822.75, vTarget: 154, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1221.74, y: 20.37, z: 844.03, vTarget: 187, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1246.85, y: 20.41, z: 878.82, vTarget: 249, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1262.90, y: 20.37, z: 918.55, vTarget: 156, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1254.51, y: 20.18, z: 959.57, vTarget: 144, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1222.08, y: 19.24, z: 986.75, vTarget: 166, name: "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區" },
            { x: -1180.05, y: 16.89, z: 994.20, vTarget: 225, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -1137.40, y: 13.66, z: 989.12, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -1095.14, y: 10.34, z: 981.18, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -1053.43, y: 8.00, z: 970.79, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -1012.19, y: 6.86, z: 958.61, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -971.30, y: 6.80, z: 945.31, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -930.94, y: 7.33, z: 930.50, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -891.38, y: 8.29, z: 913.66, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -852.49, y: 9.37, z: 895.32, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -813.85, y: 10.32, z: 876.45, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -776.87, y: 11.43, z: 854.53, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -740.12, y: 12.12, z: 832.21, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -703.32, y: 12.39, z: 809.95, vTarget: 295, name: "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速" },
            { x: -666.35, y: 12.48, z: 787.99, vTarget: 295, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -629.18, y: 12.75, z: 766.38, vTarget: 295, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -592.00, y: 13.35, z: 744.79, vTarget: 295, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -554.92, y: 14.41, z: 723.01, vTarget: 295, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -517.82, y: 16.06, z: 701.28, vTarget: 295, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -480.64, y: 18.03, z: 679.67, vTarget: 295, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -444.12, y: 19.68, z: 657.94, vTarget: 295, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -407.55, y: 17.98, z: 635.31, vTarget: 295, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -372.99, y: 19.71, z: 609.99, vTarget: 187, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -351.82, y: 18.10, z: 572.87, vTarget: 295, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -336.78, y: 16.46, z: 532.61, vTarget: 295, name: "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！" },
            { x: -326.84, y: 15.36, z: 490.84, vTarget: 295, name: "T15 130R 超高速左彎 // 高速膽量考驗彎，微收油門或全油門切過內緣" },
            { x: -322.88, y: 15.00, z: 448.03, vTarget: 295, name: "T15 130R 超高速左彎 // 高速膽量考驗彎，微收油門或全油門切過內緣" },
            { x: -323.69, y: 15.13, z: 405.04, vTarget: 295, name: "T15 130R 超高速左彎 // 高速膽量考驗彎，微收油門或全油門切過內緣" },
            { x: -325.88, y: 15.47, z: 362.10, vTarget: 295, name: "T15 130R 超高速左彎 // 高速膽量考驗彎，微收油門或全油門切過內緣" },
            { x: -328.09, y: 16.20, z: 319.16, vTarget: 295, name: "T15 130R 超高速左彎 // 高速膽量考驗彎，微收油門或全油門切過內緣" },
            { x: -330.28, y: 16.91, z: 276.21, vTarget: 295, name: "T15 130R 超高速左彎 // 高速膽量考驗彎，微收油門或全油門切過內緣" },
            { x: -330.35, y: 17.63, z: 233.23, vTarget: 183, name: "T15 130R 超高速左彎 // 高速膽量考驗彎，微收油門或全油門切過內緣" },
            { x: -314.68, y: 17.34, z: 197.75, vTarget: 136, name: "T16-T18 卡西歐三角減速彎 Casio Triangle // 全場最關鍵重煞右-左最後超車點" },
            { x: -280.59, y: 16.41, z: 180.63, vTarget: 126, name: "T16-T18 卡西歐三角減速彎 Casio Triangle // 全場最關鍵重煞右-左最後超車點" },
            { x: -268.45, y: 15.63, z: 144.06, vTarget: 271, name: "T16-T18 卡西歐三角減速彎 Casio Triangle // 全場最關鍵重煞右-左最後超車點" },
            { x: -263.00, y: 14.06, z: 101.62, vTarget: 187, name: "T16-T18 卡西歐三角減速彎 Casio Triangle // 全場最關鍵重煞右-左最後超車點" },
            { x: -240.82, y: 11.32, z: 65.27, vTarget: 214, name: "T16-T18 卡西歐三角減速彎 Casio Triangle // 全場最關鍵重煞右-左最後超車點" },
            { x: -207.91, y: 8.28, z: 37.61, vTarget: 266, name: "T16-T18 卡西歐三角減速彎 Casio Triangle // 全場最關鍵重煞右-左最後超車點" },
            { x: -170.11, y: 5.88, z: 17.55, vTarget: 260, name: "T16-T18 卡西歐三角減速彎 Casio Triangle // 全場最關鍵重煞右-左最後超車點" },
            { x: -128.68, y: 3.96, z: 6.21, vTarget: 295, name: "T18 最終下坡直線 // 全油門衝過起終點龍門架" },
            { x: -85.98, y: 2.61, z: 1.50, vTarget: 295, name: "T18 最終下坡直線 // 全油門衝過起終點龍門架" },
            { x: -43.00, y: 1.20, z: 0.27, vTarget: 295, name: "T18 最終下坡直線 // 全油門衝過起終點龍門架" }
          ]
        },
        {
          id: 'silverstone',
          name: 'SILVERSTONE CIRCUIT GP',
          shortLabel: 'F1發源地:銀石1:1',
          badgeText: 'SILVERSTONE ★★★★',
          difficultyStars: '★★★★',
          country: '🇬🇧 英國',
          category: 'f1_real',
          lengthKm: 5.89,
          elevationM: 11.3,
          turns: 18,
          cardAccent: '#38bdf8',
          cardIcon: '🇬🇧',
          cardTag: '★★★★ F1 1:1 極速S彎聖殿 · 高速空力',
          cardTitle: '銀石賽道 SILVERSTONE GP (1:1)',
          cardDesc: '全長 5.89 km！包含 Copse 超高Ｇ力右彎、殿堂級 Maggotts–Becketts–Chapel 極速連續重心轉換、機棚長直道與 Stowe / Club 組合彎。',
          defaultTempC: { ambient: 18, track: 25 },
          width: 16.0,
          proLapTime: 119.558,
          elevationAmp1: 3.0,
          elevationAmp2: 1.5,
          glbUrl: 'assets/models/tracks/silverstone.glb',
          glbTransform: { pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 },
          theme: {
            biome: 'silverstone_uk',
            skyColor: 0x1e293b,
            skyTop: 0x1e3a5f,
            skyMid: 0x475569,
            skyHorizon: 0xcbd5e1,
            cloudTint: 0xf1f5f9,
            fogColor: 0x334155,
            fogDensity: 0.00052,
            hemiSky: 0xe2e8f0,
            hemiGround: 0x14281d,
            hemiIntensity: 1.12,
            sunColor: 0xf8fafc,
            sunIntensity: 1.24,
            sunPos: [320, 480, -340],
            grassColor: 0x14331d,
            treePrimary: 0x166534,
            treeSecondary: 0x3f6212,
            isNight: false,
            hasSunsetFlare: false
          },
          points: [
            { x: 0.00, y: 0.00, z: 0.00, vTarget: 295, name: "T0 漢密爾頓起跑大直線 Hamilton Straight // 全油門直衝一號阿比高速右彎" },
            { x: 45.50, y: 0.34, z: -0.01, vTarget: 295, name: "T0 漢密爾頓起跑大直線 Hamilton Straight // 全油門直衝一號阿比高速右彎" },
            { x: 90.50, y: 0.84, z: -0.01, vTarget: 295, name: "T0 漢密爾頓起跑大直線 Hamilton Straight // 全油門直衝一號阿比高速右彎" },
            { x: 136.00, y: 1.44, z: -0.02, vTarget: 295, name: "T0 漢密爾頓起跑大直線 Hamilton Straight // 全油門直衝一號阿比高速右彎" },
            { x: 181.00, y: 2.03, z: -0.03, vTarget: 295, name: "T0 漢密爾頓起跑大直線 Hamilton Straight // 全油門直衝一號阿比高速右彎" },
            { x: 226.49, y: 2.67, z: -0.03, vTarget: 295, name: "T0 漢密爾頓起跑大直線 Hamilton Straight // 全油門直衝一號阿比高速右彎" },
            { x: 271.49, y: 3.37, z: -0.07, vTarget: 295, name: "T0 漢密爾頓起跑大直線 Hamilton Straight // 全油門直衝一號阿比高速右彎" },
            { x: 316.99, y: 4.15, z: -0.38, vTarget: 295, name: "T0 漢密爾頓起跑大直線 Hamilton Straight // 全油門直衝一號阿比高速右彎" },
            { x: 362.39, y: 4.72, z: 0.55, vTarget: 158, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 398.51, y: 4.99, z: 26.68, vTarget: 220, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 425.02, y: 5.40, z: 63.60, vTarget: 295, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 450.28, y: 5.92, z: 100.83, vTarget: 295, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 473.51, y: 6.41, z: 139.96, vTarget: 295, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 502.51, y: 6.97, z: 174.81, vTarget: 236, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 539.51, y: 7.65, z: 199.87, vTarget: 237, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 582.72, y: 8.32, z: 214.00, vTarget: 295, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 626.41, y: 8.54, z: 224.77, vTarget: 295, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 670.70, y: 8.83, z: 235.17, vTarget: 295, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 714.45, y: 8.99, z: 245.70, vTarget: 217, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 748.67, y: 8.87, z: 266.65, vTarget: 104, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 745.85, y: 9.37, z: 305.09, vTarget: 160, name: "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點" },
            { x: 719.66, y: 9.84, z: 341.68, vTarget: 199, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 710.38, y: 10.02, z: 374.60, vTarget: 107, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 726.60, y: 9.93, z: 398.10, vTarget: 102, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 764.58, y: 10.03, z: 397.36, vTarget: 203, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 806.53, y: 10.00, z: 381.19, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 846.22, y: 9.86, z: 359.01, vTarget: 249, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 878.62, y: 9.79, z: 328.09, vTarget: 150, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 885.23, y: 9.89, z: 283.66, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 888.97, y: 9.92, z: 238.32, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 892.77, y: 9.92, z: 193.48, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 896.56, y: 9.92, z: 148.14, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 900.30, y: 9.99, z: 103.29, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 904.09, y: 9.92, z: 57.95, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 907.92, y: 9.86, z: 12.62, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 911.73, y: 9.82, z: -32.22, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 915.56, y: 9.82, z: -77.56, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 919.30, y: 9.62, z: -122.40, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 922.98, y: 9.29, z: -167.75, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 926.49, y: 8.77, z: -212.61, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 929.90, y: 8.27, z: -257.98, vTarget: 295, name: "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎" },
            { x: 933.50, y: 7.67, z: -303.34, vTarget: 295, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 929.82, y: 7.14, z: -347.67, vTarget: 173, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 904.72, y: 6.81, z: -385.01, vTarget: 136, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 862.70, y: 6.76, z: -393.66, vTarget: 141, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 823.49, y: 6.85, z: -370.74, vTarget: 295, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 783.52, y: 7.17, z: -349.24, vTarget: 160, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 739.90, y: 7.53, z: -353.21, vTarget: 126, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 715.26, y: 7.42, z: -389.27, vTarget: 129, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 725.98, y: 6.84, z: -431.82, vTarget: 135, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 763.97, y: 6.57, z: -454.74, vTarget: 210, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 808.14, y: 6.03, z: -463.34, vTarget: 295, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 852.73, y: 5.64, z: -472.38, vTarget: 295, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 897.45, y: 5.62, z: -480.74, vTarget: 295, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 942.29, y: 5.74, z: -480.99, vTarget: 295, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 987.23, y: 5.92, z: -474.03, vTarget: 295, name: "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道" },
            { x: 1029.65, y: 5.98, z: -460.34, vTarget: 225, name: "T9 科普斯超高Ｇ力右彎 Copse // 五檔高Ｇ力盲頂高速右彎（吃盡左側進場路緣石）" },
            { x: 1066.56, y: 6.02, z: -433.93, vTarget: 295, name: "T9 科普斯超高Ｇ力右彎 Copse // 五檔高Ｇ力盲頂高速右彎（吃盡左側進場路緣石）" },
            { x: 1098.37, y: 6.07, z: -402.12, vTarget: 295, name: "T9 科普斯超高Ｇ力右彎 Copse // 五檔高Ｇ力盲頂高速右彎（吃盡左側進場路緣石）" },
            { x: 1129.86, y: 6.38, z: -369.28, vTarget: 295, name: "T9 科普斯超高Ｇ力右彎 Copse // 五檔高Ｇ力盲頂高速右彎（吃盡左側進場路緣石）" },
            { x: 1161.07, y: 6.69, z: -336.17, vTarget: 295, name: "T9 科普斯超高Ｇ力右彎 Copse // 五檔高Ｇ力盲頂高速右彎（吃盡左側進場路緣石）" },
            { x: 1191.74, y: 7.08, z: -303.24, vTarget: 295, name: "T9 科普斯超高Ｇ力右彎 Copse // 五檔高Ｇ力盲頂高速右彎（吃盡左側進場路緣石）" },
            { x: 1222.64, y: 7.43, z: -269.84, vTarget: 295, name: "T9 科普斯超高Ｇ力右彎 Copse // 五檔高Ｇ力盲頂高速右彎（吃盡左側進場路緣石）" },
            { x: 1253.06, y: 7.70, z: -236.68, vTarget: 295, name: "T9 科普斯超高Ｇ力右彎 Copse // 五檔高Ｇ力盲頂高速右彎（吃盡左側進場路緣石）" },
            { x: 1283.47, y: 8.00, z: -202.84, vTarget: 295, name: "T9 科普斯超高Ｇ力右彎 Copse // 五檔高Ｇ力盲頂高速右彎（吃盡左側進場路緣石）" },
            { x: 1313.61, y: 8.28, z: -168.76, vTarget: 295, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1343.73, y: 8.45, z: -135.32, vTarget: 252, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1364.82, y: 8.67, z: -95.39, vTarget: 233, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1373.67, y: 8.91, z: -51.46, vTarget: 184, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1362.59, y: 9.13, z: -8.21, vTarget: 214, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1337.56, y: 9.43, z: 29.17, vTarget: 295, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1310.29, y: 9.69, z: 65.58, vTarget: 295, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1281.45, y: 10.08, z: 100.77, vTarget: 295, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1251.21, y: 10.45, z: 134.09, vTarget: 295, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1218.91, y: 10.74, z: 166.12, vTarget: 295, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1185.45, y: 10.98, z: 196.21, vTarget: 295, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1150.77, y: 10.99, z: 225.66, vTarget: 295, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1116.20, y: 10.77, z: 254.47, vTarget: 295, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1081.18, y: 10.52, z: 283.52, vTarget: 295, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1048.02, y: 10.18, z: 314.58, vTarget: 254, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1023.66, y: 9.61, z: 352.28, vTarget: 289, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 1006.58, y: 9.40, z: 394.41, vTarget: 181, name: "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！" },
            { x: 973.61, y: 9.31, z: 423.44, vTarget: 195, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 930.40, y: 9.54, z: 437.69, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 887.73, y: 9.80, z: 451.90, vTarget: 270, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 848.83, y: 9.73, z: 475.07, vTarget: 185, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 824.08, y: 9.36, z: 512.71, vTarget: 220, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 812.54, y: 8.80, z: 556.17, vTarget: 199, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 785.43, y: 8.24, z: 591.82, vTarget: 153, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 742.92, y: 7.54, z: 604.23, vTarget: 173, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 698.74, y: 7.04, z: 594.26, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 657.20, y: 6.56, z: 576.98, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 613.43, y: 6.29, z: 565.38, vTarget: 206, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 568.29, y: 6.25, z: 570.32, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 523.83, y: 6.09, z: 577.27, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 478.89, y: 5.97, z: 584.36, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 434.46, y: 5.73, z: 591.50, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 389.54, y: 5.56, z: 598.76, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 344.62, y: 5.26, z: 605.99, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 300.18, y: 4.89, z: 613.03, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 255.22, y: 4.63, z: 620.06, vTarget: 295, name: "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎" },
            { x: 210.76, y: 4.40, z: 627.01, vTarget: 295, name: "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎" },
            { x: 165.82, y: 4.07, z: 634.11, vTarget: 295, name: "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎" },
            { x: 121.40, y: 3.70, z: 641.31, vTarget: 295, name: "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎" },
            { x: 76.55, y: 3.19, z: 648.95, vTarget: 295, name: "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎" },
            { x: 31.70, y: 2.92, z: 656.55, vTarget: 295, name: "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎" },
            { x: -13.02, y: 3.02, z: 661.54, vTarget: 295, name: "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎" },
            { x: -58.38, y: 3.56, z: 665.06, vTarget: 295, name: "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎" },
            { x: -103.32, y: 4.37, z: 667.28, vTarget: 295, name: "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎" },
            { x: -148.75, y: 5.33, z: 669.83, vTarget: 259, name: "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎" },
            { x: -192.63, y: 6.01, z: 661.90, vTarget: 173, name: "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎" },
            { x: -227.53, y: 6.66, z: 633.24, vTarget: 177, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -244.72, y: 6.82, z: 591.86, vTarget: 168, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -238.46, y: 6.58, z: 547.73, vTarget: 214, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -217.44, y: 5.69, z: 507.40, vTarget: 295, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -198.94, y: 4.51, z: 466.39, vTarget: 295, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -184.38, y: 2.63, z: 423.31, vTarget: 295, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -173.89, y: 2.04, z: 379.04, vTarget: 295, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -166.02, y: 2.15, z: 334.74, vTarget: 295, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -158.20, y: 2.04, z: 289.92, vTarget: 295, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -148.92, y: 1.43, z: 245.89, vTarget: 295, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -145.44, y: 1.08, z: 204.22, vTarget: 116, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -174.95, y: 1.48, z: 178.59, vTarget: 295, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -206.96, y: 1.56, z: 153.15, vTarget: 125, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -209.03, y: 1.14, z: 111.07, vTarget: 195, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -193.83, y: 0.88, z: 68.80, vTarget: 269, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -169.61, y: 0.42, z: 30.40, vTarget: 226, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -135.89, y: 0.01, z: 1.74, vTarget: 149, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -90.50, y: -0.28, z: -0.02, vTarget: 295, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" },
            { x: -45.50, y: -0.21, z: -0.01, vTarget: 295, name: "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！" }
          ]
        },
        {
          id: 'interlagos',
          name: 'AUTODROMO DE INTERLAGOS',
          shortLabel: '南美魔鬼坡:英特拉格斯',
          badgeText: 'INTERLAGOS ★★★★',
          difficultyStars: '★★★★',
          country: '🇧🇷 巴西',
          category: 'f1_real',
          lengthKm: 4.31,
          elevationM: 43.0,
          turns: 15,
          cardAccent: '#facc15',
          cardIcon: '🇧🇷',
          cardTag: '★★★★ F1 1:1 逆時針陡坡 · 高差 43m',
          cardTitle: '英特拉格斯 INTERLAGOS (1:1)',
          cardDesc: '逆時針經典戰場！洗拿 S 彎（Senna S）下坡重煞直入長直道、高低起伏技術中段與 Juncao 重煞後全力爬坡衝刺 Subida dos Boxes！',
          defaultTempC: { ambient: 26, track: 42 },
          width: 15.5,
          proLapTime: 93.872,
          elevationAmp1: 8.0,
          elevationAmp2: 4.0,
          glbUrl: 'assets/models/tracks/interlagos.glb',
          glbTransform: { pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 },
          theme: {
            biome: 'interlagos_sun',
            skyColor: 0x0f3b6e,
            skyTop: 0x075985,
            skyMid: 0x0284c7,
            skyHorizon: 0xfef08a,
            cloudTint: 0xffffff,
            fogColor: 0x1e3a5f,
            fogDensity: 0.00050,
            hemiSky: 0xfef9c3,
            hemiGround: 0x1e2918,
            hemiIntensity: 1.22,
            sunColor: 0xfffbeb,
            sunIntensity: 1.44,
            sunPos: [-420, 620, 320],
            grassColor: 0x18381d,
            treePrimary: 0x15803d,
            treeSecondary: 0x65a30d,
            isNight: false,
            hasSunsetFlare: false
          },
          points: [
            { x: 0.00, y: 0.00, z: 0.00, vTarget: 295, name: "T0 起跑爬坡直線 // 逆時針全油門衝向洗拿 S 彎重煞區" },
            { x: 36.00, y: 1.06, z: -0.54, vTarget: 295, name: "T0 起跑爬坡直線 // 逆時針全油門衝向洗拿 S 彎重煞區" },
            { x: 71.99, y: 1.91, z: -1.31, vTarget: 295, name: "T0 起跑爬坡直線 // 逆時針全油門衝向洗拿 S 彎重煞區" },
            { x: 107.49, y: 2.47, z: -1.88, vTarget: 295, name: "T0 起跑爬坡直線 // 逆時針全油門衝向洗拿 S 彎重煞區" },
            { x: 143.48, y: 2.81, z: -2.53, vTarget: 295, name: "T0 起跑爬坡直線 // 逆時針全油門衝向洗拿 S 彎重煞區" },
            { x: 179.47, y: 3.12, z: -3.22, vTarget: 295, name: "T0 起跑爬坡直線 // 逆時針全油門衝向洗拿 S 彎重煞區" },
            { x: 214.97, y: 3.42, z: -3.81, vTarget: 295, name: "T0 起跑爬坡直線 // 逆時針全油門衝向洗拿 S 彎重煞區" },
            { x: 250.83, y: 3.50, z: -6.38, vTarget: 205, name: "T0 起跑爬坡直線 // 逆時針全油門衝向洗拿 S 彎重煞區" },
            { x: 284.25, y: 2.45, z: -19.29, vTarget: 123, name: "T0 起跑爬坡直線 // 逆時針全油門衝向洗拿 S 彎重煞區" },
            { x: 298.90, y: -0.51, z: -49.54, vTarget: 121, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 289.13, y: -5.31, z: -81.44, vTarget: 230, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 271.37, y: -9.18, z: -112.12, vTarget: 133, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 275.77, y: -11.28, z: -146.22, vTarget: 135, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 300.75, y: -12.81, z: -172.11, vTarget: 273, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 320.75, y: -13.73, z: -201.36, vTarget: 233, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 333.72, y: -14.45, z: -234.85, vTarget: 219, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 337.60, y: -15.07, z: -270.52, vTarget: 204, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 330.85, y: -15.61, z: -305.74, vTarget: 214, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 314.86, y: -16.18, z: -337.88, vTarget: 215, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 291.25, y: -16.61, z: -364.30, vTarget: 239, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 262.13, y: -17.18, z: -385.25, vTarget: 295, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 231.15, y: -18.01, z: -403.58, vTarget: 295, name: "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速" },
            { x: 200.23, y: -18.83, z: -420.98, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: 168.37, y: -19.53, z: -437.76, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: 136.71, y: -20.26, z: -454.89, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: 105.15, y: -21.02, z: -472.21, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: 73.60, y: -21.74, z: -489.56, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: 42.46, y: -22.57, z: -506.59, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: 10.85, y: -23.94, z: -523.82, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -20.77, y: -24.92, z: -541.04, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -51.93, y: -25.90, z: -558.05, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -83.51, y: -26.94, z: -575.33, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -115.07, y: -28.05, z: -592.65, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -146.62, y: -28.71, z: -610.01, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -178.14, y: -29.19, z: -627.39, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -209.24, y: -29.45, z: -644.52, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -240.79, y: -29.92, z: -661.85, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -272.42, y: -30.64, z: -679.05, vTarget: 220, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -306.52, y: -32.13, z: -687.49, vTarget: 126, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -337.13, y: -34.05, z: -671.49, vTarget: 140, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -353.96, y: -35.89, z: -639.75, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -367.99, y: -38.22, z: -606.60, vTarget: 295, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -378.59, y: -39.34, z: -572.24, vTarget: 210, name: "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！" },
            { x: -379.23, y: -39.36, z: -537.03, vTarget: 286, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -374.43, y: -39.06, z: -501.42, vTarget: 204, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -359.30, y: -38.79, z: -468.84, vTarget: 225, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -337.00, y: -38.59, z: -441.25, vTarget: 295, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -313.02, y: -38.27, z: -414.39, vTarget: 295, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -288.97, y: -37.39, z: -387.60, vTarget: 295, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -265.22, y: -35.69, z: -360.54, vTarget: 295, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -241.79, y: -33.31, z: -333.22, vTarget: 295, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -218.89, y: -31.45, z: -306.09, vTarget: 295, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -195.80, y: -29.03, z: -278.47, vTarget: 295, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -172.78, y: -27.03, z: -250.79, vTarget: 295, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -150.25, y: -25.22, z: -223.35, vTarget: 295, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -131.13, y: -23.91, z: -192.98, vTarget: 150, name: "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線" },
            { x: -130.16, y: -22.38, z: -157.87, vTarget: 187, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -141.59, y: -20.15, z: -123.83, vTarget: 199, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -162.96, y: -17.68, z: -95.07, vTarget: 234, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -189.85, y: -15.57, z: -72.15, vTarget: 161, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -224.56, y: -14.19, z: -63.71, vTarget: 220, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -260.49, y: -13.87, z: -64.37, vTarget: 295, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -295.88, y: -13.78, z: -67.08, vTarget: 295, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -331.44, y: -13.80, z: -72.41, vTarget: 126, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -352.24, y: -14.23, z: -96.30, vTarget: 110, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -348.12, y: -15.29, z: -128.36, vTarget: 125, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -321.22, y: -17.25, z: -152.23, vTarget: 168, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -307.27, y: -19.85, z: -183.92, vTarget: 106, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -325.05, y: -22.03, z: -213.59, vTarget: 123, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -359.02, y: -21.94, z: -223.41, vTarget: 138, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -392.13, y: -20.70, z: -211.90, vTarget: 235, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -422.67, y: -19.13, z: -192.85, vTarget: 295, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -454.26, y: -17.33, z: -175.61, vTarget: 262, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -488.35, y: -15.76, z: -164.43, vTarget: 206, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -524.30, y: -14.04, z: -163.58, vTarget: 200, name: "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段" },
            { x: -554.31, y: -13.22, z: -171.82, vTarget: 102, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -565.28, y: -12.97, z: -196.52, vTarget: 96, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -551.59, y: -13.28, z: -220.78, vTarget: 135, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -519.98, y: -14.58, z: -236.93, vTarget: 295, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -488.03, y: -16.13, z: -253.51, vTarget: 267, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -459.58, y: -18.20, z: -275.34, vTarget: 187, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -440.47, y: -21.19, z: -305.65, vTarget: 202, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -431.37, y: -24.38, z: -340.35, vTarget: 199, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -433.32, y: -27.89, z: -375.54, vTarget: 160, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -451.34, y: -30.38, z: -406.45, vTarget: 240, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -475.73, y: -31.49, z: -432.92, vTarget: 295, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -500.57, y: -31.44, z: -458.28, vTarget: 295, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -525.81, y: -30.65, z: -483.94, vTarget: 295, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -551.20, y: -29.52, z: -509.48, vTarget: 295, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -577.75, y: -28.88, z: -533.72, vTarget: 127, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -610.51, y: -28.38, z: -534.84, vTarget: 119, name: "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎" },
            { x: -635.36, y: -26.93, z: -512.51, vTarget: 220, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -655.35, y: -24.43, z: -482.58, vTarget: 295, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -674.60, y: -21.82, z: -452.21, vTarget: 186, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -681.95, y: -18.54, z: -417.72, vTarget: 289, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -684.14, y: -15.07, z: -381.79, vTarget: 295, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -686.27, y: -11.42, z: -345.87, vTarget: 278, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -682.55, y: -8.20, z: -310.09, vTarget: 295, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -676.14, y: -5.34, z: -274.67, vTarget: 295, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -666.98, y: -3.48, z: -240.38, vTarget: 295, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -654.01, y: -2.04, z: -206.83, vTarget: 276, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -635.71, y: -0.72, z: -175.90, vTarget: 217, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -610.32, y: 0.19, z: -151.17, vTarget: 264, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -580.53, y: 0.76, z: -131.08, vTarget: 295, name: "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！" },
            { x: -548.70, y: 0.67, z: -114.26, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -516.75, y: 0.24, z: -97.67, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -484.54, y: -0.25, z: -81.59, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -452.73, y: -0.80, z: -65.83, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -420.63, y: -1.29, z: -49.53, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -388.69, y: -1.52, z: -32.91, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -356.38, y: -1.94, z: -18.22, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -322.23, y: -2.31, z: -6.90, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -286.90, y: -2.99, z: -0.14, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -250.99, y: -3.45, z: 2.10, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -214.99, y: -3.88, z: 2.30, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -179.49, y: -4.01, z: 2.25, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -143.49, y: -3.75, z: 1.89, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -107.49, y: -3.06, z: 1.18, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -72.00, y: -2.14, z: 0.44, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" },
            { x: -36.00, y: -1.06, z: -0.02, vTarget: 295, name: "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線" }
          ]
        },
        {
          id: 'spielberg',
          name: 'RED BULL RING SPIELBERG',
          shortLabel: '阿爾卑斯:紅牛環1:1',
          badgeText: 'RED BULL RING ★★★',
          difficultyStars: '★★★',
          country: '🇦🇹 奧地利',
          category: 'f1_real',
          lengthKm: 4.32,
          elevationM: 63.4,
          turns: 10,
          cardAccent: '#ef4444',
          cardIcon: '🏔️',
          cardTag: '★★★ F1 1:1 阿爾卑斯陡坡 · 高差 63m',
          cardTitle: '紅牛環賽道 RED BULL RING (1:1)',
          cardDesc: '阿爾卑斯山谷雲霄飛車！全長 4.32 km 劇烈爬升 63.4 公尺，連環上坡直道、Remus 急髮夾重煞後高速下坡飛馳過 Rindt 雙右彎。',
          defaultTempC: { ambient: 21, track: 34 },
          width: 15.5,
          proLapTime: 89.454,
          elevationAmp1: 12.0,
          elevationAmp2: 5.0,
          glbUrl: 'assets/models/tracks/red_bull_ring.glb',
          glbTransform: { pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 },
          theme: {
            biome: 'spielberg_alps',
            skyColor: 0x0c4a6e,
            skyTop: 0x073b61,
            skyMid: 0x2563eb,
            skyHorizon: 0xbae6fd,
            cloudTint: 0xffffff,
            fogColor: 0x1e3a5f,
            fogDensity: 0.00048,
            hemiSky: 0xf0f9ff,
            hemiGround: 0x112a18,
            hemiIntensity: 1.20,
            sunColor: 0xffffff,
            sunIntensity: 1.36,
            sunPos: [380, 620, 260],
            grassColor: 0x11361b,
            treePrimary: 0x065f46,
            treeSecondary: 0x15803d,
            isNight: false,
            hasSunsetFlare: false
          },
          points: [
            { x: 0.00, y: 0.00, z: 0.00, vTarget: 295, name: "T0 阿爾卑斯上坡大直線 // 全油門陡坡攀升衝向一號彎重煞點" },
            { x: 41.00, y: -0.02, z: -0.00, vTarget: 295, name: "T0 阿爾卑斯上坡大直線 // 全油門陡坡攀升衝向一號彎重煞點" },
            { x: 82.00, y: -0.01, z: -0.01, vTarget: 295, name: "T0 阿爾卑斯上坡大直線 // 全油門陡坡攀升衝向一號彎重煞點" },
            { x: 123.50, y: 0.25, z: -0.02, vTarget: 295, name: "T0 阿爾卑斯上坡大直線 // 全油門陡坡攀升衝向一號彎重煞點" },
            { x: 164.50, y: 0.83, z: -0.03, vTarget: 295, name: "T0 阿爾卑斯上坡大直線 // 全油門陡坡攀升衝向一號彎重煞點" },
            { x: 205.49, y: 1.83, z: -0.04, vTarget: 295, name: "T0 阿爾卑斯上坡大直線 // 全油門陡坡攀升衝向一號彎重煞點" },
            { x: 246.49, y: 3.74, z: -0.05, vTarget: 295, name: "T0 阿爾卑斯上坡大直線 // 全油門陡坡攀升衝向一號彎重煞點" },
            { x: 287.49, y: 6.15, z: -0.06, vTarget: 295, name: "T0 阿爾卑斯上坡大直線 // 全油門陡坡攀升衝向一號彎重煞點" },
            { x: 328.99, y: 9.21, z: -0.06, vTarget: 295, name: "T1 尼基勞達一號右彎 Niki Lauda Kurve // 急上坡右直角彎，小心出彎過度偏外" },
            { x: 369.99, y: 12.39, z: -0.10, vTarget: 198, name: "T1 尼基勞達一號右彎 Niki Lauda Kurve // 急上坡右直角彎，小心出彎過度偏外" },
            { x: 404.43, y: 15.57, z: 12.09, vTarget: 118, name: "T1 尼基勞達一號右彎 Niki Lauda Kurve // 急上坡右直角彎，小心出彎過度偏外" },
            { x: 418.25, y: 17.58, z: 47.68, vTarget: 295, name: "T1 尼基勞達一號右彎 Niki Lauda Kurve // 急上坡右直角彎，小心出彎過度偏外" },
            { x: 432.42, y: 18.55, z: 86.67, vTarget: 295, name: "T1 尼基勞達一號右彎 Niki Lauda Kurve // 急上坡右直角彎，小心出彎過度偏外" },
            { x: 446.87, y: 18.79, z: 125.03, vTarget: 295, name: "T1 尼基勞達一號右彎 Niki Lauda Kurve // 急上坡右直角彎，小心出彎過度偏外" },
            { x: 461.03, y: 18.64, z: 163.51, vTarget: 295, name: "T1 尼基勞達一號右彎 Niki Lauda Kurve // 急上坡右直角彎，小心出彎過度偏外" },
            { x: 475.40, y: 18.21, z: 201.90, vTarget: 295, name: "T1 尼基勞達一號右彎 Niki Lauda Kurve // 急上坡右直角彎，小心出彎過度偏外" },
            { x: 489.79, y: 18.19, z: 240.30, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 503.84, y: 18.54, z: 279.34, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 514.49, y: 19.30, z: 318.92, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 523.78, y: 20.32, z: 358.85, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 532.19, y: 21.24, z: 398.98, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 539.65, y: 22.33, z: 439.29, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 546.65, y: 23.24, z: 480.20, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 553.46, y: 24.51, z: 520.63, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 560.23, y: 26.14, z: 561.06, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 569.22, y: 28.81, z: 601.02, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 582.56, y: 31.87, z: 639.78, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 599.05, y: 35.13, z: 677.82, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 618.70, y: 39.71, z: 713.81, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 638.62, y: 43.72, z: 749.63, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 658.65, y: 48.92, z: 785.41, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 679.01, y: 53.75, z: 820.99, vTarget: 295, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 695.81, y: 58.47, z: 855.14, vTarget: 105, name: "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）" },
            { x: 684.88, y: 62.17, z: 877.92, vTarget: 100, name: "T3 雷姆斯高原急右髮夾彎 Remus // 全場最高點重煞急右折返下坡！" },
            { x: 658.69, y: 63.31, z: 885.67, vTarget: 158, name: "T3 雷姆斯高原急右髮夾彎 Remus // 全場最高點重煞急右折返下坡！" },
            { x: 618.36, y: 63.32, z: 878.45, vTarget: 295, name: "T3 雷姆斯高原急右髮夾彎 Remus // 全場最高點重煞急右折返下坡！" },
            { x: 578.26, y: 62.61, z: 867.80, vTarget: 295, name: "T3 雷姆斯高原急右髮夾彎 Remus // 全場最高點重煞急右折返下坡！" },
            { x: 538.66, y: 61.38, z: 857.18, vTarget: 295, name: "T3 雷姆斯高原急右髮夾彎 Remus // 全場最高點重煞急右折返下坡！" },
            { x: 499.79, y: 59.27, z: 844.24, vTarget: 295, name: "T3 雷姆斯高原急右髮夾彎 Remus // 全場最高點重煞急右折返下坡！" },
            { x: 461.55, y: 57.16, z: 829.47, vTarget: 295, name: "T3 雷姆斯高原急右髮夾彎 Remus // 全場最高點重煞急右折返下坡！" },
            { x: 424.74, y: 55.45, z: 811.42, vTarget: 295, name: "T3 雷姆斯高原急右髮夾彎 Remus // 全場最高點重煞急右折返下坡！" },
            { x: 387.54, y: 53.97, z: 793.03, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 350.78, y: 52.93, z: 774.88, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 313.97, y: 51.94, z: 756.82, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 277.14, y: 51.01, z: 738.82, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 240.26, y: 49.84, z: 720.90, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 202.48, y: 48.65, z: 703.74, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 164.33, y: 46.97, z: 688.73, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 125.50, y: 45.43, z: 675.60, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 86.33, y: 43.50, z: 663.47, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 47.23, y: 41.50, z: 651.15, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 7.72, y: 39.27, z: 638.44, vTarget: 295, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: -31.28, y: 36.95, z: 625.89, vTarget: 108, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: -40.10, y: 34.69, z: 592.96, vTarget: 111, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: -17.35, y: 32.35, z: 562.98, vTarget: 212, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 16.49, y: 30.11, z: 539.01, vTarget: 268, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 53.89, y: 28.85, z: 522.50, vTarget: 252, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 94.08, y: 28.48, z: 514.72, vTarget: 255, name: "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎" },
            { x: 134.97, y: 28.87, z: 515.89, vTarget: 295, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 175.24, y: 29.49, z: 523.27, vTarget: 263, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 213.63, y: 30.16, z: 539.00, vTarget: 295, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 251.54, y: 30.80, z: 554.53, vTarget: 295, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 288.21, y: 31.42, z: 572.86, vTarget: 295, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 324.98, y: 32.04, z: 591.00, vTarget: 286, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 364.10, y: 31.92, z: 602.41, vTarget: 167, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 404.18, y: 30.89, z: 593.63, vTarget: 159, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 433.42, y: 29.30, z: 565.74, vTarget: 158, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 443.81, y: 26.67, z: 526.53, vTarget: 179, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 436.65, y: 23.28, z: 486.29, vTarget: 295, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 427.10, y: 19.53, z: 446.42, vTarget: 295, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 416.12, y: 16.16, z: 406.40, vTarget: 295, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 405.76, y: 13.95, z: 366.74, vTarget: 243, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 386.41, y: 12.63, z: 331.00, vTarget: 160, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 351.74, y: 12.09, z: 310.23, vTarget: 160, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 310.54, y: 12.42, z: 310.23, vTarget: 163, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 275.33, y: 13.45, z: 330.36, vTarget: 295, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 241.42, y: 14.13, z: 353.08, vTarget: 251, name: "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限" },
            { x: 203.13, y: 14.80, z: 367.64, vTarget: 236, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: 162.51, y: 14.98, z: 372.01, vTarget: 251, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: 121.35, y: 15.26, z: 367.06, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: 81.23, y: 16.29, z: 358.62, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: 41.26, y: 17.72, z: 349.51, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: 1.76, y: 19.62, z: 338.54, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -37.81, y: 21.45, z: 327.81, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -78.03, y: 22.50, z: 317.60, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -117.86, y: 23.18, z: 307.87, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -157.71, y: 23.46, z: 298.24, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -197.56, y: 23.38, z: 288.58, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -237.38, y: 22.81, z: 278.82, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -277.66, y: 21.99, z: 268.86, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -317.45, y: 20.75, z: 259.04, vTarget: 198, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -350.83, y: 18.96, z: 236.19, vTarget: 148, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -364.87, y: 17.19, z: 198.33, vTarget: 205, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -365.68, y: 14.79, z: 157.35, vTarget: 295, name: "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線" },
            { x: -366.94, y: 11.83, z: 115.87, vTarget: 295, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" },
            { x: -367.73, y: 8.84, z: 74.88, vTarget: 240, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" },
            { x: -359.42, y: 6.08, z: 37.81, vTarget: 127, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" },
            { x: -327.04, y: 4.34, z: 16.88, vTarget: 209, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" },
            { x: -286.93, y: 3.25, z: 6.32, vTarget: 295, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" },
            { x: -246.49, y: 2.64, z: 0.05, vTarget: 295, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" },
            { x: -205.49, y: 2.02, z: 0.01, vTarget: 295, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" },
            { x: -164.50, y: 1.44, z: 0.07, vTarget: 295, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" },
            { x: -123.50, y: 0.84, z: 0.02, vTarget: 295, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" },
            { x: -82.00, y: 0.29, z: 0.00, vTarget: 295, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" },
            { x: -41.00, y: 0.07, z: -0.00, vTarget: 295, name: "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架" }
          ]
        },
        {
          id: 'cota',
          name: 'CIRCUIT OF THE AMERICAS (COTA)',
          shortLabel: '美洲極限:奧斯汀1:1',
          badgeText: 'COTA AUSTIN ★★★★★',
          difficultyStars: '★★★★★',
          country: '🇺🇸 美國',
          category: 'f1_real',
          lengthKm: 5.51,
          elevationM: 30.2,
          turns: 20,
          cardAccent: '#fb923c',
          cardIcon: '🤠',
          cardTag: '★★★★★ F1 1:1 二十彎全能考驗 · 盲頂T1',
          cardTitle: '美洲賽道 COTA AUSTIN (1:1)',
          cardDesc: '集世界傳奇彎角於一身！迎戰劇烈爬坡 T1 盲頂左髮夾、連續高速 Esses、1km 背直道重煞、Stadium 技術複合彎與遠景觀景高塔。',
          defaultTempC: { ambient: 29, track: 44 },
          width: 16.0,
          proLapTime: 123.623,
          elevationAmp1: 8.0,
          elevationAmp2: 3.5,
          glbUrl: 'assets/models/tracks/cota_austin.glb',
          glbTransform: { pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 },
          theme: {
            biome: 'cota_texas',
            skyColor: 0x1e3a5f,
            skyTop: 0x0f2d5e,
            skyMid: 0x3b82f6,
            skyHorizon: 0xfde68a,
            cloudTint: 0xfffbeb,
            fogColor: 0x334155,
            fogDensity: 0.00046,
            hemiSky: 0xfef3c7,
            hemiGround: 0x261c12,
            hemiIntensity: 1.18,
            sunColor: 0xffedd5,
            sunIntensity: 1.42,
            sunPos: [540, 560, -280],
            grassColor: 0x273517,
            treePrimary: 0x365314,
            treeSecondary: 0xa16207,
            isNight: false,
            hasSunsetFlare: false
          },
          points: [
            { x: 0.00, y: 0.00, z: 0.00, vTarget: 295, name: "T0 起跑上坡大直線 // 攀升 40 公尺直衝一號盲頂髮夾彎！" },
            { x: 41.00, y: -0.02, z: -0.00, vTarget: 295, name: "T0 起跑上坡大直線 // 攀升 40 公尺直衝一號盲頂髮夾彎！" },
            { x: 81.50, y: -0.00, z: -0.01, vTarget: 295, name: "T0 起跑上坡大直線 // 攀升 40 公尺直衝一號盲頂髮夾彎！" },
            { x: 122.50, y: 0.21, z: -0.02, vTarget: 295, name: "T0 起跑上坡大直線 // 攀升 40 公尺直衝一號盲頂髮夾彎！" },
            { x: 163.00, y: 0.13, z: -0.02, vTarget: 295, name: "T0 起跑上坡大直線 // 攀升 40 公尺直衝一號盲頂髮夾彎！" },
            { x: 204.00, y: -0.02, z: -0.03, vTarget: 295, name: "T0 起跑上坡大直線 // 攀升 40 公尺直衝一號盲頂髮夾彎！" },
            { x: 245.00, y: -0.00, z: -0.03, vTarget: 295, name: "T0 起跑上坡大直線 // 攀升 40 公尺直衝一號盲頂髮夾彎！" },
            { x: 285.50, y: 0.42, z: -0.04, vTarget: 295, name: "T0 起跑上坡大直線 // 攀升 40 公尺直衝一號盲頂髮夾彎！" },
            { x: 326.50, y: 1.51, z: -0.04, vTarget: 295, name: "T0 起跑上坡大直線 // 攀升 40 公尺直衝一號盲頂髮夾彎！" },
            { x: 367.01, y: 3.76, z: -0.04, vTarget: 295, name: "T1 大紅盲頂髮夾彎 Big Red Hairpin // 陡坡頂端重煞急左回轉再高速俯衝！" },
            { x: 408.01, y: 6.76, z: -0.05, vTarget: 295, name: "T1 大紅盲頂髮夾彎 Big Red Hairpin // 陡坡頂端重煞急左回轉再高速俯衝！" },
            { x: 449.01, y: 10.45, z: -0.06, vTarget: 295, name: "T1 大紅盲頂髮夾彎 Big Red Hairpin // 陡坡頂端重煞急左回轉再高速俯衝！" },
            { x: 489.51, y: 15.11, z: -0.07, vTarget: 295, name: "T1 大紅盲頂髮夾彎 Big Red Hairpin // 陡坡頂端重煞急左回轉再高速俯衝！" },
            { x: 530.51, y: 20.13, z: 0.01, vTarget: 295, name: "T1 大紅盲頂髮夾彎 Big Red Hairpin // 陡坡頂端重煞急左回轉再高速俯衝！" },
            { x: 570.95, y: 25.33, z: -6.21, vTarget: 106, name: "T1 大紅盲頂髮夾彎 Big Red Hairpin // 陡坡頂端重煞急左回轉再高速俯衝！" },
            { x: 583.16, y: 26.59, z: -29.45, vTarget: 92, name: "T1 大紅盲頂髮夾彎 Big Red Hairpin // 陡坡頂端重煞急左回轉再高速俯衝！" },
            { x: 569.88, y: 25.72, z: -53.75, vTarget: 154, name: "T1 大紅盲頂髮夾彎 Big Red Hairpin // 陡坡頂端重煞急左回轉再高速俯衝！" },
            { x: 535.98, y: 21.13, z: -75.91, vTarget: 295, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 501.54, y: 16.60, z: -98.15, vTarget: 295, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 467.12, y: 12.73, z: -120.43, vTarget: 275, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 438.05, y: 10.26, z: -148.21, vTarget: 189, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 421.52, y: 8.48, z: -185.53, vTarget: 206, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 418.11, y: 7.69, z: -225.63, vTarget: 196, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 429.42, y: 8.04, z: -264.97, vTarget: 295, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 443.76, y: 9.01, z: -303.38, vTarget: 295, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 458.09, y: 9.88, z: -341.26, vTarget: 295, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 472.71, y: 10.27, z: -379.57, vTarget: 295, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 485.85, y: 10.14, z: -417.86, vTarget: 197, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 484.64, y: 9.66, z: -458.43, vTarget: 238, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 473.29, y: 9.17, z: -497.82, vTarget: 227, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 473.00, y: 8.40, z: -537.74, vTarget: 163, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 492.90, y: 7.96, z: -573.46, vTarget: 247, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 503.88, y: 7.99, z: -611.92, vTarget: 146, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 489.96, y: 7.92, z: -649.95, vTarget: 295, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 470.52, y: 7.62, z: -685.96, vTarget: 194, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 465.61, y: 7.49, z: -725.86, vTarget: 193, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 475.75, y: 7.89, z: -765.40, vTarget: 222, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 496.41, y: 8.60, z: -800.05, vTarget: 185, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 529.37, y: 9.55, z: -823.82, vTarget: 194, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 569.01, y: 10.31, z: -834.01, vTarget: 295, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 608.43, y: 10.39, z: -843.29, vTarget: 295, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 646.21, y: 9.79, z: -857.59, vTarget: 126, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 661.76, y: 9.51, z: -895.16, vTarget: 246, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 668.13, y: 10.49, z: -935.13, vTarget: 283, name: "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏" },
            { x: 667.33, y: 12.53, z: -976.06, vTarget: 168, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 685.08, y: 14.47, z: -1011.26, vTarget: 140, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 721.56, y: 16.73, z: -1028.08, vTarget: 141, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 760.94, y: 18.80, z: -1018.52, vTarget: 134, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 795.00, y: 20.51, z: -1036.46, vTarget: 185, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 820.98, y: 21.29, z: -1068.17, vTarget: 295, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 846.88, y: 21.14, z: -1099.30, vTarget: 295, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 873.18, y: 19.96, z: -1130.76, vTarget: 295, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 899.31, y: 17.78, z: -1162.36, vTarget: 167, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 907.23, y: 15.19, z: -1201.20, vTarget: 281, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 908.15, y: 12.86, z: -1242.19, vTarget: 295, name: "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道" },
            { x: 909.31, y: 10.54, z: -1282.67, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 910.44, y: 9.24, z: -1323.66, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 911.54, y: 8.40, z: -1364.64, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 912.62, y: 8.19, z: -1405.13, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 913.71, y: 8.59, z: -1446.12, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 914.75, y: 9.78, z: -1486.60, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 915.15, y: 11.31, z: -1527.59, vTarget: 121, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 897.36, y: 11.90, z: -1546.94, vTarget: 95, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 872.87, y: 11.41, z: -1545.40, vTarget: 108, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 849.87, y: 9.29, z: -1515.43, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 826.82, y: 6.80, z: -1482.13, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 803.70, y: 5.04, z: -1448.27, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 780.29, y: 4.08, z: -1414.61, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 756.62, y: 3.83, z: -1381.75, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 732.35, y: 4.43, z: -1348.70, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 707.95, y: 5.55, z: -1315.75, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 683.53, y: 6.81, z: -1283.44, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 658.20, y: 7.55, z: -1251.20, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 632.88, y: 8.03, z: -1219.59, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 607.29, y: 8.18, z: -1187.56, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 581.40, y: 7.88, z: -1155.76, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 555.20, y: 7.35, z: -1124.88, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 528.55, y: 6.47, z: -1093.73, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 501.95, y: 5.69, z: -1063.18, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 474.57, y: 5.23, z: -1032.66, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 446.86, y: 5.13, z: -1002.44, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 419.19, y: 5.25, z: -972.87, vTarget: 295, name: "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！" },
            { x: 390.89, y: 5.37, z: -943.21, vTarget: 295, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 362.60, y: 5.52, z: -914.22, vTarget: 295, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 333.60, y: 5.69, z: -885.23, vTarget: 295, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 304.34, y: 5.78, z: -856.52, vTarget: 295, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 275.42, y: 5.83, z: -828.16, vTarget: 295, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 246.23, y: 5.75, z: -799.37, vTarget: 295, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 217.31, y: 5.42, z: -771.02, vTarget: 295, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 187.85, y: 4.90, z: -742.50, vTarget: 295, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 158.44, y: 4.35, z: -713.93, vTarget: 220, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 142.06, y: 3.57, z: -686.46, vTarget: 112, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 148.29, y: 2.87, z: -660.10, vTarget: 103, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 179.77, y: 2.75, z: -646.07, vTarget: 282, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 219.47, y: 3.16, z: -635.82, vTarget: 295, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 258.59, y: 4.29, z: -623.58, vTarget: 295, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 296.67, y: 5.13, z: -609.79, vTarget: 138, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 314.40, y: 5.68, z: -583.56, vTarget: 98, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 302.17, y: 6.05, z: -555.12, vTarget: 143, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 268.36, y: 5.37, z: -532.94, vTarget: 129, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 230.57, y: 4.63, z: -540.10, vTarget: 215, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 194.85, y: 4.02, z: -558.88, vTarget: 212, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 154.47, y: 3.70, z: -565.84, vTarget: 196, name: "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗" },
            { x: 115.21, y: 3.87, z: -558.13, vTarget: 107, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 103.24, y: 3.86, z: -532.98, vTarget: 94, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 116.76, y: 4.20, z: -509.43, vTarget: 130, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 154.29, y: 4.36, z: -494.22, vTarget: 295, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 192.36, y: 4.43, z: -479.00, vTarget: 295, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 230.49, y: 4.95, z: -463.91, vTarget: 295, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 267.04, y: 5.59, z: -446.65, vTarget: 177, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 292.64, y: 6.12, z: -415.49, vTarget: 197, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 305.64, y: 6.89, z: -377.16, vTarget: 213, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 306.42, y: 7.51, z: -336.86, vTarget: 166, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 287.38, y: 7.88, z: -300.60, vTarget: 295, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 268.13, y: 7.60, z: -265.06, vTarget: 182, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 235.76, y: 6.79, z: -240.26, vTarget: 229, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 198.30, y: 5.64, z: -225.10, vTarget: 247, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 158.06, y: 3.89, z: -218.92, vTarget: 190, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 118.34, y: 2.49, z: -228.46, vTarget: 295, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 79.49, y: 1.40, z: -239.81, vTarget: 295, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 40.02, y: 1.10, z: -250.92, vTarget: 295, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: 0.84, y: 1.25, z: -261.17, vTarget: 295, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: -39.23, y: 1.16, z: -269.80, vTarget: 161, name: "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限" },
            { x: -76.55, y: 0.30, z: -257.82, vTarget: 140, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -99.04, y: -1.24, z: -224.35, vTarget: 295, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -118.18, y: -2.75, z: -188.08, vTarget: 295, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -137.70, y: -3.43, z: -152.03, vTarget: 295, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -156.93, y: -3.57, z: -116.39, vTarget: 295, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -176.30, y: -2.98, z: -80.25, vTarget: 295, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -195.70, y: -1.88, z: -44.70, vTarget: 127, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -188.93, y: -0.95, z: -15.25, vTarget: 109, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -163.00, y: -0.02, z: -0.05, vTarget: 150, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -122.50, y: 0.15, z: 0.03, vTarget: 295, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -81.50, y: 0.06, z: -0.01, vTarget: 295, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" },
            { x: -41.00, y: 0.00, z: -0.00, vTarget: 295, name: "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！" }
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
        computeDynamicOptimalLine();
      }

      // Multi-pass Out-In-Out (外-內-外) & Class-Specific Optimal Racing Line Solver:
      //   lineBias  0.00 = GT3 classic Out-In-Out (preserves exact baseline)
      //   lineBias -0.35 = High-downforce / SUV momentum U-Line (sweeping arc, earlier roll-in)
      //   lineBias +0.35 = Track Hypercar (crisp late-apex rotation)
      //   lineBias +0.85 = Road Hypercar / Street V12 V-Line (deeper entry, delayed apex, early exit)
      function computeDynamicOptimalLine(optSpec) {
        if (!trackNodes || trackNodes.length === 0) return;
        const activeH = (!optSpec && typeof getCurrentCarHandling === 'function') ? getCurrentCarHandling() : null;
        const spec = optSpec || (typeof window !== 'undefined' && window.selectedCarClassSpec) || (activeH && activeH.classSpec) || null;
        const bias = (spec && typeof spec.lineBias === 'number') ? spec.lineBias
          : ((activeH && typeof activeH.lineBias === 'number') ? activeH.lineBias : 0.0);

        const apexShiftM = bias * 12.0;
        const entrySwingMult = 1.35 + bias * 0.25;
        const exitSwingMult = 1.25 - bias * 0.18;
        const midApexWeight = 2.40 - Math.max(0, -bias) * 0.35;

        const maxD = TRACK_WIDTH * 0.38;
        const dRaw = new Float64Array(TRACK_SAMPLES);
        for (let i = 0; i < TRACK_SAMPLES; i++) {
          const s = trackNodes[i].s;
          let localPeak = 0.0020;
          for (let ds = -150; ds <= 150; ds += 10) {
            const cAbs = Math.abs(sampleTrackAtS(s + ds).curvature);
            if (cAbs > localPeak) localPeak = cAbs;
          }
          const sApexProbe = s - apexShiftM;
          let kApex = 0;
          for (let ds = -10; ds <= 10; ds += 5) {
            kApex += sampleTrackAtS(sApexProbe + ds).curvature;
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
          const normVal = (midApexWeight * kApexEff - entrySwingMult * kEntry - exitSwingMult * kExit) / localPeak;
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
        const frenetCurvature = (segLen > 0.25) ? (dHead / segLen) : (n0.curvature || 0);

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
          frenetCurvature,
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

      function getCornerLineCutFactor(optSpec) {
        const activeH = (!optSpec && typeof getCurrentCarHandling === 'function') ? getCurrentCarHandling() : null;
        const spec = optSpec || (typeof window !== 'undefined' && window.selectedCarClassSpec) || (activeH && activeH.classSpec) || null;
        const baseCut = TRACK_WIDTH >= 22.0 ? 0.62 : (TRACK_WIDTH >= 19.0 ? 0.70 : 0.85);
        const bias = (spec && typeof spec.lineBias === 'number') ? spec.lineBias : 0.0;
        return Math.max(0.55, Math.min(0.92, baseCut + bias * 0.045));
      }

      function getUpcomingCornerMaxSpeedKmh(s, optSpec) {
        const activeH = (!optSpec && typeof getCurrentCarHandling === 'function') ? getCurrentCarHandling() : null;
        const spec = optSpec || (typeof window !== 'undefined' && window.selectedCarClassSpec) || (activeH && activeH.classSpec) || null;
        const isGT3 = (!spec || !spec.carClass || spec.carClass === 'GT3');

        let maxCurv = 0;
        for (let offset = -10; offset <= 20; offset += 5) {
          const n = sampleTrackAtS(s + offset);
          if (Math.abs(n.curvature) > maxCurv) maxCurv = Math.abs(n.curvature);
        }
        const effectiveCurv = maxCurv * getCornerLineCutFactor(spec);
        if (isGT3) {
          if (effectiveCurv < 0.00155) return 300;
          const gLat = effectiveCurv < 0.0032 ? 1.56 : (effectiveCurv < 0.0075 ? 1.46 : 1.24);
          const vMsMax = Math.sqrt((gLat * 9.81) / effectiveCurv);
          return Math.min(300, Math.max(64, Math.round(vMsMax * 3.6)));
        }

        const topKmh = spec.topSpeedKmh || 305;
        const topMs = topKmh / 3.6;
        if (effectiveCurv < 0.00155) return topKmh;
        const baseMu = spec.baseMuLat || 1.48;
        const dfCoeff = (spec.aeroDownforceCoeff !== undefined) ? spec.aeroDownforceCoeff : 0.135;
        const weightKg = Math.max(550, spec.weightKg || 1245);
        const tightDisc = effectiveCurv < 0.0032 ? 1.0 : (effectiveCurv < 0.0075 ? 0.94 : 0.82);

        let v = Math.min(topMs, Math.sqrt((baseMu * tightDisc * 9.81) / effectiveCurv));
        for (let iter = 0; iter < 3; iter++) {
          const dfRatio = (dfCoeff * v * v) / weightKg;
          const aeroBonusG = Math.pow(Math.max(0, dfRatio), 0.88) * 1.15;
          const gLat = (baseMu * tightDisc + aeroBonusG) * 0.95;
          v = Math.min(topMs, Math.sqrt((gLat * 9.81) / effectiveCurv));
        }
        return Math.min(topKmh, Math.max(46, Math.round(v * 3.6)));
      }

      // --------------------------------------------------------------------------
      // 2. PRE-COMPUTED PRO BENCHMARK GHOST LAP & TELEMETRY
      // --------------------------------------------------------------------------
      let PRO_LAP_TIME = currentCircuit.proLapTime;
      const proTelemetrySamples = [];

      function generateProBenchmarkLap(classSpec) {
        proTelemetrySamples.length = 0;
        const activeH = (!classSpec && typeof getCurrentCarHandling === 'function') ? getCurrentCarHandling() : null;
        const spec = classSpec || (typeof window !== 'undefined' && window.selectedCarClassSpec) || (activeH && activeH.classSpec) || {
          carClass: 'GT3',
          cornerGripMult: 1.0,
          accelMult: 1.0,
          launchMult: 1.0,
          brakeDecelMult: 1.0,
          topSpeedKmh: 300
        };
        const isGT3 = (!spec.carClass || spec.carClass === 'GT3');
        const cornerMult = spec.cornerGripMult || 1.0;
        const accelMult = spec.accelMult || 1.0;
        const launchMult = spec.launchMult || accelMult;
        const brakeMult = spec.brakeDecelMult || 1.0;
        const aeroDragFactor = spec.aeroDragFactor || 1.0;
        const dfCoeff = (spec.aeroDownforceCoeff !== undefined) ? spec.aeroDownforceCoeff : 0.135;
        const weightKg = Math.max(550, spec.weightKg || 1245);
        const baseMu = spec.baseMuLat || 1.48;
        const shiftEffCar = spec.shiftEff || 0.955;
        const topCapMs = (spec.topSpeedKmh || 300) / 3.6;
        const lineCut = getCornerLineCutFactor(spec);
        computeDynamicOptimalLine(spec);

        const stepM = 10; // High-resolution 10m spatial integration
        const numSteps = Math.floor(totalTrackLength / stepM);
        const nodes = [];
        const vLimitMs = new Array(numSteps);

        // Step 1: Compute true physical cornering speed limit directly from Out-In-Out curvature
        for (let i = 0; i < numSteps; i++) {
          const s = i * stepM;
          const node = sampleTrackAtS(s);
          nodes.push(node);
          if (isGT3) {
            const localMaxKmh = getUpcomingCornerMaxSpeedKmh(s) * cornerMult;
            vLimitMs[i] = Math.min(topCapMs, Math.max(64 / 3.6, localMaxKmh / 3.6));
          } else {
            const localMaxKmh = getUpcomingCornerMaxSpeedKmh(s, spec);
            vLimitMs[i] = Math.min(topCapMs, Math.max(46 / 3.6, localMaxKmh / 3.6));
          }
        }

        // Step 2: Backward Pass — Enforce realistic class braking deceleration (with speed-dependent aero downforce braking)
        const vProfileMs = vLimitMs.slice();
        const maxBrakeDecel = 17.2 * brakeMult;
        for (let pass = 0; pass < 2; pass++) {
          for (let i = numSteps - 1; i >= 0; i--) {
            const nextIdx = (i + 1) % numSteps;
            const vNext = vProfileMs[nextIdx];
            let localBrakeDecel = maxBrakeDecel;
            if (!isGT3) {
              const dfRatio = (dfCoeff * vNext * vNext) / weightKg;
              const aeroBrakeExtra = Math.pow(Math.max(0, dfRatio - 0.55), 0.90) * 0.28;
              const dragBrake = (0.000557 * aeroDragFactor) * vNext * vNext + 0.14;
              localBrakeDecel = maxBrakeDecel * (1.0 + aeroBrakeExtra) + dragBrake * 0.65;
            }
            const vMaxAllowed = Math.sqrt(vNext * vNext + 2 * localBrakeDecel * stepM);
            if (vProfileMs[i] > vMaxAllowed) {
              vProfileMs[i] = vMaxAllowed;
            }
          }
        }

        // Step 3A: Closed-Loop Flying Pass (for spatial target lookup getProProfileAtDistance)
        const vFlyingMs = vProfileMs.slice();
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < numSteps; i++) {
            const nextIdx = (i + 1) % numSteps;
            const vCurr = vFlyingMs[i];
            const vEff = Math.max(vCurr, 12.5);
            const curv = Math.abs(nodes[i].curvature);
            const latG = (vCurr * vCurr * curv * lineCut) / 9.81;

            let netAccel;
            if (isGT3) {
              const shiftEff = (vCurr * 3.6 < 252) ? 0.955 : 1.0;
              const engineAccel = Math.min(8.25 * accelMult, (338.0 * accelMult) / vEff) * shiftEff;
              const dragDecel = 0.000557 * vCurr * vCurr + 0.14 + latG * 0.38;
              const tractionFactor = Math.max(0.28, 1.0 - Math.max(0, (latG - 0.30) / 1.35) * 0.68);
              netAccel = Math.max(0.22, engineAccel * tractionFactor - dragDecel);
            } else {
              const dfRatio = (dfCoeff * vCurr * vCurr) / weightKg;
              const aeroTractionAccel = Math.max(0, dfRatio - 0.55) * 2.4;
              const shiftEff = (vCurr < topCapMs * 0.85) ? shiftEffCar : 1.0;
              const maxMechAccel = 8.25 * launchMult + aeroTractionAccel;
              const engineAccel = Math.min(maxMechAccel, (338.0 * accelMult) / vEff) * shiftEff;
              const dragDecel = (0.000557 * aeroDragFactor) * vCurr * vCurr + 0.14 + latG * 0.32;
              const maxLatAtV = Math.max(0.75, baseMu + Math.pow(Math.max(0, dfRatio), 0.88) * 1.15);
              const tractionFactor = Math.max(0.32, 1.0 - Math.max(0, (latG - 0.25 * maxLatAtV) / Math.max(0.65, maxLatAtV * 0.90)) * 0.65);
              netAccel = (vCurr >= topCapMs - 0.1) ? 0.0 : Math.max(0.08, engineAccel * tractionFactor - dragDecel);
            }
            const vNextMax = Math.min(topCapMs, Math.sqrt(Math.max(0, vCurr * vCurr + 2 * netAccel * stepM)));
            if (vFlyingMs[nextIdx] > vNextMax) {
              vFlyingMs[nextIdx] = vNextMax;
            }
          }
        }

        // Step 3B: Standing-Start Lap 1 Pass for PRO Benchmark Ghost
        for (let i = 0; i < numSteps; i++) vProfileMs[i] = vFlyingMs[i];
        vProfileMs[0] = 0.0;
        for (let i = 0; i < numSteps - 1; i++) {
          const vCurr = vProfileMs[i];
          const vEff = Math.max(vCurr, 12.5);
          const launchRamp = (i === 0) ? 0.78 : (i === 1 ? 0.94 : 1.0);
          const curv = Math.abs(nodes[i].curvature);
          const latG = (vCurr * vCurr * curv * lineCut) / 9.81;

          let netAccel;
          if (isGT3) {
            const shiftEff = (vCurr * 3.6 < 252) ? 0.955 : 1.0;
            const engineAccel = Math.min(8.25 * accelMult, (338.0 * accelMult) / vEff) * launchRamp * shiftEff;
            const dragDecel = 0.000557 * vCurr * vCurr + 0.14 + latG * 0.38;
            const tractionFactor = Math.max(0.28, 1.0 - Math.max(0, (latG - 0.30) / 1.35) * 0.68);
            netAccel = Math.max(0.22, engineAccel * tractionFactor - dragDecel);
          } else {
            const dfRatio = (dfCoeff * vCurr * vCurr) / weightKg;
            const aeroTractionAccel = Math.max(0, dfRatio - 0.55) * 2.4;
            const shiftEff = (vCurr < topCapMs * 0.85) ? shiftEffCar : 1.0;
            const maxMechAccel = 8.25 * launchMult + aeroTractionAccel;
            const engineAccel = Math.min(maxMechAccel, (338.0 * accelMult) / vEff) * launchRamp * shiftEff;
            const dragDecel = (0.000557 * aeroDragFactor) * vCurr * vCurr + 0.14 + latG * 0.32;
            const maxLatAtV = Math.max(0.75, baseMu + Math.pow(Math.max(0, dfRatio), 0.88) * 1.15);
            const tractionFactor = Math.max(0.32, 1.0 - Math.max(0, (latG - 0.25 * maxLatAtV) / Math.max(0.65, maxLatAtV * 0.90)) * 0.65);
            netAccel = (vCurr >= topCapMs - 0.1) ? 0.0 : Math.max(0.08, engineAccel * tractionFactor - dragDecel);
          }
          const vNextMax = Math.min(topCapMs, Math.sqrt(Math.max(0, vCurr * vCurr + 2 * netAccel * stepM)));
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
          } else if (Math.abs(node.curvature) * lineCut > 0.0045 && longAccel < 1.0) {
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
        if (currentCircuit._baseGt3ProLapTime == null) currentCircuit._baseGt3ProLapTime = currentCircuit.proLapTime;
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

      function getLookaheadCornerTargetKmh(s, currSpeedKmh) {
        const spd = Math.max(40, Math.abs(currSpeedKmh || 0));
        // Speed-dependent braking distance lookahead (57m slow hairpins -> 270m top-speed approaches)
        const lookDist = Math.min(270, Math.max(40, 26 + spd * 0.78));
        const activeH = (typeof getCurrentCarHandling === 'function') ? getCurrentCarHandling() : null;
        const spec = (typeof window !== 'undefined' && window.selectedCarClassSpec) || (activeH && activeH.classSpec) || null;
        const topCap = (spec && spec.topSpeedKmh) ? Math.max(180, spec.topSpeedKmh) : 305;
        let minKmh = topCap;
        for (let off = 10; off <= lookDist; off += 20) {
          let candidate = getUpcomingCornerMaxSpeedKmh(s + off, spec);
          if (typeof proTelemetrySamples !== 'undefined' && proTelemetrySamples.length > 2) {
            const proP = getProProfileAtDistance(s + off);
            if (proP && proP.speedKmh < candidate) candidate = proP.speedKmh;
          }
          if (candidate < minKmh) minKmh = candidate;
        }
        return Math.round(minKmh);
      }

window.selectedCarClassSpec = window.selectedCarClassSpec || null;
window.rebuildProBenchmarkForCurrentCar = function rebuildProBenchmarkForCurrentCar() {
  if (typeof getCurrentCarHandling === 'function') {
    const h = getCurrentCarHandling();
    if (h && h.classSpec) {
      window.selectedCarClassSpec = Object.assign({
        carClass: h.carClass,
        lineBias: (typeof h.lineBias === 'number') ? h.lineBias : (h.classSpec.lineBias || 0.0)
      }, h.classSpec);
    } else {
      window.selectedCarClassSpec = null;
    }
  }
  generateProBenchmarkLap(window.selectedCarClassSpec);
  if (typeof window.refreshTacticalRibbonForCurrentCar === 'function') {
    window.refreshTacticalRibbonForCurrentCar();
  }
  if (typeof simState !== 'undefined' && simState) {
    simState.bestLapTime = PRO_LAP_TIME;
    const hudBest = typeof document !== 'undefined' && document.getElementById('hud-best-time');
    if (hudBest) hudBest.textContent = formatLapTime(PRO_LAP_TIME);
  }
};

window.estimateClassProLapTime = function estimateClassProLapTime(circuitIdx, carClass, weather) {
  const c = CIRCUITS[circuitIdx] || CIRCUITS[0];
  const baseTime = (c && (c._baseGt3ProLapTime || c.proLapTime)) ? (c._baseGt3ProLapTime || c.proLapTime) : 95.0;
  const CLASS_PRO_MULT = { D: 1.275, C: 1.105, B: 1.005, GT3: 1.000, A: 0.925, S: 0.885, R: 0.855, LMH: 0.795, X: 0.725, F1: 0.675 };
  const clsMult = CLASS_PRO_MULT[carClass] || 1.0;
  const wetMult = (weather === 'wet') ? 1.125 : 1.0;
  return Number((baseTime * clsMult * wetMult).toFixed(3));
};
window.CIRCUITS = CIRCUITS;
window.trackNodes = trackNodes;
window.getTotalTrackLength = () => totalTrackLength;
window.currentCircuitIndex = currentCircuitIndex;
window.currentCircuit = currentCircuit;
window.sampleTrackAtS = sampleTrackAtS;
window.sdToWorld = sdToWorld;
window.buildTrackGeometryData = buildTrackGeometryData;
window.computeDynamicOptimalLine = computeDynamicOptimalLine;
window.generateProBenchmarkLap = generateProBenchmarkLap;
window.sampleGhostAtTime = sampleGhostAtTime;
window.proTelemetrySamples = proTelemetrySamples;
window.PRO_LAP_TIME = PRO_LAP_TIME;
window.getCornerLineCutFactor = getCornerLineCutFactor;
window.getUpcomingCornerMaxSpeedKmh = getUpcomingCornerMaxSpeedKmh;
window.getLookaheadCornerTargetKmh = getLookaheadCornerTargetKmh;
window.getProProfileAtDistance = getProProfileAtDistance;
window.getProTimeAtDistance = getProTimeAtDistance;
if (window.__apexTrace) window.__apexTrace('circuits.js', 'OK');