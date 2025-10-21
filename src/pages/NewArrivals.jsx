import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listenNewProducts, addToCart } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import ProductCard from '@/components/ProductCard';
import { useTranslation } from '@/lib/language';
import { ArrowLeft, Filter, Calendar } from 'lucide-react';

export default function NewArrivals() {
  const [newProducts, setNewProducts] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = listenNewProducts(setNewProducts, 50);
    setLoading(false);
    return unsubscribe;
  }, []);

  // Date filtering helper function
  const getDateFilterRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { start: monthStart, end: monthEnd };
      case 'all':
      default:
        return null; // No date filter
    }
  };

  // Filtered new arrivals
  const filteredNewArrivals = useMemo(() => {
    if (selectedDateFilter === 'all') {
      return newProducts.slice(0, 12);
    }

    const range = getDateFilterRange(selectedDateFilter);
    if (!range) return newProducts.slice(0, 12);

    return newProducts
      .filter((product) => {
        if (!product.createdAt) return false;
        const productDate = product.createdAt.toDate ? product.createdAt.toDate() : new Date(product.createdAt);
        return productDate >= range.start && productDate < range.end;
      })
      .slice(0, 12);
  }, [newProducts, selectedDateFilter]);

  const handleProductOpen = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = (productId) => {
    if (user) {
      addToCart(user.uid, productId, 1);
    } else {
      alert(t('please_sign_in', 'Please sign in'));
    }
  };

  const dateFilters = [
    { key: 'all', label: 'All Time', icon: '🌟' },
    { key: 'month', label: 'This Month', icon: '📅' },
    { key: 'week', label: 'This Week', icon: '📊' },
    { key: 'today', label: 'Today', icon: '⚡' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6 w-48"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-poppins">
                  {t('all_new_products', 'New Arrivals')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Discover the latest products from our pharmacies
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {filteredNewArrivals.length} products
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Date Filter Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filter by Time
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {dateFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedDateFilter(filter.key)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap min-w-fit ${
                  selectedDateFilter === filter.key
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <span className="text-lg">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredNewArrivals.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredNewArrivals.map((product, index) => (
              <div
                key={product.id || product.sku}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                {/* New Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    NEW
                  </span>
                </div>

                {/* Product Card */}
                <div className="p-4">
                  <ProductCard
                    product={product}
                    onOpen={() => handleProductOpen(product.id)}
                    onAdd={() => handleAddToCart(product.id)}
                    cardWidth="100%"
                    cardHeight="140px"
                    nameSize="13px"
                    nameWeight="semibold"
                    nameTracking="-0.3px"
                    priceSize="12px"
                    priceColor="#6B7280"
                    priceWeight="medium"
                    addColor="#4F46E5"
                    addSize="11px"
                    showBorder={false}
                  />
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try selecting a different time filter to see more products.
            </p>
            <button
              onClick={() => setSelectedDateFilter('all')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Show All Products
            </button>
          </div>
        )}

        {/* Stats Footer */}
        {filteredNewArrivals.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{filteredNewArrivals.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Products</div>
              </div>
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {new Date().toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Last Updated</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}