import { useState } from "react";
import { Modal, ScrollView, Image, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Food } from "../../shared/types";
import { ui, money, colors } from "../../shared/theme";
import { Button } from "../../shared/components/Button";
import { useFavorites } from "./FavoritesProvider";

export function FoodDetail({
  food,
  onClose,
  onAdd,
}: {
  food: Food | null;
  onClose: () => void;
  onAdd: (f: Food) => void;
}) {
  const [qty, setQty] = useState(1);
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = food ? isFavorite(food.id) : false;

  function handleAdd() {
    if (!food) return;
    for (let i = 0; i < qty; i++) {
      onAdd(food);
    }
    setQty(1);
    onClose();
  }

  const isOutOfStock = food?.available === false;

  return (
    <Modal visible={!!food} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={ui.page}>
        <ScrollView contentContainerStyle={ui.content}>
          <View style={ui.row}>
            <Button title="← Back to menu" secondary onPress={onClose} />
            {food && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={fav ? "Remove from favorites" : "Save to favorites"}
                onPress={() => void toggleFavorite(food.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: fav ? "#FDE8E8" : "#F2F5EC",
                  borderWidth: 1,
                  borderColor: fav ? "#E57373" : colors.line,
                }}
              >
                <Text style={{ fontSize: 13 }}>{fav ? "❤️" : "🤍"}</Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: fav ? "#B63727" : colors.ink,
                  }}
                >
                  {fav ? "Saved" : "Save"}
                </Text>
              </Pressable>
            )}
          </View>

          {food && (
            <>
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: food.image }}
                  style={{
                    height: 280,
                    borderRadius: 20,
                    backgroundColor: colors.accent,
                  }}
                />

                {isOutOfStock && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#B63727",
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.white,
                          fontWeight: "800",
                          fontSize: 14,
                        }}
                      >
                        CURRENTLY OUT OF STOCK
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={ui.row}>
                <View style={{ flex: 1 }}>
                  <Text style={ui.title}>{food.name}</Text>
                  <Text style={ui.muted}>
                    {food.category} ·{" "}
                    {food.vegetarian ? "100% Vegetarian 🟢" : "Non-vegetarian 🔴"}
                  </Text>
                </View>
                <Text style={[ui.heading, { fontSize: 24, color: colors.primary }]}>
                  {money(food.price)}
                </Text>
              </View>

              {/* Highlights & Tags */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#F2F5EC",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.ink }}>
                    ★ 4.8 (120+ ratings)
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "#F2F5EC",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.ink }}>
                    ⏱ 20–25 mins prep
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "#F2F5EC",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.ink }}>
                    🔥 ~380 kcal
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "#F2F5EC",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.ink }}>
                    🍲 Serves 1–2
                  </Text>
                </View>
              </View>

              <View style={ui.card}>
                <Text style={[ui.heading, { fontSize: 16 }]}>About this dish</Text>
                <Text style={[ui.text, { lineHeight: 24 }]}>{food.description}</Text>
                <Text style={ui.muted}>
                  Freshly made from authentic ingredients upon order. Sealed in
                  eco-friendly, food-grade packaging.
                </Text>
              </View>

              {!isOutOfStock && (
                <View
                  style={[
                    ui.card,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                  ]}
                >
                  <Text style={[ui.heading, { fontSize: 16 }]}>Quantity</Text>
                  <View style={ui.row}>
                    <Button
                      secondary
                      title="−"
                      disabled={qty <= 1}
                      onPress={() => setQty((q) => Math.max(1, q - 1))}
                    />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        paddingHorizontal: 8,
                        color: colors.ink,
                      }}
                    >
                      {qty}
                    </Text>
                    <Button
                      secondary
                      title="+"
                      disabled={qty >= 10}
                      onPress={() => setQty((q) => Math.min(10, q + 1))}
                    />
                  </View>
                </View>
              )}

              <Button
                title={
                  isOutOfStock
                    ? "Dish is currently out of stock"
                    : qty > 1
                      ? `Add ${qty} to bag · ${money(food.price * qty)}`
                      : `Add to bag · ${money(food.price)}`
                }
                disabled={isOutOfStock}
                onPress={handleAdd}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
