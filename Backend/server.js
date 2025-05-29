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
