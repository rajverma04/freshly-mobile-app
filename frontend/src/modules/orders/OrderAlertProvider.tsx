import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useApi } from "../../shared/api";
import type { Order, OrderStatus } from "../../shared/types";
import { colors } from "../../shared/theme";

type ToastAlert = {
  id: string;
  title: string;
  message: string;
  emoji: string;
  orderId?: string;
};

type OrderAlertContextType = {
  showAlert: (alert: {
    title: string;
    message: string;
    emoji?: string;
    orderId?: string;
  }) => void;
};

const OrderAlertContext = createContext<OrderAlertContextType | null>(null);

const STATUS_MESSAGES: Record<
  OrderStatus,
  { title: string; message: string; emoji: string } | null
> = {
  PLACED: null,
  CONFIRMED: {
    title: "Order Confirmed!",
    message: "The kitchen has received and accepted your order.",
    emoji: "🎉",
  },
  PREPARING: {
    title: "Kitchen is Cooking!",
    message: "Chefs are freshly preparing your delicious meal.",
    emoji: "🍳",
  },
  OUT_FOR_DELIVERY: {
    title: "Rider on the Way!",
    message: "Your Freshly rider is out for delivery. ETA ~15 mins.",
    emoji: "🛵",
  },
  DELIVERED: {
    title: "Order Delivered!",
    message: "Enjoy your food! Tap to view order and rate your meal.",
    emoji: "🍽️",
  },
  CANCELLED: {
    title: "Order Cancelled",
    message: "Your order has been cancelled.",
    emoji: "⚠️",
  },
};

export function OrderAlertProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const api = useApi();
  const [activeAlert, setActiveAlert] = useState<ToastAlert | null>(null);
  const knownStatusesRef = useRef<Record<string, OrderStatus>>({});
  const initialLoadRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback(
    ({
      title,
      message,
      emoji = "🔔",
      orderId,
    }: {
      title: string;
      message: string;
      emoji?: string;
      orderId?: string;
    }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const newAlert: ToastAlert = {
        id: `alert-${Date.now()}`,
        title,
        message,
        emoji,
        orderId,
      };
      setActiveAlert(newAlert);
      timerRef.current = setTimeout(() => {
        setActiveAlert(null);
      }, 7000);
    },
    [],
  );

  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (!isSignedIn) return;

    let active = true;

    async function checkOrders() {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const orders = await apiRef.current<Order[]>("/orders");
        if (!active || !Array.isArray(orders)) return;

        if (initialLoadRef.current) {
          // Record current status for initial state without spamming notifications
          for (const o of orders) {
            knownStatusesRef.current[o.id] = o.status;
          }
          initialLoadRef.current = false;
          return;
        }

        // Compare incoming statuses against known previous statuses
        for (const order of orders) {
          const prev = knownStatusesRef.current[order.id];
          if (prev && prev !== order.status) {
            const config = STATUS_MESSAGES[order.status];
            if (config) {
              showAlert({
                title: config.title,
                message: config.message,
                emoji: config.emoji,
                orderId: order.id,
              });
            }
          }
          knownStatusesRef.current[order.id] = order.status;
        }
      } catch {
        // Silent poll error
      } finally {
        isPollingRef.current = false;
      }
    }

    void checkOrders();
    const interval = setInterval(() => {
      void checkOrders();
    }, 15000);

    return () => {
      active = false;
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isSignedIn, showAlert]);

  return (
    <OrderAlertContext.Provider value={{ showAlert }}>
      {children}

      {/* Floating Animated In-App Status Alert */}
      {activeAlert && (
        <View
          style={{
            position: "absolute",
            top: 54,
            left: 16,
            right: 16,
            zIndex: 99999,
            backgroundColor: "#1F281F",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1.5,
            borderColor: colors.accent,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22 }}>{activeAlert.emoji}</Text>
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  color: colors.white,
                  fontWeight: "800",
                  fontSize: 15,
                }}
              >
                {activeAlert.title}
              </Text>
              <Text
                style={{
                  color: "#D0D8C8",
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {activeAlert.message}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 6,
                }}
              >
                <Pressable
                  onPress={() => {
                    setActiveAlert(null);
                    router.navigate("/orders");
                  }}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    View Order →
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveAlert(null)}
                  style={{ padding: 4 }}
                >
                  <Text style={{ color: "#95A295", fontSize: 12 }}>
                    Dismiss
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              accessibilityLabel="Close alert"
              onPress={() => setActiveAlert(null)}
              style={{
                padding: 4,
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#C0CAC0", fontSize: 13 }}>✕</Text>
            </Pressable>
          </View>
        </View>
      )}
    </OrderAlertContext.Provider>
  );
}

export function useOrderAlert() {
  const ctx = useContext(OrderAlertContext);
  if (!ctx) {
    throw new Error("useOrderAlert must be used within an OrderAlertProvider");
  }
  return ctx;
}

