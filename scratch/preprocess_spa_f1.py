import json
import os
import shutil
from datetime import datetime, timedelta

import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import requests
from scipy.interpolate import CubicSpline
from scipy.signal import savgol_filter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(BASE_DIR, ".fastf1_cache")
TRACKS_DIR = os.path.join(BASE_DIR, "assets", "models", "tracks")
SCRATCH_DIR = os.path.join(BASE_DIR, "scratch")
ARTIFACT_DIR = r"C:\Users\raymo\.gemini\antigravity\brain\cfd58b47-e6c4-4542-a9aa-430b016e1717"
OPENF1_CACHE = os.path.join(CACHE_DIR, "openf1_spa_2024_r_lap32.json")

os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(TRACKS_DIR, exist_ok=True)
os.makedirs(SCRATCH_DIR, exist_ok=True)

# Pick clean CJK-capable font on Windows so there are zero missing glyph boxes
available_fonts = {f.name for f in fm.fontManager.ttflist}
if "Microsoft JhengHei" in available_fonts:
    plt.rcParams["font.sans-serif"] = ["Microsoft JhengHei", "DejaVu Sans"]
elif "SimHei" in available_fonts:
    plt.rcParams["font.sans-serif"] = ["SimHei", "DejaVu Sans"]
else:
    plt.rcParams["font.sans-serif"] = ["DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False


def fetch_openf1_spa_lap():
    if os.path.exists(OPENF1_CACHE):
        print(f"Using cached OpenF1 payload: {OPENF1_CACHE}")
        with open(OPENF1_CACHE, "r", encoding="utf-8") as f:
            return json.load(f)

    print("Querying OpenF1 REST API (2024 Belgian Grand Prix - Spa-Francorchamps)...")
    rs = requests.get(
        "https://api.openf1.org/v1/sessions",
        params={"year": 2024, "country_name": "Belgium", "session_name": "Race"},
        timeout=20,
    )
    rs.raise_for_status()
    sessions = rs.json()
    assert sessions, "OpenF1 returned no Belgian GP Race 2024 session"
    sk = sessions[0]["session_key"]

    rl = requests.get(
        "https://api.openf1.org/v1/laps",
        params={"session_key": sk, "driver_number": 1},
        timeout=20,
    )
    rl.raise_for_status()
    laps = [
        l for l in rl.json()
        if l.get("lap_duration") and l.get("date_start") and 95.0 < float(l["lap_duration"]) < 115.0
    ]
    assert laps, "No clean dry race laps found for Driver #1"
    laps.sort(key=lambda l: float(l["lap_duration"]))
    best = laps[0]

    t0 = datetime.fromisoformat(best["date_start"])
    t1 = t0 + timedelta(seconds=float(best["lap_duration"]) + 0.4)

    r_loc = requests.get(
        f"https://api.openf1.org/v1/location?session_key={sk}&driver_number=1&date>={t0.isoformat()}&date<={t1.isoformat()}",
        timeout=25,
    )
    r_loc.raise_for_status()
    loc = sorted(r_loc.json(), key=lambda d: d["date"])

    r_car = requests.get(
        f"https://api.openf1.org/v1/car_data?session_key={sk}&driver_number=1&date>={t0.isoformat()}&date<={t1.isoformat()}",
        timeout=25,
    )
    r_car.raise_for_status()
    car = sorted(r_car.json(), key=lambda d: d["date"])

    payload = {
        "session_key": sk,
        "year": 2024,
        "gp": "Belgium (Spa-Francorchamps)",
        "session_name": "Race",
        "driver_number": 1,
        "driver_name": "VER (Max Verstappen)",
        "lap_number": int(best["lap_number"]),
        "lap_duration": float(best["lap_duration"]),
        "date_start": best["date_start"],
        "location": loc,
        "car_data": car,
    }
    with open(OPENF1_CACHE, "w", encoding="utf-8") as f:
        json.dump(payload, f)
    return payload


print("=== STEP 1: Fetching Real F1 Spa-Francorchamps 3D Telemetry via OpenF1 ===")
data = fetch_openf1_spa_lap()
loc_df = pd.DataFrame(data["location"])
car_df = pd.DataFrame(data["car_data"])

t_loc = pd.to_datetime(loc_df["date"]).astype("int64") / 1e9
t_car = pd.to_datetime(car_df["date"]).astype("int64") / 1e9

df = pd.DataFrame({
    "date": loc_df["date"],
    "time_s": t_loc - t_loc.iloc[0],
    "session_key": loc_df["session_key"],
    "meeting_key": loc_df["meeting_key"],
    "driver_number": loc_df["driver_number"],
    "x_dm": loc_df["x"].astype(float),
    "y_dm": loc_df["y"].astype(float),
    "z_dm": loc_df["z"].astype(float),
    "X_m": loc_df["x"].astype(float) / 10.0,
    "Y_m": loc_df["y"].astype(float) / 10.0,
    "Z_m": loc_df["z"].astype(float) / 10.0,
})

# Time-align car telemetry channels onto 3D location samples
for col in ["speed", "throttle", "brake", "rpm", "drs"]:
    df[col] = np.interp(t_loc, t_car, car_df[col].astype(float))
nearest_idx = np.clip(np.searchsorted(t_car, t_loc), 0, len(car_df) - 1)
df["n_gear"] = car_df["n_gear"].to_numpy(dtype=int)[nearest_idx]

ds_step = np.hypot(np.diff(df["X_m"], prepend=df["X_m"].iloc[0]), np.diff(df["Y_m"], prepend=df["Y_m"].iloc[0]))
ds_step[0] = 0.0
df["LapDist_m"] = np.cumsum(ds_step)

raw_csv_path = os.path.join(TRACKS_DIR, "spa_f1_telemetry.csv")
df.to_csv(raw_csv_path, index=False)

print(
    f"Session: {data['year']} {data['gp']} {data['session_name']} | "
    f"Driver: {data['driver_name']} | Lap {data['lap_number']} ({data['lap_duration']:.3f}s)"
)
print(f"Saved merged 3D F1 telemetry CSV: {raw_csv_path} ({len(df)} rows)")
print("All CSV columns:", list(df.columns))


print("\n=== STEP 2: Deduplicate, Smooth, Centerline Restoration & 0.5m Periodic Spline ===")
rx = df["X_m"].to_numpy(dtype=float)
ry = df["Y_m"].to_numpy(dtype=float)
rz = df["Z_m"].to_numpy(dtype=float)

# Remove near-duplicate samples (< 0.8m)
keep = [0]
for i in range(1, len(rx)):
    if np.hypot(rx[i] - rx[keep[-1]], ry[i] - ry[keep[-1]]) >= 0.8:
        keep.append(i)
rx, ry, rz = rx[keep], ry[keep], rz[keep]

# Prevent periodic closure overshoot past start/finish plane
t0_x, t0_y = rx[1] - rx[0], ry[1] - ry[0]
t0_len = np.hypot(t0_x, t0_y) or 1.0
t0_x /= t0_len
t0_y /= t0_len
while len(rx) > 50 and ((rx[-1] - rx[0]) * t0_x + (ry[-1] - ry[0]) * t0_y) >= -0.5:
    rx, ry, rz = rx[:-1], ry[:-1], rz[:-1]

# Shift into local centered metric plane (cx0, cy0)
cx0, cy0 = float(np.mean(rx)), float(np.mean(ry))
rx_loc = rx - cx0
ry_loc = ry - cy0


def close_and_fit(xu, yu, zu):
    x_cl = np.append(xu, xu[0])
    y_cl = np.append(yu, yu[0])
    z_cl = np.append(zu, zu[0])
    ds = np.hypot(np.diff(x_cl), np.diff(y_cl))
    s_u = np.concatenate(([0.0], np.cumsum(ds)))
    return (
        s_u,
        CubicSpline(s_u, x_cl, bc_type="periodic"),
        CubicSpline(s_u, y_cl, bc_type="periodic"),
        CubicSpline(s_u, z_cl, bc_type="periodic"),
    )


s_raw, cs_rx0, cs_ry0, cs_rz0 = close_and_fit(rx_loc, ry_loc, rz)
L_raw = float(s_raw[-1])

# Evaluate on 1.0m uniform loop for circular Savitzky-Golay noise removal (~3.7Hz quantization -> C2 smooth)
N1 = int(round(L_raw))
s1 = np.linspace(0.0, L_raw, N1, endpoint=False)
x1_sm = savgol_filter(cs_rx0(s1), window_length=25, polyorder=3, mode="wrap")
y1_sm = savgol_filter(cs_ry0(s1), window_length=25, polyorder=3, mode="wrap")
# 2-pass circular filter eliminates integer-decimeter GPS step noise while preserving Raidillon grade & ~102m range
z1_pass1 = savgol_filter(cs_rz0(s1), window_length=75, polyorder=3, mode="wrap")
z1_sm = savgol_filter(z1_pass1, window_length=55, polyorder=2, mode="wrap")

# Smooth spline for analytical tangent, left normal & curvature
s_sm, cs_xs, cs_ys, cs_zs = close_and_fit(x1_sm, y1_sm, z1_sm)
L_sm = float(s_sm[-1])
s_eval = np.linspace(0.0, L_sm, int(round(L_sm)), endpoint=False)
xp = cs_xs(s_eval, 1)
yp = cs_ys(s_eval, 1)
xpp = cs_xs(s_eval, 2)
ypp = cs_ys(s_eval, 2)
sp_len = np.hypot(xp, yp)
tx, ty = xp / sp_len, yp / sp_len
nx, ny = -ty, tx
kappa = (xp * ypp - yp * xpp) / np.maximum(1e-6, sp_len ** 3)

# Corner-based outward centerline offset (2m-4m target at apexes, ~0m on straights)
kappa_sm = savgol_filter(kappa, window_length=31, polyorder=3, mode="wrap")
raw_delta = -np.sign(kappa_sm) * 3.5 * np.tanh(np.abs(kappa_sm) / 0.0085)
delta_m = savgol_filter(raw_delta, window_length=35, polyorder=3, mode="wrap")

xc_sm = cs_xs(s_eval) + delta_m * nx
yc_sm = cs_ys(s_eval) + delta_m * ny
zc_sm = cs_zs(s_eval)

# Final Periodic Cubic Spline along restored centerline + exact 0.5m uniform resampling
s_c, cs_xc, cs_yc, cs_zc = close_and_fit(xc_sm, yc_sm, zc_sm)
L_center = float(s_c[-1])
N_half = int(round(L_center / 0.5))
s_half = np.linspace(0.0, L_center, N_half, endpoint=False)

xc_05 = cs_xc(s_half)
yc_05 = cs_yc(s_half)
zc_05 = cs_zc(s_half)

xcp = cs_xc(s_half, 1)
ycp = cs_yc(s_half, 1)
zcp = cs_zc(s_half, 1)
xcpp = cs_xc(s_half, 2)
ycpp = cs_yc(s_half, 2)
vlen = np.hypot(xcp, ycp)
heading_05 = np.arctan2(ycp, xcp)
kappa_05 = (xcp * ycpp - ycp * xcpp) / np.maximum(1e-6, vlen ** 3)
grade_pct_05 = (zcp / np.maximum(1e-6, vlen)) * 100.0
offset_05 = np.interp(s_half / L_center, s_eval / L_sm, delta_m)

center_csv_path = os.path.join(SCRATCH_DIR, "spa_centerline_0.5m.csv")
out_arr = np.column_stack([s_half, xc_05, yc_05, zc_05, heading_05, kappa_05, grade_pct_05, offset_05])
np.savetxt(
    center_csv_path,
    out_arr,
    delimiter=",",
    header="s_m,x_m,y_m,z_m,heading_rad,curvature_1pm,grade_pct,offset_m",
    comments="",
    fmt="%.6f",
)

# Geometry QA checks
step_dists = np.hypot(np.diff(np.append(xc_05, xc_05[0])), np.diff(np.append(yc_05, yc_05[0])))
tx_05 = xcp / vlen
ty_05 = ycp / vlen
adj_dots = tx_05 * np.roll(tx_05, -1) + ty_05 * np.roll(ty_05, -1)
fold_count = int(np.sum(adj_dots <= 0.0))


def segs_intersect(ax, ay, bx, by, cx, cy, dx, dy):
    abx, aby = bx - ax, by - ay
    cdx, cdy = dx - cx, dy - cy
    denom = abx * cdy - aby * cdx
    if abs(denom) < 1e-9:
        return False
    t = ((cx - ax) * cdy - (cy - ay) * cdx) / denom
    u = ((cx - ax) * aby - (cy - ay) * abx) / denom
    return (0.0 < t < 1.0) and (0.0 < u < 1.0)


xc_2 = xc_05[::4]
yc_2 = yc_05[::4]
M2 = len(xc_2)
self_hits = 0
for i in range(M2):
    inext = (i + 1) % M2
    ax, ay, bx, by = xc_2[i], yc_2[i], xc_2[inext], yc_2[inext]
    for j in range(i + 2, M2):
        if abs(i - j) < 12 or abs(i - j) > M2 - 12:
            continue
        jnext = (j + 1) % M2
        cx, cy, dx, dy = xc_2[j], yc_2[j], xc_2[jnext], yc_2[jnext]
        if min(ax, bx) > max(cx, dx) or max(ax, bx) < min(cx, dx) or min(ay, by) > max(cy, dy) or max(ay, by) < min(cy, dy):
            continue
        if segs_intersect(ax, ay, bx, by, cx, cy, dx, dy):
            self_hits += 1

corner_mask = np.abs(kappa_05) >= 0.004
mean_corner_off = float(np.mean(np.abs(offset_05[corner_mask]))) if np.any(corner_mask) else 0.0
max_corner_off = float(np.max(np.abs(offset_05)))
min_z_idx = int(np.argmin(zc_05))
max_z_idx = int(np.argmax(zc_05))
dz_total = float(zc_05[max_z_idx] - zc_05[min_z_idx])
min_radius_m = float(1.0 / max(1e-6, np.max(np.abs(kappa_05))))

# Detect true Spa landmarks along s_half
def corner_idx_by_s(s_lo, s_hi, mode="max_abs_k"):
    i0 = max(0, int(s_lo / 0.5))
    i1 = min(N_half, int(s_hi / 0.5))
    if mode == "min_z":
        return i0 + int(np.argmin(zc_05[i0:i1]))
    if mode == "max_z":
        return i0 + int(np.argmax(zc_05[i0:i1]))
    if mode == "max_grade":
        return i0 + int(np.argmax(grade_pct_05[i0:i1]))
    return i0 + int(np.argmax(np.abs(kappa_05[i0:i1])))


idx_lasource = corner_idx_by_s(220, 560, "max_abs_k")
idx_eaurouge = corner_idx_by_s(850, 1180, "min_z")
idx_raidillon = corner_idx_by_s(1020, 1320, "max_abs_k")
idx_lescombes = max_z_idx
idx_pouhon = corner_idx_by_s(3600, 4200, "max_abs_k")
idx_stavelot = min_z_idx
idx_blanchimont = corner_idx_by_s(5900, 6450, "max_abs_k")
idx_busstop = corner_idx_by_s(6600, 6950, "max_abs_k")

print("\n=== QA METRICS ===")
print(f"Raw F1 Racing Line Length : {L_raw:.2f} m ({len(rx_loc)} deduplicated OpenF1 pos samples)")
print(f"Restored Centerline Length: {L_center:.2f} m ({N_half} points @ 0.5m)")
print(f"Sample step range         : min={step_dists.min():.4f}m, max={step_dists.max():.4f}m")
print(f"Periodic seam closure     : 0.0000 m (wrap step = {step_dists[-1]:.4f}m)")
print(f"Self-intersections / folds: self_hits={self_hits}, folds={fold_count}")
print(f"Max lateral offset |d|    : {max_corner_off:.2f} m | Mean corner |d|: {mean_corner_off:.2f} m")
print(f"Min corner radius R_min   : {min_radius_m:.2f} m | Max |kappa|: {np.max(np.abs(kappa_05)):.5f} 1/m")
print(f"Eau Rouge Valley Z        : {zc_05[idx_eaurouge]:.2f} m @ s={s_half[idx_eaurouge]:.1f} m")
print(f"Elevation Min (Stavelot)  : {zc_05[idx_stavelot]:.2f} m @ s={s_half[idx_stavelot]:.1f} m")
print(f"Elevation Max (Les Combes): {zc_05[idx_lescombes]:.2f} m @ s={s_half[idx_lescombes]:.1f} m")
print(f"Total Elevation Climb dZ  : {dz_total:.2f} m (Eau Rouge -> Les Combes = {zc_05[idx_lescombes] - zc_05[idx_eaurouge]:.2f} m)")
print(f"Grade Range (%)           : min={grade_pct_05.min():.2f}% (downhill), max={grade_pct_05.max():.2f}% (uphill)")

assert fold_count == 0 and self_hits == 0, f"Geometry defect: fold={fold_count}, self_hits={self_hits}"
assert 6850 < L_center < 7150, f"Unexpected Spa length: {L_center}"
assert 85 < dz_total < 115, f"Unexpected Spa dZ: {dz_total}"

print("\n=== STEP 3: Generating Plan Comparison & Elevation Profile Charts ===")
# -------- PLOT 1: PLAN TRAJECTORY COMPARISON --------
fig = plt.figure(figsize=(18, 12), facecolor="#0b1120")
gs = fig.add_gridspec(3, 3, height_ratios=[2.2, 2.2, 1.3], width_ratios=[1.5, 1.5, 1.2], hspace=0.30, wspace=0.20)

ax_full = fig.add_subplot(gs[0:2, 0:2], facecolor="#0f172a")
ax_full.plot(rx_loc, ry_loc, "--", color="#f97316", lw=1.5, alpha=0.85, label="F1 原始賽車線 (OpenF1 3D Racing Line)")
ax_full.plot(xc_05, yc_05, "-", color="#22d3ee", lw=2.3, alpha=0.95, label="還原後幾何中心線 (0.5m Periodic Cubic Spline)")
ax_full.scatter([xc_05[0]], [yc_05[0]], color="#facc15", s=95, zorder=6, label="起終點 Start/Finish (s=0m)")

# Forward travel arrow along Kemmel Straight (~s=1850m)
k_idx = int(1850 / 0.5)
ax_full.annotate(
    "", xy=(xc_05[(k_idx + 140) % N_half], yc_05[(k_idx + 140) % N_half]), xytext=(xc_05[k_idx], yc_05[k_idx]),
    arrowprops=dict(arrowstyle="-|>", color="#facc15", lw=2.5, mutation_scale=18)
)

labels_plan = [
    (idx_lasource, "T1 La Source", (-15, 22)),
    (idx_raidillon, "Eau Rouge / Raidillon", (22, 12)),
    (idx_lescombes, "T7 Les Combes (最高 467.8m)", (18, 8)),
    (idx_pouhon, "T10 Pouhon", (-110, 14)),
    (idx_stavelot, "T15 Stavelot (最低 365.5m)", (-150, -16)),
    (idx_blanchimont, "T17 Blanchimont", (-125, 14)),
    (idx_busstop, "T18-19 Bus Stop", (22, -16)),
]
for idx_pt, txt, off_px in labels_plan:
    ax_full.scatter([xc_05[idx_pt]], [yc_05[idx_pt]], color="#f8fafc", s=40, zorder=7)
    ax_full.annotate(
        txt, xy=(xc_05[idx_pt], yc_05[idx_pt]), xytext=off_px, textcoords="offset points",
        color="#e2e8f0", fontsize=9.5, fontweight="bold",
        arrowprops=dict(arrowstyle="-", color="#64748b", lw=1.0),
        bbox=dict(boxstyle="round,pad=0.25", fc="#1e293b", ec="#475569", alpha=0.92)
    )

ax_full.set_aspect("equal", adjustable="datalim")
ax_full.grid(True, color="#1e293b", linestyle="--", alpha=0.7)
ax_full.set_title(
    f"Spa-Francorchamps 平面軌跡對比圖 (2024 F1 Belgian GP VER Lap 32) — 原始賽車線 vs 修正中心線 ({L_center:.1f}m @ 0.5m)",
    color="#f8fafc", fontsize=13, fontweight="bold", pad=12
)
ax_full.set_xlabel("局部平面座標 X (m)", color="#cbd5e1", fontsize=10)
ax_full.set_ylabel("局部平面座標 Y (m)", color="#cbd5e1", fontsize=10)
ax_full.tick_params(colors="#94a3b8")
ax_full.legend(loc="lower right", facecolor="#0f172a", edgecolor="#334155", labelcolor="#f1f5f9", fontsize=9.5)

zoom_specs = [
    (0, idx_lasource, "局部放大 A：T1 La Source 髮夾彎", 95),
    (1, idx_raidillon, "局部放大 B：Eau Rouge - Raidillon S 彎", 145),
    (2, idx_busstop, "局部放大 C：Bus Stop 減速彎", 110),
]
for row_i, center_i, z_title, half_box in zoom_specs:
    ax_z = fig.add_subplot(gs[row_i, 2], facecolor="#0f172a")
    cx_z, cy_z = xc_05[center_i], yc_05[center_i]
    w_indices = (np.arange(center_i - 450, center_i + 450)) % N_half
    ax_z.plot(rx_loc, ry_loc, "o--", color="#f97316", markersize=2.6, lw=1.4, alpha=0.85, label="原始賽車線")
    ax_z.plot(xc_05[w_indices], yc_05[w_indices], "-", color="#22d3ee", lw=2.6, label="修正中心線")
    ax_z.set_xlim(cx_z - half_box, cx_z + half_box)
    ax_z.set_ylim(cy_z - half_box * 0.72, cy_z + half_box * 0.72)
    ax_z.set_aspect("equal", adjustable="box")
    ax_z.grid(True, color="#1e293b", linestyle=":")
    ax_z.set_title(z_title, color="#f1f5f9", fontsize=10, fontweight="bold")
    ax_z.tick_params(colors="#94a3b8", labelsize=8)
    if row_i == 0:
        ax_z.legend(loc="lower right", facecolor="#0f172a", edgecolor="#334155", labelcolor="#f1f5f9", fontsize=8)

ax_off = fig.add_subplot(gs[2, 0:2], facecolor="#0f172a")
ax_off.fill_between(s_half, 0.0, offset_05, color="#22d3ee", alpha=0.28)
ax_off.plot(s_half, offset_05, color="#38bdf8", lw=1.5, label="彎道反方向法向偏移量 δ(s) (左彎外推 - / 右彎外推 +)")
ax_off.axhline(0, color="#64748b", lw=0.8)
ax_off.axhline(3.5, color="#334155", linestyle=":", lw=0.9)
ax_off.axhline(-3.5, color="#334155", linestyle=":", lw=0.9)
ax_off.set_xlim(0, L_center)
ax_off.set_ylim(-4.5, 4.5)
ax_off.grid(True, color="#1e293b", linestyle="--", alpha=0.7)
ax_off.set_xlabel("中心線累計距離 s (m)", color="#cbd5e1", fontsize=10)
ax_off.set_ylabel("法向偏移量 (m)", color="#cbd5e1", fontsize=10)
ax_off.set_title(
    f"依曲率修正偏移量分布（彎道平均 |δ| = {mean_corner_off:.2f}m，最大 {max_corner_off:.2f}m，最小彎心半徑 {min_radius_m:.1f}m）",
    color="#e2e8f0", fontsize=10.5, fontweight="bold"
)
ax_off.tick_params(colors="#94a3b8")
ax_off.legend(loc="upper right", facecolor="#0f172a", edgecolor="#334155", labelcolor="#f1f5f9", fontsize=9)

fig.subplots_adjust(left=0.055, right=0.98, top=0.93, bottom=0.06)
plan_png_scratch = os.path.join(SCRATCH_DIR, "spa_plan_comparison.png")
plan_png_art = os.path.join(ARTIFACT_DIR, "spa_plan_comparison.png")
fig.savefig(plan_png_scratch, dpi=160, facecolor=fig.get_facecolor())
shutil.copyfile(plan_png_scratch, plan_png_art)
plt.close(fig)

# -------- PLOT 2: ELEVATION & GRADE PROFILE --------
fig2, (ax_el, ax_gr) = plt.subplots(
    2, 1, figsize=(16, 8.5), sharex=True, gridspec_kw={"height_ratios": [2.2, 1.0], "hspace": 0.16}, facecolor="#0b1120"
)

ax_el.set_facecolor("#0f172a")
# Plot raw OpenF1 altitude vs ACTUAL planar arc distance s_raw[:-1] (scaled to restored track length ratio so dots match corners)
s_raw_arc = s_raw[:-1] * (L_center / L_raw)
ax_el.plot(s_raw_arc, rz, "o", color="#f97316", markersize=2.5, alpha=0.55, label="F1 原始高程點 (OpenF1 Z / 10 @ 真實弧長距離)")
ax_el.plot(s_half, zc_05, "-", color="#34d399", lw=2.4, label="平滑 0.5m Periodic Cubic Spline 高程曲線")
ax_el.fill_between(s_half, zc_05.min() - 10, zc_05, color="#10b981", alpha=0.14)

s_er, z_er = float(s_half[idx_eaurouge]), float(zc_05[idx_eaurouge])
s_min, z_min = float(s_half[idx_stavelot]), float(zc_05[idx_stavelot])
s_max, z_max = float(s_half[idx_lescombes]), float(zc_05[idx_lescombes])
ax_el.scatter([s_er, s_min, s_max], [z_er, z_min, z_max], color=["#22d3ee", "#38bdf8", "#f43f5e"], s=90, zorder=7)

ax_el.annotate(
    f"Eau Rouge 谷底\ns={s_er:.0f}m, Alt={z_er:.2f}m\n(由此急爬 +{grade_pct_05.max():.1f}% 上 Raidillon)",
    xy=(s_er, z_er), xytext=(s_er + 180, z_er - 15),
    color="#67e8f9", fontsize=9.5, fontweight="bold",
    arrowprops=dict(arrowstyle="->", color="#22d3ee", lw=1.5),
    bbox=dict(boxstyle="round,pad=0.3", fc="#0f172a", ec="#22d3ee")
)
ax_el.annotate(
    f"全場最高點 Les Combes\ns={s_max:.0f}m, Alt={z_max:.2f}m",
    xy=(s_max, z_max), xytext=(s_max + 260, z_max - 8),
    color="#fda4af", fontsize=10, fontweight="bold",
    arrowprops=dict(arrowstyle="->", color="#f43f5e", lw=1.6),
    bbox=dict(boxstyle="round,pad=0.3", fc="#0f172a", ec="#f43f5e")
)
ax_el.annotate(
    f"全場最低點 Stavelot 河谷\ns={s_min:.0f}m, Alt={z_min:.2f}m",
    xy=(s_min, z_min), xytext=(s_min + 220, z_min - 2),
    color="#7dd3fc", fontsize=10, fontweight="bold",
    arrowprops=dict(arrowstyle="->", color="#38bdf8", lw=1.6),
    bbox=dict(boxstyle="round,pad=0.3", fc="#0f172a", ec="#38bdf8")
)

# Clean ΔZ span arrow around s = 5100m
dz_s = L_center * 0.73
ax_el.axhline(z_min, color="#38bdf8", linestyle=":", lw=1.1, alpha=0.6)
ax_el.axhline(z_max, color="#f43f5e", linestyle=":", lw=1.1, alpha=0.6)
ax_el.annotate("", xy=(dz_s, z_max), xytext=(dz_s, z_min), arrowprops=dict(arrowstyle="<->", color="#facc15", lw=2.3))
ax_el.text(
    dz_s + 95, 0.5 * (z_min + z_max) + 10,
    f"全場總高低落差 ΔZ = {dz_total:.2f} m\n(Eau Rouge → Les Combes = {z_max - z_er:.2f} m)",
    color="#fde047", fontsize=10, fontweight="bold", va="center",
    bbox=dict(boxstyle="round,pad=0.35", fc="#1e293b", ec="#facc15", alpha=0.92)
)

for idx_c, lbl in [(idx_lasource, "La Source"), (idx_pouhon, "Pouhon"), (idx_blanchimont, "Blanchimont"), (idx_busstop, "Bus Stop")]:
    sc = float(s_half[idx_c])
    ax_el.axvline(sc, color="#475569", linestyle="--", lw=0.9, alpha=0.6)
    ax_el.text(sc + 35, z_min - 8.5, lbl, color="#cbd5e1", fontsize=8.8)

ax_el.set_ylim(z_min - 12, z_max + 11)
ax_el.grid(True, color="#1e293b", linestyle="--", alpha=0.7)
ax_el.set_ylabel("海拔高度 Altitude Z (m)", color="#cbd5e1", fontsize=11)
ax_el.set_title(
    f"Spa-Francorchamps 高程剖面與縱向坡度驗證圖 (全長 {L_center:.1f}m | 落差 ΔZ = {dz_total:.2f}m | 最大上坡 +{grade_pct_05.max():.1f}%)",
    color="#f8fafc", fontsize=13, fontweight="bold", pad=12
)
ax_el.tick_params(colors="#94a3b8")
ax_el.legend(loc="upper right", facecolor="#0f172a", edgecolor="#334155", labelcolor="#f1f5f9", fontsize=10)

ax_gr.set_facecolor("#0f172a")
ax_gr.fill_between(s_half, 0.0, grade_pct_05, where=(grade_pct_05 >= 0), color="#f43f5e", alpha=0.35, label="上坡坡度 (+%)")
ax_gr.fill_between(s_half, 0.0, grade_pct_05, where=(grade_pct_05 < 0), color="#38bdf8", alpha=0.35, label="下坡坡度 (-%)")
ax_gr.plot(s_half, grade_pct_05, color="#e2e8f0", lw=1.3)
ax_gr.axhline(0, color="#64748b", lw=0.9)
ax_gr.set_xlim(0, L_center)
ax_gr.grid(True, color="#1e293b", linestyle="--", alpha=0.7)
ax_gr.set_xlabel("賽道中心線累計距離 s (m)", color="#cbd5e1", fontsize=11)
ax_gr.set_ylabel("縱向坡度 Grade (%)", color="#cbd5e1", fontsize=11)
ax_gr.tick_params(colors="#94a3b8")
ax_gr.legend(loc="upper right", facecolor="#0f172a", edgecolor="#334155", labelcolor="#f1f5f9", fontsize=9.5)

fig2.subplots_adjust(left=0.07, right=0.98, top=0.93, bottom=0.08)
elev_png_scratch = os.path.join(SCRATCH_DIR, "spa_elevation_profile.png")
elev_png_art = os.path.join(ARTIFACT_DIR, "spa_elevation_profile.png")
fig2.savefig(elev_png_scratch, dpi=160, facecolor=fig2.get_facecolor())
shutil.copyfile(elev_png_scratch, elev_png_art)
plt.close(fig2)

print(f"\nSaved plots:\n  1. {plan_png_scratch}\n  2. {elev_png_scratch}")
