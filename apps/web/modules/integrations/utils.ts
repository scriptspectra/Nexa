import {
  HTML_SCRIPT,
  type IntegrationId,
  JAVASCRIPT_SCRIPT,
  NEXTJS_SCRIPT,
  REACT_SCRIPT,
} from "./constants";

export const getDynamicWidgetUrl = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:3001";
  }

  const hostname = window.location.hostname;

  // Local development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3001";
  }

  // Vercel deployment default URL
  if (hostname.endsWith(".vercel.app")) {
    return process.env.NEXT_PUBLIC_WIDGET_URL || "https://Zephyra-widget.vercel.app";
  }

  // Custom domain (e.g. app.zephyrapp.it.com or zephyrapp.it.com)
  // Strips "app." if present and prefixes with "widget."
  const cleanDomain = hostname.replace(/^app\./, "");
  return `https://widget.${cleanDomain}`;
};

export const createScript = (
  integrationId: IntegrationId,
  organizationId: string,
) => {
  const dynamicUrl = getDynamicWidgetUrl();
  const buildTimeWidgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || "http://localhost:3001";

  const replaceUrl = (scriptText: string) => {
    let res = scriptText.replace(/{{ORGANIZATION_ID}}/g, organizationId);
    // Replace build-time fallback URL with dynamic host
    res = res.replaceAll(buildTimeWidgetUrl, dynamicUrl);
    // Normalize any double slashes (e.g., //widget.js -> /widget.js)
    res = res.replace(/([^:]\/)\/+/g, "$1");
    return res;
  };

  if (integrationId === "html") {
    return replaceUrl(HTML_SCRIPT);
  }
  if (integrationId === "react") {
    return replaceUrl(REACT_SCRIPT);
  }
  if (integrationId === "nextjs") {
    return replaceUrl(NEXTJS_SCRIPT);
  }
  if (integrationId === "javascript") {
    return replaceUrl(JAVASCRIPT_SCRIPT);
  }

  return "";
};
