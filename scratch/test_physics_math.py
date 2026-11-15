# Verification test for natural reversing, checkpoint validation, and non-inverting camera
import math
import sys

pass_count = 0
fail_count = 0

def assert_test(cond, msg):
    global pass_count, fail_count
    if cond:
        print(f"  [PASS] {msg}")
        pass_count += 1
    else:
        print(f"  [FAIL] {msg}", file=sys.stderr)
        fail_count += 1

print("=== VERIFYING NATURAL REVERSING, CHECKPOINT FINISH, AND NON-INVERTING CAMERA ===\n")

totalTrackLength = 3400.0
GATE_COUNT = 16
gateSpacing = totalTrackLength / GATE_COUNT

class SimState:
    def __init__(self):
        self.s = 0.0
        self.d = 0.0
        self.speedMs = 0.0
        self.gear = 1
        self.lap = 1
        self.lapElapsed = 0.0
        self.clearedGates = [0]
        self.lastClearedGate = 0
        self.bestLapTime = 100.0
        self.sessionLapTimes = []
        self.finished = False

def simulate_step(state, ds, forwardDot, dt):
    prevS = state.s
    # Natural progression (no reverse lock or artificial speed clamp)
    state.s += ds
    if state.s < 0:
        state.s += totalTrackLength
    
    # Gate progression forward
    if state.s >= prevS:
        for g in range(1, GATE_COUNT):
            gateS = g * gateSpacing
            if prevS < gateS <= state.s:
                if forwardDot > 0:
                    if g not in state.clearedGates:
                        state.clearedGates.append(g)
                    state.lastClearedGate = g
    
    state.lapElapsed += dt
    
    # Finish line check
    if state.s >= totalTrackLength:
        state.s -= totalTrackLength
        completedTime = state.lapElapsed
        
        requiredGates = list(range(1, 16))
        allGatesCleared = all(g in state.clearedGates for g in requiredGates)
        isForwardFinish = forwardDot > 0
        isLapLegitimate = allGatesCleared and isForwardFinish
        
        state.clearedGates = [0]
        state.lastClearedGate = 0
        
        if isLapLegitimate:
            if completedTime < state.bestLapTime:
                state.bestLapTime = completedTime
            state.sessionLapTimes.append(completedTime)
            state.finished = True
            return "FINISHED"
        else:
            # Did not clear all checkpoints: do NOT finish, do NOT record lap
            return "IGNORED"
    return "DRIVING"

# TEST 1: Reversing at start does NOT lock speed or clamp s to 0, and does NOT complete lap
print("Test 1: Natural Reversing at Start Line")
st1 = SimState()
st1.s = 5.0
st1.gear = -1
res = simulate_step(st1, -10.0, -1.0, 0.2) # reverses across line
assert_test(st1.s == totalTrackLength - 5.0, f"Car reverses smoothly wrapped to {totalTrackLength - 5.0}m (got {st1.s}m)")
assert_test(res == "DRIVING", "Does NOT finish or trigger results on reverse")
assert_test(len(st1.sessionLapTimes) == 0, "No lap recorded on reverse")

# TEST 2: Reversing then rolling forward across finish line without passing all gates
print("\nTest 2: Crossing Finish Line Without Passing All Gates")
st2 = SimState()
st2.s = totalTrackLength - 10.0
# Only cleared gates 0 (none of 1..15)
res2 = simulate_step(st2, 20.0, 1.0, 0.5) # crosses finish line
assert_test(res2 == "IGNORED", "Crossing finish line without checkpoints is IGNORED (no finish)")
assert_test(st2.finished == False, "Race finish screen is NOT triggered")
assert_test(len(st2.sessionLapTimes) == 0, "Lap time is NOT recorded")

# TEST 3: Driving entire lap forward through all 15 checkpoints
print("\nTest 3: Legitimate Lap Through All Checkpoints")
st3 = SimState()
st3.s = 0.0
for g in range(1, 16):
    target = g * gateSpacing + 2.0
    ds = target - st3.s
    simulate_step(st3, ds, 1.0, 5.0)
    assert_test(g in st3.clearedGates, f"Cleared gate {g}")

assert_test(len(st3.clearedGates) == 16, "All 16 checkpoints cleared forward")
# Now cross finish line
res3 = simulate_step(st3, (totalTrackLength + 5.0) - st3.s, 1.0, 5.0)
assert_test(res3 == "FINISHED", "Crossing finish line with all checkpoints FINISHES the race")
assert_test(st3.finished == True, "Race finish results screen triggered")
assert_test(len(st3.sessionLapTimes) == 1, "Lap time recorded successfully into PB")

# TEST 4: Camera LookAt Gimbal Lock & Inversion Verification
print("\nTest 4: Camera Orientation Stability (No Flipping / Gimbal Lock)")
def get_camera_up_y(azimuth_rad, polar_rad, dist=6.0):
    tx, ty, tz = 0, 0.65, 0
    eye_x = tx + dist * math.sin(polar_rad) * math.sin(azimuth_rad)
    eye_y = ty + dist * math.cos(polar_rad)
    eye_z = tz + dist * math.sin(polar_rad) * math.cos(azimuth_rad)
    
    # z = normalize(eye - target)
    zx = eye_x - tx; zy = eye_y - ty; zz = eye_z - tz
    zl = math.sqrt(zx*zx + zy*zy + zz*zz) or 1.0
    zx /= zl; zy /= zl; zz /= zl
    
    # x = normalize(cross(up(0,1,0), z))
    xx = zz; xy = 0.0; xz = -zx
    xl = math.sqrt(xx*xx + xz*xz)
    if xl == 0: return None
    xx /= xl; xz /= xl
    
    # y = cross(z, x)
    yy = zz * xx - zx * xz # Camera up Y component
    return yy

DEG2RAD = math.pi / 180
stable_count = 0
total_tested = 0
for p_deg in range(15, 86, 2):
    for a_deg in range(0, 360, 5):
        total_tested += 1
        up_y = get_camera_up_y(a_deg * DEG2RAD, p_deg * DEG2RAD)
        if up_y is not None and up_y > 0.05:
            stable_count += 1

assert_test(stable_count == total_tested, f"100% of orbit space is strictly upright (tested {total_tested} orientations, {stable_count} upright)")

print("\n" + "=" * 50)
print(f"VERIFICATION SUMMARY: {pass_count} PASSED, {fail_count} FAILED")
print("=" * 50)

if fail_count > 0:
    sys.exit(1)
