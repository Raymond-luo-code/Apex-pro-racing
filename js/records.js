// ============================================================================
// APEX PRO RACING // MODULE 5B: REVIEWABLE LAP RECORDS & ANTI-POLLUTION CLASS LEADERBOARD
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('records.js', 'START');

(function () {
  const DB_NAME = 'ApexProRecordsDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'lap_records';
  const DRIVER_NAME_KEY = 'apexpro.driverName';
  const LEGACY_RECORDS_KEY = 'apexpro.records';
  const LEGACY_MIGRATED_KEY = 'apexpro.records_migrated_v1';

  const CLASS_META = {
    STREET: { id: 'STREET', label: 'STREET · CLASS A', shortLabel: 'STREET', color: '#34d399', bg: 'rgba(52,211,153,0.16)' },
    GT3: { id: 'GT3', label: 'GT3 · CLASS S', shortLabel: 'GT3', color: '#fb923c', bg: 'rgba(251,146,60,0.16)' },
    HYPER: { id: 'HYPER', label: 'HYPER · CLASS R', shortLabel: 'HYPER', color: '#c084fc', bg: 'rgba(192,132,252,0.16)' },
    LMP1: { id: 'LMP1', label: 'LMP1 · CLASS X', shortLabel: 'LMP1', color: '#38bdf8', bg: 'rgba(56,189,248,0.16)' },
    F1: { id: 'F1', label: 'F1 · CLASS F1', shortLabel: 'F1', color: '#f43f5e', bg: 'rgba(244,63,94,0.16)' },
    CUSTOM: { id: 'CUSTOM', label: 'CUSTOM · OPEN', shortLabel: 'CUSTOM', color: '#94a3b8', bg: 'rgba(148,163,184,0.16)' }
  };

  let dbInstance = null;
  let initPromise = null;
  let recordsCache = [];
  const pendingPuts = new Map();
  const pendingDeletes = new Set();
  const pendingTxPromises = new Set();
  const readyListeners = new Set();

  function trackTx(promise) {
    pendingTxPromises.add(promise);
    promise.finally(() => pendingTxPromises.delete(promise));
    return promise;
  }

  function resolveCarClass(presetId, fallbackClass) {
    const pid = String(presetId || '').trim();
    if (typeof window !== 'undefined' && Array.isArray(window.CAR_CATALOG)) {
      const cat = window.CAR_CATALOG.find(c => c.id === pid);
      if (cat && cat.carClass && CLASS_META[cat.carClass]) {
        return cat.carClass;
      }
    }
    if (typeof window !== 'undefined' && typeof CAR_HANDLING_PROFILES !== 'undefined' && CAR_HANDLING_PROFILES[pid]) {
      const cc = CAR_HANDLING_PROFILES[pid].carClass;
      if (cc && CLASS_META[cc]) return cc;
    }
    if (pid.startsWith('custom-') || !pid) return 'CUSTOM';
    return CLASS_META[fallbackClass] ? fallbackClass : 'CUSTOM';
  }

  function getDriverName() {
    try {
      const saved = (localStorage.getItem(DRIVER_NAME_KEY) || '').trim();
      return saved ? saved.slice(0, 24) : 'PLAYER';
    } catch (e) {
      return 'PLAYER';
    }
  }

  function setDriverName(name) {
    const clean = String(name || '').trim().slice(0, 24) || 'PLAYER';
    try { localStorage.setItem(DRIVER_NAME_KEY, clean); } catch (e) { /* ignore */ }
    return clean;
  }

  function quantizeTelemetry(samples) {
    if (!Array.isArray(samples) || samples.length === 0) return [];
    // Downsample gently if unusually huge (> 950 pts) while preserving first and last point
    let src = samples;
    if (src.length > 950) {
      const step = src.length / 950;
      const out = [];
      for (let f = 0; f < src.length - 1; f += step) {
        out.push(src[Math.floor(f)]);
      }
      out.push(src[src.length - 1]);
      src = out;
    }
    return src.map(pt => ({
      s: Math.round((Number(pt.s) || 0) * 100) / 100,
      t: Math.round((Number(pt.t) || 0) * 1000) / 1000,
      d: Math.round((Number(pt.d) || 0) * 100) / 100,
      x: Math.round((Number(pt.x) || 0) * 100) / 100,
      y: Math.round((Number(pt.y) || 0) * 100) / 100,
      z: Math.round((Number(pt.z) || 0) * 100) / 100,
      heading: Math.round((Number(pt.heading) || 0) * 1000) / 1000,
      speed: Math.round(Number(pt.speed) || 0),
      throttle: Math.round(Number(pt.throttle) || 0),
      brake: Math.round(Number(pt.brake) || 0),
      steer: Math.round(Number(pt.steer) || 0),
      latG: Math.round((Number(pt.latG) || 0) * 100) / 100,
      longG: Math.round((Number(pt.longG) || 0) * 100) / 100,
      gear: Math.round(Number(pt.gear) || 1),
      rpm: Math.round(Number(pt.rpm) || 1200),
      onKerb: pt.onKerb ? 1 : 0,
      offTrack: pt.offTrack ? 1 : 0
    }));
  }

  function normalizeRecord(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const timing = raw.timing || {};
    const lapTime = Number(timing.lapTime);
    if (!Number.isFinite(lapTime) || lapTime < 15.0 || lapTime > 3600.0) return null;

    const rawCar = raw.car || {};
    const presetId = String(rawCar.presetId || 'procedural');
    const canonicalClass = resolveCarClass(presetId, rawCar.carClass);
    const metaCls = CLASS_META[canonicalClass] || CLASS_META.CUSTOM;

    const edition = (raw.edition === 'arcade') ? 'arcade' : 'realistic';
    const rawCond = raw.conditions || {};
    const weather = (rawCond.weather === 'wet') ? 'wet' : 'dry';
    const circuitId = String(raw.circuitId || '').trim();
    if (!circuitId) return null;

    const rawSetup = raw.setup || {};
    const rec = {
      id: String(raw.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
      recordedAt: String(raw.recordedAt || new Date().toISOString()),
      driverName: String(raw.driverName || 'PLAYER').trim().slice(0, 24) || 'PLAYER',
      circuitId,
      circuitName: String(raw.circuitName || circuitId.toUpperCase()),
      trackLengthM: Math.round((Number(raw.trackLengthM) || 5500) * 10) / 10,
      edition,
      mode: (raw.mode === 'ai_race') ? 'ai_race' : 'time_attack',
      pinned: !!raw.pinned,
      isLegacyMigrated: !!raw.isLegacyMigrated,
      carClass: canonicalClass,
      weather,
      car: {
        presetId,
        carName: String(rawCar.carName || presetId.toUpperCase()),
        carClass: canonicalClass,
        classLabel: metaCls.label,
        livery: String(rawCar.livery || 'original'),
        paintHex: String(rawCar.paintHex || '#ef4444')
      },
      setup: {
        tireCompound: String(rawSetup.tireCompound || 'medium'),
        transmission: (rawSetup.transmission === 'MT') ? 'MT' : 'AT',
        aeroWing: Math.max(1, Math.min(5, Math.round(Number(rawSetup.aeroWing) || 3))),
        brakeBias: Math.max(52, Math.min(64, Math.round(Number(rawSetup.brakeBias) || 58))),
        gearRatio: ['short', 'standard', 'long'].includes(rawSetup.gearRatio) ? rawSetup.gearRatio : 'standard',
        suspension: ['soft', 'balanced', 'stiff'].includes(rawSetup.suspension) ? rawSetup.suspension : 'balanced'
      },
      conditions: {
        weather,
        surfaceState: ['green', 'fast', 'optimum', 'wet'].includes(rawCond.surfaceState)
          ? rawCond.surfaceState
          : (weather === 'wet' ? 'wet' : 'fast'),
        ambientTempC: Number.isFinite(Number(rawCond.ambientTempC)) ? Math.round(Number(rawCond.ambientTempC)) : (weather === 'wet' ? 17 : 23),
        trackTempC: Number.isFinite(Number(rawCond.trackTempC)) ? Math.round(Number(rawCond.trackTempC)) : (weather === 'wet' ? 19 : 34),
        timeOfDay: String(rawCond.timeOfDay || 'day'),
        effectiveGrip: Math.round((Number(rawCond.effectiveGrip) || (weather === 'wet' ? 0.72 : 1.0)) * 1000) / 1000
      },
      timing: {
        lapTime: Math.round(lapTime * 1000) / 1000,
        s1: Number.isFinite(Number(timing.s1)) ? Math.round(Number(timing.s1) * 1000) / 1000 : null,
        s2: Number.isFinite(Number(timing.s2)) ? Math.round(Number(timing.s2) * 1000) / 1000 : null,
        s3: Number.isFinite(Number(timing.s3)) ? Math.round(Number(timing.s3) * 1000) / 1000 : null,
        jumpPenaltySec: Number(timing.jumpPenaltySec) || 0,
        isValidLap: timing.isValidLap !== false,
        topSpeedKmh: Math.round(Number(timing.topSpeedKmh) || 0),
        avgSpeedKmh: Math.round((Number(timing.avgSpeedKmh) || 0) * 10) / 10,
        bench0to100: Number.isFinite(Number(timing.bench0to100)) ? Math.round(Number(timing.bench0to100) * 100) / 100 : null,
        bench0to200: Number.isFinite(Number(timing.bench0to200)) ? Math.round(Number(timing.bench0to200) * 100) / 100 : null,
        lockups: Math.round(Number(timing.lockups) || 0),
        understeers: Math.round(Number(timing.understeers) || 0),
        oversteers: Math.round(Number(timing.oversteers) || 0),
        driverGrade: String(timing.driverGrade || 'A')
      },
      telemetry: Array.isArray(raw.telemetry) ? quantizeTelemetry(raw.telemetry) : []
    };
    return rec;
  }

  function putInIDB(rec) {
    if (!dbInstance) {
      pendingDeletes.delete(rec.id);
      pendingPuts.set(rec.id, rec);
      return Promise.resolve();
    }
    const p = new Promise((resolve) => {
      try {
        const tx = dbInstance.transaction([STORE_NAME], 'readwrite');
        tx.objectStore(STORE_NAME).put(rec);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
    return trackTx(p);
  }

  function deleteInIDB(id) {
    if (!dbInstance) {
      pendingPuts.delete(id);
      pendingDeletes.add(id);
      return Promise.resolve();
    }
    const p = new Promise((resolve) => {
      try {
        const tx = dbInstance.transaction([STORE_NAME], 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
    return trackTx(p);
  }

  function upsertCache(rec) {
    const idx = recordsCache.findIndex(r => r.id === rec.id);
    if (idx >= 0) recordsCache[idx] = rec;
    else recordsCache.push(rec);
  }

  function migrateLegacyRecords() {
    let alreadyMigrated = false;
    try { alreadyMigrated = localStorage.getItem(LEGACY_MIGRATED_KEY) === '1'; } catch (e) {}
    if (alreadyMigrated) return;

    let legacy = {};
    try { legacy = JSON.parse(localStorage.getItem(LEGACY_RECORDS_KEY) || '{}') || {}; } catch (e) { legacy = {}; }
    const circuits = (typeof window !== 'undefined' && Array.isArray(window.CIRCUITS)) ? window.CIRCUITS : [];
    const seenKeys = new Set();

    Object.entries(legacy).forEach(([k, val]) => {
      const lapTime = Number(val);
      if (!Number.isFinite(lapTime) || lapTime < 15.0) return;
      const parts = k.split('_');
      const cIdx = parseInt(parts[0], 10);
      const edition = parts[1] === 'arcade' ? 'arcade' : 'realistic';
      const cls = CLASS_META[parts[2]] ? parts[2] : 'GT3';
      const cir = circuits[cIdx];
      if (!cir) return;
      const dedupeKey = `${cir.id}_${cls}_${edition}`;
      if (parts.length === 2 && legacy[`${cIdx}_${edition}_GT3`]) return;
      if (seenKeys.has(dedupeKey)) return;
      seenKeys.add(dedupeKey);

      const recId = `legacy_${cir.id}_${cls}_${edition}`;
      if (recordsCache.some(r => r.id === recId)) return;

      const migrated = normalizeRecord({
        id: recId,
        recordedAt: '2026-11-22T00:00:00.000Z',
        driverName: 'PLAYER (Legacy)',
        circuitId: cir.id,
        circuitName: cir.name,
        trackLengthM: 5800,
        edition,
        mode: 'time_attack',
        isLegacyMigrated: true,
        car: {
          presetId: cls === 'F1' ? 'f1_2026_sf26' : (cls === 'LMP1' ? 'porsche_919_evo' : (cls === 'HYPER' ? 'mclaren_senna' : (cls === 'STREET' ? 'lamborghini_aventador' : 'ferrari458'))),
          carName: `${cls} (舊版遷移最佳圈)`,
          carClass: cls
        },
        conditions: { weather: 'dry', surfaceState: 'fast', timeOfDay: cir.theme && cir.theme.isNight ? 'night' : 'day' },
        timing: { lapTime, isValidLap: true, driverGrade: 'A' },
        telemetry: []
      });
      if (migrated) {
        upsertCache(migrated);
        putInIDB(migrated);
      }
    });

    try { localStorage.setItem(LEGACY_MIGRATED_KEY, '1'); } catch (e) {}
  }

  function init() {
    if (initPromise) return initPromise;
    initPromise = new Promise((resolve) => {
      const finishInit = () => {
        migrateLegacyRecords();
        readyListeners.forEach(fn => { try { fn(recordsCache); } catch (e) {} });
        if (typeof window !== 'undefined' && typeof window.renderHomeScreen === 'function') {
          try { window.renderHomeScreen(); } catch (e) {}
        }
        resolve(recordsCache);
      };

      if (typeof indexedDB === 'undefined') {
        finishInit();
        return;
      }

      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (ev) => {
          const db = ev.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('by_board', ['circuitId', 'carClass', 'edition', 'weather'], { unique: false });
            store.createIndex('by_circuit', 'circuitId', { unique: false });
            store.createIndex('by_recordedAt', 'recordedAt', { unique: false });
          }
        };
        req.onsuccess = (ev) => {
          dbInstance = ev.target.result;
          try {
            const tx = dbInstance.transaction([STORE_NAME], 'readonly');
            const getAllReq = tx.objectStore(STORE_NAME).getAll();
            getAllReq.onsuccess = () => {
              const fromDb = Array.isArray(getAllReq.result) ? getAllReq.result : [];
              fromDb.forEach(item => {
                if (!pendingDeletes.has(item.id) && !pendingPuts.has(item.id)) {
                  const norm = normalizeRecord(item);
                  if (norm) upsertCache(norm);
                }
              });
              // Flush any records created synchronously before IDB opened
              pendingDeletes.forEach(id => {
                recordsCache = recordsCache.filter(r => r.id !== id);
                deleteInIDB(id);
              });
              pendingDeletes.clear();
              pendingPuts.forEach(rec => {
                upsertCache(rec);
                putInIDB(rec);
              });
              pendingPuts.clear();
              finishInit();
            };
            getAllReq.onerror = () => finishInit();
          } catch (e) {
            finishInit();
          }
        };
        req.onerror = () => finishInit();
      } catch (e) {
        finishInit();
      }
    });
    return initPromise;
  }

  function whenIdle() {
    return init().then(() => Promise.all(Array.from(pendingTxPromises)));
  }

  function getClassBenchmarks(circuitId, carClass, edition, weather) {
    const circuits = (typeof window !== 'undefined' && Array.isArray(window.CIRCUITS)) ? window.CIRCUITS : [];
    const cIdx = circuits.findIndex(c => c.id === circuitId);
    let proTime = (cIdx >= 0 && circuits[cIdx].proLapTime) ? circuits[cIdx].proLapTime : 95.0;
    if (typeof window !== 'undefined' && typeof window.estimateClassProLapTime === 'function' && cIdx >= 0) {
      proTime = window.estimateClassProLapTime(cIdx, carClass, weather);
    } else {
      const CLASS_PRO_MULT = { STREET: 1.135, GT3: 1.0, HYPER: 0.895, LMP1: 0.750, F1: 0.695 };
      const clsMult = CLASS_PRO_MULT[carClass] || 1.0;
      const wetMult = (weather === 'wet') ? 1.125 : 1.0;
      proTime = proTime * clsMult * wetMult;
    }
    if (edition === 'arcade') proTime *= 0.94;
    return {
      proTime: Math.round(proTime * 1000) / 1000,
      goldTime: Math.round(proTime * 1.02 * 1000) / 1000,
      silverTime: Math.round(proTime * 1.05 * 1000) / 1000,
      bronzeTime: Math.round(proTime * 1.10 * 1000) / 1000
    };
  }

  function getClassLeaderboard(opts = {}) {
    const circuitId = opts.circuitId || (typeof currentCircuit !== 'undefined' && currentCircuit ? currentCircuit.id : 'monza');
    const carClass = CLASS_META[opts.carClass] ? opts.carClass : 'GT3';
    const edition = (opts.edition === 'arcade') ? 'arcade' : 'realistic';
    const weather = (opts.weather === 'wet') ? 'wet' : 'dry';
    const dedupeMode = opts.dedupeMode || 'per_car';
    const tireFilter = opts.tireFilter || 'all';
    const presetFilter = opts.presetFilter || 'all';
    const pinnedOnly = !!opts.pinnedOnly;

    let matching = recordsCache.filter(r =>
      r.circuitId === circuitId &&
      r.carClass === carClass &&
      r.edition === edition &&
      r.conditions.weather === weather &&
      r.timing.isValidLap === true &&
      (tireFilter === 'all' || r.setup.tireCompound === tireFilter) &&
      (presetFilter === 'all' || r.car.presetId === presetFilter) &&
      (!pinnedOnly || r.pinned)
    );

    matching.sort((a, b) => a.timing.lapTime - b.timing.lapTime || a.recordedAt.localeCompare(b.recordedAt));

    if (dedupeMode === 'per_car') {
      const seen = new Set();
      matching = matching.filter(r => {
        if (seen.has(r.car.presetId)) return false;
        seen.add(r.car.presetId);
        return true;
      });
    } else if (dedupeMode === 'per_driver') {
      const seen = new Set();
      matching = matching.filter(r => {
        const key = `${r.driverName}__${r.car.presetId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const benchmarks = getClassBenchmarks(circuitId, carClass, edition, weather);
    const leaderTime = matching.length ? matching[0].timing.lapTime : benchmarks.proTime;
    const entries = matching.map((r, i) => ({
      rank: i + 1,
      record: r,
      deltaLeader: r.timing.lapTime - leaderTime,
      deltaPro: r.timing.lapTime - benchmarks.proTime
    }));

    return {
      partition: { circuitId, carClass, edition, weather, dedupeMode },
      benchmarks,
      entries
    };
  }

  function getAllHistory(opts = {}) {
    let list = recordsCache.slice();
    if (opts.circuitId && opts.circuitId !== 'all') list = list.filter(r => r.circuitId === opts.circuitId);
    if (opts.carClass && opts.carClass !== 'all') list = list.filter(r => r.carClass === opts.carClass);
    if (opts.edition && opts.edition !== 'all') list = list.filter(r => r.edition === opts.edition);
    if (opts.weather && opts.weather !== 'all') list = list.filter(r => r.conditions.weather === opts.weather);
    if (opts.tireFilter && opts.tireFilter !== 'all') list = list.filter(r => r.setup.tireCompound === opts.tireFilter);
    if (opts.presetFilter && opts.presetFilter !== 'all') list = list.filter(r => r.car.presetId === opts.presetFilter);
    if (opts.pinnedOnly) list = list.filter(r => r.pinned);
    if (opts.validOnly) list = list.filter(r => r.timing.isValidLap);
    list.sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || ''));
    return list;
  }

  function recordCompletedLap(payload) {
    const rec = normalizeRecord({
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      recordedAt: new Date().toISOString(),
      driverName: payload.driverName || getDriverName(),
      circuitId: payload.circuitId,
      circuitName: payload.circuitName,
      trackLengthM: payload.trackLengthM,
      edition: payload.edition,
      mode: payload.mode,
      car: payload.car,
      setup: payload.setup,
      conditions: payload.conditions,
      timing: payload.timing,
      telemetry: payload.telemetry
    });
    if (!rec) return null;

    // Evaluate PB status in the exact isolated partition BEFORE inserting
    const prevPartitionValid = recordsCache.filter(r =>
      r.circuitId === rec.circuitId &&
      r.carClass === rec.carClass &&
      r.edition === rec.edition &&
      r.conditions.weather === rec.conditions.weather &&
      r.timing.isValidLap === true
    );
    const prevClassBest = prevPartitionValid.length ? Math.min(...prevPartitionValid.map(r => r.timing.lapTime)) : Infinity;
    const prevCarValid = prevPartitionValid.filter(r => r.car.presetId === rec.car.presetId);
    const prevCarBest = prevCarValid.length ? Math.min(...prevCarValid.map(r => r.timing.lapTime)) : Infinity;

    upsertCache(rec);
    putInIDB(rec);

    const board = getClassLeaderboard({
      circuitId: rec.circuitId,
      carClass: rec.carClass,
      edition: rec.edition,
      weather: rec.conditions.weather,
      dedupeMode: 'all'
    });
    const idx = board.entries.findIndex(e => e.record.id === rec.id);

    return {
      record: rec,
      rankInClass: idx >= 0 ? (idx + 1) : null,
      totalInClass: board.entries.length,
      isNewClassPB: rec.timing.isValidLap && rec.timing.lapTime < prevClassBest,
      isNewCarPB: rec.timing.isValidLap && rec.timing.lapTime < prevCarBest
    };
  }

  function getRecordById(id) {
    return recordsCache.find(r => r.id === id) || null;
  }

  function togglePin(id) {
    const rec = getRecordById(id);
    if (!rec) return false;
    rec.pinned = !rec.pinned;
    putInIDB(rec);
    return rec.pinned;
  }

  function deleteRecord(id) {
    const before = recordsCache.length;
    recordsCache = recordsCache.filter(r => r.id !== id);
    if (recordsCache.length !== before) {
      deleteInIDB(id);
      return true;
    }
    return false;
  }

  function clearAllForTesting() {
    const ids = recordsCache.map(r => r.id);
    recordsCache = [];
    ids.forEach(id => deleteInIDB(id));
  }

  function exportRecordsJSON(ids = null) {
    const list = (Array.isArray(ids) && ids.length)
      ? recordsCache.filter(r => ids.includes(r.id))
      : recordsCache.slice();
    return JSON.stringify({
      schema: 'apex-pro-records-v1',
      exportedAt: new Date().toISOString(),
      count: list.length,
      records: list
    }, null, 2);
  }

  function importRecordsJSON(jsonText) {
    let parsed;
    try {
      parsed = (typeof jsonText === 'string') ? JSON.parse(jsonText) : jsonText;
    } catch (e) {
      return { ok: false, imported: 0, skipped: 0, error: '無效的 JSON 格式' };
    }
    const items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.records) ? parsed.records : null);
    if (!items) return { ok: false, imported: 0, skipped: 0, error: '找不到 records 陣列' };

    let imported = 0;
    let skipped = 0;
    let sanitizedClasses = 0;

    items.forEach(raw => {
      const claimedClass = raw && (raw.carClass || (raw.car && raw.car.carClass));
      const norm = normalizeRecord(raw);
      if (!norm) {
        skipped++;
        return;
      }
      if (claimedClass && norm.carClass !== claimedClass) {
        sanitizedClasses++;
      }
      // Avoid exact duplicate timestamp+lapTime+car
      const duplicate = recordsCache.find(r =>
        r.id === norm.id ||
        (r.circuitId === norm.circuitId &&
          r.car.presetId === norm.car.presetId &&
          r.recordedAt === norm.recordedAt &&
          Math.abs(r.timing.lapTime - norm.timing.lapTime) < 0.001)
      );
      if (duplicate) {
        skipped++;
        return;
      }
      upsertCache(norm);
      putInIDB(norm);
      imported++;
    });

    return { ok: true, imported, skipped, sanitizedClasses };
  }

  function getTotalValidCount() {
    return recordsCache.filter(r => r.timing.isValidLap).length;
  }

  function onReady(fn) {
    if (typeof fn === 'function') readyListeners.add(fn);
  }

  // Kick off DB initialization asynchronously after microtask so window.CIRCUITS is available
  setTimeout(() => { init(); }, 0);

  window.ApexRecords = {
    CLASS_META,
    init,
    ready: init,
    whenIdle,
    onReady,
    resolveCarClass,
    getDriverName,
    setDriverName,
    recordCompletedLap,
    getClassLeaderboard,
    getClassBenchmarks,
    getAllHistory,
    getRecordById,
    togglePin,
    deleteRecord,
    exportRecordsJSON,
    importRecordsJSON,
    getTotalValidCount,
    clearAllForTesting
  };
})();

if (window.__apexTrace) window.__apexTrace('records.js', 'OK');
