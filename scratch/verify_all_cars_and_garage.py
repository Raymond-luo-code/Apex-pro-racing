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

ok = done_event.wait(timeout=360)
proc.terminate()
try:
    proc.wait(timeout=5)
except Exception:
    proc.kill()
server.shutdown()

assert ok and report_data is not None, "Timed out waiting for Chrome verify_all_cars_and_garage report"
print("=== ALL 75 LOCAL CAR GLBs + 10-CLASS PI GARAGE + STRENGTH PROFILES VERIFICATION ===")
print("Errors:", report_data.get("errors"))
cars = report_data.get("cars", [])
for c in cars:
    print(" ", json.dumps(c, ensure_ascii=False))
print("Garage UI:", json.dumps(report_data.get("garageUi"), ensure_ascii=False))
print("PI Profiles:", json.dumps(report_data.get("piProfiles"), ensure_ascii=False))
print("Class Physics:", json.dumps(report_data.get("classPhysics"), ensure_ascii=False))
print("Records Isolation:", json.dumps(report_data.get("recordsIsolation"), ensure_ascii=False))

assert not report_data.get("errors"), f"Runtime errors detected: {report_data['errors']}"
assert len(cars) == 75, f"Expected 75 local GLB cars verified, got {len(cars)}"
failed = [c for c in cars if not c.get("ok")]
assert not failed, f"Failed car GLBs ({len(failed)}): {failed}"

ui = report_data.get("garageUi", {})
assert ui.get("catalogTotal") == 79 and ui.get("presetTotal") == 79, f"Expected 79 cars total, got {ui}"
assert ui.get("initialTab") == "GT3" and ui.get("initialCount") == 14, f"Garage must open categorized in active class GT3 (14), got {ui}"
assert ui.get("tabCounts") == {"D": 4, "C": 8, "B": 7, "GT3": 14, "A": 11, "S": 7, "R": 10, "LMH": 7, "X": 4, "F1": 7}, f"Tab counts mismatch: {ui}"
assert ui.get("classCHothatch") == ["subaru_wrx_sti", "honda_civic_type_r"], f"C hothatch sub-filter mismatch: {ui}"
assert ui.get("gt3JpIds") == ["acura_nsx_gt3_evo", "lexus_rc_f_gt3", "nissan_gtr_gt3"], f"GT3 JP sub-filter mismatch: {ui}"
assert ui.get("classAHybridCount") == 6, f"A hybrid count mismatch: {ui}"
assert ui.get("classSAero") == ["zenvo_tsrs", "amg_one", "aston_vulcan"], f"S aero sub-filter mismatch: {ui}"
assert ui.get("lmhWecCount") == 4, f"LMH WEC count mismatch: {ui}"
assert ui.get("f1Classic") == ["ferrari_f2004"], f"F1 classic sub-filter mismatch: {ui}"
assert ui.get("allCount") == 79 and ui.get("piBadgesCount") == 79 and ui.get("strengthChipsCount") >= 79 and ui.get("hasPerfBox"), f"PI/Strength UI missing: {ui}"
assert ui.get("searchF40") == ["ferrari_f40_lbw"], f"Search filter mismatch: {ui}"
assert ui.get("searchValPreserved") == "F40" and ui.get("gridOpenAfterClick") is True, f"Search focus/grid toggle mismatch: {ui}"

pp = report_data.get("piProfiles", {})
assert pp.get("allValid") is True, f"Invalid PI/strength profile: {pp}"
sp = pp.get("spreads", {})
for tight_cls in ("C", "GT3", "A", "S", "LMH", "F1"):
    assert sp.get(tight_cls, 999) <= 40, f"Class {tight_cls} PI spread too wide: {sp}"
assert pp["vulcan"]["bestTrackType"] != pp["tourbillon"]["bestTrackType"], f"Vulcan vs Tourbillon must highlight distinct track strengths: {pp}"
assert pp["gt3rs"]["bestTrackType"] != pp["mclarenF1"]["bestTrackType"], f"911 GT3 RS vs McLaren F1 must highlight distinct track strengths: {pp}"

cp = report_data.get("classPhysics", {})
est = cp.get("estMonza", {})
assert est["D"] > est["C"] > est["B"] > est["GT3"] > est["A"] > est["S"] > est["R"] > est["LMH"] > est["X"] > est["F1"], f"10-class pace ordering wrong: {est}"
assert len(cp.get("aiS", [])) == 3 and "amg_one" in cp["aiS"], f"Closest-PI S-class AI matching wrong: {cp}"
assert len(cp.get("aiF1", [])) == 3 and all("f1_" in cid or cid == "ferrari_f2004" for cid in cp["aiF1"]), f"AI F1 must match real F1 peers: {cp}"
assert cp.get("civicLayout") == "FF", f"Civic Type R layout must be FF: {cp}"

ri = report_data.get("recordsIsolation", {})
assert ri.get("spoofSanitized") == 2, f"Expected 2 spoof attempts sanitized, got {ri}"
assert ri.get("dCount") == 2 and ri.get("f1Count") == 2, f"Sanitized records missing from true classes: {ri}"
assert ri.get("gt3Count") == 0 and ri.get("lmhCount") == 0, f"Class pollution detected in GT3/LMH: {ri}"

print("\nALL 75 LOCAL CAR GLBs (79 TOTAL CARS), 10-CLASS PI GARAGE & STRENGTH PROFILES VERIFIED 100%!")
