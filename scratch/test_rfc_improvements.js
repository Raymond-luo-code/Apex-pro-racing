// Verification test script for RFC improvements across Modules 1, 2, and 3
const fs = require('fs');
const path = require('path');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

console.log('=== TEST SUITE: RFC MODULE 1, 2 & 3 IMPROVEMENTS ===\n');

// 1. Verify index.html contains Inspect Mode and Invalid Lap UI elements
console.log('Test Group 1: index.html markup & styling');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(indexHtml.includes('id="inspect-mode-overlay"'), 'index.html contains #inspect-mode-overlay');
assert(indexHtml.includes('id="btn-exit-inspect"'), 'index.html contains #btn-exit-inspect');
assert(indexHtml.includes('id="btn-garage-inspect"'), 'index.html contains #btn-garage-inspect');
assert(indexHtml.includes('id="btn-home-inspect"'), 'index.html contains #btn-home-inspect');
assert(indexHtml.includes('id="hud-lap-invalid"'), 'index.html contains #hud-lap-invalid');
assert(indexHtml.includes('body.inspect-active .af-screen'), 'CSS contains body.inspect-active visual isolation rules');

// 2. Verify js/audio.js
console.log('\nTest Group 2: js/audio.js synthesis');
const audioJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'audio.js'), 'utf8');
assert(audioJs.includes('35-50 Hz low-frequency kerb rumble'), 'audio.js comments RFC Module 2 kerb rumble');
assert(audioJs.includes('this.kerbOsc.type = \'triangle\''), 'audio.js uses triangle wave for low-frequency sub-bass kerb audio');
assert(audioJs.includes('kerbLowpass.frequency.value = 180'), 'audio.js uses 180Hz lowpass filter on kerb oscillator');
assert(audioJs.includes('35 + Math.min(15, (simState.speedKmh / 250) * 15)'), 'audio.js matches kerb rumble frequency dynamically to ground velocity (35-50 Hz)');

// 3. Verify js/input.js
console.log('\nTest Group 3: js/input.js Gamepad rumble');
const inputJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'input.js'), 'utf8');
assert(inputJs.includes('window.triggerGamepadRumble'), 'input.js defines window.triggerGamepadRumble');
assert(inputJs.includes('vibrationActuator.playEffect(\'dual-rumble\''), 'input.js utilizes HTML5 Gamepad API dual-rumble playEffect');

// 4. Verify js/physics.js
console.log('\nTest Group 4: js/physics.js surface physics & anti-cheat pipeline');
const physicsJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'physics.js'), 'utf8');
assert(physicsJs.includes('simState.surfaceGrip = 0.85'), 'physics.js scales kerb grip to 85%');
assert(physicsJs.includes('simState.surfaceGrip = 0.42'), 'physics.js scales grass grip to 42%');
assert(physicsJs.includes('simState.steerResistance = 1.25'), 'physics.js applies moderate steering resistance (1.25) on kerb');
assert(physicsJs.includes('3.45 + 0.075 * vMs'), 'physics.js triples grass rolling resistance coefficient');
assert(physicsJs.includes('omega = 2 * Math.PI * (28 + (simState.speedKmh / 300) * 20)'), 'physics.js models chassis suspension harmonic oscillation (28-48 Hz)');
assert(physicsJs.includes('simState.suspensionDispY = amp * damping * Math.cos(omega * simState.kerbTime)'), 'physics.js applies damped harmonic oscillation y = A * e^(-gamma*t) * cos(omega*t)');
assert(physicsJs.includes('START_LINE_REVERSE'), 'physics.js implements Start-Line Reverse Lock');
assert(physicsJs.includes('forwardDot > 0'), 'physics.js implements Directional Dot Product Validation');
assert(physicsJs.includes('GATE_COUNT = 16'), 'physics.js partitions circuit into 16 sequential trigger checkpoints');
assert(physicsJs.includes('minPhysicalLapFloor'), 'physics.js validates lap against physical circuit floor');

// 5. Verify js/render.js
console.log('\nTest Group 5: js/render.js showroom camera constraints & decoupled camera rig');
const renderJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'render.js'), 'utf8');
assert(renderJs.includes('studioGroup = new THREE.Group()'), 'render.js constructs dedicated studioGroup');
assert(renderJs.includes('studioDomeMesh'), 'render.js creates dark backdrop cylinder');
assert(renderJs.includes('studioKeySpot'), 'render.js creates dedicated studio key spotlight');
assert(renderJs.includes('studioRimSpot'), 'render.js creates studio rim spotlight');
assert(renderJs.includes('circuitSceneryGroup.visible = !isInspect'), 'render.js toggles circuit visibility in inspect mode');
assert(renderJs.includes('studioGroup.visible = isInspect'), 'render.js toggles studioGroup visibility in inspect mode');
assert(renderJs.includes('Math.max(75 * DEG2RAD, Math.min(85 * DEG2RAD, showroomCam.polar))'), 'render.js clamps default turntable pitch to 75°-85°');
assert(renderJs.includes('Math.max(15 * DEG2RAD, Math.min(85 * DEG2RAD, showroomCam.polar))'), 'render.js clamps inspect mode pitch to 15°-85°');
assert(renderJs.includes('Math.max(3.5, Math.min(8.0, showroomCam.targetDistance))'), 'render.js clamps inspect mode distance to 3.5m - 8.0m');
assert(!renderJs.includes('Math.sin(nowSec * 65) * vibeAmp'), 'render.js has eliminated direct camera jitter noise vectors (jx, jy)');
assert(renderJs.includes('playerExteriorMesh.position.y = suspY'), 'render.js applies suspension displacement locally to vehicle chassis mesh');

// 6. Verify js/flow.js
console.log('\nTest Group 6: js/flow.js interaction & inspect mode state machine');
const flowJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'flow.js'), 'utf8');
assert(flowJs.includes('function enterInspectMode()'), 'flow.js implements enterInspectMode');
assert(flowJs.includes('function exitInspectMode()'), 'flow.js implements exitInspectMode');
assert(flowJs.includes('raycaster.intersectObjects(playerCarGroup.children'), 'flow.js raycasts clicks against vehicle mesh');
assert(flowJs.includes('window.addEventListener(\'wheel\''), 'flow.js handles wheel zooming with clamping in inspect mode');
assert(flowJs.includes('btnExitInspect.addEventListener(\'click\''), 'flow.js wires exit inspect button');

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log(`========================================`);

if (failCount > 0) {
  process.exit(1);
}

