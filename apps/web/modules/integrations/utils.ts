import {
  HTML_SCRIPT,
  type IntegrationId,
  JAVASCRIPT_SCRIPT,
  NEXTJS_SCRIPT,
  REACT_SCRIPT,
} from "./constants";

const LOCAL_WIDGET_URL = "http://localhost:3001";

export const getDynamicWidgetUrl = () => {
  if (process.env.NEXT_PUBLIC_WIDGET_URL) {
    return process.env.NEXT_PUBLIC_WIDGET_URL;
  }

  if (typeof window === "undefined") {
    return LOCAL_WIDGET_URL;
  }

  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_WIDGET_URL;
  }

  // Handle zephyrapp.it.com and its subdomains
  if (hostname === "zephyrapp.it.com" || hostname.endsWith(".zephyrapp.it.com")) {
    return "https://nexa-widget.vercel.app";
  }

  // Handle Vercel deployments
  if (hostname.endsWith(".vercel.app")) {
    return "https://nexa-widget.vercel.app";
  }

  const cleanDomain = hostname.replace(/^app\./, "");
  return `https://widget.${cleanDomain}`;
};

export const getConvexDeploymentUrl = () => {
  return process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
};

export const isProductionHost = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const hostname = window.location.hostname;
  return hostname !== "localhost" && hostname !== "127.0.0.1";
};

export const createScript = (
  integrationId: IntegrationId,
  organizationId: string,
) => {
  const dynamicUrl = getDynamicWidgetUrl();
  const buildTimeWidgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || LOCAL_WIDGET_URL;

  const replaceUrl = (scriptText: string) => {
    let result = scriptText.replace(/{{ORGANIZATION_ID}}/g, organizationId);
    result = result.replaceAll(buildTimeWidgetUrl, dynamicUrl);
    result = result.replaceAll(LOCAL_WIDGET_URL, dynamicUrl);
    result = result.replace(/([^:]\/)\/+/g, "$1");
    return result;
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
