/* =====================================================
   BUPPAN — インタラクション & みなとみらい ドット絵FV
   ===================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 起動演出（BOOTムービー） ---------- */
  (function () {
    var boot = document.getElementById("boot");
    if (!boot) return;
    if (reduce) { boot.remove(); return; }
    try { if (sessionStorage.getItem("buppan_booted")) { boot.remove(); return; } sessionStorage.setItem("buppan_booted", "1"); } catch (e) {}
    var log = document.getElementById("bootLog");
    var bar = document.getElementById("bootBar");
    var lines = ["> BOOT SEQUENCE START", "> LOADING GROWTH ENGINE ...", "> SYNC MINATOMIRAI NET ...", "> STATUS: ALL SYSTEMS ONLINE"];
    document.body.style.overflow = "hidden";
    var i = 0;
    function step() {
      if (i < lines.length) {
        log.textContent += lines[i] + "\n";
        bar.style.width = Math.round((i + 1) / lines.length * 100) + "%";
        i++;
        setTimeout(step, 300);
      } else {
        setTimeout(done, 350);
      }
    }
    function done() {
      boot.classList.add("is-done");
      document.body.style.overflow = "";
      setTimeout(function () { if (boot.parentNode) boot.remove(); }, 600);
    }
    setTimeout(step, 220);
  })();

  /* ---------- スマホメニュー ---------- */
  var menuToggle = document.getElementById("menuToggle");
  var nav = document.getElementById("nav");
  if (menuToggle) {
    menuToggle.addEventListener("click", function () { nav.classList.toggle("is-open"); });
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("is-open"); }); });
  }

  /* ---------- マーキー：画面幅より短いと右に空白が出るので、足りなければ自動で複製 ---------- */
  (function () {
    var marquee = document.querySelector(".marquee");
    var track = document.querySelector(".marquee__track");
    if (!marquee || !track) return;
    var base = track.innerHTML; // 現在の内容を1単位として倍化し、-50%ループの継ぎ目を保つ
    function ensure() {
      var guard = 0;
      // 「全体の半分（＝ループ1周の移動量）」が表示幅を超えるまで内容を倍化
      while (track.scrollWidth / 2 < marquee.clientWidth + 40 && guard < 7) {
        track.innerHTML += base;
        guard++;
      }
    }
    ensure();
    // レイアウト確定・幅変化で確実に再計算（ResizeObserverが最も堅牢）
    if (window.ResizeObserver) { new ResizeObserver(ensure).observe(marquee); }
    window.addEventListener("load", ensure);
  })();

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
      var note = document.getElementById("formNote");
      var consent = document.getElementById("consent");
      if (consent && !consent.checked) {
        ev.preventDefault();
        note.style.color = "var(--pink)";
        note.textContent = "プライバシーポリシーへの同意が必要です。";
        return;
      }
      var action = form.getAttribute("action") || "";
      if (action.indexOf("YOUR_FORM_ID") >= 0 || action === "") {
        // 送信先が未設定 → デモ表示（本番は action に送信先を設定すると実送信されます）
        ev.preventDefault();
        note.style.color = "";
        note.textContent = "送信ありがとうございます（デモ表示：公開前に送信先の設定が必要です）";
        form.reset();
        return;
      }
      // 送信先が設定済み → 同意済みなのでそのまま送信
      note.style.color = "";
      note.textContent = "送信中…";
    });
  }

  /* ---------- フローティングCTA：ヒーローを過ぎたら表示、CONTACTでは隠す ---------- */
  var fab = document.getElementById("fab");
  if (fab && "IntersectionObserver" in window) {
    var hero = document.querySelector(".hero");
    var contactSec = document.getElementById("contact");
    var pastHero = false, atContact = false;
    function updFab() { fab.classList.toggle("is-show", pastHero && !atContact); }
    if (hero) new IntersectionObserver(function (e) { pastHero = !e[0].isIntersecting; updFab(); }, { threshold: 0 }).observe(hero);
    if (contactSec) new IntersectionObserver(function (e) { atContact = e[0].isIntersecting; updFab(); }, { threshold: 0.05 }).observe(contactSec);
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

/* ===== 実写ムービーFV（加工焼き込み済み動画を背景再生）※PC・スマホ共通 ===== */
(function () {
  var reduceV = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var video = document.getElementById("fvVideo");
  var city = document.getElementById("cityCanvas");
  if (!video || !city || reduceV) return;
  // スマホでも実写動画に統一。自動再生不可の場合のみドット絵にフォールバック。

  // 9:00〜16:00は昼景、それ以外は夜景。昼素材が無ければ夜景へフォールバック。
  var NIGHT = "assets/mm_fx.mp4", DAY = "assets/mm_day_fx.mp4";
  var h = new Date().getHours();
  var daytime = h >= 9 && h < 16;
  var srcEl = video.querySelector("source");
  var triedNight = false;

  // 動画は常時表示（背面z:0）。再生できたら前面のドット絵を隠して動画を見せる。
  function show() { city.style.display = "none"; }
  function load(src) {
    if (srcEl) srcEl.src = src; else video.src = src;
    video.load();
    var p = video.play();
    if (p && p.then) p.then(show).catch(function () {});
  }
  video.addEventListener("playing", show);
  video.addEventListener("canplay", function () { video.play().then(show).catch(function () {}); });
  video.addEventListener("error", function () {
    if (daytime && !triedNight) { triedNight = true; load(NIGHT); } // 昼素材が未配置→夜景で表示
  }, true);
  load(daytime ? DAY : NIGHT);
})();

/* ===== FV演出レイヤー（花火・流れ星・UFO／ドット絵・PCのみ） ===== */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fx = document.getElementById("fvFx");
  if (!fx) return;
  if (window.innerWidth <= 768) { fx.style.display = "none"; return; } // SPは演出なし（負荷軽減）
  var ctx = fx.getContext("2d");
  var SCALE = 5, W = 0, H = 0;
  var COLORS = ["#22d3ee", "#c6f542", "#ff2d95", "#ffb300", "#eaf0ff"];
  var parts = [], shoot = null, ufo = null;
  var fwT = 120, shootT = 480, ufoT = 1800;
  var active = false;
  setTimeout(function () { active = true; }, 44000); // 44秒後に演出スタート
  function size() {
    var r = fx.getBoundingClientRect();
    W = Math.max(120, Math.round(r.width / SCALE));
    H = Math.max(80, Math.round(r.height / SCALE));
    fx.width = W; fx.height = H;
  }
  function px(x, y, c, a) { ctx.globalAlpha = a == null ? 1 : a; ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, 1, 1); }
  function firework() {
    var cx = 24 + Math.random() * (W - 48), cy = 8 + Math.random() * (H * 0.42);
    var col = COLORS[(Math.random() * 4) | 0], n = 22 + (Math.random() * 14 | 0);
    for (var i = 0; i < n; i++) {
      var a = (i / n) * 6.283, sp = 0.5 + Math.random() * 1.4;
      parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 28 + Math.random() * 22, col: col });
    }
  }
  function drawUfo(u) {
    var x = Math.round(u.x), y = Math.round(u.y), i;
    for (i = -6; i <= 6; i++) px(x + i, y + 1, "#5f7196", 0.95);
    for (i = -5; i <= 5; i++) px(x + i, y, "#8aa0c8", 0.95);
    for (i = -2; i <= 2; i++) px(x + i, y - 1, "#cfe0ff", 0.95);
    px(x - 1, y - 2, "#cfe0ff", 0.95); px(x, y - 2, "#cfe0ff", 0.95); px(x + 1, y - 2, "#cfe0ff", 0.95);
    var lc = COLORS[((u.t / 6) | 0) % 5];
    px(x - 4, y, lc, 1); px(x, y, lc, 1); px(x + 4, y, lc, 1);
    if ((u.t % 150) < 46) { for (var by = 2; by < 12; by++) { var w = Math.floor(by * 0.55); for (var bx = -w; bx <= w; bx++) px(x + bx, y + by, "#22d3ee", 0.12); } }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!active) { ctx.globalAlpha = 1; raf = requestAnimationFrame(draw); return; } // 44秒経過まで演出しない
    // 花火（間隔：約13〜23秒）
    fwT--; if (fwT < 0) { firework(); fwT = Math.floor(780 + Math.random() * 600); }
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life--;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      px(p.x, p.y, p.col, Math.min(1, p.life / 24));
    }
    // 流れ星
    shootT--; if (!shoot && shootT < 0) { shoot = { x: W * 0.45 + Math.random() * W * 0.55, y: Math.random() * H * 0.3 }; }
    if (shoot) {
      shoot.x -= 2.4; shoot.y += 1.2;
      for (var k = 0; k < 8; k++) px(shoot.x + k * 2, shoot.y - k, "#eaf0ff", 0.9 - k * 0.11);
      if (shoot.x < 0 || shoot.y > H * 0.6) { shoot = null; shootT = Math.floor(900 + Math.random() * 780); } // 間隔：約15〜28秒
    }
    // UFO（レア）
    ufoT--; if (!ufo && ufoT < 0) { ufo = { x: -16, y: 8 + Math.random() * H * 0.22, dir: 1, t: 0 }; if (Math.random() < 0.5) { ufo.x = W + 16; ufo.dir = -1; } }
    if (ufo) { ufo.x += 0.7 * ufo.dir; ufo.t++; drawUfo(ufo); if (ufo.x < -18 || ufo.x > W + 18) { ufo = null; ufoT = Math.floor(2700 + Math.random() * 3000); } } // 間隔：約45〜95秒
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  }
  var raf;
  // テスト用に手動発火も可能
  window.__fx = { fw: firework, ufo: function () { ufo = { x: -16, y: 12, dir: 1, t: 0 }; }, shoot: function () { shoot = { x: W * 0.8, y: 6 }; } };
  size();
  if (!reduce) raf = requestAnimationFrame(draw);
  var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(size, 200); });
})();

/* ===== 30秒 成長診断（紙芝居・BUPPANへ誘導） ===== */
(function () {
  var stage = document.getElementById("diagStage");
  var bar = document.getElementById("diagBar");
  if (!stage) return;

  var QUESTIONS = [
    { q: "いま、事業で一番モヤモヤしているのは？", opts: [
      { t: "集客・問い合わせが思うように増えない", w: 3 },
      { t: "広告やSNSにお金をかけているが手応えがない", w: 3 },
      { t: "新しい事業・商品をどう伸ばすか決めきれない", w: 3 },
      { t: "大きな不満はない。さらに上を目指したい", w: 1 } ] },
    { q: "広告やSNSの成果を“数字”で説明できますか？", opts: [
      { t: "ばっちり説明できる", w: 0 },
      { t: "なんとなくは分かる", w: 2 },
      { t: "正直わからない", w: 3 },
      { t: "そもそも計測していない", w: 3 } ] },
    { q: "“勝ち筋”（誰に・何を・どう売るか）は言語化されている？", opts: [
      { t: "明確にある", w: 0 },
      { t: "ある程度ある", w: 2 },
      { t: "感覚でやっている", w: 3 } ] },
    { q: "施策を実行しきる人手・ノウハウは社内に足りている？", opts: [
      { t: "十分ある", w: 0 },
      { t: "ぎりぎり回している", w: 2 },
      { t: "足りていない", w: 3 } ] },
    { q: "直近1年、売上は思い描いたペースで伸びている？", opts: [
      { t: "期待以上に伸びている", w: 1 },
      { t: "ほぼ想定どおり", w: 2 },
      { t: "伸び悩んでいる", w: 3 } ] },
    { q: "広告費・販促費は、根拠を持って配分できている？", opts: [
      { t: "根拠を持って配分している", w: 0 },
      { t: "一部は感覚で決めている", w: 2 },
      { t: "ほぼ感覚・前年踏襲", w: 3 } ] },
    { q: "『まだ伸ばせるはず』という手応えはありますか？", opts: [
      { t: "強くある", w: 3 },
      { t: "少しある", w: 2 },
      { t: "正直わからない", w: 3 } ] }
  ];
  var MAX = 21;
  var KEYS = ["A", "B", "C", "D", "E"];

  var RESULTS = [
    { min: 13, badge: "要相談・伸びしろ大", title: "いますぐ相談を。伸びしろが眠っています", accent: "pink",
      desc: "あなたの事業には、まだ活かしきれていない<b>伸びしろ</b>が眠っています。課題は明確——あとは“実行力”を掛け合わせるだけ。BUPPANは戦略設計から実行・数値改善まで<b>ワンチームで伴走</b>し、停滞を成長に変えます。まずは無料相談で、現状を一緒に整理しませんか？" },
    { min: 7, badge: "相談推奨", title: "“あと一段”を、プロの視点で引き上げる", accent: "cyan",
      desc: "事業は動いていますが、<b>“あと一段”の伸びしろ</b>があります。第三者の視点で勝ち筋を磨き、数字で改善を回せば成長は加速します。BUPPANが客観的な分析と実行支援で、その一段を引き上げます。" },
    { min: 0, badge: "壁が来たら相談を", title: "基盤は良好。“次の一手”は壁打ちが効く", accent: "lime",
      desc: "基盤はしっかり整っています。さらなる拡大や<b>ROASの最大化</b>、新規事業の立ち上げなど“次の一手”のフェーズでは、実績豊富なパートナーとの壁打ちが効きます。伸ばしきるための相談先として、BUPPANをご活用ください。" }
  ];

  var idx = 0, score = 0;

  function setBar(pct) { if (bar) bar.style.width = pct + "%"; }

  function esc(s) { return s; } // 静的文言のみ

  function renderIntro() {
    idx = 0; score = 0; setBar(0);
    stage.innerHTML =
      '<div class="diag-slide diag__center">' +
        '<p class="diag__lead">いまの事業に、あと何倍の伸びしろがある？<br>7つの質問で、あなたの“成長ポテンシャル”を診断します。</p>' +
        '<p class="diag__sub">所要 約30秒／回答はその場で表示されます</p>' +
        '<div class="diag__badges"><span class="diag__chip">集客・売上</span><span class="diag__chip">広告・SNS</span><span class="diag__chip">新規事業</span><span class="diag__chip">実行体制</span></div>' +
        '<button class="diag__btn" id="diagStart">診断をはじめる ▶</button>' +
      '</div>';
    var b = document.getElementById("diagStart");
    if (b) b.addEventListener("click", function () { idx = 0; score = 0; renderQuestion(); });
  }

  function renderQuestion() {
    var Q = QUESTIONS[idx];
    setBar(Math.round(idx / QUESTIONS.length * 100));
    var html = '<div class="diag-slide">' +
      '<p class="diag__meta">Q' + (idx + 1) + ' / ' + QUESTIONS.length + '</p>' +
      '<p class="diag__q">' + Q.q + '</p>' +
      '<div class="diag__opts">';
    for (var i = 0; i < Q.opts.length; i++) {
      html += '<button class="diag-opt" data-w="' + Q.opts[i].w + '">' +
        '<span class="diag-opt__key">' + KEYS[i] + '</span><span>' + Q.opts[i].t + '</span></button>';
    }
    html += '</div></div>';
    stage.innerHTML = html;
    var btns = stage.querySelectorAll(".diag-opt");
    for (var k = 0; k < btns.length; k++) {
      btns[k].addEventListener("click", function () {
        score += parseInt(this.getAttribute("data-w"), 10) || 0;
        idx++;
        if (idx < QUESTIONS.length) renderQuestion(); else renderResult();
      });
    }
  }

  function renderResult() {
    setBar(100);
    var r = RESULTS[0];
    for (var i = 0; i < RESULTS.length; i++) { if (score >= RESULTS[i].min) { r = RESULTS[i]; break; } }
    var pct = Math.round(score / MAX * 100);
    var diag = document.getElementById("diag");
    if (diag) diag.setAttribute("data-accent", r.accent);
    stage.innerHTML =
      '<div class="diag-slide diag__center">' +
        '<p class="diag-res__eyebrow">RESULT</p>' +
        '<div class="diag-res__score">' + pct + '<small>/100 伸びしろ</small></div>' +
        '<div class="diag-res__meter"><i style="width:' + pct + '%"></i></div>' +
        '<span class="diag-res__badge">' + r.badge + '</span>' +
        '<h3 class="diag-res__title">' + r.title + '</h3>' +
        '<p class="diag-res__desc">' + r.desc + '</p>' +
        '<div class="diag-res__actions">' +
          '<a class="diag__btn" href="#contact">無料で相談する ▶</a>' +
          '<button class="diag__btn diag__btn--ghost" id="diagRetry">もう一度診断する</button>' +
        '</div>' +
      '</div>';
    var rt = document.getElementById("diagRetry");
    if (rt) rt.addEventListener("click", function () {
      if (diag) diag.setAttribute("data-accent", "cyan");
      renderIntro();
    });
  }

  renderIntro();
})();
