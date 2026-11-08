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
          proLapTime: 68.420,
          elevationAmp1: 2.2,
          elevationAmp2: 1.0,
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
          proLapTime: 74.850,
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
          proLapTime: 81.600,
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
          const y = Math.sin((i / TRACK_SAMPLES) * Math.PI * 2) * currentCircuit.elevationAmp1 +
            Math.cos((i / TRACK_SAMPLES) * Math.PI * 4) * currentCircuit.elevationAmp2;
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
          node
        };
      }

      function getUpcomingCornerMaxSpeedKmh(s) {
        let maxCurv = 0;
        for (let offset = 0; offset <= 95; offset += 15) {
          const n = sampleTrackAtS(s + offset);
          if (Math.abs(n.curvature) > maxCurv) maxCurv = Math.abs(n.curvature);
        }
        if (maxCurv < 0.0018) return 300;
        const effectiveCurv = Math.max(0.0008, maxCurv * 0.62);
        const vMsMax = Math.sqrt((1.48 * 9.81) / effectiveCurv);
        return Math.min(300, Math.max(60, Math.round(vMsMax * 3.6)));
      }

      // --------------------------------------------------------------------------
      // 2. PRE-COMPUTED PRO BENCHMARK GHOST LAP & TELEMETRY
      // --------------------------------------------------------------------------
      let PRO_LAP_TIME = currentCircuit.proLapTime;
      const proTelemetrySamples = [];

      function generateProBenchmarkLap() {
        proTelemetrySamples.length = 0;
        const stepM = 10; // High-resolution 10m spatial integration
        const numSteps = Math.floor(totalTrackLength / stepM);
        const nodes = [];
        const vLimitMs = new Array(numSteps);

        // Step 1: Compute true physical cornering speed limit at every 10m point (1.42G tire friction circle)
        for (let i = 0; i < numSteps; i++) {
          const s = i * stepM;
          const node = sampleTrackAtS(s);
          nodes.push(node);
          // Look around local apex window (-15m to +25m) to get true corner curvature
          let maxCurv = Math.abs(node.curvature);
          for (let off = -15; off <= 25; off += 10) {
            const c = Math.abs(sampleTrackAtS(s + off).curvature);
            if (c > maxCurv) maxCurv = c;
          }
          const cornerLimitKmh = getUpcomingCornerMaxSpeedKmh(s - 15);
          const localMaxKmh = maxCurv > 0.0018
            ? Math.min(node.vTarget, cornerLimitKmh, Math.sqrt((1.42 * 9.81) / (maxCurv * 0.62)) * 3.6)
            : Math.min(298, node.vTarget);
          vLimitMs[i] = Math.max(62 / 3.6, localMaxKmh / 3.6);
        }

        // Step 2: Backward Pass — Enforce realistic braking deceleration (a_brake = 16.2 m/s^2)
        // PRO car MUST brake 120m-160m before every hairpin/corner just like the player!
        const vProfileMs = vLimitMs.slice();
        const maxBrakeDecel = 16.2; // ~1.65G threshold + trail braking deceleration
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

        // Step 3: Forward Pass — Enforce realistic GT3 standing-start 0-100 (3.5s) / 0-300 (40s) acceleration curve
        vProfileMs[0] = Math.min(vProfileMs[0], 14.0); // Realistic launch speed across line
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 0; i < numSteps; i++) {
            if (pass === 1 && i === 0) continue; // Keep standing start for Lap 1
            const nextIdx = (i + 1) % numSteps;
            const vCurr = vProfileMs[i];
            const vEff = Math.max(vCurr, 12.5);
            const engineAccel = Math.min(8.25, 338.0 / vEff);
            const dragDecel = 0.000557 * vCurr * vCurr + 0.14;
            // Reduce longitudinal acceleration when cornering (traction circle sharing)
            const curv = Math.abs(nodes[i].curvature);
            const latG = (vCurr * vCurr * curv * 0.62) / 9.81;
            const tractionFactor = Math.max(0.25, 1.0 - (latG / 1.65) * 0.65);
            const netAccel = Math.max(0.2, engineAccel * tractionFactor - dragDecel);
            const vNextMax = Math.sqrt(vCurr * vCurr + 2 * netAccel * stepM);
            if (vProfileMs[nextIdx] > vNextMax) {
              vProfileMs[nextIdx] = vNextMax;
            }
          }
        }

        // Step 4: Integrate exact physical lap time & pedal telemetry traces
        let simTime = 0;
        for (let i = 0; i < numSteps; i++) {
          const nextIdx = (i + 1) % numSteps;
          const s = i * stepM;
          const node = nodes[i];
          const vCurr = vProfileMs[i];
          const vNext = vProfileMs[nextIdx];
          const vAvg = Math.max(10.0, 0.5 * (vCurr + vNext));
          const dt = stepM / vAvg;
          const longAccel = (vNext * vNext - vCurr * vCurr) / (2 * stepM);

          let throttle = 0;
          let brake = 0;
          if (longAccel < -1.2) {
            // PRO Ghost is actively braking into the corner!
            brake = Math.min(86, Math.max(15, Math.round((-longAccel / maxBrakeDecel) * 84)));
            throttle = 0;
          } else if (Math.abs(node.curvature) > 0.0045 && longAccel < 1.5) {
            // Mid-corner partial throttle modulation
            throttle = Math.max(35, Math.min(78, Math.round(55 + longAccel * 12)));
            brake = longAccel < -0.4 ? 18 : 0;
          } else {
            throttle = 100;
            brake = 0;
          }

          const steerDeg = Math.max(-240, Math.min(240, node.curvature * 14500));
          const d = node.optimalD;
          const world = sdToWorld(s, d);

          proTelemetrySamples.push({
            s,
            t: simTime,
            d,
            x: world.x,
            y: world.y,
            z: world.z,
            heading: world.heading,
            speed: vCurr * 3.6,
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
        return {
          speedKmh: a.speed + (b.speed - a.speed) * f,
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

window.CIRCUITS = CIRCUITS;
window.currentCircuitIndex = currentCircuitIndex;
window.currentCircuit = currentCircuit;
window.sampleTrackAtS = sampleTrackAtS;
window.sdToWorld = sdToWorld;
window.buildTrackGeometryData = buildTrackGeometryData;
window.generateProBenchmarkLap = generateProBenchmarkLap;
window.proTelemetrySamples = proTelemetrySamples;
window.PRO_LAP_TIME = PRO_LAP_TIME;
window.getUpcomingCornerMaxSpeedKmh = getUpcomingCornerMaxSpeedKmh;
window.getProProfileAtDistance = getProProfileAtDistance;
window.getProTimeAtDistance = getProTimeAtDistance;
if (window.__apexTrace) window.__apexTrace('circuits.js', 'OK');