import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { Slot } from "expo-router";
import { CartProvider } from "../modules/cart/CartProvider";
import { FavoritesProvider } from "../modules/catalog/FavoritesProvider";
import { OrderAlertProvider } from "../modules/orders/OrderAlertProvider";
import { ui } from "../shared/theme";

const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!key || key.includes("REPLACE_ME") ? (
        <SafeAreaView style={[ui.page, ui.content]}>
          <Text style={ui.title}>Welcome to Freshly.</Text>
          <Text style={ui.text}>
            Add your Clerk publishable key and API URL to frontend/.env, then
            restart Expo. See docs/SETUP.md for setup steps.
          </Text>
        </SafeAreaView>
      ) : (
        <ClerkProvider publishableKey={key} tokenCache={tokenCache}>
          <OrderAlertProvider>
            <CartProvider>
              <FavoritesProvider>
                <Slot />
              </FavoritesProvider>
            </CartProvider>
          </OrderAlertProvider>
        </ClerkProvider>
      )}
    </SafeAreaProvider>
  );
}
