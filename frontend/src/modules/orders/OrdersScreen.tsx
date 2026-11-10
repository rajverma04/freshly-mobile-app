import { useState } from "react";
import { ScrollView, Text, View, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { useResource } from "../../shared/useResource";
import { useApi } from "../../shared/api";
import { useCart } from "../cart/CartProvider";
import type { Order, OrderStatus } from "../../shared/types";
import { ui, money, colors } from "../../shared/theme";
import { State } from "../../shared/components/State";
import { Button } from "../../shared/components/Button";
import { LiveTrackingMap } from "./LiveTrackingMap";
import { OrderTrackingModal } from "./OrderTrackingModal";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; step: number }
> = {
  PLACED: { label: "Order Placed", bg: "#EAF0E6", text: "#246B45", step: 0 },
  CONFIRMED: { label: "Confirmed", bg: "#E3EBF6", text: "#1B4D89", step: 1 },
  PREPARING: { label: "Preparing in Kitchen", bg: "#FFF3D6", text: "#B25E00", step: 2 },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", bg: "#E2F4FA", text: "#0A6B88", step: 3 },
  DELIVERED: { label: "Delivered", bg: "#E2F5E9", text: "#1A7A40", step: 4 },
  CANCELLED: { label: "Cancelled", bg: "#FDE8E8", text: "#B63727", step: -1 },
};

const STEPS = ["Placed", "Confirmed", "Preparing", "On the way", "Delivered"];

export function OrdersScreen() {
  const { data, loading, error, reload } = useResource<Order[]>("/orders");
  const api = useApi();
  const cart = useCart();
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [toast, setToast] = useState("");
  const [ratedOrders, setRatedOrders] = useState<Record<string, number>>({});
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  async function handleCancel(orderId: string) {
    setActingId(orderId);
    setActionError("");
    try {
      await api<Order>(`/orders/${orderId}/cancel`, { method: "POST" });
      reload();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not cancel order.");
    } finally {
      setActingId(null);
    }
  }

  function handleReorder(order: Order) {
    for (const item of order.items) {
      for (let q = 0; q < item.quantity; q++) {
        cart.add({
          id: item.id,
          name: item.name,
          description: "Freshly prepared",
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
          category: "Re-ordered",
          price: item.unitPrice,
          vegetarian: false,
        });
      }
    }
    setToast("Added dishes to bag! Opening bag…");
    setTimeout(() => {
      setToast("");
      router.navigate("/bag");
    }, 800);
  }

  function handleRate(orderId: string, stars: number) {
    setRatedOrders((prev) => ({ ...prev, [orderId]: stars }));
    setToast(`Thank you! Rated ${stars} stars ⭐`);
    setTimeout(() => setToast(""), 2000);
  }

  return (
    <ScrollView
      contentContainerStyle={ui.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={reload} />
      }
    >
      <Text style={ui.title}>Your orders.</Text>
      <Text style={ui.muted}>Pull down to refresh your latest orders.</Text>

      {!!toast && (
        <View
          style={{
            backgroundColor: "#E2F5E9",
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.primary,
          }}
        >
          <Text style={{ color: "#1A7A40", fontWeight: "700" }}>{toast}</Text>
        </View>
      )}

      {!!actionError && <Text style={ui.error}>{actionError}</Text>}

      {loading || error ? (
        <State loading={loading} error={error} retry={reload} />
      ) : data?.length ? (
        data.map((order) => {
          const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PLACED;
          const isCancelled = order.status === "CANCELLED";
          const isDelivered = order.status === "DELIVERED";
          const isOutForDelivery = order.status === "OUT_FOR_DELIVERY";
          const canCancel = ["PLACED", "CONFIRMED"].includes(order.status);
          const isBusy = actingId === order.id;
          const isOnlinePaid = order.address?.paymentMethod === "ONLINE";

          return (
            <View key={order.id} style={ui.card}>
              <View style={ui.row}>
                <View
                  style={{
                    backgroundColor: cfg.bg,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 14,
                  }}
                >
                  <Text
                    style={{
                      color: cfg.text,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {cfg.label}
                  </Text>
                </View>
                <Text style={ui.heading}>{money(order.total)}</Text>
              </View>

              {!isCancelled && (
                <View style={{ marginVertical: 8, gap: 6 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {STEPS.map((label, idx) => {
                      const isComplete = cfg.step >= idx;
                      const isCurrent = cfg.step === idx;
                      return (
                        <View
                          key={label}
                          style={{
                            flex: 1,
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <View
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: isComplete
                                ? colors.primary
                                : colors.line,
                              borderWidth: isCurrent ? 2 : 0,
                              borderColor: colors.accent,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {isComplete && (
                              <Text
                                style={{
                                  color: colors.white,
                                  fontSize: 10,
                                  fontWeight: "800",
                                }}
                              >
                                ✓
                              </Text>
                            )}
                          </View>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: isCurrent ? "700" : "500",
                              color: isComplete ? colors.ink : colors.muted,
                              textAlign: "center",
                            }}
                            numberOfLines={1}
                          >
                            {label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Live Driver Tracking Card when out for delivery */}
              {isOutForDelivery && (
                <LiveTrackingMap
                  orderId={order.id}
                  orderStatus={order.status}
                  destinationAddress={order.address?.line}
                />
              )}

              <Text style={ui.muted}>
                {new Date(order.createdAt).toLocaleString()} · #
                {order.id.slice(-8)}
              </Text>

              {order.address && (
                <Text style={[ui.muted, { fontSize: 13 }]}>
                  Deliver to: {order.address.name} ({order.address.city})
                </Text>
              )}

              <View
                style={{
                  borderTopWidth: 1,
                  borderColor: colors.line,
                  paddingTop: 8,
                  gap: 4,
                }}
              >
                {order.items.map((item) => (
                  <View key={item.id} style={ui.row}>
                    <Text style={ui.text}>
                      {item.quantity} × {item.name}
                    </Text>
                    <Text style={ui.muted}>
                      {money(item.unitPrice * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={ui.muted}>
                Payment:{" "}
                {isOnlinePaid
                  ? "Paid Online (Instant UPI / Card) ✓"
                  : "Cash on delivery"}
              </Text>

              {/* Post-Delivery Rating */}
              {isDelivered && (
                <View
                  style={{
                    backgroundColor: ratedOrders[order.id]
                      ? "#E2F5E9"
                      : "#F8FAF4",
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: ratedOrders[order.id]
                      ? "#1A7A40"
                      : colors.line,
                  }}
                >
                  {ratedOrders[order.id] ? (
                    <Text
                      style={{
                        color: "#1A7A40",
                        fontWeight: "700",
                        fontSize: 13,
                      }}
                    >
                      ✓ Rated {ratedOrders[order.id]} Stars! Thank you for the
                      review.
                    </Text>
                  ) : (
                    <View style={ui.row}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: colors.ink,
                        }}
                      >
                        Rate your meal:
                      </Text>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Pressable
                            key={star}
                            onPress={() => handleRate(order.id, star)}
                            style={{ padding: 2 }}
                          >
                            <Text style={{ fontSize: 18 }}>⭐</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={{ gap: 8, marginTop: 4 }}>
                {!isCancelled && (
                  <Button
                    title={
                      isOutForDelivery
                        ? "📍 Track Live Rider on Map ➔"
                        : "📍 View Order Tracking & Route"
                    }
                    onPress={() => setTrackingOrder(order)}
                  />
                )}

                {canCancel && (
                  <Button
                    secondary
                    title={isBusy ? "Cancelling…" : "Cancel order"}
                    disabled={isBusy}
                    onPress={() => void handleCancel(order.id)}
                  />
                )}

                {/* Re-order Button */}
                <Button
                  secondary
                  title="Order these items again ↻"
                  onPress={() => handleReorder(order)}
                />
              </View>
            </View>
          );
        })
      ) : (
        <State empty="No orders yet. Your next meal is a few taps away." />
      )}

      {/* Dedicated Order Tracking Modal */}
      <OrderTrackingModal
        order={trackingOrder}
        onClose={() => setTrackingOrder(null)}
        onOrderUpdated={reload}
      />
    </ScrollView>
  );
}
