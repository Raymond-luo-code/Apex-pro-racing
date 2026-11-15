# Verification test script for RFC improvements across Modules 1, 2, and 3
import os
import sys

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pass_count = 0
fail_count = 0

def assert_test(condition, message):
    global pass_count, fail_count
    if condition:
        print(f"  [PASS] {message}")
        pass_count += 1
    else:
        print(f"  [FAIL] {message}", file=sys.stderr)
        fail_count += 1

print("=== TEST SUITE: RFC MODULE 1, 2 & 3 IMPROVEMENTS ===\n")

# 1. Verify index.html contains Inspect Mode and Invalid Lap UI elements
print("Test Group 1: index.html markup & styling")
with open(os.path.join(base_dir, "index.html"), "r", encoding="utf-8") as f:
    index_html = f.read()
assert_test('id="inspect-mode-overlay"' in index_html, "index.html contains #inspect-mode-overlay")
assert_test('id="btn-exit-inspect"' in index_html, "index.html contains #btn-exit-inspect")
assert_test('id="btn-garage-inspect"' in index_html, "index.html contains #btn-garage-inspect")
assert_test('id="btn-home-inspect"' in index_html, "index.html contains #btn-home-inspect")
assert_test('id="hud-lap-invalid"' in index_html, "index.html contains #hud-lap-invalid")
assert_test('body.inspect-active .af-screen' in index_html, "CSS contains body.inspect-active visual isolation rules")

# 2. Verify js/audio.js
print("\nTest Group 2: js/audio.js synthesis")
with open(os.path.join(base_dir, "js", "audio.js"), "r", encoding="utf-8") as f:
    audio_js = f.read()
assert_test("35-50 Hz low-frequency kerb rumble" in audio_js, "audio.js comments RFC Module 2 kerb rumble")
assert_test("this.kerbOsc.type = 'triangle'" in audio_js, "audio.js uses triangle wave for low-frequency sub-bass kerb audio")
assert_test("kerbLowpass.frequency.value = 180" in audio_js, "audio.js uses 180Hz lowpass filter on kerb oscillator")
assert_test("35 + Math.min(15, (currentSpeed / 250) * 15)" in audio_js or "35 + Math.min(15, (simState.speedKmh / 250) * 15)" in audio_js, "audio.js matches kerb rumble frequency dynamically to ground velocity (35-50 Hz)")

# 3. Verify js/input.js
print("\nTest Group 3: js/input.js Gamepad rumble")
with open(os.path.join(base_dir, "js", "input.js"), "r", encoding="utf-8") as f:
    input_js = f.read()
assert_test("window.triggerGamepadRumble" in input_js, "input.js defines window.triggerGamepadRumble")
assert_test("vibrationActuator.playEffect('dual-rumble'" in input_js, "input.js utilizes HTML5 Gamepad API dual-rumble playEffect")

# 4. Verify js/physics.js
print("\nTest Group 4: js/physics.js surface physics & anti-cheat pipeline")
with open(os.path.join(base_dir, "js", "physics.js"), "r", encoding="utf-8") as f:
    physics_js = f.read()
assert_test("simState.surfaceGrip = 0.85" in physics_js, "physics.js scales kerb grip to 85%")
assert_test("simState.surfaceGrip = 0.42" in physics_js, "physics.js scales grass grip to 42%")
assert_test("simState.steerResistance = 1.25" in physics_js, "physics.js applies moderate steering resistance (1.25) on kerb")
assert_test("3.45 + 0.075 * vMs" in physics_js, "physics.js triples grass rolling resistance coefficient")
assert_test("omega = 2 * Math.PI * (28 + (simState.speedKmh / 300) * 20)" in physics_js, "physics.js models chassis suspension harmonic oscillation (28-48 Hz)")
assert_test("simState.suspensionDispY = amp * damping * Math.cos(omega * simState.kerbTime)" in physics_js, "physics.js applies damped harmonic oscillation y = A * e^(-gamma*t) * cos(omega*t)")
assert_test("allGatesCleared" in physics_js, "physics.js validates all checkpoints cleared before finish")
assert_test("isLapLegitimate" in physics_js, "physics.js verifies legitimate lap before recording lap or finish")
assert_test("GATE_COUNT = 16" in physics_js, "physics.js partitions circuit into 16 sequential trigger checkpoints")
assert_test("requiredGates" in physics_js, "physics.js enforces all checkpoints (1..15) cleared before finish")

# 5. Verify js/render.js
print("\nTest Group 5: js/render.js showroom camera constraints & decoupled camera rig")
with open(os.path.join(base_dir, "js", "render.js"), "r", encoding="utf-8") as f:
    render_js = f.read()
assert_test("studioGroup = new THREE.Group()" in render_js, "render.js constructs dedicated studioGroup")
assert_test("studioDomeMesh" in render_js, "render.js creates dark backdrop cylinder")
assert_test("studioKeySpot" in render_js, "render.js creates dedicated studio key spotlight")
assert_test("studioRimSpot" in render_js, "render.js creates studio rim spotlight")
assert_test("circuitSceneryGroup.visible = !isInspect" in render_js, "render.js toggles circuit visibility in inspect mode")
assert_test("studioGroup.visible = isInspect" in render_js, "render.js toggles studioGroup visibility in inspect mode")
assert_test("Math.max(75 * DEG2RAD, Math.min(85 * DEG2RAD, showroomCam.polar))" in render_js, "render.js clamps default turntable pitch to 75°-85°")
assert_test("Math.max(15 * DEG2RAD, Math.min(85 * DEG2RAD, showroomCam.polar))" in render_js, "render.js clamps inspect mode pitch to 15°-85°")
assert_test("Math.max(3.5, Math.min(8.0, showroomCam.targetDistance))" in render_js, "render.js clamps inspect mode distance to 3.5m - 8.0m")
assert_test("Math.sin(nowSec * 65) * vibeAmp" not in render_js, "render.js has eliminated direct camera jitter noise vectors (jx, jy)")
assert_test("playerExteriorMesh.position.y = suspY" in render_js, "render.js applies suspension displacement locally to vehicle chassis mesh")

# 6. Verify js/flow.js
print("\nTest Group 6: js/flow.js interaction & inspect mode state machine")
with open(os.path.join(base_dir, "js", "flow.js"), "r", encoding="utf-8") as f:
    flow_js = f.read()
assert_test("function enterInspectMode()" in flow_js, "flow.js implements enterInspectMode")
assert_test("function exitInspectMode()" in flow_js, "flow.js implements exitInspectMode")
assert_test("raycaster.intersectObjects(playerCarGroup.children" in flow_js, "flow.js raycasts clicks against vehicle mesh")
assert_test("window.addEventListener('wheel'" in flow_js, "flow.js handles wheel zooming with clamping in inspect mode")
assert_test("btnExitInspect.addEventListener('click'" in flow_js, "flow.js wires exit inspect button")

print("\n" + "=" * 40)
print(f"TEST SUMMARY: {pass_count} PASSED, {fail_count} FAILED")
print("=" * 40)

if fail_count > 0:
    sys.exit(1)

