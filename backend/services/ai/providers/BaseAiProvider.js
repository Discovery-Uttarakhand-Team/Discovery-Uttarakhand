/**
 * Discovery Uttarakhand - Base AI Provider Abstract Class
 * Defines the standard contract for any LLM or fallback provider.
 * Phase 7 adds: chat() for conversational tool-calling agent.
 */

export class BaseAiProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Generates structured trip reasoning from bounded context.
   * Phase 2 AI Planner method - unchanged.
   */
  async generatePlan(context, options = {}) {
    throw new Error(`generatePlan() must be implemented by provider [${this.name}]`);
  }

  /**
   * Phase 7: Conversational tool-calling chat method.
   * @param {string} systemPrompt - Grounded system instruction
   * @param {Array} messages - Conversation history [{role, parts:[{text}]}]
   * @param {Array} toolSchemas - Available tool definitions
   * @returns {Promise<{ text: string|null, toolCall: {name, args}|null }>}
   */
  async chat(systemPrompt, messages, toolSchemas = []) {
    throw new Error(`chat() must be implemented by provider [${this.name}]`);
  }

  /**
   * Health check for the provider
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    return true;
  }
}