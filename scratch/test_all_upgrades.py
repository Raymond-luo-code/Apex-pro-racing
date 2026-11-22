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
        f"http://127.0.0.1:{port}/scratch/test_all_upgrades.html",
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

assert ok and report_data is not None, "Timed out waiting for Chrome test_all_upgrades report"
print("=== APEX PRO RACING UPGRADES VERIFICATION ===")
print(json.dumps(report_data, indent=2, ensure_ascii=False))

# 1. Runtime & Shader Error-Free Check
assert not report_data.get("errors"), f"Runtime/WebGL errors detected: {report_data['errors']}"
assert report_data.get("bloomCompileOk") is True, f"Bloom shader compile/render failed: {report_data}"
assert report_data.get("bloomGlError") == 0, f"Bloom WebGL error code: {report_data.get('bloomGlError')}"
assert report_data.get("brakeGlowCount") == 0, "Brake disc glow must NOT be present"

# Ensure no brakeDiscGlow string or thermal brake glow exists in JS source
with open(os.path.join(BASE, "js", "render.js"), encoding="utf-8") as f:
    render_src = f.read()
assert "brakeDiscGlow" not in render_src, "brakeDiscGlow found in js/render.js"

# 2. All 5 Circuits, Biomes, SkyDome, Fuji/Suzuka Landmarks
circuits = report_data.get("circuits", [])
expected_biomes = ["monza_park", "fuji_sunset", "hakone_night", "spa_ardennes", "suzuka_bay"]
assert len(circuits) == 5, f"Expected 5 circuits, got {len(circuits)}"
for i, c in enumerate(circuits):
    assert c["biome"] == expected_biomes[i], f"Circuit {i} wrong biome: {c}"
    assert c["hasSkyDome"] and c["skyIsShaderMat"], f"Missing GLSL sky dome on circuit {c['id']}"
    assert c["texturedBanners"] >= 1, f"Missing textured gantry banners on circuit {c['id']}"
    if c["biome"] == "fuji_sunset":
        assert c["hasMtFujiMesh"], "Mt Fuji missing on fuji_sunset!"
    else:
        assert not c["hasMtFujiMesh"], f"Mt Fuji leaked onto non-Fuji circuit {c['id']}!"
    if c["biome"] == "suzuka_bay":
        assert c["hasFerrisTorus"], "Suzuka Ferris Wheel missing on suzuka_bay!"

# 3. GT-R Removed, Liveries & Multi-Class AI
gtr = report_data.get("gtrCheck", {})
assert gtr.get("removedEverywhere") is True, f"nissan_gtr_gt500 still present: {gtr}"

livs = report_data.get("liveries", [])
assert len(livs) == 4, f"Expected 4 livery patterns, got {livs}"
for l in livs:
    if l["pattern"] != "solid":
        assert l["texWidth"] == 512, f"Livery texture invalid for {l}"

ai_cls = report_data.get("aiClasses", {})
for cls in ["GT3", "HYPER", "LMP1"]:
    assert len(ai_cls.get(cls, [])) >= 3, f"AI roster incomplete for {cls}: {ai_cls}"
assert "mclaren_senna" not in [x["preset"] for x in ai_cls["HYPER"]], "HYPER partner grid should differ from player Senna"

# 4. Wet Weather, Wet Tire, & Rain System
w = report_data.get("weather", {})
assert abs(w["dryMediumGrip"] - 1.0) < 0.02, f"Expected ~1.0 dry medium grip, got {w}"
assert abs(w["wetMediumGrip"] - 0.72) < 0.03, f"Expected ~0.72 wet medium grip (-28%), got {w}"
assert w["wetRainTireGrip"] > 0.88 and w["wetRainTireGrip"] < 0.95, f"Expected ~0.907 wet rain tire recovery, got {w}"
assert w["rainDryVisible"] is False and w["rainWetVisible"] is True, f"Rain visibility mismatch: {w}"

# 5. FIA Race Flags
fl = report_data.get("flags", {})
assert fl == {"flagNone": "none", "flagYellow": "yellow", "flagBlue": "blue", "flagCheckered": "checkered"}, f"FIA flags mismatch: {fl}"

# 6. DOM / UI Polish Controls
ui = report_data.get("uiDom", {})
for k in ["hasTopPill", "hasFlagBanner", "hasWeatherBtn", "hasMotecPod", "hasShadowsBtn", "hasBloomBtn"]:
    assert ui.get(k) is True, f"Missing UI element {k}: {ui}"
assert ui.get("glbTrackDefault") == "OFF", f"GLB track scenery must default OFF: {ui}"
assert ui.get("liveryPatternBtns") == 4 and ui.get("liveryAccentBtns") == 4 and ui.get("wetTireBtn") == 1, f"Garage customizer UI mismatch: {ui}"

# 7. Bug Fixes Verification (Orientation, Taillight Isolation, Headlight Beam, Reverse Stability)
bf = report_data.get("bugFixes", {})
orient = bf.get("orientation", {})
for pid in ["mclaren_senna", "pagani_huayra_r"]:
    o = orient.get(pid, {})
    assert o.get("frontNodeX") is not None and o.get("rearNodeX") is not None, f"Missing front/rear nodes for {pid}: {o}"
    assert o["frontNodeX"] > 0.4 and o["rearNodeX"] < -0.4, f"{pid} still backwards! {o}"
    assert o["flSteerX"] > 0.4 and o["rlSteerX"] < -0.4 and o["flSteerX"] > o["rlSteerX"], f"{pid} wheels backwards: {o}"
    assert not o.get("misclassifiedTail"), f"{pid} misclassified detail as taillight: {o}"

ti = bf.get("taillightIsolation", {})
assert ti.get("bmwDetailsRole") != "taillight" and ti.get("rollcageDetailRole") != "taillight", f"False taillight classification: {ti}"
assert ti.get("brakeLampRole") == "taillight", f"Real brake_lamp not classified as taillight: {ti}"

hb = bf.get("headlightBeam", {})
assert hb.get("minX", -1) > 1.5 and hb.get("maxX", 0) > 30, f"Headlight beam X bounds wrong: {hb}"
assert hb.get("frontMaxR", 99) < 0.5 and hb.get("farMaxR", 0) > 2.0, f"Headlight cone direction inverted (must flare forward): {hb}"

rs = bf.get("reverseStability", {})
assert rs.get("revMaxYaw", 99) < 0.05 and rs.get("revOversteer") is False and rs.get("revHeadingDelta", 99) < 0.02, f"Reverse standstill jitter/spinout: {rs}"
assert rs.get("wwOversteer") is False and rs.get("yawFlips", 99) == 0, f"Low-speed wrong-way false oversteer/oscillation: {rs}"

sd = bf.get("skyDomeTracking", {})
assert sd.get("cameraFar", 0) >= 4500 and 4000 <= sd.get("domeRadius", 0) < sd.get("cameraFar", 0), f"SkyDome/camera.far clipping check failed: {sd}"
assert sd.get("camDistDelta") is not None and sd["camDistDelta"] < 0.01, f"SkyDome not centered on camera: {sd}"

sp = bf.get("spaRealTrack", {})
assert 6600 < sp.get("totalLen", 0) < 7150 and sp.get("elevSpanY", 0) > 95.0, f"Spa real scale/elevation check failed: {sp}"
glb_sp = sp.get("glbSpaCheck", {})
assert glb_sp.get("ok") and glb_sp.get("meshCount", 0) >= 5, f"Spa GLB load failed: {glb_sp}"
assert glb_sp.get("spanX", 0) > 1800 and glb_sp.get("spanZ", 0) > 1100 and 95.0 < glb_sp.get("spanY", 0) < 120.0, f"Spa GLB size mismatch: {glb_sp}"
assert glb_sp.get("centerDeltaX", 9999) < 80.0, f"Spa GLB not aligned 1:1 with playable trackNodes: {glb_sp}"

print("\nALL UPGRADES & BUG FIXES VERIFIED 100% SUCCESSFULLY!")
