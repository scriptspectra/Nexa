import { OAuthProvider, OAuthTokenResult } from "../base/OAuthProvider";

export class MetaOAuthProvider implements OAuthProvider {
  private appId: string;
  private appSecret: string;
  private apiVersion = "v20.0";

  constructor() {
    this.appId = process.env.META_APP_ID || "";
    this.appSecret = process.env.META_APP_SECRET || "";
    
    if (!this.appId || !this.appSecret) {
      console.warn("Missing META_APP_ID or META_APP_SECRET environment variables");
    }
  }

  async getAuthorizationUrl(state: string, redirectUri: string): Promise<string> {
    const scopes = [
      "pages_show_list",
      "pages_messaging",
      "pages_read_engagement",
      "pages_manage_metadata",
      "instagram_basic",
      "instagram_manage_messages",
      "whatsapp_business_messaging",
      "whatsapp_business_management",
    ].join(",");

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?client_id=${this.appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}&response_type=code`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResult> {
    // 1. Exchange code for short-lived token
    const tokenUrl = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?client_id=${this.appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${this.appSecret}&code=${encodeURIComponent(code)}`;

    const response = await fetch(tokenUrl);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    }

    const data = await response.json();
    const shortLivedToken = data.access_token;

    if (!shortLivedToken) {
      throw new Error("No access_token returned from Meta");
    }

    // 2. Exchange short-lived token for long-lived token
    const longLivedTokenUrl = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${encodeURIComponent(
      shortLivedToken
    )}`;

    const longLivedResponse = await fetch(longLivedTokenUrl);
    if (!longLivedResponse.ok) {
      const errorText = await longLivedResponse.text();
      throw new Error(`Failed to get long-lived token: ${errorText}`);
    }

    const longLivedData = await longLivedResponse.json();

    return {
      accessToken: longLivedData.access_token,
      expiresIn: longLivedData.expires_in, // typically ~60 days
      raw: longLivedData,
    };
  }
}
