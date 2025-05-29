const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class OpenAIService {
  async getChatResponse(userMessage) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Provide concise and helpful responses."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to get response from OpenAI');
    }
  }
}

module.exports = new OpenAIService();
