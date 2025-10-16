import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, Send, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/language';
import {
  getAIResponse,
  addMedicalDisclaimer,
  needsMedicalProfessional,
  getPharmaciesContext,
  getProductsContext,
  getUserCartContext,
  getUserOrdersContext,
  getUserPrescriptionsContext
} from '@/lib/ai';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSkeleton from '@/components/LoadingSkeleton';

// Use the SVG placed in the `public/` folder so production (Netlify) serves it at root
const ChatBgUrl = "/ChatBg.svg";

// PharmAI Icon Component
const PharmAIIcon = ({ className = "w-5 h-5" }) => (
  <img 
    src="/PharmAIDp.svg" 
    alt="PharmAI" 
    className={className}
  />
);

const escapeRegExp = (str = '') =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createProductMatcher = (product) => {
  const name = product?.name?.trim();
  const url = product?.url;
  if (!name || !url) return null;

  const escaped = escapeRegExp(name);
  const useWordBoundaries =
    /\w/.test(name[0]) && /\w/.test(name[name.length - 1]);
  const pattern = useWordBoundaries ? `\\b${escaped}\\b` : escaped;

  return { name, url, pattern };
};

const enhanceSegmentsWithProducts = (
  segments,
  productMatchers,
  navigate,
  getKey
) => {
  if (!Array.isArray(segments)) segments = [segments];
  if (!productMatchers?.length) return segments;

  return segments.flatMap((segment) => {
    if (typeof segment !== 'string') return [segment];

    return productMatchers.reduce((acc, matcher) => {
      return acc.flatMap((piece) => {
        if (typeof piece !== 'string') return [piece];

        const regex = new RegExp(matcher.pattern, 'gi');
        let lastIndex = 0;
        let match;
        const result = [];

        while ((match = regex.exec(piece)) !== null) {
          if (match.index > lastIndex) {
            result.push(piece.slice(lastIndex, match.index));
          }

          const matchedText = match[0];
          result.push(
            <span
              key={getKey()}
              onClick={() => navigate(matcher.url)}
              className="text-sky-600 hover:text-sky-800 underline font-normal cursor-pointer"
            >
              {matchedText}
            </span>
          );

          lastIndex = regex.lastIndex;
        }

        if (result.length === 0) {
          return [piece];
        }

        if (lastIndex < piece.length) {
          result.push(piece.slice(lastIndex));
        }

        return result;
      });
    }, [segment]);
  });
};

const numericOrNull = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const NESTED_COORD_KEYS = ['location', 'coordinates', 'coords'];
const LAT_KEYS = ['lat', 'latitude'];
const LON_KEYS = ['lon', 'lng', 'longitude'];

const extractCoordinates = (source, depth = 0) => {
  if (!source || depth > 2) return null;

  for (const latKey of LAT_KEYS) {
    for (const lonKey of LON_KEYS) {
      const lat = numericOrNull(source[latKey]);
      const lon = numericOrNull(source[lonKey]);
      if (lat !== null && lon !== null) {
        return { lat, lon };
      }
    }
  }

  for (const nestedKey of NESTED_COORD_KEYS) {
    if (!source[nestedKey]) continue;
    const nestedCoords = extractCoordinates(source[nestedKey], depth + 1);
    if (nestedCoords) return nestedCoords;
  }

  return null;
};

const toRadians = (deg) => (deg * Math.PI) / 180;
const EARTH_RADIUS_KM = 6371;

const calculateDistanceKm = (fromCoords, toCoords) => {
  if (!fromCoords || !toCoords) return null;
  const fromLat = numericOrNull(fromCoords.lat);
  const fromLon = numericOrNull(fromCoords.lon);
  const toLat = numericOrNull(toCoords.lat);
  const toLon = numericOrNull(toCoords.lon);

  if (
    fromLat === null ||
    fromLon === null ||
    toLat === null ||
    toLon === null
  ) {
    return null;
  }

  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const radFromLat = toRadians(fromLat);
  const radToLat = toRadians(toLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radFromLat) * Math.cos(radToLat);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const sanitizePharmacyForContext = (pharmacy) => {
  if (!pharmacy) return null;

  const sanitized = {
    id: pharmacy.id,
    name: pharmacy.name || pharmacy.displayName || 'Pharmacy',
    address: pharmacy.address || pharmacy.location?.address || pharmacy.location,
    verified: Boolean(pharmacy.verified),
    url: pharmacy.url,
  };

  if (pharmacy.phone) sanitized.phone = pharmacy.phone;
  if (pharmacy.location) sanitized.location = pharmacy.location;

  const distance = numericOrNull(pharmacy.distanceKm);
  if (distance !== null) sanitized.distanceKm = Number(distance.toFixed(2));

  return sanitized;
};

// Function to parse and render markdown links, enhancing drug names
const renderMessageWithLinks = (content, navigate, productMatchers = []) => {
  if (!content) return null;

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let autoKey = 0;
  const getKey = () => `ai-link-${autoKey++}`;

  while ((match = linkRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <span
        key={getKey()}
        onClick={() => navigate(linkUrl)}
        className="text-sky-600 hover:text-sky-800 underline font-normal cursor-pointer"
      >
        {linkText}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  const segments = parts.length ? parts : [content];
  const enhanced = enhanceSegmentsWithProducts(
    segments,
    productMatchers,
    navigate,
    getKey
  );

  return enhanced.length === 1 ? enhanced[0] : enhanced;
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
  const [cartItems, setCartItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const productMatchers = useMemo(
    () =>
      (products || [])
        .map(createProductMatcher)
        .filter(Boolean)
        .sort((a, b) => b.name.length - a.name.length),
    [products]
  );

  const userLocationDetails = useMemo(() => {
    if (!profile && !user) return null;

    const coords = extractCoordinates(profile) || extractCoordinates(user);
    const location = {};

    if (coords) {
      location.lat = coords.lat;
      location.lon = coords.lon;
    }

    const address =
      profile?.address ||
      profile?.location?.address ||
      profile?.coords?.address ||
      profile?.coordinates?.address;
    if (address) location.address = address;

    const city =
      profile?.city ||
      profile?.location?.city ||
      profile?.coordinates?.city;
    if (city) location.city = city;

    const state =
      profile?.state ||
      profile?.location?.state ||
      profile?.coordinates?.state;
    if (state) location.state = state;

    const country =
      profile?.country ||
      profile?.location?.country ||
      profile?.coordinates?.country;
    if (country) location.country = country;

    const postalCode =
      profile?.postalCode ||
      profile?.location?.postalCode ||
      profile?.coordinates?.postalCode;
    if (postalCode) location.postalCode = postalCode;

    const displayName =
      profile?.displayName || user?.displayName || user?.email;
    if (displayName) location.displayName = displayName;

    return Object.keys(location).length ? location : null;
  }, [profile, user]);

  const pharmacyDistanceData = useMemo(() => {
    if (!Array.isArray(pharmacies) || pharmacies.length === 0) return [];

    return pharmacies.map((pharmacy) => {
      const coords = extractCoordinates(pharmacy);
      const distance =
        coords &&
        userLocationDetails &&
        numericOrNull(userLocationDetails?.lat) !== null &&
        numericOrNull(userLocationDetails?.lon) !== null
          ? calculateDistanceKm(coords, userLocationDetails)
          : null;

      const normalizedDistance =
        distance !== null && Number.isFinite(distance)
          ? Number(distance.toFixed(2))
          : null;

      return {
        ...pharmacy,
        distanceKm: normalizedDistance,
      };
    });
  }, [pharmacies, userLocationDetails]);

  const sortedPharmaciesByDistance = useMemo(() => {
    if (!pharmacyDistanceData.length) return [];
    return [...pharmacyDistanceData].sort((a, b) => {
      const aHas = typeof a.distanceKm === 'number';
      const bHas = typeof b.distanceKm === 'number';
      if (aHas && bHas) return a.distanceKm - b.distanceKm;
      if (aHas) return -1;
      if (bHas) return 1;
      return 0;
    });
  }, [pharmacyDistanceData]);

  const pharmacyContextData = useMemo(() => {
    if (!sortedPharmaciesByDistance.length) return [];
    return sortedPharmaciesByDistance
      .slice(0, 10)
      .map(sanitizePharmacyForContext)
      .filter(Boolean);
  }, [sortedPharmaciesByDistance]);

  const nearestPharmaciesData = useMemo(() => {
    if (!sortedPharmaciesByDistance.length) return [];
    return sortedPharmaciesByDistance
      .slice(0, 3)
      .map(sanitizePharmacyForContext)
      .filter(Boolean);
  }, [sortedPharmaciesByDistance]);

  const userLocationContext = useMemo(() => {
    if (!userLocationDetails) return null;
    const { lat, lon, address, city, state, country, postalCode } = userLocationDetails;
    const contextLocation = {};
    if (numericOrNull(lat) !== null) contextLocation.lat = Number(lat);
    if (numericOrNull(lon) !== null) contextLocation.lon = Number(lon);
    if (address) contextLocation.address = address;
    if (city) contextLocation.city = city;
    if (state) contextLocation.state = state;
    if (country) contextLocation.country = country;
    if (postalCode) contextLocation.postalCode = postalCode;
    return Object.keys(contextLocation).length ? contextLocation : null;
  }, [userLocationDetails]);

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

  useEffect(() => {
    if (!user?.uid) {
      setCartItems([]);
      setOrders([]);
      setPrescriptions([]);
      return;
    }

    let isCurrent = true;

    const loadUserContextData = async () => {
      try {
        const [cartData, orderData, prescriptionData] = await Promise.all([
          getUserCartContext(user.uid, { limitItems: 25 }),
          getUserOrdersContext(user.uid, { limitCount: 10 }),
          getUserPrescriptionsContext(user.uid, { limitCount: 15 })
        ]);

        if (!isCurrent) return;

        setCartItems(cartData);
        setOrders(orderData);
        setPrescriptions(prescriptionData);
      } catch (error) {
        console.error('Error loading user data for AI context:', error);
      }
    };

    loadUserContextData();

    return () => {
      isCurrent = false;
    };
  }, [user?.uid]);

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
          language: t('current_language', 'en'),
          platformName: 'Pharmasea'
        },
        productInfo: products.slice(0, 20), // Limit to 20 most recent products
        pharmacyInfo: pharmacyContextData,
        nearestPharmacies: nearestPharmaciesData,
        cartInfo: cartItems,
        orderInfo: orders,
        prescriptionInfo: prescriptions
      };

      if (profile?.displayName || user?.displayName) {
        context.userInfo.displayName = profile?.displayName || user?.displayName;
      }

      context.userInfo.cartItemCount = cartItems.length;
      context.userInfo.orderCount = orders.length;
      context.userInfo.prescriptionCount = prescriptions.length;

      if (userLocationContext) {
        context.userInfo.location = userLocationContext;
        context.userLocation = userLocationContext;
      }

      let aiResponse = await getAIResponse(userMessage, context);

      if (needsMedicalProfessional(aiResponse)) {
        const verifiedLabel = t('pharmacy_verified_label', 'verified');
        const nearbyLabel = t('distance_nearby', 'nearby');
        const kmAwayLabel = t('distance_km_away', 'km away');
        const heading = t('nearby_pharmacies_heading', 'Nearby pharmacy options:');

        const suggestionCandidates =
          (nearestPharmaciesData && nearestPharmaciesData.length > 0)
            ? nearestPharmaciesData
            : pharmacyContextData.slice(0, 3);

        const suggestionLines = suggestionCandidates
          .map((pharmacy) => {
            if (!pharmacy) return null;
            const name = pharmacy.name || t('pharmacy_generic_name', 'Pharmacy');
            const link = pharmacy.url ? `[${name}](${pharmacy.url})` : name;
            const distanceValue = numericOrNull(pharmacy.distanceKm);
            const distanceText =
              distanceValue !== null
                ? `${distanceValue.toFixed(1)} ${kmAwayLabel}`
                : nearbyLabel;
            const verifiedText = pharmacy.verified ? ` (${verifiedLabel})` : '';
            const addressText = pharmacy.address ? ` — ${pharmacy.address}` : '';
            return `• ${link}${verifiedText} — ${distanceText}${addressText}`;
          })
          .filter(Boolean);

        if (suggestionLines.length > 0) {
          aiResponse += `\n\n${heading}\n${suggestionLines.join('\n')}`;
        }
      }

      // Add medical disclaimer if needed
      aiResponse = addMedicalDisclaimer(aiResponse, {
        nearestPharmacies: nearestPharmaciesData
      });

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
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900">PharmAI</span>
                <CheckCircle2 className="w-4 h-4 text-sky-500" aria-hidden="true" />
                <span className="sr-only">{t('verified_account', 'Verified account')}</span>
              </div>
              <div className="text-xs text-gray-500">
                {isTyping ? t('typing', 'Typing...') : t('online', 'Online')}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={startNewChat}
          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-full border"
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
                      {renderMessageWithLinks(message.content, navigate, productMatchers)}
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
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('type_message', 'Type your message...')}
              className="w-full border border-gray-300 rounded-full px-4 py-3 pr-12 resize-none focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
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
          {t('ai_disclaimer', '⚠️ PharmAI provides general information only. Not medical advice. Consult professionals for health concerns.')}
        </div>
      </div>
    </div>
  );
}


