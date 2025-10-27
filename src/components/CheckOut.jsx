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
import {
  MapPin,
  Navigation,
  CreditCard,
  Truck,
  Shield,
  X,
  CheckCircle2,
} from "lucide-react";
import DeleteIcon from "@/icons/react/DeleteIcon";
import ProductAvatar from "@/components/ProductAvatar";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getDistance } from "@/lib/eta";
import { getRouteDistance } from "../lib/Distance/distance";

export function CheckOut({ items, total, onClose, prescription = false }) {
  const { user } = useAuth();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userCoords, location } = useUserLocation();

  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [successInfo, setSuccessInfo] = useState(null);
  const [products, setProducts] = useState([]);

  // Initialize delivery address and contact info from user data
  useEffect(() => {
    if (user && !deliveryAddress) {
      setCustomerEmail(user.email || "");
      setCustomerPhone(user.phoneNumber || "");
      // setDeliveryAddress(location || "Current location");
    }
  }, [user, location, deliveryAddress]);

  useEffect(() => {
    // if prescription is true the data structure is slightly different from that which comes from cart
    const allProducts = prescription
      ? items.map((item) => ({
          productId: item.id,
          quantity: item.qty,
          price: item.price,
          pharmacyId: item.pharmacyId,
          image: item.image,
          name: item.name,
          category: item.category,
        }))
      : items.map((item) => ({
          productId: item.id,
          quantity: item.qty,
          price: item.product.price,
          pharmacyId: item.product.pharmacyId,
          image: item.product.image,
          name: item.product.name,
          category: item.product.category,
        }));

    setProducts(allProducts);
  }, [items]);

  // Calculate delivery fee based on distance to pharmacies
  const calculateDeliveryFee = async () => {
    if (items.length === 0) {
      setDeliveryFee(0);
      return;
    }

    try {
      let fee = 0;
      let pharmLat, pharmLng, pharmAddress;

      for (const { pharmacyId } of products) {
        const pharmacyDoc = await getDoc(doc(db, "pharmacies", pharmacyId));

        if (!pharmacyDoc.exists()) return;

        const pharmacy = pharmacyDoc.data();
        pharmLat = pharmacy.lat;
        pharmLng = pharmacy.lon;
        pharmAddress = pharmacy.address;

        // console.log("Pharmacy lat: ", pharmLat);
        // console.log("Pharmacy lon: ", pharmLng);
        // console.log("Pharmacy Address: ", pharmAddress);
        // console.log("Customer Address: ", deliveryAddress);

        const { distanceMeters } = await getRouteDistance({
          pharmacyLocation: { pharmLat, pharmLng, pharmAddress },
          customerLocation: {
            customerlat: 0,
            customerLng: 0,
            customerAddress: deliveryAddress,
          },
        });
        distanceMeters;
        // console.log("Distance Meters: ", distanceMeters);

        fee += Math.round(distanceMeters * 0.05);
      }
      setDeliveryFee(fee);
    } catch (error) {
      console.error("Error calculating delivery fee:", error);
    }
  };

  const proceedToPayment = () => {
    setShowOrderSummary(false);
    setShowPaymentMethods(true);
  };

  const handleContinueShopping = useCallback(() => {
    setSuccessInfo(null);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleViewOrders = useCallback(() => {
    setSuccessInfo(null);
    if (onClose) {
      onClose();
    }
    navigate("/customer/orders");
  }, [navigate, onClose]);

  const handleFinalCheckout = async () => {
    if (!user || !items.length || !selectedPaymentMethod) return;

    try {
      const orderData = {
        customerId: user.uid,
        // pharmacyId,
        items: products.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          pharmacyId: item.pharmacyId,
        })),
        total: total + deliveryFee,
        subtotal: total,
        deliveryFee,
        deliveryAddress,
        customerPhone,
        customerEmail: customerEmail || user.email,
        paymentMethod: selectedPaymentMethod,
        prescription: prescription,
      };

      let orderStatus;
      if (selectedPaymentMethod === "online") {
        // Use existing online payment flow
        // orderStatus = await placeOrder({
        //   customerId: orderData.customerId,
        //   items: orderData.items,
        //   total: total + deliveryFee,
        //   email: orderData.customerEmail,
        //   prescription: prescription,
        // });
        orderStatus = await placeOrder(orderData);
      } else {
        // For cash on delivery, create order directly without payment
        // orderStatus = await placeOrder({
        //   ...orderData,
        //   paymentStatus: "pending",
        //   orderStatus: "confirmed",
        // });
        // orderStatus = await placeOrder({
        //   customerId: orderData.customerId,
        //   items: orderData.items,
        //   total: total + deliveryFee,
        //   email: orderData.customerEmail,
        //   prescription: prescription,
        // });

        orderStatus = await placeOrder(orderData);
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

      const successCopy =
        selectedPaymentMethod === "cash"
          ? {
              title: t("order_placed_delivery_title", "Order confirmed"),
              message: t(
                "order_placed_delivery",
                "Order placed successfully! You'll pay on delivery."
              ),
              description: t(
                "order_placed_delivery_description",
                "We'll notify you as soon as the pharmacy confirms your delivery."
              ),
            }
          : {
              title: t("payment_successful_title", "Payment successful"),
              message: t(
                "payment_successful",
                "Payment successful! Your order has been placed."
              ),
              description: t(
                "payment_successful_description",
                "Thanks for shopping with us. We'll keep you posted on order updates."
              ),
            };

      setSuccessInfo({
        ...successCopy,
        method:
          selectedPaymentMethod === "online"
            ? t("online_payment", "Online Payment")
            : t("pay_on_delivery", "Pay on Delivery"),
      });
      setSelectedPaymentMethod("");
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
                  {products.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <ProductAvatar
                        name={product.name}
                        image={product.image} /*Put a default image*/
                        category={product.category}
                        size={40}
                        roundedClass="rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="text-[14px] font-medium truncate select-none">
                          {product.name}
                        </div>
                        <div className="text-[12px] text-gray-600">
                          {`${t("qty", "Qty")}: ${product.quantity}`}
                        </div>
                      </div>
                      <div className="text-[14px] font-medium text-sky-600">
                        ₦
                        {Number(
                          product.price * product.quantity
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
                        // value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          calculateDeliveryFee();
                        }}
                        placeholder={t(
                          "enter_delivery_address",
                          "Enter delivery address"
                        )}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-[14px] pr-10"
                      />
                      <button
                        //onClick={useCurrentLocation}
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
                              // setDeliveryAddress(suggestion);
                              // setAddressSuggestions([]);
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
                  <span className="text-[14px] font-medium">₦{total}</span>
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
                    ₦{Number(total + deliveryFee).toLocaleString()}
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
                  onClick={onClose}
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
                    ₦{Number(total + deliveryFee).toLocaleString()}
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

      {successInfo && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
            <button
              onClick={handleContinueShopping}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="mt-4 text-[22px] font-semibold text-gray-900">
              {successInfo.title}
            </h2>
            <p className="mt-2 text-[14px] text-gray-600">
              {successInfo.message}
            </p>
            {successInfo.description && (
              <p className="mt-2 text-[13px] text-gray-500">
                {successInfo.description}
              </p>
            )}

            <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-left">
              <div className="flex items-center justify-between text-[14px] text-gray-600">
                <span className="font-medium">
                  {t("total_amount", "Total Amount")}
                </span>
                <span className="font-semibold text-gray-900">
                  {`\u20A6${Number(totalWithDelivery).toLocaleString()}`}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px] text-gray-500">
                <span>{t("payment_method", "Payment Method")}</span>
                <span className="text-gray-700">{successInfo.method}</span>
              </div>
            </div>

            <button
              onClick={handleViewOrders}
              className="mt-6 w-full rounded-full bg-sky-600 py-3 text-[16px] font-medium text-white transition-colors hover:bg-sky-700"
            >
              {t("view_my_orders", "View my orders")}
            </button>
            <button
              onClick={handleContinueShopping}
              className="mt-3 w-full rounded-full border border-gray-200 py-3 text-[16px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              {t("continue_shopping", "Continue shopping")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
