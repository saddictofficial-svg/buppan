/* =====================================================
   BUPPAN — インタラクション & みなとみらい ドット絵FV
   ===================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- スマホメニュー ---------- */
  var menuToggle = document.getElementById("menuToggle");
  var nav = document.getElementById("nav");
  if (menuToggle) {
    menuToggle.addEventListener("click", function () { nav.classList.toggle("is-open"); });
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("is-open"); }); });
  }

  /* ---------- スクロールで出現 ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- GROWTH SCORE カウントアップ ---------- */
  var scoreEl = document.getElementById("scoreValue");
  if (scoreEl) {
    var target = parseFloat(scoreEl.getAttribute("data-target"));
    if (reduce) { scoreEl.textContent = target.toFixed(2); }
    else {
      var cur = 0, tm = setInterval(function () {
        cur += target / 42;
        if (cur >= target) { cur = target; clearInterval(tm); }
        scoreEl.textContent = cur.toFixed(2);
      }, 28);
    }
  }

  /* ---------- 実績数字カウントアップ（画面に入ったら） ---------- */
  function countUp(el) {
    var goal = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = goal + suffix; return; }
    var n = 0, step = Math.max(1, Math.round(goal / 40));
    var t = setInterval(function () {
      n += step; if (n >= goal) { n = goal; clearInterval(t); }
      el.textContent = n + suffix;
    }, 26);
  }
  var statIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); statIO.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll(".stat__num[data-count]").forEach(function (el) { statIO.observe(el); });

  /* ---------- お問い合わせ（デモ） ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      document.getElementById("formNote").textContent = "送信ありがとうございます（デモ表示）";
      form.reset();
    });
  }

  /* =====================================================
     みなとみらい 夜景（ドット絵 canvas）
     ===================================================== */
  var canvas = document.getElementById("cityCanvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var SCALE = 5;            // 1ドット = 5画面px（チャンキーな見た目）
  var W = 0, H = 0, horizon = 0;
  var stars = [], buildings = [], windows = [], shoot = null, shootTimer = 0;

  var LIGHTS = ["#22d3ee", "#ff2d95", "#c6f542", "#ffb300", "#eaf0ff"];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function setup() {
    var rect = canvas.getBoundingClientRect();
    W = Math.max(160, Math.ceil(rect.width / SCALE));
    H = Math.max(120, Math.ceil(rect.height / SCALE));
    canvas.width = W; canvas.height = H;
    var mobile = window.innerWidth <= 768;
    horizon = Math.floor(H * (mobile ? 0.9 : 0.78));

    /* 星 */
    stars = [];
    for (var i = 0; i < Math.floor(W * H / 90); i++) {
      stars.push({ x: Math.floor(rnd(0, W)), y: Math.floor(rnd(0, horizon - 6)), s: Math.random(), c: LIGHTS[Math.floor(rnd(0, 5))] });
    }

    /* スカイライン（みなとみらいをモチーフにした稜線） */
    buildings = [];
    var baseY = horizon;
    var hMul = mobile ? 0.92 : 1;
    function b(xf, wf, hf, type) { buildings.push({ x: Math.floor(W * xf), w: Math.max(4, Math.floor(W * wf)), h: Math.floor(H * hf * hMul), type: type }); }
    b(0.02, 0.05, 0.16, "flat");
    b(0.08, 0.045, 0.24, "flat");
    b(0.13, 0.05, 0.20, "flat");
    b(0.19, 0.055, 0.40, "sail");     // 帆型ホテル（インターコンチ風）
    b(0.26, 0.05, 0.30, "flat");
    b(0.31, 0.06, 0.52, "landmark");  // ランドマークタワー
    b(0.39, 0.045, 0.34, "step");     // クイーンズスクエア群
    b(0.435, 0.04, 0.40, "step");
    b(0.475, 0.04, 0.30, "step");
    b(0.52, 0.05, 0.22, "flat");
    b(0.60, 0.05, 0.28, "flat");
    b(0.83, 0.055, 0.24, "flat");
    b(0.90, 0.05, 0.34, "flat");
    b(0.96, 0.04, 0.20, "flat");

    /* ビルの窓 */
    windows = [];
    buildings.forEach(function (bl) {
      if (bl.type === "sail") return;
      var top = baseY - bl.h;
      for (var yy = top + 3; yy < baseY - 1; yy += 3) {
        for (var xx = bl.x + 1; xx < bl.x + bl.w - 1; xx += 2) {
          if (Math.random() < 0.62) {
            windows.push({ x: xx, y: yy, c: LIGHTS[Math.floor(rnd(0, 4))], seed: Math.random() * 6.28, sp: rnd(1, 3) });
          }
        }
      }
    });

    /* コスモクロック21（観覧車） */
    if (mobile) {
      wheel.cx = Math.floor(W * 0.5);
      wheel.r = Math.floor(Math.min(H * 0.26, W * 0.36));
      wheel.cy = Math.floor(horizon - wheel.r - H * 0.03);
    } else {
      wheel.cx = Math.floor(W * 0.79);
      wheel.cy = Math.floor(horizon - H * 0.15);
      wheel.r = Math.floor(H * 0.155);
    }
  }

  var wheel = { cx: 0, cy: 0, r: 0 };

  function px(x, y, color, a) {
    ctx.globalAlpha = a === undefined ? 1 : a;
    ctx.fillStyle = color;
    ctx.fillRect(x | 0, y | 0, 1, 1);
  }
  function rect(x, y, w, h, color, a) {
    ctx.globalAlpha = a === undefined ? 1 : a;
    ctx.fillStyle = color;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  function drawSky() {
    for (var y = 0; y < horizon; y++) {
      var t = y / horizon;
      // 上：濃紺 → 中：紫 → 地平線：暗いマゼンタの残光
      var r = Math.floor(8 + t * 34);
      var g = Math.floor(12 + t * 10);
      var bl = Math.floor(30 + t * 40);
      rect(0, y, W, 1, "rgb(" + r + "," + g + "," + bl + ")");
    }
    // 地平線の残光
    rect(0, horizon - 8, W, 8, "rgba(255,45,149,0.10)");
  }

  function drawMoon() {
    var mx = Math.floor(W * 0.14), my = Math.floor(H * 0.16), mr = Math.max(3, Math.floor(Math.min(H * 0.04, W * 0.06)));
    for (var y = -mr; y <= mr; y++) for (var x = -mr; x <= mr; x++) {
      if (x * x + y * y <= mr * mr) px(mx + x, my + y, "#eaf0ff", 0.9);
    }
    // ぼんやりした光輪
    for (var i = 0; i < 40; i++) { var a = Math.random() * 6.28, rr = mr + 1 + Math.random() * 2; px(mx + Math.cos(a) * rr, my + Math.sin(a) * rr, "#9fb4e8", 0.25); }
  }

  function silhouette(bl, baseY, color) {
    var top = baseY - bl.h;
    if (bl.type === "landmark") {
      rect(bl.x, top + 4, bl.w, bl.h - 4, color);
      rect(bl.x + 1, top, bl.w - 2, 5, color);           // 段
      rect(bl.x + bl.w / 2 - 1, top - 4, 2, 4, color);   // 頂部
    } else if (bl.type === "step") {
      rect(bl.x, top + 3, bl.w, bl.h - 3, color);
      rect(bl.x + 1, top, bl.w - 2, 4, color);
    } else if (bl.type === "sail") {
      // 帆型：斜辺のあるシルエット
      for (var i = 0; i < bl.h; i++) {
        var ww = Math.floor(bl.w * (0.35 + 0.65 * (i / bl.h)));
        rect(bl.x, top + i, ww, 1, color);
      }
    } else {
      rect(bl.x, top, bl.w, bl.h, color);
    }
  }

  function drawFerris(t, cx, cy, r, alpha, mirror) {
    var ang = (mirror ? -t : t) * 0.35;
    // スポーク
    for (var s = 0; s < 8; s++) {
      var a = ang + s * Math.PI / 4;
      for (var d = 0; d < r; d += 1) px(cx + Math.cos(a) * d, cy + Math.sin(a) * d, "#3b4d78", 0.5 * alpha);
    }
    // リング（車輪の外周）
    var N = 28;
    for (var i = 0; i < N; i++) {
      var a2 = ang + i * (Math.PI * 2 / N);
      var lx = cx + Math.cos(a2) * r, ly = cy + Math.sin(a2) * r;
      var col = LIGHTS[(i + Math.floor(t * 5)) % LIGHTS.length];
      // グロー（周囲を薄く光らせる）
      px(lx, ly, col, alpha);
      px(lx + 1, ly, col, 0.55 * alpha);
      px(lx - 1, ly, col, 0.35 * alpha);
      px(lx, ly + 1, col, 0.35 * alpha);
      px(lx, ly - 1, col, 0.35 * alpha);
    }
    // ゴンドラ（外周の内側に）
    for (var c = 0; c < 12; c++) {
      var a3 = ang * 1.0 + c * (Math.PI * 2 / 12);
      var gx = cx + Math.cos(a3) * (r - 2), gy = cy + Math.sin(a3) * (r - 2);
      rect(gx, gy, 1, 1, "#cfe0ff", 0.8 * alpha);
    }
    // ハブ（中心の時計）
    for (var y = -3; y <= 3; y++) for (var x = -3; x <= 3; x++) if (x * x + y * y <= 9) px(cx + x, cy + y, "#0a1730", alpha);
    for (var y2 = -2; y2 <= 2; y2++) for (var x2 = -2; x2 <= 2; x2++) if (x2 * x2 + y2 * y2 <= 4) px(cx + x2, cy + y2, "#22d3ee", 0.9 * alpha);
    px(cx, cy, "#eaf0ff", alpha);
  }

  function draw(time) {
    var t = time / 1000;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    drawSky();

    // 星の瞬き
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      var a = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * (1 + st.s * 2) + st.s * 10));
      px(st.x, st.y, st.c, a);
    }
    drawMoon();

    // 流れ星
    if (!reduce) {
      shootTimer -= 1;
      if (!shoot && shootTimer < 0) { shoot = { x: rnd(W * 0.4, W), y: rnd(4, horizon * 0.4), life: 0 }; }
      if (shoot) {
        shoot.life += 1; shoot.x -= 2.2; shoot.y += 1.1;
        for (var k = 0; k < 7; k++) px(shoot.x + k * 2.0, shoot.y - k * 1.0, "#eaf0ff", 0.9 - k * 0.12);
        if (shoot.x < 0 || shoot.y > horizon) { shoot = null; shootTimer = Math.floor(rnd(180, 460)); }
      }
    }

    var baseY = horizon;

    // 反射（先に暗く描く）
    if (!reduce) {
      ctx.save();
      buildings.forEach(function (bl) {
        var top = baseY - bl.h;
        var refH = Math.min(bl.h, H - baseY);
        for (var yy = 0; yy < refH; yy++) {
          var off = Math.round(Math.sin((yy + t * 6) * 0.6) * 1.2 * (yy / refH));
          rect(bl.x + off, baseY + yy, bl.w, 1, "#0e1836", 0.5 * (1 - yy / refH));
        }
      });
      drawFerris(t, wheel.cx, baseY + (baseY - wheel.cy), wheel.r * 0.85, 0.28, true);
      ctx.restore();
    }

    // 水面のバンド
    for (var wy = baseY; wy < H; wy++) {
      if ((wy - baseY) % 3 === 0) rect(0, wy, W, 1, "#060b18", 0.5);
    }
    // 水面のきらめき
    for (var g = 0; g < W; g += 1) {
      if (Math.random() < 0.04) px(g, baseY + 2 + Math.random() * (H - baseY - 2), "#22d3ee", 0.35);
    }

    // ビル群
    buildings.forEach(function (bl) { silhouette(bl, baseY, "#182a4d"); });
    // 稜線のふち（ネオン）
    buildings.forEach(function (bl) {
      var top = baseY - bl.h;
      if (bl.type !== "sail") { rect(bl.x, top, bl.w, 1, "#2f6ea0", 0.95); }
    });

    // 窓の光
    for (var w = 0; w < windows.length; w++) {
      var wd = windows[w];
      var fl = 0.5 + 0.5 * Math.sin(t * wd.sp + wd.seed);
      if (fl > 0.18) px(wd.x, wd.y, wd.c, 0.4 + fl * 0.6);
    }

    // 観覧車
    drawFerris(t, wheel.cx, wheel.cy, wheel.r, 1, false);

    ctx.globalAlpha = 1;
  }

  var raf;
  function loop(ts) { draw(ts); raf = requestAnimationFrame(loop); }

  setup();
  if (reduce) { draw(1200); }
  else { raf = requestAnimationFrame(loop); }

  var rz;
  function rebuild() { clearTimeout(rz); rz = setTimeout(function () { setup(); if (reduce) draw(1200); }, 150); }
  window.addEventListener("resize", rebuild);
  window.addEventListener("load", rebuild);
  // canvasの実サイズが変わったら再計測（初期レイアウト確定・フォント読込・回転に強い）
  if (window.ResizeObserver) {
    var lastW = 0, lastH = 0;
    var ro = new ResizeObserver(function (entries) {
      var r = entries[0].contentRect;
      if (Math.abs(r.width - lastW) > 2 || Math.abs(r.height - lastH) > 2) {
        lastW = r.width; lastH = r.height; rebuild();
      }
    });
    ro.observe(canvas);
  }
})();
