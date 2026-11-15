# APEX PRO RACING — 介面美化、真實賽道/名車擴充與車輛分級實作計畫書

> **文件性質**：獨立架構與視覺擴充計畫書（待確認模型資產導入方式與設計細節後開始分階段實作）  
> **核心目標**：全面升級 **UI 按鍵與儀表質感**、**3D 賽道與天穹景觀**、**車體建模與塗裝表現**，並引入 **真實世界賽道（Monza 擬真升級、Spa-Francorchamps 等）** 與 **跨等級名車（Aston Martin Vulcan、Porsche 919 Hybrid Evo 等）**，讓「賽車分級制度」真正具備物理差距、配對意義與分組排行榜價值。

---

## 一、 外部 3D 模型（Sketchfab）導入與資產處理策略

為配合目前專案的靜態前端與 GitHub Pages 部署架構（[assets/models/README.md](assets/models/README.md)、[js/render.js](js/render.js)），Sketchfab 模型的最穩定整合策略如下：

### 1.1 由玩家下載 vs AI 直接下載？
* **建議由您於 Sketchfab 下載後放入本機專案 `assets/models/` 資料夾**：
  1. Sketchfab 下載需登入帳號、同意模型授權（CC-BY 等）與觸發時效性下載權杖；本系統不進行繞過登入或防爬蟲驗證的操作。
  2. 直接將 `.glb` 納入專案 `assets/models/` 並使用相對路徑載入，可徹底消除外部網址失效或 CORS 跨域阻擋問題，載入速度與穩定性遠勝第三方圖床。

### 1.2 「賽車模型」規格建議與直接套用方式
您只需下載 **`.glb`（Single Binary glTF）格式** 並放入指定資料夾（例如 `assets/models/cars/aston_vulcan.glb`、`assets/models/cars/porsche_919_evo.glb`）：
* **單檔效能紅線（確保網頁端 60 FPS 流暢）**：
  * **檔案大小**：建議 **3 MB ～ 15 MB**（極限不超過 `25 MB`；可選用 Draco 壓縮版本，[js/render.js](js/render.js) 的 `createGLTFLoader()` 已內建 `DRACOLoader` 與 `MeshoptDecoder`）。
  * **幾何面數**：建議 **50,000 ～ 200,000 Triangles** 以內，避免在手機或筆電瀏覽器載入時卡頓。
* **自動對接管線**：
  * 本系統現有的 `normalizeVehicleScene()` 與 `rigHiFiWheels()`（[js/render.js](js/render.js#L1530-L1762)）已能自動剝離模型內附地板/陰影平面、校準車頭朝向 `+X`、等比縮放車長、自動分類車漆/玻璃/輪圈材質，並綁定 **4 顆獨立轉向與滾動車輪骨骼**。
  * 若特定 Sketchfab 模型的輪胎命名不規則（導致無法自動偵測 `4/4` 輪子），您在放入 `.glb` 後，我會直接讀取該模型的節點結構並補齊對應的骨骼匹配規則與材質調整（同時支援保留原廠塗裝貼圖 `livery: 'original'` 與玩家自訂烤漆切換）。

### 1.3 「賽道模型」的混合套用原則（Hybrid Track Pipeline）
* **為什麼不建議把整個 Sketchfab 賽道 `.glb` 直接當成物理路面？**
  1. 遊戲內的物理引擎、Out-In-Out 最佳路線求解（`generateProBenchmarkLap`）、AI 攻防避讓與 16 個防作弊檢查點全建立在一維賽道曲線座標系 `(s, d)`（[js/circuits.js](js/circuits.js)）。
  2. 整座賽道的 Sketchfab `.glb` 動輒 `80～200 MB`，且缺少 `(s, d)` 曲率與抓地力邊界索引，直接套用會使 AI 無法辨識彎道與護欄、記憶體過載或閃退。
* **最佳混合解決方案**：
  1. **路面與地形軌跡**：依據真實衛星平面與高度輪廓重繪 `CIRCUITS[].points`（例如精確還原 **Monza 雙 Chicane** 與 **Spa 的 Eau Rouge 大上坡**），維持我們高解析度的 PBR 柏油路面、動態煞車膠痕與精準碰撞護欄。
  2. **經典地標與建築道具（可選）**：若您找到輕量化的賽道建築/看台/龍門地標 `.glb`（例如 `assets/models/props/spa_grandstand.glb`，建議 `< 5 MB`），我們可將其掛載於指定 `(s, d)` 座標旁作為專屬 3D 風景，兼顧寫實地標與極速流暢度。

---

## 二、 賽車分級制度設計（Vehicle Class Tier System）

為讓 **Aston Martin Vulcan**、**Porsche 919 Hybrid Evo** 等不同等級車輛「各司其職」且不破壞既有平衡，將在 [js/physics.js](js/physics.js)（`CAR_HANDLING_PROFILES`）、[js/circuits.js](js/circuits.js)（`generateProBenchmarkLap`）與 [js/flow.js](js/flow.js)（`CAR_CATALOG`、個人紀錄鍵值）導入真正的 **跨級距動態與配對系統**：

| 車輛級距 (Class) | 代表車款 | 物理特性定位 | 預估極速 / 過彎極限 |
| :--- | :--- | :--- | :--- |
| **CLASS GT3** | • BMW M4 GT3 EVO<br>• Ferrari 458 Italia GT3<br>• Porsche 911 GT3 R (992)<br>• Mercedes-AMG GT3 EVO | 基準 FIA GT3 統規組。均衡機械抓地力與中等空力下壓力，適合輪對輪纏鬥與技術手感培養。 | `305–312 km/h`<br>橫向極限 `~1.75–1.85 G` |
| **CLASS HYPER / TRACK** | • **Aston Martin Vulcan AMR Pro**（新增）<br>•（可擴充麥拉倫 Senna GTR / 法拉利 FXX-K） | 7.0L V12 極致賽道怪獸！820 HP 暴力直道加速、巨型雙層尾翼產生大幅度高下壓力，但車頭長且煞車熱負荷極高。 | `325–332 km/h`<br>橫向極限 `~2.10 G` |
| **CLASS JDM / TA** | • **Nissan GT-R NISMO GT500 / Time Attack**（新增） | 東洋四驅大渦輪改裝戰神！極高出彎瞬間扭力與中低速推進力，但車重較沉，重煞距離需提前掌握。 | `315 km/h`<br>超高低轉加速推力 |
| **CLASS LMP1-EVO** | • **Porsche 919 Hybrid Evo**（新增） | 破紀錄級利曼混合動力原型車！超輕量（`~888 kg`）＋電能四驅瞬間爆發＋地面效應誇張下壓力，高速彎幾乎不必減速，提供頂尖極限速度體驗。 | `365+ km/h`<br>橫向極限 `~2.8–3.2 G` |

### 分級聯動機制（核心改進）
1. **分級專屬 PRO 基準與幽靈車（Dynamic Class Benchmark）**：
   - `generateProBenchmarkLap()` 不再僅用固定 GT3 數據計算 `PRO_LAP_TIME`，而是依據玩家所選車輛的 `classId`（加速、煞車、空力下壓力倍率），即時算出該級距對應的 **PRO 官方單圈基準與 Ghost 幽靈車**。
2. **AI 錦標賽同級距自動編組（Class-Matched Grid）**：
   - 玩家選擇 `CLASS HYPER` 或 `CLASS LMP1-EVO` 進入 AI 錦標賽時，AI 對手會自動切換至同級距車款/性能基準（並保有 3 種車手駕駛風格），確保不同等級車輛下場時始終勢均力敵，不會出現「開 919 Evo 輾壓 GT3 AI」的空洞感。
3. **分級獨立個人紀錄（Per-Class PB）**：
   - 個人最佳單圈改為以 `circuitId_edition_classId` 分開保存，各級距互不洗榜。

---

## 三、 真實賽道擴充與地景 Biome 系統

在 [js/circuits.js](js/circuits.js) 與 [js/render.js](js/render.js) 重構賽道環境系統，保留並升級既有賽道、新增多條世界名門賽道（預計擴充至 **5～6 條**）：

1. **🇮🇹 蒙札國家賽車場（Autodromo Nazionale Monza — 擬真升級版）**：
   - 修正現有過於平滑的舊版曲線，導入更還原真實 Monza 的佈局精華：**起終點長直線 ➔ T1–T2 Prima Variante 重煞減速彎 ➔ Curva Grande 雙APEX高速弧彎 ➔ Variante della Roggia 組合彎 ➔ 雙 Lesmo 直角彎 ➔ Serraglio 直道 ➔ Ascari 高速左-右-左連續 S 彎 ➔ 經典長半徑拋物線 Parabolica**。
2. **🇧🇪 斯帕-弗朗科爾尚賽道（Circuit de Spa-Francorchamps — 全新登場）**：
   - 全長 `~7.0 km`，涵蓋賽車史上最經典的高低落差配置：
     - **La Source 髮夾彎 ➔ 下坡衝向世界知名 Eau Rouge / Raidillon 超高爬坡大 S 彎（落差劇烈且考驗高速下壓力）➔ Kemmel 長直線尾流對決區 ➔ Les Combes 減速彎 ➔ Pouhon 雙頂點高速下坡左彎 ➔ Blanchimont 全油門高速左彎 ➔ Bus Stop 終點前重煞減速彎**。
   - 地景設定為 `biome: 'spa_forest'`（阿爾登森林濃霧、陡峭山坡森林、紅白經典路肩與看台）。
3. **🇯🇵 富士國際賽車場 GP（Fuji Speedway — 保留並優化細節）**：保留黃金夕陽與富士山標誌性背景，優化髮夾護欄與光影。
4. **🇯🇵 箱根午夜山道（Hakone Midnight Touge — 保留並優化霓虹夜戰）**：維持劇烈起伏五連髮夾，強化夜間護欄反光與發光龍門。

---

## 四、 遊戲介面、按鍵與畫面全面美化方案

### 4.1 遊戲按鍵與介面（UI / HUD）美化 — [index.html](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/index.html) & [js/flow.js](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/flow.js)
* **電競級選單按鈕系統（`.af-btn` / `.af-dev-btn`）**：
  - 增加 1px 頂部鏡面高光邊、懸停斜向流光動畫（Sheen sweep）、點擊壓縮彈性陰影；不同級距車輛卡片對應專屬金屬徽章色系（GT3 焰橘、HYPER 紫金、LMP1-EVO 電光冰藍）。
* **手機/觸控按鍵全面重製（`#mobile-gamepad-overlay` / `.touch-btn`）**：
  - **油門與煞車踏板**：改為防滑止滑紋理 + CNC 鑽孔鋁合金踏板質感，按下時觸發邊框高亮度霓虹發光與垂直下沉動畫。
  - **方向按鈕**：外圈加上轉向刻度弧線與觸壓光環回饋。
  - **排檔 / 甩尾 / NOS 按鈕**：改用方向盤多功能換檔撥片及撥桿造型。
* **賽道卡片即時 SVG 俯瞰縮圖（`renderSetupStep(3)`）**：
  - 由每條賽道的 `points` 自動生成高對比向量路線圖（標註起終點與主要重煞點），視覺呈現賽道曲線特徵與分級紀錄。
* **MoTeC 儀表與車庫介面**：
  - 選單背景加入碳纖維細紋與動態光暈層次；HUD 轉速紅線達標時增添儀表外框動態脈衝視覺回饋。

### 4.2 3D 賽道與畫面升級 — [js/render.js](file:///c:/Users/raymo/OneDrive/%E6%A1%8C%E9%9D%A2/apex-pro-racing/js/render.js)
* **真實賽道競技設施**：
  - `s = 0` 起跑線新增 **兩排錯位發車格白線（Starting Grid Boxes）** 與 **黑白方格終點線貼圖**。
  - 彎道外側鋪設連續 **Armco 鋼板護欄**，重煞彎外側補上紅白藍 FIA **TecPro 緩衝牆**，大幅提升行車速度感與近距貼牆張力。
  - 升級 `gateDistances` 跨道龍門架，套用 `APEX PRO // SECTOR` Canvas 高解析看板與夜間霓虹光條。
* **動態漸層天穹（Procedural SkyDome）**：
  - 取代單色 `scene.background`，用球頂著色器實現正午晴空散射、日落暮霞、高山薄霧與午夜星辰漸層天空。
* **地景 Biome 系統**：
  - 解除原本全場統一生成富士山的寫死配置，依 `theme.biome` 切換 **阿爾登森林與高低坡地（Spa）**、**義大利公園森林（Monza）**、**富士山（Fuji）**、**海港大樓與水面（街道賽）** 等對應景觀。

### 4.3 賽車視覺升級與塗裝自訂（不含多餘特效）
> **依您的指示明確排除**：**不加入、刪除**「煞車碟盤熱紅光效（Brake Disc Thermal Glow）」，因為實際追尾與座艙視角下玩家根本看不到車輪內側碟盤，把效能與幾何預算集中於從車尾、斜後方與展示間清晰可見的部位。

* **玩家可見角度的車體精緻化（`buildProceduralBody` & GLB 補件）**：
  - 當使用離線/程序化備援車型或額外空力車款（如 `Vulcan` 大雙層尾翼、`919 Evo` 封閉原型車身＋車頂垂直鯊魚鰭）時，改用流線型斜切幾何組裝車身線條、車尾碳纖維擴散器鰭片與多層次 LED 尾燈導光條。
* **塗裝（Livery）系統擴充**：
  - 於車庫新增 **拉花樣式切換**：`原廠廠隊塗裝` / `自訂雙色金屬烤漆` / `雙道賽車條紋（Racing Stripes）` / `電競幾何分割塗裝`。
* **AI 場上多樣化車型**：
  - 3 位 AI 車手（`#7`、`#14`、`#23`）可對應顯示同級距中不同車款與獨立烤漆/尾翼造型，提升賽事同場競技臨場感。

---

## 五、 建議分階段實作與自動化驗證流程

1. **Phase 1：介面、按鍵與車輛分級核心架構**
   - 美化全站按鍵、觸控金屬踏板組、HUD、賽道 SVG 縮圖與分級卡片；建立 4 大車輛分級物理與同級距 AI / Ghost 配對邏輯。
2. **Phase 2：3D 賽道畫面升級與真實賽道導入（Monza 升級 + Spa + 街道賽）**
   - 實作 SkyDome 天穹、Start Grid 方格線、Armco 護欄、Biome 專屬地景與新賽道座標/高低差建模，確認 `generateProBenchmarkLap()` 自動收斂出合理單圈。
3. **Phase 3：Sketchfab 實車 `.glb` 匯入對接（Vulcan / 919 Evo 等）＋ 塗裝/AI 多樣化**
   - 將您下載好的 `.glb` 模型掛載進 `assets/models/cars/`，逐一確認四輪轉向/滾動骨骼、方向對齊與材質質感，完成塗裝拉花與 AI 車型多樣化。
4. **全程回歸測試門檻**：
   - 每階段皆重跑 `check_syntax.py`、`test_proposal.py`（44 項 V8 測試）、`test_physics_math.py`（26 項）與 `test_rfc_improvements.py`（38 項），確保 100% 通過不退步。
