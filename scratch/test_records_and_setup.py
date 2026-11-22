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
        f"http://127.0.0.1:{port}/scratch/test_records_and_setup.html",
    ],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)

ok = done_event.wait(timeout=90)
proc.terminate()
try:
    proc.wait(timeout=5)
except Exception:
    proc.kill()
server.shutdown()

assert ok and report_data is not None, "Timed out waiting for Chrome test_records_and_setup report"
print("=== APEX PRO RACING RECORDS, LEADERBOARD & SETUP VERIFICATION ===")
print(json.dumps(report_data, indent=2, ensure_ascii=False))

assert not report_data.get("errors"), f"Runtime errors detected: {report_data['errors']}"

sp = report_data["setupPhysics"]
nm = sp["neutralMods"]
assert nm["dragMult"] == 1.0 and nm["downforceMult"] == 1.0 and nm["gearSpeedScale"] == 1.0 and nm["turnInMult"] == 1.0, f"Default setup not neutral: {nm}"
assert sp["shortGear7sKmh"] > sp["longGear7sKmh"] + 2.0, f"Short-gear setup did not accelerate faster at 7s: {sp}"
assert sp["aero1TopEndKmh"] > sp["aero5TopEndKmh"] + 1.5, f"Aero-1 low-drag did not exceed Aero-5 high-speed top end: {sp}"
assert sp["highDfDf"] > sp["lowDragDf"] * 1.4, f"Wing 5 downforce should significantly exceed Wing 1: {sp}"
assert sp["optimumGrip"] > sp["greenGrip"], f"Optimum track surface grip must exceed green: {sp}"
assert sp["softKerbGrip"] > sp["stiffKerbGrip"], f"Soft suspension kerb grip must exceed stiff: {sp}"

ps = report_data["persistence"]
assert ps["driverName"] == "R.LUO", f"Driver name failed IndexedDB/storage persist: {ps}"
assert ps["totalValidAfterReload"] >= 5, f"Valid records lost across reload: {ps}"
assert ps["exportSchema"] == "apex-pro-records-v1", f"Invalid export schema: {ps}"

lb = report_data["leaderboard"]
assert lb["gt3Times"] == [104.25], f"GT3 board polluted or missing: {lb}"
assert lb["hyperTimes"] == [96.18], f"HYPER board wrong: {lb}"
assert lb["lmp1Times"] == [86.42], f"LMP1 board wrong: {lb}"
assert lb["arcTimes"] == [95.1], f"Arcade board wrong: {lb}"
assert lb["wetTimes"] == [116.84], f"Wet board wrong: {lb}"
assert lb["gt3BenchPro"] > lb["hyperBenchPro"] > lb["lmp1BenchPro"], f"Class benchmarks order wrong: {lb}"
assert lb["spoofSanitized"] >= 1, f"Class spoofing not detected on import: {lb}"
assert lb["gt3AfterSpoofCount"] == 1, f"919 Evo spoof polluted GT3 leaderboard! {lb}"
assert lb["lmp1AfterSpoofCount"] == 2, f"919 Evo sanitized record should appear in LMP1! {lb}"

mu = report_data["motecUi"]
assert mu["metaHasFerrari"] and mu["metaHasTemp"], f"MoTeC metadata cards incomplete: {mu}"
assert min(mu["pxPedal"], mu["pxSteer"], mu["pxDelta"], mu["pxTraj"]) > 25, f"MoTeC canvases empty: {mu}"
assert mu["ghostOk"] and mu["ghostMatchedId"] and mu["ghostLen"] >= 20, f"Historical ghost loading failed: {mu}"
assert mu["recordsScreenHasFerrariInGT3"] and mu["recordsScreenHasSennaInHYPER"], f"Records screen class filter isolation failed: {mu}"

print("\nALL LAP RECORDS DB, CLASS LEADERBOARD, SETUP PHYSICS & MOTEC OVERLAY TESTS PASSED 100%!")
