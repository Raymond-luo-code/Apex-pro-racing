import http.server
import json
import os
import subprocess
import threading

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(BASE)

report_data = None
done_event = threading.Event()


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

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


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
port = server.server_address[1]
t = threading.Thread(target=server.serve_forever, daemon=True)
t.start()

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
        f"http://127.0.0.1:{port}/scratch/verify_all_cars_and_garage.html",
    ],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)

ok = done_event.wait(timeout=180)
proc.terminate()
try:
    proc.wait(timeout=5)
except Exception:
    proc.kill()
server.shutdown()

assert ok and report_data is not None, "Timed out waiting for Chrome verify_all_cars_and_garage report"
print("=== ALL 29 LOCAL CAR GLBs + CATEGORIZED GARAGE + 5-CLASS LEADERBOARD VERIFICATION ===")
print("Errors:", report_data.get("errors"))
cars = report_data.get("cars", [])
for c in cars:
    print(" ", json.dumps(c, ensure_ascii=False))
print("Garage UI:", json.dumps(report_data.get("garageUi"), ensure_ascii=False))
print("Class Physics:", json.dumps(report_data.get("classPhysics"), ensure_ascii=False))
print("Records Isolation:", json.dumps(report_data.get("recordsIsolation"), ensure_ascii=False))

assert not report_data.get("errors"), f"Runtime errors detected: {report_data['errors']}"
assert len(cars) == 29, f"Expected 29 local GLB cars verified, got {len(cars)}"
failed = [c for c in cars if not c.get("ok")]
assert not failed, f"Failed car GLBs ({len(failed)}): {failed}"

ui = report_data.get("garageUi", {})
assert ui.get("catalogTotal") == 33 and ui.get("presetTotal") == 33, f"Expected 33 cars total, got {ui}"
assert ui.get("initialTab") == "GT3" and ui.get("initialCount") == 8, f"Garage must open categorized in active class GT3 (8), got {ui}"
assert ui.get("tabCounts") == {"STREET": 4, "GT3": 8, "HYPER": 14, "LMP1": 6, "F1": 1}, f"Tab counts mismatch: {ui}"
assert ui.get("hyperRoadCount") == 7 and ui.get("hyperTrackCount") == 7, f"HYPER sub-filters mismatch: {ui}"
assert ui.get("hyperFerrariIds") == ["ferrari_fxxk_evo", "ferrari_laferrari", "ferrari_sf90_xx"], f"Brand filter mismatch: {ui}"
assert ui.get("allCount") == 33 and ui.get("searchF40") == ["ferrari_f40_lbw"], f"Search filter mismatch: {ui}"
assert ui.get("searchValPreserved") == "F40" and ui.get("gridOpenAfterClick") is True, f"Search focus/grid toggle mismatch: {ui}"

cp = report_data.get("classPhysics", {})
est = cp.get("estMonza", {})
assert est["STREET"] > est["GT3"] > est["HYPER"] > est["LMP1"] > est["F1"], f"Class pace ordering wrong: {est}"
assert len(cp.get("aiF1", [])) == 3 and len(cp.get("aiStreet", [])) == 3, f"AI rosters incomplete: {cp}"

ri = report_data.get("recordsIsolation", {})
assert ri.get("spoofSanitized") == 2, f"Expected 2 spoof attempts sanitized, got {ri}"
assert ri.get("streetCount") == 2 and ri.get("f1Count") == 2, f"Sanitized records missing from true classes: {ri}"
assert ri.get("gt3Count") == 0 and ri.get("lmp1Count") == 0, f"Class pollution detected in GT3/LMP1: {ri}"

print("\nALL 29 LOCAL CAR GLBs (33 TOTAL CARS), CATEGORIZED GARAGE & 5-CLASS LEADERBOARD VERIFIED 100%!")
