import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, MessageCircle, ArrowLeft, Search, Bookmark } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { listenProducts, getOrCreateThread, addVendorBookmark, removeVendorBookmark, isVendorBookmarked } from '@/lib/db'; // ⬅︎ use new helper
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ProductAvatar from '@/components/ProductAvatar';
import { useUserLocation } from '@/hooks/useUserLocation';
import { calculatePharmacyETA } from '@/lib/eta';

export default function VendorProfile() {
  const { id } = useParams();                  // pharmacyId (vendorId)
  const { userCoords } = useUserLocation();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [etaInfo, setEtaInfo] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // treat vertical (portrait) screens as mobile layout to avoid spillover on tall devices (e.g. iPad portrait)
  const [isPortrait, setIsPortrait] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(orientation: portrait)');
    const onChange = (e) => setIsPortrait(e.matches);
    setIsPortrait(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  const useMobileLayout = isPortrait;
  const navigate = useNavigate();
  const { user, profile } = useAuth();         // need role to enforce “customer-only”

  useEffect(() => {
    async function fetchVendor() {
      const snap = await getDoc(doc(db, 'pharmacies', id));
      setVendor(snap.data());
    }
    fetchVendor();
    return listenProducts(setProducts, id);
  }, [id]);

  // Check bookmark status when vendor and user are available
  useEffect(() => {
    async function checkBookmarkStatus() {
      if (user?.uid && id) {
        const bookmarked = await isVendorBookmarked(user.uid, id);
        setIsBookmarked(bookmarked);
      }
    }
    checkBookmarkStatus();
  }, [user?.uid, id]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    if (!user?.uid || !vendor) return;
    
    try {
      if (isBookmarked) {
        await removeVendorBookmark(user.uid, id);
        setIsBookmarked(false);
      } else {
        await addVendorBookmark(user.uid, id, {
          name: vendor.name,
          address: vendor.address,
          phone: vendor.phone,
          email: vendor.email,
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Calculate ETA when user location or vendor changes
  useEffect(() => {
    if (vendor && userCoords) {
      const eta = calculatePharmacyETA(vendor, userCoords, 'driving');
      setEtaInfo(eta);
    } else {
      setEtaInfo(null);
    }
  }, [vendor, userCoords]);

  // Filter products based on search term and generate suggestions
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else {
      const filtered = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      
      // Generate suggestions (limit to top 5 most relevant)
      const suggestions = filtered.slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0 && searchTerm.length > 0);
      setSelectedSuggestionIndex(-1); // Reset selection when suggestions change
    }
  }, [products, searchTerm]);

  // Render immediately; use optional chaining / defaults for vendor fields until data arrives

  const handleMessageVendor = async () => {
    // must be signed in
    if (!user || !user.uid) {
      navigate('/auth/landing');
      return;
    }
    // only customers can initiate
    if (profile?.role !== 'customer') {
      alert('Only customers can start a chat with a pharmacy.');
      return;
    }
    try {
      await getOrCreateThread({ vendorId: id, customerId: user.uid, role: 'customer' });
      // Navigate directly to the chat thread
      navigate(`/chat/${id}`);
    } catch (err) {
      console.error(err);
      alert('Could not start chat thread.');
    }
  };

  // PDF report generation (table format)
  const handleDownloadReport = async () => {
    if (!vendor) return;
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(18);
    doc.text('Pharmacy Report', 14, y);
    y += 10;
    doc.setFontSize(12);
    // Vendor Info Table
    autoTable(doc, {
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['Pharmacy', vendor.name || ''],
        ['Email', vendor.email || ''],
        ['Address', vendor.address || ''],
        ['Phone', vendor.phone || ''],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 144, 255] },
      styles: { fontSize: 11 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Products Table
    if (products.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Product Name', 'Category', 'Stock', 'SKU', 'Price']],
        body: products.map((p) => [
          p.name,
          p.category,
          p.stock,
          p.sku,
          `₦${Number(p.price).toLocaleString()}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 144, 255] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Orders Table (fetch orders for this vendor)
    let orders = [];
    try {
      // Example: fetch orders from Firestore (adjust as needed)
      // const q = query(collection(db, 'orders'), where('pharmacyId', '==', id));
      // const snap = await getDocs(q);
      // orders = snap.docs.map(doc => doc.data());
    } catch (e) {}
    if (orders.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Order ID', 'Customer', 'Status', 'Date', 'Products']],
        body: orders.map((order) => [
          order.id || '',
          order.customerName || '',
          order.status || '',
          order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : '',
          (order.items || []).map(item => `${item.name} (x${item.quantity})`).join(', ')
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 144, 255] },
        styles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
      });
    }

    doc.save(`${vendor.name || 'pharmacy'}-report.pdf`);
  };

  // Handle keyboard navigation for search suggestions
  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || searchSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
          const selectedProduct = searchSuggestions[selectedSuggestionIndex];
          navigate(`/product/${selectedProduct.id}`);
          setShowSearch(false);
          setSearchTerm('');
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Highlight matching text in suggestions
  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="bg-yellow-200 font-semibold">{part}</span> : 
        part
    );
  };

  // Fixed Header Component (Mobile Only)
  const FixedHeader = () => (
    <div className="md:hidden fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700">
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-[72px] h-[25px] font-poppins font-extralight tracking-tight text-[14px] flex items-center justify-center rounded-full bg-white border border-zinc-300 hover:scale-105 hover:shadow-md transition-all duration-200 active:scale-95"
        >
          <ArrowLeft className="h-3 w-3 mr-0" /> Back
        </button>
        <div className="text-[18px] font-light font-poppins leading-none">Vendor Profile</div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmarkToggle}
            className={`p-2 rounded-full border border-zinc-200 bg-white hover:scale-110 active:scale-95 transition-all duration-200 ${
              isBookmarked ? 'bg-sky-100 border-sky-300' : 'hover:bg-sky-50'
            }`}
            aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          >
            <Bookmark 
              className={`w-5 h-5 ${isBookmarked ? 'text-sky-600 fill-sky-600' : 'text-sky-600'}`} 
            />
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-full border border-zinc-200 bg-white hover:bg-sky-50 hover:scale-110 active:scale-95 transition-all duration-200"
            aria-label="Search products"
          >
            <Search className="w-5 h-5 text-sky-600" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(<FixedHeader />, document.body)}
      <div className="min-h-screen bg-white/80 dark:bg-gray-900/80 backdrop-blur-md w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 pt-24 md:pt-8 pb-28">
        {/* Sticky header with back button and title */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md pb-2 pt-4 -mx-4 sm:-mx-5 md:-mx-8 lg:-mx-12 xl:-mx-0 px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 items-center gap-3 animate-slide-down-fade hidden md:flex">
          <button
            onClick={() => navigate(-1)}
            className="w-[72px] h-[25px] font-poppins font-extralight tracking-tight text-[14px] flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-zinc-300 dark:border-gray-600 text-gray-900 dark:text-white mr-1 hover:scale-105 hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="h-3 w-3 mr-0" /> Back
          </button>
          <div className="-ml-1 text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-light font-poppins leading-none animate-text-reveal text-gray-900 dark:text-white">Vendor&nbsp;Profile</div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleBookmarkToggle}
              className={`p-2 rounded-full border border-zinc-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:scale-110 active:scale-95 transition-all duration-200 ${
                isBookmarked ? 'bg-sky-100 dark:bg-sky-900 border-sky-300 dark:border-sky-600' : 'hover:bg-sky-50 dark:hover:bg-sky-900/20'
              }`}
              aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
            >
              <Bookmark 
                className={`w-5 h-5 ${isBookmarked ? 'text-sky-600 fill-sky-600' : 'text-sky-600'}`} 
              />
            </button>
          </div>
        </div>

      {/* Central responsive area: on mobile stacked (vendor then products), on md+ grid with products (left) and vendor details + message (right) */}
      <div className="w-full mx-auto mt-6">
        <div className={`flex flex-col ${!useMobileLayout ? 'md:grid md:grid-cols-3' : ''} gap-6`}>

          {/* PRODUCTS: mobile order 2, md+ order 2 (right column spanning 2 cols) */}
          <div className={`order-2 ${!useMobileLayout ? 'md:order-2 md:col-span-2' : ''} animate-fade-in-up`}>
            {/* Products header (moved out of scrollable area) - sticky and aligned with vendor aside on md+ */}
            <div className={`border border-zinc-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 shadow-sm p-4 mb-4 flex items-center justify-between ${!useMobileLayout ? 'md:sticky md:top-20 md:bg-white/90 md:dark:bg-gray-800/90 md:backdrop-blur-sm md:z-20' : ''} animate-slide-down-fade`}>
              <div>
                <div className="text-[18px] font-poppins font-medium text-gray-900 dark:text-white">Products by<br/>{vendor?.name || 'Vendor'}</div>
                <div className="text-zinc-500 dark:text-zinc-400 text-[13px] font-poppins font-light">{searchTerm ? filteredProducts.length : products.length} {searchTerm && filteredProducts.length !== products.length ? `of ${products.length}` : ''} items</div>
              </div>
              <div>
                {filteredProducts.length > 3 && !showAll && (
                  <button
                    className="text-sky-600 dark:text-sky-400 text-[12px] font-poppins font-light px-3 py-1 rounded-full hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={() => setShowAll(true)}
                  >
                    See more
                  </button>
                )}
                {filteredProducts.length > 3 && showAll && (
                  <button
                    className="text-sky-600 dark:text-sky-400 text-[13px] font-poppins font-light px-3 py-1 rounded-full hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={() => setShowAll(false)}
                  >
                    See less
                  </button>
                )}
              </div>
            </div>

            <div className={`${!useMobileLayout ? 'md:max-h-[calc(100vh-12rem)] md:overflow-y-auto md:pr-4' : ''}`}>
              <div className="space-y-3 px-0">
                {(showAll ? filteredProducts : filteredProducts.slice(0, 3)).map((p, index) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-zinc-200 dark:border-gray-600 p-3 flex items-center gap-3 bg-white dark:bg-gray-800 shadow-sm cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200 overflow-hidden card-interactive animate-fadeInUp hover:scale-102 hover:shadow-lg"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    <div className="flex-shrink-0 animate-bounce-gentle">
                      <ProductAvatar name={p.name} image={p.image} category={p.category} size={30} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-poppins font-medium text-[15px] tracking-tight mb-1 truncate text-gray-900 dark:text-white" title={p.name}>{p.name}</div>
                      <div className="text-zinc-500 dark:text-zinc-400 text-[12px] font-poppins font-light truncate" title={`${p.category} • Stock: ${p.stock} • SKU: ${p.sku}`}>
                        {p.category} • Stock: {p.stock} • SKU: {p.sku}
                      </div>
                    </div>
                    <div className="text-[15px] font-poppins font-medium text-sky-600 ml-3 flex-shrink-0 animate-pulse-slow">₦{Number(p.price).toLocaleString()}</div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-zinc-500 dark:text-zinc-400 text-[13px] font-poppins font-light animate-fade-in">
                    {searchTerm ? 'No products found matching your search.' : 'No products yet.'}
                  </div>
                )}

                
              </div>
            </div>
          </div>

          {/* VENDOR DETAILS + MESSAGE: mobile order 1 (shown above products), md+ order 1 (left column) */}
          <aside className={`order-1 ${!useMobileLayout ? 'md:order-1 md:col-span-1 md:self-start md:sticky md:top-20' : ''} animate-fade-in-left`}>
            <div className="border border-zinc-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 shadow-sm p-5 mb-4 w-full flex flex-col items-start card-interactive hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-gray-700 flex items-center justify-center mb-2 animate-bounce-gentle hover:scale-110 transition-transform duration-200">
                <span className="text-[32px] font-poppins font-light text-sky-600 dark:text-sky-400">{vendor?.name?.charAt(0) || 'V'}</span>
              </div>
              <div className="text-[22px] font-poppins font-medium tracking-tight text-sky-600 dark:text-sky-400 mb-1 animate-text-reveal">{vendor?.name || 'Vendor'}</div>
              <div className="text-zinc-500 dark:text-zinc-400 text-[13px] font-poppins font-light mb-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>{vendor?.email || ''}</div>
               <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[13px] font-poppins font-light mb-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                 <MapPin className="h-3 w-3" /> {vendor?.address || ''}
               </div>
               <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[13px] font-poppins font-light mb-1 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Clock className="h-3 w-3" /> 
                {etaInfo 
                  ? `${etaInfo.formatted} to ${vendor?.name || 'vendor'}` 
                  : userCoords 
                    ? 'Calculating ETA...' 
                    : 'Fetching location...'
                }
              </div>
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[13px] font-poppins font-light animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <Phone className="h-3 w-3" /> {vendor?.phone || ''}
              </div>
            </div>

            {/* Message button: visible on all screens inside the aside so mobile shows it under vendor details and md+ keeps it on the right */}
            <div className="w-full mb-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <button
                onClick={handleMessageVendor}
                className="w-full rounded-full bg-sky-600 text-white h-[37px] text-[12px] font-poppins font-light flex items-center justify-center gap-2 btn-interactive hover:bg-sky-700 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <MessageCircle className="h-4 w-4" /> Message Vendor
              </button>
            </div>
          </aside>

        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-poppins font-medium text-gray-900 dark:text-white">Search Products</h3>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm('');
                  setShowSuggestions(false);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, category, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-poppins"
                autoFocus
              />
              
              {/* Live Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
                  {searchSuggestions.map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        navigate(`/product/${product.id}`);
                        setShowSearch(false);
                        setSearchTerm('');
                        setShowSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      }}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl ${
                        index === selectedSuggestionIndex 
                          ? 'bg-sky-50 border-sky-100' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <ProductAvatar 
                            name={product.name} 
                            image={product.image} 
                            category={product.category} 
                            size={24} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-poppins font-medium text-sm truncate ${
                            index === selectedSuggestionIndex ? 'text-sky-700' : 'text-gray-900'
                          }`}>
                            {highlightMatch(product.name, searchTerm)}
                          </div>
                          <div className={`text-xs truncate ${
                            index === selectedSuggestionIndex ? 'text-sky-600' : 'text-gray-500'
                          }`}>
                            {highlightMatch(product.category, searchTerm)} • ₦{Number(product.price || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowSearch(false);
                  setShowSuggestions(false);
                }}
                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors font-poppins font-medium"
              >
                View Results ({filteredProducts.length})
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setShowSearch(false);
                  setShowSuggestions(false);
                }}
                className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-poppins"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}
