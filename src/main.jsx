import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { SettingsProvider } from './lib/settings.jsx';
import { LanguageProvider } from './lib/language.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <SettingsProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </SettingsProvider>
  </BrowserRouter>
);