/* ============================================================
   解題頁面控制器 (solve.js)
   情境式教學：「建立情境」→ 觀察 →「執行解法」
   ============================================================ */

(function () {
  "use strict";

  var cube = null;
  var userSpeed = 0.8;
  var demoPlaying = false;

  document.addEventListener("DOMContentLoaded", function () {
    /* 3D 方塊 */
    var container = document.getElementById("solve-cube");
    if (container && typeof window.RubiksCube !== "undefined") {
      try {
        cube = new window.RubiksCube(container, {
          interactive: true,
          bgColor: null,
        });
        cube.setSpeed(userSpeed);
      } catch (err) {
        console.warn("[solve] 3D 方塊初始化失敗:", err);
        container.innerHTML =
          '<div class="d-flex align-items-center justify-content-center h-100 text-body-secondary">' +
          '<div class="text-center"><i class="bi bi-box fs-1 d-block mb-2"></i>' +
          "<p>3D 模型載入失敗<br>請確認瀏覽器支援 WebGL</p></div></div>";
      }
    }

    /* 步驟導航 */
    document.querySelectorAll("[data-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setActiveStep(parseInt(btn.getAttribute("data-step"), 10) - 1);
      });
    });

    /* 重置 */
    var resetBtn = document.getElementById("ctrl-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (cube) cube.reset();
        demoPlaying = false;
        setDemoStatus("");
        enableAllButtons(true);
      });
    }

    /* 速度 */
    var speedRange = document.getElementById("speed-range");
    if (speedRange) {
      speedRange.value = "0.8";
      document.getElementById("speed-label").textContent = "0.8x";
      speedRange.addEventListener("input", function () {
        userSpeed = parseFloat(speedRange.value);
        document.getElementById("speed-label").textContent =
          userSpeed.toFixed(1) + "x";
        if (cube && !demoPlaying) cube.setSpeed(userSpeed);
      });
    }

    /* 事件委派 */
    document.addEventListener("click", function (e) {
      if (demoPlaying) return;

      /* 單步符號點擊 */
      var moveEl = e.target.closest(".move-notation[data-move]");
      if (moveEl && cube) {
        cube.rotate(moveEl.getAttribute("data-move"));
        return;
      }

      /* 建立情境 */
      var setupBtn = e.target.closest("[data-setup-algo]");
      if (setupBtn && cube) {
        playSetup(
          setupBtn.getAttribute("data-setup-algo"),
          setupBtn.getAttribute("data-scenario") || "",
          setupBtn
        );
        return;
      }

      /* 執行解法 */
      var solveBtn = e.target.closest("[data-solve-algo]");
      if (solveBtn && cube) {
        playSolve(solveBtn.getAttribute("data-solve-algo"), solveBtn);
        return;
      }
    });

    setActiveStep(0);
  });

  /* ---------- 建立情境 ---------- */

  function playSetup(setup, desc, btn) {
    if (!cube || demoPlaying) return;
    demoPlaying = true;
    enableAllButtons(false);
    cube.reset();

    /* 步驟 3~7 需先翻轉方塊：黃色朝上 */
    var stepEl = btn.closest("[data-step-content]");
    var stepNum = stepEl
      ? parseInt(stepEl.getAttribute("data-step-content"), 10)
      : 1;
    var fullSetup = stepNum >= 3 ? "x2 " + setup : setup;

    setDemoStatus(
      "🔧 建立情境" + (desc ? "：" + desc : "…"),
      "text-warning"
    );

    cube.setSpeed(3);
    cube.playSequence(fullSetup).then(function () {
      cube.setSpeed(userSpeed);
      demoPlaying = false;
      setDemoStatus(
        "👀 觀察方塊 → 按「執行解法」看公式如何還原",
        "text-info"
      );
      enableAllButtons(false);
      var scenarioEl = btn.closest(".scenario-item");
      if (scenarioEl) {
        var solveBtn = scenarioEl.querySelector("[data-solve-algo]");
        if (solveBtn) solveBtn.disabled = false;
      }
      var resetBtn = document.getElementById("ctrl-reset");
      if (resetBtn) resetBtn.disabled = false;
    });
  }

  /* ---------- 執行解法 ---------- */

  function playSolve(algo, btn) {
    if (!cube || demoPlaying) return;
    demoPlaying = true;

    setDemoStatus("▶ 執行公式中…", "text-success fw-bold");
    cube.setSpeed(userSpeed);
    cube.playSequence(algo).then(function () {
      demoPlaying = false;
      setDemoStatus("✓ 完成！觀察方塊的變化", "text-body-secondary");
      enableAllButtons(true);
      setTimeout(function () {
        setDemoStatus("");
      }, 3000);
    });
  }

  /* ---------- 按鈕啟用/停用 ---------- */

  function enableAllButtons(enable) {
    document
      .querySelectorAll("[data-setup-algo], [data-solve-algo]")
      .forEach(function (btn) {
        btn.disabled = !enable;
      });
    if (enable) {
      document
        .querySelectorAll("[data-solve-algo]")
        .forEach(function (btn) {
          btn.disabled = true;
        });
    }
    var resetBtn = document.getElementById("ctrl-reset");
    if (resetBtn) resetBtn.disabled = false;
  }

  /* ---------- 狀態訊息 ---------- */

  function setDemoStatus(text, cls) {
    var el = document.getElementById("demo-status");
    if (!el) return;
    el.textContent = text;
    el.className = "demo-status " + (cls || "");
  }

  /* ---------- 步驟切換 ---------- */

  function setActiveStep(index) {
    document.querySelectorAll("[data-step]").forEach(function (btn, i) {
      btn.classList.toggle("active", i === index);
    });

    document.querySelectorAll(".step-content").forEach(function (el) {
      var n = parseInt(el.getAttribute("data-step-content"), 10) - 1;
      el.style.display = n === index ? "block" : "none";
    });

    var progress = document.getElementById("step-progress");
    if (progress) {
      progress.textContent =
        (index + 1) + " / " +
        document.querySelectorAll(".step-content").length;
    }

    if (cube) {
      try {
        cube.reset();
        cube.setSpeed(userSpeed);
        demoPlaying = false;
        setDemoStatus("");
        enableAllButtons(true);
      } catch (err) {
        /* ignore */
      }
    }
  }
})();
