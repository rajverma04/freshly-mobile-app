import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { randomUUID } from "expo-crypto";
import { Field } from "../../shared/components/Field";
import { Button } from "../../shared/components/Button";
import { colors, ui, money } from "../../shared/theme";
import { useApi } from "../../shared/api";
import { useCart } from "../cart/CartProvider";
import { getStorageItem, setStorageItem } from "../../shared/storage";
import type { Address, Order, SavedAddress } from "../../shared/types";
import { OrderSuccessModal } from "./OrderSuccessModal";
import { PaymentModal } from "./PaymentModal";

const MULTI_ADDRESSES_STORAGE_KEY = "freshly_saved_addresses_multi";
const LEGACY_ADDRESS_STORAGE_KEY = "freshly_saved_address";

export function CheckoutForm({ onComplete }: { onComplete: () => void }) {
  const cart = useCart();
  const api = useApi();
  const [address, setAddress] = useState<Address>({
    name: "",
    phone: "",
    line: "",
    city: "",
    postalCode: "",
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveDefault, setSaveDefault] = useState(true);
  const [addressLabel, setAddressLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [paymentMode, setPaymentMode] = useState<"COD" | "ONLINE">("COD");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const lock = useRef(false);
  const attempt = useRef<{ body: string; key: string } | undefined>(undefined);

  const deliveryFee = cart.subtotal >= 50000 ? 0 : 3900;
  const totalAmount = cart.subtotal + deliveryFee;

  useEffect(() => {
    let active = true;
    void (async () => {
      // 1. Try multi-address storage
      const multi = await getStorageItem(MULTI_ADDRESSES_STORAGE_KEY);
      if (!active) return;
      if (multi) {
        try {
          const parsed: SavedAddress[] = JSON.parse(multi);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedAddresses(parsed);
            setSelectedAddressId(parsed[0].id);
            setAddress({
              name: parsed[0].name,
              phone: parsed[0].phone,
              line: parsed[0].line,
              city: parsed[0].city,
              postalCode: parsed[0].postalCode,
            });
            return;
          }
        } catch {}
      }

      // 2. Fallback to legacy single address
      const single = await getStorageItem(LEGACY_ADDRESS_STORAGE_KEY);
      if (!active) return;
      if (single) {
        try {
          const parsed = JSON.parse(single);
          if (parsed && typeof parsed === "object" && parsed.name) {
            const initial: SavedAddress = {
              id: "saved-1",
              label: "Home",
              name: parsed.name,
              phone: parsed.phone,
              line: parsed.line,
              city: parsed.city,
              postalCode: parsed.postalCode,
            };
            setSavedAddresses([initial]);
            setSelectedAddressId(initial.id);
            setAddress(parsed);
          }
        } catch {}
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  function handleSelectSaved(saved: SavedAddress) {
    setSelectedAddressId(saved.id);
    setAddress({
      name: saved.name,
      phone: saved.phone,
      line: saved.line,
      city: saved.city,
      postalCode: saved.postalCode,
    });
  }

  function handleSelectCustom() {
    setSelectedAddressId(null);
    setAddress({
      name: "",
      phone: "",
      line: "",
      city: "",
      postalCode: "",
    });
  }

  function validateAddress(): Address {
    const clean = Object.fromEntries(
      Object.entries(address).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]),
    ) as Address;

    if (
      clean.name.length < 2 ||
      !/^\+?[0-9]{10,15}$/.test(clean.phone) ||
      clean.line.length < 8 ||
      clean.city.length < 2 ||
      !/^\d{6}$/.test(clean.postalCode)
    ) {
      throw new Error(
        "Enter a name, valid phone, full address, city and six-digit PIN code.",
      );
    }
    return clean;
  }

  async function handleOrderSubmit() {
    setError("");
    try {
      validateAddress();
      if (paymentMode === "ONLINE") {
        setShowPaymentModal(true);
      } else {
        await placeOrder(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please check your delivery address.");
    }
  }

  async function placeOrder(isOnlinePaid: boolean) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const clean = validateAddress();
      clean.paymentMethod = isOnlinePaid ? "ONLINE" : "COD";
      clean.paymentStatus = isOnlinePaid ? "PAID" : "PENDING";

      const payload = {
        address: clean,
        items: cart.items.map((i) => ({
          foodId: i.food.id,
          quantity: i.quantity,
        })),
      };
      const body = JSON.stringify(payload);
      if (attempt.current?.body !== body)
        attempt.current = { body, key: randomUUID() };

      const order = await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          idempotencyKey: attempt.current.key,
        }),
      });

      if (saveDefault) {
        const newSaved: SavedAddress = {
          ...clean,
          id: selectedAddressId || `addr-${Date.now()}`,
          label: addressLabel,
        };
        const updatedList = [
          ...savedAddresses.filter((a) => a.id !== newSaved.id),
          newSaved,
        ];
        void setStorageItem(
          MULTI_ADDRESSES_STORAGE_KEY,
          JSON.stringify(updatedList),
        );
        void setStorageItem(LEGACY_ADDRESS_STORAGE_KEY, JSON.stringify(clean));
      }

      cart.clear();
      setShowPaymentModal(false);
      setCreatedOrder(order);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not place order. Retry with the same details.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <View style={{ gap: 14 }}>
        <Text style={ui.heading}>Deliver to</Text>

        {/* Saved Address Quick Chips */}
        {savedAddresses.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={ui.muted}>Choose from saved locations:</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {savedAddresses.map((sa) => {
                const isSelected = selectedAddressId === sa.id;
                return (
                  <Pressable
                    key={sa.id}
                    onPress={() => handleSelectSaved(sa)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.white,
                      borderWidth: 1,
                      borderColor: isSelected
                        ? colors.primary
                        : colors.line,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isSelected ? colors.white : colors.ink,
                      }}
                    >
                      {sa.label === "Home"
                        ? "🏠 Home"
                        : sa.label === "Work"
                          ? "💼 Work"
                          : "📍 " + sa.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={handleSelectCustom}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor:
                    selectedAddressId === null ? colors.ink : colors.white,
                  borderWidth: 1,
                  borderColor: colors.line,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color:
                      selectedAddressId === null ? colors.white : colors.ink,
                  }}
                >
                  ＋ Different Address
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {(
          [
            ["name", "Full name"],
            ["phone", "Phone number"],
            ["line", "House, street and locality"],
            ["city", "City"],
            ["postalCode", "PIN code"],
          ] as const
        ).map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={address[key] || ""}
            editable={!busy}
            onChangeText={(value) => {
              setAddress((a) => ({ ...a, [key]: value }));
              if (selectedAddressId) setSelectedAddressId(null);
            }}
            keyboardType={
              key === "phone"
                ? "phone-pad"
                : key === "postalCode"
                  ? "number-pad"
                  : "default"
            }
          />
        ))}

        {/* Address Label Selector if saving */}
        <View style={{ gap: 8 }}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: saveDefault }}
            disabled={busy}
            onPress={() => setSaveDefault((v) => !v)}
            style={[
              ui.row,
              { justifyContent: "flex-start", gap: 10, marginTop: 2 },
            ]}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: colors.primary,
                backgroundColor: saveDefault
                  ? colors.primary
                  : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {saveDefault && (
                <Text
                  style={{
                    color: colors.white,
                    fontSize: 13,
                    fontWeight: "800",
                  }}
                >
                  ✓
                </Text>
              )}
            </View>
            <Text style={ui.text}>Save this address for future orders</Text>
          </Pressable>

          {saveDefault && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingLeft: 32,
              }}
            >
              <Text style={ui.muted}>Save as:</Text>
              {(["Home", "Work", "Other"] as const).map((lbl) => (
                <Pressable
                  key={lbl}
                  onPress={() => setAddressLabel(lbl)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor:
                      addressLabel === lbl ? colors.primary : "#EAF0E6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color:
                        addressLabel === lbl ? colors.white : colors.primary,
                    }}
                  >
                    {lbl}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Payment Method Selector */}
        <View style={{ gap: 8, marginTop: 6 }}>
          <Text style={ui.heading}>Payment Method</Text>
          <View style={{ gap: 10 }}>
            {/* Option A: Cash on delivery */}
            <Pressable
              onPress={() => setPaymentMode("COD")}
              style={[
                ui.card,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderColor: paymentMode === "COD" ? colors.primary : colors.line,
                  borderWidth: paymentMode === "COD" ? 2 : 1,
                  backgroundColor: paymentMode === "COD" ? "#F2F5EC" : colors.white,
                },
              ]}
            >
              <View style={{ gap: 2, flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 15, color: colors.ink }}>
                  💵 Cash on Delivery (COD)
                </Text>
                <Text style={ui.muted}>
                  Pay cash to the delivery partner when your food arrives
                </Text>
              </View>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: paymentMode === "COD" ? colors.primary : colors.line,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {paymentMode === "COD" && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.primary,
                    }}
                  />
                )}
              </View>
            </Pressable>

            {/* Option B: Online Payment */}
            <Pressable
              onPress={() => setPaymentMode("ONLINE")}
              style={[
                ui.card,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderColor: paymentMode === "ONLINE" ? colors.primary : colors.line,
                  borderWidth: paymentMode === "ONLINE" ? 2 : 1,
                  backgroundColor: paymentMode === "ONLINE" ? "#F2F5EC" : colors.white,
                },
              ]}
            >
              <View style={{ gap: 2, flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontWeight: "700", fontSize: 15, color: colors.ink }}>
                    ⚡ Instant Online Payment
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: colors.white, fontSize: 10, fontWeight: "800" }}>
                      UPI / CARDS
                    </Text>
                  </View>
                </View>
                <Text style={ui.muted}>
                  Pay instantly via UPI (GPay, PhonePe, Paytm), Cards or NetBanking
                </Text>
              </View>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: paymentMode === "ONLINE" ? colors.primary : colors.line,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {paymentMode === "ONLINE" && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: colors.primary,
                    }}
                  />
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {!!error && <Text style={ui.error}>{error}</Text>}

        <Button
          title={
            busy
              ? "Placing order…"
              : paymentMode === "ONLINE"
                ? `Proceed to Pay ${money(totalAmount)} ➔`
                : `Place Order · Cash on delivery (${money(totalAmount)})`
          }
          disabled={busy}
          onPress={handleOrderSubmit}
        />
      </View>

      {/* Online Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        amount={totalAmount}
        onSuccess={() => void placeOrder(true)}
        onClose={() => setShowPaymentModal(false)}
      />

      {/* Post-Order Celebration Modal */}
      <OrderSuccessModal
        order={createdOrder}
        onTrack={() => {
          setCreatedOrder(null);
          onComplete();
        }}
        onClose={() => {
          setCreatedOrder(null);
          onComplete();
        }}
      />
    </>
  );
}
