/* ============================================================
   多語言切換框架 (i18n.js)
   使用 data-i18n 屬性標記可翻譯元素
   ============================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "rubik-lang";
  const DEFAULT_LANG = "zh-TW";
  const SUPPORTED_LANGS = ["zh-TW", "en"];

  /** 語系快取，避免重複載入 */
  const cache = {};

  /* ---- 內嵌語系資料（file:// 環境下 fetch/XHR 皆無法載入外部 JSON）---- */
  const EMBEDDED_LOCALES = {
    "zh-TW": {"nav":{"home":"首頁","tutorial":"教學","algorithms":"公式表","timer":"計時器","about":"關於"},"hero":{"title":"3×3 魔術方塊教學","subtitle":"從零開始，七步學會！","cta":"開始學習","description":"最完整的繁體中文魔術方塊新手教學，搭配互動 3D 模型，輕鬆掌握層先法。"},"features":{"title":"網站功能","tutorial":{"title":"層先法教學","desc":"七個步驟，從白色十字到完整還原，每步搭配 3D 動畫演示。"},"algorithms":{"title":"公式速查表","desc":"所有常用公式一目瞭然，點擊即可在 3D 方塊上演示。"},"timer":{"title":"速解計時器","desc":"WCA 標準打亂公式，自動統計 ao5、ao12，追蹤你的進步。"}},"faq":{"title":"常見問題","q1":{"q":"完全沒碰過魔術方塊，可以學會嗎？","a":"當然可以！本站的層先法教學專為零基礎設計，一步一步帶你理解每個動作的原因，搭配 3D 互動方塊讓學習更直覺。"},"q2":{"q":"學會層先法大概需要多久？","a":"依個人的練習頻率而定，大多數人在 1-3 天內就能學會完整還原，之後透過反覆練習可以提升速度。"},"q3":{"q":"什麼是 R、U、F 這些符號？","a":"這是魔術方塊的國際通用標記法：R（右面）、U（上面）、F（前面）、L（左面）、D（下面）、B（後面）。加上撇號（'）表示逆時針轉 90°，數字 2 表示旋轉 180°。"},"q4":{"q":"這個網站可以離線使用嗎？","a":"目前此功能尚在開發中，未來版本將支援 PWA 離線使用。請先確保有網路連線。"},"q5":{"q":"計時器的打亂公式是隨機的嗎？","a":"是的，我們的計時器使用 WCA（世界魔術方塊協會）標準的隨機打亂演算法產生公式。"}},"tutorial":{"title":"層先法教學","subtitle":"七步完整還原 3×3 魔術方塊","notation":{"title":"符號說明","desc":"在開始之前，先認識魔術方塊的旋轉符號："},"step1":{"title":"第一步：白色十字","goal":"目標：在白色面上拼出十字，且邊塊側面顏色與中心塊一致。","desc":"將白色面朝上，找到四個白色邊塊，逐一移到正確位置。這一步主要靠觀察與直覺，沒有固定公式。","tips":"提示：先找到白色邊塊在哪裡，再思考如何用最少步驟移動到白色面上。"},"step2":{"title":"第二步：白色角塊","goal":"目標：完成整個白色面（第一層）。","desc":"將四個白色角塊插入正確位置。將白色面轉到底部，找到含白色的角塊放到目標位置上方。","algo":"R U R' U'（重複 1-5 次直到角塊歸位）"},"step3":{"title":"第三步：中層邊塊","goal":"目標：完成前兩層（F2L）。","desc":"將中層的四個邊塊歸位。找到頂層中沒有黃色的邊塊，對齊後插入。","algo_right":"U R U' R' U' F' U F（邊塊向右插入）","algo_left":"U' L' U L U F U' F'（邊塊向左插入）"},"step4":{"title":"第四步：黃色十字","goal":"目標：在黃色面上拼出十字形狀。","desc":"此步驟只需讓黃色邊塊朝上，不需要側面對齊。觀察頂面黃色邊塊的形狀（點、L形、一字）。","algo":"F R U R' U' F'"},"step5":{"title":"第五步：黃色面完成","goal":"目標：整個黃色面全部朝上。","desc":"讓所有黃色面的角塊也朝上。觀察黃色角塊朝向，選擇正確的起始位置。","algo":"R U R' U R U2 R'"},"step6":{"title":"第六步：頂層角塊歸位","goal":"目標：將頂層四個角塊移到正確位置（顏色可能還沒對齊）。","desc":"找到一個角塊已經在正確位置（不管方向），將它放在右前方，執行公式。","algo":"U R U' L' U R' U' L"},"step7":{"title":"第七步：頂層邊塊歸位","goal":"目標：完成！將最後的邊塊移到正確位置。","desc":"觀察需要移動的邊塊方向，選擇順時針或逆時針公式。","algo_cw":"R U' R U R U R U' R' U' R2（順時針三邊換）","algo_ccw":"R2 U R U R' U' R' U' R' U R'（逆時針三邊換）","congrats":"恭喜你完成了！🎉 持續練習，你的速度會越來越快！"},"controls":{"play":"播放","pause":"暫停","prev":"上一步","next":"下一步","reset":"重置","speed":"速度"}},"algorithms":{"title":"公式速查表","subtitle":"常用魔術方塊公式整理","search":"搜尋公式…","categories":{"all":"全部","pll":"PLL","oll":"OLL","f2l":"F2L"},"play_btn":"演示","no_results":"找不到符合的公式"},"timer":{"title":"速解計時器","subtitle":"WCA 標準打亂，追蹤你的成績","scramble":"打亂公式","new_scramble":"新打亂","instruction":"按空白鍵或點擊計時器開始 / 停止","ready":"準備中…","stats":{"title":"統計","solves":"總次數","best":"最佳","worst":"最差","ao5":"ao5","ao12":"ao12","avg":"平均"},"history":{"title":"歷史紀錄","no":"#","time":"時間","scramble":"打亂","clear":"清除紀錄","empty":"尚無紀錄"}},"about":{"title":"關於本站","desc":"這是一個專為繁體中文使用者打造的 3×3 魔術方塊教學網站。我們的目標是讓每個人都能輕鬆學會還原魔術方塊。","features_title":"特色功能","features":["互動式 3D 魔術方塊模型","層先法（LBL）完整七步驟教學","公式速查表，支援 3D 演示","WCA 標準速解計時器","深色模式與多語言支援"],"tech_title":"技術架構","tech":"本站使用 HTML5、CSS3（Bootstrap 5.3）、JavaScript（Three.js）開發，部署於 GitHub Pages，完全開源。","contact_title":"聯絡我們","contact":"如有建議或問題，歡迎透過 GitHub Issues 反映。","license":"本站內容以 Apache License 2.0 授權釋出。"},"footer":{"copyright":"© 2026 魔術方塊教學。以 Apache License 2.0 授權。","github":"GitHub"},"notation":{"R":"右面順時針","R_prime":"右面逆時針","L":"左面順時針","L_prime":"左面逆時針","U":"上面順時針","U_prime":"上面逆時針","D":"下面順時針","D_prime":"下面逆時針","F":"前面順時針","F_prime":"前面逆時針","B":"後面順時針","B_prime":"後面逆時針"}},
    "en": {"nav":{"home":"Home","tutorial":"Tutorial","algorithms":"Algorithms","timer":"Timer","about":"About"},"hero":{"title":"3×3 Rubik's Cube Tutorial","subtitle":"Learn to solve it in 7 steps!","cta":"Start Learning","description":"The most comprehensive beginner-friendly Rubik's Cube tutorial in Traditional Chinese, featuring an interactive 3D model and the Layer-by-Layer method."},"features":{"title":"Features","tutorial":{"title":"Layer-by-Layer Tutorial","desc":"Seven steps from the white cross to a complete solve, each with 3D animation."},"algorithms":{"title":"Algorithm Cheat Sheet","desc":"All commonly used algorithms at a glance — click to watch 3D demos."},"timer":{"title":"Speedsolve Timer","desc":"WCA-standard scrambles with automatic ao5 & ao12 stats to track your progress."}},"faq":{"title":"FAQ","q1":{"q":"I've never touched a Rubik's Cube. Can I still learn?","a":"Absolutely! Our Layer-by-Layer tutorial is designed for complete beginners."},"q2":{"q":"How long does it take to learn the LBL method?","a":"Most people can learn to solve the cube in 1-3 days with regular practice."},"q3":{"q":"What do R, U, F and other letters mean?","a":"These are standard Rubik's Cube notations: R (Right), U (Up), F (Front), L (Left), D (Down), B (Back)."},"q4":{"q":"Can I use this site offline?","a":"Offline support is currently under development."},"q5":{"q":"Are the scrambles truly random?","a":"Yes, our timer uses the WCA standard random scramble algorithm."}},"tutorial":{"title":"Layer-by-Layer Tutorial","subtitle":"Solve a 3×3 Rubik's Cube in 7 Steps","controls":{"play":"Play","pause":"Pause","prev":"Previous","next":"Next","reset":"Reset","speed":"Speed"}},"algorithms":{"title":"Algorithm Cheat Sheet","subtitle":"Commonly used Rubik's Cube algorithms","search":"Search algorithms…","categories":{"all":"All"},"play_btn":"Demo","no_results":"No algorithms found"},"timer":{"title":"Speedsolve Timer","subtitle":"WCA-standard scrambles — track your times","scramble":"Scramble","new_scramble":"New Scramble","instruction":"Press Space or tap the timer to start / stop","ready":"Ready…","stats":{"title":"Statistics","solves":"Solves","best":"Best","worst":"Worst","ao5":"ao5","ao12":"ao12","avg":"Average"},"history":{"title":"History","no":"#","time":"Time","scramble":"Scramble","clear":"Clear History","empty":"No solves yet"}},"about":{"title":"About","desc":"A 3×3 Rubik's Cube tutorial site built for Traditional Chinese speakers.","features_title":"Features","tech_title":"Tech Stack","contact_title":"Contact","license":"Content is licensed under the Apache License 2.0."},"footer":{"copyright":"© 2026 Rubik's Cube Tutorial. Licensed under Apache License 2.0.","github":"GitHub"},"notation":{"R":"Right clockwise","R_prime":"Right counterclockwise","L":"Left clockwise","L_prime":"Left counterclockwise","U":"Up clockwise","U_prime":"Up counterclockwise","D":"Down clockwise","D_prime":"Down counterclockwise","F":"Front clockwise","F_prime":"Front counterclockwise","B":"Back clockwise","B_prime":"Back counterclockwise"}}
  };

  /** 取得使用者偏好語言 */
  function getPreferredLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) {
      return stored;
    }
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang && browserLang.startsWith("zh")) {
      return "zh-TW";
    }
    if (browserLang && browserLang.startsWith("en")) {
      return "en";
    }
    return DEFAULT_LANG;
  }

  /**
   * 載入語系 JSON 檔案。
   * 在 file:// 下 fetch/XHR 都被 Chrome CORS 封鎖，故內嵌預設語系。
   * @param {string} lang - 語言代碼
   * @returns {Promise<Object>} 翻譯字典
   */
  async function loadLocale(lang) {
    if (cache[lang]) return cache[lang];

    // 優先嘗試從網路載入（HTTP/HTTPS 環境）
    if (window.location.protocol !== "file:") {
      try {
        const res = await fetch(`locales/${lang}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        cache[lang] = data;
        return data;
      } catch (err) {
        console.warn(`[i18n] 網路載入失敗，使用內嵌語系 ${lang}:`, err);
      }
    }

    // file:// 或網路載入失敗時使用內嵌語系
    if (EMBEDDED_LOCALES[lang]) {
      cache[lang] = EMBEDDED_LOCALES[lang];
      return EMBEDDED_LOCALES[lang];
    }
    return {};
  }

  /**
   * 套用翻譯至所有標記元素。
   * @param {Object} dict - 翻譯字典
   */
  function applyTranslations(dict) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      const value = getNestedValue(dict, key);
      if (value !== undefined) {
        el.textContent = value;
      }
    });
    // 處理 placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-placeholder");
      const value = getNestedValue(dict, key);
      if (value !== undefined) {
        el.setAttribute("placeholder", value);
      }
    });
    // 處理 aria-label
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-aria");
      const value = getNestedValue(dict, key);
      if (value !== undefined) {
        el.setAttribute("aria-label", value);
      }
    });
  }

  /**
   * 支援巢狀 key 存取（如 "nav.home"）。
   * @param {Object} obj
   * @param {string} path
   */
  function getNestedValue(obj, path) {
    return path.split(".").reduce(function (acc, part) {
      return acc && acc[part];
    }, obj);
  }

  /**
   * 切換語言。
   * @param {string} lang - 目標語言代碼
   */
  async function switchLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute("lang", lang);
    const dict = await loadLocale(lang);
    applyTranslations(dict);
    updateLangToggle(lang);
  }

  /** 更新語言切換按鈕狀態 */
  function updateLangToggle(lang) {
    document.querySelectorAll("[data-lang-switch]").forEach(function (btn) {
      const target = btn.getAttribute("data-lang-switch");
      btn.classList.toggle("active", target === lang);
    });
    const singleBtn = document.getElementById("lang-toggle-btn");
    if (singleBtn) {
      singleBtn.textContent = lang === "zh-TW" ? "EN" : "中";
      singleBtn.setAttribute(
        "data-lang-switch",
        lang === "zh-TW" ? "en" : "zh-TW"
      );
    }
  }

  /* --- 初始化 --- */
  document.addEventListener("DOMContentLoaded", async function () {
    const lang = getPreferredLang();
    document.documentElement.setAttribute("lang", lang);
    const dict = await loadLocale(lang);
    applyTranslations(dict);
    updateLangToggle(lang);

    // 綁定語言切換按鈕
    document.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-lang-switch]");
      if (btn) {
        e.preventDefault();
        const target = btn.getAttribute("data-lang-switch");
        switchLang(target);
      }
    });
  });

  // 匯出至全域（供其他模組使用）
  window.RubikI18n = {
    switchLang: switchLang,
    getPreferredLang: getPreferredLang,
    loadLocale: loadLocale,
  };
})();
