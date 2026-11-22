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
        f"http://127.0.0.1:{port}/scratch/verify_vehicle_performance.html",
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

assert ok and report_data is not None, "Timed out waiting for Chrome verify_vehicle_performance report"
print("=== REAL-WORLD VEHICLE PERFORMANCE BENCHMARK ACROSS ALL 5 CLASSES ===")
print("Errors:", report_data.get("errors"))
assert not report_data.get("errors"), f"Runtime errors detected: {report_data['errors']}"

by_id = {}
for b in report_data.get("benchmarks", []):
    by_id[b["id"]] = b
    print(
        f"  [{b['carClass']:6s}] {b['id']:22s} | "
        f"0-100={str(b['t0100']):>5s}s | 0-200={str(b['t0200']):>5s}s | 0-300={str(b['t0300']):>5s}s | "
        f"Vmax={b['topSpeed35s']:5.1f} | DF250={b['df250Kgf']:4d}kg | "
        f"LatG250={b['latG250']:4.2f}G | BrkG={b['brakeG']:4.2f}G | "
        f"Monza={b['proMonza']:6.2f}s | Spa={b['proSpa']:6.2f}s"
    )

print("Drivetrain checks:", report_data.get("drivetrainChecks"))

f1 = by_id["f1_2026_sf26"]
p919 = by_id["porsche_919_evo"]
amgone = by_id["amg_one"]
senna = by_id["mclaren_senna"]
huayra = by_id["pagani_huayra_r"]
laf = by_id["ferrari_laferrari"]
sf90 = by_id["ferrari_sf90_xx"]
gt3 = by_id["ferrari458"]
avent = by_id["lamborghini_aventador"]
f40 = by_id["ferrari_f40_lbw"]
countach = by_id["lamborghini_countach"]
xtrail = by_id["nissan_xtrail"]

# 1. F1 SF-26 real-world envelope vs GT3
assert 1.9 <= f1["t0100"] <= 2.7, f"F1 0-100 out of range: {f1}"
assert 4.1 <= f1["t0200"] <= 5.5, f"F1 0-200 out of range: {f1}"
assert 8.0 <= f1["t0300"] <= 11.8, f"F1 0-300 out of range: {f1}"
assert 355 <= f1["topSpeed35s"] <= 372, f"F1 Vmax out of range: {f1}"
assert f1["df250Kgf"] >= 2100, f"F1 downforce@250 too low: {f1}"
assert f1["latG250"] >= 4.50, f"F1 cornering G@250 too low: {f1}"
assert f1["brakeG"] >= 4.20, f"F1 aero braking G too low: {f1}"
assert f1["maxGears"] == 8 and f1["maxGearSeen"] >= 7 and f1["maxRpmSeen"] >= 13500, f"F1 8-gear/15k RPM failed: {f1}"
assert gt3["proSpa"] - f1["proSpa"] >= 25.0, f"F1 vs GT3 Spa gap too small: GT3={gt3['proSpa']}s vs F1={f1['proSpa']}s"
assert gt3["proMonza"] - f1["proMonza"] >= 18.0, f"F1 vs GT3 Monza gap too small: GT3={gt3['proMonza']}s vs F1={f1['proMonza']}s"

# 2. GT3 baseline preserved
assert 3.1 <= gt3["t0100"] <= 3.7, f"GT3 0-100 drifted: {gt3}"
assert 7.4 <= gt3["t0200"] <= 9.2, f"GT3 0-200 drifted: {gt3}"
assert 298 <= gt3["topSpeed35s"] <= 315, f"GT3 Vmax drifted: {gt3}"
assert 580 <= gt3["df250Kgf"] <= 720, f"GT3 downforce@250 out of realistic range: {gt3}"
assert 1.85 <= gt3["latG250"] <= 2.35, f"GT3 cornering G@250 out of range: {gt3}"
assert 1.80 <= gt3["brakeG"] <= 2.40, f"GT3 braking G out of range: {gt3}"
assert gt3["maxGears"] == 6, f"GT3 gears wrong: {gt3}"

# 3. Porsche 919 Evo vs AMG ONE
assert p919["t0100"] <= 2.35, f"919 Evo AWD launch too slow: {p919}"
assert p919["topSpeed35s"] >= 362, f"919 Evo Vmax too low: {p919}"
assert p919["df250Kgf"] >= 1950 and p919["latG250"] >= 4.00, f"919 Evo aero/cornering too low: {p919}"
assert amgone["proSpa"] - p919["proSpa"] >= 12.0, f"919 Evo should crush road-legal AMG ONE on Spa: {p919['proSpa']} vs {amgone['proSpa']}"

# 4. Road Hypercar vs GT3 vs Track Hypercar
assert laf["topSpeed35s"] >= gt3["topSpeed35s"] + 30.0, f"LaFerrari Vmax must crush GT3: {laf} vs {gt3}"
assert laf["t0200"] <= 6.8 and (gt3["t0200"] - laf["t0200"]) >= 2.2, f"LaFerrari 0-200 must crush GT3: {laf} vs {gt3}"
assert gt3["latG180"] > laf["latG180"], f"GT3 slicks+aero must out-corner road-tire LaFerrari at 180: GT3={gt3['latG180']}G vs Laf={laf['latG180']}G"
assert senna["df250Kgf"] >= 950 and senna["latG250"] >= 2.35, f"Senna GTR downforce/cornering too low: {senna}"
assert gt3["proSpa"] - huayra["proSpa"] >= 10.0, f"Huayra R Evo should clear GT3 on Spa: {huayra['proSpa']} vs {gt3['proSpa']}"
assert sf90["t0100"] <= 2.6, f"SF90 XX AWD 0-100 too slow: {sf90}"

# 5. Street Class Hierarchy & Nissan X-Trail SUV reality check
assert 6.4 <= xtrail["t0100"] <= 8.2, f"X-Trail 0-100 unrealistic: {xtrail}"
assert 178 <= xtrail["topSpeed35s"] <= 195, f"X-Trail Vmax unrealistic: {xtrail}"
assert xtrail["t0200"] is None, f"X-Trail should never reach 200 km/h: {xtrail}"
assert xtrail["df250Kgf"] < 50 and xtrail["latG250"] < 0.95 and xtrail["brakeG"] < 1.35, f"X-Trail grip/df too high: {xtrail}"
assert xtrail["proSpa"] - gt3["proSpa"] >= 40.0, f"X-Trail vs GT3 Spa gap too small: {xtrail['proSpa']} vs {gt3['proSpa']}"
assert xtrail["proSpa"] > countach["proSpa"] > f40["proSpa"] > avent["proSpa"] > gt3["proSpa"] > laf["proSpa"] > huayra["proSpa"] > p919["proSpa"], "Overall class pace hierarchy broken!"

print("\nALL REAL-WORLD VEHICLE PERFORMANCE GAPS ACROSS 5 CLASSES VERIFIED 100%!")
