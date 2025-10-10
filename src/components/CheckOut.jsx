{
  /* Order Summary Modal */
}
import { useAuth } from "@/lib/auth";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { removeFromCart, placeOrder } from "@/lib/db";
import { useTranslation } from "@/lib/language";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, CreditCard, Truck, Shield, X } from "lucide-react";
import DeleteIcon from "@/icons/react/DeleteIcon";
import ProductAvatar from "@/components/ProductAvatar";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getDistance } from "@/lib/eta";

export function CheckOut({ items, totalPrice, onClose, prescription = false }) {
  const { user } = useAuth();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userCoords, location } = useUserLocation();
  //   const [items, setItems] = useState([]);

  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Initialize delivery address and contact info from user data
  useEffect(() => {
    if (user && !deliveryAddress) {
      setCustomerEmail(user.email || "");
      setCustomerPhone(user.phoneNumber || "");
      setDeliveryAddress(location || "Current location");
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

  const totalWithDelivery = useMemo(
    () => total + deliveryFee,
    [total, deliveryFee]
  );

  // Calculate delivery fee based on distance to pharmacies
  const calculateDeliveryFee = async () => {
    if (!userCoords || items.length === 0) {
      setDeliveryFee(0);
      return;
    }

    try {
      // Get unique pharmacies from cart items
      const pharmacyIds = [
        ...new Set(
          items.map((item) => item.product?.pharmacyId).filter(Boolean)
        ),
      ];
      let totalDistance = 0;

      for (const pharmacyId of pharmacyIds) {
        const pharmacyDoc = await getDoc(doc(db, "pharmacies", pharmacyId));
        const pharmacy = pharmacyDoc.data();

        if (pharmacy) {
          // Handle different coordinate formats
          let pharmLat, pharmLon;
          if (
            pharmacy.coordinates?.latitude &&
            pharmacy.coordinates?.longitude
          ) {
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
            const distance = getDistance(
              userCoords.latitude,
              userCoords.longitude,
              pharmLat,
              pharmLon
            );
            totalDistance += distance;
          }
        }
      }

      // ₦300 per km
      const fee = Math.round(totalDistance * 300);
      setDeliveryFee(fee);
    } catch (error) {
      console.error("Error calculating delivery fee:", error);
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=ng`
      );
      const data = await response.json();
      setAddressSuggestions(data.map((item) => item.display_name));
    } catch (error) {
      console.error("Error searching addresses:", error);
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

  const handleFinalCheckout = async () => {
    if (!user || !items.length || !selectedPaymentMethod) return;

    try {
      const first = items[0];
      const pharmacyId = first.product?.pharmacyId;
      // const cartItems = groupItems();

      const orderData = {
        customerId: user.uid,
        pharmacyId,
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.qty,
          price: i.price,
          pharmacyId: i.pharmacyId,
        })),
        total: totalWithDelivery,
        subtotal: total,
        deliveryFee,
        deliveryAddress,
        customerPhone,
        customerEmail: customerEmail || user.email,
        paymentMethod: selectedPaymentMethod,
      };

      console.log(`Order: ${orderData.total}`);
      console.log(`Order Items: ${orderData.items}`);

      let orderStatus;
      if (selectedPaymentMethod === "online") {
        // Use existing online payment flow
        orderStatus = await placeOrder({
          customerId: orderData.customerId,
          items: orderData.items,
          total: totalPrice,
          email: orderData.customerEmail,
          prescription: prescription,
        });
      } else {
        // For cash on delivery, create order directly without payment
        // orderStatus = await placeOrder({
        //   ...orderData,
        //   paymentStatus: "pending",
        //   orderStatus: "confirmed",
        // });
        orderStatus = await placeOrder({
          customerId: orderData.customerId,
          items: orderData.items,
          total: totalPrice,
          email: orderData.customerEmail,
          prescription: prescription,
        });
      }

      console.log(`OrderStatus: ${orderStatus}`);

      if (orderStatus === false) {
        alert(t("order_placement_failed", "Order placement failed"));
        return;
      }

      // Clear cart and close modals
      // for (const i of items) await removeFromCart(user.uid, i.id);
      setShowPaymentMethods(false);
      setShowOrderSummary(false);

      alert(
        selectedPaymentMethod === "cash"
          ? t(
              "order_placed_delivery",
              "Order placed successfully! You'll pay on delivery."
            )
          : t(
              "payment_successful",
              "Payment successful! Your order has been placed."
            )
      );

      navigate("/customer/orders"); // Redirect to orders page
    } catch (error) {
      console.error("Checkout error:", error);
      alert(t("checkout_failed", "Checkout failed. Please try again."));
    }
  };

  return (
    <div>
      {showOrderSummary && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-light font-poppins text-sky-600">
                  {t("order_summary", "Order Summary")}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-[16px] font-medium mb-3">
                  {t("items", "Items")} ({items.length})
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product?.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <ProductAvatar
                        name={item.product?.name}
                        image={item.product?.image}
                        category={item.product?.category}
                        size={40}
                        roundedClass="rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="text-[14px] font-medium truncate">
                          {item.product?.name}
                        </div>
                        <div className="text-[12px] text-gray-600">
                          {t("qty", "Qty")}: {item.qty}
                        </div>
                      </div>
                      <div className="text-[14px] font-medium text-sky-600">
                        ₦
                        {Number(
                          (item.product?.price || 0) * item.qty
                        ).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="mb-6">
                <h3 className="text-[16px] font-medium mb-3">
                  {t("delivery_details", "Delivery Details")}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[14px] font-medium text-gray-700 mb-2">
                      {t("delivery_address", "Delivery Address")} *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          searchAddresses(e.target.value);
                        }}
                        placeholder={t(
                          "enter_delivery_address",
                          "Enter delivery address"
                        )}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-[14px] pr-10"
                      />
                      <button
                        onClick={useCurrentLocation}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-sky-600 hover:bg-sky-50 rounded-full transition-colors"
                        title={t(
                          "use_current_location",
                          "Use current location"
                        )}
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
                        {t("phone_number", "Phone Number")} *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder={t(
                          "enter_phone_number",
                          "Enter phone number"
                        )}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-[14px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] font-medium text-gray-700 mb-2">
                        {t("email_optional", "Email (Optional)")}
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder={t(
                          "enter_email_address",
                          "Enter email address"
                        )}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-[14px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Total */}
              <div className="mb-6 p-4 bg-sky-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[14px]">
                    {t("subtotal", "Subtotal")}
                  </span>
                  <span className="text-[14px] font-medium">₦{totalPrice}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[14px]">
                      {t("delivery_fee", "Delivery Fee")}
                    </span>
                    <span className="text-[14px]">
                      ₦{Number(deliveryFee).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-sky-200">
                  <span className="text-[16px] font-medium">
                    {t("total", "Total")}
                  </span>
                  <span className="text-[16px] font-bold text-sky-600">
                    ₦{Number(totalWithDelivery).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={proceedToPayment}
                disabled={!deliveryAddress.trim() || !customerPhone.trim()}
                className="w-full bg-sky-600 text-white py-3 rounded-full text-[16px] font-medium hover:bg-sky-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t("continue_to_payment", "Continue to Payment")}
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
                <h2 className="text-[20px] font-light font-poppins text-sky-600">
                  {t("payment_method", "Payment Method")}
                </h2>
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
                  onClick={() => setSelectedPaymentMethod("cash")}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    selectedPaymentMethod === "cash"
                      ? "border-sky-500 bg-sky-50"
                      : "border-gray-200 dark:border-gray-600 hover:border-sky-300 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6 text-sky-600" />
                    <div>
                      <div className="text-[16px] font-medium">
                        {t("pay_on_delivery", "Pay on Delivery")}
                      </div>
                      <div className="text-[13px] text-gray-600">
                        {t(
                          "pay_with_cash_on_delivery",
                          "Pay with cash when order arrives"
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Online Payment */}
                <button
                  onClick={() => setSelectedPaymentMethod("online")}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    selectedPaymentMethod === "online"
                      ? "border-sky-500 bg-sky-50"
                      : "border-gray-200 dark:border-gray-600 hover:border-sky-300 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-sky-600" />
                    <div>
                      <div className="text-[16px] font-medium">
                        {t("online_payment", "Online Payment")}
                      </div>
                      <div className="text-[13px] text-gray-600">
                        {t(
                          "pay_with_card_bank_ussd",
                          "Pay with card, bank transfer, or USSD"
                        )}
                      </div>
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
                        <div className="text-[16px] font-medium text-gray-500">
                          {t("pay_with_insurance", "Pay with Insurance")}
                        </div>
                        <div className="text-[13px] text-gray-400">
                          {t(
                            "use_your_health_insurance",
                            "Use your health insurance"
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {t("coming_soon", "Coming Soon")}
                    </span>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[16px] font-medium">
                    {t("total_amount", "Total Amount")}
                  </span>
                  <span className="text-[18px] font-bold text-sky-600">
                    ₦{Number(totalWithDelivery).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleFinalCheckout}
                disabled={!selectedPaymentMethod}
                className="w-full mt-6 bg-sky-600 text-white py-3 rounded-full text-[16px] font-medium hover:bg-sky-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {selectedPaymentMethod === "online"
                  ? t("pay_now", "Pay Now")
                  : t("place_order", "Place Order")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
