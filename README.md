# 3×3 魔術方塊教學 🧊

一個專為**繁體中文使用者**打造的互動式 3×3 魔術方塊教學網站。  
使用 Three.js 3D 模型即時演示，搭配層先法（LBL）七步驟教學，讓零基礎的人也能輕鬆學會還原魔術方塊。

🌐 **線上網站**：[rubik.inc.tw](https://rubik.inc.tw/)

---

## 功能特色

- 🧩 **互動式 3D 魔術方塊** — 基於 Three.js，可旋轉、即時演示公式動畫
- 📖 **層先法七步驟教學** — 由淺入深，每步附口訣與情境練習
- 🔤 **符號教學** — 介紹方塊構造（中心/邊塊/角塊）及國際標準轉動符號
- 📋 **公式速查表** — 整理常用公式，點擊即可 3D 演示
- ⏱️ **WCA 標準速解計時器** — 隨機打亂、ao5/ao12 統計、本地儲存紀錄
- 🌙 **深色模式** — 一鍵切換明暗主題
- 🌏 **多語言支援** — 繁體中文 / English

## 頁面總覽

| 頁面 | 說明 |
|------|------|
| [首頁](https://rubik.inc.tw/) | 入口導覽、FAQ、階段概覽 |
| [符號教學](https://rubik.inc.tw/tutorial.html) | 方塊構造與轉動符號 |
| [層先法解題](https://rubik.inc.tw/solve.html) | 四階段七步驟完整教學 |
| [公式速查表](https://rubik.inc.tw/algorithms.html) | 常用公式一覽 + 3D 演示 |
| [計時器](https://rubik.inc.tw/timer.html) | WCA 標準打亂 & 計時統計 |
| [關於](https://rubik.inc.tw/about.html) | 專案資訊與技術架構 |

## 技術架構

| 類別 | 技術 |
|------|------|
| 前端框架 | Bootstrap 5.3.8 |
| 3D 引擎 | Three.js |
| 圖示 | Bootstrap Icons 1.11.3 |
| 字體 | Noto Sans TC (Google Fonts) |
| 部署 | GitHub Pages |
| SEO | JSON-LD 結構化資料、Open Graph、Sitemap |

## 專案結構

```
rubik/
├── index.html           # 首頁
├── tutorial.html        # 符號教學
├── solve.html           # 層先法解題教學
├── algorithms.html      # 公式速查表
├── timer.html           # 速解計時器
├── about.html           # 關於
├── css/
│   └── style.css        # 客製化樣式
├── js/
│   ├── cube.js          # 3D 方塊核心（渲染、旋轉、動畫）
│   ├── solve.js         # 解題步驟演示邏輯
│   ├── tutorial.js      # 符號教學互動
│   ├── algorithms.js    # 公式資料與演示
│   ├── timer.js         # 計時器、打亂產生、統計
│   ├── i18n.js          # 多語言切換
│   └── theme.js         # 深色模式切換
├── locales/
│   ├── zh-TW.json       # 繁體中文
│   └── en.json          # English
├── img/
│   └── favicon.svg      # 網站圖示
├── tools/
│   └── gen_iso_svg.py   # 等角投影 SVG 生成工具
├── CNAME                # GitHub Pages 自訂網域
├── robots.txt           # 爬蟲規則
├── sitemap.xml          # 網站地圖
└── LICENSE              # Apache License 2.0
```

## 本地開發

不需要任何建置工具，直接開 HTTP Server 即可：

```bash
cd rubik
python3 -m http.server 8080
```

瀏覽器開啟 http://localhost:8080

## 授權

本專案以 [Apache License 2.0](LICENSE) 授權釋出。

## 回饋與貢獻

歡迎透過 [GitHub Issues](https://github.com/raymond180/rubik/issues) 回報問題或提出建議。