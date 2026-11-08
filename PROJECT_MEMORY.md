# 🧠 APEX PRO RACING // 專案記憶與架構全書 (Project Memory & Architecture Dossier)

> **建立時間**：2026-11-08  
> **專案版本**：v2.2 (Modular Clean Architecture & Anti-Freeze Engine)  
> **專案倉庫**：[Raymond-luo-code/Apex-pro-racing](https://github.com/Raymond-luo-code/Apex-pro-racing)  
> **線上即玩 (GitHub Pages)**：[https://raymond-luo-code.github.io/Apex-pro-racing/](https://raymond-luo-code.github.io/Apex-pro-racing/)  
> **主要開發語言與技術棧**：HTML5 / Vanilla JavaScript (ES6+ 7 領域模組化) / Three.js (r128) / 原生 Web Audio API / CSS3 (Tailwind CSS 3.4 CDN + 自研無依賴內聯樣式系統)

---

## 📌 一、專案哲學與核心鐵律 (Core Philosophy & Cardinal Rules)

### 1. 用戶最高鐵律：**「本地先改、確認才推」**
- **嚴格守則**：所有程式碼的修改（功能新增、Bug 修復、樣式調整）**必須 100% 先在本地環境進行與測試**。
- **嚴禁自動 Push**：任何時刻皆不得在未經用戶明確指示（例如「請推送」、「推送至 GitHub」、「可以 push」）前自行執行 `git push`。
- **推進節奏**：修改 ➔ 本地檢查／語法平衡確認 ➔ 請用戶本地瀏覽器驗證 ➔ 用戶確認滿意並要求推送 ➔ 執行 Commit & Push。

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
| **本地已就緒** | 2026-11-08 | **7 大領域模組切分、徹底根除 0% 載入卡死、開場自主選裝置與 GT3 真實賽車物理重構**：<br>1. **程式區塊模組化**：徹底告別 8,185 行的龐大單體程式，依據單一職責切分出 `audio.js`、`circuits.js`、`render.js`、`physics.js`、`input.js`、`flow.js`、`main.js` 7 個獨立模組，大幅提升除錯效率與長期維護性。<br>2. **徹底根除 STARTING ENGINE 0% 卡死問題**：<br>   - 重構 Early Bootstrapper：玩家一按「PRESS START ➔」，進度條立即以平滑緩動非線性推進 (5% ➔ 88%)，提供即時視覺回饋，決不原地凍結在 0%。<br>   - 自動銜接主引擎：一旦主模組加載就緒，進度條自動瞬拉至 100% 進入車庫主頁。<br>   - 雙重看門狗計時器 (Watchdog Timer)：若任何網路 CDN 或資產加載延遲超過 2.2 秒，看門狗自動強制關閉載入黑屏並開啟車庫主頁，達成 0% 卡死物理性免疫。<br>   - 修復 `dismissSplashScreen` 提早清除標記與條件誤判的 Return Bug。<br>3. **開場自主選擇操控裝置 (PC 鍵盤 / 手機觸控)**：封面提供切換大按鈕，預設智慧判定但交由玩家自主決定。<br>4. **真實賽車轉向物理重構 (Milliken Understeer Gradient)**：告別誇張的叉車式轉彎，導入真實 GT3 轉向角與轉向不足梯度 $\kappa(v) = \frac{\tan \delta}{L(1 + K_{us} v^2)}$，低速轉向靈敏逼真 (迴轉半徑 ~6m)，高速轉向穩定。<br>5. **推頭外拋警告精準化**：僅在超速入彎且前輪抓地力嚴重飽和時觸發，正常巡航不再頻繁誤報。<br>6. **遙測覆盤圖表 (MoTeC Modal) 圖層穿透修復**：將圖表視窗提升至 `z-[90]`，完賽結算第 2、3 頁皆可一鍵展開觀看。<br>7. **計時賽完賽結算修復**：修正里程累積提早取模問題，衝線後立即閃現 FINISH 旗標並無縫載入三頁連貫式結果報告。<br>8. **多車型差異化物理操控設定檔 (`CAR_HANDLING_PROFILES`)**：專屬軸距、機械轉向角極限、轉向不足係數與抓地力標定。<br>9. **入彎煞車引導 3D 距離牌 (150m/100m/50m)**：蒙札、富士、箱根全面佈建高對比 FIA 反光倒數標誌。 |

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
