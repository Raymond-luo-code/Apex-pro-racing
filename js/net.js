// ============================================================================
// APEX PRO RACING // MODULE 8: DUAL-TRANSPORT MULTIPLAYER (CODE WSS + LAN WS)
// ============================================================================
'use strict';
if (window.__apexTrace) window.__apexTrace('net.js', 'START');

(function () {
  const DEFAULT_WS_PORT = 8766;
  const STORAGE_URL_KEY = 'apexpro.mpServerUrl';
  const INTERP_DELAY_MS = 90;
  const MAX_EXTRAP_SEC = 0.12;

  const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const MQTT_CDNS = [
    'https://cdn.jsdelivr.net/npm/mqtt@5/dist/mqtt.min.js',
    'https://unpkg.com/mqtt/dist/mqtt.min.js'
  ];
  const MQTT_BROKERS = [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt'
  ];
  const MQTT_TOPIC_PREFIX = 'apexpro/v1/rm/';

  const netState = {
    transport: 'p2p', // 'p2p' (zero-server code relay) | 'ws' (local/LAN Python WS)
    transportExplicit: false,
    p2pReady: true,
    p2pConnectingMsg: '',
    ws: null,
    connected: false,
    connecting: false,
    serverUrl: '',
    autoDiscoveredUrl: '',
    isStaticHost: false,
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

  const p2pState = {
    client: null,
    brokerIdx: 0,
    roomCode: '',
    isHost: false,
    hostRoom: null,
    libPromise: null,
    joined: false,
    guestLastSeen: new Map()
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

  function cloneRoom(r) {
    return r ? JSON.parse(JSON.stringify(r)) : null;
  }

  function sanitizeRoomCode(code) {
    return String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  }

  function generateRoomCode(len = 6) {
    const out = [];
    const n = ROOM_CODE_ALPHABET.length;
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const arr = new Uint32Array(len);
      crypto.getRandomValues(arr);
      for (let i = 0; i < len; i++) out.push(ROOM_CODE_ALPHABET[arr[i] % n]);
    } else {
      for (let i = 0; i < len; i++) out.push(ROOM_CODE_ALPHABET[Math.floor(Math.random() * n)]);
    }
    return out.join('');
  }

  function parseInviteRoomFromSearch(searchStr) {
    const raw = (searchStr !== undefined)
      ? String(searchStr || '')
      : ((typeof window !== 'undefined' && window.location && window.location.search) ? window.location.search : '');
    if (!raw) return '';
    try {
      const sp = new URLSearchParams(raw);
      const code = sanitizeRoomCode(sp.get('room') || sp.get('join') || '');
      return (code.length >= 4 && code.length <= 8) ? code : '';
    } catch (e) {
      return '';
    }
  }

  function isLoopbackHost(hostname) {
    const h = String(hostname || '').trim().toLowerCase();
    return h === '127.0.0.1' || h === 'localhost' || h === '::1' || h === '[::1]' || h === '0.0.0.0';
  }

  function isStaticHostingDomain(hostname) {
    const h = String(hostname || '').trim().toLowerCase().replace(/\.+$/, '');
    if (!h) return false;
    const suffixes = ['github.io', 'gitlab.io', 'pages.dev', 'netlify.app', 'vercel.app'];
    return suffixes.some(s => h === s || h.endsWith('.' + s));
  }

  function normalizeWsUrl(rawUrl, pageProtocol) {
    let s = String(rawUrl || '').trim();
    if (!s) return '';
    const lower = s.toLowerCase();
    if (lower.startsWith('http://')) s = 'ws://' + s.slice(7);
    else if (lower.startsWith('https://')) s = 'wss://' + s.slice(8);
    if (!s.includes('://')) {
      const hasSlash = s.includes('/');
      const hostPort = hasSlash ? s.split('/')[0] : s;
      const hostOnly = hostPort.startsWith('[')
        ? hostPort.slice(0, hostPort.indexOf(']') + 1)
        : hostPort.split(':')[0];
      const hasExplicitPort = hostPort.startsWith('[')
        ? /\]:\d+$/.test(hostPort)
        : /:\d+$/.test(hostPort);
      const useWs = isLoopbackHost(hostOnly) || pageProtocol !== 'https:';
      const scheme = useWs ? 'ws://' : 'wss://';
      if (!hasExplicitPort && !hasSlash && useWs) {
        s = `${scheme}${s}:${DEFAULT_WS_PORT}`;
      } else {
        s = `${scheme}${s}`;
      }
    }
    return s;
  }

  function validateWsUrlForPage(rawUrl, pageProtocol) {
    const rawTrim = String(rawUrl || '').trim();
    const normalized = normalizeWsUrl(rawTrim, pageProtocol);
    if (!normalized) {
      return { ok: false, code: 'INVALID_SYNTAX', url: '', message: 'WebSocket 位址不可為空' };
    }
    let parsed;
    try {
      parsed = new URL(normalized);
    } catch (e) {
      return { ok: false, code: 'INVALID_SYNTAX', url: normalized, message: 'WebSocket 位址格式無效：' + rawTrim };
    }
    if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
      return { ok: false, code: 'INVALID_SYNTAX', url: normalized, message: 'WebSocket 位址格式無效：' + rawTrim };
    }
    if (isStaticHostingDomain(parsed.hostname)) {
      return {
        ok: false,
        code: 'STATIC_HOST',
        url: normalized,
        message: 'GitHub Pages 等靜態網頁主機未內建多人伺服器（無法連至 ' + parsed.host + '）。請切換至「🌐 代碼直連（免伺服器）」，或填入支援 wss:// 的外部通道位址。'
      };
    }
    if (pageProtocol === 'https:' && parsed.protocol === 'ws:' && !isLoopbackHost(parsed.hostname)) {
      return {
        ok: false,
        code: 'MIXED_CONTENT',
        url: normalized,
        message: 'HTTPS 安全網頁禁止連線至未加密的遠端 ws:// 位址（' + normalized + '）。請切換至「🌐 代碼直連」，或改用加密的 wss:// 位址。'
      };
    }
    return { ok: true, code: 'OK', url: normalized, message: null };
  }

  function computeDefaultWsUrl(ctx) {
    const loc = (typeof window !== 'undefined' && window.location) ? window.location : {};
    const c = ctx || {};
    const pageProtocol = c.protocol !== undefined ? c.protocol : (loc.protocol || 'http:');
    const host = c.hostname !== undefined ? c.hostname : (loc.hostname || '127.0.0.1');
    const search = c.search !== undefined ? c.search : (loc.search || '');
    const serverInfo = c.serverInfo !== undefined ? c.serverInfo : netState.serverInfo;
    const saved = c.saved !== undefined
      ? String(c.saved || '').trim()
      : ((typeof localStorage !== 'undefined') ? (localStorage.getItem(STORAGE_URL_KEY) || '').trim() : '');
    const wsPort = (serverInfo && Number(serverInfo.wsPort)) || DEFAULT_WS_PORT;

    try {
      const qWs = new URLSearchParams(search || '').get('ws');
      if (qWs && qWs.trim()) {
        const qVal = validateWsUrlForPage(qWs, pageProtocol);
        if (qVal.ok) {
          return {
            url: qVal.url,
            autoUrl: qVal.url,
            isStaticHost: isStaticHostingDomain(host) && !serverInfo,
            discardSaved: false
          };
        }
      }
    } catch (e) { /* ignore malformed query */ }

    const hasLocalServer = !!serverInfo;
    const staticHost = !hasLocalServer && (isStaticHostingDomain(host) || (pageProtocol === 'https:' && !isLoopbackHost(host)));
    let autoUrl;
    if (staticHost) {
      autoUrl = `ws://127.0.0.1:${wsPort}`;
    } else {
      const proto = (pageProtocol === 'https:') ? 'wss' : 'ws';
      autoUrl = `${proto}://${host || '127.0.0.1'}:${wsPort}`;
    }

    let chosenUrl = autoUrl;
    let discardSaved = false;
    if (saved) {
      const savedVal = validateWsUrlForPage(saved, pageProtocol);
      if (savedVal.ok) {
        chosenUrl = savedVal.url;
      } else {
        discardSaved = true;
      }
    }
    return { url: chosenUrl, autoUrl, isStaticHost: staticHost, discardSaved };
  }

  async function resolveDefaultWsUrl() {
    const saved = (typeof localStorage !== 'undefined') ? (localStorage.getItem(STORAGE_URL_KEY) || '').trim() : '';
    const host = (typeof window !== 'undefined' && window.location && window.location.hostname)
      ? window.location.hostname
      : '127.0.0.1';
    const pageProtocol = (typeof window !== 'undefined' && window.location && window.location.protocol)
      ? window.location.protocol
      : 'http:';
    const search = (typeof window !== 'undefined' && window.location && window.location.search)
      ? window.location.search
      : '';
    if (typeof window !== 'undefined' && pageProtocol && pageProtocol.startsWith('http')) {
      try {
        const res = await fetch('/__mp_info.json', { cache: 'no-store' });
        if (res.ok) {
          const info = await res.json();
          if (info) {
            netState.serverInfo = info;
          }
        }
      } catch (e) { /* fallback to static/local heuristic */ }
    }
    const resolved = computeDefaultWsUrl({
      hostname: host,
      protocol: pageProtocol,
      search,
      saved,
      serverInfo: netState.serverInfo
    });
    if (resolved.discardSaved && typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(STORAGE_URL_KEY); } catch (e) {}
    }
    netState.isStaticHost = resolved.isStaticHost;
    netState.autoDiscoveredUrl = resolved.autoUrl;
    if (!netState.serverUrl) {
      netState.serverUrl = resolved.url;
    }
    return netState.serverUrl;
  }

  function loadScriptTag(src, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject(new Error('No document'));
        return;
      }
      const script = document.createElement('script');
      let done = false;
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          script.remove();
          reject(new Error('Timeout loading ' + src));
        }
      }, timeoutMs);
      script.async = true;
      script.src = src;
      script.onload = () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          if (window.mqtt && typeof window.mqtt.connect === 'function') resolve(window.mqtt);
          else reject(new Error('mqtt global missing after loading ' + src));
        }
      };
      script.onerror = () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          script.remove();
          reject(new Error('Failed loading ' + src));
        }
      };
      document.head.appendChild(script);
    });
  }

  function ensureMqttLoaded() {
    if (typeof window !== 'undefined' && window.mqtt && typeof window.mqtt.connect === 'function') {
      return Promise.resolve(window.mqtt);
    }
    if (p2pState.libPromise) return p2pState.libPromise;
    p2pState.libPromise = (async () => {
      let lastErr = null;
      for (let i = 0; i < MQTT_CDNS.length; i++) {
        try {
          const lib = await loadScriptTag(MQTT_CDNS[i], 10000);
          return lib;
        } catch (e) {
          lastErr = e;
        }
      }
      p2pState.libPromise = null;
      throw lastErr || new Error('無法載入免伺服器連線模組');
    })();
    return p2pState.libPromise;
  }

  function getRoomTopics(code) {
    const clean = sanitizeRoomCode(code);
    const base = MQTT_TOPIC_PREFIX + clean;
    return {
      host: base + '/host',
      bcast: base + '/bcast',
      state: base + '/state'
    };
  }

  function teardownP2P(delayCloseMs = 0) {
    if (netState.pingTimer && netState.transport === 'p2p') {
      clearInterval(netState.pingTimer);
      netState.pingTimer = null;
    }
    const oldClient = p2pState.client;
    p2pState.client = null;
    p2pState.isHost = false;
    p2pState.roomCode = '';
    p2pState.hostRoom = null;
    p2pState.joined = false;
    p2pState.guestLastSeen.clear();
    netState.p2pConnectingMsg = '';
    if (oldClient) {
      const endIt = () => {
        try { oldClient.end(true); } catch (e) {}
      };
      if (delayCloseMs > 0) setTimeout(endIt, delayCloseMs);
      else endIt();
    }
  }

  function publishMqtt(topic, obj) {
    const c = p2pState.client;
    if (!c || !c.connected) return false;
    try {
      c.publish(topic, JSON.stringify(obj), { qos: 0, retain: false });
      return true;
    } catch (e) {
      return false;
    }
  }

  function openMqttClient(mqttLib, brokerIdx, clientId, willOpts) {
    const url = MQTT_BROKERS[brokerIdx] || MQTT_BROKERS[0];
    return new Promise((resolve, reject) => {
      let settled = false;
      let client;
      try {
        client = mqttLib.connect(url, {
          clientId,
          clean: true,
          connectTimeout: 6500,
          keepalive: 25,
          reconnectPeriod: 0,
          will: willOpts
        });
      } catch (e) {
        reject(e);
        return;
      }
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { client.end(true); } catch (e) {}
          reject(new Error('Broker timeout: ' + url));
        }
      }, 7000);
      client.once('connect', () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(client);
        }
      });
      client.once('error', (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          try { client.end(true); } catch (e) {}
          reject(err || new Error('Broker error: ' + url));
        }
      });
    });
  }

  function subscribeTopics(client, topicList) {
    return new Promise((resolve, reject) => {
      client.subscribe(topicList, { qos: 0 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async function autoSelectTransport() {
    const search = (typeof window !== 'undefined' && window.location && window.location.search)
      ? window.location.search
      : '';
    try {
      const sp = new URLSearchParams(search);
      if (parseInviteRoomFromSearch(search)) {
        netState.transport = 'p2p';
        netState.p2pReady = true;
        netState.lastError = null;
        return 'p2p';
      }
      if ((sp.get('ws') || '').trim()) {
        netState.transport = 'ws';
        return 'ws';
      }
    } catch (e) { /* ignore */ }

    await resolveDefaultWsUrl();
    if (netState.transportExplicit) {
      return netState.transport;
    }
    if (netState.serverInfo) {
      netState.transport = 'ws';
      return 'ws';
    }
    netState.transport = 'p2p';
    netState.p2pReady = true;
    netState.lastError = null;
    return 'p2p';
  }

  function setTransport(mode) {
    const next = (mode === 'ws') ? 'ws' : 'p2p';
    netState.transportExplicit = true;
    if (netState.pingTimer) {
      clearInterval(netState.pingTimer);
      netState.pingTimer = null;
    }
    teardownP2P();
    if (netState.ws) {
      try { netState.ws.close(); } catch (e) {}
      netState.ws = null;
    }
    clearAllPeerMeshes();
    netState.transport = next;
    netState.connected = false;
    netState.connecting = false;
    netState.room = null;
    netState.standings = [];
    netState.lastError = null;
    netState.p2pReady = (next === 'p2p');
    netState.p2pConnectingMsg = '';
    notifyListeners('transport');
    return next;
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

  function handleIncomingServerMsg(raw) {
    let msg = raw;
    if (typeof raw === 'string') {
      try { msg = JSON.parse(raw); } catch (e) { return; }
    }
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

  function p2pHostBroadcast(obj) {
    if (!p2pState.roomCode) return false;
    const topics = getRoomTopics(p2pState.roomCode);
    return publishMqtt(topics.bcast, obj);
  }

  function p2pHostReassignSlots() {
    const rm = p2pState.hostRoom;
    if (!rm || !Array.isArray(rm.players)) return;
    rm.players.forEach((p, idx) => { p.gridSlot = idx; });
  }

  function p2pHostSyncLocalRoom() {
    const snapRoom = cloneRoom(p2pState.hostRoom);
    netState.room = snapRoom;
    syncPeersFromRoom(netState.room);
    notifyListeners();
  }

  function p2pHostComputeStandings() {
    const rm = p2pState.hostRoom;
    if (!rm || !Array.isArray(rm.players)) return [];
    const list = rm.players.map(p => ({
      id: p.id,
      name: p.name,
      carClass: p.carClass,
      presetId: p.presetId,
      finished: !!p.finished,
      finishTime: p.finishTime || null,
      bestLap: p.bestLap || null,
      jumpPenaltySec: p.jumpPenaltySec || 0,
      _lap: p._lap || 1,
      _s: p._s || 0
    }));
    list.sort((a, b) => {
      if (a.finished && b.finished) return (a.finishTime || 0) - (b.finishTime || 0);
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      return (b._lap * 100000 + b._s) - (a._lap * 100000 + a._s);
    });
    return list.map(({ _lap, _s, ...pub }) => pub);
  }

  function p2pHostApplyIdentity(playerObj, msg) {
    if (!playerObj || !msg) return;
    if (msg.name !== undefined && String(msg.name).trim()) {
      playerObj.name = String(msg.name).trim().slice(0, 20);
    }
    if (msg.presetId) playerObj.presetId = String(msg.presetId);
    if (msg.carClass) playerObj.carClass = String(msg.carClass);
    if (msg.paintHex) playerObj.paintHex = String(msg.paintHex);
    if (msg.livery) playerObj.livery = String(msg.livery);
  }

  function p2pHostHandleControlMsg(msg) {
    if (!msg || !msg.type || !p2pState.isHost || !p2pState.hostRoom) return;
    const rm = p2pState.hostRoom;
    const senderId = String(msg.senderId || '').trim();
    if (!senderId || senderId === netState.playerId) return;
    p2pState.guestLastSeen.set(senderId, Date.now());

    if (msg.type === 'ping') {
      p2pHostBroadcast({ type: 'pong', to: senderId, clientMs: msg.clientMs || Date.now(), serverTimeMs: Date.now() });
      return;
    }

    if (msg.type === 'join_req' || msg.type === 'hello') {
      let existing = rm.players.find(p => p.id === senderId);
      if (!existing) {
        if (rm.players.length >= rm.maxPlayers) {
          p2pHostBroadcast({ type: 'error', to: senderId, message: '房間已滿 (最多 ' + rm.maxPlayers + ' 人)' });
          return;
        }
        if (rm.status === 'racing') {
          p2pHostBroadcast({ type: 'error', to: senderId, message: '該房間比賽已開始，請等待回到待機室後再加入' });
          return;
        }
        existing = {
          id: senderId,
          name: 'PLAYER-' + senderId.slice(-4).toUpperCase(),
          presetId: 'procedural',
          carClass: 'GT3',
          paintHex: '#38bdf8',
          livery: 'original',
          ready: false,
          isHost: false,
          gridSlot: rm.players.length,
          finished: false,
          finishTime: null,
          bestLap: null,
          jumpPenaltySec: 0,
          _lap: 1,
          _s: 0
        };
        rm.players.push(existing);
      }
      p2pHostApplyIdentity(existing, msg);
      p2pHostReassignSlots();
      p2pHostBroadcast({ type: 'welcome', to: senderId, playerId: senderId, serverTimeMs: Date.now() });
      p2pHostBroadcast({ type: 'room_state', room: cloneRoom(rm) });
      p2pHostSyncLocalRoom();
      return;
    }

    if (msg.type === 'update_player') {
      const pl = rm.players.find(p => p.id === senderId);
      if (!pl) return;
      p2pHostApplyIdentity(pl, msg);
      if (msg.ready !== undefined) pl.ready = !!msg.ready;
      p2pHostBroadcast({ type: 'room_state', room: cloneRoom(rm) });
      p2pHostSyncLocalRoom();
      return;
    }

    if (msg.type === 'leave_room') {
      const before = rm.players.length;
      rm.players = rm.players.filter(p => p.id !== senderId);
      p2pState.guestLastSeen.delete(senderId);
      if (rm.players.length !== before) {
        p2pHostReassignSlots();
        p2pHostBroadcast({ type: 'room_state', room: cloneRoom(rm) });
        p2pHostSyncLocalRoom();
      }
      return;
    }

    if (msg.type === 'finish') {
      const pl = rm.players.find(p => p.id === senderId);
      if (pl) {
        pl.finished = true;
        pl.finishTime = Number(msg.totalTime) || 0;
        pl.bestLap = Number(msg.bestLap) || pl.finishTime;
        pl.jumpPenaltySec = Number(msg.jumpPenaltySec) || 0;
      }
      if (rm.players.length > 0 && rm.players.every(p => p.finished)) {
        rm.status = 'finished';
      }
      const standings = p2pHostComputeStandings();
      const packet = { type: 'race_standings', standings, roomStatus: rm.status };
      handleIncomingServerMsg(packet);
      p2pHostBroadcast(packet);
    }
  }

  async function createP2PRoom(opts) {
    teardownP2P();
    netState.transport = 'p2p';
    netState.connecting = true;
    netState.connected = false;
    netState.p2pReady = true;
    netState.p2pConnectingMsg = '正在建立 6 碼房間…';
    netState.lastError = null;
    notifyListeners();

    let mqttLib;
    try {
      mqttLib = await ensureMqttLoaded();
    } catch (e) {
      netState.connecting = false;
      netState.p2pConnectingMsg = '';
      netState.lastError = '無法載入免伺服器連線模組，請檢查網路或切換至「本機 / 區網伺服器」模式。';
      notifyListeners();
      return false;
    }

    const code = generateRoomCode(6);
    const myId = 'P2P_H_' + generateRoomCode(6);
    const topics = getRoomTopics(code);
    const willOpts = {
      topic: topics.bcast,
      payload: JSON.stringify({ type: 'host_closed', hostId: myId }),
      qos: 0,
      retain: false
    };

    let client = null;
    let connectedBrokerIdx = 0;
    for (let i = 0; i < MQTT_BROKERS.length; i++) {
      try {
        client = await openMqttClient(mqttLib, i, myId, willOpts);
        connectedBrokerIdx = i;
        break;
      } catch (e) { /* try next broker */ }
    }

    if (!client) {
      netState.connecting = false;
      netState.p2pConnectingMsg = '';
      netState.lastError = '無法連至公開房間節點，請檢查網路連線或改用「本機 / 區網伺服器」模式。';
      notifyListeners();
      return false;
    }

    p2pState.client = client;
    p2pState.brokerIdx = connectedBrokerIdx;
    p2pState.roomCode = code;
    p2pState.isHost = true;

    const idPayload = getMyIdentityPayload();
    const o = opts || {};
    p2pState.hostRoom = {
      code,
      hostId: myId,
      carClass: o.carClass || idPayload.carClass || 'GT3',
      circuitIdx: Number(o.circuitIdx) || 0,
      edition: o.edition === 'arcade' ? 'arcade' : 'realistic',
      weather: o.weather === 'wet' ? 'wet' : 'dry',
      laps: Math.max(1, Number(o.laps) || 2),
      collisionMode: o.collisionMode === 'ghost' ? 'ghost' : 'soft',
      isPublic: false,
      maxPlayers: 8,
      status: 'lobby',
      raceStartServerMs: 0,
      players: [{
        id: myId,
        name: idPayload.name,
        presetId: idPayload.presetId,
        carClass: idPayload.carClass,
        paintHex: idPayload.paintHex,
        livery: idPayload.livery,
        ready: true,
        isHost: true,
        gridSlot: 0,
        finished: false,
        finishTime: null,
        bestLap: null,
        jumpPenaltySec: 0,
        _lap: 1,
        _s: 0
      }]
    };

    client.on('message', (topic, payloadBuf) => {
      if (p2pState.client !== client) return;
      const rawStr = (typeof payloadBuf === 'string') ? payloadBuf : payloadBuf.toString('utf8');
      let msg;
      try { msg = JSON.parse(rawStr); } catch (e) { return; }
      if (!msg || !msg.type) return;

      if (topic === topics.state) {
        if (msg.id === netState.playerId) return;
        if (p2pState.hostRoom) {
          const pl = p2pState.hostRoom.players.find(p => p.id === msg.id);
          if (pl) {
            pl._lap = Number(msg.lap) || 1;
            pl._s = Number(msg.s) || 0;
          }
        }
        handleIncomingServerMsg(msg);
      } else if (topic === topics.host) {
        p2pHostHandleControlMsg(msg);
      }
    });

    client.on('close', () => {
      if (p2pState.client !== client) return;
      const wasConnected = netState.connected;
      teardownP2P();
      netState.connected = false;
      netState.connecting = false;
      netState.room = null;
      netState.standings = [];
      clearAllPeerMeshes();
      if (wasConnected && !netState.lastError) {
        netState.lastError = '房間節點連線已中斷，請重新建立房間。';
      }
      notifyListeners();
    });

    try {
      await subscribeTopics(client, [topics.host, topics.state]);
    } catch (e) {
      teardownP2P();
      netState.connecting = false;
      netState.lastError = '訂閱房間頻道失敗，請重試。';
      notifyListeners();
      return false;
    }

    netState.connected = true;
    netState.connecting = false;
    netState.p2pConnectingMsg = '';
    netState.playerId = myId;
    netState.clockOffsetMs = 0;
    netState.rttMs = 0;
    netState.lastError = null;
    p2pHostSyncLocalRoom();
    return true;
  }

  async function tryJoinViaBroker(mqttLib, brokerIdx, cleanCode, myId, topics) {
    const willOpts = {
      topic: topics.host,
      payload: JSON.stringify({ type: 'leave_room', senderId: myId }),
      qos: 0,
      retain: false
    };
    const client = await openMqttClient(mqttLib, brokerIdx, myId, willOpts);
    p2pState.client = client;
    p2pState.brokerIdx = brokerIdx;
    p2pState.roomCode = cleanCode;
    p2pState.isHost = false;
    p2pState.joined = false;

    return new Promise((resolve) => {
      let settled = false;
      let retryTimer = null;
      let timeoutTimer = null;
      const cleanupTimers = () => {
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
        if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null; }
      };
      const done = (resObj) => {
        if (!settled) {
          settled = true;
          cleanupTimers();
          resolve(resObj);
        }
      };

      client.on('message', (topic, payloadBuf) => {
        if (p2pState.client !== client) return;
        const rawStr = (typeof payloadBuf === 'string') ? payloadBuf : payloadBuf.toString('utf8');
        let msg;
        try { msg = JSON.parse(rawStr); } catch (e) { return; }
        if (!msg || !msg.type) return;

        if (topic === topics.state) {
          if (msg.id === myId) return;
          handleIncomingServerMsg(msg);
          return;
        }
        if (topic === topics.bcast) {
          if (msg.to && msg.to !== myId) return;
          if (msg.type === 'host_closed') {
            teardownP2P();
            netState.connected = false;
            netState.connecting = false;
            netState.room = null;
            netState.standings = [];
            clearAllPeerMeshes();
            netState.lastError = '房主已關閉房間';
            notifyListeners();
            done({ ok: false, fatal: true, message: netState.lastError });
            return;
          }
          if (msg.type === 'error' && !p2pState.joined) {
            teardownP2P();
            netState.connected = false;
            netState.connecting = false;
            netState.lastError = msg.message || '加入房間失敗';
            notifyListeners();
            done({ ok: false, fatal: true, message: netState.lastError });
            return;
          }
          if ((msg.type === 'welcome' || msg.type === 'room_state') && !p2pState.joined) {
            p2pState.joined = true;
            netState.connected = true;
            netState.connecting = false;
            netState.p2pConnectingMsg = '';
            netState.playerId = myId;
            netState.lastError = null;
            publishMqtt(topics.host, { type: 'ping', senderId: myId, clientMs: Date.now() });
            if (netState.pingTimer) clearInterval(netState.pingTimer);
            netState.pingTimer = setInterval(() => {
              if (p2pState.client && p2pState.client.connected && p2pState.roomCode) {
                const tp = getRoomTopics(p2pState.roomCode);
                publishMqtt(tp.host, { type: 'ping', senderId: myId, clientMs: Date.now() });
              }
            }, 2500);
            handleIncomingServerMsg(msg);
            done({ ok: true });
            return;
          }
          handleIncomingServerMsg(msg);
        }
      });

      client.on('close', () => {
        if (p2pState.client !== client) return;
        const wasJoined = p2pState.joined;
        teardownP2P();
        netState.connected = false;
        netState.connecting = false;
        netState.room = null;
        netState.standings = [];
        clearAllPeerMeshes();
        if (wasJoined && !netState.lastError) {
          netState.lastError = '與房間節點的連線已中斷';
        }
        notifyListeners();
        done({ ok: false, fatal: false, message: '連線中斷' });
      });

      subscribeTopics(client, [topics.bcast, topics.state]).then(() => {
        if (p2pState.client !== client || settled) return;
        const sendJoin = () => {
          if (p2pState.client !== client || p2pState.joined) return;
          const idPayload = getMyIdentityPayload();
          publishMqtt(topics.host, Object.assign({ type: 'join_req', senderId: myId }, idPayload));
        };
        sendJoin();
        retryTimer = setTimeout(sendJoin, 1500);
        timeoutTimer = setTimeout(() => {
          if (!settled) {
            teardownP2P();
            done({ ok: false, fatal: false, message: 'timeout' });
          }
        }, 4800);
      }).catch(() => {
        teardownP2P();
        done({ ok: false, fatal: false, message: 'subscribe failed' });
      });
    });
  }

  async function joinP2PRoom(code) {
    const cleanCode = sanitizeRoomCode(code);
    if (cleanCode.length < 4) {
      netState.lastError = '請輸入完整的 6 碼房間代碼';
      notifyListeners();
      return false;
    }

    teardownP2P();
    netState.transport = 'p2p';
    netState.connecting = true;
    netState.connected = false;
    netState.p2pReady = true;
    netState.p2pConnectingMsg = `正在連線至房號 #${cleanCode}…`;
    netState.lastError = null;
    notifyListeners();

    let mqttLib;
    try {
      mqttLib = await ensureMqttLoaded();
    } catch (e) {
      netState.connecting = false;
      netState.p2pConnectingMsg = '';
      netState.lastError = '無法載入免伺服器連線模組，請檢查網路或切換至「本機 / 區網伺服器」模式。';
      notifyListeners();
      return false;
    }

    const myId = 'P2P_G_' + generateRoomCode(8);
    const topics = getRoomTopics(cleanCode);

    for (let i = 0; i < MQTT_BROKERS.length; i++) {
      try {
        const res = await tryJoinViaBroker(mqttLib, i, cleanCode, myId, topics);
        if (res.ok) return true;
        if (res.fatal) return false;
      } catch (e) { /* try next broker */ }
    }

    teardownP2P();
    netState.connecting = false;
    netState.connected = false;
    netState.lastError = `找不到房號 #${cleanCode} 或房主已離開，請確認 6 碼代碼無誤且房主仍在房間內。`;
    notifyListeners();
    return false;
  }

  function sendPing() {
    if (netState.transport === 'p2p') {
      if (p2pState.client && p2pState.client.connected && !p2pState.isHost && p2pState.roomCode) {
        const topics = getRoomTopics(p2pState.roomCode);
        publishMqtt(topics.host, { type: 'ping', senderId: netState.playerId, clientMs: Date.now() });
      }
      return;
    }
    sendJson({ type: 'ping', clientMs: Date.now() });
  }

  async function connect(customUrl) {
    netState.transport = 'ws';
    const pageProtocol = (typeof window !== 'undefined' && window.location && window.location.protocol)
      ? window.location.protocol
      : 'http:';
    const hasCustom = typeof customUrl === 'string' ? !!customUrl.trim() : !!customUrl;
    if (hasCustom) {
      netState.serverUrl = normalizeWsUrl(customUrl, pageProtocol);
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

    const check = validateWsUrlForPage(targetUrl, pageProtocol);
    if (!check.ok) {
      netState.connecting = false;
      netState.connected = false;
      netState.lastError = check.message;
      notifyListeners();
      return false;
    }
    const finalUrl = check.url;
    netState.serverUrl = finalUrl;
    if (hasCustom && typeof localStorage !== 'undefined') {
      try { localStorage.setItem(STORAGE_URL_KEY, finalUrl); } catch (e) {}
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
        ws = new WebSocket(finalUrl);
      } catch (e) {
        netState.connecting = false;
        if (e && e.name === 'SecurityError') {
          netState.lastError = `HTTPS 安全網頁禁止連線至未加密的遠端 ws:// 位址（${finalUrl}）。請改用「🌐 代碼直連（免伺服器）」或填入支援 wss:// 的通道位址。`;
        } else {
          netState.lastError = 'WebSocket 位址格式無效：' + finalUrl;
        }
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
        handleIncomingServerMsg(ev.data);
      };

      ws.onerror = () => {
        if (!netState.connected) {
          if (netState.isStaticHost) {
            netState.lastError = `無法連線至多人伺服器 (${finalUrl})。GitHub Pages 為靜態網頁，未內建伺服器；建議直接切換「🌐 代碼直連（免伺服器）」，或於本機執行 launch_apex_lan_host.bat。`;
          } else {
            netState.lastError = `無法連線至多人伺服器 (${finalUrl})，請確認伺服器已啟動`;
          }
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
    teardownP2P();
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
    if (netState.transport === 'p2p') {
      return createP2PRoom(opts);
    }
    const id = ensureIdentitySent();
    return sendJson(Object.assign({ type: 'quick_match' }, id, opts || {}));
  }

  function createRoom(opts) {
    if (netState.transport === 'p2p') {
      return createP2PRoom(opts);
    }
    const id = ensureIdentitySent();
    return sendJson(Object.assign({ type: 'create_room' }, id, opts || {}));
  }

  function joinRoom(code) {
    if (netState.transport === 'p2p') {
      return joinP2PRoom(code);
    }
    const id = ensureIdentitySent();
    return sendJson(Object.assign({ type: 'join_room', code: String(code || '').trim().toUpperCase() }, id));
  }

  function refreshRoomList() {
    if (netState.transport === 'p2p') return false;
    return sendJson({ type: 'list_rooms' });
  }

  function updateRoom(patch) {
    if (netState.transport === 'p2p' && p2pState.isHost && p2pState.hostRoom) {
      const rm = p2pState.hostRoom;
      const p = patch || {};
      if (p.circuitIdx !== undefined) rm.circuitIdx = Number(p.circuitIdx) || 0;
      if (p.carClass) rm.carClass = String(p.carClass);
      if (p.edition) rm.edition = (p.edition === 'arcade') ? 'arcade' : 'realistic';
      if (p.weather) rm.weather = (p.weather === 'wet') ? 'wet' : 'dry';
      if (p.laps !== undefined) rm.laps = Math.max(1, Number(p.laps) || 2);
      if (p.collisionMode) rm.collisionMode = (p.collisionMode === 'ghost') ? 'ghost' : 'soft';
      p2pHostBroadcast({ type: 'room_state', room: cloneRoom(rm) });
      p2pHostSyncLocalRoom();
      return true;
    }
    return sendJson(Object.assign({ type: 'update_room' }, patch || {}));
  }

  function updateMyPlayer(patch) {
    const id = ensureIdentitySent();
    if (netState.transport === 'p2p') {
      if (p2pState.isHost && p2pState.hostRoom) {
        const me = p2pState.hostRoom.players.find(pl => pl.id === netState.playerId);
        if (me) {
          p2pHostApplyIdentity(me, id);
          if (patch && patch.ready !== undefined) me.ready = !!patch.ready;
          p2pHostBroadcast({ type: 'room_state', room: cloneRoom(p2pState.hostRoom) });
          p2pHostSyncLocalRoom();
        }
        return true;
      }
      if (p2pState.roomCode) {
        const topics = getRoomTopics(p2pState.roomCode);
        return publishMqtt(topics.host, Object.assign({ type: 'update_player', senderId: netState.playerId }, id, patch || {}));
      }
      return false;
    }
    return sendJson(Object.assign({ type: 'update_player' }, id, patch || {}));
  }

  function sendIdentityUpdate() {
    const id = ensureIdentitySent();
    if (netState.transport === 'p2p') {
      updateMyPlayer({});
      notifyListeners('state');
      return;
    }
    sendJson(Object.assign({ type: 'hello' }, id));
    if (netState.room) {
      sendJson(Object.assign({ type: 'update_player' }, id));
    }
    notifyListeners('state');
  }

  function leaveRoom() {
    clearAllPeerMeshes();
    if (netState.transport === 'p2p') {
      if (p2pState.client && p2pState.client.connected && p2pState.roomCode) {
        const topics = getRoomTopics(p2pState.roomCode);
        if (p2pState.isHost) {
          publishMqtt(topics.bcast, { type: 'host_closed', hostId: netState.playerId });
        } else {
          publishMqtt(topics.host, { type: 'leave_room', senderId: netState.playerId });
        }
      }
      teardownP2P(60);
      netState.connected = false;
      netState.connecting = false;
      netState.room = null;
      netState.standings = [];
      netState.lastError = null;
      notifyListeners();
      return true;
    }
    return sendJson({ type: 'leave_room' });
  }

  function startRace() {
    if (netState.transport === 'p2p') {
      if (!p2pState.isHost || !p2pState.hostRoom) return false;
      const rm = p2pState.hostRoom;
      rm.status = 'racing';
      rm.raceStartServerMs = Date.now() + 2600;
      rm.players.forEach((p, idx) => {
        p.gridSlot = idx;
        p.finished = false;
        p.finishTime = null;
        p.bestLap = null;
        p.jumpPenaltySec = 0;
        p._lap = 1;
        p._s = 0;
      });
      p2pHostBroadcast({ type: 'race_start', room: cloneRoom(rm) });
      handleIncomingServerMsg({ type: 'race_start', room: cloneRoom(rm) });
      return true;
    }
    return sendJson({ type: 'start_race' });
  }

  function returnToLobby() {
    if (netState.transport === 'p2p') {
      if (!p2pState.isHost || !p2pState.hostRoom) return false;
      const rm = p2pState.hostRoom;
      rm.status = 'lobby';
      rm.raceStartServerMs = 0;
      rm.players.forEach(p => {
        p.ready = !!p.isHost;
        p.finished = false;
        p.finishTime = null;
      });
      p2pHostBroadcast({ type: 'room_state', room: cloneRoom(rm) });
      p2pHostSyncLocalRoom();
      return true;
    }
    return sendJson({ type: 'return_lobby' });
  }

  function reportFinish(totalTime, bestLap, jumpPenaltySec) {
    const payload = {
      type: 'finish',
      totalTime: Number(totalTime) || 0,
      bestLap: Number(bestLap) || Number(totalTime) || 0,
      jumpPenaltySec: Number(jumpPenaltySec) || 0
    };
    if (netState.transport === 'p2p') {
      if (p2pState.isHost && p2pState.hostRoom) {
        const rm = p2pState.hostRoom;
        const me = rm.players.find(p => p.id === netState.playerId);
        if (me) {
          me.finished = true;
          me.finishTime = payload.totalTime;
          me.bestLap = payload.bestLap;
          me.jumpPenaltySec = payload.jumpPenaltySec;
        }
        if (rm.players.length > 0 && rm.players.every(p => p.finished)) {
          rm.status = 'finished';
        }
        const standings = p2pHostComputeStandings();
        const pkt = { type: 'race_standings', standings, roomStatus: rm.status };
        handleIncomingServerMsg(pkt);
        p2pHostBroadcast(pkt);
        return true;
      }
      if (p2pState.roomCode) {
        const topics = getRoomTopics(p2pState.roomCode);
        return publishMqtt(topics.host, Object.assign({ senderId: netState.playerId }, payload));
      }
      return false;
    }
    return sendJson(payload);
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
      const statePkt = {
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
      };
      if (netState.transport === 'p2p') {
        if (p2pState.isHost && p2pState.hostRoom) {
          const me = p2pState.hostRoom.players.find(p => p.id === netState.playerId);
          if (me) { me._lap = simState.lap; me._s = simState.s; }
        }
        if (p2pState.roomCode) {
          const topics = getRoomTopics(p2pState.roomCode);
          publishMqtt(topics.state, Object.assign({
            type: 'peer_state',
            id: netState.playerId,
            srvMs: getServerNowMs()
          }, statePkt));
        }
      } else {
        sendJson(Object.assign({ type: 'state' }, statePkt));
      }
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
      transport: netState.transport,
      p2pReady: netState.p2pReady,
      p2pConnectingMsg: netState.p2pConnectingMsg,
      isP2PHost: !!(netState.transport === 'p2p' && p2pState.isHost),
      connected: netState.connected,
      connecting: netState.connecting,
      serverUrl: netState.serverUrl,
      autoDiscoveredUrl: netState.autoDiscoveredUrl,
      isStaticHost: netState.isStaticHost,
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
    autoSelectTransport,
    setTransport,
    parseInviteRoomFromSearch,
    generateRoomCode,
    sanitizeRoomCode,
    resolveDefaultWsUrl,
    normalizeWsUrl,
    validateWsUrlForPage,
    computeDefaultWsUrl,
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
