import { IChannelAdapter } from "./types";
import { WidgetAdapter } from "../widget/WidgetAdapter";
import { MessengerAdapter } from "../messenger/MessengerAdapter";
import { InstagramAdapter } from "../instagram/InstagramAdapter";
import { WhatsAppAdapter } from "../whatsapp/WhatsAppAdapter";

export interface RegisteredAdapter {
  id: string; // e.g., 'whatsapp', 'widget', 'messenger'
  adapter: IChannelAdapter;
}

class Registry {
  private adapters: Map<string, IChannelAdapter> = new Map();

  /**
   * Registers a channel adapter.
   */
  public register(config: RegisteredAdapter) {
    if (this.adapters.has(config.id)) {
      console.warn(`Adapter for ${config.id} is already registered. Overwriting.`);
    }
    this.adapters.set(config.id, config.adapter);
  }

  /**
   * Retrieves an adapter by its ID.
   */
  public getAdapter(id: string): IChannelAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new Error(`No channel adapter registered for ID: ${id}`);
    }
    return adapter;
  }

  /**
   * Returns all registered adapters.
   */
  public getAllAdapters(): Map<string, IChannelAdapter> {
    return this.adapters;
  }
}

export const ChannelRegistry = new Registry();

// Auto-register built-in adapters
ChannelRegistry.register({
  id: "widget",
  adapter: new WidgetAdapter()
});

ChannelRegistry.register({
  id: "messenger",
  adapter: new MessengerAdapter()
});

ChannelRegistry.register({
  id: "instagram",
  adapter: new InstagramAdapter()
});

ChannelRegistry.register({
  id: "whatsapp",
  adapter: new WhatsAppAdapter()
});
