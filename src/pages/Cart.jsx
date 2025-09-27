import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { removeFromCart, placeOrder } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/language";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, CreditCard, Truck, Shield, X } from "lucide-react";
import DeleteIcon from "@/icons/react/DeleteIcon";
import ProductAvatar from "@/components/ProductAvatar";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getDistance } from "@/lib/eta";

// Fixed Header Component
const FixedHeader = ({ title, itemCount, t }) => {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-[100] px-4 py-4 border-b border-gray-100 dark:border-gray-700">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div className="flex mt-8 items-center justify-between">
          <h1 className="text-[28px] sm:text-[35px] md:text-[42px] lg:text-[48px] font-light font-poppins text-gray-900 dark:text-white">{t('cart', 'Cart')}</h1>
          
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function Cart() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userCoords, location } = useUserLocation();
  const [items, setItems] = useState([]);
  
  // Checkout flow states
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "cart"));
    return onSnapshot(q, async (snap) => {
      const rows = await Promise.all(
        snap.docs.map(async (d) => {
          const item = d.data();
          const p = await getDoc(doc(db, "products", item.productId));
          return { id: d.id, ...item, product: { id: p.id, ...p.data() } };
        })
      );
      setItems(rows);
    });
  }, [user]);

  // Initialize delivery address and contact info from user data
  useEffect(() => {
    if (user && !deliveryAddress) {
      setCustomerEmail(user.email || '');
      setCustomerPhone(user.phoneNumber || '');
      setDeliveryAddress(location || 'Current location');
    }
  }, [user, location, deliveryAddress]);

  // Calculate delivery fee when items change
  useEffect(() => {
    if (items.length > 0 && userCoords) {
      calculateDeliveryFee();
    }
  }, [items, userCoords]);

  const total = useMemo(
    () => items.reduce((s, i) => s + (i.product?.price + 0.0 || 0) * i.qty, 0),
    [items]
  );

  const totalWithDelivery = useMemo(() => total + deliveryFee, [total, deliveryFee]);

  // Calculate delivery fee based on distance to pharmacies
  const calculateDeliveryFee = async () => {
    if (!userCoords || items.length === 0) {
      setDeliveryFee(0);
      return;
    }

    try {
      // Get unique pharmacies from cart items
      const pharmacyIds = [...new Set(items.map(item => item.product?.pharmacyId).filter(Boolean))];
      let totalDistance = 0;

      for (const pharmacyId of pharmacyIds) {
        const pharmacyDoc = await getDoc(doc(db, "pharmacies", pharmacyId));
        const pharmacy = pharmacyDoc.data();
        
        if (pharmacy) {
          // Handle different coordinate formats
          let pharmLat, pharmLon;
          if (pharmacy.coordinates?.latitude && pharmacy.coordinates?.longitude) {
            pharmLat = pharmacy.coordinates.latitude;
            pharmLon = pharmacy.coordinates.longitude;
          } else if (pharmacy.lat && pharmacy.lon) {
            pharmLat = pharmacy.lat;
            pharmLon = pharmacy.lon;
          } else if (pharmacy.latitude && pharmacy.longitude) {
            pharmLat = pharmacy.latitude;
            pharmLon = pharmacy.longitude;
          }

          if (pharmLat && pharmLon) {
            const distance = getDistance(userCoords.latitude, userCoords.longitude, pharmLat, pharmLon);
            totalDistance += distance;
          }
        }
      }

      // ₦300 per km
      const fee = Math.round(totalDistance * 300);
      setDeliveryFee(fee);
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      setDeliveryFee(300); // Default fee
    }
  };

  // Address autocomplete function
  const searchAddresses = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ng`
      );
      const data = await response.json();
      setAddressSuggestions(data.map(item => item.display_name));
    } catch (error) {
      console.error('Error searching addresses:', error);
      setAddressSuggestions([]);
    }
    setIsLoadingAddress(false);
  };

  // Get user's current location
  const useCurrentLocation = () => {
    if (location && userCoords) {
      setDeliveryAddress(location);
      setAddressSuggestions([]);
    }
  };

  const startCheckout = () => {
    setShowOrderSummary(true);
  };

  const proceedToPayment = () => {
    setShowOrderSummary(false);
    setShowPaymentMethods(true);
  };

  const handleFinalCheckout = async () => {
    if (!user || !items.length || !selectedPaymentMethod) return;

    try {
      const first = items[0];
      const pharmacyId = first.product?.pharmacyId;
      const cartItems = groupItems();

      const orderData = {
        customerId: user.uid,
        pharmacyId,
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.qty,
          price: i.product.price,
          pharmacyId: i.product.pharmacyId,
        })),
        total: totalWithDelivery,
        subtotal: total,
        deliveryFee,
        deliveryAddress,
        customerPhone,
        customerEmail: customerEmail || user.email,
        paymentMethod: selectedPaymentMethod,
      };

      let orderStatus;
      if (selectedPaymentMethod === 'online') {
        // Use existing online payment flow
        orderStatus = await placeOrder(orderData);
      } else {
        // For cash on delivery, create order directly without payment
        orderStatus = await placeOrder({
          ...orderData,
          paymentStatus: 'pending',
          orderStatus: 'confirmed',
        });
      }

      console.log(`OrderStatus: ${orderStatus}`);
      
      if (orderStatus === false) {
        alert(t('order_placement_failed', 'Order placement failed'));
        return;
      }

      // Clear cart and close modals
      for (const i of items) await removeFromCart(user.uid, i.id);
      setShowPaymentMethods(false);
      setShowOrderSummary(false);
      
      alert(selectedPaymentMethod === 'cash' 
        ? t('order_placed_delivery', 'Order placed successfully! You\'ll pay on delivery.') 
        : t('payment_successful', 'Payment successful! Your order has been placed.')
      );
      
      navigate('/customer/orders'); // Redirect to orders page
    } catch (error) {
      console.error('Checkout error:', error);
      alert(t('checkout_failed', 'Checkout failed. Please try again.'));
    }
  };

  const groupItems = () => {
    const map = new Map();
    for (const i of items) {
      const pid = i.product?.id;
      if (!pid) continue;
      if (map.has(pid)) {
        const existing = map.get(pid);
        map.set(pid, {
          ...existing,
          qty: existing.qty + i.qty,
          ids: [...(existing.ids || [existing.id]), i.id],
        });
      } else {
        map.set(pid, { ...i, ids: [i.id] });
      }
    }
    return Array.from(map.values());
  };

  // Harmonize duplicate items by productId
  const harmonizedItems = useMemo(() => {
    const map = new Map();
    for (const i of items) {
      const pid = i.product?.id;
      if (!pid) continue;
      if (map.has(pid)) {
        const existing = map.get(pid);
        map.set(pid, {
          ...existing,
          qty: existing.qty + i.qty,
          ids: [...(existing.ids || [existing.id]), i.id],
        });
      } else {
        map.set(pid, { ...i, ids: [i.id] });
      }
    }
    return Array.from(map.values());
  }, [items]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-xl font-poppins font-light mb-6">
          {t('please_sign_in_continue', 'Please sign in to continue')}
        </div>
        <button
          className="rounded-full bg-sky-600 text-white px-8 py-3 text-lg font-poppins font-medium shadow hover:bg-sky-700 transition"
          onClick={() => navigate("/auth/landing")}
        >
          {t('sign_in_sign_up', 'Sign In / Sign Up')}
        </button>
      </div>
    );
  }

  if (user && items.length === 0) {
    // Instead of a skeleton, show a lightweight empty state message
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-zinc-500 font-extralight text-[14px]">
          {t('your_cart_is_empty', 'Your cart is empty.')}
        </div>
      </div>
    );
  }

  return (
    <>
      <FixedHeader title="Cart" itemCount={items.length} t={t} />
      <div className="pt-24 pb-28 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen flex flex-col">
        <div className="mt-10 grid grid-cols-2 gap-3">
        {harmonizedItems.map((i, index) => (
          <div key={i.product?.id} className="relative rounded-xl border border-zinc-200 p-2 flex flex-col items-center gap-2 min-w-0 card-interactive animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
            {/* Remove icon button at top right */}
            <button
              onClick={() => i.ids.forEach(id => removeFromCart(user.uid, id))}
              className="absolute top-2 right-2 z-10 p-0.5 rounded-full hover:scale-110 transition-all duration-200 hover:bg-red-50 icon-interactive"
              aria-label={t('remove', 'Remove')}
            >
              <DeleteIcon className="w-5 h-5 text-red-500" />
            </button>
            <ProductAvatar
              name={i.product?.name}
              image={i.product?.image}
              category={i.product?.category}
              size={35}
              roundedClass="rounded-xl"
            />
            <div className="flex-1 w-full text-center">
              <div className="font-semibold text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] truncate">
                {i.product?.name}
              </div>
              <div className="text-zinc-500 text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px]">
                ₦{Number(i.product?.price || 0).toLocaleString()}
              </div>
            </div>
            {/* Quantity selector */}
            <div className="flex items-center gap-2 mt-1">
              <button
                className="w-6 h-6 rounded-full border border-zinc-300 dark:border-gray-600 flex items-center justify-center text-[18px] font-light disabled:opacity-40 btn-interactive transition-all duration-200 hover:border-sky-500 hover:text-sky-600"
                onClick={async () => {
                  if (i.qty > 1) {
                    // Remove one instance (by id)
                    await removeFromCart(user.uid, i.ids[0]);
                  }
                }}
                disabled={i.qty <= 1}
                aria-label={t('decrease_quantity', 'Decrease quantity')}
              >
                -
              </button>
              <span className="text-[13px] font-poppins w-6 text-center font-medium">{i.qty}</span>
              <button
                className="w-6 h-6 rounded-full border border-zinc-300 dark:border-gray-600 flex items-center justify-center text-[18px] font-light btn-interactive transition-all duration-200 hover:border-sky-500 hover:text-sky-600"
                onClick={async () => {
                  // Add one more of this product
                  if (i.product?.id) {
                    const { addToCart } = await import("@/lib/db");
                    await addToCart(user.uid, i.product.id, 1);
                  }
                }}
                aria-label={t('increase_quantity', 'Increase quantity')}
              >
                +
              </button>
            </div>
          </div>
        ))}
        {harmonizedItems.length === 0 && (
          <div className="text-zinc-500 font-extralight text-[13px] sm:text-[14px] md:text-[16px] lg:text-[18px] col-span-2">
            {t('your_cart_is_empty', 'Your cart is empty.')}
          </div>
        )}
      </div>
      {harmonizedItems.length > 0 && (
        <div className="mt-6 rounded-xl border border-sky-400 dark:border-gray-600 p-3">
          <div className="flex flex-col gap-2 text-[13px] sm:text-[15px] md:text-[18px] lg:text-[22px] font-regular">
            <div className="flex items-center justify-between">
              <span>{t('subtotal', 'Subtotal')}</span>
              <span className="font-semibold text-[12px] sm:text-[15px]">
                ₦{Number(total).toLocaleString()}
              </span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex items-center justify-between text-[11px] sm:text-[13px] text-gray-600">
                <span>{t('delivery_fee', 'Delivery Fee')}</span>
                <span>₦{Number(deliveryFee).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-2 font-medium">
              <span>{t('total', 'Total')}</span>
              <span className="font-semibold text-[12px] sm:text-[15px]">
                ₦{Number(totalWithDelivery).toLocaleString()}
              </span>
            </div>
          </div>
          <button
            onClick={startCheckout}
            className="mt-4 w-full rounded-full border bg-sky-400 text-white py-2 text-[12px] sm:text-[14px] lg:text-[16px] font-light"
          >
            {t('proceed_to_checkout', 'Proceed to Checkout')}
          </button>
        </div>
      )}
      </div>

      {/* Order Summary Modal */}
      {showOrderSummary && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-light font-poppins text-sky-600">{t('order_summary', 'Order Summary')}</h2>
                <button
                  onClick={() => setShowOrderSummary(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-[16px] font-medium mb-3">{t('items', 'Items')} ({harmonizedItems.length})</h3>
                <div className="space-y-3">
                  {harmonizedItems.map((item) => (
                    <div key={item.product?.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <ProductAvatar
                        name={item.product?.name}
                        image={item.product?.image}
                        category={item.product?.category}
                        size={40}
                        roundedClass="rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="text-[14px] font-medium truncate">{item.product?.name}</div>
                        <div className="text-[12px] text-gray-600">{t('qty', 'Qty')}: {item.qty}</div>
                      </div>
                      <div className="text-[14px] font-medium text-sky-600">
                        ₦{Number((item.product?.price || 0) * item.qty).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="mb-6">
                <h3 className="text-[16px] font-medium mb-3">{t('delivery_details', 'Delivery Details')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                      {t('delivery_address', 'Delivery Address')} *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          searchAddresses(e.target.value);
                        }}
                        placeholder={t('enter_delivery_address', 'Enter delivery address')}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-[14px] pr-10"
                      />
                      <button
                        onClick={useCurrentLocation}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-sky-600 hover:bg-sky-50 rounded-full transition-colors"
                        title={t('use_current_location', 'Use current location')}
                      >
                        <Navigation className="w-4 h-4" />
                      </button>
                    </div>
                    {addressSuggestions.length > 0 && (
                      <div className="mt-2 bg-white border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto relative z-[10000]">
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setDeliveryAddress(suggestion);
                              setAddressSuggestions([]);
                            }}
                            className="w-full text-left p-3 hover:bg-gray-50 text-[13px] border-b last:border-b-0"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 mb-2">
                        {t('phone_number', 'Phone Number')} *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder={t('enter_phone_number', 'Enter phone number')}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-[14px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 mb-2">
                        {t('email_optional', 'Email (Optional)')}
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder={t('enter_email_address', 'Enter email address')}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-[14px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Total */}
              <div className="mb-6 p-4 bg-sky-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[14px]">{t('subtotal', 'Subtotal')}</span>
                  <span className="text-[14px] font-medium">₦{Number(total).toLocaleString()}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[14px]">{t('delivery_fee', 'Delivery Fee')}</span>
                    <span className="text-[14px]">₦{Number(deliveryFee).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-sky-200">
                  <span className="text-[16px] font-medium">{t('total', 'Total')}</span>
                  <span className="text-[16px] font-bold text-sky-600">₦{Number(totalWithDelivery).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={proceedToPayment}
                disabled={!deliveryAddress.trim() || !customerPhone.trim()}
                className="w-full bg-sky-600 text-white py-3 rounded-full text-[16px] font-medium hover:bg-sky-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t('continue_to_payment', 'Continue to Payment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {showPaymentMethods && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-light font-poppins text-sky-600">{t('payment_method', 'Payment Method')}</h2>
                <button
                  onClick={() => setShowPaymentMethods(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Pay on Delivery */}
                <button
                  onClick={() => setSelectedPaymentMethod('cash')}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    selectedPaymentMethod === 'cash'
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 dark:border-gray-600 hover:border-sky-300 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6 text-sky-600" />
                    <div>
                      <div className="text-[16px] font-medium">{t('pay_on_delivery', 'Pay on Delivery')}</div>
                      <div className="text-[13px] text-gray-600">{t('pay_with_cash_on_delivery', 'Pay with cash when order arrives')}</div>
                    </div>
                  </div>
                </button>

                {/* Online Payment */}
                <button
                  onClick={() => setSelectedPaymentMethod('online')}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    selectedPaymentMethod === 'online'
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 dark:border-gray-600 hover:border-sky-300 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-sky-600" />
                    <div>
                      <div className="text-[16px] font-medium">{t('online_payment', 'Online Payment')}</div>
                      <div className="text-[13px] text-gray-600">{t('pay_with_card_bank_ussd', 'Pay with card, bank transfer, or USSD')}</div>
                    </div>
                  </div>
                </button>

                {/* Insurance Payment (Disabled) */}
                <button
                  disabled
                  className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-100 text-left cursor-not-allowed opacity-60"
                >
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-gray-400" />
                      <div>
                        <div className="text-[16px] font-medium text-gray-500">{t('pay_with_insurance', 'Pay with Insurance')}</div>
                        <div className="text-[13px] text-gray-400">{t('use_your_health_insurance', 'Use your health insurance')}</div>
                      </div>
                    </div>
                    <span className="text-[12px] text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {t('coming_soon', 'Coming Soon')}
                    </span>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[16px] font-medium">{t('total_amount', 'Total Amount')}</span>
                  <span className="text-[18px] font-bold text-sky-600">₦{Number(totalWithDelivery).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleFinalCheckout}
                disabled={!selectedPaymentMethod}
                className="w-full mt-6 bg-sky-600 text-white py-3 rounded-full text-[16px] font-medium hover:bg-sky-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {selectedPaymentMethod === 'online' ? t('pay_now', 'Pay Now') : t('place_order', 'Place Order')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
