import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";
import { SUPPORT_AGENT_PROMPT } from "../constants";
import { openai } from "@ai-sdk/openai";
import { search } from "../tools/search";
import { resolveConversation } from "../tools/resolveConversation";
import { escalateConversation } from "../tools/escalateConversation";
import { lookupShopifyOrder } from "../tools/lookupShopifyOrder";

export const supportAgent = new Agent(components.agent, {
  chat: openai("gpt-4o-mini"),
  instructions: SUPPORT_AGENT_PROMPT,
  tools: {
    search,
    resolveConversation,
    escalateConversation,
    lookupShopifyOrder,
  }
});
