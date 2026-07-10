export interface OAuthTokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scopes?: string[];
  raw?: any;
}

export interface OAuthProvider {
  /**
   * Generates the authorization URL to redirect the user to.
   * @param state A secure state parameter to prevent CSRF and store context.
   * @param redirectUri The callback URL where the provider will send the authorization code.
   */
  getAuthorizationUrl(state: string, redirectUri: string): Promise<string>;

  /**
   * Exchanges an authorization code for an access token.
   * @param code The authorization code received from the callback.
   * @param redirectUri The redirect URI used in the initial request.
   */
  exchangeCodeForToken(code: string, redirectUri: string): Promise<OAuthTokenResult>;

  /**
   * Refreshes an expired access token (if the provider supports it).
   * @param refreshToken The refresh token.
   */
  refreshToken?(refreshToken: string): Promise<OAuthTokenResult>;
}
