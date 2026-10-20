/*
 * Background motion: slow, flowing silk ribbons drawn on a fixed canvas.
 * - Follows Chirpy light/dark mode (html[data-mode] or OS preference)
 * - Static single frame when the user prefers reduced motion
 * - Pauses while the tab is hidden, capped at ~30fps
 */
(function () {
  if (document.getElementById("bg-motion")) return;

  var canvas = document.createElement("canvas");
  canvas.id = "bg-motion";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  /* 리본 정의: 세로 위치(비율), 진폭, 파장, 속도, 색상 */
  var RIBBONS = [
    { y: 0.30, amp: 0.10, freq: 1.6, speed: 0.11, phase: 0.0, light: [64, 112, 224], dark: [120, 160, 255] },
    { y: 0.58, amp: 0.13, freq: 1.1, speed: 0.08, phase: 2.1, light: [132, 96, 220], dark: [178, 140, 255] },
    { y: 0.82, amp: 0.08, freq: 2.0, speed: 0.13, phase: 4.2, light: [40, 160, 180], dark: [90, 210, 220] }
  ];

  var W = 0, H = 0, dpr = 1, lines = 22, step = 10;
  var isDark = false;
  var rafId = null, last = 0, time = 0;

  function detectDark() {
    var mode = document.documentElement.getAttribute("data-mode");
    if (mode === "dark") return true;
    if (mode === "light") return false;
    return darkQuery.matches;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var small = W < 768;
    lines = small ? 14 : 22;
    step = small ? 14 : 10;
  }

  function drawRibbon(r, t) {
    var rgb = isDark ? r.dark : r.light;
    var maxAlpha = isDark ? 0.16 : 0.11;
    var baseY = H * r.y;
    var amp = H * r.amp;
    var k = (r.freq * Math.PI * 2) / Math.max(W, 1);
    var spread = Math.min(H * 0.09, 70);

    for (var i = 0; i < lines; i++) {
      var u = i / (lines - 1);              // 0..1 across the ribbon
      var edge = Math.sin(u * Math.PI);     // fade at both edges
      var twist = Math.sin(t * 0.25 + r.phase + u * 2.4);

      ctx.strokeStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + (maxAlpha * (0.25 + 0.75 * edge)).toFixed(3) + ")";
      ctx.beginPath();

      for (var x = -step; x <= W + step; x += step) {
        var y = baseY +
          amp * Math.sin(x * k + t * r.speed * 6 + r.phase + u * 0.9) +
          amp * 0.35 * Math.sin(x * k * 2.3 - t * r.speed * 4 + r.phase * 1.7) +
          (u - 0.5) * spread * (0.6 + 0.4 * twist);
        if (x === -step) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (var i = 0; i < RIBBONS.length; i++) drawRibbon(RIBBONS[i], time);
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (now - last < 33) return;            // ~30fps
    var dt = last ? Math.min(now - last, 100) : 16;
    last = now;
    time += dt / 1000;
    render();
  }

  function start() {
    stop();
    if (reduceMotion.matches) {
      time = 8;
      render();
      return;
    }
    last = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function refreshTheme() {
    isDark = detectDark();
    if (!rafId) render();
  }

  resize();
  isDark = detectDark();
  start();

  window.addEventListener("resize", function () {
    resize();
    if (!rafId) render();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  /* Chirpy 테마 토글은 <html data-mode>를 바꿈 */
  new MutationObserver(refreshTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-mode"]
  });
  if (darkQuery.addEventListener) darkQuery.addEventListener("change", refreshTheme);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", start);
})();
