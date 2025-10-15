# AI Chatbot Setup Guide

## Environment Variables

To enable the AI chatbot functionality, you need to add your OpenAI API key to your environment variables.

### 1. Create a `.env` file in the root directory (if it doesn't exist)

### 2. Add your OpenAI API key:
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Get your API key from OpenAI:
- Go to https://platform.openai.com/api-keys
- Create a new API key
- Copy it to your `.env` file

### 4. Restart your development server:
```bash
npm run dev
```

## Features

The AI chatbot includes:
- **Health Information**: General wellness tips and health concepts
- **Product Information**: Help with understanding medications and products
- **Pharmacy Services**: Information about prescriptions and pharmacy processes
- **Safety Features**: Medical disclaimers and professional consultation recommendations
- **Multi-language Support**: Works with the app's existing i18n system

## Usage

Users can access the AI chatbot through the bottom navigation (AI Chat tab). The chatbot will:
- Provide general health information
- Help with product questions
- Explain pharmacy services
- Always include medical disclaimers for health-related topics
- Recommend consulting healthcare professionals for medical advice

## Safety Guidelines

The AI is programmed with strict safety guidelines:
- Never gives medical advice or diagnoses
- Never suggests specific medications or dosages
- Always includes disclaimers for health topics
- Redirects users to consult healthcare professionals

## Technical Details

- Uses OpenAI GPT-3.5-turbo for responses
- Conversations are stored in Firestore (`ai_conversations` collection)
- Integrated with the app's existing authentication and i18n systems
- Responsive design matching the app's UI patterns
