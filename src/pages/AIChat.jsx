import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Send, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/language';
import { getAIResponse, addMedicalDisclaimer, needsMedicalProfessional, getPharmaciesContext, getProductsContext } from '@/lib/ai';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSkeleton from '@/components/LoadingSkeleton';

// Use the SVG placed in the `public/` folder so production (Netlify) serves it at root
const ChatBgUrl = "/ChatBg.svg";

// PharmAI Icon Component
const PharmAIIcon = ({ className = "w-5 h-5" }) => (
  <img 
    src="/PharmAI.svg" 
    alt="PharmAI" 
    className={className}
  />
);

// Function to parse and render markdown links
const renderMessageWithLinks = (content, navigate) => {
  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    // Add the link
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <span
        key={match.index}
        onClick={() => navigate(linkUrl)}
        className="text-sky-600 hover:text-sky-800 underline font-normal cursor-pointer"
      >
        {linkText}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};

export default function AIChat() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [products, setProducts] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversation history
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'ai_conversations'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationMessages = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        conversationMessages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });

      // Sort by timestamp
      conversationMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(conversationMessages);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load pharmacy and product data for AI context
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const [pharmacyData, productData] = await Promise.all([
          getPharmaciesContext(20),
          getProductsContext(50)
        ]);
        setPharmacies(pharmacyData);
        setProducts(productData);
      } catch (error) {
        console.error('Error loading app data for AI:', error);
      }
    };

    loadAppData();
  }, []);

  const saveMessage = async (message) => {
    try {
      await addDoc(collection(db, 'ai_conversations'), {
        ...message,
        userId: user.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    // Add user message to UI immediately
    const userMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Save user message
      await saveMessage(userMsg);

      // Get AI response
      const context = {
        userInfo: {
          role: profile?.role,
          language: t('current_language', 'en')
        },
        productInfo: products.slice(0, 20), // Limit to 20 most recent products
        pharmacyInfo: pharmacies.slice(0, 10) // Limit to 10 pharmacies
      };

      let aiResponse = await getAIResponse(userMessage, context);

      // Add medical disclaimer if needed
      aiResponse = addMedicalDisclaimer(aiResponse);

      const aiMsg = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      // Add AI response to UI
      setMessages(prev => [...prev, aiMsg]);

      // Save AI response
      await saveMessage(aiMsg);

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMsg = {
        role: 'assistant',
        content: error.message.includes('API key') 
          ? "I'm not configured yet. Please ask your administrator to set up the OpenAI API key."
          : t('ai_error_message', 'Sorry, I\'m having trouble connecting. Please try again later.'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = async () => {
    if (!user?.uid) return;

    try {
      // Clear the current conversation messages
      setMessages([]);
      setInputMessage('');
      // Focus the input for the new chat
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-xl font-poppins font-light mb-6">
          {t('please_sign_in_continue', 'Please sign in to continue')}
        </div>
        <button
          className="rounded-full bg-sky-600 text-white px-8 py-3 text-lg font-poppins font-medium shadow hover:bg-sky-700 transition"
          onClick={() => navigate('/auth/landing')}
        >
          {t('sign_in_sign_up', 'Sign In / Sign Up')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
              <PharmAIIcon className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">PharmAI</div>
              <div className="text-xs text-gray-500">
                {isTyping ? t('typing', 'Typing...') : t('online', 'Online')}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={startNewChat}
          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded border"
        >
          {t('new_chat', 'New Chat')}
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 pb-32"
        style={{
          backgroundImage: `url(${ChatBgUrl})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center'
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4">
              <PharmAIIcon className="w-8 h-8 text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('welcome_to_pharmai', 'Welcome to PharmAI!')}
            </h3>
            <p className="text-gray-600 max-w-sm">
              {t('ai_assistant_description',
                'I\'m here to help with general health information, product questions, and pharmacy services. Remember, I\'m not a substitute for professional medical advice.')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${index === messages.length - 1 ? 'pb-6' : ''}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-sky-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <PharmAIIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 whitespace-pre-wrap text-sm break-words overflow-hidden">
                      {renderMessageWithLinks(message.content, navigate)}
                    </div>
                  </div>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-sky-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp?.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <PharmAIIcon className="w-4 h-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 py-3 z-20">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('type_message', 'Type your message...')}
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 pr-12 resize-none focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="w-11 h-11 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 mt-2 text-center">
          {t('ai_disclaimer', '⚠️ This AI provides general information only. Not medical advice. Consult professionals for health concerns.')}
        </div>
      </div>
    </div>
  );
}
