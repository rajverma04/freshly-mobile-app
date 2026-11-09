import { Image, Text, View, Pressable } from "react-native";
import type { Food } from "../../shared/types";
import { colors, ui, money } from "../../shared/theme";
import { Button } from "../../shared/components/Button";
import { useFavorites } from "./FavoritesProvider";

export function FoodCard({
  food,
  onAdd,
  onOpen,
}: {
  food: Food;
  onAdd: () => void;
  onOpen: () => void;
}) {
  const isOutOfStock = food.available === false;
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(food.id);

  return (
    <View
      style={[
        ui.card,
        {
          padding: 0,
          overflow: "hidden",
          opacity: isOutOfStock ? 0.6 : 1,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${food.name}`}
        onPress={onOpen}
      >
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: food.image }}
            style={{ height: 180, width: "100%", backgroundColor: colors.accent }}
          />

          {/* Badges on Image */}
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              flexDirection: "row",
              gap: 8,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.92)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 10 }}>
                {food.vegetarian ? "🟢" : "🔴"}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: food.vegetarian ? "#1A7A40" : "#B63727",
                }}
              >
                {food.vegetarian ? "VEG" : "NON-VEG"}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(32,40,32,0.85)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "700", color: colors.white }}>
                ⏱ 20–25m
              </Text>
            </View>
          </View>

          {/* Heart / Favorite Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fav ? "Remove from favorites" : "Add to favorites"}
            onPress={(e) => {
              e.stopPropagation();
              void toggleFavorite(food.id);
            }}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.92)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 16 }}>{fav ? "❤️" : "🤍"}</Text>
          </Pressable>

          {isOutOfStock && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.45)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "#B63727",
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: "800", fontSize: 12 }}>
                  OUT OF STOCK
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ padding: 18, gap: 6 }}>
          <Text
            style={{
              color: colors.primary,
              fontSize: 11,
              fontWeight: "800",
              letterSpacing: 1,
            }}
          >
            {food.category.toUpperCase()}
          </Text>
          <Text style={ui.heading}>{food.name}</Text>
          <Text numberOfLines={2} style={ui.muted}>
            {food.description}
          </Text>
        </View>
      </Pressable>

      <View style={[ui.row, { paddingHorizontal: 18, paddingBottom: 18 }]}>
        <Text style={ui.heading}>{money(food.price)}</Text>
        <Button
          title={isOutOfStock ? "Out of stock" : "+ Add"}
          disabled={isOutOfStock}
          onPress={onAdd}
        />
      </View>
    </View>
  );
}
