import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, money, ui } from "../../shared/theme";
import { Button } from "../../shared/components/Button";

export function PaymentModal({
  visible,
  amount,
  onSuccess,
  onClose,
}: {
  visible: boolean;
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [upiId, setUpiId] = useState("freshly.customer@okaxis");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8892");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");
  const [stage, setStage] = useState<"IDLE" | "PROCESSING" | "SUCCESS">("IDLE");

  function handlePay() {
    setStage("PROCESSING");
    setTimeout(() => {
      setStage("SUCCESS");
      setTimeout(() => {
        setStage("IDLE");
        onSuccess();
      }, 900);
    }, 1300);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.65)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            gap: 16,
            maxHeight: "85%",
          }}
        >
          {stage === "PROCESSING" ? (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 16 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[ui.heading, { fontSize: 18 }]}>
                Connecting to payment gateway…
              </Text>
              <Text style={ui.muted}>
                Secured by 256-bit bank encryption. Do not refresh.
              </Text>
            </View>
          ) : stage === "SUCCESS" ? (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#E2F5E9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 32 }}>✓</Text>
              </View>
              <Text style={[ui.title, { fontSize: 22, color: "#1A7A40" }]}>
                Payment Successful!
              </Text>
              <Text style={ui.muted}>
                Paid {money(amount)} securely via {method}.
              </Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={ui.row}>
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: colors.primary,
                      letterSpacing: 1,
                    }}
                  >
                    SECURE INSTANT CHECKOUT
                  </Text>
                  <Text style={[ui.heading, { fontSize: 20 }]}>
                    Pay {money(amount)}
                  </Text>
                </View>
                <Button secondary title="✕ Cancel" onPress={onClose} />
              </View>

              {/* Payment Method Selector Tabs */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#F0F2EB",
                  borderRadius: 14,
                  padding: 4,
                  gap: 4,
                }}
              >
                {(
                  [
                    ["UPI", "⚡ UPI Apps"],
                    ["CARD", "💳 Cards"],
                    ["NETBANKING", "🏦 NetBanking"],
                  ] as const
                ).map(([m, label]) => (
                  <Pressable
                    key={m}
                    onPress={() => setMethod(m)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      alignItems: "center",
                      borderRadius: 10,
                      backgroundColor:
                        method === m ? colors.primary : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: method === m ? colors.white : colors.ink,
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Tab 1: UPI */}
              {method === "UPI" && (
                <View style={{ gap: 12 }}>
                  <Text style={ui.muted}>
                    Fastest way to pay. Enter any UPI ID (GPay, PhonePe, Paytm):
                  </Text>
                  <TextInput
                    style={ui.input}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="mobile@upi"
                  />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {["@okaxis", "@paytm", "@ibl", "@ybl"].map((handle) => (
                      <Pressable
                        key={handle}
                        onPress={() => setUpiId(`customer${handle}`)}
                        style={{
                          backgroundColor: "#F2F4EC",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "600" }}>
                          {handle}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Tab 2: Credit / Debit Card */}
              {method === "CARD" && (
                <View style={{ gap: 12 }}>
                  <Text style={ui.muted}>
                    Enter card number or use simulated card:
                  </Text>
                  <TextInput
                    style={ui.input}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="Card Number"
                  />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      style={[ui.input, { flex: 1 }]}
                      placeholder="MM/YY"
                      defaultValue="12/28"
                    />
                    <TextInput
                      style={[ui.input, { flex: 1 }]}
                      placeholder="CVV"
                      secureTextEntry
                      defaultValue="782"
                    />
                  </View>
                </View>
              )}

              {/* Tab 3: Net Banking */}
              {method === "NETBANKING" && (
                <View style={{ gap: 10 }}>
                  <Text style={ui.muted}>Select your bank:</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak"].map((bank) => (
                      <Pressable
                        key={bank}
                        onPress={() => setSelectedBank(bank)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 12,
                          backgroundColor:
                            selectedBank === bank ? colors.primary : "#F2F4EC",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color:
                              selectedBank === bank
                                ? colors.white
                                : colors.ink,
                          }}
                        >
                          {bank}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Pay Button */}
              <Button
                title={`Pay ${money(amount)} Now`}
                onPress={handlePay}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

