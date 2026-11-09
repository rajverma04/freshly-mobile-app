import { ScrollView, Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useCart } from "./CartProvider";
import { CartRow } from "./CartRow";
import { CheckoutForm } from "../checkout/CheckoutForm";
import { ui, money } from "../../shared/theme";
import { Button } from "../../shared/components/Button";
import { State } from "../../shared/components/State";
export function CartScreen({
  onAccount,
  onComplete,
}: {
  onAccount: () => void;
  onComplete: () => void;
}) {
  const cart = useCart();
  const { isSignedIn } = useAuth();
  const delivery = cart.subtotal >= 50000 ? 0 : 3900;
  if (!cart.isHydrated) {
    return <State loading />;
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
          <View style={ui.card}>
            <View style={ui.row}>
              <Text style={ui.text}>Subtotal</Text>
              <Text style={ui.text}>{money(cart.subtotal)}</Text>
            </View>
            <View style={ui.row}>
              <Text style={ui.text}>Delivery</Text>
              <Text style={ui.text}>{delivery ? money(delivery) : "Free"}</Text>
            </View>
            <View style={ui.row}>
              <Text style={ui.heading}>Total</Text>
              <Text style={ui.heading}>{money(cart.subtotal + delivery)}</Text>
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
