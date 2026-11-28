// ============================================================================
// APEX PRO RACING // MODULE 8: LOCAL & LAN MULTIPLAYER WEBSOCKET CLIENT
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('net.js', 'START');

(function () {
  const DEFAULT_WS_PORT = 8766;
  const STORAGE_URL_KEY = 'apexpro.mpServerUrl';
  const INTERP_DELAY_MS = 90;
  const MAX_EXTRAP_SEC = 0.12;

  const netState = {
    ws: null,
    connected: false,
    connecting: false,
    serverUrl: '',
    autoDiscoveredUrl: '',
    playerId: null,
    rttMs: 0,
    clockOffsetMs: 0,
    room: null,
    roomList: [],
    standings: [],
    lastError: null,
    sendAccum: 0,
    pingTimer: null,
    listeners: new Set(),
    raceListeners: new Set(),
    peers: new Map(), // id -> remote peer record
    collisionMode: 'soft',
    customName: '',
    serverInfo: null
  };

  function notifyListeners(reason = 'state') {
    const snap = getSnapshot();
    netState.listeners.forEach(cb => {
      try { cb(snap, reason); } catch (e) { console.error('[APEX NET] listener err:', e); }
    });
  }

  function emitRaceEvent(type, payload) {
    netState.raceListeners.forEach(cb => {
      try { cb(type, payload); } catch (e) { console.error('[APEX NET] race event err:', e); }
    });
  }

  async function resolveDefaultWsUrl() {
    const saved = (typeof localStorage !== 'undefined') ? (localStorage.getItem(STORAGE_URL_KEY) || '').trim() : '';
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname)
      ? window.location.hostname
      : '127.0.0.1';
    let wsPort = DEFAULT_WS_PORT;
    if (typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
      try {
        const res = await fetch('/__mp_info.json', { cache: 'no-store' });
        if (res.ok) {
          const info = await res.json();
          if (info) {
            netState.serverInfo = info;
            if (info.wsPort) wsPort = Number(info.wsPort) || DEFAULT_WS_PORT;
          }
        }
      } catch (e) { /* fallback to default port */ }
    }
    const autoUrl = `ws://${host}:${wsPort}`;
    netState.autoDiscoveredUrl = autoUrl;
    if (!netState.serverUrl) {
      netState.serverUrl = saved || autoUrl;
    }
    return netState.serverUrl;
  }

  function getServerNowMs() {
    return Date.now() + netState.clockOffsetMs;
  }

  function setPlayerName(name) {
    netState.customName = String(name || '').trim().slice(0, 20);
  }

  function getPlayerName() {
    if (netState.customName) return netState.customName;
    if (window.ApexRecords && typeof window.ApexRecords.getDriverName === 'function') {
      return window.ApexRecords.getDriverName() || 'PLAYER';
    }
    return 'PLAYER';
  }

  function getMyIdentityPayload() {
    const driverName = getPlayerName();
    const presetId = (typeof carAssetState !== 'undefined' && carAssetState && carAssetState.presetId)
      ? carAssetState.presetId
      : 'procedural';
    const paintHex = (typeof carAssetState !== 'undefined' && carAssetState && carAssetState.paintHex)
      ? carAssetState.paintHex
      : '#ef4444';
    const livery = (typeof carAssetState !== 'undefined' && carAssetState && carAssetState.livery)
      ? carAssetState.livery
      : 'original';
    const cp = (typeof getCurrentCarHandling === 'function') ? getCurrentCarHandling() : null;
    const carClass = (cp && cp.carClass) ? cp.carClass : 'GT3';
    return { name: driverName, presetId, carClass, paintHex, livery };
  }

  function getGridSlotCoords(slotIdx, totalCount) {
    const safeSlot = Math.max(0, Number(slotIdx) || 0);
    const total = Math.max(1, Number(totalCount) || 1);
    // Pole starts furthest forward (up to +49m); last starts at s = 0m
    const s = Math.max(0, (total - 1 - safeSlot) * 7.0);
    const d = (safeSlot % 2 === 0) ? -2.8 : 2.8;
    return { s, d };
  }

  function clearAllPeerMeshes() {
    netState.peers.forEach(peer => {
      if (peer.mesh && typeof window.disposeRemotePeerVehicleMesh === 'function') {
        window.disposeRemotePeerVehicleMesh(peer.mesh);
      }
      peer.mesh = null;
    });
    netState.peers.clear();
  }

  function hideAllPeerMeshes() {
    netState.peers.forEach(peer => {
      if (peer.mesh) peer.mesh.visible = false;
    });
  }

  function syncPeersFromRoom(room) {
    if (!room || !Array.isArray(room.players)) {
      clearAllPeerMeshes();
      return;
    }
    netState.collisionMode = room.collisionMode || 'soft';
    const activeIds = new Set();
    const total = room.players.length;
    const isGhostMode = (netState.collisionMode === 'ghost');

    room.players.forEach(p => {
      if (p.id === netState.playerId) return;
      activeIds.add(p.id);
      let peer = netState.peers.get(p.id);
      const grid = getGridSlotCoords(p.gridSlot, total);
      const wantLivery = p.livery || 'original';
      const needsMesh = !peer || !peer.mesh || peer.presetId !== p.presetId || peer.paintHex !== p.paintHex || peer.livery !== wantLivery || peer.isGhostMesh !== isGhostMode;

      if (!peer) {
        peer = {
          id: p.id,
          name: p.name || p.id,
          presetId: p.presetId || 'procedural',
          carClass: p.carClass || 'GT3',
          paintHex: p.paintHex || '#38bdf8',
          livery: wantLivery,
          gridSlot: p.gridSlot || 0,
          colorHex: p.paintHex || '#38bdf8',
          isGhostMesh: isGhostMode,
          samples: [],
          s: grid.s,
          d: grid.d,
          heading: 0,
          speedMs: 0,
          yawRate: 0,
          steerInput: 0,
          brakeInput: 0,
          throttleInput: 0,
          gear: 1,
          lap: 1,
          finished: !!p.finished,
          finishTime: p.finishTime || null,
          bestLap: p.bestLap || null,
          jumpPenaltySec: p.jumpPenaltySec || 0,
          mesh: null
        };
        netState.peers.set(p.id, peer);
      } else {
        peer.name = p.name || peer.name;
        peer.carClass = p.carClass || peer.carClass;
        peer.gridSlot = p.gridSlot || 0;
        peer.finished = !!p.finished;
        peer.finishTime = p.finishTime || null;
        peer.bestLap = p.bestLap || null;
        peer.jumpPenaltySec = p.jumpPenaltySec || 0;
      }

      if (needsMesh && typeof window.createRemotePeerVehicleMesh === 'function') {
        if (peer.mesh && typeof window.disposeRemotePeerVehicleMesh === 'function') {
          window.disposeRemotePeerVehicleMesh(peer.mesh);
        }
        peer.presetId = p.presetId || 'procedural';
        peer.paintHex = p.paintHex || '#38bdf8';
        peer.livery = wantLivery;
        peer.colorHex = peer.paintHex;
        peer.isGhostMesh = isGhostMode;
        peer.mesh = window.createRemotePeerVehicleMesh(peer.presetId, peer.paintHex, isGhostMode, peer.livery);
        if (peer.mesh) {
          peer.mesh.visible = (typeof simState !== 'undefined' && !simState.inShowcaseMode && simState.mode === 'multiplayer');
          if (typeof sdToWorld === 'function' && typeof syncAiMeshTransform === 'function') {
            const w = sdToWorld(peer.s, peer.d);
            peer.heading = w.heading;
            syncAiMeshTransform(peer, w);
          }
        }
      }
    });

    Array.from(netState.peers.keys()).forEach(id => {
      if (!activeIds.has(id)) {
        const gone = netState.peers.get(id);
        if (gone && gone.mesh && typeof window.disposeRemotePeerVehicleMesh === 'function') {
          window.disposeRemotePeerVehicleMesh(gone.mesh);
        }
        netState.peers.delete(id);
      }
    });
  }

  function sendJson(obj) {
    if (!netState.ws || netState.ws.readyState !== 1) return false;
    try {
      netState.ws.send(JSON.stringify(obj));
      return true;
    } catch (e) {
      return false;
    }
  }

  function sendPing() {
    sendJson({ type: 'ping', clientMs: Date.now() });
  }

  async function connect(customUrl) {
    if (customUrl) {
      netState.serverUrl = String(customUrl).trim();
      try { localStorage.setItem(STORAGE_URL_KEY, netState.serverUrl); } catch (e) {}
    } else if (!netState.serverUrl) {
      await resolveDefaultWsUrl();
    }
    const targetUrl = netState.serverUrl || netState.autoDiscoveredUrl || `ws://127.0.0.1:${DEFAULT_WS_PORT}`;

    if (netState.ws) {
      try { netState.ws.close(); } catch (e) {}
      netState.ws = null;
    }
    if (netState.pingTimer) {
      clearInterval(netState.pingTimer);
      netState.pingTimer = null;
    }

    netState.connecting = true;
    netState.connected = false;
    netState.lastError = null;
    notifyListeners();

    return new Promise((resolve) => {
      let settled = false;
      const done = (ok) => {
        if (!settled) { settled = true; resolve(ok); }
      };
      let ws;
      try {
        ws = new WebSocket(targetUrl);
      } catch (e) {
        netState.connecting = false;
        netState.lastError = 'WebSocket 位址格式無效：' + targetUrl;
        notifyListeners();
        done(false);
        return;
      }
      netState.ws = ws;

      ws.onopen = () => {
        netState.connecting = false;
        netState.connected = true;
        netState.lastError = null;
        const idPayload = getMyIdentityPayload();
        sendJson(Object.assign({ type: 'hello' }, idPayload));
        sendPing();
        sendJson({ type: 'list_rooms' });
        netState.pingTimer = setInterval(sendPing, 2500);
        notifyListeners();
        done(true);
      };

      ws.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch (e) { return; }
        if (!msg || !msg.type) return;

        if (msg.type === 'welcome') {
          netState.playerId = msg.playerId;
          if (msg.serverTimeMs) {
            netState.clockOffsetMs = msg.serverTimeMs - Date.now();
          }
          notifyListeners();
        } else if (msg.type === 'pong') {
          const rtt = Math.max(0, Date.now() - (msg.clientMs || Date.now()));
          netState.rttMs = Math.round(netState.rttMs ? (netState.rttMs * 0.6 + rtt * 0.4) : rtt);
          if (msg.serverTimeMs) {
            const sampleOffset = msg.serverTimeMs - ((msg.clientMs || Date.now()) + rtt * 0.5);
            netState.clockOffsetMs = Math.round(netState.clockOffsetMs * 0.5 + sampleOffset * 0.5);
          }
          notifyListeners('ping');
        } else if (msg.type === 'room_list') {
          netState.roomList = Array.isArray(msg.rooms) ? msg.rooms : [];
          notifyListeners();
        } else if (msg.type === 'room_state') {
          netState.room = msg.room || null;
          netState.lastError = null;
          syncPeersFromRoom(netState.room);
          if (!netState.room) {
            netState.standings = [];
          }
          notifyListeners();
        } else if (msg.type === 'race_start') {
          netState.room = msg.room || null;
          netState.standings = [];
          netState.lastError = null;
          // Reset peer buffers cleanly onto grid slots before launch
          netState.peers.forEach(p => { p.samples = []; p.finished = false; p.finishTime = null; });
          syncPeersFromRoom(netState.room);
          if (netState.room && Array.isArray(netState.room.players)) {
            const total = netState.room.players.length;
            netState.room.players.forEach(p => {
              if (p.id !== netState.playerId) {
                const peer = netState.peers.get(p.id);
                if (peer) {
                  const grid = getGridSlotCoords(p.gridSlot, total);
                  peer.s = grid.s;
                  peer.d = grid.d;
                  peer.speedMs = 0;
                  peer.lap = 1;
                }
              }
            });
          }
          notifyListeners();
          emitRaceEvent('race_start', netState.room);
        } else if (msg.type === 'peer_state') {
          const peer = netState.peers.get(msg.id);
          if (!peer) return;
          peer.samples.push({
            srvMs: msg.srvMs || getServerNowMs(),
            s: Number(msg.s) || 0,
            d: Number(msg.d) || 0,
            h: Number(msg.h) || 0,
            v: Number(msg.v) || 0,
            yr: Number(msg.yr) || 0,
            st: Number(msg.st) || 0,
            brk: Number(msg.brk) || 0,
            thr: Number(msg.thr) || 0,
            gear: Number(msg.gear) || 1,
            lap: Number(msg.lap) || 1
          });
          if (peer.samples.length > 16) peer.samples.shift();
        } else if (msg.type === 'race_standings') {
          netState.standings = Array.isArray(msg.standings) ? msg.standings : [];
          if (netState.room && msg.roomStatus) {
            netState.room.status = msg.roomStatus;
          }
          netState.standings.forEach(st => {
            const peer = netState.peers.get(st.id);
            if (peer) {
              peer.finished = !!st.finished;
              peer.finishTime = st.finishTime;
              peer.bestLap = st.bestLap;
              peer.jumpPenaltySec = st.jumpPenaltySec || 0;
            }
          });
          notifyListeners();
          emitRaceEvent('race_standings', netState.standings);
        } else if (msg.type === 'error') {
          netState.lastError = msg.message || msg.code || '連線操作失敗';
          notifyListeners();
        }
      };

      ws.onerror = () => {
        if (!netState.connected) {
          netState.lastError = `無法連線至多人伺服器 (${targetUrl})，請確認伺服器已啟動`;
        }
        notifyListeners();
        done(false);
      };

      ws.onclose = () => {
        if (netState.pingTimer) {
          clearInterval(netState.pingTimer);
          netState.pingTimer = null;
        }
        netState.connected = false;
        netState.connecting = false;
        netState.ws = null;
        notifyListeners();
        done(false);
      };
    });
  }

  function disconnect() {
    if (netState.pingTimer) {
      clearInterval(netState.pingTimer);
      netState.pingTimer = null;
    }
    if (netState.ws) {
      try { netState.ws.close(); } catch (e) {}
      netState.ws = null;
    }
    netState.connected = false;
    netState.connecting = false;
    netState.room = null;
    netState.standings = [];
    clearAllPeerMeshes();
    notifyListeners();
  }

  function ensureIdentitySent() {
    return getMyIdentityPayload();
  }

  function quickMatch(opts) {
    const id = ensureIdentitySent();
    return sendJson(Object.assign({ type: 'quick_match' }, id, opts || {}));
  }

  function createRoom(opts) {
    const id = ensureIdentitySent();
    return sendJson(Object.assign({ type: 'create_room' }, id, opts || {}));
  }

  function joinRoom(code) {
    const id = ensureIdentitySent();
    return sendJson(Object.assign({ type: 'join_room', code: String(code || '').trim().toUpperCase() }, id));
  }

  function refreshRoomList() {
    return sendJson({ type: 'list_rooms' });
  }

  function updateRoom(patch) {
    return sendJson(Object.assign({ type: 'update_room' }, patch || {}));
  }

  function updateMyPlayer(patch) {
    const id = ensureIdentitySent();
    return sendJson(Object.assign({ type: 'update_player' }, id, patch || {}));
  }

  function sendIdentityUpdate() {
    const id = ensureIdentitySent();
    sendJson(Object.assign({ type: 'hello' }, id));
    if (netState.room) {
      sendJson(Object.assign({ type: 'update_player' }, id));
    }
    notifyListeners('state');
  }

  function leaveRoom() {
    clearAllPeerMeshes();
    return sendJson({ type: 'leave_room' });
  }

  function startRace() {
    return sendJson({ type: 'start_race' });
  }

  function returnToLobby() {
    return sendJson({ type: 'return_lobby' });
  }

  function reportFinish(totalTime, bestLap, jumpPenaltySec) {
    return sendJson({
      type: 'finish',
      totalTime: Number(totalTime) || 0,
      bestLap: Number(bestLap) || Number(totalTime) || 0,
      jumpPenaltySec: Number(jumpPenaltySec) || 0
    });
  }

  function wrapDeltaS(ds, trkLen) {
    if (ds > trkLen * 0.5) ds -= trkLen;
    if (ds < -trkLen * 0.5) ds += trkLen;
    return ds;
  }

  function wrapAngleRad(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function stepMultiplayer(dt) {
    if (typeof simState === 'undefined' || simState.mode !== 'multiplayer') return;
    const trkLen = (typeof getTotalTrackLength === 'function') ? getTotalTrackLength() : 5000;

    // 1. Broadcast local car state at ~20Hz
    netState.sendAccum += dt;
    if (netState.sendAccum >= 0.05 && netState.connected && netState.room) {
      netState.sendAccum = 0;
      sendJson({
        type: 'state',
        s: Number(simState.s.toFixed(3)),
        d: Number(simState.d.toFixed(3)),
        h: Number(simState.heading.toFixed(4)),
        v: Number(simState.speedMs.toFixed(2)),
        yr: Number(simState.yawRate.toFixed(3)),
        st: Number(simState.steerInput.toFixed(3)),
        brk: Math.round(simState.brakeInput),
        thr: Math.round(simState.throttleInput),
        gear: simState.gear,
        lap: simState.lap,
        trkLen: Math.round(trkLen)
      });
    }

    // 2. Interpolate remote peers & sync 3D transforms
    const targetSrvMs = getServerNowMs() - INTERP_DELAY_MS;
    const totalPlayers = (netState.room && Array.isArray(netState.room.players)) ? netState.room.players.length : 1;

    netState.peers.forEach(peer => {
      const smp = peer.samples;
      if (smp.length >= 2) {
        if (targetSrvMs <= smp[0].srvMs) {
          const a = smp[0];
          peer.s = a.s; peer.d = a.d; peer.heading = a.h; peer.speedMs = a.v;
          peer.yawRate = a.yr; peer.steerInput = a.st; peer.brakeInput = a.brk;
          peer.throttleInput = a.thr; peer.gear = a.gear; peer.lap = a.lap;
        } else if (targetSrvMs >= smp[smp.length - 1].srvMs) {
          const last = smp[smp.length - 1];
          const extraSec = Math.min(MAX_EXTRAP_SEC, Math.max(0, (targetSrvMs - last.srvMs) / 1000));
          peer.s = ((last.s + last.v * extraSec) % trkLen + trkLen) % trkLen;
          peer.d = last.d;
          peer.heading = wrapAngleRad(last.h + last.yr * extraSec);
          peer.speedMs = last.v; peer.yawRate = last.yr; peer.steerInput = last.st;
          peer.brakeInput = last.brk; peer.throttleInput = last.thr; peer.gear = last.gear; peer.lap = last.lap;
        } else {
          let i = 0;
          while (i < smp.length - 2 && smp[i + 1].srvMs < targetSrvMs) i++;
          const a = smp[i], b = smp[i + 1];
          const span = Math.max(1, b.srvMs - a.srvMs);
          const f = Math.max(0, Math.min(1, (targetSrvMs - a.srvMs) / span));
          const ds = wrapDeltaS(b.s - a.s, trkLen);
          peer.s = ((a.s + ds * f) % trkLen + trkLen) % trkLen;
          peer.d = a.d + (b.d - a.d) * f;
          peer.heading = wrapAngleRad(a.h + wrapAngleRad(b.h - a.h) * f);
          peer.speedMs = a.v + (b.v - a.v) * f;
          peer.yawRate = a.yr + (b.yr - a.yr) * f;
          peer.steerInput = a.st + (b.st - a.st) * f;
          peer.brakeInput = a.brk + (b.brk - a.brk) * f;
          peer.throttleInput = a.thr + (b.thr - a.thr) * f;
          peer.gear = b.gear;
          peer.lap = Math.max(a.lap, b.lap);
        }
      } else if (smp.length === 1) {
        const a = smp[0];
        peer.s = a.s; peer.d = a.d; peer.heading = a.h; peer.speedMs = a.v;
        peer.brakeInput = a.brk; peer.steerInput = a.st; peer.lap = a.lap;
      } else if (simState.countdownActive) {
        const grid = getGridSlotCoords(peer.gridSlot, totalPlayers);
        peer.s = grid.s;
        peer.d = grid.d;
        peer.speedMs = 0;
        peer.lap = 1;
      }

      if (peer.mesh && typeof sdToWorld === 'function' && typeof syncAiMeshTransform === 'function') {
        const w = sdToWorld(peer.s, peer.d);
        if (smp.length === 0) peer.heading = w.heading;
        peer.mesh.visible = !simState.inShowcaseMode;
        syncAiMeshTransform(peer, w);
        if (typeof setSlotBrakeLight === 'function') {
          setSlotBrakeLight(peer.mesh, peer.brakeInput > 8, 0xff2222, 0x550000);
        }
      }

      // 3. Gentle Soft-Contact Lateral Separation (no high-latency teleport crash)
      if (!simState.countdownActive && netState.collisionMode === 'soft' && simState.speedKmh > 5) {
        const ds = wrapDeltaS(peer.s - simState.s, trkLen);
        const dd = peer.d - simState.d;
        if (Math.abs(ds) < 4.5 && Math.abs(dd) < 2.15) {
          const pushSign = (dd >= 0) ? -1 : 1;
          const overlap = 2.15 - Math.abs(dd);
          simState.colLatVel = Math.max(-4.5, Math.min(4.5, (simState.colLatVel || 0) + pushSign * overlap * 5.0 * Math.min(0.05, dt)));
        }
      }
    });
  }

  function getRemotePeers() {
    return Array.from(netState.peers.values());
  }

  function getLiveStandings() {
    if (typeof simState === 'undefined') return [];
    const trkLen = (typeof getTotalTrackLength === 'function') ? getTotalTrackLength() : 5000;
    const myId = netState.playerId || 'LOCAL';
    const idMeta = getMyIdentityPayload();
    const myProg = (simState.lap - 1) * trkLen + simState.s;
    const list = [{
      id: myId,
      name: idMeta.name,
      shortName: idMeta.name,
      carClass: idMeta.carClass,
      presetId: idMeta.presetId,
      progress: myProg,
      speedMs: simState.speedMs,
      finished: false,
      finishTime: null,
      isPlayer: true,
      stateLabel: simState.inSlipstream ? 'SLIPSTREAM' : 'RACING'
    }];

    // Match server final finish times if player already recorded in netState.standings
    const srvMap = new Map(netState.standings.map(x => [x.id, x]));
    const mySrv = srvMap.get(myId);
    if (mySrv && mySrv.finished) {
      list[0].finished = true;
      list[0].finishTime = mySrv.finishTime;
    }

    netState.peers.forEach(peer => {
      const srv = srvMap.get(peer.id);
      const prog = (peer.lap - 1) * trkLen + peer.s;
      list.push({
        id: peer.id,
        name: peer.name,
        shortName: peer.name,
        carClass: peer.carClass,
        presetId: peer.presetId,
        progress: prog,
        speedMs: peer.speedMs,
        finished: srv ? !!srv.finished : !!peer.finished,
        finishTime: srv ? srv.finishTime : peer.finishTime,
        isPlayer: false,
        stateLabel: (srv && srv.finished) ? 'FINISHED' : (peer.brakeInput > 20 ? 'BRAKING' : 'RACING')
      });
    });

    list.sort((a, b) => {
      if (a.finished && b.finished) return (a.finishTime || 0) - (b.finishTime || 0);
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      return b.progress - a.progress;
    });
    return list;
  }

  function getSnapshot() {
    return {
      connected: netState.connected,
      connecting: netState.connecting,
      serverUrl: netState.serverUrl,
      autoDiscoveredUrl: netState.autoDiscoveredUrl,
      playerId: netState.playerId,
      rttMs: netState.rttMs,
      clockOffsetMs: netState.clockOffsetMs,
      room: netState.room,
      roomList: netState.roomList,
      standings: netState.standings,
      lastError: netState.lastError,
      peerCount: netState.peers.size,
      serverInfo: netState.serverInfo,
      playerName: getPlayerName()
    };
  }

  window.apexNet = {
    resolveDefaultWsUrl,
    setPlayerName,
    getPlayerName,
    sendIdentityUpdate,
    connect,
    disconnect,
    quickMatch,
    createRoom,
    joinRoom,
    refreshRoomList,
    updateRoom,
    updateMyPlayer,
    leaveRoom,
    startRace,
    returnToLobby,
    reportFinish,
    stepMultiplayer,
    clearAllPeerMeshes,
    hideAllPeerMeshes,
    getGridSlotCoords,
    getRemotePeers,
    getLiveStandings,
    getServerNowMs,
    getSnapshot,
    onStateChange: (cb) => { netState.listeners.add(cb); return () => netState.listeners.delete(cb); },
    onRaceEvent: (cb) => { netState.raceListeners.add(cb); return () => netState.raceListeners.delete(cb); }
  };
})();
if (window.__apexTrace) window.__apexTrace('net.js', 'OK');
