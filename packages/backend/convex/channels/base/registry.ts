import { IChannelAdapter } from "./types";

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
