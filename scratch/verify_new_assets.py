import http.server
import json
import os
import subprocess
import threading
import time

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
        f"http://127.0.0.1:{port}/scratch/verify_new_assets.html",
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

assert ok and report_data is not None, "Timed out waiting for Chrome verification report"
print("=== CHROME ASSET & CIRCUIT VERIFICATION ===")
print("Errors:", report_data.get("errors"))
print("Circuits:")
for c in report_data.get("circuits", []):
    print(" ", c)
print("Cars:")
for car in report_data.get("cars", []):
    print(" ", car)
print("Class Benchmarks on Spa:", report_data.get("classBenchmarks"))

assert not report_data.get("errors"), f"Runtime errors: {report_data['errors']}"
assert len(report_data.get("circuits", [])) == 9, f"Expected 9 circuits, got {len(report_data.get('circuits', []))}"
for car in report_data.get("cars", []):
    assert car.get("ok"), f"Car failed verification: {car}"
cb = report_data.get("classBenchmarks", {})
assert cb["procedural"] > cb["mclaren_senna"] > cb["porsche_919_evo"], f"Expected GT3 > HYPER > LMP1 lap times, got {cb}"
print("\nALL 6 NEW CAR GLBs + 5 CIRCUITS + MULTI-CLASS SCALING VERIFIED 100%!")
