/* BUPPAN renewal */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- ヘッダー：スクロールでガラス化 ---------- */
  var hd = document.getElementById("hd");
  function onScroll() { hd.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- SPメニュー ---------- */
  var menuBtn = document.getElementById("menuBtn"), nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  }
  menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* ---------- 出現アニメ（同じ親の中で少しずつずらす） ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) {
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains("reveal"); });
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 5) * 0.08 + "s");
    io.observe(el);
  });

  /* ---------- 数字カウントアップ ---------- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, end = +el.dataset.count, sep = el.hasAttribute("data-sep");
      var fmt = function (n) { return sep ? n.toLocaleString("ja-JP") : String(n); };
      if (reduce) { el.textContent = fmt(end); return; }
      var t0 = performance.now(), dur = 1600;
      (function tick(t) {
        var p = Math.min((t - t0) / dur, 1);
        el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 4))));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll("[data-count]").forEach(function (el) { cio.observe(el); });

  /* ---------- カードの光をカーソルに追従 ---------- */
  document.querySelectorAll(".glow").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------- ヒーロー：光るキューブが積み上がりの先から舞い上がる ---------- */
  var cv = document.getElementById("heroFx");
  if (cv && !reduce) {
    var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = 1, parts = [], running = true;
    var COLORS = ["34,211,238", "255,45,149", "198,245,66"];
    var size = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // 生まれる場所＝画像の「階段の頂上」あたり（PCは右寄り、SPは縦長画像の中央上）
    var spawn = function (p, init) {
      var sp = W <= 640;
      p.x = W * (sp ? 0.55 + Math.random() * 0.35 : 0.72 + Math.random() * 0.14); // 背景を右へ16%ずらした分に合わせる
      p.y = H * (sp ? 0.3 + Math.random() * 0.2 : 0.3 + Math.random() * 0.25);
      if (init) p.y -= Math.random() * H * 0.3;
      p.vx = (Math.random() * 0.25 + 0.05) * (sp ? 0.6 : 1);
      p.vy = -(Math.random() * 0.45 + 0.15);
      p.s = Math.random() * 5 + 2;
      p.c = COLORS[(Math.random() * 3) | 0];
      p.life = 0; p.max = 300 + Math.random() * 300;
      p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 0.02;
      return p;
    };
    size();
    for (var i = 0; i < (W <= 640 ? 26 : 44); i++) parts.push(spawn({}, true));
    var draw = function () {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        p.life++; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        var t = p.life / p.max, a = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        if (t >= 1 || p.y < -20) { spawn(p); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = "rgba(" + p.c + "," + (a * 0.18) + ")"; ctx.fillRect(-p.s * 1.6, -p.s * 1.6, p.s * 3.2, p.s * 3.2);
        ctx.fillStyle = "rgba(" + p.c + "," + (a * 0.9) + ")"; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
        ctx.restore();
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    // 画面外では止めて負荷を下げる
    new IntersectionObserver(function (e) {
      var v = e[0].isIntersecting;
      if (v && !running) { running = true; requestAnimationFrame(draw); } else if (!v) running = false;
    }).observe(cv);
    var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(size, 200); });
  }

  /* ---------- ヒーロー動画（画面幅で横長/縦長を選び、再生できたら静止画から切り替え） ---------- */
  var hv = document.getElementById("heroVideo");
  if (hv && !reduce) {
    hv.src = window.innerWidth <= 640 ? hv.dataset.tall : hv.dataset.wide;
    hv.addEventListener("playing", function () { hv.classList.add("is-on"); if (cv) cv.style.opacity = ".6"; }, { once: true });
    var pr = hv.play(); if (pr && pr.catch) pr.catch(function () {});
  }

  /* ---------- 上部の読了バー・見出し背景文字の横流れ ---------- */
  var bar = document.getElementById("progress");
  var words = document.querySelectorAll(".sec__hd[data-word]");
  /* 実績：PCは縦スクロールで横に流す */
  var wsec = document.getElementById("works"), wtrack = document.getElementById("worksTrack");
  var pinOn = false, pinDist = 0;
  function setupPin() {
    pinOn = window.innerWidth > 900 && !reduce;
    wsec.classList.toggle("is-pin", pinOn);
    wtrack.style.transform = "";
    if (!pinOn) return;
    pinDist = Math.max(0, wtrack.scrollWidth - window.innerWidth);
    wsec.style.setProperty("--pinh", window.innerHeight + pinDist + "px");
  }
  /* 進め方：スクロールに合わせて線が伸びる */
  var steps = document.getElementById("steps"), stepLis = steps.querySelectorAll("li");
  /* 私たちについて：文字が順に点灯 */
  var st = document.getElementById("statement"), chs = [];
  if (st) {
    var txt = st.textContent, html = "", inHl = false;
    var brAt = st.innerHTML.replace(/<br[^>]*>/, "\n").indexOf("\n"); // 改行位置（PCのみ）を保持
    var plainBefore = brAt < 0 ? -1 : st.innerHTML.slice(0, brAt).replace(/<[^>]+>/g, "").length;
    for (var c = 0; c < txt.length; c++) {
      var ch = txt[c];
      if (c === plainBefore) html += '<br class="pc">';
      if (ch === "「" && txt.substr(c, 4) === "「成長」") inHl = true;
      html += '<span class="ch' + (inHl ? " hl" : "") + '">' + ch + "</span>";
      if (inHl && ch === "」") inHl = false;
    }
    st.setAttribute("aria-label", txt);
    st.innerHTML = html;
    chs = st.querySelectorAll(".ch");
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function onScrollRich() {
    var y = window.scrollY, vh = window.innerHeight;
    bar.style.setProperty("--p", clamp01(y / (document.documentElement.scrollHeight - vh)));
    words.forEach(function (w) {
      var r = w.getBoundingClientRect();
      if (r.bottom > -200 && r.top < vh + 200) w.style.setProperty("--sx", ((vh - r.top) * 0.25).toFixed(1));
    });
    if (pinOn) {
      var top = wsec.getBoundingClientRect().top;
      wtrack.style.transform = "translate3d(" + (-clamp01(-top / pinDist) * pinDist).toFixed(1) + "px,0,0)";
    }
    var sr = steps.getBoundingClientRect(), sp = clamp01((vh * 0.75 - sr.top) / (sr.height + vh * 0.2));
    steps.style.setProperty("--p", sp.toFixed(3));
    stepLis.forEach(function (li, i) { li.classList.toggle("on", sp >= i / (stepLis.length - 1) - 0.02); });
    if (chs.length) {
      var tr = st.getBoundingClientRect(), tp = clamp01((vh * 0.85 - tr.top) / (tr.height + vh * 0.35));
      var n = Math.round(tp * chs.length);
      for (var k = 0; k < chs.length; k++) chs[k].classList.toggle("on", k < n);
    }
  }
  if (reduce) { chs.forEach && Array.prototype.forEach.call(chs, function (c) { c.classList.add("on"); }); }
  setupPin(); onScrollRich();
  var rafR = false;
  window.addEventListener("scroll", function () {
    if (rafR) return; rafR = true;
    requestAnimationFrame(function () { onScrollRich(); rafR = false; });
  }, { passive: true });
  var rzR; window.addEventListener("resize", function () { clearTimeout(rzR); rzR = setTimeout(function () { setupPin(); onScrollRich(); }, 200); });

  /* みなとみらいの線画：スマホは観覧車〜ランドマークタワーが収まる範囲を表示 */
  var mm = document.querySelector(".mm");
  // 枠の縦横比に合わせて表示範囲を決める（上下は切らず、狭いときは観覧車〜ランドマーク中心に左右だけ詰める）
  function mmView() {
    if (!mm || !mm.clientHeight) return;
    var vw = Math.min(1440, 330 * mm.clientWidth / mm.clientHeight);
    var cx = vw >= 1440 ? 720 : Math.min(Math.max(640, vw / 2), 1440 - vw / 2);
    mm.setAttribute("viewBox", (cx - vw / 2).toFixed(1) + " 0 " + vw.toFixed(1) + " 330");
  }
  mmView(); window.addEventListener("resize", mmView);

  /* 実績カードの棒グラフ：見えたら伸ばす */
  var wio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); wio.unobserve(e.target); } });
  }, { threshold: 0.3 });
  document.querySelectorAll(".work").forEach(function (w) { wio.observe(w); });

  /* 事業開発のブロックが順に積まれる */
  document.querySelectorAll(".viz--build i").forEach(function (b, i) { b.style.animationDelay = (i * 0.12) + "s"; });

  /* 選ばれる理由：カードがカーソルに傾く */
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", (x * 14).toFixed(1) + "deg");
        el.style.setProperty("--rx", (-y * 14).toFixed(1) + "deg");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ---------- SP追従CTA：ヒーローを過ぎたら表示、お問い合わせでは隠す ---------- */
  var fab = document.getElementById("fab");
  var heroOut = false, contactIn = false;
  function fabUpdate() { fab.classList.toggle("is-show", heroOut && !contactIn); }
  new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting; fabUpdate(); }).observe(document.querySelector(".hero"));
  new IntersectionObserver(function (e) { contactIn = e[0].isIntersecting; fabUpdate(); }).observe(document.getElementById("contact"));

  /* ---------- LINE：友だち追加URLはここ1か所に入れる（空のあいだはお申し込み欄へ案内） ---------- */
  var LINE_URL = "https://lin.ee/wdB9ZW5";
  document.querySelectorAll("[data-line]").forEach(function (a) {
    if (LINE_URL) { a.href = LINE_URL; return; }
    a.removeAttribute("target");
    a.href = "#contact";
  });

  /* ---------- 計測：GTMへ送るイベント（GTM側で「カスタムイベント」として拾う） ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(ev, data) { var o = { event: ev }; for (var k in data) o[k] = data[k]; window.dataLayer.push(o); }
  window.buppanTrack = track;
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a, button");
    if (!a) return;
    if (a.dataset.track) { track(a.dataset.track, { cta_location: a.dataset.loc || "" }); return; }
    var href = a.getAttribute("href") || "";
    if (href === "#offer" || href === "#contact") track("cta_click", { cta_text: a.textContent.trim().slice(0, 40), cta_target: href });
  });

  /* ---------- お問い合わせ：メール（mailto）か LINE（入力内容を入れた状態でトークを開く）で送る ---------- */
  var form = document.getElementById("contactForm");
  var CONTACT_MAIL = "buppan@caddie.co.jp";
  var LINE_OA_ID = "@499ymnku"; // LINE公式アカウントのID（lin.ee/wdB9ZW5 の転送先）
  var note = document.getElementById("formNote");
  function val(id) { return document.getElementById(id).value.trim(); }
  // 入力チェック（LINEで送る場合はメールアドレスを任意にする）
  function check(needEmail) {
    var bad = null;
    ["f-company", "f-name", "f-email"].forEach(function (id) {
      var el = document.getElementById(id);
      var empty = !el.value.trim();
      var ng = (id === "f-email" ? (needEmail && empty) || (!empty && !el.checkValidity()) : empty);
      el.setAttribute("aria-invalid", ng);
      if (ng && !bad) bad = el;
    });
    note.classList.add("is-err");
    if (bad) { note.textContent = needEmail ? "必須項目（会社名・ご担当者名・メールアドレス）をご確認ください。" : "会社名とご担当者名をご入力ください。"; bad.focus(); return false; }
    if (!document.getElementById("consent").checked) { note.textContent = "プライバシーポリシーへの同意が必要です。"; return false; }
    note.classList.remove("is-err");
    return true;
  }
  function body(nl, footer) {
    return [
      "【ネット健康診断・ご相談のお申し込み】",
      "ご相談の種別：" + val("f-type"),
      "会社名：" + val("f-company"),
      "ご担当者名：" + val("f-name"),
      "メールアドレス：" + (val("f-email") || "（未入力）"),
      "電話番号：" + (val("f-tel") || "（未入力）"),
      "",
      "▼ ご相談内容",
      val("f-message") || "（未入力）",
      "",
      footer
    ].join(nl);
  }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!check(true)) return;
    track("form_submit", { inquiry_type: val("f-type"), method: "mail" });
    note.textContent = "メールソフトを起動しました。内容をご確認のうえ送信してください。（起動しない場合は " + CONTACT_MAIL + " 宛にお送りください）";
    window.location.href = "mailto:" + CONTACT_MAIL + "?subject=" + encodeURIComponent("【BUPPAN】ネット健康診断・ご相談のお申し込み（" + val("f-company") + "）") + "&body=" + encodeURIComponent(body("\r\n", "※ BUPPAN LP のお問い合わせフォームから作成されたメールです。"));
  });
  document.getElementById("lineSend").addEventListener("click", function () {
    if (!check(false)) return;
    track("form_submit", { inquiry_type: val("f-type"), method: "line" });
    var url = "https://line.me/R/oaMessage/" + encodeURIComponent(LINE_OA_ID) + "/?" + encodeURIComponent(body("\n", "※ ホームページのフォームから送信しています。"));
    note.textContent = "LINEを開きました。入力内容が入った状態で表示されるので、そのまま送信してください。";
    window.open(url, "_blank", "noopener");
  });
})();

/* ===== 30秒 成長診断（どの結果でも相談へ誘導） ===== */
(function () {
  var stage = document.getElementById("diagStage");
  var bar = document.getElementById("diagBar");
  var box = document.getElementById("diag");
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
  var MAX = 21, KEYS = ["A", "B", "C", "D"];
  var RESULTS = [
    { min: 13, badge: "要相談・伸びしろ大", title: "いますぐ相談を。伸びしろが眠っています", accent: "pink",
      desc: "あなたの事業には、まだ活かしきれていない<b>伸びしろ</b>が眠っています。課題は明確——あとは“実行力”を掛け合わせるだけ。BUPPANは戦略設計から実行・数値改善まで<b>ワンチームで伴走</b>し、停滞を成長に変えます。" },
    { min: 7, badge: "相談推奨", title: "“あと一段”を、プロの視点で引き上げる", accent: "cyan",
      desc: "事業は動いていますが、<b>“あと一段”の伸びしろ</b>があります。第三者の視点で勝ち筋を磨き、数字で改善を回せば成長は加速します。BUPPANが客観的な分析と実行支援で、その一段を引き上げます。" },
    { min: 0, badge: "壁が来たら相談を", title: "基盤は良好。“次の一手”は壁打ちが効く", accent: "lime",
      desc: "基盤はしっかり整っています。さらなる拡大や<b>広告効果の最大化</b>、新規事業の立ち上げなど“次の一手”のフェーズでは、実績豊富なパートナーとの壁打ちが効きます。" }
  ];
  var idx = 0, score = 0;
  function setBar(p) { bar.style.width = p + "%"; }
  function setAccent(a) { box.setAttribute("data-accent", a); }

  function intro() {
    idx = 0; score = 0; setBar(0); setAccent("cyan");
    stage.innerHTML =
      '<div class="diag-slide diag__center">' +
        '<p class="diag-res__eyebrow">PRESS START</p>' +
        '<h2 class="diag__title">あなたの事業、<br>あと何倍伸びる？</h2>' +
        '<p class="diag__lead">7つの質問で、いまの事業に眠る“伸びしろ”を診断します。</p>' +
        '<p class="diag__sub">所要 約30秒／結果はその場で表示されます</p>' +
        '<div class="diag__badges"><span class="diag__chip">集客・売上</span><span class="diag__chip">広告・SNS</span><span class="diag__chip">新規事業</span><span class="diag__chip">実行体制</span></div>' +
        '<button class="diag__btn" type="button" data-act="start">診断をはじめる ▶</button>' +
      "</div>";
  }
  function question() {
    var Q = QUESTIONS[idx];
    setBar(Math.round(idx / QUESTIONS.length * 100));
    var html = '<div class="diag-slide"><p class="diag__meta">Q' + (idx + 1) + " / " + QUESTIONS.length + '</p><p class="diag__q">' + Q.q + '</p><div class="diag__opts">';
    Q.opts.forEach(function (o, i) {
      html += '<button class="diag-opt" type="button" data-w="' + o.w + '"><span class="diag-opt__key">' + KEYS[i] + "</span><span>" + o.t + "</span></button>";
    });
    stage.innerHTML = html + "</div></div>";
    var first = stage.querySelector(".diag-opt");
    if (first) first.focus({ preventScroll: true });
  }
  function result() {
    setBar(100);
    var r = RESULTS.filter(function (x) { return score >= x.min; })[0];
    var pct = Math.round(score / MAX * 100);
    setAccent(r.accent);
    if (window.buppanTrack) window.buppanTrack("self_check_complete", { score: pct, result: r.badge });
    stage.innerHTML =
      '<div class="diag-slide diag__center">' +
        '<p class="diag-res__eyebrow">RESULT</p>' +
        '<div class="diag-res__score">' + pct + "<small>/100 伸びしろ</small></div>" +
        '<div class="diag-res__meter"><i style="width:' + pct + '%"></i></div>' +
        '<span class="diag-res__badge">' + r.badge + "</span>" +
        '<h3 class="diag-res__title">' + r.title + "</h3>" +
        '<p class="diag-res__desc">' + r.desc + "</p>" +
        '<div class="diag-res__actions"><a class="diag__btn" href="#offer">無料でネット健康診断を受ける ▶</a>' +
        '<button class="diag__btn diag__btn--ghost" type="button" data-act="retry">もう一度診断する</button></div>' +
      "</div>";
  }
  stage.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.act === "start") { question(); return; }
    if (b.dataset.act === "retry") { intro(); return; }
    if (b.dataset.w != null) {
      score += +b.dataset.w;
      idx++;
      if (idx < QUESTIONS.length) question(); else result();
    }
  });
  intro();
})();
