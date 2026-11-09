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
};

const Context = createContext<Cart | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
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
    void removeStorageItem(CART_STORAGE_KEY);
  };

  return (
    <Context.Provider
      value={{
        items,
        add,
        change,
        clear,
        subtotal: items.reduce((s, i) => s + i.food.price * i.quantity, 0),
        count: items.reduce((s, i) => s + i.quantity, 0),
        isHydrated,
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
