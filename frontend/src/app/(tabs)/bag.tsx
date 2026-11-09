import { router } from "expo-router";
import { CartScreen } from "../../modules/cart/CartScreen";
export default function Bag() {
  return (
    <CartScreen
      onAccount={() => router.navigate("/account")}
      onComplete={() => router.navigate("/orders")}
    />
  );
}
