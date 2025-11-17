import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/language";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "@/components/Modal";
import ProductAvatar from "@/components/ProductAvatar";

const ORDER_STATUSES = ["pending", "processing", "fulfilled", "cancelled"];

// Fixed Header Component
const FixedHeader = ({ title, t }) => {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-[100] px-4 py-4 border-b border-gray-100 dark:border-gray-700">
      <div className="w-full mx-auto">
        <h1 className="mt-8 text-[28px] sm:text-[35px] md:text-[42px] lg:text-[48px] font-light font-poppins text-gray-900 dark:text-white">
          {t("orders", "Orders")}
        </h1>
      </div>
    </div>,
    document.body
  );
};

export default function Orders() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState({}); // Track expanded state per order
  const [revealedNumbers, setRevealedNumbers] = useState({}); // Track revealed phone numbers per order
  const [modalOrder, setModalOrder] = useState(null);
  const [modalOrderProducts, setModalOrderProducts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [highlightOrderId, setHighlightOrderId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const isPharmacy = profile?.role === "pharmacy";
  const metrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalRevenue: 0,
        pendingCount: 0,
        topMonth: null,
      };
    }

    const totalRevenueValue = orders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );
    const pendingCountValue = orders.reduce(
      (count, order) =>
        count + ((order.status || "pending") === "pending" ? 1 : 0),
      0
    );

    const monthBuckets = orders.reduce((acc, order) => {
      let createdAt = null;
      const firestoreDate = order.createdAt?.toDate?.();
      if (
        firestoreDate instanceof Date &&
        !Number.isNaN(firestoreDate.getTime())
      ) {
        createdAt = firestoreDate;
      } else if (order.createdAt) {
        const parsed = new Date(order.createdAt);
        if (!Number.isNaN(parsed.getTime())) {
          createdAt = parsed;
        }
      }

      if (!createdAt) return acc;

      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
      if (!acc[key]) {
        acc[key] = {
          total: 0,
          count: 0,
          year: createdAt.getFullYear(),
          month: createdAt.getMonth(),
        };
      }

      acc[key].total += Number(order.total || 0);
      acc[key].count += 1;
      return acc;
    }, {});

    const topMonth =
      Object.values(monthBuckets).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return b.count - a.count;
      })[0] || null;

    return {
      totalRevenue: totalRevenueValue,
      pendingCount: pendingCountValue,
      topMonth,
    };
  }, [orders]);
  const { totalRevenue, pendingCount, topMonth } = metrics;
  const topMonthLabel = topMonth
    ? new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
      }).format(new Date(topMonth.year, topMonth.month, 1))
    : t("no_data", "No data");

  useEffect(() => {
    if (!user || !profile) return;
    const userId = profile.uid || user.uid;
    console.log("uid: ", userId);
    let q;
    if (profile.role === "pharmacy") {
      q = query(
        collection(db, "orders"),
        where("pharmacyIds", "array-contains", userId),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, "orders"),
        where("customerId", "==", userId),
        orderBy("createdAt", "desc")
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      setOrders(
        snap.docs.map((d) => {
          console.log("Order ID: ", d.id);
          return { id: d.id, ...d.data() };
        })
      );
    });
    return unsub;
  }, [user, profile]);

  // If navigation included a highlight id (state or query param), set it when component mounts or location changes
  useEffect(() => {
    const stateId = location?.state?.highlightOrderId;
    const qp = new URLSearchParams(location.search).get("highlight");
    if (stateId) setHighlightOrderId(stateId);
    else if (qp) setHighlightOrderId(qp);
  }, [location]);

  // When highlightOrderId is set and orders are loaded, scroll the matching order into view and auto-clear highlight
  useEffect(() => {
    if (!highlightOrderId || orders.length === 0) return;
    const id = highlightOrderId;
    // Give the DOM a moment to render
    const t = setTimeout(() => {
      const el = document.getElementById(`order-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 250);

    // Clear the highlight after a few seconds
    const clearT = setTimeout(() => setHighlightOrderId(null), 5000);

    // Replace history state so reloading or navigating back doesn't re-trigger highlight
    navigate(location.pathname, { replace: true, state: {} });

    return () => {
      clearTimeout(t);
      clearTimeout(clearT);
    };
  }, [highlightOrderId, orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => (o.status || "pending") === statusFilter);
  }, [orders, statusFilter]);
  const displayedOrders = filteredOrders.slice(0, visibleCount);
  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setVisibleCount(5);
  };
  const formatCurrency = (value = 0) =>
    `₦${Number(value || 0).toLocaleString()}`;
  const hasMoreOrders = visibleCount < filteredOrders.length;
  const canCollapseOrders = visibleCount > 5;
  const orderLabel =
    orders.length === 1 ? t("order", "Order") : t("orders", "Orders");
  const pendingLabel =
    pendingCount === 1
      ? t("pending_order", "Pending Order")
      : t("pending_orders", "Pending Orders");
  const totalOrdersLabel = orders.length
    ? `${orders.length} ${orderLabel}`
    : t("no_orders_yet", "No orders yet.");
  const otherPendingLabel = pendingCount
    ? `${pendingCount} ${pendingLabel}`
    : t("no_pending_orders", "No pending orders.");
  const topMonthStatsText = topMonth
    ? `${formatCurrency(topMonth.total)} • ${topMonth.count} ${
        topMonth.count === 1 ? t("order", "Order") : t("orders", "Orders")
      }`
    : t("not_enough_data", "Not enough data yet");
  const statCards = [
    {
      key: "total",
      title: isPharmacy
        ? t("total_revenue", "Total Revenue")
        : t("total_order_value", "Total Order Value"),
      value: formatCurrency(totalRevenue),
      helper: totalOrdersLabel,
    },
    {
      key: "pending",
      title: t("pending_orders", "Pending Orders"),
      value: pendingCount.toLocaleString(),
      helper: otherPendingLabel,
    },
    {
      key: "month",
      title: isPharmacy
        ? t("top_selling_month", "Top Selling Month")
        : t("top_buying_month", "Top Buying Month"),
      value: topMonthLabel,
      helper: topMonthStatsText,
    },
  ];
  const filterOptions = ["all", ...ORDER_STATUSES];

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Fetch product details for modal
  useEffect(() => {
    async function fetchProducts() {
      if (!modalOrder || !modalOrder.items) return setModalOrderProducts([]);
      // Get all product IDs in the order
      const ids = modalOrder.items.map((i) => i.productId);
      // Fetch all product docs in parallel
      const proms = ids.map((id) => getDoc(doc(db, "products", id)));
      const snaps = await Promise.all(proms);
      setModalOrderProducts(
        snaps.map((s) => (s.exists() ? { id: s.id, ...s.data() } : null))
      );
    }
    fetchProducts();
  }, [modalOrder]);

  // Harmonize items for modal
  function getHarmonizedItems(items) {
    const map = {};
    items.forEach((item) => {
      const key = item.productId;
      if (!map[key]) {
        map[key] = { ...item, qty: Number(item.qty || item.quantity || 1) };
      } else {
        map[key].qty += Number(item.qty || item.quantity || 1);
      }
    });
    return Object.values(map);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-xl font-poppins font-light mb-6">
          {t("please_sign_in_continue", "Please sign in to continue")}
        </div>
        <button
          className="rounded-full bg-sky-600 text-white px-8 py-3 text-lg font-poppins font-medium hover:bg-sky-700 transition"
          onClick={() => navigate("/auth/landing")}
        >
          {t("sign_in_sign_up", "Sign In / Sign Up")}
        </button>
      </div>
    );
  }

  // No loading screen — render immediately

  return (
    <>
      <FixedHeader title="Orders" t={t} />
      <div className="pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-24 sm:pb-28 w-full mx-auto px-0 sm:px-4 md:px-8 lg:px-12 xl:px-16 min-h-screen">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-4 sm:gap-6 md:gap-8">
          <div className="lg:hidden sticky top-[7rem] z-40 -mx-0 px-0 py-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {filterOptions.map((option) => {
                const isActive = statusFilter === option;
                const label =
                  option === "all"
                    ? t("all", "All")
                    : t(
                        option,
                        option.charAt(0).toUpperCase() + option.slice(1)
                      );
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleFilterChange(option)}
                    className={`flex-shrink-0 rounded-full border px-4 py-2 text-xs font-normal transition ${
                      isActive
                        ? "bg-sky-600 text-white border-sky-600 dark:border-sky-500"
                        : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-sky-400/70"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <section className="mt-1 flex gap-4 overflow-x-auto scrollbar-hide pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:overflow-x-visible">
            {statCards.map((card) => (
              <div
                key={card.key}
                className="rounded-2xl border border-sky-200 dark:border-sky-200 bg-white dark:bg-gray-900 p-4 sm:p-6 min-w-0 flex-shrink-0 w-48 sm:w-auto flex flex-col justify-center min-h-[120px] sm:min-h-[140px]"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">
                  {card.title}
                </div>
                <div className="mt-2 sm:mt-3 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                  {card.value}
                </div>
                <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {card.helper}
                </div>
              </div>
            ))}
          </section>
          <section className="grid gap-4 sm:gap-6 lg:grid-cols-[280px,1fr] lg:gap-6 xl:grid-cols-[320px,1fr]">
            <div className="hidden space-y-4 sm:space-y-6 lg:block">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t("order_filters", "Order Filters")}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    "filter_description",
                    "Narrow down by status to focus on specific orders."
                  )}
                </p>
                <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2">
                  {filterOptions.map((option) => {
                    const isActive = statusFilter === option;
                    const label =
                      option === "all"
                        ? t("all", "All")
                        : t(
                            option,
                            option.charAt(0).toUpperCase() + option.slice(1)
                          );
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleFilterChange(option)}
                        className={`w-full rounded-full border px-3 py-2 text-xs sm:text-sm transition ${
                          isActive
                            ? "bg-sky-600 text-white border-sky-600 dark:border-sky-500"
                            : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-sky-400/70"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 sm:p-5">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t("contact_support", "Contact Support")}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {t(
                    "contact_support_description",
                    "Need help with an order? Reach out to our support team for assistance."
                  )}
                </p>
                <div className="mt-3 sm:mt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/support")}
                    className="text-xs sm:text-sm font-medium text-sky-600 hover:underline"
                  >
                    {t("get_support", "Get support")}
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("orders", "Orders")}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {totalOrdersLabel}
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {displayedOrders.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    {t("no_orders_yet", "No orders yet.")}
                  </div>
                ) : (
                  displayedOrders.map((o, index) => {
                    const items = (o.items || []).filter(
                      (item) =>
                        item.pharmacyId === user.uid ||
                        profile.role === "customer"
                    );
                    const isExpanded = expandedOrders[o.id];
                    const showSeeMore = items.length > 4;
                    const visibleItems = isExpanded ? items : items.slice(0, 4);
                    const phone =
                      o.customerPhone || o.customer_phone || o.phone || "";
                    const isRevealed = revealedNumbers[o.id];
                    return (
                      <div
                        key={o.id}
                        id={`order-${o.id}`}
                        className={`relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 transition duration-200 hover:border-sky-400/70 hover:shadow-sm dark:border-gray-600 dark:bg-gray-900 ${
                          highlightOrderId === o.id
                            ? "ring-4 ring-sky-200 dark:ring-sky-800 bg-sky-50/70 dark:bg-sky-900/30"
                            : ""
                        } animate-fadeInUp`}
                        style={{
                          cursor: "pointer",
                          animationDelay: `${index * 0.08}s`,
                        }}
                        onClick={(e) => {
                          if (e.target.closest(".order-see-more-btn")) return;
                          if (
                            profile?.role === "pharmacy" &&
                            e.target.closest(".order-status-dropdown")
                          )
                            return;
                          setModalOrder(o);
                        }}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                              {t("order_number", "Order #")}
                              {o.id.slice(0, 6)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {o.createdAt?.toDate?.().toLocaleString?.() || ""}
                            </div>
                          </div>
                          <div className="text-sm sm:text-base font-semibold text-sky-700 dark:text-sky-400 flex-shrink-0">
                            {formatCurrency(
                              profile.role === "customer"
                                ? o.total
                                : items.reduce(
                                    (sum, item) =>
                                      sum + item.price * item.quantity,
                                    0
                                  )
                            )}
                          </div>
                        </div>
                        {profile?.role === "pharmacy" && (
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex-shrink-0">
                                {t("customer", "Customer")}:
                              </span>
                              <span className="font-medium text-gray-900 dark:text-gray-200 truncate min-w-0">
                                {o.customerName ||
                                  o.customerId ||
                                  o.customer_id ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {o.customerEmail || ""}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t("items", "Items")}
                              </div>
                              <ul className="ml-3 sm:ml-4 list-disc space-y-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300 max-h-20 overflow-y-auto">
                                {visibleItems.map((item, idx) => (
                                  <li key={idx} className="truncate">
                                    <span className="truncate">
                                      {item.name || item.productId}
                                    </span>
                                    <span className="ml-1 flex-shrink-0">
                                      ×{item.qty || item.quantity || 1}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              {showSeeMore && (
                                <button
                                  className="order-see-more-btn mt-1 ml-3 sm:ml-4 text-xs font-normal text-sky-600 hover:underline flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(o.id);
                                  }}
                                >
                                  {isExpanded
                                    ? t("see_less", "See less")
                                    : `${t("see_more", "See more")} (${
                                        items.length - 4
                                      } ${t("more_items", "more")})`}
                                </button>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2">
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {t("status", "Status")}:
                                </span>
                                <select
                                  className="order-status-dropdown rounded border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 min-w-0"
                                  value={o.status || "pending"}
                                  onChange={(e) =>
                                    handleStatusChange(o.id, e.target.value)
                                  }
                                >
                                  {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {t(
                                        s,
                                        s.charAt(0).toUpperCase() + s.slice(1)
                                      )}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 min-w-0">
                                {phone && !isRevealed && (
                                  <button
                                    className="rounded-full bg-sky-600 px-2 sm:px-3 py-1 text-xs font-medium text-white flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRevealedNumbers((prev) => ({
                                        ...prev,
                                        [o.id]: true,
                                      }));
                                    }}
                                  >
                                    {t("reveal_number", "Reveal Number")}
                                  </button>
                                )}
                                {phone && isRevealed && (
                                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 truncate min-w-0">
                                    {phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              {filteredOrders.length > 5 &&
                (hasMoreOrders || canCollapseOrders) && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="text-sm font-medium text-sky-600 hover:underline"
                      onClick={() =>
                        hasMoreOrders
                          ? setVisibleCount((prev) =>
                              Math.min(prev + 5, filteredOrders.length)
                            )
                          : setVisibleCount(5)
                      }
                    >
                      {hasMoreOrders
                        ? t("see_more", "See more")
                        : t("see_less", "See less")}
                    </button>
                  </div>
                )}
            </div>
          </section>
          <div className="lg:hidden">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("contact_support", "Contact Support")}
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t(
                  "contact_support_description",
                  "Need help with an order? Reach out to our support team for assistance."
                )}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/support")}
                  className="text-sm font-medium text-sky-600 hover:underline"
                >
                  {t("get_support", "Get support")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal for order details */}
      <Modal open={!!modalOrder} onClose={() => setModalOrder(null)}>
        {modalOrder && (
          <div className="max-w-md mx-auto">
            <div className="text-base sm:text-lg font-medium mb-2 truncate">
              {t("order_number", "Order #")}
              {modalOrder.id.slice(0, 6)}
            </div>
            <div className="text-zinc-500 text-xs sm:text-sm mb-4 truncate">
              {modalOrder.createdAt?.toDate?.().toLocaleString?.() || ""}
            </div>
            <div className="mb-2 text-sm sm:text-[15px] font-medium">
              {t("items", "Items")}:
            </div>
            <div className="max-h-60 overflow-y-auto mb-4">
              <ul className="space-y-2">
                {getHarmonizedItems(
                  modalOrder.items.filter(
                    (item) =>
                      item.pharmacyId === user.uid ||
                      profile.role === "customer"
                  )
                ).map((item, idx) => {
                  const prod = modalOrderProducts.find(
                    (p) => p && p.id === item.productId
                  );
                  return (
                    <li
                      key={item.productId}
                      className="flex items-center gap-2 sm:gap-3 min-w-0"
                    >
                      {prod ? (
                        <ProductAvatar
                          name={prod.name}
                          image={prod.image}
                          category={prod.category}
                          size={32}
                          roundedClass="rounded-lg flex-shrink-0"
                        />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="font-poppins font-medium text-xs sm:text-sm truncate">
                          {prod ? prod.name : item.productId}
                        </div>
                        <div className="text-zinc-500 text-xs">
                          {t("qty", "Qty")}: {item.qty}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-sky-600 flex-shrink-0 whitespace-nowrap">
                        ₦
                        {Number(
                          item.price || prod?.price || 0
                        ).toLocaleString()}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex justify-between items-center border-t pt-3 mt-2 min-w-0">
              <div className="text-sm sm:text-[15px] font-medium flex-shrink-0">
                {t("total", "Total")}:
              </div>
              <div className="text-sm sm:text-[15px] font-bold text-sky-700 truncate ml-2">
                ₦
                {Number(
                  profile.role === "customer"
                    ? modalOrder.total
                    : modalOrder.items
                        .filter(
                          (item) =>
                            item.pharmacyId === user.uid ||
                            profile.role === "customer"
                        )
                        .reduce(
                          (sum, item) =>
                            sum + item.price * (item.qty || item.quantity || 1),
                          0
                        )
                ).toLocaleString()}
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-400 truncate">
              {t("status", "Status")}:{" "}
              {t(
                modalOrder.status || "pending",
                modalOrder.status || "pending"
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
