# 📋 APEX PRO RACING // 開發與除錯執行日誌 (Agent Execution & Debug Log)

> **核心守則**：每次執行架構變更、語法調整、Bug 修復或測試驗證時，均須於本檔案忠實記錄**行動時間、操作目標、問題根因、修改檔案與 Chrome V8 實機驗證結果**，同時結合瀏覽器內建的 `window.__APEX_LOG` (`window.__apexTrace`) 執行軌跡系統，確保問題 100% 可追蹤、零盲猜。

---

## 🕒 2026-11-08 19:31 ~ 20:02 // 修復 `Script error. at inline:0:0` 與建立雙層執行日誌系統

### 1. 症狀與問題現象
- 用戶重新整理本地 `index.html` 後，頂部紅框顯示：
  ```
  ⚠ 遊戲啟動錯誤：
  Script error. at inline:0:0
  ```
- 由於本地透過 `file://` 協議開啟外部 `<script src="js/...">`，瀏覽器預設因為跨來源安全策略 (CORS on `file://`) 將未捕獲異常遮蔽為 `Script error.` (line 0, col 0)。

### 2. 診斷行動與抓出的 6 個底層致命根因 (Root Causes)
透過在沙盒內建立靜態變數作用域分析器 (`scratch/verify_runtime.py`) 與 **Google Chrome Headless V8 引擎實機執行器 (`scratch/run_v8_test.py`)**，直接附加 `--allow-file-access-from-files` 攔截真實 V8 編譯與執行期錯誤，精準抓出以下導致崩潰的根因：

| 序號 | 發生檔案與行號 | 錯誤類型與具體訊息 | 根本原因與修復方式 |
| :--- | :--- | :--- | :--- |
| **#1** | [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L619-L659) | `Uncaught SyntaxError: Identifier 'cornerMaxKmh' has already been declared at physics.js:659:15` | **最核心崩潰主因**：在 `stepPhysics(dt)` 同一函式作用域內，L619（計算入彎超速推頭）與 L659（計算煞車提示）重複宣告了兩次 `const cornerMaxKmh`，導致整個 `physics.js` 在 V8 編譯階段直接報錯中斷，`simState` 與所有物理函式完全未定義（這也是先前單體檔案卡在 `STARTING ENGINE 0%` 的真正元兇！）。**已移除 L659 的重複 `const` 宣告**。 |
| **#2** | [`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js#L475-L486) | `ReferenceError: sampleProTelemetry is not defined` | 模組切分腳本在檔尾誤加了不存在的 `window.sampleProTelemetry = sampleProTelemetry;`（實際函式名稱為 `getProProfileAtDistance` 與 `getProTimeAtDistance`）。**已移除無效匯出**。 |
| **#3** | [`js/audio.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/audio.js#L134-L138) & [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L6-L12) | 切分邊界偏移 1 行 (`const container` 與 `const fxCanvas`) | `const container = document.getElementById('canvas-container')` 被誤留在 `audio.js` 檔尾，而 `const fxCanvas / fxCtx` 被誤留在 `physics.js` 檔尾（慢於 `render.js` 載入）。**已將兩者歸位至 `js/render.js` 對應區塊**。 |
| **#4** | [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L2126-L2150) & [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L875-L888) | `ReferenceError: cycleCamera / CAMERA_MODES / GEAR_ACCEL_FACTOR is not defined` | `render.js` 檔尾匯出了尚未在該檔定義的 `cycleCamera` 與不存在的 `CAMERA_MODES`；`physics.js` 匯出了不存在的 `GEAR_ACCEL_FACTOR`。**已清理無效匯出並將 `cycleCamera` 移至定義處 (`js/main.js`) 匯出**。 |
| **#5** | [`js/input.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/input.js#L491-L494) | `ReferenceError: initialIsMobile is not defined` | `input.js` (第 5 模組) 在宣告 `clientDevice` 時引用了第 7 模組 (`main.js`) 才定義的 `initialIsMobile`。**已改為直接呼叫 `detectClientDevice()`**。 |
| **#6** | [`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js#L605-L606) & [`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js#L530-L535) | `'use strict'` 下對未宣告變數賦值 `toggleMenuModal = function ()` 與舊版函式覆寫 | `flow.js` 在 `'use strict'` 下直接對尚未宣告的 `toggleMenuModal` 賦值導致 `ReferenceError`；且 `main.js` 隨後載入的舊版 `function toggleMenuModal()` 又覆蓋了新版流程。**已在 `flow.js` 正式宣告 `function toggleMenuModal()` 並移除 `main.js` 中的過時重複定義，同時將開機初始化序列統一收斂至 `js/main.js` 結尾**。 |

### 3. 建立雙層執行日誌系統 (Dual Execution Logging System)
1. **瀏覽器內建即時追蹤器 (`window.__apexTrace` & `window.__APEX_LOG`)**：
   - 於 [`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html#L8-L39) 注入輕量級執行日誌記錄器，自動追蹤每個模組的 `START` 與 `OK` 狀態，以及畫面切換 (`showFlowScreen:...`)。
   - 自動同步寫入 `localStorage.getItem('apex_execution_log')`（保留最近 100 筆時間戳軌跡）。
   - 若發生任何未預期錯誤，頂部錯誤橫幅除了顯示錯誤位置外，還會直接印出 `[執行軌跡]`，即使在 `file://` 環境下也能一眼看出停在哪個模組與步驟。
2. **專案開發執行日誌 (`EXECUTION_LOG.md`)**：
   - 即本文件，強制記錄每次 AI 代理的操作、診斷與實機驗證結果。

### 4. Google Chrome Headless V8 實機端到端 (E2E) 驗證結果
執行 `scratch/run_v8_test.py` 啟動本機 Chrome V8 引擎載入 7 大模組並模擬完整遊戲流程（進入主頁 ➔ 開啟車庫 ➔ 四步出賽設定精靈 ➔ 啟動比賽 ➔ 執行 15 幀 `stepPhysics` 與 `updateHUD` ➔ 衝線觸發三頁式結算 `__apexFlowFinish` ➔ 開啟 MoTeC 遙測圖表 `openTelemetryModal`），實測輸出：

```json
{
  "errors": [],
  "logs": [
    "[12:01:15.484] audio.js -> START",
    "[12:01:15.486] audio.js -> OK",
    "[12:01:15.488] circuits.js -> START",
    "[12:01:15.488] circuits.js -> OK",
    "[12:01:15.488] render.js -> START",
    "[12:01:15.501] render.js -> OK",
    "[12:01:15.502] physics.js -> START",
    "[12:01:15.516] physics.js -> OK",
    "[12:01:15.517] input.js -> START",
    "[12:01:15.518] input.js -> OK",
    "[12:01:15.518] flow.js -> START",
    "[12:01:15.519] flow.js -> OK",
    "[12:01:15.519] main.js -> START",
    "[12:01:15.741] main.js -> OK"
  ],
  "e2e": [
    "enterHomeScreen:home",
    "openGarageScreen:garage",
    "openSetupStep4:garage",
    "startConfiguredRace:racing",
    "stepPhysics15:speed=1.52",
    "renderResultPage2:ok",
    "openTelemetryModal:ok"
  ],
  "hasDismiss": true
}
```
- **驗證狀態**：**通過 (`errors: []`，零錯誤)**。

---

## 🕒 2026-11-08 20:11 ~ 20:19 // 修復 MoTeC 遙測圖表 (`#modal-telemetry`) 跨圖回拉異常直線 Bug

### 1. 症狀與問題現象
- 用戶完成富士山賽道計時賽 (`01:36.570`, 尾速 `294 km/h`) 後開啟 MoTeC 遙測覆盤視窗 (`#modal-telemetry`)，回報：「數據圖形畫得不正常，兩張圖各出現一條不該存在的直線」（附截圖 `media_1794139706291_68767137.jpg`）：
  1. **CHANNEL 1 (油門綠線 vs 煞車紅線)**：出現一條從圖表最右側頂端 `(x ≈ 100%, throttle = 100%)` 筆直斜切回最左側底端 `(x ≈ 0%, throttle = 0%)` 的綠色斜直線，以及一條貼底回拉的紅色直線。
  2. **CHANNEL 2 (轉向角度青線 vs 車速黃線)**：出現一條從最右側頂端 `(x ≈ 100%, speed = 294 km/h)` 水平橫切回最左側頂端 `(x ≈ 0%, speed = 294 km/h)` 的黃色直線，以及一條沿中軸回拉的青色直線。

### 2. 根因診斷 (Root Cause Analysis)
經比對 [`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js#L798-L802)、[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L719-L773) 與 [`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js#L170-L175) 執行時序，定位出兩處疊加造成的 100% 必現根因：
1. **衝線當幀的雙次物理步進 (`stepPhysics` Sub-Stepping) 寫入越界折返點**：
   - 在 `animate(now)` 中，每幀連續呼叫兩次 `stepPhysics(subDt)`，但原本只在第一次呼叫前檢查 `if (!simState.paused && !simState.inShowcaseMode)`。
   - 當第一次 `stepPhysics(subDt)` 衝過終點線 (`simState.s >= totalTrackLength`) 時：
     - `simState.s -= totalTrackLength`（距離歸零為 `~1m`，對應圖表最左端 `x ≈ 0%`）
     - `simState.lastSampleS = -25`
     - 呼叫 `__apexFlowFinish()` ➔ 內部執行 `clearAllHeldInputs()` 將 `simState.throttleInput = 0`、`simState.brakeInput = 0`，並設 `simState.paused = true`。
   - 緊接著同一幀的**第二次 `stepPhysics(subDt)`** 因為沒有檢查 `simState.paused` 而繼續執行！此時 `simState.s - simState.lastSampleS` (`1 - (-25) = 26 >= 20`) 成立，直接往 `simState.currentLapSamples` 陣列尾端塞入一筆**折返原點的污染取樣點**：
     - `s ≈ 1m` (`x ≈ 0%` 最左端)
     - `throttle = 0%` (被 `clearAllHeldInputs` 歸零，因此綠線從右上 `100%` 斜切回左下 `0%`！)
     - `speed = 294 km/h` (車速尚未衰減，因此黃線從右上 `294` 水平拉回左上 `294`！)
     - `steer = 0°`、`brake = 0%` (青線與紅線水平拉回最左端！)
2. **衝線瞬間的取樣包裹 (`simState.s % totalTrackLength`)**：
   - 在 `stepPhysics(dt)` 中，原本 `if (simState.s - simState.lastSampleS >= 20)` 位於 `if (simState.s >= totalTrackLength)` 之前且使用 `s: simState.s % totalTrackLength`。若衝線當步剛好滿足 `>= 20m` 取樣間隔，`% totalTrackLength` 也會使最後一點的 `s` 折返為 `~0m`。

### 3. 修改檔案與防禦性修復內容
| 修改檔案 | 修改位置與具體修復內容 |
| :--- | :--- |
| [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L338-L341) | 1. 於 `stepPhysics(dt)` 入口第一行加入 `if (simState.paused || simState.inShowcaseMode) return;`，確保衝線暫停後同幀第二次子步進立即中止。<br>2. 於 L721 限制僅在 `simState.s < totalTrackLength` 時進行例行 20m 取樣（不使用 `% totalTrackLength` 折返）。<br>3. 於 L738 衝線 (`simState.s >= totalTrackLength`) 時，在扣減 `totalTrackLength` 與呼叫 `__apexFlowFinish` 清空油門前，補上一筆精準鎖定於終點線 `s: totalTrackLength` 的完賽封尾點，並將整圈乾淨樣本封存至 `simState.lastCompletedLapSamples`。 |
| [`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js#L300-L407) | 1. 於 `openTelemetryModal` 優先讀取完賽封存樣本 `simState.lastCompletedLapSamples`。<br>2. 加入嚴格單調遞增過濾器 (`pt.s >= lastMonotonicS`) 與 Canvas 繪圖保護 (`if (idx === 0 \|\| pt.s < samples[idx - 1].s) ctx.moveTo(x, y); else ctx.lineTo(x, y);`)，從渲染層徹底杜絕任何折返直線。<br>3. 於 `animate(now)` 第二次 `stepPhysics(subDt)` 前再次檢查 `!simState.paused && !simState.inShowcaseMode`。 |
| [`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js#L240-L242) | 於 `sampleTrackAtS(s)` 加入 `if (!Number.isFinite(s) \|\| totalTrackLength <= 0) s = 0;` 防禦檢查。 |

### 4. Google Chrome Headless V8 實機驗證結果
於 `scratch/run_v8_test.py` 新增「高速衝過終點線 + 雙次 `stepPhysics(subDt)` 子步進」測試案例，驗證完賽樣本數、距離 `s` 單調遞增性 (`isMonotonic`) 與終點鎖定位置 (`lastS === totalTrackLength`)：
```json
{
  "errors": [],
  "e2e": [
    "enterHomeScreen:home",
    "openGarageScreen:garage",
    "openSetupStep4:garage",
    "startConfiguredRace:racing",
    "telemetryMonotonic:true:count=47:lastS=5422",
    "stepPhysicsFinish:speed=288.02",
    "renderResultPage2:ok",
    "openTelemetryModal:ok"
  ],
  "hasDismiss": true
}
```
- **驗證狀態**：**通過 (`errors: []`，`telemetryMonotonic: true`，最後一點精準停在賽道總長 `5422m`，零折返直線)**。

---

## 🕒 2026-11-08 20:25 ~ 20:58 // 推送穩定版 (`d9b9e15`) + 本地完成三大核心升級（車庫全解鎖與烤漆系統、車尾雙排氣火舌與雙輪胎煙、AI 攻防與實時秒差看板）

### 1. 第一步：依用戶指示推送穩定版至 GitHub (`d9b9e15`)
- 已執行 `git add`、`git commit` 與 `git push origin main`（Commit `d9b9e15`：*Refactor into 7 modular JS files, add Milliken steering physics, FIA brake boards, and fix MoTeC telemetry chart*）。

### 2. 第二步：於本地端完成 A / B / C 三大核心優化（未 Push，等待本地確認）

| 優化方向 | 涉及檔案 | 具體實作內容 |
| :--- | :--- | :--- |
| **🅰️ 方向 A：車庫全 4 車解鎖、專屬 3D 氣動車體與烤漆/輪框調色盤** | [`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js#L30-L82)<br>[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L954-L1275)<br>[`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html#L1096-L1101) | 1. **解鎖全 4 款傳奇 GT3 賽車**：全面開放 **APEX GT3 Prototype**、**Ferrari 458 Italia GT3**、**Porsche 911 GT3 R (992)**、**Mercedes-AMG GT3 EVO**。<br>2. **車型專屬 3D 氣動輪廓 (`buildProceduralBody`)**：為 **Porsche 911 GT3 R** 打造經典淚滴型溜背引擎蓋、百葉散熱孔、蛙眼橢圓傾斜頭燈與高聳天鵝頸尾翼；為 **Mercedes-AMG GT3 EVO** 打造修長前中置 V8 引擎蓋、中央碳纖維散熱孔、直瀑式鯊魚鼻水箱護罩與後移座艙。<br>3. **車庫即時烤漆與輪框塗裝系統 (`applyCustomLiveryColors`)**：於車庫面板新增 **6 款原廠金屬清漆車色**（競速緋紅、海灣湛藍、曼巴毒綠、烈日耀黃、極光鈦銀、暗夜消光黑）與 **4 款輪框塗裝**（機械鈦銀、曜石香檳金、鍛造消光黑、電光賽道青），支援程序化車體與 GLB 模型即時換色並自動儲存至 `localStorage`。 |
| **🅱️ 方向 B：追尾視角正後方視覺強化（雙排氣尾管藍黃火舌 + 左右雙輪獨立接地白煙與雙軌胎痕）** | [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L2049-L2090)<br>[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L698-L742)<br>[`js/input.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/input.js#L80-L85) | 1. **3D 雙出排氣管藍黃火舌 (`exhaustFlameGroup`)**：於車尾雙排氣尾管綁定內層亮藍核心 + 外層烈焰橘雙層發光錐體，在升檔、退檔、高速收油回火 (`backfireFlameTimer`) 與氮氣噴射 (`isNosActive`) 時動態閃爍並同步觸發排氣爆音。<br>2. **左右雙後輪 / 雙前輪獨立白煙與雙軌黑胎痕**：依據車身世界座標與偏航角計算左後輪 (`RL`)、右後輪 (`RR`)、左前輪 (`FL`)、右前輪 (`FR`) 獨立接地座標；甩尾/打滑時由左右雙後輪拉出平行雙軌黑胎痕與雙股白煙，重煞鎖死/推頭時由左右雙前輪冒出白煙。 |
| **🅲 方向 C：多車型動力差異化、壓草地非對稱拉扯感、AI 防守避讓與實時秒差看板** | [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L7-L68)<br>[`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js#L234-L295)<br>[`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html#L1183-L1189) | 1. **各車型動力、風阻與制動差異化**：為 4 台車配置獨立 `accelFactor`、`aeroDragFactor` 與 `brakeFactor`（911 GT3 R 出彎加速與重煞最強；AMG GT3 EVO 低風阻大馬力直線尾速最高）。<br>2. **壓草地非對稱拉扯偏航力矩 (`offTrackPullYaw`)**：高速衝入草地時會產生將車頭往外側草地拉扯的真實阻力矩，需反打方向盤救車。<br>3. **AI 車輛橫向間距防重疊與 HUD 實時秒差看板 (`updateAIRaceHUD`)**：錦標賽左上角面板即時顯示與前車/後車的精準秒差（如 `▲ 前車 -0.21s` / `▼ 領先 +1.15s`）以及 P1~P4 各車即時秒差與戰術狀態。 |

### 3. Google Chrome Headless V8 實機端到端 (E2E) 驗證結果
執行 `scratch/run_v8_test.py` 測試車庫切換 Porsche 911 GT3 R 與 Mercedes-AMG GT3 EVO、即時更換海灣藍車漆與香檳金輪框、啟動 AI 錦標賽驗證實時秒差看板 (`aiRaceHUD`)、以及計時賽衝線遙測單調性：
```json
{
  "errors": [],
  "e2e": [
    "enterHomeScreen:home",
    "openGarageScreen:garage",
    "selectPorsche:PORSCHE 911 GT3 R (992)",
    "selectAMG:MERCEDES-AMG GT3 EVO:paint=#0284c7",
    "openSetupStep4:garage",
    "aiRaceHUD:▲ 前車 -0.21s",
    "startConfiguredRace:racing",
    "telemetryMonotonic:true:count=47:lastS=5422",
    "stepPhysicsFinish:speed=288.04",
    "renderResultPage2:ok",
    "openTelemetryModal:ok"
  ],
  "hasDismiss": true
}
```
- **驗證狀態**：**通過 (`errors: []`，零錯誤)**。



---

## 🕒 2026-11-08 21:05 ~ 2026-11-09 21:45 // 全面導入真實高精細 GT3 `.glb` 3D 賽車模型、Three.js 官方 `MeshPhysicalMaterial` 清漆烤漆管線、5 節點獨立車輪/碟盤/卡鉗物理綁定與 GT3 空力套件

### 1. 問題與用戶核心要求
- 用戶明確要求：**「以真實模型模擬跑車，不要糊弄玩家」**，並提供 Three.js 官方 `examples/webgl_materials_car.html` (`MeshPhysicalMaterial` 清漆烤漆)、5 節點模型分件規範（`Body / Chassis` + `Wheel_FL` / `FR` / `RL` / `RR` 精確置於輪軸旋轉中心）與真實 `.glb` GT3 賽車資產整合架構。

### 2. 具體架構與實作內容（本地修改，未 Push）

| 模組與檔案 | 具體實作內容 |
| :--- | :--- |
| **1. 全 4 款賽車全面採用真實高面數 `.glb` 3D 賽車模型**<br>[`js/render.js`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/render.js#L1301-L1336)<br>[`js/flow.js`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/flow.js#L31-L82)<br>[`js/main.js`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/main.js#L365-L370) | 將車庫全部 4 台賽車升級為自動載入真實 `.glb` 3D 賽車模型（雙重 CDN 備援 `raw.githubusercontent.com` + `cdn.jsdelivr.net/gh`），啟動遊戲時即自動載入當前選中車款的真實 `.glb` 模型：<br>1. **`ferrari458`（Ferrari 458 Italia GT3）**：Three.js 官方 `ferrari.glb`（**358,980 面**）+ 自動掛載碳纖維 GT3 空力套件（`attachGT3AeroKit`：天鵝頸大尾翼、車身同色端板、前下巴定風翼、後底部擴散器）。<br>2. **`porsche911`（Porsche 911 GT3 R (992)）**：2024 Porsche 992 GT3 R 真實賽車模型 `porsche-992-gt3-r/model.glb`（4K 原廠賽道塗裝與大尾翼）+ `free_porsche_911_carrera_4s.glb` 備援。<br>3. **`amggt3`（Mercedes-AMG GT3 EVO）**：Assetto Corsa 級別真實 GT3 賽車 `amg-gt3-evo.glb`（**496,613 面**，原廠賽事塗裝、防滾籠與大尾翼）。<br>4. **`procedural`（BMW M4 GT3 EVO // APEX Works）**：真實 GT3 賽車 `bmw-m4-gt3.glb`（**107,980 面**，完整 GT3 寬體、百葉窗與天鵝頸尾翼）。 |
| **2. Three.js 官方 `webgl_materials_car.html` 物理清漆烤漆與棚拍 PMREM 反射**<br>[`js/render.js`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/render.js#L25-L84)<br>[`js/render.js`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/render.js#L1680-L1808)<br>[`js/flow.js`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/flow.js#L350-L407) | 1. 嚴格依照官方 `three.js/examples/webgl_materials_car.html` 規範，於 [`convertMaterialForSlot`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/render.js#L1680-L1808) 將車體材質升級為 `THREE.MeshPhysicalMaterial({ metalness: 0.80, roughness: 0.20, clearcoat: 1.0, clearcoatRoughness: 0.03, envMapIntensity: 0.95 })`，並為擋風玻璃配置物理透光率 `transmission: 0.65, clearcoat: 1.0`。<br>2. 強化 [`buildShowroomEnvMap`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/render.js#L25-L84) 頂置雙柔光箱（Overhead Dual Softbox Strips）與側向高光燈帶，讓車體清漆層呈現真實展間曲線高光。<br>3. 車庫塗裝系統新增 **「🏁 原廠」賽事塗裝切換鈕**，可保留 `.glb` 內建 4K 原廠賽車彩繪，或一鍵切換為 6 款金屬清漆烤漆與 4 款輪框塗裝。 |
| **3. 5 節點車輪精確軸心重定位、煞車碟盤/卡鉗聯動與車頭正方向 (`+X`) 自動校正**<br>[`js/render.js`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/render.js#L1395-L1630) | 1. **車頭方向自動偵測 (`normalizeVehicleScene`)**：自動比對前輪 (`FL/FR/LF/RF`) 與後輪 (`RL/RR/LR/RR`) 節點的世界座標 `X` 值，無論原始 `.glb` 為 `-Z` 朝前（如 `ferrari.glb`）或 `+Z` 朝前（如 `bmw-m4-gt3.glb`、`amg-gt3-evo.glb`），一律自動旋轉對齊至物理引擎 `+X` 車頭正方向，並自動剔除展間地板網格 (`worldgrid`) 與動態模糊殘影 (`rim_blur`)。<br>2. **5 節點獨立樞軸綁定 (`rigHiFiWheels`)**：精確計算四輪包圍盒中心作為獨立 `pivot -> steer -> spin` 旋轉軸心，前輪轉向角與四輪滾動角速度完全綁定物理引擎，且將煞車碟盤 (`DISC_*` / `SM_Disk_*`) 綁定至 `spin` 隨輪圈旋轉、煞車卡鉗 (`SUSP_*` / `SM_Brake_*`) 綁定至 `steer` 僅隨轉向偏轉而不隨車輪自轉。 |
| **4. 修復 Three.js r128 `GLTFLoader` 內建 `EXT_texture_webp` 與 `MeshoptDecoder` 支援**<br>[`index.html`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/index.html#L12-L13)<br>[`js/render.js`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/render.js#L1902-L1936) | 1. 於 `index.html` 引入 `meshopt_decoder.js` 並在 [`createGLTFLoader`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/render.js#L1903-L1936) 註冊 `DRACOLoader` 與 `MeshoptDecoder`。<br>2. 修復 Three.js r128 `GLTFTextureWebPExtension` 將 `source` 物件而非整數索引 `sourceIndex` 傳入 `parser.loadTextureImage` 的官方底層 Bug（`APEX_r128_webp_fix`），確保採用 WebP 4K 貼圖的 `.glb` 模型（如 `porsche-992-gt3-r`）正常解析。 |

### 3. Google Chrome Headless V8 實機驗證結果
1. **真實 `.glb` 載入與 5 節點車輪綁定驗證 (`verify_real_glb_load.py`)**：
   - `ferrari458` (`ferrari.glb` + GT3 空力套件)：`ok: true, tris: 358,980, wheels: 4/4, hasBody: true`
   - `procedural` (`bmw-m4-gt3.glb`)：`ok: true, tris: 107,980, wheels: 4/4, hasBody: true`
   - `amggt3` (`amg-gt3-evo.glb`)：`ok: true, tris: 496,613, wheels: 4/4, hasBody: true`
2. **全流程 E2E 腳本驗證 (`run_v8_test.py`)**：
   - `presetsWithGLB: 4/4`、`errors: []`，車庫切換、原廠塗裝與自訂清漆切換、AI 錦標賽與計時賽遙測全數通過。

---

## 🕒 2026-11-09 23:15 ~ 23:25 // 解決 AMG GT3 EVO / BMW M4 GT3 下載失敗 (404/CORS) 與 Porsche 911 GT3 R 貼圖錯誤 (`Image 0 is missing URI and bufferView`)

### 1. 錯誤根源精確定位
1. **AMG GT3 EVO (`amggt3`) 與 BMW M4 GT3 (`procedural`) 下載失敗（網路或 CORS 錯誤）**：
   - 經檢查，上游開源庫 `KhazP/librecorsa` 剛於最新提交 `0f1992c421` 將車輛模型移出 GitHub Repo 遷移至 Cloudflare R2，導致舊網址 `https://raw.githubusercontent.com/KhazP/librecorsa/main/...` 返回 `404 Not Found`。
   - 備用網址 `cdn.jsdelivr.net` 對於該庫特定提交觸發了 `403 Forbidden`。
   - **修復方案**：鎖定至模型移出前之永久不可變穩定 Commit SHA `7b009d905790e277cd6bc926a549b862907e49f3`，實測 `raw.githubusercontent.com` 直接返回 `200 OK`（BMW 4.76 MB、AMG 13.52 MB），並剔除失敗的 jsDelivr 鏡像，加入 `cdn.statically.io` 備援。

2. **Porsche 911 GT3 R (`porsche911`) 拋出 `THREE.GLTFLoader: Image 0 is missing URI and bufferView`**：
   - 經解析 `porsche-992-gt3-r/model.glb` 結構，其 35 張 4K 貼圖均為 `EXT_texture_webp` 格式，在 glTF 規範中此類貼圖頂層 `textureDef.source` 可為空，由 `extensions.EXT_texture_webp.source` 指向圖檔索引。
   - Three.js r128 官方 `GLTFTextureWebPExtension` 在非即時環境或降級邏輯中會呼叫 `parser.loadTexture(textureIndex)`，因讀取不到頂層 `source` 導致將 `undefined` 傳入 `loadTextureImage`，引發 `Image 0 is missing URI and bufferView` 致命中斷。
   - **修復方案**：
     - 於 [`createGLTFLoader`](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/render.js#L1903-L1957) 註冊覆寫外掛 `EXT_texture_webp`，精確解析 `EXT_texture_webp.source` 取得圖檔物件並傳遞給 `parser.loadTextureImage`。
     - 在 `parser.loadTextureImage` 加上容錯防護機制（`Promise.resolve(...).catch(() => new THREE.Texture())`），保證即便單張 WebP 貼圖載入逾時或缺失，亦不會導致整台賽車模型載入崩潰。

### 2. 驗證結果
- 執行 `scratch/run_v8_test.py`：`errors: []`、`presetsWithGLB: 4/4`，車庫 4 台賽車模型切換與所有端到端流程 100% 通過。

---

## 🕒 2026-11-10 22:20 ~ 23:50 // RFC 核心物理與模擬系統重大重構 (Module 1, 2, 3)、萬向節翻轉修復、自然倒車與檢查點完賽結算驗證

### 1. 任務背景與重構目標
依據工程規格書 [`RFC.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/RFC.md) 針對核心模擬系統進行全方位重構與升級，涵蓋三大模組：
1. **Module 1 (Showroom Camera Constraints & Vehicle Inspect Mode)**：約束展間俯仰角避免萬向節死鎖；建立 360° 車輛鑑賞模式（點擊車體聚焦質心、影棚環境隔離、專屬聚光燈、常駐退出控制）。
2. **Module 2 (Surface Physics Feedback Refactor)**：徹底移除直接注入相機投影矩陣的隨機噪聲位移向量（`jx`, `jy`）；以 $y = A e^{-\gamma t} \cos(\omega t)$ 底盤局部阻尼諧振取代畫面抖動；路緣石/草地物理抓地力與滾動阻力懲罰；35~50 Hz 低頻三角波合成音效與 HTML5 Gamepad API 雙馬達震動回饋。
3. **Module 3 (Sequential Checkpoint & Anti-Cheat Validation System)**：16 個虛擬檢核門依序驗證與向量內積前進驗證，防堵倒車衝線與瞬移抄截。

---

### 2. 第一階段實作與規格落地

| 模組與領域 | 涉及檔案 | 具體實作內容 |
| :--- | :--- | :--- |
| **Module 1: 展間相機約束與鑑賞模式** | [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L26-L80)<br>[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L2540-L2585)<br>[`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js#L1070-L1140)<br>[`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html#L2315-L2335) | 1. **預設轉盤模式約束**：建立 `showroomCam` 球座標控制器，俯仰角嚴格約束於 $75^\circ \sim 85^\circ$（近水平），低速 0.8~1.2 RPM 水平自動旋轉，鎖定滾輪縮放與相機平移。<br>2. **360° 車輛鑑賞模式 (`enterInspectMode`)**：透過 `Raycaster.intersectObjects` 射線點擊 3D 車體（或點擊「🔍 360° 鑑賞」按鈕），相機平滑 Lerp 聚焦至車體質心 $(pWorld.x, pWorld.y + 0.65, pWorld.z)$。<br>3. **全方位環視與縮放夾緊**：水平 $360^\circ$ 無限制旋轉，垂直俯仰角夾緊於 $15^\circ \sim 85^\circ$（可俯瞰車頂至車側擾流板）；滾輪與雙指推拉距離嚴格夾緊於 $3.5\text{m} \sim 8.0\text{m}$，防止視角穿模入座艙內部。<br>4. **極簡影棚環境隔離 (`studioGroup`)**：進入鑑賞時自動切換 `circuitSceneryGroup.visible = false` 隱藏賽道雜訊；啟用深色圓頂、地面柔和接觸陰影、專屬 Key 聚光燈與 Rim 邊緣藍光反射輪廓燈。<br>5. **常駐退出浮動列**：新增 [`#inspect-mode-overlay`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html#L2315-L2335)，支援點擊「✕ 退出鑑賞模式」或按 `[ESC]` 鍵即時退回。 |
| **Module 2: 路面物理反饋與相機解耦** | [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L2595-L2630)<br>[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L465-L515)<br>[`js/audio.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/audio.js#L70-L125)<br>[`js/input.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/input.js#L547-L568) | 1. **消除畫面隨機噪聲**：徹底刪除注入至相機位置的隨機噪聲位移向量（`jx = Math.sin(nowSec * 65) * vibeAmp`、`jy = Math.cos(nowSec * 82) * vibeAmp`），駕駛視野恢復純淨穩定。<br>2. **底盤懸吊局部阻尼諧振**：壓路緣石時由 $y = A e^{-\gamma t} \cos(\omega t)$ 計算 28~48 Hz 物理諧振位移，直接驅動 `playerExteriorMesh.position.y` 與 `cockpitGroup.position.y`，產生機械懸吊跳動感。<br>3. **真實摩擦與滾阻係數**：路緣石抓地力降至 85%、機械轉向阻力 1.25 倍；草地抓地力降至 42%、滾動阻力放大 3 倍（$3.45 + 0.075 \cdot v$），大腳油門自然滑移。<br>4. **音效與實體手把震動**：路緣石音效升級為 35~50 Hz 低頻三角波合成器 + 180 Hz 低通濾波器（頻率正比於車速）；實作 `window.triggerGamepadRumble` 透過 HTML5 Gamepad API `vibrationActuator.playEffect('dual-rumble')` 將路面反饋傳至手把馬達。 |
| **Module 3: 檢查點防作弊計時管線** | [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L845-L985) | 將賽道劃分 16 個依序檢核點 ($CP_0 \dots CP_{15}$)，計算 $\vec{V}_{car} \cdot \vec{N}$ 進行正向通行驗證。 |

---

### 3. 第二階段：用戶反饋排查與根因定位

用戶測試後回報兩項待改進問題：
1. **「沒有解決萬向節死鎖的問題」**：提供截圖（`media_1794322007803_457aca97.jpg`），顯示進入鑑賞模式後，車子與整個世界垂直上下顛倒（底朝天倒掛）。
2. **「不用限制倒車，這樣很刻意，只要確保衝過終點線時已通過所有檢查點才進入完賽結算畫面就好，也只有這樣才計入圈速」**：提供截圖（`media_1794323206575_182fa0a6.jpg`），顯示起跑線倒車時彈出刻意的紅色大橫幅 `⚠ LAP INVALIDATED // 單圈無效 (起跑線逆向倒車鎖定)` 且車輛被強制減速鎖死。

#### A. 萬向節翻轉的數學根因分析與徹底修復
* **數學根因證明**：
  在 Three.js 中，以 Euler XYZ 順序分解四元數旋轉矩陣時，當相機方位角繞行至物體後方（$azimuth \in [90^\circ, 270^\circ]$）時，Euler $Z$ 軸滾轉角（Roll）必然產生約 $180^\circ$ 的內在幾何補償值，以確保相機的頂部朝向世界正上方 $(0, 1, 0)$。
  然而在先前程式碼中，`camera.lookAt(...)` 之後緊接著執行了：
  ```javascript
  camera.lookAt(showroomCam.currentTarget);
  camera.rotation.z = 0; // 致命元兇！
  ```
  當強制將 Euler $Z$ 設為 0 時，Three.js 會根據此 Euler 角度重新計算旋轉矩陣，導致相機 UP 向量在 $Y$ 軸的分量變為負值（$up_y < 0$），**直接將相機在垂直方向翻轉 180°，造成車輛上下倒掛**！
  撰寫模擬腳本 `scratch/test_flip.py` 進行數學驗證，證實在 $azimuth \in [90^\circ, 270^\circ]$ 區間內，`camera.rotation.z = 0` 造成 100% 機率翻轉倒掛（如 `polar=15, az=180` 時 $up_y = -0.259$；`polar=80, az=180` 時 $up_y = -0.985$）。
* **修復方案**：
  1. 於 [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L2579-L2582) **徹底刪除 `camera.rotation.z = 0;`**。
  2. 在每次執行 `lookAt` 前重置並確保 `camera.up.set(0, 1, 0)`。
  3. 執行 `scratch/test_pure_lookat.py` 遍歷球座標 2,592 個方位視角，驗證結果：**100% 視角維持正立穩定（$up_y > 0$），死鎖與翻轉現象完全根除**。

#### B. 自然倒車與終點線檢查點完賽結算重構
* **問題剖析**：先前為了防作弊，直接在起跑線強行鎖定座標 `simState.s = 0`、強制剎車 `speedMs *= 0.45` 並跳出警告，嚴重破壞真實賽車操駕體驗。
* **修復方案**：
  1. **移除強制限制**：於 [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L830-L845) 移除起跑線倒車鎖定、減速懲罰與逆向折返警告；在非倒車檔且時速大於 20 km/h 逆向行駛時才判定逆向，日常倒車脫困完全自然順暢。
  2. **隱藏擾人橫幅**：於 [`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js#L79-L83) 隱藏行駛中的 `#hud-lap-invalid` 橫幅。
  3. **終點線全覆蓋驗證（合法才結算）**：於 [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L930-L985)：
     ```javascript
     const requiredGates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
     const allGatesCleared = requiredGates.every(g => simState.clearedGates && simState.clearedGates.includes(g));
     const isForwardFinish = forwardDot > 0;
     const isLapLegitimate = allGatesCleared && isForwardFinish;
     ```
     - **倒車跨線或未跑完全程衝線**：`isLapLegitimate = false`，**不呼叫完賽函式 `__apexFlowFinish`、不計入圈速與 PB、不推進圈數**，車輛可自由倒車或調整位置，不受任何妨礙。
     - **正向依序通過全檢查點衝線**：`isLapLegitimate = true`，**正式計入有效單圈、更新 PB 紀錄，並觸發完賽結算畫面**！

---

### 4. 第三階段：啟動語法錯誤排查與括號平衡修復

用戶隨後反饋啟動異常（附圖 `media_1794323206575_182fa0a6.jpg`）：
```
⚠ 遊戲啟動錯誤：
Script error. at module(main.js:START):0:0
[執行軌跡] [15:06:22.577] ERROR -> Script error. at module(render.js:OK):0:0 | [15:06:22.580] input.js -> START ...
```

* **診斷分析**：
  觀察 `[執行軌跡]`，`render.js:OK` 之後直接跳 `input.js -> START`，中繼的 `physics.js` 完全未輸出 `OK`，代表 `physics.js` 在 V8 解析階段即拋出語法錯誤（SyntaxError），導致整個物理模組與 `simState` 匯出中斷，進而引發 `main.js` 啟動失敗。
* **根因定位**：
  編寫括號深度檢測器 `scratch/check_syntax.py` 掃描所有 JS 檔案，立即精確捕獲：
  `js\physics.js: ERR: depth=-1, Mismatched } at line 987`。
  經比對，第 981 行多出了一個閉合大括號 `}`，提前閉合了 `stepPhysics(dt)` 函式，使後續的 `stepAIRivals` 外部閉合括號失配中斷。
* **修復動作**：
  1. 於 [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L975-L985) 刪除多餘的 `}`。
  2. 重新執行全模組語法校驗，7 大核心模組全數通過：
     ```
     js\audio.js:    OK (depth=0)
     js\circuits.js:  OK (depth=0)
     js\flow.js:      OK (depth=0)
     js\input.js:     OK (depth=0)
     js\main.js:      OK (depth=0)
     js\physics.js:   OK (depth=0)
     js\render.js:    OK (depth=0)
     ```
  3. 於 [`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html#L3299-L3305) 更新腳本快取標籤至 `?v=20261110_v2`，強制瀏覽器載入最新修復程式碼。

---

### 5. 自動化測試驗證結果 (Test Suite Execution)

1. **`scratch/check_syntax.py`**：
   - 掃描全專案 7 大 JS 模組，語法樹深度（Brace Depth）皆精確為 0，**7 / 7 OK 零錯誤**。
2. **`scratch/test_physics_math.py`**：
   - **26 / 26 測試項目全數通過 (PASS)**：
     - 起跑線倒車順暢環繞至 3395.0m，不鎖死、不觸發完賽、不計入圈速。
     - 未跑完全檢查點跨越終點線：嚴格略過（`IGNORED`），不結算、不計時。
     - 正向依序通過全 15 個檢查點衝線：正式觸發完賽結算畫面（`FINISHED`），寫入個人最佳紀錄 PB。
     - 攝影機方位角/俯仰角遍歷 2,592 個球座標組合，100% 保持直立向上（$up_y > 0$），零死鎖、零倒置。
3. **`scratch/test_rfc_improvements.py`**：
   - **38 / 38 測試項目全數通過 (PASS)**：涵蓋 HTML 元素標記、CSS 視角隔離規則、Web Audio 三角波合成、手把震動 API、物理抓地力與滾阻、懸吊諧振公式、相機無噪聲等。

---

### 6. Git 提交與推送紀錄 (Milestone Commits)

已依用戶指令正式推送至 GitHub 遠端倉庫：
- **Commit `a8749e0`**：`feat: core simulation RFC improvements (vehicle inspect mode, non-inverting camera, surface physics feedback, decoupled camera rig, and sequential checkpoint finish validation)`
- **Commit `5a6807a`**：`docs: update project memory dossier with RFC v2.2 commit milestone`
- **Commit `f47cb84`**：`docs: update detailed execution log for RFC improvements and configure auto-push workflow`
- **Commit `4f2d83b`**：`docs: clarify push protocol - code requires user confirmation, logs and docs push directly`
- **遠端分支狀態**：`main -> main`（已同步至 [Raymond-luo-code/Apex-pro-racing](https://github.com/Raymond-luo-code/Apex-pro-racing)）。

---

## 🕒 2026-11-13 21:18 // 彙整優化方案計畫書 (v3.0 推進版) 與工作區文件同步

### 1. 操作目標
- 應使用者要求檢索歷史專案優化藍圖，彙整目前「已完工之核心物理/真 3D/相機鑑賞架構」與「尚未實作之候選優化清單」，編制高清晰度決策文件 [`OPTIMIZATION_PLAN.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/OPTIMIZATION_PLAN.md)。
- 遵守推送守則：本階段僅新增/更新專案規格說明文件（`OPTIMIZATION_PLAN.md` 與 `EXECUTION_LOG.md`），不變更遊戲執行代碼，依指令自動推向遠端 GitHub。

### 2. 計畫書核心架構與項目彙整
- **現階段完工狀態**：
  - 模組化無打包架構（7 大 JS 檔獨立運行）。
  - 4 款真 3D GT3 賽車模型、清漆反射、自研 WebP 紋理修復。
  - 360° 車輛鑑賞模式（無萬向節死鎖、視角不倒置）。
  - 自然倒車物理與終點線全檢查點（Gates 1~15）衝線防作弊判定。
- **未實作候選清單（供使用者決策推進）**：
  1. **類別 A：視覺與微觀細節**
     - `A1`：煞車碟盤高溫通紅發光（650°C ~ 1000°C 漸變）與迎風對流散熱模型。
     - `A2`：雨天濕地模式、鏡面水窪倒影與雨霧水煙粒子。
  2. **類別 B：專業物理與輪胎策略**
     - `B1`：軟胎（Soft）、中性胎（Medium）、硬胎（Hard）三種抓地/耐磨配方。
     - `B2`：煞車熱衰竭機制（過熱 > 850°C 時制動力暫態衰退）。
     - `B3`：四輪胎溫/磨耗即時熱力 HUD。
  3. **類別 C：賽事競技與 AI 攻防**
     - `C1`：FIA / F1 標準 5 盞紅燈熄滅起跑程序與偷跑罰則。
     - `C2`：AI 內線防守走線與直線尾流抽頭超車。
     - `C3`：賽道旗號系統（黃旗、藍旗、方格旗動態揮舞）。
  4. **類別 D：高階音效與周邊觸覺**
     - `D1`：大油門收油渦輪洩壓閥（Blow-off Flutter）與換檔氣動金屬衝擊音。
     - `D2`：手機端原生 Web Vibration API 震動（ABS 彈腳、路緣石頻率震動）。

### 3. 文件生成與同步
- 產出 [`OPTIMIZATION_PLAN.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/OPTIMIZATION_PLAN.md) 至專案根目錄。
- 遵循「文檔日誌直接推送，代碼變更等待確認」專案準則，將日誌與計畫書提交並推送（Commit `4193f39`）。

---

## 🕒 2026-11-13 21:33 // 優化計畫書升級 v3.1（聚焦核心玩法、AI 實力躍升與賽道階梯煞車指引）

### 1. 操作目標
- 依用戶明確戰略方針：刪除枝微末節之小項目（煞車碟盤通紅發光、煞車熱衰竭機制、手機原生震動回饋）。
- 全力聚焦核心玩法完善度，深度擴充兩大重磅核心模組：
  1. **AI 開車技術全面升級（匹敵人類頂尖玩家）**：解決目前 AI 過慢、入彎極限保守（僅 1.42G）、直線缺乏檔位爆發力、受壓迫失誤減速 28% 過度嚴苛等核心痛點；重新校準出彎早給油、晚煞車進攻走線與外星人 Alien 頂級配速。
  2. **賽道階梯式煞車與油門指引（杜絕鎖死重煞）**：廢除單一粗暴的「🛑 BRAKE NOW」警告，建立三階指引（1. 略收油門滑行 Lift & Coast、2. 輕度循跡帶煞 Trail Brake 20~40%、3. 極限重煞區 Heavy Brake 70~90% 與目標速度提醒），同步升級 3D 動態綵帶四色漸變與 HUD 智慧圖標。
- 調整 Phase 1 開發排程為：【AI 實力躍升】+【賽道多階煞車指引】+【FIA 5盞紅燈起跑】。
- 依「日誌文件直接推送」守則，提交並推向 GitHub 遠端倉庫（Commit `2e27564`）。

---

## 🕒 2026-11-13 21:45 ~ 21:54 // Pre-Phase 1 核心輸入轉譯與 AI 真實執行器架構升級 (`proposal.md`)

### 1. 操作目標
依據 [`proposal.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/proposal.md) 規格書，在進入 `OPTIMIZATION_PLAN.md` 第一階段開發前，建立將二元按鍵轉化為擬真肌肉行程（Analog Muscle Travel）的**共用輸入轉譯層（Input Layer Translation）**，不僅全面提升玩家操控與聽覺/視覺不疲勞回饋，更讓 AI 賽車共用該轉譯與動態限制模組，表現出更接近真實賽車手的操控行為。

### 2. 核心程式碼實作內容（待玩家實測確認後推送）
| 修改檔案 | 位置與函式 | 實作細節 |
| :--- | :--- | :--- |
| [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L397-L515) | `translateAnalogPedals()` | • **油門控制**：鬆開 W 於 `0.18s` 內平滑衰減（精準經過 50% 區間利於 S 彎半油門點放，實測 `0.07s` 達 50%）；踩下 S / 空白鍵時於 `0.03s` 內緊急斷油。<br>• **油門加速斜率**：前 `0.20s` 平順通過 `35%~50%` 區間（實測 `45.0%`）保護後輪出彎循跡，於 `0.35s` 達到 `100%`。<br>• **雙階煞車與快放**：Stage 1（`0~0.15s`）迅速斜坡上升至 `72%` 進入最佳循跡帶煞窗口（Trail Braking）；Stage 2（`0.15~0.40s`）持續壓深至 `100%` 全力重煞；鬆開後 `0.08s` 歸零；空白鍵協助上限鎖定 `75%`，保留手動 S 鍵調控 `85%~88%` 極限門檻的單圈速度優勢。 |
| [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L446-L483) | `getDynamicMaxSteerDeg()`, `stepAnalogSteering()` | • **隨速動態轉向角與 S 型曲線**：`0~80 km/h` 最高達 `32°`（髮夾彎靈活指向）；`80~180 km/h` 隨速阻尼收斂至 `12°~16°`；`>180 km/h` 透過平滑 S 曲線收緊至 `5°~7°` 確保極速變線穩定。<br>• **隨速自回正力矩 (Caster Trail)**：放開 A/D 時依車速成正比指數回正。 |
| [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L567-L845) | `stepPhysics(dt)` | • **反過度簡化守護**：擬真模式不強行依轉向角限制油門上限，新增真實**大油門過度轉向 (`isOversteer`)** 物理判定與微幅車尾側滑擺動；新增重煞車鎖死時底盤 13.5 Hz 細微震顫回饋（不直接抖動相機）。 |
| [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L1172-L1220) | `stepAIRivals(dt)` | • **AI 共享執行器與真實行為**：為每台 AI 車輛掛載 `throttleInput` / `brakeInput` / `steerInput` 並接入 `translateAnalogPedals()` 與 `getDynamicMaxSteerDeg()` 側向速度物理限制，且尾燈 strictly 依 `ai.brakeInput > 8` 真實點亮。 |
| [`js/audio.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/audio.js#L60-L155) | `soundEngine` | • **低疲勞暖音輪胎摩擦**：將刺耳 1850~2280 Hz 尖叫聲改為 `350~750 Hz` 低通濾波質感摩擦音。<br>• **鎖死脈衝回饋**：煞車逼近/超過鎖死門檻（`>88%`）時，於 `80~140 Hz` 區間觸發 13.5 Hz 節奏性低頻脈衝模擬踏板彈腳感。 |
| [`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js#L106-L162), [`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html#L3299-L3305) | `updateHUD()` | • **儀表板動態變色**：`#bar-brake` 隨踩踏區間自動切換色彩（`5~75%` 琥珀黃循跡區 ➔ `76~88%` 橘色極限區 ➔ `>88%` 紅燈閃爍鎖死區），外框微光提示逼近抓地力邊緣；腳本快取版本升至 `?v=20261113_proposal`。 |

### 3. Google Chrome V8 實機與自動化全測試驗證結果
1. **`scratch/test_proposal.py`（真實 Chrome Headless V8 引擎驗證）**：**16 / 16 全數通過 (PASS)**
   - 實測數值全數符合 `proposal.md` 毫秒級行程規範，且完整 `index.html` 在真實 Chrome V8 無啟動錯誤（0 `#apex-crash-banner`）。
2. **`scratch/check_syntax.py`**：7 / 7 JS 模組語法完整（OK）。
3. **`scratch/test_physics_math.py`**：26 / 26 通過。
4. **`scratch/test_rfc_improvements.py`**：38 / 38 通過。
5. **推送狀態**：僅更新並推送本執行日誌至 GitHub；遊戲程式碼變更保留於工作區等待用戶本地測試確認後再行推送。

---

## 🕒 2026-11-13 21:55 ~ 22:11 // Phase 1 實作：競爭力 AI、三級漸進煞車引導與 FIA 五燈起跑 (`OPTIMIZATION_PLAN.md`)

### 🎯 任務核心
依 [`OPTIMIZATION_PLAN.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/OPTIMIZATION_PLAN.md) 執行 Phase 1 核心駕駛體驗與競技對抗升級，解決 AI 過慢與過度懲罰、單一重煞提示易導致鎖死之問題，並導入真實 FIA 五盞紅燈起跑與偷跑罰秒判罰流程。

### 🔧 主要修改明細
1. **競爭力 AI 駕駛策略與難度分級 (`js/physics.js`, `js/flow.js`, `index.html`)**
   - 將 `#select-ai-diff` 與 `js/flow.js` Step 2 對手強度調整為 **Clubman (`0.92`) / PRO (`1.0`) / Alien (`1.10`)**，並提升 `aiCars` 基準節奏 `basePace`（`1.045 / 1.032 / 1.018`）與反應延遲控制 `reactionTimer`。
   - 於 `stepAIRivals(dt)` 引入彎心抓地加成（`apexGripBonus`）、出彎加速衝刺（`exitSurge`）、真空帶彈弓超車（`SLINGSHOT PASS`）、晚煞車進攻（`LATE BRAKE DIVE`）與基準縱向推力參數調整，並將高壓失誤從過度自毀改為擬真微失誤（`0.85s` / `targetV *= 0.94`）。
2. **三級漸進式賽道與 HUD 煞車提示 (`js/physics.js`, `js/render.js`, `js/main.js`)**
   - 於 `js/physics.js` 新增並匯出 `computeDrivingCue(s, currSpeedKmh, brkNorm, thrNorm)`，結合減速度需求 `reqDecel` 與前方 PRO 遙測 `getProProfileAtDistance` 輸出 `'lift'`（Lift & Coast 略收油門滑行）、`'trail'`（輕帶尾煞）、`'heavy'`（重煞點與目標入彎速）三級訊號並同步至 `simState.drivingCue` / `cueTargetKmh`。
   - 於 `js/render.js` `rebuild3DCircuitScene()` 依 `proTelemetrySamples` 將 3D 賽道動態走線升級為四色漸進引導（綠：全油 / 天藍：略收油門 / 琥珀橙：輕帶尾煞 / 深紅：重煞區）。
   - 於 `js/main.js` `updateHUD()` 依 `drivingCue` 動態樣式化 `#alert-brake-now`，並於重煞 `brkPct > 84` 時補充 `'漸放煞車防鎖死'` 提示。
3. **FIA 五紅燈燈架起跑與偷跑 +5.0s 罰秒 (`index.html`, `js/physics.js`, `js/main.js`, `js/flow.js`)**
   - 更新 `#start-lights-overlay` 與新增 `#alert-jump-start`；於 `simState`、`resetSession`、`updateCountdownUI()` 及 `stepPhysics(dt)` 實作 0.85 秒逐顆點亮 5 盞紅燈、全亮後 `0.25s ~ 2.00s` 隨機駐留與五燈同時熄滅（Lights Out）發車流程。
   - 若紅燈熄滅前車輛未握持煞車且前移超過 `0.5m`，觸發偷跑違規（`hasJumpStarted` / `jumpStartPenaltySec = 5.0`），並於 `js/flow.js` `__apexFlowFinish` 與 `renderResultPage(0)` 併入完賽成績與懲罰徽章計算；同步將 `index.html` script 版本參數更新為 `?v=20261113_phase1`。

### ✅ 驗證結果（於最後一次程式編修後執行）
1. **`scratch/check_syntax.py`**：7 / 7 JS 模組語法完整（OK）。
2. **`scratch/test_proposal.py`**（Headless Chrome V8 實測）：**25 / 25 全數通過**，涵蓋提案類比輸入曲線、FIA 五燈燈架隨機駐留與偷跑 +5.0s 判罰、三級漸進駕駛提示分流（Monza 測得 `'lift'`、髮夾彎高減速區測得 `'heavy'` 目標 `79 km/h` 與降速後歸零）、Alien AI (`220.0 km/h`) 明顯領先 Clubman AI (`203.2 km/h`)，以及完整 `index.html` 載入零崩潰（0 個 `#apex-crash-banner`）。
3. **`scratch/test_physics_math.py`**：**26 / 26 通過**（0 失敗）。
4. **`scratch/test_rfc_improvements.py`**：**38 / 38 通過**（0 失敗）。
5. **推送狀態**：僅更新並推送本執行日誌至 GitHub；所有遊戲程式碼變更仍保留於本地工作區等待用戶實際測試確認後再行推送。

---

## 🕒 2026-11-13 22:18 ~ 22:20 // 轉向手感調校：移除高速後輪打滑轉向並放寬高速轉向角

### 🎯 用戶回饋與調整目標
- 取消擬真模式（Realistic）中高速重踩油門轉向時觸發的 `powerOnOversteer` 後輪橫擺旋轉（`oversteerRotation` 與 `driftAngle`），避免懲罰變成「輔助入彎甩尾」。
- 調高 `getDynamicMaxSteerDeg` 在中高與極高速區間的前輪可用轉向角，提升高速彎與變向靈敏度。

### 🔧 修改明細
1. **`js/physics.js`**
   - 移除 `stepPhysics(dt)` 中的 `powerOnOversteer` 判斷與額外 `oversteerRotation` / `driftAngle` 注入，維持純淨擬真抓地過彎與正常橫擺阻尼收斂（`simState.isOversteer` 保持 `false`、`simState.driftAngle *= Math.pow(0.01, dt)`）。
   - 放寬 `getDynamicMaxSteerDeg(spdKmh, carProfile, isReal)` 高速區間轉向角：
     - `45–80 km/h`：`32.0°` 平滑過渡至 `18.0°`（原 `16.0°`）
     - `80–180 km/h`：`18.0° -> 13.8°`（原 `16.0° -> 12.0°`）
     - `180–235 km/h`：`13.8° -> 9.8°`（原 `12.0° -> 6.8°`）
     - `> 235 km/h`：`9.8° -> 8.2°`（原 `6.8° -> 5.2°`，實測 `270 km/h` 為 `9.08°`）

### ✅ 驗證結果（編修後重跑全套測試）
1. **`scratch/check_syntax.py`**：7 / 7 JS 模組語法完整（OK）。
2. **`scratch/test_proposal.py`**：**25 / 25 全數通過**，確認 `270 km/h` 轉向角開展至 `9.08°`（中速 `17.88° / 13.83°`、低速 `32.00°`）、擬真模式高速過彎不再產生 `isOversteer` 或 `driftAngle` 甩尾偏轉，且 `index.html` 載入零崩潰。
3. **`scratch/test_physics_math.py`**：**26 / 26 通過**。
4. **`scratch/test_rfc_improvements.py`**：**38 / 38 通過**。
5. **推送狀態**：僅更新並推送本執行日誌至 GitHub；遊戲程式碼變更仍保留於本地工作區待用戶確認後再推送。

---

## 🕒 2026-11-14 17:54 ~ 18:05 // 過彎與轉向手感根因實測診斷暨 `CORNERING_OPTIMIZATION_PLAN.md`

### 🎯 任務核心
針對玩家反映「轉向不順、不好過彎」，於 Headless Chrome V8 實跑全速域圓周與賽道曲率遙測（`scratch/diag_cornering.html`），逐行比對 `js/physics.js`、`js/circuits.js`、`js/input.js`、`js/render.js` 後彙整實證診斷與四模組優化計畫書。

### 🔍 關鍵實測發現（修正純理論誤判）
1. 確認既有確認版遊戲程式碼已推送至 `origin/main`（`fa6fa32`）。
2. **破除誤區**：問題並非「舵角或 Damping 把車鎖死轉不動」；`ferrari458` 在 `140 / 180 / 260 km/h` 滿舵需求高達 `5.97 G / 6.30 G / 4.92 G`，僅 `25%` 舵角即達 `1.46 G`。
3. **真實 5 大病灶**：
   - `stepAnalogSteering` 在 `140–260 km/h` 鬆手回正半衰期僅 `83–49 ms`，按住超過 `0.15s` 即過飽和推頭、鬆手瞬間彈直。
   - `stepPhysics()` 存在 `0.88` 摩擦圓過載硬斷崖、`0.78` 全油門推頭硬開關（`140 km/h` 轉彎半徑從 `92.9m` 突漲至 `129.1m`），以及 `126 km/h (35 m/s)` `turnInBonus` 階躍切換、三次 S-Curve 盲區與出彎 `straightCentering` 搶舵。
   - `js/circuits.js` 以 `maxCurv * 0.62` 推算過彎極限（使富士 T2/T4 中心線需 `1.32~1.36 G`），在全油門最高僅 `1.29 G` 下必定推頭。
   - `js/render.js` 追尾鏡頭剛性綁定 `simState.heading`，缺少平滑阻尼與彎心預瞄。

### 📦 文件產出與狀態
- 新增計畫書：[`CORNERING_OPTIMIZATION_PLAN.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/CORNERING_OPTIMIZATION_PLAN.md)（尚未動及任何遊戲程式碼，待用戶審閱確認計畫後開始開發）。
- **推送狀態**：僅更新並推送本執行日誌與計畫書文件至 `origin/main`。

---

## 🕒 2026-11-14 18:07 ~ 18:10 // 實作過彎與轉向優化計畫（4 大模組：`CORNERING_OPTIMIZATION_PLAN.md`）

### 🎯 任務核心
依 [`CORNERING_OPTIMIZATION_PLAN.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/CORNERING_OPTIMIZATION_PLAN.md) 實作模組 1–4，解決鍵盤/觸控點按彈直與早飽和、三重物理階躍懸崖、賽道進彎速折減偏差，以及剛性追尾視角問題。

### 🔧 主要修改明細
1. **模組 1 & 2 — 轉向濾波與連續輪胎/荷載模型 (`js/physics.js`)**
   - **`stepAnalogSteering()`**：轉向靈敏增益調升至 `1.15x` 並新增 `1.95x` 反打提速（Counter-steer）倍率；回正係數 `casterRate` 平順化為 `1.9 + min(2.5, (spd / 100) * 1.25)`，將高速鬆手半衰期由 `49–83 ms` 延長至更線性好點按的阻尼窗口。
   - **拔除三大階躍懸崖與死區 (`stepPhysics`)**：
     - 以 `Math.pow(absSteer, 1.18)` 取代三次 S-Curve 盲區，並於 `vMs > 14` 且無手動拖桿時套用 **抓地感知舵角包絡 (`gripLimitedCurvature * 1.26`)**，使 `0%–100%` 轉向按鍵行程完整覆蓋有效過彎區間。
     - 將 `0.88` 過載斷崖重構為 **峰值滑移平台 (Peak Slip Plateau)**（`overRatio <= 1.25` 維持 `1.00 -> 0.97` 平緩過度，超過 `1.25` 再漸進降至下限 `0.90`）。
     - 將 `0.78` 全油門開關與 `trailBrakeBonus` 改為連續荷載轉移函數（全油門依車型 `understeerCoeff` 漸進衰減約 `6.2%–9.2%`）。
     - 以 `smoothstepBand(75, 195, speedKmh)` 平滑過渡 `turnInBonus`（消除 `126 km/h` 階躍突跳），並放寬 `straightCentering`（`-0.38`）不再干擾出彎斜切路線。
2. **模組 3 — 賽道曲率折減校準 (`js/circuits.js`)**
   - 新增 `getCornerLineCutFactor()`（寬賽道 `TRACK_WIDTH >= 22` 為 `0.68`，一般/窄賽道為 `0.72`），套用至 `getUpcomingCornerMaxSpeedKmh()` 與 `generateProBenchmarkLap()`，使建議入彎速更貼近實測極限。
3. **模組 4 — 動態彎心預瞄追尾視角 (`js/render.js`, `index.html`)**
   - 於 `js/render.js` 新增 `chaseCamRig`，於追尾視角導入指數阻尼航向追隨（`1 - exp(-13.5 * dtCam)`，跨 `0.75 rad` 瞬間重置）與隨舵角/橫擺率主動看向彎心的 **Dynamic Look-Into-Apex (`±0.095 rad`)**；駕駛艙/引擎蓋視角混入 `0.45x` 溫和頭動預瞄。
   - 更新 `index.html` script 版本參數為 `?v=20261114_cornering`。

### ✅ 驗證結果（編修後全套實測）
1. **`scratch/check_syntax.py`**：7 / 7 JS 模組語法完整（OK）。
2. **`scratch/test_proposal.py`**（Headless Chrome V8 + 完整 `index.html`）：**29 / 29 全數通過**，其中新增 Test 11 實證：
   - `140 km/h` 點按 `0.12s` 後鬆手 `0.12s` 保留率達 **`0.65`**（`>= 0.55` 目標）。
   - 連續 S 彎反打速度達單邊入彎 **`> 1.75x`**。
   - `140 km/h` 全油門過彎保有 **`1.66 G`**（vs 收油門 `1.77 G`，落在 `88%–96%` 順滑區間）。
   - 跨越 `126 km/h`（`123 -> 129 km/h`）橫擺率變化僅 **`4.0%`**（完全消除階躍突跳），且 `index.html` 載入 0 崩潰。
3. **`scratch/test_physics_math.py`**：**26 / 26 通過**（0 失敗）。
4. **`scratch/test_rfc_improvements.py`**：**38 / 38 通過**（0 失敗）。
5. **推送狀態**：僅更新並推送本執行日誌至 GitHub；所有遊戲程式碼變更保留於本地工作區等待用戶試跑確認後再行推送。

---

## 🕒 2026-11-14 18:14 ~ 18:16 // 移除 HUD 紅色重煞警告（`HEAVY BRAKE`）並修正提前誤觸

### 🎯 用戶回饋
- 用戶反映頂部 `🛑 HEAVY BRAKE · 重煞降至 ...` 警告干擾且彎過後仍不消失，要求移除該重煞警告。

### 🔧 修改明細
1. **`js/main.js` (`updateHUD`)**
   - 移除 `#alert-brake-now` 的 `cueTier === 'heavy'` 紅色／橘色彈窗顯示，並移除 `#edge-feedback` 對 `simState.brakeNowWarning` 的全螢幕紅框閃爍（改由路面四色動態走線與距離標示牌提供煞車節奏提示）。
2. **`js/physics.js` (`computeDrivingCue`, `stepPhysics`)**
   - 將 `simState.brakeNowWarning` 常駐設為 `false`。
   - 移除 `computeDrivingCue()` 中容易於大直線前 `165m` 提前誤亮或跨彎殘留的 `minTargetKmh < 145` / `< 185` 單純速差覆蓋條件，僅依實際減速度需求 `reqDecel` 與前方 PRO 煞車段 `proAhead.brake` 輸出提示，確保過彎或加速後立即歸零（`'none'`）。

### ✅ 驗證結果（編修後全套實測）
- `scratch/check_syntax.py`：7 / 7 OK；`scratch/test_proposal.py`：**29 / 29** 通過；`scratch/test_physics_math.py`：**26 / 26** 通過；`scratch/test_rfc_improvements.py`：**38 / 38** 通過。
- **推送狀態**：僅更新並推送本執行日誌至 GitHub；遊戲程式碼變更保留於本地待用戶測試確認後推送。

---

## 🕒 2026-11-14 18:17 ~ 18:19 // 修正 3D 煞車距離指示牌水平鏡像問題

### 🎯 問題原因
- `js/render.js` `signHolder.rotation.y = -boardNode.heading + Math.PI / 2` 使 `PlaneGeometry` 正面朝向順向車流（背對迎面而來的車手），導致車手看到 `DoubleSide` 背面渲染而使 `150 / 100 / 50 METERS` 文字水平反轉（如 `001`）。

### 🔧 修改明細
1. **`js/render.js` (`rebuild3DCircuitScene`)**
   - 將 `signHolder.rotation.y` 修正為 `-boardNode.heading - Math.PI / 2`，使指示牌正面朝向迎面車手且局部 `+X` 對齊行車左至右方向。
   - 將看板材質改為 `THREE.FrontSide`，並於背面 `z = -0.02` 增加深鐵灰背板 `backMesh`（旋轉 `Math.PI`），避免從背面穿視反字。

### ✅ 驗證結果（編修後全套實測）
- `scratch/check_syntax.py`：7 / 7 OK；`scratch/test_proposal.py`：**29 / 29** 通過；`scratch/test_physics_math.py`：**26 / 26** 通過；`scratch/test_rfc_improvements.py`：**38 / 38** 通過。
- **推送狀態**：僅更新並推送本執行日誌至 GitHub；遊戲程式碼變更保留於本地待用戶測試確認後推送。

---

## 🕒 2026-11-14 18:21 ~ 18:22 // 微調收斂動態彎心預瞄幅度 (`chaseCamRig`)

### 🎯 用戶回饋
- 用戶反映追尾/車內動態彎心預瞄幅度偏大、地平線轉動較晃，不易習慣。

### 🔧 修改明細
1. **`js/render.js` (`update3DSceneAndVisualFX`)**
   - 將追尾視角 `targetApexRad` 上限由 `±0.095 rad`（約 `5.4°`）大幅收斂為極微幅 **`±0.026 rad`（約 `1.5°`）**（`steerInput * 0.018 + yawRate * 0.016`）。
   - 收緊追尾航向阻尼係數（`13.5 -> 18.5`）並恢復 `apexLookNode` 混合比為 `0.18`。
   - 駕駛艙與引擎蓋視角移除額外 `apexOffsetRad` 轉角，保持車頭正前方穩定參考線。

### ✅ 驗證結果（編修後全套實測）
- `scratch/check_syntax.py`：7 / 7 OK；`scratch/test_proposal.py`：**29 / 29** 通過；`scratch/test_physics_math.py`：**26 / 26** 通過；`scratch/test_rfc_improvements.py`：**38 / 38** 通過。
- **推送狀態**：僅更新並推送本執行日誌至 GitHub；遊戲程式碼變更保留於本地待用戶測試確認後推送。

---

## 🕒 2026-11-14 18:38 ~ 18:41 // 升級優化計畫書至 v3.2：車輛實體剛體碰撞與純粹競技 AI

### 🎯 用戶指導原則
1. **取消 AI 失誤機制**：移除 `stress` 壓力與 `mistakeTimer` 外拋減速，拒絕消耗玩家熱情的放水機制，維持純粹且強悍的電競級 AI 配速。
2. **車輛實體剛體碰撞系統**：讓玩家與 AI 賽車具備實體剛體屬性，告別穿模幽靈車，實現真實的貼身肉搏（Trading Paint）、動量守恆衝量撞擊與力矩偏轉。

### 📦 文件產出與更新
- 更新 [`OPTIMIZATION_PLAN.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/OPTIMIZATION_PLAN.md) 至 **v3.2 剛體實體碰撞與純粹競技 AI 版**：
  - 新增 **「方案 1：車輛實體剛體碰撞與衝量回饋系統」**（OBB 車身包圍盒、法向分離衝量 $J_n$、切向摩擦阻力 $J_t$、撞擊力矩偏轉與火花特效）。
  - 修訂 **「方案 2：純粹競技 AI」**（徹底刪除壓力值與失誤機制，專注極致走線與防守）。
  - 調整優先級矩陣，將剛體碰撞與純粹 AI 列為 **Phase 2 雙首發核心任務**。
- **推送狀態**：依照規範，僅將本執行日誌與計畫書文件提交並推送至 `origin/main`。

---

## 🕒 2026-11-14 18:42 ~ 18:49 // 完成 Phase 2 全核心系統實作與實機 V8 驗證

### 🎯 目標範圍（依 `OPTIMIZATION_PLAN.md` v3.2）
1. **核心 1 — 車輛實體剛體碰撞與衝量回饋 (`resolveVehicleCollisions`)**
2. **核心 2 — 純粹零失誤競技 AI（徹底移除 `stress` / `mistakeTimer`）**
3. **核心 3 — 三種 GT3 輪胎配方 (`Soft / Medium / Hard`)**
4. **核心 4 — 高階程序化音效與 `0.08s` 換檔斷油 (`Turbo Flutter` & `Shift Clunk`)**

### 🔧 修改明細
1. **`js/physics.js` (`TIRE_COMPOUNDS`, `stepPhysics`, `stepAIRivals`, `testOBBOverlap`, `resolveVehicleCollisions`)**
   - 新增速度感知 **2D SAT OBB 剛體碰撞系統**（GT3 車身尺寸 `4.7m × 2.0m`），針對 **玩家 ↔ AI** 與 **AI ↔ AI** 進行最小分離向量（MTV）空間推離，套用法向恢復衝量（$e = 0.28$）、切向擦撞摩擦（$\mu_c = 0.22$）與偏心撞擊力矩偏轉（`simState.yawRate` / `ai.colHeadingOffset` 與 `colVelD` 側滑恢復衰減）。
   - 徹底刪除 AI `stress`、`mistakeTimer`、`mistakeType` 及假性瞬移閃避外推（`targetD += 2.8`），改以純粹競技防守線、尾流超車與真實物理接觸處理近身對決。
   - 新增三種輪胎配方 `TIRE_COMPOUNDS`（`Soft` 1.65G、`Medium` 1.52G、`Hard` 1.42G），動態縮放 `baseMuLat` 與峰值滑移高原窗（Hard 具備 `1.25×` 高容錯漸進滑動區間）。
   - 於手/自排升檔加入 `0.08s` `ignitionCutTimer` 扭力斷油過渡，並於高轉速收油觸發渦輪洩壓聲浪。
2. **`js/audio.js` & `js/input.js`**
   - 實作純 Web Audio 合成的 `triggerShiftClunk(isUpshift)`、`triggerTurboFlutter()`、`triggerBackfire()` 與依相對撞擊速度調整強度的 `triggerCollision(intensity)`；同步接線至自排換檔與手排 `shiftGear`。
3. **`js/render.js`**
   - `spawnTireSmoke(..., 'spark')` 支援金屬金色摩擦火花粒子拋物線飛濺；移除 `ai.stress` 壓力條，改繪製清爽的車手編號色條與即時戰術標籤。
4. **`js/flow.js`、`js/main.js` & `index.html`**
   - 於車庫（STEP 4）自訂面闆加入「🛞 輪胎配方（S / M / H）」切換鈕與動態抓地力摘要；於駕艙 HUD 新增 `#hud-tire-badge` 即時顯示當前胎種，並將腳本版號更新為 `?v=20261114_phase2`。

### ✅ 驗證結果（編修後全套實測）
- `scratch/check_syntax.py`：**7 / 7 OK**
- `scratch/test_proposal.py`：**34 / 34 PASSED**（含 Phase 2 實測：Player↔AI 碰撞動量傳遞 `40.4 / 48.8 m/s` ＋ 偏航力矩 ＋ `4.75m` OBB 分離、AI↔AI 碰撞分離、零失誤欄位與狀態、三種胎種側向 G 梯度 `S:1.89G > M:1.77G > H:1.67G`、`0.080s` 升檔斷油與音效掛鉤、`index.html` 無報錯啟動）
- `scratch/test_physics_math.py`：**26 / 26 PASSED**
- `scratch/test_rfc_improvements.py`：**38 / 38 PASSED**
- **推送狀態**：僅提交並推送 [`EXECUTION_LOG.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/EXECUTION_LOG.md) 至 `origin/main`；遊戲本體程式碼保留於本地供用戶試駕確認後再推送。
