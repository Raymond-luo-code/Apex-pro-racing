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
        f"http://127.0.0.1:{port}/scratch/verify_driving_experience.html",
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

assert ok and report_data is not None, "Timed out waiting for Chrome verify_driving_experience report"
print("=== PHASE A-D DRIVING EXPERIENCE & VEHICLE PERSONALITY VERIFICATION ===")
for chk in report_data.get("checks", []):
    tag = "[PASS]" if chk.get("passed") else "[FAIL]"
    detail = f" ({chk.get('detail')})" if chk.get("detail") else ""
    print(f"  {tag} {chk.get('name')}{detail}")

print("Metrics:", json.dumps(report_data.get("metrics", {}), ensure_ascii=False))
assert not report_data.get("errors"), f"Errors: {report_data.get('errors')}"
print("[PASS] All driving experience & vehicle personality verification checks passed!")
