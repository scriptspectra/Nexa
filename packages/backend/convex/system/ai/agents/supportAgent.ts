import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";
import { SUPPORT_AGENT_PROMPT } from "../constants";
import { openai } from "@ai-sdk/openai";

export const supportAgent = new Agent(components.agent, {
  chat: openai("gpt-4o-mini"),
  instructions: SUPPORT_AGENT_PROMPT,
});
