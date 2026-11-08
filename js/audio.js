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

            this.squealNode = this.ctx.createBufferSource();
            this.squealNode.buffer = noiseBuf;
            this.squealNode.loop = true;

            this.squealFilter = this.ctx.createBiquadFilter();
            this.squealFilter.type = 'bandpass';
            this.squealFilter.frequency.value = 1850;
            this.squealFilter.Q.value = 5.5;

            this.squealGain = this.ctx.createGain();
            this.squealGain.gain.value = 0.0;

            this.squealNode.connect(this.squealFilter);
            this.squealFilter.connect(this.squealGain);
            this.squealGain.connect(this.ctx.destination);
            this.squealNode.start();

            this.kerbOsc = this.ctx.createOscillator();
            this.kerbOsc.type = 'square';
            this.kerbOsc.frequency.value = 58;
            this.kerbGain = this.ctx.createGain();
            this.kerbGain.gain.value = 0.0;
            this.kerbOsc.connect(this.kerbGain);
            this.kerbGain.connect(this.ctx.destination);
            this.kerbOsc.start();

            this.started = true;
          } catch (e) { }
        },

        update(rpm, throttle, tireSlipRatio, isLockup, isDrifting, isUndersteer, isNosActive, onKerb, paused) {
          if (!this.started || !this.ctx) return;
          if (!this.enabled || paused) {
            this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            this.squealGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            this.kerbGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
            return;
          }
          if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
          }

          const nosPitchBoost = isNosActive ? 28 : 0;
          const baseFreq = 36 + (rpm / 8800) * 195 + nosPitchBoost;
          this.rpmOsc1.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.03);
          this.rpmOsc2.frequency.setTargetAtTime(baseFreq * 1.5, this.ctx.currentTime, 0.03);
          const engVol = 0.04 + (throttle / 100) * 0.065 + (rpm / 9000) * 0.035 + (isNosActive ? 0.03 : 0);
          this.engineGain.gain.setTargetAtTime(engVol, this.ctx.currentTime, 0.04);

          const squealIntensity = (isLockup || isDrifting || isUndersteer)
            ? 0.14
            : Math.max(0, (tireSlipRatio - 0.72) * 0.24);
          const pitch = isLockup ? 2280 : (isDrifting ? 1480 : 1720 + tireSlipRatio * 380);
          this.squealFilter.frequency.setTargetAtTime(pitch, this.ctx.currentTime, 0.04);
          this.squealGain.gain.setTargetAtTime(Math.min(0.16, squealIntensity), this.ctx.currentTime, 0.04);

          const kerbVol = onKerb ? 0.065 : 0.0;
          this.kerbGain.gain.setTargetAtTime(kerbVol, this.ctx.currentTime, 0.02);
        },

        blipShift() {
          if (!this.started || !this.enabled || !this.ctx) return;
          const now = this.ctx.currentTime;
          this.rpmOsc1.frequency.setValueAtTime(240, now);
          this.rpmOsc1.frequency.exponentialRampToValueAtTime(140, now + 0.09);
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