// ============================================================================
// APEX PRO RACING // MODULE 3: THREE.JS 3D RENDERER & VISUAL FX PIPELINE
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('render.js', 'START');

      const container = document.getElementById('canvas-container');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.15, 2600);
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.08);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.25);
      dirLight.position.set(350, 520, 260);
      scene.add(dirLight);

      const circuitSceneryGroup = new THREE.Group();
      scene.add(circuitSceneryGroup);
      let tacticalRibbonMesh = null;

      function makeSignTexture(distStr, accentHex) {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 140;
        const ctx = c.getContext('2d');
        // FIA standard high-contrast reflective white board
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 140);
        // Colored accent warning stripe
        ctx.fillStyle = accentHex;
        ctx.fillRect(0, 0, 256, 20);
        // High-contrast black border
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 248, 132);
        // Bold distance number
        ctx.fillStyle = '#090d16';
        ctx.font = '900 80px "JetBrains Mono", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(distStr, 128, 70);
        // Clean subtext METERS
        ctx.fillStyle = '#475569';
        ctx.font = '800 20px "JetBrains Mono", sans-serif';
        ctx.fillText('METERS', 128, 120);
        return new THREE.CanvasTexture(c);
      }

      const tex150 = makeSignTexture('150', '#16a34a'); // Green (150m lift/coast)
      const tex100 = makeSignTexture('100', '#f59e0b'); // Amber (100m hard brake)
      const tex50 = makeSignTexture('50', '#dc2626');   // Red (50m trail/turn-in)
      const brakeSignTextures = [tex150, tex100, tex50];

      // --------------------------------------------------------------------------
      // 4A. PROCEDURAL PBR ASPHALT GENERATOR + PMREM ENVIRONMENT REFLECTIONS
      //     (Zero external files: seamless tileable Albedo / Normal / Roughness)
      // --------------------------------------------------------------------------
      const IS_MOBILE_GPU = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
      const ASPHALT_TILE_M = 4.0;           // one texture tile covers ~4m x 4m of tarmac
      const gfxSettings = {
        pbrAsphalt: true,
        asphaltRes: IS_MOBILE_GPU ? 512 : 1024,
        envReflections: true
      };
      try {
        const savedGfx = JSON.parse(localStorage.getItem('apexpro.gfx') || 'null');
        if (savedGfx) Object.assign(gfxSettings, savedGfx);
      } catch (e) { /* ignore corrupted storage */ }
      function saveGfxSettings() {
        try { localStorage.setItem('apexpro.gfx', JSON.stringify(gfxSettings)); } catch (e) { }
      }

      let asphaltTextureSet = null;   // { res, map, normalMap, roughnessMap }
      let rubberGradientTex = null;

      function generateAsphaltPBRSet(N) {
        const t0 = performance.now();
        const height = new Float32Array(N * N);
        const tone = new Float32Array(N * N);     // per-aggregate colour variation
        const stone = new Float32Array(N * N);    // 1 = polished aggregate (smoother)

        function hash(ix, iy, seed) {
          let n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed + 1, 1442695041);
          n = Math.imul(n ^ (n >>> 13), 1274126177);
          n ^= n >>> 16;
          return (n >>> 0) / 4294967296;
        }
        // Periodic value noise -> perfectly seamless tiling
        function periodicNoise(x, y, period, seed) {
          const x0 = Math.floor(x), y0 = Math.floor(y);
          const fx = x - x0, fy = y - y0;
          const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
          const xa = ((x0 % period) + period) % period, xb = (xa + 1) % period;
          const ya = ((y0 % period) + period) % period, yb = (ya + 1) % period;
          const a = hash(xa, ya, seed), b = hash(xb, ya, seed);
          const c = hash(xa, yb, seed), d = hash(xb, yb, seed);
          return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
        }

        // 1) Fractal base (binder / fine grit)
        const periods = [4, 8, 16, 32, 64, 128];
        const amps = [0.30, 0.22, 0.16, 0.12, 0.10, 0.10];
        for (let y = 0; y < N; y++) {
          const v = y / N;
          for (let x = 0; x < N; x++) {
            const u = x / N;
            let h = 0;
            for (let o = 0; o < periods.length; o++) {
              const p = periods[o];
              h += amps[o] * periodicNoise(u * p, v * p, p, o * 17);
            }
            height[y * N + x] = h * 0.55;
          }
        }

        // 2) Aggregate stones (domes, wrapped across tile borders)
        let seed = 1337;
        const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
        const scale = N / 1024;
        const stoneCount = Math.floor((N * N) / 95);
        for (let k = 0; k < stoneCount; k++) {
          const cx = rnd() * N, cy = rnd() * N;
          const r = (1.1 + Math.pow(rnd(), 2.2) * 4.2) * scale + 0.6;
          const hBoost = 0.20 + rnd() * 0.38;
          const tVal = (rnd() - 0.5) * 0.16;
          const ri = Math.ceil(r);
          for (let dy = -ri; dy <= ri; dy++) {
            for (let dx = -ri; dx <= ri; dx++) {
              const dd = (dx * dx + dy * dy) / (r * r);
              if (dd > 1) continue;
              const px = ((Math.floor(cx) + dx) % N + N) % N;
              const py = ((Math.floor(cy) + dy) % N + N) % N;
              const idx = py * N + px;
              const hv = 0.35 + hBoost * Math.sqrt(1 - dd);
              if (hv > height[idx]) {
                height[idx] = hv;
                tone[idx] = tVal;
                stone[idx] = 1;
              }
            }
          }
        }

        // 3) Voids / pores (dark pits that catch shadow)
        const poreCount = Math.floor((N * N) / 420);
        for (let k = 0; k < poreCount; k++) {
          const cx = Math.floor(rnd() * N), cy = Math.floor(rnd() * N);
          const r = (0.8 + rnd() * 1.6) * scale + 0.4;
          const ri = Math.ceil(r);
          for (let dy = -ri; dy <= ri; dy++) {
            for (let dx = -ri; dx <= ri; dx++) {
              if (dx * dx + dy * dy > r * r) continue;
              const idx = (((cy + dy) % N + N) % N) * N + (((cx + dx) % N + N) % N);
              height[idx] = Math.min(height[idx], 0.05);
              stone[idx] = 0;
              tone[idx] = -0.08;
            }
          }
        }

        // 4) Bake Albedo / Normal / Roughness canvases
        function makeCanvas() {
          const c = document.createElement('canvas');
          c.width = N; c.height = N;
          return c;
        }
        const albedoC = makeCanvas(), normalC = makeCanvas(), roughC = makeCanvas();
        const aCtx = albedoC.getContext('2d'), nCtx = normalC.getContext('2d'), rCtx = roughC.getContext('2d');
        const aImg = aCtx.createImageData(N, N), nImg = nCtx.createImageData(N, N), rImg = rCtx.createImageData(N, N);
        const normalStrength = 3.2 * scale + 1.2;

        for (let y = 0; y < N; y++) {
          const yU = ((y - 1 + N) % N) * N, yD = ((y + 1) % N) * N, yC = y * N;
          for (let x = 0; x < N; x++) {
            const idx = yC + x;
            const h = height[idx];
            const p4 = idx * 4;

            // Albedo: dark binder, lighter aggregate, subtle cool tint
            const g = Math.max(0.03, Math.min(0.85, 0.26 + (h - 0.35) * 0.42 + tone[idx]));
            aImg.data[p4] = Math.round(g * 255);
            aImg.data[p4 + 1] = Math.round(g * 255);
            aImg.data[p4 + 2] = Math.round(Math.min(1, g * 1.06 + 0.008) * 255);
            aImg.data[p4 + 3] = 255;

            // Normal (OpenGL convention, canvas y is flipped to +V)
            const hL = height[yC + ((x - 1 + N) % N)], hR = height[yC + ((x + 1) % N)];
            const hU = height[yU + x], hD = height[yD + x];
            let nx = -(hR - hL) * normalStrength;
            let ny = (hD - hU) * normalStrength;
            let nz = 1.0;
            const inv = 1 / Math.hypot(nx, ny, nz);
            nx *= inv; ny *= inv; nz *= inv;
            nImg.data[p4] = Math.round((nx * 0.5 + 0.5) * 255);
            nImg.data[p4 + 1] = Math.round((ny * 0.5 + 0.5) * 255);
            nImg.data[p4 + 2] = Math.round((nz * 0.5 + 0.5) * 255);
            nImg.data[p4 + 3] = 255;

            // Roughness: binder very rough, polished aggregate slightly glossier
            const rough = Math.max(0.45, Math.min(1.0, 0.93 - stone[idx] * 0.18 + (0.35 - h) * 0.10));
            const rv = Math.round(rough * 255);
            rImg.data[p4] = rv; rImg.data[p4 + 1] = rv; rImg.data[p4 + 2] = rv; rImg.data[p4 + 3] = 255;
          }
        }
        aCtx.putImageData(aImg, 0, 0);
        nCtx.putImageData(nImg, 0, 0);
        rCtx.putImageData(rImg, 0, 0);

        const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
        function toTex(c) {
          const t = new THREE.CanvasTexture(c);
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.anisotropy = Math.min(8, maxAniso);
          t.needsUpdate = true;
          return t;
        }
        const set = { res: N, map: toTex(albedoC), normalMap: toTex(normalC), roughnessMap: toTex(roughC) };
        console.log(`[APEX PBR] Asphalt ${N}x${N} baked in ${(performance.now() - t0).toFixed(0)} ms`);
        return set;
      }

      function getAsphaltTextureSet() {
        if (asphaltTextureSet && asphaltTextureSet.res === gfxSettings.asphaltRes) return asphaltTextureSet;
        if (asphaltTextureSet) {
          asphaltTextureSet.map.dispose();
          asphaltTextureSet.normalMap.dispose();
          asphaltTextureSet.roughnessMap.dispose();
        }
        asphaltTextureSet = generateAsphaltPBRSet(gfxSettings.asphaltRes);
        return asphaltTextureSet;
      }

      function getRubberGradientTexture() {
        if (rubberGradientTex) return rubberGradientTex;
        const c = document.createElement('canvas');
        c.width = 128; c.height = 4;
        const ctx = c.getContext('2d');
        const grd = ctx.createLinearGradient(0, 0, 128, 0);
        grd.addColorStop(0.0, 'rgba(255,255,255,0)');
        grd.addColorStop(0.3, 'rgba(255,255,255,0.75)');
        grd.addColorStop(0.5, 'rgba(255,255,255,1)');
        grd.addColorStop(0.7, 'rgba(255,255,255,0.75)');
        grd.addColorStop(1.0, 'rgba(255,255,255,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 128, 4);
        rubberGradientTex = new THREE.CanvasTexture(c);
        return rubberGradientTex;
      }

      let carContactShadowTex = null;
      function getCarContactShadowTexture() {
        if (carContactShadowTex) return carContactShadowTex;
        const c = document.createElement('canvas');
        c.width = 256; c.height = 128;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 256, 128);

        // Soft under-chassis ambient occlusion ellipse
        ctx.save();
        ctx.translate(128, 64);
        ctx.scale(1.85, 0.88);
        const gMain = ctx.createRadialGradient(0, 0, 8, 0, 0, 62);
        gMain.addColorStop(0.0, 'rgba(0, 0, 0, 0.88)');
        gMain.addColorStop(0.55, 'rgba(0, 0, 0, 0.68)');
        gMain.addColorStop(0.82, 'rgba(0, 0, 0, 0.28)');
        gMain.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
        ctx.fillStyle = gMain;
        ctx.beginPath();
        ctx.arc(0, 0, 62, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Four darker tire contact patches
        [[72, 26], [72, 102], [184, 26], [184, 102]].forEach(([tx, ty]) => {
          const gTire = ctx.createRadialGradient(tx, ty, 2, tx, ty, 22);
          gTire.addColorStop(0.0, 'rgba(0, 0, 0, 0.75)');
          gTire.addColorStop(0.6, 'rgba(0, 0, 0, 0.32)');
          gTire.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
          ctx.fillStyle = gTire;
          ctx.beginPath();
          ctx.arc(tx, ty, 22, 0, Math.PI * 2);
          ctx.fill();
        });

        carContactShadowTex = new THREE.CanvasTexture(c);
        return carContactShadowTex;
      }

      // PMREM environment map built from a tiny procedural "sky dome + softbox" scene,
      // re-tinted per circuit theme. Balanced so PBR car paint integrates naturally with Lambert scenery.
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      let currentEnvRT = null;
      function updateEnvironmentMap(th) {
        if (currentEnvRT) { currentEnvRT.dispose(); currentEnvRT = null; }
        if (!gfxSettings.envReflections) { scene.environment = null; return; }
        const envScene = new THREE.Scene();
        const skyCol = new THREE.Color(th.skyColor).multiplyScalar(0.85);
        const groundCol = new THREE.Color(th.grassColor || 0x1e293b).multiplyScalar(0.45);
        const horizonCol = skyCol.clone().lerp(new THREE.Color(th.hasSunsetFlare ? 0xff9a5a : 0xdbeafe), 0.35);

        const domeGeo = new THREE.SphereGeometry(50, 32, 16);
        const domeColors = [];
        const pos = domeGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const yN = pos.getY(i) / 50;
          const c = yN > 0
            ? horizonCol.clone().lerp(skyCol, Math.min(1, yN * 1.6))
            : horizonCol.clone().lerp(groundCol, Math.min(1, -yN * 3.0));
          domeColors.push(c.r, c.g, c.b);
        }
        domeGeo.setAttribute('color', new THREE.Float32BufferAttribute(domeColors, 3));
        envScene.add(new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

        // Subtle softboxes: gentle sun highlight + studio strips (no over-exposure)
        const sunDir = new THREE.Vector3(th.sunPos[0], th.sunPos[1], th.sunPos[2]).normalize();
        const sunBox = new THREE.Mesh(
          new THREE.SphereGeometry(th.isNight ? 2.2 : 3.8, 16, 8),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(th.sunColor).multiplyScalar(th.isNight ? 0.9 : 1.9) })
        );
        sunBox.position.copy(sunDir.multiplyScalar(40));
        envScene.add(sunBox);
        const stripMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe2e8f0).multiplyScalar(th.isNight ? 0.35 : 0.72), side: THREE.DoubleSide });
        for (let k = -1; k <= 1; k++) {
          const strip = new THREE.Mesh(new THREE.PlaneGeometry(54, 2.6), stripMat);
          strip.rotation.x = Math.PI / 2;
          strip.position.set(0, 30, k * 12);
          envScene.add(strip);
        }

        currentEnvRT = pmremGenerator.fromScene(envScene, 0.04);
        scene.environment = currentEnvRT.texture;

        envScene.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
      }

      function rebuild3DCircuitScene() {
        while (circuitSceneryGroup.children.length > 0) {
          circuitSceneryGroup.remove(circuitSceneryGroup.children[0]);
        }

        const th = currentCircuit.theme;
        scene.background = new THREE.Color(th.skyColor);
        scene.fog = new THREE.FogExp2(th.fogColor, th.fogDensity);

        hemiLight.color.setHex(th.hemiSky);
        hemiLight.groundColor.setHex(th.hemiGround);
        hemiLight.intensity = th.hemiIntensity;

        dirLight.color.setHex(th.sunColor);
        dirLight.intensity = th.sunIntensity;
        dirLight.position.set(th.sunPos[0], th.sunPos[1], th.sunPos[2]);

        updateEnvironmentMap(th);

        if (th.isNight) {
          const starGeo = new THREE.BufferGeometry();
          const starPositions = [];
          for (let i = 0; i < 650; i++) {
            const theta = Math.random() * Math.PI * 2;
            const y = 160 + Math.random() * 900;
            const r = 900 + Math.random() * 1100;
            starPositions.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
          }
          starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
          const starMat = new THREE.PointsMaterial({ color: 0xe0f2fe, size: 4.5 });
          circuitSceneryGroup.add(new THREE.Points(starGeo, starMat));

          const moonMesh = new THREE.Mesh(
            new THREE.SphereGeometry(55, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
          );
          moonMesh.position.set(-600, 580, 1400);
          circuitSceneryGroup.add(moonMesh);
        } else {
          const sunOrb = new THREE.Mesh(
            new THREE.SphereGeometry(75, 20, 20),
            new THREE.MeshBasicMaterial({ color: th.hasSunsetFlare ? 0xff7b29 : 0xfef9c3 })
          );
          sunOrb.position.set(th.sunPos[0] * 1.8, th.sunPos[1] * 1.4, th.sunPos[2] * 1.8);
          circuitSceneryGroup.add(sunOrb);
        }

        const mtFujiGeo = new THREE.ConeGeometry(720, 420, 32);
        const mtFujiMat = new THREE.MeshLambertMaterial({ color: th.isNight ? 0x0f172a : 0x1e293b });
        const mtFuji = new THREE.Mesh(mtFujiGeo, mtFujiMat);
        mtFuji.position.set(420, 195, 2150);
        circuitSceneryGroup.add(mtFuji);

        const snowCapGeo = new THREE.ConeGeometry(265, 155, 32);
        const snowCapMat = new THREE.MeshBasicMaterial({ color: th.isNight ? 0x94a3b8 : 0xf1f5f9 });
        const snowCap = new THREE.Mesh(snowCapGeo, snowCapMat);
        snowCap.position.set(420, 326, 2150);
        circuitSceneryGroup.add(snowCap);

        const hillCoords = [
          { x: -1650, z: 1400, r: 520, h: 240 },
          { x: 1750, z: 950, r: 460, h: 210 },
          { x: -1500, z: -750, r: 490, h: 220 },
          { x: 950, z: -980, r: 430, h: 190 }
        ];
        hillCoords.forEach(hc => {
          const hMesh = new THREE.Mesh(
            new THREE.ConeGeometry(hc.r, hc.h, 16),
            new THREE.MeshLambertMaterial({ color: th.isNight ? 0x090f1d : 0x142132 })
          );
          hMesh.position.set(hc.x, hc.h * 0.42, hc.z);
          circuitSceneryGroup.add(hMesh);
        });

        const groundGeo = new THREE.PlaneGeometry(6500, 6500);
        const groundMat = new THREE.MeshLambertMaterial({ color: th.grassColor });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -18;
        circuitSceneryGroup.add(ground);

        const positions = [];
        const colors = [];
        const indices = [];
        const trackUVs = [];
        const rubberPositions = [];
        const rubberUVs = [];
        // Make the along-track tile length divide the lap exactly -> seamless texture at start/finish
        const asphaltTileV = totalTrackLength / Math.max(1, Math.round(totalTrackLength / ASPHALT_TILE_M));
        const asphaltTileU = TRACK_WIDTH / ASPHALT_TILE_M;

        const edgeLinePositions = [];
        const edgeLineIndices = [];
        let edgeVertCount = 0;

        const runoffPositions = [];
        const runoffColors = [];
        const runoffIndices = [];

        const kerbPositions = [];
        const kerbColors = [];
        const kerbIndices = [];
        let kerbVertCount = 0;

        const ribbonPositions = [];
        const ribbonColors = [];
        const ribbonIndices = [];

        const sceneryNodes = [];
        const heavyBrakeApexes = [];

        for (let i = 0; i <= TRACK_SAMPLES; i++) {
          const node = trackNodes[i % TRACK_SAMPLES];
          const nextLook = trackNodes[(i + 22) % TRACK_SAMPLES];
          const halfW = TRACK_WIDTH * 0.5;
          const runoffHalfW = halfW + 12.0;

          const lx = node.x - node.rightX * halfW;
          const lz = node.z - node.rightZ * halfW;
          const rx = node.x + node.rightX * halfW;
          const rz = node.z + node.rightZ * halfW;

          positions.push(lx, node.y, lz);
          positions.push(rx, node.y, rz);

          const rLx = node.x - node.rightX * runoffHalfW;
          const rLz = node.z - node.rightZ * runoffHalfW;
          const rRx = node.x + node.rightX * runoffHalfW;
          const rRz = node.z + node.rightZ * runoffHalfW;
          runoffPositions.push(rLx, node.y - 0.06, rLz);
          runoffPositions.push(rRx, node.y - 0.06, rRz);
          const isAlt = (Math.floor(i / 4) % 2 === 0);
          const gCol = th.isNight ? (isAlt ? 0.07 : 0.09) : (isAlt ? 0.16 : 0.20);
          runoffColors.push(0.06, gCol, 0.09, 0.06, gCol, 0.09);

          const bandGrain = ((i % 3 === 0) ? 0.015 : 0);
          const isBrakingZone = Math.abs(nextLook.curvature) > 0.0055 && Math.abs(node.curvature) < 0.004;
          const cVal = (isBrakingZone ? 0.12 : (Math.abs(node.curvature) > 0.0045 ? 0.15 : 0.19)) + bandGrain;
          if (gfxSettings.pbrAsphalt) {
            // Vertex colour becomes a tint multiplier over the PBR albedo (braking zones = darker rubber)
            const tint = 0.45 + (cVal / 0.205) * 0.40;
            colors.push(tint, tint, tint);
            colors.push(tint, tint, tint);
          } else {
            colors.push(cVal, cVal, cVal + 0.025);
            colors.push(cVal, cVal, cVal + 0.025);
          }

          const vAlong = (i === TRACK_SAMPLES ? totalTrackLength : node.s) / asphaltTileV;
          trackUVs.push(0, vAlong, asphaltTileU, vAlong);

          const rubHalfW = 1.25;
          rubberPositions.push(
            node.x + node.rightX * (node.optimalD - rubHalfW), node.y + 0.012, node.z + node.rightZ * (node.optimalD - rubHalfW),
            node.x + node.rightX * (node.optimalD + rubHalfW), node.y + 0.012, node.z + node.rightZ * (node.optimalD + rubHalfW)
          );
          rubberUVs.push(0, 0, 1, 0);

          const ribHalfW = 1.05;
          const rbLx = node.x + node.rightX * (node.optimalD - ribHalfW);
          const rbLz = node.z + node.rightZ * (node.optimalD - ribHalfW);
          const rbRx = node.x + node.rightX * (node.optimalD + ribHalfW);
          const rbRz = node.z + node.rightZ * (node.optimalD + ribHalfW);
          ribbonPositions.push(rbLx, node.y + 0.05, rbLz);
          ribbonPositions.push(rbRx, node.y + 0.05, rbRz);

          const curvNow = Math.abs(node.curvature);
          const curvAhead = Math.abs(nextLook.curvature);
          let rr = 0.06, rg = 0.82, rb = 0.50;
          if (curvAhead > 0.0052 && curvAhead > curvNow * 1.1) {
            rr = 0.96; rg = 0.18; rb = 0.22;
          } else if (curvNow > 0.0035) {
            rr = 0.98; rg = 0.65; rb = 0.08;
          }
          ribbonColors.push(rr, rg, rb, rr, rg, rb);

          if (i < TRACK_SAMPLES) {
            const base = i * 2;
            indices.push(base, base + 1, base + 2);
            indices.push(base + 1, base + 3, base + 2);

            runoffIndices.push(base, base + 1, base + 2);
            runoffIndices.push(base + 1, base + 3, base + 2);

            ribbonIndices.push(base, base + 1, base + 2);
            ribbonIndices.push(base + 1, base + 3, base + 2);

            const nextNode = trackNodes[(i + 1) % TRACK_SAMPLES];

            for (const side of [-1, 1]) {
              const d0 = side * (halfW - 0.35);
              const d1 = side * (halfW - 0.05);
              edgeLinePositions.push(
                node.x + node.rightX * d0, node.y + 0.025, node.z + node.rightZ * d0,
                node.x + node.rightX * d1, node.y + 0.025, node.z + node.rightZ * d1,
                nextNode.x + nextNode.rightX * d0, nextNode.y + 0.025, nextNode.z + nextNode.rightZ * d0,
                nextNode.x + nextNode.rightX * d1, nextNode.y + 0.025, nextNode.z + nextNode.rightZ * d1
              );
              edgeLineIndices.push(
                edgeVertCount, edgeVertCount + 1, edgeVertCount + 2,
                edgeVertCount + 1, edgeVertCount + 3, edgeVertCount + 2
              );
              edgeVertCount += 4;
            }

            if (Math.abs(node.curvature) > 0.0026) {
              const isRed = (i % 2 === 0);
              const kr = isRed ? 0.92 : 0.96;
              const kg = isRed ? 0.14 : 0.96;
              const kb = isRed ? 0.14 : 0.96;
              const kerbW = 1.65;

              for (const side of [-1, 1]) {
                const dInner = side * halfW;
                const dOuter = side * (halfW + kerbW);

                const x0 = node.x + node.rightX * dInner;
                const z0 = node.z + node.rightZ * dInner;
                const x1 = node.x + node.rightX * dOuter;
                const z1 = node.z + node.rightZ * dOuter;

                const x2 = nextNode.x + nextNode.rightX * dInner;
                const z2 = nextNode.z + nextNode.rightZ * dInner;
                const x3 = nextNode.x + nextNode.rightX * dOuter;
                const z3 = nextNode.z + nextNode.rightZ * dOuter;

                kerbPositions.push(
                  x0, node.y + 0.03, z0,
                  x1, node.y + 0.11, z1,
                  x2, nextNode.y + 0.03, z2,
                  x3, nextNode.y + 0.11, z3
                );
                for (let k = 0; k < 4; k++) kerbColors.push(kr, kg, kb);
                kerbIndices.push(
                  kerbVertCount, kerbVertCount + 1, kerbVertCount + 2,
                  kerbVertCount + 1, kerbVertCount + 3, kerbVertCount + 2
                );
                kerbVertCount += 4;
              }
            }

            if (i % 6 === 0) {
              sceneryNodes.push({ node, idx: i });
            }

            if (i > 15 && i < TRACK_SAMPLES - 15) {
              const isSignificantTurn = Math.abs(node.curvature) > 0.0036;
              const isHeavyBraking = (node.vTarget && node.vTarget < 205);
              if ((isSignificantTurn || isHeavyBraking) &&
                (heavyBrakeApexes.length === 0 || node.s - heavyBrakeApexes[heavyBrakeApexes.length - 1] > 240)) {
                heavyBrakeApexes.push(node.s);
              }
            }
          }
        }

        const runoffGeo = new THREE.BufferGeometry();
        runoffGeo.setAttribute('position', new THREE.Float32BufferAttribute(runoffPositions, 3));
        runoffGeo.setAttribute('color', new THREE.Float32BufferAttribute(runoffColors, 3));
        runoffGeo.setIndex(runoffIndices);
        runoffGeo.computeVertexNormals();
        circuitSceneryGroup.add(new THREE.Mesh(runoffGeo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));

        const trackGeo = new THREE.BufferGeometry();
        trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        trackGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        trackGeo.setIndex(indices);
        trackGeo.computeVertexNormals();
        let trackMat;
        if (gfxSettings.pbrAsphalt) {
          const ats = getAsphaltTextureSet();
          trackGeo.setAttribute('uv', new THREE.Float32BufferAttribute(trackUVs, 2));
          trackMat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            map: ats.map,
            normalMap: ats.normalMap,
            normalScale: new THREE.Vector2(1.0, 1.0),
            roughnessMap: ats.roughnessMap,
            roughness: 1.0,
            metalness: 0.0,
            envMapIntensity: th.isNight ? 0.25 : 0.45,
            side: THREE.DoubleSide
          });
        } else {
          trackMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
        }
        circuitSceneryGroup.add(new THREE.Mesh(trackGeo, trackMat));

        if (gfxSettings.pbrAsphalt) {
          // Rubbered-in racing line: soft dark band laid down by thousands of laps
          const rubberGeo = new THREE.BufferGeometry();
          rubberGeo.setAttribute('position', new THREE.Float32BufferAttribute(rubberPositions, 3));
          rubberGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rubberUVs, 2));
          rubberGeo.setIndex(indices);
          const rubberMesh = new THREE.Mesh(rubberGeo, new THREE.MeshBasicMaterial({
            color: 0x000000,
            map: getRubberGradientTexture(),
            transparent: true,
            opacity: th.isNight ? 0.22 : 0.30,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
            side: THREE.DoubleSide
          }));
          rubberMesh.renderOrder = 1;
          circuitSceneryGroup.add(rubberMesh);
        }

        const edgeGeo = new THREE.BufferGeometry();
        edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgeLinePositions, 3));
        edgeGeo.setIndex(edgeLineIndices);
        circuitSceneryGroup.add(new THREE.Mesh(edgeGeo, new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide })));

        const kerbGeo = new THREE.BufferGeometry();
        kerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(kerbPositions, 3));
        kerbGeo.setAttribute('color', new THREE.Float32BufferAttribute(kerbColors, 3));
        kerbGeo.setIndex(kerbIndices);
        kerbGeo.computeVertexNormals();
        circuitSceneryGroup.add(new THREE.Mesh(kerbGeo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));

        const ribbonGeo = new THREE.BufferGeometry();
        ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(ribbonPositions, 3));
        ribbonGeo.setAttribute('color', new THREE.Float32BufferAttribute(ribbonColors, 3));
        ribbonGeo.setIndex(ribbonIndices);
        const ribbonMat = new THREE.MeshBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide
        });
        tacticalRibbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
        tacticalRibbonMesh.visible = (typeof simState !== 'undefined' && simState) ? simState.showTacticalLine : true;
        circuitSceneryGroup.add(tacticalRibbonMesh);

        const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 3.2, 6);
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x452719 });
        const pineCrownGeo = new THREE.ConeGeometry(2.8, 7.5, 7);
        const pineCrownMat = new THREE.MeshLambertMaterial({ color: th.treePrimary });
        const secCrownGeo = new THREE.DodecahedronGeometry(3.1, 0);
        const secCrownMat = new THREE.MeshLambertMaterial({ color: th.treeSecondary });

        const lightPoleGeo = new THREE.CylinderGeometry(0.18, 0.25, 11.5, 6);
        const lightPoleMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
        const lightHeadGeo = new THREE.BoxGeometry(2.2, 0.5, 0.8);
        const lightHeadMat = new THREE.MeshBasicMaterial({ color: th.isNight ? 0x38bdf8 : 0xfef08a });

        const tireStackGeo = new THREE.CylinderGeometry(0.95, 0.95, 1.3, 10);
        const tireBlueMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
        const tireWhiteMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });

        sceneryNodes.forEach(({ node: n, idx }) => {
          const halfW = TRACK_WIDTH * 0.5;

          if (Math.abs(n.curvature) > 0.0038) {
            const outSide = -Math.sign(n.curvature || 1);
            const tireDist = halfW + 4.8;
            const tStack = new THREE.Mesh(tireStackGeo, (idx % 12 === 0) ? tireBlueMat : tireWhiteMat);
            tStack.position.set(n.x + n.rightX * outSide * tireDist, n.y + 0.65, n.z + n.rightZ * outSide * tireDist);
            circuitSceneryGroup.add(tStack);
          }

          if (idx % (th.isNight ? 12 : 24) === 0) {
            const side = (idx % 24 === 0) ? -1 : 1;
            const poleDist = halfW + 8.5;
            const px = n.x + n.rightX * side * poleDist;
            const pz = n.z + n.rightZ * side * poleDist;

            const pole = new THREE.Mesh(lightPoleGeo, lightPoleMat);
            pole.position.set(px, n.y + 5.75, pz);
            circuitSceneryGroup.add(pole);

            const head = new THREE.Mesh(lightHeadGeo, lightHeadMat);
            head.position.set(px - n.rightX * side * 0.8, n.y + 11.5, pz - n.rightZ * side * 0.8);
            head.rotation.y = -n.heading;
            circuitSceneryGroup.add(head);
          }

          [-1, 1].forEach(side => {
            if (n.s < 460 || n.s > totalTrackLength - 320) return;

            const treeDist = halfW + 14.5 + ((idx * 7) % 16);
            const tx = n.x + n.rightX * side * treeDist;
            const tz = n.z + n.rightZ * side * treeDist;

            const treeGroup = new THREE.Group();
            treeGroup.position.set(tx, n.y, tz);

            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 1.6;
            treeGroup.add(trunk);

            const isSecondary = (idx % 30 === 0);
            const crown = new THREE.Mesh(
              isSecondary ? secCrownGeo : pineCrownGeo,
              isSecondary ? secCrownMat : pineCrownMat
            );
            crown.position.y = isSecondary ? 4.8 : 5.4;
            const scaleVar = 0.85 + ((idx * 13) % 5) * 0.12;
            crown.scale.set(scaleVar, scaleVar, scaleVar);
            treeGroup.add(crown);

            circuitSceneryGroup.add(treeGroup);
          });
        });

        for (let s = 40; s <= 400; s += 60) {
          const n = sampleTrackAtS(s);
          const standOffset = TRACK_WIDTH * 0.5 + 12.5;
          const standGroup = new THREE.Group();
          standGroup.position.set(n.x - n.rightX * standOffset, n.y, n.z - n.rightZ * standOffset);
          standGroup.rotation.y = -n.heading;

          const baseMesh = new THREE.Mesh(
            new THREE.BoxGeometry(46, 8.5, 10),
            new THREE.MeshLambertMaterial({ color: 0x1e293b })
          );
          baseMesh.position.y = 4.25;
          standGroup.add(baseMesh);

          const seatsMesh = new THREE.Mesh(
            new THREE.BoxGeometry(44, 5.5, 8.2),
            new THREE.MeshLambertMaterial({ color: (s % 120 === 0) ? 0xdc2626 : 0x2563eb })
          );
          seatsMesh.position.set(0, 5.2, 1.4);
          standGroup.add(seatsMesh);

          const roofMesh = new THREE.Mesh(
            new THREE.BoxGeometry(48, 0.8, 13),
            new THREE.MeshLambertMaterial({ color: 0xf8fafc })
          );
          roofMesh.position.set(0, 10.5, 1.5);
          standGroup.add(roofMesh);
          circuitSceneryGroup.add(standGroup);

          const pitGroup = new THREE.Group();
          pitGroup.position.set(n.x + n.rightX * (standOffset - 2), n.y, n.z + n.rightZ * (standOffset - 2));
          pitGroup.rotation.y = -n.heading;

          const pitBldg = new THREE.Mesh(
            new THREE.BoxGeometry(44, 7.2, 9),
            new THREE.MeshLambertMaterial({ color: 0x334155 })
          );
          pitBldg.position.y = 3.6;
          pitGroup.add(pitBldg);

          const glassStrip = new THREE.Mesh(
            new THREE.BoxGeometry(44.2, 2.2, 9.2),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
          );
          glassStrip.position.y = 5.2;
          pitGroup.add(glassStrip);
          circuitSceneryGroup.add(pitGroup);
        }

        const brakePostGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8);
        const brakePostMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.6 });
        const brakeSignGeo = new THREE.PlaneGeometry(2.8, 1.4);

        heavyBrakeApexes.forEach(apexS => {
          [150, 100, 50].forEach((distM, idx) => {
            const boardNode = sampleTrackAtS(apexS - distM);
            const signMat = new THREE.MeshBasicMaterial({ map: brakeSignTextures[idx], side: THREE.DoubleSide });

            [-1, 1].forEach(side => {
              const offset = side * (TRACK_WIDTH * 0.5 + 3.2);
              const signHolder = new THREE.Group();

              const signMesh = new THREE.Mesh(brakeSignGeo, signMat);
              signMesh.position.y = 1.7;
              signHolder.add(signMesh);

              const postMesh = new THREE.Mesh(brakePostGeo, brakePostMat);
              postMesh.position.y = 1.2;
              signHolder.add(postMesh);

              signHolder.position.set(
                boardNode.x + boardNode.rightX * offset,
                boardNode.y,
                boardNode.z + boardNode.rightZ * offset
              );
              signHolder.rotation.y = -boardNode.heading + Math.PI / 2;
              circuitSceneryGroup.add(signHolder);
            });
          });
        });

        const apexBollardGeo = new THREE.CylinderGeometry(0.22, 0.32, 1.45, 12);
        const apexBollardMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        for (let i = 8; i < TRACK_SAMPLES - 8; i += 8) {
          const prev = Math.abs(trackNodes[i - 6].curvature);
          const curr = Math.abs(trackNodes[i].curvature);
          const next = Math.abs(trackNodes[i + 6].curvature);
          if (curr > 0.0042 && curr >= prev && curr >= next) {
            const n = trackNodes[i];
            const insideSide = Math.sign(n.curvature || 1);
            const bollardOffset = insideSide * (TRACK_WIDTH * 0.5 + 0.75);
            const bollard = new THREE.Mesh(apexBollardGeo, apexBollardMat);
            bollard.position.set(
              n.x + n.rightX * bollardOffset,
              n.y + 0.72,
              n.z + n.rightZ * bollardOffset
            );
            circuitSceneryGroup.add(bollard);
          }
        }

        const gateDistances = [
          { s: 0, color: 0xef4444 },
          { s: totalTrackLength * 0.338, color: 0x3b82f6 },
          { s: totalTrackLength * 0.680, color: 0xf59e0b }
        ];
        gateDistances.forEach(g => {
          const n = sampleTrackAtS(g.s);
          const gateGroup = new THREE.Group();
          gateGroup.position.set(n.x, n.y, n.z);
          gateGroup.rotation.y = -n.heading + Math.PI / 2;

          const pillarGeo = new THREE.BoxGeometry(0.8, 8.5, 0.8);
          const pillarMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
          const pL = new THREE.Mesh(pillarGeo, pillarMat);
          pL.position.set(-TRACK_WIDTH * 0.62, 4.25, 0);
          const pR = new THREE.Mesh(pillarGeo, pillarMat);
          pR.position.set(TRACK_WIDTH * 0.62, 4.25, 0);

          const bannerGeo = new THREE.BoxGeometry(TRACK_WIDTH * 1.28, 1.6, 1.1);
          const bannerMat = new THREE.MeshLambertMaterial({ color: g.color });
          const banner = new THREE.Mesh(bannerGeo, bannerMat);
          banner.position.set(0, 7.6, 0);

          gateGroup.add(pL, pR, banner);
          circuitSceneryGroup.add(gateGroup);
        });
      }

      // Skidmarks & Smoke / Nitrous Flame / Exhaust Backfire Particles
      const skidMarksGroup = new THREE.Group();
      scene.add(skidMarksGroup);
      const skidMeshes = [];
      const MAX_SKIDS = 140;
      const skidGeo = new THREE.PlaneGeometry(0.95, 2.4);
      const skidMat = new THREE.MeshBasicMaterial({
        color: 0x090b10,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide
      });

      function spawnSkidMark(x, y, z, heading) {
        let m;
        if (skidMeshes.length >= MAX_SKIDS) {
          m = skidMeshes.shift();
        } else {
          m = new THREE.Mesh(skidGeo, skidMat);
          m.rotation.x = -Math.PI / 2;
          skidMarksGroup.add(m);
        }
        m.position.set(x, y + 0.06, z);
        m.rotation.z = -heading;
        skidMeshes.push(m);
      }

      const smokeGroup = new THREE.Group();
      scene.add(smokeGroup);
      const smokeParticles = [];
      const smokeGeo = new THREE.SphereGeometry(0.45, 8, 8);
      const smokeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.45 });
      const nosFlameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
      const backfireMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.92 });

      function spawnTireSmoke(x, y, z, type = 'smoke') {
        if (smokeParticles.length > 48) return;
        const mat = type === 'nos' ? nosFlameMat : (type === 'backfire' ? backfireMat : smokeMat);
        const mesh = new THREE.Mesh(smokeGeo, mat.clone());
        if (type !== 'smoke') mesh.scale.set(0.65, 0.65, 0.65);
        mesh.position.set(
          x + (Math.random() - 0.5) * (type !== 'smoke' ? 0.4 : 1.2),
          y + (type !== 'smoke' ? 0.42 : 0.25),
          z + (Math.random() - 0.5) * (type !== 'smoke' ? 0.4 : 1.2)
        );
        smokeGroup.add(mesh);
        smokeParticles.push({ mesh, life: type !== 'smoke' ? 0.20 : 0.55, isFlame: type !== 'smoke' });
      }

      function updateSmokeParticles(dt) {
        for (let i = smokeParticles.length - 1; i >= 0; i--) {
          const p = smokeParticles[i];
          p.life -= dt;
          if (p.life <= 0) {
            smokeGroup.remove(p.mesh);
            smokeParticles.splice(i, 1);
          } else {
            if (!p.isFlame) {
              p.mesh.position.y += 1.4 * dt;
              p.mesh.scale.addScalar(2.2 * dt);
            }
            p.mesh.material.opacity = p.life * (p.isFlame ? 3.5 : 0.7);
          }
        }
      }

      // --------------------------------------------------------------------------
      // 4B. HI-FI VEHICLE ASSET PIPELINE
      //     GLB/GLTF loading (Draco) -> auto-orient & scale to GT3 dims -> wheel rig
      //     (steer + roll pivots) -> PBR clear-coat paint -> instanced per car slot.
      //     Every car is a "slot": an outer Group whose transform is driven by the sim,
      //     holding a procedural fallback body and (optionally) a hi-fi GLB clone.
      // --------------------------------------------------------------------------
      const CAR_TARGET_DIMS = { length: 4.60, width: 2.02, height: 1.22 };
      const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.4.1/';
      const CAR_MODEL_PRESETS = [
        {
          id: 'procedural',
          label: '內建程序化 GT3 原型車',
          desc: '零下載・離線可用・最高效能',
          urls: null
        },
        {
          id: 'ferrari458',
          label: 'Ferrari 458 Italia',
          desc: 'three.js 官方範例 GLB・Draco 壓縮約 2MB・需網路',
          urls: [
            'https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/models/gltf/ferrari.glb',
            'https://threejs.org/examples/models/gltf/ferrari.glb'
          ]
        }
      ];

      const carAssetState = {
        presetId: 'procedural',
        label: '內建程序化 GT3',
        rawScene: null,        // untouched gltf.scene (re-used when re-orienting)
        template: null,        // normalized + rigged template, cloned per slot
        yawSteps: 0,           // extra 90° rotation steps (manual fix for odd exports)
        flip: false,           // extra 180° (front/back swap)
        livery: 'team',        // 'team' = per-car clear-coat colour, 'original' = keep model textures
        scope: { player: true, ai: true, ghost: true },
        loading: false,
        stats: null,
        blobURLs: []
      };
      try {
        const savedCar = JSON.parse(localStorage.getItem('apexpro.vehicle') || 'null');
        if (savedCar && savedCar.v === 2) {
          ['presetId', 'yawSteps', 'flip', 'livery'].forEach(k => { if (k in savedCar) carAssetState[k] = savedCar[k]; });
          if (savedCar.scope) Object.assign(carAssetState.scope, savedCar.scope);
        }
      } catch (e) { /* ignore */ }
      function saveCarAssetSettings() {
        try {
          localStorage.setItem('apexpro.vehicle', JSON.stringify({
            v: 2,
            presetId: carAssetState.presetId,
            yawSteps: carAssetState.yawSteps,
            flip: carAssetState.flip,
            livery: carAssetState.livery,
            scope: carAssetState.scope
          }));
        } catch (e) { }
      }

      // --------------------------------------------------------------------------
      // 4B. MULTI-CAR CHASSIS & VEHICLE DYNAMICS HANDLING PROFILES
      //     Calibrated to actual GT3 telemetry, wheelbase, steering lock & tire grip
      // --------------------------------------------------------------------------

      const vehicleSlots = [];

      function makeWheelPivot(key, center, radius) {
        const steer = new THREE.Group();
        steer.name = 'apex_steer_' + key;
        steer.position.copy(center);
        steer.userData.apexWheel = { key, front: key[0] === 'F', radius: Math.max(0.15, radius) };
        const spin = new THREE.Group();
        spin.name = 'apex_spin_' + key;
        spin.userData.apexSpin = true;
        steer.add(spin);
        return { steer, spin };
      }

      function collectWheelRig(root) {
        const rig = { steers: [], spins: [], radius: 0.34 };
        root.traverse(o => {
          if (o.userData && o.userData.apexWheel) {
            rig.steers.push(o);
            rig.radius = o.userData.apexWheel.radius;
          }
          if (o.userData && o.userData.apexSpin) rig.spins.push(o);
        });
        return rig.steers.length ? rig : null;
      }

      // ---- Procedural fallback body (sculpted aero GT3 body, real wheels, splitter, swan-neck wing) ----
      function buildProceduralBody(bodyColor, isGhost, opacity) {
        const body = new THREE.Group();
        body.name = 'apex_procedural_body';
        const ghostProps = { transparent: true, opacity, depthWrite: false };

        const paintCol = new THREE.Color(bodyColor);
        if (!isGhost) paintCol.multiplyScalar(0.84);
        const bodyMat = isGhost
          ? new THREE.MeshLambertMaterial(Object.assign({ color: bodyColor }, ghostProps))
          : new THREE.MeshPhysicalMaterial({ color: paintCol, metalness: 0.18, roughness: 0.28, clearcoat: 0.85, clearcoatRoughness: 0.08, envMapIntensity: 0.55 });
        const darkMat = isGhost
          ? new THREE.MeshLambertMaterial(Object.assign({ color: 0x0f172a }, ghostProps, { opacity: opacity * 0.7 }))
          : new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.15, roughness: 0.65, envMapIntensity: 0.4 });
        const glassMat = isGhost
          ? darkMat
          : new THREE.MeshPhysicalMaterial({ color: 0x090d16, metalness: 0.1, roughness: 0.06, clearcoat: 0.9, transparent: true, opacity: 0.76, envMapIntensity: 0.75 });

        // Lower carbon floor & side skirts
        const floorPan = new THREE.Mesh(new THREE.BoxGeometry(4.42, 0.14, 1.98), darkMat);
        floorPan.position.set(0.0, 0.21, 0);
        body.add(floorPan);

        // Main waist body
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.15, 0.44, 1.94), bodyMat);
        chassis.position.set(-0.08, 0.48, 0);
        body.add(chassis);

        // Sloped aero front nose
        const nose = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.34, 1.86), bodyMat);
        nose.position.set(1.72, 0.41, 0);
        nose.rotation.z = -0.14;
        body.add(nose);

        // Flared front & rear GT3 fender arches
        [[1.36, 0.54, 1.05], [-1.36, 0.57, 1.12]].forEach(([fx, fy, flen]) => {
          [-0.86, 0.86].forEach(fz => {
            const fender = new THREE.Mesh(new THREE.BoxGeometry(flen, 0.36, 0.32), bodyMat);
            fender.position.set(fx, fy, fz);
            body.add(fender);
          });
        });

        // Tapered GT3 greenhouse canopy + sloped windshield
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.44, 1.44), glassMat);
        cabin.position.set(-0.18, 0.88, 0);
        body.add(cabin);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 1.28), bodyMat);
        roof.position.set(-0.24, 1.11, 0);
        body.add(roof);
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.40, 1.38), glassMat);
        windshield.position.set(0.54, 0.84, 0);
        windshield.rotation.z = -0.45;
        body.add(windshield);

        // Front carbon splitter + rear diffuser
        const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 2.04), darkMat);
        splitter.position.set(2.18, 0.16, 0);
        body.add(splitter);
        const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 1.88), darkMat);
        diffuser.position.set(-2.12, 0.25, 0);
        body.add(diffuser);

        // Swan-neck GT3 rear wing + endplates
        const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 1.94), darkMat);
        wingBlade.position.set(-2.06, 1.24, 0);
        wingBlade.rotation.z = 0.09;
        body.add(wingBlade);
        for (const z of [-0.52, 0.52]) {
          const stand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.04), darkMat);
          stand.position.set(-1.98, 1.00, z);
          stand.rotation.z = -0.18;
          body.add(stand);
        }
        for (const z of [-0.97, 0.97]) {
          const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.28, 0.03), bodyMat);
          endplate.position.set(-2.06, 1.20, z);
          body.add(endplate);
        }

        // Front LED headlights
        if (!isGhost) {
          const hlMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
          for (const z of [-0.68, 0.68]) {
            const hl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 0.34), hlMat);
            hl.position.set(2.14, 0.48, z);
            hl.rotation.z = -0.14;
            body.add(hl);
          }
        }

        // Four real wheels inside steer/spin pivots (same rig format as GLB models)
        const R = 0.34;
        const tireMat = isGhost ? darkMat : new THREE.MeshStandardMaterial({ color: 0x0d1017, roughness: 0.85, metalness: 0.05, envMapIntensity: 0.3 });
        const rimMat = isGhost ? darkMat : new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.28, metalness: 0.82, envMapIntensity: 0.6 });
        const tireGeo = new THREE.CylinderGeometry(R, R, 0.30, 24);
        tireGeo.rotateX(Math.PI / 2);                     // axle along Z (lateral)
        const hubGeo = new THREE.CylinderGeometry(R * 0.68, R * 0.68, 0.31, 16);
        hubGeo.rotateX(Math.PI / 2);
        const spokeGeo = new THREE.BoxGeometry(0.46, 0.05, 0.025);
        [['FL', 1.38, -0.86], ['FR', 1.38, 0.86], ['RL', -1.36, -0.86], ['RR', -1.36, 0.86]].forEach(([key, x, z]) => {
          const { steer, spin } = makeWheelPivot(key, new THREE.Vector3(x, R, z), R);
          spin.add(new THREE.Mesh(tireGeo, tireMat));
          spin.add(new THREE.Mesh(hubGeo, darkMat));
          const outward = z > 0 ? 0.155 : -0.155;
          for (let s = 0; s < 5; s++) {
            const spoke = new THREE.Mesh(spokeGeo, rimMat);
            spoke.position.z = outward;
            spoke.rotation.z = (s / 5) * Math.PI;
            spin.add(spoke);
          }
          body.add(steer);
        });
        return body;
      }

      function createGT3CarMesh(bodyColor, isGhost = false, opacity = 1.0, kind = null) {
        const group = new THREE.Group();
        const procedural = buildProceduralBody(bodyColor, isGhost, opacity);
        group.add(procedural);

        // Soft ground contact shadow under every non-ghost car (prevents "floating sticker" look)
        let contactShadow = null;
        if (!isGhost) {
          const shadowGeo = new THREE.PlaneGeometry(5.15, 2.38);
          const shadowMat = new THREE.MeshBasicMaterial({
            map: getCarContactShadowTexture(),
            transparent: true,
            opacity: 0.82,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
          });
          contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
          contactShadow.rotation.x = -Math.PI / 2;
          contactShadow.position.set(-0.02, 0.02, 0);
          contactShadow.renderOrder = 2;
          group.add(contactShadow);
        }
        group.userData.contactShadow = contactShadow;

        // Sleek dual GT3 LED tail-light blades (used for procedural car, or tucked flush if GLB has no taillight mat)
        const brakeMat = new THREE.MeshBasicMaterial({
          color: 0xff1111,
          transparent: isGhost,
          opacity: isGhost ? opacity : 1
        });
        const tailLight = new THREE.Group();
        const tlBladeGeo = new THREE.BoxGeometry(0.05, 0.075, 0.56);
        const tlLeft = new THREE.Mesh(tlBladeGeo, brakeMat);
        tlLeft.position.z = -0.56;
        const tlRight = new THREE.Mesh(tlBladeGeo, brakeMat);
        tlRight.position.z = 0.56;
        tailLight.add(tlLeft, tlRight);
        tailLight.position.set(-2.16, 0.58, 0);
        tailLight.material = brakeMat;
        tailLight.userData.material = brakeMat;
        group.add(tailLight);
        group.userData.tailLight = tailLight;

        const slot = {
          group,
          kind: kind || (isGhost ? 'ghost' : 'ai'),
          color: bodyColor,
          isGhost,
          opacity,
          procedural,
          proceduralRig: collectWheelRig(procedural),
          hifi: null,
          rig: null,
          spinAngle: 0,
          steerAngle: 0,
          lastPos: null,
          lastYaw: 0
        };
        slot.rig = slot.proceduralRig;
        group.userData.vehicleSlot = slot;
        vehicleSlots.push(slot);
        if (carAssetState.template) applyHiFiTemplateToSlot(slot);
        return group;
      }

      // ---- GLB normalisation: strip floor planes, orient (-Z -> +X forward), GT3 scale, ground contact ----
      function normalizeVehicleScene(srcScene) {
        const root = new THREE.Group();
        root.name = 'apex_hifi_root';
        const orient = new THREE.Group();
        orient.add(srcScene);
        root.add(orient);

        // Strip studio floor / shadow / backdrop planes commonly bundled inside GLB car files
        srcScene.updateMatrixWorld(true);
        const fullBox = new THREE.Box3().setFromObject(srcScene);
        const fullSize = fullBox.getSize(new THREE.Vector3());
        srcScene.traverse(o => {
          if (!o.isMesh) return;
          const nm = ((o.name || '') + ' ' + (o.parent ? o.parent.name || '' : '')).toLowerCase();
          const mName = (Array.isArray(o.material) ? o.material.map(m => m && m.name).join(' ') : (o.material && o.material.name) || '').toLowerCase();
          if (/shadow|floor|ground|backdrop|stage|studio|podium|base_plate|ao_plane|road|plane0/i.test(nm + ' ' + mName)) {
            o.visible = false;
            return;
          }
          const b = new THREE.Box3().setFromObject(o);
          const sz = b.getSize(new THREE.Vector3());
          if (sz.y < fullSize.y * 0.03 && (sz.x > fullSize.x * 1.15 || sz.z > fullSize.z * 1.15)) {
            o.visible = false;
          }
        });

        root.updateMatrixWorld(true);
        let box = new THREE.Box3();
        srcScene.traverse(o => { if (o.isMesh && o.visible) box.expandByObject(o); });
        if (box.isEmpty()) box = new THREE.Box3().setFromObject(srcScene);
        if (box.isEmpty()) throw new Error('模型沒有任何可見幾何 (empty bounding box)');
        const rawSize = box.getSize(new THREE.Vector3());

        // Standard glTF cars (including Three.js ferrari.glb & Blender exports) face -Z.
        // Rotating -Z by -PI/2 around Y maps (0,0,-1) -> (+1,0,0) (+X forward in this sim).
        const longIsZ = rawSize.z > rawSize.x;
        orient.rotation.y = (longIsZ ? -Math.PI / 2 : 0) +
          (carAssetState.flip ? Math.PI : 0) +
          carAssetState.yawSteps * (Math.PI / 2);
        root.updateMatrixWorld(true);
        box = new THREE.Box3();
        orient.traverse(o => { if (o.isMesh && o.visible) box.expandByObject(o); });
        let size = box.getSize(new THREE.Vector3());

        const s = CAR_TARGET_DIMS.length / Math.max(0.001, size.x);
        orient.scale.setScalar(s);
        root.updateMatrixWorld(true);
        box = new THREE.Box3();
        orient.traverse(o => { if (o.isMesh && o.visible) box.expandByObject(o); });
        const center = box.getCenter(new THREE.Vector3());
        orient.position.set(-center.x, -box.min.y, -center.z);
        root.updateMatrixWorld(true);
        box = new THREE.Box3();
        root.traverse(o => { if (o.isMesh && o.visible) box.expandByObject(o); });
        size = box.getSize(new THREE.Vector3());
        return { root, rawSize, size, scale: s };
      }

      // ---- Wheel auto-detection & rigging (re-parent into steer/spin pivots) ----
      function rigHiFiWheels(root) {
        root.updateMatrixWorld(true);
        const all = [];
        root.traverse(o => { if (o !== root && o.visible !== false) all.push(o); });
        const byName = re => all.filter(o => re.test(o.name || '') && !/steer|steering|lug|bolt|nut|well|arch|fender|house/i.test(o.name || ''));
        let cands = byName(/wheel|whl/i);
        if (cands.length < 4) cands = cands.concat(byName(/tire|tyre/i));
        if (cands.length < 4) cands = cands.concat(byName(/rim/i));

        // keep top-most nodes only (avoid rigging a rim AND its parent wheel)
        const set = new Set(cands);
        cands = cands.filter(o => {
          for (let p = o.parent; p; p = p.parent) if (set.has(p)) return false;
          return true;
        });

        const infos = cands.map(o => {
          const b = new THREE.Box3().setFromObject(o);
          return { o, b, c: b.getCenter(new THREE.Vector3()), size: b.getSize(new THREE.Vector3()) };
        }).filter(i => !i.b.isEmpty() && i.size.y > 0.2 && i.size.y < 1.2 && i.c.y < CAR_TARGET_DIMS.height * 0.7);

        const quads = { FL: [], FR: [], RL: [], RR: [] };
        infos.forEach(i => {
          const key = (i.c.x >= 0 ? 'F' : 'R') + (i.c.z >= 0 ? 'R' : 'L');
          quads[key].push(i);
        });

        let rigged = 0;
        Object.keys(quads).forEach(key => {
          const list = quads[key];
          if (!list.length) return;
          const ub = new THREE.Box3();
          list.forEach(i => ub.union(i.b));
          const c = ub.getCenter(new THREE.Vector3());
          const sz = ub.getSize(new THREE.Vector3());
          const { steer, spin } = makeWheelPivot(key, c, Math.max(sz.y, sz.x) * 0.5);
          root.add(steer);
          steer.updateMatrixWorld(true);
          list.forEach(i => spin.attach(i.o));   // preserves world transform
          rigged++;
        });
        return { rigged, names: infos.map(i => i.o.name) };
      }

      // ---- Material classification (strictly by material name so child meshes of 'body' don't get painted over!) ----
      function classifyHiFiMaterials(root) {
        const entries = [];
        root.traverse(o => {
          if (!o.isMesh || !o.visible) return;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          o.geometry.computeBoundingBox();
          const bs = o.geometry.boundingBox.getSize(new THREE.Vector3());
          const area = (bs.x * bs.y + bs.y * bs.z + bs.x * bs.z) * o.matrixWorld.getMaxScaleOnAxis() ** 2;
          mats.forEach(m => { if (m) entries.push({ mesh: o, mat: m, area }); });
        });

        const areaByMat = new Map();
        const meshNamesByMat = new Map();
        entries.forEach(e => {
          areaByMat.set(e.mat, (areaByMat.get(e.mat) || 0) + e.area);
          const prev = meshNamesByMat.get(e.mat) || '';
          meshNamesByMat.set(e.mat, prev + ' ' + (e.mesh.name || ''));
        });

        areaByMat.forEach((area, mat) => {
          const mName = (mat.name || '').toLowerCase().trim();
          const meshStr = (meshNamesByMat.get(mat) || '').toLowerCase();
          let role = 'other';

          if (/glass|window|windshield|windscreen|visor/.test(mName) || (mat.transparent && mat.opacity < 0.75 && !/light|lamp|red/.test(mName))) {
            role = 'glass';
          } else if (/tail|brake.?light|rear.?light|stop.?lamp|lights?_red|red_glass|red_light|lamp_r/.test(mName + ' ' + meshStr)) {
            role = 'taillight';
          } else if (/head.?light|front.?light|lamp_f|led_front/.test(mName + ' ' + meshStr)) {
            role = 'light';
          } else if (/tire|tyre|rubber|tread/.test(mName)) {
            role = 'tire';
          } else if (/rim|wheel|Alloy|caliper|disc|rotor/.test(mName)) {
            role = 'rim';
          } else if (/detail|trim|interior|leather|seat|dash|carbon|plastic|chrome|metal|steel|iron|exhaust|grill|grille|mesh|badge|logo|emblem|yellow|black|dark|shadow|int_|underbody|chassis|carpet|mirror/.test(mName)) {
            role = 'trim';
          } else if (/^(body|paint|car_?paint|carpaint|livery|shell|carroserie|lack|ext_paint|body_paint|main_paint|car_body_mat)$/i.test(mName) || /car_?paint|body_?paint|ext_?paint|livery_?paint/.test(mName)) {
            role = 'body';
          }
          mat.userData.apexRole = role;
        });

        // Fallback: if no material explicitly matched 'body', pick the SINGLE largest non-excluded exterior material
        let hasBody = false;
        areaByMat.forEach((a, m) => { if (m.userData.apexRole === 'body') hasBody = true; });
        if (!hasBody) {
          let best = null, bestArea = 0;
          areaByMat.forEach((a, m) => {
            if (m.userData.apexRole !== 'other') return;
            const lum = m.color ? (m.color.r + m.color.g + m.color.b) / 3 : 0.5;
            if (lum < 0.05 && !m.map) return;
            if (a > bestArea) { bestArea = a; best = m; }
          });
          if (best) { best.userData.apexRole = 'body'; hasBody = true; }
        }

        const roleCounts = {};
        areaByMat.forEach((a, m) => { roleCounts[m.userData.apexRole] = (roleCounts[m.userData.apexRole] || 0) + 1; });
        return { materialCount: areaByMat.size, roleCounts, hasBody };
      }

      function convertMaterialForSlot(src, slot, cache) {
        if (cache.has(src)) return cache.get(src);
        let out;
        const role = src.userData.apexRole || 'other';
        if (slot.isGhost) {
          out = new THREE.MeshLambertMaterial({
            color: role === 'glass' ? 0x0f172a : slot.color,
            transparent: true,
            opacity: slot.opacity * (role === 'glass' ? 0.5 : 1),
            depthWrite: false
          });
        } else if (role === 'body') {
          const keepOriginal = carAssetState.livery === 'original';
          const baseCol = keepOriginal
            ? (src.color ? src.color.clone() : new THREE.Color(0xdc2626))
            : new THREE.Color(slot.color);
          // Scale diffuse albedo so under bright hemisphere + sun lighting it doesn't blow out
          baseCol.multiplyScalar(0.80);
          out = new THREE.MeshPhysicalMaterial({
            color: baseCol,
            map: keepOriginal ? (src.map || null) : null,
            normalMap: src.normalMap || null,
            metalness: 0.18,
            roughness: 0.28,
            clearcoat: 0.85,
            clearcoatRoughness: 0.09,
            envMapIntensity: 0.55
          });
        } else if (role === 'glass') {
          out = new THREE.MeshPhysicalMaterial({
            color: 0x090d16,
            metalness: 0.10,
            roughness: 0.06,
            clearcoat: 0.90,
            transparent: true,
            opacity: 0.68,
            depthWrite: false,
            side: THREE.DoubleSide,
            envMapIntensity: 0.75
          });
        } else if (role === 'taillight') {
          out = src.clone();
          if (!out.emissive) out = new THREE.MeshStandardMaterial({ color: 0x550000 });
          out.emissive = new THREE.Color(0xff1a1a);
          out.emissiveIntensity = 0.35;
          out.userData.apexTailLight = true;
        } else {
          out = src.clone();
          if (out.color && !out.map) {
            const lum = (out.color.r + out.color.g + out.color.b) / 3;
            if (lum < 0.025) out.color.setRGB(0.05, 0.055, 0.065); // prevent pitch-black silhouette voids
            else out.color.multiplyScalar(0.84);
          }
          if (role === 'tire' && 'roughness' in out) {
            out.roughness = Math.max(0.78, out.roughness || 0.85);
            out.metalness = Math.min(0.1, out.metalness || 0.0);
          }
          if ('envMapIntensity' in out) out.envMapIntensity = 0.45;
        }
        out.userData.apexRole = role;
        cache.set(src, out);
        return out;
      }

      function disposeSlotHiFi(slot) {
        if (!slot.hifi) return;
        slot.group.remove(slot.hifi);
        // geometry/textures are shared with the template; dispose only per-slot materials
        slot.hifi.traverse(o => {
          if (!o.isMesh) return;
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m && m.dispose());
        });
        slot.hifi = null;
      }

      function applyHiFiTemplateToSlot(slot) {
        disposeSlotHiFi(slot);
        const enabled = !!carAssetState.template && carAssetState.scope[slot.kind] !== false;
        slot.procedural.visible = !enabled;
        slot.rig = enabled ? null : slot.proceduralRig;
        slot.group.userData.hifiTailMats = null;
        const tl = slot.group.userData.tailLight;
        const cs = slot.group.userData.contactShadow;
        if (!enabled) {
          tl.visible = true;
          tl.position.set(-2.16, 0.58, 0);
          tl.scale.set(1, 1, 1);
          if (cs) cs.scale.set(1, 1, 1);
          return;
        }

        const inst = carAssetState.template.clone(true);
        const cache = new Map();
        const tailMats = [];
        inst.traverse(o => {
          if (!o.isMesh) return;
          o.frustumCulled = true;
          o.material = Array.isArray(o.material)
            ? o.material.map(m => convertMaterialForSlot(m, slot, cache))
            : convertMaterialForSlot(o.material, slot, cache);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
            if (m.userData.apexTailLight && !tailMats.includes(m)) tailMats.push(m);
          });
        });
        slot.group.add(inst);
        slot.hifi = inst;
        slot.rig = collectWheelRig(inst);
        slot.group.userData.hifiTailMats = tailMats.length ? tailMats : null;

        const dims = carAssetState.stats ? carAssetState.stats.dims : CAR_TARGET_DIMS;
        if (cs) {
          cs.scale.set(dims.length / 4.60, dims.width / 2.02, 1);
        }
        // Hide the procedural tail-light bar when a GLB model is loaded (only flash tucked LEDs on braking if GLB has no taillight mat)
        tl.position.set(-dims.length * 0.482, dims.height * 0.52, 0);
        tl.scale.set(0.45, 0.65, (dims.width * 0.72) / 1.65);
        tl.visible = false;
      }

      function rebuildAllVehicleSlots() {
        vehicleSlots.forEach(applyHiFiTemplateToSlot);
      }

      function buildHiFiTemplate() {
        if (!carAssetState.rawScene) { carAssetState.template = null; return; }
        const src = carAssetState.rawScene.clone(true);
        src.traverse(o => {
          if (o.isMesh) {
            (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m) m.userData.apexRole = null; });
          }
        });
        const norm = normalizeVehicleScene(src);
        const matInfo = classifyHiFiMaterials(norm.root);
        const wheelInfo = rigHiFiWheels(norm.root);

        let tris = 0, meshes = 0;
        norm.root.traverse(o => {
          if (!o.isMesh) return;
          meshes++;
          const g = o.geometry;
          tris += g.index ? g.index.count / 3 : (g.attributes.position ? g.attributes.position.count / 3 : 0);
        });
        carAssetState.template = norm.root;
        carAssetState.stats = {
          dims: { length: norm.size.x, width: norm.size.z, height: norm.size.y },
          rawSize: norm.rawSize,
          scale: norm.scale,
          tris: Math.round(tris),
          meshes,
          materials: matInfo.materialCount,
          roles: matInfo.roleCounts,
          hasBody: matInfo.hasBody,
          wheels: wheelInfo.rigged,
          wheelNames: wheelInfo.names
        };
      }

      function disposeObjectDeep(obj) {
        if (!obj) return;
        obj.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
              if (!m) return;
              ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach(k => m[k] && m[k].dispose());
              m.dispose();
            });
          }
        });
      }

      // ---- Loaders ----
      let dracoLoaderInstance = null;
      function createGLTFLoader(manager) {
        if (typeof THREE.GLTFLoader !== 'function') {
          throw new Error('GLTFLoader 未載入（請確認可連線至 cdn.jsdelivr.net）');
        }
        const loader = new THREE.GLTFLoader(manager);
        if (typeof THREE.DRACOLoader === 'function') {
          if (!dracoLoaderInstance) {
            dracoLoaderInstance = new THREE.DRACOLoader();
            dracoLoaderInstance.setDecoderPath(DRACO_DECODER_PATH);
          }
          loader.setDRACOLoader(dracoLoaderInstance);
        }
        return loader;
      }

      function onVehicleGLTFReady(gltf, label, presetId) {
        const srcScene = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        if (!srcScene) throw new Error('GLTF 檔案中沒有 scene');
        const prevRaw = carAssetState.rawScene;
        carAssetState.rawScene = srcScene;
        try {
          buildHiFiTemplate();
        } catch (err) {
          carAssetState.rawScene = prevRaw;
          buildHiFiTemplate();
          throw err;
        }
        if (prevRaw && prevRaw !== srcScene) disposeObjectDeep(prevRaw);
        carAssetState.presetId = presetId;
        carAssetState.label = label;
        rebuildAllVehicleSlots();
        saveCarAssetSettings();
        // If user actively picked a 3D model in the garage while in Cockpit view, switch to Chase view so they see it
        const garageModal = document.getElementById('modal-garage');
        if (garageModal && !garageModal.classList.contains('hidden') && simState && simState.cameraMode === 0) {
          simState.cameraMode = 2;
          const camLbl = document.getElementById('lbl-camera');
          if (camLbl) camLbl.textContent = '追尾視角';
        }
        garageUI.refresh();
        garageUI.setStatus(`✔ 已載入「${label}」・${carAssetState.stats.tris.toLocaleString()} 面・車輪綁定 ${carAssetState.stats.wheels}/4（已切換追尾視角）`, 'ok');
        garageUI.setProgress(100);
      }

      function useProceduralVehicle() {
        if (carAssetState.rawScene) disposeObjectDeep(carAssetState.rawScene);
        carAssetState.rawScene = null;
        carAssetState.template = null;
        carAssetState.stats = null;
        carAssetState.presetId = 'procedural';
        carAssetState.label = '內建程序化 GT3';
        rebuildAllVehicleSlots();
        saveCarAssetSettings();
        garageUI.refresh();
        garageUI.setStatus('✔ 已切換為內建程序化 GT3 車體', 'ok');
        garageUI.setProgress(0);
      }

      function loadVehicleFromURLs(urls, label, presetId) {
        if (carAssetState.loading) return;
        let loader;
        try { loader = createGLTFLoader(); } catch (e) { garageUI.setStatus('✖ ' + e.message, 'err'); return; }
        carAssetState.loading = true;
        garageUI.setProgress(2);
        let attempt = 0;
        const tryNext = (lastErr) => {
          if (attempt >= urls.length) {
            carAssetState.loading = false;
            garageUI.setProgress(0);
            garageUI.setStatus(`✖ 載入失敗，已保留目前車輛（${lastErr && lastErr.message ? lastErr.message : '網路或 CORS 錯誤'}）`, 'err');
            return;
          }
          const url = urls[attempt++];
          garageUI.setStatus(`下載中… ${url.replace(/^https?:\/\//, '').slice(0, 60)}`);
          loader.load(url, (gltf) => {
            try {
              onVehicleGLTFReady(gltf, label, presetId);
              carAssetState.loading = false;
            } catch (err) {
              console.error(err);
              tryNext(err);
            }
          }, (xhr) => {
            if (xhr && xhr.total) garageUI.setProgress(Math.min(95, (xhr.loaded / xhr.total) * 95));
          }, (err) => {
            console.warn('[APEX GLB] load failed:', url, err);
            tryNext(err);
          });
        };
        tryNext(null);
      }

      // Multi-file support: .glb, or .gltf + .bin + textures via blob URL remapping
      function loadVehicleFromFiles(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length || carAssetState.loading) return;
        const main = files.find(f => /\.glb$/i.test(f.name)) || files.find(f => /\.gltf$/i.test(f.name));
        if (!main) { garageUI.setStatus('✖ 請選擇 .glb 或 .gltf 檔案', 'err'); return; }

        carAssetState.blobURLs.forEach(u => URL.revokeObjectURL(u));
        carAssetState.blobURLs = [];
        const blobMap = {};
        files.forEach(f => {
          const u = URL.createObjectURL(f);
          carAssetState.blobURLs.push(u);
          blobMap[f.name] = u;
          blobMap[f.name.toLowerCase()] = u;
        });
        const manager = new THREE.LoadingManager();
        manager.setURLModifier((url) => {
          if (url.startsWith('blob:') && carAssetState.blobURLs.includes(url)) return url;
          const name = decodeURIComponent(url.split(/[\\/]/).pop().split('?')[0]);
          return blobMap[name] || blobMap[name.toLowerCase()] || url;
        });

        let loader;
        try { loader = createGLTFLoader(manager); } catch (e) { garageUI.setStatus('✖ ' + e.message, 'err'); return; }
        carAssetState.loading = true;
        garageUI.setStatus(`解析本機模型 ${main.name} (${(main.size / 1048576).toFixed(1)} MB)…`);
        garageUI.setProgress(30);
        const label = main.name.replace(/\.(glb|gltf)$/i, '');
        loader.load(blobMap[main.name], (gltf) => {
          try {
            onVehicleGLTFReady(gltf, label, 'custom-file');
          } catch (err) {
            console.error(err);
            garageUI.setStatus('✖ 模型處理失敗：' + err.message, 'err');
            garageUI.setProgress(0);
          }
          carAssetState.loading = false;
        }, undefined, (err) => {
          console.error(err);
          carAssetState.loading = false;
          garageUI.setProgress(0);
          garageUI.setStatus('✖ 無法解析檔案（.gltf 是否缺少 .bin / 貼圖？）', 'err');
        });
      }

      // ---- Per-frame wheel animation (roll from travelled distance, steer from input/yaw rate) ----
      let lastRigTimeSec = null;
      const _rigTmpPos = new THREE.Vector3();
      function updateVehicleRigs(nowSec) {
        const dt = lastRigTimeSec === null ? 0 : Math.min(0.1, nowSec - lastRigTimeSec);
        lastRigTimeSec = nowSec;
        vehicleSlots.forEach(slot => {
          const g = slot.group;
          _rigTmpPos.copy(g.position);
          if (!slot.lastPos) { slot.lastPos = _rigTmpPos.clone(); slot.lastYaw = g.rotation.y; return; }
          let dist = _rigTmpPos.distanceTo(slot.lastPos);
          if (dist > 25) dist = 0; // teleport / reset
          let dYaw = g.rotation.y - slot.lastYaw;
          while (dYaw > Math.PI) dYaw -= Math.PI * 2;
          while (dYaw < -Math.PI) dYaw += Math.PI * 2;
          slot.lastPos.copy(_rigTmpPos);
          slot.lastYaw = g.rotation.y;

          const rig = slot.rig;
          if (!rig || !g.visible || dt <= 0) return;
          const radius = rig.radius || 0.34;
          slot.spinAngle = (slot.spinAngle - dist / radius) % (Math.PI * 2);

          let targetSteer;
          if (slot.kind === 'player') {
            targetSteer = -simState.steerInput * 0.42;     // + steerInput = right = -Y rotation
          } else {
            const curvature = dist > 0.01 ? dYaw / dist : 0;
            targetSteer = Math.max(-0.42, Math.min(0.42, Math.atan(2.7 * curvature) * 1.0));
          }
          slot.steerAngle += (targetSteer - slot.steerAngle) * Math.min(1, dt * 12);

          for (let i = 0; i < rig.spins.length; i++) rig.spins[i].rotation.z = slot.spinAngle;
          for (let i = 0; i < rig.steers.length; i++) {
            const st = rig.steers[i];
            st.rotation.y = st.userData.apexWheel.front ? slot.steerAngle : 0;
          }
        });
      }

      function setSlotBrakeLight(group, isBraking, onHex, offHex) {
        const tl = group.userData.tailLight;
        const mats = group.userData.hifiTailMats;
        const slot = group.userData.vehicleSlot;
        const hasHiFi = !!(slot && slot.hifi);
        if (tl && tl.material) {
          tl.material.color.setHex(isBraking ? onHex : offHex);
          // For GLB models: hide the auxiliary LED blades unless braking AND the GLB had no native taillight material
          tl.visible = !hasHiFi || (!mats && isBraking);
        }
        if (mats) mats.forEach(m => { m.emissiveIntensity = isBraking ? 2.2 : 0.30; });
      }

      // ---- Garage UI controller ----
      const garageUI = {
        setStatus(msg, type) {
          const col = type === 'err' ? '#f87171' : (type === 'ok' ? '#34d399' : '#94a3b8');
          const el = document.getElementById('garage-status');
          if (el) {
            el.textContent = msg;
            el.style.color = col;
          }
          const garStatusEl = document.getElementById('lbl-gar-status');
          if (garStatusEl) {
            garStatusEl.textContent = msg;
            garStatusEl.style.color = col;
          }
        },
        setProgress(p) {
          const el = document.getElementById('garage-progress');
          if (el) el.style.width = `${Math.max(0, Math.min(100, p))}%`;
        },
        refresh() {
          if (typeof window.__apexFlowOnGarageRefresh === 'function') {
            window.__apexFlowOnGarageRefresh();
          }
          const cur = document.getElementById('garage-current');
          if (cur) cur.textContent = carAssetState.label;
          const list = document.getElementById('garage-preset-list');
          if (list) {
            list.innerHTML = CAR_MODEL_PRESETS.map(p => {
              const active = p.id === carAssetState.presetId;
              return `<div data-preset="${p.id}" class="cursor-pointer rounded-xl p-3 border-2 ${active ? 'border-cyan-400' : 'border-slate-800'} bg-slate-950 transition">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white">${p.label}</span>
              <span class="font-mono-tech text-[10px] ${active ? 'text-cyan-300' : 'text-slate-500'}">${active ? '使用中' : '選擇'}</span>
            </div>
            <div class="text-[11px] text-slate-500 mt-0.5">${p.desc}</div>
          </div>`;
            }).join('') + (carAssetState.presetId === 'custom-file' || carAssetState.presetId === 'custom-url'
              ? `<div class="rounded-xl p-3 border-2 border-cyan-400 bg-slate-950"><span class="font-bold text-white">自訂：${carAssetState.label}</span></div>` : '');
          }
          const liv = document.getElementById('btn-garage-livery');
          if (liv) liv.textContent = carAssetState.livery === 'team' ? '車隊配色 (金屬清漆)' : '原廠貼圖 (保留模型材質)';
          const flip = document.getElementById('btn-garage-flip');
          if (flip) flip.classList.toggle('text-amber-300', carAssetState.flip);
          ['player', 'ai', 'ghost'].forEach(k => {
            const c = document.getElementById(`chk-scope-${k}`);
            if (c) c.checked = carAssetState.scope[k] !== false;
          });
          const asp = document.getElementById('btn-garage-asphalt');
          if (asp) { asp.textContent = gfxSettings.pbrAsphalt ? 'ON' : 'OFF'; asp.style.color = gfxSettings.pbrAsphalt ? '#34d399' : '#94a3b8'; }
          const res = document.getElementById('btn-garage-texres');
          if (res) res.textContent = `${gfxSettings.asphaltRes}²`;
          const env = document.getElementById('btn-garage-envmap');
          if (env) { env.textContent = gfxSettings.envReflections ? 'ON' : 'OFF'; env.style.color = gfxSettings.envReflections ? '#34d399' : '#94a3b8'; }

          const statsEl = document.getElementById('garage-stats');
          if (statsEl) {
            const st = carAssetState.stats;
            if (!st) {
              statsEl.textContent = '使用內建程序化車體\n(4 輪轉向/滾動、PBR 清漆、程序化尾翼)';
            } else {
              const roles = Object.entries(st.roles).map(([k, v]) => `${k}:${v}`).join('  ');
              statsEl.textContent =
                `三角面數   ${st.tris.toLocaleString()}\n` +
                `Mesh/材質  ${st.meshes} / ${st.materials}\n` +
                `原始尺寸   ${st.rawSize.x.toFixed(2)} × ${st.rawSize.y.toFixed(2)} × ${st.rawSize.z.toFixed(2)}\n` +
                `縮放倍率   ×${st.scale.toFixed(4)}\n` +
                `遊戲尺寸   L${st.dims.length.toFixed(2)} W${st.dims.width.toFixed(2)} H${st.dims.height.toFixed(2)} m\n` +
                `車輪綁定   ${st.wheels}/4 ${st.wheels < 4 ? '(⚠ 未偵測完整，車輪不會轉動)' : '✔'}\n` +
                `車身材質   ${st.hasBody ? '✔ 已辨識' : '⚠ 未辨識'}\n` +
                `材質角色   ${roles}` +
                (IS_MOBILE_GPU && st.tris > 200000 ? '\n⚠ 面數偏高，手機可能掉幀' : '');
            }
          }
        }
      };

      const playerCarGroup = new THREE.Group();
      const playerExteriorMesh = createGT3CarMesh(0xef4444, false, 1.0, 'player');
      playerCarGroup.add(playerExteriorMesh);

      const headlightGroup = new THREE.Group();
      const beamGeo = new THREE.ConeGeometry(4.2, 42, 16, 1, true);
      beamGeo.rotateZ(-Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const beamL = new THREE.Mesh(beamGeo, beamMat);
      beamL.position.set(22, 0.45, -0.75);
      const beamR = new THREE.Mesh(beamGeo, beamMat);
      beamR.position.set(22, 0.45, 0.75);
      headlightGroup.add(beamL, beamR);
      playerCarGroup.add(headlightGroup);

      const cockpitGroup = new THREE.Group();
      const hoodMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.95, 0.12, 1.78),
        new THREE.MeshLambertMaterial({ color: 0xdc2626 })
      );
      hoodMesh.position.set(1.25, 0.75, 0);
      cockpitGroup.add(hoodMesh);

      const dashMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.30, 1.68),
        new THREE.MeshLambertMaterial({ color: 0x0b0f19 })
      );
      dashMesh.position.set(0.42, 0.86, 0);
      cockpitGroup.add(dashMesh);

      const pillarBarGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.92, 8);
      const pillarBarMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
      const aPillarL = new THREE.Mesh(pillarBarGeo, pillarBarMat);
      aPillarL.position.set(0.48, 1.22, -0.76);
      aPillarL.rotation.z = -0.52;
      aPillarL.rotation.x = 0.15;
      const aPillarR = new THREE.Mesh(pillarBarGeo, pillarBarMat);
      aPillarR.position.set(0.48, 1.22, 0.76);
      aPillarR.rotation.z = -0.52;
      aPillarR.rotation.x = -0.15;
      cockpitGroup.add(aPillarL, aPillarR);

      const wiperMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.55, 0.03),
        new THREE.MeshLambertMaterial({ color: 0x090b10 })
      );
      wiperMesh.position.set(0.68, 1.05, 0.08);
      wiperMesh.rotation.z = -0.65;
      cockpitGroup.add(wiperMesh);

      const steerWheel3D = new THREE.Group();
      steerWheel3D.position.set(0.28, 0.95, 0);
      const rimMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.16, 0.022, 8, 24),
        new THREE.MeshLambertMaterial({ color: 0x1e293b })
      );
      rimMesh.rotation.y = Math.PI / 2;
      steerWheel3D.add(rimMesh);

      const centerHub = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.09, 0.24),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      steerWheel3D.add(centerHub);
      cockpitGroup.add(steerWheel3D);

      playerCarGroup.add(cockpitGroup);
      scene.add(playerCarGroup);

      const proGhostMesh = createGT3CarMesh(0x22d3ee, true, 0.38);
      const pbGhostMesh = createGT3CarMesh(0x34d399, true, 0.38);
      scene.add(proGhostMesh);
      scene.add(pbGhostMesh);

      // --------------------------------------------------------------------------
      // 8. IMMERSIVE CAMERA, HELMET VISOR, SUNFLARE & SPEED/NOS FX OVERLAY
      // --------------------------------------------------------------------------
      const fxCanvas = document.getElementById('fx-overlay-canvas');
      const fxCtx = fxCanvas.getContext('2d');

      function update3DSceneAndVisualFX(nowSec) {
        const pWorld = sdToWorld(simState.s, simState.d);
        playerCarGroup.position.set(pWorld.x, pWorld.y, pWorld.z);
        playerCarGroup.rotation.order = 'YXZ';
        playerCarGroup.rotation.y = -(simState.heading + simState.driftAngle);
        playerCarGroup.rotation.z = simState.pitchRad;
        playerCarGroup.rotation.x = simState.rollRad;

        steerWheel3D.rotation.x = simState.steerInput * 1.45;

        const targetFov = simState.inShowcaseMode
          ? 50
          : (60 + (simState.speedKmh / 300) * 15 + (simState.isNosActive ? 6.5 : 0) + (simState.inSlipstream ? 3.0 : 0));
        if (Math.abs(camera.fov - targetFov) > 0.1) {
          camera.fov += (targetFov - camera.fov) * 0.15;
          camera.updateProjectionMatrix();
        }

        const vibeAmp = simState.inShowcaseMode ? 0 : (
          (simState.isBrakeLockup ? 0.042 : 0) +
          (simState.onKerb || simState.offTrack ? 0.032 : 0) +
          (simState.isUndersteer ? 0.018 : 0) +
          (simState.speedKmh / 320) * 0.006
        );
        const jx = Math.sin(nowSec * 65) * vibeAmp;
        const jy = Math.cos(nowSec * 82) * vibeAmp;

        const cosH = Math.cos(simState.heading);
        const sinH = Math.sin(simState.heading);

        const apexLookNode = sampleTrackAtS(simState.s + 35);
        const lookX = pWorld.x + cosH * 34 + (apexLookNode.x - pWorld.x) * 0.18;
        const lookZ = pWorld.z + sinH * 34 + (apexLookNode.z - pWorld.z) * 0.18;

        if (simState.inShowcaseMode) {
          playerExteriorMesh.visible = true;
          cockpitGroup.visible = false;
          // Showcase styles: 'home' (hero orbit), 'garage' (car framed left, closer), 'results' (slow wide orbit)
          const style = simState.showcaseStyle || 'home';
          const orbitSpeed = style === 'garage' ? 0.11 : (style === 'results' ? 0.07 : 0.16);
          const orbitDist = style === 'garage' ? 5.6 : (style === 'results' ? 8.2 : 6.6);
          const camH = style === 'garage' ? 1.25 : (style === 'results' ? 2.3 : 1.55);
          const orbitAngle = nowSec * orbitSpeed + (simState.showcaseAngleOffset || 0);
          const camX = pWorld.x + Math.sin(orbitAngle) * orbitDist;
          const camZ = pWorld.z + Math.cos(orbitAngle) * orbitDist;
          camera.position.set(camX, pWorld.y + camH + Math.sin(nowSec * 0.35) * 0.18, camZ);
          // Shift the look target sideways so the car sits left/right of the UI panels
          const lateral = style === 'garage' ? 1.55 : 0;
          let dX = pWorld.x - camX, dZ = pWorld.z - camZ;
          const dLen = Math.hypot(dX, dZ) || 1;
          dX /= dLen; dZ /= dLen;
          camera.lookAt(pWorld.x - dZ * lateral, pWorld.y + 0.62, pWorld.z + dX * lateral);
          camera.rotation.z = 0;
        } else if (simState.cameraMode === 0) {
          playerExteriorMesh.visible = false;
          cockpitGroup.visible = true;
          camera.position.set(
            pWorld.x + cosH * 0.12 + jx,
            pWorld.y + 1.16 - simState.pitchRad * 2.1 + jy,
            pWorld.z + sinH * 0.12
          );
          camera.lookAt(
            lookX,
            pWorld.y + 0.92 + simState.pitchRad * 15,
            lookZ
          );
          camera.rotation.z = -simState.rollRad * 0.92;
        } else if (simState.cameraMode === 1) {
          const hasHiFiPlayer = !!(playerExteriorMesh.userData.vehicleSlot && playerExteriorMesh.userData.vehicleSlot.hifi);
          playerExteriorMesh.visible = hasHiFiPlayer;
          cockpitGroup.visible = !hasHiFiPlayer;
          camera.position.set(
            pWorld.x + cosH * (hasHiFiPlayer ? 0.24 : 1.15) + jx,
            pWorld.y + (hasHiFiPlayer ? 1.22 : 1.05) + jy,
            pWorld.z + sinH * (hasHiFiPlayer ? 0.24 : 1.15)
          );
          camera.lookAt(lookX, pWorld.y + 0.85, lookZ);
        } else {
          playerExteriorMesh.visible = true;
          cockpitGroup.visible = false;
          camera.position.set(
            pWorld.x - cosH * 6.8 + jx,
            pWorld.y + 2.48 + jy,
            pWorld.z - sinH * 6.8
          );
          camera.lookAt(lookX, pWorld.y + 0.9, lookZ);
        }

        const showGhosts = !simState.inShowcaseMode && (simState.mode === 'time_attack');
        const showPro = showGhosts && (simState.ghostTarget === 'pro' || simState.ghostTarget === 'both');
        const showPb = showGhosts && (simState.ghostTarget === 'pb' || simState.ghostTarget === 'both') && simState.pbTelemetrySamples.length > 5;

        proGhostMesh.visible = showPro;
        pbGhostMesh.visible = showPb;

        if (playerExteriorMesh.userData.tailLight) {
          setSlotBrakeLight(playerExteriorMesh, simState.brakeInput > 10, 0xff2222, 0x660000);
        }

        if (showPro) {
          const gState = sampleGhostAtTime(proTelemetrySamples, simState.lapElapsed);
          if (gState) {
            proGhostMesh.position.set(gState.x, gState.y, gState.z);
            proGhostMesh.rotation.y = -gState.heading;
            if (proGhostMesh.userData.tailLight) {
              setSlotBrakeLight(proGhostMesh, gState.brake > 15, 0xff3333, 0x1e293b);
            }
          }
        }
        if (showPb) {
          const pbState = sampleGhostAtTime(simState.pbTelemetrySamples, simState.lapElapsed);
          if (pbState) {
            pbGhostMesh.position.set(pbState.x, pbState.y, pbState.z);
            pbGhostMesh.rotation.y = -pbState.heading;
          }
        }

        updateVehicleRigs(nowSec);
        renderer.render(scene, camera);
        drawScreenVisualFX(nowSec);
      }

      function drawScreenVisualFX(nowSec) {
        if (simState.inShowcaseMode) {
          if (fxCanvas.width !== window.innerWidth || fxCanvas.height !== window.innerHeight) {
            fxCanvas.width = window.innerWidth;
            fxCanvas.height = window.innerHeight;
          }
          fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
          return;
        }

        if (fxCanvas.width !== window.innerWidth || fxCanvas.height !== window.innerHeight) {
          fxCanvas.width = window.innerWidth;
          fxCanvas.height = window.innerHeight;
        }
        const w = fxCanvas.width;
        const h = fxCanvas.height;
        fxCtx.clearRect(0, 0, w, h);

        if (simState.cameraMode === 0) {
          const visorGrad = fxCtx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.38, w * 0.5, h * 0.5, Math.max(w, h) * 0.68);
          visorGrad.addColorStop(0, 'rgba(0,0,0,0)');
          visorGrad.addColorStop(1, 'rgba(4, 7, 15, 0.52)');
          fxCtx.fillStyle = visorGrad;
          fxCtx.fillRect(0, 0, w, h);
        }

        if (currentCircuit.theme.hasSunsetFlare) {
          const sunAngle = Math.atan2(880, 520);
          let diff = Math.abs(simState.heading - sunAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff < 0.85) {
            const flareAlpha = (1 - diff / 0.85) * 0.22;
            const flareGrad = fxCtx.createRadialGradient(w * 0.5, h * 0.22, 10, w * 0.5, h * 0.22, w * 0.45);
            flareGrad.addColorStop(0, `rgba(255, 165, 68, ${flareAlpha})`);
            flareGrad.addColorStop(1, 'rgba(255, 165, 68, 0)');
            fxCtx.fillStyle = flareGrad;
            fxCtx.fillRect(0, 0, w, h);
          }
        }

        if (simState.speedKmh > 195 || simState.inSlipstream || simState.isNosActive) {
          const alpha = simState.isNosActive
            ? 0.46
            : (simState.inSlipstream ? 0.30 : Math.min(0.24, ((simState.speedKmh - 195) / 105) * 0.24));
          fxCtx.strokeStyle = simState.isNosActive
            ? `rgba(56, 189, 248, ${alpha})`
            : (simState.inSlipstream ? `rgba(34, 211, 238, ${alpha})` : `rgba(226, 232, 240, ${alpha})`);
          fxCtx.lineWidth = simState.isNosActive ? 2.6 : 1.5;

          const cx = w * 0.5 - simState.latG * 18;
          const cy = h * 0.46 - simState.longG * 10;
          for (let i = 0; i < 22; i++) {
            const angle = (i / 22) * Math.PI * 2 + ((nowSec * 4.5) % 0.35);
            const rInner = Math.min(w, h) * 0.30;
            const rOuter = Math.max(w, h) * 0.68;
            fxCtx.beginPath();
            fxCtx.moveTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
            fxCtx.lineTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
            fxCtx.stroke();
          }
        }

        if (simState.mode === 'ai_race') {
          aiCars.forEach(ai => {
            if (!ai.mesh.visible) return;
            const pos = ai.mesh.position.clone();
            pos.y += 2.1;
            pos.project(camera);
            if (pos.z > 0 && pos.z < 1) {
              const sx = (pos.x * 0.5 + 0.5) * w;
              const sy = (-pos.y * 0.5 + 0.5) * h;
              if (sx > 60 && sx < w - 60 && sy > 60 && sy < h - 80) {
                fxCtx.fillStyle = 'rgba(11, 15, 25, 0.78)';
                fxCtx.fillRect(sx - 68, sy - 22, 136, 30);
                fxCtx.strokeStyle = ai.stress > 75 ? '#ef4444' : '#f59e0b';
                fxCtx.lineWidth = 1.2;
                fxCtx.strokeRect(sx - 68, sy - 22, 136, 30);

                fxCtx.fillStyle = '#ffffff';
                fxCtx.font = '700 10px "JetBrains Mono", monospace';
                fxCtx.textAlign = 'center';
                fxCtx.fillText(`${ai.name} [${ai.stateLabel}]`, sx, sy - 10);

                fxCtx.fillStyle = '#1e293b';
                fxCtx.fillRect(sx - 56, sy - 2, 112, 4);
                fxCtx.fillStyle = ai.stress > 75 ? '#ef4444' : '#f59e0b';
                fxCtx.fillRect(sx - 56, sy - 2, (ai.stress / 100) * 112, 4);
              }
            }
          });
        }
      }

window.scene = scene;
window.camera = camera;
window.renderer = renderer;
window.circuitSceneryGroup = circuitSceneryGroup;
window.playerCarGroup = playerCarGroup;
window.cockpitGroup = cockpitGroup;
window.headlightGroup = headlightGroup;
window.proGhostMesh = proGhostMesh;
window.pbGhostMesh = pbGhostMesh;
window.rebuild3DCircuitScene = rebuild3DCircuitScene;
window.createGT3CarMesh = createGT3CarMesh;
window.update3DSceneAndVisualFX = update3DSceneAndVisualFX;
window.spawnSkidMark = spawnSkidMark;
window.spawnTireSmoke = spawnTireSmoke;
window.updateSmokeParticles = updateSmokeParticles;
window.setSlotBrakeLight = setSlotBrakeLight;
window.useProceduralVehicle = useProceduralVehicle;
window.loadVehicleFromURLs = loadVehicleFromURLs;
window.loadVehicleFromFiles = loadVehicleFromFiles;
window.rebuildAllVehicleSlots = rebuildAllVehicleSlots;
window.createGLTFLoader = createGLTFLoader;
window.garageUI = garageUI;
window.carAssetState = carAssetState;
window.saveCarAssetSettings = saveCarAssetSettings;
window.saveGfxSettings = saveGfxSettings;
if (window.__apexTrace) window.__apexTrace('render.js', 'OK');