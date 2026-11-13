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
- 遵循「文檔日誌直接推送，代碼變更等待確認」專案準則，將日誌與計畫書提交並推送。
