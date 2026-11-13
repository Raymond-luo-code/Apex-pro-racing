# 🧠 APEX PRO RACING // 專案記憶與架構全書 (Project Memory & Architecture Dossier)

> **建立時間**：2026-11-08  
> **專案版本**：v2.2 (Modular Clean Architecture & Anti-Freeze Engine)  
> **專案倉庫**：[Raymond-luo-code/Apex-pro-racing](https://github.com/Raymond-luo-code/Apex-pro-racing)  
> **線上即玩 (GitHub Pages)**：[https://raymond-luo-code.github.io/Apex-pro-racing/](https://raymond-luo-code.github.io/Apex-pro-racing/)  
> **主要開發語言與技術棧**：HTML5 / Vanilla JavaScript (ES6+ 7 領域模組化) / Three.js (r128) / 原生 Web Audio API / CSS3 (Tailwind CSS 3.4 CDN + 自研無依賴內聯樣式系統)

---

## 📌 一、專案哲學與核心鐵律 (Core Philosophy & Cardinal Rules)

### 1. 核心開發與交付流程：**「程式待確認後推送，日誌文件直接推送」**
- **用戶授權守則 (2026-11-13 精確更新)**：
  1. **遊戲程式部分**（`index.html`、`js/*`、`assets/*` 等所有可執行代碼）：**必須待用戶確認後才能推送**，嚴格遵守「本地先改、測試無誤、確認才推」。
  2. **日誌與文檔部分**（[`EXECUTION_LOG.md`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/EXECUTION_LOG.md)、`PROJECT_MEMORY.md`、`*.md` 等）：**完成任務後直接 Commit & Push 推送**，無須詢問用戶，專供自我除錯與覆盤追蹤之用。
- **推進節奏**：本地開發 ➔ 測試與語法校驗 ➔ 更新執行日誌 (直接推送文檔) ➔ 呈報程式變更待用戶確認 ➔ 獲准後推送程式。

### 2. 模組化無構建純粹架構 (Zero-Build Modular Browser Architecture)
- **單一 HTML 入口**：根目錄 [`index.html`](file:///c:/Users/raymo/OneDrive/桌面/apex-pro-racing/index.html) 精簡至 ~2,000 行（純 UI DOM 與樣式），透過 `<script src="js/...">` 循序載入 7 個領域職責模組。
- **零構建工具**：不依賴 Node.js 打包器（無 Webpack、Vite、Rollup 等），雙擊 `index.html` 或以任何靜態伺服器託管即可 60 FPS 瞬開。
- **零音效外部檔依賴**：引擎聲浪、輪胎嘯叫、排氣回火、路緣石跳動全部透過瀏覽器原生 **Web Audio API** 振盪器與白噪聲動態即時物理合成。
- **零資產缺失崩潰機制**：內建程序化幾何賽車（Procedural GT3 Prototype）與程序化柏油路面，即使完全斷網也能離線全功能遊玩。

---

## 🏛️ 二、模組化架構劃分 (`js/` 7 大領域模組)

| 模組檔案 | 大小 / 行數 | 職責與封裝內容 |
| :--- | :--- | :--- |
| **`js/audio.js`** | 140 行 (5.9 KB) | **程序化音效合成引擎 (`soundEngine`)**：Web Audio API 上下文、引擎轉速物理諧波振盪器、輪胎邊際滑移嘯叫、排氣管爆震回火聲、FIA 倒數嗶聲、動態音效解鎖。 |
| **`js/circuits.js`** | 487 行 (22.6 KB) | **3D 樣條賽道幾何與基準遙測**：三大賽道定義 (`CIRCUITS`)、樣條取樣 (`sampleTrackAtS`)、路面高程坡度曲率計算、FIA 3D 入彎倒數牌 (150m/100m/50m)、PRO 專家基準單圈遙測 (`PRO_LAP_TIME`)、單圈時間字串格式化 (`formatLapTime`)。 |
| **`js/render.js`** | 2,152 行 (96.3 KB) | **Three.js 3D 渲染與視覺特效管線**：場景 (`scene`)、相機 (`camera`)、WebGLRenderer、程序化 PBR 柏油貼圖生成器、賽道幾何網格重建、GLTF/GLB Draco 載入器、程序化 GT3 賽車幾何、輪胎轉向與滾動骨架綁定、接觸面投影、胎痕與輪胎白煙粒子、`update3DSceneAndVisualFX`、4 段視角切換 (`cycleCamera`)。 |
| **`js/physics.js`** | 904 行 (39.0 KB) | **雙版本車輛動力學與 AI 賽車系統**：多車型動態設定檔 (`CAR_HANDLING_PROFILES`)、真實賽車 Milliken 轉向不足梯度 $\kappa(v) = \frac{\tan \delta}{L(1 + K_{us} v^2)}$、輪胎牽引力圓與滑移角、變速箱六檔齒比與倒車 R 檔、單步物理模擬 (`stepPhysics`)、4 車 AI 錦標賽對手動態 (`stepAIRivals`)、車輛脫困回正 (`recoverToTrackCenter`)。 |
| **`js/input.js`** | 555 行 (22.7 KB) | **全方位輸入控制器**：鍵盤監聽 (WASD / 方向鍵 / Shift / 空白鍵 / ESC / R)、手機虛擬搖桿與觸控按鍵 (方向/油門/煞車/微煞/甩尾/氮氣)、手機陀螺儀體感傾斜轉向控制器 (`gyroState`)、雙向設備切換與判定 (`detectClientDevice`, `applyDeviceProfile`, `setInputMode`)。 |
| **`js/flow.js`** | 1,220 行 (55.1 KB) | **近代狂野飆車風格生命週期控制器**：車輛型錄 (`CAR_CATALOG`)、最佳紀錄儲存 (`personalRecords`)、主頁展示車庫 (`#scr-home`)、車庫規格賞車 (`#scr-garage`)、4 步驟出賽精靈 (`#scr-setup`)、防凍結過場加載 (`#scr-loading` + 看門狗計時器)、醒目暫停選單 (`#scr-pause`)、三頁連貫式完賽結算 (`#scr-results`)、3D 車輛射線拾取拖曳賞車。 |
| **`js/main.js`** | 864 行 (39.4 KB) | **HUD、遙測覆盤與主循環**：HUD 數據更新 (`updateHUD`, `updateAIRaceHUD`)、MoTeC 賽車工程師遙測覆盤對比圖表視窗 (`openTelemetryModal`)、設定抽屜事件綁定、60 FPS 主模擬循環 (`animate`) 與安全引導開機常駐程序。 |

---

## 📦 三、歷次重要版本與 Commit 里程碑

| 版本 / Commit | 發布日期 | 核心改進內容與解決痛點 |
| :--- | :--- | :--- |
| **`98cbccb`** | 2026-11-07 | **GitHub Pages 初始建置**：初始化 Git 倉庫、開源網頁部署上線。 |
| **`76352af`** | 2026-11-07 | **3D 模型整合與光影校準**：修正 GLB 模型倒著開、整車單色材質問題、Canvas 軟質接觸陰影、DRACOLoader CDN。 |
| **`9ff1849`** | 2026-11-07 | **初階首頁與 3D 展示環顧**：消除一進網頁直接 3-2-1 倒數的混亂體驗、手勢點擊優雅解鎖 Web Audio 播放限制。 |
| **`f0431e6`** | 2026-11-08 | **近代狂野飆車風格全生命週期與車庫系統**：開場視覺封面、主頁車庫展示中心、四步驟出賽精靈、三頁連貫式完賽結算。 |
| **`d9b9e15`** | 2026-11-08 | **7 大領域模組切分、開場自主選裝置、Milliken 賽車物理與 MoTeC 遙測修復**。 |
| **`14bbfba`** | 2026-11-09 | **真實 GLB 跑車模型、5 節點懸吊/煞車卡鉗綁定、清漆層材質與 WebP 貼圖修復**：導入 4 款高精度 GLB 賽車模型、修復 Three.js WebP 外掛相容性。 |
| **`a8749e0`** | 2026-11-10 | **RFC 核心物理與模擬系統重大重構 (Module 1, 2, 3)**：<br>1. **Module 1: 360° 車輛鑑賞模式 (Inspect Mode) 與相機防翻轉約束**：<br>   - 修復相機水平旋轉至後方時因強制設定 `camera.rotation.z = 0` 導致的萬向節死鎖與上下顛倒翻轉問題，確保 $360^\circ$ 全方位與 $15^\circ \sim 85^\circ$ 俯仰角 100% 垂直穩定。<br>   - 點擊車體或點擊「🔍 360° 鑑賞」平滑聚焦車身質心，支援滾輪雙指 $3.5\text{m} \sim 8.0\text{m}$ 安全推拉。<br>   - 進入鑑賞時自動切換專屬影棚深色圓頂、地面柔和接觸陰影與專屬 Key/Rim 聚光燈，隔離背景雜訊。<br>2. **Module 2: 路面物理反饋重構（徹底移除畫面抖動）**：<br>   - 徹底移除直接注入相機投影矩陣的隨機噪聲位移向量（`jx`, `jy`），駕駛視野絕對平穩。<br>   - 壓路緣石時改為透過 $y = A e^{-\gamma t} \cos(\omega t)$ 計算底盤懸吊局部阻尼簡諧振盪，驅動車體局部垂直形變。<br>   - 草地與緩衝區滾動阻力放大 3 倍，大腳油門自然打滑失控而非畫面亂晃。<br>   - 路緣石 35~50 Hz 低頻三角波合成器 + HTML5 Gamepad API 實體手把雙重震動回饋。<br>3. **Module 3: 依序檢查點防作弊與自然倒車邏輯**：<br>   - 移除刻意的倒車速度限制與鎖定，倒車與轉向操駕 100% 自然真實。<br>   - 賽道劃分 16 個依序檢核點 ($CP_0 \dots CP_{15}$)，**只有當衝過終點線時已正向通過賽道所有中間檢查點 (1..15)，才計入圈速並進入完賽結算畫面**，徹底防堵倒車衝線與抄捷徑。 |

---

## 🎮 五、各畫面與模組互動架構

```
index.html (HTML + Tailwind UI)
 │
 ├── js/audio.js     (SoundEngine: 引擎/嘯叫/回火/倒數/路緣石)
 ├── js/circuits.js  (Circuits, Spline Track Sampling, FIA 3D Boards, Ghost Benchmarks)
 ├── js/render.js    (Three.js Scene, Track Meshes, GLTF & Procedural GT3 Car, VFX)
 ├── js/physics.js   (Handling Profiles, Milliken Steer, Drivetrain, Collision, AI)
 ├── js/input.js     (Keyboard, Touch Virtual Gamepad, Gyro Tilt Steering, Device Detection)
 ├── js/flow.js      (Asphalt Screen State Machine, Setup Wizard, Results, Raycaster, Watchdog)
 └── js/main.js      (HUD Telemetry Updater, MoTeC Modal, Settings Drawer, 60 FPS animate Loop)
```
