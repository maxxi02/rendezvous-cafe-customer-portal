"use client";

import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Coffee, Utensils, Lock } from "lucide-react";
import { toast } from "sonner";
import { MenuCard } from "./_components/MenuCard";
import { Cart } from "./_components/Cart";
import { CheckoutModal } from "./_components/CheckoutModal";
import { CustomerOrderItem, CustomerOrder } from "@/app/types/order.type";
import { useSocket } from "../providers/socket-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useAnonymousSession } from "@/lib/use-anonymous-session";
import { AuthModal } from "@/app/components/shared/AuthModal";
import { MenuAuthActions } from "./_components/MenuAuthActions";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  category?: string;
  menuType?: "food" | "drink";
  ingredients: Array<{ name: string; quantity: string; unit: string }>;
  available: boolean;
}

interface CategoryData {
  _id: string;
  name: string;
  menuType: "food" | "drink";
  products: MenuItem[];
}



interface SessionData {
  customerName: string;
  tableId?: string;
  qrType: string;
  isAnonymous: boolean;
  email?: string;
  lastOrderId?: string;
  isUnavailable?: boolean;
  customerId?: string;
  sessionId?: string;
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse text-white/30 text-sm uppercase tracking-widest font-black">
            Loading Menu...
          </div>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}

function MenuContent() {
  const { emitCustomerOrder, onShopStatusChanged, offShopStatusChanged } = useSocket();
  const router = useRouter();
  const { data: authSession } = authClient.useSession();

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMenuType, setSelectedMenuType] = useState<
    "all" | "food" | "drink"
  >("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CustomerOrderItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  // null = loading, true = open, false = closed
  const [isShopOpen, setIsShopOpen] = useState<boolean | null>(null);
  const searchParams = useSearchParams();

  const tableIdQuery = searchParams.get("table");
  const qrTypeQuery = searchParams.get("type");

  // Handle auto-session for QR users
  const { user: anonUser, createAnonymousUser } = useAnonymousSession();

  useEffect(() => {
    const initAutoSession = async () => {
      const stored = sessionStorage.getItem("orderSession");
      let currentSession: SessionData | null = null;
      try {
        if (stored) currentSession = JSON.parse(stored);
      } catch {
        /* ignore */
      }

      // If we have a healthy session with customerId, don't re-init
      if (currentSession?.customerId && !tableIdQuery && !qrTypeQuery) return;

      try {
        // 1. Determine user identity using Google Auth or new JWT Anonymous system
        let userId: string | undefined;
        let isAnonymous = false;
        let customerName = "Guest";

        if (authSession?.user && !authSession.user.isAnonymous) {
          // Real Google User
          userId = authSession.user.id;
          customerName = authSession.user.name || "Guest";
          isAnonymous = false;
        } else if (anonUser) {
          // Existing JWT Anonymous User
          userId = anonUser.id;
          customerName = anonUser.name;
          isAnonymous = true;
        }

        // 2. Fetch table info if needed
        let tableLabel = "";
        let isTableUnavailable = false;
        if (tableIdQuery) {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const tableRes = await fetch(`${apiUrl}/api/tables/${tableIdQuery}`);
            if (tableRes.ok) {
              const table = await tableRes.json();
              tableLabel = table.label;
              isTableUnavailable = table.status === "unavailable";
            }
          } catch (e) {
            console.error("Failed to fetch table label", e);
          }
        }

        if (isTableUnavailable) {
          const unavailableSession: SessionData = {
            customerName: "Guest",
            tableId: tableIdQuery || undefined,
            qrType: qrTypeQuery || "dine-in",
            isAnonymous: true,
            isUnavailable: true,
            customerId: userId || "temp",
          };
          sessionStorage.setItem("orderSession", JSON.stringify(unavailableSession));
          setSessionData(unavailableSession);
          return;
        }

        // 3. Occupy table if a table exists
        if (tableIdQuery) {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            await fetch(`${apiUrl}/api/tables`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tableId: tableIdQuery, status: "occupied" }),
            });
          } catch (e) {
            console.error("Failed to occupy table", e);
          }
        }

        // 4. Generate name for new anonymous users if no existing session
        if (!userId) {
          let automaticName = "Guest";
          if (tableLabel) {
            const numMatch = tableLabel.match(/\d+/);
            const num = numMatch ? numMatch[0] : tableLabel;
            automaticName = `TABLE-#${num}`;
          } else if (tableIdQuery) {
            const numMatch = tableIdQuery.match(/\d+/);
            const num = numMatch ? numMatch[0] : tableIdQuery;
            automaticName = `TABLE-#${num}`;
          } else if (qrTypeQuery === "walk-in") {
            automaticName = "Walk-In Customer";
          } else if (qrTypeQuery === "drive-thru") {
            automaticName = "Drive-Thru Customer";
          }

          // Create the new JWT anonymous session
          const newUser = await createAnonymousUser(automaticName, "guest@rendezvous.com");
          userId = newUser.id;
          customerName = newUser.name;
          isAnonymous = true;
        }

        // 5. Create/Update order session for tracking
        const newSessionData: SessionData = {
          ...currentSession,
          customerName: customerName,
          tableId: tableIdQuery || currentSession?.tableId || undefined,
          qrType: qrTypeQuery || currentSession?.qrType || "dine-in",
          isAnonymous: isAnonymous,
          email: authSession?.user?.email || "guest@rendezvous.com",
          customerId: userId,
          sessionId: currentSession?.sessionId || `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        sessionStorage.setItem("orderSession", JSON.stringify(newSessionData));
        setSessionData(newSessionData);

        if (!stored) {
          toast.success(`Welcome! You are ordering as ${newSessionData.customerName}`);
        }
      } catch (error) {
        console.error("Error during auto session init:", error);
      }
    };

    initAutoSession();
  }, [tableIdQuery, qrTypeQuery, authSession, anonUser, createAnonymousUser]);

  // ─── Fetch shop status on mount ────────────────────────────────────────────
  useEffect(() => {
    const checkShopStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/shop-status`);
        if (res.ok) {
          const data = await res.json();
          setIsShopOpen(data.isOpen ?? true);
        } else {
          setIsShopOpen(true); // default open on error
        }
      } catch {
        setIsShopOpen(true); // default open on error
      }
    };
    checkShopStatus();
  }, []);

  // ─── Real-time shop status updates ─────────────────────────────────────────
  useEffect(() => {
    const handleShopStatus = ({ isOpen }: { isOpen: boolean }) => {
      setIsShopOpen(isOpen);
      if (!isOpen) {
        toast.error("The shop has closed. Ordering is no longer available.");
      } else {
        toast.success("The shop is now open! You can place your order.");
      }
    };
    onShopStatusChanged(handleShopStatus);
    return () => offShopStatusChanged(handleShopStatus);
  }, [onShopStatusChanged, offShopStatusChanged]);

  // Load session data
  useEffect(() => {
    const stored = sessionStorage.getItem("orderSession");
    if (stored) {
      try {
        setSessionData(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse session data", e);
      }
    }
  }, []);

  // Make table available when exiting the portal
  useEffect(() => {
    // Clear the payment redirect flag when this page mounts (e.g. user came back from GCash)
    sessionStorage.removeItem("isRedirectingToPayment");

    const handleUnload = () => {
      if (!sessionData) return;

      // If the user is being redirected to PayMongo, do NOT delete the anonymous user
      const isRedirectingToPayment =
        sessionStorage.getItem("isRedirectingToPayment") === "true";
      if (isRedirectingToPayment) return;

      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

      if (sessionData.tableId && !sessionData.isUnavailable) {
        fetch(`${apiUrl}/api/tables`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableId: sessionData.tableId,
            status: "available",
          }),
          keepalive: true,
        }).catch(() => { });
      }

      if (sessionData.isAnonymous && sessionData.customerId) {
        fetch(`${apiUrl}/api/customer/exit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: sessionData.customerId,
          }),
          keepalive: true,
        }).catch(() => { });
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [sessionData]);

  // Fetch products
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products/categories`,
        );
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Failed to load menu");
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Flatten products
  const allProducts = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    const seen = new Map<string, typeof categories[0]["products"][0] & { category: string; menuType: "food" | "drink" }>();
    categories.forEach((cat) =>
      (cat.products ?? [])
        .filter((p) => p.available)
        .forEach((p) => {
          if (!seen.has(p._id)) {
            seen.set(p._id, { ...p, category: cat.name, menuType: cat.menuType });
          }
        }),
    );
    return Array.from(seen.values());
  }, [categories]);

  // Category tabs
  const categoryTabs = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          allProducts
            .filter(
              (p) =>
                selectedMenuType === "all" || p.menuType === selectedMenuType,
            )
            .map((p) => p.category ?? "Other"),
        ),
      ),
    ],
    [allProducts, selectedMenuType],
  );

  // Filtered products
  const filteredProducts = useMemo(
    () =>
      allProducts.filter(
        (p) =>
          (selectedMenuType === "all" || p.menuType === selectedMenuType) &&
          (selectedCategory === "All" || p.category === selectedCategory),
      ),
    [allProducts, selectedMenuType, selectedCategory],
  );

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Cart actions
  const addToCart = (product: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        return prev.map((i) =>
          i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        { ...product, quantity: 1, ingredients: product.ingredients ?? [] },
      ];
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateCart = (id: string, change: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i._id === id
            ? { ...i, quantity: Math.max(1, i.quantity + change) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i._id !== id));
  };

  const handleConfirmOrder = async (order: CustomerOrder) => {
    emitCustomerOrder(order);
    setCart([]);
    setShowCheckout(false);
    setShowCart(false);

    // Save latest order ID to session for the waiting page
    if (sessionData) {
      sessionData.lastOrderId = order.orderId;
      sessionStorage.setItem("orderSession", JSON.stringify(sessionData));
    }

    // NOTE: Do NOT call router.push('/order/waiting') here.
    // For GCash payments, CheckoutModal handles the redirect to GCash itself
    // via window.location.href after this function returns.
    // The /payment/success page then redirects to /order/waiting.
  };

  if (sessionData?.isUnavailable) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 p-8 rounded-3xl border border-red-500/20 max-w-md w-full backdrop-blur-sm">
          <div className="w-20 h-20 bg-red-500/20 flex items-center justify-center rounded-2xl mx-auto mb-6">
            <Utensils className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-white text-2xl font-black uppercase tracking-widest mb-3">
            Table Unavailable
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            This table is currently not available for ordering. Please contact
            our staff for assistance.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Shop closed blocking screen
  if (isShopOpen === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/5 p-10 rounded-3xl border border-white/10 max-w-md w-full backdrop-blur-sm">
          <div className="w-24 h-24 bg-white/10 flex items-center justify-center rounded-2xl mx-auto mb-6">
            <Lock className="w-12 h-12 text-white/60" />
          </div>
          <h2 className="text-white text-3xl font-black uppercase tracking-widest mb-3">
            Shop Closed
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-2">
            We&apos;re not accepting orders right now.
          </p>
          <p className="text-white/30 text-xs leading-relaxed mb-10">
            Please wait for a staff member to open the register, or come back later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white/10 text-white/80 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95 border border-white/10"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-white font-black text-2xl uppercase tracking-widest">
                RENDEZVOUS<span className="text-primary">.</span>
              </h1>
              <p className="text-white/40 text-xs tracking-widest uppercase mt-0.5">
                Our Menu
              </p>
            </div>
          </div>

          {/* Cart button */}
          <div className="flex items-center gap-3">
            <MenuAuthActions openAuth={() => setAuthOpen(true)} />
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-3 bg-primary text-background px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white active:scale-95 transition-all duration-200 shadow-lg shadow-primary/30"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <>
                  <span className="font-black">·</span>
                  <span>₱{cartTotal.toFixed(0)}</span>
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-background text-primary text-xs rounded-full flex items-center justify-center font-black border-2 border-primary">
                    {cartCount}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Menu type filter */}
        <div className="flex gap-3 mb-6">
          {(["all", "food", "drink"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedMenuType(type);
                setSelectedCategory("All");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all duration-200 ${selectedMenuType === type
                ? "bg-primary text-background border-primary shadow-lg shadow-primary/20"
                : "bg-transparent text-white/60 border-white/20 hover:border-white/40 hover:text-white"
                }`}
            >
              {type === "food" && <Utensils className="w-3.5 h-3.5" />}
              {type === "drink" && <Coffee className="w-3.5 h-3.5" />}
              {type === "all"
                ? "All Items"
                : type === "food"
                  ? "Food"
                  : "Drinks"}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categoryTabs.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all duration-200 shrink-0 ${selectedCategory === cat
                ? "bg-white/15 text-white border-white/30"
                : "bg-transparent text-white/40 border-white/10 hover:text-white/70 hover:border-white/20"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/5 animate-pulse h-64"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <div className="text-6xl mb-4">🍃</div>
            <p className="font-black uppercase tracking-widest text-sm">
              No items found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <MenuCard key={product._id} product={product} onAdd={addToCart} />
            ))}
          </div>
        )}
      </div>

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-white/10 flex flex-col shadow-2xl">
            <Cart
              items={cart}
              onUpdate={updateCart}
              onRemove={removeFromCart}
              onClose={() => setShowCart(false)}
              onCheckout={() => {
                setShowCart(false);
                setShowCheckout(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Desktop cart sidebar */}
      {showCart && (
        <div className="hidden lg:block fixed right-6 top-24 z-40 w-96">
          <div className="bg-background border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <Cart
              items={cart}
              onUpdate={updateCart}
              onRemove={removeFromCart}
              onClose={() => setShowCart(false)}
              onCheckout={() => {
                setShowCart(false);
                setShowCheckout(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {showCheckout && (
        <CheckoutModal
          items={cart}
          total={cartTotal}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleConfirmOrder}
          clearCart={() => {
            setCart([]);
            setShowCheckout(false);
            setShowCart(false);
          }}
          sessionData={sessionData}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </div>
  );
}
