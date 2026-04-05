/* ============================================================
   教學頁面控制器 (tutorial.js)
   互動旋轉符號說明 + 組合公式演示
   ============================================================ */

(function () {
  "use strict";

  var cube = null;
  var userSpeed = 0.8;
  var demoPlaying = false;

  document.addEventListener("DOMContentLoaded", function () {
    /* 3D 方塊 */
    var container = document.getElementById("tutorial-cube");
    if (container && typeof window.RubiksCube !== "undefined") {
      try {
        cube = new window.RubiksCube(container, {
          interactive: true,
          bgColor: null,
        });
        cube.setSpeed(userSpeed);
      } catch (err) {
        console.warn("[tutorial] 3D 方塊初始化失敗:", err);
        container.innerHTML =
          '<div class="d-flex align-items-center justify-content-center h-100 text-body-secondary">' +
          '<div class="text-center"><i class="bi bi-box fs-1 d-block mb-2"></i>' +
          "<p>3D 模型載入失敗<br>請確認瀏覽器支援 WebGL</p></div></div>";
      }
    }

    /* 重置 */
    var resetBtn = document.getElementById("ctrl-reset");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (cube) cube.reset();
        demoPlaying = false;
        setStatus("");
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

      /* 符號格點擊 → 單步旋轉 */
      var demoItem = e.target.closest(".notation-demo-item[data-move]");
      if (demoItem && cube) {
        var move = demoItem.getAttribute("data-move");
        demoItem.classList.add("active");
        setStatus("▶ " + move, "text-primary");
        cube.rotate(move);
        setTimeout(function () {
          demoItem.classList.remove("active");
        }, 600);
        return;
      }

      /* move-notation 標記點擊 */
      var moveEl = e.target.closest(".move-notation[data-move]");
      if (moveEl && cube) {
        cube.rotate(moveEl.getAttribute("data-move"));
        return;
      }

      /* 組合演示按鈕 */
      var playBtn = e.target.closest("[data-play-demo]");
      if (playBtn && cube) {
        var seq = playBtn.getAttribute("data-play-demo");
        demoPlaying = true;
        cube.reset();
        setStatus("▶ 播放 " + seq + "…", "text-success fw-bold");
        cube.setSpeed(userSpeed);
        cube.playSequence(seq).then(function () {
          demoPlaying = false;
          setStatus("✓ 完成", "text-body-secondary");
          setTimeout(function () {
            setStatus("");
          }, 2000);
        });
        return;
      }
    });
  });

  function setStatus(text, cls) {
    var el = document.getElementById("demo-status");
    if (!el) return;
    el.textContent = text;
    el.className = "demo-status " + (cls || "");
  }
})();
