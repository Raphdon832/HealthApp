import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// AI Provider configuration
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'gemini'; // 'openai', 'gemini', or 'mistral'

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
2. PRODUCT INFORMATION - Help users understand medications, supplements, and health products
3. PHARMACY SERVICES - Explain how pharmacy services work, prescription processes, etc.
4. WELLNESS ADVICE - Give general lifestyle and wellness recommendations

IMPORTANT SAFETY GUIDELINES:
- NEVER give medical advice, diagnoses, or treatment recommendations
- NEVER suggest specific medications or dosages
- ALWAYS include disclaimers when discussing health topics
- ALWAYS recommend consulting healthcare professionals for medical concerns
- If a user asks for medical advice, politely redirect them to speak with a doctor or pharmacist

RESPONSE STYLE:
- Be friendly, helpful, and professional
- Use clear, simple language
- Keep responses concise but informative
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
  if (context.userInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `User context: ${JSON.stringify(context.userInfo)}`
    });
  }

  if (context.productInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `Available products: ${JSON.stringify(context.productInfo)}`
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
  if (context.userInfo) {
    prompt += `User context: ${JSON.stringify(context.userInfo)}\n\n`;
  }

  if (context.productInfo) {
    prompt += `Available products: ${JSON.stringify(context.productInfo)}\n\n`;
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
  if (context.userInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `User context: ${JSON.stringify(context.userInfo)}`
    });
  }

  if (context.productInfo) {
    messages.splice(1, 0, {
      role: 'system',
      content: `Available products: ${JSON.stringify(context.productInfo)}`
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
export function addMedicalDisclaimer(response) {
  if (needsMedicalProfessional(response)) {
    return response + '\n\n⚠️ **Medical Disclaimer:** This is general information only and not medical advice. Please consult with a healthcare professional for personalized medical recommendations.';
  }
  return response;
}
