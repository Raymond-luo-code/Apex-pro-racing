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
        inspectMode: false
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
          basePace: 1.015,
          stress: 12,
          stateLabel: 'OPTIMAL LINE',
          mistakeTimer: 0,
          mistakeType: null,
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
          basePace: 1.002,
          stress: 18,
          stateLabel: 'OPTIMAL LINE',
          mistakeTimer: 0,
          mistakeType: null,
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
          basePace: 0.990,
          stress: 20,
          stateLabel: 'OPTIMAL LINE',
          mistakeTimer: 0,
          mistakeType: null,
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

        const startOverlay = document.getElementById('start-lights-overlay');
        if (triggerCountdown && !simState.inShowcaseMode) {
          // Trigger 3, 2, 1, GO! Standing Start Countdown Sequence
          simState.countdownActive = true;
          simState.countdownTimer = 3.5;
          simState.lastBeepStage = 4;
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
          ai.speedMs = 0; // Standing start on the grid waiting for GO!
          ai.lap = 1;
          ai.stress = 15;
          ai.mistakeTimer = 0;
          ai.mistakeType = null;
          ai.stateLabel = 'GRID READY';
          ai.mesh.visible = (!simState.inShowcaseMode && simState.mode === 'ai_race');
          const w = sdToWorld(ai.s, ai.d);
          ai.mesh.position.set(w.x, w.y, w.z);
          ai.mesh.rotation.y = -w.heading;
        });
      }

      function updateCountdownUI(timer) {
        const overlay = document.getElementById('start-lights-overlay');
        const numEl = document.getElementById('start-countdown-num');
        const pods = document.querySelectorAll('#start-lights-pods span');
        if (!overlay || !numEl) return;

        if (timer <= 0) {
          overlay.classList.add('hidden');
          return;
        }
        overlay.classList.remove('hidden');

        // timer goes from 3.5 -> 0.5 (3, 2, 1), then 0.5 -> 0.0 (GO!)
        if (timer > 0.5) {
          const stage = Math.ceil(timer - 0.5); // 3, 2, 1
          if (simState.lastBeepStage !== stage) {
            simState.lastBeepStage = stage;
            soundEngine.playCountdownBeep(false);
          }
          numEl.textContent = String(stage);
          numEl.className = 'text-2xl font-mono-tech font-extrabold text-red-400';
          const litRedCount = (4 - stage) * 2 - 1; // 1, 3, 5 red lights
          pods.forEach((p, idx) => {
            p.style.backgroundColor = idx < litRedCount ? '#ef4444' : '#1e293b';
            p.style.boxShadow = idx < litRedCount ? '0 0 12px #ef4444' : 'none';
          });
        } else {
          if (simState.lastBeepStage !== 0) {
            simState.lastBeepStage = 0;
            soundEngine.playCountdownBeep(true);
          }
          numEl.textContent = 'GO!';
          numEl.className = 'text-2xl font-mono-tech font-extrabold text-emerald-400';
          pods.forEach(p => {
            p.style.backgroundColor = '#10b981';
            p.style.boxShadow = '0 0 14px #10b981';
          });
        }
      }

      function stepPhysics(dt) {
        if (simState.paused || simState.inShowcaseMode) return;
        const isReal = (simState.edition === 'realistic');
        simState.backfireFlameTimer = Math.max(0, (simState.backfireFlameTimer || 0) - dt);
        const prevThr = simState.throttleInput;

        if (!manualThrottleDrag) {
          if (inputs.throttle || (!isReal && inputs.nos)) {
            simState.throttleInput = Math.min(100, simState.throttleInput + 180 * dt);
          } else {
            simState.throttleInput = Math.max(0, simState.throttleInput - 250 * dt);
          }
          sliderThrottle.value = String(Math.round(simState.throttleInput));
        }

        if (!manualBrakeDrag) {
          if (inputs.brake) {
            const rampRate = simState.isMobileGamepadActive ? 160 : 220;
            simState.brakeInput = Math.min(100, simState.brakeInput + rampRate * dt);
          } else if (inputs.trailBrake) {
            const targetTB = 74;
            simState.brakeInput += (targetTB - simState.brakeInput) * Math.min(1, 14 * dt);
          } else {
            simState.brakeInput = Math.max(0, simState.brakeInput - 310 * dt);
          }
          sliderBrake.value = String(Math.round(simState.brakeInput));
        }

        const carProfile = getCurrentCarHandling();

        if (!manualSteerDrag) {
          // Dynamic speed-sensitive steering lock calibrated per chassis:
          // Low speed (< 35 km/h) = 1.0 (full mechanical lock for hairpins, chicanes & recovery)
          // High speed (240+ km/h) = smoothly scaled to chassis highSpeedLockFactor (~0.27 - 0.32)
          const spdKmh = Math.abs(simState.speedKmh);
          const speedFactor = Math.min(1.0, Math.max(0.0, (spdKmh - 30) / 210));
          const highSpeedFloor = isReal ? carProfile.highSpeedLockFactor : (carProfile.highSpeedLockFactor + 0.16);
          const maxSteerLock = 1.0 - speedFactor * (1.0 - highSpeedFloor);
          const steerRate = carProfile.steerRampRate * (1.0 - speedFactor * 0.36);

          if (gyroState.enabled && gyroState.active && !inputs.steerLeft && !inputs.steerRight) {
            const targetSteer = gyroState.steerVal * maxSteerLock;
            simState.steerInput += (targetSteer - simState.steerInput) * Math.min(1.0, 14.0 * dt);
          } else if (inputs.steerLeft) {
            simState.steerInput = Math.max(-maxSteerLock, simState.steerInput - steerRate * dt);
          } else if (inputs.steerRight) {
            simState.steerInput = Math.min(maxSteerLock, simState.steerInput + steerRate * dt);
          } else {
            // Adaptive auto-centering with smooth exponential damping
            const centerDecay = Math.pow(carProfile.autoCenterDamping, dt * (1.0 + speedFactor * 0.85));
            simState.steerInput *= centerDecay;
            if (Math.abs(simState.steerInput) < 0.003) simState.steerInput = 0;
          }
          sliderSteer.value = String(Math.round(simState.steerInput * 100));
        }

        const thr = simState.throttleInput / 100;
        const brk = simState.brakeInput / 100;

        // Handle 3-2-1-GO! Standing Start Countdown Sequence
        if (simState.countdownActive) {
          simState.countdownTimer -= dt;
          updateCountdownUI(simState.countdownTimer);
          if (simState.countdownTimer > 0.5) {
            // Hold cars on the starting grid; allow player to rev the engine RPM!
            simState.speedMs = 0;
            simState.speedKmh = 0;
            simState.lapElapsed = 0;
            simState.rpm = Math.round(1200 + thr * 6400 + Math.sin(performance.now() * 0.04) * (thr * 180));
            return;
          } else if (simState.countdownTimer <= 0) {
            simState.countdownActive = false;
            updateCountdownUI(0);
          }
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

        // RFC Module 2: Suspension Deflection via Damped Harmonic Oscillation (y = A * e^(-gamma*t) * cos(omega*t))
        // Decoupled from camera rig — applied locally to vehicle chassis mesh
        if (simState.onKerb && simState.speedKmh > 10) {
          simState.kerbTime = (simState.kerbTime || 0) + dt;
          const omega = 2 * Math.PI * (28 + (simState.speedKmh / 300) * 20); // 28-48 Hz matching velocity
          const amp = Math.min(0.034, 0.010 + (simState.speedKmh / 280) * 0.024);
          const damping = Math.exp(-6.0 * (simState.kerbTime % 0.22));
          simState.suspensionDispY = amp * damping * Math.cos(omega * simState.kerbTime);
        } else {
          simState.kerbTime = 0;
          simState.suspensionDispY *= Math.max(0, 1 - 20 * dt);
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
              for (let g = 6; g >= 1; g--) {
                if (simState.speedKmh >= GEAR_MAX_SPEED[g - 1] * 0.90) {
                  if (simState.gear !== g) {
                    simState.gear = g;
                    document.getElementById('hud-gear').textContent = String(g);
                    simState.backfireFlameTimer = 0.13;
                    if (soundEngine && typeof soundEngine.triggerBackfire === 'function') {
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
                  break;
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

          // Calibrated 0-100 km/h (3.48s) and 0-300 km/h (~40s) Power & Drag Model + Per-Chassis Multipliers
          const vEff = Math.max(vMs, 12.5);
          const accelMult = carProfile.accelFactor || 1.0;
          const dragMult = carProfile.aeroDragFactor || 1.0;
          const brakeMult = carProfile.brakeFactor || 1.0;
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

          // High-RPM throttle lift-off exhaust pop & flame
          if (prevThr > 65 && simState.throttleInput <= 25 && simState.speedKmh > 115 && (simState.backfireFlameTimer || 0) <= 0) {
            simState.backfireFlameTimer = 0.11;
            if (soundEngine && typeof soundEngine.triggerBackfire === 'function') {
              soundEngine.triggerBackfire();
            }
          }

          const driveAccel = thr * rawEngineAccel * revLimiterCut * simState.surfaceGrip;
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

        // Realistic Tire Traction Circle & Inertia Cornering Limit
        const trailBrakeBonus = (brk > 0.10 && brk <= 0.82) ? 1.12 : 1.0;
        const fullThrottleUndersteerPenalty = (thr > 0.75 && Math.abs(simState.steerInput) > 0.25) ? 0.78 : 1.0;
        const lockupPenalty = simState.isBrakeLockup ? 0.30 : 1.0;

        const baseMuLat = isReal ? carProfile.baseMuLat : (carProfile.baseMuLat * 1.48);
        const aeroBonusG = (simState.downforceKgf / carProfile.weightKg) * 0.45;
        const maxLatG = (baseMuLat + aeroBonusG) * simState.surfaceGrip * trailBrakeBonus * fullThrottleUndersteerPenalty * lockupPenalty;
        const maxLatAccelMs2 = maxLatG * 9.81;

        // Milliken & Milliken Understeer Gradient Dynamic Cornering Model:
        // kappa(v) = tan(delta) / (L * (1 + Kus * v^2))
        // Low speed: pure Ackermann turning (R ≈ 5.8m - 6.5m at full lock).
        // High speed: naturally damped steering gain preventing twitchiness and unrealistic yaw rates.
        const maxFrontWheelRad = (carProfile.maxSteerDeg * Math.PI) / 180;
        const frontWheelAngle = simState.steerInput * maxFrontWheelRad;
        const understeerDamping = 1.0 + (carProfile.understeerCoeff || 0.001) * vMs * vMs;
        const linearCurvature = (Math.tan(frontWheelAngle) / carProfile.wheelbase) / understeerDamping;

        // High speed turning is physically capped by tire friction circle: kappa_grip = a_y / v^2
        const vEff = Math.max(vMs, 2.0);
        const gripLimitedCurvature = maxLatAccelMs2 / (vEff * vEff);
        const desiredLatAccel = vMs * vMs * Math.abs(linearCurvature);

        simState.isUndersteer = false;
        let actualCurvature = linearCurvature;

        // When centrifugal demand exceeds tire lateral grip capacity:
        if (desiredLatAccel > maxLatAccelMs2 && vMs > 10.0) {
          const slidingEfficiency = isReal ? 0.88 : 0.96;
          actualCurvature = Math.sign(linearCurvature) * gripLimitedCurvature * slidingEfficiency;
        }

        // Understeer alert ONLY triggers when player carries excessive corner speed into a turn
        // and front tires are severely grip-saturated (realistic racing feedback, not constant false alarms):
        const cornerMaxKmh = getUpcomingCornerMaxSpeedKmh(simState.s);
        const isCarryingExcessSpeed = (simState.speedKmh > cornerMaxKmh + 16);
        const isGripSaturated = (desiredLatAccel > maxLatAccelMs2 * 1.15);
        if (isCarryingExcessSpeed && isGripSaturated && vMs > 12.0 && Math.abs(simState.steerInput) > 0.25) {
          simState.isUndersteer = true;
          if (Math.random() < 0.05) simState.understeerCount++;
        }

        let headingDiff = simState.heading - trackNode.heading;
        while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
        while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

        let targetYawRate = 0;
        if (isReal) {
          const straightCentering = (!simState.offTrack && Math.abs(simState.steerInput) < 0.04 && Math.abs(trackNode.curvature) < 0.002)
            ? -headingDiff * 1.1
            : 0;
          // Turn-in agility boost when initiating cornering:
          const turnInBonus = (vMs > 3 && vMs < 35) ? carProfile.turnInAgility : 1.0;
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

        // Vehicle rotational moment of inertia (smooth transition, removes jerky yaw jumps)
        simState.yawRate += (targetYawRate - simState.yawRate) * Math.min(1.0, 22.0 * dt);

        const reverseYawFactor = (simState.gear === -1) ? -1 : 1;
        simState.heading += simState.yawRate * reverseYawFactor * dt;
        simState.latG = (vMs * simState.yawRate) / 9.81;
        simState.tireSlipRatio = Math.min(1.35, Math.hypot(simState.latG / maxLatG, simState.longG / 2.2));

        simState.brakeNowWarning = (simState.speedKmh > cornerMaxKmh + 28 && brk < 0.2);

        const wPos = sdToWorld(simState.s, simState.d);
        const carYaw = simState.heading + simState.driftAngle;
        const fwdX = Math.cos(carYaw);
        const fwdZ = Math.sin(carYaw);
        const rightX = -Math.sin(carYaw);
        const rightZ = Math.cos(carYaw);

        // Dual rear-wheel & front-wheel independent ground smoke and twin tire skid marks!
        if (simState.isBrakeLockup || simState.isDrifting || simState.isUndersteer || simState.tireSlipRatio > 0.96) {
          const rlX = wPos.x - fwdX * 1.36 - rightX * 0.84;
          const rlZ = wPos.z - fwdZ * 1.36 - rightZ * 0.84;
          const rrX = wPos.x - fwdX * 1.36 + rightX * 0.84;
          const rrZ = wPos.z - fwdZ * 1.36 + rightZ * 0.84;

          if (Math.random() < 0.65) {
            spawnSkidMark(rlX, wPos.y, rlZ, carYaw);
            spawnSkidMark(rrX, wPos.y, rrZ, carYaw);
          }
          if (simState.isDrifting || simState.tireSlipRatio > 0.98) {
            spawnTireSmoke(rlX, wPos.y, rlZ, 'smoke');
            spawnTireSmoke(rrX, wPos.y, rrZ, 'smoke');
          }
          if (simState.isBrakeLockup || simState.isUndersteer) {
            const flX = wPos.x + fwdX * 1.38 - rightX * 0.84;
            const flZ = wPos.z + fwdZ * 1.38 - rightZ * 0.84;
            const frX = wPos.x + fwdX * 1.38 + rightX * 0.84;
            const frZ = wPos.z + fwdZ * 1.38 + rightZ * 0.84;
            spawnTireSmoke(flX, wPos.y, flZ, 'smoke');
            spawnTireSmoke(frX, wPos.y, frZ, 'smoke');
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
        const dd = vMs_motion * Math.sin(relAngle) * dt;

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
        }
      }

      function stepAIRivals(dt) {
        aiCars.forEach(ai => {
          const node = sampleTrackAtS(ai.s);
          const lookNode = sampleTrackAtS(ai.s + 95);
          // Use the exact physics-solved PRO speed profile as the AI target speed!
          // This ensures AI cars hit 270-298 km/h on straights AND brake hard before corners!
          const proRef = getProProfileAtDistance(ai.s);
          let targetV = proRef.speedKmh * ai.basePace * simState.aiDifficulty;

          const playerTotalS = (simState.lap - 1) * totalTrackLength + simState.s;
          const aiTotalS = (ai.lap - 1) * totalTrackLength + ai.s;
          const gapMeters = aiTotalS - playerTotalS;

          let targetD = proRef.optimalD;
          ai.stateLabel = proRef.brake > 20 ? 'BRAKING ZONE' : 'FULL PACE';

          if (gapMeters < -4 && gapMeters > -55 && Math.abs(node.curvature) < 0.0025) {
            if (gapMeters > -16) {
              targetD = simState.d > 0 ? simState.d - 3.8 : simState.d + 3.8;
              ai.stateLabel = 'OVERTAKE MOVE';
            } else {
              targetD = simState.d;
              ai.stateLabel = 'SLIPSTREAMING';
            }
            targetV *= 1.06;
          }

          if (gapMeters > 0 && gapMeters < 42) {
            const pressureGain = gapMeters < 20 ? 18 * dt : 7 * dt;
            ai.stress = Math.min(100, ai.stress + pressureGain);

            if (Math.abs(lookNode.curvature) > 0.004) {
              const insideSign = Math.sign(lookNode.curvature || 1);
              targetD = insideSign * 5.2;
              ai.stateLabel = 'DEFENSIVE LINE';
            } else {
              targetD = simState.d * 0.65;
              ai.stateLabel = 'DEFENDING';
            }

            if (ai.stress > 78 && ai.mistakeTimer <= 0 && Math.abs(lookNode.curvature) > 0.0065) {
              if (Math.random() < 0.38 * dt) {
                ai.mistakeTimer = 2.6;
                ai.mistakeType = Math.random() < 0.5 ? 'LATE BRAKE WIDE' : 'APEX LOCKUP';
                ai.stress = 35;
              }
            }
          } else {
            ai.stress = Math.max(8, ai.stress - 5 * dt);
          }

          if (ai.mistakeTimer > 0) {
            ai.mistakeTimer -= dt;
            ai.stateLabel = `⚠ ${ai.mistakeType}`;
            const outsideSign = -Math.sign(node.curvature || 1);
            targetD = outsideSign * (TRACK_WIDTH * 0.42);
            targetV *= 0.72;
            const wAi = sdToWorld(ai.s, ai.d);
            spawnTireSmoke(wAi.x, wAi.y, wAi.z, 'smoke');
          }

          if (Math.abs(gapMeters) < 6.5 && Math.abs(ai.d - simState.d) < 2.8) {
            targetD += (ai.d >= simState.d ? 2.8 : -2.8);
          }

          // AI-to-AI lateral spacing so AI rivals overtake cleanly without overlapping each other
          aiCars.forEach(other => {
            if (other === ai) return;
            const otherTotalS = (other.lap - 1) * totalTrackLength + other.s;
            if (Math.abs(aiTotalS - otherTotalS) < 6.5 && Math.abs(ai.d - other.d) < 2.5) {
              targetD += (ai.d >= other.d ? 1.8 : -1.8);
            }
          });

          // Apply authentic GT3 acceleration and braking rates so AI launches and brakes realistically
          const targetMs = targetV / 3.6;
          if (targetMs < ai.speedMs) {
            // AI Braking into corner (up to 16.5 m/s^2)
            ai.speedMs = Math.max(targetMs, ai.speedMs - 16.5 * dt);
          } else {
            // AI Accelerating using the same GT3 power & drag curve as the player
            const vEff = Math.max(ai.speedMs, 12.5);
            const aiDriveAccel = Math.min(8.25, 338.0 / vEff) * ai.basePace * simState.aiDifficulty;
            const aiDrag = 0.000557 * ai.speedMs * ai.speedMs + 0.14;
            ai.speedMs = Math.min(targetMs, ai.speedMs + Math.max(0.5, aiDriveAccel - aiDrag) * dt);
          }

          ai.d += (targetD - ai.d) * Math.min(1, 3.0 * dt);
          ai.s += ai.speedMs * dt;
          if (ai.s >= totalTrackLength) {
            ai.s -= totalTrackLength;
            ai.lap++;
          }

          const w = sdToWorld(ai.s, ai.d);
          ai.mesh.position.set(w.x, w.y, w.z);
          ai.mesh.rotation.y = -w.heading;

          // Illuminate AI brake tail-lights when braking!
          if (ai.mesh.userData.tailLight) {
            const isAiBraking = (targetMs < ai.speedMs - 1.0) || proRef.brake > 15;
            setSlotBrakeLight(ai.mesh, isAiBraking, 0xff2222, 0x550000);
          }
        });
      }

window.CAR_HANDLING_PROFILES = CAR_HANDLING_PROFILES;
window.getCurrentCarHandling = getCurrentCarHandling;
window.GEAR_RATIOS = GEAR_RATIOS;
window.GEAR_MAX_SPEED = GEAR_MAX_SPEED;
window.simState = simState;
window.aiCars = aiCars;
window.selectCircuit = selectCircuit;
window.resetSession = resetSession;
window.stepPhysics = stepPhysics;
window.stepAIRivals = stepAIRivals;
if (window.__apexTrace) window.__apexTrace('physics.js', 'OK');