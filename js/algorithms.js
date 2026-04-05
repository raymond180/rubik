/* ============================================================
   公式速查表互動 (algorithms.js)
   搜尋篩選、3D 演示、2D 情境圖示
   ============================================================ */

(function () {
  "use strict";

  /* ---------- 2D SVG 工廠 ---------- */

  /** 產生 3×3 面的 SVG（U 面俯視）。cells = 9 色碼陣列（左上→右下）。*/
  function faceSVG(cells, size) {
    size = size || 60;
    var s = '<svg viewBox="0 0 78 78" width="' + size + '" height="' + size + '">';
    var pos = [[3,3],[28,3],[53,3],[3,28],[28,28],[53,28],[3,53],[28,53],[53,53]];
    for (var i = 0; i < 9; i++) {
      var c = cells[i] || "#ddd";
      var extra = c === "#ddd" ? ' stroke="#999" stroke-width="2"' : ' stroke="#333"';
      s += '<rect x="' + pos[i][0] + '" y="' + pos[i][1] + '" width="22" height="22" rx="2" fill="' + c + '"' + extra + '/>';
    }
    s += "</svg>";
    return s;
  }

  var Y = "#ffd500", W = "#fff", G = "#009b48", R = "#b71234", O = "#ff5800", B = "#0046ad", X = "#ddd";

  /* ---------- 公式資料庫 ---------- */
  var ALGORITHMS = [
    // --- PLL ---
    {
      id: "pll-ua", name: "Ua Perm", category: "pll",
      moves: "R U' R U R U R U' R' U' R2",
      desc: "頂層邊塊順時針三換（UB 不動，UR→UF→UL→UR）",
      before: [X,Y,X, Y,Y,X, X,X,X],
      after:  [X,Y,X, Y,Y,Y, X,Y,X],
    },
    {
      id: "pll-ub", name: "Ub Perm", category: "pll",
      moves: "R2 U R U R' U' R' U' R' U R'",
      desc: "頂層邊塊逆時針三換（UB 不動，UL→UF→UR→UL）",
      before: [X,Y,X, X,Y,Y, X,X,X],
      after:  [X,Y,X, Y,Y,Y, X,Y,X],
    },
    {
      id: "pll-h", name: "H Perm", category: "pll",
      moves: "R2 U2 R U2 R2 U2 R2 U2 R U2 R2",
      desc: "頂層對邊互換（UF↔UB 交換 + UL↔UR 交換）",
      before: [X,X,X, X,Y,X, X,X,X],
      after:  [X,Y,X, Y,Y,Y, X,Y,X],
    },
    {
      id: "pll-z", name: "Z Perm", category: "pll",
      moves: "R' U' R U' R U R U' R' U R U R2 U' R'",
      desc: "頂層相鄰邊互換（UF↔UR 交換 + UL↔UB 交換）",
      before: [X,X,X, X,Y,X, X,X,X],
      after:  [X,Y,X, Y,Y,Y, X,Y,X],
    },
    {
      id: "pll-aa", name: "Aa Perm", category: "pll",
      moves: "R' F R' B2 R F' R' B2 R2",
      desc: "頂層角塊順時針三換（URB 不動，ULB→ULF→URF→ULB）",
      before: [X,Y,X, Y,Y,Y, X,Y,X],
      after:  [Y,Y,Y, Y,Y,Y, Y,Y,Y],
    },
    {
      id: "pll-ab", name: "Ab Perm", category: "pll",
      moves: "R2 B2 R F R' B2 R F' R",
      desc: "頂層角塊逆時針三換（URB 不動，URF→ULF→ULB→URF）",
      before: [X,Y,X, Y,Y,Y, X,Y,X],
      after:  [Y,Y,Y, Y,Y,Y, Y,Y,Y],
    },
    {
      id: "pll-t", name: "T Perm", category: "pll",
      moves: "R U R' U' R' F R2 U' R' U' R U R' F'",
      desc: "對角換＋對邊換（URF↔ULF 角交換 + UF↔UR 邊交換）",
      before: [X,Y,X, Y,Y,X, X,Y,X],
      after:  [Y,Y,Y, Y,Y,Y, Y,Y,Y],
    },
    {
      id: "pll-y", name: "Y Perm", category: "pll",
      moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
      desc: "斜角換＋斜邊換（URF↔ULB 對角交換 + UF↔UL 邊交換）",
      before: [X,Y,X, X,Y,Y, X,Y,X],
      after:  [Y,Y,Y, Y,Y,Y, Y,Y,Y],
    },

    // --- OLL ---
    {
      id: "oll-cross", name: "OLL 十字", category: "oll",
      moves: "F R U R' U' F'",
      desc: "翻轉 UF 和 UR 邊塊的頂面朝向（點→L→一字→十字）",
      before: [X,X,X, Y,Y,X, X,Y,X],
      after:  [X,Y,X, Y,Y,Y, X,Y,X],
    },
    {
      id: "oll-sune", name: "Sune", category: "oll",
      moves: "R U R' U R U2 R'",
      desc: "翻轉頂層 3 個角塊朝向（順時針翻：URF、UBR、UFL 角的黃色面轉到頂面）",
      before: [Y,Y,X, Y,Y,Y, X,Y,X],
      after:  [Y,Y,Y, Y,Y,Y, Y,Y,Y],
    },
    {
      id: "oll-antisune", name: "Anti-Sune", category: "oll",
      moves: "R U2 R' U' R U' R'",
      desc: "翻轉頂層 3 個角塊朝向（逆時針翻：URF、UBR、UFL 角的黃色面轉到頂面）",
      before: [X,Y,Y, Y,Y,Y, X,Y,X],
      after:  [Y,Y,Y, Y,Y,Y, Y,Y,Y],
    },
    {
      id: "oll-bowtie", name: "Bowtie", category: "oll",
      moves: "F' R U R' U' R' F R",
      desc: "蝴蝶結形 OLL（翻轉 ULF 和 URB 兩個對角角塊的朝向）",
      before: [X,Y,X, Y,Y,Y, X,Y,Y],
      after:  [Y,Y,Y, Y,Y,Y, Y,Y,Y],
    },
    {
      id: "oll-headlights", name: "Headlights", category: "oll",
      moves: "R2 D R' U2 R D' R' U2 R'",
      desc: "車頭燈形 OLL（翻轉 URF 和 UBR 兩個同面角塊的朝向）",
      before: [Y,Y,X, Y,Y,Y, Y,Y,X],
      after:  [Y,Y,Y, Y,Y,Y, Y,Y,Y],
    },

    // --- F2L ---
    {
      id: "f2l-basic", name: "F2L 基礎（右）", category: "f2l",
      moves: "U R U' R' U' F' U F",
      desc: "中層邊塊向右插入 FR 槽（U 先讓路→R 打開→歸位→F 夾入）",
      before: [G,G,X, G,G,X, G,G,G],
      after:  [G,G,G, G,G,G, G,G,G],
    },
    {
      id: "f2l-basic-l", name: "F2L 基礎（左）", category: "f2l",
      moves: "U' L' U L U F U' F'",
      desc: "中層邊塊向左插入 FL 槽（U' 讓路→L' 打開→歸位→F' 夾入）",
      before: [X,G,G, X,G,G, G,G,G],
      after:  [G,G,G, G,G,G, G,G,G],
    },
    {
      id: "f2l-corner", name: "白色角塊插入", category: "f2l",
      moves: "R U R' U'",
      desc: "第一層角塊基本插入（Sexy Move：把底層角塊翻入 UFR 位）",
      before: [W,W,X, W,W,W, W,W,W],
      after:  [W,W,W, W,W,W, W,W,W],
    },
    {
      id: "f2l-pair1", name: "F2L Case 1", category: "f2l",
      moves: "U R U' R'",
      desc: "角塊在頂層、邊塊在頂層（同向），配對後一起插入",
      before: [G,G,X, G,G,X, G,G,X],
      after:  [G,G,G, G,G,G, G,G,G],
    },
    {
      id: "f2l-pair2", name: "F2L Case 2", category: "f2l",
      moves: "R U R'",
      desc: "角塊在頂層、邊塊在正確槽但方向錯，拆出重配",
      before: [G,G,R, G,G,G, G,G,G],
      after:  [G,G,G, G,G,G, G,G,G],
    },
  ];

  var cube = null;
  var playing = false;

  /** 計算公式的逆序列 */
  function inverseSequence(seq) {
    return seq.trim().split(/\s+/).reverse().map(function (m) {
      if (m.endsWith("'")) return m.slice(0, -1);
      if (m.endsWith("2")) return m;
      return m + "'";
    }).join(" ");
  }

  /* ---------- 初始化 ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var container = document.getElementById("algo-cube");
    if (container && typeof RubiksCube !== "undefined") {
      cube = new RubiksCube(container, {
        interactive: true,
        bgColor: null,
      });
      window._algoCube = cube;
    }

    renderAlgorithms(ALGORITHMS);
    bindFilters();
    bindSearch();
    bindPlayButtons();
  });

  /** 渲染公式卡片 */
  function renderAlgorithms(list) {
    var grid = document.getElementById("algo-grid");
    if (!grid) return;

    if (list.length === 0) {
      grid.innerHTML =
        '<div class="col-12 text-center text-body-secondary py-5">' +
        '<i class="bi bi-search fs-1 d-block mb-2"></i>' +
        '<span data-i18n="algorithms.no_results">找不到符合的公式</span></div>';
      return;
    }

    var html = "";
    list.forEach(function (algo) {
      var diagramHtml = "";
      if (algo.before && algo.after) {
        diagramHtml =
          '<div class="before-after-diagram mb-2">' +
          '<div class="diagram-pair diagram-pair-sm">' +
          '<div class="diagram-box">' +
          '<div class="diagram-label">Before</div>' +
          faceSVG(algo.before, 50) +
          '</div>' +
          '<div class="diagram-arrow"><i class="bi bi-arrow-right"></i></div>' +
          '<div class="diagram-box">' +
          '<div class="diagram-label">After</div>' +
          faceSVG(algo.after, 50) +
          '</div>' +
          '</div></div>';
      }

      var setupMoves = inverseSequence(algo.moves);

      html +=
        '<div class="col-md-6 col-lg-4">' +
        '  <div class="card algorithm-card h-100">' +
        '    <div class="card-body">' +
        '      <div class="d-flex justify-content-between align-items-start mb-2">' +
        '        <h3 class="h6 fw-bold mb-0">' + escapeHtml(algo.name) + "</h3>" +
        '        <span class="badge bg-' + categoryColor(algo.category) + '">' + algo.category.toUpperCase() + "</span>" +
        "      </div>" +
        '      <p class="small text-body-secondary mb-2">' + escapeHtml(algo.desc) + "</p>" +
        diagramHtml +
        '      <p class="algo-moves mb-2">' + formatMoves(algo.moves) + "</p>" +
        '      <div class="d-flex flex-wrap gap-2">' +
        '        <button class="btn btn-sm btn-outline-primary" data-play-algo="' + escapeHtml(algo.moves) + '">' +
        '          <i class="bi bi-play-fill"></i> 演示' +
        "        </button>" +
        '        <button class="btn btn-sm btn-outline-warning" data-algo-setup="' + escapeHtml(setupMoves) + '">' +
        '          🔧 情境' +
        "        </button>" +
        '        <button class="btn btn-sm btn-outline-success" data-algo-solve="' + escapeHtml(algo.moves) + '" disabled>' +
        '          ▶ 解法' +
        "        </button>" +
        "      </div>" +
        "    </div>" +
        "  </div>" +
        "</div>";
    });
    grid.innerHTML = html;
  }

  function categoryColor(cat) {
    switch (cat) {
      case "pll": return "primary";
      case "oll": return "warning text-dark";
      case "f2l": return "success";
      default: return "secondary";
    }
  }

  function formatMoves(movesStr) {
    return movesStr
      .split(/\s+/)
      .map(function (m) {
        return '<span class="move-notation" data-move="' + escapeHtml(m) + '">' + escapeHtml(m) + "</span>";
      })
      .join(" ");
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function bindFilters() {
    document.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-filter]").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        applyFilter();
      });
    });
  }

  function bindSearch() {
    var input = document.getElementById("algo-search");
    if (input) {
      input.addEventListener("input", function () {
        applyFilter();
      });
    }
  }

  function applyFilter() {
    var activeBtn = document.querySelector("[data-filter].active");
    var category = activeBtn ? activeBtn.getAttribute("data-filter") : "all";
    var search = (document.getElementById("algo-search") || {}).value || "";
    search = search.toLowerCase().trim();

    var filtered = ALGORITHMS.filter(function (algo) {
      var matchCat = category === "all" || algo.category === category;
      var matchSearch =
        !search ||
        algo.name.toLowerCase().indexOf(search) !== -1 ||
        algo.desc.toLowerCase().indexOf(search) !== -1 ||
        algo.moves.toLowerCase().indexOf(search) !== -1;
      return matchCat && matchSearch;
    });

    renderAlgorithms(filtered);
  }

  /** 綁定演示 / 情境 / 解法按鈕 */
  function bindPlayButtons() {
    document.addEventListener("click", function (e) {
      /* 一鍵演示 */
      var playBtn = e.target.closest("[data-play-algo]");
      if (playBtn && cube && !playing) {
        playing = true;
        playBtn.disabled = true;
        cube.reset();
        setTimeout(function () {
          cube.playSequence(playBtn.getAttribute("data-play-algo")).then(function () {
            playing = false;
            playBtn.disabled = false;
          });
        }, 200);
        return;
      }

      /* 建立情境 */
      var setupBtn = e.target.closest("[data-algo-setup]");
      if (setupBtn && cube && !playing) {
        playing = true;
        disableAllAlgoButtons(true);
        cube.reset();
        cube.setSpeed(3);
        setTimeout(function () {
          cube.playSequence(setupBtn.getAttribute("data-algo-setup")).then(function () {
            cube.setSpeed(1);
            playing = false;
            disableAllAlgoButtons(true);
            /* 只啟用同卡片的解法按鈕 */
            var card = setupBtn.closest(".algorithm-card");
            if (card) {
              var solveBtn = card.querySelector("[data-algo-solve]");
              if (solveBtn) solveBtn.disabled = false;
            }
          });
        }, 200);
        return;
      }

      /* 執行解法 */
      var solveBtn = e.target.closest("[data-algo-solve]");
      if (solveBtn && cube && !playing) {
        playing = true;
        solveBtn.disabled = true;
        cube.setSpeed(1);
        cube.playSequence(solveBtn.getAttribute("data-algo-solve")).then(function () {
          playing = false;
          disableAllAlgoButtons(false);
        });
        return;
      }

      /* 單步符號點擊已移除 — 公式頁面僅支援完整演示 */
    });
  }

  /** 啟用/停用所有公式按鈕 */
  function disableAllAlgoButtons(disabled) {
    document.querySelectorAll("[data-play-algo],[data-algo-setup],[data-algo-solve]").forEach(function (btn) {
      btn.disabled = disabled;
    });
    if (!disabled) {
      document.querySelectorAll("[data-algo-solve]").forEach(function (btn) {
        btn.disabled = true;
      });
    }
  }
})();
