// ============================================================================
// APEX PRO RACING // MODULE 5: INPUT CONTROLLER (KEYBOARD / TOUCH / GYRO)
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('input.js', 'START');

      const inputs = {
        throttle: false,
        brake: false,
        trailBrake: false,
        steerLeft: false,
        steerRight: false,
        drift: false,
        nos: false
      };

      const keyboardKeys = {
        up: false, down: false, left: false, right: false, trailBrake: false, drift: false, nos: false
      };

      const touchKeys = {
        throttle: false, brake: false, trailBrake: false, left: false, right: false, drift: false, nos: false
      };

      function updateCombinedInputs() {
        inputs.throttle = keyboardKeys.up || touchKeys.throttle;
        inputs.brake = keyboardKeys.down || touchKeys.brake;
        inputs.trailBrake = keyboardKeys.trailBrake || touchKeys.trailBrake;
        inputs.steerLeft = keyboardKeys.left || touchKeys.left;
        inputs.steerRight = keyboardKeys.right || touchKeys.right;
        inputs.drift = keyboardKeys.drift || touchKeys.drift;
        inputs.nos = keyboardKeys.nos || touchKeys.nos;
      }

      const sliderSteer = document.getElementById('slider-steer');
      const sliderThrottle = document.getElementById('slider-throttle');
      const sliderBrake = document.getElementById('slider-brake');
      let manualSteerDrag = false;
      let manualThrottleDrag = false;
      let manualBrakeDrag = false;

      sliderSteer.addEventListener('mousedown', () => { manualSteerDrag = true; });
      sliderSteer.addEventListener('touchstart', () => { manualSteerDrag = true; }, { passive: true });
      window.addEventListener('mouseup', () => {
        manualSteerDrag = false; manualThrottleDrag = false; manualBrakeDrag = false;
      });
      window.addEventListener('touchend', () => {
        manualSteerDrag = false; manualThrottleDrag = false; manualBrakeDrag = false;
      });

      sliderSteer.addEventListener('input', () => {
        simState.steerInput = parseFloat(sliderSteer.value) / 100;
      });
      sliderThrottle.addEventListener('mousedown', () => { manualThrottleDrag = true; });
      sliderThrottle.addEventListener('touchstart', () => { manualThrottleDrag = true; }, { passive: true });
      sliderThrottle.addEventListener('input', () => {
        simState.throttleInput = parseFloat(sliderThrottle.value);
      });
      sliderBrake.addEventListener('mousedown', () => { manualBrakeDrag = true; });
      sliderBrake.addEventListener('touchstart', () => { manualBrakeDrag = true; }, { passive: true });
      sliderBrake.addEventListener('input', () => {
        simState.brakeInput = parseFloat(sliderBrake.value);
      });

      document.getElementById('btn-steer-center').addEventListener('click', () => {
        simState.steerInput = 0;
        sliderSteer.value = '0';
      });

      function shiftGear(delta) {
        soundEngine.init();
        let nextGear = simState.gear + delta;
        if (nextGear < 1) {
          nextGear = (simState.speedKmh < 6) ? -1 : 1;
        } else if (nextGear > 6) {
          nextGear = 6;
        }
        if (nextGear !== simState.gear) {
          if (delta < 0) soundEngine.blipShift();
          simState.gear = nextGear;
          simState.backfireFlameTimer = 0.13;
          if (soundEngine && typeof soundEngine.triggerBackfire === 'function') {
            soundEngine.triggerBackfire();
          }
          const gearText = simState.gear === -1 ? 'R' : String(simState.gear);
          document.getElementById('hud-gear').textContent = gearText;
          const topGearEl = document.getElementById('hud-top-gear');
          if (topGearEl) topGearEl.textContent = simState.gear === -1 ? 'R檔(MT)' : `${simState.gear}檔(MT)`;
          const wPos = sdToWorld(simState.s, simState.d);
          const backX = wPos.x - Math.cos(simState.heading) * 2.3;
          const backZ = wPos.z - Math.sin(simState.heading) * 2.3;
          spawnTireSmoke(backX, wPos.y, backZ, 'backfire');
        }
      }

      document.getElementById('btn-gear-down').addEventListener('click', () => shiftGear(-1));
      document.getElementById('btn-gear-up').addEventListener('click', () => shiftGear(1));

      function recoverToTrackCenter() {
        const node = sampleTrackAtS(simState.s);
        simState.d = 0;
        simState.heading = node.heading;
        simState.yawRate = 0;
        simState.driftAngle = 0;
        simState.speedMs = Math.min(simState.speedMs, 22);
        simState.speedKmh = simState.speedMs * 3.6;
        simState.isWrongWay = false;
        simState.reverseHoldTimer = 0;
        if (simState.gear === -1) simState.gear = 1;
      }

      document.getElementById('btn-reset-track').addEventListener('click', recoverToTrackCenter);
      document.getElementById('btn-recover-banner').addEventListener('click', recoverToTrackCenter);

      function triggerFinalLapBanner() {
        const banner = document.getElementById('hud-final-lap');
        if (!banner) return;
        banner.classList.remove('hidden');
        clearTimeout(window.__finalLapTimer);
        window.__finalLapTimer = setTimeout(() => {
          banner.classList.add('hidden');
        }, 3800);
      }

      // --------------------------------------------------------------------------
      // 5B. MOBILE GYROSCOPE / DEVICE TILT STEERING CONTROLLER
      // --------------------------------------------------------------------------
      const gyroState = {
        enabled: false,
        active: false,
        steerVal: 0,
        rawTilt: 0,
        listenerBound: false
      };

      function activateGyro() {
        gyroState.enabled = true;
        if (!gyroState.listenerBound) {
          window.addEventListener('deviceorientation', handleDeviceOrientation, true);
          gyroState.listenerBound = true;
        }
        updateGyroUI();
      }

      function deactivateGyro() {
        gyroState.enabled = false;
        gyroState.steerVal = 0;
        updateGyroUI();
      }

      function toggleGyro() {
        soundEngine.init();
        if (!gyroState.enabled) {
          if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
              .then(res => {
                if (res === 'granted') {
                  activateGyro();
                } else {
                  alert('請在瀏覽器設定中允許陀螺儀/方向感測器權限以啟用體感轉向！');
                }
              })
              .catch(err => {
                console.warn('Gyro permission error:', err);
                activateGyro();
              });
          } else {
            activateGyro();
          }
        } else {
          deactivateGyro();
        }
      }

      function updateGyroUI() {
        const btn = document.getElementById('touch-btn-gyro');
        const lbl = document.getElementById('gyro-label');
        if (!btn || !lbl) return;
        if (gyroState.enabled) {
          btn.classList.add('border-emerald-400', 'text-emerald-300', 'bg-emerald-950/80');
          btn.classList.remove('border-sky-400/50', 'text-sky-200', 'bg-slate-900/80');
          lbl.textContent = '體感: ON';
        } else {
          btn.classList.remove('border-emerald-400', 'text-emerald-300', 'bg-emerald-950/80');
          btn.classList.add('border-sky-400/50', 'text-sky-200', 'bg-slate-900/80');
          lbl.textContent = '體感: OFF';
        }
      }

      function handleDeviceOrientation(e) {
        if (!gyroState.enabled) return;
        let tilt = 0;
        const orient = (screen.orientation && screen.orientation.angle !== undefined)
          ? screen.orientation.angle
          : (window.orientation || 0);

        if (orient === 90) {
          tilt = e.beta;
        } else if (orient === -90 || orient === 270) {
          tilt = -e.beta;
        } else {
          tilt = e.gamma;
        }

        if (tilt === null || isNaN(tilt)) return;
        gyroState.rawTilt = tilt;

        // Apply 2.5 deg deadzone and smooth mapping up to 26 deg
        const deadzone = 2.5;
        const maxAngle = 26.0;
        const absTilt = Math.abs(tilt);
        if (absTilt <= deadzone) {
          gyroState.steerVal = 0;
        } else {
          const norm = Math.min(1.0, (absTilt - deadzone) / (maxAngle - deadzone));
          gyroState.steerVal = Math.sign(tilt) * norm;
        }
        gyroState.active = true;
      }

      const gyroBtn = document.getElementById('touch-btn-gyro');
      if (gyroBtn) {
        gyroBtn.addEventListener('click', toggleGyro);
      }

      function bindTouchButton(elId, keyProp) {
        const el = document.getElementById(elId);
        if (!el) return;

        const startAction = (e) => {
          e.preventDefault();
          soundEngine.init();
          touchKeys[keyProp] = true;
          el.classList.add('active');
          updateCombinedInputs();
        };

        const stopAction = (e) => {
          e.preventDefault();
          touchKeys[keyProp] = false;
          el.classList.remove('active');
          updateCombinedInputs();
        };

        el.addEventListener('touchstart', startAction, { passive: false });
        el.addEventListener('touchend', stopAction, { passive: false });
        el.addEventListener('touchcancel', stopAction, { passive: false });
        el.addEventListener('mousedown', startAction);
        el.addEventListener('mouseup', stopAction);
        el.addEventListener('mouseleave', stopAction);
      }

      bindTouchButton('touch-btn-left', 'left');
      bindTouchButton('touch-btn-right', 'right');
      bindTouchButton('touch-btn-throttle', 'throttle');
      bindTouchButton('touch-btn-brake', 'brake');
      bindTouchButton('touch-btn-trail', 'trailBrake');
      bindTouchButton('touch-btn-drift', 'drift');
      bindTouchButton('touch-btn-nos', 'nos');

      document.getElementById('touch-btn-center').addEventListener('click', () => {
        soundEngine.init();
        simState.steerInput = 0;
        sliderSteer.value = '0';
      });
      document.getElementById('touch-btn-cam').addEventListener('click', () => {
        soundEngine.init();
        cycleCamera();
      });
      document.getElementById('touch-btn-geardown').addEventListener('click', () => shiftGear(-1));
      document.getElementById('touch-btn-gearup').addEventListener('click', () => shiftGear(1));

      window.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
          toggleMenuModal();
          return;
        }
        // Racing hotkeys are only active while actually driving (not on menus / pause / results)
        if (simState.inShowcaseMode || simState.paused) return;
        if (e.code === 'KeyH') {
          document.getElementById('quick-settings-drawer').classList.toggle('hidden');
          return;
        }
        if (e.code === 'KeyR') {
          recoverToTrackCenter();
          return;
        }
        if (simState.paused) return;
        soundEngine.init();

        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            keyboardKeys.up = true;
            break;
          case 'KeyS':
          case 'ArrowDown':
            keyboardKeys.down = true;
            break;
          case 'Space':
            e.preventDefault();
            keyboardKeys.trailBrake = true;
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            keyboardKeys.drift = true;
            break;
          case 'KeyN':
          case 'KeyX':
            keyboardKeys.nos = true;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            keyboardKeys.left = true;
            break;
          case 'KeyD':
          case 'ArrowRight':
            keyboardKeys.right = true;
            break;
          case 'KeyQ':
            shiftGear(-1);
            break;
          case 'KeyE':
            shiftGear(1);
            break;
          case 'KeyC':
            cycleCamera();
            break;
          case 'KeyM':
            toggleTransmission();
            break;
        }
        updateCombinedInputs();
      });

      window.addEventListener('keyup', (e) => {
        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            keyboardKeys.up = false;
            break;
          case 'KeyS':
          case 'ArrowDown':
            keyboardKeys.down = false;
            break;
          case 'Space':
            keyboardKeys.trailBrake = false;
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            keyboardKeys.drift = false;
            break;
          case 'KeyN':
          case 'KeyX':
            keyboardKeys.nos = false;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            keyboardKeys.left = false;
            break;
          case 'KeyD':
          case 'ArrowRight':
            keyboardKeys.right = false;
            break;
        }
        updateCombinedInputs();
      });

      function setPhysicsEdition(edition) {
        simState.edition = edition;
        const isReal = (edition === 'realistic');

        const lblEd = document.getElementById('lbl-edition');
        const iconEd = document.getElementById('icon-edition');
        const drawerEd = document.getElementById('btn-drawer-edition');
        const hint = document.getElementById('hud-control-hint');

        if (isReal) {
          lblEd.textContent = '真實版';
          iconEd.textContent = '🏁';
          drawerEd.textContent = '🏁 真實模擬版 (ON)';
          if (hint) {
            hint.innerHTML = '<span class="text-amber-300">🏁 真實物理版：</span> 0–100 3.5s / 0–300 40s · 入彎前務必踩 <span class="text-red-400">S/↓ 或 BRAKE</span> 減速至彎道極限以下，超速入彎必定因慣性推頭衝出賽道！';
          }
        } else {
          lblEd.textContent = '娛樂版';
          iconEd.textContent = '🔥';
          drawerEd.textContent = '🔥 娛樂氮氣版 (ON)';
          if (hint) {
            hint.innerHTML = '<span class="text-cyan-300">🔥 娛樂氮氣版：</span> <span class="text-fuchsia-300">Shift / 💨甩尾</span> 滑入彎心充能氮氣 · <span class="text-cyan-400">N / 🔥氮氣</span> 噴射突破 345km/h！';
          }
        }

        document.getElementById('top-nos-container').classList.toggle('hidden', isReal);
        document.getElementById('top-nos-container').classList.toggle('flex', !isReal);
        document.getElementById('mobile-arcade-buttons').classList.toggle('hidden', isReal);
        document.getElementById('mobile-arcade-buttons').classList.toggle('flex', !isReal);
        document.getElementById('pc-nos-col').classList.toggle('hidden', isReal);
        document.getElementById('pc-nos-col').classList.toggle('flex', !isReal);

        document.getElementById('card-edition-real').className = isReal
          ? 'cursor-pointer rounded-xl p-3.5 border-2 border-amber-400 bg-slate-900 transition'
          : 'cursor-pointer rounded-xl p-3.5 border-2 border-slate-800 bg-slate-900 transition';
        document.getElementById('card-edition-arcade').className = !isReal
          ? 'cursor-pointer rounded-xl p-3.5 border-2 border-cyan-400 bg-slate-900 transition'
          : 'cursor-pointer rounded-xl p-3.5 border-2 border-slate-800 bg-slate-900 transition';
      }

      document.getElementById('btn-edition-toggle').addEventListener('click', () => {
        setPhysicsEdition(simState.edition === 'realistic' ? 'arcade' : 'realistic');
      });
      document.getElementById('btn-drawer-edition').addEventListener('click', () => {
        setPhysicsEdition(simState.edition === 'realistic' ? 'arcade' : 'realistic');
      });
      document.getElementById('card-edition-real').addEventListener('click', () => setPhysicsEdition('realistic'));
      document.getElementById('card-edition-arcade').addEventListener('click', () => setPhysicsEdition('arcade'));

      document.getElementById('btn-track-cycle').addEventListener('click', () => {
        selectCircuit(currentCircuitIndex + 1);
      });
      [0, 1, 2].forEach(idx => {
        const el = document.getElementById(`card-track-${idx}`);
        if (el) el.addEventListener('click', () => selectCircuit(idx));
      });

      function setInputMode(isMobileActive) {
        simState.isMobileGamepadActive = isMobileActive;
        const mobileOverlay = document.getElementById('mobile-gamepad-overlay');
        const pcBottomHud = document.getElementById('pc-bottom-hud');
        const topLeftPanels = document.getElementById('top-left-panels');
        const cornerBanner = document.getElementById('hud-corner-banner');
        const lbl = document.getElementById('lbl-input-mode');
        const icon = document.getElementById('icon-input-mode');
        const drawerBtn = document.getElementById('btn-drawer-input-mode');

        if (simState.inShowcaseMode) {
          if (mobileOverlay) mobileOverlay.classList.add('hidden');
          if (pcBottomHud) {
            pcBottomHud.classList.add('hidden');
            pcBottomHud.classList.remove('flex');
          }
          if (topLeftPanels) {
            topLeftPanels.classList.add('hidden');
            topLeftPanels.classList.remove('flex');
          }
          if (cornerBanner) cornerBanner.classList.add('hidden');
          return;
        }

        if (isMobileActive) {
          mobileOverlay.classList.remove('hidden');
          pcBottomHud.classList.add('hidden');
          pcBottomHud.classList.remove('flex');
          topLeftPanels.classList.add('hidden');
          topLeftPanels.classList.remove('flex');
          cornerBanner.classList.add('hidden');
          lbl.textContent = '手遊模式';
          icon.textContent = '📱';
          drawerBtn.textContent = '手遊極簡版 (ON)';
        } else {
          mobileOverlay.classList.add('hidden');
          pcBottomHud.classList.remove('hidden');
          pcBottomHud.classList.add('flex');
          topLeftPanels.classList.remove('hidden');
          topLeftPanels.classList.add('flex');
          cornerBanner.classList.remove('hidden');
          lbl.textContent = '電腦模式';
          icon.textContent = '💻';
          drawerBtn.textContent = '電腦專業版 (ON)';
        }
      }

      document.getElementById('btn-input-mode-toggle').addEventListener('click', () => {
        if (typeof applyDeviceProfile === 'function') applyDeviceProfile(!simState.isMobileGamepadActive);
        else setInputMode(!simState.isMobileGamepadActive);
      });
      document.getElementById('btn-drawer-input-mode').addEventListener('click', () => {
        if (typeof applyDeviceProfile === 'function') applyDeviceProfile(!simState.isMobileGamepadActive);
        else setInputMode(!simState.isMobileGamepadActive);
      });

      // --------------------------------------------------------------------------
      // 7. CORE PHYSICS STEP
      // --------------------------------------------------------------------------

      function detectClientDevice() {
        const ua = navigator.userAgent || '';
        const uaMobile = !!(navigator.userAgentData && navigator.userAgentData.mobile);
        const regexMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
        const iPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const coarseSmall = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches && window.innerWidth <= 1024);
        return uaMobile || regexMobile || iPadOS || coarseSmall;
      }

      const clientDevice = window.__apexClientDevice || {
        isMobile: detectClientDevice(),
        manualOverride: null
      };

      function applyDeviceProfile(isMobile) {
        clientDevice.isMobile = isMobile;
        simState.isMobileGamepadActive = isMobile;
        if (window.__apexClientDevice) {
          window.__apexClientDevice.isMobile = isMobile;
        }

        const pcBtn = document.getElementById('btn-splash-dev-pc');
        const mobBtn = document.getElementById('btn-splash-dev-mobile');
        if (pcBtn) pcBtn.classList.toggle('is-active', !isMobile);
        if (mobBtn) mobBtn.classList.toggle('is-active', isMobile);

        const badge = document.getElementById('lbl-device-badge');
        if (badge) {
          badge.textContent = isMobile
            ? '📱 已選取：手機觸控模式（自動啟用虛擬方向鍵與油門煞車）'
            : '💻 已選取：電腦鍵盤模式（WASD / ↑↓←→ 操控）';
        }
        const splashHint = document.getElementById('lbl-splash-hint');
        if (splashHint) {
          splashHint.textContent = isMobile
            ? '輕觸任意處或點擊 PRESS START 啟動引擎'
            : '點擊任意處或按 Enter / 空白鍵啟動引擎';
        }
        const homeDev = document.getElementById('lbl-home-device');
        if (homeDev) {
          homeDev.textContent = isMobile ? '📱 手機觸控模式 (點此切換)' : '💻 電腦鍵盤模式 (點此切換)';
          homeDev.style.cursor = 'pointer';
          homeDev.title = '點擊可手動切換手機觸控 / 電腦鍵盤介面';
        }
        const pauseHint = document.getElementById('lbl-pause-hint');
        if (pauseHint) {
          pauseHint.textContent = isMobile ? '點擊「繼續比賽」返回賽道' : '按 ESC 鍵可隨時繼續或暫停比賽';
        }
        if (!simState.inShowcaseMode) {
          setInputMode(isMobile);
        } else {
          // Update HUD labels even while in showcase mode
          const lbl = document.getElementById('lbl-input-mode');
          const icon = document.getElementById('icon-input-mode');
          const drawerBtn = document.getElementById('btn-drawer-input-mode');
          if (lbl) lbl.textContent = isMobile ? '手遊模式' : '電腦模式';
          if (icon) icon.textContent = isMobile ? '📱' : '💻';
          if (drawerBtn) drawerBtn.textContent = isMobile ? '手遊極簡版 (ON)' : '電腦專業版 (ON)';
        }
      }

window.inputs = inputs;
window.keyboardKeys = keyboardKeys;
window.touchKeys = touchKeys;
window.gyroState = gyroState;
window.shiftGear = shiftGear;
window.recoverToTrackCenter = recoverToTrackCenter;
window.setPhysicsEdition = setPhysicsEdition;
window.setInputMode = setInputMode;
window.detectClientDevice = detectClientDevice;
window.clientDevice = clientDevice;
window.applyDeviceProfile = applyDeviceProfile;
window.triggerFinalLapBanner = triggerFinalLapBanner;
if (window.__apexTrace) window.__apexTrace('input.js', 'OK');