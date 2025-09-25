import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaUser, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { useI18n } from '../i18n';
import ReactMarkdown from 'react-markdown';

export const LoadingDots = () => (
  <div className="flex space-x-1">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

const FarmingChatbot = () => {
  const { t } = useI18n();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: t(
        'chatbot.welcome_message',
        "Hello! I'm your advanced farming assistant. I can help you with crop management, pest control, soil health, and more. What would you like to know?"
      ),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-6), // send last 6 messages
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let buffer = '';

      // Create placeholder assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          if (!event.startsWith('data: ')) continue;

          const data = event.replace('data: ', '').trim();
          if (!data || data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              assistantMessage += parsed.chunk;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
              });
            }
          } catch (err) {
            console.error('Error parsing SSE chunk:', err, data);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: t(
            'chatbot.error_message',
            'Sorry, I encountered an error. Please try again later.'
          ),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-green-100 p-2 rounded-full">
          <FaRobot className="text-green-600 text-xl" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          {t('chatbot.title', 'Farming Assistant')}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white rounded-br-none'
                  : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex-shrink-0 ${
                    msg.role === 'assistant' ? 'text-green-600' : 'text-white'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <FaRobot size={18} />
                  ) : (
                    <FaUser size={16} />
                  )}
                </div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg max-w-[85%] border border-gray-100">
            <FaRobot className="text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex items-center space-x-2">
              <LoadingDots />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-auto">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(
              'chatbot.placeholder',
              'Ask me anything about farming...'
            )}
            className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-green-600 hover:text-green-700 rounded-full transition-colors disabled:opacity-50"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FarmingChatbot;
