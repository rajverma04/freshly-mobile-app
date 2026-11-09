import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  RefreshControl,
} from "react-native";
import { useResource } from "../../shared/useResource";
import type { Food } from "../../shared/types";
import { ui, colors } from "../../shared/theme";
import { State } from "../../shared/components/State";
import { useCart } from "../cart/CartProvider";
import { useFavorites } from "./FavoritesProvider";
import { FoodCard } from "./FoodCard";
import { FoodDetail } from "./FoodDetail";

export function MenuScreen() {
  const { data, loading, error, reload } = useResource<Food[]>("/foods");
  const { add } = useCart();
  const { isFavorite, favoritesCount } = useFavorites();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [selected, setSelected] = useState<Food | null>(null);

  const categories = ["All", ...new Set(data?.map((f) => f.category) || [])];

  const foods = data
    ?.filter((f) => {
      const matchesQuery = f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "All" || f.category === category;
      const matchesVeg = !vegOnly || f.vegetarian;
      const matchesFav = !favoritesOnly || isFavorite(f.id);
      return matchesQuery && matchesCategory && matchesVeg && matchesFav;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return 0; // featured/default
    });

  return (
    <>
      <ScrollView
        contentContainerStyle={ui.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} />
        }
      >
        <Text
          style={{ color: colors.primary, fontWeight: "800", letterSpacing: 2 }}
        >
          FRESHLY / THE DAILY KITCHEN
        </Text>
        <Text style={ui.title}>Good food. Great mood.</Text>
        <Text style={ui.muted}>Fresh favourites, made for your everyday.</Text>

        {/* Promo card */}
        <View style={[ui.card, { backgroundColor: "#E8EEDC", borderWidth: 0 }]}>
          <Text style={ui.heading}>A little joy, delivered.</Text>
          <Text style={ui.text}>Free delivery on orders of ₹500 or more.</Text>
          <Text style={ui.muted}>Cash on delivery · Freshly prepared</Text>
        </View>

        {/* Search Bar */}
        <TextInput
          style={ui.input}
          accessibilityLabel="Search food"
          placeholder="Search dishes, ingredients, curries…"
          value={query}
          onChangeText={setQuery}
        />

        {/* Popular Quick Search Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {["All", "Biryani", "Burger", "Pizza", "Pasta", "Salad", "Paneer"].map((quick) => (
            <Pressable
              key={quick}
              onPress={() => {
                if (quick === "All") {
                  setQuery("");
                  setCategory("All");
                } else {
                  setQuery(quick);
                }
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: query === quick ? colors.ink : "#EAECE4",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: query === quick ? colors.white : colors.ink,
                }}
              >
                {quick === "All" ? "Clear Search ✕" : `Craving ${quick}`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Categories Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map((c) => (
            <Pressable
              accessibilityRole="button"
              key={c}
              onPress={() => setCategory(c)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 24,
                backgroundColor: c === category ? colors.primary : colors.white,
                borderWidth: 1,
                borderColor: c === category ? colors.primary : colors.line,
              }}
            >
              <Text
                style={{
                  color: c === category ? colors.white : colors.ink,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Filters & Sorting Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {/* Dietary & Favorites Filters */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Veg Only Toggle */}
            <Pressable
              onPress={() => setVegOnly((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: vegOnly ? "#E2F5E9" : colors.white,
                borderWidth: 1.5,
                borderColor: vegOnly ? "#1A7A40" : colors.line,
              }}
            >
              <Text style={{ fontSize: 13 }}>🟢</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: vegOnly ? "#1A7A40" : colors.ink,
                }}
              >
                Veg Only
              </Text>
            </Pressable>

            {/* Favorites Filter */}
            <Pressable
              onPress={() => setFavoritesOnly((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: favoritesOnly ? "#FDE8E8" : colors.white,
                borderWidth: 1.5,
                borderColor: favoritesOnly ? "#B63727" : colors.line,
              }}
            >
              <Text style={{ fontSize: 13 }}>❤️</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: favoritesOnly ? "#B63727" : colors.ink,
                }}
              >
                Saved {favoritesCount > 0 ? `(${favoritesCount})` : ""}
              </Text>
            </Pressable>
          </View>

          {/* Sort By Pills */}
          <View style={{ flexDirection: "row", gap: 6 }}>
            {(
              [
                ["featured", "Featured"],
                ["price-asc", "Price ↑"],
                ["price-desc", "Price ↓"],
              ] as const
            ).map(([mode, label]) => (
              <Pressable
                key={mode}
                onPress={() => setSortBy(mode)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: 16,
                  backgroundColor:
                    sortBy === mode ? colors.ink : colors.white,
                  borderWidth: 1,
                  borderColor: colors.line,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: sortBy === mode ? colors.white : colors.muted,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Menu Items Heading */}
        <View style={ui.row}>
          <Text style={ui.heading}>On the menu</Text>
          {foods && (
            <Text style={ui.muted}>
              {foods.length} {foods.length === 1 ? "dish" : "dishes"}
            </Text>
          )}
        </View>

        {loading || error ? (
          <State loading={loading} error={error} retry={reload} />
        ) : foods?.length ? (
          foods.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onAdd={() => add(food)}
              onOpen={() => setSelected(food)}
            />
          ))
        ) : (
          <State
            empty={
              favoritesOnly
                ? "No favorite dishes yet. Tap the heart ❤️ on any dish to save it here!"
                : "No dishes match your filters. Try clearing Veg Only or search."
            }
          />
        )}
      </ScrollView>

      <FoodDetail
        food={selected}
        onClose={() => setSelected(null)}
        onAdd={add}
      />
    </>
  );
}
