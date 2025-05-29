const express = require('express');
const cors = require('cors');
require('dotenv').config();

const openaiService = require('./services/openaiService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_ASSISTANT_ID) {
      return res.status(500).json({ error: 'Assistant ID not configured' });
    }

    const response = await openaiService.getChatResponse(message, sessionId);
    res.json({ message: response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Streaming chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENAI_ASSISTANT_ID) {
      return res.status(500).json({ error: 'Assistant ID not configured' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const { threadId, runId } = await openaiService.getChatResponseStream(message, sessionId);
    
    // Poll for completion and stream response
    let runStatus = await openaiService.getRunStatus(threadId, runId);
    
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 500));
      runStatus = await openaiService.getRunStatus(threadId, runId);
      
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
        res.write('ERROR: Failed to get response\n');
        res.end();
        return;
      }
    }

    // Get the complete message and simulate typing
    const completeMessage = await openaiService.getLatestMessage(threadId);
    
    if (completeMessage) {
      // Stream the response word by word to create typing effect
      const words = completeMessage.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = words.slice(0, i + 1).join(' ');
        res.write(chunk + '\n');
        await new Promise(resolve => setTimeout(resolve, 80)); // Typing speed - adjust as needed
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Error in streaming chat endpoint:', error);
    res.write('ERROR: Internal server error\n');
    res.end();
  }
});

// Clear session endpoint
app.post('/api/clear-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    openaiService.clearSession(sessionId);
    res.json({ message: 'Session cleared' });
  } catch (error) {
    console.error('Error clearing session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
