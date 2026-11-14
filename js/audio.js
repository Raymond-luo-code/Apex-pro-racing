// ============================================================================
// APEX PRO RACING // MODULE 2: PROCEDURAL WEB AUDIO ENGINE
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('audio.js', 'START');

      const soundEngine = {
        ctx: null,
        enabled: true,
        started: false,
        rpmOsc1: null,
        rpmOsc2: null,
        engineGain: null,
        squealNode: null,
        squealFilter: null,
        squealGain: null,
        kerbOsc: null,
        kerbGain: null,
        lockupPulseOsc: null,
        lockupPulseGain: null,

        init() {
          if (this.started) return;
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.ctx = new AudioCtx();

            this.rpmOsc1 = this.ctx.createOscillator();
            this.rpmOsc2 = this.ctx.createOscillator();
            this.rpmOsc1.type = 'sawtooth';
            this.rpmOsc2.type = 'triangle';

            const engineFilter = this.ctx.createBiquadFilter();
            engineFilter.type = 'lowpass';
            engineFilter.frequency.value = 460;

            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.value = 0.0;

            this.rpmOsc1.connect(engineFilter);
            this.rpmOsc2.connect(engineFilter);
            engineFilter.connect(this.engineGain);
            this.engineGain.connect(this.ctx.destination);

            this.rpmOsc1.start();
            this.rpmOsc2.start();

            const bufSize = this.ctx.sampleRate * 1.5;
            const noiseBuf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const out = noiseBuf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) out[i] = Math.random() * 2 - 1;
            this.noiseBuffer = noiseBuf;

            this.squealNode = this.ctx.createBufferSource();
            this.squealNode.buffer = noiseBuf;
            this.squealNode.loop = true;

            // Warm Low-Pass Tire Scrub (350 - 750 Hz textured rubber-on-asphalt sound, eliminating piercing 1800-2300 Hz screech)
            this.squealFilter = this.ctx.createBiquadFilter();
            this.squealFilter.type = 'lowpass';
            this.squealFilter.frequency.value = 480;
            this.squealFilter.Q.value = 1.2;

            this.squealGain = this.ctx.createGain();
            this.squealGain.gain.value = 0.0;

            this.squealNode.connect(this.squealFilter);
            this.squealFilter.connect(this.squealGain);
            this.squealGain.connect(this.ctx.destination);
            this.squealNode.start();

            // RFC Module 2: 35-50 Hz low-frequency kerb rumble synthesizer
            this.kerbOsc = this.ctx.createOscillator();
            this.kerbOsc.type = 'triangle';
            this.kerbOsc.frequency.value = 42;
            const kerbLowpass = this.ctx.createBiquadFilter();
            kerbLowpass.type = 'lowpass';
            kerbLowpass.frequency.value = 180;
            this.kerbGain = this.ctx.createGain();
            this.kerbGain.gain.value = 0.0;
            this.kerbOsc.connect(kerbLowpass);
            kerbLowpass.connect(this.kerbGain);
            this.kerbGain.connect(this.ctx.destination);
            this.kerbOsc.start();

            // Non-fatiguing 80 - 140 Hz Low-Frequency Lockup / ABS Pedal Pulse
            this.lockupPulseOsc = this.ctx.createOscillator();
            this.lockupPulseOsc.type = 'triangle';
            this.lockupPulseOsc.frequency.value = 105;
            const lockupFilter = this.ctx.createBiquadFilter();
            lockupFilter.type = 'lowpass';
            lockupFilter.frequency.value = 210;
            this.lockupPulseGain = this.ctx.createGain();
            this.lockupPulseGain.gain.value = 0.0;
            this.lockupPulseOsc.connect(lockupFilter);
            lockupFilter.connect(this.lockupPulseGain);
            this.lockupPulseGain.connect(this.ctx.destination);
            this.lockupPulseOsc.start();

            this.started = true;
          } catch (e) { }
        },

        update(rpm, throttle, tireSlipRatio, isLockup, isDrifting, isUndersteer, isNosActive, onKerb, paused, speedKmh, brakeInput) {
          if (!this.started || !this.ctx) return;
          if (!this.enabled || paused) {
            this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            this.squealGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            this.kerbGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            if (this.lockupPulseGain) this.lockupPulseGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            return;
          }
          if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
          }

          const now = this.ctx.currentTime;
          const nosPitchBoost = isNosActive ? 28 : 0;
          const baseFreq = 36 + (rpm / 8800) * 195 + nosPitchBoost;
          this.rpmOsc1.frequency.setTargetAtTime(baseFreq, now, 0.03);
          this.rpmOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.03);
          const engVol = 0.04 + (throttle / 100) * 0.065 + (rpm / 9000) * 0.035 + (isNosActive ? 0.03 : 0);
          this.engineGain.gain.setTargetAtTime(engVol, now, 0.04);

          // Warm Low-Pass Tire Scrub strictly within 350 - 750 Hz range
          const currentSpeed = (speedKmh != null) ? speedKmh : (typeof simState !== 'undefined' ? simState.speedKmh : 60);
          const brkVal = (brakeInput != null) ? brakeInput : (typeof simState !== 'undefined' ? simState.brakeInput : 0);
          const scrubIntensity = (isDrifting || isUndersteer)
            ? 0.12
            : (isLockup ? 0.09 : Math.max(0, (tireSlipRatio - 0.72) * 0.18));
          const scrubCutoff = Math.min(750, Math.max(350,
            isDrifting ? 640 : (isUndersteer ? 580 : 350 + Math.min(1.3, tireSlipRatio) * 300)
          ));
          this.squealFilter.frequency.setTargetAtTime(scrubCutoff, now, 0.04);
          this.squealGain.gain.setTargetAtTime(currentSpeed > 10 ? Math.min(0.14, scrubIntensity) : 0, now, 0.04);

          // Low-Frequency 80 - 140 Hz Rhythmic Lockup Pulse (> 88% brake or active lockup)
          if (this.lockupPulseGain && this.lockupPulseOsc) {
            if ((isLockup || brkVal > 88) && currentSpeed > 28) {
              const pulsePhase = 0.5 + 0.5 * Math.sin(now * Math.PI * 2 * 13.5);
              const lockFreq = 80 + Math.min(60, Math.max(0, brkVal - 88) * 5 + (isLockup ? 20 : 0));
              this.lockupPulseOsc.frequency.setTargetAtTime(lockFreq, now, 0.02);
              this.lockupPulseGain.gain.setTargetAtTime(0.035 + pulsePhase * 0.075, now, 0.015);
            } else {
              this.lockupPulseGain.gain.setTargetAtTime(0.0, now, 0.03);
            }
          }

          // RFC Module 2: 35-50 Hz low-frequency kerb rumble matching vehicle ground speed
          if (onKerb && this.kerbOsc) {
            const kerbFreq = 35 + Math.min(15, (currentSpeed / 250) * 15);
            this.kerbOsc.frequency.setTargetAtTime(kerbFreq, now, 0.04);
            const kerbVol = (currentSpeed > 6) ? Math.min(0.14, 0.045 + (currentSpeed / 280) * 0.065) : 0;
            this.kerbGain.gain.setTargetAtTime(kerbVol, now, 0.02);
          } else if (this.kerbGain) {
            this.kerbGain.gain.setTargetAtTime(0.0, now, 0.04);
          }
        },

        blipShift() {
          if (!this.started || !this.enabled || !this.ctx) return;
          const now = this.ctx.currentTime;
          this.rpmOsc1.frequency.setValueAtTime(240, now);
          this.rpmOsc1.frequency.exponentialRampToValueAtTime(140, now + 0.09);
        },

        // Phase 2: Muted Pneumatic Sequential Paddle-Shift Clunk + ignition-cut dip
        triggerShiftClunk(isUpshift = true) {
          if (!this.started || !this.enabled || !this.ctx) return;
          try {
            const now = this.ctx.currentTime;
            if (isUpshift && this.engineGain) {
              this.engineGain.gain.setValueAtTime(0.025, now);
              this.engineGain.gain.linearRampToValueAtTime(0.085, now + 0.08);
            }
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isUpshift ? 165 : 140, now);
            osc.frequency.exponentialRampToValueAtTime(48, now + 0.055);
            g.gain.setValueAtTime(isUpshift ? 0.095 : 0.075, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);

            if (this.noiseBuffer) {
              const src = this.ctx.createBufferSource();
              src.buffer = this.noiseBuffer;
              const lp = this.ctx.createBiquadFilter();
              lp.type = 'lowpass';
              lp.frequency.setValueAtTime(isUpshift ? 460 : 380, now);
              lp.Q.value = 1.0;
              const ng = this.ctx.createGain();
              ng.gain.setValueAtTime(isUpshift ? 0.055 : 0.04, now);
              ng.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
              src.connect(lp);
              lp.connect(ng);
              ng.connect(this.ctx.destination);
              src.start(now);
              src.stop(now + 0.05);
            }
          } catch (e) { }
        },

        // Phase 2: Warm Low-Mid Turbo Blow-Off Valve (BOV) surge flutter (tamed non-piercing)
        triggerTurboFlutter() {
          if (!this.started || !this.enabled || !this.ctx || !this.noiseBuffer) return;
          try {
            const now = this.ctx.currentTime;
            [0, 0.072, 0.145].forEach((off, idx) => {
              const src = this.ctx.createBufferSource();
              src.buffer = this.noiseBuffer;
              const bp = this.ctx.createBiquadFilter();
              bp.type = 'bandpass';
              const fStart = 1150 - idx * 180;
              bp.frequency.setValueAtTime(fStart, now + off);
              bp.frequency.exponentialRampToValueAtTime(Math.max(420, fStart * 0.58), now + off + 0.06);
              bp.Q.value = 2.1;
              const g = this.ctx.createGain();
              const amp = 0.045 * Math.pow(0.65, idx);
              g.gain.setValueAtTime(0.001, now + off);
              g.gain.linearRampToValueAtTime(amp, now + off + 0.015);
              g.gain.exponentialRampToValueAtTime(0.001, now + off + 0.065);
              src.connect(bp);
              bp.connect(g);
              g.connect(this.ctx.destination);
              src.start(now + off);
              src.stop(now + off + 0.07);
            });
          } catch (e) { }
        },

        // Deep Low-Passed Motorsport Exhaust Burble/Thump (zero harsh upper harmonics)
        triggerBackfire() {
          if (!this.started || !this.enabled || !this.ctx) return;
          try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(92, now);
            osc.frequency.exponentialRampToValueAtTime(36, now + 0.085);
            g.gain.setValueAtTime(0.001, now);
            g.gain.linearRampToValueAtTime(0.085, now + 0.008);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.10);

            if (this.noiseBuffer) {
              const src = this.ctx.createBufferSource();
              src.buffer = this.noiseBuffer;
              const lp = this.ctx.createBiquadFilter();
              lp.type = 'lowpass';
              lp.frequency.setValueAtTime(390, now);
              lp.frequency.exponentialRampToValueAtTime(160, now + 0.09);
              lp.Q.value = 0.8;
              const ng = this.ctx.createGain();
              ng.gain.setValueAtTime(0.001, now);
              ng.gain.linearRampToValueAtTime(0.065, now + 0.006);
              ng.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
              src.connect(lp);
              lp.connect(ng);
              ng.connect(this.ctx.destination);
              src.start(now);
              src.stop(now + 0.105);
            }
          } catch (e) { }
        },

        // Phase 2: Heavy Low-Mid Chassis Impact Thud & Carbon Scrape
        triggerCollision(intensity = 0.5) {
          if (!this.started || !this.enabled || !this.ctx) return;
          try {
            const now = this.ctx.currentTime;
            const amp = Math.max(0.15, Math.min(1.0, intensity));
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(88 + amp * 28, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.16);
            g.gain.setValueAtTime(0.16 * amp, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.19);

            if (this.noiseBuffer) {
              const src = this.ctx.createBufferSource();
              src.buffer = this.noiseBuffer;
              const lp = this.ctx.createBiquadFilter();
              lp.type = 'lowpass';
              lp.frequency.setValueAtTime(340 + amp * 220, now);
              lp.frequency.exponentialRampToValueAtTime(140, now + 0.14);
              lp.Q.value = 0.9;
              const ng = this.ctx.createGain();
              ng.gain.setValueAtTime(0.12 * amp, now);
              ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
              src.connect(lp);
              lp.connect(ng);
              ng.connect(this.ctx.destination);
              src.start(now);
              src.stop(now + 0.16);
            }
          } catch (e) { }
        },

        playCountdownBeep(isGo = false) {
          if (!this.started || !this.enabled || !this.ctx) return;
          try {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = isGo ? 880 : 440;
            g.gain.setValueAtTime(0.12, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isGo ? 0.45 : 0.18));
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + (isGo ? 0.46 : 0.20));
          } catch (e) { }
        }
      };

window.soundEngine = soundEngine;
if (window.__apexTrace) window.__apexTrace('audio.js', 'OK');