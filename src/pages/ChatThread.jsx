import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ArrowLeft, Check, CheckCheck } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSettings, SETTINGS_KEYS } from "@/lib/settings";
import { db } from "@/lib/firebase";
import {
  getOrCreateThread,
  listenThreadMessagesPaginated,
  sendChatMessage,
  markThreadRead,
  markMessageDelivered,
  uploadChatImage,
} from "@/lib/db";
import { doc, getDoc } from "firebase/firestore";
import { Paperclip } from "lucide-react";
import SendButtonUrl from "@/icons/SendButton.svg?url";
import CallIcon from "@/icons/react/CallIcon";
import notificationSound from "@/assets/message-tone.mp3"; // You need to provide this mp3 file
import { createPrescription } from "@/lib/db";
import { Menu } from "@headlessui/react";
import Modal from "@/components/Modal";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useTranslation } from "@/lib/language";
import VerifiedName from "@/components/VerifiedName";
import Messages from "@/pages/Messages";
import ImageModal from "@/components/ImageModal";

/* Prescription */
import PrescriptionPreview from "@/components/PrescriptionPreview";

// Lazy load heavy components
const CreatePrescriptionModal = React.lazy(() =>
  import("@/components/CreatePrescriptionModal")
);
const PrescriptionList = React.lazy(() =>
  import("@/components/PrescriptionList")
);
const MessageWithLinks = React.lazy(() =>
  import("@/components/MessageWithLinks")
);
// Use the SVG placed in the `public/` folder so production (Netlify) serves it at root
const ChatBgUrl = "/ChatBg.svg";

/**
 * ChatThread Page Component
 *
 * Routes:
 * - /chat/:vendorId - Customer initiating chat with a pharmacy
 * - /thread/:threadId - Opening an existing chat thread
 *
 * URL Parameters:
 * - vendorId: pharmacy ID (for customers starting new chat)
 * - threadId: existing thread ID (for opening existing conversations)
 */

// Helper to format date separators like WhatsApp
function getDateLabel(date, t) {
  const now = new Date();
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = (today - d) / (1000 * 60 * 60 * 24);
  if (diff === 0) return t("today", "Today");
  if (diff === 1) return t("yesterday", "Yesterday");
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper to detect if a message is a product preview
function isProductPreviewMessage(m) {
  return m.type === "product-preview";
}

// Message status indicator component - memoized to prevent unnecessary re-renders
const MessageStatus = React.memo(({ message, isMine, t }) => {
  if (!isMine) return null; // Only show status for sent messages

  const status = message.status || "sent";
  const isRead = message.read || status === "read";

  if (status === "sent") {
    return (
      <Check
        className="w-3 h-3 text-gray-400 ml-1 opacity-80"
        strokeWidth={2}
        title={t("sent", "Sent")}
      />
    );
  }

  if (status === "delivered") {
    return (
      <CheckCheck
        className="w-3 h-3 text-gray-400 ml-1 opacity-80"
        strokeWidth={2}
        title={t("delivered", "Delivered")}
      />
    );
  }

  if (status === "read" || isRead) {
    return (
      <CheckCheck
        className="w-3 h-3 text-green-500 ml-1"
        strokeWidth={2}
        title={t("read", "Read")}
      />
    );
  }

  return null;
});

// Enhanced MessageStatus that respects read receipts setting
const ConditionalMessageStatus = React.memo(
  ({ message, isMine, showReadReceipts, t }) => {
    if (!isMine || !showReadReceipts) return null;
    return <MessageStatus message={message} isMine={isMine} t={t} />;
  }
);

MessageStatus.displayName = "MessageStatus";
ConditionalMessageStatus.displayName = "ConditionalMessageStatus";

// Skeleton component for loading messages
const MessageSkeleton = React.memo(() => (
  <div className="flex flex-col items-start w-full mb-2 animate-pulse">
    <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-10 w-48 mb-1"></div>
    <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-6 w-32"></div>
  </div>
));

MessageSkeleton.displayName = "MessageSkeleton";

function useIsDesktop(minWidth = 1024) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handleChange = (event) => setIsDesktop(event.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    setIsDesktop(mediaQuery.matches);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [minWidth]);

  return isDesktop;
}

export default function ChatThread() {
  const { user, profile } = useAuth();
  const { getSetting } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [stateThread, setStateThread] = useState(location.state?.thread || null);
  const isDesktop = useIsDesktop();

  // Get vendorId and threadId from URL parameters
  const vendorIdFromUrl = params.vendorId;
  const threadIdFromUrl = params.threadId;

  useEffect(() => {
    setStateThread(location.state?.thread || null);
  }, [location.state, location.key]);

  const initialThread = stateThread;
  const [threadId, setThreadId] = useState(
    threadIdFromUrl || initialThread?.id || null
  );

  // 🔹 What to show in the sticky header
  const [otherName, setOtherName] = useState("");
  const [otherSubline, setOtherSubline] = useState(""); // e.g., address or email
  const [otherVerified, setOtherVerified] = useState(false);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pharmacyPhone, setPharmacyPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [visibleMessageCount, setVisibleMessageCount] = useState(50); // Start with 50 messages
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const [lastMessageId, setLastMessageId] = useState(null);
  const [isTabActive, setIsTabActive] = useState(true);
  const audioRef = useRef(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [pharmacyProducts, setPharmacyProducts] = useState([]);
  const [showPrescriptionHistory, setShowPrescriptionHistory] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState(null);

  // Handle image modal visibility changes
  useEffect(() => {
    if (imageModalUrl) {
      document.body.classList.add('image-modal-open');
    } else {
      document.body.classList.remove('image-modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('image-modal-open');
    };
  }, [imageModalUrl]);

  const queryParams = new URLSearchParams(location.search);
  const productId = queryParams.get("productId");
  const productName = queryParams.get("productName");
  const productImage = queryParams.get("productImage");
  const vendorName = queryParams.get("vendorName");
  const productPrice = queryParams.get("productPrice"); // <-- Add this line
  const prefillMsg = queryParams.get("prefillMsg");

  useEffect(() => {
    if (!initialThread) return;

    if (profile?.role === "customer") {
      setOtherName(initialThread.vendorName || t("pharmacy", "Pharmacy"));
      setOtherSubline(
        initialThread.vendorAddress ||
          initialThread.vendorEmail ||
          ""
      );
      const verified =
        typeof initialThread.vendorIsVerified === "boolean"
          ? initialThread.vendorIsVerified
          : initialThread.vendorVerificationStatus === "approved";
      setOtherVerified(verified);
      if (initialThread.vendorPhone) {
        setPharmacyPhone(initialThread.vendorPhone);
      }
    } else {
      setOtherName(initialThread.customerName || t("customer", "Customer"));
      setOtherSubline(
        initialThread.customerAddress ||
          initialThread.customerEmail ||
          ""
      );
      setOtherVerified(false);
    }
  }, [initialThread, profile?.role, t]);

  // Resolve thread:
  // - customer + vendorId from URL => create/get thread
  // - if threadId from URL => use existing thread directly
  useEffect(() => {
    if (!user) return;

    (async () => {
      if (threadIdFromUrl) {
        setThreadId(threadIdFromUrl);
        return;
      }

      if (initialThread?.id) {
        setThreadId(initialThread.id);
        return;
      }

      if (profile?.role === "customer" && vendorIdFromUrl) {
        const id = await getOrCreateThread({
          vendorId: vendorIdFromUrl,
          customerId: user.uid,
          role: "customer",
        });
        setThreadId(id);
      } else if (profile?.role === "vendor" && !threadIdFromUrl) {
        console.warn("Vendor tried to open chat without threadId in URL.");
        navigate("/messages");
        return;
      }
    })().catch(console.error);
  }, [user?.uid, profile?.role, vendorIdFromUrl, threadIdFromUrl, navigate, initialThread]);

  // 🔹 Load the thread doc and derive the "other party" name/subline
  useEffect(() => {
    if (!threadId || !profile?.role) return;

    const threadRef = doc(db, "threads", threadId);
    const unsubscribe = onSnapshot(threadRef, async (tSnap) => {
      if (!tSnap.exists()) return;
      const t = tSnap.data();
      const [vId, cId] = threadId.split("__");
      if (profile.role === "customer") {
        const ensureVendorInfo = async () => {
          const pSnap = await getDoc(doc(db, "pharmacies", vId));
          return pSnap.exists() ? pSnap.data() : {};
        };
        const name = t.vendorName || "";
        const address = t.vendorAddress || "";
        let vendorInfo = null;

        if (name) {
          setOtherName(name);
        } else {
          vendorInfo = await ensureVendorInfo();
          setOtherName(vendorInfo.name || t("pharmacy", "Pharmacy"));
        }

        if (address) {
          setOtherSubline(address);
        } else {
          if (!vendorInfo) vendorInfo = await ensureVendorInfo();
          setOtherSubline(vendorInfo.address || vendorInfo.email || "");
        }

        if (typeof t.vendorIsVerified === "boolean") {
          setOtherVerified(t.vendorIsVerified);
        } else {
          if (!vendorInfo) vendorInfo = await ensureVendorInfo();
          setOtherVerified(!!vendorInfo.isVerified);
        }

        if (!vendorInfo) vendorInfo = await ensureVendorInfo();
        setPharmacyPhone(vendorInfo.phone || "");
      } else {
        const name = t.customerName || "";
        const sub = t.customerAddress || t.customerEmail || "";
        if (name) {
          setOtherName(name);
          setOtherSubline(sub);
        } else {
          const uSnap = await getDoc(doc(db, "users", cId));
          const u = uSnap.exists() ? uSnap.data() : {};
          setOtherName(u.displayName || t("customer", "Customer"));
          setOtherSubline(u.email || "");
        }
        setOtherVerified(false);
      }
    });

    return () => unsubscribe();
  }, [threadId, profile?.role, t]);

  // Live messages + mark read - using paginated listener for better performance
  useEffect(() => {
    if (!threadId || !user?.uid) return;

    setIsLoading(true);
    const stop = listenThreadMessagesPaginated(
      threadId,
      (newMessages) => {
        setMessages(newMessages);
        setIsLoading(false);

        // Mark incoming messages as delivered (simulate recipient receiving them)
        newMessages.forEach(async (msg) => {
          if (msg.senderId !== user.uid && msg.status === "sent") {
            try {
              await markMessageDelivered(threadId, msg.id);
            } catch (error) {
              console.error("Error marking message as delivered:", error);
            }
          }
        });
      },
      console.error,
      100
    ); // Load latest 100 messages initially

    markThreadRead(threadId, user.uid).catch(console.error);
    return stop;
  }, [threadId, user?.uid]);

  // Optimized scroll to bottom - only when new messages arrive
  const scrollToBottom = useCallback((immediate = false) => {
    if (immediate) {
      bottomRef.current?.scrollIntoView();
    } else {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, []);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [messages.length, isLoading, scrollToBottom]);

  // Throttled scroll handler for better performance
  const throttledHandleScroll = useMemo(() => {
    let timeoutId = null;
    return (e) => {
      if (timeoutId) return; // Skip if already throttled

      timeoutId = setTimeout(() => {
        const container = e.target;
        const scrollTop = container.scrollTop;

        // If user scrolls near the top and there are more messages, load more
        if (scrollTop < 200 && visibleMessageCount < messages.length) {
          setVisibleMessageCount((prev) =>
            Math.min(prev + 50, messages.length)
          );
        }

        timeoutId = null;
      }, 100); // Throttle to 100ms
    };
  }, [visibleMessageCount, messages.length]);

  // Handle scroll to load more messages
  const handleScroll = useCallback(
    (e) => {
      throttledHandleScroll(e);
    },
    [throttledHandleScroll]
  );

  // Get visible messages (latest N messages)
  const visibleMessages = useMemo(() => {
    return messages.slice(-visibleMessageCount);
  }, [messages, visibleMessageCount]);

  // Get settings for functionality
  const showReadReceipts = getSetting(SETTINGS_KEYS.MESSAGE_READ_RECEIPTS);
  const dataSaverMode = getSetting(SETTINGS_KEYS.DATA_SAVER_MODE);

  // Page visibility for message tone
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabActive(!document.hidden);
      // When tab becomes active, mark thread as read
      if (!document.hidden && threadId && user?.uid) {
        markThreadRead(threadId, user.uid).catch(console.error);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [threadId, user?.uid]);

  // Play tone on new incoming message (not sent by self)
  const prevMsgId = useRef(null);
  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg.id !== prevMsgId.current &&
      lastMsg.senderId !== user?.uid &&
      audioRef.current
    ) {
      audioRef.current.currentTime = 0;
      // Try to play, fallback if blocked
      const playPromise = audioRef.current.play();
      if (playPromise) playPromise.catch(() => {});
    }
    prevMsgId.current = lastMsg.id;
  }, [messages, user?.uid]);

  const otherUid = useCallback(() => {
    if (!threadId || !user) return null;
    const [vId, cId] = threadId.split("__");
    return user.uid === vId ? cId : vId;
  }, [threadId, user]);

  const onSend = useCallback(async () => {
    const to = otherUid();
    if (!to || !threadId) return;
    if (!text.trim() && !selectedImage) return;

    // Optimistically clear input immediately for better UX
    const messageText = text.trim();
    const imageToSend = selectedImage;
    setText("");
    setSelectedImage(null);

    try {
      let imageUrl = null;
      if (imageToSend) {
        setIsUploadingImage(true);
        imageUrl = await uploadChatImage(imageToSend, threadId, user.uid);
        setIsUploadingImage(false);
      }

      await sendChatMessage(threadId, {
        senderId: user.uid,
        to,
        text: messageText,
        imageUrl,
      });
    } catch (error) {
      // Restore text and image if send fails
      setText(messageText);
      setSelectedImage(imageToSend);
      setIsUploadingImage(false);
      console.error("Failed to send message:", error);
    }
  }, [threadId, text, selectedImage, user?.uid, otherUid]);

  const handleImageSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
    }
  }, []);

  // Defer pharmacy products listener until the prescription modal opens
  useEffect(() => {
    if (!showPrescriptionModal) return;
    let vId = null;
    if (profile?.role === "pharmacy") vId = user?.uid;
    else if (threadId) [vId] = threadId.split("__");
    if (!vId) return;
    const q = query(collection(db, "products"), where("pharmacyId", "==", vId));
    const unsub = onSnapshot(q, (snap) => {
      setPharmacyProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub && unsub();
  }, [showPrescriptionModal, profile?.role, user?.uid, threadId]);

  // Handle prescription creation
  const handleCreatePrescription = async ({
    drugs,
    startDate,
    duration,
    notes,
  }) => {
    if (!threadId || !user) return;
    const [vId, cId] = threadId.split("__");
    const { id: prescriptionId } = await createPrescription({
      pharmacyId: vId,
      customerId: cId,
      chatThreadId: threadId,
      drugs,
      startDate,
      duration,
      notes,
    });
    setShowPrescriptionModal(false);
    // Optionally, send a chat message
    await sendChatMessage(
      threadId,
      {
        senderId: user.uid,
        to: cId,
        text: t("prescription_created", "A new prescription has been created."),
      },
      prescriptionId
    );
  };

  // Prefill message input if product info is present (runs when product params change)
  useEffect(() => {
    if (productName && productId) {
      const priceText = productPrice ? productPrice : "";
      setText(
        t(
          "drug_inquiry",
          `I want to know more about this drug {productName}{priceText}.`,
          { productName, priceText: priceText ? ", " + priceText : "" }
        )
      );
    } else if (prefillMsg) {
      setText(prefillMsg);
    }
    // eslint-disable-next-line
  }, [productName, productPrice, productId, prefillMsg]);

  return (
    <div
      className={`h-screen w-full bg-white dark:bg-gray-900 ${
        isDesktop ? "flex" : "flex flex-col"
      }`}
    >
      {isDesktop && (
        <aside className="relative z-10 flex h-full w-[340px] flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <Messages
            variant="sidebar"
            selectedThreadId={threadId || undefined}
          />
        </aside>
      )}
      <div className="relative flex h-full flex-1 flex-col items-stretch overflow-visible bg-white dark:bg-gray-900">
      {/* Fixed background layer (non-scrollable) placed above page background but behind UI */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: `url(${ChatBgUrl})`,
          backgroundRepeat: "repeat",
          backgroundPosition: "center center",
          backgroundSize: "200px 200px", // Optimized: Smaller tile size for better performance
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.3, // Optimized: Reduced opacity for subtlety and better text readability
          willChange: "transform", // Optimized: GPU acceleration hint
          backfaceVisibility: "hidden", // Optimized: Reduce repaints
          transform: "translateZ(0)", // Optimized: Force GPU layer
        }}
      />

      {/* Main content wrapper sits above the fixed background */}
      <div
        style={{ position: "relative", zIndex: 10 }}
        className="flex-1 flex flex-col min-h-0"
      >
        {/* Scoped CSS to visually hide scrollbar but keep scrolling functional */}
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none} .hide-scrollbar{-ms-overflow-style:none; scrollbar-width:none;}`}</style>
        {/* Audio for message tone (defer load until needed) */}
        <audio ref={audioRef} src={notificationSound} preload="none" />
        {/* Header (full-bleed background, centered content). Negate parent padding with -mx to reach screen edges */}
        <div
          className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 pt-1 pb-1"
          style={{
            paddingTop: "env(safe-area-inset-top, 0)",
            // Force the header background to span the full viewport width even when content is centered with max-width
            width: isDesktop ? "100%" : "100vw",
            marginLeft: isDesktop ? 0 : "calc(50% - 50vw)",
            // Respect safe-area on notch devices
            paddingRight: "env(safe-area-inset-right, 0)",
          }}
        >
          <div className="w-full px-4 sm:px-5 pt-6 pb-3 flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              {!isDesktop && (
                <button
                  onClick={() => {
                    if (window.history.length > 1) {
                      navigate(-1);
                    } else {
                      navigate("/messages");
                    }
                  }}
                  className="rounded-full border border-gray-200 dark:border-gray-600 px-3 py-1 text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 sm:px-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              {/* Customer: show pharmacy name as link */}
              {profile?.role === "customer" ? (
                <button
                  className="min-w-0 font-light text-[15px] sm:text-[17px] truncate text-left hover:underline focus:outline-none text-gray-900 dark:text-white"
                  onClick={() => {
                    if (threadId) {
                      const [vId] = threadId.split("__");
                      navigate(`/vendor/${vId}`);
                    }
                  }}
                  title={otherName}
                >
                  <VerifiedName name={otherName || "..."} isVerified={otherVerified} className="inline-flex items-center gap-1" iconClassName="h-4 w-4 text-sky-500 dark:text-sky-400" />
                </button>
              ) : (
                <div className="min-w-0">
                  <div className="font-light text-[15px] sm:text-[17px] truncate text-gray-900 dark:text-white">
                    <VerifiedName name={otherName || "..."} isVerified={otherVerified} className="inline-flex items-center gap-1" iconClassName="h-4 w-4 text-sky-500 dark:text-sky-400" />
                  </div>
                  <div className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate">
                    {otherSubline}
                  </div>
                </div>
              )}
            </div>
            {/* Call button for customer */}
            {profile?.role === "customer" && (
              <a
                href={pharmacyPhone ? `tel:${pharmacyPhone}` : undefined}
                className={`flex items-center justify-center rounded-full border border-sky-500 text-sky-600 dark:text-sky-400 px-2 py-1 text-[11px] font-poppins font-light ${
                  pharmacyPhone
                    ? "hover:bg-sky-50 dark:hover:bg-sky-900/20"
                    : "opacity-40 cursor-not-allowed"
                }`}
                style={{ minWidth: 32 }}
                title={
                  pharmacyPhone
                    ? t("call_pharmacy_title", `Call {pharmacy}`, {
                        pharmacy: otherName,
                      })
                    : t("no_phone_number", "No phone number")
                }
                tabIndex={pharmacyPhone ? 0 : -1}
                aria-disabled={!pharmacyPhone}
              >
                <CallIcon className="h-3 w-3 mr-1" /> {t("call", "Call")}
              </a>
            )}
            {/* Dropdown for pharmacy actions */}
            {profile?.role === "pharmacy" && threadId && (
              <Menu as="div" className="relative inline-block text-left ml-2">
                <Menu.Button className="px-3 py-1 rounded-full bg-sky-600 text-white text-xs font-medium">
                  {t("actions", "Actions")} ▾
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 border border-sky-200 dark:border-gray-600 divide-y divide-gray-100 dark:divide-gray-700 rounded-[5px] shadow-lg focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`w-full text-left px-4 py-2 text-[12px] font-light ${
                            active ? "bg-sky-50" : ""
                          }`}
                          onClick={() => setShowPrescriptionModal(true)}
                        >
                          {t("create_prescription", "Create Prescription")}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`w-full text-left px-4 py-2 text-[12px] font-light ${
                            active ? "bg-sky-50" : ""
                          }`}
                          onClick={() => setShowPrescriptionHistory(true)}
                        >
                          {t(
                            "view_prescription_history",
                            "View Prescription History"
                          )}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="w-full flex-1 flex flex-col min-h-0">
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-3 sm:px-4 pb-28 min-h-0 hide-scrollbar"
            style={{ paddingTop: 12 }}
            onScroll={handleScroll}
          >
            {/* Show load more indicator */}
            {visibleMessageCount < messages.length && (
              <div className="flex justify-center py-4">
                <button
                  onClick={() =>
                    setVisibleMessageCount((prev) =>
                      Math.min(prev + 50, messages.length)
                    )
                  }
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1 rounded-full transition-colors"
                >
                  {t("load_more_messages", "Load {count} more messages", {
                    count: Math.min(50, messages.length - visibleMessageCount),
                  })}
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {/* Show skeleton messages while loading */}
                <MessageSkeleton />
                <div className="flex flex-col items-end w-full mb-2 animate-pulse">
                  <div className="bg-blue-200 dark:bg-blue-700 rounded-2xl h-10 w-40 mb-1"></div>
                  <div className="bg-blue-200 dark:bg-blue-700 rounded-2xl h-6 w-24"></div>
                </div>
                <MessageSkeleton />
                <div className="flex flex-col items-end w-full mb-2 animate-pulse">
                  <div className="bg-blue-200 dark:bg-blue-700 rounded-2xl h-8 w-56 mb-1"></div>
                </div>
                <MessageSkeleton />
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-gray-400 dark:text-gray-500 text-sm text-center">
                  <div className="text-lg mb-2">💬</div>
                  {t("start_conversation", "Start your conversation")}
                </div>
              </div>
            ) : (
              (() => {
                let lastDate = null;
                return visibleMessages.map((m) => {
                  const isMine = m.senderId === user?.uid;
                  const timestamp = m.createdAt?.seconds
                    ? new Date(m.createdAt.seconds * 1000)
                    : null;
                  let showDate = false;
                  if (timestamp) {
                    const dayStr = timestamp.toDateString();
                    if (lastDate !== dayStr) {
                      showDate = true;
                      lastDate = dayStr;
                    }
                  }
                  return (
                    <React.Fragment key={m.id}>
                      {showDate && timestamp && (
                        <div className="flex justify-center my-4 mb-3">
                          <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] font-light px-2 py-0.5 rounded-md opacity-80">
                            {getDateLabel(timestamp, t)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex flex-col items-${
                          isMine ? "end" : "start"
                        } w-full mb-1.5`}
                      >
                        <div
                          className={`${
                            isMine
                              ? "bg-blue-500 text-white ml-8"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white mr-8 border border-gray-200 dark:border-gray-600 dark:border-gray-700"
                          } px-2.5 py-1.5 max-w-[75%] sm:max-w-[65%] whitespace-pre-wrap break-words shadow-sm`}
                          style={{
                            borderRadius: isMine
                              ? "10px 10px 2px 10px"
                              : "10px 10px 10px 2px",
                            fontSize: 13,
                            lineHeight: 1.2,
                          }}
                        >
                          {m.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={m.imageUrl}
                                alt="Shared image"
                                className="max-w-full max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setImageModalUrl(m.imageUrl)}
                              />
                            </div>
                          )}
                          <React.Suspense fallback={<span>{m.text}</span>}>
                            <MessageWithLinks text={m.text} isMine={isMine} />
                          </React.Suspense>
                        </div>
                        {/* Prescription Preview */}
                        {m.prescriptionId && (
                          <div className="mt-1">
                            <PrescriptionPreview
                              prescriptionId={m.prescriptionId}
                            />{" "}
                          </div>
                        )}
                        <div
                          className={`flex items-center text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 ${
                            isMine ? "mr-2 justify-end" : "ml-2 justify-start"
                          }`}
                        >
                          <span>
                            {timestamp
                              ? timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                          <ConditionalMessageStatus
                            message={m}
                            isMine={isMine}
                            showReadReceipts={showReadReceipts}
                            t={t}
                          />
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer (full-bleed background, centered content). Negate parent padding with -mx to reach screen edges */}
          <div
            className="w-full sticky bottom-0 z-20 bg-white/85 dark:bg-gray-900/85 backdrop-blur"
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 0)",
              // Make the composer background truly full-bleed across the viewport
              width: isDesktop ? "100%" : "100vw",
              marginLeft: isDesktop ? 0 : "calc(50% - 50vw)",
              paddingLeft: "env(safe-area-inset-left, 0)",
              paddingRight: "env(safe-area-inset-right, 0)",
            }}
          >
            <div className="w-full">
              {selectedImage && (
                <div className="mx-4 sm:mx-5 mb-2 relative">
                  <div className="relative inline-block">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Selected"
                      className="max-h-32 max-w-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                  {isUploadingImage && (
                    <div className="text-sm text-gray-500 mt-1">
                      {t("uploading_image", "Uploading image...")}
                    </div>
                  )}
                </div>
              )}
              <form
                className="mx-4 sm:mx-5 flex items-center gap-3 py-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSend();
                }}
              >
                <label
                  className="flex items-center cursor-pointer hover:text-blue-500 transition-colors"
                  title={t("attach_image", "Attach image")}
                >
                  <Paperclip className="h-5 w-5 text-gray-400 hover:text-blue-500" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("message_placeholder", "Message")}
                  className="flex-1 min-w-0 outline-none px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 dark:border-gray-600 rounded-full placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:text-[14px] focus:border-blue-400 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200"
                  style={{ fontSize: 14 }}
                />
                <button
                  type="submit"
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                    text.trim() || selectedImage
                      ? "bg-blue-500 hover:bg-blue-600 active:scale-95"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                  disabled={!text.trim() && !selectedImage}
                >
                  <img src={SendButtonUrl} alt="Send" className="h-4 w-4" />
                </button>
              </form>
              <div style={{ height: 8 }} />
            </div>
          </div>
        </div>

        {/* Create Prescription Modal */}
        <React.Suspense fallback={null}>
          <CreatePrescriptionModal
            open={showPrescriptionModal}
            onClose={() => setShowPrescriptionModal(false)}
            products={pharmacyProducts}
            onSubmit={handleCreatePrescription}
          />
        </React.Suspense>
        {/* Prescription History Modal */}
        <Modal
          open={showPrescriptionHistory}
          onClose={() => setShowPrescriptionHistory(false)}
        >
          <React.Suspense fallback={null}>
            <PrescriptionList
              chatThreadId={threadId}
              products={pharmacyProducts}
              userId={user?.uid}
            />
          </React.Suspense>
        </Modal>

        {/* Prescription Quick Actions (for customer) */}
        {/* Removed PrescriptionList from chat thread view as per requirements */}
      </div>

      {/* Image Modal */}
      <ImageModal
        imageUrl={imageModalUrl}
        isOpen={!!imageModalUrl}
        onClose={() => setImageModalUrl(null)}
      />
    </div>
  </div>
  );
}
