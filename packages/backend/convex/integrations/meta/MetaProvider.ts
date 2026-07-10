import { DiscoveredResource, IntegrationHealth, IntegrationProvider } from "../base/IntegrationProvider";

export class MetaProvider implements IntegrationProvider {
  private apiVersion = "v20.0";

  async discoverResources(accessToken: string): Promise<DiscoveredResource[]> {
    const resources: DiscoveredResource[] = [];

    // 1. Fetch User Accounts/Pages
    const pagesUrl = `https://graph.facebook.com/${this.apiVersion}/me/accounts?access_token=${encodeURIComponent(accessToken)}&fields=id,name,access_token,tasks,instagram_business_account`;
    
    const pagesResponse = await fetch(pagesUrl);
    if (!pagesResponse.ok) {
      throw new Error(`Failed to fetch Meta Pages: ${await pagesResponse.text()}`);
    }

    const pagesData = await pagesResponse.json();

    for (const page of pagesData.data || []) {
      // Must have manage permissions
      if (!page.tasks || (!page.tasks.includes("MANAGE") && !page.tasks.includes("MESSAGING"))) {
        continue;
      }

      // Add Facebook Page
      resources.push({
        externalResourceId: page.id,
        name: page.name,
        resourceType: "facebook_page",
        capabilities: {
          messaging: true,
          media: true,
          reactions: true,
        },
        raw: {
          pageAccessToken: page.access_token,
        }
      });

      // Add Linked Instagram Account
      if (page.instagram_business_account) {
        // Fetch IG account details
        const igUrl = `https://graph.facebook.com/${this.apiVersion}/${page.instagram_business_account.id}?fields=id,username,name&access_token=${encodeURIComponent(page.access_token)}`;
        const igResponse = await fetch(igUrl);
        
        if (igResponse.ok) {
          const igData = await igResponse.json();
          resources.push({
            externalResourceId: igData.id,
            name: igData.username || igData.name || `Instagram (${igData.id})`,
            resourceType: "instagram_account",
            capabilities: {
              messaging: true,
              media: true,
              reactions: true,
              story_mentions: true,
            },
            raw: {
              pageId: page.id,
              pageAccessToken: page.access_token,
            }
          });
        }
      }
    }

    // 2. Fetch WhatsApp Business Accounts
    // For WhatsApp, we typically need to query the WhatsApp Business Accounts associated with the user's business manager.
    // This is more complex in the Graph API, so we'll leave a placeholder/basic check here.
    const wabaUrl = `https://graph.facebook.com/${this.apiVersion}/me/businesses?access_token=${encodeURIComponent(accessToken)}`;
    const wabaResponse = await fetch(wabaUrl);
    
    // In a real implementation, we would iterate over businesses, find owned_whatsapp_business_accounts, 
    // and then fetch phone numbers for each.

    return resources;
  }

  async registerWebhooks(resources: DiscoveredResource[], accessToken: string): Promise<void> {
    // For Facebook Pages and Instagram, we need to subscribe the Page to our App's Webhook
    for (const resource of resources) {
      if (resource.resourceType === "facebook_page" || resource.resourceType === "instagram_account") {
        const pageId = resource.resourceType === "facebook_page" ? resource.externalResourceId : resource.raw.pageId;
        const pageAccessToken = resource.raw.pageAccessToken;

        // Note: A single page subscription covers both FB Messenger and IG Direct if the IG account is linked.
        const subscribeUrl = `https://graph.facebook.com/${this.apiVersion}/${pageId}/subscribed_apps?access_token=${encodeURIComponent(pageAccessToken)}&subscribed_fields=messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads,message_reactions`;
        
        try {
          const response = await fetch(subscribeUrl, { method: "POST" });
          if (!response.ok) {
            console.error(`Failed to subscribe webhook for page ${pageId}`, await response.text());
          }
        } catch (e) {
          console.error(`Error subscribing webhook for page ${pageId}`, e);
        }
      }
    }
  }

  async checkHealth(accessToken: string): Promise<IntegrationHealth> {
    try {
      // Validate the token by fetching user profile
      const validateUrl = `https://graph.facebook.com/${this.apiVersion}/me?access_token=${encodeURIComponent(accessToken)}`;
      const response = await fetch(validateUrl);

      if (response.ok) {
        return { status: "healthy" };
      }

      const errorData = await response.json();
      if (errorData.error && errorData.error.code === 190) {
        // Token expired or invalidated
        return { status: "reconnect_required", errorState: "Token expired or revoked" };
      }

      return { status: "error", errorState: errorData.error?.message || "Unknown error" };
    } catch (e: any) {
      return { status: "error", errorState: e.message };
    }
  }
}
