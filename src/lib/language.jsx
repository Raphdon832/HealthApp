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
    
    // Homepage
    'hello': 'Hello',
    'friend': 'Friend',
    'search_placeholder': 'Search drugs, pharmacies',
    'new_arrivals': 'New Arrivals',
    'view_all': 'view all',
    'popular_products': 'Popular Products',
    'all_new_products': 'All New Products',
    'load_more': 'Load more',
    'new': 'New',
    'close': 'Close',
    'please_sign_in': 'Please sign in',
    'your_pharmacy_location': 'Your pharmacy location',
    'location_services': 'Location services',
    'calculating_eta': 'Calculating ETA...',
    'fetching_location': 'Fetching location...',
    'nearest_pharmacy': 'nearest pharmacy',
    'to': 'to',
    
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
    
    // Homepage (Yoruba)
    'hello': 'Bawo',
    'friend': 'Ore',
    'search_placeholder': 'Wa oogun, ile oogun',
    'new_arrivals': 'Awọn tuntun',
    'view_all': 'wo gbogbo',
    'popular_products': 'Awọn oogun olokiki',
    'all_new_products': 'Gbogbo oogun tuntun',
    'load_more': 'Gbe siwaju',
    'new': 'Tuntun',
    'close': 'Ti',
    'please_sign_in': 'Jọwọ wọle',
    'your_pharmacy_location': 'Ipo ile oogun rẹ',
    'location_services': 'Awọn iṣẹ ipo',
    'calculating_eta': 'N ṣe iṣiro akoko...',
    'fetching_location': 'N gba ipo...',
    'nearest_pharmacy': 'ile oogun to sunmọ',
    'to': 'si',
    
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
    
    // Homepage (Hausa)
    'hello': 'Sannu',
    'friend': 'Aboki',
    'search_placeholder': 'Nema magunguna, kantin magani',
    'new_arrivals': 'Sababbin abubuwa',
    'view_all': 'dubi duka',
    'popular_products': 'Shahararrun magunguna',
    'all_new_products': 'Dukan sababbin magunguna',
    'load_more': 'Dauko kari',
    'new': 'Sabon',
    'close': 'Rufe',
    'please_sign_in': 'Ka shigar da sunan',
    'your_pharmacy_location': 'Wurin kantin maganin ku',
    'location_services': 'Sabis na wuri',
    'calculating_eta': 'Ana lissafa lokaci...',
    'fetching_location': 'Ana samun wuri...',
    'nearest_pharmacy': 'kantin magani mafi kusa',
    'to': 'zuwa',
    
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
    
    // Homepage (Igbo)
    'hello': 'Ndewo',
    'friend': 'Enyi',
    'search_placeholder': 'Chọọ ọgwụ, ụlọ ọgwụ',
    'new_arrivals': 'Ndị ọhụrụ',
    'view_all': 'lee niile',
    'popular_products': 'Ọgwụ ndị ama ama',
    'all_new_products': 'Ọgwụ ọhụrụ niile',
    'load_more': 'Buo karịa',
    'new': 'Ọhụrụ',
    'close': 'Mechie',
    'please_sign_in': 'Biko banye',
    'your_pharmacy_location': 'Ọnọdụ ụlọ ọgwụ gị',
    'location_services': 'Ọrụ ọnọdụ',
    'calculating_eta': 'Na-agbako oge...',
    'fetching_location': 'Na-eweta ọnọdụ...',
    'nearest_pharmacy': 'ụlọ ọgwụ kacha nso',
    'to': 'gaa',
    
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
    
    // Homepage (French)
    'hello': 'Bonjour',
    'friend': 'Ami',
    'search_placeholder': 'Rechercher médicaments, pharmacies',
    'new_arrivals': 'Nouveautés',
    'view_all': 'voir tout',
    'popular_products': 'Produits populaires',
    'all_new_products': 'Tous les nouveaux produits',
    'load_more': 'Charger plus',
    'new': 'Nouveau',
    'close': 'Fermer',
    'please_sign_in': 'Veuillez vous connecter',
    'your_pharmacy_location': 'Emplacement de votre pharmacie',
    'location_services': 'Services de localisation',
    'calculating_eta': 'Calcul du temps...',
    'fetching_location': 'Obtention de la localisation...',
    'nearest_pharmacy': 'pharmacie la plus proche',
    'to': 'vers',
    
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