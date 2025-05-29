import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import icon from './icon.png';

const mockHistory = [
  'Prescription Refill',
  'Drug Interaction',
  'Order Status',
  'Allergy Advice',
  'General Inquiry',
];

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState(0);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/chat', {
        message: input
      });
      const botMessage = { text: response.data.message, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { text: 'Sorry, something went wrong.', sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Mocked: Start a new chat (clears messages)
  const handleNewChat = () => {
    setMessages([]);
    setActiveChat(-1); // -1 means new chat
  };

  return (
    <div className="pharma-full-app">
      <aside className="pharma-sidebar">
        <div className="pharma-sidebar-header">
          <img src={icon} alt="Pharma AI Logo" className="pharma-sidebar-logo" />
          <span className="pharma-sidebar-title">Pharma AI</span>
        </div>
        <button className="pharma-new-chat-btn" onClick={handleNewChat}>+ New Chat</button>
        <div className="pharma-history-list">
          {mockHistory.map((item, idx) => (
            <div
              key={idx}
              className={`pharma-history-item${activeChat === idx ? ' active' : ''}`}
              onClick={() => setActiveChat(idx)}
            >
              <span className="pharma-history-icon">💬</span>
              {item}
            </div>
          ))}
        </div>
        <div className="pharma-sidebar-footer">
          <button className="pharma-sidebar-settings">⚙️ Settings</button>
          <button className="pharma-sidebar-logout">Log out</button>
        </div>
      </aside>
      <main className="pharma-main-area">
        <div className="pharma-chat-container">
          <header className="pharma-header">
            <img src={icon} alt="Pharma AI Logo" className="pharma-logo" />
            <h1>Pharmacy Chat Assistant</h1>
          </header>
          <div className="pharma-chat-messages">
            {messages.map((message, index) => (
              <div key={index} className={`pharma-message ${message.sender}`}>
                <div className="pharma-message-bubble">
                  {message.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="pharma-message bot">
                <div className="pharma-message-bubble typing">
                  Typing...
                </div>
              </div>
            )}
          </div>
          <div className="pharma-chat-input-bar">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your pharmacy assistant..."
              disabled={loading}
              className="pharma-chat-input-inner"
            />
            <button
              className="pharma-send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12L19 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
