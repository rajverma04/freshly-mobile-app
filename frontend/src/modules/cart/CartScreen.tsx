import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useCart } from "./CartProvider";
import { CartRow } from "./CartRow";
import { CheckoutForm } from "../checkout/CheckoutForm";
import { colors, money, ui } from "../../shared/theme";
import { Button } from "../../shared/components/Button";
import { State } from "../../shared/components/State";

const QUICK_PROMOS = [
  { code: "FRESH50", label: "FRESH50", desc: "₹50 off" },
  { code: "WELCOME20", label: "WELCOME20", desc: "20% off" },
  { code: "FREEDEL", label: "FREEDEL", desc: "Free delivery" },
];

export function CartScreen({
  onAccount,
  onComplete,
}: {
  onAccount: () => void;
  onComplete: () => void;
}) {
  const cart = useCart();
  const { isSignedIn } = useAuth();
  const [inputCode, setInputCode] = useState("");
  const [promoFeedback, setPromoFeedback] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  if (!cart.isHydrated) {
    return <State loading />;
  }

  function handleApply(codeToApply?: string) {
    const target = codeToApply || inputCode;
    const res = cart.applyPromo(target);
    setPromoFeedback({ message: res.message, isError: !res.success });
    if (res.success) {
      setInputCode("");
    }
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={ui.content}
    >
      <Text style={ui.title}>Your good-food bag.</Text>
      {cart.items.length ? (
        <>
          {cart.items.map((item) => (
            <CartRow
              key={item.food.id}
              item={item}
              change={(d) => cart.change(item.food.id, d)}
            />
          ))}

          {/* Promo Code & Discounts Card */}
          <View style={ui.card}>
            <Text style={[ui.heading, { fontSize: 16 }]}>Coupons & Offers</Text>

            {cart.promoCode ? (
              <View
                style={{
                  backgroundColor: "#EAF5EB",
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#78C08A",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ gap: 2 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>🎉</Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: "#1A7A40",
                      }}
                    >
                      {cart.promoCode} applied!
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.ink }}>
                    {cart.promoCode === "FREEDEL"
                      ? "Free delivery unlocked"
                      : `Saving ${money(cart.discount)} on your meal`}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    cart.removePromo();
                    setPromoFeedback(null);
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    backgroundColor: colors.white,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.line,
                  }}
                >
                  <Text
                    style={{
                      color: colors.muted,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    Remove ✕
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    style={[ui.input, { flex: 1 }]}
                    placeholder="Enter coupon code (e.g. FRESH50)"
                    value={inputCode}
                    onChangeText={(val) => {
                      setInputCode(val);
                      if (promoFeedback) setPromoFeedback(null);
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  <Button
                    title="Apply"
                    disabled={!inputCode.trim()}
                    onPress={() => handleApply()}
                  />
                </View>

                {/* Quick Promo Chips */}
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {QUICK_PROMOS.map((qp) => (
                    <Pressable
                      key={qp.code}
                      onPress={() => handleApply(qp.code)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 14,
                        backgroundColor: "#F2F5EC",
                        borderWidth: 1,
                        borderColor: colors.line,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>🏷️</Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: colors.ink,
                        }}
                      >
                        {qp.label}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        ({qp.desc})
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {!!promoFeedback && (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: promoFeedback.isError ? "#B63727" : "#1A7A40",
                  marginTop: 2,
                }}
              >
                {promoFeedback.message}
              </Text>
            )}
          </View>

          {/* Totals Summary Card */}
          <View style={ui.card}>
            <View style={ui.row}>
              <Text style={ui.text}>Subtotal</Text>
              <Text style={ui.text}>{money(cart.subtotal)}</Text>
            </View>

            {cart.discount > 0 && (
              <View style={ui.row}>
                <Text style={[ui.text, { color: "#1A7A40", fontWeight: "700" }]}>
                  Coupon Discount ({cart.promoCode})
                </Text>
                <Text style={[ui.text, { color: "#1A7A40", fontWeight: "700" }]}>
                  − {money(cart.discount)}
                </Text>
              </View>
            )}

            <View style={ui.row}>
              <Text style={ui.text}>Delivery Fee</Text>
              <Text
                style={[
                  ui.text,
                  cart.deliveryFee === 0
                    ? { color: "#1A7A40", fontWeight: "700" }
                    : {},
                ]}
              >
                {cart.deliveryFee === 0 ? "Free" : money(cart.deliveryFee)}
              </Text>
            </View>

            <View
              style={[
                ui.row,
                {
                  borderTopWidth: 1,
                  borderColor: colors.line,
                  paddingTop: 10,
                  marginTop: 4,
                },
              ]}
            >
              <Text style={ui.heading}>Total</Text>
              <Text style={[ui.heading, { color: colors.primary }]}>
                {money(cart.total)}
              </Text>
            </View>
          </View>

          {isSignedIn ? (
            <CheckoutForm onComplete={onComplete} />
          ) : (
            <Button title="Sign in to checkout" onPress={onAccount} />
          )}
        </>
      ) : (
        <Text style={ui.muted}>
          Your bag is empty. Find something delicious on the menu.
        </Text>
      )}
    </ScrollView>
  );
}
