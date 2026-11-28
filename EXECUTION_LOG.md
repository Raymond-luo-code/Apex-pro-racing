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

---

## 🕒 2026-11-14 18:59 ~ 19:01 // 修正全油門時異常高頻排氣回火與變速箱拉扯震盪

### 🔍 問題診斷
- 用戶回報全油門加速期間易觸發高頻連環排氣回火。
- 檢查 [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js) 後確認根因：
  1. **自排升/降檔零遲滯帶（Zero Hysteresis）**：原本升檔與降檔共用單一車速門檻（`GEAR_MAX_SPEED[g - 1] * 0.90`）。當全油門行經換檔點並套用 `0.08s` 升檔斷油（`driveAccel × 0.12`）或帶方向盤阻力微幅掉速 `0.2 km/h` 時，次幀立即降檔並再次加速升檔，導致變速箱在臨界時速間以 `15–30 Hz` 來回震盪（Gear Hunting）並每幀重複觸發 `triggerBackfire()` 與火焰特效。
  2. **缺少回火冷卻去抖（Cooldown Debounce）**：換檔與收油回火未設定最小冷卻間隔。

### 🔧 修改明細
1. **`js/physics.js` (`stepPhysics`, `resetSession`)**
   - 建立雙門檻遲滯換檔區間：升檔門檻設為 `GEAR_MAX_SPEED[targetGear] * 0.92`，降檔門檻下移至 `GEAR_MAX_SPEED[targetGear - 1] * 0.78`（提供 `10–36 km/h` 穩定緩衝區間），加上 `0.25s` `_autoShiftCooldown` 冷卻，徹底杜絕全油門換檔震盪。
   - 新增 `_backfireCooldown`（`0.28s`）全域冷卻去抖，並區分升檔／高負載降檔條件。
2. **`js/input.js` (`shiftGear`)**
   - 手排換檔同步遵守 `0.25s` `_backfireCooldown`，避免連按撥片重複疊加爆音與火焰粒子。

### ✅ 驗證結果（編修後全套實測）
- `scratch/check_syntax.py`：**7 / 7 OK**
- `scratch/test_proposal.py`：**35 / 35 PASSED**（新增 Test 17：全油門 `0 -> 282.9 km/h` 連續衝刺測試，全段共發生整齊 `5` 次升檔與 `5` 次回火，零變速箱拉扯震盪）
- `scratch/test_physics_math.py`：**26 / 26 PASSED**
- `scratch/test_rfc_improvements.py`：**38 / 38 PASSED**
- **推送狀態**：僅更新並推送本執行日誌至 `origin/main`；遊戲程式碼維持於本地待用戶測試確認後推送。

---

## 🕒 2026-11-14 19:09 ~ 19:12 // 改善刺耳回火音效並徹底根除碰撞閃現（Continuous Contact）

### 🔍 問題診斷
1. **回火／換檔音效刺耳 (`js/audio.js`)**：`triggerBackfire()` 原本直接使用未經低通濾波器的 `sawtooth` 鋸齒波，高次諧波直衝數千赫茲產生刺耳電子音；`triggerShiftClunk()` 與 `triggerTurboFlutter()` 中心頻率偏高亦略顯尖銳。
2. **碰撞必定發生視覺閃現 (`js/physics.js`)**：
   - `testOBBOverlap()` 的速度啟發權重在兩車**並排擦撞**（`relSpdMag > 1.5` 但橫向接近速度小於 `0.4`）時，對橫向軸施加重罰（`+ 5.0`），導致 SAT 錯誤選出縱向軸並將並排車輛瞬間前後瞬移推開 `1.8m+`！
   - `sepFactor = overlap + 0.02` 於單幀強制推離 100% 重疊深度，造成畫面單幀跳變（閃現）且無法體驗連續擠壓／摩擦的肉搏撞擊感。

### 🔧 修改明細
1. **`js/audio.js`**
   - 重寫 `triggerBackfire()`：改為 `92 -> 36 Hz` 正弦低頻胸腔悶響搭配 `390 -> 160 Hz` 低通濾波白噪音氣流聲，完全濾除刺耳高頻諧波。
   - 同步柔化 `triggerShiftClunk()`（低通 `460 Hz` 氣動悶響）、`triggerTurboFlutter()`（暖化至 `1150 -> 420 Hz`）與 `triggerCollision()`（低沉鈑金與碳纖衝擊）。
2. **`js/physics.js` (`testOBBOverlap`, `resolveVehicleCollisions`)**
   - 修正 `testOBBOverlap()` 預設嚴格遵循**幾何最小重疊軸（MTV）**，僅在極端高速追撞深嵌（`minOverlap > 0.85m` 且 `closing / overlap` 極短）時才覆寫，徹底消除並排擦撞縱向瞬移。
   - 改採 **Baumgarte 漸進柔順接觸分離（`erp = 0.36`，單幀總分離上限 `0.24m`）** 搭配低反彈鈑金係數（`e = 0.16`）與較高側擦滑移摩擦（`muC = 0.28`），讓車輛維持多幀連續擠壓、噴濺火花與偏航力矩拉扯感，不再單幀跳脫閃現。
   - 加入起終點線 `s` 邊界保護，防止發車／衝線區間碰撞分離誤跨圈數邊界。

### ✅ 驗證結果（編修後全套實測）
- `scratch/check_syntax.py`：**7 / 7 OK**
- `scratch/test_proposal.py`：**36 / 36 PASSED**（新增並通過 Test 18 並排擦撞防閃現測試 `pS=200.000, pD=-0.025`，以及連續多幀 OBB 衝量與漸進分離測試）
- `scratch/test_physics_math.py`：**26 / 26 PASSED**
- `scratch/test_rfc_improvements.py`：**38 / 38 PASSED**
- **推送狀態**：僅更新並推送 [`EXECUTION_LOG.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/EXECUTION_LOG.md) 至 `origin/main`；遊戲程式碼維持於本地待用戶試駕確認後推送。

---

## 🕒 2026-11-14 19:20 ~ 19:21 // 修正煞車／打滑胎痕寬度與貼圖轉軸錯誤

### 🔍 問題診斷
- 檢查用戶回報截圖後確認：[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js) `skidGeo` 原本設為 `PlaneGeometry(0.95, 2.4)` 搭配 `rotation.x = -Math.PI/2; rotation.z = -heading`，造成長寬軸向顛倒——原本長邊 `2.4m` 橫跨車尾左右方向，使左右雙輪胎痕在車底重疊鋪成一條超過車寬的巨大黑色方塊地毯。

### 🔧 修改明細
1. **`js/render.js` (`spawnSkidMark`)**
   - 將 `skidGeo` 修正為 **`PlaneGeometry(1.45, 0.28)`**（`1.45m` 為行進切線長度、`0.28m` 為真實 GT3 輪胎接地面寬度）。
   - 將歐拉角順序改為 `rotation.order = 'YXZ'`（`rotation.x = -Math.PI/2; rotation.y = -heading; rotation.z = 0`），使 `0.28m` 胎痕嚴格貼合輪胎滾動方向；同時調整材質透明度為 `0.42`、`depthWrite: false` 並擴充 FIFO 池 `MAX_SKIDS = 260`。
2. **`js/physics.js` (`stepPhysics`)**
   - 將輪距對齊真實左右胎寬 `±0.78m`，並區分「後輪甩尾／過彎極限滑移」與「前輪重煞鎖死／推頭（`fl`/`fr`）」，各自留下清晰的雙道平行細長橡膠胎痕。

### ✅ 驗證結果
- `scratch/check_syntax.py`：**7 / 7 OK**；`scratch/test_proposal.py`：**36 / 36 PASSED**；`scratch/test_physics_math.py`：**26 / 26 PASSED**；`scratch/test_rfc_improvements.py`：**38 / 38 PASSED**。
- **推送狀態**：僅更新並推送本執行日誌至 `origin/main`；遊戲程式碼維持於本地待用戶測試確認後推送。

---

## 🕒 2026-11-14 19:45 // Phase 2.5 真實二維剛體碰撞、庫侖摩擦、並排對齊與失控打滑物理實作

### 🔍 需求與物理架構
- 依用戶核准之擬真碰撞與失控物理計畫，解決兩大車身接觸行為：
  1. **側邊並排斜角擦撞＆持續靠攏對齊**：當玩家帶轉向角斜向靠上 AI 車門時，透過雙點裁剪接觸流形與鈑金庫侖摩擦產生穩定轉正力矩與速度耦合，使兩車自然貼齊同向並排。
  2. **非並排側撞車尾（PIT Maneuver）與真實失控（`LOST CONTROL`）**：當車頭斜切前車後四分之一車尾時，真實旋轉有效質量 $K_n$ 結合二維世界座標慣性動量積分與飽和後輪反打力矩，使前車真實側滑甩尾 `35°–120°+` 並產生煞車救車／煙霧與雙輪胎痕，不再強制瞬間擺正或切換平滑攝影機突跳。

### 🔧 實作明細
1. **[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)**
   - **`testOBBOverlap` + `clipSegmentToLine`**：升級為 **2D SAT + Sutherland-Hodgman 雙點裁剪接觸流形**（`contacts[]`），精確輸出多接觸點位置與個別貫入深度。
   - **`resolveVehicleCollisions`**：
     - 改用**穿透加權 Jacobi 接觸點流形衝量solver**（$\mathbf{v}_P = \mathbf{v}_{CM} + \boldsymbol{\omega}\times\mathbf{r}$），搭配**速度鉗制 Baumgarte 接觸約束**、金屬低反彈係數 `e = 0.08` 與連續側壓庫侖切向摩擦（`muMetal = 0.42`），避免序貫邊角反彈假力矩。
     - 以質心後側衝量（`rLong < -0.42`）精確區分「並排擦撞（AI 保持抓地循跡）」與「後輪側後方 PIT 撞擊（觸發 `spinTimer` 進入失控）」。
   - **`stepAIRivals`**：新增 `heading`、`yawRate`、`vLat`、`spinTimer` 全二維平面世界動量積分；當後輪滑移角飽和時，AI 進入真實反打救車／失控狀態（`LOST CONTROL` / `CATCHING SLIDE`），並保留彎道曲率前饋與僅限靜止起跑（`speedMs < 2.0`）的 `reactionTimer` 防護。
   - **`stepPhysics`**：接觸瞬間（`simState._inCollisionContact`）將輪胎強迫 yaw 覆寫率自 `22.0` 放鬆至 `7.5`，讓鈑金力矩自然將車身貼齊並排。
2. **[`js/input.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/input.js) 與 [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)**
   - 僅於 `recoverToTrackCenter()` 觸發 `simState._snapCameraNow = true`；移除 `chaseCamRig` 在大角度打滑時的鏡頭硬跳切，保留平滑動態追蹤。

### ✅ 驗證結果（實車模擬 Chrome V8 全套實測）
- `scratch/check_syntax.py`：**7 / 7 OK**
- `scratch/test_proposal.py`：**39 / 39 PASSED**
  - 新增 **Test 19**：`12°` 斜角側門並排靠攏，兩車方向對齊收斂至 **`gap = 2.9°`** 且庫侖摩擦將速度差由 `12.0 m/s` 收斂至 **`1.4 m/s`**。
  - 新增 **Test 20**：車頭斜切前車後尾（PIT Maneuver），AI 成功進入失控並偏航 **`59.4°`**（`CATCHING SLIDE` -> `LOST CONTROL`）。
  - 新增 **Test 21**：連續 30 幀並排碰撞單幀最大修正位移 **`0.0524m`**，零閃現。
- `scratch/test_physics_math.py`：**26 / 26 PASSED**
- `scratch/test_rfc_improvements.py`：**38 / 38 PASSED**
- **推送狀態**：僅更新並推送本執行日誌至 `origin/main`；遊戲程式碼（`js/physics.js`、`js/input.js`、`js/render.js`）維持於本地待用戶實車試駕確認後推送。

---

## 🕒 2026-11-14 20:09 // 修正並排貼身轉向過度旋轉（Yaw Runaway）異常

### 🔍 問題診斷
- 針對用戶回報「並排貼身轉向時有不正常的過大幅度轉彎的情況」，透過 Chrome V8 多情境參數掃描（含前後錯位 `±0.5m ~ ±3.5m` 並排轉向）定位到原因：
  1. 當玩家車身略超前 AI（約半個車身 `Δs = +1.5m..+3.5m`）並帶舵角貼靠轉向時，玩家右後車角掃過 AI 左前保桿，因接觸時 `yawTrackRate` 一律降為 `7.5` 且無接地輪胎偏航阻尼與單幀角速度上限，`resolveVehicleCollisions` 連續數幀累積扭矩，使 `simState.yawRate` 失控飆升至上限 `3.60 rad/s`（`206°/s`），導致車身瞬間橫甩 `58°–88°`。

### 🔧 修改明細（[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)）
1. **分層輪胎偏航阻尼（`stepPhysics`）**：接觸期間當偏航差 `|simState.yawRate - targetYawRate| <= 0.85 rad/s` 時保持 `8.5` 讓兩車自然貼齊並排；一旦超出該窗口立即切換為 `18.0` 接地輪胎穩定阻尼，防止異常過轉甩尾。
2. **接地等效轉動慣量與單幀角衝量上限（`makeBody`, `resolveVehicleCollisions`）**：加入輪胎接地等效旋轉慣量倍數（`* 1.18`）、鉗制單幀接觸角速度衝量於 `±0.62 rad/s`，並將玩家碰撞態 `simState.yawRate` 限幅至合理的 `±1.55 rad/s`（同步按比例調整 `rearShock` PIT 觸發門檻至 `0.25`）。

### ✅ 驗證結果
- `scratch/check_syntax.py`：**7 / 7 OK**
- `scratch/test_proposal.py`：**40 / 40 PASSED**（新增 **Test 22**：並排錯位貼身全舵轉向實測 `maxYr = 1.55 rad/s`、最大偏角 `29.4°`，不再暴衝至 `3.60 rad/s` / `58°+`；Test 19 對齊收斂 `gap = 4.2°`、速度差 `0.7 m/s`；Test 20 PIT 甩尾 `57.9°` 亦全數維持通過）
- `scratch/test_physics_math.py`：**26 / 26 PASSED**
- `scratch/test_rfc_improvements.py`：**38 / 38 PASSED**
- **推送狀態**：僅更新並推送本執行日誌至 `origin/main`；遊戲程式碼維持於本地待用戶測試確認後推送。

---

## 🕒 2026-11-14 21:25 // Phase 3 實作：同圈速三風格 AI 車手原型與多路線攻防狀態機 (`AI_DRIVER_ARCHETYPES` + `stepAIRivals`)

### 🎯 任務核心
依用戶核准之 AI 運行與風格化升級方案，解決先前 AI 過於單線、僅依 `basePace`（`1.045 / 1.032 / 1.018`）硬性拉開名次，以及直線貼身防守／並排過彎行為單一的問題，實作「**同圈速基準、不同駕駛性格與區間強弱分配**」及「**FIA 一動防守（One-Move Rule）與並排安全走廊**」。

### 🔧 主要修改明細（[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)）
1. **三種同圈速（`basePace: 1.034`）分化駕駛風格原型 (`AI_DRIVER_ARCHETYPES`)**：
   - **`K. TAKAHASHI #7`（`smooth_apex`／高彎心動量流）**：外進內出寬入路線（`entryOutsideBias: 0.85m`, `apexInsideBias: 0.40m`），彎心最低速 `+2.8%`（`cornerApexMult: 1.028`），擅長在外線遭遇強攻時執行 **Switchback 交叉切線回擊**（`SWITCHBACK PREP` / `SWITCHBACK`）。
   - **`M. VERSTAPPEN #1`（`late_braker`／晚煞車 V 字路線）**：深踩煞車進攻入彎（`entrySpeedMult: 1.028`, `brakeThresh = -5.2`, 制動力提升 `20.6`），但彎心速度略低（`cornerApexMult: 0.982`）；最積極啟動防禦（`defendTriggerGap: 38.0m`），偏愛直線鎖定一動阻擋（`ONE-MOVE BLOCK`）、彎前卡死內線（`PROTECT INSIDE`）與晚煞內線抽頭（`LATE BRAKE DIVE`）。
   - **`L. NORRIS #4`（`exit_surge`／晚 APEX 牽引力與直線加速型）**：提早穩車轉向、出彎猛給油（`exitSpeedMult: 1.028`, `straightMult: 1.010`, `drivePowerMult: 1.015`），進彎節奏較保守（`entrySpeedMult: 0.982`）；擅長在直線尾流執行 **假動作變線超車**（`FEINT & PASS` / `SLINGSHOT PASS`）與中線擠壓防禦（`SQUEEZE DEFENSE`）。
2. **動態多路線攻防狀態機（`stepAIRivals`）**：
   - **並排兩車安全走廊（Two-Wide Racing Room）**：當兩車縱向實際重疊（`|gapMeters| <= 3.5`）時維持 `minClearance = 2.24m` 車距（`SIDE BY SIDE` / `SWITCHBACK`），避免彎中無視並排車直接砍回賽車線；實際發生車門物理碰撞期間（`simState._inCollisionContact`）則穩定持線交由 2D 剛體摩擦求解器處理，防止雙重疊加偏航。
   - **FIA 一動規則鎖定防禦（`defendLockTimer` / `defendCooldownTimer`）**：玩家於直道快速逼近（`effectiveGap < defendTriggerGap`）時，AI 依自身風格做單次明確路線表態並鎖定 `2.8s`（含 `4.6s` 冷卻），不隨玩家左右搖擺蛇行；若即將進彎則轉為主動佔據內線防禦（`PROTECT INSIDE`）。
   - **AI 對 AI 多線對戰與交錯超車**：三台同配速 AI 車手之間同樣套用兩車並排安全距與自動挑選潔淨超車道（`chooseOvertakeLaneD`），彼此會在彎前晚煞、彎中 Switchback 與直線尾流反覆纏鬥。

### ✅ 驗證結果（Chrome Headless V8 全套實測）
1. **`scratch/check_syntax.py`**：**7 / 7 OK**
2. **`scratch/test_proposal.py`**：**42 / 42 PASSED**（包含完整 `index.html` 啟動零崩潰）
   - **Test 23（同圈速三風格獨立測試）**：Fuji 賽道 30 秒獨立遙測圈段總里程差僅 **`0.93%`**，且精確呈現段速風格特徵：入彎進攻速 `late_braker (161.6 km/h) > exit_surge (154.2 km/h)`、彎心Apex速 `smooth_apex (105.3 km/h) > late_braker (100.8 km/h)`、出彎／直道極速 `exit_surge (188.2 km/h) > smooth_apex (186.7 km/h)`。
   - **Test 24（動態攻防狀態機實測）**：通過直線 FIA 一動防禦鎖定不蛇行（`oneMoveLock=true`）、彎前卡內線防守（`protectInside=true`）與並排讓出一車寬度走廊（`twoWideGap=2.19m`）。
   - 原有碰撞測試全面穩定：並排對齊（`gap=3.2°` / 速差 `0.5 m/s`）、PIT 追尾甩尾（`39.8°`）、錯位並排轉向抗過度旋轉（`30.5°`, `maxYr=1.55 rad/s`）。
3. **`scratch/test_physics_math.py`**：**26 / 26 PASSED**
4. **`scratch/test_rfc_improvements.py`**：**38 / 38 PASSED**
5. **推送狀態**：僅更新並推送本執行日誌至 `origin/main`；遊戲程式碼（`js/physics.js`）維持於本地工作區等待用戶實測確認「推送」後再行推送。

---

## 🕒 2026-11-14 22:15 // Phase 4 大翻新：真實物理 PRO 基準圈速、外內外（Out-In-Out）幾何走線與小彎全油門 AI 徹底重構

### 🔍 問題根因診斷
針對用戶回報真實玩家（蒙札 `01:20.914`、富士 `01:26.706`、箱根 `01:35.801`，快同學再快 `3–4s`、新手亦僅慢 `~20s`）遙遙領先原 PRO 基準（`01:51.076 / 02:05.731 / 02:46.973`），且 AI 連小弧度彎道也煞車的三大根因：
1. **假「中-內-中」走線**：`buildTrackGeometryData()` 舊版僅使用 `curvature * 310` 決定 `optimalD`，進彎前與出彎後未提前拉向路緣外側，無法利用賽道全寬放大過彎半徑。
2. **`node.vTarget` 人為限速帽**：`generateProBenchmarkLap()` 過去以線性內插航點 `vTarget` 截斷速度上限，導致大直線尾段與高速全油門彎道被迫提前減速，使 PRO 基準與 AI 均比真實物理極限慢 30–71 秒。
3. **小彎誤煞車與無預瞄轉向**：`stepAIRivals()` 在平順高速小彎仍觸發低門檻減速，且缺乏 `curvatureFeedforward` 曲率前饋與動態入彎/煞車雙前瞻（`proBrakeRef` / `proSteerRef`）。

### 🔧 主要修改明細
1. **真．外內外（Out-In-Out）弧長求解與物理極速求解器（[`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js)）**：
   - **`buildTrackGeometryData()`**：改以真實物理弧長 `sampleTrackAtS(s + ds)` 計算各點前後 `65m–135m` 入／出彎肩部曲率，使賽車於入彎前先切至外側路緣石（`-sign(k)*maxD`）、彎心貼緊內側 Apex（`+sign(k)*maxD`）、出彎順勢外拋，並經 6 回合平滑濾波確保方向轉換柔順。
   - **`getCornerLineCutFactor()` 與 `getUpcomingCornerMaxSpeedKmh()`**：考量外內外走線放大轉彎半徑（寬賽道係數 `0.62 / 0.70 / 0.85`），當等效曲率 `effectiveCurv < 0.00155` 時直接判定全油門平跑 `300 km/h` 不煞車；中高曲率按真實下壓力與橫向抓地力（`1.56G / 1.46G / 1.24G`）求解。
   - **`generateProBenchmarkLap()`**：移除 `node.vTarget` 人工限速上限，搭配 `maxBrakeDecel = 17.2 m/s²` 反向煞車曲線與 GT3 加速／牽引圓正向積分，自動算出匹配真實玩家水準的 `PRO_LAP_TIME`。
2. **AI 全油門小彎守護、雙前瞻參考與曲率前饋轉向（[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)）**：
   - **`stepAIRivals()`**：導入雙前瞻點（煞車前瞻 `proBrakeRef`、`steerPreviewDist` 轉向預瞄 `proSteerRef` 與彎心判斷 `midLookNode`）、平跑區間 `isFlatOutZone`（零誤觸煞車／全油門通過），並加入 `curvatureFeedforward` 曲率前饋偏航控制與重新校準之配速基準 `diffPaceMult = 0.968 * ai.basePace * diff`。
   - **`computeDrivingCue()`**：補上 `currSpeedKmh <= minTargetKmh + 2` 即清除提示之保護與 `min maxScan = 145m` 掃描下限，消除接近真實全油門彎時的誤報煞車提示。

### ✅ 驗證結果（Chrome Headless V8 全套實測）
1. **`scratch/check_syntax.py`**：**7 / 7 OK**
2. **`scratch/test_proposal.py`**：**43 / 43 PASSED**（完整 `index.html` 啟動 `147158 chars`，零 `#apex-crash-banner`）
   - **Test 23（同圈速三風格獨立遙測）**：`spread = 0.24%`，忠實呈現入彎 `late_braker (225.6) > smooth_apex (219.5) > exit_surge (217.4)`、彎心 `smooth_apex (166.6) > exit_surge (162.7) > late_braker (161.8)`、出彎直道 `exit_surge (219.2) > smooth_apex (218.2)`。
   - **Test 24（動態多線攻防 FSM）**：`oneMoveLock=true, protectInside=true, twoWideGap=2.20m`。
   - **Test 25（外內外走線＋高速小彎全油門＋真實 PRO 圈速）**：富士髮夾彎實測外內外橫向座標 `entry=-7.5m / apex=+6.8m / exit=-6.8m`、蒙札高速小彎 `flatOut=true`（`brakeInput===0 && throttleInput>90`），三賽道物理 `PRO_LAP_TIME` 提升至 **`78.0s (Monza) / 82.5s (Fuji) / 89.5s (Hakone)`**。
3. **V8 全圈單圈 AI 基準實測（三車型同場分級配速）**：
   - **Monza（PRO `78.042s`）**：Clubman (`0.92`) `77.60–77.96s` / Pro (`1.00`) `75.12–75.44s` / Alien (`1.10`) `72.36–72.68s`
   - **Fuji（PRO `82.492s`）**：Clubman (`0.92`) `84.32–84.56s` / Pro (`1.00`) `80.68–80.88s` / Alien (`1.10`) `76.76–76.84s`
   - **Hakone（PRO `89.461s`）**：Clubman (`0.92`) `92.96–93.48s` / Pro (`1.00`) `88.16–88.60s` / Alien (`1.10`) `82.96–83.04s`
4. **`scratch/test_physics_math.py`**：**26 / 26 PASSED**
5. **`scratch/test_rfc_improvements.py`**：**38 / 38 PASSED**
6. **推送狀態**：僅更新並推送本執行日誌至 `origin/main`；遊戲程式碼（`js/circuits.js`、`js/physics.js`、`scratch/proposal_runner.html`）保留於本地工作區等待用戶實測確認「推送」後再行推送。

---

## 🕒 2026-11-14 22:25 // AI 難度三級重分層：業餘 / 專業 (標準 PRO AI) / 頂尖 級距拉大與基準校準

### 🎯 調整目標
依用戶實際水平（接近標準 PRO）與試玩回饋（「快同學再快 3–4 秒、新手慢約 20 秒，希望各級距差異拉大、讓新手不要太有壓力」），重新設計三級難度階層與對應圈速：
- **業餘 (`0.92`)**：大幅降低彎速與推進權重，比專業慢約 12–18 秒，讓新手能輕鬆體驗對戰樂趣。
- **專業 (`1.00`, 標準 PRO AI)**：將標準 AI 與賽道官方 `PRO_LAP_TIME` 精準校準於用戶個人最佳表現區間（Monza `~80.5s` / Fuji `~86.4s` / Hakone `~95.2s`）。
- **頂尖 (`1.10`)**：保持全物理極限輸出，比專業快約 6–8 秒，專供頂尖玩家挑戰。

### 🔧 主要修改明細
1. **UI 選項文字更新（[`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js#L608-L612)、[`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html#L3017-L3022)）**：
   - 統一將三個選項命名為：**`業餘 (新手友善)`**（`0.92`）、**`專業 (標準 PRO AI)`**（`1.0`）、**`頂尖 (極限挑戰)`**（`1.10`）。
2. **官方 PRO 基準圈速對齊專業級（[`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js#L17-L110)）**：
   - 於 `generateProBenchmarkLap()` 時間積分加入 `proPaceFactor`（Monza `0.970` / Fuji `0.955` / Hakone `0.940`），在不影響 `computeDrivingCue` 與極限速度曲線的前提下，將官方 `PRO_LAP_TIME` 精準定錨於 **`80.456s`（Monza）/ `86.379s`（Fuji）/ `95.171s`（Hakone）**。
3. **三級 AI 獨立分層配速模型（[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L1941-L1955)）**：
   - **業餘 (`< 0.96`)**：`tierSpeedMult = 0.710`, `tierPowerMult = 0.565`, 極速上限 `226 km/h`
   - **專業 (`0.96..1.04`)**：`tierSpeedMult = 0.888`, `tierPowerMult = 0.845`, 極速上限 `276 km/h`
   - **頂尖 (`> 1.04`)**：`tierSpeedMult = 0.968`, `tierPowerMult = 1.060`, 極速上限 `308 km/h`

### ✅ 驗證結果（Chrome Headless V8 全套實測）
1. **三級 AI 全圈單圈計時實測**：
   - **Monza（PRO `80.456s`）**：業餘 **`92.32–92.72s`** / 專業 **`79.76–80.12s`** / 頂尖 **`73.76–74.04s`**
   - **Fuji（PRO `86.379s`）**：業餘 **`101.56–101.92s`** / 專業 **`86.24–86.44s`** / 頂尖 **`79.52–79.76s`**
   - **Hakone（PRO `95.171s`）**：業餘 **`113.04–113.68s`** / 專業 **`94.64–95.08s`** / 頂尖 **`87.20–87.72s`**
2. **`scratch/check_syntax.py`**：**7 / 7 OK**
3. **`scratch/test_proposal.py`**：**43 / 43 PASSED**（完整 `index.html` 啟動 `147132 chars`，零 `#apex-crash-banner`；同風格 `spread = 0.34%`；外內外 `entry=-7.5/apex=6.8/exit=-6.8`）
4. **`scratch/test_physics_math.py`**：**26 / 26 PASSED**
5. **`scratch/test_rfc_improvements.py`**：**38 / 38 PASSED**
6. **推送狀態**：僅更新並推送本執行日誌至 `origin/main`；遊戲程式碼（`index.html`、`js/flow.js`、`js/circuits.js`、`js/physics.js`、`scratch/`）保留於本地等待用戶測試確認「推送」後再行推送。

---

## 2026-11-14 — Unified Player / PRO Ghost / AI Launch & Corner-Exit Physics Calibration

### Root Causes Addressed
1. **Unfair Standing-Start Launch**:
   - PRO Ghost (`generateProBenchmarkLap`) previously began at `vProfileMs[0] = 14.0 m/s` (`50.4 km/h`) with zero Lights-Out reaction delay and skipped the Player's `0.35s` launch ramp and `0.08s` upshift ignition cuts.
   - AI rivals previously started up to `26m` ahead (`[26, 17, 8]`), pre-loaded `45%` throttle during red lights, reacted in `0.04–0.18s`, and accelerated with a stronger engine curve (`Math.min(9.0, 358/vEff)`) without `0.08s` upshift cuts or `latG * 0.38` cornering scrub.
2. **Corner-Exit Surge Disparity**:
   - AI previously skipped `latG * 0.38` corner scrub and `throttleWeightTransfer`, stacked `exit_surge` extra drive multiplier, and applied `+5%..+8.5%` rubber-band speed boosts when behind the Player outside slipstream.

### Key Changes (Held Locally Pending User Push Confirmation)
- **[js/circuits.js](js/circuits.js)**:
  - Split `generateProBenchmarkLap()` into closed-loop `vFlyingMs` (Player-matched `Math.min(8.25, 338.0 / vEff)`, `0.955` shift factor below `252 km/h`, `latG * 0.38` corner scrub, `0.28..1.0` traction circle) and standing-start Lap 1 (`vProfileMs[0] = 0.0`, `launchRamp = 0.78 / 0.94`, `simTime = 0.22s` human Lights-Out reaction delay, `vAvg = Math.max(5.9, 0.55 * vNext)` at `i === 0`, `proPaceFactor` `1.005 / 0.996 / 0.980`).
  - Exported `window.sampleGhostAtTime` and separated `refSpeed` in `getProProfileAtDistance()`.
- **[js/physics.js](js/physics.js)**:
  - Compacted AI grid offsets (`[15, 10, 5]`), zeroed red-light throttle (`0`), set human Lights-Out reaction (`0.22 + idx * 0.04 + Math.random() * 0.06`), added 6-speed gearbox with `0.08s` upshift ignition cuts (`0.12x`), physical `aiInSlipstream` check, Player-matched `Math.min(8.25, 338/vEff)` + `aiLatG * 0.38` + `throttleWeightTransfer`, removed non-slipstream rubber-band speed boosts, and calibrated the 3 tiers (`業餘 0.735 / 0.635 / 232 km/h`, `專業 0.922 / 1.000 / 286 km/h`, `頂尖 1.015 / 1.085 / 310 km/h`).
- **[scratch/proposal_runner.html](scratch/proposal_runner.html)**:
  - Added Test 26 (`Unified launch & exit physics`) verifying `3.5s` standing-start parity across Player, PRO AI, and PRO Ghost, plus corner-exit early-throttle advantage.

### Verification Results (Post-Final-Edit)
- `python scratch/check_syntax.py`: **7/7 OK**
- `python scratch/test_proposal.py`: **44/44 PASSED**
  - PRO Ghost standing-start benchmarks: Monza `80.4s`, Fuji `86.3s`, Hakone `95.0s`
  - Test 26 launch parity at `3.5s`: Player `38.0m`, PRO AI `37.5m`, PRO Ghost `37.7m`
  - Test 26 corner exit (`0.25s` earlier throttle): Player `+128.9m` vs PRO AI `+108.4m`
  - Full `index.html` headless Chrome boot: `147194 chars`, zero `#apex-crash-banner`
- `python scratch/test_physics_math.py`: **26/26 PASSED**
- `python scratch/test_rfc_improvements.py`: **38/38 PASSED**
- Standing-start AI lap benchmarks (`bench_laps.py`):
  - **Monza**: 業餘 `96.20–96.52s` / 專業 `81.40–81.64s` / 頂尖 `78.72–78.88s`
  - **Fuji**: 業餘 `104.60–104.84s` / 專業 `87.16–87.44s` / 頂尖 `83.08–83.20s`
  - **Hakone**: 業餘 `115.60–116.04s` / 專業 `95.32–95.60s` / 頂尖 `89.96–90.08s`

---

## 2026-11-14 — Production Deployment (`8603f9c`)

- Pushed verified production changes (`index.html`, `js/circuits.js`, `js/flow.js`, `js/physics.js`; `4 files changed, 419 insertions(+), 115 deletions(-)`) to `origin/main` in commit `8603f9c`:
  - Out-In-Out arc-length optimal line overhaul & flat-out sweeper velocity solver
  - 3-tier AI difficulty rebalance (`業餘 (新手友善)` / `專業 (標準 PRO AI)` / `頂尖 (極限挑戰)`)
  - Unified Player / PRO Ghost / AI standing-start launch, gearshift cut, and corner-exit physics

---

## 2026-11-15 — Local 3D GLB Cars & Circuits Integration, Multi-Class Scaling & Visual Polish

### Scope (Held Locally Pending User Push Confirmation)
- Inspected and integrated 6 newly downloaded car `.glb` models in `assets/models/cars/` and 3 circuit `.glb` models in `assets/models/tracks/`, while strictly excluding brake disc thermal glow (`煞車碟盤熱紅光效`).

### Key Changes Implemented
1. **6 Local Car GLB Models & Normalizer/Rig Pipeline (`js/render.js`, `js/flow.js`, `js/physics.js`)**:
   - Added `CAR_MODEL_PRESETS`, `CAR_CATALOG`, and `CAR_HANDLING_PROFILES` entries for:
     - `aston_vulcan` (`assets/models/cars/aston_martin_vulcan.glb`, `HYPER`)
     - `mclaren_senna` (`assets/models/cars/mclaren_senna.glb`, `HYPER`)
     - `zenvo_tsrs` (`assets/models/cars/zenvo_tsr-s.glb`, `HYPER`)
     - `pagani_huayra_r` (`assets/models/cars/pagani_huayra_r_evo_roadster.glb`, `HYPER`)
     - `amg_one` (`assets/models/cars/amg 1.glb`, `HYPER`)
     - `porsche_919_evo` (`assets/models/cars/porsche_919_hybrid_evo.glb`, `LMP1`)
   - Updated `normalizeVehicleScene()`: excluded `/glows/i` helper meshes from scaling/centering bounds and hid protruding glow meshes (`> 0.25m` past core bounds) so `zenvo_tsr-s.glb` scales to accurate width (`2.05 m`), plus enhanced front/rear node and material orientation detection (`brake_lamp` etc.).
   - Added `splitMergedWheelMeshes()` for Porsche 919 Hybrid Evo's merged 4-corner wheel/disc/caliper meshes (`.006`–`.009`), filtered multi-wheel container groups in `rigHiFiWheels()`, added tire material matching (`tyre`, `tyre_blk`), and added `isHeavyNonPlayer` guard (`tris > 150000`) in `applyHiFiTemplateToSlot()` so ultra-high-poly cars only clone into the player slot.
2. **Monza / Spa-Francorchamps / Suzuka 3D Circuits & Elevation (`js/circuits.js`, `js/render.js`, `js/physics.js`)**:
   - Wired `glbUrl` for `monza` (`assets/models/tracks/monza.glb`), added `spa` (`assets/models/tracks/spa_francorchamps.glb`, `-9.9 m` to `+38.6 m` elevation), and added `suzuka` (`assets/models/tracks/suzuka_circuit.glb`, `-8.4 m` to `+14.0 m` elevation including Figure-8 overpass bridge geometry).
   - Updated `buildTrackGeometryData()` to interpolate explicit per-waypoint `y` elevation, added checkered start/finish line, 12 staggered grid boxes, overpass concrete support piers (`n.y > 5.0`), Mt Fuji visibility guard, and default-off optional `loadTrackGLBScenery()` (`window.ENABLE_GLB_TRACK_SCENERY = false`).
   - Added `window.PRO_LAP_TIME` live sync inside `generateProBenchmarkLap()` and `window.currentCircuitIndex` / `window.currentCircuit` live sync inside `selectCircuit()`.
3. **Multi-Class Benchmark Scaling, Per-Class PB, Step 3 SVG Minimaps & UI Styling (`js/circuits.js`, `js/physics.js`, `js/flow.js`, `index.html`)**:
   - Added `classSpec` on all `GT3` / `HYPER` / `LMP1` vehicles, `window.rebuildProBenchmarkForCurrentCar()`, class-aware AI pace/power scaling in `updateAICars()`, per-class PB storage (`${idx}_${edition}_${carClass}` with GT3 fallback), Step 3 dynamic SVG minimaps (`buildTrackSvg`), and updated button/touch pedal CSS in `index.html`.

### Verification Results (Post-Final-Edit)
- `python scratch/check_syntax.py`: **7 / 7 OK** (`audio.js`, `circuits.js`, `flow.js`, `input.js`, `main.js`, `physics.js`, `render.js`)
- `python scratch/test_physics_math.py`: **26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`: **38 PASSED, 0 FAILED**
- `python scratch/verify_new_assets.py` (Headless Chrome WebGL): **100% PASSED** (`Errors: []`)
  - 5 circuits verified: `monza` (`PRO 80.42s`, `y: -3.2..1.6`), `fuji` (`PRO 86.27s`, `y: -8.3..4.2`), `hakone` (`PRO 94.983s`, `y: -18.9..9.5`), `spa` (`PRO 90.22s`, `y: -9.9..38.6`), `suzuka` (`PRO 91.916s`, `y: -8.4..14.0`)
  - All 6 new car GLBs verified (`ok: True`, `wheels: 4`, `hasBody: True`, front axle `+X` > rear axle):
    - `aston_vulcan`: `71,620` tris, `4.6 x 2.16 x 1.13 m` (`FL=1.344 / RL=-1.302`)
    - `mclaren_senna`: `238,310` tris, `4.6 x 2.09 x 1.21 m` (`FL=1.473 / RL=-1.104`)
    - `zenvo_tsrs`: `31,642` tris, `4.6 x 2.05 x 1.24 m` (`FL=1.325 / RL=-1.457`)
    - `pagani_huayra_r`: `301,826` tris, `4.6 x 2.09 x 1.02 m` (`FL=1.163 / RL=-1.291`)
    - `amg_one`: `28,877` tris, `4.6 x 1.86 x 1.06 m` (`FL=1.39 / RL=-1.021`)
    - `porsche_919_evo`: `63,865` tris, `4.6 x 1.77 x 1.28 m` (`FL=1.432 / RL=-1.242`)
  - Spa multi-class PRO benchmark scaling: `procedural (GT3) 90.22s` > `mclaren_senna (HYPER) 85.714s` > `porsche_919_evo (LMP1) 80.364s`
- `python scratch/test_proposal.py`: **44 / 44 PASSED** (`index.html` Chrome headless boot `153,936 chars`, zero `#apex-crash-banner`)

---

## 2026-11-15 — Production Deployment (`770d631`)

- Pushed verified production changes (`14 files changed, 794 insertions(+), 91 deletions(-)`) to `origin/main` in commit `770d631`:
  - Code & UI: `index.html`, `js/circuits.js`, `js/flow.js`, `js/physics.js`, `js/render.js`
  - 6 Car GLBs (`assets/models/cars/`): `amg 1.glb`, `aston_martin_vulcan.glb`, `mclaren_senna.glb`, `pagani_huayra_r_evo_roadster.glb`, `porsche_919_hybrid_evo.glb`, `zenvo_tsr-s.glb`
  - 3 Track GLBs (`assets/models/tracks/`): `monza.glb`, `spa_francorchamps.glb`, `suzuka_circuit.glb`
  - `scratch/` test & helper scripts remain untracked locally.

---

## 2026-11-15 — 徹底修復賽道未閉環折返死路、橋樑／場景碰撞與 3D 坡度穿模問題

### 1. 問題根因診斷 (Root Cause Analysis)
1. **斯帕 (`spa`) 起終點 `177.1°` 折返重疊死路**：[`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js) 原 `P13 -> P14 -> P00 (0,0,0)` 朝 `-X` 收尾後，`P00 -> P01` 立刻朝 `+X` 原路倒折 `177.1°`，造成起終點線 `x = 0` 處出現路面截斷死路感、`4` 處路緣折疊、`8` 處緩衝草皮折疊及 `457` 節點同層重疊。
2. **鈴鹿 (`suzuka`) `P14 -> P15 -> P00` `158.6°` 折返死路 + 立體交叉高架橋懸空草皮／橋下穿模**：原 `P13 (-220) -> P14 (-80)` 往 `+X` 後 `P15 (-180)` 又倒退回 `-X`，再於 `(0,0,0)` 轉折 `158.6°` 回 `+X`，造成 `8` 處路緣折疊、`21` 處緩衝帶折疊與 `442` 節點重疊；同時 `y=+14m` 高架橋兩側誤生成 `42m` 寬懸空綠草與漂浮松樹，橋下 `y=-4m` 涵洞路段也生成穿過橋面的燈桿與樹木。
3. **箱根 (`hakone`) 谷底沉入地板平面 (`-18m`)**：箱根最低點達 `-18.9m`，而 [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js) 將大地面網格固定於 `ground.position.y = -18`，導致賽道谷底低於地面草皮 `0.9m` 而產生路面被吞沒的斷裂與穿模現象。
4. **路旁物件未檢測交叉／鄰近賽道**：輪胎牆、路燈柱、樹木、看台、維修站房車間、煞車牌與橋墩僅沿當前節點法向量偏移，會貫穿鄰近或橋下道路。
5. **3D 縱向坡度未套用至車輛與攝影機 (`slopePitch`)**：車輛原本僅套用加減速重心俯仰 `pitchRad`，未貼合路面坡度 `atan2(dySmooth, segLen)`，導致上／下坡時車頭尾與輪胎嵌入瀝青；駕駛艙／引擎蓋／追尾視角 `lookAt.y` 亦未隨前方高度 `apexLookNode.y` 調整，造成上坡直視地下土坡與下坡鏡頭沉入路面。

### 2. 修復內容
- **[`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js)**：
  - 重建 `spa.points`（總長 `6097.1m`）與 `suzuka.points`（總長 `5200.5m`）為單調順向閉合迴路（鈴鹿保留 `y=+14m` 跨線大橋與 `y=-4m` 涵洞高度差 `18.1m`）。
  - 於 `sampleTrackAtS(s)` 與 `sdToWorld(s, d)` 新增並回傳平滑路面縱向坡度角 `slopePitch`。
- **[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js) & [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)**：
  - 動態計算全賽道最低點 `minTrackY`，將地面設定於 `groundY = Math.min(-20, minTrackY - 10.0)`（箱根地面降至 `-28.90m`）。
  - 新增 `isBridgeNode(node)` 與 `isClearOfOtherTrack(...)`：高架橋段緩衝帶收窄為 `+0.9m` 水泥護牆配色並禁止於橋面與橋下長樹、立燈柱；輪胎牆、路燈、樹木、看台、維修站、煞車牌與橋墩全面避開其他非相鄰車道（含上下層淨空）。
  - 為玩家車輛、Pro/PB 幽靈車（`applyGhostPose`）與 AI 對手車（`syncAiMeshTransform`）以 `'YXZ'` 歐拉順序套用 `slopePitch` 對應的俯仰 (`rotation.z`) 與側滑時橫傾 (`rotation.x`)；Cockpit / Hood / Chase 三種視角同步加入 `lookSlopeY` 與車尾後方地面淨空夾限 (`chaseGroundY + 1.85`)。
- **[`scratch/verify_new_assets.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/scratch/verify_new_assets.html)**：改於啟動驗證前中止初始遠端 GitHub `.glb` 預抓，直接針對本地 5 條賽道與 6 台本機 `.glb` 車輛執行驗證。

### 3. 實機與幾何驗證結果 (2026-11-15)
- **5 賽道幾何折疊與物件防穿模稽核 (`verify_track_geometry.py`)**：全數通過（`road_folds=0`、`runoff_folds=0`、`same_overlaps=0`、`scenery_hits=0`、`pier_hits=0`）：
  - `monza`：`len=6006.8m`, `minY=-3.20m (gnd=-20.00m)`
  - `fuji`：`len=5422.1m`, `minY=-8.30m (gnd=-20.00m)`
  - `hakone`：`len=5501.1m`, `minY=-18.90m (gnd=-28.90m)`
  - `spa`：`len=6097.1m`, `minY=-10.00m (gnd=-20.00m)`
  - `suzuka`：`len=5200.5m`, `minY=-4.63m (gnd=-20.00m)`, `bridge_nodes=29 (dy=18.1m)`
- `python scratch/check_syntax.py`：**7 / 7 OK**
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**44 / 44 PASSED**
- `python scratch/verify_new_assets.py` (Headless Chrome WebGL)：**Errors: []**，5 條賽道 PRO 基準秒數與高程 (`monza 80.42s`, `fuji 86.27s`, `hakone 94.983s`, `spa 100.276s`, `suzuka 88.636s`)、6 台車 GLB 結構與 Spa 多級距縮放 (`100.276s > 95.002s > 88.575s`) 全數通過。

---

## 2026-11-15 — 桌面應用程式雙模架構、全場景程序化 PBR 材質升級與 GLB 賽道走廊裁切系統 (Phase 1)

### 1. 桌面單機雙模執行引擎 (Desktop Runtime + GitHub / Web 雙相容)
- **[`apex_desktop_app.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/apex_desktop_app.py)** 與 **[`launch_apex_desktop.bat`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/launch_apex_desktop.bat)**（及 [`.gitignore`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/.gitignore) 排除 `.apex_app_profile/`、`__pycache__/`、`*.pyc`）：
  - 以 Python 標準庫 `ThreadingHTTPServer` 啟動本地 `HTTP/1.1` 多執行緒資產伺服器（完整支援 `model/gltf-binary` MIME、HTTP `Range` `206` 分片串流、CORS 標頭與 `--check` 自我檢測）。
  - 自動搜尋 Chrome / Edge 並以 `--app` 獨立桌面視窗搭配 `--force_high_performance_gpu`、`--enable-gpu-rasterization`、`--enable-zero-copy`、`--ignore-gpu-blocklist` 與獨立 `.apex_app_profile` 設定檔啟動，完整保留離線單機遊玩體驗與 GitHub 網頁同步相容性。
- **[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)**（`CAR_MODEL_PRESETS` 與 `loadVehicleFromURLs()`）與 **[`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js)**：
  - 為 6 台本機 `.glb` 車輛預設補齊 GitHub raw 備援網址，並於 `file://` 直接開啟時優先使用遠端 `https://`、於 `http(s)://`（桌面版／網頁版）優先使用本機高速資產。
  - 於 [`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js) 加入 `!carAssetState.loading` 檢查，避免開機預設車種自動載入覆蓋中斷進行中的指定 `.glb` 載入請求。

### 2. 全場景程序化 PBR 材質升級（消除大面積單色粗糙幾何）
- **[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)**：
  - 硬體 WebGL 環境啟用 `THREE.ACESFilmicToneMapping`（`toneMappingExposure = 1.08`），並新增軟體 WebGL 偵測 `isSoftwareWebGL`（自動對 SwiftShader 等軟體算繪降低貼圖解析、停用重複 `PMREMGenerator` 與非玩家高面數車模、並於 `.glb` 下載期節流幀率以防主執行緒卡頓）；真實 GPU 環境依主題快取 `envRTCache` 並保留完整 `512²` PBR / ACES / 環境反射畫質。
  - 新增 `getGrassPBRSet()`（縫合平鋪修剪草皮 Albedo + Normal + Roughness）、`getSceneDetailTextures()`（看台觀眾貼圖 `grandstandCrowdMap`、維修站車間門與玻璃幕牆 `pitBuildingMap`、山體岩石紋理 `mountainRockMap` / `mountainNormalMap` 與樹冠紋理 `barkFoliageMap`）及 `buildAlpineMountainMesh()`（頂點高度置換與森林—花崗岩—雪線漸層著色），替換原本 `rebuild3DCircuitScene()` 中的單色平面地面、緩衝區草皮、路肩、雙層松樹、看台、維修站房與遠景山錐，維修站玻璃並改用 `THREE.MeshPhysicalMaterial` 清漆材質。

### 3. 實景 `.glb` 賽道載入與道路走廊裁切 (`carveMeshOutOfCorridor`)
- **[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)**、**[index.html](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html)**（`#btn-garage-glbtrack`）與 **[`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js)**：
  - 啟用 `window.ENABLE_GLB_TRACK_SCENERY = true` 並於車庫 `4. 賽道 PBR 材質` 新增 `3D 實景賽道模型 (GLB Scenery)` 開關；硬體 GPU 載入 `monza.glb` / `spa_francorchamps.glb` / `suzuka_circuit.glb`（快速切換賽道時具備 `150ms` 防抖），軟體 WebGL 預設跳過巨型賽道 `.glb`（可透過 `window.FORCE_GLB_TRACK_SCENERY = true` 強制測試）。
  - `buildTrackSpatialGrid(24.0, halfW + 10.0)` 預擴展鄰近網格達成單次 `Map.get()` 查詢；`carveMeshOutOfCorridor()` 結合世界空間包圍盒 (`_carveWorldBox`) 與 2D 網格粗篩、單網格快速剔除，並以零緩衝區複製方式建立裁切後的 `BufferGeometry` 索引，排除侵占路面走廊與遮擋原路面網格之三角面。

### 4. 最終編輯後實測結果 (2026-11-15)
- `python scratch/check_syntax.py`：**7 / 7 OK**（`audio.js`、`circuits.js`、`flow.js`、`input.js`、`main.js`、`physics.js`、`render.js`）
- `python apex_desktop_app.py --check`：**APEX DESKTOP SERVER SELF-CHECK PASSED 100%**（`6/6` 本地靜態與 `model/gltf-binary` 資產路由 HTTP 200）
- `verify_track_geometry.py`：**ALL 5 CIRCUITS PASSED ZERO-FOLD, ZERO-OVERLAP, AND SCENERY CLEARANCE AUDIT**
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/verify_new_assets.py` (Headless Chrome WebGL)：**Errors: []**，`ALL 6 NEW CAR GLBs + 5 CIRCUITS + MULTI-CLASS SCALING VERIFIED 100%!`（`monza 80.42s`, `fuji 86.27s`, `hakone 94.983s`, `spa 100.276s`, `suzuka 88.636s`；Spa 多級距 `100.276 > 95.002 > 88.575`）
- `bench_tracks.py`（強制啟用 `FORCE_GLB_TRACK_SCENERY = true` 實測 `spa_francorchamps.glb`）：`mounted: true`、`errors: []`、`gridMs: 0.4`、`carveMs: 8.9`、`hiddenRoadMeshes: 8`、`carvedMeshes: 8`、`carvedRemoved: 171`，**`< 500ms` 基準通過**
- `python scratch/test_proposal.py`：**44 / 44 PASSED**（含無頭 Chrome 啟動 `index.html`、`144275` chars、零 `#apex-crash-banner`）

---

## 2026-11-15 — 修復賽道上空異常懸浮山體／樹牆切塊與浮空樹木建模 (Sky & Scenery Grounding Fix)

### 1. 問題根因
- **未對齊外部 `.glb` 賽道場景於賽道上空被水平切斷**：`spa_francorchamps.glb`、`monza.glb`、`suzuka_circuit.glb` 的平面路線與高程（例如斯帕 Blanchimont 高達 `+90m..+134m` 的山體與黑色松樹牆）與自訂閉環樣條賽道（`+6m`）不重合；舊版 `carveMeshOutOfCorridor` 僅剔除 `wy < ny + 14.0` 範圍，導致 `14m` 以上的山體與樹牆在半空形成整齊水平切面懸浮塊；同時 `gfxSettings.glbTrackScenery: true` 已寫入 `localStorage`（`apexpro.gfx`）。
- **程序化樹木、看台與維修站超出草地緩衝區（`runoffHalfW`）而懸空**：舊版 `treeDist` 放在 `halfW + 14.5 .. halfW + 29.5m`、看台／維修站外緣延伸至 `halfW + 17.5m / 15.0m`，全數超出 `runoffHalfW = halfW + 12.0m` 邊界且底部未向下紮根；高處賽道段在鄰近低處賽道草地上空亦因 `isClearOfOtherTrack` 垂直淨空僅 `14m` 而產生浮空樹。
- **高架／起伏路段草地外緣下方鏤空與遠山基座懸空**：`runoffGeo` 下方缺乏封閉護坡側裙；`mtFuji` 與 `hillCoords` 未依 `groundY` 擺放（在箱根 `groundY = -28.90m` 懸空），且 `hillCoords[2]` 過近斯帕賽道西側。

### 2. 修復內容 ([`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js))
- **預設強制停用未對齊的 `.glb` 實景賽道模型並移除 `14m` 上空裁切上限**：
  - 將 `gfxSettings.glbTrackScenery` 預設設為 `false`，並於讀取 `localStorage.getItem('apexpro.gfx')` 後強制設為 `false`；將 `window.ENABLE_GLB_TRACK_SCENERY` 預設設為 `false`（僅在顯式設定 `window.FORCE_GLB_TRACK_SCENERY === true` 時放行）。
  - 調整 `buildTrackSpatialGrid`（`maxY: 1e6`）與 `isPointInRoadCorridor`（移除 `+14.0m` 上限，只要水平落在走廊內且 `wy >= ny - 8.0` 即裁切），防止測試手動啟用時於賽道上空殘留水平切塊。
- **修正遠景山脈基座與座標，並強化跨賽道段淨空檢查**：
  - 先計算 `minTrackY` 與 `groundY = Math.min(-20, minTrackY - 10.0)`，將 `mtFuji` 與 4 座 `hillCoords` 外移至 5 條賽道安全距離外（`x: ±2150..-2200, z: 1850.. -1450`）並設定 Y 為 `groundY + h * 0.48`（底面嵌入地面下 `2%` 高度）。
  - `isClearOfOtherTrack` 水平淨空基準擴大為 `hw + 13.5 + minClearance`、垂直淨空擴大至 `65.0m`。
- **新增垂直護坡側裙（Embankment Skirt）與全場景物件草地內嵌紮根**：
  - 於 `rebuild3DCircuitScene()` 同步建立 `skirtGeo`（非橋樑區段沿 `runoffGeo` 外緣 `rLx/rRx` 垂直封閉至 `groundY`，附岩土草坡漸層頂點色），徹底封閉高低差賽道外緣下方鏤空。
  - 所有路旁物件嚴格收斂於 `runoffHalfW = halfW + 12.0m` 內且底部深植地面以下：`treeDist = halfW + 4.2 + ((idx * 3) % 6.5)`（`trunkGeo` 高 `4.6m`、`y = 0.9` 下探 `-1.4m` 並避開急彎輪胎牆）、`poleDist = halfW + 6.5`（`lightPoleGeo` 高 `13.0m`、`y = 5.0` 下探 `-1.5m`）、`tireStackGeo`（高 `1.8m`、`y = 0.4` 下探 `-0.5m`）、看台與維修站（`standOffset` / `pitOffset = halfW + 7.2`、深 `8.0m`，外緣 `<= halfW + 11.3m`，基座下探 `-3.0m`）。

### 3. 驗證結果 (2026-11-15)
- `verify_track_geometry.py`：**ALL 5 CIRCUITS PASSED ZERO-FOLD, ZERO-OVERLAP, EMBEDDED-BASE, RUNOFF-BOUNDED SCENERY & GLB-OFF AUDIT**（`monza` / `fuji` / `hakone` / `spa` / `suzuka` 全數 `road_folds=0`、`runoff_folds=0`、`same_overlaps=0`、`scenery_hits=0`、`outside_runoff=0`、`floating_hills=0`、`hill_overlaps=0`、`pier_hits=0`）
- `python scratch/check_syntax.py`：**7 / 7 OK**
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**44 / 44 PASSED**（含無頭 Chrome 啟動 `index.html`、`144271` chars、零 `#apex-crash-banner`）
- `python scratch/verify_new_assets.py` (Headless Chrome WebGL)：**Errors: []**，`ALL 6 NEW CAR GLBs + 5 CIRCUITS + MULTI-CLASS SCALING VERIFIED 100%!`（`monza 80.42s`, `fuji 86.27s`, `hakone 94.983s`, `spa 100.276s`, `suzuka 88.636s`；Spa 多級距 `100.276 > 95.002 > 88.575`）

---

## 2026-11-21 — 全面實作剩餘升級計畫（Work Packages 1–4）

### 1. Work Package 1 — 3D 賽道生物群系、場景細節與 dGPU 後製管線
- **[`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js)**：為 5 條賽道 `CIRCUITS[0..4].theme` 新增專屬 `biome`（`monza_park` / `fuji_sunset` / `hakone_night` / `spa_ardennes` / `suzuka_bay`）、`skyTop`、`skyMid`、`skyHorizon`、`cloudTint`。
- **[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)**：
  - 新增程序化 GLSL 天空穹頂 `procedural_sky_dome`（瑞利大氣散射漸層 + FBM 動態雲層 + 雨天陰雲混合）；富士山僅顯示於 `fuji_sunset`（`mt_fuji_landmark`），鈴鹿賽道 `suzuka_bay` 新增 Motopia 摩天輪遠景地標。
  - 新增 `armcoMap` / `concreteMap` 與連續式雙波紋 Armco 鋼質防撞護欄（含夜間反光條）、高架橋水泥護欄與橋墩貼圖、彎道外緣紅/白/藍 FIA TecPro 緩衝牆、岩質地形側裙、多層交錯針葉松與闊葉樹冠，以及高精度 Canvas 橫幅 `makeGantryBannerTexture()`。
  - 啟用 `2048×2048` `PCFSoftShadowMap` 跟隨玩家位置之動態平行光陰影（`gfxSettings.dynamicShadows`），以及 4-pass 零相依原生 WebGL 高光輝光後製 `renderSceneWithOptionalBloom`（獨立 ACES 色調曲線，不使用 `#include <tonemapping_fragment>`；`isSoftwareWebGL` 自動降級跳過；`gfxSettings.bloomFx` 控制）。
  - 於 [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js) 新增底盤擦撞／極限壓縮火花粒子 (`'spark'`)；全程未加入煞車碟盤熱紅光效。

### 2. Work Package 2 — 自訂塗裝花紋、JDM GT-R GT500 與同級多車型 AI 陣容
- **[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)** 與 **[`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js)**：
  - 新增 `getProceduralLiveryTexture()` 支援 4 種塗裝（`solid` 單色清漆 / `duotone` 雙色金屬 / `stripes` 賽車條紋 / `esports` 電競幾何）與副色 `accentHex`，整合至 `applyCustomLiveryColors()`、`buildProceduralBody()` 與車庫 `#gar-paint-customizer`。
  - 新增 `nissan_gtr_gt500`（`JDM · CLASS TA`）於 `CAR_HANDLING_PROFILES`、`CAR_MODEL_PRESETS`、`CAR_CATALOG`，搭配寬體及標誌性四出圓形 LED 尾燈幾何，並強化分流器鰭片、鯊魚鰭與雙層尾翼區隔；更新各級距徽章色與分級距最佳單圈紀錄（PB）。
  - 新增 `syncAIMultiCarModels()` 與 `aiModelTemplateCache`，依玩家車級（`GT3` / `JDM` / `HYPER` / `LMP1`）指派同級異款車模與獨立 AI 塗裝。

### 3. Work Package 3 — 雨天濕地天候與 FIA 賽道旗號系統
- **[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)**、**[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)**、**[`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js)**、**[`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js)**：
  - 預設晴天 `'dry'`，可於出賽設定 Step 3 或快捷選單 `#btn-weather-toggle` 切換 `'wet'`。
  - 新增濕地專屬雨胎配方 `TIRE_COMPOUNDS.wet`（`W · WET`, `#38bdf8`, `wetGripBonus: 1.26`）；濕地路面抓地倍率為 `0.72`（`-28%`），裝配雨胎回復至 `~0.907`，並同步縮放 AI 濕地過彎與加減速步調，搭配 550 條 3D 雨絲 `rainSystem` 與後輪水霧 `'spray'`。
  - 新增 FIA 旗號判定 `updateRaceFlags(dt)`（`yellow` 前車失控/緩行、`blue` 落後被套圈快車逼近、`checkered` 衝線完賽）並連動 HUD `#hud-flag-banner`。

### 4. Work Package 4 — 電競風格 UI / HUD 細節強化
- **[`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html)** 與 **[`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js)**：
  - 為 `.carbon-bg` / `.af-panel` 加上碳纖維斜紋質感、為 `.af-btn` / `.af-choice` 加入斜向高光掃掠動畫、RPM `>= 8350` 時 `#pc-motec-pod` 與 `#hud-top-pill` 觸發 `.hud-redline-pulse` 紅線脈衝外框、CNC 鑽孔金屬觸控踏板與方向盤刻度環、MT 換檔撥片切角外觀，並於車庫畫質設定區新增 `#btn-garage-shadows` / `#btn-garage-bloom`（`#btn-garage-glbtrack` 預設顯示 `OFF`）。

### 5. 全套實機與自動化測試結果 (2026-11-21)
- `python scratch/check_syntax.py`：**7 / 7 OK**（`audio.js`、`circuits.js`、`flow.js`、`input.js`、`main.js`、`physics.js`、`render.js`）
- `verify_track_geometry.py`：**ALL 5 CIRCUITS PASSED ZERO-FOLD, ZERO-OVERLAP, EMBEDDED-BASE, RUNOFF-BOUNDED SCENERY & GLB-OFF AUDIT**
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**ALL PROPOSAL TESTS PASSED: 44/44**（`index.html` `148776` chars，零 `#apex-crash-banner`）
- `python scratch/verify_new_assets.py` (Headless Chrome WebGL)：**Errors: []**，`ALL 6 NEW CAR GLBs + 5 CIRCUITS + MULTI-CLASS SCALING VERIFIED 100%!`
- `python scratch/test_all_upgrades.py` (Headless Chrome WebGL)：**ALL UPGRADES VERIFIED 100% SUCCESSFULLY!**（`errors: []`、5 條賽道生物群系／SkyDome／地標正確、`bloomCompileOk: true / bloomGlError: 0`、`brakeGlowCount: 0`、`nissan_gtr_gt500` JDM + 4 種塗裝 + 4 級距 AI 陣容、乾濕抓地 `1.00 -> 0.72 -> 0.9072`、雨絲顯示切換、黃/藍/方格旗與 DOM 控制項全數通過）
- `launch_apex_desktop.bat --check`：**APEX DESKTOP SERVER SELF-CHECK PASSED 100%**（`6/6` HTTP 200）

---

## 2026-11-21 // 修復四項實機駕駛與視覺異常（車頭方向／尾燈誤判／頭燈光錐／倒車偏航震盪）

### 1. 根因診斷與修復內容
1. **McLaren Senna 與 Pagani Huayra R 車頭倒反**（[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L2909-L2914) `normalizeVehicleScene`）：
   - **根因**：Three.js `GLTFLoader` 會將節點空白轉為底線（如 `3DWheel_Front_L`、`Calliper_Front_L_02`），導致原本使用 `\b` 與 `\s*` 的 `isFront` / `isRear` 正則無法匹配，`frontCnt` 與 `rearCnt` 雙雙歸零而停留在 `baseRotY = -Math.PI / 2`（車頭朝 `-X`）。
   - **修復**：改用 `(?:^|[^a-z])(...[_\s-]+...)` 邊界與分隔符正則（並補入 `red[_\s-]?glass` 尾燈參考），使兩車正確翻轉 `+Math.PI` 朝 `+X` 前進。
2. **部分車款煞車時全車車架／防滾籠發紅發光**（[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L3224-L3256) `classifyHiFiMaterials`）：
   - **根因**：舊正則 `/tail|.../` 未設單字邊界，導致 `"detail"` / `"details"` 字尾的子字串 `"tail"` 誤中 `bmw_details`、`chassis_details`、`Carbon1MDetails`、防滾籠等材質並歸類為 `role = 'taillight'`（煞車時套用 `emissiveIntensity = 2.2` 紅光）。
   - **修復**：加入完整詞彙邊界 `TAIL_RE` / `HEAD_RE`、`NOT_LIGHT_RE` 排除清單（`details?` / `chassis` / `rollcage` / `carbon` / `body` 等）及面積上限過濾（`area < 1.6` 且 `< maxMatArea * 0.35`）。
3. **夜晚頭燈光錐方向相反且在半空形成大片灰牆**（[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L3994-L4101) `headlightGroup`）：
   - **根因**：`ConeGeometry(4.2, 42)` 窄尖端在 `+Y`、寬底在 `-Y`，經 `rotateZ(-Math.PI / 2)` 後寬底落在車頂後方 `-X`、尖端指向前方。
   - **修復**：改用 `CylinderGeometry(0.16, 2.75, 34, 24, 1, true)` 搭配 `rotateZ(Math.PI / 2)`（窄端位於 `+2.18m` 車燈處、寬端向前擴散至 `+36.2m`），結合線性漸淡 Alpha 貼圖 `makeHeadlightBeamTexture()`、路面光斑 `makeHeadlightPoolTexture()`（`AdditiveBlending`）及前燈泡發光圓片。
4. **娛樂版低速轉向／靜止倒車與逆向時誤報打滑與畫面鬼畜震動**（[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L1313-L1357)、[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L4384-L4522)）：
   - **根因**：Arcade 分支在倒車／低速／逆向時仍施加 `-headingDiff * 0.95` 修正，且 `gear === -1` 時再乘 `reverseYawFactor = -1` 反轉成 `+headingDiff * 0.95` 正回饋自旋；同時 `isOversteer` 與 `chaseCamRig` 前瞻偏移未過濾倒車與低速。
   - **修復**：為 `arcadeAssist` 與 `straightCentering` 加入前進／速域／角度平順閘門 `forwardAlignFade`；直接於 `steerYaw` 處理倒車轉向符號並改為 `simState.heading += simState.yawRate * dt`；限定非碰撞的 `isOversteer` 僅在前進檔、非逆向且 `speedKmh > 45` 時觸發；`render.js` 在倒車或低速／逆向時將前瞻偏移倍率 `forwardLookScale` 平順衰減為 `0`。

### 2. 全套實機驗證結果 (2026-11-21)
- `python scratch/check_syntax.py`：**7 / 7 OK**
- `verify_track_geometry.py`：**ALL 5 CIRCUITS PASSED ZERO-FOLD, ZERO-OVERLAP, EMBEDDED-BASE, RUNOFF-BOUNDED SCENERY & GLB-OFF AUDIT**
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**ALL PROPOSAL TESTS PASSED: 44/44**（`index.html` `148776` chars，零 `#apex-crash-banner`）
- `python scratch/verify_new_assets.py`：**ALL 6 NEW CAR GLBs + 5 CIRCUITS + MULTI-CLASS SCALING VERIFIED 100%!**（`mclaren_senna`: `FL: 1.104, RL: -1.473`；`pagani_huayra_r`: `FL: 1.291, RL: -1.163`）
- `python scratch/test_all_upgrades.py`：**ALL UPGRADES & BUG FIXES VERIFIED 100% SUCCESSFULLY!**（`mclaren_senna` `frontNodeX=0.951 > rearNodeX=-1.472`、`pagani_huayra_r` `frontNodeX=1.184 > rearNodeX=-1.048`；`bmwDetailsRole='trim'` / `rollcageDetailRole='trim'` / `brakeLampRole='taillight'`；頭燈光束 `minX=2.18, maxX=36.2, frontMaxR=0.442 -> farMaxR=3.185`；Arcade 靜止倒車 `revMaxYaw=0, revOversteer=false, revHeadingDelta=0`、低速逆向 `wwOversteer=false, yawFlips=0`；Bloom GLSL 編譯零錯誤 `bloomGlError=0`）
- `launch_apex_desktop.bat --check`：**APEX DESKTOP SERVER SELF-CHECK PASSED 100%**（`6/6` HTTP 200）

---

## 2026-11-22 // 移除方塊程序化 GT-R 模型與修復天空遠裁剪單色塊破洞

### 1. 修改與修復內容
1. **移除粗糙程序化 GT-R 與防止高模 AI 車退化為方塊車**：
   - 於 [`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js#L135-L140)、[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js#L175-L180) 與 [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L2340-L2380) 完整移除 `nissan_gtr_gt500` 項目、方塊幾何分支及 `CLASS_AI_ROSTERS.JDM`，並加入 `localStorage` 舊版 `presetId` 回退為 `ferrari458` 的保護。
   - 於 [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L3310-L3330) `resolveSlotHiFiSource` 與 `applyHiFiTemplateToSlot` 移除異款高模尚待載入期間直接回傳 `null` 導致 AI 退回方塊幾何的分支，並將獨立 GPU 下非玩家高模多邊形上限由 `150,000` 放寬至 `350,000`（`mclaren_senna` `238k` 與 `pagani_huayra_r` `301k` 皆維持真實 GLB 外觀）。
2. **消除賽道遠景突兀單色半球／破洞**（[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js#L8-L10) & `rebuild3DCircuitScene` & `update3DSceneAndVisualFX`）：
   - **根因**：原本 `skyDomeMesh`（半徑 `2350m`）固定於世界原點 `(0,0,0)` 而 `camera.far = 2600`，當車輛行駛至斯帕等大賽道外圍區段時，遠端穹頂距離達 `3300–3550m > camera.far`，遭攝影機遠裁剪面切出巨大的圓弧破洞而露出單色 `scene.background`（`#3b5370`）。
   - **修復**：將攝影機 `camera.far` 提升至 `4800`、`skyDomeMesh` 擴增為 `SphereGeometry(4200, 48, 28)`（`renderOrder = -1000`、`frustumCulled = false`）、地面 `groundGeo` 擴展為 `9600×9600`（UV `800×800`），且每幀在攝影機更新後執行 `activeSkyDomeMesh.position.copy(camera.position)`，確保天空穹頂始終與攝影機等距包裹無裁剪破洞；同步設定 `scene.background = new THREE.Color(th.skyHorizon || th.skyColor)`。

### 2. 全套實機驗證結果 (2026-11-22)
- `python scratch/check_syntax.py`：**7 / 7 OK**
- `verify_track_geometry.py`：**ALL 5 CIRCUITS PASSED ZERO-FOLD, ZERO-OVERLAP, EMBEDDED-BASE, RUNOFF-BOUNDED SCENERY & GLB-OFF AUDIT**
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**ALL PROPOSAL TESTS PASSED: 44/44**
- `python scratch/verify_new_assets.py`：**ALL 6 NEW CAR GLBs + 5 CIRCUITS + MULTI-CLASS SCALING VERIFIED 100%!**
- `python scratch/test_all_upgrades.py`：**ALL UPGRADES & BUG FIXES VERIFIED 100% SUCCESSFULLY!**（`gtrCheck.removedEverywhere = true`、Spa 遠端點驗證 `cameraFar = 4800 / domeRadius = 4200 / camDistDelta = 0`）
- `launch_apex_desktop.bat --check`：**APEX DESKTOP SERVER SELF-CHECK PASSED 100%**（`6/6` HTTP 200）

---

## 2026-11-22 // 真實 1:1 斯帕-弗朗科爾尚賽道重建（OpenF1 3D 遙測 × TUMFTM 幾何中心線融合 + `.glb` 3D 模型實裝）

### 1. 資料管線與前處理實作
1. **真實 Telemetry 擷取與賽車線修正**（[`scratch/preprocess_spa_f1.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/scratch/preprocess_spa_f1.py)）：
   - 原 [`assets/models/tracks/spa_telemetry.csv`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/tracks/spa_telemetry.csv) 僅含 Garage 61 單圈摘要統計（10 列，無軌跡經緯度／高程）。改由免費無須帳號之 **OpenF1 API**（2024 Belgian GP Race `Lap 32`, Driver `#1 VER`, `106.128s`）擷取 `415` 點真實 3D 座標與油門／煞車／檔位遙測並存於 [`assets/models/tracks/spa_f1_telemetry.csv`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/tracks/spa_f1_telemetry.csv)（高程落差 `dZ = 102.30m`），經曲率／駕駛偏移估測修正賽車線並以 Periodic Cubic Spline 等距重採樣為 `0.5m`（`14,072` 點，`7036.11m`）。
2. **TUMFTM 衛星中心線融合與 1:1 PBR `.glb` 輸出**（[`scratch/build_spa_track.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/scratch/build_spa_track.py)）：
   - 將 OpenF1 3D 軌跡以剛體 ICP 對齊 **TUMFTM** `Spa.csv`（`1,401` 點，寬度 `7.87m..16.42m`，`mirror=False, mean_residual=2.67m, rms=3.00m`），產出遊戲世界座標 `0.5m` 融合中心線（`7000.74m`、`X=[-1770.6, 360.8]`、`Z=[-1125.7, 280.4]`、`Y=[-48.46, 53.80]`、`dY=102.27m`），產出對比圖 [`spa_fused_verification.png`](file:///C:/Users/raymo/.gemini/antigravity/brain/cfd58b47-e6c4-4542-a9aa-430b016e1717/spa_fused_verification.png)。
   - 匯出 1:1 PBR glTF 2.0 3D 賽道模型 [`assets/models/tracks/spa_francorchamps.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/tracks/spa_francorchamps.glb)（`2,513,616` bytes，5 個 Mesh：`Spa_Asphalt`、`Spa_Grass_Runoff_Skirt`、`Spa_Kerbs_RedYellow`、`Spa_Armco_Barriers`、`Spa_Start_Gantry`）。
3. **遊戲賽道與 HUD 整合**：
   - [`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js)：更新 `CIRCUITS[3]` (`spa`) 為 140 組零折疊 1:1 Catmull-Rom 路點（`width: 16.0`, `proLapTime: 134.500`, `glbTransform` 歸零對齊），並匯出 `window.trackNodes` 與 `window.getTotalTrackLength`。
   - [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)：於 `rebuild3DCircuitScene()` 看台與維修區建物生成迴圈加入曲率過濾（`if (Math.abs(n.curvature) > 0.0038) continue;`），避免 T1 La Source 髮夾彎內側誤生看台。
   - [`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js)：新增快取式 `getTrackMinimapBounds()` 動態計算小地圖縮放邊界，使 7 km 真實比例斯帕與其餘賽道皆可完整自適應顯示於小地圖。

### 2. 全套實機驗證結果 (2026-11-22)
- `python scratch/check_syntax.py`：**7 / 7 OK**
- `verify_track_geometry.py`：**ALL 5 CIRCUITS PASSED ZERO-FOLD, ZERO-OVERLAP, EMBEDDED-BASE, RUNOFF-BOUNDED SCENERY & GLB-OFF AUDIT!**（`spa`: `len=6818.2m | minY=-48.48m (gnd=-58.48m) | road_folds=0 | runoff_folds=0 | same_overlaps=0 | scenery_hits=0 | outside_runoff=0 | floating_hills=0 | hill_overlaps=0 | pier_hits=0`）
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**ALL PROPOSAL TESTS PASSED: 44/44**（`index.html booted cleanly (148291 chars, zero #apex-crash-banner)`）
- `python scratch/verify_new_assets.py`：**ALL 6 NEW CAR GLBs + 5 CIRCUITS + MULTI-CLASS SCALING VERIFIED 100%!**（`spa`: `proLapTime: 138.139, minY: -48.4, maxY: 53.8`；`Class Benchmarks on Spa: procedural 138.139 / mclaren_senna 129.868 / porsche_919_evo 119.774`）
- `python scratch/test_all_upgrades.py`：**ALL UPGRADES & BUG FIXES VERIFIED 100% SUCCESSFULLY!**（`spaRealTrack`: `totalLen=6818.2`, `elevSpanY=102.32`, `glbSpaCheck: ok=true, meshCount=5, spanX=2166.6, spanY=113.3, spanZ=1439.3, centerDeltaX=37.9`）
- `launch_apex_desktop.bat --check`：**APEX DESKTOP SERVER SELF-CHECK PASSED 100%!**（`6/6` HTTP 200，`spa_francorchamps.glb` `2,513,616 bytes`）

---

## 📋 2026-11-22｜Phase 1–4 連貫實作：真實 1:1 賽道管線、九大賽道擴充、車輛調校/賽道條件、可回看紀錄資料庫與分級防洗榜排行榜

### 1. 本次已完成修改與產出內容
1. **Phase 1：蒙扎與鈴鹿 1:1 真實 3D 賽道重建（OpenF1 + TUMFTM 融合管線）**：
   - 建立通用自動化腳本 [`scratch/build_real_track.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/scratch/build_real_track.py) 與 [`scratch/update_circuits_js.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/scratch/update_circuits_js.py)，將 OpenF1 2024 3D GPS 遙測剛體 ICP 對齊 TUMFTM `*.csv` 賽道寬度/中心線，以均勻弧長零折疊鬆弛（Catmull-Rom）匯出 PBR `.glb`（並將舊 82.5MB/46MB 檔案大幅瘦身至約 `1.6MB–2.2MB`）：
     - [`assets/models/tracks/monza.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/tracks/monza.glb)（`2,061,356 bytes`）
     - [`assets/models/tracks/suzuka_circuit.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/tracks/suzuka_circuit.glb)（`2,180,828 bytes`，含 8 字型立體交叉 C2 高斯平順抬升 `dy=13.1m`、`bridge_nodes=15`）
2. **Phase 2：擴充世界九大知名賽道與動態賽道環境**：
   - 新增 4 條 1:1 真實賽道模型與 [`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js) 完整資料（連同 Monza、Fuji、Hakone、Spa、Suzuka 共 9 條賽道，並同步所有實解 GT3 `proLapTime` 基準與匯出 `window.estimateClassProLapTime`）：
     - Silverstone：[`assets/models/tracks/silverstone.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/tracks/silverstone.glb)（`2,172,332 bytes`）
     - Interlagos：[`assets/models/tracks/interlagos.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/tracks/interlagos.glb)（`1,674,176 bytes`）
     - Red Bull Ring / Spielberg：[`assets/models/tracks/red_bull_ring.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/tracks/red_bull_ring.glb)（`1,621,112 bytes`）
     - COTA Austin：[`assets/models/tracks/cota_austin.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/tracks/cota_austin.glb)（`2,032,348 bytes`）
   - 對比圖驗證：[`all_rebuilt_tracks_verification.png`](file:///C:/Users/raymo/.gemini/antigravity/brain/cfd58b47-e6c4-4542-a9aa-430b016e1717/all_rebuilt_tracks_verification.png)。
   - [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)：新增 COTA 地標塔台 `cota_texas`、將周邊 `hillCoords` 外移至遠景山丘安全距離，並將 `isBridgeNode(node)` 交叉判斷收斂為 `dxz < 36.0`（移除誤觸斜坡高差），確保 9 條賽道立體交叉與護欄/路肩零誤判。
3. **Phase 3：車輛物理調校 (`Car Setup`) 與賽道條件快照 (`Session Track Conditions`)**：
   - [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)：實作 `CAR_SETUP_PRESETS`（`low_drag`、`balanced`、`high_downforce`）與四維參數（尾翼 `aeroWing` 1–5、煞車平衡 `brakeBias` 52–64%、齒比 `short/standard/long`、懸吊 `soft/balanced/stiff`，預設 `balanced` 下各項乘數精確保持 `1.0`）；新增 `TRACK_SURFACE_STATES`（`green 98% / fast 100% / optimum 102%`）、路面/環境溫度、時段與天候快照（`refreshSessionTrackConditions`、`getSessionConditionsSnapshot`），並擴充 `currentLapSamples` 紀錄檔位、轉速、縱向 G 值與路肩/草地狀態。
4. **Phase 4：IndexedDB 圈速紀錄資料庫、嚴格分級防洗榜排行榜與 MoTeC 雙圈遙測疊加**：
   - [`js/records.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/records.js)：建立 `ApexProRecordsDB`（IndexedDB 持久化 + `localStorage['apexpro.records']` 自動遷移 + JSON 匯出/匯入），並以規範對應 `resolveCarClass` 防竄改校驗將排行榜嚴格隔離於 `(circuitId, carClass, edition, weather)` 分區（支援 `per_car / per_driver / all` 去重與 PRO/Gold/Silver/Bronze 分級基準）。
   - [`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html)、[`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js)、[`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js)：新增 `#scr-records` 紀錄與排行榜總覽、車庫調校面板、Step 3 九賽道分類篩選與路面狀態切換、結算頁組別排名徽章，以及升級版 MoTeC 遙測分析視窗（`#tel-meta-strip`、雙圈疊加比對 `#select-telemetry-compare`、Channel 3 `#chart-delta` Δt 曲線、同步游標檢視與一鍵載入 Ghost `#btn-telemetry-load-ghost`）。
   - [`apex_desktop_app.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/apex_desktop_app.py)：補充新 4 條賽道 `.glb` `HEAD` 健康檢查。

### 2. 全套實機驗證結果 (2026-11-22)
- `python scratch/check_syntax.py`：**8 / 8 OK**（含新增 `js/records.js`）
- `verify_track_geometry.py`：**ALL 9 CIRCUITS PASSED ZERO-FOLD, ZERO-OVERLAP, EMBEDDED-BASE, RUNOFF-BOUNDED SCENERY & GLB-OFF AUDIT!**（Suzuka `bridge_nodes=15 (dy=13.2m)`，其餘賽道均 `road_folds=0 | runoff_folds=0 | same_overlaps=0 | scenery_hits=0 | pier_hits=0`）
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**ALL PROPOSAL TESTS PASSED: 44/44**（`index.html booted cleanly (158937 chars, zero #apex-crash-banner)`）
- `python scratch/verify_new_assets.py`：**ALL 6 NEW CAR GLBs + 5 CIRCUITS + MULTI-CLASS SCALING VERIFIED 100%!**（實測全 9 條賽道 GT3 `proLapTime` 基準與全 6 台車 `.glb` 正常載入）
- `python scratch/test_all_upgrades.py`：**ALL UPGRADES & BUG FIXES VERIFIED 100% SUCCESSFULLY!**（全 9 種天候地景 + 全 7 條重建/新增賽道 `.glb` WebGL 載入 `ok: true, meshCount: 5`）
- `python scratch/test_records_and_setup.py`：**ALL LAP RECORDS DB, CLASS LEADERBOARD, SETUP PHYSICS & MOTEC OVERLAY TESTS PASSED 100%!**（含 7 秒加速短齒比 `214.3 > 209.26 km/h`、尾翼 1 尾速 `283.67 > 274.75 km/h`、IndexedDB 重載持久化、跨組/跨版/跨天候零滲透與類組防洗榜 `spoofSanitized=1`、MoTeC Δt 與 Ghost 載入）
- [`launch_apex_desktop.bat`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/launch_apex_desktop.bat) `--check`：**APEX DESKTOP SERVER SELF-CHECK PASSED 100%!**（`10/10` HTTP 200）

---

## 📋 2026-11-22｜導入 23 台全新 `.glb` 車輛（總計 33 台）與 5 大組別分類車庫重構

### 1. 本次已完成修改與產出內容
1. **完整導入 `assets/models/cars/` 全部 23 台全新本地 `.glb` 模型（全車庫擴充至 33 台、5 大競技組別）**：
   - **新增兩大獨立分級**：`STREET · CLASS A`（翠綠 `#34d399`，4 台：[`nissan_x-trail.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/cars/nissan_x-trail.glb)、[`lamborghini_countach_5000qv__www.vecarz.com.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/cars/lamborghini_countach_5000qv__www.vecarz.com.glb)、[`lb-works_ferrari_f40__www.vecarz.com.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/cars/lb-works_ferrari_f40__www.vecarz.com.glb)、[`lamborghini_aventador.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/cars/lamborghini_aventador.glb)）與 `F1 · CLASS F1`（緋紅 `#f43f5e`，1 台：[`f1_2026_sf26.glb`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/assets/models/cars/f1_2026_sf26.glb)）。
   - **既有組別大幅擴充**：`GT3` 增至 8 台（新增 `ferrari_296_gt3.glb`、`ferrari_488_gt3.glb`、`lamborghini_huracan_gt3.glb`、`mclaren_650s_gt3.glb`）；`HYPER` 增至 14 台（細分 7 台賽道版＋ 7 台街道旗艦，含 `2014_ferrari_laferrari.glb`、`mclaren_p1.glb`、`2015_mclaren_p1_gtr.glb`、`2018_ferrari_fxx-k_evo.glb`、`2023_ferrari_sf90_xx_stradale.glb`、`free_lamborghini_revuelto.glb`、`free__lamborghini_centenario_lp-770.glb`、`lamborghini_essenza_scv12.glb`、`lamborghini_venevo.glb`、`2020_lamborghini_sc20.glb`）；`LMP1` 增至 6 台（新增 `free__lamborghini_terzo_millennio.glb`、`alpine-vision.glb`、`mazda_furai__www.vecarz.com.glb`、`mazda_lm_vision__www.vecarz.com.glb`）。
2. **3D 車輛標準化管線強化 (`js/render.js`)**：
   - [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)：實作頂點級精確包圍盒 `computeExactWorldBox()`（修正旋轉子節點 AABB 膨脹造成懸空問題），為傾斜匯出的 Ferrari 296/488 GT3 套用精準偏航角 `overrideYawRad`、為雙軸或四輪合併網格擴充 `splitMergedWheelMeshes()`（並限制 Porsche `.006-.009` 規則避免誤切 McLaren 650S GT3 車殼），為 Nissan X-Trail 等模型擴充拼音/多語輪胎與輪轂蓋綁定，並擴充全 5 組別 `CLASS_AI_ROSTERS`。
3. **5 組別物理、PRO 基準倍率與防洗榜分區**：
   - [`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)：新增 23 台車 `CAR_HANDLING_PROFILES` 參數，並調整 6 檔極速上限判斷以正確支援 `STREET`（205–318 km/h）至 `F1`（372 km/h）級距。
   - [`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js) 與 [`js/records.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/records.js)：統一 `window.estimateClassProLapTime`（`STREET 1.095 / GT3 1.000 / HYPER 0.940 / LMP1 0.867 / F1 0.810`）並保留 `_baseGt3ProLapTime`；於 `CLASS_META` 新增 `STREET` 與 `F1` 獨立排行榜分區與防洗榜校驗。
4. **分類車庫 UI/UX 重構 (`index.html`、`js/flow.js`)**：
   - [`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html) 與 [`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js)：車庫進場預設鎖定當前座駕所屬組別（不再 33 台混在一起），底部展示列新增 `#gar-category-bar` 組別頁籤 (`STREET` / `GT3` / `HYPER` / `LMP1` / `F1` / `ALL`)、情境細分篩選（賽道版 vs 街道超跑等）、動態車廠篩選、即時關鍵字搜尋 (`#input-gar-search`)、左右捲動鍵及 `#btn-gar-grid-toggle` 網格展廳切換；進階模型彈窗同步分組顯示；排行榜 `#rec-class-pills` 新增 `STREET` 與 `F1` 分頁按鈕；[`apex_desktop_app.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/apex_desktop_app.py) 補齊代表性新車健康檢查。

### 2. 全套 10 項實機驗證結果 (2026-11-22)
- `python scratch/check_syntax.py`：**8 / 8 OK**
- `verify_track_geometry.py`：**9 / 9 賽道通過**（零折疊/零重疊/零碰撞）
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**44 / 44 PASSED**（`index.html` `176602 chars` 零錯誤啟動）
- `python scratch/verify_new_assets.py`：**100% PASSED**（6 原有高模＋ 9 賽道＋ Spa 多級距基準）
- `python scratch/test_all_upgrades.py`：**100% PASSED**（9 天候地景＋ 7 重建/新增賽道 GLB＋ GT3/HYPER/LMP1 AI＋車庫塗裝按鈕）
- `python scratch/test_records_and_setup.py`：**100% PASSED**
- `python scratch/verify_all_cars_and_garage.py`：**100% PASSED**（全部 29 台本地 `.glb` 真實 WebGL 載入 `ok: true`、`minY <= 0.003m` 貼地、正向朝前、27 台可拆輪車均 `wheels: 4`；車庫開窗預設 `GT3 (8)`，頁籤 `STREET=4, GT3=8, HYPER=14 (road=7, track=7, Ferrari=3), LMP1=6, F1=1, all=33`，搜尋 `F40` 與網格展開通過；Monza 基準 `113.607 > 103.751 > 97.526 > 89.952 > 84.038s`；`STREET` / `F1` 防洗榜 `spoofSanitized=2, gt3Count=0, lmp1Count=0`）
- [`launch_apex_desktop.bat`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/launch_apex_desktop.bat) `--check`：**13 / 13 HTTP 200 OK**

---

## 📋 2026-11-22｜全車庫 33 台車輛真實賽車性能調校（拉開 F1 / LMP1 / 超跑 / GT3 / SUV 真實級距）

### 1. 修改與物理重構明細
1. **實車空力下壓力、加速曲線與煞車物理重塑**（[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)）：
   - 更新全部 33 台車之 `CAR_HANDLING_PROFILES`，導入實車級 `powerFactor`、`launchFactor`、`aeroDownforceCoeff`、`aeroDragFactor`、`baseMuLat`、`brakeFactor`、`weightKg`、`maxGears`（5–8 速）、`gearSpeeds`、`idleRpm`/`redlineRpm`（6,200–16,000 rpm）、`shiftCutSec`、`pitchTone` 與 `bodyRollMult`，同時完整鎖定 GT3 基準車款數值不變。
   - 修正 `stepPhysics(dt)` 下壓力計算由原先寫死的 `0.68 * v^2` 改為依車型係數 `dfCoeff * v^2 * downforceMult`，並導入非線性空力彎道抓地增益 `aeroBonusG`、高速尾翼附加循跡 `aeroTractionAccel`、**空力輔助碳煞** `aeroBrakeExtra`（GT3 以下不觸發；F1/919 Evo 隨高速下壓力提供 4G+ 重煞能力）、依真實車重縮放之輪胎負重與側傾俯仰。
   - 新增 `getCarDrivetrainSpec()`、`getCarMaxGears()` 支援 4/5/6/7/8 速動態換檔與紅線轉速上限；更新 `computeDrivingCue` 與 `stepAIRivals` 依車種煞車/動力/空力精準匹配配速。
2. **物理級 PRO 圈速求解器與分級排行榜倍率校準**（[`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js)、[`js/records.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/records.js)）：
   - 升級 `getUpcomingCornerMaxSpeedKmh` 與 `generateProBenchmarkLap`，非 GT3 組別改以靜態＋動態空力定點疊代計算真實彎速與隨速空力減速，並修正過彎出彎循跡分母為該車於當下車速之極限側向 G 值；GT3 保留精準原始求解路徑。
   - 更新 `CLASS_PRO_MULT` 為 `{ STREET: 1.135, GT3: 1.0, HYPER: 0.895, LMP1: 0.750, F1: 0.695 }`。
3. **排檔、儀表、G-G 圖、聲浪與車庫規格條全連動**（[`js/input.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/input.js)、[`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js)、[`js/audio.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/audio.js)、[`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js)）：
   - 手排升降檔與方向盤換檔燈依車款動態匹配 5–8 檔及各自紅線轉速；G-G 圖依組別自動切換 2.2G / 3.2G / 5.5G 量程；引擎合成聲浪隨 `redlineRpm` 與 `pitchTone` 呈現低沉休旅、V12、三轉子及 F1 15,000 rpm 高頻嘶吼差異。
   - 全面更新 [`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js) 內全 33 台 `CAR_CATALOG` 之實車數據與 `0–100` 性能評分條。

### 2. 全套 10 項實機驗證結果（最後編輯後於 Chrome Headless 實測）
- `python scratch/check_syntax.py`：**8 / 8 OK**
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**44 / 44 PASSED**（GT3 提案規格與 `index.html` 啟動零回歸）
- `python scratch/verify_new_assets.py`：**100% PASSED**（Spa 基準：`procedural 138.139s` > `mclaren_senna 119.769s` > `porsche_919_evo 95.326s`）
- `python scratch/test_all_upgrades.py`：**100% PASSED**
- `python scratch/test_records_and_setup.py`：**100% PASSED**
- `python scratch/verify_all_cars_and_garage.py`：**100% PASSED**（全 29 台 `.glb` 載入、33 台分類車庫、`CLASS_PRO_MULT` Monza 基準 `117.757 > 103.751 > 92.857 > 77.813 > 72.107s`、防洗榜隔離通過）
- [`scratch/verify_vehicle_performance.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/scratch/verify_vehicle_performance.py)：**100% PASSED**（實測 12 台代表車：X-Trail `0-100 7.14s / Vmax 184.8 / Spa 193.92s`；GT3 458 `0-100 3.54s / Vmax 303.5 / DF@250 646kgf / LatG@250 1.91G / Spa 138.14s`；LaFerrari `Vmax 351.7 / 0-200 5.56s / LatG@250 1.57G`；Senna GTR `DF@250 1013kgf / Spa 119.77s`；919 Evo `0-100 2.00s / 0-300 7.72s / Vmax 369.3 / DF@250 2146kgf / Spa 95.33s`；SF-26 F1 `8速 14,684rpm / 0-200 4.32s / 0-300 8.10s / Vmax 364.2 / DF@250 2532kgf / LatG@250 4.68G / BrkG 4.67G / Monza 69.73s / Spa 93.03s`）
- [`launch_apex_desktop.bat`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/launch_apex_desktop.bat) `--check`：**13 / 13 HTTP 200 OK**


---

## 🛠️ 2026-11-27｜駕駛體驗重構與全車系個性化／路線差異化實作（Phase A–D）

### 1. 修改摘要與解決之根因
1. **Phase A：物理底層與輸入操控根因修復**（[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)、[`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js)）
   - **曲線坐標系 Frenet-Serret `(1 - k * d)` 弧長修正**：在 [`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js) `sampleTrackAtS` 新增局部分段幾何曲率 `frenetCurvature`，並在 `stepPhysics`（`ds`）與 `stepAIRivals`（`ai.s`）套用 `ds / (1 - k * d)`（夾限 `0.55..1.65`），消除外線入彎時賽道座標參考系提前過轉造成的錯覺。
   - **解除一刀切 `S` 鍵鎖死陷阱，區分 `ABS` 與「直線重煞 `S` ➔ 循跡入彎 `空白鍵`」**：依車種配賦 `absMode`（`motorsport_abs` / `street_abs` / `none`）；GT3 與賽道版 Hypercar 直線全踩 `S` 觸發高頻防鎖死調節（不再跌落 `12.8 m/s²` / `0.30x`），無 ABS 車款（F1、919 Evo、Furai、F40、Countach）具備 `0.94+` 直線門檻與轉向卸載鎖死機制（鎖死保留 `0.62` 側向餘裕），並將 `trailBlend` 峰值窗口擴展至 `75%` `空白鍵` 循跡煞車（`brk > 0.78` 才施加轉向擠壓折減 `heavyBrakeCircleMult`）。
   - **消除推頭僵化與轉向反應遲滯**：微調 `getDynamicMaxSteerDeg`（`80–180 km/h` 提升至 `18.3°–14.6°`）、將 `stepAnalogSteering` 反打加權提升至 `2.35x` 並放寬車速衰減、改用速度漸進式 `effUndersteerCoeff` 減輕中低速無謂推頭。
2. **Phase B：5 種底盤傳動性格與 4 種引擎扭矩曲線**（[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)）
   - 建立全 33 台車之 `CAR_CHASSIS_TRAITS_MAP`、`getCarChassisTraits` 與 `evalTorqueCurveMultiplier`：`gt3_flat`（GT3 線性基準）、`turbo_lag_classic`（F40/Zenvo 渦輪遲滯暴衝）、`na_screamer`（Countach/Huayra R/Essenza 萬轉高轉湧現）、`hybrid_instant`（F1/919/SF90 XX 油電瞬時扭力）。
   - 依 `layout`（`RR`/`MR`/`FMR`/`AWD`/`OPEN_WHEEL`/`SUV`）區分 `trailBrakeBonus`（911 RR 最強 `+19%`）與出彎重心推頭係數；`MR`/`OPEN_WHEEL` 於 `< 18%` 油門觸發平滑收油指向（`liftOffYawMult`）；無 TC 後驅（`tcMode === 'none'`）於 `32–118 km/h` 區間重腳全油轉向呈現可控動力滑移。
3. **Phase C：車種專屬最佳路線（`V-Line` vs `U-Line`）與即時 3D 導引線更新**（[`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js)、[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)、[`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js)）
   - 抽離 `computeDynamicOptimalLine(optSpec)` 依各車 `lineBias`（`0.00` GT3 標準外內外、`-0.35` F1/LMP1/SUV 高速大弧 `U-Line`、`+0.35/+0.85` 頂級超跑晚煞晚入彎 `V-Line`）即時解算最佳走線並連動 `getCornerLineCutFactor` 與 `generateProBenchmarkLap`。
   - 於 [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js) 實作 `refreshTacticalRibbonForCurrentCar()` 原位刷新 `tacticalRibbonMesh` 與 `rubberMesh` 頂點及顏色緩衝；於 [`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js) 車庫面板 `#lbl-gar-chassis-note` 標註驅動形式、ABS/TC、扭矩曲線與建議路線策略。
4. **Phase D：動態煞車點前瞻 HUD、緊湊重煞提示、廣角 FOV 與前饋音訊**（[`js/circuits.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/circuits.js)、[`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js)、[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)、[`js/audio.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/audio.js)）
   - 新增 `getLookaheadCornerTargetKmh(s, currSpeedKmh)`（前瞻距離依速度動態延展至 `40–270m`）供應 `#hud-corner-limit`；恢復 `#alert-brake-now` 緊湊紅色 `HEAVY BRAKE · 重踩煞車 (S ➔ 空白鍵入彎)` 提示膠囊；擴大速度動態 FOV（`58° + min(22, speed/310*20)`）；將 [`js/audio.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/audio.js) 漸進輪胎磨擦音訊門檻自 `0.72` 提前至 `0.64`。

### 2. 全數 11 項實機與回歸驗證結果（最終修改後一次連續通過）
- `python scratch/check_syntax.py`：**8 / 8 JS 檔案全數 OK**
- [`scratch/verify_driving_experience.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/scratch/verify_driving_experience.py)：**100% PASSED**（Spa 極限髮夾彎 Frenet 世界位移比 `out=1.0021 / in=0.9961`；GT3 `290->90 km/h` 全煞 `137.1m / locked=false`；F1 90% 直煞無鎖死、100% 帶轉鎖死；911 `空白鍵 75% 2.088G` > `S 100% 1.475G` > `無煞車 1.749G` 且循跡增益高於 Aventador AWD；150 km/h 換向時間 `amggt3=0.46s / ferrari458=0.46s / f1=0.34s`；F40 `75 km/h` 動力甩尾 `drift=0.1361 rad / oversteer=true` 而 `AMG 75` 及 `F1 220` 保持穩定；LaFerrari 收油轉向率 `0.547 > 0.497`；F1 U-Line 與 LaFerrari V-Line 路線最大差異 `4.972m` 並即時更新 3D 導引帶頂點 `3.079m`；Monza `310 km/h` 前瞻速限 `115 km/h`、HUD `'heavy'` 膠囊正常顯示、`320 km/h FOV = 78.52°`、車庫風格標籤完整）
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**44 / 44 PASSED**（含完整 `index.html` 啟動無報錯）
- `python scratch/verify_new_assets.py`：**100% PASSED**
- `python scratch/test_all_upgrades.py`：**100% PASSED**
- `python scratch/test_records_and_setup.py`：**100% PASSED**
- `python scratch/verify_all_cars_and_garage.py`：**100% PASSED**（全數 29 個本地車款 GLB / 33 台車、分類車庫與 5 級排行榜）
- [`scratch/verify_vehicle_performance.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/scratch/verify_vehicle_performance.py)：**100% PASSED**（全數 12 台代表車實車性能階層維持完整：SF-26 F1 `0-100 2.14s / 0-200 4.28s / 0-300 8.18s / Vmax 364.2`、919 Evo `0-300 7.82s / Spa 94.86s`、GT3 458 `Spa 138.14s`、X-Trail `0-100 7.1s / Spa 193.02s`）
- [`launch_apex_desktop.bat`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/launch_apex_desktop.bat) `--check`：**13 / 13 HTTP 200 OK**


---

## 🌐 2026-11-28｜本機／區網多人對戰系統實作（零依賴 Python WebSocket ＋ 雙入口大廳）

### 1. 架構與實作內容
1. **零依賴純 Python 3.12 WebSocket 伺服器與 LAN 主機整合**（[`apex_mp_server.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/apex_mp_server.py)、[`apex_desktop_app.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/apex_desktop_app.py)、[`launch_apex_lan_host.bat`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/launch_apex_lan_host.bat)）
   - 以 Python 標準庫 `asyncio` 實作 RFC 6455 WebSocket 伺服器，免安裝任何第三方套件（支援 HTTP Upgrade、Mask 解碼、Fragmentation、Ping/Pong 心跳及最多 8 人多房間管理）。
   - **同時支援「快速配對」與「6 碼私人房間代碼＋公開房大廳」**：`quick_match` 依組別（`carClass`）與物理版自動配對同級等候中房間；`create_room` / `join_room` 產生 6 碼不混淆房號讓好友直接加入；`list_rooms` 顯示所有等待中之公開房。
   - 擴充 [`apex_desktop_app.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/apex_desktop_app.py) 支援 `--lan` 旗標（綁定 `0.0.0.0` 並透過 `GET /__mp_info.json` 提供自動 WS 連接埠探索），另增 [`launch_apex_lan_host.bat`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/launch_apex_lan_host.bat) 讓同 Wi-Fi / 區網玩家開網頁即可連線。
2. **前端多人引擎與遠端 3D 實車同步**（[`js/net.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/net.js)、[`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js)）
   - [`js/net.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/net.js) 實作 `window.apexNet`：自動連線探索、RTT 與伺服器時鐘校正、`setPlayerName` 單分頁名稱覆寫、20 Hz `(s, d, heading, speed)` 賽道曲線座標廣播、90ms 環狀緩衝圓周內插、`<= 120ms` 邊界外推與可選「柔和橫向排斥 / 幽靈無碰撞」模式。
   - [`js/render.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/render.js) 新增 `createRemotePeerVehicleMesh`、`disposeRemotePeerVehicleMesh` 及 `multiplayer` 模式 3D 車頂即時名牌與尾燈同步。
3. **發車燈同步、HUD／小地圖與大廳／待機室 UI**（[`js/physics.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/physics.js)、[`js/main.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/main.js)、[`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js)、[`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html)）
   - 主頁新增「🌐 區網多人」按鈕與 `#scr-multiplayer`（支援一鍵快速配對、建立 6 碼房間、輸入代碼加入、公開房列表、即時換車／烤漆、準備檢查與房主開賽）。
   - 起跑紅燈依 `raceStartServerMs` 與伺服時鐘同步熄燈（錯位排位 `_gridBaseS` 避免誤判偷跑），競賽時保留尾流偵測、即時名次差距 `updateMultiplayerHUD`、雷達偵測、小地圖光點及多人完賽結算榜。

### 2. 全數驗證結果（最後一次編輯後連貫通過）
- `python scratch/check_syntax.py`：**9 / 9 JS 檔案全數 OK**（含 [`js/net.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/net.js)）
- `python apex_mp_server.py --check`：**OK**（RFC 6455 握手與 `welcome` 封包通過）
- [`scratch/verify_multiplayer.py`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/scratch/verify_multiplayer.py)：**100% PASSED**
  - Part A：3 客戶端配對驗證（GT3 自動同房、F1 自動隔離、`list_rooms`、6 碼私人房、統一 `raceStartServerMs`、20 Hz `peer_state` 轉發與 `finish` 排名）。
  - Part B：雙 Chrome Headless `index.html` 端對端實跑——Host (`HOST-RAY`) 與 Peer (`PEER-KEN`) 經 6 碼房號連線、同步起跑並在賽道實時推進（Host 渲染 `PEER-KEN @ s=187.1m`、Peer 渲染 `HOST-RAY @ s=250.4m`、HUD 即時顯示 `P1 / 2` 與 `P2 / 2`）。
- `python scratch/test_physics_math.py`：**26 PASSED, 0 FAILED**
- `python scratch/test_rfc_improvements.py`：**38 PASSED, 0 FAILED**
- `python scratch/test_proposal.py`：**44 / 44 PASSED**（`index.html` 啟動無報錯 `177559 chars`）
- `python scratch/verify_driving_experience.py`：**100% PASSED**
- `python scratch/verify_vehicle_performance.py`：**100% PASSED**
- [`launch_apex_desktop.bat`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/launch_apex_desktop.bat) `--check`：**14 / 14 HTTP 200 OK**（含 `/__mp_info.json`）

### [2026-11-28] LAN Multiplayer UX Fixes & High-Detail Opponent `.glb` Support
- **Driver Name Persistence & Copyable URLs (`index.html`, `js/net.js`, `js/flow.js`)**:
  - Added CSS `user-select: text !important` on `input, textarea, .af-copyable`.
  - Fixed `pong` heartbeat full-DOM re-render resetting `#input-mp-name` (`notifyListeners('ping')` skipped by full-DOM lobby renderer; live `input` sync + `#btn-mp-apply-name` button + badge-only update).
  - Added one-click Copy buttons (`#btn-mp-copy-game-url`, `#btn-mp-copy-ws-url`, `#btn-mp-copy-code`, `#btn-mp-copy-room-url`) with `document.execCommand('copy')` fallback for non-HTTPS `http://<LAN-IP>` origins and LAN URL generation via `/__mp_info.json`.
- **High-Detail Opponent `.glb` Rendering (`apex_mp_server.py`, `js/net.js`, `js/render.js`)**:
  - Added `livery` metadata synchronization between host/peers.
  - Raised hardware GPU non-player triangle cap (`350,000 -> 1,250,000`), enabled `carAssetState.template` reuse for matching presets, preserved factory liveries (`peerLivery !== 'team'`), and disabled `castShadow` on non-player meshes `> 180k` tris while retaining procedural fallback for software WebGL.
- **Verification (All Passed)**:
  - `python scratch/check_syntax.py` (9/9 JS OK)
  - `python apex_mp_server.py --check` (`OK`, `port=53724`)
  - `python scratch/verify_multiplayer.py` (Part A protocol + Part B dual headless Chrome E2E passed, including >3s heartbeat name persistence, `user-select: text`, copy buttons, `peerLivery` slot check, 6-char room code sync)
  - `python scratch/test_rfc_improvements.py` (`38 PASSED, 0 FAILED`)
  - `python scratch/test_proposal.py` (`ALL PROPOSAL TESTS PASSED: 44/44`)
  - `python scratch/verify_all_cars_and_garage.py` (all 29 `.glb` / 33 cars & 5-class physics/garage/leaderboard verified)
  - `.\launch_apex_desktop.bat --check` (`APEX DESKTOP SERVER SELF-CHECK PASSED 100%!`)

### [2026-11-28] 79-Car Garage Expansion (+46 New GLBs), 7-Class Hierarchy Refinement & FF Physics
- **7-Class Roster & Reclassifications (`js/circuits.js`, `js/records.js`, `index.html`, `js/physics.js`, `js/render.js`, `js/flow.js`)**:
  - Replaced `amg_one` GLB with `new_mercedes-amg_project_one.glb` and `ferrari_laferrari` GLB with `new_ferrari_laferrari.glb` (preserving original physics).
  - Imported all **46** additional local `.glb` vehicles in `assets/models/cars/` calibrated to real-world specs -> expanded roster from 33 to **79 total cars** (**75 local GLBs** + 4 builtin GT3s).
  - Refined the class structure from 5 to **7 fair competitive classes** with sub-tier filters (`GARAGE_CLASS_META`):
    - `SPORT` (`7` cars: `daily`, `hothatch`, `muscle`; relocated `nissan_xtrail` from `STREET`)
    - `STREET` (`11` cars: `classic`, `supercar`)
    - `GT3` (`14` cars: `eu`, `jp`, `us`; strict FIA GT3 BoP)
    - `HYPER` (`18` cars: `hybrid`, `vmax`; relocated `amg_one` from `LMP1`)
    - `TRACK` (`10` cars: `modern`, `gt1`; separated 7 track hypercars from `HYPER` + added Bolide / Zonda R / F1 GTR Longtail)
    - `LMP1` (`12` cars: `wec`, `vision`)
    - `F1` (`7` cars: `modern`, `classic`)
- **Authentic Physics & Visual Normalization (`js/physics.js`, `js/render.js`)**:
  - Added `FF` (Front-Wheel Drive) drivetrain handling for `honda_civic_type_r` (lift-off/trail-brake rotation `0.13`, throttle understeer weight transfer `0.135`) and UI label/tip in `js/flow.js`.
  - Audited all 46 new GLBs in headless Chrome; applied `extraRotY: Math.PI` on 15 backward-facing models (including `mclaren_f1`), `hideNodeRegex: /^Object_(2|23|32)$/i` on `mclaren_f1` to strip studio backdrop planes, token-aware material role matching in `classifyHiFiMaterials` (`rim` / `paint_` collision fix for `Rimac_Nevera` & `Bugatti_Chiron`), high-mesh non-player shadow guard (`meshes <= 300`), and dynamic sub-group AI matching (`syncAIMultiCarModels`).
- **Verification (All Exited 0)**:
  - `python scratch/check_syntax.py` (9/9 JS OK)
  - `python scratch/verify_all_cars_and_garage.py` (75/75 local GLBs & 79/79 catalog cars, 7-class garage UI/sub-filters, Monza PRO pace order `SPORT 136.95 > STREET 117.76 > GT3 103.75 > HYPER 94.41 > TRACK 88.71 > LMP1 77.81 > F1 72.11`, AI sub-tier matching, `FF` layout & 7-class leaderboard isolation)
  - `python scratch/verify_vehicle_performance.py` (`ALL REAL-WORLD VEHICLE PERFORMANCE GAPS ACROSS 5 CLASSES VERIFIED 100%!`)
  - `python scratch/verify_driving_experience.py` (all driving & chassis personality checks passed)
  - `python scratch/test_proposal.py` (`44/44`)
  - `python scratch/test_rfc_improvements.py` (`38 PASSED, 0 FAILED`)
  - `python scratch/verify_multiplayer.py` (Part A + Part B dual-Chrome E2E passed)
  - `.\launch_apex_desktop.bat --check` (`APEX DESKTOP SERVER SELF-CHECK PASSED 100%!`)

### [2026-11-28] 10-Class PI Rating System (PI 366-995) & Multi-Dimensional Strength Profiles
- **Physics-Benchmarked PI & 10 Tight Classes (`js/physics.js`, `js/circuits.js`, `js/records.js`, `js/render.js`)**:
  - Assigned empirical **PI (366–995)** from Monza/Spa/Suzuka benchmark laps to all **79** cars via `PI_CLASS_BANDS` & `CAR_PI_AND_CLASS_TABLE`, splitting them into **10 balanced classes**:
    `D` (4, PI <=480), `C` (8, PI 481-550), `B` (7, PI 551-630), `GT3` (14, PI 600-610), `A` (11, PI 631-680), `S` (7, PI 681-710), `R` (10, PI 711-780), `LMH` (7, PI 781-840), `X` (4, PI 841-955), `F1` (7, PI 956-999).
  - Kept all vehicle physics parameters unchanged; updated `syncAIMultiCarModels` to match closest-PI opponents (`subGroup` tiebreak) within the player's class.
- **Anti-Oversimplification Strength / Trade-Off / Track Badges (`js/physics.js`, `js/flow.js`, `index.html`)**:
  - Implemented `getCarPerformanceProfile(carId)` computing relative deltas vs class medians to surface 1-2 `strengthTags` (`極速霸主`, `狂暴加速`, `彈射起步`, `高空力下壓`, `彎道極限`, `重煞制動`, `極致輕量`), a `tradeoffTag` (e.g. `重車需早煞`, `直線尾速偏低`, `無 ABS/TC 考驗技術`, `前驅重油易推頭`), and `bestTrackType` (Technical vs High-Speed vs All-Round).
  - Rendered `.af-pi-badge` and `.af-strength-chip` on every `.af-car-card`, `#gar-perf-profile` in the Garage detail sidebar, strength-aware search filtering, PI-ascending card sorting, and 10-class pills across Records (`#rec-class-pills`) & Multiplayer.
- **Verification (All Exited 0)**:
  - `python scratch/check_syntax.py` (9/9 OK)
  - `python scratch/verify_all_cars_and_garage.py` (75/75 GLBs, 79/79 cars, 10-class counts/PI spreads/strength differentiation & 10-class pace hierarchy + anti-pollution leaderboard isolation)
  - `python scratch/verify_vehicle_performance.py`, `python scratch/verify_driving_experience.py`, `python scratch/test_proposal.py` (`44/44`), `python scratch/test_rfc_improvements.py` (`38/38`), `python scratch/verify_multiplayer.py` (Part A + Part B E2E), `.\launch_apex_desktop.bat --check`

### [2026-11-28] Fix GitHub Pages / HTTPS Static-Host WebSocket URL & Mixed-Content Error Handling
- **Root Cause**:
  1. Opening the game on GitHub Pages (`https://raymond-luo-code.github.io/Apex-pro-racing/`) has no `/__mp_info.json` and no Python WebSocket server (`apex_mp_server.py`) on `raymond-luo-code.github.io:8766`, yet `resolveDefaultWsUrl()` fell back to `ws://${window.location.hostname}:8766`.
  2. Calling `new WebSocket('ws://raymond-luo-code.github.io:8766')` from an `https://` page throws `DOMException: SecurityError` (Mixed Content), which `connect()` mislabeled as `'WebSocket 位址格式無效：...'`.
- **Fix (`js/net.js`, `js/flow.js`, `scratch/verify_multiplayer.html`)**:
  - Added `isLoopbackHost`, `isStaticHostingDomain`, `normalizeWsUrl`, `validateWsUrlForPage`, and `computeDefaultWsUrl` in [`js/net.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/net.js). On static hosts / non-loopback `https://` without `/__mp_info.json`, default WS falls back to `ws://127.0.0.1:8766` (loopback exempt from Mixed Content), honors `?ws=wss://...` query overrides, discards stale saved static-host URLs, and reports explicit `STATIC_HOST` / `MIXED_CONTENT` guidance instead of bogus syntax errors.
  - Updated [`js/flow.js`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/js/flow.js) (`getShareableGameUrl`, `#btn-mp-use-local-ws`, `#input-mp-ws-url` Enter-to-connect, and static-host connection guide banner) to explain LAN host vs `wss://` tunnel usage and propagate `?ws=` in share links.
  - Added GitHub Pages / HTTPS / Mixed Content unit & E2E assertions in [`scratch/verify_multiplayer.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/scratch/verify_multiplayer.html).
- **Verification**:
  - `python scratch/check_syntax.py` (9/9 JS OK)
  - `python scratch/verify_multiplayer.py` (Part A protocol + Part B dual-Chrome E2E + static-host/Mixed-Content checks all PASSED)
