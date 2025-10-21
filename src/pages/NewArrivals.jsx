import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { listenNewProducts, addToCart } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import ProductCard from '@/components/ProductCard';
import { useTranslation } from '@/lib/language';
import { ArrowLeft, Filter, Calendar, Sparkles, Package, Store, Clock } from 'lucide-react';

const FixedHeader = ({ t, total }) => {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-[100] px-4 py-4 border-b border-gray-100 dark:border-gray-800/70">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-[28px] sm:text-[35px] md:text-[42px] lg:text-[48px] font-light font-poppins text-gray-900 dark:text-white">
            {t('all_new_products', 'New Arrivals')}
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {total} {total === 1 ? t('product', 'Product') : t('products', 'Products')}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function NewArrivals() {
  const [newProducts, setNewProducts] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = listenNewProducts((products) => {
      setNewProducts(products);
      setLoading(false);
    }, 50);
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
    if (!productId) return;
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = (productId) => {
    if (!productId) return;
    if (user) {
      addToCart(user.uid, productId, 1);
    } else {
      alert(t('please_sign_in', 'Please sign in'));
    }
  };

  const toDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value === 'object' && typeof value.toDate === 'function') {
      try {
        const converted = value.toDate();
        return converted instanceof Date && !Number.isNaN(converted.getTime()) ? converted : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  const formatRelativeTime = (date) => {
    if (!date) return t('not_available', 'Not available');
    const diff = Date.now() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;

    if (diff < minute) {
      return t('just_now', 'Just now');
    }
    if (diff < hour) {
      const mins = Math.max(1, Math.round(diff / minute));
      return t('minutes_ago', `${mins}m ago`, { count: mins });
    }
    if (diff < day) {
      const hours = Math.max(1, Math.round(diff / hour));
      return t('hours_ago', `${hours}h ago`, { count: hours });
    }
    if (diff < week) {
      const days = Math.max(1, Math.round(diff / day));
      return t('days_ago', `${days}d ago`, { count: days });
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const dateFilters = useMemo(
    () => [
      {
        key: 'all',
        label: t('filter_all_time', 'All time'),
        hint: t('filter_all_time_hint', 'Every fresh product across the marketplace.'),
        badge: '∞',
      },
      {
        key: 'month',
        label: t('filter_this_month', 'This month'),
        hint: t('filter_this_month_hint', 'Only products added in the last 30 days.'),
        badge: '30d',
      },
      {
        key: 'week',
        label: t('filter_this_week', 'This week'),
        hint: t('filter_this_week_hint', 'Drops from the past 7 days.'),
        badge: '7d',
      },
      {
        key: 'today',
        label: t('filter_today', 'Today'),
        hint: t('filter_today_hint', 'Hot off the shelves today.'),
        badge: '24h',
      },
    ],
    [t]
  );

  const activeFilter = dateFilters.find((filter) => filter.key === selectedDateFilter) || dateFilters[0];

  const uniquePharmacies = useMemo(() => {
    const ids = new Set();
    filteredNewArrivals.forEach((product) => {
      if (product?.pharmacyId) ids.add(product.pharmacyId);
      else if (product?.vendorId) ids.add(product.vendorId);
      else if (product?.pharmacy) ids.add(product.pharmacy);
    });
    return ids.size;
  }, [filteredNewArrivals]);

  const latestArrivalDate = useMemo(() => {
    let latest = null;
    filteredNewArrivals.forEach((product) => {
      const createdAt = toDate(product?.createdAt);
      if (!createdAt) return;
      if (!latest || createdAt > latest) {
        latest = createdAt;
      }
    });
    return latest;
  }, [filteredNewArrivals]);

  const lastArrivalLabel = latestArrivalDate
    ? formatRelativeTime(latestArrivalDate)
    : t('awaiting_new_stock', 'Awaiting new stock');

  const lastArrivalExact = latestArrivalDate
    ? latestArrivalDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : t('no_timestamp', '—');

  const lastUpdatedLabel = useMemo(
    () =>
      new Date().toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [filteredNewArrivals.length, selectedDateFilter]
  );

  const stats = useMemo(
    () => [
      {
        key: 'total',
        label: t('new_products', 'New products'),
        value: filteredNewArrivals.length,
        helper: t('new_products_helper', 'Ready to browse'),
        icon: Package,
      },
      {
        key: 'vendors',
        label: t('participating_pharmacies', 'Participating pharmacies'),
        value: uniquePharmacies || '—',
        helper: t('participating_pharmacies_helper', 'Listing new inventory'),
        icon: Store,
      },
      {
        key: 'latest',
        label: t('latest_drop', 'Latest drop'),
        value: lastArrivalLabel,
        helper: lastArrivalExact,
        icon: Clock,
      },
    ],
    [filteredNewArrivals.length, uniquePharmacies, lastArrivalLabel, lastArrivalExact, t]
  );

  if (loading) {
    return (
      <>
        <FixedHeader t={t} total={0} />
        <div className="min-h-screen bg-gradient-to-br from-[#F6F9FF] via-white to-[#E4F0FF] px-6 py-16 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
          <div className="mx-auto w-full max-w-6xl space-y-8 animate-pulse">
            <div className="h-10 w-48 rounded-full bg-white/70 dark:bg-gray-800/80" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-3xl border border-sky-100/80 bg-white/80 dark:border-gray-800/70 dark:bg-gray-900/70"
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-sky-100/60 bg-white/90 p-4 shadow-sm dark:border-gray-800/70 dark:bg-gray-900/70"
                >
                  <div className="mb-4 h-36 rounded-2xl bg-sky-100/50 dark:bg-gray-800" />
                  <div className="mb-2 h-3 rounded bg-sky-100/60 dark:bg-gray-700" />
                  <div className="h-3 w-3/4 rounded bg-sky-100/60 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FixedHeader t={t} total={filteredNewArrivals.length} />
      <div className="pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-24 sm:pb-28 w-full mx-auto px-0 sm:px-4 md:px-8 lg:px-12 xl:px-16 min-h-screen bg-gradient-to-br from-[#F6F9FF] via-white to-[#E4F0FF] dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6 sm:gap-8">
          <section className="mt-1 flex gap-4 overflow-x-auto scrollbar-hide pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:overflow-x-visible">
            {stats.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className="rounded-2xl border border-sky-200/70 dark:border-sky-200/40 bg-white dark:bg-gray-900 p-4 sm:p-6 min-w-0 flex-shrink-0 w-48 sm:w-auto flex flex-col justify-center min-h-[120px] sm:min-h-[140px]"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">
                    {card.label}
                  </div>
                  <div className="mt-2 sm:mt-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                    {card.value}
                  </div>
                  <div className="mt-1 sm:mt-2 flex items-center justify-between gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <span className="line-clamp-2 flex-1">{card.helper}</span>
                    <span className="rounded-full border border-sky-100/70 bg-sky-50/80 p-2 text-sky-600 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="grid gap-4 sm:gap-6 lg:grid-cols-[280px,1fr] lg:gap-6 xl:grid-cols-[320px,1fr]">
            <div className="hidden space-y-4 sm:space-y-6 lg:block">
              <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t('filter_by_time', 'Filter by time')}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {t('filter_by_time_hint', 'Focus the list by arrival window.')}
                </p>
                <div className="mt-3 sm:mt-4 grid gap-2">
                  {dateFilters.map((filter) => {
                    const isActive = selectedDateFilter === filter.key;
                    return (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setSelectedDateFilter(filter.key)}
                        className={`w-full rounded-full border px-3 py-2 text-xs sm:text-sm transition ${
                          isActive
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'border-gray-200 text-gray-600 hover:border-sky-400/70 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t('latest_drop', 'Latest drop')}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {t('last_updated_at', 'Last updated {{time}}', { time: lastArrivalExact })}
                </p>
                <p className="mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    'new_arrivals_footer',
                    'Inventory is refreshed in real time as pharmacies list new stock. Check back often for more drops.'
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-500/80 dark:text-sky-300/70">
                    <Sparkles className="h-4 w-4" />
                    {t('fresh_drops', 'Fresh drops')}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {t('all_new_products', 'New Arrivals')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activeFilter?.hint}</p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('last_updated_at', 'Last updated {{time}}', { time: lastUpdatedLabel })}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {dateFilters.map((filter) => {
                  const isActive = selectedDateFilter === filter.key;
                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setSelectedDateFilter(filter.key)}
                      className={`rounded-full border px-4 py-2 text-xs sm:text-sm transition ${
                        isActive
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'border-gray-200 text-gray-600 hover:border-sky-400/70 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                {filteredNewArrivals.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {filteredNewArrivals.map((product, index) => {
                      const arrivalDate = toDate(product?.createdAt);
                      const arrivalRelative = formatRelativeTime(arrivalDate);
                      const arrivalLabel = arrivalDate
                        ? arrivalDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                        : t('arrival_date_pending', 'Date pending');
                      const vendorName =
                        product?.vendorName ||
                        product?.pharmacyName ||
                        product?.pharmacy ||
                        t('unknown_pharmacy', 'Unnamed pharmacy');
                      const category = product?.category || t('category_generic', 'General');
                      const productKey = product?.id || product?.sku || `${index}`;

                      return (
                        <div
                          key={productKey}
                          className="flex flex-col gap-4 rounded-3xl border border-sky-100/80 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-200/50 dark:border-gray-800/70 dark:bg-gray-900/80 dark:hover:shadow-sky-900/20"
                        >
                          <div className="flex items-center justify-between">
                            <span className="rounded-full border border-sky-200/70 bg-sky-50/90 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200">
                              {arrivalRelative}
                            </span>
                            <span className="rounded-full border border-sky-100/70 bg-white/80 px-3 py-1 text-xs font-medium text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
                              {category}
                            </span>
                          </div>
                          <ProductCard
                            product={product}
                            vendorName={vendorName}
                            onOpen={() => handleProductOpen(product?.id)}
                            onAdd={() => handleAddToCart(product?.id)}
                            cardWidth="100%"
                            cardHeight="200px"
                            nameSize="14px"
                            priceSize="13px"
                            priceColor="#334155"
                            priceWeight="600"
                            addColor="#0284C7"
                            borderRadius="18px"
                          />
                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => handleProductOpen(product?.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white px-4 py-2 text-xs font-medium text-sky-700 transition hover:border-sky-300 hover:text-sky-600 dark:border-sky-500/40 dark:bg-gray-900/70 dark:text-sky-200"
                            >
                              <Sparkles className="h-4 w-4" />
                              {t('view_details', 'View details')}
                            </button>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{vendorName}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">{arrivalLabel}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-sky-100/80 bg-white/90 px-6 py-14 text-center shadow-sm dark:border-gray-800/70 dark:bg-gray-900/80">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-sky-100/80 bg-sky-50/80 text-sky-500 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200">
                      <Calendar className="h-8 w-8" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
                      {t('no_products_found', 'No arrivals in this window')}
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-sm text-gray-500 dark:text-gray-400">
                      {t('no_products_found_hint', 'Try choosing a different time filter or reset to view every new product.')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedDateFilter('all')}
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-sky-200/50 transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white dark:shadow-none dark:focus:ring-offset-gray-900"
                    >
                      {t('reset_filters', 'Show all new arrivals')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
