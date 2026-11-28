#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
APEX PRO RACING // Zero-Dependency Local & LAN Multiplayer WebSocket Server
- Pure Python 3.12 stdlib asyncio RFC 6455 WebSocket server (no external pip dependencies)
- Supports BOTH Quick Match (class + edition auto-pairing) and 6-char Private Room Codes + Public Lobby List
- Relays 20 Hz (s, d, heading, speed) telemetry snapshots & server-synced 5-red-light gantry timestamps
"""

import asyncio
import base64
import hashlib
import json
import secrets
import socket
import struct
import sys
import threading
import time
from typing import Dict, List, Optional, Tuple

WS_MAGIC_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
MAX_ROOM_PLAYERS = 8
MAX_WS_PAYLOAD = 262144


def now_ms() -> int:
    return int(time.time() * 1000)


def get_lan_ips() -> List[str]:
    ips = set()
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip and not ip.startswith("127."):
                ips.add(ip)
    except OSError:
        pass
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            if ip and not ip.startswith("127."):
                ips.add(ip)
    except OSError:
        pass
    if not ips:
        ips.add("127.0.0.1")
    return sorted(ips)


class ClientSession:
    def __init__(self, player_id: str, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        self.player_id = player_id
        self.reader = reader
        self.writer = writer
        self.send_lock = asyncio.Lock()
        self.name = f"DRIVER-{player_id[-4:]}"
        self.preset_id = "procedural"
        self.car_class = "GT3"
        self.paint_hex = "#ef4444"
        self.livery = "original"
        self.ready = False
        self.room_code: Optional[str] = None
        self.grid_slot = 0
        self.lap = 1
        self.s = 0.0
        self.progress = 0.0
        self.finished = False
        self.finish_time = None
        self.best_lap = None
        self.jump_penalty = 0.0
        self.closed = False

    def to_public_dict(self, host_id: str) -> dict:
        return {
            "id": self.player_id,
            "name": self.name,
            "presetId": self.preset_id,
            "carClass": self.car_class,
            "paintHex": self.paint_hex,
            "livery": self.livery,
            "ready": self.ready,
            "isHost": self.player_id == host_id,
            "gridSlot": self.grid_slot,
            "finished": self.finished,
            "finishTime": self.finish_time,
            "bestLap": self.best_lap,
            "jumpPenaltySec": self.jump_penalty,
        }


class RaceRoom:
    def __init__(self, code: str, host_id: str, opts: dict):
        self.code = code
        self.host_id = host_id
        self.is_public = bool(opts.get("isPublic", True))
        self.circuit_idx = int(opts.get("circuitIdx", 0) or 0)
        self.car_class = str(opts.get("carClass", "GT3") or "GT3")
        self.edition = str(opts.get("edition", "realistic") or "realistic")
        self.weather = "wet" if opts.get("weather") == "wet" else "dry"
        self.laps = max(1, min(10, int(opts.get("laps", 2) or 2)))
        self.collision_mode = "ghost" if opts.get("collisionMode") == "ghost" else "soft"
        self.status = "lobby"  # 'lobby' | 'racing' | 'finished'
        self.race_start_ms = 0
        self.created_at_ms = now_ms()
        self.players: Dict[str, ClientSession] = {}

    def to_state_dict(self) -> dict:
        ordered = list(self.players.values())
        return {
            "code": self.code,
            "hostId": self.host_id,
            "isPublic": self.is_public,
            "circuitIdx": self.circuit_idx,
            "carClass": self.car_class,
            "edition": self.edition,
            "weather": self.weather,
            "laps": self.laps,
            "collisionMode": self.collision_mode,
            "status": self.status,
            "raceStartServerMs": self.race_start_ms,
            "serverTimeMs": now_ms(),
            "maxPlayers": MAX_ROOM_PLAYERS,
            "players": [p.to_public_dict(self.host_id) for p in ordered],
        }

    def to_summary_dict(self) -> dict:
        host = self.players.get(self.host_id)
        return {
            "code": self.code,
            "hostName": host.name if host else "HOST",
            "circuitIdx": self.circuit_idx,
            "carClass": self.car_class,
            "edition": self.edition,
            "weather": self.weather,
            "laps": self.laps,
            "collisionMode": self.collision_mode,
            "playerCount": len(self.players),
            "maxPlayers": MAX_ROOM_PLAYERS,
            "status": self.status,
        }


class ApexMultiplayerServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 8766):
        self.host = host
        self.port = port
        self.server: Optional[asyncio.AbstractServer] = None
        self.clients: Dict[str, ClientSession] = {}
        self.rooms: Dict[str, RaceRoom] = {}
        self._seq = 0

    def _next_player_id(self) -> str:
        self._seq += 1
        return f"P{self._seq:04d}_{secrets.token_hex(2).upper()}"

    def _gen_room_code(self) -> str:
        for _ in range(64):
            code = "".join(secrets.choice(ROOM_CODE_ALPHABET) for _ in range(6))
            if code not in self.rooms:
                return code
        return f"R{secrets.token_hex(3).upper()}"[:6]

    async def _send_ws_frame(self, client: ClientSession, opcode: int, payload: bytes) -> None:
        if client.closed or client.writer.is_closing():
            return
        n = len(payload)
        if n < 126:
            header = struct.pack("!BB", 0x80 | opcode, n)
        elif n < 65536:
            header = struct.pack("!BBH", 0x80 | opcode, 126, n)
        else:
            header = struct.pack("!BBQ", 0x80 | opcode, 127, n)
        try:
            async with client.send_lock:
                if client.closed or client.writer.is_closing():
                    return
                client.writer.write(header + payload)
                await client.writer.drain()
        except (OSError, ConnectionError, asyncio.CancelledError):
            client.closed = True

    async def send_json(self, client: ClientSession, msg: dict) -> None:
        raw = json.dumps(msg, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        await self._send_ws_frame(client, 0x1, raw)

    async def broadcast_room(self, room: RaceRoom, msg: dict, exclude_id: Optional[str] = None) -> None:
        raw = json.dumps(msg, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        tasks = [
            self._send_ws_frame(peer, 0x1, raw)
            for pid, peer in list(room.players.items())
            if pid != exclude_id and not peer.closed
        ]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def broadcast_room_state(self, room: RaceRoom) -> None:
        await self.broadcast_room(room, {"type": "room_state", "room": room.to_state_dict()})

    def _standings_snapshot(self, room: RaceRoom) -> List[dict]:
        def sort_key(p: ClientSession):
            if p.finished and p.finish_time is not None:
                return (0, float(p.finish_time))
            return (1, -float(p.progress))

        ranked = sorted(room.players.values(), key=sort_key)
        return [
            {
                "id": p.player_id,
                "name": p.name,
                "presetId": p.preset_id,
                "finished": p.finished,
                "finishTime": p.finish_time,
                "bestLap": p.best_lap,
                "jumpPenaltySec": p.jump_penalty,
                "progress": round(p.progress, 2),
                "rank": idx + 1,
            }
            for idx, p in enumerate(ranked)
        ]

    async def _leave_current_room(self, client: ClientSession) -> None:
        code = client.room_code
        if not code:
            return
        client.room_code = None
        client.ready = False
        room = self.rooms.get(code)
        if not room:
            return
        room.players.pop(client.player_id, None)
        if not room.players:
            self.rooms.pop(code, None)
            return
        if room.host_id == client.player_id:
            room.host_id = next(iter(room.players.keys()))
        await self.broadcast_room_state(room)

    async def _attach_to_room(self, client: ClientSession, room: RaceRoom) -> None:
        await self._leave_current_room(client)
        client.room_code = room.code
        client.ready = (room.host_id == client.player_id)
        client.finished = False
        client.finish_time = None
        client.best_lap = None
        client.jump_penalty = 0.0
        room.players[client.player_id] = client
        await self.broadcast_room_state(room)

    def _apply_identity_fields(self, client: ClientSession, data: dict) -> None:
        if data.get("name") is not None and str(data["name"]).strip():
            client.name = str(data["name"]).strip()[:20]
        if data.get("presetId"):
            client.preset_id = str(data["presetId"])[:40]
        if data.get("carClass"):
            client.car_class = str(data["carClass"])[:12]
        if data.get("paintHex"):
            client.paint_hex = str(data["paintHex"])[:16]
        if data.get("livery") in ("original", "team"):
            client.livery = str(data["livery"])

    async def _handle_message(self, client: ClientSession, data: dict) -> None:
        mtype = data.get("type")

        if mtype == "ping":
            await self.send_json(client, {
                "type": "pong",
                "clientMs": data.get("clientMs", 0),
                "serverTimeMs": now_ms(),
            })
            return

        if mtype == "hello":
            self._apply_identity_fields(client, data)
            await self.send_json(client, {
                "type": "welcome",
                "playerId": client.player_id,
                "serverTimeMs": now_ms(),
            })
            if client.room_code and client.room_code in self.rooms:
                await self.broadcast_room_state(self.rooms[client.room_code])
            return

        if mtype == "list_rooms":
            rooms = [
                r.to_summary_dict()
                for r in self.rooms.values()
                if r.is_public and r.status == "lobby" and len(r.players) < MAX_ROOM_PLAYERS
            ]
            rooms.sort(key=lambda r: (-r["playerCount"], r["code"]))
            await self.send_json(client, {"type": "room_list", "rooms": rooms})
            return

        if mtype == "create_room":
            self._apply_identity_fields(client, data)
            code = self._gen_room_code()
            room = RaceRoom(code, client.player_id, data)
            self.rooms[code] = room
            await self._attach_to_room(client, room)
            return

        if mtype == "join_room":
            code = str(data.get("code", "")).strip().upper()
            room = self.rooms.get(code)
            if not room:
                await self.send_json(client, {
                    "type": "error",
                    "code": "ROOM_NOT_FOUND",
                    "message": f"找不到代碼為 {code or '----'} 的房間",
                })
                return
            if room.status == "racing":
                await self.send_json(client, {
                    "type": "error",
                    "code": "RACE_IN_PROGRESS",
                    "message": f"房間 {code} 目前正在比賽中，請稍候再加入",
                })
                return
            if len(room.players) >= MAX_ROOM_PLAYERS:
                await self.send_json(client, {
                    "type": "error",
                    "code": "ROOM_FULL",
                    "message": f"房間 {code} 已滿 ({MAX_ROOM_PLAYERS} 人)",
                })
                return
            self._apply_identity_fields(client, data)
            await self._attach_to_room(client, room)
            return

        if mtype == "quick_match":
            self._apply_identity_fields(client, data)
            want_cls = str(data.get("carClass") or client.car_class or "GT3")
            want_ed = str(data.get("edition") or "realistic")
            candidates = [
                r for r in self.rooms.values()
                if r.is_public
                and r.status == "lobby"
                and len(r.players) < MAX_ROOM_PLAYERS
                and r.car_class == want_cls
                and r.edition == want_ed
            ]
            candidates.sort(key=lambda r: (-len(r.players), r.created_at_ms))
            if candidates:
                await self._attach_to_room(client, candidates[0])
            else:
                code = self._gen_room_code()
                room_opts = dict(data)
                room_opts["isPublic"] = True
                room_opts["carClass"] = want_cls
                room_opts["edition"] = want_ed
                room = RaceRoom(code, client.player_id, room_opts)
                self.rooms[code] = room
                await self._attach_to_room(client, room)
            return

        if mtype == "leave_room":
            await self._leave_current_room(client)
            await self.send_json(client, {"type": "room_state", "room": None})
            return

        room = self.rooms.get(client.room_code) if client.room_code else None
        if not room:
            return

        if mtype == "update_player":
            self._apply_identity_fields(client, data)
            if "ready" in data:
                client.ready = bool(data["ready"])
            await self.broadcast_room_state(room)
            return

        if mtype == "update_room":
            if room.host_id != client.player_id:
                await self.send_json(client, {"type": "error", "code": "NOT_HOST", "message": "只有房主可以變更比賽設定"})
                return
            changed_core = False
            if "circuitIdx" in data:
                v = int(data["circuitIdx"] or 0)
                if v != room.circuit_idx:
                    room.circuit_idx = v
                    changed_core = True
            if "carClass" in data:
                v = str(data["carClass"] or "GT3")
                if v != room.car_class:
                    room.car_class = v
                    changed_core = True
            if "edition" in data:
                room.edition = str(data["edition"] or "realistic")
            if "weather" in data:
                room.weather = "wet" if data["weather"] == "wet" else "dry"
            if "laps" in data:
                room.laps = max(1, min(10, int(data["laps"] or 2)))
            if "collisionMode" in data:
                room.collision_mode = "ghost" if data["collisionMode"] == "ghost" else "soft"
            if "isPublic" in data:
                room.is_public = bool(data["isPublic"])
            if changed_core:
                for pid, p in room.players.items():
                    p.ready = (pid == room.host_id)
            await self.broadcast_room_state(room)
            return

        if mtype == "start_race":
            if room.host_id != client.player_id:
                await self.send_json(client, {"type": "error", "code": "NOT_HOST", "message": "只有房主可以按下開賽"})
                return
            room.status = "racing"
            room.race_start_ms = now_ms() + 4200
            for idx, p in enumerate(room.players.values()):
                p.grid_slot = idx
                p.lap = 1
                p.s = 0.0
                p.progress = 0.0
                p.finished = False
                p.finish_time = None
                p.best_lap = None
                p.jump_penalty = 0.0
            await self.broadcast_room(room, {"type": "race_start", "room": room.to_state_dict()})
            return

        if mtype == "return_lobby":
            if room.host_id != client.player_id:
                return
            room.status = "lobby"
            room.race_start_ms = 0
            for pid, p in room.players.items():
                p.ready = (pid == room.host_id)
                p.finished = False
                p.finish_time = None
                p.best_lap = None
                p.jump_penalty = 0.0
            await self.broadcast_room_state(room)
            return

        if mtype == "state":
            s_val = float(data.get("s", 0.0) or 0.0)
            lap_val = int(data.get("lap", 1) or 1)
            trk_len = float(data.get("trkLen", 5000.0) or 5000.0)
            client.s = s_val
            client.lap = lap_val
            client.progress = (lap_val - 1) * trk_len + s_val
            relay = {
                "type": "peer_state",
                "id": client.player_id,
                "srvMs": now_ms(),
                "s": s_val,
                "d": float(data.get("d", 0.0) or 0.0),
                "h": float(data.get("h", 0.0) or 0.0),
                "v": float(data.get("v", 0.0) or 0.0),
                "yr": float(data.get("yr", 0.0) or 0.0),
                "st": float(data.get("st", 0.0) or 0.0),
                "brk": float(data.get("brk", 0.0) or 0.0),
                "thr": float(data.get("thr", 0.0) or 0.0),
                "gear": int(data.get("gear", 1) or 1),
                "lap": lap_val,
            }
            await self.broadcast_room(room, relay, exclude_id=client.player_id)
            return

        if mtype == "finish":
            client.finished = True
            client.finish_time = float(data.get("totalTime", 0.0) or 0.0)
            client.best_lap = float(data.get("bestLap", client.finish_time) or client.finish_time)
            client.jump_penalty = float(data.get("jumpPenaltySec", 0.0) or 0.0)
            if all(p.finished for p in room.players.values()):
                room.status = "finished"
            await self.broadcast_room(room, {
                "type": "race_standings",
                "roomStatus": room.status,
                "standings": self._standings_snapshot(room),
            })
            return

    async def _read_ws_frame(self, reader: asyncio.StreamReader) -> Tuple[Optional[int], bytes]:
        hdr = await reader.readexactly(2)
        b1, b2 = hdr[0], hdr[1]
        opcode = b1 & 0x0F
        masked = (b2 & 0x80) != 0
        length = b2 & 0x7F
        if length == 126:
            length = struct.unpack("!H", await reader.readexactly(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", await reader.readexactly(8))[0]
        if length > MAX_WS_PAYLOAD:
            raise ValueError(f"Frame payload too large: {length}")
        mask_key = await reader.readexactly(4) if masked else None
        raw = await reader.readexactly(length) if length > 0 else b""
        if masked and mask_key:
            raw = bytes(b ^ mask_key[i & 3] for i, b in enumerate(raw))
        fin = (b1 & 0x80) != 0
        if not fin and opcode != 0x8:
            # Read continuation frames until FIN
            chunks = [raw]
            while True:
                chdr = await reader.readexactly(2)
                cb1, cb2 = chdr[0], chdr[1]
                cmasked = (cb2 & 0x80) != 0
                clen = cb2 & 0x7F
                if clen == 126:
                    clen = struct.unpack("!H", await reader.readexactly(2))[0]
                elif clen == 127:
                    clen = struct.unpack("!Q", await reader.readexactly(8))[0]
                cmask = await reader.readexactly(4) if cmasked else None
                craw = await reader.readexactly(clen) if clen > 0 else b""
                if cmasked and cmask:
                    craw = bytes(b ^ cmask[i & 3] for i, b in enumerate(craw))
                chunks.append(craw)
                if (cb1 & 0x80) != 0:
                    break
            raw = b"".join(chunks)
        return opcode, raw

    async def handle_connection(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        client: Optional[ClientSession] = None
        try:
            raw_hdr = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), timeout=10.0)
        except Exception:
            writer.close()
            return

        header_text = raw_hdr.decode("utf-8", errors="replace")
        lines = header_text.split("\r\n")
        req_line = lines[0] if lines else ""
        headers = {}
        for line in lines[1:]:
            if ":" in line:
                k, v = line.split(":", 1)
                headers[k.strip().lower()] = v.strip()

        ws_key = headers.get("sec-websocket-key")
        if not ws_key:
            body = json.dumps({
                "service": "APEX PRO RACING Multiplayer WebSocket",
                "rooms": len(self.rooms),
                "clients": len(self.clients),
                "serverTimeMs": now_ms(),
            }).encode("utf-8")
            resp = (
                "HTTP/1.1 200 OK\r\n"
                "Content-Type: application/json; charset=utf-8\r\n"
                "Access-Control-Allow-Origin: *\r\n"
                f"Content-Length: {len(body)}\r\n"
                "Connection: close\r\n\r\n"
            ).encode("ascii") + body
            try:
                writer.write(resp)
                await writer.drain()
            except OSError:
                pass
            writer.close()
            return

        accept_val = base64.b64encode(
            hashlib.sha1((ws_key + WS_MAGIC_GUID).encode("ascii")).digest()
        ).decode("ascii")
        handshake = (
            "HTTP/1.1 101 Switching Protocols\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Accept: {accept_val}\r\n\r\n"
        ).encode("ascii")
        writer.write(handshake)
        await writer.drain()

        pid = self._next_player_id()
        client = ClientSession(pid, reader, writer)
        self.clients[pid] = client

        try:
            await self.send_json(client, {
                "type": "welcome",
                "playerId": pid,
                "serverTimeMs": now_ms(),
            })
            while not client.closed:
                opcode, payload = await self._read_ws_frame(reader)
                if opcode == 0x8:  # Close
                    await self._send_ws_frame(client, 0x8, b"")
                    break
                if opcode == 0x9:  # Ping
                    await self._send_ws_frame(client, 0xA, payload)
                    continue
                if opcode == 0xA:  # Pong
                    continue
                if opcode == 0x1:  # Text
                    try:
                        data = json.loads(payload.decode("utf-8"))
                    except (UnicodeDecodeError, json.JSONDecodeError):
                        continue
                    if isinstance(data, dict):
                        await self._handle_message(client, data)
        except (asyncio.IncompleteReadError, ConnectionError, OSError, ValueError, asyncio.CancelledError):
            pass
        finally:
            if client:
                client.closed = True
                self.clients.pop(client.player_id, None)
                await self._leave_current_room(client)
            try:
                writer.close()
            except Exception:
                pass

    async def start(self) -> int:
        self.server = await asyncio.start_server(self.handle_connection, self.host, self.port)
        sock = self.server.sockets[0]
        self.port = sock.getsockname()[1]
        return self.port

    async def close(self) -> None:
        if self.server:
            self.server.close()
            await self.server.wait_closed()


class MpServerThreadController:
    def __init__(self, loop: asyncio.AbstractEventLoop, mp_srv: ApexMultiplayerServer, thread: threading.Thread):
        self.loop = loop
        self.mp_srv = mp_srv
        self.thread = thread

    def stop(self) -> None:
        if self.loop.is_running():
            fut = asyncio.run_coroutine_threadsafe(self.mp_srv.close(), self.loop)
            try:
                fut.result(timeout=2.0)
            except Exception:
                pass
            self.loop.call_soon_threadsafe(self.loop.stop)
        self.thread.join(timeout=2.0)


def start_mp_server_in_thread(host: str = "0.0.0.0", preferred_port: int = 8766) -> Tuple[MpServerThreadController, int]:
    chosen_port = 0
    for candidate in (preferred_port, preferred_port + 1, preferred_port + 2, 0):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((host, candidate))
                chosen_port = s.getsockname()[1]
                break
            except OSError:
                continue

    ready_ev = threading.Event()
    result_box = {"port": chosen_port, "err": None, "loop": None, "srv": None}

    def runner():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        srv = ApexMultiplayerServer(host=host, port=chosen_port)
        result_box["loop"] = loop
        result_box["srv"] = srv
        try:
            actual_port = loop.run_until_complete(srv.start())
            result_box["port"] = actual_port
        except Exception as e:
            result_box["err"] = e
            ready_ev.set()
            return
        ready_ev.set()
        try:
            loop.run_forever()
        finally:
            pending = asyncio.all_tasks(loop)
            for t in pending:
                t.cancel()
            try:
                loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
            except Exception:
                pass
            loop.close()

    t = threading.Thread(target=runner, daemon=True)
    t.start()
    ready_ev.wait(timeout=5.0)
    if result_box["err"]:
        raise result_box["err"]
    ctrl = MpServerThreadController(result_box["loop"], result_box["srv"], t)
    return ctrl, result_box["port"]


async def _run_self_check() -> None:
    srv = ApexMultiplayerServer(host="127.0.0.1", port=0)
    port = await srv.start()
    try:
        reader, writer = await asyncio.open_connection("127.0.0.1", port)
        key = base64.b64encode(secrets.token_bytes(16)).decode("ascii")
        req = (
            f"GET / HTTP/1.1\r\n"
            f"Host: 127.0.0.1:{port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        ).encode("ascii")
        writer.write(req)
        await writer.drain()
        raw_resp = await reader.readuntil(b"\r\n\r\n")
        assert b"101 Switching Protocols" in raw_resp
        # Read welcome frame (server frames are unmasked)
        hdr = await reader.readexactly(2)
        assert (hdr[0] & 0x0F) == 0x1
        plen = hdr[1] & 0x7F
        welcome = json.loads((await reader.readexactly(plen)).decode("utf-8"))
        assert welcome["type"] == "welcome" and welcome["playerId"].startswith("P")
        writer.close()
        print(f"APEX MP SERVER SELF-CHECK OK (port={port}, playerId={welcome['playerId']})")
    finally:
        await srv.close()


def main():
    if "--check" in sys.argv:
        asyncio.run(_run_self_check())
        return
    host = "0.0.0.0"
    port = 8766
    for i, a in enumerate(sys.argv):
        if a == "--host" and i + 1 < len(sys.argv):
            host = sys.argv[i + 1]
        elif a == "--port" and i + 1 < len(sys.argv):
            port = int(sys.argv[i + 1])

    async def serve_forever():
        srv = ApexMultiplayerServer(host=host, port=port)
        actual = await srv.start()
        print("=" * 64)
        print("  APEX PRO RACING // MULTIPLAYER WEBSOCKET SERVER")
        for ip in get_lan_ips():
            print(f"  WS Endpoint : ws://{ip}:{actual}")
        print("=" * 64)
        try:
            async with srv.server:
                await srv.server.serve_forever()
        except asyncio.CancelledError:
            pass

    try:
        asyncio.run(serve_forever())
    except KeyboardInterrupt:
        print("\n[APEX MP] Server stopped.")


if __name__ == "__main__":
    main()
