(function () {
  "use strict";
  if (window.__amtSupportWidgetLoaded) return;
  window.__amtSupportWidgetLoaded = true;

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    return s[s.length - 1];
  })();

  var config = window.AMTSupport || {};
  var origin =
    config.origin ||
    script.getAttribute("data-origin") ||
    (script.src ? new URL(script.src).origin : "");
  var url = origin.replace(/\/$/, "") + "/widget/suporte";
  var primary = config.color || script.getAttribute("data-color") || "#6366f1";
  var label = config.label || script.getAttribute("data-label") || "Suporte";
  var position = config.position || script.getAttribute("data-position") || "right";
  var side = position === "left" ? "left" : "right";

  var css =
    ".amt-sup-btn{position:fixed;bottom:24px;" + side + ":24px;z-index:2147483000;" +
    "width:56px;height:56px;border-radius:9999px;border:0;cursor:pointer;" +
    "background:" + primary + ";color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.25);" +
    "display:flex;align-items:center;justify-content:center;transition:transform .2s ease;}" +
    ".amt-sup-btn:hover{transform:scale(1.06);}" +
    ".amt-sup-btn svg{width:26px;height:26px;}" +
    ".amt-sup-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;" +
    "border-radius:9999px;min-width:18px;height:18px;font-size:11px;font-weight:700;" +
    "display:none;align-items:center;justify-content:center;padding:0 5px;}" +
    ".amt-sup-panel{position:fixed;bottom:96px;" + side + ":24px;z-index:2147483000;" +
    "width:min(400px,calc(100vw - 32px));height:min(640px,calc(100vh - 128px));" +
    "border-radius:16px;overflow:hidden;background:#0b0b0f;" +
    "box-shadow:0 20px 60px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);" +
    "transform:translateY(20px) scale(.98);opacity:0;pointer-events:none;transition:all .2s ease;}" +
    ".amt-sup-panel.open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto;}" +
    ".amt-sup-panel iframe{width:100%;height:100%;border:0;display:block;background:transparent;}" +
    "@media (max-width:480px){.amt-sup-panel{" + side + ":16px;bottom:88px;height:calc(100vh - 112px);}}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement("button");
  btn.className = "amt-sup-btn";
  btn.setAttribute("aria-label", label);
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
    '<span class="amt-sup-badge" id="amt-sup-badge">0</span>';

  var panel = document.createElement("div");
  panel.className = "amt-sup-panel";
  var iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Central de Suporte");
  iframe.setAttribute("allow", "clipboard-write");
  panel.appendChild(iframe);

  var opened = false;
  btn.addEventListener("click", function () {
    opened = !opened;
    if (opened && !iframe.src) iframe.src = url;
    panel.classList.toggle("open", opened);
  });

  function mount() {
    document.body.appendChild(btn);
    document.body.appendChild(panel);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  window.AMTSupportWidget = {
    open: function () {
      opened = true;
      if (!iframe.src) iframe.src = url;
      panel.classList.add("open");
    },
    close: function () {
      opened = false;
      panel.classList.remove("open");
    },
    toggle: function () {
      btn.click();
    },
  };
})();
