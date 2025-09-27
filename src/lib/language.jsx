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
    
    // Info Cards
    'welcome_message': 'Welcome to PharmaSeA',
    'find_medicines': 'Find medicines near you',
    'fast_delivery': 'Fast & reliable delivery',
    'learn_more': 'Learn more',
    'get_started': 'Get started',
    'shop_now': 'Shop now',
    'order_now': 'Order now',
    'browse_catalog': 'Browse catalog',
    'special_offer': 'Special Offer',
    'limited_time': 'Limited time offer',
    
    // Orders page
    'orders': 'Orders',
    'all': 'All',
    'pending': 'Pending',
    'processing': 'Processing',
    'fulfilled': 'Fulfilled',
    'cancelled': 'Cancelled',
    'no_orders_yet': 'No orders yet.',
    'order_number': 'Order #',
    'customer': 'Customer',
    'items': 'Items',
    'total': 'Total',
    'status': 'Status',
    'see_more': 'See more',
    'see_less': 'See less',
    'more_items': 'more',
    'reveal_number': 'Reveal Number',
    'please_sign_in_continue': 'Please sign in to continue',
    'sign_in_sign_up': 'Sign In / Sign Up',
    'qty': 'Qty',
    
    // Messages page
    'my_conversations': 'My\nConversations',
    'search_chats': 'Search chats',
    'no_conversations_yet': 'No conversations yet.',
    'no_messages_yet': 'No messages yet.',
    
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
    
    // Info Cards (Yoruba)
    'welcome_message': 'Kaabo si PharmaSeA',
    'find_medicines': 'Wa awọn oogun to wa nitosi rẹ',
    'fast_delivery': 'Ifijiṣẹ to yara ati to gbẹkẹle',
    'learn_more': 'Kọ siwaju si',
    'get_started': 'Bẹrẹ',
    'shop_now': 'Ra ni bayi',
    'order_now': 'Bere ni bayi',
    'browse_catalog': 'Wo awọn oogun wa',
    'special_offer': 'Ipese Pataki',
    'limited_time': 'Ipese akoko die',
    
    // Orders page (Yoruba)
    'orders': 'Awọn ibere',
    'all': 'Gbogbo',
    'pending': 'Ti nduro',
    'processing': 'N ṣiṣẹ',
    'fulfilled': 'Ti pari',
    'cancelled': 'Ti fagile',
    'no_orders_yet': 'Ko si ibere kankan sibẹ.',
    'order_number': 'Ibere #',
    'customer': 'Onibara',
    'items': 'Awọn nkan',
    'total': 'Lapapọ',
    'status': 'Ipo',
    'see_more': 'Wo siwaju si',
    'see_less': 'Wo diẹ kere si',
    'more_items': 'siwaju si',
    'reveal_number': 'Fi nọmba han',
    'please_sign_in_continue': 'Jọwọ wọle lati tẹsiwaju',
    'sign_in_sign_up': 'Wọle / Forukọsilẹ',
    'qty': 'Iye',
    
    // Messages page (Yoruba)
    'my_conversations': 'Awọn\nIforọranṣẹ Mi',
    'search_chats': 'Wa awọn iforọranṣẹ',
    'no_conversations_yet': 'Ko si iforọranṣẹ kankan sibẹ.',
    'no_messages_yet': 'Ko si ifiranṣẹ kankan sibẹ.',
    
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
    
    // Info Cards (Hausa)
    'welcome_message': 'Barka da zuwa PharmaSeA',
    'find_medicines': 'Nemo magunguna a kusa da ku',
    'fast_delivery': 'Isar da sauri da aminci',
    'learn_more': 'Koyi karin bayani',
    'get_started': 'Fara',
    'shop_now': 'Sayi yanzu',
    'order_now': 'Yi oda yanzu',
    'browse_catalog': 'Duba magunguna',
    'special_offer': 'Tayin na musamman',
    'limited_time': 'Tayin na ɗan lokaci',
    
    // Orders page (Hausa)
    'orders': 'Oda',
    'all': 'Duka',
    'pending': 'Ana jira',
    'processing': 'Ana aiki',
    'fulfilled': 'An gama',
    'cancelled': 'An soke',
    'no_orders_yet': 'Babu oda tukuna.',
    'order_number': 'Oda #',
    'customer': 'Abokin ciniki',
    'items': 'Abubuwa',
    'total': 'Duka',
    'status': 'Matsayi',
    'see_more': 'Duba karin',
    'see_less': 'Duba kadan',
    'more_items': 'kari',
    'reveal_number': 'Nuna lambar',
    'please_sign_in_continue': 'Ka shigar da sunan don ci gaba',
    'sign_in_sign_up': 'Shiga / Yi rajista',
    'qty': 'Adadi',
    
    // Messages page (Hausa)
    'my_conversations': 'Tattaunawa\nNa',
    'search_chats': 'Nemo tattaunawa',
    'no_conversations_yet': 'Babu tattaunawa tukuna.',
    'no_messages_yet': 'Babu saƙonni tukuna.',
    
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
    
    // Info Cards (Igbo)
    'welcome_message': 'Nnọọ na PharmaSeA',
    'find_medicines': 'Chọta ọgwụ ndị dị gị nso',
    'fast_delivery': 'Nnyefe ọsọ ọsọ na ntụkwasị obi',
    'learn_more': 'Mụtakwuo ihe',
    'get_started': 'Malite',
    'shop_now': 'Zụọ ugbu a',
    'order_now': 'Nye ọtụtụ ugbu a',
    'browse_catalog': 'Lelee ọgwụ ndị anyị nwere',
    'special_offer': 'Onyinye pụrụ iche',
    'limited_time': 'Onyinye nwa oge',
    
    // Orders page (Igbo)
    'orders': 'Ịtụ',
    'all': 'Niile',
    'pending': 'Na-echere',
    'processing': 'Na-arụ ọrụ',
    'fulfilled': 'Emezula',
    'cancelled': 'Akagbuola',
    'no_orders_yet': 'Enwebeghị ịtụ ọ bụla.',
    'order_number': 'Ịtụ #',
    'customer': 'Onye ahịa',
    'items': 'Ihe ndị',
    'total': 'Mkpokọta',
    'status': 'Ọnọdụ',
    'see_more': 'Hụkwuo',
    'see_less': 'Hụ nke nta',
    'more_items': 'karịa',
    'reveal_number': 'Gosi nọmba',
    'please_sign_in_continue': 'Biko banye ịga n\'ihu',
    'sign_in_sign_up': 'Banye / Debanye aha',
    'qty': 'Ọnụọgụgụ',
    
    // Messages page (Igbo)
    'my_conversations': 'Mkparịta ụka\nM',
    'search_chats': 'Chọọ mkparịta ụka',
    'no_conversations_yet': 'Enwebeghị mkparịta ụka ọ bụla.',
    'no_messages_yet': 'Enwebeghị ozi ọ bụla.',
    
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
    
    // Info Cards (French)
    'welcome_message': 'Bienvenue à PharmaSeA',
    'find_medicines': 'Trouvez des médicaments près de chez vous',
    'fast_delivery': 'Livraison rapide et fiable',
    'learn_more': 'En savoir plus',
    'get_started': 'Commencer',
    'shop_now': 'Acheter maintenant',
    'order_now': 'Commander maintenant',
    'browse_catalog': 'Parcourir le catalogue',
    'special_offer': 'Offre spéciale',
    'limited_time': 'Offre à durée limitée',
    
    // Orders page (French)
    'orders': 'Commandes',
    'all': 'Tout',
    'pending': 'En attente',
    'processing': 'En cours',
    'fulfilled': 'Livré',
    'cancelled': 'Annulé',
    'no_orders_yet': 'Aucune commande pour le moment.',
    'order_number': 'Commande #',
    'customer': 'Client',
    'items': 'Articles',
    'total': 'Total',
    'status': 'Statut',
    'see_more': 'Voir plus',
    'see_less': 'Voir moins',
    'more_items': 'de plus',
    'reveal_number': 'Révéler le numéro',
    'please_sign_in_continue': 'Veuillez vous connecter pour continuer',
    'sign_in_sign_up': 'Se connecter / S\'inscrire',
    'qty': 'Qté',
    
    // Messages page (French)
    'my_conversations': 'Mes\nConversations',
    'search_chats': 'Rechercher des conversations',
    'no_conversations_yet': 'Aucune conversation pour le moment.',
    'no_messages_yet': 'Aucun message pour le moment.',
    
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