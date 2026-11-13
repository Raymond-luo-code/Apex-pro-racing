// ============================================================================
// APEX PRO RACING // MODULE 6: ASPHALT-STYLE GAME LIFECYCLE CONTROLLER
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('flow.js', 'START');

      const CAR_CATALOG = [
        {
          id: 'procedural',
          classLabel: 'GT3 · CLASS S',
          name: 'BMW M4 GT3 EVO // APEX WORKS',
          shortTag: '高精度 3D 模型 · 3.0L 雙渦輪直六',
          origin: '🇩🇪 慕尼黑廠隊研發 · 3.0L P58 雙渦輪直列六缸 · 前中置後驅 (FMR)',
          desc: '巴伐利亞廠隊頂級 GT3 賽道武器！搭載 3.0L 雙渦輪增壓直列六缸引擎與六速序列式變速箱，寬體碳纖維空力套件與大尺寸天鵝頸尾翼帶來均衡的高速下壓力與精準入彎指向。',
          specs: { topSpeed: '307 km/h', accel: '3.4 s', power: '590 HP', weight: '1,250 kg' },
          bars: { speed: 91, accel: 92, handling: 95, braking: 95 },
          defaultPaint: '#ef4444',
          unlocked: true
        },
        {
          id: 'ferrari458',
          classLabel: 'GT3 · CLASS S',
          name: 'FERRARI 458 ITALIA GT3',
          shortTag: '高精度 3D 模型 · 4.5L V8 超跑',
          origin: '🇮🇹 義大利馬拉內羅 · 4.5L V8 自然進氣 · 中置後驅 (MR)',
          desc: '源自義大利傳奇躍馬血統的 GT3 統規賽車。中置 9,000 rpm 高轉速 V8 引擎兼顧迷人聲浪與出彎爆發力，搭配專屬碳纖維 GT3 天鵝頸大尾翼、前定風翼與後擴散器。',
          specs: { topSpeed: '308 km/h', accel: '3.4 s', power: '570 HP', weight: '1,215 kg' },
          bars: { speed: 92, accel: 93, handling: 94, braking: 92 },
          defaultPaint: '#dc2626',
          unlocked: true
        },
        {
          id: 'porsche911',
          classLabel: 'GT3 · CLASS S',
          name: 'PORSCHE 911 GT3 R (992)',
          shortTag: '高精度 3D 模型 · 斯圖加特 RR 六缸',
          origin: '🇩🇪 斯圖加特 · 4.2L 水平對臥六缸 · 後置後驅 (RR)',
          desc: '經典 RR 後置引擎賽道機器（2024 992 GT3 R 廠隊式樣）！短軸距搭配後軸配重帶來無可比擬的入彎指向性與出彎縱向抓地力，重煞循跡入彎（Trail Braking）極限極高。',
          specs: { topSpeed: '306 km/h', accel: '3.3 s', power: '565 HP', weight: '1,250 kg' },
          bars: { speed: 90, accel: 95, handling: 98, braking: 96 },
          defaultPaint: '#10b981',
          unlocked: true
        },
        {
          id: 'amggt3',
          classLabel: 'GT3 · CLASS S',
          name: 'MERCEDES-AMG GT3 EVO',
          shortTag: '高精度 3D 模型 · 前中置 6.2L V8',
          origin: '🇩🇪 阿法爾特巴赫 · 6.2L V8 自然進氣 · 前中置後驅 (FMR)',
          desc: '大排量 6.2L 自然進氣 V8 重裝猛獸！超長車頭與寬體底盤賦予極為穩定的高速巡航表現與全場最高直線尾速，最適合蒙札與富士長直線超車。',
          specs: { topSpeed: '312 km/h', accel: '3.4 s', power: '600 HP', weight: '1,285 kg' },
          bars: { speed: 97, accel: 92, handling: 91, braking: 94 },
          defaultPaint: '#eab308',
          unlocked: true
        }
      ];

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
      const ALL_FLOW_SCREENS = ['scr-splash', 'scr-loading', 'scr-home', 'scr-garage', 'scr-setup', 'scr-pause', 'scr-results'];
      const flowState = {
        screen: 'splash',       // 'splash' | 'home' | 'garage' | 'setup' | 'racing' | 'pause' | 'results'
        garageReturnTo: 'home', // 'home' | 'setup'
        setupStep: 1,           // 1: edition, 2: mode, 3: circuit, 4: garage
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
          results: 'scr-results'
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

        if (clsEl) clsEl.textContent = meta.classLabel;
        if (nameEl) nameEl.textContent = meta.name;
        if (recEl) recEl.textContent = String(Object.keys(personalRecords).length);

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

        if (clsEl) clsEl.textContent = meta.classLabel;
        if (nameEl) nameEl.textContent = meta.name;
        if (origEl) origEl.textContent = meta.origin;
        if (descEl) descEl.textContent = meta.desc;

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
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
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
          `;
          paintCustEl.querySelectorAll('[data-pick-paint]').forEach(btn => {
            btn.addEventListener('click', () => {
              const hex = btn.getAttribute('data-pick-paint');
              if (typeof applyCustomLiveryColors === 'function') {
                applyCustomLiveryColors(hex, null);
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
        }

        const chassisNoteEl = document.getElementById('lbl-gar-chassis-note');
        if (chassisNoteEl && typeof getCurrentCarHandling === 'function') {
          const hp = getCurrentCarHandling();
          chassisNoteEl.textContent = `✔ 專屬底盤參數：軸距 ${hp.wheelbase.toFixed(2)}m · 機械轉角 ${hp.maxSteerDeg}° · 基準側向抓地力 ${hp.baseMuLat.toFixed(2)}G · 車重 ${hp.weightKg}kg`;
        }

        if (stripEl) {
          const cards = CAR_CATALOG.map(c => {
            const active = (c.id === carAssetState.presetId);
            const cls = ['af-car-card', active ? 'is-active' : '', !c.unlocked ? 'is-locked' : ''].filter(Boolean).join(' ');
            return `<button type="button" class="${cls}" data-car-id="${c.id}">
              <div class="c">${c.classLabel}</div>
              <div class="n">${c.name}</div>
              <div class="t">${active && c.unlocked ? '✔ 目前座駕 · ' : ''}${c.shortTag}</div>
            </button>`;
          });
          if (carAssetState.presetId === 'custom-file' || carAssetState.presetId === 'custom-url') {
            cards.push(`<button type="button" class="af-car-card is-active" data-car-id="${carAssetState.presetId}">
              <div class="c">GT3 · CUSTOM</div>
              <div class="n">${carAssetState.label}</div>
              <div class="t">✔ 自訂 3D 模型使用中</div>
            </button>`);
          }
          stripEl.innerHTML = cards.join('');
        }
      }

      window.__apexFlowOnGarageRefresh = function () {
        if (flowState.screen === 'garage') renderGarageScreen();
        if (flowState.screen === 'home') renderHomeScreen();
      };

      function openGarageScreen(fromWhere) {
        flowState.garageReturnTo = fromWhere || 'home';
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
                  與 3 位具備尾流超車與心理壓力失誤機制的 AI 車手進行 <strong>2 圈爭先錦標賽</strong>！逼近對手車尾可觸發尾流加速並施壓迫使對手鎖死外拋。
                </div>
                <div class="af-diff-row" data-stop-prop="1">
                  <button type="button" class="af-diff ${diff < 0.96 ? 'is-active' : ''}" data-aidiff="0.92">俱樂部級 (入門)</button>
                  <button type="button" class="af-diff ${diff >= 0.96 && diff <= 1.04 ? 'is-active' : ''}" data-aidiff="1.0">PRO 職業級</button>
                  <button type="button" class="af-diff ${diff > 1.04 ? 'is-active' : ''}" data-aidiff="1.10">Alien 外星人</button>
                </div>
                <div class="go">進入賽道選擇 ➔</div>
              </div>
            </div>`;
        } else if (step === 3) {
          if (kickerEl) kickerEl.textContent = 'STEP 3 / 4 · CIRCUIT SELECTION';
          if (titleEl) titleEl.textContent = '選擇比賽賽道';
          const tracks = [
            {
              idx: 0,
              accent: '#10b981',
              ico: '🌲',
              tag: '★☆☆ 入門高速 · 晴空正午',
              ttl: '蒙札森林高速環道',
              sub: 'MONZA HIGH-SPEED RING',
              dsc: '全長 5.25 km，24m 超寬路面與超長全油門直道。最適合體驗 300+ km/h 高速離心慣性與尾流攻防，新手也能穩定完賽刷圈。',
              meta: ['📏 路面寬 24m', '⏱ PRO 基準 ' + formatLapTime(CIRCUITS[0].proLapTime), '☀ 晴空高抓地']
            },
            {
              idx: 1,
              accent: '#6366f1',
              ico: '🗻',
              tag: '★★★ 中階技術 · 黃金夕陽',
              ttl: '富士山國際大獎賽道',
              sub: 'MOUNT FUJI TECHNICAL GP',
              dsc: '全長 5.18 km，結合 1.1km 大直線、2 座重煞髮夾彎（極限 74 km/h）與連續高速 S 彎重心轉移區，夕陽斜射下極富競技張力。',
              meta: ['📏 路面寬 16m', '⏱ PRO 基準 ' + formatLapTime(CIRCUITS[1].proLapTime), '🌅 夕陽眩光']
            },
            {
              idx: 2,
              accent: '#f43f5e',
              ico: '🌙',
              tag: '★★★★★ 魔鬼山道 · 午夜霓虹',
              ttl: '箱根午夜山道大獎賽',
              sub: 'HAKONE MIDNIGHT TOUGE GP',
              dsc: '全長 5.42 km，高低落差劇烈（±16m），遍布急促五連髮夾彎與盲彎。夜間開啟遠光頭燈束與霓虹拱門，極度考驗精準重煞控制！',
              meta: ['📏 路面寬 13m', '⏱ PRO 基準 ' + formatLapTime(CIRCUITS[2].proLapTime), '🌃 午夜頭燈']
            }
          ];
          bodyEl.innerHTML = `
            <div class="af-choice-grid">
              ${tracks.map(t => {
                const pbKey = `${t.idx}_${simState.edition}`;
                const pbVal = personalRecords[pbKey];
                return `
                  <div class="af-choice ${currentCircuitIndex === t.idx ? 'is-active' : ''}" style="--accent:${t.accent};" data-pick-track="${t.idx}">
                    <div class="ico">${t.ico}</div>
                    <div class="tag">${t.tag}</div>
                    <div class="ttl">${t.ttl}</div>
                    <div class="dsc">${t.dsc}</div>
                    <div class="meta">
                      ${t.meta.map(m => `<span>${m}</span>`).join('')}
                      ${pbVal ? `<span style="color:#fbbf24;">🏆 個人最佳 ${formatLapTime(pbVal)}</span>` : ''}
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

        const pbKey = `${currentCircuitIndex}_${simState.edition}`;
        const prevPB = personalRecords[pbKey] || null;
        const isNewPB = savePersonalRecord(pbKey, bestSessionLap);

        let maxV = simState.sessionTopSpeed || 0;
        simState.currentLapSamples.forEach(s => { if (s.speed > maxV) maxV = s.speed; });
        const avgV = (totalTrackLength / Math.max(1, bestSessionLap)) * 3.6;

        // Compute AI standings snapshot (accounting for Jump Start +5.0s time penalty if any)
        const playerProgress = simState.totalRaceLaps * totalTrackLength - (jumpPenaltySec * 65);
        const standings = [{
          name: 'YOU (' + getActiveCarMeta().name + ')',
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
        }
        const playerRank = standings.findIndex(s => s.isPlayer) + 1;

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

        flowState.lastResult = {
          mode: simState.mode,
          edition: simState.edition,
          circuitName: currentCircuit.name,
          difficultyStars: currentCircuit.difficultyStars,
          carName: getActiveCarMeta().name,
          bestLap: bestSessionLap,
          totalTime: totalSessionTime,
          lapTimes,
          proLap,
          deltaPro,
          isNewPB,
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
          if (titleEl) titleEl.textContent = r.mode === 'ai_race' ? '錦標賽完賽名次榜' : '單圈計時挑戰結算';

          if (r.mode === 'ai_race') {
            const rankLabels = ['🏆 冠軍 WINNER', '🥈 亞軍 P2 PODIUM', '🥉 季軍 P3 PODIUM', '完賽 FINISHED'];
            bodyEl.innerHTML = `
              <div class="af-res-page af-res-hero">
                <div class="af-kicker">${rankLabels[r.playerRank - 1] || 'FINISHED'}</div>
                <div class="af-res-pos">P${r.playerRank}<small> / 4</small></div>
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
              </div>`;
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
          try { window.soundEngine.init(); } catch (e) {}
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
        enterHomeScreen(true, {
          title: 'ENTERING GARAGE HUB',
          sub: '正在啟動 3D 展示車庫與物理引擎…',
          duration: 900
        });
      }

      window.dismissSplashScreen = dismissSplashScreen;

      const btnSplashStart = document.getElementById('btn-splash-start');
      if (btnSplashStart) {
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
      const btnHomeGarage = document.getElementById('btn-home-garage');
      if (btnHomeGarage) btnHomeGarage.addEventListener('click', () => openGarageScreen('home'));
      const btnHomePlay = document.getElementById('btn-home-play');
      if (btnHomePlay) btnHomePlay.addEventListener('click', () => openSetupStep(1));

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
          else enterHomeScreen(false);
        });
      }
      const btnGarConfirm = document.getElementById('btn-garage-confirm');
      if (btnGarConfirm) {
        btnGarConfirm.addEventListener('click', () => {
          if (flowState.garageReturnTo === 'setup') {
            startConfiguredRace(true);
          } else {
            enterHomeScreen(false);
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
if (window.__apexTrace) window.__apexTrace('flow.js', 'OK');