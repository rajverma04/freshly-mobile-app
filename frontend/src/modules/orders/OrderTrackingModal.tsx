import { useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, money, ui } from "../../shared/theme";
import { Button } from "../../shared/components/Button";
import type { Order, OrderStatus } from "../../shared/types";
import { useApi } from "../../shared/api";
import { LiveTrackingMap } from "./LiveTrackingMap";

const STATUS_DETAILS: Record<
  OrderStatus,
  { label: string; desc: string; emoji: string; bg: string; text: string; step: number }
> = {
  PLACED: {
    label: "Order Placed",
    desc: "Your order has been sent to the kitchen.",
    emoji: "📝",
    bg: "#EAF0E6",
    text: "#246B45",
    step: 0,
  },
  CONFIRMED: {
    label: "Kitchen Confirmed",
    desc: "The kitchen accepted your ticket and assigned a chef.",
    emoji: "🍳",
    bg: "#E3EBF6",
    text: "#1B4D89",
    step: 1,
  },
  PREPARING: {
    label: "Cooking in Kitchen",
    desc: "Fresh ingredients are being prepared and sealed.",
    emoji: "👨‍🍳",
    bg: "#FFF3D6",
    text: "#B25E00",
    step: 2,
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    desc: "Your rider picked up your hot food and is on the road.",
    emoji: "🛵",
    bg: "#E2F4FA",
    text: "#0A6B88",
    step: 3,
  },
  DELIVERED: {
    label: "Delivered",
    desc: "Order delivered. Enjoy your meal!",
    emoji: "🍽️",
    bg: "#E2F5E9",
    text: "#1A7A40",
    step: 4,
  },
  CANCELLED: {
    label: "Cancelled",
    desc: "This order has been cancelled.",
    emoji: "⚠️",
    bg: "#FDE8E8",
    text: "#B63727",
    step: -1,
  },
};

const JOURNEY_STEPS = [
  { key: "PLACED", label: "Order Placed", sub: "Sent to kitchen" },
  { key: "CONFIRMED", label: "Confirmed", sub: "Order accepted" },
  { key: "PREPARING", label: "Cooking", sub: "Freshly prepared" },
  { key: "OUT_FOR_DELIVERY", label: "On the way", sub: "Rider dispatched" },
  { key: "DELIVERED", label: "Delivered", sub: "At your doorstep" },
];

export function OrderTrackingModal({
  order,
  onClose,
  onOrderUpdated,
}: {
  order: Order | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
}) {
  const api = useApi();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!order) return null;

  const currentStatus = order.status;
  const cfg = STATUS_DETAILS[currentStatus] || STATUS_DETAILS.PLACED;
  const isCancelled = currentStatus === "CANCELLED";
  const isDelivered = currentStatus === "DELIVERED";
  const canAdvance = !isCancelled && !isDelivered;

  async function handleAdvance() {
    if (!order) return;
    setBusy(true);
    setErrorMsg("");
    try {
      await api<Order>(`/orders/${order.id}/advance`, { method: "POST" });
      onOrderUpdated?.();
      onClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Could not advance order.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!order) return;
    setBusy(true);
    setErrorMsg("");
    try {
      await api<Order>(`/orders/${order.id}/cancel`, { method: "POST" });
      onOrderUpdated?.();
      onClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Could not cancel order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={!!order} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[ui.page, { flex: 1 }]}>
        {/* Top Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.white,
          }}
        >
          <Button secondary title="← Back to orders" onPress={onClose} />
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: colors.primary,
                letterSpacing: 1,
              }}
            >
              ORDER TRACKER
            </Text>
            <Text
              style={{ fontSize: 13, fontWeight: "700", color: colors.ink }}
            >
              #{order.id.slice(-8).toUpperCase()}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={[ui.content, { paddingBottom: 40 }]}>
          {/* Main Status Headline */}
          <View
            style={[
              ui.card,
              {
                backgroundColor: cfg.bg,
                borderColor: cfg.text,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              },
            ]}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.white,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 24 }}>{cfg.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: cfg.text,
                }}
              >
                {cfg.label}
              </Text>
              <Text style={{ fontSize: 13, color: colors.ink, marginTop: 2 }}>
                {cfg.desc}
              </Text>
            </View>
          </View>

          {/* Live GPS Route Map Tracker */}
          <View style={{ gap: 8 }}>
            <Text style={ui.heading}>Live Location & Road Route</Text>
            <LiveTrackingMap
              orderId={order.id}
              orderStatus={order.status}
              destinationAddress={order.address?.line}
            />
          </View>

          {/* 5-Stage Visual Progress Stepper */}
          {!isCancelled && (
            <View style={ui.card}>
              <Text style={[ui.heading, { fontSize: 16 }]}>
                Delivery Milestones
              </Text>

              <View style={{ marginTop: 8, gap: 14 }}>
                {JOURNEY_STEPS.map((s, idx) => {
                  const isDone = cfg.step >= idx;
                  const isCurrent = cfg.step === idx;
                  return (
                    <View
                      key={s.key}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: isDone
                            ? colors.primary
                            : colors.line,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: isCurrent ? 2 : 0,
                          borderColor: colors.accent,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.white,
                            fontSize: 12,
                            fontWeight: "800",
                          }}
                        >
                          {isDone ? "✓" : idx + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: isCurrent ? "800" : "600",
                            color: isDone ? colors.ink : colors.muted,
                          }}
                        >
                          {s.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.muted }}>
                          {s.sub}
                        </Text>
                      </View>
                      {isCurrent && (
                        <View
                          style={{
                            backgroundColor: "#E2F5E9",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "800",
                              color: "#1A7A40",
                            }}
                          >
                            IN PROGRESS
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Delivery Address & Order Info Card */}
          <View style={ui.card}>
            <Text style={[ui.heading, { fontSize: 16 }]}>Delivery Details</Text>

            {order.address && (
              <View style={{ gap: 4, paddingVertical: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>
                  Deliver to: {order.address.name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.ink }}>
                  {order.address.line}, {order.address.city} - {order.address.postalCode}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  Contact: {order.address.phone}
                </Text>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700", marginTop: 4 }}>
                  Payment: {order.address.paymentMethod === "ONLINE" ? "Instant Online (Paid)" : "Cash on Delivery (Pending)"}
                </Text>
              </View>
            )}

            {/* Items summary */}
            <View
              style={{
                borderTopWidth: 1,
                borderColor: colors.line,
                paddingTop: 10,
                marginTop: 6,
                gap: 6,
              }}
            >
              {order.items.map((item) => (
                <View key={item.id} style={ui.row}>
                  <Text style={{ fontSize: 13, color: colors.ink }}>
                    {item.quantity}× {item.name}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.ink }}>
                    {money(item.unitPrice * item.quantity)}
                  </Text>
                </View>
              ))}

              <View
                style={[
                  ui.row,
                  {
                    borderTopWidth: 1,
                    borderColor: colors.line,
                    paddingTop: 8,
                    marginTop: 4,
                  },
                ]}
              >
                <Text style={ui.heading}>Total</Text>
                <Text style={[ui.heading, { color: colors.primary }]}>
                  {money(order.total)}
                </Text>
              </View>
            </View>
          </View>

          {!!errorMsg && <Text style={ui.error}>{errorMsg}</Text>}

          {/* Interactive Action & Demo Buttons */}
          <View style={{ gap: 10, marginTop: 4 }}>
            {canAdvance && (
              <Button
                title={busy ? "Updating…" : "Simulate Next Stage (Demo) ➔"}
                disabled={busy}
                onPress={() => void handleAdvance()}
              />
            )}

            {["PLACED", "CONFIRMED"].includes(currentStatus) && (
              <Button
                secondary
                title={busy ? "Cancelling…" : "Cancel this order"}
                disabled={busy}
                onPress={() => void handleCancel()}
              />
            )}

            <Button
              secondary
              title="Close Tracker"
              onPress={onClose}
              disabled={busy}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
