(function () {
  "use strict";

  var DEFAULTS = {
    WIDGET_URL: "http://localhost:3001",
    DEFAULT_POSITION: "bottom-right",
  };

  var chatBubbleIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  var closeIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  (function () {
    var iframe = null;
    var container = null;
    var skeleton = null;
    var button = null;
    var isOpen = false;
    var iframeLoaded = false;

    var organizationId = null;
    var position = DEFAULTS.DEFAULT_POSITION;
    var widgetUrl = DEFAULTS.WIDGET_URL;

    function resolveWidgetUrl(script) {
      if (!script || !script.src) {
        return DEFAULTS.WIDGET_URL;
      }

      try {
        return new URL(script.src).origin;
      } catch (e) {
        console.error("Zephyra Widget: failed to parse script src", e);
        return DEFAULTS.WIDGET_URL;
      }
    }

    var currentScript = document.currentScript;
    if (currentScript) {
      organizationId = currentScript.getAttribute("data-organization-id");
      position =
        currentScript.getAttribute("data-position") || DEFAULTS.DEFAULT_POSITION;
      widgetUrl = resolveWidgetUrl(currentScript);
    } else {
      var scripts = document.querySelectorAll(
        'script[src*="widget"], script[src*="embed"]'
      );
      var embedScript = Array.from(scripts).find(function (s) {
        return s.hasAttribute("data-organization-id");
      });
      if (embedScript) {
        organizationId = embedScript.getAttribute("data-organization-id");
        position =
          embedScript.getAttribute("data-position") || DEFAULTS.DEFAULT_POSITION;
        widgetUrl = resolveWidgetUrl(embedScript);
      }
    }

    if (!organizationId) {
      console.error("Zephyra Widget: data-organization-id attribute is required");
      return;
    }

    // ─── Skeleton helpers ──────────────────────────────────────────────────────

    function injectSkeletonStyles() {
      if (document.getElementById("Zephyra-widget-styles")) return;
      var style = document.createElement("style");
      style.id = "Zephyra-widget-styles";
      style.textContent =
        "@keyframes Zephyra-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}" +
        ".Zephyra-sk{background:linear-gradient(90deg,#efefef 25%,#e0e0e0 50%,#efefef 75%);" +
        "background-size:1200px 100%;animation:Zephyra-shimmer 1.6s ease-in-out infinite;border-radius:8px;}";
      document.head.appendChild(style);
    }

    function makeSkeleton() {
      injectSkeletonStyles();

      var el = document.createElement("div");
      el.id = "Zephyra-widget-skeleton";
      el.style.cssText =
        "position:absolute;inset:0;background:#fff;border-radius:16px;" +
        "display:flex;flex-direction:column;z-index:1;overflow:hidden;" +
        "transition:opacity 0.35s ease;";

      // Header
      var hdr = document.createElement("div");
      hdr.style.cssText =
        "display:flex;align-items:center;gap:12px;padding:14px 16px;" +
        "border-bottom:1px solid #f0f0f0;background:#fafafa;flex-shrink:0;";
      hdr.innerHTML =
        '<div class="Zephyra-sk" style="width:38px;height:38px;border-radius:50%;flex-shrink:0;"></div>' +
        '<div style="flex:1;display:flex;flex-direction:column;gap:7px;">' +
        '<div class="Zephyra-sk" style="height:13px;width:55%;"></div>' +
        '<div class="Zephyra-sk" style="height:10px;width:38%;"></div>' +
        "</div>" +
        '<div class="Zephyra-sk" style="width:28px;height:28px;border-radius:6px;flex-shrink:0;"></div>';

      // Messages
      var msgs = document.createElement("div");
      msgs.style.cssText =
        "flex:1;padding:16px;display:flex;flex-direction:column;gap:14px;overflow:hidden;";

      function botMsg(lines) {
        var bubbles = lines
          .map(function (l) {
            return (
              '<div class="Zephyra-sk" style="height:' +
              (l.h || "34px") +
              ";width:" +
              l.w +
              ';border-radius:12px 12px 12px 3px;"></div>'
            );
          })
          .join("");
        return (
          '<div style="display:flex;align-items:flex-end;gap:8px;">' +
          '<div class="Zephyra-sk" style="width:30px;height:30px;border-radius:50%;flex-shrink:0;"></div>' +
          '<div style="display:flex;flex-direction:column;gap:5px;">' +
          bubbles +
          "</div></div>"
        );
      }

      function userMsg(w) {
        return (
          '<div style="display:flex;justify-content:flex-end;">' +
          '<div class="Zephyra-sk" style="height:34px;width:' +
          w +
          ';border-radius:12px 12px 3px 12px;"></div></div>'
        );
      }

      msgs.innerHTML =
        botMsg([{ w: "180px", h: "48px" }]) +
        userMsg("130px") +
        botMsg([{ w: "210px" }, { w: "150px", h: "28px" }]) +
        userMsg("100px") +
        botMsg([{ w: "190px", h: "42px" }]);

      // Input bar
      var inp = document.createElement("div");
      inp.style.cssText =
        "padding:12px 14px;border-top:1px solid #f0f0f0;background:#fafafa;" +
        "flex-shrink:0;display:flex;align-items:center;gap:10px;";
      inp.innerHTML =
        '<div class="Zephyra-sk" style="flex:1;height:40px;border-radius:10px;"></div>' +
        '<div class="Zephyra-sk" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;"></div>';

      el.appendChild(hdr);
      el.appendChild(msgs);
      el.appendChild(inp);
      return el;
    }

    function hideSkeleton() {
      if (!skeleton) return;
      skeleton.style.opacity = "0";
      skeleton.style.pointerEvents = "none";
      setTimeout(function () {
        if (skeleton) skeleton.style.display = "none";
      }, 380);
    }

    // ─── Core widget logic ─────────────────────────────────────────────────────

    function init() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", render);
      } else {
        render();
      }
    }

    function render() {
      // Floating action button
      button = document.createElement("button");
      button.id = "Zephyra-widget-button";
      button.innerHTML = chatBubbleIcon;
      button.style.cssText =
        "position:fixed;" +
        (position === "bottom-right" ? "right:20px;" : "left:20px;") +
        "bottom:20px;width:60px;height:60px;border-radius:50%;" +
        "background:#3b82f6;color:white;border:none;cursor:pointer;" +
        "z-index:999999;display:flex;align-items:center;justify-content:center;" +
        "box-shadow:0 4px 24px rgba(59,130,246,0.35);transition:all 0.2s ease;";

      button.addEventListener("click", toggleWidget);
      button.addEventListener("mouseenter", function () {
        if (button) button.style.transform = "scale(1.05)";
      });
      button.addEventListener("mouseleave", function () {
        if (button) button.style.transform = "scale(1)";
      });
      document.body.appendChild(button);

      // Container (hidden by default)
      container = document.createElement("div");
      container.id = "Zephyra-widget-container";
      container.style.cssText =
        "position:fixed;" +
        (position === "bottom-right" ? "right:20px;" : "left:20px;") +
        "bottom:90px;width:400px;height:600px;" +
        "max-width:calc(100vw - 40px);max-height:calc(100vh - 110px);" +
        "z-index:999998;border-radius:16px;overflow:hidden;" +
        "box-shadow:0 4px 24px rgba(0,0,0,0.15);" +
        "display:none;opacity:0;transform:translateY(10px);transition:all 0.3s ease;";

      // Iframe
      iframe = document.createElement("iframe");
      iframe.src = buildWidgetUrl();
      iframe.style.cssText = "width:100%;height:100%;border:none;display:block;";
      iframe.allow = "microphone; clipboard-read; clipboard-write";

      // Skeleton overlay
      skeleton = makeSkeleton();

      container.appendChild(iframe);
      container.appendChild(skeleton);
      document.body.appendChild(container);

      window.addEventListener("message", handleMessage);
    }

    function buildWidgetUrl() {
      var params = new URLSearchParams();
      params.append("organizationId", organizationId);
      return widgetUrl + "?" + params.toString();
    }

    function handleMessage(event) {
      try {
        if (event.origin !== new URL(widgetUrl).origin) return;
      } catch (e) {
        return;
      }
      var type = event.data && event.data.type;
      var payload = event.data && event.data.payload;
      if (type === "ready") {
        iframeLoaded = true;
        hideSkeleton();
      } else if (type === "close") {
        hide();
      } else if (type === "resize" && payload && payload.height && container) {
        container.style.height = payload.height + "px";
      }
    }

    function toggleWidget() {
      if (isOpen) {
        hide();
      } else {
        show();
      }
    }

    function show() {
      if (container && button) {
        isOpen = true;
        container.style.display = "block";
        // Re-show skeleton if iframe hasn't loaded yet
        if (!iframeLoaded && skeleton) {
          skeleton.style.display = "flex";
          skeleton.style.opacity = "1";
          skeleton.style.pointerEvents = "auto";
          setTimeout(function () {
            if (!iframeLoaded) hideSkeleton();
          }, 8000);
        }
        setTimeout(function () {
          if (container) {
            container.style.opacity = "1";
            container.style.transform = "translateY(0)";
          }
        }, 10);
        button.innerHTML = closeIcon;
      }
    }

    function hide() {
      if (container && button) {
        isOpen = false;
        container.style.opacity = "0";
        container.style.transform = "translateY(10px)";
        setTimeout(function () {
          if (container) container.style.display = "none";
        }, 300);
        button.innerHTML = chatBubbleIcon;
        button.style.background = "#3b82f6";
      }
    }

    function destroy() {
      window.removeEventListener("message", handleMessage);
      if (container) {
        container.remove();
        container = null;
        iframe = null;
        skeleton = null;
      }
      if (button) {
        button.remove();
        button = null;
      }
      isOpen = false;
      iframeLoaded = false;
    }

    function reinit(newConfig) {
      destroy();
      if (newConfig.organizationId) organizationId = newConfig.organizationId;
      if (newConfig.position) position = newConfig.position;
      init();
    }

    window.EchoWidget = {
      init: reinit,
      show: show,
      hide: hide,
      destroy: destroy,
    };

    init();
  })();
})();
