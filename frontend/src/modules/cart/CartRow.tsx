import { Text, View } from "react-native";
import type { CartItem } from "../../shared/types";
import { ui, money } from "../../shared/theme";
import { Button } from "../../shared/components/Button";
export function CartRow({
  item,
  change,
}: {
  item: CartItem;
  change: (delta: number) => void;
}) {
  return (
    <View style={ui.card}>
      <Text style={ui.heading}>{item.food.name}</Text>
      <View style={ui.row}>
        <Text style={ui.text}>{money(item.food.price * item.quantity)}</Text>
        <View style={ui.row}>
          <Button title="−" secondary onPress={() => change(-1)} />
          <Text style={ui.text}>{item.quantity}</Text>
          <Button
            title="+"
            secondary
            disabled={item.quantity >= 20}
            onPress={() => change(1)}
          />
        </View>
      </View>
    </View>
  );
}
