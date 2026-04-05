/* ============================================================
   深色模式切換 (theme.js)
   使用 Bootstrap 5.3 data-bs-theme 屬性
   ============================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "rubik-theme";
  const DARK = "dark";
  const LIGHT = "light";

  /**
   * 取得使用者偏好主題。
   * 優先 localStorage，其次系統偏好。
   */
  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === DARK || stored === LIGHT) {
      return stored;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? DARK
      : LIGHT;
  }

  /** 套用主題至 <html> 元素 */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
    updateToggleIcon(theme);
  }

  /** 更新切換按鈕圖示 */
  function updateToggleIcon(theme) {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (!icon) return;
    if (theme === DARK) {
      icon.className = "bi bi-sun-fill";
      btn.setAttribute("aria-label", "切換至淺色模式");
    } else {
      icon.className = "bi bi-moon-fill";
      btn.setAttribute("aria-label", "切換至深色模式");
    }
  }

  /** 切換主題 */
  function toggleTheme() {
    const current =
      document.documentElement.getAttribute("data-bs-theme") || LIGHT;
    const next = current === DARK ? LIGHT : DARK;
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  /* --- 初始化 --- */
  // 在 DOM 載入前就先套用（避免閃爍）
  applyTheme(getPreferredTheme());

  document.addEventListener("DOMContentLoaded", function () {
    // 更新圖示（DOM 就緒後）
    updateToggleIcon(getPreferredTheme());

    // 綁定切換按鈕
    const btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      btn.addEventListener("click", toggleTheme);
    }

    // 監聽系統主題變化
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function (e) {
        if (!localStorage.getItem(STORAGE_KEY)) {
          applyTheme(e.matches ? DARK : LIGHT);
        }
      });
  });
})();
