export interface DiscoveredResource {
  externalResourceId: string;
  name: string;
  resourceType: string; // e.g. "facebook_page", "slack_channel"
  capabilities: any;    // e.g. { messaging: true, media: true }
  raw?: any;            // Provider-specific raw data
}

export interface IntegrationHealth {
  status: "healthy" | "reconnect_required" | "syncing" | "error";
  errorState?: string;
}

export interface IntegrationProvider {
  /**
   * Fetches the available resources for the integration using the provided access token.
   * e.g., fetching all Facebook Pages the user manages.
   */
  discoverResources(accessToken: string): Promise<DiscoveredResource[]>;

  /**
   * Registers webhooks or required subscriptions for the selected resources.
   * @param resources The list of resources the user has enabled.
   * @param accessToken The integration access token.
   */
  registerWebhooks(resources: DiscoveredResource[], accessToken: string): Promise<void>;

  /**
   * Checks the health of the integration (e.g., token validity, permission status).
   * @param accessToken The integration access token.
   */
  checkHealth(accessToken: string): Promise<IntegrationHealth>;

  /**
   * Refreshes metadata or capabilities of existing resources.
   * @param existingResources The currently saved resources.
   * @param accessToken The integration access token.
   */
  syncResources?(existingResources: any[], accessToken: string): Promise<DiscoveredResource[]>;
}
