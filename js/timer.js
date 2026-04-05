/**
 * timer.js — 魔術方塊計時器
 * 狀態機：idle → holding → ready → running → stopped → idle
 * 支援鍵盤空白鍵 + 觸控操作，WCA 標準打亂，ao5/ao12 統計
 */
(function () {
  "use strict";

  // ---------- WCA Scramble Generator ----------
  const MOVES = ["R", "L", "U", "D", "F", "B"];
  const SUFFIXES = ["", "'", "2"];

  function generateScramble(length = 20) {
    const scramble = [];
    let lastAxis = -1;
    let secondLastAxis = -1;
    for (let i = 0; i < length; i++) {
      let axis;
      do {
        axis = Math.floor(Math.random() * 6);
      } while (
        axis === lastAxis ||
        (Math.floor(axis / 2) === Math.floor(lastAxis / 2) &&
          axis === secondLastAxis)
      );
      const suffix = SUFFIXES[Math.floor(Math.random() * 3)];
      scramble.push(MOVES[axis] + suffix);
      secondLastAxis = lastAxis;
      lastAxis = axis;
    }
    return scramble.join(" ");
  }

  // ---------- DOM References ----------
  const scrambleText = document.getElementById("scramble-text");
  const newScrambleBtn = document.getElementById("new-scramble");
  const timerDisplay = document.getElementById("timer-display");
  const timerArea = document.getElementById("timer-area");
  const stateDot = document.getElementById("timer-state-dot");
  const stateText = document.getElementById("timer-state-text");
  const statBest = document.getElementById("stat-best");
  const statAo5 = document.getElementById("stat-ao5");
  const statAo12 = document.getElementById("stat-ao12");
  const historyBody = document.getElementById("history-body");
  const clearHistoryBtn = document.getElementById("clear-history");

  // ---------- State ----------
  const HOLD_DELAY = 300; // 毫秒，按住後變 ready 的延遲
  let state = "idle"; // idle | holding | ready | running | stopped
  let holdTimer = null;
  let startTime = 0;
  let animFrame = null;
  let currentScramble = "";
  let history = [];

  // ---------- Init ----------
  loadHistory();
  newScramble();
  renderHistory();
  updateStats();

  // ---------- Scramble ----------
  function newScramble() {
    currentScramble = generateScramble();
    if (scrambleText) scrambleText.textContent = currentScramble;
  }

  newScrambleBtn?.addEventListener("click", newScramble);

  // ---------- Timer State Machine ----------
  function setState(newState) {
    state = newState;
    // 更新視覺狀態指示
    if (stateDot) {
      stateDot.className = "state-dot " + newState;
    }
    const labels = {
      idle: "按住空白鍵開始",
      holding: "持續按住...",
      ready: "放開開始計時！",
      running: "計時中 — 按空白鍵停止",
      stopped: "完成！按空白鍵下一次",
    };
    if (stateText) stateText.textContent = labels[newState] || "";

    // 更新側邊視覺狀態指引
    document.querySelectorAll(".state-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.state === newState);
    });

    // 計時器顯示顏色
    if (timerDisplay) {
      timerDisplay.classList.remove(
        "timer-idle",
        "timer-holding",
        "timer-ready",
        "timer-running",
        "timer-stopped"
      );
      timerDisplay.classList.add("timer-" + newState);
    }
  }

  function onInputDown() {
    if (state === "running") {
      stopTimer();
      return;
    }
    if (state === "stopped" || state === "idle") {
      setState("holding");
      holdTimer = setTimeout(() => {
        setState("ready");
      }, HOLD_DELAY);
    }
  }

  function onInputUp() {
    if (state === "holding") {
      clearTimeout(holdTimer);
      setState("idle");
      return;
    }
    if (state === "ready") {
      startTimer();
      return;
    }
  }

  function startTimer() {
    setState("running");
    startTime = performance.now();
    timerDisplay.textContent = "0.00";
    tick();
  }

  function tick() {
    if (state !== "running") return;
    const elapsed = (performance.now() - startTime) / 1000;
    timerDisplay.textContent = formatTime(elapsed);
    animFrame = requestAnimationFrame(tick);
  }

  function stopTimer() {
    cancelAnimationFrame(animFrame);
    const elapsed = (performance.now() - startTime) / 1000;
    timerDisplay.textContent = formatTime(elapsed);
    setState("stopped");
    recordSolve(elapsed);
    newScramble();
  }

  function formatTime(seconds) {
    if (seconds < 60) return seconds.toFixed(2);
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(2).padStart(5, "0");
    return m + ":" + s;
  }

  // ---------- Keyboard Events ----------
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !e.repeat) {
      e.preventDefault();
      onInputDown();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      onInputUp();
    }
  });

  // ---------- Touch Events ----------
  if (timerArea) {
    timerArea.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        onInputDown();
      },
      { passive: false }
    );
    timerArea.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        onInputUp();
      },
      { passive: false }
    );
  }

  // ---------- History & Stats ----------
  function recordSolve(time) {
    const entry = {
      time: Math.round(time * 100) / 100,
      scramble: currentScramble,
      date: new Date().toISOString(),
    };
    history.push(entry);
    saveHistory();
    renderHistory();
    updateStats();
  }

  function calcAverage(times, count) {
    if (times.length < count) return null;
    const recent = times.slice(-count);
    const sorted = [...recent].sort((a, b) => a - b);
    // 去掉最好和最差
    const trimmed = sorted.slice(1, -1);
    const avg = trimmed.reduce((s, t) => s + t, 0) / trimmed.length;
    return Math.round(avg * 100) / 100;
  }

  function updateStats() {
    const times = history.map((h) => h.time);
    // 最佳
    if (times.length > 0) {
      statBest.textContent = formatTime(Math.min(...times));
    } else {
      statBest.textContent = "—";
    }
    // ao5
    const ao5 = calcAverage(times, 5);
    statAo5.textContent = ao5 !== null ? formatTime(ao5) : "—";
    // ao12
    const ao12 = calcAverage(times, 12);
    statAo12.textContent = ao12 !== null ? formatTime(ao12) : "—";
  }

  function renderHistory() {
    if (!historyBody) return;
    if (history.length === 0) {
      historyBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-body-secondary">還沒有記錄，開始計時吧！</td></tr>';
      return;
    }
    const times = history.map((h) => h.time);
    const rows = history
      .map((entry, i) => {
        const num = i + 1;
        const ao5 =
          i >= 4 ? calcAverage(times.slice(0, i + 1), 5) : null;
        const ao12 =
          i >= 11 ? calcAverage(times.slice(0, i + 1), 12) : null;
        return (
          "<tr>" +
          "<td>" + num + "</td>" +
          '<td class="fw-bold">' + formatTime(entry.time) + "</td>" +
          "<td>" + (ao5 !== null ? formatTime(ao5) : "—") + "</td>" +
          "<td>" + (ao12 !== null ? formatTime(ao12) : "—") + "</td>" +
          '<td class="small text-body-secondary font-monospace">' +
          escapeHtml(entry.scramble) +
          "</td>" +
          "<td>" +
          '<button class="btn btn-sm btn-outline-danger btn-delete" data-index="' +
          i +
          '"><i class="bi bi-x"></i></button>' +
          "</td>" +
          "</tr>"
        );
      })
      .reverse();
    historyBody.innerHTML = rows.join("");
    // 綁定刪除
    historyBody.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.index, 10);
        history.splice(idx, 1);
        saveHistory();
        renderHistory();
        updateStats();
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Persistence ----------
  function saveHistory() {
    try {
      localStorage.setItem(
        "rubik-timer-history",
        JSON.stringify(history)
      );
    } catch {
      // localStorage 不可用時靜默忽略
    }
  }

  function loadHistory() {
    try {
      const data = localStorage.getItem("rubik-timer-history");
      if (data) history = JSON.parse(data);
    } catch {
      history = [];
    }
  }

  clearHistoryBtn?.addEventListener("click", () => {
    if (!confirm("確定要清除所有歷史記錄嗎？")) return;
    history = [];
    saveHistory();
    renderHistory();
    updateStats();
  });

  // ---------- Init State ----------
  setState("idle");
})();
