import { Tabs } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../../modules/cart/CartProvider";
import { colors, ui } from "../../shared/theme";
import { State } from "../../shared/components/State";
export default function TabLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { count, clear } = useCart();
  const previous = useRef(isSignedIn);
  useEffect(() => {
    if (previous.current && !isSignedIn) clear();
    previous.current = isSignedIn;
  }, [isSignedIn, clear]);
  if (!isLoaded) return <State loading />;
  return (
    <SafeAreaView style={ui.page} edges={["top"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarIconStyle: { display: "none" },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
          tabBarItemStyle: { paddingTop: 12 },
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Menu" }} />
        <Tabs.Screen name="recipes" options={{ title: "Recipes" }} />
        <Tabs.Screen name="bag" options={{ title: `Bag (${count})` }} />
        <Tabs.Screen name="orders" options={{ title: "Orders" }} />
        <Tabs.Screen name="account" options={{ title: "Account" }} />
      </Tabs>
    </SafeAreaView>
  );
}
