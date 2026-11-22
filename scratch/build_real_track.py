"""Generalized 1:1 Real Track Builder (OpenF1 3D Elevation x TUMFTM Centerline/Width).

Builds verified zero-fold PBR .glb models and Catmull-Rom waypoints for:
  - monza      (OpenF1 9590, TUMFTM Monza.csv)
  - suzuka     (OpenF1 9496, TUMFTM Suzuka.csv, figure-8 overpass separation)
  - silverstone(OpenF1 9558, TUMFTM Silverstone.csv)
  - interlagos (OpenF1 9636, TUMFTM SaoPaulo.csv)
  - spielberg  (OpenF1 9550, TUMFTM Spielberg.csv)
  - cota       (OpenF1 9617, TUMFTM Austin.csv)
"""

import csv
import io
import json
import math
import os
import re
import shutil
import struct
import time
from datetime import datetime, timedelta

import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm
import matplotlib.pyplot as plt
import numpy as np
import requests
from PIL import Image, ImageDraw
from scipy.interpolate import CubicSpline
from scipy.signal import savgol_filter
from scipy.spatial import cKDTree

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(BASE_DIR, ".fastf1_cache")
TRACKS_DIR = os.path.join(BASE_DIR, "assets", "models", "tracks")
SCRATCH_DIR = os.path.join(BASE_DIR, "scratch")
ARTIFACT_DIR = r"C:\Users\raymo\.gemini\antigravity\brain\cfd58b47-e6c4-4542-a9aa-430b016e1717"

os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(TRACKS_DIR, exist_ok=True)
os.makedirs(SCRATCH_DIR, exist_ok=True)

available_fonts = {f.name for f in fm.fontManager.ttflist}
if "Microsoft JhengHei" in available_fonts:
    plt.rcParams["font.sans-serif"] = ["Microsoft JhengHei", "DejaVu Sans"]
else:
    plt.rcParams["font.sans-serif"] = ["DejaVu Sans"]
plt.rcParams["axes.unicode_minus"] = False

TRACK_CONFIGS = [
    {
        "id": "monza",
        "title": "蒙札 Monza",
        "session_key": 9590,
        "tum_file": "Monza.csv",
        "width": 16.0,
        "n_wp": 125,
        "t1_sign": 1,  # T1 Rettifilo right entry
        "is_figure8": False,
        "glb_name": "monza.glb",
        "gantry_text": "MONZA AUTODROMO // APEX PRO",
        "kerb_colors": ((220, 38, 38), (248, 250, 252)),
        "corner_names": [
            (0, 720, "T0 起跑衝刺大直線 Rettifilo // 全油門突破 315 km/h 極速測試區"),
            (720, 1280, "T1-T2 雷蒂菲洛第一減速彎 Variante del Rettifilo // 全場最重煞超車點（右-左切換）"),
            (1280, 1980, "T3 格蘭德高速大右弧灣 Curva Grande // 四檔至五檔全油門高速承受側向 G 力"),
            (1980, 2380, "T4-T5 羅吉亞第二減速彎 Variante della Roggia // 林蔭重煞左-右緊湊切換"),
            (2380, 2760, "T6 第一萊斯莫右彎 Lesmo 1 // 吃進紅白路緣石後提早補油"),
            (2760, 3220, "T7 第二萊斯莫急右彎 Lesmo 2 // 晚頂點 Late Apex 決定塞拉利奧長直道尾速"),
            (3220, 4120, "T7B 塞拉利奧林蔭高速段 Curva del Serraglio // 全油門直線尾流極速區"),
            (4120, 4640, "T8-T10 阿斯卡里三連高速彎 Variante Ascari // 左-右-左連續高速重心轉換"),
            (4640, 5200, "T10B 後大直線衝刺 // 全油門逼近 310 km/h 準備進阿爾博雷托彎"),
            (5200, 5600, "T11 帕拉波利卡拋物線右彎 Parabolica / Alboreto // 漸進收油帶煞滑入 Apex 再全油門出彎"),
            (5600, 6200, "起終點大直線衝刺 // 全油門通過終點龍門架"),
        ],
    },
    {
        "id": "suzuka",
        "title": "鈴鹿 Suzuka",
        "session_key": 9496,
        "tum_file": "Suzuka.csv",
        "width": 16.0,
        "n_wp": 135,
        "t1_sign": 1,  # T1 First Curve right
        "is_figure8": True,
        "glb_name": "suzuka_circuit.glb",
        "gantry_text": "SUZUKA CIRCUIT // APEX PRO",
        "kerb_colors": ((220, 38, 38), (248, 250, 252)),
        "corner_names": [
            (0, 420, "T0 鈴鹿起跑下坡大直線 // 全油門俯衝準備高速帶煞入第一彎"),
            (420, 880, "T1-T2 第一與第二彎 First Curve // 雙頂點遞減半徑長右彎（極限約 130 km/h）"),
            (880, 1780, "T3-T7 蛇行連續 S 彎 S-Curves & Reverse // 左右節奏流暢轉換，切忌貪快外拋"),
            (1780, 2240, "T7 鄧祿普高速長爬坡左彎 Dunlop Curve // 高Ｇ力持續左彎爬坡出彎"),
            (2240, 2720, "T8-T9 德格納雙右彎 Degner 1 & 2 // 精準點煞切入內線準備穿越立體橋下涵洞"),
            (2720, 3140, "T10 立體交叉橋下加速與重煞區 // 穿越西直道橋下直衝 11 號髮夾彎"),
            (3140, 3440, "T11 鈴鹿髮夾彎 Hairpin // 全場最慢低速左髮夾，耐心等待車頭回正再全油門"),
            (3440, 4040, "T12 200R 高速右弧彎 // 全油門高速弧線逼近湯匙彎重煞區"),
            (4040, 4560, "T13-T14 湯匙雙頂點左彎 Spoon Curve // 雙頂點長左彎，出彎牽引力決定西直道極速"),
            (4560, 5050, "T14B 西直道立體跨線大橋 // 跨越德格納上層高架高速直奔 130R！"),
            (5050, 5350, "T15 130R 超高速左彎 // 高速膽量考驗彎，微收油門或全油門切過內緣"),
            (5350, 5660, "T16-T18 卡西歐三角減速彎 Casio Triangle // 全場最關鍵重煞右-左最後超車點"),
            (5660, 6200, "T18 最終下坡直線 // 全油門衝過起終點龍門架"),
        ],
    },
    {
        "id": "silverstone",
        "title": "銀石 Silverstone",
        "session_key": 9558,
        "tum_file": "Silverstone.csv",
        "width": 16.0,
        "n_wp": 130,
        "t1_sign": 1,  # T1 Abbey right
        "is_figure8": False,
        "glb_name": "silverstone.glb",
        "gantry_text": "SILVERSTONE GP // APEX PRO",
        "kerb_colors": ((24, 24, 27), (248, 250, 252)),
        "corner_names": [
            (0, 320, "T0 漢密爾頓起跑大直線 Hamilton Straight // 全油門直衝一號阿比高速右彎"),
            (320, 920, "T1-T4 阿比彎與法姆連續彎 Abbey / Farm / Village / The Loop // 進入技術區核心超車點"),
            (920, 1840, "T5-T6 威靈頓長直道與布魯克蘭茲減速區 Wellington Straight / Brooklands // 尾流高速衝刺後重煞左彎"),
            (1840, 2520, "T7-T9 勒菲爾德與伍德科特彎 Luffield & Woodcote // 長弧右彎銜接舊起終點直道"),
            (2520, 2940, "T9 科普斯超高Ｇ力右彎 Copse // 五檔高Ｇ力盲頂高速右彎（吃盡左側進場路緣石）"),
            (2940, 3680, "T10-T14 馬戈茨—貝克茨—查佩爾經典連續 S 彎 Maggotts / Becketts / Chapel // F1 殿堂級極速重心連續切換！"),
            (3680, 4560, "T14B 機棚大直線 Hangar Straight // 全場最高極速路段，準備重煞入斯托彎"),
            (4560, 5020, "T15 斯托高速右彎 Stowe // 高速煞車貼緊內側路緣石出彎"),
            (5020, 5980, "T16-T18 韋爾與俱樂部組合彎 Vale / Club // 重煞左-右雙頂點急彎後全力出彎衝刺終點線！"),
        ],
    },
    {
        "id": "interlagos",
        "title": "英特拉格斯 Interlagos",
        "session_key": 9636,
        "tum_file": "SaoPaulo.csv",
        "width": 15.5,
        "n_wp": 120,
        "t1_sign": -1,  # T1 Senna S left (CCW)
        "is_figure8": False,
        "glb_name": "interlagos.glb",
        "gantry_text": "INTERLAGOS SAO PAULO // APEX PRO",
        "kerb_colors": ((22, 163, 74), (250, 204, 21)),
        "corner_names": [
            (0, 320, "T0 起跑爬坡直線 // 逆時針全油門衝向洗拿 S 彎重煞區"),
            (320, 760, "T1-T3 洗拿 S 連續下坡彎 Senna S & Curva do Sol // 重煞下坡左-右切換後全油門加速"),
            (760, 1520, "T3B 太陽長直線 Reta Oposta // 下坡極速尾流超車長直道！"),
            (1520, 1980, "T4-T5 拉戈彎 Descida do Lago // 重煞左轉連續弧線"),
            (1980, 2680, "T6-T7 費拉杜拉與拉蘭吉尼亞雙右彎 Ferradura / Laranjinha // 中速技術下坡節奏段"),
            (2680, 3260, "T8-T10 皮涅里尼奧與比科德帕托髮夾段 Pinheirinho / Bico de Pato // 上下起伏連續急彎精準出彎"),
            (3260, 3700, "T11-T12 梅爾古略與容桑左彎 Mergulho / Juncao // 重煞切過最後急左彎準備長距離爬坡！"),
            (3700, 4450, "T13-T15 蘇比達多斯波希斯高速爬坡弧道 Subida dos Boxes // 全油門貼左爬坡衝過終點線"),
        ],
    },
    {
        "id": "spielberg",
        "title": "紅牛環 Red Bull Ring",
        "session_key": 9550,
        "tum_file": "Spielberg.csv",
        "width": 15.5,
        "n_wp": 105,
        "t1_sign": 1,  # T1 Niki Lauda right
        "is_figure8": False,
        "glb_name": "red_bull_ring.glb",
        "gantry_text": "RED BULL RING // APEX PRO",
        "kerb_colors": ((220, 38, 38), (248, 250, 252)),
        "corner_names": [
            (0, 320, "T0 阿爾卑斯上坡大直線 // 全油門陡坡攀升衝向一號彎重煞點"),
            (320, 620, "T1 尼基勞達一號右彎 Niki Lauda Kurve // 急上坡右直角彎，小心出彎過度偏外"),
            (620, 1340, "T2 雷姆斯長上坡直線 // 爬升至全場最高點雷姆斯彎（全油門極速超車區）"),
            (1340, 1680, "T3 雷姆斯高原急右髮夾彎 Remus // 全場最高點重煞急右折返下坡！"),
            (1680, 2380, "T4 勞赫下坡重煞右彎 Rauch // 劇烈下坡直線尾端重煞入技術右彎"),
            (2380, 3150, "T5-T7 施洛斯戈爾德至勞赫高速雙左彎 // 連續全油門至半油門高速左弧考驗側向極限"),
            (3150, 3850, "T9-T10 林德山雙右彎 Rindt & Red Bull Mobile // 高Ｇ力中高速右彎衝上終點直線"),
            (3850, 4500, "T10 出彎衝刺 // 全油門貼內線衝過阿爾卑斯起終點龍門架"),
        ],
    },
    {
        "id": "cota",
        "title": "美洲賽道 COTA",
        "session_key": 9617,
        "tum_file": "Austin.csv",
        "width": 16.0,
        "n_wp": 135,
        "t1_sign": -1,  # T1 uphill left hairpin (CCW)
        "is_figure8": False,
        "glb_name": "cota_austin.glb",
        "gantry_text": "CIRCUIT OF THE AMERICAS // APEX PRO",
        "kerb_colors": ((220, 38, 38), (37, 99, 235)),
        "corner_names": [
            (0, 340, "T0 起跑上坡大直線 // 攀升 40 公尺直衝一號盲頂髮夾彎！"),
            (340, 660, "T1 大紅盲頂髮夾彎 Big Red Hairpin // 陡坡頂端重煞急左回轉再高速俯衝！"),
            (660, 1780, "T2-T9 下坡極速蛇行 S 彎 Esses // 高速左-右-左連續切彎考驗下壓力節奏"),
            (1780, 2240, "T10-T11 盲坡髮夾彎重煞區 // 低速左彎回正全力加速進入背直道"),
            (2240, 3320, "T11B 1 公里超長後直道 Back Straight // 全場最高極速尾流決戰路段！"),
            (3320, 4180, "T12-T15 運動場技術複合彎群 Stadium Section // 重煞左轉接連環發夾與慢速轉向考驗"),
            (4180, 4980, "T16-T18 巨型三頂點右弧彎 // 持續高速長右弧考驗輪胎耐久極限"),
            (4980, 5600, "T19-T20 最終雙左彎衝刺 // 精準切過 T19/T20 衝向起終點大直線！"),
        ],
    },
]


def fetch_openf1_best_lap(cfg):
    cid = cfg["id"]
    sk = cfg["session_key"]
    cache_path = os.path.join(CACHE_DIR, f"openf1_{cid}_2024.json")
    if os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if len(data.get("location", [])) >= 200:
            return data

    print(f"  [OpenF1] Fetching session_key={sk} laps for {cid}...")
    # Try multiple top drivers in case driver 1 had an early DNF or telemetry dropout
    for drv in (1, 16, 4, 44, 55, 81, 63):
        r = requests.get(
            f"https://api.openf1.org/v1/laps?session_key={sk}&driver_number={drv}",
            timeout=25,
        )
        if r.status_code != 200:
            continue
        laps = r.json()
        clean = [
            lp for lp in laps
            if lp.get("date_start") and lp.get("lap_duration") and not lp.get("is_pit_out_lap")
            and 55.0 <= float(lp["lap_duration"]) <= 135.0
        ]
        if not clean:
            continue
        clean.sort(key=lambda x: float(x["lap_duration"]))
        # Try fastest clean laps up to 4 candidates to ensure dense 3D location coverage
        for cand in clean[:4]:
            t0_str = cand["date_start"]
            dur = float(cand["lap_duration"])
            # OpenF1 ISO timestamps end with +00:00 or .000000+00:00
            dt0 = datetime.fromisoformat(t0_str.replace("Z", "+00:00"))
            dt1 = dt0 + timedelta(seconds=dur + 0.6)
            url = (
                f"https://api.openf1.org/v1/location?session_key={sk}"
                f"&driver_number={drv}"
                f"&date>={dt0.isoformat()}"
                f"&date<={dt1.isoformat()}"
            )
            rloc = requests.get(url, timeout=30)
            if rloc.status_code != 200:
                continue
            locs = rloc.json()
            if len(locs) >= 220:
                out = {
                    "circuit_id": cid,
                    "session_key": sk,
                    "driver_number": drv,
                    "lap_number": cand.get("lap_number"),
                    "lap_duration": dur,
                    "location": locs,
                }
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump(out, f)
                print(
                    f"  [OpenF1] Cached {cid}: driver #{drv} lap {cand.get('lap_number')} "
                    f"({dur:.3f}s, {len(locs)} pts)"
                )
                return out
            time.sleep(0.35)
    raise RuntimeError(f"Could not fetch valid OpenF1 3D lap for {cid} (session_key={sk})")


def fetch_tumftm_track(cfg):
    cid = cfg["id"]
    tf = cfg["tum_file"]
    cache_path = os.path.join(CACHE_DIR, f"tumftm_{cid}.csv")
    if not os.path.exists(cache_path):
        url = f"https://raw.githubusercontent.com/TUMFTM/racetrack-database/master/tracks/{tf}"
        print(f"  [TUMFTM] Downloading {tf}...")
        r = requests.get(url, timeout=25)
        r.raise_for_status()
        with open(cache_path, "w", encoding="utf-8") as f:
            f.write(r.text)
    tum_x, tum_y, tum_wr, tum_wl = [], [], [], []
    with open(cache_path, "r", encoding="utf-8") as f:
        for row in csv.reader(f):
            if not row or row[0].strip().startswith("#"):
                continue
            tum_x.append(float(row[0]))
            tum_y.append(float(row[1]))
            tum_wr.append(float(row[2]))
            tum_wl.append(float(row[3]))
    return np.column_stack([tum_x, tum_y]), np.array(tum_wr), np.array(tum_wl)


def close_and_spline(xu, yu, zu, wru=None, wlu=None):
    x_cl = np.append(xu, xu[0])
    y_cl = np.append(yu, yu[0])
    z_cl = np.append(zu, zu[0])
    ds = np.hypot(np.diff(x_cl), np.diff(y_cl))
    # Guard against accidental duplicate adjacent point
    keep = np.concatenate(([True], ds > 1e-4))
    if np.sum(~keep) > 0:
        x_cl, y_cl, z_cl = x_cl[keep], y_cl[keep], z_cl[keep]
        if wru is not None:
            wru = np.append(wru, wru[0])[keep][:-1]
            wlu = np.append(wlu, wlu[0])[keep][:-1]
        ds = np.hypot(np.diff(x_cl), np.diff(y_cl))
    s_u = np.concatenate(([0.0], np.cumsum(ds)))
    out = [
        s_u,
        CubicSpline(s_u, x_cl, bc_type="periodic"),
        CubicSpline(s_u, y_cl, bc_type="periodic"),
        CubicSpline(s_u, z_cl, bc_type="periodic"),
    ]
    if wru is not None and wlu is not None:
        wru_cl = np.append(wru, wru[0])
        wlu_cl = np.append(wlu, wlu[0])
        out.append(CubicSpline(s_u, wru_cl, bc_type="periodic"))
        out.append(CubicSpline(s_u, wlu_cl, bc_type="periodic"))
    return out


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


def tex_kerb(c1, c2):
    img = Image.new("RGB", (64, 256))
    dr = ImageDraw.Draw(img)
    dr.rectangle([0, 0, 63, 127], fill=c1)
    dr.rectangle([0, 128, 63, 255], fill=c2)
    return make_png_bytes(img)


def tex_armco():
    img = Image.new("RGB", (64, 64), (185, 194, 205))
    dr = ImageDraw.Draw(img)
    dr.rectangle([0, 12, 63, 22], fill=(120, 130, 145))
    dr.rectangle([0, 40, 63, 50], fill=(120, 130, 145))
    return make_png_bytes(img)


def tex_gantry(label):
    img = Image.new("RGB", (512, 128), (15, 23, 42))
    dr = ImageDraw.Draw(img)
    dr.rectangle([0, 0, 511, 10], fill=(239, 68, 68))
    dr.rectangle([0, 118, 511, 127], fill=(250, 204, 21))
    for i in range(0, 512, 32):
        if (i // 32) % 2 == 0:
            dr.rectangle([i, 20, i + 31, 44], fill=(248, 250, 252))
            dr.rectangle([i, 84, i + 31, 108], fill=(248, 250, 252))
    dr.text((90, 56), label, fill=(56, 189, 248))
    return make_png_bytes(img)


def make_box_mesh(cx, cy, cz, sx, sy, sz):
    hx, hy, hz = sx * 0.5, sy * 0.5, sz * 0.5
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


def write_glb(out_path, scene_name, meshes_spec, images_png):
    bin_chunks = bytearray()
    buffer_views, accessors, images, textures, materials, meshes, nodes = [], [], [], [], [], [], []

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

        mat_idx = len(materials)
        materials.append({
            "name": spec["mat_name"],
            "pbrMetallicRoughness": {
                "baseColorTexture": {"index": spec["tex_idx"]},
                "metallicFactor": spec["metallic"],
                "roughnessFactor": spec["roughness"],
            },
            "doubleSided": spec.get("double_sided", False),
        })
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
        "asset": {"version": "2.0", "generator": "ApexPro-TUMFTM-OpenF1-TrackBuilder"},
        "scene": 0,
        "scenes": [{"name": scene_name, "nodes": list(range(len(nodes)))}],
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


def eval_catmull_1040(wx, wy, wz, track_width):
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

    seg_ds = np.hypot(np.roll(rx, -1) - rx, np.roll(rz, -1) - rz)
    s_arr = np.concatenate(([0.0], np.cumsum(seg_ds[:-1])))
    total_len = float(np.sum(seg_ds))

    dx_t = np.roll(rx, -1) - np.roll(rx, 1)
    dz_t = np.roll(rz, -1) - np.roll(rz, 1)
    tl = np.maximum(1e-6, np.hypot(dx_t, dz_t))
    dirX, dirZ = dx_t / tl, dz_t / tl
    rightX, rightZ = -dirZ, dirX
    halfW = track_width * 0.5

    # Detect overpass bridge nodes matching js/render.js & verify_track_geometry.py (dxz < 36.0m)
    bridge_mask = np.zeros(TS, dtype=bool)
    for i in range(TS):
        for j in range(0, TS, 2):
            ds = abs(s_arr[i] - s_arr[j])
            if ds > total_len * 0.5:
                ds = total_len - ds
            if ds < 55.0:
                continue
            if math.hypot(rx[i] - rx[j], rz[i] - rz[j]) < 36.0 and (ry[i] - ry[j]) > 8.0:
                bridge_mask[i] = True
                break

    road_folds = 0
    runoff_folds = 0
    rw = np.where(bridge_mask, halfW + 0.9, halfW + 12.0)
    for side in (-1.0, 1.0):
        bx_r = rx + rightX * side * halfW
        bz_r = rz + rightZ * side * halfW
        if_bad_r = (np.roll(bx_r, -1) - bx_r) * dirX + (np.roll(bz_r, -1) - bz_r) * dirZ <= 0.0
        road_folds += int(np.sum(if_bad_r))

        bx = rx + rightX * side * rw
        bz = rz + rightZ * side * rw
        dx2 = np.roll(bx, -1) - bx
        dz2 = np.roll(bz, -1) - bz
        bad = (dx2 * dirX + dz2 * dirZ) <= 0.0
        runoff_folds += int(np.sum(bad))

    overlaps = 0
    overpass_dy = 0.0
    for i in range(TS):
        for j in range(i + 35, TS):
            if (TS - (j - i)) < 35:
                continue
            d = math.hypot(rx[i] - rx[j], rz[i] - rz[j])
            dy = abs(ry[i] - ry[j])
            if d < 12.0 and dy > overpass_dy:
                overpass_dy = dy
            if d < track_width + 2.0 and dy < 6.0:
                overlaps += 1

    return rx, ry, rz, s_arr, dirX, dirZ, rightX, rightZ, bridge_mask, total_len, road_folds, runoff_folds, overlaps, overpass_dy


def build_one_track(cfg):
    cid = cfg["id"]
    print(f"\n==================== BUILDING 1:1 TRACK: {cid.upper()} ====================")
    tum_xy, tum_wr, tum_wl = fetch_tumftm_track(cfg)
    openf1 = fetch_openf1_best_lap(cfg)

    loc = openf1["location"]
    op_x = np.array([d["x"] / 10.0 for d in loc], dtype=float)
    op_y = np.array([d["y"] / 10.0 for d in loc], dtype=float)
    op_z = np.array([d["z"] / 10.0 for d in loc], dtype=float)

    keep = [0]
    for i in range(1, len(op_x)):
        if math.hypot(op_x[i] - op_x[keep[-1]], op_y[i] - op_y[keep[-1]]) >= 0.8:
            keep.append(i)
    op_xy = np.column_stack([op_x[keep], op_y[keep]])
    op_z = op_z[keep]

    print(f"  TUMFTM rows={len(tum_xy)} (width {(tum_wr+tum_wl).min():.1f}..{(tum_wr+tum_wl).max():.1f}m) | OpenF1 pts={len(op_xy)}")

    # Rigid 2D ICP OpenF1 -> TUMFTM
    tree_tum = cKDTree(tum_xy)
    tum_mean = tum_xy.mean(axis=0)
    op_centered = op_xy - op_xy.mean(axis=0)
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
            for _ in range(12):
                _, idxs = tree_tum.query(cur)
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
                best_fit = {"mirror": mirror, "rms": rms, "mean_d": float(dists.mean()), "max_d": float(dists.max()), "aligned_xy": cur}

    print(f"  ICP fit: mirror={best_fit['mirror']}, mean_res={best_fit['mean_d']:.2f}m, rms={best_fit['rms']:.2f}m, max={best_fit['max_d']:.2f}m")
    assert best_fit["rms"] < 15.0, f"{cid}: ICP RMS too large ({best_fit['rms']:.2f}m)"
    op_aligned_xy = best_fit["aligned_xy"]

    # Shift TUMFTM start index to OpenF1 start/finish & align direction
    _, i0 = tree_tum.query(op_aligned_xy[0])
    tum_xy = np.roll(tum_xy, -i0, axis=0)
    tum_wr = np.roll(tum_wr, -i0)
    tum_wl = np.roll(tum_wl, -i0)

    t_op = op_aligned_xy[min(4, len(op_aligned_xy) - 1)] - op_aligned_xy[0]
    t_tum = tum_xy[min(4, len(tum_xy) - 1)] - tum_xy[0]
    if np.dot(t_op, t_tum) < 0:
        tum_xy = np.vstack([tum_xy[0:1], tum_xy[1:][::-1]])
        wr_old, wl_old = tum_wr.copy(), tum_wl.copy()
        tum_wr = np.concatenate([wl_old[0:1], wl_old[1:][::-1]])
        tum_wl = np.concatenate([wr_old[0:1], wr_old[1:][::-1]])

    # Map OpenF1 Z elevation onto TUMFTM centerline
    tree_op = cKDTree(op_aligned_xy)
    d_z, idx_z = tree_op.query(tum_xy, k=3)
    w_z = 1.0 / np.maximum(0.5, d_z)
    tum_z_raw = np.sum(op_z[idx_z] * w_z, axis=1) / np.sum(w_z, axis=1)

    # 1.0m periodic cubic spline + Savitzky-Golay Z denoising
    s0, cs_x0, cs_y0, cs_z0, cs_wr0, cs_wl0 = close_and_spline(tum_xy[:, 0], tum_xy[:, 1], tum_z_raw, tum_wr, tum_wl)
    L0 = float(s0[-1])
    N1 = int(round(L0))
    s1 = np.linspace(0.0, L0, N1, endpoint=False)
    x1 = cs_x0(s1)
    y1 = cs_y0(s1)
    wl_s = 75 if N1 > 2000 else 55
    z1_sm = savgol_filter(savgol_filter(cs_z0(s1), window_length=wl_s, polyorder=3, mode="wrap"), window_length=55, polyorder=2, mode="wrap")
    wr1 = np.clip(cs_wr0(s1), 4.5, 11.5)
    wl1 = np.clip(cs_wl0(s1), 4.5, 11.5)

    # Suzuka Figure-8 Crossover Detection & Smooth Bridge Clearance Guarantee
    s_over_center = None
    if cfg.get("is_figure8"):
        # Find crossover where ds > 400m and XZ distance minimal
        xy1 = np.column_stack([x1, y1])
        best_pair = None
        min_d_cross = 1e9
        for i in range(0, N1, 4):
            # Look ahead at least 400m along loop
            for j in range(i + 400, N1 - 400, 4):
                d = math.hypot(x1[i] - x1[j], y1[i] - y1[j])
                if d < min_d_cross:
                    min_d_cross = d
                    best_pair = (i, j)
        i_u, i_o = best_pair
        # In Suzuka, Degner underpass (~2700m) is earlier in lap than West overpass (~4900m)
        if i_u > i_o:
            i_u, i_o = i_o, i_u
        raw_gap = z1_sm[i_o] - z1_sm[i_u]
        print(f"  Suzuka figure-8 crossover detected: under s={s1[i_u]:.1f}m (z={z1_sm[i_u]:.2f}m), over s={s1[i_o]:.1f}m (z={z1_sm[i_o]:.2f}m), raw_gap={raw_gap:.2f}m, xz_dist={min_d_cross:.2f}m")
        target_gap = 12.2
        if raw_gap < target_gap:
            need = target_gap - raw_gap
            # Smooth wrapped Gaussian lift on overpass (+80% of need) and slight dip on underpass (-20%)
            ds_o = np.abs(s1 - s1[i_o])
            ds_o = np.minimum(ds_o, L0 - ds_o)
            ds_u = np.abs(s1 - s1[i_u])
            ds_u = np.minimum(ds_u, L0 - ds_u)
            z1_sm = z1_sm + (0.82 * need) * np.exp(-0.5 * (ds_o / 105.0) ** 2) - (0.18 * need) * np.exp(-0.5 * (ds_u / 75.0) ** 2)
            print(f"  Applied smooth figure-8 Gaussian separation: new gap={z1_sm[i_o] - z1_sm[i_u]:.2f}m")
        s_over_center = float(s1[i_o])

    # Transform to Three.js Game Frame: s=0 at (0, 0, 0), heading +X
    gx0, gy0, gz0 = float(x1[0]), float(y1[0]), float(z1_sm[0])
    dx_loc = x1 - gx0
    dy_loc = y1 - gy0
    dz_elev = z1_sm - gz0

    ang0 = math.atan2(dy_loc[3] - dy_loc[-3], dx_loc[3] - dx_loc[-3])
    c0, s0r = math.cos(-ang0), math.sin(-ang0)
    game_x = c0 * dx_loc - s0r * dy_loc
    game_z = s0r * dx_loc + c0 * dy_loc
    game_y = dz_elev

    op_loc = op_aligned_xy - np.array([gx0, gy0])
    op_gx = c0 * op_loc[:, 0] - s0r * op_loc[:, 1]
    op_gz = s0r * op_loc[:, 0] + c0 * op_loc[:, 1]

    # Check first major corner direction against t1_sign (+1 = RIGHT/+Z curvature, -1 = LEFT/-Z curvature)
    tx_tmp = np.roll(game_x, -6) - np.roll(game_x, 6)
    tz_tmp = np.roll(game_z, -6) - np.roll(game_z, 6)
    k_tmp = np.gradient(np.unwrap(np.arctan2(tz_tmp, tx_tmp)), s1)
    scan_end = min(N1 - 1, 1300)
    first_cands = np.where((np.arange(N1) >= 80) & (np.arange(N1) < scan_end) & (np.abs(k_tmp) > 0.0045))[0]
    assert len(first_cands) > 0, f"{cid}: Could not locate T1 corner!"
    # Pick peak within +/- 80m of first exceedance
    i_c0 = first_cands[0]
    win = np.arange(i_c0, min(scan_end, i_c0 + 120))
    i_peak1 = win[int(np.argmax(np.abs(k_tmp[win])))]
    cur_sign = 1 if k_tmp[i_peak1] >= 0 else -1
    if cur_sign != cfg["t1_sign"]:
        print(f"  Flipping Z axis so T1 at s={s1[i_peak1]:.0f}m has sign={cfg['t1_sign']:+d}...")
        game_z = -game_z
        op_gz = -op_gz
        wr1, wl1 = wl1, wr1

    # Final 0.5m Periodic Cubic Spline
    s_f, cs_fx, cs_fz, cs_fy, cs_fwr, cs_fwl = close_and_spline(game_x, game_z, game_y, wr1, wl1)
    L_fused = float(s_f[-1])
    N_half = int(round(L_fused / 0.5))
    s_half = np.linspace(0.0, L_fused, N_half, endpoint=False)

    fx_05, fz_05, fy_05 = cs_fx(s_half), cs_fz(s_half), cs_fy(s_half)
    fwr_05, fwl_05 = cs_fwr(s_half), cs_fwl(s_half)
    fxp, fzp, fyp = cs_fx(s_half, 1), cs_fz(s_half, 1), cs_fy(s_half, 1)
    fxpp, fzpp = cs_fx(s_half, 2), cs_fz(s_half, 2)
    vlen = np.hypot(fxp, fzp)
    kappa_05 = (fxp * fzpp - fzp * fxpp) / np.maximum(1e-6, vlen ** 3)
    tx_05, tz_05 = fxp / vlen, fzp / vlen
    rx_05, rz_05 = -tz_05, tx_05

    print(
        f"  Fused 0.5m: len={L_fused:.1f}m | X=[{fx_05.min():.1f},{fx_05.max():.1f}] "
        f"Z=[{fz_05.min():.1f},{fz_05.max():.1f}] Y=[{fy_05.min():.2f},{fy_05.max():.2f}] (dY={fy_05.max()-fy_05.min():.2f}m)"
    )

    # Export PBR GLB (stride 2.0m = 4 steps)
    stride = 4
    idx_g = np.arange(0, N_half, stride)
    M = len(idx_g)
    s_g = s_half[idx_g]
    gx, gy, gz = fx_05[idx_g], fy_05[idx_g], fz_05[idx_g]
    wl_g, wr_g = fwl_05[idx_g], fwr_05[idx_g]
    rx_g, rz_g = rx_05[idx_g], rz_05[idx_g]
    kap_g = kappa_05[idx_g]
    gnd_y = min(-20.0, float(gy.min()) - 10.0)

    # Bridge detection on 2.0m rings (no artificial y>=6 check; just crossover dy>8m within 65m and ds>55m)
    bridge_g = np.zeros(M, dtype=bool)
    if cfg.get("is_figure8") and s_over_center is not None:
        ds_ov = np.abs(s_g - s_over_center)
        ds_ov = np.minimum(ds_ov, L_fused - ds_ov)
        bridge_g = ds_ov < 85.0

    def build_ribbon(verts_l, verts_r, norms_l, norms_r, u_vals, v_repeat=0.16, two_sided=False):
        pos = np.empty((M * 2, 3), dtype=np.float32)
        nrm = np.empty((M * 2, 3), dtype=np.float32)
        uv = np.empty((M * 2, 2), dtype=np.float32)
        pos[0::2], pos[1::2] = verts_l, verts_r
        nrm[0::2], nrm[1::2] = norms_l, norms_r
        v_vals = (s_g * v_repeat).astype(np.float32)
        uv[0::2, 0], uv[0::2, 1] = u_vals[0], v_vals
        uv[1::2, 0], uv[1::2, 1] = u_vals[1], v_vals
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

    up_nrm = np.column_stack([np.zeros(M), np.ones(M), np.zeros(M)]).astype(np.float32)
    vL_road = np.column_stack([gx - rx_g * wl_g, gy, gz - rz_g * wl_g])
    vR_road = np.column_stack([gx + rx_g * wr_g, gy, gz + rz_g * wr_g])
    p_road, n_road, u_road, i_road = build_ribbon(vL_road, vR_road, up_nrm, up_nrm, (0.0, 2.5), v_repeat=0.12)

    def safe_outer_dist(base_w, extra_d, side_sgn):
        raw_d = base_w + np.where(bridge_g, 0.9, extra_d)
        inside = (kap_g * side_sgn) > 1e-4
        max_safe = np.where(inside, 0.78 / np.maximum(1e-4, np.abs(kap_g)), 1e6)
        clamped = np.maximum(base_w + 0.9, np.minimum(raw_d, max_safe))
        return savgol_filter(clamped, window_length=15, polyorder=2, mode="wrap")

    def build_grass_shoulder(side_sgn, w_arr):
        outer_d = safe_outer_dist(w_arr, 12.0, side_sgn)
        ix, iz = gx + rx_g * side_sgn * w_arr, gz + rz_g * side_sgn * w_arr
        ox, oz = gx + rx_g * side_sgn * outer_d, gz + rz_g * side_sgn * outer_d
        pos = np.empty((M * 3, 3), dtype=np.float32)
        nrm = np.empty((M * 3, 3), dtype=np.float32)
        uv = np.empty((M * 3, 2), dtype=np.float32)
        # On bridge deck, tuck skirt directly underneath bridge slab (gy - 1.2) instead of gnd_y
        bot_y = np.where(bridge_g, gy - 1.2, np.full(M, gnd_y))
        pos[0::3] = np.column_stack([ix, gy - 0.03, iz])
        pos[1::3] = np.column_stack([ox, gy - 0.14, oz])
        pos[2::3] = np.column_stack([ox, bot_y, oz])
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
                tris.extend([(a0, a1, b0), (b0, a1, b1)])
                if not (bridge_g[i] or bridge_g[ni]):
                    tris.extend([(b0, b1, c0), (c0, b1, c1)])
            else:
                tris.extend([(b0, b1, a0), (a0, b1, a1)])
                if not (bridge_g[i] or bridge_g[ni]):
                    tris.extend([(c0, c1, b0), (b0, c1, b1)])
        return pos, nrm, uv, np.array(tris, dtype=np.uint32).ravel()

    p_gl, n_gl, u_gl, i_gl = build_grass_shoulder(-1.0, wl_g)
    p_gr, n_gr, u_gr, i_gr = build_grass_shoulder(1.0, wr_g)
    p_grass = np.vstack([p_gl, p_gr])
    n_grass = np.vstack([n_gl, n_gr])
    u_grass = np.vstack([u_gl, u_gr])
    i_grass = np.concatenate([i_gl, i_gr + len(p_gl)])

    kerb_pos_l, kerb_nrm_l, kerb_uv_l, kerb_idx_l = [], [], [], []
    v_off = 0
    for side_sgn, w_arr in [(-1.0, wl_g), (1.0, wr_g)]:
        in_k = (np.abs(kap_g) > 0.0025) & (~bridge_g)
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
                iw = w_arr[seg] - 0.15
                ow = w_arr[seg] + 1.25
                ix, iz = gx[seg] + rx_g[seg] * side_sgn * iw, gz[seg] + rz_g[seg] * side_sgn * iw
                ox, oz = gx[seg] + rx_g[seg] * side_sgn * ow, gz[seg] + rz_g[seg] * side_sgn * ow
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

    def build_armco(side_sgn, w_arr):
        dist = np.where(bridge_g, w_arr + 0.85, safe_outer_dist(w_arr, 11.4, side_sgn) - 0.5)
        ax, az = gx + rx_g * side_sgn * dist, gz + rz_g * side_sgn * dist
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

    span_z = float(fwl_05[0] + fwr_05[0]) + 4.0
    mid_z = float(fwr_05[0] - fwl_05[0]) * 0.5
    b1 = make_box_mesh(0.0, 6.2, mid_z, 1.6, 1.6, span_z)
    b2 = make_box_mesh(0.0, 3.1, -fwl_05[0] - 1.5, 1.1, 6.4, 1.1)
    b3 = make_box_mesh(0.0, 3.1, fwr_05[0] + 1.5, 1.1, 6.4, 1.1)
    p_gan = np.vstack([b1[0], b2[0], b3[0]])
    n_gan = np.vstack([b1[1], b2[1], b3[1]])
    u_gan = np.vstack([b1[2], b2[2], b3[2]])
    i_gan = np.concatenate([b1[3], b2[3] + len(b1[0]), b3[3] + len(b1[0]) + len(b2[0])])

    glb_out = os.path.join(TRACKS_DIR, cfg["glb_name"])
    c1, c2 = cfg["kerb_colors"]
    prefix = cid.capitalize()
    write_glb(
        glb_out,
        scene_name=f"{prefix}_1to1",
        meshes_spec=[
            {"name": f"{prefix}_Asphalt", "mat_name": "Mat_Asphalt", "tex_idx": 0, "metallic": 0.05, "roughness": 0.78, "pos": p_road, "nrm": n_road, "uv": u_road, "idx": i_road},
            {"name": f"{prefix}_Grass_Runoff_Skirt", "mat_name": "Mat_Grass", "tex_idx": 1, "metallic": 0.02, "roughness": 0.92, "pos": p_grass, "nrm": n_grass, "uv": u_grass, "idx": i_grass},
            {"name": f"{prefix}_Kerbs", "mat_name": "Mat_Kerb", "tex_idx": 2, "metallic": 0.05, "roughness": 0.65, "pos": p_kerb, "nrm": n_kerb, "uv": u_kerb, "idx": i_kerb},
            {"name": f"{prefix}_Armco_Barriers", "mat_name": "Mat_Armco", "tex_idx": 3, "metallic": 0.72, "roughness": 0.38, "double_sided": True, "pos": p_armco, "nrm": n_armco, "uv": u_armco, "idx": i_armco},
            {"name": f"{prefix}_Start_Gantry", "mat_name": "Mat_Gantry", "tex_idx": 4, "metallic": 0.25, "roughness": 0.55, "pos": p_gan, "nrm": n_gan, "uv": u_gan, "idx": i_gan},
        ],
        images_png=[
            ("asphalt_png", tex_asphalt()),
            ("grass_png", tex_grass()),
            ("kerb_png", tex_kerb(c1, c2)),
            ("armco_png", tex_armco()),
            ("gantry_png", tex_gantry(cfg["gantry_text"])),
        ],
    )
    print(f"  Exported GLB: {glb_out} ({os.path.getsize(glb_out):,} bytes)")

    # Generate Zero-Fold Uniform-Arc-Length Catmull-Rom Waypoints (prevents spline overshoot)
    N_wp = cfg["n_wp"]
    wp_idx = np.round(np.linspace(0, N_half, N_wp, endpoint=False)).astype(int) % N_half
    wp_idx[0] = 0
    wp_x, wp_y, wp_z, wp_s = fx_05[wp_idx].copy(), fy_05[wp_idx].copy(), fz_05[wp_idx].copy(), s_half[wp_idx].copy()

    width = cfg["width"]
    for _ in range(120):
        rx, ry, rz, s_arr, dirX, dirZ, rightX, rightZ, bmask, game_len, road_f, run_f, ov, ody = eval_catmull_1040(wp_x, wp_y, wp_z, width)
        if road_f == 0 and run_f == 0:
            break
        rw = np.where(bmask, width * 0.5 + 0.9, width * 0.5 + 12.0)
        nudges = {}
        for side in (-1.0, 1.0):
            for rad_arr in (np.full(1040, width * 0.5), rw):
                bx, bz = rx + rightX * side * rad_arr, rz + rightZ * side * rad_arr
                bad = ((np.roll(bx, -1) - bx) * dirX + (np.roll(bz, -1) - bz) * dirZ) <= 0.0
                for bi in np.where(bad)[0]:
                    wi = int(round((bi / 1040.0) * N_wp)) % N_wp
                    if wi == 0:
                        continue
                    # Push slightly toward outer side of bend and relax sharp triangle kink
                    nudges[wi] = (float(rightX[bi] * -side), float(rightZ[bi] * -side))
        for wi, (ox_v, oz_v) in nudges.items():
            px_m = 0.72 * wp_x[wi] + 0.14 * wp_x[(wi - 1) % N_wp] + 0.14 * wp_x[(wi + 1) % N_wp]
            pz_m = 0.72 * wp_z[wi] + 0.14 * wp_z[(wi - 1) % N_wp] + 0.14 * wp_z[(wi + 1) % N_wp]
            wp_x[wi] = px_m + ox_v * 0.65
            wp_z[wi] = pz_m + oz_v * 0.65

    rx, ry, rz, s_arr, dirX, dirZ, rightX, rightZ, bmask, game_len, road_f, run_f, ov, ody = eval_catmull_1040(wp_x, wp_y, wp_z, width)
    bridge_cnt = int(np.sum(bmask))
    print(
        f"  Catmull-Rom {N_wp} wps (width={width}m): len={game_len:.1f}m | Y=[{ry.min():.2f},{ry.max():.2f}] "
        f"| road_folds={road_f} runoff_folds={run_f} overlaps={ov} bridge_nodes={bridge_cnt} (dy={ody:.1f}m)"
    )
    assert road_f == 0 and run_f == 0 and ov == 0, f"{cid}: fold/overlap check failed!"
    if cfg.get("is_figure8"):
        assert bridge_cnt > 0 and ody >= 10.0, f"{cid}: bridge check failed!"

    def name_for_s(sv):
        for s0_, s1_, nm in cfg["corner_names"]:
            if s0_ <= sv < s1_:
                return nm
        return cfg["corner_names"][-1][2]

    waypoints = []
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
        vt = 295 if k_loc < 0.002 else int(max(68, min(295, round(math.sqrt(1.38 * 9.81 / k_loc) * 3.6))))
        waypoints.append({
            "x": round(float(wp_x[i]), 2),
            "y": round(float(wp_y[i]), 2),
            "z": round(float(wp_z[i]), 2),
            "vTarget": vt,
            "name": name_for_s(wp_s[i]),
        })

    return {
        "id": cid,
        "title": cfg["title"],
        "width": width,
        "glb_name": cfg["glb_name"],
        "glb_bytes": os.path.getsize(glb_out),
        "len_m": round(game_len, 1),
        "fused_len_m": round(L_fused, 1),
        "dy_m": round(float(ry.max() - ry.min()), 2),
        "y_min": round(float(ry.min()), 2),
        "y_max": round(float(ry.max()), 2),
        "bridge_nodes": bridge_cnt,
        "overpass_dy": round(ody, 1),
        "icp_rms": round(best_fit["rms"], 2),
        "waypoints": waypoints,
        # Plotting arrays
        "fx_05": fx_05, "fz_05": fz_05, "fy_05": fy_05, "s_half": s_half,
        "fwl_05": fwl_05, "fwr_05": fwr_05, "rx_05": rx_05, "rz_05": rz_05,
        "op_gx": op_gx, "op_gz": op_gz,
        "cat_x": rx, "cat_z": rz, "cat_y": ry,
    }


def check_hills_for_all_circuits(built_tracks):
    print("\n=== HILL CLEARANCE AUDIT ACROSS ALL 9 CIRCUITS ===")
    # Candidate safe distant hills
    hills = [
        {"x": -2850, "z": 2450, "r": 540, "h": 250, "seed": 0.7},
        {"x": 2850, "z": 2050, "r": 480, "h": 220, "seed": 2.1},
        {"x": -2850, "z": -1950, "r": 510, "h": 230, "seed": 3.8},
        {"x": 2650, "z": -1950, "r": 450, "h": 200, "seed": 5.2},
    ]
    # Also load existing fuji, hakone, spa waypoints from js/circuits.js
    with open(os.path.join(BASE_DIR, "js", "circuits.js"), "r", encoding="utf-8") as f:
        csrc = f.read()
    existing_pts = {}
    for m in re.finditer(r"id:\s*'(\w+)'[\s\S]*?width:\s*([\d.]+),[\s\S]*?points:\s*\[([\s\S]*?)\n\s*\]", csrc):
        cid, w, praw = m.group(1), float(m.group(2)), m.group(3)
        if cid in ("fuji", "hakone", "spa"):
            pts = np.array([[float(pm.group(1)), float(pm.group(2))] for pm in re.finditer(r"x:\s*([\d.-]+)[^z]*z:\s*([\d.-]+)", praw)])
            existing_pts[cid] = (pts[:, 0], pts[:, 1], w)

    all_checks = []
    for cid, (px, pz, w) in existing_pts.items():
        all_checks.append((cid, px, pz, w))
    for bt in built_tracks:
        all_checks.append((bt["id"], bt["cat_x"], bt["cat_z"], bt["width"]))

    for cid, px, pz, w in all_checks:
        runoff_lim = w * 0.5 + 12.0
        min_cl = 1e9
        for hc in hills:
            md = float(np.min(np.hypot(px - hc["x"], pz - hc["z"])))
            cl = md - (hc["r"] * 1.2 + runoff_lim)
            min_cl = min(min_cl, cl)
            assert cl > 20.0, f"{cid} too close to hill {hc}: cl={cl:.1f}m"
        fuji_str = ""
        if cid == "fuji":
            md_mf = float(np.min(np.hypot(px - 420.0, pz - 2250.0)))
            cl_mf = md_mf - (760.0 * 1.2 + runoff_lim)
            fuji_str = f" | MtFuji clear={cl_mf:+.1f}m"
            assert cl_mf > 20.0
        print(f"  {cid:12s}: min hill clearance = {min_cl:+.1f}m{fuji_str}")
    return hills


def render_verification_sheet(built_tracks):
    fig, axes = plt.subplots(3, 2, figsize=(16, 17), facecolor="#0b1120")
    for ax, bt in zip(axes.ravel(), built_tracks):
        ax.set_facecolor("#0f172a")
        lbx = bt["fx_05"] - bt["rx_05"] * bt["fwl_05"]
        lbz = bt["fz_05"] - bt["rz_05"] * bt["fwl_05"]
        rbx = bt["fx_05"] + bt["rx_05"] * bt["fwr_05"]
        rbz = bt["fz_05"] + bt["rz_05"] * bt["fwr_05"]
        ax.plot(lbx, lbz, "-", color="#64748b", lw=0.8)
        ax.plot(rbx, rbz, "-", color="#64748b", lw=0.8)
        sc = ax.scatter(bt["fx_05"][::6], bt["fz_05"][::6], c=bt["fy_05"][::6], cmap="viridis", s=5, label="融合 3D 中心線 (高度填色)")
        ax.plot(bt["op_gx"], bt["op_gz"], "--", color="#f97316", lw=1.0, alpha=0.8, label="OpenF1 F1 賽車線")
        ax.scatter([0], [0], color="#facc15", s=65, zorder=6, label="S/F (0,0,0)")
        ax.invert_yaxis()
        ax.set_aspect("equal", adjustable="datalim")
        ax.grid(True, color="#1e293b", linestyle="--", alpha=0.6)
        ax.tick_params(colors="#94a3b8", labelsize=8)
        cb = plt.colorbar(sc, ax=ax, fraction=0.036, pad=0.02)
        cb.set_label("Y (m)", color="#cbd5e1", fontsize=8)
        cb.ax.tick_params(colors="#94a3b8", labelsize=7)
        br_txt = f" | 跨橋高差={bt['overpass_dy']:.1f}m" if bt["bridge_nodes"] > 0 else ""
        ax.set_title(
            f"{bt['title']} | {bt['len_m']}m ({bt['n_wp'] if 'n_wp' in bt else len(bt['waypoints'])} pts) | "
            f"dY={bt['dy_m']:.1f}m | ICP RMS={bt['icp_rms']}m{br_txt}",
            color="#f8fafc", fontsize=10.5, fontweight="bold", pad=8
        )
        ax.legend(loc="best", facecolor="#0f172a", edgecolor="#334155", labelcolor="#f1f5f9", fontsize=7.5)

    fig.suptitle("APEX PRO RACING // OpenF1 3D Telemetry × TUMFTM Centerline — 6 條 1:1 真實賽道驗證圖", color="#f8fafc", fontsize=14, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.965])
    out_scratch = os.path.join(SCRATCH_DIR, "all_rebuilt_tracks_verification.png")
    out_art = os.path.join(ARTIFACT_DIR, "all_rebuilt_tracks_verification.png")
    fig.savefig(out_scratch, dpi=145, facecolor=fig.get_facecolor())
    shutil.copyfile(out_scratch, out_art)
    plt.close(fig)
    print(f"\nSaved 6-track verification sheet: {out_scratch}")


def main():
    built = [build_one_track(cfg) for cfg in TRACK_CONFIGS]
    hills = check_hills_for_all_circuits(built)
    render_verification_sheet(built)

    export_json = {
        "hills": hills,
        "tracks": {
            bt["id"]: {
                "id": bt["id"],
                "width": bt["width"],
                "glb_name": bt["glb_name"],
                "glb_bytes": bt["glb_bytes"],
                "len_m": bt["len_m"],
                "fused_len_m": bt["fused_len_m"],
                "dy_m": bt["dy_m"],
                "y_min": bt["y_min"],
                "y_max": bt["y_max"],
                "bridge_nodes": bt["bridge_nodes"],
                "overpass_dy": bt["overpass_dy"],
                "waypoints": bt["waypoints"],
            }
            for bt in built
        },
    }
    json_out = os.path.join(SCRATCH_DIR, "generated_tracks_waypoints.json")
    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(export_json, f, ensure_ascii=False, indent=2)
    print(f"Exported waypoints & metrics JSON: {json_out}")


if __name__ == "__main__":
    main()
