import csv
import io
import json
import math
import os
import shutil
import struct
import numpy as np
import requests
from PIL import Image, ImageDraw
from scipy.interpolate import CubicSpline
from scipy.signal import savgol_filter
from scipy.spatial import cKDTree

import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm
import matplotlib.pyplot as plt

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(BASE_DIR, ".fastf1_cache")
TRACKS_DIR = os.path.join(BASE_DIR, "assets", "models", "tracks")
SCRATCH_DIR = os.path.join(BASE_DIR, "scratch")
ARTIFACT_DIR = r"C:\Users\raymo\.gemini\antigravity\brain\cfd58b47-e6c4-4542-a9aa-430b016e1717"

TUMFTM_CACHE = os.path.join(CACHE_DIR, "tumftm_spa.csv")
OPENF1_CACHE = os.path.join(CACHE_DIR, "openf1_spa_2024_r_lap32.json")

os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(TRACKS_DIR, exist_ok=True)
os.makedirs(SCRATCH_DIR, exist_ok=True)

available_fonts = {f.name for f in fm.fontManager.ttflist}
if "Microsoft JhengHei" in available_fonts:
    plt.rcParams["font.sans-serif"] = ["Microsoft JhengHei", "DejaVu Sans"]
else:
    plt.rcParams["font.sans-serif"] = ["DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

# ==============================================================================
# 1. LOAD TUMFTM SPA CENTERLINE + REAL TRACK WIDTHS, & OPENF1 3D TELEMETRY
# ==============================================================================
print("=== STEP 1: Loading TUMFTM Spa Centerline & OpenF1 3D Elevation ===")
if not os.path.exists(TUMFTM_CACHE):
    r = requests.get("https://raw.githubusercontent.com/TUMFTM/racetrack-database/master/tracks/Spa.csv", timeout=20)
    r.raise_for_status()
    with open(TUMFTM_CACHE, "w", encoding="utf-8") as f:
        f.write(r.text)

tum_x, tum_y, tum_wr, tum_wl = [], [], [], []
with open(TUMFTM_CACHE, "r", encoding="utf-8") as f:
    for row in csv.reader(f):
        if not row or row[0].strip().startswith("#"):
            continue
        tum_x.append(float(row[0]))
        tum_y.append(float(row[1]))
        tum_wr.append(float(row[2]))
        tum_wl.append(float(row[3]))

tum_xy = np.column_stack([np.array(tum_x), np.array(tum_y)])
tum_wr = np.array(tum_wr)
tum_wl = np.array(tum_wl)

with open(OPENF1_CACHE, "r", encoding="utf-8") as f:
    openf1 = json.load(f)

loc = openf1["location"]
op_x = np.array([d["x"] / 10.0 for d in loc], dtype=float)
op_y = np.array([d["y"] / 10.0 for d in loc], dtype=float)
op_z = np.array([d["z"] / 10.0 for d in loc], dtype=float)

# Deduplicate consecutive OpenF1 points < 0.8m
keep = [0]
for i in range(1, len(op_x)):
    if math.hypot(op_x[i] - op_x[keep[-1]], op_y[i] - op_y[keep[-1]]) >= 0.8:
        keep.append(i)
op_xy = np.column_stack([op_x[keep], op_y[keep]])
op_z = op_z[keep]

print(f"TUMFTM rows: {len(tum_xy)} | OpenF1 pos samples: {len(op_xy)}")
print(f"TUMFTM half-widths sum range: {(tum_wr + tum_wl).min():.2f}m .. {(tum_wr + tum_wl).max():.2f}m (mean {(tum_wr + tum_wl).mean():.2f}m)")

# ==============================================================================
# 2. RIGID 2D ICP ALIGNMENT (OPENF1 -> TUMFTM) & ELEVATION FUSION
# ==============================================================================
print("\n=== STEP 2: Rigidly Aligning OpenF1 3D Elevation onto TUMFTM Centerline ===")
tree_tum = cKDTree(tum_xy)
tum_mean = tum_xy.mean(axis=0)
op_mean = op_xy.mean(axis=0)
op_centered = op_xy - op_mean

best_fit = None
for mirror in (False, True):
    pts_m = op_centered.copy()
    if mirror:
        pts_m[:, 1] *= -1.0
    for deg in range(0, 360, 15):
        rad = math.radians(deg)
        c, s = math.cos(rad), math.sin(rad)
        rot = np.array([[c, -s], [s, c]])
        cur = (pts_m @ rot.T) + tum_mean
        # Fast ICP refinements
        R_acc = rot.copy()
        t_acc = tum_mean.copy()
        p_base = pts_m
        for _ in range(12):
            dists, idxs = tree_tum.query(cur)
            tgt = tum_xy[idxs]
            src_c = cur.mean(axis=0)
            tgt_c = tgt.mean(axis=0)
            H = (cur - src_c).T @ (tgt - tgt_c)
            U, _, Vt = np.linalg.svd(H)
            d_det = np.linalg.det(Vt.T @ U.T)
            R_step = Vt.T @ np.diag([1.0, d_det]) @ U.T
            cur = (cur - src_c) @ R_step.T + tgt_c
        dists, _ = tree_tum.query(cur)
        rms = float(np.sqrt(np.mean(dists ** 2)))
        if best_fit is None or rms < best_fit["rms"]:
            # Solve global Umeyama transform from p_base -> cur
            b_c = p_base.mean(axis=0)
            c_c = cur.mean(axis=0)
            H = (p_base - b_c).T @ (cur - c_c)
            U, _, Vt = np.linalg.svd(H)
            R_glob = Vt.T @ np.diag([1.0, np.linalg.det(Vt.T @ U.T)]) @ U.T
            best_fit = {
                "mirror": mirror,
                "rms": rms,
                "max_d": float(dists.max()),
                "mean_d": float(dists.mean()),
                "aligned_xy": cur,
                "R_glob": R_glob,
            }

print(
    f"Best OpenF1->TUMFTM ICP fit: mirror={best_fit['mirror']}, "
    f"mean_residual={best_fit['mean_d']:.2f}m, rms={best_fit['rms']:.2f}m, max={best_fit['max_d']:.2f}m"
)
assert best_fit["rms"] < 15.0, f"ICP alignment residual too large: {best_fit['rms']}"
op_aligned_xy = best_fit["aligned_xy"]

# Align TUMFTM travel direction & Start/Finish origin to OpenF1 index 0
_, i0 = tree_tum.query(op_aligned_xy[0])
tum_xy = np.roll(tum_xy, -i0, axis=0)
tum_wr = np.roll(tum_wr, -i0)
tum_wl = np.roll(tum_wl, -i0)

# Check travel tangent agreement at s=0
t_op = op_aligned_xy[3] - op_aligned_xy[0]
t_tum = tum_xy[3] - tum_xy[0]
if np.dot(t_op, t_tum) < 0:
    print("Reversing TUMFTM order to match F1 forward race direction (swapping left/right widths)...")
    tum_xy = np.vstack([tum_xy[0:1], tum_xy[1:][::-1]])
    wr_old, wl_old = tum_wr.copy(), tum_wl.copy()
    tum_wr = np.concatenate([wl_old[0:1], wl_old[1:][::-1]])
    tum_wl = np.concatenate([wr_old[0:1], wr_old[1:][::-1]])

# Map OpenF1 real 3D Z altitude onto TUMFTM centerline points
tree_op = cKDTree(op_aligned_xy)
d_z, idx_z = tree_op.query(tum_xy, k=3)
weights_z = 1.0 / np.maximum(0.5, d_z)
tum_z_raw = np.sum(op_z[idx_z] * weights_z, axis=1) / np.sum(weights_z, axis=1)


def close_and_spline(xu, yu, zu, wru=None, wlu=None):
    x_cl = np.append(xu, xu[0])
    y_cl = np.append(yu, yu[0])
    z_cl = np.append(zu, zu[0])
    ds = np.hypot(np.diff(x_cl), np.diff(y_cl))
    s_u = np.concatenate(([0.0], np.cumsum(ds)))
    out = [
        s_u,
        CubicSpline(s_u, x_cl, bc_type="periodic"),
        CubicSpline(s_u, y_cl, bc_type="periodic"),
        CubicSpline(s_u, z_cl, bc_type="periodic"),
    ]
    if wru is not None and wlu is not None:
        out.append(CubicSpline(s_u, np.append(wru, wru[0]), bc_type="periodic"))
        out.append(CubicSpline(s_u, np.append(wlu, wlu[0]), bc_type="periodic"))
    return out


# Resample to 1.0m periodic loop for Savitzky-Golay Z denoising
s0, cs_x0, cs_y0, cs_z0, cs_wr0, cs_wl0 = close_and_spline(tum_xy[:, 0], tum_xy[:, 1], tum_z_raw, tum_wr, tum_wl)
L0 = float(s0[-1])
N1 = int(round(L0))
s1 = np.linspace(0.0, L0, N1, endpoint=False)
x1 = cs_x0(s1)
y1 = cs_y0(s1)
z1_sm = savgol_filter(savgol_filter(cs_z0(s1), window_length=75, polyorder=3, mode="wrap"), window_length=55, polyorder=2, mode="wrap")
wr1 = np.clip(cs_wr0(s1), 4.5, 11.5)
wl1 = np.clip(cs_wl0(s1), 4.5, 11.5)

# ==============================================================================
# 3. TRANSFORM TO GAME FRAME (+Y up, +X fwd @ s=0, +Z right; T1 La Source RIGHT)
# ==============================================================================
print("\n=== STEP 3: Transforming Fused Geometry to Three.js Game Coordinate Frame ===")
gx0, gy0, gz0 = float(x1[0]), float(y1[0]), float(z1_sm[0])
dx_local = x1 - gx0
dy_local = y1 - gy0
dz_elev = z1_sm - gz0  # Start/Finish at y = 0.0

# Also shift aligned OpenF1 racing line into the exact same game frame for plotting comparison
op_local = op_aligned_xy - np.array([gx0, gy0])

# Rotate horizontally so heading at s=0 points along +X
ang0 = math.atan2(dy_local[2] - dy_local[-2], dx_local[2] - dx_local[-2])
c0, s0r = math.cos(-ang0), math.sin(-ang0)
game_x = c0 * dx_local - s0r * dy_local
game_z = s0r * dx_local + c0 * dy_local
game_y = dz_elev

op_gx = c0 * op_local[:, 0] - s0r * op_local[:, 1]
op_gz = s0r * op_local[:, 0] + c0 * op_local[:, 1]

# Check T1 La Source turn direction (s in [220, 520] should curve RIGHT = positive z)
i_ls_start = int(200)
i_ls_end = min(N1 - 1, int(520))
ls_z_sum = float(np.sum(game_z[i_ls_start:i_ls_end]))
if ls_z_sum < 0:
    print("Flipping Z axis so T1 La Source turns RIGHT (+Z, positive curvature in Three.js XZ plane)...")
    game_z = -game_z
    op_gz = -op_gz
    wr1, wl1 = wl1, wr1  # Right/left widths swap if reflection applied

# Verify final 0.5m Periodic Cubic Spline
s_f, cs_fx, cs_fz, cs_fy, cs_fwr, cs_fwl = close_and_spline(game_x, game_z, game_y, wr1, wl1)
L_fused = float(s_f[-1])
N_half = int(round(L_fused / 0.5))
s_half = np.linspace(0.0, L_fused, N_half, endpoint=False)

fx_05 = cs_fx(s_half)
fz_05 = cs_fz(s_half)
fy_05 = cs_fy(s_half)
fwr_05 = cs_fwr(s_half)
fwl_05 = cs_fwl(s_half)

fxp = cs_fx(s_half, 1)
fzp = cs_fz(s_half, 1)
fyp = cs_fy(s_half, 1)
fxpp = cs_fx(s_half, 2)
fzpp = cs_fz(s_half, 2)
vlen = np.hypot(fxp, fzp)
heading_05 = np.arctan2(fzp, fxp)
# In game XZ frame where right = (-sinH, cosH) = (-fzp, fxp), positive curvature = RIGHT turn:
kappa_05 = (fxp * fzpp - fzp * fxpp) / np.maximum(1e-6, vlen ** 3)
grade_05 = (fyp / np.maximum(1e-6, vlen)) * 100.0

fused_csv = os.path.join(SCRATCH_DIR, "spa_fused_0.5m.csv")
np.savetxt(
    fused_csv,
    np.column_stack([s_half, fx_05, fz_05, fy_05, fwl_05, fwr_05, heading_05, kappa_05, grade_05]),
    delimiter=",",
    header="s_m,x_m,z_m,y_m,w_left_m,w_right_m,heading_rad,curvature_1pm,grade_pct",
    comments="",
    fmt="%.6f",
)

print(
    f"Fused Length={L_fused:.2f}m ({N_half} pts @ 0.5m) | "
    f"X=[{fx_05.min():.1f}, {fx_05.max():.1f}], Z=[{fz_05.min():.1f}, {fz_05.max():.1f}], "
    f"Y=[{fy_05.min():.2f}, {fy_05.max():.2f}] (dY={fy_05.max() - fy_05.min():.2f}m)"
)

# Check clearance against all 4 hills in js/render.js
hills = [(-2150, 1850, 540), (2150, 1350, 480), (-2200, -1250, 510), (1650, -1450, 450)]
for hx, hz, hr in hills:
    md = float(np.min(np.hypot(fx_05 - hx, fz_05 - hz)))
    clearance = md - (hr * 1.2 + 20.0)
    print(f"  Hill ({hx}, {hz}, r={hr}): min_dist={md:.1f}m, clearance={clearance:+.1f}m")
    assert clearance > 0.0, f"Hill overlap at ({hx},{hz})!"

# Check width boundaries do not fold on themselves
tx_05, tz_05 = fxp / vlen, fzp / vlen
rx_05, rz_05 = -tz_05, tx_05
for side_lbl, w_arr, sgn in [("left", fwl_05, -1.0), ("right", fwr_05, 1.0)]:
    bx = fx_05 + rx_05 * sgn * w_arr
    bz = fz_05 + rz_05 * sgn * w_arr
    dx_b = np.roll(bx, -1) - bx
    dz_b = np.roll(bz, -1) - bz
    folds = int(np.sum(dx_b * tx_05 + dz_b * tz_05 <= 0.0))
    print(f"  Fused {side_lbl} edge fold check: folds={folds} (max width={w_arr.max():.2f}m)")

# ==============================================================================
# 4. GENERATE FUSED TUMFTM + OPENF1 VERIFICATION PLOT
# ==============================================================================
print("\n=== STEP 4: Generating Fused Spa Verification Figure ===")
fig = plt.figure(figsize=(18, 11.5), facecolor="#0b1120")
gs = fig.add_gridspec(3, 3, height_ratios=[2.2, 2.2, 1.3], width_ratios=[1.5, 1.5, 1.2], hspace=0.30, wspace=0.20)

left_bx = fx_05 - rx_05 * fwl_05
left_bz = fz_05 - rz_05 * fwl_05
right_bx = fx_05 + rx_05 * fwr_05
right_bz = fz_05 + rz_05 * fwr_05

ax_m = fig.add_subplot(gs[0:2, 0:2], facecolor="#0f172a")
ax_m.plot(left_bx, left_bz, "-", color="#64748b", lw=0.9, alpha=0.85, label="TUMFTM 左/右賽道邊界")
ax_m.plot(right_bx, right_bz, "-", color="#64748b", lw=0.9, alpha=0.85)
ax_m.plot(fx_05, fz_05, "-", color="#22d3ee", lw=2.0, label="融合中心線 (TUMFTM 幾何 + OpenF1 3D 高度)")
ax_m.plot(op_gx, op_gz, "--", color="#f97316", lw=1.3, alpha=0.85, label="OpenF1 F1 車手實際賽車線")
ax_m.scatter([0], [0], color="#facc15", s=90, zorder=6, label="起終點 Start/Finish (0,0,0)")

# Note in game XZ: invert Y axis when plotting Z so visual North-up right turns look intuitive
ax_m.invert_yaxis()
k_arr = int(1750 / 0.5)
ax_m.annotate("", xy=(fx_05[k_arr + 260], fz_05[k_arr + 260]), xytext=(fx_05[k_arr], fz_05[k_arr]), arrowprops=dict(arrowstyle="-|>", color="#facc15", lw=2.5, mutation_scale=18))

idx_ls = int(380 / 0.5)
idx_er = int(850 / 0.5) + int(np.argmin(fy_05[int(850 / 0.5):int(1150 / 0.5)]))
idx_lc = int(np.argmax(fy_05))
idx_pou = int(3500 / 0.5) + int(np.argmax(np.abs(kappa_05[int(3500 / 0.5):int(4200 / 0.5)])))
idx_st = int(np.argmin(fy_05))
idx_bus = int(6600 / 0.5) + int(np.argmax(np.abs(kappa_05[int(6600 / 0.5):int(6920 / 0.5)])))

for ipt, txt, off_px in [
    (idx_ls, "T1 La Source (右髮夾)", (-35, -34)),
    (idx_er, "Eau Rouge / Raidillon", (-160, 16)),
    (idx_lc, f"Les Combes (最高 {fy_05.max():+.1f}m)", (16, -12)),
    (idx_pou, "T10 Pouhon (雙左)", (-120, -18)),
    (idx_st, f"T15 Stavelot (最低 {fy_05.min():+.1f}m)", (-160, 18)),
    (idx_bus, "Bus Stop 減速彎", (20, 18)),
]:
    ax_m.scatter([fx_05[ipt]], [fz_05[ipt]], color="#f8fafc", s=38, zorder=7)
    ax_m.annotate(txt, xy=(fx_05[ipt], fz_05[ipt]), xytext=off_px, textcoords="offset points", color="#e2e8f0", fontsize=9.5, fontweight="bold", arrowprops=dict(arrowstyle="-", color="#64748b"), bbox=dict(boxstyle="round,pad=0.25", fc="#1e293b", ec="#475569", alpha=0.92))

ax_m.set_aspect("equal", adjustable="datalim")
ax_m.grid(True, color="#1e293b", linestyle="--", alpha=0.7)
ax_m.set_title(f"斯帕賽道終極融合中心線與真實路寬驗證圖 ({L_fused:.1f}m | 實測總高差 {fy_05.max() - fy_05.min():.2f}m)", color="#f8fafc", fontsize=13, fontweight="bold", pad=12)
ax_m.set_xlabel("遊戲世界座標 +X (m，起點切線方向)", color="#cbd5e1", fontsize=10)
ax_m.set_ylabel("遊戲世界座標 +Z (m，右側法線方向)", color="#cbd5e1", fontsize=10)
ax_m.tick_params(colors="#94a3b8")
ax_m.legend(loc="lower right", facecolor="#0f172a", edgecolor="#334155", labelcolor="#f1f5f9", fontsize=9.5)

for row_i, ci, ttl, hb in [
    (0, idx_ls, "放大 A：T1 La Source 與寬度邊界", 85),
    (1, idx_er + int(95 / 0.5), "放大 B：Eau Rouge - Raidillon", 130),
    (2, idx_bus, "放大 C：Bus Stop 減速彎", 95),
]:
    az = fig.add_subplot(gs[row_i, 2], facecolor="#0f172a")
    wi = (np.arange(ci - 450, ci + 450)) % N_half
    az.fill(np.concatenate([left_bx[wi], right_bx[wi][::-1]]), np.concatenate([left_bz[wi], right_bz[wi][::-1]]), color="#334155", alpha=0.45, label="真實路面寬度")
    az.plot(left_bx[wi], left_bz[wi], "-", color="#94a3b8", lw=1.0)
    az.plot(right_bx[wi], right_bz[wi], "-", color="#94a3b8", lw=1.0)
    az.plot(fx_05[wi], fz_05[wi], "-", color="#22d3ee", lw=2.2, label="中心線")
    az.plot(op_gx, op_gz, "--", color="#f97316", lw=1.4, label="F1 賽車線")
    cx_z, cz_z = fx_05[ci], fz_05[ci]
    az.set_xlim(cx_z - hb, cx_z + hb)
    az.set_ylim(cz_z + hb * 0.72, cz_z - hb * 0.72)  # matches inverted Z
    az.set_aspect("equal", adjustable="box")
    az.grid(True, color="#1e293b", linestyle=":")
    az.set_title(ttl, color="#f1f5f9", fontsize=10, fontweight="bold")
    az.tick_params(colors="#94a3b8", labelsize=8)
    if row_i == 0:
        az.legend(loc="lower right", facecolor="#0f172a", edgecolor="#334155", labelcolor="#f1f5f9", fontsize=8)

ax_e = fig.add_subplot(gs[2, 0:2], facecolor="#0f172a")
ax_e.fill_between(s_half, fy_05.min() - 5, fy_05, color="#10b981", alpha=0.18)
ax_e.plot(s_half, fy_05, "-", color="#34d399", lw=2.1, label="相對於起終點之高度 Y (m)（全場落差 102.3m）")
ax_e.set_xlim(0, L_fused)
ax_e.grid(True, color="#1e293b", linestyle="--", alpha=0.7)
ax_e.set_xlabel("賽道距離 s (m)", color="#cbd5e1", fontsize=10)
ax_e.set_ylabel("高度 Y (m)", color="#cbd5e1", fontsize=10)
ax_e.set_title(f"逐點路寬合計範圍 {(fwl_05 + fwr_05).min():.1f}m ~ {(fwl_05 + fwr_05).max():.1f}m | 高度 Y=[{fy_05.min():+.1f}m, {fy_05.max():+.1f}m]", color="#e2e8f0", fontsize=10.5, fontweight="bold")
ax_e.tick_params(colors="#94a3b8")
ax_e.legend(loc="upper right", facecolor="#0f172a", edgecolor="#334155", labelcolor="#f1f5f9", fontsize=9)

fig.subplots_adjust(left=0.055, right=0.98, top=0.93, bottom=0.06)
fused_png_scratch = os.path.join(SCRATCH_DIR, "spa_fused_verification.png")
fused_png_art = os.path.join(ARTIFACT_DIR, "spa_fused_verification.png")
fig.savefig(fused_png_scratch, dpi=160, facecolor=fig.get_facecolor())
shutil.copyfile(fused_png_scratch, fused_png_art)
plt.close(fig)

# ==============================================================================
# 5. EXPORT REAL 1:1 PBR BINARY GLB (assets/models/tracks/spa_francorchamps.glb)
# ==============================================================================
print("\n=== STEP 5: Exporting Real 1:1 PBR glTF 2.0 .glb Model ===")

def make_png_bytes(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

def tex_asphalt():
    rng = np.random.default_rng(42)
    base = np.full((256, 256, 3), 58, dtype=np.int16)
    noise = rng.integers(-14, 15, size=(256, 256, 1))
    arr = np.clip(base + noise, 25, 95).astype(np.uint8)
    return make_png_bytes(Image.fromarray(arr, mode="RGB"))

def tex_grass():
    rng = np.random.default_rng(7)
    base = np.zeros((256, 256, 3), dtype=np.int16)
    base[:, :, 0] = 28
    base[:, :, 1] = 68
    base[:, :, 2] = 32
    noise = rng.integers(-12, 13, size=(256, 256, 3))
    arr = np.clip(base + noise, 10, 120).astype(np.uint8)
    return make_png_bytes(Image.fromarray(arr, mode="RGB"))

def tex_kerb():
    img = Image.new("RGB", (64, 256))
    dr = ImageDraw.Draw(img)
    dr.rectangle([0, 0, 63, 127], fill=(220, 38, 38))
    dr.rectangle([0, 128, 63, 255], fill=(250, 204, 21))
    return make_png_bytes(img)

def tex_armco():
    img = Image.new("RGB", (64, 64), (185, 194, 205))
    dr = ImageDraw.Draw(img)
    dr.rectangle([0, 12, 63, 22], fill=(120, 130, 145))
    dr.rectangle([0, 40, 63, 50], fill=(120, 130, 145))
    return make_png_bytes(img)

def tex_gantry():
    img = Image.new("RGB", (512, 128), (15, 23, 42))
    dr = ImageDraw.Draw(img)
    dr.rectangle([0, 0, 511, 10], fill=(239, 68, 68))
    dr.rectangle([0, 118, 511, 127], fill=(250, 204, 21))
    for i in range(0, 512, 32):
        if (i // 32) % 2 == 0:
            dr.rectangle([i, 20, i + 31, 44], fill=(248, 250, 252))
            dr.rectangle([i, 84, i + 31, 108], fill=(248, 250, 252))
    dr.text((120, 54), "SPA-FRANCORCHAMPS // APEX PRO", fill=(56, 189, 248))
    return make_png_bytes(img)

# Stride 2.0m cross-sections along fused 0.5m loop -> ~3,502 rings (lean, super-smooth GLB)
stride = 4
idx_g = np.arange(0, N_half, stride)
M = len(idx_g)
s_g = s_half[idx_g]
gx = fx_05[idx_g]
gy = fy_05[idx_g]
gz = fz_05[idx_g]
wl_g = fwl_05[idx_g]
wr_g = fwr_05[idx_g]
tx_g, tz_g = tx_05[idx_g], tz_05[idx_g]
rx_g, rz_g = rx_05[idx_g], rz_05[idx_g]
kap_g = kappa_05[idx_g]
gnd_y = min(-20.0, float(gy.min()) - 10.0)


def build_ribbon(verts_l, verts_r, norms_l, norms_r, u_vals, v_repeat=0.16, two_sided=False):
    # verts_l/r shape (M, 3) around closed loop
    pos = np.empty((M * 2, 3), dtype=np.float32)
    nrm = np.empty((M * 2, 3), dtype=np.float32)
    uv = np.empty((M * 2, 2), dtype=np.float32)
    pos[0::2] = verts_l
    pos[1::2] = verts_r
    nrm[0::2] = norms_l
    nrm[1::2] = norms_r
    v_vals = (s_g * v_repeat).astype(np.float32)
    uv[0::2, 0] = u_vals[0]
    uv[0::2, 1] = v_vals
    uv[1::2, 0] = u_vals[1]
    uv[1::2, 1] = v_vals
    tris = []
    for i in range(M):
        ni = (i + 1) % M
        l0, r0, l1, r1 = 2 * i, 2 * i + 1, 2 * ni, 2 * ni + 1
        tris.append((l0, l1, r0))
        tris.append((r0, l1, r1))
        if two_sided:
            tris.append((l0, r0, l1))
            tris.append((r0, r1, l1))
    return pos, nrm, uv, np.array(tris, dtype=np.uint32).ravel()


# Approximate terrain slope normal per cross section (up along +Y tilted lightly by tangent grade)
up_nrm = np.column_stack([np.zeros(M), np.ones(M), np.zeros(M)]).astype(np.float32)

# 1. Asphalt Road Mesh
vL_road = np.column_stack([gx - rx_g * wl_g, gy, gz - rz_g * wl_g])
vR_road = np.column_stack([gx + rx_g * wr_g, gy, gz + rz_g * wr_g])
p_road, n_road, u_road, i_road = build_ribbon(vL_road, vR_road, up_nrm, up_nrm, (0.0, 2.5), v_repeat=0.12)

# 2. Grass Runoff + Embankment Skirt (Left + Right combined, curvature-safe outer offset prevents inner hairpin pinch)
def safe_outer_dist(base_w, extra_d, side_sgn):
    raw_d = base_w + extra_d
    # Inside turn condition: sign(kap_g) == sign(side_sgn); limit total dist to 0.78 / |kap|
    inside = (kap_g * side_sgn) > 1e-4
    max_safe = np.where(inside, 0.78 / np.maximum(1e-4, np.abs(kap_g)), 1e6)
    clamped = np.maximum(base_w + 1.5, np.minimum(raw_d, max_safe))
    return savgol_filter(clamped, window_length=15, polyorder=2, mode="wrap")

def build_grass_shoulder(side_sgn, w_arr):
    # Inner edge at +/- w, outer edge at +/- safe_outer_dist, skirt down to gnd_y
    outer_d = safe_outer_dist(w_arr, 12.0, side_sgn)
    ix = gx + rx_g * side_sgn * w_arr
    iz = gz + rz_g * side_sgn * w_arr
    ox = gx + rx_g * side_sgn * outer_d
    oz = gz + rz_g * side_sgn * outer_d
    pos = np.empty((M * 3, 3), dtype=np.float32)
    nrm = np.empty((M * 3, 3), dtype=np.float32)
    uv = np.empty((M * 3, 2), dtype=np.float32)
    pos[0::3] = np.column_stack([ix, gy - 0.03, iz])
    pos[1::3] = np.column_stack([ox, gy - 0.14, oz])
    pos[2::3] = np.column_stack([ox, np.full(M, gnd_y), oz])
    nrm[0::3] = [0.0, 1.0, 0.0]
    nrm[1::3] = [0.0, 0.9, 0.0]
    nrm[2::3] = np.column_stack([rx_g * side_sgn, np.full(M, 0.25), rz_g * side_sgn])
    nrm[2::3] /= np.linalg.norm(nrm[2::3], axis=1, keepdims=True)
    v_vals = (s_g * 0.10).astype(np.float32)
    uv[0::3] = np.column_stack([np.zeros(M), v_vals])
    uv[1::3] = np.column_stack([np.full(M, 2.0), v_vals])
    uv[2::3] = np.column_stack([np.full(M, 4.0), v_vals + 2.0])
    tris = []
    for i in range(M):
        ni = (i + 1) % M
        a0, b0, c0 = 3 * i, 3 * i + 1, 3 * i + 2
        a1, b1, c1 = 3 * ni, 3 * ni + 1, 3 * ni + 2
        if side_sgn > 0:
            tris.extend([(a0, a1, b0), (b0, a1, b1), (b0, b1, c0), (c0, b1, c1)])
        else:
            tris.extend([(b0, b1, a0), (a0, b1, a1), (c0, c1, b0), (b0, c1, b1)])
    return pos, nrm, uv, np.array(tris, dtype=np.uint32).ravel()

p_gl, n_gl, u_gl, i_gl = build_grass_shoulder(-1.0, fwl_05[idx_g])
p_gr, n_gr, u_gr, i_gr = build_grass_shoulder(1.0, fwr_05[idx_g])
p_grass = np.vstack([p_gl, p_gr])
n_grass = np.vstack([n_gl, n_gr])
u_grass = np.vstack([u_gl, u_gr])
i_grass = np.concatenate([i_gl, i_gr + len(p_gl)])

# 3. Belgian Red/Yellow Apex Kerbs on high-curvature runs
kerb_pos_l, kerb_nrm_l, kerb_uv_l, kerb_idx_l = [], [], [], []
v_off = 0
for side_sgn, w_arr, target_sgn in [(-1.0, wl_g, -1.0), (1.0, wr_g, 1.0)]:
    # Include both inside apex and outer exit zones where |kappa| > 0.0025
    in_k = np.abs(kap_g) > 0.0025
    i = 0
    while i < M:
        if not in_k[i]:
            i += 1
            continue
        j = i
        while j < M and in_k[j]:
            j += 1
        if j - i >= 2:
            seg = np.arange(i, j)
            ns = len(seg)
            inner_w = w_arr[seg] - 0.15
            outer_w = w_arr[seg] + 1.25
            ix = gx[seg] + rx_g[seg] * side_sgn * np.minimum(inner_w, outer_w)
            iz = gz[seg] + rz_g[seg] * side_sgn * np.minimum(inner_w, outer_w)
            ox = gx[seg] + rx_g[seg] * side_sgn * np.maximum(inner_w, outer_w)
            oz = gz[seg] + rz_g[seg] * side_sgn * np.maximum(inner_w, outer_w)
            pv = np.empty((ns * 2, 3), dtype=np.float32)
            nv = np.tile([0.0, 1.0, 0.0], (ns * 2, 1)).astype(np.float32)
            uvv = np.empty((ns * 2, 2), dtype=np.float32)
            pv[0::2] = np.column_stack([ix, gy[seg] + 0.035, iz])
            pv[1::2] = np.column_stack([ox, gy[seg] + 0.065, oz])
            vv = (s_g[seg] * 0.35).astype(np.float32)
            uvv[0::2] = np.column_stack([np.zeros(ns), vv])
            uvv[1::2] = np.column_stack([np.ones(ns), vv])
            tl = []
            for k in range(ns - 1):
                a, b, c, d = v_off + 2 * k, v_off + 2 * k + 1, v_off + 2 * k + 2, v_off + 2 * k + 3
                if side_sgn > 0:
                    tl.extend([a, c, b, b, c, d])
                else:
                    tl.extend([b, c, a, d, c, b])
            kerb_pos_l.append(pv); kerb_nrm_l.append(nv); kerb_uv_l.append(uvv)
            kerb_idx_l.append(np.array(tl, dtype=np.uint32))
            v_off += ns * 2
        i = j

p_kerb = np.vstack(kerb_pos_l)
n_kerb = np.vstack(kerb_nrm_l)
u_kerb = np.vstack(kerb_uv_l)
i_kerb = np.concatenate(kerb_idx_l)

# 4. Armco Steel Guardrails (outer edge safely bounded on tight inner apexes, height 0.15..1.05m)
def build_armco(side_sgn, w_arr):
    dist = safe_outer_dist(w_arr, 11.4, side_sgn) - 0.5
    ax = gx + rx_g * side_sgn * dist
    az = gz + rz_g * side_sgn * dist
    nx_a = np.column_stack([-rx_g * side_sgn, np.zeros(M), -rz_g * side_sgn]).astype(np.float32)
    vb = np.column_stack([ax, gy + 0.15, az])
    vt = np.column_stack([ax, gy + 1.05, az])
    return build_ribbon(vb, vt, nx_a, nx_a, (0.0, 1.0), v_repeat=0.25, two_sided=True)

p_al, n_al, u_al, i_al = build_armco(-1.0, wl_g)
p_ar, n_ar, u_ar, i_ar = build_armco(1.0, wr_g)
p_armco = np.vstack([p_al, p_ar])
n_armco = np.vstack([n_al, n_ar])
u_armco = np.vstack([u_al, u_ar])
i_armco = np.concatenate([i_al, i_ar + len(p_al)])

# 5. Start/Finish Gantry & Pit Straight Signboard (at s=0)
def make_box_mesh(cx, cy, cz, sx, sy, sz):
    hx, hy, hz = sx * 0.5, sy * 0.5, sz * 0.5
    # 24 verts (4 per face for crisp flat normals)
    faces = [
        ([0, 0, 1], [(-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz)]),
        ([0, 0, -1], [(hx, -hy, -hz), (-hx, -hy, -hz), (-hx, hy, -hz), (hx, hy, -hz)]),
        ([1, 0, 0], [(hx, -hy, hz), (hx, -hy, -hz), (hx, hy, -hz), (hx, hy, hz)]),
        ([-1, 0, 0], [(-hx, -hy, -hz), (-hx, -hy, hz), (-hx, hy, hz), (-hx, hy, -hz)]),
        ([0, 1, 0], [(-hx, hy, hz), (hx, hy, hz), (hx, hy, -hz), (-hx, hy, -hz)]),
        ([0, -1, 0], [(-hx, -hy, -hz), (hx, -hy, -hz), (hx, -hy, hz), (-hx, -hy, hz)]),
    ]
    pts, nrms, uvs, idxs = [], [], [], []
    for fi, (fn, quad) in enumerate(faces):
        base = fi * 4
        for qi, (vx, vy, vz) in enumerate(quad):
            pts.append([cx + vx, cy + vy, cz + vz])
            nrms.append(fn)
            uvs.append([(0.0, 1.0, 1.0, 0.0)[qi], (1.0, 1.0, 0.0, 0.0)[qi]])
        idxs.extend([base, base + 1, base + 2, base, base + 2, base + 3])
    return np.array(pts, dtype=np.float32), np.array(nrms, dtype=np.float32), np.array(uvs, dtype=np.float32), np.array(idxs, dtype=np.uint32)

# Overhead gantry centered across start/finish (s=0 is along +X, width along Z)
span_z = float(fwl_05[0] + fwr_05[0]) + 4.0
mid_z = float(fwr_05[0] - fwl_05[0]) * 0.5
b1 = make_box_mesh(0.0, 6.2, mid_z, 1.6, 1.6, span_z)
b2 = make_box_mesh(0.0, 3.1, -fwl_05[0] - 1.5, 1.1, 6.4, 1.1)
b3 = make_box_mesh(0.0, 3.1, fwr_05[0] + 1.5, 1.1, 6.4, 1.1)
p_gan = np.vstack([b1[0], b2[0], b3[0]])
n_gan = np.vstack([b1[1], b2[1], b3[1]])
u_gan = np.vstack([b1[2], b2[2], b3[2]])
i_gan = np.concatenate([b1[3], b2[3] + len(b1[0]), b3[3] + len(b1[0]) + len(b2[0])])


def write_glb(out_path, meshes_spec, images_png):
    bin_chunks = bytearray()
    buffer_views = []
    accessors = []
    images = []
    textures = []
    materials = []
    meshes = []
    nodes = []

    def append_bytes(b, target=None):
        while len(bin_chunks) % 4 != 0:
            bin_chunks.append(0)
        off = len(bin_chunks)
        bin_chunks.extend(b)
        bv = {"buffer": 0, "byteOffset": off, "byteLength": len(b)}
        if target is not None:
            bv["target"] = target
        idx = len(buffer_views)
        buffer_views.append(bv)
        return idx

    for name, png_b in images_png:
        bv_i = append_bytes(png_b)
        images.append({"bufferView": bv_i, "mimeType": "image/png", "name": name})
        textures.append({"source": len(images) - 1, "sampler": 0})

    for mi, spec in enumerate(meshes_spec):
        pos, nrm, uv, ind = spec["pos"], spec["nrm"], spec["uv"], spec["idx"]
        bv_p = append_bytes(pos.tobytes(), 34962)
        bv_n = append_bytes(nrm.tobytes(), 34962)
        bv_u = append_bytes(uv.tobytes(), 34962)
        bv_i = append_bytes(ind.tobytes(), 34963)

        acc_p = len(accessors)
        accessors.append({
            "bufferView": bv_p, "componentType": 5126, "count": len(pos), "type": "VEC3",
            "min": [float(x) for x in pos.min(axis=0)], "max": [float(x) for x in pos.max(axis=0)]
        })
        acc_n = len(accessors)
        accessors.append({"bufferView": bv_n, "componentType": 5126, "count": len(nrm), "type": "VEC3"})
        acc_u = len(accessors)
        accessors.append({"bufferView": bv_u, "componentType": 5126, "count": len(uv), "type": "VEC2"})
        acc_i = len(accessors)
        accessors.append({"bufferView": bv_i, "componentType": 5125, "count": len(ind), "type": "SCALAR"})

        mat = {
            "name": spec["mat_name"],
            "pbrMetallicRoughness": {
                "baseColorTexture": {"index": spec["tex_idx"]},
                "metallicFactor": spec["metallic"],
                "roughnessFactor": spec["roughness"],
            },
            "doubleSided": spec.get("double_sided", False),
        }
        mat_idx = len(materials)
        materials.append(mat)

        meshes.append({
            "name": spec["name"],
            "primitives": [{
                "attributes": {"POSITION": acc_p, "NORMAL": acc_n, "TEXCOORD_0": acc_u},
                "indices": acc_i,
                "material": mat_idx,
            }]
        })
        nodes.append({"name": spec["name"], "mesh": mi})

    while len(bin_chunks) % 4 != 0:
        bin_chunks.append(0)

    gltf_json = {
        "asset": {"version": "2.0", "generator": "ApexPro-TUMFTM-OpenF1-SpaBuilder"},
        "scene": 0,
        "scenes": [{"name": "Spa_Francorchamps_1to1", "nodes": list(range(len(nodes)))}],
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "textures": textures,
        "images": images,
        "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}],
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(bin_chunks)}],
    }

    json_bytes = json.dumps(gltf_json, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4 != 0:
        json_bytes += b" "

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_chunks)
    with open(out_path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total_len))
        f.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
        f.write(json_bytes)
        f.write(struct.pack("<II", len(bin_chunks), 0x004E4942))
        f.write(bin_chunks)


glb_out = os.path.join(TRACKS_DIR, "spa_francorchamps.glb")
write_glb(
    glb_out,
    meshes_spec=[
        {"name": "Spa_Asphalt", "mat_name": "Mat_Asphalt", "tex_idx": 0, "metallic": 0.05, "roughness": 0.78, "pos": p_road, "nrm": n_road, "uv": u_road, "idx": i_road},
        {"name": "Spa_Grass_Runoff_Skirt", "mat_name": "Mat_Grass", "tex_idx": 1, "metallic": 0.02, "roughness": 0.92, "pos": p_grass, "nrm": n_grass, "uv": u_grass, "idx": i_grass},
        {"name": "Spa_Kerbs_RedYellow", "mat_name": "Mat_Kerb", "tex_idx": 2, "metallic": 0.05, "roughness": 0.65, "pos": p_kerb, "nrm": n_kerb, "uv": u_kerb, "idx": i_kerb},
        {"name": "Spa_Armco_Barriers", "mat_name": "Mat_Armco", "tex_idx": 3, "metallic": 0.72, "roughness": 0.38, "double_sided": True, "pos": p_armco, "nrm": n_armco, "uv": u_armco, "idx": i_armco},
        {"name": "Spa_Start_Gantry", "mat_name": "Mat_Gantry", "tex_idx": 4, "metallic": 0.25, "roughness": 0.55, "pos": p_gan, "nrm": n_gan, "uv": u_gan, "idx": i_gan},
    ],
    images_png=[
        ("asphalt_png", tex_asphalt()),
        ("grass_png", tex_grass()),
        ("kerb_png", tex_kerb()),
        ("armco_png", tex_armco()),
        ("gantry_png", tex_gantry()),
    ],
)
print(f"Exported clean 1:1 PBR glTF 2.0 model: {glb_out} ({os.path.getsize(glb_out):,} bytes)")

# ==============================================================================
# 6. GENERATE VERIFIED GAME-SAFE CATMULL-ROM WAYPOINTS FOR js/circuits.js
# ==============================================================================
print("\n=== STEP 6: Exporting Verified Catmull-Rom Waypoints (Zero Fold Audit) ===")
# Pick ~140 curvature-adaptive waypoints along the 7,008m centerline (denser at tight corners!)
dens_weights = 1.0 + 3.5 * np.minimum(1.0, np.abs(kappa_05) / 0.02)
cum_w = np.concatenate([[0.0], np.cumsum(dens_weights[:-1])])
N_wp = 140
wp_targets = np.linspace(0.0, cum_w[-1], N_wp, endpoint=False)
wp_idx = np.clip(np.searchsorted(cum_w, wp_targets), 0, N_half - 1)
wp_idx[0] = 0

wp_x = fx_05[wp_idx].copy()
wp_y = fy_05[wp_idx].copy()
wp_z = fz_05[wp_idx].copy()
wp_s = s_half[wp_idx].copy()

def eval_catmull_1040(wx, wy, wz):
    def cr(p0, p1, p2, p3, t):
        t2, t3 = t * t, t * t * t
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    TS = 1040
    Nw = len(wx)
    rx, ry, rz = np.empty(TS), np.empty(TS), np.empty(TS)
    for i in range(TS):
        u = (i / TS) * Nw
        idx = int(u)
        f = u - idx
        rx[i] = cr(wx[(idx - 1) % Nw], wx[idx % Nw], wx[(idx + 1) % Nw], wx[(idx + 2) % Nw], f)
        ry[i] = cr(wy[(idx - 1) % Nw], wy[idx % Nw], wy[(idx + 1) % Nw], wy[(idx + 2) % Nw], f)
        rz[i] = cr(wz[(idx - 1) % Nw], wz[idx % Nw], wz[(idx + 1) % Nw], wz[(idx + 2) % Nw], f)
    # Compute exact verify_track_geometry fold count with width=16.0 (halfW=8.0, runoff=20.0)
    dx_t = np.roll(rx, -1) - np.roll(rx, 1)
    dz_t = np.roll(rz, -1) - np.roll(rz, 1)
    tl = np.hypot(dx_t, dz_t)
    dirX, dirZ = dx_t / tl, dz_t / tl
    rightX, rightZ = -dirZ, dirX
    r_folds = 0
    for side in (-1.0, 1.0):
        bx = rx + rightX * side * 20.0
        bz = rz + rightZ * side * 20.0
        dx2 = np.roll(bx, -1) - bx
        dz2 = np.roll(bz, -1) - bz
        r_folds += int(np.sum(dx2 * dirX + dz2 * dirZ <= 0.0))
    return rx, ry, rz, dirX, dirZ, rightX, rightZ, r_folds

# Gentle local waypoint relaxation ONLY on segments where runoff 20m edge would fold
for it in range(25):
    rx, ry, rz, dirX, dirZ, rightX, rightZ, r_folds = eval_catmull_1040(wp_x, wp_y, wp_z)
    if r_folds == 0:
        break
    # Find tightest fold index & slightly smooth neighbor waypoints
    for side in (-1.0, 1.0):
        bx = rx + rightX * side * 20.0
        bz = rz + rightZ * side * 20.0
        dx2 = np.roll(bx, -1) - bx
        dz2 = np.roll(bz, -1) - bz
        bad = np.where((dx2 * dirX + dz2 * dirZ) <= 0.0)[0]
        for bi in bad:
            wi = int(round((bi / 1040.0) * N_wp)) % N_wp
            # Smooth local triangle keeping straight directions aligned
            wp_x[wi] = 0.55 * wp_x[wi] + 0.225 * wp_x[(wi - 1) % N_wp] + 0.225 * wp_x[(wi + 1) % N_wp]
            wp_z[wi] = 0.55 * wp_z[wi] + 0.225 * wp_z[(wi - 1) % N_wp] + 0.225 * wp_z[(wi + 1) % N_wp]

rx, ry, rz, dirX, dirZ, rightX, rightZ, r_folds = eval_catmull_1040(wp_x, wp_y, wp_z)
assert r_folds == 0, f"Runoff folds remained: {r_folds}"
game_len = float(np.sum(np.hypot(np.roll(rx, -1) - rx, np.roll(rz, -1) - rz)))
print(f"Catmull-Rom {N_wp} waypoints @ width=16m verified: len={game_len:.1f}m, y=[{ry.min():.2f}, {ry.max():.2f}] (dY={ry.max() - ry.min():.2f}m), runoff_folds={r_folds}")

# Sector & corner naming across true Spa distances (~7,008m)
CORNER_NAMES = [
    (0, 190, "T1 斯帕起跑下坡直道 // 對準 La Source 髮夾彎重煞區"),
    (190, 440, "T1 拉索斯髮夾彎 La Source // 重煞貼緊內側路緣石、提早回正出彎"),
    (440, 820, "T1B 拉索斯出彎下坡加速段 // 順著下坡直衝紅水河谷"),
    (820, 1040, "T2 艾爾羅格河谷壓縮點 Eau Rouge // 全油門壓入左彎谷底"),
    (1040, 1320, "T3-T4 雷迪永陡坡盲彎 Raidillon (+14.5%) // 全油門爬升盲彎頂點"),
    (1320, 2380, "T5 凱梅爾高原大直道 Kemmel Straight // 阿登高原尾流極速超車區"),
    (2380, 2720, "T7-T9 萊斯康布最高點減速彎 Les Combes // 全場海拔最高點重煞左-右切換"),
    (2720, 3260, "T10 布魯塞爾長右彎 Bruxelles // 長下坡複合彎耐心含油"),
    (3260, 3680, "T11 雙向速度轉換區 // 準備高速切入雙左普昂彎"),
    (3680, 4220, "T12 普昂雙頂點高速左彎 Pouhon // 高 G 力五檔高速極限考驗"),
    (4220, 4920, "T13-T14 法格尼奧連續 S 彎 Campus / Fagnes // 右-左連續節奏重心轉移"),
    (4920, 5340, "T15 斯塔夫洛谷底右彎 Stavelot (全場最低谷底) // 出彎全油門加速決定回程尾速"),
    (5340, 6540, "T16-T17 保羅弗雷爾與布朗希蒙高速森林彎 Blanchimont // 膽量測試全油門左弧彎"),
    (6540, 6860, "T18-T19 公車站減速彎 Bus Stop Chicane // 全場最後重煞超車點！"),
    (6860, 7200, "T20 斯帕終點直線衝刺 // 全油門衝過起終點龍門架"),
]

def name_for_s(sv):
    for s0_, s1_, nm in CORNER_NAMES:
        if s0_ <= sv < s1_:
            return nm
    return CORNER_NAMES[-1][2]

# Compute realistic GT3 corner target speed vTarget from local waypoint curvature
wp_lines = []
for i in range(N_wp):
    p_prev = np.array([wp_x[(i - 1) % N_wp], wp_z[(i - 1) % N_wp]])
    p_curr = np.array([wp_x[i], wp_z[i]])
    p_next = np.array([wp_x[(i + 1) % N_wp], wp_z[(i + 1) % N_wp]])
    a1 = math.atan2(p_curr[1] - p_prev[1], p_curr[0] - p_prev[0])
    a2 = math.atan2(p_next[1] - p_curr[1], p_next[0] - p_curr[0])
    da = a2 - a1
    while da > math.pi: da -= 2 * math.pi
    while da < -math.pi: da += 2 * math.pi
    dlen = float(np.linalg.norm(p_next - p_prev)) or 1.0
    k_loc = abs(da) / dlen
    if k_loc < 0.002:
        vt = 295
    else:
        vt = int(max(68, min(295, round(math.sqrt(1.38 * 9.81 / k_loc) * 3.6))))
    wp_lines.append(
        f'            {{ x: {wp_x[i]:.2f}, y: {wp_y[i]:.2f}, z: {wp_z[i]:.2f}, vTarget: {vt}, name: "{name_for_s(wp_s[i])}" }}'
    )

wp_out_path = os.path.join(SCRATCH_DIR, "spa_waypoints_js.txt")
with open(wp_out_path, "w", encoding="utf-8") as f:
    f.write(",\n".join(wp_lines) + "\n")
print(f"Saved {N_wp} Catmull-Rom waypoints to: {wp_out_path}")
