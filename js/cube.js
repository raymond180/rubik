/* ============================================================
   3D 魔術方塊引擎 (cube.js)
   使用 Three.js 從零建構，支援旋轉動畫與互動控制
   依賴全域 THREE 及 THREE.OrbitControls（由 CDN 載入）
   ============================================================ */

/**
 * Rubik's Cube 3D 引擎建構器。
 *
 * @param {HTMLElement} container - 承載 canvas 的容器元素
 * @param {Object} [opts] - 選項
 * @param {boolean} [opts.interactive=true] - 是否啟用 OrbitControls
 * @param {string}  [opts.bgColor] - 背景色（CSS 色碼），null 表示透明
 */
function RubiksCube(container, opts) {
  opts = opts || {};
  var self = this;

  /* ---------- 常數 ---------- */
  var CUBIE_SIZE = 0.95;
  var GAP = 1.0;
  var ANIM_DURATION = 500;

  /* WCA 世界標準配色（白上綠前）
     U=白 D=黃 R=紅 L=橙 F=綠 B=藍 */
  var COLORS = {
    U: 0xffffff, // 白 — 上面
    D: 0xffd500, // 黃 — 下面
    R: 0xb71234, // 紅 — 右面
    L: 0xff5800, // 橙 — 左面
    F: 0x009b48, // 綠 — 前面
    B: 0x0046ad, // 藍 — 後面
    inside: 0x1a1a1a,
  };

  /* 面 → 軸 & 方向映射 */
  var FACE_MAP = {
    R: { axis: "x", layer: 1, dir: -1 },
    L: { axis: "x", layer: -1, dir: 1 },
    U: { axis: "y", layer: 1, dir: -1 },
    D: { axis: "y", layer: -1, dir: 1 },
    F: { axis: "z", layer: 1, dir: -1 },
    B: { axis: "z", layer: -1, dir: 1 },
  };

  /* 整顆方塊旋轉（x / y / z） */
  var CUBE_ROT = {
    X: { axis: "x", dir: -1 },
    Y: { axis: "y", dir: -1 },
    Z: { axis: "z", dir: -1 },
  };

  /* ---------- Three.js 場景 ---------- */
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight || 1,
    0.1,
    100
  );
  camera.position.set(4, 3.5, 4);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: opts.bgColor === null,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(
    container.clientWidth || 300,
    container.clientHeight || 300
  );
  if (opts.bgColor !== undefined && opts.bgColor !== null) {
    renderer.setClearColor(new THREE.Color(opts.bgColor));
  }
  container.appendChild(renderer.domElement);

  /* 燈光 */
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  /* OrbitControls */
  var controls = null;
  if (opts.interactive !== false) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.enablePan = false;
  }

  /* ---------- Cubies ---------- */
  var cubeGroup = new THREE.Group();
  scene.add(cubeGroup);
  var cubies = [];

  function makeMaterials(x, y, z) {
    var faces = [
      x === 1 ? COLORS.R : COLORS.inside,
      x === -1 ? COLORS.L : COLORS.inside,
      y === 1 ? COLORS.U : COLORS.inside,
      y === -1 ? COLORS.D : COLORS.inside,
      z === 1 ? COLORS.F : COLORS.inside,
      z === -1 ? COLORS.B : COLORS.inside,
    ];
    return faces.map(function (c) {
      return new THREE.MeshStandardMaterial({
        color: c,
        roughness: 0.35,
        metalness: 0.0,
      });
    });
  }

  var sharedGeo = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
  var sharedEdgesGeo = new THREE.EdgesGeometry(sharedGeo);

  function buildCube() {
    while (cubeGroup.children.length) cubeGroup.remove(cubeGroup.children[0]);
    cubies = [];
    for (var x = -1; x <= 1; x++) {
      for (var y = -1; y <= 1; y++) {
        for (var z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          var mesh = new THREE.Mesh(sharedGeo, makeMaterials(x, y, z));
          mesh.position.set(x * GAP, y * GAP, z * GAP);
          var edges = new THREE.LineSegments(
            sharedEdgesGeo,
            new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
          );
          mesh.add(edges);
          mesh.userData.logicalPos = { x: x, y: y, z: z };
          cubeGroup.add(mesh);
          cubies.push(mesh);
        }
      }
    }
  }
  buildCube();

  /* ---------- 旋轉動畫系統 ---------- */
  var animating = false;
  var moveQueue = [];
  var moveHistory = [];
  var paused = false;
  var speedMultiplier = 1;
  var sequencePlaying = false;
  var sequenceResolve = null;

  function parseMove(move) {
    move = move.trim();
    var c0 = move.charAt(0);
    var wide = c0 === c0.toLowerCase() && "frubld".indexOf(c0) !== -1;
    var face = c0.toUpperCase();
    var prime = move.indexOf("'") !== -1 || move.indexOf("\u2019") !== -1;
    var double = move.indexOf("2") !== -1;
    return { face: face, prime: prime, double: double, wide: wide };
  }

  function getCubiesOnFace(axis, layer) {
    var result = [];
    cubies.forEach(function (c) {
      if (Math.round(c.position[axis]) === layer) result.push(c);
    });
    return result;
  }

  function getCubiesWide(axis, layer) {
    var result = [];
    cubies.forEach(function (c) {
      var pos = Math.round(c.position[axis]);
      if (layer > 0 ? pos >= 0 : pos <= 0) result.push(c);
    });
    return result;
  }

  function animateMove(moveStr, callback) {
    var parsed = parseMove(moveStr);
    var face = parsed.face;
    var rot = CUBE_ROT[face];
    var info = rot ? null : FACE_MAP[face];
    if (!rot && !info) { if (callback) callback(); return; }

    var axis = rot ? rot.axis : info.axis;
    var angle = (Math.PI / 2) * (rot ? rot.dir : info.dir);
    if (parsed.prime) angle = -angle;
    if (parsed.double) angle *= 2;

    var faceCubies = rot
      ? cubies.slice()
      : parsed.wide
        ? getCubiesWide(axis, info.layer)
        : getCubiesOnFace(axis, info.layer);
    if (faceCubies.length === 0) { if (callback) callback(); return; }

    var pivot = new THREE.Group();
    scene.add(pivot);
    faceCubies.forEach(function (c) { pivot.attach(c); });

    var duration = ANIM_DURATION / speedMultiplier;
    var startTime = null;
    animating = true;

    var axisVec = new THREE.Vector3(
      axis === "x" ? 1 : 0, axis === "y" ? 1 : 0, axis === "z" ? 1 : 0
    );
    var startQuat = new THREE.Quaternion();
    var endQuat = new THREE.Quaternion().setFromAxisAngle(axisVec, angle);

    function tick(timestamp) {
      if (startTime === null) startTime = timestamp;
      var t = Math.min((timestamp - startTime) / duration, 1);
      t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      pivot.quaternion.slerpQuaternions(startQuat, endQuat, t);
      if (t < 1) { requestAnimationFrame(tick); return; }

      pivot.quaternion.copy(endQuat);
      pivot.updateMatrixWorld(true);
      faceCubies.forEach(function (c) {
        cubeGroup.attach(c);
        c.position.x = Math.round(c.position.x);
        c.position.y = Math.round(c.position.y);
        c.position.z = Math.round(c.position.z);
      });
      scene.remove(pivot);
      animating = false;
      if (callback) callback();
      processQueue();
    }
    requestAnimationFrame(tick);
  }

  function processQueue() {
    if (animating || paused) return;
    if (moveQueue.length === 0) {
      if (sequencePlaying) {
        sequencePlaying = false;
        if (sequenceResolve) { sequenceResolve(); sequenceResolve = null; }
      }
      return;
    }
    var next = moveQueue.shift();
    moveHistory.push(next);
    animateMove(next, null);
  }

  /* ---------- 公開 API ---------- */
  self.rotate = function (move) {
    moveQueue.push(move);
    if (!animating && !paused) processQueue();
  };

  /**
   * 展開雙轉（R2 → R R）以便逐步動畫呈現
   */
  function expandMoves(moves) {
    var result = [];
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i].trim();
      if (!m) continue;
      if (m.indexOf("2") !== -1) {
        var base = m.replace("2", "");
        result.push(base);
        result.push(base);
      } else {
        result.push(m);
      }
    }
    return result;
  }

  self.playSequence = function (moves, speed) {
    if (typeof moves === "string") {
      moves = moves.trim().split(/\s+/).filter(Boolean);
    }
    moves = expandMoves(moves);
    if (speed) speedMultiplier = speed;
    sequencePlaying = true;
    moves.forEach(function (m) { moveQueue.push(m); });
    if (!animating && !paused) processQueue();
    return new Promise(function (resolve) { sequenceResolve = resolve; });
  };

  self.pause = function () { paused = true; };
  self.resume = function () { paused = false; processQueue(); };

  function invertMove(move) {
    var p = parseMove(move);
    if (p.double) return move;
    return p.prime ? p.face : p.face + "'";
  }

  self.undo = function () {
    if (!moveHistory.length) return;
    moveQueue.unshift(invertMove(moveHistory.pop()));
    if (!animating && !paused) processQueue();
  };

  self.reset = function () {
    moveQueue = []; moveHistory = [];
    sequencePlaying = false; animating = false; paused = false;
    buildCube();
  };

  self.highlightFace = function (face) {
    cubies.forEach(function (c) {
      c.material.forEach(function (m) { m.transparent = false; m.opacity = 1; });
    });
    if (!face) return;
    var info = FACE_MAP[face];
    if (!info) return;
    var onFace = new Set(getCubiesOnFace(info.axis, info.layer));
    cubies.forEach(function (c) {
      if (!onFace.has(c)) {
        c.material.forEach(function (m) { m.transparent = true; m.opacity = 0.15; });
      }
    });
  };

  self.getState = function () {
    return cubies.map(function (c) {
      return { x: Math.round(c.position.x), y: Math.round(c.position.y), z: Math.round(c.position.z) };
    });
  };

  self.setSpeed = function (s) { speedMultiplier = Math.max(0.1, s); };
  self.getHistory = function () { return moveHistory.slice(); };
  self.isAnimating = function () { return animating || moveQueue.length > 0; };

  /* ---------- 渲染迴圈 ---------- */
  var disposed = false;
  function animate() {
    if (disposed) return;
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  animate();

  /* ---------- 響應式 ---------- */
  var ro = new ResizeObserver(function () {
    var w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(container);

  self.dispose = function () {
    disposed = true; ro.disconnect();
    if (controls) controls.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  };

  self.setBackground = function (color) {
    if (color === null) { renderer.setClearAlpha(0); }
    else { renderer.setClearColor(new THREE.Color(color)); renderer.setClearAlpha(1); }
  };
}

/* 匯出至全域 */
window.RubiksCube = RubiksCube;
