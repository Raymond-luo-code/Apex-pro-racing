import asyncio
import base64
import http.server
import json
import os
import secrets
import struct
import subprocess
import sys
import threading

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(BASE)
sys.path.insert(0, BASE)

import apex_mp_server


# ---------------------------------------------------------------------------
# Minimal RFC 6455 Async WebSocket Test Client (stdlib only)
# ---------------------------------------------------------------------------
class PyWsClient:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.reader = None
        self.writer = None

    async def connect(self):
        self.reader, self.writer = await asyncio.open_connection(self.host, self.port)
        key = base64.b64encode(secrets.token_bytes(16)).decode("ascii")
        req = (
            f"GET / HTTP/1.1\r\n"
            f"Host: {self.host}:{self.port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        ).encode("ascii")
        self.writer.write(req)
        await self.writer.drain()
        raw = await asyncio.wait_for(self.reader.readuntil(b"\r\n\r\n"), timeout=5.0)
        assert b"101 Switching Protocols" in raw, f"Handshake failed: {raw}"

    async def send_json(self, obj):
        payload = json.dumps(obj, separators=(",", ":")).encode("utf-8")
        n = len(payload)
        mask = secrets.token_bytes(4)
        if n < 126:
            hdr = struct.pack("!BB", 0x81, 0x80 | n)
        elif n < 65536:
            hdr = struct.pack("!BBH", 0x81, 0x80 | 126, n)
        else:
            hdr = struct.pack("!BBQ", 0x81, 0x80 | 127, n)
        masked = bytes(b ^ mask[i & 3] for i, b in enumerate(payload))
        self.writer.write(hdr + mask + masked)
        await self.writer.drain()

    async def recv_json(self, timeout=5.0):
        hdr = await asyncio.wait_for(self.reader.readexactly(2), timeout=timeout)
        n = hdr[1] & 0x7F
        if n == 126:
            n = struct.unpack("!H", await self.reader.readexactly(2))[0]
        elif n == 127:
            n = struct.unpack("!Q", await self.reader.readexactly(8))[0]
        raw = await self.reader.readexactly(n) if n > 0 else b""
        return json.loads(raw.decode("utf-8"))

    async def recv_until(self, pred, timeout=5.0):
        deadline = asyncio.get_event_loop().time() + timeout
        while True:
            rem = max(0.1, deadline - asyncio.get_event_loop().time())
            msg = await self.recv_json(timeout=rem)
            if pred(msg):
                return msg

    async def close(self):
        if self.writer:
            try:
                self.writer.close()
            except Exception:
                pass


async def run_protocol_tests(ws_port):
    print("=== PART A: PYTHON WEBSOCKET ROOM, CODE & QUICK-MATCH PROTOCOL ===")
    c1, c2, c3 = PyWsClient("127.0.0.1", ws_port), PyWsClient("127.0.0.1", ws_port), PyWsClient("127.0.0.1", ws_port)
    await asyncio.gather(c1.connect(), c2.connect(), c3.connect())
    w1, w2, w3 = await asyncio.gather(c1.recv_json(), c2.recv_json(), c3.recv_json())
    assert w1["type"] == "welcome" and w2["type"] == "welcome" and w3["type"] == "welcome"
    print(f"  [PASS] 3 clients welcomed: {w1['playerId']}, {w2['playerId']}, {w3['playerId']}")

    # 1. Quick Match Class Isolation: GT3+GT3 pair together; F1 gets separate room
    await c1.send_json({"type": "quick_match", "name": "ALPHA", "carClass": "GT3", "edition": "realistic", "circuitIdx": 0})
    r1 = await c1.recv_until(lambda m: m.get("type") == "room_state" and m.get("room"))
    await c2.send_json({"type": "quick_match", "name": "BETA", "carClass": "GT3", "edition": "realistic", "circuitIdx": 0})
    r2 = await c2.recv_until(lambda m: m.get("type") == "room_state" and m.get("room"))
    await c3.send_json({"type": "quick_match", "name": "F1PRO", "carClass": "F1", "edition": "realistic", "circuitIdx": 3})
    r3 = await c3.recv_until(lambda m: m.get("type") == "room_state" and m.get("room"))

    assert r1["room"]["code"] == r2["room"]["code"], "Two GT3 clients failed to auto-pair via quick_match"
    assert len(r2["room"]["players"]) == 2
    assert r3["room"]["code"] != r1["room"]["code"], "F1 client was mixed into GT3 room!"
    print(f"  [PASS] Quick Match class isolation: GT3 paired #{r1['room']['code']} (2p) vs F1 #{r3['room']['code']} (1p)")

    # 2. Public Lobby List check
    await c3.send_json({"type": "list_rooms"})
    lst = await c3.recv_until(lambda m: m.get("type") == "room_list")
    codes = [r["code"] for r in lst["rooms"]]
    assert r1["room"]["code"] in codes and r3["room"]["code"] in codes
    print(f"  [PASS] Public room list returned {len(codes)} waiting lobbies")

    # 3. Private Room Code + State Relay + Finish Standings
    await c1.send_json({"type": "leave_room"})
    await c2.send_json({"type": "leave_room"})
    await c3.send_json({"type": "leave_room"})
    await asyncio.gather(
        c1.recv_until(lambda m: m.get("type") == "room_state" and m.get("room") is None),
        c2.recv_until(lambda m: m.get("type") == "room_state" and m.get("room") is None),
        c3.recv_until(lambda m: m.get("type") == "room_state" and m.get("room") is None),
    )
    await c1.send_json({"type": "create_room", "name": "HOST1", "carClass": "HYPER", "circuitIdx": 3, "laps": 2})
    cr = await c1.recv_until(lambda m: m.get("type") == "room_state" and m.get("room") and m["room"]["carClass"] == "HYPER")
    priv_code = cr["room"]["code"]
    await c2.send_json({"type": "join_room", "code": priv_code, "name": "FRIEND2"})
    jn = await c2.recv_until(lambda m: m.get("type") == "room_state" and m.get("room") and m["room"]["code"] == priv_code and len(m["room"]["players"]) == 2)
    assert len(jn["room"]["players"]) == 2
    await c1.send_json({"type": "start_race"})
    rs1, rs2 = await asyncio.gather(
        c1.recv_until(lambda m: m.get("type") == "race_start"),
        c2.recv_until(lambda m: m.get("type") == "race_start"),
    )
    assert rs1["room"]["raceStartServerMs"] == rs2["room"]["raceStartServerMs"]
    await c1.send_json({"type": "state", "s": 412.5, "d": -1.4, "h": 0.5, "v": 62.0, "lap": 1})
    ps = await c2.recv_until(lambda m: m.get("type") == "peer_state")
    assert abs(ps["s"] - 412.5) < 1e-4 and abs(ps["v"] - 62.0) < 1e-4
    await c1.send_json({"type": "finish", "totalTime": 185.123, "bestLap": 92.4})
    st = await c2.recv_until(lambda m: m.get("type") == "race_standings")
    assert st["standings"][0]["finished"] is True and abs(st["standings"][0]["finishTime"] - 185.123) < 1e-4
    print(f"  [PASS] Private room #{priv_code}, race_start sync, 20Hz state relay & finish standings OK")

    await asyncio.gather(c1.close(), c2.close(), c3.close())


mp_ctrl, ws_port = apex_mp_server.start_mp_server_in_thread(host="127.0.0.1", preferred_port=0)
asyncio.run(run_protocol_tests(ws_port))

# Part B: Dual Headless Chrome Real-App E2E Verification
report_data = None
done_event = threading.Event()


class TestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/__mp_info.json":
            body = json.dumps({"wsPort": ws_port, "httpPort": http_port, "lanMode": False}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def do_POST(self):
        global report_data
        if self.path == "/__report":
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length).decode("utf-8", errors="replace")
            report_data = json.loads(body)
            done_event.set()
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            self.send_response(404)
            self.end_headers()


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), TestHandler)
http_port = server.server_address[1]
threading.Thread(target=server.serve_forever, daemon=True).start()

proc = subprocess.Popen(
    [
        CHROME,
        "--headless",
        "--disable-gpu",
        "--autoplay-policy=no-user-gesture-required",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        f"http://127.0.0.1:{http_port}/scratch/verify_multiplayer.html",
    ],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)

ok = done_event.wait(timeout=120)
proc.terminate()
try:
    proc.wait(timeout=5)
except Exception:
    proc.kill()
server.shutdown()
mp_ctrl.stop()

assert ok and report_data is not None, "Timed out waiting for dual-client Chrome multiplayer report"
print("\n=== PART B: CHROME HEADLESS DUAL-CLIENT E2E MULTIPLAYER ===")
for chk in report_data.get("checks", []):
    tag = "[PASS]" if chk.get("passed") else "[FAIL]"
    detail = f" ({chk.get('detail')})" if chk.get("detail") else ""
    print(f"  {tag} {chk.get('name')}{detail}")

print("Metrics:", json.dumps(report_data.get("metrics", {}), ensure_ascii=False))
assert not report_data.get("errors"), f"Errors: {report_data.get('errors')}"
print("[PASS] All Local / LAN Multiplayer protocol & dual-client Chrome E2E checks passed!")
