import { Pressable, Text } from "react-native";
import { colors } from "../theme";
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: secondary ? "#EAF0E6" : colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 13,
        alignItems: "center",
        opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
      })}
    >
      <Text
        style={{
          color: secondary ? colors.primary : "white",
          fontSize: 15,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
