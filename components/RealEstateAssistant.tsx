'use client';

import { useState } from 'react';

type ConversationType = 'buying' | 'selling' | 'renting' | 'investing' | 'general';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function RealEstateAssistant() {
  const [conversationType, setConversationType] = useState<ConversationType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const conversationTypes = {
    buying: 'Home Buying',
    selling: 'Home Selling', 
    renting: 'Rental Properties',
    investing: 'Real Estate Investment',
    general: 'General Questions'
  };

  const addMessage = (text: string, isUser: boolean) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, isUser }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    addMessage(input, true);
    
    setTimeout(() => {
      addMessage(`Thank you for your ${conversationTypes[conversationType!].toLowerCase()} question. I'd be happy to help with that.`, false);
      
      setTimeout(() => {
        addMessage('Do you have any other questions? (Yes/No)', false);
      }, 1000);
    }, 1000);
    
    setInput('');
  };

  const handleYesNo = (response: string) => {
    addMessage(response, true);
    
    if (response.toLowerCase() === 'no') {
      setTimeout(() => {
        addMessage('Thank you for using our Real Estate Assistant! Have a great day!', false);
      }, 500);
    } else {
      setTimeout(() => {
        setConversationType(null);
        setMessages([]);
      }, 500);
    }
  };

  const selectConversationType = (type: ConversationType) => {
    setConversationType(type);
    addMessage(`Great! I'm here to help with ${conversationTypes[type].toLowerCase()}. What would you like to know?`, false);
  };

  if (!conversationType) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Real Estate Assistant</h2>
        <p className="mb-4">What can I help you with today?</p>
        <div className="space-y-2">
          {Object.entries(conversationTypes).map(([key, label]) => (
            <button
              key={key}
              onClick={() => selectConversationType(key as ConversationType)}
              className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{conversationTypes[conversationType]}</h2>
        <button 
          onClick={() => setConversationType(null)}
          className="text-sm text-blue-600 hover:underline"
        >
          Change Topic
        </button>
      </div>
      
      <div className="h-64 overflow-y-auto mb-4 p-3 bg-gray-50 rounded">
        {messages.map(message => (
          <div key={message.id} className={`mb-2 ${message.isUser ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded ${message.isUser ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
              {message.text}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask your question..."
          className="flex-1 p-2 border rounded"
        />
        <button 
          onClick={handleSend}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
      
      {messages.length > 0 && messages[messages.length - 1].text.includes('Do you have any other questions?') && (
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => handleYesNo('Yes')}
            className="flex-1 p-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Yes
          </button>
          <button 
            onClick={() => handleYesNo('No')}
            className="flex-1 p-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}