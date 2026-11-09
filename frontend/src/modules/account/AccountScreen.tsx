import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/expo";
import { Pressable, ScrollView, Text, View } from "react-native";
import { colors, ui } from "../../shared/theme";
import { Button } from "../../shared/components/Button";
import { getStorageItem, removeStorageItem, setStorageItem } from "../../shared/storage";
import type { SavedAddress } from "../../shared/types";
import { KitchenScreen } from "../admin/KitchenScreen";

const MULTI_ADDRESSES_STORAGE_KEY = "freshly_saved_addresses_multi";
const LEGACY_ADDRESS_STORAGE_KEY = "freshly_saved_address";

export function AccountScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [error, setError] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showKitchen, setShowKitchen] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      // 1. Try multi-address storage
      const multi = await getStorageItem(MULTI_ADDRESSES_STORAGE_KEY);
      if (!active) return;
      if (multi) {
        try {
          const parsed = JSON.parse(multi);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAddresses(parsed);
            return;
          }
        } catch {}
      }

      // 2. Fallback to legacy single address if present
      const single = await getStorageItem(LEGACY_ADDRESS_STORAGE_KEY);
      if (!active) return;
      if (single) {
        try {
          const parsed = JSON.parse(single);
          if (parsed && typeof parsed === "object" && parsed.name) {
            const upgraded: SavedAddress[] = [
              { ...parsed, id: "default-1", label: "Home" },
            ];
            setAddresses(upgraded);
            void setStorageItem(
              MULTI_ADDRESSES_STORAGE_KEY,
              JSON.stringify(upgraded),
            );
          }
        } catch {}
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleRemoveAddress(id: string) {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    if (updated.length === 0) {
      await removeStorageItem(MULTI_ADDRESSES_STORAGE_KEY);
      await removeStorageItem(LEGACY_ADDRESS_STORAGE_KEY);
    } else {
      await setStorageItem(
        MULTI_ADDRESSES_STORAGE_KEY,
        JSON.stringify(updated),
      );
    }
  }

  const email = user?.primaryEmailAddress?.emailAddress || "Food Explorer";
  const username = user?.username ? `@${user.username}` : "";
  const displayName = user?.fullName || username || "Freshly Member";
  const initials = (user?.firstName && user?.lastName)
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : displayName.replace(/^@/, "").slice(0, 2).toUpperCase();

  return (
    <>
      <ScrollView contentContainerStyle={ui.content}>
        {/* User Profile Card */}
        <View
          style={[
            ui.card,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              backgroundColor: "#FAF3E8",
              borderColor: colors.accent,
            },
          ]}
        >
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: colors.white,
                fontSize: 20,
                fontWeight: "800",
              }}
            >
              {initials}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[ui.heading, { fontSize: 18 }]}>{displayName}</Text>
            <Text style={{ fontSize: 13, color: colors.ink }}>
              {user?.primaryEmailAddress?.emailAddress || email}
              {user?.username ? ` · @${user.username}` : ""}
            </Text>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700" }}>
              Verified Account · Secured by Clerk
            </Text>
          </View>
        </View>

        {/* Kitchen & Staff Access Banner */}
        <View
          style={[
            ui.card,
            {
              backgroundColor: "#202820",
              borderColor: "#354035",
            },
          ]}
        >
          <View style={{ gap: 4 }}>
            <Text
              style={{
                color: colors.accent,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 1.5,
              }}
            >
              RESTAURANT PORTAL
            </Text>
            <Text style={{ color: colors.white, fontSize: 18, fontWeight: "800" }}>
              Kitchen & Staff Dashboard
            </Text>
            <Text style={{ color: "#B8BDB3", fontSize: 13, lineHeight: 18 }}>
              Manage live incoming customer orders, change order stages, and
              toggle menu item stock availability in real-time.
            </Text>
          </View>
          <Button
            title="Open Kitchen Management 👨‍🍳"
            onPress={() => setShowKitchen(true)}
          />
        </View>

        {/* Saved Addresses Section */}
        <View style={ui.row}>
          <Text style={ui.heading}>Saved Delivery Addresses</Text>
          <Text style={ui.muted}>{addresses.length} saved</Text>
        </View>

        {addresses.length ? (
          addresses.map((addr) => (
            <View key={addr.id} style={ui.card}>
              <View style={ui.row}>
                <View
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 11,
                      fontWeight: "800",
                    }}
                  >
                    {addr.label.toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontWeight: "700", color: colors.ink }}>
                  {addr.phone}
                </Text>
              </View>
              <Text style={[ui.text, { fontWeight: "700" }]}>{addr.name}</Text>
              <Text style={ui.text}>{addr.line}</Text>
              <Text style={ui.muted}>
                {addr.city} – {addr.postalCode}
              </Text>
              <Button
                secondary
                title="Remove address"
                onPress={() => void handleRemoveAddress(addr.id)}
              />
            </View>
          ))
        ) : (
          <View style={ui.card}>
            <Text style={ui.muted}>
              No saved addresses yet. When checking out, check &ldquo;Save this
              address&rdquo; to save it to your profile.
            </Text>
          </View>
        )}

        {/* Customer Help & FAQs */}
        <Pressable
          onPress={() => setShowFaq((v) => !v)}
          style={[ui.card, { gap: 8 }]}
        >
          <View style={ui.row}>
            <Text style={[ui.heading, { fontSize: 16 }]}>
              Delivery Help & FAQs
            </Text>
            <Text style={{ fontSize: 16, color: colors.muted }}>
              {showFaq ? "▲" : "▼"}
            </Text>
          </View>
          {showFaq && (
            <View
              style={{
                borderTopWidth: 1,
                borderColor: colors.line,
                paddingTop: 8,
                gap: 8,
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 13, color: colors.ink }}>
                What are the delivery charges?
              </Text>
              <Text style={ui.muted}>
                Delivery is completely free on orders of ₹500 or more. For
                smaller orders, a flat ₹39 delivery fee applies.
              </Text>
              <Text style={{ fontWeight: "700", fontSize: 13, color: colors.ink }}>
                What payment methods are supported?
              </Text>
              <Text style={ui.muted}>
                We currently support Cash on Delivery (COD) upon food arrival.
              </Text>
              <Text style={{ fontWeight: "700", fontSize: 13, color: colors.ink }}>
                How do I cancel my order?
              </Text>
              <Text style={ui.muted}>
                Orders can be cancelled directly from the Orders tab while the
                status is &ldquo;Placed&rdquo; or &ldquo;Confirmed&rdquo;.
              </Text>
            </View>
          )}
        </Pressable>

        {!!error && <Text style={ui.error}>{error}</Text>}

        <Button
          secondary
          title="Sign out of account"
          onPress={() => {
            void signOut().catch(() =>
              setError("Could not sign out. Please retry."),
            );
          }}
        />
      </ScrollView>

      {/* Kitchen Modal */}
      <KitchenScreen
        visible={showKitchen}
        onClose={() => setShowKitchen(false)}
      />
    </>
  );
}
