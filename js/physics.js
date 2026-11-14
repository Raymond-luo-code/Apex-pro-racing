// ============================================================================
// APEX PRO RACING // MODULE 4: DUAL-EDITION VEHICLE DYNAMICS & AI
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('physics.js', 'START');

      const CAR_HANDLING_PROFILES = {
        procedural: {
          name: 'APEX GT3 PROTOTYPE',
          wheelbase: 2.56,              // meters (short wheelbase = agile turn-in)
          maxSteerDeg: 23.5,            // front wheel mechanical lock (deg)
          baseMuLat: 1.48,              // baseline mechanical lateral grip
          understeerCoeff: 0.00095,     // Milliken understeer gradient (s^2/m^2)
          turnInAgility: 1.15,          // front axle responsiveness multiplier
          highSpeedLockFactor: 0.35,    // lock limit at 260+ km/h
          steerRampRate: 2.80,          // steering wheel deflection speed (rad/s)
          autoCenterDamping: 0.005,     // self-centering strength
          accelFactor: 1.00,
          aeroDragFactor: 1.00,
          brakeFactor: 1.00,
          weightKg: 1245
        },
        ferrari458: {
          name: 'FERRARI 458 ITALIA GT3',
          wheelbase: 2.65,              // mid-engine balanced wheelbase
          maxSteerDeg: 22.0,            // GT3 homologated mechanical lock
          baseMuLat: 1.46,              // progressive mechanical grip
          understeerCoeff: 0.00110,     // balanced mid-engine understeer gradient
          turnInAgility: 1.10,          // smooth mid-engine turn-in
          highSpeedLockFactor: 0.31,    // higher high-speed stability
          steerRampRate: 2.60,
          autoCenterDamping: 0.006,
          accelFactor: 1.03,
          aeroDragFactor: 0.985,
          brakeFactor: 1.00,
          weightKg: 1215
        },
        porsche911: {
          name: 'PORSCHE 911 GT3 R (992)',
          wheelbase: 2.50,              // short rear-engine wheelbase
          maxSteerDeg: 24.0,            // agile steering lock
          baseMuLat: 1.52,
          understeerCoeff: 0.00082,     // sharp front bite on trail braking
          turnInAgility: 1.24,
          highSpeedLockFactor: 0.33,
          steerRampRate: 2.85,
          autoCenterDamping: 0.005,
          accelFactor: 1.055,           // RR traction advantage out of corners
          aeroDragFactor: 0.995,
          brakeFactor: 1.045,           // rear engine weight distribution aids four-wheel braking
          weightKg: 1250
        },
        amggt3: {
          name: 'MERCEDES-AMG GT3 EVO',
          wheelbase: 2.66,              // front-mid engine long wheelbase tourer
          maxSteerDeg: 21.5,
          baseMuLat: 1.43,
          understeerCoeff: 0.00122,     // rock-solid high-speed stability
          turnInAgility: 1.02,
          highSpeedLockFactor: 0.29,    // extremely stable at high speed
          steerRampRate: 2.45,
          autoCenterDamping: 0.0065,
          accelFactor: 1.04,            // 6.2L V8 torque
          aeroDragFactor: 0.955,        // highest straight-line top speed
          brakeFactor: 1.015,
          weightKg: 1285
        }
      };
      CAR_HANDLING_PROFILES.porsche911_locked = CAR_HANDLING_PROFILES.porsche911;
      CAR_HANDLING_PROFILES.amggt3_locked = CAR_HANDLING_PROFILES.amggt3;

      function getCurrentCarHandling() {
        const id = (typeof carAssetState !== 'undefined' && carAssetState && carAssetState.presetId) ? carAssetState.presetId : 'procedural';
        return CAR_HANDLING_PROFILES[id] || CAR_HANDLING_PROFILES.procedural;
      }

      // Phase 2: Three GT3 Racing Tire Compounds (Soft / Medium / Hard)
      const TIRE_COMPOUNDS = {
        soft: {
          id: 'soft',
          code: 'S',
          label: 'Soft 軟胎',
          enLabel: 'SOFT',
          color: '#ef4444',
          peakMuG: 1.65,
          slipWidthMult: 0.90,
          brakeBonus: 1.04,
          accelMult: 1.04,
          summary: '1.65G 極致抓地・排位單圈進彎犀利'
        },
        medium: {
          id: 'medium',
          code: 'M',
          label: 'Medium 中性胎',
          enLabel: 'MEDIUM',
          color: '#f59e0b',
          peakMuG: 1.52,
          slipWidthMult: 1.00,
          brakeBonus: 1.00,
          accelMult: 1.00,
          summary: '1.52G 全能均衡・正賽長距離首選'
        },
        hard: {
          id: 'hard',
          code: 'H',
          label: 'Hard 硬胎',
          enLabel: 'HARD',
          color: '#f8fafc',
          peakMuG: 1.42,
          slipWidthMult: 1.25,
          brakeBonus: 0.97,
          accelMult: 0.98,
          summary: '1.42G 耐操穩定・高容錯漸進滑動區間'
        }
      };

      function getCurrentTireProfile() {
        return TIRE_COMPOUNDS[simState.tireCompound] || TIRE_COMPOUNDS.medium;
      }

      function setTireCompound(compoundId) {
        if (!TIRE_COMPOUNDS[compoundId]) return;
        simState.tireCompound = compoundId;
      }


      const GEAR_RATIOS = [0, 3.35, 2.32, 1.74, 1.36, 1.10, 0.90];
      const GEAR_MAX_SPEED = [0, 68, 118, 166, 214, 258, 305];

      const simState = {
        edition: 'realistic',
        mode: 'time_attack',
        ghostTarget: 'both',
        aiDifficulty: 1.0,
        cameraMode: 2, // Default to Chase Cam (追尾視角) as requested!
        autoTransmission: true,
        showTacticalLine: true,
        isMobileGamepadActive: true,
        paused: true,
        inShowcaseMode: true,
        countdownActive: false,
        countdownTimer: 0,

        s: 0,
        d: 0,
        lap: 1,
        totalRaceLaps: 2,
        lapElapsed: 0,
        sector1Time: null,
        sector2Time: null,
        sector3Time: null,
        bestLapTime: PRO_LAP_TIME,
        pbTelemetrySamples: [],
        currentLapSamples: [],
        lastSampleS: -25,

        accelRunTimer: 0,
        bench0to100: null,
        bench0to200: null,
        bench0to300: null,

        speedMs: 0,
        speedKmh: 0,
        heading: 0,
        yawRate: 0,
        driftAngle: 0,
        gear: 1,
        rpm: 1200,
        throttleInput: 0,
        brakeInput: 0,
        steerInput: 0,

        nosAmount: 100,
        isNosActive: false,
        isDrifting: false,

        longG: 0,
        latG: 0,
        pitchRad: 0,
        rollRad: 0,
        downforceKgf: 0,
        tireLoads: { fl: 340, fr: 340, rl: 360, rr: 360 },
        tireSlipRatio: 0,

        isBrakeLockup: false,
        isOversteer: false,
        isUndersteer: false,
        brakeNowWarning: false,
        wallScrapeWarning: false,
        inSlipstream: false,
        onKerb: false,
        offTrack: false,
        surfaceGrip: 1.0,

        lockupCount: 0,
        understeerCount: 0,
        oversteerCount: 0,

        isWrongWay: false,
        reverseHoldTimer: 0,
        finalLapBannerTimer: 0,
        proximityRadar: { left: false, right: false, behind: false },

        // Module 3: Sequential Checkpoints & Anti-Cheat Validation System
        lastClearedGate: 0,
        clearedGates: [0],
        gateCount: 16,
        isLapValid: true,
        lapInvalidReason: null,
        lapInvalidBannerTimer: 0,
        lastGateTime: 0,
        startLineLocked: false,

        // Module 2: Suspension Deflection & Surface Feedback
        suspensionDispY: 0,
        suspensionVelY: 0,
        chassisVibrationAmp: 0,
        steerResistance: 1.0,
        kerbTime: 0,

        // Module 1: Inspect Mode
        inspectMode: false,

        // Phase 1: FIA 5-Red-Light Gantry Start & Jump Start Penalty
        gantryHoldDuration: 1.0,
        gantryElapsed: 0,
        gantryStage: 0,
        gantryGoBannerTimer: 0,
        hasJumpStarted: false,
        jumpStartPenaltySec: 0,

        // Phase 1: Progressive 3-Tier Track & HUD Driving Guidance
        drivingCue: 'none', // 'none' | 'lift' | 'trail' | 'heavy'
        cueTargetKmh: 300,

        // Phase 2: Tire Compound, Ignition Cut & Rigid-Body Collision State
        tireCompound: 'medium',
        ignitionCutTimer: 0,
        _autoShiftCooldown: 0,
        _backfireCooldown: 0,
        colLatVel: 0,
        _inCollisionContact: 0,
        _snapCameraNow: true,
        _lastCollisionFxMs: 0
      };

      const aiCars = [
        {
          id: 'ai-1',
          name: 'K. TAKAHASHI #7',
          color: 0xf59e0b,
          s: 42,
          d: -2.0,
          speedMs: 28,
          lap: 1,
          basePace: 1.045,
          stateLabel: 'OPTIMAL LINE',
          reactionTimer: 0,
          throttleInput: 0,
          brakeInput: 0,
          steerInput: 0,
          heading: 0,
          yawRate: 0,
          vLat: 0,
          spinTimer: 0,
          colVelD: 0,
          colHeadingOffset: 0,
          mesh: null
        },
        {
          id: 'ai-2',
          name: 'M. VERSTAPPEN #1',
          color: 0x3b82f6,
          s: 26,
          d: 2.2,
          speedMs: 27,
          lap: 1,
          basePace: 1.032,
          stateLabel: 'OPTIMAL LINE',
          reactionTimer: 0,
          throttleInput: 0,
          brakeInput: 0,
          steerInput: 0,
          heading: 0,
          yawRate: 0,
          vLat: 0,
          spinTimer: 0,
          colVelD: 0,
          colHeadingOffset: 0,
          mesh: null
        },
        {
          id: 'ai-3',
          name: 'L. NORRIS #4',
          color: 0xa855f7,
          s: 12,
          d: -2.4,
          speedMs: 26,
          lap: 1,
          basePace: 1.018,
          stateLabel: 'OPTIMAL LINE',
          reactionTimer: 0,
          throttleInput: 0,
          brakeInput: 0,
          steerInput: 0,
          heading: 0,
          yawRate: 0,
          vLat: 0,
          spinTimer: 0,
          colVelD: 0,
          colHeadingOffset: 0,
          mesh: null
        }
      ];

      aiCars.forEach(ai => {
        ai.mesh = createGT3CarMesh(ai.color, false, 1.0);
        scene.add(ai.mesh);
      });

      function selectCircuit(index) {
        currentCircuitIndex = (index + CIRCUITS.length) % CIRCUITS.length;
        currentCircuit = CIRCUITS[currentCircuitIndex];

        buildTrackGeometryData();
        generateProBenchmarkLap();
        rebuild3DCircuitScene();

        simState.bestLapTime = currentCircuit.proLapTime;
        simState.pbTelemetrySamples = [];
        document.getElementById('hud-best-time').textContent = formatLapTime(simState.bestLapTime);
        document.getElementById('lbl-track-short').textContent = currentCircuit.shortLabel;
        document.getElementById('hud-track-badge').textContent = currentCircuit.badgeText;

        headlightGroup.visible = currentCircuit.theme.isNight;

        [0, 1, 2].forEach(i => {
          const card = document.getElementById(`card-track-${i}`);
          if (!card) return;
          const borderColors = ['border-emerald-400', 'border-indigo-400', 'border-rose-400'];
          card.className = (i === currentCircuitIndex)
            ? `cursor-pointer rounded-xl p-3.5 border-2 ${borderColors[i]} bg-slate-900 transition`
            : 'cursor-pointer rounded-xl p-3.5 border-2 border-slate-800 bg-slate-900 transition';
        });

        resetSession(!simState.inShowcaseMode);
      }

      function resetSession(triggerCountdown = true) {
        simState.s = 0;
        simState.d = 0;
        simState.lap = 1;
        simState.lapElapsed = 0;
        simState.sector1Time = null;
        simState.sector2Time = null;
        simState.sector3Time = null;
        simState.currentLapSamples = [];
        simState.lastCompletedLapSamples = [];
        simState.lastSampleS = -25;

        simState.accelRunTimer = 0;
        simState.bench0to100 = null;
        simState.bench0to200 = null;
        simState.bench0to300 = null;
        document.getElementById('bench-0-100').textContent = '--.--s';
        document.getElementById('bench-0-200').textContent = '--.--s';
        document.getElementById('bench-0-300').textContent = '--.--s';

        const startNode = sampleTrackAtS(0);
        simState.heading = startNode.heading;
        simState.speedMs = 0;
        simState.speedKmh = 0;
        simState.gear = 1;
        simState.rpm = 1200;
        simState.yawRate = 0;
        simState.driftAngle = 0;
        simState.nosAmount = 100;
        simState.isNosActive = false;
        simState.isDrifting = false;
        simState.wallScrapeWarning = false;
        simState.lockupCount = 0;
        simState.understeerCount = 0;
        simState.oversteerCount = 0;
        simState.isWrongWay = false;
        simState.reverseHoldTimer = 0;
        simState.sessionLapTimes = [];
        simState.sessionTopSpeed = 0;

        // Reset Checkpoints & Anti-Cheat Validation
        simState.lastClearedGate = 0;
        simState.clearedGates = [0];
        simState.lastGateTime = 0;
        simState.isLapValid = true;
        simState.lapInvalidReason = null;
        simState.lapInvalidBannerTimer = 0;
        simState.startLineLocked = false;
        simState.suspensionDispY = 0;
        simState.suspensionVelY = 0;
        simState.kerbTime = 0;

        document.getElementById('hud-s1').textContent = '--.---';
        document.getElementById('hud-s2').textContent = '--.---';
        document.getElementById('hud-s3').textContent = '--.---';
        document.getElementById('hud-lap-count').textContent =
          simState.mode === 'ai_race' ? `1 / ${simState.totalRaceLaps}` : '1';

        simState.hasJumpStarted = false;
        simState.jumpStartPenaltySec = 0;
        simState.gantryGoBannerTimer = 0;
        simState.gantryElapsed = 0;
        simState.gantryStage = 0;
        simState.drivingCue = 'none';
        simState.cueTargetKmh = 300;
        simState.ignitionCutTimer = 0;
        simState._autoShiftCooldown = 0;
        simState._backfireCooldown = 0;
        simState.colLatVel = 0;
        simState._inCollisionContact = 0;
        simState._snapCameraNow = true;
        simState._lastCollisionFxMs = 0;

        const startOverlay = document.getElementById('start-lights-overlay');
        if (triggerCountdown && !simState.inShowcaseMode) {
          // Phase 1: FIA Standard 5-Red-Light Gantry Start + Random 0.25-2.0s Hold
          simState.countdownActive = true;
          simState.gantryHoldDuration = Number((0.25 + Math.random() * 1.75).toFixed(2));
          simState.countdownTimer = 3.40 + simState.gantryHoldDuration;
          simState.lastBeepStage = 0;
          updateCountdownUI();
          if (startOverlay) startOverlay.classList.remove('hidden');
        } else {
          simState.countdownActive = false;
          simState.countdownTimer = 0;
          if (startOverlay) startOverlay.classList.add('hidden');
        }

        const gridOffsets = [26, 17, 8];
        aiCars.forEach((ai, idx) => {
          ai.s = gridOffsets[idx];
          ai.d = (idx % 2 === 0) ? -3.0 : 3.0;
          ai.speedMs = 0; // Standing start on the grid waiting for Lights Out!
          ai.lap = 1;
          ai.reactionTimer = 0.04 + Math.random() * 0.14;
          ai.throttleInput = 0;
          ai.brakeInput = 0;
          ai.steerInput = 0;
          ai.yawRate = 0;
          ai.vLat = 0;
          ai.spinTimer = 0;
          ai.colVelD = 0;
          ai.colHeadingOffset = 0;
          ai.stateLabel = 'GRID READY';
          ai.mesh.visible = (!simState.inShowcaseMode && simState.mode === 'ai_race');
          const w = sdToWorld(ai.s, ai.d);
          ai.heading = w.heading;
          ai.mesh.position.set(w.x, w.y, w.z);
          ai.mesh.rotation.y = -w.heading;
        });
      }

      function updateCountdownUI() {
        const overlay = document.getElementById('start-lights-overlay');
        const numEl = document.getElementById('start-countdown-num');
        const pods = document.querySelectorAll('#start-lights-pods span');
        if (!overlay || !numEl) return;

        if (!simState.countdownActive && (simState.gantryGoBannerTimer || 0) <= 0) {
          overlay.classList.add('hidden');
          return;
        }
        overlay.classList.remove('hidden');

        if (simState.countdownActive) {
          const litCount = Math.min(5, Math.floor(simState.gantryElapsed / 0.85) + 1);
          if (simState.lastBeepStage !== litCount) {
            simState.lastBeepStage = litCount;
            soundEngine.playCountdownBeep(false);
          }
          numEl.textContent = simState.hasJumpStarted
            ? 'JUMP START! (+5.0s PENALTY)'
            : (litCount < 5 ? `STAND BY // LIGHT ${litCount} / 5` : 'HOLD LAUNCH // ALL RED ON');
          numEl.className = 'text-xl font-mono-tech font-extrabold text-red-400 tracking-wider';
          pods.forEach((p, idx) => {
            p.style.backgroundColor = idx < litCount ? '#ef4444' : '#0f172a';
            p.style.boxShadow = idx < litCount ? '0 0 16px #ef4444' : 'none';
            p.style.borderColor = idx < litCount ? '#fca5a5' : '#475569';
          });
        } else {
          // Lights out simultaneous launch!
          numEl.textContent = simState.hasJumpStarted ? 'GO! (+5.0s JUMP START PENALTY)' : 'LIGHTS OUT · AWAY WE GO!';
          numEl.className = simState.hasJumpStarted
            ? 'text-xl font-mono-tech font-extrabold text-amber-400 tracking-wider'
            : 'text-xl font-mono-tech font-extrabold text-emerald-400 tracking-wider';
          pods.forEach(p => {
            p.style.backgroundColor = '#0f172a';
            p.style.boxShadow = '0 0 14px rgba(16, 185, 129, 0.45)';
            p.style.borderColor = '#10b981';
          });
        }
      }

      // --------------------------------------------------------------------------
      // 7A. INPUT LAYER TRANSLATION (SHARED BY PLAYER & AI ACTUATORS)
      // Translates binary keystrokes or AI control intentions into human-like
      // analog muscle travel (0.18s lift decay, 0.03s brake cut, 0.35s throttle
      // ramp, 0.15s->72% / 0.40s->100% brake ramp, speed-sensitive S-curve steer).
      // --------------------------------------------------------------------------
      function smoothstepBand(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(0.0001, edge1 - edge0)));
        return t * t * (3 - 2 * t);
      }

      function translateAnalogPedals(state, rawThrottle, rawBrake, isTrailBrake, dt, throttleTargetCap = 100) {
        // --- Throttle Control ---
        if (rawBrake || isTrailBrake) {
          // Emergency deceleration: cut throttle immediately within 0.03 seconds
          state.throttleInput = Math.max(0, state.throttleInput - (100 / 0.03) * dt);
        } else if (rawThrottle) {
          // Progressive Acceleration Ramp: 0->45% in first 0.20s, 45->100% over next 0.15s (0.35s total)
          const stageRate = state.throttleInput < 45 ? 225.0 : 366.67;
          if (state.throttleInput <= throttleTargetCap) {
            state.throttleInput = Math.min(throttleTargetCap, state.throttleInput + stageRate * dt);
          } else {
            // Smoothly decay down if target cap is lowered (e.g. AI partial corner throttle)
            state.throttleInput = Math.max(throttleTargetCap, state.throttleInput - 454.55 * dt);
          }
        } else {
          // Progressive Lift-off Decay: smoothly decays over 0.18s, tapering through 50%
          const liftRate = state.throttleInput > 50 ? 714.29 : 454.55;
          state.throttleInput = Math.max(0, state.throttleInput - liftRate * dt);
        }

        // --- Braking Control ---
        if (rawBrake) {
          // Stage 1 (0.00-0.15s): ramps smoothly to 72% (Trail Braking window)
          // Stage 2 (0.15-0.40s): continues ramping to 100% (straight-line heavy braking)
          const brkRate = state.brakeInput < 72 ? 480.0 : 112.0;
          state.brakeInput = Math.min(100, state.brakeInput + brkRate * dt);
        } else if (isTrailBrake) {
          // Dedicated Spacebar assist: smoothly capped at 75% (below manual 85-88% threshold)
          const cap = 75.0;
          if (state.brakeInput < cap) {
            state.brakeInput = Math.min(cap, state.brakeInput + 480.0 * dt);
          } else {
            state.brakeInput = Math.max(cap, state.brakeInput - 1250.0 * dt);
          }
        } else {
          // Fast Release Decay: drops to 0% within 0.08s for clean corner-exit acceleration
          state.brakeInput = Math.max(0, state.brakeInput - 1250.0 * dt);
        }
      }

      function getDynamicMaxSteerDeg(spdKmh, carProfile, isReal) {
        const spd = Math.max(0, Math.abs(spdKmh));
        const chassisBias = ((carProfile && carProfile.maxSteerDeg ? carProfile.maxSteerDeg : 22.0) - 22.0) * 0.45;
        let maxDeg;
        if (spd <= 45) {
          // Low speed (0-45 km/h): high authority up to 32 deg for tight hairpins
          maxDeg = 32.0 + chassisBias * 0.8;
        } else if (spd <= 80) {
          const s = smoothstepBand(45, 80, spd);
          maxDeg = 32.0 - s * 14.0 + chassisBias * (0.8 - s * 0.4);
        } else if (spd <= 180) {
          // Mid speed (80-180 km/h): progressive damping within 13.8-18.0 deg
          const s = smoothstepBand(80, 180, spd);
          maxDeg = 18.0 - s * 4.2 + chassisBias * 0.35;
        } else if (spd <= 235) {
          // High speed (180-235 km/h): generous authority (9.8-13.8 deg) for sweepers & lane corrections
          const s = smoothstepBand(180, 235, spd);
          maxDeg = 13.8 - s * 4.0 + chassisBias * (0.35 - s * 0.1);
        } else {
          // Top speed (> 235 km/h): ~8.2-9.8 deg so high-speed turn-in never feels locked out
          const s = smoothstepBand(235, 310, spd);
          maxDeg = 9.8 - s * 1.6 + chassisBias * 0.25;
        }
        return isReal ? maxDeg : Math.min(34.0, maxDeg * 1.15);
      }

      function stepAnalogSteering(currentSteer, rawLeft, rawRight, spdKmh, dt, carProfile, isReal) {
        const speedNorm = Math.min(1.0, Math.max(0.0, (Math.abs(spdKmh) - 30) / 210));
        const baseRate = carProfile.steerRampRate * 1.15 * (1.0 - speedNorm * 0.26);
        let steer = currentSteer;
        if (rawLeft) {
          // Counter-steer agility boost when rapidly changing direction (e.g. chicanes / S-bends)
          const rate = (steer > 0.03) ? baseRate * 1.95 : baseRate;
          steer = Math.max(-1.0, steer - rate * dt);
        } else if (rawRight) {
          const rate = (steer < -0.03) ? baseRate * 1.95 : baseRate;
          steer = Math.min(1.0, steer + rate * dt);
        } else {
          // Damped Self-Aligning Torque: gentle return (~150-220ms half-life) allows smooth keyboard/touch tapping
          const casterRate = (1.9 + Math.min(2.5, (Math.abs(spdKmh) / 100.0) * 1.25)) * (isReal ? 1.0 : 1.12);
          steer *= Math.exp(-casterRate * dt);
          if (Math.abs(steer) < 0.003) steer = 0;
        }
        return steer;
      }

      // Phase 1: Three-Tier Progressive Corner Guidance Solver
      // Classifies upcoming corner demand into 'none', 'lift', 'trail', or 'heavy'
      // to prevent panic stomping that induces ABS lockup and corner-exit speed loss.
      function computeDrivingCue(s, currSpeedKmh, brkNorm, thrNorm) {
        if (currSpeedKmh < 45) return { tier: 'none', targetKmh: 300, reqDecel: 0 };
        const maxScan = Math.min(165, Math.max(55, currSpeedKmh * 0.68));
        let minTargetKmh = 300;
        let distToMin = maxScan;
        let maxCurvAhead = 0;

        for (let off = 20; off <= maxScan; off += 25) {
          const p = getProProfileAtDistance(s + off);
          const n = sampleTrackAtS(s + off);
          const absC = Math.abs(n.curvature || 0);
          if (absC > maxCurvAhead) maxCurvAhead = absC;
          if (p.speedKmh < minTargetKmh) {
            minTargetKmh = p.speedKmh;
            distToMin = off;
          }
        }

        const proAhead = getProProfileAtDistance(s + 22);
        const vNow = currSpeedKmh / 3.6;
        const vTgt = minTargetKmh / 3.6;
        const reqDecel = (vNow > vTgt) ? (vNow * vNow - vTgt * vTgt) / (2 * Math.max(16, distToMin)) : 0;

        let tier = 'none';
        // Trigger braking/lift cues strictly by actual deceleration demand ahead (no early distance false positives)
        if (reqDecel > 6.8 || proAhead.brake > 62) {
          tier = (currSpeedKmh > minTargetKmh + 8) ? 'heavy' : 'trail';
        } else if (reqDecel > 2.6 || (proAhead.brake > 32 && proAhead.brake <= 62)) {
          tier = (currSpeedKmh > minTargetKmh + 5) ? 'trail' : (maxCurvAhead > 0.0018 && thrNorm > 0.60 ? 'lift' : 'none');
        } else if (reqDecel > 0.65 || (currSpeedKmh > minTargetKmh + 2 && maxCurvAhead > 0.0015 && thrNorm > 0.60) || (proAhead.brake >= 12 && currSpeedKmh > minTargetKmh + 2)) {
          tier = 'lift';
        }

        return { tier, targetKmh: Math.round(minTargetKmh), reqDecel };
      }

      function stepPhysics(dt) {
        if (simState.paused || simState.inShowcaseMode) return;
        const isReal = (simState.edition === 'realistic');
        simState.backfireFlameTimer = Math.max(0, (simState.backfireFlameTimer || 0) - dt);
        simState.ignitionCutTimer = Math.max(0, (simState.ignitionCutTimer || 0) - dt);
        simState._autoShiftCooldown = Math.max(0, (simState._autoShiftCooldown || 0) - dt);
        simState._backfireCooldown = Math.max(0, (simState._backfireCooldown || 0) - dt);
        simState._inCollisionContact = Math.max(0, (simState._inCollisionContact || 0) - dt);
        const prevThr = simState.throttleInput;
        const carProfile = getCurrentCarHandling();
        const tireProfile = getCurrentTireProfile();

        if (!manualThrottleDrag || !manualBrakeDrag) {
          const tempState = {
            throttleInput: simState.throttleInput,
            brakeInput: simState.brakeInput
          };
          const rawThr = inputs.throttle || (!isReal && inputs.nos);
          translateAnalogPedals(tempState, rawThr, inputs.brake, inputs.trailBrake, dt, 100);
          if (!manualThrottleDrag) {
            simState.throttleInput = tempState.throttleInput;
            sliderThrottle.value = String(Math.round(simState.throttleInput));
          }
          if (!manualBrakeDrag) {
            simState.brakeInput = tempState.brakeInput;
            sliderBrake.value = String(Math.round(simState.brakeInput));
          }
        }

        if (!manualSteerDrag) {
          const spdKmh = Math.abs(simState.speedKmh);
          if (gyroState.enabled && gyroState.active && !inputs.steerLeft && !inputs.steerRight) {
            simState.steerInput += (gyroState.steerVal - simState.steerInput) * Math.min(1.0, 14.0 * dt);
          } else {
            simState.steerInput = stepAnalogSteering(
              simState.steerInput, inputs.steerLeft, inputs.steerRight, spdKmh, dt, carProfile, isReal
            );
          }
          sliderSteer.value = String(Math.round(simState.steerInput * 100));
        }

        const thr = simState.throttleInput / 100;
        const brk = simState.brakeInput / 100;

        // Phase 1: FIA 5-Red-Light Gantry Start & Jump Start Detection
        if (simState.countdownActive) {
          simState.gantryElapsed += dt;
          const totalGantryTime = 3.40 + (simState.gantryHoldDuration || 1.0);
          simState.countdownTimer = Math.max(0, totalGantryTime - simState.gantryElapsed);

          if (simState.gantryElapsed >= totalGantryTime) {
            // Lights Out! Simultaneous launch
            simState.countdownActive = false;
            simState.countdownTimer = 0;
            simState.gantryGoBannerTimer = 1.15;
            soundEngine.playCountdownBeep(true);
            updateCountdownUI();
          } else {
            updateCountdownUI();
            if (brk > 0.10 || thr <= 0.15) {
              // Holding brake / idle: Launch clutch holds stationary while player revs engine!
              simState.speedMs = 0;
              simState.speedKmh = 0;
              simState.lapElapsed = 0;
              simState.rpm = Math.round(1200 + thr * 6800 + Math.sin(performance.now() * 0.04) * (thr * 180));
              if (simState.mode === 'ai_race') stepAIRivals(dt);
              return;
            } else {
              // Player dropped clutch / hit throttle BEFORE Lights Out! Allow creep & detect Jump Start (>0.5m)
              const creepAccel = thr * 6.5;
              simState.speedMs = Math.min(28, simState.speedMs + creepAccel * dt);
              simState.speedKmh = simState.speedMs * 3.6;
              simState.s += simState.speedMs * dt;
              simState.rpm = Math.round(1800 + thr * 6500);
              simState.lapElapsed = 0;
              if (simState.s > 0.5 && !simState.hasJumpStarted) {
                simState.hasJumpStarted = true;
                simState.jumpStartPenaltySec = 5.0;
                updateCountdownUI();
              }
              if (simState.mode === 'ai_race') stepAIRivals(dt);
              return;
            }
          }
        } else if ((simState.gantryGoBannerTimer || 0) > 0) {
          simState.gantryGoBannerTimer = Math.max(0, simState.gantryGoBannerTimer - dt);
          updateCountdownUI();
        }

        const trackNode = sampleTrackAtS(simState.s);
        const halfW = TRACK_WIDTH * 0.5;
        const absD = Math.abs(simState.d);

        simState.onKerb = (absD >= halfW - 0.9 && absD <= halfW + 1.65);
        simState.offTrack = (absD > halfW + 1.65);

        // RFC Module 2: Surface Physics & Drag Penalties
        // Kerbs: Reduce tire friction to 85%; apply moderate steering resistance.
        // Grass / Run-off: Reduce grip to 35%–50% (0.42); force wheelspin on excess throttle.
        if (simState.offTrack) {
          simState.surfaceGrip = 0.42;
          simState.steerResistance = 1.0;
        } else if (simState.onKerb) {
          simState.surfaceGrip = 0.85;
          simState.steerResistance = 1.25;
        } else {
          simState.surfaceGrip = 1.00;
          simState.steerResistance = 1.00;
        }

        // RFC Module 2 & Proposal Sec. 5: Suspension Deflection + Lockup Chassis Shudder
        // Decoupled from camera rig — applied locally to vehicle chassis mesh
        let lockupShudder = 0;
        if ((simState.isBrakeLockup || simState.brakeInput > 88) && simState.speedKmh > 35) {
          const tNow = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
          lockupShudder = Math.sin(tNow * Math.PI * 2 * 13.5) * 0.0065;
        }
        if (simState.onKerb && simState.speedKmh > 10) {
          simState.kerbTime = (simState.kerbTime || 0) + dt;
          const omega = 2 * Math.PI * (28 + (simState.speedKmh / 300) * 20); // 28-48 Hz matching velocity
          const amp = Math.min(0.034, 0.010 + (simState.speedKmh / 280) * 0.024);
          const damping = Math.exp(-6.0 * (simState.kerbTime % 0.22));
          simState.suspensionDispY = amp * damping * Math.cos(omega * simState.kerbTime) + lockupShudder;
          simState.chassisVibrationAmp = amp;
        } else {
          simState.kerbTime = 0;
          simState.suspensionDispY = simState.suspensionDispY * Math.max(0, 1 - 20 * dt) + lockupShudder;
          simState.chassisVibrationAmp = Math.abs(lockupShudder);
        }

        // RFC Module 2: Route rumble signals to Gamepad vibration actuators (if connected)
        if ((simState.onKerb || simState.offTrack) && typeof window.triggerGamepadRumble === 'function') {
          const nowRumble = performance.now();
          if (!simState._lastRumbleMs || (nowRumble - simState._lastRumbleMs) > 80) {
            simState._lastRumbleMs = nowRumble;
            if (simState.onKerb && simState.speedKmh > 10) {
              window.triggerGamepadRumble(0.35, 0.45, 75);
            } else if (simState.offTrack && simState.throttleInput > 15) {
              window.triggerGamepadRumble(0.20, 0.28, 75);
            }
          }
        }

        const vMs = simState.speedMs;
        simState.downforceKgf = Math.round(0.68 * vMs * vMs);

        simState.inSlipstream = false;
        const wakeTargets = (simState.mode === 'ai_race')
          ? aiCars.map(a => ({ s: a.s, d: a.d }))
          : [];

        for (const target of wakeTargets) {
          let ds = target.s - simState.s;
          if (ds < -totalTrackLength * 0.5) ds += totalTrackLength;
          const dd = Math.abs(target.d - simState.d);
          if (ds > 4 && ds < 56 && dd < 3.2 && simState.speedKmh > 120) {
            simState.inSlipstream = true;
            break;
          }
        }

        if (!isReal) {
          simState.isDrifting = inputs.drift && simState.speedKmh > 55 && Math.abs(simState.steerInput) > 0.12;
          simState.isNosActive = inputs.nos && simState.nosAmount > 1.5 && brk < 0.1;
          if (simState.isNosActive) {
            simState.nosAmount = Math.max(0, simState.nosAmount - 24 * dt);
          } else {
            const nosRecharge = (simState.isDrifting ? 18 : 0) + (simState.inSlipstream ? 12 : 0) + 2.5;
            simState.nosAmount = Math.min(100, simState.nosAmount + nosRecharge * dt);
          }
        } else {
          simState.isDrifting = false;
          simState.isNosActive = false;
        }

        if (simState.autoTransmission) {
          if (simState.gear === -1) {
            // In Reverse: pressing gas shifts back to 1st gear if stopped or forward throttle pressed
            if (thr > 0.12 && simState.speedKmh < 4) {
              simState.gear = 1;
              simState.reverseHoldTimer = 0;
              document.getElementById('hud-gear').textContent = '1';
            }
          } else {
            // In Forward: holding brake when nearly stopped shifts to Reverse (R檔)
            if (simState.speedKmh < 2.0 && brk > 0.35) {
              simState.reverseHoldTimer = (simState.reverseHoldTimer || 0) + dt;
              if (simState.reverseHoldTimer > 0.22) {
                simState.gear = -1;
                document.getElementById('hud-gear').textContent = 'R';
              }
            } else {
              simState.reverseHoldTimer = 0;
              if ((simState._autoShiftCooldown || 0) <= 0) {
                let targetGear = simState.gear;
                // Wide hysteresis band between upshift (92% gear max) and downshift (78% lower gear max)
                // prevents high-frequency gear hunting during 0.08s ignition cut or cornering drag
                while (targetGear < 6 && simState.speedKmh >= GEAR_MAX_SPEED[targetGear] * 0.92) {
                  targetGear++;
                }
                while (targetGear > 1 && simState.speedKmh < GEAR_MAX_SPEED[targetGear - 1] * 0.78) {
                  targetGear--;
                }
                if (targetGear !== simState.gear) {
                  const isUpshift = (targetGear > simState.gear && simState.gear >= 1);
                  simState.gear = targetGear;
                  simState._autoShiftCooldown = 0.25;
                  document.getElementById('hud-gear').textContent = String(targetGear);
                  if (isUpshift) {
                    simState.ignitionCutTimer = 0.08;
                  }
                  if (typeof soundEngine !== 'undefined' && soundEngine) {
                    if (typeof soundEngine.triggerShiftClunk === 'function') soundEngine.triggerShiftClunk(isUpshift);
                    if (!isUpshift && typeof soundEngine.blipShift === 'function') soundEngine.blipShift();
                  }
                  // Subtle crisp exhaust pop on downshift or high-load upshift (strictly debounced)
                  if ((simState._backfireCooldown || 0) <= 0 && (isUpshift ? thr > 0.5 : (simState.speedKmh > 65 && thr < 0.35))) {
                    simState._backfireCooldown = 0.28;
                    simState.backfireFlameTimer = 0.11;
                    if (typeof soundEngine !== 'undefined' && soundEngine && typeof soundEngine.triggerBackfire === 'function') {
                      soundEngine.triggerBackfire();
                    }
                    const wPos = sdToWorld(simState.s, simState.d);
                    spawnTireSmoke(
                      wPos.x - Math.cos(simState.heading) * 2.3,
                      wPos.y,
                      wPos.z - Math.sin(simState.heading) * 2.3,
                      'backfire'
                    );
                  }
                }
              }
            }
          }
        }

        if (simState.gear === -1) {
          // ----------------------------------------------------------------------
          // REVERSE GEAR DYNAMICS: Brake pedal = Reverse Gas, Gas pedal = Reverse Brake
          // ----------------------------------------------------------------------
          const revGas = brk;
          const revBrake = thr;
          const maxRevSpeedMs = 10.0; // ~36 km/h max reverse
          if (revGas > 0.05) {
            const revDriveAccel = revGas * 5.8 * simState.surfaceGrip;
            simState.speedMs = Math.min(maxRevSpeedMs, simState.speedMs + revDriveAccel * dt);
          } else if (revBrake > 0.05) {
            simState.speedMs = Math.max(0, simState.speedMs - 16.0 * dt);
            if (simState.speedMs < 0.2 && simState.autoTransmission) {
              simState.gear = 1;
              document.getElementById('hud-gear').textContent = '1';
            }
          } else {
            simState.speedMs = Math.max(0, simState.speedMs - 4.5 * dt);
          }
          simState.speedKmh = simState.speedMs * 3.6;
          simState.longG = -1.2 * (revGas > 0.05 ? 1 : -0.5);
          simState.rpm = Math.round(1150 + (simState.speedKmh / 36) * 3800);
        } else {
          // ----------------------------------------------------------------------
          // FORWARD GEAR DYNAMICS (Gears 1 - 6)
          // ----------------------------------------------------------------------
          const gearMaxV = GEAR_MAX_SPEED[simState.gear] || 305;
          const normRpm = Math.min(1.03, Math.max(0.16, simState.speedKmh / gearMaxV));
          simState.rpm = Math.round(1150 + normRpm * 7650);
          const revLimiterCut = (!simState.autoTransmission && simState.rpm > 8780) ? 0.10 : 1.0;

          // Calibrated 0-100 km/h (3.48s) and 0-300 km/h (~40s) Power & Drag Model + Per-Chassis & Tire Multipliers
          const vEff = Math.max(vMs, 12.5);
          const accelMult = (carProfile.accelFactor || 1.0) * (tireProfile.accelMult || 1.0);
          const dragMult = carProfile.aeroDragFactor || 1.0;
          const brakeMult = (carProfile.brakeFactor || 1.0) * (tireProfile.brakeBonus || 1.0);
          const maxMechanicalGripAccel = 8.25 * accelMult;
          const specificPower = 338.0 * accelMult;
          const rawEngineAccel = Math.min(maxMechanicalGripAccel, specificPower / vEff);

          const aeroDragCoeff = (simState.inSlipstream ? 0.00046 : 0.000557) * dragMult;
          // RFC Module 2: Grass / Run-off rolling resistance increased by factor of 3
          const rollingResistance = simState.offTrack ? (3.45 + 0.075 * vMs) : 0.14;
          const corneringInducedDrag = Math.abs(simState.latG) * 0.38;
          const dragAccel = aeroDragCoeff * vMs * vMs + rollingResistance + corneringInducedDrag;

          const lockupThreshold = 0.88 + (simState.downforceKgf / 6500);
          simState.isBrakeLockup = (brk > lockupThreshold && simState.speedKmh > 45);
          if (simState.isBrakeLockup && Math.random() < 0.08) simState.lockupCount++;

          const effectiveBrakeDecel = (simState.isBrakeLockup
            ? 12.8 * simState.surfaceGrip
            : brk * 19.2 * simState.surfaceGrip) * brakeMult;

          // High-RPM throttle lift-off turbo blow-off flutter & exhaust pop (strictly debounced)
          if (prevThr > 65 && simState.throttleInput <= 25 && simState.speedKmh > 115 && (simState._backfireCooldown || 0) <= 0) {
            simState._backfireCooldown = 0.28;
            simState.backfireFlameTimer = 0.11;
            if (typeof soundEngine !== 'undefined' && soundEngine) {
              if (typeof soundEngine.triggerTurboFlutter === 'function') soundEngine.triggerTurboFlutter();
              if (typeof soundEngine.triggerBackfire === 'function') soundEngine.triggerBackfire();
            }
          }

          const shiftCutMult = (simState.ignitionCutTimer > 0) ? 0.12 : 1.0;
          const driveAccel = thr * rawEngineAccel * revLimiterCut * shiftCutMult * simState.surfaceGrip;
          const nosBoostAccel = simState.isNosActive ? 4.8 : 0;
          const engineBraking = (thr < 0.05 && vMs > 1) ? 0.65 : 0;

          const netLongAccel = driveAccel + nosBoostAccel - effectiveBrakeDecel - dragAccel - engineBraking;
          simState.speedMs = Math.max(0, simState.speedMs + netLongAccel * dt);
          simState.speedKmh = simState.speedMs * 3.6;
          if (simState.speedKmh > (simState.sessionTopSpeed || 0)) {
            simState.sessionTopSpeed = simState.speedKmh;
          }
          simState.longG = netLongAccel / 9.81;

          if (simState.speedKmh > 0.5) {
            simState.accelRunTimer += dt;
            if (simState.bench0to100 === null && simState.speedKmh >= 100) {
              simState.bench0to100 = simState.accelRunTimer;
              document.getElementById('bench-0-100').textContent = simState.bench0to100.toFixed(2) + 's';
            }
            if (simState.bench0to200 === null && simState.speedKmh >= 200) {
              simState.bench0to200 = simState.accelRunTimer;
              document.getElementById('bench-0-200').textContent = simState.bench0to200.toFixed(2) + 's';
            }
            if (simState.bench0to300 === null && simState.speedKmh >= 299.0) {
              simState.bench0to300 = simState.accelRunTimer;
              document.getElementById('bench-0-300').textContent = simState.bench0to300.toFixed(2) + 's';
            }
          }
        }

        const baseWeightKg = 1400 + simState.downforceKgf;
        const longShiftKg = Math.max(-290, Math.min(320, -simState.longG * 185));
        const latShiftKg = Math.max(-280, Math.min(280, simState.latG * 165));

        simState.tireLoads.fl = Math.round(Math.max(80, baseWeightKg * 0.24 + longShiftKg * 0.5 + latShiftKg * 0.5));
        simState.tireLoads.fr = Math.round(Math.max(80, baseWeightKg * 0.24 + longShiftKg * 0.5 - latShiftKg * 0.5));
        simState.tireLoads.rl = Math.round(Math.max(80, baseWeightKg * 0.26 - longShiftKg * 0.5 + latShiftKg * 0.5));
        simState.tireLoads.rr = Math.round(Math.max(80, baseWeightKg * 0.26 - longShiftKg * 0.5 - latShiftKg * 0.5));

        // Realistic Tire Traction Circle & Smooth Load-Transfer Cornering Limit
        const trailBlend = (brk > 0.04 && brk <= 0.84)
          ? Math.min(1.0, (brk - 0.04) / 0.18) * (brk > 0.65 ? Math.max(0, 1.0 - (brk - 0.65) / 0.19) : 1.0)
          : 0;
        const trailBrakeBonus = 1.0 + trailBlend * 0.12;

        // Smooth longitudinal-to-lateral weight transfer (replaces hard 0.78 step switch at 75% throttle)
        const thrLoad = Math.max(0, (thr - 0.35) / 0.65);
        const steerLoad = Math.min(1.0, Math.abs(simState.steerInput) / 0.55);
        const chassisPowerPush = (carProfile.understeerCoeff || 0.001) * 75.0; // ~6.2% (911) to ~9.2% (AMG)
        const throttleWeightTransfer = 1.0 - thrLoad * steerLoad * chassisPowerPush;
        const lockupPenalty = simState.isBrakeLockup ? 0.30 : 1.0;

        const baseMuLat = (isReal ? carProfile.baseMuLat : (carProfile.baseMuLat * 1.48)) * (tireProfile.peakMuG / 1.52);
        const aeroBonusG = (simState.downforceKgf / carProfile.weightKg) * 0.45;
        const maxLatG = (baseMuLat + aeroBonusG) * simState.surfaceGrip * trailBrakeBonus * throttleWeightTransfer * lockupPenalty;
        const maxLatAccelMs2 = maxLatG * 9.81;

        // Grip-Aware Progressive Steering Mapping (eliminates cubic S-curve deadzone & early 5G saturation)
        const dynMaxSteerDeg = getDynamicMaxSteerDeg(simState.speedKmh, carProfile, isReal);
        const maxFrontWheelRad = (dynMaxSteerDeg * Math.PI) / 180;
        const absSteer = Math.abs(simState.steerInput);
        const highSpeedBlend = Math.min(1.0, Math.max(0.0, (Math.abs(simState.speedKmh) - 100) / 120));
        const shapedNorm = absSteer * (1.0 - highSpeedBlend) + Math.pow(absSteer, 1.18) * highSpeedBlend;
        const frontWheelAngle = Math.sign(simState.steerInput) * shapedNorm * maxFrontWheelRad;

        const understeerDamping = 1.0 + (carProfile.understeerCoeff || 0.001) * vMs * vMs;
        const rawLinearCurv = (Math.tan(frontWheelAngle) / carProfile.wheelbase) / understeerDamping;
        const rawFullLockCurv = (Math.tan(maxFrontWheelRad) / carProfile.wheelbase) / understeerDamping;

        // High speed turning is physically bounded by tire friction circle: kappa_grip = a_y / v^2
        const vEff = Math.max(vMs, 2.0);
        const gripLimitedCurvature = maxLatAccelMs2 / (vEff * vEff);
        let linearCurvature = rawLinearCurv;
        if (vMs > 14.0 && !manualSteerDrag && rawFullLockCurv > gripLimitedCurvature * 1.26) {
          linearCurvature = Math.sign(simState.steerInput) * shapedNorm * (gripLimitedCurvature * 1.26);
        }
        const desiredLatAccel = vMs * vMs * Math.abs(linearCurvature);

        simState.isUndersteer = false;
        simState.isOversteer = false;
        let actualCurvature = linearCurvature;

        // Gradual Peak Slip Plateau scaled by tire compound slip window
        if (desiredLatAccel > maxLatAccelMs2 && vMs > 10.0) {
          const overRatio = desiredLatAccel / Math.max(0.1, maxLatAccelMs2);
          const plateauSpan = 0.25 * (tireProfile.slipWidthMult || 1.0);
          let slipPlateau = 0.98;
          if (isReal) {
            if (overRatio <= 1.0 + plateauSpan) {
              slipPlateau = 1.0 - ((overRatio - 1.0) / plateauSpan) * 0.03;
            } else {
              const dropSlope = 0.18 / Math.max(0.75, tireProfile.slipWidthMult || 1.0);
              slipPlateau = Math.max(0.90, 0.97 - (overRatio - (1.0 + plateauSpan)) * dropSlope);
            }
          }
          actualCurvature = Math.sign(linearCurvature) * gripLimitedCurvature * slipPlateau;
        }

        // Understeer alert ONLY triggers when player carries excessive corner speed into a turn
        // and front tires are severely grip-saturated:
        const cornerMaxKmh = getUpcomingCornerMaxSpeedKmh(simState.s);
        const isCarryingExcessSpeed = (simState.speedKmh > cornerMaxKmh + 16);
        const isGripSaturated = (desiredLatAccel > maxLatAccelMs2 * 1.15);
        if (isCarryingExcessSpeed && isGripSaturated && vMs > 12.0 && absSteer > 0.25) {
          simState.isUndersteer = true;
          if (Math.random() < 0.05) simState.understeerCount++;
        }

        let headingDiff = simState.heading - trackNode.heading;
        while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
        while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

        let targetYawRate = 0;
        if (isReal) {
          const straightCentering = (!simState.offTrack && absSteer < 0.025 && Math.abs(simState.yawRate) < 0.04 && Math.abs(trackNode.curvature) < 0.0014 && Math.abs(headingDiff) < 0.10)
            ? -headingDiff * 0.38
            : 0;
          // Smooth speed-tapered turn-in agility (eliminates hard step discontinuity at 35 m/s = 126 km/h)
          const lowSpdBlend = 1.0 - smoothstepBand(75, 195, simState.speedKmh);
          const turnInBonus = (vMs > 2.5) ? (1.0 + (carProfile.turnInAgility - 1.0) * lowSpdBlend) : 1.0;
          targetYawRate = actualCurvature * vMs * turnInBonus + straightCentering;
          simState.driftAngle *= Math.pow(0.01, dt);
        } else {
          const arcadeAssist = simState.offTrack ? 0 : trackNode.curvature * vMs * 0.48;
          const driftBoost = simState.isDrifting ? 1.35 : 1.0;
          targetYawRate = arcadeAssist + actualCurvature * vMs * driftBoost * carProfile.turnInAgility - (simState.offTrack ? 0 : headingDiff * 0.95);
          if (simState.isDrifting) {
            const targetDrift = simState.steerInput * 0.24;
            simState.driftAngle += (targetDrift - simState.driftAngle) * Math.min(1, 8 * dt);
          } else {
            simState.driftAngle *= Math.pow(0.01, dt);
          }
        }
        // Asymmetric off-track grass pull yaw torque: running wheels onto grass tugs the car slightly toward the runoff when under load
        const offTrackPullYaw = (simState.offTrack && vMs > 10)
          ? Math.sign(simState.d) * (0.06 + Math.abs(simState.longG) * 0.08) * (isReal ? 1.0 : 0.45)
          : 0;
        targetYawRate += offTrackPullYaw;

        // Vehicle rotational moment of inertia; allow door-alignment torque while tires damp excessive runaway yaw spikes
        const yawDeviation = Math.abs(simState.yawRate - targetYawRate);
        const yawTrackRate = ((simState._inCollisionContact || 0) > 0)
          ? (yawDeviation > 0.85 ? 18.0 : 8.5)
          : 22.0;
        simState.yawRate += (targetYawRate - simState.yawRate) * Math.min(1.0, yawTrackRate * dt);
        if (Math.abs(simState.colLatVel || 0) > 3.2 || (Math.abs(headingDiff) > 0.35 && Math.abs(simState.yawRate) > 0.75)) {
          simState.isOversteer = true;
          if (Math.random() < 0.04) simState.oversteerCount++;
        }

        const reverseYawFactor = (simState.gear === -1) ? -1 : 1;
        simState.heading += simState.yawRate * reverseYawFactor * dt;
        simState.latG = (vMs * simState.yawRate) / 9.81;
        simState.tireSlipRatio = Math.min(1.35, Math.hypot(simState.latG / maxLatG, simState.longG / 2.2));

        // Phase 1: Progressive Driving Cue computation (tarmac line & subtle guidance; Heavy Brake HUD popup removed per user feedback)
        const cueRes = computeDrivingCue(simState.s, simState.speedKmh, brk, thr);
        simState.drivingCue = cueRes.tier;
        simState.cueTargetKmh = cueRes.targetKmh;
        simState.brakeNowWarning = false;

        const wPos = sdToWorld(simState.s, simState.d);
        const carYaw = simState.heading + simState.driftAngle;
        const fwdX = Math.cos(carYaw);
        const fwdZ = Math.sin(carYaw);
        const rightX = -Math.sin(carYaw);
        const rightZ = Math.cos(carYaw);

        // Dual rear-wheel & front-wheel independent ground smoke and twin tire skid marks!
        if (simState.isBrakeLockup || simState.isDrifting || simState.isUndersteer || simState.tireSlipRatio > 0.96) {
          const rlX = wPos.x - fwdX * 1.36 - rightX * 0.78;
          const rlZ = wPos.z - fwdZ * 1.36 - rightZ * 0.78;
          const rrX = wPos.x - fwdX * 1.36 + rightX * 0.78;
          const rrZ = wPos.z - fwdZ * 1.36 + rightZ * 0.78;

          if (simState.isDrifting || simState.tireSlipRatio > 0.96) {
            spawnSkidMark(rlX, wPos.y, rlZ, carYaw);
            spawnSkidMark(rrX, wPos.y, rrZ, carYaw);
          }
          if (simState.isBrakeLockup || simState.isUndersteer) {
            const flX = wPos.x + fwdX * 1.38 - rightX * 0.78;
            const flZ = wPos.z + fwdZ * 1.38 - rightZ * 0.78;
            const frX = wPos.x + fwdX * 1.38 + rightX * 0.78;
            const frZ = wPos.z + fwdZ * 1.38 + rightZ * 0.78;
            spawnSkidMark(flX, wPos.y, flZ, carYaw);
            spawnSkidMark(frX, wPos.y, frZ, carYaw);
            spawnTireSmoke(flX, wPos.y, flZ, 'smoke');
            spawnTireSmoke(frX, wPos.y, frZ, 'smoke');
          }
          if (simState.isDrifting || simState.tireSlipRatio > 0.98) {
            spawnTireSmoke(rlX, wPos.y, rlZ, 'smoke');
            spawnTireSmoke(rrX, wPos.y, rrZ, 'smoke');
          }
        }
        if (simState.isNosActive) {
          const backL_X = wPos.x - fwdX * 2.35 - rightX * 0.36;
          const backL_Z = wPos.z - fwdZ * 2.35 - rightZ * 0.36;
          const backR_X = wPos.x - fwdX * 2.35 + rightX * 0.36;
          const backR_Z = wPos.z - fwdZ * 2.35 + rightZ * 0.36;
          spawnTireSmoke(backL_X, wPos.y, backL_Z, 'nos');
          spawnTireSmoke(backR_X, wPos.y, backR_Z, 'nos');
        }
        updateSmokeParticles(dt);

        const targetPitch = Math.max(-0.065, Math.min(0.065, simState.longG * 0.028));
        const targetRoll = Math.max(-0.085, Math.min(0.085, simState.latG * 0.035));
        simState.pitchRad += (targetPitch - simState.pitchRad) * Math.min(1, 10 * dt);
        simState.rollRad += (targetRoll - simState.rollRad) * Math.min(1, 10 * dt);

        let relAngle = simState.heading - trackNode.heading;
        while (relAngle > Math.PI) relAngle -= Math.PI * 2;
        while (relAngle < -Math.PI) relAngle += Math.PI * 2;

        const motionSign = (simState.gear === -1) ? -1 : 1;
        const vMs_motion = motionSign * vMs;

        // RFC Module 3: Directional Dot Product Validation
        // Compute normalized track forward vector N at current s
        const aheadTrackNode = sampleTrackAtS((simState.s + 1.8) % totalTrackLength);
        let trkNx = aheadTrackNode.x - trackNode.x;
        let trkNz = aheadTrackNode.z - trackNode.z;
        const trkNlen = Math.hypot(trkNx, trkNz) || 1;
        trkNx /= trkNlen;
        trkNz /= trkNlen;

        // Vehicle velocity vector V_car in world coordinates
        const vCarX = vMs_motion * Math.cos(simState.heading);
        const vCarZ = vMs_motion * Math.sin(simState.heading);
        const forwardDot = (vCarX * trkNx + vCarZ * trkNz);

        // Natural wrong-way detection (only when driving forward in drive gear at speed, not when reversing)
        simState.isWrongWay = (simState.gear !== -1 && simState.speedKmh > 20 && forwardDot < -0.3);

        const ds = vMs_motion * Math.cos(relAngle) * dt;
        const dd = vMs_motion * Math.sin(relAngle) * dt + (simState.colLatVel || 0) * dt;
        simState.colLatVel = (simState.colLatVel || 0) * Math.exp(-6.0 * dt);
        if (Math.abs(simState.colLatVel) < 0.02) simState.colLatVel = 0;

        const prevS = simState.s;

        // Natural track longitudinal progression (no artificial reverse locking or speed penalty)
        simState.s += ds;
        if (simState.s < 0) {
          simState.s += totalTrackLength;
        }

        // Sequential Checkpoints & Sector Gate Pipeline (16 Gates)
        const GATE_COUNT = 16;
        const gateSpacing = totalTrackLength / GATE_COUNT;

        if (!simState.clearedGates) simState.clearedGates = [0];

        // Evaluate passing gates forward between prevS and simState.s
        if (simState.s >= prevS) {
          for (let g = 1; g < GATE_COUNT; g++) {
            const gateS = g * gateSpacing;
            if (prevS < gateS && simState.s >= gateS) {
              if (forwardDot > 0) {
                if (!simState.clearedGates.includes(g)) simState.clearedGates.push(g);
                simState.lastClearedGate = g;
              }
            }
          }
        }
        const maxRunoffD = halfW + 11.0;
        simState.d = Math.max(-maxRunoffD, Math.min(maxRunoffD, simState.d + dd));

        simState.wallScrapeWarning = false;
        if (Math.abs(simState.d) >= maxRunoffD - 0.25) {
          simState.speedMs *= 0.94;
          simState.wallScrapeWarning = true;
        }

        simState.lapElapsed += dt;

        const s1Mark = totalTrackLength * 0.338;
        const s2Mark = totalTrackLength * 0.680;

        if (prevS < s1Mark && simState.s >= s1Mark && simState.sector1Time === null) {
          simState.sector1Time = simState.lapElapsed;
          document.getElementById('hud-s1').textContent = simState.sector1Time.toFixed(3) + 's';
        }
        if (prevS < s2Mark && simState.s >= s2Mark && simState.sector2Time === null) {
          simState.sector2Time = simState.lapElapsed - (simState.sector1Time || 0);
          document.getElementById('hud-s2').textContent = simState.sector2Time.toFixed(3) + 's';
        }

        if (simState.s < totalTrackLength && simState.s - simState.lastSampleS >= 20) {
          simState.lastSampleS = simState.s;
          const worldPt = sdToWorld(simState.s, simState.d);
          simState.currentLapSamples.push({
            s: Math.max(0, simState.s),
            t: simState.lapElapsed,
            d: simState.d,
            x: worldPt.x,
            y: worldPt.y,
            z: worldPt.z,
            heading: simState.heading,
            speed: simState.speedKmh,
            throttle: Math.round(simState.throttleInput),
            brake: Math.round(simState.brakeInput),
            steer: Math.round(simState.steerInput * 450),
            latG: simState.latG
          });
        }

        if (simState.s >= totalTrackLength) {
          const finishPt = sdToWorld(totalTrackLength, simState.d);
          const lastRecorded = simState.currentLapSamples[simState.currentLapSamples.length - 1];
          if (!lastRecorded || lastRecorded.s < totalTrackLength) {
            simState.currentLapSamples.push({
              s: totalTrackLength,
              t: simState.lapElapsed,
              d: simState.d,
              x: finishPt.x,
              y: finishPt.y,
              z: finishPt.z,
              heading: simState.heading,
              speed: simState.speedKmh,
              throttle: Math.round(simState.throttleInput),
              brake: Math.round(simState.brakeInput),
              steer: Math.round(simState.steerInput * 450),
              latG: simState.latG
            });
          }
          simState.lastCompletedLapSamples = simState.currentLapSamples.slice();

          simState.s -= totalTrackLength;
          simState.lastSampleS = -25;
          const completedLapTime = simState.lapElapsed;

          // 衝過終點線時檢查：必須已通過所有中間檢查點 (1..15) 且為正向衝線，才計入圈速與進入完賽畫面
          const requiredGates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
          const allGatesCleared = requiredGates.every(g => simState.clearedGates && simState.clearedGates.includes(g));
          const isForwardFinish = forwardDot > 0;
          const isLapLegitimate = allGatesCleared && isForwardFinish;

          // 重置檢查點追蹤器
          simState.clearedGates = [0];
          simState.lastClearedGate = 0;

          if (isLapLegitimate) {
            simState.sector3Time = Math.max(0.1, completedLapTime - (simState.sector1Time || 0) - (simState.sector2Time || 0));
            const s3El = document.getElementById('hud-s3');
            if (s3El) s3El.textContent = simState.sector3Time.toFixed(3) + 's';

            // 計入合法圈速與更新最佳紀錄
            if (completedLapTime < simState.bestLapTime || simState.pbTelemetrySamples.length === 0) {
              if (completedLapTime < simState.bestLapTime) {
                simState.bestLapTime = completedLapTime;
                const bestEl = document.getElementById('hud-best-time');
                if (bestEl) bestEl.textContent = formatLapTime(simState.bestLapTime);
              }
              simState.pbTelemetrySamples = simState.lastCompletedLapSamples.slice();
            }
            if (!simState.sessionLapTimes) simState.sessionLapTimes = [];
            simState.sessionLapTimes.push(completedLapTime);

            // 只有通過全部檢查點衝線，才進入完賽結算畫面
            if (simState.mode === 'time_attack' || simState.lap >= simState.totalRaceLaps) {
              if (typeof window.__apexFlowFinish === 'function') {
                window.__apexFlowFinish(completedLapTime);
              } else {
                openTelemetryModal('current', completedLapTime);
              }
              return;
            } else {
              simState.lap++;
              simState.lapElapsed = 0;
              simState.sector1Time = null;
              simState.sector2Time = null;
              simState.currentLapSamples = [];
              const lapCountEl = document.getElementById('hud-lap-count');
              if (lapCountEl) lapCountEl.textContent = `${simState.lap} / ${simState.totalRaceLaps}`;
              if (simState.lap === simState.totalRaceLaps) {
                triggerFinalLapBanner();
              }
            }
          } else {
            console.log('[APEX CHECKPOINT] Finish line passed without all checkpoints. Lap not recorded.');
          }
        }

        if (simState.mode === 'ai_race') {
          stepAIRivals(dt);
          if (!simState.countdownActive) {
            resolveVehicleCollisions(dt);
          }
        }
      }

      function shortestTrackDelta(fromS, toS) {
        let ds = toS - fromS;
        if (ds > totalTrackLength * 0.5) ds -= totalTrackLength;
        if (ds < -totalTrackLength * 0.5) ds += totalTrackLength;
        return ds;
      }

      function wrapAngle(a) {
        while (a > Math.PI) a -= Math.PI * 2;
        while (a < -Math.PI) a += Math.PI * 2;
        return a;
      }

      // Sutherland-Hodgman segment clip against half-plane dot(p, n) <= d
      function clipSegmentToLine(p0, p1, nx, nz, d) {
        const out = [];
        const dist0 = p0.x * nx + p0.z * nz - d;
        const dist1 = p1.x * nx + p1.z * nz - d;
        if (dist0 <= 0) out.push(p0);
        if (dist1 <= 0) out.push(p1);
        if ((dist0 > 0 && dist1 < 0) || (dist0 < 0 && dist1 > 0)) {
          const t = dist0 / (dist0 - dist1);
          out.push({
            x: p0.x + (p1.x - p0.x) * t,
            z: p0.z + (p1.z - p0.z) * t
          });
        }
        return out;
      }

      // 2D SAT + 2-Point Clipped Edge Contact Manifold Solver for GT3 rigid bodies (4.7m x 2.0m)
      function testOBBOverlap(a, b) {
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const aFx = Math.cos(a.heading), aFz = Math.sin(a.heading);
        const aRx = -aFz, aRz = aFx;
        const bFx = Math.cos(b.heading), bFz = Math.sin(b.heading);
        const bRx = -bFz, bRz = bFx;

        const axes = [
          [aFx, aFz],
          [aRx, aRz],
          [bFx, bFz],
          [bRx, bRz]
        ];

        let minOverlap = Infinity;
        let minNx = 0;
        let minNz = 0;
        let fastApproachOverlap = Infinity;
        let fastApproachScore = Infinity;
        let fastNx = 0;
        let fastNz = 0;

        const rvx = (b.vx || 0) - (a.vx || 0);
        const rvz = (b.vz || 0) - (a.vz || 0);

        for (let i = 0; i < 4; i++) {
          let ax = axes[i][0];
          let az = axes[i][1];
          const dist = Math.abs(dx * ax + dz * az);
          const projA = a.halfLen * Math.abs(aFx * ax + aFz * az) + a.halfWid * Math.abs(aRx * ax + aRz * az);
          const projB = b.halfLen * Math.abs(bFx * ax + bFz * az) + b.halfWid * Math.abs(bRx * ax + bRz * az);
          const overlap = projA + projB - dist;
          if (overlap <= 0) return null;

          // Orient axis strictly from A -> B
          if (dx * ax + dz * az < 0) {
            ax = -ax;
            az = -az;
          }

          if (overlap < minOverlap) {
            minOverlap = overlap;
            minNx = ax;
            minNz = az;
          }

          const closing = -(rvx * ax + rvz * az);
          if (closing > 8.0) {
            const tPen = overlap / closing;
            if (tPen < fastApproachScore) {
              fastApproachScore = tPen;
              fastApproachOverlap = overlap;
              fastNx = ax;
              fastNz = az;
            }
          }
        }

        // Default to pure geometric Minimum Translation Vector (prevents side-by-side longitudinal snapping).
        // Only switch to the high-speed approach face when extreme telescoping occurred (> 0.85m min overlap).
        const useFastFace = (minOverlap > 0.85 && fastApproachScore < 0.16);
        const bestOverlap = useFastFace ? fastApproachOverlap : minOverlap;
        const bestNx = useFastFace ? fastNx : minNx;
        const bestNz = useFastFace ? fastNz : minNz;

        // Build 2-Point Clipped Contact Manifold (Reference Box vs Incident Box)
        const aAlignF = Math.abs(bestNx * aFx + bestNz * aFz);
        const aAlignR = Math.abs(bestNx * aRx + bestNz * aRz);
        const bAlignF = Math.abs(bestNx * bFx + bestNz * bFz);
        const bAlignR = Math.abs(bestNx * bRx + bestNz * bRz);
        const maxA = Math.max(aAlignF, aAlignR);
        const maxB = Math.max(bAlignF, bAlignR);

        const aIsRef = (maxA >= maxB);
        const ref = aIsRef ? a : b;
        const inc = aIsRef ? b : a;
        const refFx = aIsRef ? aFx : bFx, refFz = aIsRef ? aFz : bFz;
        const refRx = aIsRef ? aRx : bRx, refRz = aIsRef ? aRz : bRz;
        const incFx = aIsRef ? bFx : aFx, incFz = aIsRef ? bFz : aFz;
        const incRx = aIsRef ? bRx : aRx, incRz = aIsRef ? bRz : aRz;
        const nRefOutX = aIsRef ? bestNx : -bestNx;
        const nRefOutZ = aIsRef ? bestNz : -bestNz;

        // Pick reference face edge
        let rFaceNx, rFaceNz, rHalfN, rHalfT;
        if (Math.abs(nRefOutX * refFx + nRefOutZ * refFz) >= Math.abs(nRefOutX * refRx + nRefOutZ * refRz)) {
          const sgn = (nRefOutX * refFx + nRefOutZ * refFz) >= 0 ? 1 : -1;
          rFaceNx = sgn * refFx; rFaceNz = sgn * refFz;
          rHalfN = ref.halfLen; rHalfT = ref.halfWid;
        } else {
          const sgn = (nRefOutX * refRx + nRefOutZ * refRz) >= 0 ? 1 : -1;
          rFaceNx = sgn * refRx; rFaceNz = sgn * refRz;
          rHalfN = ref.halfWid; rHalfT = ref.halfLen;
        }
        const rTanX = -rFaceNz;
        const rTanZ = rFaceNx;

        // Pick incident face most anti-parallel to reference outward normal
        const incFaces = [
          { nx: incFx, nz: incFz, hN: inc.halfLen, hT: inc.halfWid },
          { nx: -incFx, nz: -incFz, hN: inc.halfLen, hT: inc.halfWid },
          { nx: incRx, nz: incRz, hN: inc.halfWid, hT: inc.halfLen },
          { nx: -incRx, nz: -incRz, hN: inc.halfWid, hT: inc.halfLen }
        ];
        let bestInc = incFaces[0];
        let minDot = Infinity;
        for (let k = 0; k < 4; k++) {
          const d = incFaces[k].nx * rFaceNx + incFaces[k].nz * rFaceNz;
          if (d < minDot) { minDot = d; bestInc = incFaces[k]; }
        }
        const incCx = inc.x + bestInc.nx * bestInc.hN;
        const incCz = inc.z + bestInc.nz * bestInc.hN;
        const incTx = -bestInc.nz;
        const incTz = bestInc.nx;
        let clipped = [
          { x: incCx - incTx * bestInc.hT, z: incCz - incTz * bestInc.hT },
          { x: incCx + incTx * bestInc.hT, z: incCz + incTz * bestInc.hT }
        ];

        // Clip incident edge against side planes of reference face
        const refProjT = ref.x * rTanX + ref.z * rTanZ;
        clipped = clipSegmentToLine(clipped[0], clipped[1], rTanX, rTanZ, refProjT + rHalfT);
        if (clipped.length >= 2) {
          clipped = clipSegmentToLine(clipped[0], clipped[1], -rTanX, -rTanZ, -refProjT + rHalfT);
        }

        const refPlaneDist = ref.x * rFaceNx + ref.z * rFaceNz + rHalfN;
        const contacts = [];
        for (let k = 0; k < clipped.length; k++) {
          const p = clipped[k];
          const pen = refPlaneDist - (p.x * rFaceNx + p.z * rFaceNz);
          if (pen >= -0.05) {
            contacts.push({ x: p.x, z: p.z, pen: Math.max(0, pen) });
          }
        }

        if (contacts.length === 0) {
          const aExtF = a.halfLen * (aFx * bestNx + aFz * bestNz >= 0 ? 1 : -1);
          const aExtR = a.halfWid * (aRx * bestNx + aRz * bestNz >= 0 ? 1 : -1);
          const bExtF = b.halfLen * (-bestNx * bFx - bestNz * bFz >= 0 ? 1 : -1);
          const bExtR = b.halfWid * (-bestNx * bRx - bestNz * bRz >= 0 ? 1 : -1);
          contacts.push({
            x: ((a.x + aFx * aExtF + aRx * aExtR) + (b.x + bFx * bExtF + bRx * bExtR)) * 0.5,
            z: ((a.z + aFz * aExtF + aRz * aExtR) + (b.z + bFz * bExtF + bRz * bExtR)) * 0.5,
            pen: bestOverlap
          });
        }

        let sumX = 0, sumZ = 0;
        for (let k = 0; k < contacts.length; k++) {
          sumX += contacts[k].x;
          sumZ += contacts[k].z;
        }
        return {
          overlap: bestOverlap,
          nx: bestNx,
          nz: bestNz,
          cx: sumX / contacts.length,
          cz: sumZ / contacts.length,
          contacts
        };
      }

      function resolveVehicleCollisions(dt) {
        const halfW = TRACK_WIDTH * 0.5;
        const maxRunoffD = halfW + 10.5;
        const carProfile = getCurrentCarHandling();
        const playerMass = carProfile.weightKg || 1290;
        const HL = 2.35; // 4.7m GT3 chassis
        const HW = 1.00; // 2.0m GT3 track width

        const makeBody = (isPlayer, ref, s, d, heading, yawRate, vLong, vLatCar, mass) => {
          const w = sdToWorld(s, d);
          const fwdX = Math.cos(heading);
          const fwdZ = Math.sin(heading);
          const rightX = -fwdZ;
          const rightZ = fwdX;
          return {
            isPlayer,
            ref,
            s,
            d,
            x: w.x,
            y: w.y,
            z: w.z,
            heading,
            yawRate: yawRate || 0,
            vx: fwdX * vLong + rightX * vLatCar,
            vz: fwdZ * vLong + rightZ * vLatCar,
            mass,
            invMass: 1.0 / mass,
            invIzz: 12.0 / (mass * (4.7 * 4.7 + 2.0 * 2.0) * 1.18),
            halfLen: HL,
            halfWid: HW
          };
        };

        const pSignedSpd = (simState.gear === -1) ? -simState.speedMs : simState.speedMs;
        const pNode = sampleTrackAtS(simState.s);
        // Convert track-right colLatVel roughly to car-local lateral vel
        const pRightX = -Math.sin(simState.heading), pRightZ = Math.cos(simState.heading);
        const pInitVLat = (simState.colLatVel || 0) * (pNode.rightX * pRightX + pNode.rightZ * pRightZ);
        const bodies = [
          makeBody(true, simState, simState.s, simState.d, simState.heading, simState.yawRate || 0, pSignedSpd, pInitVLat, playerMass)
        ];
        aiCars.forEach(ai => {
          const wAi = sampleTrackAtS(ai.s);
          const aiH = (ai.heading != null) ? ai.heading : wAi.heading;
          bodies.push(makeBody(false, ai, ai.s, ai.d, aiH, ai.yawRate || 0, ai.speedMs, ai.vLat || 0, 1300));
        });

        let strongestImpact = 0;
        let maxScrapeSpeed = 0;
        let fxCx = 0, fxCy = 0, fxCz = 0;
        let playerInvolvedInFx = false;

        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const A = bodies[i];
            const B = bodies[j];
            if (Math.abs(shortestTrackDelta(A.s, B.s)) > 9.0) continue;

            const hit = testOBBOverlap(A, B);
            if (!hit) continue;

            const { overlap, nx, nz, cx, cz, contacts } = hit;
            if (A.isPlayer || B.isPlayer) {
              simState._inCollisionContact = 0.08;
            }

            const totalInvMass = A.invMass + B.invMass;
            // Progressive compliant separation (Baumgarte ERP + per-frame cap) prevents 1-frame visual teleporting
            const slop = 0.015;
            const erpSep = Math.max(0, overlap - slop) * 0.36;
            const sepFactor = Math.min(0.24, erpSep);
            const sepA = sepFactor * (A.invMass / totalInvMass);
            const sepB = sepFactor * (B.invMass / totalInvMass);

            const applyTrackSeparation = (body, dispX, dispZ) => {
              const node = sampleTrackAtS(body.s);
              const fwdX = Math.cos(node.heading);
              const fwdZ = Math.sin(node.heading);
              const dsSep = dispX * fwdX + dispZ * fwdZ;
              const ddSep = dispX * node.rightX + dispZ * node.rightZ;
              const nextS = body.s + dsSep;
              if (nextS >= 0 && nextS < totalTrackLength) {
                body.s = nextS;
              } else {
                body.s = Math.max(0.05, Math.min(totalTrackLength - 0.05, nextS));
              }
              body.d = Math.max(-maxRunoffD, Math.min(maxRunoffD, body.d + ddSep));
              const wNew = sdToWorld(body.s, body.d);
              body.x = wNew.x;
              body.y = wNew.y;
              body.z = wNew.z;
            };

            applyTrackSeparation(A, -nx * sepA, -nz * sepA);
            applyTrackSeparation(B, nx * sepB, nz * sepB);

            const tx = -nz;
            const tz = nx;
            const nPts = contacts.length;
            const e = 0.08;
            const muMetal = 0.42;
            const dtSafe = Math.max(0.004, Math.min(0.04, dt || 0.016));

            let pairMaxClosing = 0;
            let pairMaxScrape = 0;
            let rearHitImpulseA = 0;
            let rearHitImpulseB = 0;
            const aFx = Math.cos(A.heading), aFz = Math.sin(A.heading);
            const bFx = Math.cos(B.heading), bFz = Math.sin(B.heading);

            let totalPen = 0;
            for (let k = 0; k < nPts; k++) totalPen += Math.max(0.001, contacts[k].pen);

            const aVx0 = A.vx, aVz0 = A.vz, aW0 = A.yawRate;
            const bVx0 = B.vx, bVz0 = B.vz, bW0 = B.yawRate;
            let dAvx = 0, dAvz = 0, dAw = 0;
            let dBvx = 0, dBvz = 0, dBw = 0;

            for (let k = 0; k < nPts; k++) {
              const pt = contacts[k];
              const wK = Math.max(0.001, pt.pen) / totalPen;
              const rAx = pt.x - A.x, rAz = pt.z - A.z;
              const rBx = pt.x - B.x, rBz = pt.z - B.z;

              // Exact rigid-body contact velocity v_cm + omega x r (Jacobi manifold evaluation)
              const vAxP = aVx0 - aW0 * rAz;
              const vAzP = aVz0 + aW0 * rAx;
              const vBxP = bVx0 - bW0 * rBz;
              const vBzP = bVz0 + bW0 * rBx;

              const rvx = vBxP - vAxP;
              const rvz = vBzP - vAzP;
              const relVn = rvx * nx + rvz * nz;

              const rACrossN = rAx * nz - rAz * nx;
              const rBCrossN = rBx * nz - rBz * nx;
              const invKn = Math.max(1e-6, A.invMass + B.invMass + (rACrossN * rACrossN) * A.invIzz + (rBCrossN * rBCrossN) * B.invIzz);

              const rACrossT = rAx * tz - rAz * tx;
              const rBCrossT = rBx * tz - rBz * tx;
              const invKt = Math.max(1e-6, A.invMass + B.invMass + (rACrossT * rACrossT) * A.invIzz + (rBCrossT * rBCrossT) * B.invIzz);

              // Rigid-body normal impulse + velocity-clamped Baumgarte contact constraint (prevents penetration without energy blowup)
              const targetSepVel = Math.min(1.05, Math.max(0, pt.pen - 0.015) * 5.2);
              const vnDesired = (relVn < 0) ? (-e * relVn) : 0;
              const vnTarget = Math.max(vnDesired, targetSepVel);
              const dvN = vnTarget - relVn;
              const jn = (dvN > 0) ? (dvN / invKn) * wK : 0;

              // Dynamic Coulomb friction at contact manifold point (speed-equalizing + yaw alignment/spin drag)
              const relVt = rvx * tx + rvz * tz;
              const rawJt = (-relVt / invKt) * wK;
              const jnPress = Math.min(260, Math.max(0, 6200 * Math.max(0, pt.pen - 0.008) * dtSafe)) * wK;
              const totalNormalLoad = Math.max(jn, jn + jnPress * 0.5);
              const jtLimit = muMetal * totalNormalLoad;
              const jt = Math.max(-jtLimit, Math.min(jtLimit, rawJt));

              // Accumulate consistent linear + rotational impulse strictly from real (jn, jt)
              const impX = nx * jn + tx * jt;
              const impZ = nz * jn + tz * jt;

              dAvx -= impX * A.invMass;
              dAvz -= impZ * A.invMass;
              dBvx += impX * B.invMass;
              dBvz += impZ * B.invMass;

              const tauA = -(rAx * impZ - rAz * impX);
              const tauB = (rBx * impZ - rBz * impX);
              dAw += tauA * A.invIzz;
              dBw += tauB * B.invIzz;

              // Track rear-quarter destabilizing impulse behind center of mass (PIT maneuver trigger)
              const rALong = rAx * aFx + rAz * aFz;
              const rBLong = rBx * bFx + rBz * bFz;
              if (rALong < -0.42 && pt.pen > 0.025) rearHitImpulseA += Math.abs(tauA) * A.invIzz;
              if (rBLong < -0.42 && pt.pen > 0.025) rearHitImpulseB += Math.abs(tauB) * B.invIzz;

              if (-relVn > pairMaxClosing) pairMaxClosing = -relVn;
              if (Math.abs(relVt) > pairMaxScrape && totalNormalLoad > 12) pairMaxScrape = Math.abs(relVt);
            }

            A.vx += dAvx;
            A.vz += dAvz;
            B.vx += dBvx;
            B.vz += dBvz;
            const cappedDAw = Math.max(-0.62, Math.min(0.62, dAw));
            const cappedDBw = Math.max(-0.62, Math.min(0.62, dBw));
            A.yawRate = Math.max(-3.0, Math.min(3.0, A.yawRate + cappedDAw));
            B.yawRate = Math.max(-3.0, Math.min(3.0, B.yawRate + cappedDBw));

            // Write back linear + angular states to Player & AI bodies
            const syncBody = (body, rearShock) => {
              const fwdX = Math.cos(body.heading);
              const fwdZ = Math.sin(body.heading);
              const rightX = -fwdZ;
              const rightZ = fwdX;
              const vLong = body.vx * fwdX + body.vz * fwdZ;
              const vCarLat = body.vx * rightX + body.vz * rightZ;

              if (body.isPlayer) {
                if (simState.gear !== -1) {
                  simState.speedMs = Math.max(0, Math.min(110, vLong));
                  simState.speedKmh = simState.speedMs * 3.6;
                }
                const node = sampleTrackAtS(body.s);
                const worldLatX = body.vx - fwdX * vLong;
                const worldLatZ = body.vz - fwdZ * vLong;
                simState.colLatVel = Math.max(-18, Math.min(18, worldLatX * node.rightX + worldLatZ * node.rightZ));
                simState.yawRate = Math.max(-1.55, Math.min(1.55, body.yawRate));
              } else {
                body.ref.speedMs = Math.max(-55, Math.min(105, vLong));
                body.ref.vLat = Math.max(-28, Math.min(28, vCarLat));
                body.ref.yawRate = Math.max(-3.0, Math.min(3.0, body.yawRate));
                const bNode = sampleTrackAtS(body.s);
                const excessYawShock = Math.abs(body.ref.yawRate - (bNode.curvature || 0) * body.ref.speedMs);
                // Only trigger rear-axle breakaway spinout from true rear-quarter PIT impulse or severe lateral shock
                if (rearShock > 0.25 || excessYawShock > 2.15 || Math.abs(body.ref.vLat) > 6.2) {
                  body.ref.spinTimer = Math.max(body.ref.spinTimer || 0, (rearShock > 0.25 || excessYawShock > 2.15) ? 1.55 : 1.15);
                }
              }
            };

            syncBody(A, rearHitImpulseA);
            syncBody(B, rearHitImpulseB);

            const fxStrength = Math.max(pairMaxClosing, pairMaxScrape * 0.45);
            if (fxStrength > strongestImpact) {
              strongestImpact = fxStrength;
              maxScrapeSpeed = pairMaxScrape;
              fxCx = cx;
              fxCy = (A.y + B.y) * 0.5;
              fxCz = cz;
              playerInvolvedInFx = (A.isPlayer || B.isPlayer);
            }

            const commitSD = (body) => {
              if (body.isPlayer) {
                simState.s = body.s;
                simState.d = body.d;
              } else {
                body.ref.s = body.s;
                body.ref.d = body.d;
              }
            };
            commitSD(A);
            commitSD(B);
          }
        }

        // Sync AI meshes after collision separation
        aiCars.forEach(ai => {
          const w = sdToWorld(ai.s, ai.d);
          const aiH = (ai.heading != null) ? ai.heading : w.heading;
          ai.mesh.position.set(w.x, w.y, w.z);
          ai.mesh.rotation.y = -aiH;
        });

        // Contact sparks, metallic collision/scrape audio & gamepad dual-rumble pulse
        if (strongestImpact > 1.2 || maxScrapeSpeed > 2.0) {
          const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          if (!simState._lastCollisionFxMs || (nowMs - simState._lastCollisionFxMs) > 95) {
            simState._lastCollisionFxMs = nowMs;
            const intensity = Math.min(1.0, Math.max(strongestImpact, maxScrapeSpeed * 0.5) / 22.0);
            const sparkCount = Math.min(5, Math.max(2, Math.round(2 + intensity * 3)));
            for (let k = 0; k < sparkCount; k++) {
              spawnTireSmoke(fxCx, fxCy, fxCz, 'spark');
            }
            if (typeof soundEngine !== 'undefined' && soundEngine && typeof soundEngine.triggerCollision === 'function') {
              soundEngine.triggerCollision(intensity);
            }
            if (playerInvolvedInFx && typeof window.triggerGamepadRumble === 'function') {
              window.triggerGamepadRumble(0.45 * intensity, 0.78 * intensity, 115);
            }
          }
        }
      }

      function stepAIRivals(dt) {
        const diff = simState.aiDifficulty || 1.0;
        const halfW = TRACK_WIDTH * 0.5;
        const maxAiD = halfW + 9.5;

        aiCars.forEach(ai => {
          const node = sampleTrackAtS(ai.s);
          if (ai.heading === undefined || ai.heading === null) ai.heading = node.heading;
          if (ai.yawRate === undefined) ai.yawRate = 0;
          if (ai.vLat === undefined) ai.vLat = 0;
          if (ai.spinTimer === undefined) ai.spinTimer = 0;

          // Hold stationary on grid during FIA 5-Red-Light sequence
          if (simState.countdownActive) {
            ai.speedMs = 0;
            ai.yawRate = 0;
            ai.vLat = 0;
            ai.heading = node.heading;
            ai.stateLabel = 'GRID HOLD';
            ai.throttleInput = 45;
            ai.brakeInput = 100;
            const w = sdToWorld(ai.s, ai.d);
            ai.mesh.position.set(w.x, w.y, w.z);
            ai.mesh.rotation.y = -ai.heading;
            if (ai.mesh.userData.tailLight) setSlotBrakeLight(ai.mesh, true, 0xff2222, 0x550000);
            return;
          }
          if ((ai.reactionTimer || 0) > 0 && ai.speedMs < 2.0) {
            ai.reactionTimer -= dt;
            ai.stateLabel = 'LAUNCH PREP';
            return;
          }
          const lookNode = sampleTrackAtS(ai.s + 95);
          const proRef = getProProfileAtDistance(ai.s);

          // Pure competitive zero-mistake pace (~1.56G-1.62G clinical execution)
          const absCurv = Math.abs(node.curvature || 0);
          const apexGripBonus = absCurv > 0.0020 ? (1.06 + Math.max(0, (diff - 0.92) * 0.25)) : 1.0;
          const isCornerExit = (absCurv > 0.0020 && Math.abs(lookNode.curvature || 0) < 0.0025);
          const exitSurge = isCornerExit ? 1.055 : 1.0;
          let targetV = Math.min(306, proRef.speedKmh * apexGripBonus * exitSurge * ai.basePace * diff);

          const playerTotalS = (simState.lap - 1) * totalTrackLength + simState.s;
          const aiTotalS = (ai.lap - 1) * totalTrackLength + ai.s;
          const gapMeters = aiTotalS - playerTotalS;

          let targetD = proRef.optimalD;
          ai.stateLabel = proRef.brake > 20 ? 'BRAKING ZONE' : (isCornerExit ? 'EXIT SURGE' : 'OPTIMAL LINE');

          // Trailing Player: Straight Slipstream Slingshot OR Clinical Late-Braking Dive
          if (gapMeters < -3 && gapMeters > -62) {
            if (Math.abs(node.curvature) < 0.0025) {
              if (gapMeters > -18) {
                targetD = simState.d > 0 ? simState.d - 3.6 : simState.d + 3.6;
                ai.stateLabel = 'SLINGSHOT PASS';
              } else {
                targetD = simState.d;
                ai.stateLabel = 'SLIPSTREAMING';
              }
              targetV *= 1.08;
            } else if (gapMeters > -22 && Math.abs(lookNode.curvature) > 0.0035) {
              const insideSign = Math.sign(lookNode.curvature || 1);
              targetD = insideSign * 5.0;
              targetV *= 1.07;
              ai.stateLabel = 'LATE BRAKE DIVE';
            }
          } else if (gapMeters > 0 && gapMeters < 32) {
            // Leading Player cleanly: hold defensive inside line without fake pressure mistakes
            if (Math.abs(lookNode.curvature) > 0.004) {
              const insideSign = Math.sign(lookNode.curvature || 1);
              targetD = insideSign * 4.8;
              ai.stateLabel = 'DEFENSIVE LINE';
            } else {
              targetD = simState.d * 0.60;
              ai.stateLabel = 'DEFENDING';
            }
          }

          // Smooth look-ahead racecraft around other AI ahead (no instant teleport offsets)
          aiCars.forEach(other => {
            if (other === ai) return;
            const otherTotalS = (other.lap - 1) * totalTrackLength + other.s;
            const aheadDist = otherTotalS - aiTotalS;
            if (aheadDist > 2.5 && aheadDist < 16.0 && Math.abs(targetD - other.d) < 2.6) {
              targetD = (other.d >= 0) ? Math.max(-halfW + 1.5, other.d - 3.2) : Math.min(halfW - 1.5, other.d + 3.2);
            }
          });

          // True 2D Planar Rigid-Body Spinout & Oversteer Recovery Physics
          ai.spinTimer = Math.max(0, ai.spinTimer - dt);
          const hDiff = wrapAngle(ai.heading - node.heading);
          const beta = Math.atan2(ai.vLat || 0, Math.max(4.0, Math.abs(ai.speedMs)));
          const trackYaw = (node.curvature || 0) * ai.speedMs;
          const excessYaw = ai.yawRate - trackYaw;
          const isOutOfControl = (ai.spinTimer > 0) || Math.abs(hDiff) > 0.48 || Math.abs(beta) > 0.32;
          const offAsphalt = Math.abs(ai.d) > (halfW + 0.8);
          const surfGrip = offAsphalt ? 0.45 : 1.0;

          if (ai.throttleInput === undefined) ai.throttleInput = 0;
          if (ai.brakeInput === undefined) ai.brakeInput = 0;

          if (isOutOfControl) {
            const deepSpin = Math.abs(hDiff) > 0.62 || Math.abs(excessYaw) > 1.55;
            translateAnalogPedals(ai, false, deepSpin, !deepSpin, dt, 0);
            ai.stateLabel = deepSpin ? 'LOST CONTROL' : 'CATCHING SLIDE';

            const aiBrk = ai.brakeInput / 100;
            const oldH = ai.heading;
            const cosOld = Math.cos(oldH), sinOld = Math.sin(oldH);
            const vxWorld = cosOld * ai.speedMs - sinOld * ai.vLat;
            const vzWorld = sinOld * ai.speedMs + cosOld * ai.vLat;

            // Tire yaw torque saturates once rear slip exceeds peak angle or immediately after rear-axle shock -> authentic PIT spinout
            const peakSlipSaturated = (ai.spinTimer > 0.70 || Math.abs(beta) > 0.16 || Math.abs(hDiff) > 0.24);
            const maxCounterYawAccel = (peakSlipSaturated ? 0.95 : 2.1) * surfGrip;
            const desiredYaw = Math.max(-1.65, Math.min(1.65, trackYaw - hDiff * 1.5));
            const yawErr = desiredYaw - ai.yawRate;
            const yawStep = Math.max(-maxCounterYawAccel * dt, Math.min(maxCounterYawAccel * dt, yawErr));
            ai.yawRate += yawStep;
            ai.heading = wrapAngle(oldH + ai.yawRate * dt);

            const cosNew = Math.cos(ai.heading), sinNew = Math.sin(ai.heading);
            const vLongProj = vxWorld * cosNew + vzWorld * sinNew;
            const vLatProj = -vxWorld * sinNew + vzWorld * cosNew;

            const longDecel = (Math.sign(vLongProj) * (aiBrk * 16.5 * surfGrip + (offAsphalt ? 3.2 : 0.35)) + 0.00054 * vLongProj * Math.abs(vLongProj));
            ai.speedMs = Math.max(-45, Math.min(105, vLongProj - longDecel * dt));

            const lateralGripMult = peakSlipSaturated ? 0.68 : 1.05;
            const maxLatScrubAccel = 1.52 * 9.81 * surfGrip * lateralGripMult;
            const latDrop = Math.min(Math.abs(vLatProj), maxLatScrubAccel * dt);
            ai.vLat = vLatProj - Math.sign(vLatProj) * latDrop;

            const wCur = sdToWorld(ai.s, ai.d);
            if (Math.abs(ai.vLat) > 2.2 || Math.abs(hDiff) > 0.35) {
              if (Math.random() < 0.6) spawnTireSmoke(wCur.x, wCur.y, wCur.z, 'smoke');
              if (Math.random() < 0.55) {
                const rX = -Math.sin(ai.heading), rZ = Math.cos(ai.heading);
                spawnSkidMark(wCur.x - rX * 0.78, wCur.y, wCur.z - rZ * 0.78, ai.heading);
                spawnSkidMark(wCur.x + rX * 0.78, wCur.y, wCur.z + rZ * 0.78, ai.heading);
              }
            }

            const vxOut = cosNew * ai.speedMs - sinNew * ai.vLat;
            const vzOut = sinNew * ai.speedMs + cosNew * ai.vLat;
            ai.s += (vxOut * node.dirX + vzOut * node.dirZ) * dt;
            ai.d = Math.max(-maxAiD, Math.min(maxAiD, ai.d + (vxOut * node.rightX + vzOut * node.rightZ) * dt));
          } else {
            const targetMs = targetV / 3.6;
            const speedErrMs = targetMs - ai.speedMs;
            const aiRawBrake = (speedErrMs < -4.5 || (proRef.brake > 68 && speedErrMs < -1.5));
            const aiRawTrail = (!aiRawBrake && (speedErrMs < -0.9 || (proRef.brake > 22 && speedErrMs < 0)));
            const aiRawThrottle = (!aiRawBrake && !aiRawTrail && speedErrMs > -0.4);
            const aiThrCap = (absCurv > 0.0055 && !isCornerExit) ? 78 : 100;

            translateAnalogPedals(ai, aiRawThrottle, aiRawBrake, aiRawTrail, dt, aiThrCap);

            const aiThr = ai.throttleInput / 100;
            const aiBrk = ai.brakeInput / 100;
            const vEff = Math.max(Math.abs(ai.speedMs), 11.5);
            const aiDriveAccel = aiThr * Math.min(9.0, 358.0 / vEff) * ai.basePace * diff;
            const aiBrakeDecel = aiBrk * 19.2;
            const aiDrag = 0.00054 * ai.speedMs * Math.abs(ai.speedMs) + 0.14;
            const aiEngineBrk = (aiThr < 0.05 && ai.speedMs > 1.0) ? 0.65 : 0;
            const aiNetAccel = aiDriveAccel - aiBrakeDecel - aiDrag - aiEngineBrk;
            ai.speedMs = Math.max(0, ai.speedMs + aiNetAccel * dt);

            const aiMaxDeg = getDynamicMaxSteerDeg(ai.speedMs * 3.6, CAR_HANDLING_PROFILES.procedural, true);
            const aiMaxLatSpeed = Math.max(1.8, ai.speedMs * Math.sin((aiMaxDeg * Math.PI) / 180) * 0.48);
            const desiredLatVel = (targetD - ai.d) * 3.2;
            const clampedLatVel = Math.max(-aiMaxLatSpeed, Math.min(aiMaxLatSpeed, desiredLatVel));

            const desiredSteerAngle = Math.atan2(clampedLatVel, Math.max(8.0, ai.speedMs));
            const desiredHeading = wrapAngle(node.heading + desiredSteerAngle);
            const headErr = wrapAngle(desiredHeading - ai.heading);
            ai.yawRate = Math.max(-2.2, Math.min(2.2, headErr * 8.5));
            ai.heading = wrapAngle(ai.heading + ai.yawRate * dt);
            ai.vLat *= Math.exp(-8.0 * dt);

            const hNowDiff = wrapAngle(ai.heading - node.heading);
            const vxOut = node.dirX * (ai.speedMs * Math.cos(hNowDiff) - ai.vLat * Math.sin(hNowDiff))
                        + node.rightX * (ai.speedMs * Math.sin(hNowDiff) + ai.vLat * Math.cos(hNowDiff));
            const vzOut = node.dirZ * (ai.speedMs * Math.cos(hNowDiff) - ai.vLat * Math.sin(hNowDiff))
                        + node.rightZ * (ai.speedMs * Math.sin(hNowDiff) + ai.vLat * Math.cos(hNowDiff));
            ai.s += (vxOut * node.dirX + vzOut * node.dirZ) * dt;
            ai.d = Math.max(-maxAiD, Math.min(maxAiD, ai.d + (vxOut * node.rightX + vzOut * node.rightZ) * dt));
          }

          if (ai.s >= totalTrackLength) {
            ai.s -= totalTrackLength;
            ai.lap++;
          } else if (ai.s < 0) {
            ai.s += totalTrackLength;
          }

          const w = sdToWorld(ai.s, ai.d);
          ai.mesh.position.set(w.x, w.y, w.z);
          ai.mesh.rotation.y = -ai.heading;
          ai.colHeadingOffset = wrapAngle(ai.heading - w.heading);

          // Illuminate AI brake tail-lights strictly from real translated brake pressure
          if (ai.mesh.userData.tailLight) {
            setSlotBrakeLight(ai.mesh, ai.brakeInput > 8, 0xff2222, 0x550000);
          }
        });
      }

window.CAR_HANDLING_PROFILES = CAR_HANDLING_PROFILES;
window.getCurrentCarHandling = getCurrentCarHandling;
window.TIRE_COMPOUNDS = TIRE_COMPOUNDS;
window.getCurrentTireProfile = getCurrentTireProfile;
window.setTireCompound = setTireCompound;
window.GEAR_RATIOS = GEAR_RATIOS;
window.GEAR_MAX_SPEED = GEAR_MAX_SPEED;
window.simState = simState;
window.aiCars = aiCars;
window.selectCircuit = selectCircuit;
window.resetSession = resetSession;
window.translateAnalogPedals = translateAnalogPedals;
window.getDynamicMaxSteerDeg = getDynamicMaxSteerDeg;
window.stepAnalogSteering = stepAnalogSteering;
window.computeDrivingCue = computeDrivingCue;
window.testOBBOverlap = testOBBOverlap;
window.resolveVehicleCollisions = resolveVehicleCollisions;
window.stepPhysics = stepPhysics;
window.stepAIRivals = stepAIRivals;
if (window.__apexTrace) window.__apexTrace('physics.js', 'OK');