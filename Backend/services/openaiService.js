const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class OpenAIService {
  constructor() {
    this.assistantId = process.env.OPENAI_ASSISTANT_ID;
    this.threads = new Map(); // Store threads for different sessions
  }

  async getChatResponse(userMessage, sessionId = 'default') {
    try {
      // Get or create thread for this session
      let threadId = this.threads.get(sessionId);
      
      if (!threadId) {
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
        this.threads.set(sessionId, threadId);
      }

      // Add user message to thread
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: userMessage
      });

      // Run the assistant
      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId
      });

      // Wait for completion
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      
      while (runStatus.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        
        if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
          throw new Error(`Run ${runStatus.status}: ${runStatus.last_error?.message || 'Unknown error'}`);
        }
      }

      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(threadId);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      
      return assistantMessage.content[0].text.value;
    } catch (error) {
      console.error('OpenAI Assistant API Error:', error);
      throw new Error('Failed to get response from OpenAI Assistant');
    }
  }

  async getChatResponseStream(userMessage, sessionId = 'default') {
    try {
      let threadId = this.threads.get(sessionId);
      
      if (!threadId) {
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
        this.threads.set(sessionId, threadId);
      }

      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: userMessage
      });

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId
      });

      return { threadId, runId: run.id };
    } catch (error) {
      console.error('OpenAI Assistant API Error:', error);
      throw new Error('Failed to start assistant run');
    }
  }

  async getRunStatus(threadId, runId) {
    return await openai.beta.threads.runs.retrieve(threadId, runId);
  }

  async getLatestMessage(threadId) {
    const messages = await openai.beta.threads.messages.list(threadId);
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
    return assistantMessage ? assistantMessage.content[0].text.value : null;
  }

  // Optional: Clear session thread
  clearSession(sessionId = 'default') {
    this.threads.delete(sessionId);
  }
}

module.exports = new OpenAIService();
