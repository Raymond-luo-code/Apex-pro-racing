"""Update js/circuits.js with 9 real/classic circuits, rich display metadata & class benchmark helper."""

import json
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIRCUITS_JS = os.path.join(BASE_DIR, "js", "circuits.js")
GENERATED_JSON = os.path.join(BASE_DIR, "scratch", "generated_tracks_waypoints.json")

with open(GENERATED_JSON, "r", encoding="utf-8") as f:
    gen = json.load(f)["tracks"]

with open(CIRCUITS_JS, "r", encoding="utf-8") as f:
    src = f.read()

# Extract existing fuji, hakone, spa blocks verbatim
def extract_circuit_block(cid):
    m = re.search(rf"(\{{\s*id:\s*'{cid}',[\s\S]*?\n\s*\}})(?=\s*,\s*\n\s*\{{|\s*\n\s*\];)", src)
    assert m, f"Could not extract {cid}"
    return m.group(1)


def fmt_pts(wps):
    lines = []
    for p in wps:
        nm = p["name"].replace('"', '\\"')
        lines.append(
            f'            {{ x: {p["x"]:.2f}, y: {p["y"]:.2f}, z: {p["z"]:.2f}, vTarget: {p["vTarget"]}, name: "{nm}" }}'
        )
    return ",\n".join(lines)


def inject_meta(block, meta_lines):
    # Insert metadata properties right after difficultyStars line
    return re.sub(
        r"(difficultyStars:\s*'[^']+',)",
        r"\1\n" + "\n".join(meta_lines),
        block,
        count=1,
    )


fuji_block = inject_meta(
    extract_circuit_block("fuji"),
    [
        "          country: '🇯🇵 日本',",
        "          category: 'original',",
        "          lengthKm: 5.42,",
        "          elevationM: 12.5,",
        "          turns: 15,",
        "          cardAccent: '#6366f1',",
        "          cardIcon: '🗻',",
        "          cardTag: '★★★ 中階技術 · 黃金夕陽',",
        "          cardTitle: '富士山國際大獎賽道 FUJI',",
        "          cardDesc: '全長 5.42 km，結合 1.1km 大直線、2 座重煞髮夾彎（極限 74 km/h）與連續高速 S 彎重心轉移區，夕陽斜射下極富競技張力。',",
        "          defaultTempC: { ambient: 19, track: 26 },",
    ],
)

hakone_block = inject_meta(
    extract_circuit_block("hakone"),
    [
        "          country: '🇯🇵 日本',",
        "          category: 'original',",
        "          lengthKm: 5.50,",
        "          elevationM: 28.4,",
        "          turns: 12,",
        "          cardAccent: '#f43f5e',",
        "          cardIcon: '🌙',",
        "          cardTag: '★★★★★ 魔鬼山道 · 午夜霓虹',",
        "          cardTitle: '箱根午夜山道大獎賽 HAKONE',",
        "          cardDesc: '全長 5.50 km，高低落差劇烈（28m），遍布急促連髮夾彎與盲彎。夜間開啟遠光頭燈束與霓虹拱門，極度考驗精準重煞控制！',",
        "          defaultTempC: { ambient: 14, track: 17 },",
    ],
)

spa_block = inject_meta(
    extract_circuit_block("spa"),
    [
        "          country: '🇧🇪 比利時',",
        "          category: 'f1_real',",
        "          lengthKm: 7.00,",
        "          elevationM: 102.3,",
        "          turns: 19,",
        "          cardAccent: '#f59e0b',",
        "          cardIcon: '⛰️',",
        "          cardTag: '★★★★ F1 1:1 真實遙測 · 高低差 102m',",
        "          cardTitle: '斯帕-弗朗科爾尚 SPA GP (1:1)',",
        "          cardDesc: '真實 7.0 km × 102.3 m 高低落差阿登森林殿堂！從 La Source 俯衝紅水河谷再爬升 Eau Rouge / Raidillon、凱梅爾高原直奔 Pouhon 與公車站減速彎。',",
        "          defaultTempC: { ambient: 20, track: 29 },",
    ],
)

MONZA_BLOCK = f"""        {{
          id: 'monza',
          name: 'AUTODROMO NAZIONALE MONZA',
          shortLabel: '極速殿堂:蒙札1:1',
          badgeText: 'MONZA ★★☆',
          difficultyStars: '★★☆',
          country: '🇮🇹 義大利',
          category: 'f1_real',
          lengthKm: 5.79,
          elevationM: 12.5,
          turns: 11,
          cardAccent: '#10b981',
          cardIcon: '🌲',
          cardTag: '★★☆ F1 1:1 速度神殿 · 雙重減速彎',
          cardTitle: '蒙札國家賽車場 MONZA (1:1)',
          cardDesc: '全長 5.79 km 真實重製！結合 1.1km 315+ km/h 大直線、T1 Rettifilo 重煞減速彎、Curva Grande、Roggia、雙萊斯莫與 Ascari 高速 S 彎。',
          defaultTempC: {{ ambient: 27, track: 41 }},
          width: 16.0,
          proLapTime: 103.500,
          elevationAmp1: 2.2,
          elevationAmp2: 1.0,
          glbUrl: 'assets/models/tracks/monza.glb',
          glbTransform: {{ pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 }},
          theme: {{
            biome: 'monza_park',
            skyColor: 0x1e3a5f,
            skyTop: 0x0b3c78,
            skyMid: 0x2b6cb0,
            skyHorizon: 0x90cdf4,
            cloudTint: 0xffffff,
            fogColor: 0x1e3a5f,
            fogDensity: 0.00055,
            hemiSky: 0xf0f9ff,
            hemiGround: 0x1e293b,
            hemiIntensity: 1.18,
            sunColor: 0xffffff,
            sunIntensity: 1.35,
            sunPos: [450, 680, 180],
            grassColor: 0x132e1c,
            treePrimary: 0x15803d,
            treeSecondary: 0x166534,
            isNight: false,
            hasSunsetFlare: false
          }},
          points: [
{fmt_pts(gen['monza']['waypoints'])}
          ]
        }}"""

SUZUKA_BLOCK = f"""        {{
          id: 'suzuka',
          name: 'SUZUKA INTERNATIONAL RACING COURSE',
          shortLabel: '傳奇八字:鈴鹿1:1',
          badgeText: 'SUZUKA ★★★★',
          difficultyStars: '★★★★',
          country: '🇯🇵 日本',
          category: 'f1_real',
          lengthKm: 5.80,
          elevationM: 40.3,
          turns: 18,
          cardAccent: '#06b6d4',
          cardIcon: '🌉',
          cardTag: '★★★★ F1 1:1 經典八字立體橋 · 高差 40m',
          cardTitle: '鈴鹿國際賽道 SUZUKA (1:1)',
          cardDesc: '全長 5.80 km 真實重製！傳奇八字立體交叉、高速連續 S 彎、Degner 涵洞下穿、髮夾彎、湯匙雙頂點與高架橋上直奔 130R 與卡西歐三角彎。',
          defaultTempC: {{ ambient: 22, track: 33 }},
          width: 16.0,
          proLapTime: 112.000,
          elevationAmp1: 9.5,
          elevationAmp2: 4.5,
          glbUrl: 'assets/models/tracks/suzuka_circuit.glb',
          glbTransform: {{ pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 }},
          theme: {{
            biome: 'suzuka_bay',
            skyColor: 0x172554,
            skyTop: 0x0f2f6b,
            skyMid: 0x2c639e,
            skyHorizon: 0x9bd0f5,
            cloudTint: 0xf8fafc,
            fogColor: 0x1e293b,
            fogDensity: 0.00055,
            hemiSky: 0xfef3c7,
            hemiGround: 0x1e293b,
            hemiIntensity: 1.16,
            sunColor: 0xffedd5,
            sunIntensity: 1.38,
            sunPos: [380, 520, 420],
            grassColor: 0x142e1b,
            treePrimary: 0x15803d,
            treeSecondary: 0xd97706,
            isNight: false,
            hasSunsetFlare: false
          }},
          points: [
{fmt_pts(gen['suzuka']['waypoints'])}
          ]
        }}"""

SILVERSTONE_BLOCK = f"""        {{
          id: 'silverstone',
          name: 'SILVERSTONE CIRCUIT GP',
          shortLabel: 'F1發源地:銀石1:1',
          badgeText: 'SILVERSTONE ★★★★',
          difficultyStars: '★★★★',
          country: '🇬🇧 英國',
          category: 'f1_real',
          lengthKm: 5.89,
          elevationM: 11.3,
          turns: 18,
          cardAccent: '#38bdf8',
          cardIcon: '🇬🇧',
          cardTag: '★★★★ F1 1:1 極速S彎聖殿 · 高速空力',
          cardTitle: '銀石賽道 SILVERSTONE GP (1:1)',
          cardDesc: '全長 5.89 km！包含 Copse 超高Ｇ力右彎、殿堂級 Maggotts–Becketts–Chapel 極速連續重心轉換、機棚長直道與 Stowe / Club 組合彎。',
          defaultTempC: {{ ambient: 18, track: 25 }},
          width: 16.0,
          proLapTime: 111.500,
          elevationAmp1: 3.0,
          elevationAmp2: 1.5,
          glbUrl: 'assets/models/tracks/silverstone.glb',
          glbTransform: {{ pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 }},
          theme: {{
            biome: 'silverstone_uk',
            skyColor: 0x1e293b,
            skyTop: 0x1e3a5f,
            skyMid: 0x475569,
            skyHorizon: 0xcbd5e1,
            cloudTint: 0xf1f5f9,
            fogColor: 0x334155,
            fogDensity: 0.00052,
            hemiSky: 0xe2e8f0,
            hemiGround: 0x14281d,
            hemiIntensity: 1.12,
            sunColor: 0xf8fafc,
            sunIntensity: 1.24,
            sunPos: [320, 480, -340],
            grassColor: 0x14331d,
            treePrimary: 0x166534,
            treeSecondary: 0x3f6212,
            isNight: false,
            hasSunsetFlare: false
          }},
          points: [
{fmt_pts(gen['silverstone']['waypoints'])}
          ]
        }}"""

INTERLAGOS_BLOCK = f"""        {{
          id: 'interlagos',
          name: 'AUTODROMO DE INTERLAGOS',
          shortLabel: '南美魔鬼坡:英特拉格斯',
          badgeText: 'INTERLAGOS ★★★★',
          difficultyStars: '★★★★',
          country: '🇧🇷 巴西',
          category: 'f1_real',
          lengthKm: 4.31,
          elevationM: 43.0,
          turns: 15,
          cardAccent: '#facc15',
          cardIcon: '🇧🇷',
          cardTag: '★★★★ F1 1:1 逆時針陡坡 · 高差 43m',
          cardTitle: '英特拉格斯 INTERLAGOS (1:1)',
          cardDesc: '逆時針經典戰場！洗拿 S 彎（Senna S）下坡重煞直入長直道、高低起伏技術中段與 Juncao 重煞後全力爬坡衝刺 Subida dos Boxes！',
          defaultTempC: {{ ambient: 26, track: 42 }},
          width: 15.5,
          proLapTime: 86.500,
          elevationAmp1: 8.0,
          elevationAmp2: 4.0,
          glbUrl: 'assets/models/tracks/interlagos.glb',
          glbTransform: {{ pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 }},
          theme: {{
            biome: 'interlagos_sun',
            skyColor: 0x0f3b6e,
            skyTop: 0x075985,
            skyMid: 0x0284c7,
            skyHorizon: 0xfef08a,
            cloudTint: 0xffffff,
            fogColor: 0x1e3a5f,
            fogDensity: 0.00050,
            hemiSky: 0xfef9c3,
            hemiGround: 0x1e2918,
            hemiIntensity: 1.22,
            sunColor: 0xfffbeb,
            sunIntensity: 1.44,
            sunPos: [-420, 620, 320],
            grassColor: 0x18381d,
            treePrimary: 0x15803d,
            treeSecondary: 0x65a30d,
            isNight: false,
            hasSunsetFlare: false
          }},
          points: [
{fmt_pts(gen['interlagos']['waypoints'])}
          ]
        }}"""

SPIELBERG_BLOCK = f"""        {{
          id: 'spielberg',
          name: 'RED BULL RING SPIELBERG',
          shortLabel: '阿爾卑斯:紅牛環1:1',
          badgeText: 'RED BULL RING ★★★',
          difficultyStars: '★★★',
          country: '🇦🇹 奧地利',
          category: 'f1_real',
          lengthKm: 4.32,
          elevationM: 63.4,
          turns: 10,
          cardAccent: '#ef4444',
          cardIcon: '🏔️',
          cardTag: '★★★ F1 1:1 阿爾卑斯陡坡 · 高差 63m',
          cardTitle: '紅牛環賽道 RED BULL RING (1:1)',
          cardDesc: '阿爾卑斯山谷雲霄飛車！全長 4.32 km 劇烈爬升 63.4 公尺，連環上坡直道、Remus 急髮夾重煞後高速下坡飛馳過 Rindt 雙右彎。',
          defaultTempC: {{ ambient: 21, track: 34 }},
          width: 15.5,
          proLapTime: 82.000,
          elevationAmp1: 12.0,
          elevationAmp2: 5.0,
          glbUrl: 'assets/models/tracks/red_bull_ring.glb',
          glbTransform: {{ pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 }},
          theme: {{
            biome: 'spielberg_alps',
            skyColor: 0x0c4a6e,
            skyTop: 0x073b61,
            skyMid: 0x2563eb,
            skyHorizon: 0xbae6fd,
            cloudTint: 0xffffff,
            fogColor: 0x1e3a5f,
            fogDensity: 0.00048,
            hemiSky: 0xf0f9ff,
            hemiGround: 0x112a18,
            hemiIntensity: 1.20,
            sunColor: 0xffffff,
            sunIntensity: 1.36,
            sunPos: [380, 620, 260],
            grassColor: 0x11361b,
            treePrimary: 0x065f46,
            treeSecondary: 0x15803d,
            isNight: false,
            hasSunsetFlare: false
          }},
          points: [
{fmt_pts(gen['spielberg']['waypoints'])}
          ]
        }}"""

COTA_BLOCK = f"""        {{
          id: 'cota',
          name: 'CIRCUIT OF THE AMERICAS (COTA)',
          shortLabel: '美洲極限:奧斯汀1:1',
          badgeText: 'COTA AUSTIN ★★★★★',
          difficultyStars: '★★★★★',
          country: '🇺🇸 美國',
          category: 'f1_real',
          lengthKm: 5.51,
          elevationM: 30.2,
          turns: 20,
          cardAccent: '#fb923c',
          cardIcon: '🤠',
          cardTag: '★★★★★ F1 1:1 二十彎全能考驗 · 盲頂T1',
          cardTitle: '美洲賽道 COTA AUSTIN (1:1)',
          cardDesc: '集世界傳奇彎角於一身！迎戰劇烈爬坡 T1 盲頂左髮夾、連續高速 Esses、1km 背直道重煞、Stadium 技術複合彎與遠景觀景高塔。',
          defaultTempC: {{ ambient: 29, track: 44 }},
          width: 16.0,
          proLapTime: 118.000,
          elevationAmp1: 8.0,
          elevationAmp2: 3.5,
          glbUrl: 'assets/models/tracks/cota_austin.glb',
          glbTransform: {{ pos: [0, 0, 0], rotX: 0, rotY: 0, scale: 1.0 }},
          theme: {{
            biome: 'cota_texas',
            skyColor: 0x1e3a5f,
            skyTop: 0x0f2d5e,
            skyMid: 0x3b82f6,
            skyHorizon: 0xfde68a,
            cloudTint: 0xfffbeb,
            fogColor: 0x334155,
            fogDensity: 0.00046,
            hemiSky: 0xfef3c7,
            hemiGround: 0x261c12,
            hemiIntensity: 1.18,
            sunColor: 0xffedd5,
            sunIntensity: 1.42,
            sunPos: [540, 560, -280],
            grassColor: 0x273517,
            treePrimary: 0x365314,
            treeSecondary: 0xa16207,
            isNight: false,
            hasSunsetFlare: false
          }},
          points: [
{fmt_pts(gen['cota']['waypoints'])}
          ]
        }}"""

new_circuits_array = "      const CIRCUITS = [\n" + ",\n".join([
    MONZA_BLOCK,
    fuji_block,
    hakone_block,
    spa_block,
    SUZUKA_BLOCK,
    SILVERSTONE_BLOCK,
    INTERLAGOS_BLOCK,
    SPIELBERG_BLOCK,
    COTA_BLOCK,
]) + "\n      ];"

src = re.sub(
    r"\s*const CIRCUITS = \[[\s\S]*?\n\s*\];",
    "\n" + new_circuits_array,
    src,
    count=1,
)

# Add estimateClassProLapTime helper before exports
helper_code = """
window.estimateClassProLapTime = function estimateClassProLapTime(circuitIdx, carClass, weather) {
  const c = CIRCUITS[circuitIdx] || CIRCUITS[0];
  const baseTime = (c && c.proLapTime) ? c.proLapTime : 95.0;
  const clsMult = (carClass === 'LMP1') ? 0.867 : ((carClass === 'HYPER') ? 0.940 : 1.0);
  const wetMult = (weather === 'wet') ? 1.125 : 1.0;
  return Number((baseTime * clsMult * wetMult).toFixed(3));
};
"""
src = src.replace("window.CIRCUITS = CIRCUITS;", helper_code + "window.CIRCUITS = CIRCUITS;", 1)

with open(CIRCUITS_JS, "w", encoding="utf-8") as f:
    f.write(src)

print("Successfully rebuilt js/circuits.js with all 9 circuits & metadata!")
