import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Food } from "../../shared/types";
import { getStorageItem, removeStorageItem, setStorageItem } from "../../shared/storage";

const CART_STORAGE_KEY = "freshly_cart_items";

type Cart = {
  items: CartItem[];
  add: (food: Food) => void;
  change: (id: string, delta: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
  isHydrated: boolean;
  promoCode: string | null;
  discount: number;
  deliveryFee: number;
  total: number;
  applyPromo: (code: string) => { success: boolean; message: string };
  removePromo: () => void;
};

const Context = createContext<Cart | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void getStorageItem(CART_STORAGE_KEY).then((raw) => {
      if (!active) return;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } catch (e) {
          console.warn("Failed to parse persisted cart:", e);
        }
      }
      hydratedRef.current = true;
      setIsHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (items.length === 0) {
      void removeStorageItem(CART_STORAGE_KEY);
    } else {
      void setStorageItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const add = (food: Food) =>
    setItems((current) => {
      const found = current.find((i) => i.food.id === food.id);
      return found
        ? current.map((i) =>
            i.food.id === food.id
              ? { ...i, quantity: Math.min(20, i.quantity + 1) }
              : i,
          )
        : [...current, { food, quantity: 1 }];
    });

  const change = (id: string, delta: number) =>
    setItems((current) =>
      current
        .map((i) =>
          i.food.id === id
            ? { ...i, quantity: Math.min(20, i.quantity + delta) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );

  const clear = () => {
    setItems([]);
    setPromoCode(null);
    void removeStorageItem(CART_STORAGE_KEY);
  };

  const subtotal = items.reduce((s, i) => s + i.food.price * i.quantity, 0);

  let discount = 0;
  if (promoCode === "FRESH50") {
    discount = subtotal >= 20000 ? Math.min(subtotal, 5000) : 0;
  } else if (promoCode === "WELCOME20") {
    discount = Math.min(10000, Math.round(subtotal * 0.2));
  }

  const standardDeliveryFee = subtotal >= 50000 ? 0 : 3900;
  const deliveryFee = promoCode === "FREEDEL" ? 0 : standardDeliveryFee;
  const total = Math.max(0, subtotal - discount + deliveryFee);

  function applyPromo(code: string): { success: boolean; message: string } {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: "Please enter a coupon code." };
    }
    if (clean === "FRESH50") {
      if (subtotal < 20000) {
        return {
          success: false,
          message: "FRESH50 requires a minimum order of ₹200.",
        };
      }
      setPromoCode("FRESH50");
      return { success: true, message: "FRESH50 applied! Flat ₹50 saved." };
    }
    if (clean === "WELCOME20") {
      setPromoCode("WELCOME20");
      return {
        success: true,
        message: "WELCOME20 applied! 20% discount added.",
      };
    }
    if (clean === "FREEDEL") {
      setPromoCode("FREEDEL");
      return {
        success: true,
        message: "FREEDEL applied! Free delivery unlocked.",
      };
    }
    return {
      success: false,
      message: "Invalid code. Try FRESH50, WELCOME20, or FREEDEL.",
    };
  }

  function removePromo() {
    setPromoCode(null);
  }

  return (
    <Context.Provider
      value={{
        items,
        add,
        change,
        clear,
        subtotal,
        count: items.reduce((s, i) => s + i.quantity, 0),
        isHydrated,
        promoCode,
        discount,
        deliveryFee,
        total,
        applyPromo,
        removePromo,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useCart() {
  const c = useContext(Context);
  if (!c) throw new Error("Cart provider missing");
  return c;
}
