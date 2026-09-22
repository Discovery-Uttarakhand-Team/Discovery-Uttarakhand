import Chat from '../models/Chat.js';
import SavedTrip from '../models/SavedTrip.js';
import { AiContextBuilder } from './aiContextBuilder.js';
import { AiPlannerService } from './aiPlannerService.js';

export class ChatService {
  /**
   * Retrieves or creates the system prompt incorporating the trip context.
   */
  static async buildSystemPrompt(tripId) {
    let tripContextText = 'No specific trip context provided. The user is planning a general trip to Uttarakhand.';
    
    if (tripId) {
      const savedTrip = await SavedTrip.findById(tripId)
        .populate('destinations')
        .populate('activities')
        .populate('stays');
      
      if (savedTrip) {
        const { context } = await AiContextBuilder.buildContext(savedTrip.toObject());
        tripContextText = `
CURRENT TRIP CONTEXT:
${JSON.stringify(context, null, 2)}
`;
      }
    }

    return `
You are the AI Travel Copilot for "Discovery Uttarakhand", a premium travel portal.
You act as a knowledgeable, friendly, and practical human travel guide for Uttarakhand.

CRITICAL NON-NEGOTIABLE GROUNDING RULES:
1. YOU MUST NEVER INVENT FACTS.
2. Do not invent hotel availability, exact prices (unless in context), road status, train/bus timings, or opening hours.
3. If information is unavailable, say so naturally without being robotic (e.g., "I don't have the live road status right now...").
4. Provide concise, practical, and conversational responses.
5. Do NOT return complex JSON schemas unless explicitly asked. Respond in readable text (markdown supported).

${tripContextText}
`;
  }

  /**
   * Sends a message to the AI provider and returns the response.
   */
  static async sendMessage(chatId, userId, content, tripId) {
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) throw new Error('Chat not found or access denied.');
    } else {
      // Create new chat
      const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
      chat = new Chat({ userId, tripId, title, messages: [] });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content,
      provenance: 'USER'
    });

    // Truncate history to last 10 messages for context window
    const recentMessages = chat.messages.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      content: m.content
    }));

    // Build prompt and get response
    const systemPrompt = await this.buildSystemPrompt(chat.tripId);
    
    // Use the existing provider abstraction
    const provider = AiPlannerService.getProvider(); // respects process.env.AI_PROVIDER
    
    try {
      const response = await provider.chat(systemPrompt, recentMessages, []);
      
      // Save assistant message
      chat.messages.push({
        role: 'assistant',
        content: response.text || 'I am sorry, I could not generate a response.',
        provenance: 'GROUNDED' // Extend this based on context usage in future
      });

      await chat.save();
      return chat;
    } catch (error) {
      console.error('[ChatService Error]', error);
      throw error;
    }
  }
}
