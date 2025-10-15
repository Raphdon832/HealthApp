import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// AI Provider configuration
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'gemini'; // 'openai', 'gemini', or 'mistral'

// Helper functions to fetch app data for AI context
export async function getPharmaciesContext(limitCount = 20) {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'pharmacy'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const pharmacies = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const potentialLat =
        data?.lat ??
        data?.latitude ??
        data?.location?.lat ??
        data?.location?.latitude ??
        data?.coords?.lat ??
        data?.coords?.latitude ??
        data?.coordinates?.lat ??
        data?.coordinates?.latitude;
      const potentialLon =
        data?.lon ??
        data?.lng ??
        data?.longitude ??
        data?.location?.lon ??
        data?.location?.lng ??
        data?.location?.longitude ??
        data?.coords?.lon ??
        data?.coords?.lng ??
        data?.coords?.longitude ??
        data?.coordinates?.lon ??
        data?.coordinates?.lng ??
        data?.coordinates?.longitude;
      const lat =
        typeof potentialLat === 'number'
          ? potentialLat
          : potentialLat !== undefined && potentialLat !== null
            ? Number(potentialLat)
            : undefined;
      const lon =
        typeof potentialLon === 'number'
          ? potentialLon
          : potentialLon !== undefined && potentialLon !== null
            ? Number(potentialLon)
            : undefined;
      const coordinates =
        data?.coordinates ||
        data?.coords ||
        (lat !== undefined && !Number.isNaN(lat) && lon !== undefined && !Number.isNaN(lon)
          ? { latitude: lat, longitude: lon }
          : undefined);
      pharmacies.push({
        id: doc.id,
        name: data.displayName || data.name,
        email: data.email,
        location: data.location,
        phone: data.phone || data.phoneNumber,
        address: data.address,
        verified: data.verified || data.isVerified || false,
        lat: lat !== undefined && !Number.isNaN(lat) ? lat : undefined,
        lon: lon !== undefined && !Number.isNaN(lon) ? lon : undefined,
        coordinates,
        services: data.services,
        url: `/vendor/${doc.id}` // Add pharmacy profile URL for direct linking
      });
    });
    return pharmacies;
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    return [];
  }
}

export async function getProductsContext(limitCount = 50) {
  try {
    const q = query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const products = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      products.push({
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        pharmacyName: data.pharmacyName,
        stock: data.stock,
        tags: data.tags || [],
        url: `/product/${doc.id}` // Add product URL for direct linking
      });
    });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function fetchProductsMap(productIds = []) {
  const uniqueIds = Array.from(
    new Set(
      (productIds || [])
        .filter(Boolean)
        .map((id) => id.trim?.() || id)
    )
  );
  if (uniqueIds.length === 0) return {};

  const snapshots = await Promise.all(
    uniqueIds.map((id) => getDoc(doc(db, 'products', id)))
  );

  const map = {};
  snapshots.forEach((snap, index) => {
    if (snap.exists()) {
      map[uniqueIds[index]] = { id: snap.id, ...snap.data() };
    }
  });
  return map;
}

export async function getUserCartContext(userId, { limitItems = 25 } = {}) {
  if (!userId) return [];

  try {
    const cartSnapshot = await getDocs(collection(db, 'users', userId, 'cart'));
    let items = cartSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    if (items.length === 0) return [];

    if (typeof limitItems === 'number' && limitItems > 0) {
      items = items.slice(0, limitItems);
    }

    const productIds = items
      .map((item) => item.productId)
      .filter(Boolean);

    const productMap = await fetchProductsMap(productIds);

    return items.map((item) => {
      const product = productMap[item.productId] || {};
      return {
        id: item.id,
        productId: item.productId || null,
        quantity: item.qty || item.quantity || 1,
        productName: product.name,
        price: product.price,
        currency: product.currency || 'NGN',
        pharmacyName: product.pharmacyName,
        stock: product.stock,
        productUrl: product.id ? `/product/${product.id}` : null,
        cartUrl: '/cart',
      };
    });
  } catch (error) {
    console.error('Error fetching user cart for AI context:', error);
    return [];
  }
}

export async function getUserOrdersContext(userId, { limitCount = 10 } = {}) {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const orders = [];
    const productIds = new Set();

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      orders.push({
        id: docSnap.id,
        ...data,
      });
      (data.items || []).forEach((item) => {
        if (item?.productId) productIds.add(item.productId);
      });
    });

    const productMap = await fetchProductsMap(Array.from(productIds));

    return orders.map((order) => {
      const createdAt =
        order.createdAt?.toDate?.()?.toISOString?.() ||
        order.createdAt?.toISOString?.?.() ||
        null;

      const items = (order.items || []).map((item) => {
        const product = productMap[item.productId] || {};
        return {
          productId: item.productId || null,
          productName: product.name,
          quantity: item.quantity || item.qty || 1,
          price: item.price ?? product.price,
          productUrl: product.id ? `/product/${product.id}` : null,
        };
      });

      return {
        id: order.id,
        status: order.status || 'pending',
        total: order.total,
        createdAt,
        pharmacyId: order.pharmacyId || null,
        orderUrl: `/orders?highlight=${order.id}`,
        items,
      };
    });
  } catch (error) {
    console.error('Error fetching user orders for AI context:', error);
    return [];
  }
}

export async function getUserPrescriptionsContext(userId, { limitCount = 15 } = {}) {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, 'prescriptions'),
      where('customerId', '==', userId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return [];

    const prescriptions = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    prescriptions.sort((a, b) => {
      const aDate =
        a.startDate instanceof Date
          ? a.startDate
          : a.startDate?.toDate?.?.() ||
            (a.startDate ? new Date(a.startDate) : null) ||
            a.createdAt?.toDate?.?.() ||
            new Date(0);
      const bDate =
        b.startDate instanceof Date
          ? b.startDate
          : b.startDate?.toDate?.?.() ||
            (b.startDate ? new Date(b.startDate) : null) ||
            b.createdAt?.toDate?.?.() ||
            new Date(0);
      return (bDate?.getTime?.() || 0) - (aDate?.getTime?.() || 0);
    });

    const limited = typeof limitCount === 'number' && limitCount > 0
      ? prescriptions.slice(0, limitCount)
      : prescriptions;

    return limited.map((prescription) => {
      const startDate =
        prescription.startDate instanceof Date
          ? prescription.startDate.toISOString()
          : prescription.startDate?.toDate?.?.()?.toISOString?.() ||
            (typeof prescription.startDate === 'string'
              ? prescription.startDate
              : null);

      return {
        id: prescription.id,
        pharmacyId: prescription.pharmacyId || null,
        status: prescription.status || 'active',
        startDate,
        duration: prescription.duration,
        notes: prescription.notes,
        drugs: (prescription.drugs || []).map((drug) => ({
          name: drug.name,
          dosage: drug.dosage,
          frequency: drug.frequency,
          instructions: drug.instructions,
        })),
        prescriptionUrl: '/profile',
        relatedChatThreadId: prescription.chatThreadId || null,
      };
    });
  } catch (error) {
    console.error('Error fetching user prescriptions for AI context:', error);
    return [];
  }
}

export async function searchPharmacies(searchTerm, limitCount = 10) {
  try {
    // Get all pharmacies first (since Firestore doesn't support text search easily)
    const pharmacies = await getPharmaciesContext(100);
    const lowerSearch = searchTerm.toLowerCase();
    
    // First, try exact matches
    const exactMatches = pharmacies.filter(pharmacy => 
      pharmacy.name?.toLowerCase().includes(lowerSearch) ||
      pharmacy.location?.toLowerCase().includes(lowerSearch) ||
      pharmacy.address?.toLowerCase().includes(lowerSearch)
    );
    
    if (exactMatches.length > 0) {
      return exactMatches.slice(0, limitCount);
    }
    
    // If no exact matches, find similar pharmacies using fuzzy matching
    const similarMatches = pharmacies.filter(pharmacy => {
      const name = pharmacy.name?.toLowerCase() || '';
      const location = pharmacy.location?.toLowerCase() || '';
      const address = pharmacy.address?.toLowerCase() || '';
      
      // Calculate similarity scores
      const nameSimilarity = getSimilarityScore(lowerSearch, name);
      const locationSimilarity = getSimilarityScore(lowerSearch, location);
      const addressSimilarity = getSimilarityScore(lowerSearch, address);
      
      // Consider it a match if any similarity score is above threshold
      return nameSimilarity > 0.3 || locationSimilarity > 0.3 || addressSimilarity > 0.3;
    }).sort((a, b) => {
      // Sort by best similarity score
      const aScore = Math.max(
        getSimilarityScore(lowerSearch, a.name?.toLowerCase() || ''),
        getSimilarityScore(lowerSearch, a.location?.toLowerCase() || ''),
        getSimilarityScore(lowerSearch, a.address?.toLowerCase() || '')
      );
      const bScore = Math.max(
        getSimilarityScore(lowerSearch, b.name?.toLowerCase() || ''),
        getSimilarityScore(lowerSearch, b.location?.toLowerCase() || ''),
        getSimilarityScore(lowerSearch, b.address?.toLowerCase() || '')
      );
      return bScore - aScore;
    });
    
    return similarMatches.slice(0, limitCount);
  } catch (error) {
    console.error('Error searching pharmacies:', error);
    return [];
  }
}

// Simple string similarity function (Levenshtein distance approximation)
function getSimilarityScore(str1, str2) {
  if (!str1 || !str2) return 0;
  
  // Simple substring matching with length consideration
  if (str2.includes(str1)) return 0.9;
  if (str1.includes(str2)) return 0.8;
  
  // Check for common words
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const commonWords = words1.filter(word => words2.some(w2 => w2.includes(word) || word.includes(w2)));
  
  if (commonWords.length > 0) {
    return Math.min(0.7, commonWords.length / Math.max(words1.length, words2.length));
  }
  
  // Character-level similarity for short strings
  if (str1.length < 5 && str2.length < 5) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.includes(shorter)) return 0.6;
  }
  
  return 0;
}

export async function searchProducts(searchTerm, limitCount = 20) {
  try {
    // Get all products first
    const products = await getProductsContext(200);
    const lowerSearch = searchTerm.toLowerCase();
    
    return products.filter(product => 
      product.name?.toLowerCase().includes(lowerSearch) ||
      product.description?.toLowerCase().includes(lowerSearch) ||
      product.category?.toLowerCase().includes(lowerSearch) ||
      (product.tags && product.tags.some(tag => tag.toLowerCase().includes(lowerSearch)))
    ).slice(0, limitCount);
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Note: In production, API calls should be made from backend
  });
};

// Initialize Gemini AI client
const getGeminiClient = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY || import.meta.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Google Gemini API key not configured. Please add VITE_GOOGLE_GEMINI_API_KEY to your .env file. Get a free key at: https://makersuite.google.com/app/apikey');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-pro',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    }
  });
};

// Initialize AIML API client for Mistral
const getAIMLConfig = () => {
  const apiKey = import.meta.env.VITE_AIML_API_KEY;
  if (!apiKey) {
    throw new Error('AIML API key not configured. Please add VITE_AIML_API_KEY to your .env file. Get a key at: https://aimlapi.com/');
  }
  return {
    apiKey,
    baseURL: 'https://api.aimlapi.com/v1/chat/completions',
    model: 'mistralai/Mistral-7B-Instruct-v0.3'
  };
};

// System prompt for health/pharmacy AI assistant
const SYSTEM_PROMPT = `You are PharmAI, a helpful AI assistant for a pharmacy app called Pharmasea. You help users with:

1. GENERAL HEALTH INFORMATION - Provide general wellness tips, explain common health concepts, and answer basic health questions
2. PRODUCT INFORMATION - Help users understand medications, supplements, and health products available in our app
3. PHARMACY SERVICES - Explain how pharmacy services work, prescription processes, etc.
4. PHARMACY SEARCH - Help users find pharmacies in our network based on location, name, or services
5. PRODUCT SEARCH - Help users find specific medications, health products, or alternatives available in our app
6. WELLNESS ADVICE - Give general lifestyle and wellness recommendations

IMPORTANT CAPABILITIES:
- You have access to our pharmacy network and can search for pharmacies by location, name, or services
- You have access to our product catalog and can search for medications, supplements, and health products
- You can review the user's current cart items, recent orders, and prescriptions (when provided) to give contextual assistance—never invent entries that are not in the supplied data
- When users ask about specific drugs or pharmacies, search our database and provide accurate information
- When listing products, ALWAYS include the product URL so users can click directly to view details
- When listing pharmacies, ALWAYS include the pharmacy URL so users can click directly to view details
- You know the user's approximate location when provided and can highlight nearby pharmacies and their distance
- When searching for pharmacies, if no exact matches are found, suggest similar pharmacies that might be what the user is looking for
- Always mention that you can help search for pharmacies or products when relevant
- Only recommend pharmacies that exist in the provided pharmacy lists; never invent locations or references outside the supplied data
- Use any provided navigation URLs (e.g., cartUrl, orderUrl, productUrl, prescriptionUrl) so users can quickly open the relevant screen inside Pharmasea
- Always refer to our platform as "Pharmasea" (never shorten it to "Pharmacy" or any other name)

IMPORTANT SAFETY GUIDELINES:
- NEVER give medical advice, diagnoses, or treatment recommendations
- NEVER suggest specific medications or dosages
- ALWAYS include disclaimers when discussing health topics
- ALWAYS recommend consulting healthcare professionals for medical concerns
- When advising professional care, recommend at least one nearby pharmacy from the provided nearestPharmacies data (prioritize verified options and mention distance when available)
- If a user asks for medical advice, politely redirect them to speak with a doctor or pharmacist

RESPONSE STYLE:
- Be friendly, helpful, and professional
- Use clear, simple language
- Keep responses concise but informative
- NEVER include internal IDs, database keys, or technical identifiers in your responses
- When listing products, embed links in the product names using markdown format: [Product Name](URL) - ₦Price - Description
- When mentioning pharmacies, embed links in pharmacy names using markdown format: [Pharmacy Name](URL)
- When mentioning nearby pharmacies, list them as bullet points with distance (e.g., • [PharmCare Pharmacy](URL) — 1.2 km away — Address)
- Use markdown link format [Name](URL) to make names clickable
- When suggesting pharmacies, mention if they are similar matches when exact searches don't work
- If no suitable pharmacy exists in the provided data, state that clearly instead of recommending an unknown location
- When referencing cart items, orders, or prescriptions, acknowledge their current state and include the relevant navigation link (cartUrl, orderUrl, prescriptionUrl) so the user can jump straight to that view
- When referencing the app or experience, call it "Pharmasea" to reinforce branding
- Always end medical/health related responses with appropriate disclaimers
- Be culturally sensitive and inclusive

If you don't know something, admit it and suggest consulting appropriate professionals.`;

// Function to get AI response
export async function getAIResponse(userMessage, context = {}) {
  try {
    if (AI_PROVIDER === 'gemini') {
      return await getGeminiResponse(userMessage, context);
    } else if (AI_PROVIDER === 'mistral') {
      return await getMistralResponse(userMessage, context);
    } else {
      return await getOpenAIResponse(userMessage, context);
    }
  } catch (error) {
    console.error('AI response error:', error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later or contact our support team.";
  }
}

// OpenAI implementation
async function getOpenAIResponse(userMessage, context = {}) {
  const openai = getOpenAIClient();
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ];

  // Add context if available
  if (context.userLocation) {
    messages.splice(1, 0, {
      role: 'system',
      content: `User location: ${JSON.stringify(context.userLocation)}`
    });
  }

  if (context.userInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `User context: ${JSON.stringify(context.userInfo)}`
    });
  }

  if (context.nearestPharmacies) {
    messages.splice(1, 0, {
      role: 'system',
      content: `Nearest pharmacies to the user: ${JSON.stringify(context.nearestPharmacies)}`
    });
  }

  if (context.cartInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `User cart snapshot: ${JSON.stringify(context.cartInfo)}`
    });
  }

  if (context.orderInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `Recent user orders: ${JSON.stringify(context.orderInfo)}`
    });
  }

  if (context.prescriptionInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `User prescriptions: ${JSON.stringify(context.prescriptionInfo)}`
    });
  }

  if (context.cartInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `User cart snapshot: ${JSON.stringify(context.cartInfo)}`
    });
  }

  if (context.orderInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `Recent user orders: ${JSON.stringify(context.orderInfo)}`
    });
  }

  if (context.prescriptionInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `User prescriptions: ${JSON.stringify(context.prescriptionInfo)}`
    });
  }

  if (context.productInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `Available products in our app: ${JSON.stringify(context.productInfo)}`
    });
  }

  if (context.pharmacyInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `Available pharmacies in our network: ${JSON.stringify(context.pharmacyInfo)}`
    });
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

// Gemini implementation
async function getGeminiResponse(userMessage, context = {}) {
  const model = getGeminiClient();

  let prompt = SYSTEM_PROMPT + '\n\n';
  prompt += `User message: ${userMessage}\n\n`;

  // Add context if available
  if (context.userLocation) {
    prompt += `User location: ${JSON.stringify(context.userLocation)}\n\n`;
  }

  if (context.userInfo) {
    prompt += `User context: ${JSON.stringify(context.userInfo)}\n\n`;
  }

  if (context.nearestPharmacies) {
    prompt += `Nearest pharmacies to the user: ${JSON.stringify(context.nearestPharmacies)}\n\n`;
  }

  if (context.cartInfo) {
    prompt += `User cart snapshot: ${JSON.stringify(context.cartInfo)}\n\n`;
  }

  if (context.orderInfo) {
    prompt += `Recent user orders: ${JSON.stringify(context.orderInfo)}\n\n`;
  }

  if (context.prescriptionInfo) {
    prompt += `User prescriptions: ${JSON.stringify(context.prescriptionInfo)}\n\n`;
  }

  if (context.productInfo) {
    prompt += `Available products in our app: ${JSON.stringify(context.productInfo)}\n\n`;
  }

  if (context.pharmacyInfo) {
    prompt += `Available pharmacies in our network: ${JSON.stringify(context.pharmacyInfo)}\n\n`;
  }

  prompt += 'Please provide a helpful response:';

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Mistral implementation via AIML API
async function getMistralResponse(userMessage, context = {}) {
  const config = getAIMLConfig();
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ];

  // Add context if available
  if (context.userLocation) {
    messages.splice(1, 0, {
      role: 'system',
      content: `User location: ${JSON.stringify(context.userLocation)}`
    });
  }

  if (context.userInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `User context: ${JSON.stringify(context.userInfo)}`
    });
  }

  if (context.nearestPharmacies) {
    messages.splice(1, 0, {
      role: 'system',
      content: `Nearest pharmacies to the user: ${JSON.stringify(context.nearestPharmacies)}`
    });
  }

  if (context.productInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `Available products in our app: ${JSON.stringify(context.productInfo)}`
    });
  }

  if (context.pharmacyInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `Available pharmacies in our network: ${JSON.stringify(context.pharmacyInfo)}`
    });
  }

  const response = await fetch(config.baseURL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AIML API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Function to get product recommendations based on user query
export async function getProductRecommendations(query, products = []) {
  try {
    if (AI_PROVIDER === 'gemini') {
      return await getGeminiProductRecommendations(query, products);
    } else if (AI_PROVIDER === 'mistral') {
      return await getMistralProductRecommendations(query, products);
    } else {
      return await getOpenAIProductRecommendations(query, products);
    }
  } catch (error) {
    console.error('Product recommendation error:', error);
    return "I couldn't load product recommendations right now. Please browse our products directly.";
  }
}

// OpenAI product recommendations
async function getOpenAIProductRecommendations(query, products = []) {
  const openai = getOpenAIClient();
  const productContext = products.map(p => ({
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price
  }));

  const messages = [
    {
      role: 'system',
      content: `You are a product recommendation assistant. Based on the user's query and available products, suggest relevant products. Only recommend products that actually exist in the provided list. If no relevant products exist, suggest consulting a pharmacist. Keep recommendations brief and helpful.`
    },
    {
      role: 'user',
      content: `User query: "${query}"\n\nAvailable products: ${JSON.stringify(productContext)}\n\nSuggest relevant products if any match the query.`
    }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: messages,
    max_tokens: 300,
    temperature: 0.3,
  });

  return completion.choices[0].message.content;
}

// Gemini product recommendations
async function getGeminiProductRecommendations(query, products = []) {
  const model = getGeminiClient();
  const productContext = products.map(p => ({
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price
  }));

  const prompt = `You are a product recommendation assistant. Based on the user's query and available products, suggest relevant products. Only recommend products that actually exist in the provided list. If no relevant products exist, suggest consulting a pharmacist. Keep recommendations brief and helpful.

User query: "${query}"

Available products: ${JSON.stringify(productContext)}

Suggest relevant products if any match the query.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Mistral product recommendations via AIML API
async function getMistralProductRecommendations(query, products = []) {
  const config = getAIMLConfig();
  const productContext = products.map(p => ({
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price
  }));

  const messages = [
    {
      role: 'system',
      content: `You are a product recommendation assistant. Based on the user's query and available products, suggest relevant products. Only recommend products that actually exist in the provided list. If no relevant products exist, suggest consulting a pharmacist. Keep recommendations brief and helpful.`
    },
    {
      role: 'user',
      content: `User query: "${query}"\n\nAvailable products: ${JSON.stringify(productContext)}\n\nSuggest relevant products if any match the query.`
    }
  ];

  const response = await fetch(config.baseURL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages,
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`AIML API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Function to check if query needs medical professional
export function needsMedicalProfessional(query) {
  const medicalKeywords = [
    'diagnosis', 'diagnose', 'treatment', 'treat', 'cure', 'medicine', 'medication',
    'prescription', 'prescribe', 'dosage', 'dose', 'symptoms', 'symptom',
    'pain', 'ache', 'hurt', 'illness', 'disease', 'condition', 'sick',
    'emergency', 'urgent', 'serious', 'severe', 'chronic', 'acute'
  ];

  const lowerQuery = query.toLowerCase();
  return medicalKeywords.some(keyword => lowerQuery.includes(keyword));
}

// Function to add medical disclaimer to response
export function addMedicalDisclaimer(response, options = {}) {
  if (!response) return response;
  if (needsMedicalProfessional(response)) {
    return response + '\n\n⚠️ **Medical Disclaimer:** This is general information only and not medical advice. Please consult with a healthcare professional for personalized medical recommendations.';
  }
  return response;
}
