import React, { createContext, useContext, useMemo } from 'react';
import { useSettings, SETTINGS_KEYS } from './settings';

const LanguageContext = createContext();

// Translation data
const translations = {
  en: {
    // General UI
    'home': 'Home',
    'cart': 'Cart',
    'messages': 'Messages',
    'orders': 'Orders',
    'settings': 'Settings',
    'notifications': 'Notifications',
    'search': 'Search',
    'back': 'Back',
    'continue': 'Continue',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'loading': 'Loading...',
    
    // Chat
    'message': 'Message',
    'sent': 'Sent',
    'delivered': 'Delivered',
    'read': 'Read',
    'type_message': 'Type a message...',
    'send': 'Send',
    
    // Product/Shopping
    'add_to_cart': 'Add to Cart',
    'buy_now': 'Buy Now',
    'price': 'Price',
    'out_of_stock': 'Out of Stock',
    'in_stock': 'In Stock',
    
    // Settings
    'general': 'General',
    'appearance': 'Appearance',
    'language_region': 'Language & Region',
    'privacy_security': 'Privacy & Security',
    'accessibility': 'Accessibility',
    'swipe_navigation': 'Swipe Navigation',
    'data_saver_mode': 'Data Saver Mode',
    'read_receipts': 'Read Receipts',
    'theme': 'Theme',
    'font_size': 'Font Size',
    'app_language': 'App Language'
  },
  
  yo: {
    // General UI (Yoruba)
    'home': 'Ile',
    'cart': 'Agolo',
    'messages': 'Ifiranše',
    'orders': 'Awọn ibere',
    'settings': 'Eto',
    'notifications': 'Iwifun',
    'search': 'Wa',
    'back': 'Pada',
    'continue': 'Tẹsiwaju',
    'save': 'Tọju',
    'cancel': 'Fagile',
    'delete': 'Pa rẹ',
    'edit': 'Ṣatunkọ',
    'loading': 'N gbe...',
    
    // Chat
    'message': 'Ifiranše',
    'sent': 'Ti fi ranše',
    'delivered': 'Ti gba',
    'read': 'Ti ka',
    'type_message': 'Kọ ifiranše...',
    'send': 'Fi ranše',
    
    // Settings
    'general': 'Gbogbogbo',
    'appearance': 'Irisi',
    'language_region': 'Ede & Agbegbe',
    'privacy_security': 'Aṣiri & Aabo',
    'accessibility': 'Iwọle',
    'swipe_navigation': 'Lilọ pẹlu fifọ',
    'data_saver_mode': 'Ipo itọju data',
    'read_receipts': 'Iwe eriwo kika',
    'theme': 'Koko',
    'font_size': 'Iwọn lẹta',
    'app_language': 'Ede ohun elo'
  },
  
  ha: {
    // General UI (Hausa)
    'home': 'Gida',
    'cart': 'Kaya',
    'messages': 'Saƙonni',
    'orders': 'Oda',
    'settings': 'Saiti',
    'notifications': 'Sanarwa',
    'search': 'Nema',
    'back': 'Baya',
    'continue': 'Ci gaba',
    'save': 'Ajiye',
    'cancel': 'Soke',
    'delete': 'Share',
    'edit': 'Gyara',
    'loading': 'Ana lodawa...',
    
    // Settings
    'general': 'Gabaɗaya',
    'appearance': 'Bayyanar',
    'language_region': 'Harshe da Yanki',
    'privacy_security': 'Sirri da Tsaro',
    'accessibility': 'Samun dama',
    'app_language': 'Harshen app'
  },
  
  ig: {
    // General UI (Igbo)
    'home': 'Ụlọ',
    'cart': 'Ngwa ahịa',
    'messages': 'Ozi',
    'orders': 'Ịtụ',
    'settings': 'Nhazi',
    'notifications': 'Ọkwa',
    'search': 'Chọọ',
    'back': 'Laghachi azụ',
    'continue': 'Gaa n\'ihu',
    'save': 'Chekwaa',
    'cancel': 'Kagbuo',
    'delete': 'Hichapụ',
    'edit': 'Dezie',
    'loading': 'Na-ebu...',
    
    // Settings
    'general': 'Izugbe',
    'appearance': 'Ọdịdị',
    'language_region': 'Asụsụ na Mpaghara',
    'privacy_security': 'Nzuzo na Nchekwa',
    'accessibility': 'Ịnweta ohere',
    'app_language': 'Asụsụ ngwa'
  },
  
  fr: {
    // General UI (French)
    'home': 'Accueil',
    'cart': 'Panier',
    'messages': 'Messages',
    'orders': 'Commandes',
    'settings': 'Paramètres',
    'notifications': 'Notifications',
    'search': 'Rechercher',
    'back': 'Retour',
    'continue': 'Continuer',
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'delete': 'Supprimer',
    'edit': 'Modifier',
    'loading': 'Chargement...',
    
    // Settings
    'general': 'Général',
    'appearance': 'Apparence',
    'language_region': 'Langue et Région',
    'privacy_security': 'Confidentialité et Sécurité',
    'accessibility': 'Accessibilité',
    'app_language': 'Langue de l\'application'
  }
};

export const useTranslation = () => {
  const { getSetting } = useSettings();
  const currentLanguage = getSetting(SETTINGS_KEYS.LANGUAGE) || 'en';
  
  const t = useMemo(() => {
    return (key, fallback = key) => {
      return translations[currentLanguage]?.[key] || translations['en']?.[key] || fallback;
    };
  }, [currentLanguage]);
  
  return { t, currentLanguage };
};

export const LanguageProvider = ({ children }) => {
  const { t, currentLanguage } = useTranslation();
  
  return (
    <LanguageContext.Provider value={{ t, currentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;