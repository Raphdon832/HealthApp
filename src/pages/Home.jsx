import { useEffect, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import ClockIcon from '@/icons/react/ClockIcon';
import SearchIcon from '@/icons/react/SearchIcon';
import { listenProducts, addToCart, getAllPharmacies } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import ProductCard from '@/components/ProductCard';
import { useNavigate } from 'react-router-dom';
import HomeSkeletonMobile from '@/components/HomeSkeletonMobile';
import HomeSkeletonDesktop from '@/components/HomeSkeletonDesktop';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserLocation } from '@/hooks/useUserLocation';
import { findClosestPharmacyWithETA } from '@/lib/eta';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/language';

// Fixed Header Component - matching exact styling from original
const FixedHeader = ({ user, profile, location, navigate, etaInfo, closestPharmacy, vendors, userCoords, t }) => {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-white dark:bg-gray-900 border-b dark:border-gray-700 flex-shrink-0 px-2">
      <div className="w-full mx-auto pt-8 pb-4">
        <div className="pt-4 pb-2 w-full">
          <div className="w-full mx-auto px-0">
            <div className="flex justify-between items-center w-full h-[14px] md:h-[14px] lg:h-[20px]">
              <div className="flex flex-col justify-center">
                <div className="text-[17px] md:text-[26px] lg:text-[20px] font-regular font-poppins text-gray-900 dark:text-white">
                  {t('hello', 'Hello')}{user ? `, ${user.displayName?.split(' ')[0] || t('friend', 'Friend')}` : ''}
                </div>
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] md:text-[12px] lg:text-[14px] font-thin font-poppins truncate max-w-xs md:max-w-md lg:max-w-lg" title={location}>
                  {location}
                </span>
              </div>
              {profile?.role === 'customer' ? (
                <button
                  onClick={() => navigate('/pharmacy-map')}
                  className="flex flex-col justify-center items-end hover:bg-blue-50 transition-colors rounded-lg p-2 -m-2 group"
                >
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 mb-0.5 mt-0.5 text-sky-500" />
                    <ChevronRight className="h-4 w-4 md:h-3 md:w-3 lg:h-4 lg:w-4 text-sky-500 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 animate-pulse" />
                  </div>
                  <span className="text-[10px] md:text-[12px] lg:text-[14px] font-poppins font-thin text-right leading-tight mt-1.5 group-hover:text-blue-600 transition-colors">
                    {etaInfo && closestPharmacy
                      ? `${etaInfo.formatted} ${t('to', 'to')} ${vendors[closestPharmacy.vendorId]?.name || t('nearest_pharmacy', 'nearest pharmacy')}`
                      : userCoords ? t('calculating_eta', 'Calculating ETA...') : t('fetching_location', 'Fetching location...')}
                  </span>
                </button>
              ) : (
                <div className="flex flex-col justify-center items-end">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3 md:h-5 md:w-5 lg:h-6 lg:w-6 mb-0.5 mt-0.5 text-sky-500" />
                  </div>
                  <span className="text-[10px] md:text-[12px] lg:text-[14px] font-poppins font-thin text-right leading-tight mt-1.5 text-gray-800">
                    {profile?.role === 'pharmacy' ? t('your_pharmacy_location', 'Your pharmacy location') : t('location_services', 'Location services')}
                  </span>
                </div>
              )}
            </div>
            <div className="w-full" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function Home() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState({});
  const [pharmacies, setPharmacies] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [serverResults, setServerResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [q, setQ] = useState('');
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Use shared location hook
  const { userCoords, location } = useUserLocation();
  const [closestPharmacy, setClosestPharmacy] = useState(null);
  const [etaInfo, setEtaInfo] = useState(null);

  const newArrivalsRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showNewArrivalsModal, setShowNewArrivalsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Info cards
  const [infoCards, setInfoCards] = useState([]);
  const infoSectionRef = useRef(null);

  // Banner carousel state/refs (PERSISTENT — do NOT reset each render)
  const [activeIdx, setActiveIdx] = useState(0);
  const cardRefs = useRef([]); // array of DOM nodes for each card
  const setCardRef = (i) => (el) => {
    cardRefs.current[i] = el || null;
  };

  // Pagination state for product lists
  const [popularPage, setPopularPage] = useState(1);
  const [allNewPage, setAllNewPage] = useState(1);

  // Filtered products by search and category
  const filtered = useMemo(() => {
    // Start with all products or server results
    let baseProducts = products;
    const ql = q.trim().toLowerCase();
    
    // If server results are available and query active, prefer server-side results (more complete & scalable).
    if (ql && serverResults?.products && Array.isArray(serverResults.products)) {
      baseProducts = serverResults.products;
    }

    // Apply category filter first
    let filteredByCategory = baseProducts;
    if (selectedCategory && selectedCategory !== 'All') {
      filteredByCategory = baseProducts.filter((p) => {
        const productCategory = p.category || '';
        // Handle different category name variations
        if (selectedCategory === 'Over-the-counter') {
          return productCategory.toLowerCase().includes('over');
        }
        if (selectedCategory === 'Controlled') {
          return productCategory.toLowerCase().includes('control');
        }
        return productCategory === selectedCategory;
      });
    }

    // If no search query, return category-filtered results
    if (!ql) return filteredByCategory;

    // Apply search filter on top of category filter
    return filteredByCategory.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
      // vendor meta
      const v = p.vendorId ? (vendors[p.vendorId] || {}) : {};
      const vendorName = (v.name || '').toLowerCase();
      const vendorLocation = (v.location || '').toLowerCase();
      // price fields - try a few common names
      const priceFields = [p.price, p.mrp, p.cost, p.listPrice].map((x) => (x == null ? '' : String(x))).join(' ').toLowerCase();

      const matchesText = name.includes(ql) || category.includes(ql) || tags.includes(ql) || vendorName.includes(ql) || vendorLocation.includes(ql) || priceFields.includes(ql);

      // If q looks like a numeric price or contains currency symbol, try numeric matching
      const numeric = ql.replace(/[^0-9.]/g, '');
      const matchesNumeric = numeric && (priceFields.includes(numeric) || (p.price && String(p.price).includes(numeric)));

      return matchesText || !!matchesNumeric;
    });
  }, [products, q, selectedCategory, vendors, serverResults]);

  // Pharmacy suggestions for the search box (prefer server results if provided)
  const pharmacyMatches = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return [];
    if (serverResults?.pharmacies && Array.isArray(serverResults.pharmacies)) {
      return serverResults.pharmacies.slice(0, 6);
    }
    return pharmacies
      .filter((ph) => {
        const n = (ph.name || ph.displayName || '').toLowerCase();
        const addr = (ph.address || ph.city || ph.location || '').toLowerCase();
        return n.includes(ql) || addr.includes(ql);
      })
      .slice(0, 6);
  }, [pharmacies, q, serverResults]);

  useEffect(() => listenProducts(setProducts), []);

  // Calculate ETA to closest pharmacy when user location or pharmacies change
  useEffect(() => {
    async function calculateETA() {
      if (!userCoords) return;
      
      let pharmacyList = pharmacies;
      if (pharmacyList.length === 0) {
        pharmacyList = await getAllPharmacies();
        if (!pharmacyList || pharmacyList.length === 0) return;
      }

      const result = findClosestPharmacyWithETA(pharmacyList, userCoords, 'driving');
      if (result) {
        setClosestPharmacy(result.pharmacy);
        setEtaInfo(result.eta);
      } else {
        setClosestPharmacy(null);
        setEtaInfo(null);
      }
    }
    
    calculateETA();
  }, [userCoords, pharmacies]);

  // New Arrivals auto-scroll (unchanged)
  useEffect(() => {
    if (!newArrivalsRef.current) return;
    let interval;
    let userScrollTimeout;
    const handleUserScroll = () => {
      setIsUserScrolling(true);
      clearTimeout(userScrollTimeout);
      userScrollTimeout = setTimeout(() => setIsUserScrolling(false), 2000);
    };
    const el = newArrivalsRef.current;
    el.addEventListener('scroll', handleUserScroll);
    interval = setInterval(() => {
      if (!isUserScrolling && el) {
        el.scrollBy({ left: 120, behavior: 'smooth' });
        if (el.scrollLeft + el.offsetWidth >= el.scrollWidth - 5) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }
    }, 2500);
    return () => {
      clearInterval(interval);
      el.removeEventListener('scroll', handleUserScroll);
      if (userScrollTimeout) clearTimeout(userScrollTimeout);
    };
  }, [isUserScrolling, filtered.length]);

  // Vendors
  useEffect(() => {
    async function fetchVendors() {
      const vendorIds = Array.from(new Set(products.map((p) => p.vendorId).filter(Boolean)));
      const vendorMap = {};
      await Promise.all(
        vendorIds.map(async (vid) => {
          try {
            const snap = await getDoc(doc(db, 'pharmacies', vid));
            if (snap.exists()) {
              const data = snap.data() || {};
              vendorMap[vid] = {
                name: data.name || 'Pharmacy',
                location: data.address || data.city || data.location || '',
                coords: data.coordinates || null,
              };
            }
          } catch {}
        })
      );
      setVendors(vendorMap);
    }
    if (products.length) fetchVendors();
  }, [products]);

  // Fetch all pharmacies for local fallback and places matching
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await getAllPharmacies();
        if (!mounted) return;
        setPharmacies(Array.isArray(all) ? all : []);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Server-side search: debounce and query a serverless endpoint. Fall back to client-side filtering if missing.
  useEffect(() => {
    const ql = q.trim();
    if (!ql) {
      setServerResults(null);
      setIsSearching(false);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(async () => {
      setIsSearching(true);
      try {
        // This assumes a Netlify/Cloud Function at /.netlify/functions/search
        const res = await fetch(`/.netlify/functions/search?q=${encodeURIComponent(ql)}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('server search failed');
        const json = await res.json();
        // Expecting shape { products: [...], pharmacies: [...] }
        setServerResults(json || null);
      } catch (err) {
        setServerResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300); // debounce

    return () => {
      controller.abort();
      clearTimeout(id);
    };
  }, [q]);

  // Info cards from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'infoCards'), (snap) => {
      setInfoCards(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Popular/New
  const popularProducts = useMemo(() => {
    return [...filtered]
      .filter((p) => p.stock === undefined || p.stock > 0)
      .sort((a, b) => ((b.viewCount || 0) + (b.sold || 0)) - ((a.viewCount || 0) + (a.sold || 0)));
  }, [filtered]);

  const newArrivals = useMemo(() => {
    return [...products]
      .filter((p) => p.createdAt)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 12);
  }, [products]);

  const allNewArrivals = useMemo(() => {
    return [...products]
      .filter((p) => p.createdAt)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [products]);

  // Pagination calculations (client-side)
  const popularPerPage = 30;
  const popularTotalPages = Math.max(1, Math.ceil(popularProducts.length / popularPerPage));
  // "Load more" semantics: show cumulative items up to (page * perPage)
  const popularVisible = popularProducts.slice(0, popularPage * popularPerPage);

  const allNewPerPage = 12;
  const allNewTotalPages = Math.max(1, Math.ceil(allNewArrivals.length / allNewPerPage));
  const allNewVisible = allNewArrivals.slice(0, allNewPage * allNewPerPage);

  // Reset page indices when data set sizes change
  useEffect(() => setPopularPage(1), [popularProducts.length]);
  useEffect(() => setAllNewPage(1), [allNewArrivals.length]);

  // Helper function to translate info card text if it contains translation keys
  const translateCardText = (text) => {
    if (!text) return text;
    
    // Check if the text looks like a translation key (starts with t: or is surrounded by curly braces)
    if (text.startsWith('t:')) {
      const key = text.substring(2);
      return t(key, text);
    }
    
    // Check for {key} pattern
    const keyMatch = text.match(/^\{(.+)\}$/);
    if (keyMatch) {
      return t(keyMatch[1], text);
    }
    
    // Return original text if no translation pattern found
    return text;
  };

  // Normalize and classify links from info cards so clicks open the intended target
  const normalizeHref = (link) => {
    if (!link) return '';
    const l = String(link).trim();
    // already absolute or protocol-relative or mail/tel
    if (/^(https?:)?\/\//i.test(l) || /^mailto:/i.test(l) || /^tel:/i.test(l)) return l;
    // internal route
    if (l.startsWith('/')) return l;
    // no protocol and not internal -> assume https
    return `https://${l}`;
  };

  const isExternalHref = (href) => {
    if (!href) return false;
    return /^(https?:)?\/\//i.test(href) || /^mailto:/i.test(href) || /^tel:/i.test(href);
  };

  const handleProductOpen = async (productId) => {
    navigate(`/product/${productId}`);
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p)));
    try {
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      await updateDoc(doc(db, 'products', productId), { viewCount: increment(1) });
    } catch {}
  };

  // ===== Banner: snap detection (which card is centered) =====
  useEffect(() => {
    const wrap = infoSectionRef.current;
    if (!wrap) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = wrap.scrollLeft + wrap.clientWidth / 2;
        let best = 0, bestDist = Infinity;
        cardRefs.current.forEach((el, idx) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const wrect = wrap.getBoundingClientRect();
          const cardCenter = rect.left - wrect.left + rect.width / 2 + wrap.scrollLeft;
          const d = Math.abs(cardCenter - center);
          if (d < bestDist) { bestDist = d; best = idx; }
        });
        setActiveIdx(best);
      });
    };

    wrap.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial
    return () => {
      wrap.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [infoCards.length]);

  // ===== Banner: auto-advance (pauses on interaction) =====
  useEffect(() => {
    const wrap = infoSectionRef.current;
    if (!wrap || cardRefs.current.length === 0) return;

    // honor reduced motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let userInteracting = false;
    let idleTimer;

    const startUser = () => {
      userInteracting = true;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { userInteracting = false; }, 1800); // pause duration after user input
    };

    wrap.addEventListener('pointerdown', startUser);
    wrap.addEventListener('wheel', startUser, { passive: true });
    wrap.addEventListener('touchstart', startUser, { passive: true });

    const tick = setInterval(() => {
      if (userInteracting) return;
      const next = (activeIdx + 1) % cardRefs.current.length;
      // Use horizontal scroll on the carousel container instead of scrollIntoView
      // to avoid scrolling the whole page vertically in some browsers.
      const card = cardRefs.current[next];
      if (card && wrap) {
        const cardLeft = card.offsetLeft;
        const targetLeft = Math.max(0, Math.round(cardLeft - (wrap.clientWidth - card.clientWidth) / 2));
        wrap.scrollTo({ left: targetLeft, behavior: 'smooth' });
      }
    }, 3000); // interval between auto-advances (ms)

    return () => {
      clearInterval(tick);
      wrap.removeEventListener('pointerdown', startUser);
      wrap.removeEventListener('wheel', startUser);
      wrap.removeEventListener('touchstart', startUser);
      clearTimeout(idleTimer);
    };
  }, [activeIdx, infoCards.length]);

  const isPharmacy = user && user.role === 'pharmacy';

  // Map categories to SVG filenames in /public (leave 'All' without icon)
  const categoryIcons = {
    'Prescription': 'PrescriptionDrugs.svg',
    'Over-the-counter': 'Over-the-counter Icon.svg',
    'Syrup': 'Syrup.svg',
    'Therapeutic': 'Therapeutic.svg',
    'Controlled': 'ControlledSubstances.svg',
    'Target System': 'TargetSystem.svg',
  };

  if (!products.length) {
    return (
      <div className="px-4 md:px-6 lg:px-8 py-8">
        <div className="md:hidden">
          <HomeSkeletonMobile />
        </div>
        <div className="hidden md:block">
          <HomeSkeletonDesktop />
        </div>
      </div>
    );
  }

  return (
    <>
      <FixedHeader 
        user={user}
        profile={profile}
        location={location}
        navigate={navigate}
        etaInfo={etaInfo}
        closestPharmacy={closestPharmacy}
        vendors={vendors}
        userCoords={userCoords}
        t={t}
      />
      <div className="min-h-screen w-full px-0 pb-20 pt-32 bg-white dark:bg-gray-900">

      <div className="flex-1 overflow-y-auto w-full mx-auto flex flex-col pb-28 px-0">
        <div className="flex items-center gap-3 border-b border-zinc-300 dark:border-gray-600 dark:border-zinc-600 pb-2">
          <SearchIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-zinc-400 dark:text-zinc-500" />
          <input
            value={q}
            onChange={(e) => { 
              setQ(e.target.value); 
              setShowSearchSuggestions(true); 
              setSelectedSuggestionIndex(-1);
            }}
            onKeyDown={(e) => {
              if (!showSearchSuggestions || pharmacyMatches.length === 0) return;
              
              switch (e.key) {
                case 'ArrowDown':
                  e.preventDefault();
                  setSelectedSuggestionIndex(prev => 
                    prev < pharmacyMatches.length - 1 ? prev + 1 : 0
                  );
                  break;
                case 'ArrowUp':
                  e.preventDefault();
                  setSelectedSuggestionIndex(prev => 
                    prev > 0 ? prev - 1 : pharmacyMatches.length - 1
                  );
                  break;
                case 'Enter':
                  e.preventDefault();
                  if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < pharmacyMatches.length) {
                    const ph = pharmacyMatches[selectedSuggestionIndex];
                    setQ(ph.name || ph.displayName || '');
                    setShowSearchSuggestions(false);
                    const vendorId = ph.id || ph.vendorId;
                    if (vendorId) navigate(`/vendor/${vendorId}`);
                  }
                  break;
                case 'Escape':
                  setShowSearchSuggestions(false);
                  setSelectedSuggestionIndex(-1);
                  break;
              }
            }}
            onBlur={() => {
              // Delay hiding suggestions to allow clicking on them
              setTimeout(() => {
                setShowSearchSuggestions(false);
                setSelectedSuggestionIndex(-1);
              }, 200);
            }}
            placeholder={t('search_placeholder', 'Search drugs, pharmacies')}
            className="w-full outline-none bg-transparent text-gray-900 dark:text-white placeholder:text-[12px] md:placeholder:text-[14px] lg:placeholder:text-[16px] placeholder:text-[#888888] dark:placeholder:text-[#aaaaaa] placeholder:font-light"
          />
        </div>

        {/* Search suggestions: show matching pharmacies/places */}
        {showSearchSuggestions && q.trim().length > 0 && pharmacyMatches.length > 0 && (
          <div className="mt-2 left-0 right-0 md:left-6 md:right-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg divide-y dark:divide-gray-700 max-h-56 overflow-auto animate-fade-in">
            {pharmacyMatches.map((ph, index) => (
              <button
                key={ph.id || ph.vendorId || ph.name}
                onClick={() => {
                  // set query to pharmacy name and close suggestions
                  setQ(ph.name || ph.displayName || '');
                  setShowSearchSuggestions(false);
                  // Navigate to the pharmacy/vendor profile if we have an id
                  const vendorId = ph.id || ph.vendorId;
                  if (vendorId) {
                    try {
                      navigate(`/vendor/${vendorId}`);
                    } catch (err) {
                      // fallback: set location to help debugging
                      window.location.href = `/vendor/${vendorId}`;
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const vendorId = ph.id || ph.vendorId;
                    if (vendorId) navigate(`/vendor/${vendorId}`);
                  }
                }}
                className={`w-full text-left px-4 py-3 focus:outline-none transition-all duration-200 animate-fadeInUp border-b border-gray-100 last:border-b-0 ${
                  index === selectedSuggestionIndex 
                    ? 'bg-blue-100 border-blue-200' 
                    : 'hover:bg-zinc-50 focus:bg-zinc-100'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
                role="option"
                tabIndex={0}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 flex-shrink-0">
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {q.trim() && (ph.name || ph.displayName || '').toLowerCase().includes(q.toLowerCase()) ? (
                        <span>
                          {(ph.name || ph.displayName || '').split(new RegExp(`(${q})`, 'gi')).map((part, i) =>
                            part.toLowerCase() === q.toLowerCase() ? (
                              <span key={i} className="bg-yellow-200 px-1 rounded">{part}</span>
                            ) : (
                              part
                            )
                          )}
                        </span>
                      ) : (
                        ph.name || ph.displayName
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate mt-1">
                      {q.trim() && (ph.address || ph.city || ph.location || '').toLowerCase().includes(q.toLowerCase()) ? (
                        <span>
                          {(ph.address || ph.city || ph.location || '').split(new RegExp(`(${q})`, 'gi')).map((part, i) =>
                            part.toLowerCase() === q.toLowerCase() ? (
                              <span key={i} className="bg-yellow-200 px-1 rounded">{part}</span>
                            ) : (
                              part
                            )
                          )}
                        </span>
                      ) : (
                        ph.address || ph.city || ph.location || ''
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 font-medium flex-shrink-0">
                    Pharmacy
                  </div>
                </div>
              </button>
            ))}
            
            {/* Keyboard navigation hint */}
            {pharmacyMatches.length > 0 && (
              <div className="px-4 py-2 text-xs text-gray-500 text-center bg-gray-50 border-t animate-fade-in">
                Use ↑↓ arrow keys to navigate, Enter to select, Esc to close
              </div>
            )}
          </div>
        )}

        <div className="mt-3 mb-2 w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            {['All', 'Prescription', 'Over-the-counter', 'Syrup', 'Therapeutic', 'Controlled', 'Target System'].map((cat, index) => {
              const icon = categoryIcons[cat];
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  className={`flex items-center px-4 py-2 md:px-6 md:py-2.5 lg:px-8 lg:py-3 rounded-full text-[9px] md:text-[12px] lg:text-[14px] font-poppins font-light whitespace-nowrap border transition-all duration-200 btn-interactive animate-fadeInUp ${
                    isSelected 
                      ? 'bg-sky-100 dark:bg-sky-900 border-sky-400 dark:border-gray-600 dark:border-sky-500 text-sky-700 dark:text-sky-300 shadow-md scale-105' 
                      : 'bg-zinc-100 dark:bg-gray-700 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-gray-600 hover:bg-sky-50 dark:hover:bg-sky-800 hover:border-sky-300 dark:border-gray-600 dark:hover:border-sky-500 hover:shadow-sm'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {icon ? (
                    <>
                      <img
                        src={`/${encodeURIComponent(icon)}`}
                        alt={`${cat} icon`}
                        className={`h-4 w-4 md:h-5 md:w-5 mr-2 object-contain flex-shrink-0 transition-transform duration-200 dark:invert dark:brightness-0 dark:contrast-100 ${
                          isSelected ? 'scale-110' : ''
                        }`}
                      />
                      <span className="truncate">{cat}</span>
                    </>
                  ) : (
                    <span className="truncate">{cat}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info Section (homepage banner) */}
        {infoCards.length > 0 && (
          <div
            className="w-full mt-6 mb-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth"
            ref={infoSectionRef}
            role="region"
            aria-label="Announcements"
            style={{ height: 140 }}
          >
            <div className="flex gap-4 md:gap-6 min-w-max h-full">
              {infoCards.map((card, i) => {
                const bg = card.bgColor || '#3BA3FF';
                const headerColor = card.headerColor || '#ffffff';
                const previewColor = card.previewColor || (card.headerColor ? card.headerColor + 'cc' : '#ffffffcc');
                const linkColor = card.linkColor || card.linkTextColor || '#ffffff';
                const headerFontSize = card.headerFontSize || 20; // px
                const previewFontSize = card.previewFontSize || 13; // px
                const linkFontSize = card.linkTextFontSize || card.linkFontSize || 13;

                return (
                  <div
                    key={card.id}
                    ref={setCardRef(i)}
                    className="relative flex-shrink-0 snap-center rounded-2xl overflow-hidden"
                    style={{ width: '90vw', maxWidth: 700, minWidth: 260, height: '100%', background: bg, position: 'relative' }}
                  >
                    {/* If fullImage provided, render it as background and still overlay text */}
                    {card.fullImage && (
                      <img
                        src={card.fullImage}
                        alt={card.header || 'Info'}
                        className="w-full h-full object-cover"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}

                    {/* RIGHT IMAGE (behind text), fills height & stays right (only used when not fullImage) */}
                    {card.image && !card.fullImage && (
                      <div className="absolute inset-y-0 right-0 flex items-center justify-end pointer-events-none">
                        <img
                          src={card.image}
                          alt=""
                          className="object-cover"
                          style={{ height: '100%', maxWidth: '100%', borderRadius: '0 16px 16px 0' }}
                        />
                      </div>
                    )}

                    {/* Soft fade over right edge to keep text readable */}
                    <div
                      className="absolute inset-y-0 right-0"
                      style={{
                        width: '55%',
                        background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 60%, rgba(0,0,0,0.10) 100%)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* TEXT (constrained, above image) */}
                    <div className="relative z-10 h-full flex items-center">
                      <div className="px-4 md:px-6 py-5 min-w-0 max-w-[65%] md:max-w-[60%] lg:max-w-[60%]">
                        <div style={{ color: headerColor, fontSize: headerFontSize + 'px', lineHeight: 1, fontWeight: 300, letterSpacing: '-0.02em' }}>
                          {translateCardText(card.header) || '—'}
                        </div>
                        {card.preview && (
                          <div style={{ marginTop: 8, color: previewColor, fontSize: previewFontSize + 'px', lineHeight: 1.2 }}>
                            {translateCardText(card.preview)}
                          </div>
                        )}
                        {card.link && card.linkText && (
                          (() => {
                            const href = normalizeHref(card.link);
                            const external = isExternalHref(href);
                            return (
                              <a
                                href={href}
                                onClick={(e) => {
                                  // For internal routes use react-router navigation to avoid full page reloads.
                                  if (!external) {
                                    e.preventDefault();
                                    try { navigate(href); } catch (err) { window.location.href = href; }
                                  }
                                }}
                                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                style={{ display: 'inline-block', marginTop: 12, textDecoration: 'underline', color: linkColor, fontSize: linkFontSize + 'px', fontWeight: 500 }}
                              >
                                {translateCardText(card.linkText)}
                              </a>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] md:text-[18px] lg:text-[22px] font-medium font-poppins">{t('new_arrivals', 'New Arrivals')}</div>
            <button className="text-[13px] md:text-[15px] lg:text-[17px] font-normal font-poppins text-sky-600" onClick={() => setShowNewArrivalsModal(true)}>
              {t('view_all', 'view all')}
            </button>
          </div>
          <div
            ref={newArrivalsRef}
            className="w-full overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
            style={{ overflowX: 'auto' }}
            onMouseDown={(e) => {
              const el = newArrivalsRef.current;
              if (!el) return;
              let startX = e.pageX - el.offsetLeft;
              let scrollLeft = el.scrollLeft;
              function onMove(ev) {
                el.scrollLeft = scrollLeft - (ev.pageX - el.offsetLeft - startX);
              }
              function onUp() {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              }
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          >
            <div className="flex gap-3 md:gap-4 lg:gap-6 min-w-max pb-2">
              {newArrivals.map((p) => (
                <div className="relative" key={p.id || p.sku}>
                  <ProductCard
                    product={p}
                    onOpen={() => handleProductOpen(p.id)}
                    onAdd={() => (user ? addToCart(user.uid, p.id, 1) : alert(t('please_sign_in', 'Please sign in')))}
                    cardWidth="110px"
                    cardHeight="128px"
                    nameSize="11px"
                    nameWeight="medium"
                    nameTracking="-0.5px"
                    priceSize="9px"
                    priceColor="#BDBDBD"
                    priceWeight="medium"
                    addColor="#36A5FF"
                    addSize="9px"
                  />
                  <span className="absolute top-1 left-1 bg-sky-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-sm select-none pointer-events-none">
                    {t('new', 'New')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showNewArrivalsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-[20px] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-800 text-xl font-bold"
                onClick={() => setShowNewArrivalsModal(false)}
                aria-label={t('close', 'Close')}
              >
                &times;
              </button>
              <div className="text-[20px] md:text-[26px] font-light mb-4 font-poppins text-left">{t('all_new_products', 'All New Products')}</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
                {allNewVisible.map((p) => (
                   <div className="relative flex flex-col items-center" key={p.id || p.sku}>
                     <ProductCard
                       product={p}
                       onOpen={() => handleProductOpen(p.id)}
                       onAdd={() => (user ? addToCart(user.uid, p.id, 1) : alert(t(t('please_sign_in', 'please_sign_in', 'Please sign in'))))}
                       cardWidth="110px"
                       cardHeight="128px"
                       nameSize="11px"
                       nameWeight="semi-bold"
                       nameTracking="-0.5px"
                       priceSize="9px"
                       priceColor="#BDBDBD"
                       priceWeight="medium"
                       addColor="#36A5FF"
                       addSize="9px"
                     />
                     <span className="absolute top-1 left-1 bg-sky-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-sm select-none pointer-events-none">
                       {t('new', 'New')}
                     </span>
                   </div>
                ))}
              </div>
              {/* All New "Load more" (cumulative) */}
              {allNewTotalPages > 1 && allNewPage < allNewTotalPages && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    className="px-4 py-2 rounded-full bg-sky-600 text-white hover:bg-sky-700"
                    onClick={() => setAllNewPage((p) => Math.min(allNewTotalPages, p + 1))}
                    aria-label={t('load_more', 'Load more') + ' ' + t('new_arrivals', 'new arrivals')}
                  >
                    {t('load_more', 'Load more')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-10">
          <div className="text-[15px] md:text-[18px] lg:text-[22px] font-medium font-poppins mb-3">{t('popular_products', 'Popular Products')}</div>
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-6 lg:gap-8">
            {popularVisible.map((p) => (
               <div className="flex justify-center relative" key={(p.id || p.sku) + '-wrapper'}>
                 <ProductCard
                   key={p.id || p.sku}
                   product={p}
                   onOpen={() => handleProductOpen(p.id)}
                   onAdd={() => (user ? addToCart(user.uid, p.id, 1) : alert('Please sign in'))}
                   cardWidth="128px"
                   cardHeight="120px"
                   nameSize="12px"
                   nameWeight="semi-bold"
                   nameTracking="-0.5px"
                   nameLineHeight="-1.1"
                   priceSize="11px"
                   priceColor="#BDBDBD"
                   priceWeight="medium"
                   priceLineHeight="1.1"
                   addColor="#36A5FF"
                   addSize="9px"
                   borderRadius="10px"
                 />
               </div>
            ))}
          </div>

          {/* Popular "Load more" (cumulative) */}
          {popularTotalPages > 1 && popularPage < popularTotalPages && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                className="px-4 py-2 rounded-full bg-sky-600 text-white hover:bg-sky-700"
                onClick={() => setPopularPage((p) => Math.min(popularTotalPages, p + 1))}
                aria-label={t('load_more', 'Load more') + ' ' + t('popular_products', 'popular products')}
              >
                {t('load_more', 'Load more')}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
