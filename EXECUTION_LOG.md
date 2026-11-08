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


