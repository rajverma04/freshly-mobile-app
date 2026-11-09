import { Modal, Text, View } from "react-native";
import { colors, money, ui } from "../../shared/theme";
import { Button } from "../../shared/components/Button";
import type { Order } from "../../shared/types";

export function OrderSuccessModal({
  order,
  onTrack,
  onClose,
}: {
  order: Order | null;
  onTrack: () => void;
  onClose: () => void;
}) {
  if (!order) return null;

  return (
    <Modal visible={!!order} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.65)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: 24,
            padding: 26,
            width: "100%",
            maxWidth: 380,
            gap: 16,
            alignItems: "center",
          }}
        >
          {/* Animated Celebration Icon */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "#E2F5E9",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 36 }}>🎉</Text>
          </View>

          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={[ui.title, { fontSize: 24, textAlign: "center" }]}>
              Order Placed!
            </Text>
            <Text style={[ui.muted, { textAlign: "center", fontSize: 14 }]}>
              Your food is being freshly prepared by the kitchen.
            </Text>
          </View>

          {/* Delivery ETA Card */}
          <View
            style={{
              backgroundColor: "#F2F5EC",
              padding: 14,
              borderRadius: 14,
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 26 }}>🛵</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: colors.ink, fontSize: 14 }}>
                Estimated Delivery: 30–35 mins
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Cash on delivery · Keep {money(order.total)} ready
              </Text>
            </View>
          </View>

          {/* Order Details Snippet */}
          <View
            style={{
              width: "100%",
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.line,
              paddingVertical: 10,
              gap: 6,
            }}
          >
            <View style={ui.row}>
              <Text style={ui.muted}>Order Reference</Text>
              <Text style={{ fontWeight: "700", color: colors.ink }}>
                #{order.id.slice(-8).toUpperCase()}
              </Text>
            </View>
            <View style={ui.row}>
              <Text style={ui.muted}>Items Ordered</Text>
              <Text style={{ fontWeight: "600", color: colors.ink }}>
                {order.items.reduce((s, i) => s + i.quantity, 0)} items
              </Text>
            </View>
            <View style={ui.row}>
              <Text style={ui.muted}>Total Amount</Text>
              <Text style={[ui.heading, { fontSize: 18, color: colors.primary }]}>
                {money(order.total)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ width: "100%", gap: 10 }}>
            <Button title="Track live order status ➔" onPress={onTrack} />
            <Button secondary title="Back to menu" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

