// ============================================================================
// APEX PRO RACING // MODULE 7: HUD, TELEMETRY REVIEW & MAIN ANIMATION LOOP
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('main.js', 'START');

// Build Initial Track Scenery Geometry
buildTrackGeometryData();
generateProBenchmarkLap();
rebuild3DCircuitScene();
if (headlightGroup) headlightGroup.visible = currentCircuit.theme.isNight;
simState.bestLapTime = PRO_LAP_TIME;

      const minimapCanvas = document.getElementById('minimap-canvas');
      const minimapCtx = minimapCanvas.getContext('2d');
      const ggCanvas = document.getElementById('gg-canvas');
      const ggCtx = ggCanvas.getContext('2d');
      const shiftLightSpans = Array.from(document.querySelectorAll('#shift-lights span'));

      function updateHUD() {
        const roundedSpeed = String(Math.round(simState.speedKmh));
        document.getElementById('hud-cur-time').textContent = formatLapTime(simState.lapElapsed);
        document.getElementById('hud-top-speed').textContent = roundedSpeed;
        const gearText = (simState.gear === -1)
          ? 'R'
          : String(simState.gear);
        const topGearText = (simState.gear === -1)
          ? 'R檔'
          : `${simState.gear}檔(${simState.autoTransmission ? 'AT' : 'MT'})`;

        const topGearSpan = document.getElementById('hud-top-gear');
        if (topGearSpan) topGearSpan.textContent = topGearText;
        const hudGear = document.getElementById('hud-gear');
        if (hudGear) {
          hudGear.textContent = gearText;
          hudGear.className = (simState.gear === -1)
            ? 'w-11 h-12 rounded-lg bg-red-950/90 border border-red-500/80 flex items-center justify-center font-mono-tech text-2xl font-black text-red-400'
            : 'w-11 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono-tech text-2xl font-extrabold text-amber-400';
        }

        const cornerLimitKmh = (typeof getLookaheadCornerTargetKmh === 'function')
          ? getLookaheadCornerTargetKmh(simState.s, simState.speedKmh)
          : getUpcomingCornerMaxSpeedKmh(simState.s);
        const limitEl = document.getElementById('hud-corner-limit');
        limitEl.textContent = `${cornerLimitKmh}`;
        if (simState.speedKmh > cornerLimitKmh + 22) {
          limitEl.className = 'text-xs font-extrabold text-red-400 animate-pulse';
        } else if (simState.speedKmh > cornerLimitKmh - 5) {
          limitEl.className = 'text-xs font-extrabold text-amber-300';
        } else {
          limitEl.className = 'text-xs font-extrabold text-emerald-400';
        }

        const nosPct = Math.round(simState.nosAmount);
        document.getElementById('bar-nos-top').style.width = `${nosPct}%`;
        const barNosPc = document.getElementById('bar-nos-pc');
        if (barNosPc) barNosPc.style.height = `${nosPct}%`;

        // Live Delta comparison vs Player PB or PRO benchmark
        let refExpected = getProTimeAtDistance(simState.s);
        if (simState.pbTelemetrySamples && simState.pbTelemetrySamples.length > 8) {
          const sample = simState.pbTelemetrySamples.find(p => p.s >= (simState.s % totalTrackLength));
          if (sample && sample.t) refExpected = sample.t;
        }
        const delta = simState.lapElapsed - refExpected;
        const deltaEl = document.getElementById('hud-delta');
        if (deltaEl) {
          const prefix = delta <= 0 ? '▼ -' : '▲ +';
          deltaEl.textContent = `${prefix}${Math.abs(delta).toFixed(3)}s`;
          deltaEl.className = delta <= 0
            ? 'px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 font-bold text-[10px] shadow'
            : 'px-2 py-0.5 rounded bg-red-950/90 text-red-300 border border-red-500/60 font-bold text-[10px] shadow';
        }

        // Wrong way alert visibility
        const wrongWayEl = document.getElementById('hud-wrong-way');
        if (wrongWayEl) {
          wrongWayEl.classList.toggle('hidden', !simState.isWrongWay);
        }

        const lapInvalidEl = document.getElementById('hud-lap-invalid');
        if (lapInvalidEl) {
          lapInvalidEl.classList.add('hidden');
        }

        document.getElementById('hud-speed').textContent = roundedSpeed;
        document.getElementById('hud-rpm').textContent = simState.rpm.toLocaleString();

        const cpHud = (typeof getCurrentCarHandling === 'function') ? getCurrentCarHandling() : null;
        const dtHud = (typeof getCarDrivetrainSpec === 'function') ? getCarDrivetrainSpec(cpHud) : { redlineRpm: 8800 };
        const redlineRpm = dtHud.redlineRpm || 8800;
        const shiftStartRpm = redlineRpm * 0.477;
        const shiftSpanRpm = Math.max(1000, redlineRpm * 0.50);
        const shiftFlashRpm = redlineRpm * 0.9488;
        const activeLights = Math.floor(((simState.rpm - shiftStartRpm) / shiftSpanRpm) * shiftLightSpans.length);
        const blinkShift = simState.rpm >= shiftFlashRpm;
        shiftLightSpans.forEach((sp, idx) => {
          if (idx < activeLights) {
            const color = idx < 4 ? 'bg-emerald-500' : (idx < 7 ? 'bg-amber-500' : 'bg-red-600');
            sp.className = `w-2.5 h-1.5 rounded-sm ${color} ${blinkShift ? 'shift-blink' : ''}`;
          } else {
            sp.className = 'w-2.5 h-1.5 rounded-sm bg-slate-800';
          }
        });
        const isRedlinePulse = (simState.rpm >= shiftFlashRpm && !simState.paused);
        const motecPodEl = document.getElementById('pc-motec-pod');
        if (motecPodEl) motecPodEl.classList.toggle('hud-redline-pulse', isRedlinePulse);
        const topPillEl = document.getElementById('hud-top-pill');
        if (topPillEl) topPillEl.classList.toggle('hud-redline-pulse', isRedlinePulse);

        const thrPct = Math.round(simState.throttleInput);
        const brkPct = Math.round(simState.brakeInput);
        const steerDeg = Math.round(simState.steerInput * 450);

        document.getElementById('bar-throttle').style.height = `${thrPct}%`;
        document.getElementById('val-throttle').textContent = `${thrPct}%`;
        document.getElementById('lbl-thr-slider').textContent = `${thrPct}%`;

        const barBrakeEl = document.getElementById('bar-brake');
        const valBrakeEl = document.getElementById('val-brake');
        if (barBrakeEl) {
          barBrakeEl.style.height = `${brkPct}%`;
          if (brkPct > 88 || simState.isBrakeLockup) {
            barBrakeEl.className = 'relative z-10 w-full bg-red-600 animate-pulse transition-all duration-75';
            if (valBrakeEl) valBrakeEl.className = 'text-[9px] font-mono-tech text-red-400 mt-0.5 font-bold';
          } else if (brkPct > 75) {
            barBrakeEl.className = 'relative z-10 w-full bg-orange-500 transition-all duration-75';
            if (valBrakeEl) valBrakeEl.className = 'text-[9px] font-mono-tech text-orange-400 mt-0.5 font-bold';
          } else if (brkPct > 5) {
            barBrakeEl.className = 'relative z-10 w-full bg-amber-400 transition-all duration-75';
            if (valBrakeEl) valBrakeEl.className = 'text-[9px] font-mono-tech text-amber-300 mt-0.5 font-bold';
          } else {
            barBrakeEl.className = 'relative z-10 w-full bg-slate-600 transition-all duration-75';
            if (valBrakeEl) valBrakeEl.className = 'text-[9px] font-mono-tech text-slate-400 mt-0.5 font-bold';
          }
        }
        if (valBrakeEl) valBrakeEl.textContent = `${brkPct}%`;
        document.getElementById('lbl-brk-slider').textContent = `${brkPct}%`;

        document.getElementById('lbl-steer-deg').textContent = `${steerDeg}°`;
        document.getElementById('wheel-visual').style.transform = `rotate(${simState.steerInput * 135}deg)`;

        const node = sampleTrackAtS(simState.s);
        document.getElementById('hud-corner-banner').textContent = node.name;
        const shownGripPct = Math.round(((simState.effectiveGrip !== undefined ? simState.effectiveGrip : simState.surfaceGrip) || 1) * 100);
        document.getElementById('hud-surface-grip').textContent = `GRIP: ${shownGripPct}%${simState.weather === 'wet' ? ' · WET' : ''}`;
        document.getElementById('hud-downforce').textContent = `AERO: ${simState.downforceKgf} kgf`;

        document.getElementById('btn-recover-banner').classList.toggle('hidden', !simState.offTrack);
        document.getElementById('alert-wall-scrape').classList.toggle('hidden', !simState.wallScrapeWarning);
        const jumpEl = document.getElementById('alert-jump-start');
        if (jumpEl) jumpEl.classList.toggle('hidden', !simState.hasJumpStarted);

        // Progressive Heavy / Trail Braking & Lift Guidance
        const cueEl = document.getElementById('alert-brake-now');
        if (cueEl) {
          const cueTier = simState.drivingCue || 'none';
          const tgtKmh = simState.cueTargetKmh || cornerLimitKmh;
          if (cueTier === 'heavy') {
            cueEl.classList.remove('hidden');
            cueEl.className = 'px-3 py-0.5 rounded-full bg-red-600/95 text-white font-mono-tech text-[11px] font-extrabold shadow-lg border border-red-300/60';
            cueEl.textContent = `🔴 HEAVY BRAKE · 重踩煞車 (S ➔ 空白鍵入彎) · 目標 ${tgtKmh} km/h`;
          } else if (cueTier === 'trail') {
            cueEl.classList.remove('hidden');
            cueEl.className = 'px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono-tech text-[11px] font-extrabold shadow-lg';
            cueEl.textContent = `🟡 TRAIL BRAKE · 輕含煞車 (25%~40%) 目標 ${tgtKmh} km/h — 嚴禁踩死`;
          } else if (cueTier === 'lift') {
            cueEl.classList.remove('hidden');
            cueEl.className = 'px-3 py-0.5 rounded-full bg-sky-500 text-slate-950 font-mono-tech text-[11px] font-extrabold shadow-lg';
            cueEl.textContent = `⚡ LIFT & COAST · 略收油門滑行入彎（約 ${tgtKmh} km/h）`;
          } else {
            cueEl.classList.add('hidden');
          }
        }
        document.getElementById('alert-nos').classList.toggle('hidden', !simState.isNosActive);
        document.getElementById('alert-drift').classList.toggle('hidden', !simState.isDrifting);
        document.getElementById('alert-lockup').classList.toggle('hidden', !simState.isBrakeLockup);
        document.getElementById('alert-oversteer').classList.toggle('hidden', !simState.isOversteer);
        document.getElementById('alert-understeer').classList.toggle('hidden', !simState.isUndersteer);
        document.getElementById('alert-slipstream').classList.toggle('hidden', !simState.inSlipstream);
        document.getElementById('alert-kerb').classList.toggle('hidden', !simState.offTrack);

        const edgeEl = document.getElementById('edge-feedback');
        if (edgeEl) {
          const highAlert = simState.isBrakeLockup || simState.isOversteer || simState.isUndersteer;
          const nearGripEdge = (simState.tireSlipRatio > 0.85 || brkPct > 84);
          if (highAlert) {
            edgeEl.style.boxShadow = 'inset 0 0 120px rgba(239, 68, 68, 0.65)';
            edgeEl.style.opacity = '1';
          } else if (nearGripEdge) {
            edgeEl.style.boxShadow = 'inset 0 0 95px rgba(245, 158, 11, 0.38)';
            edgeEl.style.opacity = '0.85';
          } else {
            edgeEl.style.opacity = '0';
          }
        }

        if (!simState.isMobileGamepadActive) {
          const cpLoad = (typeof getCurrentCarHandling === 'function') ? getCurrentCarHandling() : null;
          const warnLoadKg = Math.round(((cpLoad && cpLoad.weightKg ? cpLoad.weightKg : 1245) + 120) * 0.34);
          ['fl', 'fr', 'rl', 'rr'].forEach(k => {
            const load = simState.tireLoads[k];
            document.getElementById(`tire-load-${k}`).textContent = `${load}`;
            const vis = document.getElementById(`tire-vis-${k}`);
            if (simState.isBrakeLockup && (k === 'fl' || k === 'fr')) {
              vis.className = 'w-2.5 h-3.5 rounded-sm bg-red-600 transition-colors';
            } else if (load > warnLoadKg) {
              vis.className = 'w-2.5 h-3.5 rounded-sm bg-amber-500 transition-colors';
            } else {
              vis.className = 'w-2.5 h-3.5 rounded-sm bg-emerald-500 transition-colors';
            }
          });

          drawGGDiagram();
          drawMinimap();
        }

        const tireBadgeEl = document.getElementById('hud-tire-badge');
        if (tireBadgeEl && typeof getCurrentTireProfile === 'function') {
          const tp = getCurrentTireProfile();
          const tireCodeEl = document.getElementById('hud-tire-code');
          const tireLabelEl = document.getElementById('hud-tire-label');
          if (tireCodeEl) {
            tireCodeEl.textContent = tp.code;
            tireCodeEl.style.color = tp.color;
          }
          if (tireLabelEl) tireLabelEl.textContent = tp.enLabel;
          tireBadgeEl.style.borderColor = tp.color;
        }

        const flagBannerEl = document.getElementById('hud-flag-banner');
        if (flagBannerEl) {
          const fl = simState.activeFlag || 'none';
          if (fl === 'none') {
            flagBannerEl.classList.add('hidden');
          } else {
            flagBannerEl.classList.remove('hidden');
            flagBannerEl.textContent = simState.flagMessage || (fl === 'yellow' ? '🟨 YELLOW FLAG' : (fl === 'blue' ? '🟦 BLUE FLAG' : '🏁 CHECKERED FLAG'));
            if (fl === 'yellow') {
              flagBannerEl.className = 'flag-wave px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-mono-tech text-xs sm:text-sm font-black shadow-2xl tracking-wider border-2 border-amber-100 mt-1 pointer-events-none';
            } else if (fl === 'blue') {
              flagBannerEl.className = 'flag-wave px-4 py-1.5 rounded-full bg-sky-500 text-white font-mono-tech text-xs sm:text-sm font-black shadow-2xl tracking-wider border-2 border-sky-200 mt-1 pointer-events-none';
            } else {
              flagBannerEl.className = 'flag-wave px-5 py-1.5 rounded-full bg-slate-900 text-white font-mono-tech text-xs sm:text-sm font-black shadow-2xl tracking-wider border-2 border-white mt-1 pointer-events-none';
            }
          }
        }

        if (simState.mode === 'ai_race') {
          updateAIRaceHUD();
        } else {
          const radarBox = document.getElementById('hud-proximity-radar');
          if (radarBox) radarBox.classList.add('hidden');
        }
      }

      function drawGGDiagram() {
        const w = ggCanvas.width;
        const h = ggCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        ggCtx.clearRect(0, 0, w, h);

        const cpGG = (typeof getCurrentCarHandling === 'function') ? getCurrentCarHandling() : null;
        const clsGG = cpGG && cpGG.carClass ? cpGG.carClass : 'GT3';
        const pxPerG = (clsGG === 'F1' || clsGG === 'LMP1') ? 4.4 : (clsGG === 'HYPER' ? 7.5 : 11.0);

        ggCtx.strokeStyle = '#334155';
        ggCtx.lineWidth = 1;
        [11, 22].forEach(r => {
          ggCtx.beginPath();
          ggCtx.arc(cx, cy, r, 0, Math.PI * 2);
          ggCtx.stroke();
        });

        const gx = Math.max(-24, Math.min(24, simState.latG * pxPerG));
        const gy = Math.max(-24, Math.min(24, -simState.longG * pxPerG));
        ggCtx.fillStyle = simState.tireSlipRatio > 0.92 ? '#ef4444' : '#22d3ee';
        ggCtx.beginPath();
        ggCtx.arc(cx + gx, cy + gy, 3.5, 0, Math.PI * 2);
        ggCtx.fill();

        document.getElementById('hud-g-readout').textContent =
          `${Math.hypot(simState.latG, simState.longG).toFixed(1)}G`;
      }

      let _minimapBoundsKey = '';
      let _minimapBounds = { minX: -1220, spanX: 2550, minZ: -110, spanZ: 1450 };
      function getTrackMinimapBounds() {
        const key = `${currentCircuit ? currentCircuit.id : ''}_${Math.round(totalTrackLength)}`;
        if (key === _minimapBoundsKey || !trackNodes.length) return _minimapBounds;
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (let i = 0; i < trackNodes.length; i++) {
          const n = trackNodes[i];
          if (n.x < minX) minX = n.x;
          if (n.x > maxX) maxX = n.x;
          if (n.z < minZ) minZ = n.z;
          if (n.z > maxZ) maxZ = n.z;
        }
        const spanX = Math.max(100, maxX - minX);
        const spanZ = Math.max(100, maxZ - minZ);
        const padX = spanX * 0.08;
        const padZ = spanZ * 0.08;
        _minimapBounds = {
          minX: minX - padX,
          spanX: spanX + padX * 2,
          minZ: minZ - padZ,
          spanZ: spanZ + padZ * 2
        };
        _minimapBoundsKey = key;
        return _minimapBounds;
      }

      function mapWorldToCanvas(x, z, w, h) {
        const pad = 8;
        const b = getTrackMinimapBounds();
        const scaleX = (w - pad * 2) / b.spanX;
        const scaleZ = (h - pad * 2) / b.spanZ;
        const s = Math.min(scaleX, scaleZ);
        const drawW = b.spanX * s;
        const drawH = b.spanZ * s;
        const offX = (w - drawW) * 0.5;
        const offY = (h - drawH) * 0.5;
        const px = offX + (x - b.minX) * s;
        const py = h - (offY + (z - b.minZ) * s);
        return { px, py };
      }

      function drawMinimap() {
        const w = minimapCanvas.width;
        const h = minimapCanvas.height;
        minimapCtx.clearRect(0, 0, w, h);

        minimapCtx.strokeStyle = '#475569';
        minimapCtx.lineWidth = 2.5;
        minimapCtx.beginPath();
        for (let i = 0; i < TRACK_SAMPLES; i += 8) {
          const n = trackNodes[i];
          const { px, py } = mapWorldToCanvas(n.x, n.z, w, h);
          if (i === 0) minimapCtx.moveTo(px, py);
          else minimapCtx.lineTo(px, py);
        }
        minimapCtx.closePath();
        minimapCtx.stroke();

        if (simState.mode === 'time_attack') {
          const g = sampleGhostAtTime(proTelemetrySamples, simState.lapElapsed);
          if (g) {
            const gp = mapWorldToCanvas(g.x, g.z, w, h);
            minimapCtx.fillStyle = '#22d3ee';
            minimapCtx.beginPath();
            minimapCtx.arc(gp.px, gp.py, 2.8, 0, Math.PI * 2);
            minimapCtx.fill();
          }
        } else {
          aiCars.forEach(ai => {
            const aw = sdToWorld(ai.s, ai.d);
            const ap = mapWorldToCanvas(aw.x, aw.z, w, h);
            minimapCtx.fillStyle = '#f59e0b';
            minimapCtx.beginPath();
            minimapCtx.arc(ap.px, ap.py, 2.8, 0, Math.PI * 2);
            minimapCtx.fill();
          });
        }

        const pw = sdToWorld(simState.s, simState.d);
        const pp = mapWorldToCanvas(pw.x, pw.z, w, h);
        minimapCtx.fillStyle = '#10b981';
        minimapCtx.beginPath();
        minimapCtx.arc(pp.px, pp.py, 3.5, 0, Math.PI * 2);
        minimapCtx.fill();
      }

      function updateAIRaceHUD() {
        const playerProgress = (simState.lap - 1) * totalTrackLength + simState.s;
        const refSpeedMs = Math.max(38, simState.speedMs || 52);
        const standings = [{
          name: 'YOU (PLAYER)',
          shortName: 'YOU',
          progress: playerProgress,
          gapSec: 0,
          stateLabel: simState.inSlipstream ? 'SLIPSTREAM' : 'RACING',
          isPlayer: true
        }];
        aiCars.forEach(ai => {
          const aiProg = (ai.lap - 1) * totalTrackLength + ai.s;
          const gapMeters = aiProg - playerProgress;
          const gapSec = gapMeters / Math.max(38, (ai.speedMs + refSpeedMs) * 0.5);
          standings.push({
            name: ai.name,
            shortName: ai.name.split(' ')[1] || ai.name,
            progress: aiProg,
            gapSec,
            stress: Math.round(ai.stress),
            stateLabel: ai.stateLabel,
            isPlayer: false
          });
        });
        standings.sort((a, b) => b.progress - a.progress);

        const playerIdx = standings.findIndex(s => s.isPlayer);
        const playerRank = playerIdx + 1;
        document.getElementById('hud-race-pos').textContent = `P${playerRank} / 4`;

        const gapSummaryEl = document.getElementById('hud-gap-summary');
        if (gapSummaryEl) {
          if (playerIdx > 0) {
            const ahead = standings[playerIdx - 1];
            gapSummaryEl.textContent = `▲ 前車 -${Math.abs(ahead.gapSec).toFixed(2)}s`;
            gapSummaryEl.className = 'text-amber-300 font-bold';
          } else if (standings.length > 1) {
            const behind = standings[1];
            gapSummaryEl.textContent = `▼ 領先 +${Math.abs(behind.gapSec).toFixed(2)}s`;
            gapSummaryEl.className = 'text-emerald-400 font-bold';
          }
        }

        const listEl = document.getElementById('ai-drivers-list');
        listEl.innerHTML = standings.map((entry, idx) => {
          if (entry.isPlayer) {
            return `
          <div class="flex items-center justify-between gap-1.5 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40">
            <span class="text-emerald-300 font-extrabold">P${idx + 1} YOU</span>
            <span class="text-emerald-200 font-bold text-[9px]">${entry.stateLabel}</span>
          </div>`;
          }
          const isAhead = entry.gapSec > 0;
          const gapStr = isAhead ? `-${Math.abs(entry.gapSec).toFixed(2)}s` : `+${Math.abs(entry.gapSec).toFixed(2)}s`;
          const gapCol = isAhead ? 'text-amber-300' : 'text-sky-300';
          return `
        <div class="flex items-center justify-between gap-1.5 px-1">
          <span class="text-slate-200 truncate">P${idx + 1} ${entry.shortName}</span>
          <span class="${gapCol} font-bold">${gapStr} <small class="text-[8px] text-slate-400">${entry.stateLabel.slice(0, 7)}</small></span>
        </div>
      `;
        }).join('');

        // Spotter Proximity Radar & Slipstream Defense Warning
        let carLeft = false;
        let carRight = false;
        let carBehind = false;

        aiCars.forEach(ai => {
          let ds = ai.s - simState.s;
          if (ds > totalTrackLength * 0.5) ds -= totalTrackLength;
          if (ds < -totalTrackLength * 0.5) ds += totalTrackLength;
          const dd = ai.d - simState.d;

          // Beside player alongside checks (-12m to +7m)
          if (ds >= -12 && ds <= 7) {
            if (dd < -0.8 && dd > -5.2) carLeft = true;
            if (dd > 0.8 && dd < 5.2) carRight = true;
          }
          // Direct tailgating in slipstream
          if (ds >= -22 && ds < -2 && Math.abs(dd) <= 2.2) {
            carBehind = true;
          }
        });

        const radarContainer = document.getElementById('hud-proximity-radar');
        if (radarContainer) {
          const anyRadar = carLeft || carBehind || carRight;
          radarContainer.classList.toggle('hidden', !anyRadar);
          const rL = document.getElementById('radar-left');
          const rB = document.getElementById('radar-behind');
          const rR = document.getElementById('radar-right');
          if (rL) rL.classList.toggle('hidden', !carLeft);
          if (rB) rB.classList.toggle('hidden', !carBehind);
          if (rR) rR.classList.toggle('hidden', !carRight);
        }
      }

      // --------------------------------------------------------------------------
      // 10. POST-LAP TELEMETRY CHARTS, OVERLAY DELTA-T & INTERACTIVE SCRUBBING
      // --------------------------------------------------------------------------
      const activeTelemetryState = {
        source: 'current',
        completedTime: null,
        recordObj: null,
        compareTarget: 'none',
        samples: [],
        compareSamples: [],
        trackLen: 5500,
        mapBounds: null,
        baseImgP: null,
        baseImgS: null,
        baseImgD: null,
        baseImgT: null,
        scrubBound: false
      };

      function interpTelemetryAtS(arr, targetS) {
        if (!arr || arr.length === 0) return null;
        if (arr.length === 1 || targetS <= arr[0].s) return arr[0];
        const last = arr[arr.length - 1];
        if (targetS >= last.s) return last;
        let lo = 0, hi = arr.length - 1;
        while (lo + 1 < hi) {
          const mid = (lo + hi) >> 1;
          if (arr[mid].s <= targetS) lo = mid;
          else hi = mid;
        }
        const a = arr[lo], b = arr[hi];
        const span = Math.max(1e-4, b.s - a.s);
        const f = Math.max(0, Math.min(1, (targetS - a.s) / span));
        return {
          s: targetS,
          t: (a.t || 0) + ((b.t || 0) - (a.t || 0)) * f,
          x: (a.x || 0) + ((b.x || 0) - (a.x || 0)) * f,
          z: (a.z || 0) + ((b.z || 0) - (a.z || 0)) * f,
          speed: (a.speed || 0) + ((b.speed || 0) - (a.speed || 0)) * f,
          throttle: (a.throttle || 0) + ((b.throttle || 0) - (a.throttle || 0)) * f,
          brake: (a.brake || 0) + ((b.brake || 0) - (a.brake || 0)) * f,
          steer: (a.steer || 0) + ((b.steer || 0) - (a.steer || 0)) * f,
          latG: (a.latG || 0) + ((b.latG || 0) - (a.latG || 0)) * f,
          gear: Math.round((a.gear || 1) + ((b.gear || 1) - (a.gear || 1)) * f)
        };
      }

      function computeCircuitPointsXY(cirObj) {
        if (!cirObj || !cirObj.points || cirObj.points.length < 3) return [];
        const pts = cirObj.points;
        const N = pts.length;
        const out = [];
        const cr = (p0, p1, p2, p3, t) => 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
        for (let i = 0; i < 260; i++) {
          const u = (i / 260) * N;
          const idx = Math.floor(u);
          const frac = u - idx;
          const p0 = pts[(idx - 1 + N) % N], p1 = pts[idx % N], p2 = pts[(idx + 1) % N], p3 = pts[(idx + 2) % N];
          out.push({ x: cr(p0.x, p1.x, p2.x, p3.x, frac), z: cr(p0.z, p1.z, p2.z, p3.z, frac) });
        }
        return out;
      }

      function mapCustomXYToCanvas(x, z, w, h, bounds) {
        if (!bounds) return mapWorldToCanvas(x, z, w, h);
        const pad = 12;
        const sc = Math.min((w - pad * 2) / bounds.spanX, (h - pad * 2) / bounds.spanZ);
        const ox = (w - bounds.spanX * sc) * 0.5 - bounds.minX * sc;
        const oy = (h - bounds.spanZ * sc) * 0.5 - bounds.minZ * sc;
        return { px: x * sc + ox, py: z * sc + oy };
      }

      function bindTelemetryScrubbing() {
        if (activeTelemetryState.scrubBound) return;
        activeTelemetryState.scrubBound = true;
        const canvasIds = ['chart-pedals', 'chart-steer-speed', 'chart-delta'];
        const drawOverlayAtRatio = (ratioX) => {
          const st = activeTelemetryState;
          const sPos = Math.max(0, Math.min(st.trackLen, ratioX * st.trackLen));
          const pt = interpTelemetryAtS(st.samples, sPos);
          if (!pt) return;
          const cmp = (st.compareSamples && st.compareSamples.length >= 4) ? interpTelemetryAtS(st.compareSamples, sPos) : null;

          const canvases = [
            [document.getElementById('chart-pedals'), st.baseImgP],
            [document.getElementById('chart-steer-speed'), st.baseImgS],
            [document.getElementById('chart-delta'), st.baseImgD]
          ];
          canvases.forEach(([cv, base]) => {
            if (!cv || !base) return;
            const ctx = cv.getContext('2d');
            ctx.putImageData(base, 0, 0);
            const x = ratioX * cv.width;
            ctx.strokeStyle = 'rgba(248, 250, 252, 0.75)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x, cv.height);
            ctx.stroke();
          });

          const cTraj = document.getElementById('chart-trajectory');
          if (cTraj && st.baseImgT) {
            const ctxT = cTraj.getContext('2d');
            ctxT.putImageData(st.baseImgT, 0, 0);
            const { px, py } = mapCustomXYToCanvas(pt.x, pt.z, cTraj.width, cTraj.height, st.mapBounds);
            ctxT.fillStyle = '#38bdf8';
            ctxT.strokeStyle = '#ffffff';
            ctxT.lineWidth = 2;
            ctxT.beginPath();
            ctxT.arc(px, py, 5, 0, Math.PI * 2);
            ctxT.fill();
            ctxT.stroke();
          }

          const readoutEl = document.getElementById('tel-hover-readout');
          if (readoutEl) {
            const dtVal = (cmp && Number.isFinite(pt.t) && Number.isFinite(cmp.t)) ? (pt.t - cmp.t) : null;
            const dtHtml = dtVal !== null
              ? `<span style="color:${dtVal <= 0 ? '#34d399' : '#fb7185'};font-weight:800;">Δt ${dtVal >= 0 ? '+' : ''}${dtVal.toFixed(3)}s</span>`
              : '';
            const cmpSpdHtml = cmp ? `<span style="color:#e879f9;">對比車速 ${Math.round(cmp.speed)} km/h</span>` : '';
            readoutEl.innerHTML = `
              <span>📍 距離 <b>${Math.round(pt.s)}m</b></span>
              <span style="color:#fbbf24;">🏎 車速 <b>${Math.round(pt.speed)} km/h</b> (${pt.gear || 1}檔)</span>
              <span style="color:#10b981;">油門 <b>${Math.round(pt.throttle)}%</b></span>
              <span style="color:#ef4444;">煞車 <b>${Math.round(pt.brake)}%</b></span>
              <span style="color:#22d3ee;">轉向 <b>${Math.round(pt.steer)}°</b></span>
              <span>側向G <b>${(pt.latG || 0).toFixed(2)}G</b></span>
              ${cmpSpdHtml} ${dtHtml}`;
          }
        };
        const restoreBase = () => {
          const st = activeTelemetryState;
          [
            [document.getElementById('chart-pedals'), st.baseImgP],
            [document.getElementById('chart-steer-speed'), st.baseImgS],
            [document.getElementById('chart-delta'), st.baseImgD],
            [document.getElementById('chart-trajectory'), st.baseImgT]
          ].forEach(([cv, base]) => {
            if (cv && base) cv.getContext('2d').putImageData(base, 0, 0);
          });
        };
        canvasIds.forEach(id => {
          const el = document.getElementById(id);
          if (!el) return;
          el.addEventListener('pointermove', (e) => {
            const rect = el.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
            drawOverlayAtRatio(ratio);
          });
          el.addEventListener('pointerleave', restoreBase);
        });
      }

      function openTelemetryModal(source = 'current', completedTime = null, recordObj = null, compareTarget = null) {
        simState.paused = true;
        document.getElementById('modal-telemetry').classList.remove('hidden');

        const isRecordMode = (source === 'record' && recordObj);
        let rawSamples;
        let targetCircuit = currentCircuit;
        let trackLen = totalTrackLength;
        let lapTimeVal = completedTime;
        let sec1 = simState.sector1Time;
        let sec2 = simState.sector2Time;
        let sec3 = simState.sector3Time;
        let lockups = simState.lockupCount;
        let understeers = simState.understeerCount;

        if (isRecordMode) {
          rawSamples = Array.isArray(recordObj.telemetry) ? recordObj.telemetry : [];
          targetCircuit = (typeof CIRCUITS !== 'undefined' && CIRCUITS.find(c => c.id === recordObj.circuitId)) || currentCircuit;
          trackLen = recordObj.trackLengthM || (rawSamples.length ? rawSamples[rawSamples.length - 1].s : totalTrackLength) || totalTrackLength;
          lapTimeVal = recordObj.timing.lapTime;
          sec1 = recordObj.timing.s1;
          sec2 = recordObj.timing.s2;
          sec3 = recordObj.timing.s3;
          lockups = recordObj.timing.lockups || 0;
          understeers = recordObj.timing.understeers || 0;
        } else {
          let candidateSamples = simState.currentLapSamples;
          if (completedTime && simState.lastCompletedLapSamples && simState.lastCompletedLapSamples.length >= 8) {
            candidateSamples = simState.lastCompletedLapSamples;
          } else if (!candidateSamples || candidateSamples.length < 8) {
            if (simState.lastCompletedLapSamples && simState.lastCompletedLapSamples.length >= 8) {
              candidateSamples = simState.lastCompletedLapSamples;
            } else if (simState.pbTelemetrySamples && simState.pbTelemetrySamples.length >= 8) {
              candidateSamples = simState.pbTelemetrySamples;
            }
          }
          const usePro = (source === 'pro') || !candidateSamples || (candidateSamples.length < 8);
          rawSamples = usePro ? proTelemetrySamples : candidateSamples;
          lapTimeVal = completedTime || (usePro ? PRO_LAP_TIME : simState.lapElapsed);
        }

        // Guarantee strictly non-decreasing track distance (s) so a wrap-around sample can never draw a backward slash across the chart
        const samples = [];
        let lastMonotonicS = -1;
        for (let i = 0; i < rawSamples.length; i++) {
          const pt = rawSamples[i];
          if (pt && typeof pt.s === 'number' && pt.s >= lastMonotonicS && pt.s <= trackLen + 25.0) {
            samples.push(pt);
            lastMonotonicS = pt.s;
          }
        }
        const effectiveTrackLen = Math.max(trackLen, (samples.length ? samples[samples.length - 1].s : 1), 100);

        // Populate metadata strip (Car Setup + Track Conditions snapshot)
        const metaStrip = document.getElementById('tel-meta-strip');
        if (metaStrip) {
          const tMap = { soft: 'S 軟胎', medium: 'M 中性胎', hard: 'H 硬胎', wet: 'W 全雨胎' };
          const gMap = { short: '密齒比', standard: '標準齒比', long: '疏齒比' };
          const sMap = { soft: '偏軟懸吊', balanced: '均衡懸吊', stiff: '偏硬懸吊' };
          const surfMap = { green: '綠地新鋪 (98%)', fast: '標準賽事 (100%)', optimum: '最佳橡膠 (102%)', wet: '濕地積水 (72%)' };
          const metaCar = isRecordMode ? recordObj.car : {
            carName: (typeof getActiveCarMeta === 'function' ? getActiveCarMeta().name : (carAssetState.label || 'GT3')),
            carClass: (typeof getActiveCarMeta === 'function' ? getActiveCarMeta().carClass : 'GT3')
          };
          const metaSetup = isRecordMode ? recordObj.setup : Object.assign({
            tireCompound: simState.tireCompound || 'medium',
            transmission: simState.autoTransmission ? 'AT' : 'MT'
          }, simState.carSetup || { aeroWing: 3, brakeBias: 58, gearRatio: 'standard', suspension: 'balanced' });
          const metaCond = isRecordMode ? recordObj.conditions : ((typeof getSessionConditionsSnapshot === 'function')
            ? getSessionConditionsSnapshot()
            : { weather: simState.weather || 'dry', surfaceState: 'fast', ambientTempC: 23, trackTempC: 35, timeOfDay: 'day' });
          const recDate = isRecordMode ? (recordObj.recordedAt || '').slice(0, 16).replace('T', ' ') : new Date().toISOString().slice(0, 16).replace('T', ' ');
          const metaEdition = isRecordMode ? recordObj.edition : simState.edition;

          metaStrip.innerHTML = `
            <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] leading-relaxed">
              <div class="text-[10px] text-amber-400 font-bold mb-1">🏎️ 賽車與調校設定 (CAR &amp; SETUP)</div>
              <div class="text-white font-bold">${metaCar.carName} <span class="text-cyan-300">[${metaCar.carClass}]</span></div>
              <div class="text-slate-300">${tMap[metaSetup.tireCompound] || metaSetup.tireCompound} · 空力尾翼 <b>Lv.${metaSetup.aeroWing}</b> · 煞車前軸 <b>${metaSetup.brakeBias}%</b> · ${gMap[metaSetup.gearRatio] || '標準齒'} · ${sMap[metaSetup.suspension] || '均衡'} · ${metaSetup.transmission}</div>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] leading-relaxed">
              <div class="text-[10px] text-sky-400 font-bold mb-1">🌦️ 當日賽道與天候環境 (CONDITIONS · ${recDate})</div>
              <div class="text-white font-bold">${targetCircuit.name} <span class="text-emerald-300">(${metaEdition === 'arcade' ? '娛樂 NOS' : '真實模擬'})</span></div>
              <div class="text-slate-300">${metaCond.weather === 'wet' ? '🌧 雨天濕地' : '☀ 晴朗乾地'} · 路面 <b>${surfMap[metaCond.surfaceState] || metaCond.surfaceState}</b> · 氣溫 <b>${metaCond.ambientTempC}°C</b> / 賽道 <b>${metaCond.trackTempC}°C</b></div>
            </div>`;
        }

        // Populate Compare Selector
        const selCmp = document.getElementById('select-telemetry-compare');
        const resolvedCmp = compareTarget !== null ? compareTarget : (selCmp ? selCmp.value : 'none');
        if (selCmp) {
          const histOpts = [];
          if (window.ApexRecords && typeof window.ApexRecords.getAllHistory === 'function') {
            window.ApexRecords.getAllHistory({ circuitId: targetCircuit.id, validOnly: true }).forEach(r => {
              if (recordObj && r.id === recordObj.id) return;
              if (!r.telemetry || r.telemetry.length < 4) return;
              histOpts.push(`<option value="${r.id}">對比：${formatLapTime(r.timing.lapTime)} · ${r.car.carName} [${r.carClass}/${r.conditions.weather === 'wet' ? '濕' : '乾'}]</option>`);
            });
          }
          selCmp.innerHTML = `<option value="none">疊加對比：關閉</option><option value="pro">疊加：PRO 官方基準圈</option>${histOpts.join('')}`;
          selCmp.value = (resolvedCmp && selCmp.querySelector(`option[value="${resolvedCmp}"]`)) ? resolvedCmp : 'none';
        }
        const activeCmpVal = selCmp ? selCmp.value : 'none';

        let compareSamples = [];
        if (activeCmpVal === 'pro' && targetCircuit.id === currentCircuit.id) {
          compareSamples = proTelemetrySamples;
        } else if (activeCmpVal && activeCmpVal !== 'none' && activeCmpVal !== 'pro' && window.ApexRecords) {
          const cmpRec = window.ApexRecords.getRecordById(activeCmpVal);
          if (cmpRec && Array.isArray(cmpRec.telemetry)) compareSamples = cmpRec.telemetry;
        }

        activeTelemetryState.source = source;
        activeTelemetryState.completedTime = lapTimeVal;
        activeTelemetryState.recordObj = recordObj;
        activeTelemetryState.compareTarget = activeCmpVal;
        activeTelemetryState.samples = samples;
        activeTelemetryState.compareSamples = compareSamples;
        activeTelemetryState.trackLen = effectiveTrackLen;

        const ghostBtn = document.getElementById('btn-telemetry-load-ghost');
        if (ghostBtn) {
          ghostBtn.disabled = samples.length < 4;
          ghostBtn.style.opacity = samples.length < 4 ? '0.45' : '1';
        }

        document.getElementById('tel-laptime').textContent = formatLapTime(lapTimeVal);
        document.getElementById('tel-s1').textContent = sec1 ? sec1.toFixed(3) + 's' : (PRO_LAP_TIME * 0.33).toFixed(3) + 's';
        document.getElementById('tel-s2').textContent = sec2 ? sec2.toFixed(3) + 's' : (PRO_LAP_TIME * 0.35).toFixed(3) + 's';
        document.getElementById('tel-s3').textContent = sec3 ? sec3.toFixed(3) + 's' : (PRO_LAP_TIME * 0.32).toFixed(3) + 's';

        let maxV = 0;
        samples.forEach(s => { if (s.speed > maxV) maxV = s.speed; });
        document.getElementById('tel-topspeed').textContent = `${Math.round(maxV)} km/h`;
        document.getElementById('tel-incidents').textContent = `${lockups} 鎖死 / ${understeers} 外拋`;

        const cPedal = document.getElementById('chart-pedals');
        cPedal.width = cPedal.clientWidth || 640;
        cPedal.height = cPedal.clientHeight || 160;
        const ctxP = cPedal.getContext('2d');
        ctxP.clearRect(0, 0, cPedal.width, cPedal.height);

        [0.338, 0.680].forEach(r => {
          const sx = r * cPedal.width;
          ctxP.strokeStyle = '#1e293b';
          ctxP.beginPath(); ctxP.moveTo(sx, 0); ctxP.lineTo(sx, cPedal.height); ctxP.stroke();
        });

        ctxP.strokeStyle = '#10b981';
        ctxP.lineWidth = 2;
        ctxP.beginPath();
        samples.forEach((pt, idx) => {
          const x = Math.min(cPedal.width, Math.max(0, (pt.s / effectiveTrackLen) * cPedal.width));
          const y = cPedal.height - (pt.throttle / 100) * (cPedal.height - 16) - 8;
          if (idx === 0 || pt.s < samples[idx - 1].s) ctxP.moveTo(x, y);
          else ctxP.lineTo(x, y);
        });
        ctxP.stroke();

        ctxP.strokeStyle = '#ef4444';
        ctxP.lineWidth = 2;
        ctxP.beginPath();
        samples.forEach((pt, idx) => {
          const x = Math.min(cPedal.width, Math.max(0, (pt.s / effectiveTrackLen) * cPedal.width));
          const y = cPedal.height - (pt.brake / 100) * (cPedal.height - 16) - 8;
          if (idx === 0 || pt.s < samples[idx - 1].s) ctxP.moveTo(x, y);
          else ctxP.lineTo(x, y);
        });
        ctxP.stroke();

        if (compareSamples.length >= 4) {
          ctxP.save();
          ctxP.setLineDash([4, 3]);
          ctxP.strokeStyle = 'rgba(232, 121, 249, 0.55)';
          ctxP.lineWidth = 1.4;
          ctxP.beginPath();
          compareSamples.forEach((pt, idx) => {
            const x = Math.min(cPedal.width, Math.max(0, (pt.s / effectiveTrackLen) * cPedal.width));
            const y = cPedal.height - (pt.brake / 100) * (cPedal.height - 16) - 8;
            if (idx === 0) ctxP.moveTo(x, y); else ctxP.lineTo(x, y);
          });
          ctxP.stroke();
          ctxP.restore();
        }

        const cSteer = document.getElementById('chart-steer-speed');
        cSteer.width = cSteer.clientWidth || 640;
        cSteer.height = cSteer.clientHeight || 160;
        const ctxS = cSteer.getContext('2d');
        ctxS.clearRect(0, 0, cSteer.width, cSteer.height);

        const maxSpdPlot = Math.max(350, maxV + 15);
        ctxS.strokeStyle = '#f59e0b';
        ctxS.lineWidth = 2;
        ctxS.beginPath();
        samples.forEach((pt, idx) => {
          const x = Math.min(cSteer.width, Math.max(0, (pt.s / effectiveTrackLen) * cSteer.width));
          const y = cSteer.height - (pt.speed / maxSpdPlot) * (cPederHeight(cSteer) - 16) - 8;
          if (idx === 0 || pt.s < samples[idx - 1].s) ctxS.moveTo(x, y);
          else ctxS.lineTo(x, y);
        });
        ctxS.stroke();

        if (compareSamples.length >= 4) {
          ctxS.save();
          ctxS.setLineDash([5, 3]);
          ctxS.strokeStyle = '#e879f9';
          ctxS.lineWidth = 1.6;
          ctxS.beginPath();
          compareSamples.forEach((pt, idx) => {
            const x = Math.min(cSteer.width, Math.max(0, (pt.s / effectiveTrackLen) * cSteer.width));
            const y = cSteer.height - (pt.speed / maxSpdPlot) * (cPederHeight(cSteer) - 16) - 8;
            if (idx === 0) ctxS.moveTo(x, y); else ctxS.lineTo(x, y);
          });
          ctxS.stroke();
          ctxS.restore();
        }

        ctxS.strokeStyle = '#22d3ee';
        ctxS.lineWidth = 1.8;
        ctxS.beginPath();
        const midY = cSteer.height / 2;
        samples.forEach((pt, idx) => {
          const x = Math.min(cSteer.width, Math.max(0, (pt.s / effectiveTrackLen) * cSteer.width));
          const y = midY - (pt.steer / 450) * (midY - 10);
          if (idx === 0 || pt.s < samples[idx - 1].s) ctxS.moveTo(x, y);
          else ctxS.lineTo(x, y);
        });
        ctxS.stroke();

        // CHANNEL 3: Time Delta (Delta-T vs Distance)
        const cDelta = document.getElementById('chart-delta');
        if (cDelta) {
          cDelta.width = cDelta.clientWidth || 640;
          cDelta.height = cDelta.clientHeight || 112;
          const ctxD = cDelta.getContext('2d');
          ctxD.clearRect(0, 0, cDelta.width, cDelta.height);
          const midD = cDelta.height * 0.5;
          ctxD.strokeStyle = '#334155';
          ctxD.lineWidth = 1;
          ctxD.beginPath(); ctxD.moveTo(0, midD); ctxD.lineTo(cDelta.width, midD); ctxD.stroke();

          if (compareSamples.length >= 4 && samples.length >= 4) {
            const bins = 120;
            const dts = [];
            let maxAbsDt = 1.0;
            for (let b = 0; b <= bins; b++) {
              const sVal = (b / bins) * effectiveTrackLen;
              const p1 = interpTelemetryAtS(samples, sVal);
              const p2 = interpTelemetryAtS(compareSamples, sVal);
              const dtV = (p1 && p2) ? (p1.t - p2.t) : 0;
              dts.push(dtV);
              if (Math.abs(dtV) > maxAbsDt) maxAbsDt = Math.abs(dtV);
            }
            const scaleY = (midD - 10) / maxAbsDt;
            for (let b = 1; b <= bins; b++) {
              const x0 = ((b - 1) / bins) * cDelta.width;
              const x1 = (b / bins) * cDelta.width;
              // Negative dt means faster -> plot UPWARD above zero line in green; positive dt slower -> DOWNWARD in red
              const y0 = midD + dts[b - 1] * scaleY;
              const y1 = midD + dts[b] * scaleY;
              ctxD.strokeStyle = dts[b] <= 0 ? '#10b981' : '#ef4444';
              ctxD.lineWidth = 2.2;
              ctxD.beginPath(); ctxD.moveTo(x0, y0); ctxD.lineTo(x1, y1); ctxD.stroke();
            }
            ctxD.fillStyle = '#94a3b8';
            ctxD.font = '10px monospace';
            ctxD.fillText(`更快 -${maxAbsDt.toFixed(1)}s`, 6, 12);
            ctxD.fillText(`更慢 +${maxAbsDt.toFixed(1)}s`, 6, cDelta.height - 5);
          } else {
            ctxD.fillStyle = '#64748b';
            ctxD.font = '11px sans-serif';
            ctxD.fillText('選擇上方「疊加對比」圈速（如 PRO 基準圈或歷史單圈）即可顯示各彎道時間差 Δt 曲線', 14, midD + 4);
          }
          activeTelemetryState.baseImgD = ctxD.getImageData(0, 0, cDelta.width, cDelta.height);
        }

        const cTraj = document.getElementById('chart-trajectory');
        const ctxT = cTraj.getContext('2d');
        ctxT.clearRect(0, 0, cTraj.width, cTraj.height);

        let trajBounds = null;
        const ptsXY = (targetCircuit.id === currentCircuit.id)
          ? trackNodes.filter((_, i) => i % 5 === 0)
          : computeCircuitPointsXY(targetCircuit);
        if (ptsXY.length >= 3) {
          let mnX = Infinity, mxX = -Infinity, mnZ = Infinity, mxZ = -Infinity;
          ptsXY.forEach(p => { if (p.x < mnX) mnX = p.x; if (p.x > mxX) mxX = p.x; if (p.z < mnZ) mnZ = p.z; if (p.z > mxZ) mxZ = p.z; });
          trajBounds = { minX: mnX, maxX: mxX, minZ: mnZ, maxZ: mxZ, spanX: Math.max(10, mxX - mnX), spanZ: Math.max(10, mxZ - mnZ) };
        }
        activeTelemetryState.mapBounds = trajBounds;

        ctxT.strokeStyle = '#334155';
        ctxT.lineWidth = 6;
        ctxT.beginPath();
        ptsXY.forEach((n, i) => {
          const { px, py } = mapCustomXYToCanvas(n.x, n.z, cTraj.width, cTraj.height, trajBounds);
          if (i === 0) ctxT.moveTo(px, py);
          else ctxT.lineTo(px, py);
        });
        ctxT.closePath();
        ctxT.stroke();

        if (targetCircuit.id === currentCircuit.id) {
          ctxT.strokeStyle = 'rgba(34, 211, 238, 0.55)';
          ctxT.setLineDash([4, 4]);
          ctxT.lineWidth = 1.5;
          ctxT.beginPath();
          proTelemetrySamples.forEach((pt, idx) => {
            const { px, py } = mapCustomXYToCanvas(pt.x, pt.z, cTraj.width, cTraj.height, trajBounds);
            if (idx === 0) ctxT.moveTo(px, py);
            else ctxT.lineTo(px, py);
          });
          ctxT.closePath();
          ctxT.stroke();
          ctxT.setLineDash([]);
        }

        for (let i = 1; i < samples.length; i++) {
          const a = samples[i - 1];
          const b = samples[i];
          const pa = mapCustomXYToCanvas(a.x, a.z, cTraj.width, cTraj.height, trajBounds);
          const pb = mapCustomXYToCanvas(b.x, b.z, cTraj.width, cTraj.height, trajBounds);
          ctxT.strokeStyle = b.brake > 20 ? '#ef4444' : '#10b981';
          ctxT.lineWidth = 2.4;
          ctxT.beginPath();
          ctxT.moveTo(pa.px, pa.py);
          ctxT.lineTo(pb.px, pb.py);
          ctxT.stroke();
        }

        activeTelemetryState.baseImgP = ctxP.getImageData(0, 0, cPedal.width, cPedal.height);
        activeTelemetryState.baseImgS = ctxS.getImageData(0, 0, cSteer.width, cSteer.height);
        activeTelemetryState.baseImgT = ctxT.getImageData(0, 0, cTraj.width, cTraj.height);
        bindTelemetryScrubbing();

        const notesEl = document.getElementById('tel-engineer-notes');
        const notes = [];
        notes.push(`<div>🗺️ <strong>當前檢視賽道：</strong>${targetCircuit.name} (${targetCircuit.difficultyStars})</div>`);
        if (source === 'pro') {
          notes.push(`<div>🏁 <strong>基準圈展示：</strong>目前顯示 PRO 最佳基準圈 (${formatLapTime(PRO_LAP_TIME)}) 的完美煞車與油門曲線。</div>`);
        } else {
          notes.push(`<div>📊 <strong>取樣點數：</strong>本圈共記錄 ${samples.length} 個高頻遙測點，最高尾速達 ${Math.round(maxV)} km/h。</div>`);
        }
        if (lockups > 0) {
          notes.push(`<div class="text-red-400">⚠ <strong>重煞鎖死診斷：</strong>偵測到 ${lockups} 次前輪鎖死（煞車 &gt; 88%）。入彎前可微調煞車平衡或適時點放煞車避免鎖死。</div>`);
        } else {
          notes.push('<div class="text-emerald-400">✔ <strong>煞車控制優異：</strong>重煞車區未發生嚴重輪胎鎖死，前軸荷重轉移相當線性。</div>');
        }
        if (understeers > 0) {
          notes.push(`<div class="text-amber-300">⚠ <strong>慣性推頭外拋診斷：</strong>出現 ${understeers} 次超速入彎推頭外拋，請在 150m/100m 煞車牌提前減速至「彎道極限速度」以下再轉向。</div>`);
        }
        notesEl.innerHTML = notes.join('');
      }

      function cPederHeight(canvas) {
        return canvas.height || 160;
      }

      // --------------------------------------------------------------------------
      // 11. UI CONTROLS & COLLAPSIBLE SETTINGS WIRING
      // --------------------------------------------------------------------------
      function setGameMode(mode) {
        simState.mode = mode;
        const isTA = (mode === 'time_attack');
        document.getElementById('card-mode-ta').className = isTA
          ? 'cursor-pointer rounded-xl p-3.5 border-2 border-red-500 bg-slate-900 transition'
          : 'cursor-pointer rounded-xl p-3.5 border-2 border-slate-800 bg-slate-900 transition';
        document.getElementById('card-mode-ai').className = !isTA
          ? 'cursor-pointer rounded-xl p-3.5 border-2 border-amber-500 bg-slate-900 transition'
          : 'cursor-pointer rounded-xl p-3.5 border-2 border-slate-800 bg-slate-900 transition';

        document.getElementById('badge-mode').textContent = isTA ? 'TIME ATTACK' : 'AI RACE';
        document.getElementById('ai-pressure-panel').classList.toggle('hidden', isTA);
        document.getElementById('hud-race-pos-box').classList.toggle('hidden', isTA);
        document.getElementById('hud-race-pos-box').classList.toggle('flex', !isTA);
        document.getElementById('legend-ghost').classList.toggle('hidden', !isTA);
        document.getElementById('legend-ai').classList.toggle('hidden', isTA);
        document.getElementById('legend-ai').classList.toggle('flex', !isTA);
      }

      document.getElementById('card-mode-ta').addEventListener('click', () => setGameMode('time_attack'));
      document.getElementById('card-mode-ai').addEventListener('click', () => setGameMode('ai_race'));

      document.getElementById('select-ghost-target').addEventListener('change', (e) => {
        simState.ghostTarget = e.target.value;
      });
      document.getElementById('select-ai-diff').addEventListener('change', (e) => {
        simState.aiDifficulty = parseFloat(e.target.value) || 1.0;
      });

      function launchRaceSession() {
        soundEngine.init();
        simState.inShowcaseMode = false;
        simState.paused = false;

        const screenTitle = document.getElementById('screen-title');
        if (screenTitle) screenTitle.classList.add('hidden');
        const modalMenu = document.getElementById('modal-menu');
        if (modalMenu) modalMenu.classList.add('hidden');
        const modalTelemetry = document.getElementById('modal-telemetry');
        if (modalTelemetry) modalTelemetry.classList.add('hidden');

        const header = document.getElementById('game-hud-header');
        if (header) header.classList.remove('hidden');

        setInputMode(simState.isMobileGamepadActive);
        resetSession(true);
      }

      function returnToTitleScreen() {
        simState.inShowcaseMode = true;
        simState.paused = true;
        simState.countdownActive = false;

        const header = document.getElementById('game-hud-header');
        if (header) header.classList.add('hidden');
        const modalMenu = document.getElementById('modal-menu');
        if (modalMenu) modalMenu.classList.add('hidden');
        const modalTelemetry = document.getElementById('modal-telemetry');
        if (modalTelemetry) modalTelemetry.classList.add('hidden');
        const startOverlay = document.getElementById('start-lights-overlay');
        if (startOverlay) startOverlay.classList.add('hidden');
        const mobileOverlay = document.getElementById('mobile-gamepad-overlay');
        if (mobileOverlay) mobileOverlay.classList.add('hidden');
        const pcBottomHud = document.getElementById('pc-bottom-hud');
        if (pcBottomHud) {
          pcBottomHud.classList.add('hidden');
          pcBottomHud.classList.remove('flex');
        }

        resetSession(false);

        const screenTitle = document.getElementById('screen-title');
        if (screenTitle) screenTitle.classList.remove('hidden');
      }

      function openLobbyFromTitle() {
        soundEngine.init();
        const screenTitle = document.getElementById('screen-title');
        if (screenTitle) screenTitle.classList.add('hidden');
        const modalMenu = document.getElementById('modal-menu');
        if (modalMenu) modalMenu.classList.remove('hidden');
      }

      const btnTitleStart = document.getElementById('btn-title-start');
      if (btnTitleStart) btnTitleStart.addEventListener('click', openLobbyFromTitle);
      const btnTitleQuickRace = document.getElementById('btn-title-quick-race');
      if (btnTitleQuickRace) btnTitleQuickRace.addEventListener('click', launchRaceSession);
      const btnLobbyToTitle = document.getElementById('btn-lobby-to-title');
      if (btnLobbyToTitle) btnLobbyToTitle.addEventListener('click', returnToTitleScreen);
      const btnLobbyToTitleTop = document.getElementById('btn-lobby-to-title-top');
      if (btnLobbyToTitleTop) btnLobbyToTitleTop.addEventListener('click', returnToTitleScreen);

      document.getElementById('btn-menu-open').addEventListener('click', () => {
        document.getElementById('modal-menu').classList.remove('hidden');
        simState.paused = true;
      });
      document.getElementById('btn-resume-race').addEventListener('click', () => {
        if (simState.inShowcaseMode) {
          launchRaceSession();
        } else {
          document.getElementById('modal-menu').classList.add('hidden');
          simState.paused = false;
          soundEngine.init();
        }
      });
      document.getElementById('btn-start-session').addEventListener('click', launchRaceSession);

      document.getElementById('btn-quick-gear').addEventListener('click', () => {
        document.getElementById('quick-settings-drawer').classList.toggle('hidden');
      });

      document.getElementById('btn-toggle-line').addEventListener('click', (e) => {
        simState.showTacticalLine = !simState.showTacticalLine;
        if (tacticalRibbonMesh) tacticalRibbonMesh.visible = simState.showTacticalLine;
        e.currentTarget.textContent = simState.showTacticalLine ? 'ON (煞車/收油提示)' : 'OFF (純淨路面)';
      });

      const btnWeatherToggle = document.getElementById('btn-weather-toggle');
      if (btnWeatherToggle) {
        const refreshWeatherBtn = () => {
          const isW = (simState.weather === 'wet');
          btnWeatherToggle.textContent = isW ? '🌧 雨天濕地 WET' : '☀ 晴朗乾地 DRY';
          btnWeatherToggle.className = `px-2 py-1 rounded bg-slate-800 ${isW ? 'text-sky-400' : 'text-amber-300'} font-mono-tech text-[11px]`;
        };
        refreshWeatherBtn();
        btnWeatherToggle.addEventListener('click', () => {
          if (typeof setWeatherMode === 'function') {
            setWeatherMode(simState.weather === 'wet' ? 'dry' : 'wet');
          } else {
            simState.weather = (simState.weather === 'wet') ? 'dry' : 'wet';
          }
          refreshWeatherBtn();
        });
      }

      document.getElementById('btn-toggle-touch').addEventListener('click', (e) => {
        const drawer = document.getElementById('touch-controls-drawer');
        const isHidden = drawer.classList.toggle('hidden');
        drawer.classList.toggle('flex', !isHidden);
        e.currentTarget.textContent = isHidden ? '隱藏 (鍵盤優先)' : '顯示中 (底部滑桿)';
      });

      document.getElementById('btn-telemetry-open').addEventListener('click', () => {
        openTelemetryModal(document.getElementById('select-telemetry-lap').value);
      });
      document.getElementById('select-telemetry-lap').addEventListener('change', (e) => {
        openTelemetryModal(e.target.value);
      });
      const selTelCompare = document.getElementById('select-telemetry-compare');
      if (selTelCompare) {
        selTelCompare.addEventListener('change', (e) => {
          openTelemetryModal(activeTelemetryState.source, activeTelemetryState.completedTime, activeTelemetryState.recordObj, e.target.value);
        });
      }
      const btnTelLoadGhost = document.getElementById('btn-telemetry-load-ghost');
      if (btnTelLoadGhost) {
        btnTelLoadGhost.addEventListener('click', () => {
          const st = activeTelemetryState;
          let recToLoad = st.recordObj;
          if (!recToLoad && st.samples && st.samples.length >= 4) {
            recToLoad = {
              id: 'cur_ghost',
              circuitId: currentCircuit.id,
              car: { carName: (typeof carAssetState !== 'undefined' ? carAssetState.label : 'GT3') },
              driverName: (window.ApexRecords ? window.ApexRecords.getDriverName() : 'PLAYER'),
              timing: { lapTime: st.completedTime || PRO_LAP_TIME },
              telemetry: st.samples
            };
          }
          if (recToLoad && typeof window.loadRecordAsGhost === 'function') {
            document.getElementById('modal-telemetry').classList.add('hidden');
            window.loadRecordAsGhost(recToLoad, true);
          }
        });
      }
      document.getElementById('btn-telemetry-close').addEventListener('click', () => {
        document.getElementById('modal-telemetry').classList.add('hidden');
        // When opened from the results screen, just return to the results (stay paused)
        if (!simState.inShowcaseMode) simState.paused = false;
      });
      document.getElementById('btn-telemetry-restart').addEventListener('click', () => {
        document.getElementById('modal-telemetry').classList.add('hidden');
        if (typeof window.__apexFlowRestart === 'function') {
          window.__apexFlowRestart();
          return;
        }
        resetSession(!simState.inShowcaseMode);
        simState.paused = false;
      });

      document.getElementById('btn-spec-open').addEventListener('click', () => {
        simState.paused = true;
        document.getElementById('quick-settings-drawer').classList.add('hidden');
        document.getElementById('modal-spec').classList.remove('hidden');
      });
      document.getElementById('btn-spec-close').addEventListener('click', () => {
        document.getElementById('modal-spec').classList.add('hidden');
        simState.paused = false;
      });

      // ---- HI-FI ASSET GARAGE wiring ----
      document.getElementById('btn-garage-open').addEventListener('click', () => {
        simState.paused = true;
        document.getElementById('quick-settings-drawer').classList.add('hidden');
        garageUI.refresh();
        document.getElementById('modal-garage').classList.remove('hidden');
      });
      document.getElementById('btn-garage-close').addEventListener('click', () => {
        document.getElementById('modal-garage').classList.add('hidden');
        simState.paused = false;
      });
      document.getElementById('garage-preset-list').addEventListener('click', (e) => {
        const card = e.target.closest('[data-preset]');
        if (!card) return;
        const preset = CAR_MODEL_PRESETS.find(p => p.id === card.dataset.preset);
        if (!preset) return;
        if (!preset.urls) useProceduralVehicle(preset.id, preset.label, preset.defaultPaint);
        else loadVehicleFromURLs(preset.urls, preset.label, preset.id);
      });
      document.getElementById('garage-file-input').addEventListener('change', (e) => {
        loadVehicleFromFiles(e.target.files);
        e.target.value = '';
      });
      document.getElementById('btn-garage-url').addEventListener('click', () => {
        const url = document.getElementById('garage-url-input').value.trim();
        if (!url || (!/^https?:\/\/.+/i.test(url) && !/\.(glb|gltf)(\?.*)?$/i.test(url))) {
          garageUI.setStatus('✖ 請輸入 .glb/.gltf 相對路徑或有效的 http(s) URL', 'err');
          return;
        }
        const name = decodeURIComponent(url.split('/').pop().split('?')[0]).replace(/\.(glb|gltf)$/i, '') || '自訂 URL 模型';
        loadVehicleFromURLs([url], name, 'custom-url');
      });

      // Drag & drop: onto the garage drop zone OR anywhere on the game screen
      const garageDropzone = document.getElementById('garage-dropzone');
      ['dragenter', 'dragover'].forEach(ev => window.addEventListener(ev, (e) => {
        if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes('Files')) return;
        e.preventDefault();
        garageDropzone.style.borderColor = '#22d3ee';
      }));
      ['dragleave', 'drop'].forEach(ev => window.addEventListener(ev, () => {
        garageDropzone.style.borderColor = '';
      }));
      window.addEventListener('drop', (e) => {
        if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
        e.preventDefault();
        const modal = document.getElementById('modal-garage');
        if (modal.classList.contains('hidden')) {
          simState.paused = true;
          garageUI.refresh();
          modal.classList.remove('hidden');
        }
        loadVehicleFromFiles(e.dataTransfer.files);
      });

      function reorientHiFiVehicle() {
        saveCarAssetSettings();
        if (!carAssetState.rawScene) { garageUI.refresh(); return; }
        try {
          buildHiFiTemplate();
          rebuildAllVehicleSlots();
          garageUI.setStatus('✔ 已重新擺正車體並重新綁定車輪', 'ok');
        } catch (err) {
          garageUI.setStatus('✖ ' + err.message, 'err');
        }
        garageUI.refresh();
      }
      document.getElementById('btn-garage-rot90').addEventListener('click', () => {
        carAssetState.yawSteps = (carAssetState.yawSteps + 1) % 4;
        reorientHiFiVehicle();
      });
      document.getElementById('btn-garage-flip').addEventListener('click', () => {
        carAssetState.flip = !carAssetState.flip;
        reorientHiFiVehicle();
      });
      document.getElementById('btn-garage-livery').addEventListener('click', () => {
        carAssetState.livery = carAssetState.livery === 'team' ? 'original' : 'team';
        saveCarAssetSettings();
        rebuildAllVehicleSlots();
        garageUI.refresh();
      });
      ['player', 'ai', 'ghost'].forEach(k => {
        document.getElementById(`chk-scope-${k}`).addEventListener('change', (e) => {
          carAssetState.scope[k] = e.target.checked;
          saveCarAssetSettings();
          rebuildAllVehicleSlots();
        });
      });
      document.getElementById('btn-garage-asphalt').addEventListener('click', () => {
        gfxSettings.pbrAsphalt = !gfxSettings.pbrAsphalt;
        saveGfxSettings();
        rebuild3DCircuitScene();
        garageUI.refresh();
      });
      document.getElementById('btn-garage-texres').addEventListener('click', () => {
        const steps = [512, 1024, 2048];
        gfxSettings.asphaltRes = steps[(steps.indexOf(gfxSettings.asphaltRes) + 1) % steps.length];
        saveGfxSettings();
        garageUI.setStatus(`烘焙 ${gfxSettings.asphaltRes}² 柏油貼圖中…`);
        setTimeout(() => {
          if (gfxSettings.pbrAsphalt) rebuild3DCircuitScene();
          garageUI.refresh();
          garageUI.setStatus(`✔ 柏油貼圖解析度 ${gfxSettings.asphaltRes}²`, 'ok');
        }, 30);
      });
      document.getElementById('btn-garage-envmap').addEventListener('click', () => {
        gfxSettings.envReflections = !gfxSettings.envReflections;
        saveGfxSettings();
        updateEnvironmentMap(currentCircuit.theme);
        garageUI.refresh();
      });
      const btnGarageShadows = document.getElementById('btn-garage-shadows');
      if (btnGarageShadows) {
        btnGarageShadows.addEventListener('click', () => {
          gfxSettings.dynamicShadows = !gfxSettings.dynamicShadows;
          saveGfxSettings();
          if (typeof applyShadowMapSetting === 'function') applyShadowMapSetting();
          garageUI.refresh();
        });
      }
      const btnGarageBloom = document.getElementById('btn-garage-bloom');
      if (btnGarageBloom) {
        btnGarageBloom.addEventListener('click', () => {
          gfxSettings.bloomFx = !gfxSettings.bloomFx;
          saveGfxSettings();
          garageUI.refresh();
        });
      }
      const btnGlbTrack = document.getElementById('btn-garage-glbtrack');
      if (btnGlbTrack) {
        btnGlbTrack.addEventListener('click', () => {
          gfxSettings.glbTrackScenery = !(gfxSettings.glbTrackScenery !== false);
          saveGfxSettings();
          rebuild3DCircuitScene();
          garageUI.refresh();
        });
      }

      garageUI.refresh();
      // Restore last online preset (custom local files cannot be restored after reload)
      if (!carAssetState.loading) {
        const savedPreset = CAR_MODEL_PRESETS.find(p => p.id === carAssetState.presetId && p.urls);
        if (savedPreset) {
          loadVehicleFromURLs(savedPreset.urls, savedPreset.label, savedPreset.id);
        } else if (carAssetState.presetId !== 'procedural') {
          carAssetState.presetId = 'procedural';
          carAssetState.label = '內建程序化 GT3';
          garageUI.refresh();
        }
      }

      function cycleCamera() {
        simState.cameraMode = (simState.cameraMode + 1) % 3;
        const names = ['駕駛艙', '引擎蓋', '追尾視角'];
        document.getElementById('lbl-camera').textContent = names[simState.cameraMode];
      }
      function toggleTransmission() {
        simState.autoTransmission = !simState.autoTransmission;
        const isAT = simState.autoTransmission;
        document.getElementById('lbl-trans').textContent = isAT ? 'AT自排' : 'MT手排';
        const topGearSpan = document.getElementById('hud-top-gear');
        if (topGearSpan) topGearSpan.textContent = (simState.gear === -1) ? 'R檔' : `${simState.gear}檔(${isAT ? 'AT' : 'MT'})`;
        const mobileShifters = document.getElementById('mobile-mt-shifters');
        if (mobileShifters) {
          mobileShifters.classList.toggle('hidden', isAT);
          mobileShifters.classList.toggle('flex', !isAT);
        }
      }

      document.getElementById('btn-top-gear').addEventListener('click', toggleTransmission);

      document.getElementById('btn-camera').addEventListener('click', cycleCamera);
      document.getElementById('btn-trans').addEventListener('click', toggleTransmission);
      document.getElementById('btn-audio').addEventListener('click', () => {
        soundEngine.init();
        soundEngine.enabled = !soundEngine.enabled;
        const lbl = document.getElementById('lbl-audio');
        lbl.textContent = soundEngine.enabled ? 'ON' : 'OFF';
      });

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (typeof window.resizeBloomTarget === 'function') window.resizeBloomTarget();
      });

      // --------------------------------------------------------------------------
      // 12. UNIFIED BOOT SEQUENCE & MAIN SIMULATION LOOP
      // --------------------------------------------------------------------------
      resetSession(false);
      setPhysicsEdition('realistic');
      simState.inShowcaseMode = true;
      simState.paused = true;

      const initialIsMobile = (window.__apexClientDevice && typeof window.__apexClientDevice.isMobile === 'boolean')
        ? window.__apexClientDevice.isMobile
        : detectClientDevice();
      setInputMode(initialIsMobile);
      applyDeviceProfile(initialIsMobile);
      if (!carAssetState.loading && typeof selectCarById === 'function') {
        selectCarById(carAssetState.presetId || 'ferrari458');
      } else {
        renderHomeScreen();
      }

      // If player already clicked "PRESS START" while heavy 3D assets were loading, immediately proceed!
      if (window.__apexPendingSplashDismiss) {
        window.__apexPendingSplashDismiss = false;
        dismissSplashScreen();
      } else {
        showFlowScreen('splash');
      }

// Main 60 FPS Simulation Animation Loop
let lastFrameTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const frameDt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  if (!simState.paused && !simState.inShowcaseMode) {
    const subDt = frameDt * 0.5;
    stepPhysics(subDt);
    if (!simState.paused && !simState.inShowcaseMode) {
      stepPhysics(subDt);
    }
  }

  soundEngine.update(
    simState.rpm,
    simState.throttleInput,
    simState.tireSlipRatio,
    simState.isBrakeLockup,
    simState.isDrifting,
    simState.isUndersteer,
    simState.isNosActive,
    simState.onKerb,
    simState.paused || simState.inShowcaseMode,
    simState.speedKmh,
    simState.brakeInput
  );

  update3DSceneAndVisualFX(now * 0.001);
  if (!simState.inShowcaseMode) {
    updateHUD();
  }
}

window.updateHUD = updateHUD;
window.updateAIRaceHUD = updateAIRaceHUD;
window.openTelemetryModal = openTelemetryModal;
window.setGameMode = setGameMode;
window.cycleCamera = cycleCamera;
window.toggleTransmission = toggleTransmission;
window.animate = animate;

// Safe Bootstrapper: Start 60 FPS Animation Loop Exactly Once
let __apexLoopStarted = false;
function __startApexLoopOnce() {
  if (__apexLoopStarted) return;
  __apexLoopStarted = true;
  requestAnimationFrame(animate);
}
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  __startApexLoopOnce();
} else {
  window.addEventListener('DOMContentLoaded', __startApexLoopOnce);
  window.addEventListener('load', __startApexLoopOnce);
}
if (window.__apexTrace) window.__apexTrace('main.js', 'OK');