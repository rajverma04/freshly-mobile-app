import { Text, TextInput, View, type TextInputProps } from "react-native";
import { ui } from "../theme";
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={ui.muted}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8A8F86"
        style={ui.input}
        {...props}
      />
    </View>
  );
}
