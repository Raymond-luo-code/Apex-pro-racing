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

        const cornerLimitKmh = getUpcomingCornerMaxSpeedKmh(simState.s);
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

        const activeLights = Math.floor(((simState.rpm - 4200) / 4400) * shiftLightSpans.length);
        const blinkShift = simState.rpm >= 8350;
        shiftLightSpans.forEach((sp, idx) => {
          if (idx < activeLights) {
            const color = idx < 4 ? 'bg-emerald-500' : (idx < 7 ? 'bg-amber-500' : 'bg-red-600');
            sp.className = `w-2.5 h-1.5 rounded-sm ${color} ${blinkShift ? 'shift-blink' : ''}`;
          } else {
            sp.className = 'w-2.5 h-1.5 rounded-sm bg-slate-800';
          }
        });

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
        document.getElementById('hud-surface-grip').textContent = `GRIP: ${Math.round(simState.surfaceGrip * 100)}%`;
        document.getElementById('hud-downforce').textContent = `AERO: ${simState.downforceKgf} kgf`;

        document.getElementById('btn-recover-banner').classList.toggle('hidden', !simState.offTrack);
        document.getElementById('alert-wall-scrape').classList.toggle('hidden', !simState.wallScrapeWarning);
        const jumpEl = document.getElementById('alert-jump-start');
        if (jumpEl) jumpEl.classList.toggle('hidden', !simState.hasJumpStarted);

        // Phase 1: Dynamic Multi-Tier Braking & Lift Guidance
        const cueEl = document.getElementById('alert-brake-now');
        if (cueEl) {
          const cueTier = simState.drivingCue || (simState.brakeNowWarning ? 'heavy' : 'none');
          const tgtKmh = simState.cueTargetKmh || cornerLimitKmh;
          if (cueTier === 'heavy') {
            cueEl.classList.remove('hidden');
            if (brkPct > 84) {
              cueEl.className = 'px-3 py-0.5 rounded-full bg-orange-600 text-white font-mono-tech text-[11px] font-extrabold shadow-lg';
              cueEl.textContent = `⚠ 漸放煞車防鎖死 · 目標彎速 ${tgtKmh} km/h`;
            } else {
              cueEl.className = 'px-3 py-0.5 rounded-full bg-red-600 text-white font-mono-tech text-[11px] font-extrabold shadow-lg';
              cueEl.textContent = `🛑 HEAVY BRAKE · 重煞降至 ${tgtKmh} km/h ➔ 準備放煞開油`;
            }
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
          const highAlert = simState.isBrakeLockup || simState.isOversteer || simState.isUndersteer || simState.brakeNowWarning;
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
          ['fl', 'fr', 'rl', 'rr'].forEach(k => {
            const load = simState.tireLoads[k];
            document.getElementById(`tire-load-${k}`).textContent = `${load}`;
            const vis = document.getElementById(`tire-vis-${k}`);
            if (simState.isBrakeLockup && (k === 'fl' || k === 'fr')) {
              vis.className = 'w-2.5 h-3.5 rounded-sm bg-red-600 transition-colors';
            } else if (load > 460) {
              vis.className = 'w-2.5 h-3.5 rounded-sm bg-amber-500 transition-colors';
            } else {
              vis.className = 'w-2.5 h-3.5 rounded-sm bg-emerald-500 transition-colors';
            }
          });

          drawGGDiagram();
          drawMinimap();
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

        ggCtx.strokeStyle = '#334155';
        ggCtx.lineWidth = 1;
        [11, 22].forEach(r => {
          ggCtx.beginPath();
          ggCtx.arc(cx, cy, r, 0, Math.PI * 2);
          ggCtx.stroke();
        });

        const gx = Math.max(-24, Math.min(24, simState.latG * 11));
        const gy = Math.max(-24, Math.min(24, -simState.longG * 11));
        ggCtx.fillStyle = simState.tireSlipRatio > 0.92 ? '#ef4444' : '#22d3ee';
        ggCtx.beginPath();
        ggCtx.arc(cx + gx, cy + gy, 3.5, 0, Math.PI * 2);
        ggCtx.fill();

        document.getElementById('hud-g-readout').textContent =
          `${Math.hypot(simState.latG, simState.longG).toFixed(1)}G`;
      }

      function mapWorldToCanvas(x, z, w, h) {
        const pad = 8;
        const scaleX = (w - pad * 2) / 2550;
        const scaleZ = (h - pad * 2) / 1450;
        const s = Math.min(scaleX, scaleZ);
        const px = pad + (x + 1220) * s;
        const py = h - (pad + (z + 110) * s);
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
      // 10. POST-LAP TELEMETRY CHARTS & RACE ENGINEER REVIEW MODAL
      // --------------------------------------------------------------------------
      function openTelemetryModal(source = 'current', completedTime = null) {
        simState.paused = true;
        document.getElementById('modal-telemetry').classList.remove('hidden');

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
        const rawSamples = usePro ? proTelemetrySamples : candidateSamples;

        // Guarantee strictly non-decreasing track distance (s) so a wrap-around sample can never draw a backward slash across the chart
        const samples = [];
        let lastMonotonicS = -1;
        for (let i = 0; i < rawSamples.length; i++) {
          const pt = rawSamples[i];
          if (pt && typeof pt.s === 'number' && pt.s >= lastMonotonicS && pt.s <= totalTrackLength + 0.01) {
            samples.push(pt);
            lastMonotonicS = pt.s;
          }
        }

        const lapTimeVal = completedTime || (usePro ? PRO_LAP_TIME : simState.lapElapsed);

        document.getElementById('tel-laptime').textContent = formatLapTime(lapTimeVal);
        document.getElementById('tel-s1').textContent = simState.sector1Time ? simState.sector1Time.toFixed(3) + 's' : (PRO_LAP_TIME * 0.33).toFixed(3) + 's';
        document.getElementById('tel-s2').textContent = simState.sector2Time ? simState.sector2Time.toFixed(3) + 's' : (PRO_LAP_TIME * 0.35).toFixed(3) + 's';
        document.getElementById('tel-s3').textContent = simState.sector3Time ? simState.sector3Time.toFixed(3) + 's' : (PRO_LAP_TIME * 0.32).toFixed(3) + 's';

        let maxV = 0;
        samples.forEach(s => { if (s.speed > maxV) maxV = s.speed; });
        document.getElementById('tel-topspeed').textContent = `${Math.round(maxV)} km/h`;
        document.getElementById('tel-incidents').textContent =
          `${simState.lockupCount} 鎖死 / ${simState.understeerCount} 外拋`;

        const cPedal = document.getElementById('chart-pedals');
        cPedal.width = cPedal.clientWidth || 640;
        cPedal.height = cPedal.clientHeight || 160;
        const ctxP = cPedal.getContext('2d');
        ctxP.clearRect(0, 0, cPedal.width, cPedal.height);

        [0.338, 0.680].forEach(r => {
          const sx = r * cPedal.width;
          ctxP.strokeStyle = '#1e293b';
          ctxP.beginPath();
          ctxP.moveTo(sx, 0); ctxP.lineTo(sx, cPedal.height);
          ctxP.stroke();
        });

        ctxP.strokeStyle = '#10b981';
        ctxP.lineWidth = 2;
        ctxP.beginPath();
        samples.forEach((pt, idx) => {
          const x = Math.min(cPedal.width, Math.max(0, (pt.s / totalTrackLength) * cPedal.width));
          const y = cPedal.height - (pt.throttle / 100) * (cPedal.height - 16) - 8;
          if (idx === 0 || pt.s < samples[idx - 1].s) ctxP.moveTo(x, y);
          else ctxP.lineTo(x, y);
        });
        ctxP.stroke();

        ctxP.strokeStyle = '#ef4444';
        ctxP.lineWidth = 2;
        ctxP.beginPath();
        samples.forEach((pt, idx) => {
          const x = Math.min(cPedal.width, Math.max(0, (pt.s / totalTrackLength) * cPedal.width));
          const y = cPedal.height - (pt.brake / 100) * (cPedal.height - 16) - 8;
          if (idx === 0 || pt.s < samples[idx - 1].s) ctxP.moveTo(x, y);
          else ctxP.lineTo(x, y);
        });
        ctxP.stroke();

        const cSteer = document.getElementById('chart-steer-speed');
        cSteer.width = cSteer.clientWidth || 640;
        cSteer.height = cSteer.clientHeight || 160;
        const ctxS = cSteer.getContext('2d');
        ctxS.clearRect(0, 0, cSteer.width, cSteer.height);

        ctxS.strokeStyle = '#f59e0b';
        ctxS.lineWidth = 2;
        ctxS.beginPath();
        samples.forEach((pt, idx) => {
          const x = Math.min(cSteer.width, Math.max(0, (pt.s / totalTrackLength) * cSteer.width));
          const y = cSteer.height - (pt.speed / 350) * (cPederHeight(cSteer) - 16) - 8;
          if (idx === 0 || pt.s < samples[idx - 1].s) ctxS.moveTo(x, y);
          else ctxS.lineTo(x, y);
        });
        ctxS.stroke();

        ctxS.strokeStyle = '#22d3ee';
        ctxS.lineWidth = 1.8;
        ctxS.beginPath();
        const midY = cSteer.height / 2;
        samples.forEach((pt, idx) => {
          const x = Math.min(cSteer.width, Math.max(0, (pt.s / totalTrackLength) * cSteer.width));
          const y = midY - (pt.steer / 450) * (midY - 10);
          if (idx === 0 || pt.s < samples[idx - 1].s) ctxS.moveTo(x, y);
          else ctxS.lineTo(x, y);
        });
        ctxS.stroke();

        const cTraj = document.getElementById('chart-trajectory');
        const ctxT = cTraj.getContext('2d');
        ctxT.clearRect(0, 0, cTraj.width, cTraj.height);

        ctxT.strokeStyle = '#334155';
        ctxT.lineWidth = 6;
        ctxT.beginPath();
        for (let i = 0; i < TRACK_SAMPLES; i += 5) {
          const n = trackNodes[i];
          const { px, py } = mapWorldToCanvas(n.x, n.z, cTraj.width, cTraj.height);
          if (i === 0) ctxT.moveTo(px, py);
          else ctxT.lineTo(px, py);
        }
        ctxT.closePath();
        ctxT.stroke();

        ctxT.strokeStyle = 'rgba(34, 211, 238, 0.55)';
        ctxT.setLineDash([4, 4]);
        ctxT.lineWidth = 1.5;
        ctxT.beginPath();
        proTelemetrySamples.forEach((pt, idx) => {
          const { px, py } = mapWorldToCanvas(pt.x, pt.z, cTraj.width, cTraj.height);
          if (idx === 0) ctxT.moveTo(px, py);
          else ctxT.lineTo(px, py);
        });
        ctxT.closePath();
        ctxT.stroke();
        ctxT.setLineDash([]);

        for (let i = 1; i < samples.length; i++) {
          const a = samples[i - 1];
          const b = samples[i];
          const pa = mapWorldToCanvas(a.x, a.z, cTraj.width, cTraj.height);
          const pb = mapWorldToCanvas(b.x, b.z, cTraj.width, cTraj.height);
          ctxT.strokeStyle = b.brake > 20 ? '#ef4444' : '#10b981';
          ctxT.lineWidth = 2.4;
          ctxT.beginPath();
          ctxT.moveTo(pa.px, pa.py);
          ctxT.lineTo(pb.px, pb.py);
          ctxT.stroke();
        }

        const notesEl = document.getElementById('tel-engineer-notes');
        const notes = [];
        notes.push(`<div>🗺️ <strong>當前賽道：</strong>${currentCircuit.name} (${currentCircuit.difficultyStars})</div>`);
        if (usePro) {
          notes.push(`<div>🏁 <strong>基準圈展示：</strong>目前顯示 PRO 最佳基準圈 (${formatLapTime(PRO_LAP_TIME)}) 的完美煞車與油門曲線。</div>`);
        } else {
          notes.push(`<div>📊 <strong>取樣點數：</strong>本圈共記錄 ${samples.length} 個高頻遙測點，最高尾速達 ${Math.round(maxV)} km/h。</div>`);
        }
        if (simState.lockupCount > 0) {
          notes.push(`<div class="text-red-400">⚠ <strong>重煞鎖死診斷：</strong>偵測到 ${simState.lockupCount} 次前輪鎖死（煞車 &gt; 88%）。入彎前請適時點放煞車避免鎖死。</div>`);
        } else {
          notes.push('<div class="text-emerald-400">✔ <strong>煞車控制優異：</strong>重煞車區未發生嚴重輪胎鎖死，前軸荷重轉移相當線性。</div>');
        }
        if (simState.understeerCount > 0) {
          notes.push(`<div class="text-amber-300">⚠ <strong>慣性推頭外拋診斷：</strong>出現 ${simState.understeerCount} 次超速入彎推頭外拋，請在 150m/100m 煞車牌提前減速至「彎道極限速度」以下再轉向。</div>`);
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

      garageUI.refresh();
      // Restore last online preset (custom local files cannot be restored after reload)
      {
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
      if (typeof selectCarById === 'function') {
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