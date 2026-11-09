import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useResource } from "../../shared/useResource";
import { useApi } from "../../shared/api";
import type { AdminAnalytics, Food, Order, OrderStatus } from "../../shared/types";
import { colors, money, ui } from "../../shared/theme";
import { Button } from "../../shared/components/Button";
import { State } from "../../shared/components/State";
import { Field } from "../../shared/components/Field";

const STATUS_ACTIONS: Partial<
  Record<OrderStatus, { next: OrderStatus; label: string }>
> = {
  PLACED: { next: "CONFIRMED", label: "Accept Order ✓" },
  CONFIRMED: { next: "PREPARING", label: "Start Cooking 🍳" },
  PREPARING: { next: "OUT_FOR_DELIVERY", label: "Hand to Delivery 🛵" },
  OUT_FOR_DELIVERY: { next: "DELIVERED", label: "Mark Delivered 🎉" },
};

export function KitchenScreen({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const api = useApi();
  const [tab, setTab] = useState<"orders" | "analytics" | "inventory" | "add">("orders");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ACTIVE");

  // Orders resource
  const {
    data: orders,
    loading: ordersLoading,
    error: ordersError,
    reload: reloadOrders,
  } = useResource<Order[]>("/orders/kitchen/live");

  // Analytics resource
  const {
    data: analytics,
    loading: analyticsLoading,
    error: analyticsError,
    reload: reloadAnalytics,
  } = useResource<AdminAnalytics>("/orders/admin/analytics");

  // Catalog resource
  const {
    data: foods,
    loading: foodsLoading,
    error: foodsError,
    reload: reloadFoods,
  } = useResource<Food[]>("/foods/admin");

  const [actingId, setActingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // New Dish Form State
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState("Bowls");
  const [newPrice, setNewPrice] = useState("249");
  const [newVeg, setNewVeg] = useState(true);
  const [newImage, setNewImage] = useState(
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop",
  );
  const [addingDish, setAddingDish] = useState(false);

  async function handleAdvanceOrder(orderId: string) {
    setActingId(orderId);
    setErrorMsg("");
    try {
      await api<Order>(`/orders/kitchen/${orderId}/advance`, {
        method: "POST",
      });
      reloadOrders();
      reloadAnalytics();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setActingId(null);
    }
  }

  async function handleCancelOrder(orderId: string) {
    setActingId(orderId);
    setErrorMsg("");
    try {
      await api<Order>(`/orders/kitchen/${orderId}/cancel`, {
        method: "POST",
      });
      reloadOrders();
      reloadAnalytics();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to cancel order");
    } finally {
      setActingId(null);
    }
  }

  async function handleToggleStock(foodId: string) {
    setActingId(foodId);
    setErrorMsg("");
    try {
      await api<Food>(`/foods/${foodId}/toggle`, { method: "PATCH" });
      reloadFoods();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to update stock");
    } finally {
      setActingId(null);
    }
  }

  async function handleCreateDish() {
    if (!newName.trim() || !newDesc.trim()) {
      setErrorMsg("Please fill in dish name and description.");
      return;
    }
    const rupees = parseFloat(newPrice);
    if (isNaN(rupees) || rupees < 1) {
      setErrorMsg("Please enter a valid price in Rupees.");
      return;
    }
    setAddingDish(true);
    setErrorMsg("");
    try {
      await api<Food>("/foods", {
        method: "POST",
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim(),
          category: newCat.trim() || "Bowls",
          price: Math.round(rupees * 100), // convert to paise
          vegetarian: newVeg,
          image: newImage.trim(),
        }),
      });
      setNewName("");
      setNewDesc("");
      reloadFoods();
      setTab("inventory");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to add dish.");
    } finally {
      setAddingDish(false);
    }
  }

  const filteredOrders = orders?.filter((o) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE")
      return ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(
        o.status,
      );
    return ["DELIVERED", "CANCELLED"].includes(o.status);
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[ui.page, { paddingTop: 40 }]}>
        {/* Header Bar */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderColor: colors.line,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "800",
                color: colors.primary,
                letterSpacing: 1.5,
              }}
            >
              KITCHEN & STAFF
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>
              Admin Dashboard
            </Text>
          </View>
          <Button secondary title="Close ✕" onPress={onClose} />
        </View>

        {/* Sub-tab navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            maxHeight: 56,
            backgroundColor: "#F2F4EB",
            borderBottomWidth: 1,
            borderColor: colors.line,
          }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          {(
            [
              [
                "orders",
                `Live Orders (${orders?.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length || 0})`,
              ],
              ["analytics", "Revenue & Sales 📊"],
              ["inventory", `Menu Stock (${foods?.length || 0})`],
              ["add", "＋ Add Dish"],
            ] as const
          ).map(([t, label]) => (
            <Pressable
              key={t}
              onPress={() => {
                setTab(t);
                setErrorMsg("");
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                alignItems: "center",
                borderRadius: 16,
                backgroundColor: tab === t ? colors.primary : colors.white,
                borderWidth: 1,
                borderColor: tab === t ? colors.primary : colors.line,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: tab === t ? colors.white : colors.ink,
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {!!errorMsg && (
          <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
            <Text style={ui.error}>{errorMsg}</Text>
          </View>
        )}

        {/* Tab 1: Live Orders */}
        {tab === "orders" && (
          <ScrollView
            contentContainerStyle={ui.content}
            refreshControl={
              <RefreshControl
                refreshing={ordersLoading}
                onRefresh={reloadOrders}
              />
            }
          >
            {/* Filter pills */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["ACTIVE", "ALL", "COMPLETED"] as const).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 16,
                    backgroundColor:
                      filter === f ? colors.ink : colors.white,
                    borderWidth: 1,
                    borderColor: colors.line,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: filter === f ? colors.white : colors.ink,
                    }}
                  >
                    {f === "ACTIVE"
                      ? "Active Orders"
                      : f === "ALL"
                        ? "All History"
                        : "Completed"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {ordersLoading ? (
              <State loading />
            ) : ordersError ? (
              <State error={ordersError} retry={reloadOrders} />
            ) : filteredOrders?.length ? (
              filteredOrders.map((order) => {
                const action = STATUS_ACTIONS[order.status];
                const isBusy = actingId === order.id;
                const canCancel = ["PLACED", "CONFIRMED"].includes(order.status);

                return (
                  <View key={order.id} style={ui.card}>
                    <View style={ui.row}>
                      <View
                        style={{
                          backgroundColor:
                            order.status === "DELIVERED"
                              ? "#E2F5E9"
                              : order.status === "CANCELLED"
                                ? "#FDE8E8"
                                : "#FFF3D6",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "800",
                            fontSize: 12,
                            color:
                              order.status === "DELIVERED"
                                ? "#1A7A40"
                                : order.status === "CANCELLED"
                                  ? "#B63727"
                                  : "#B25E00",
                          }}
                        >
                          {order.status}
                        </Text>
                      </View>
                      <Text style={ui.heading}>{money(order.total)}</Text>
                    </View>

                    <Text style={{ fontSize: 13, color: colors.muted }}>
                      Order #{order.id.slice(-6).toUpperCase()} ·{" "}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </Text>

                    {order.address && (
                      <View
                        style={{
                          backgroundColor: colors.bg,
                          padding: 10,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ fontWeight: "700", fontSize: 13 }}>
                          Customer: {order.address.name} ({order.address.phone})
                        </Text>
                        <Text style={[ui.muted, { fontSize: 12 }]}>
                          {order.address.line}, {order.address.city} -{" "}
                          {order.address.postalCode}
                        </Text>
                      </View>
                    )}

                    <View
                      style={{
                        borderTopWidth: 1,
                        borderColor: colors.line,
                        paddingTop: 8,
                        gap: 4,
                      }}
                    >
                      {order.items.map((i) => (
                        <View key={i.id} style={ui.row}>
                          <Text style={{ fontWeight: "700", color: colors.ink }}>
                            {i.quantity} × {i.name}
                          </Text>
                          <Text style={ui.muted}>
                            {money(i.unitPrice * i.quantity)}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {action && (
                      <View style={{ gap: 8, marginTop: 4 }}>
                        <Button
                          title={isBusy ? "Updating…" : action.label}
                          disabled={isBusy}
                          onPress={() => void handleAdvanceOrder(order.id)}
                        />
                        {canCancel && (
                          <Button
                            secondary
                            title={isBusy ? "Cancelling…" : "Reject / Cancel"}
                            disabled={isBusy}
                            onPress={() => void handleCancelOrder(order.id)}
                          />
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <State empty="No orders in this category." />
            )}
          </ScrollView>
        )}

        {/* Tab 2: Revenue & Sales Dashboard */}
        {tab === "analytics" && (
          <ScrollView
            contentContainerStyle={[ui.content, { paddingBottom: 40 }]}
            refreshControl={
              <RefreshControl
                refreshing={analyticsLoading}
                onRefresh={reloadAnalytics}
              />
            }
          >
            <View style={ui.row}>
              <View>
                <Text style={ui.heading}>Sales & Performance</Text>
                <Text style={ui.muted}>
                  Live revenue and order fulfillment stats
                </Text>
              </View>
              <Button
                secondary
                title="Refresh ↻"
                onPress={() => reloadAnalytics()}
              />
            </View>

            {analyticsLoading && !analytics ? (
              <State loading />
            ) : analyticsError ? (
              <State error={analyticsError} retry={reloadAnalytics} />
            ) : analytics ? (
              <>
                {/* 2x2 Top Metrics Grid */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {/* Total Revenue */}
                  <View
                    style={[
                      ui.card,
                      {
                        flex: 1,
                        backgroundColor: "#FAF3E8",
                        borderColor: colors.accent,
                        gap: 4,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: colors.muted,
                      }}
                    >
                      TOTAL REVENUE
                    </Text>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: colors.primary,
                      }}
                    >
                      {money(analytics.totalRevenue)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.ink }}>
                      Across {analytics.totalOrders} total orders
                    </Text>
                  </View>

                  {/* Today's Sales */}
                  <View
                    style={[
                      ui.card,
                      {
                        flex: 1,
                        backgroundColor: "#EAF5EB",
                        borderColor: "#78C08A",
                        gap: 4,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#1A7A40",
                      }}
                    >
                      TODAY&apos;S SALES
                    </Text>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: "#1A7A40",
                      }}
                    >
                      {money(analytics.todayRevenue)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.ink }}>
                      {analytics.activeCount} active in kitchen
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  {/* Avg Basket Value */}
                  <View
                    style={[
                      ui.card,
                      {
                        flex: 1,
                        backgroundColor: "#F2F4EB",
                        borderColor: colors.line,
                        gap: 4,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: colors.muted,
                      }}
                    >
                      AVG BASKET (AOV)
                    </Text>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "800",
                        color: colors.ink,
                      }}
                    >
                      {money(analytics.averageOrderValue)}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      Per customer checkout
                    </Text>
                  </View>

                  {/* Fulfillment Success Rate */}
                  <View
                    style={[
                      ui.card,
                      {
                        flex: 1,
                        backgroundColor: "#F2F4EB",
                        borderColor: colors.line,
                        gap: 4,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: colors.muted,
                      }}
                    >
                      FULFILLMENT
                    </Text>
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "800",
                        color: colors.ink,
                      }}
                    >
                      {analytics.totalOrders > 0
                        ? `${Math.round(
                            (analytics.deliveredCount /
                              Math.max(
                                1,
                                analytics.deliveredCount +
                                  analytics.cancelledCount,
                              )) *
                              100,
                          )}%`
                        : "100%"}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {analytics.deliveredCount} delivered · {analytics.cancelledCount} cancelled
                    </Text>
                  </View>
                </View>

                {/* Payment Methods Split */}
                <View style={ui.card}>
                  <Text style={[ui.heading, { fontSize: 16 }]}>
                    Payment Breakdown
                  </Text>
                  <Text style={ui.muted}>Revenue split by payment channel</Text>

                  <View
                    style={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "#EAECE4",
                      flexDirection: "row",
                      overflow: "hidden",
                      marginVertical: 10,
                    }}
                  >
                    <View
                      style={{
                        flex: Math.max(1, analytics.onlineRevenue),
                        backgroundColor: colors.primary,
                      }}
                    />
                    <View
                      style={{
                        flex: Math.max(1, analytics.codRevenue),
                        backgroundColor: "#E29547",
                      }}
                    />
                  </View>

                  <View style={ui.row}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: colors.primary,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: colors.ink,
                        }}
                      >
                        Online (UPI/Cards): {money(analytics.onlineRevenue)} (
                        {analytics.onlineOrdersCount} orders)
                      </Text>
                    </View>
                  </View>

                  <View style={ui.row}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "#E29547",
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: colors.ink,
                        }}
                      >
                        Cash on Delivery (COD): {money(analytics.codRevenue)} (
                        {analytics.codOrdersCount} orders)
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Top 5 Best Sellers */}
                <View style={ui.card}>
                  <Text style={[ui.heading, { fontSize: 16 }]}>
                    Top Selling Dishes
                  </Text>
                  <Text style={ui.muted}>
                    Most popular customer choices on the menu
                  </Text>

                  {analytics.topSellers.length === 0 ? (
                    <Text style={[ui.muted, { paddingVertical: 12 }]}>
                      No sales recorded yet. Ordered dishes will appear here.
                    </Text>
                  ) : (
                    analytics.topSellers.map((item, idx) => (
                      <View
                        key={item.name}
                        style={[
                          ui.row,
                          {
                            paddingVertical: 10,
                            borderBottomWidth:
                              idx < analytics.topSellers.length - 1 ? 1 : 0,
                            borderColor: colors.line,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 13,
                              backgroundColor:
                                idx === 0
                                  ? "#FFD700"
                                  : idx === 1
                                    ? "#C0C0C0"
                                    : idx === 2
                                      ? "#CD7F32"
                                      : "#EAECE4",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "800",
                                color: colors.ink,
                              }}
                            >
                              #{idx + 1}
                            </Text>
                          </View>
                          <View>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "700",
                                color: colors.ink,
                              }}
                            >
                              {item.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.muted }}>
                              {item.quantity}{" "}
                              {item.quantity === 1 ? "serving" : "servings"}{" "}
                              sold
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "800",
                            color: colors.primary,
                          }}
                        >
                          {money(item.revenue)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </>
            ) : null}
          </ScrollView>
        )}

        {/* Tab 3: Inventory & Stock */}
        {tab === "inventory" && (
          <ScrollView
            contentContainerStyle={ui.content}
            refreshControl={
              <RefreshControl
                refreshing={foodsLoading}
                onRefresh={reloadFoods}
              />
            }
          >
            <Text style={ui.muted}>
              Toggle dishes in or out of stock. Out-of-stock dishes are hidden
              from customers immediately.
            </Text>

            {foodsLoading ? (
              <State loading />
            ) : foodsError ? (
              <State error={foodsError} retry={reloadFoods} />
            ) : (
              foods?.map((f) => {
                const inStock = f.available !== false;
                const isBusy = actingId === f.id;

                return (
                  <View
                    key={f.id}
                    style={[
                      ui.card,
                      { opacity: inStock ? 1 : 0.65 },
                    ]}
                  >
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <Image
                        source={{ uri: f.image }}
                        style={{ width: 68, height: 68, borderRadius: 12 }}
                      />
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={ui.row}>
                          <Text style={[ui.heading, { fontSize: 16 }]}>
                            {f.name}
                          </Text>
                          <View
                            style={{
                              backgroundColor: inStock ? "#E2F5E9" : "#FDE8E8",
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "800",
                                color: inStock ? "#1A7A40" : "#B63727",
                              }}
                            >
                              {inStock ? "IN STOCK" : "OUT OF STOCK"}
                            </Text>
                          </View>
                        </View>
                        <Text style={ui.muted}>
                          {f.category} · {f.vegetarian ? "Veg 🟢" : "Non-Veg 🔴"}
                        </Text>
                        <Text style={{ fontWeight: "700", color: colors.ink }}>
                          {money(f.price)}
                        </Text>
                      </View>
                    </View>

                    <Button
                      secondary={inStock}
                      title={
                        isBusy
                          ? "Updating…"
                          : inStock
                            ? "Mark Out of Stock ✕"
                            : "Mark Available In Stock ✓"
                      }
                      disabled={isBusy}
                      onPress={() => void handleToggleStock(f.id)}
                    />
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Tab 3: Add Dish Form */}
        {tab === "add" && (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={ui.content}
          >
            <Text style={ui.heading}>Add New Menu Item</Text>
            <Text style={ui.muted}>
              Add a newly prepared dish directly to the customer-facing menu.
            </Text>

            <Field
              label="Dish Name"
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Butter Garlic Naan"
            />

            <Field
              label="Description"
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="e.g. Crisp, fresh flatbread roasted in clay oven"
            />

            <Field
              label="Category"
              value={newCat}
              onChangeText={setNewCat}
              placeholder="Bowls, Pizza, Burgers, Salads, Breads, Starters"
            />

            <Field
              label="Price (in ₹ Rupees)"
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="numeric"
              placeholder="249"
            />

            <Field
              label="Image URL"
              value={newImage}
              onChangeText={setNewImage}
              placeholder="https://..."
            />

            <Pressable
              onPress={() => setNewVeg((v) => !v)}
              style={[
                ui.row,
                {
                  justifyContent: "flex-start",
                  gap: 12,
                  paddingVertical: 6,
                },
              ]}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: newVeg ? colors.primary : colors.line,
                  backgroundColor: newVeg ? colors.primary : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {newVeg && (
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    ✓
                  </Text>
                )}
              </View>
              <Text style={ui.text}>
                Vegetarian dish ({newVeg ? "Veg 🟢" : "Non-Veg 🔴"})
              </Text>
            </Pressable>

            <Button
              title={addingDish ? "Creating dish…" : "Save & Publish to Menu"}
              disabled={addingDish}
              onPress={() => void handleCreateDish()}
            />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
