(function () {
  "use strict";

  // ---------- Anonymous session + event tracking ----------
  function makeSessionId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
  var sessionId;
  try {
    sessionId = sessionStorage.getItem("sid");
    if (!sessionId) { sessionId = makeSessionId(); sessionStorage.setItem("sid", sessionId); }
  } catch (e) { sessionId = makeSessionId(); }

  function track(eventName) {
    try {
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: eventName, sessionId: sessionId, timestamp: new Date().toISOString() }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Screens ----------
  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(function (s) { s.classList.remove("active"); });
    $(id).classList.add("active");
  }

  // ---------- Typing ----------
  async function typeInto(el, text, speed) {
    el.textContent = "";
    for (var i = 0; i < text.length; i++) {
      el.textContent += text[i];
      await sleep(reduceMotion ? 0 : speed);
    }
  }

  // ---------- Boot sequence ----------
  async function boot() {
    track("page_opened");
    var steps = [
      "Initializing...",
      "Loading encrypted message...",
      "Searching database...",
      "Special person detected ❤️",
      "Preparing a message..."
    ];
    var log = $("bootLog");
    for (var i = 0; i < steps.length; i++) {
      var row = document.createElement("div");
      row.className = "row cursor" + (i === 3 ? " special" : "");
      row.textContent = "> ";
      log.appendChild(row);
      var span = document.createElement("span");
      row.appendChild(span);
      await typeInto(span, steps[i], 32);
      $("bootBar").style.width = ((i + 1) / steps.length * 100) + "%";
      await sleep(i === 3 ? 900 : 450);
      row.classList.remove("cursor");
    }
    await sleep(600);
    showScreen("proposal");
    await revealProposal();
  }

  // ---------- Proposal reveal ----------
  var revealToken = 0;
  async function revealProposal() {
    var token = ++revealToken;
    ["l1", "l2", "l3", "l4", "l5"].forEach(function (id) { $(id).classList.remove("show"); });
    await sleep(700);
    await typeInto($("sysTag"), "SYSTEM MESSAGE", 55);
    var ids = ["l1", "l2", "l3", "l4", "l5"];
    for (var i = 0; i < ids.length; i++) {
      if (token !== revealToken) return;
      $(ids[i]).classList.add("show");
      await sleep(reduceMotion ? 0 : [2600, 1800, 2800, 1400, 0][i]);
    }
  }

  // ---------- Buttons ----------
  var answered = false;
  $("yesBtn").addEventListener("click", function () {
    if (answered) return;
    answered = true;
    track("yes_clicked");
    celebrate();
    setTimeout(function () { showScreen("yes"); }, 500);
  });
  $("maybeBtn").addEventListener("click", function () {
    track("maybe_clicked");
    showScreen("maybe");
  });
  $("backBtn").addEventListener("click", function () {
    showScreen("proposal");
    ["l1", "l2", "l3", "l4", "l5"].forEach(function (id) { $(id).classList.add("show"); });
  });

  // ---------- Background particles ----------
  var bg = $("bg"), bctx = bg.getContext("2d"), W, H, dots = [];
  function resize() {
    W = bg.width = $("fx").width = window.innerWidth;
    H = bg.height = $("fx").height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();
  var count = Math.min(70, Math.floor(window.innerWidth / 18));
  for (var i = 0; i < count; i++) {
    dots.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 1.6 + .4, pink: Math.random() < .35 });
  }
  var hearts = [];
  function drawHeart(ctx, x, y, s, color, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.globalAlpha = alpha; ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.bezierCurveTo(-5, -2, -10, 3, 0, 11);
    ctx.bezierCurveTo(10, 3, 5, -2, 0, 3);
    ctx.fill();
    ctx.restore();
  }
  function loopBg() {
    bctx.clearRect(0, 0, W, H);
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      d.x += d.vx; d.y += d.vy;
      if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
      if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
      bctx.beginPath();
      bctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      bctx.fillStyle = d.pink ? "rgba(255,61,129,.7)" : "rgba(70,230,255,.6)";
      bctx.fill();
      for (var j = i + 1; j < dots.length; j++) {
        var e = dots[j], dx = d.x - e.x, dy = d.y - e.y, dist = dx * dx + dy * dy;
        if (dist < 9000) {
          bctx.strokeStyle = "rgba(160,140,255," + (0.12 * (1 - dist / 9000)) + ")";
          bctx.lineWidth = 1;
          bctx.beginPath(); bctx.moveTo(d.x, d.y); bctx.lineTo(e.x, e.y); bctx.stroke();
        }
      }
    }
    // slow floating hearts
    if (!reduceMotion && Math.random() < .015) {
      hearts.push({ x: Math.random() * W, y: H + 20, s: .8 + Math.random() * 1.2, v: .4 + Math.random() * .6, a: .35 });
    }
    for (var k = hearts.length - 1; k >= 0; k--) {
      var h = hearts[k];
      h.y -= h.v; h.x += Math.sin(h.y / 40) * .4;
      drawHeart(bctx, h.x, h.y, h.s, "#ff3d81", h.a * Math.min(1, h.y / (H * .5)));
      if (h.y < -20) hearts.splice(k, 1);
    }
    requestAnimationFrame(loopBg);
  }
  loopBg();

  // ---------- Celebration (hearts + confetti) ----------
  function celebrate() {
    var fx = $("fx"), ctx = fx.getContext("2d");
    var colors = ["#ff3d81", "#ff8fb8", "#46e6ff", "#ffffff", "#ffd166", "#b69cff"];
    var parts = [];
    var n = reduceMotion ? 40 : 170;
    for (var i = 0; i < n; i++) {
      var side = i % 2 ? 1 : -1;
      parts.push({
        x: W / 2, y: H * .55,
        vx: (Math.random() * 9 + 2) * side * (Math.random() < .5 ? 1 : -1) + (Math.random() - .5) * 6,
        vy: -(Math.random() * 14 + 5),
        g: .25 + Math.random() * .1,
        s: .6 + Math.random() * 1.1,
        c: colors[Math.floor(Math.random() * colors.length)],
        heart: Math.random() < .55,
        rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
        life: 1
      });
    }
    var frames = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      frames++;
      parts.forEach(function (p) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.rot += p.vr;
        if (frames > 150) p.life -= .02;
        if (p.life <= 0) return;
        if (p.heart) { drawHeart(ctx, p.x, p.y, p.s * 1.4, p.c, Math.max(p.life, 0)); }
        else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.globalAlpha = Math.max(p.life, 0); ctx.fillStyle = p.c;
          ctx.fillRect(-4 * p.s, -2 * p.s, 8 * p.s, 4 * p.s);
          ctx.restore();
        }
      });
      if (frames < 260) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    })();
  }

  boot();
})();
