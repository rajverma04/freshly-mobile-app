import { ActivityIndicator, Text, View } from "react-native";
import { ui, colors } from "../theme";
import { Button } from "./Button";
export function State({
  loading,
  error,
  empty,
  retry,
}: {
  loading?: boolean;
  error?: string;
  empty?: string;
  retry?: () => void;
}) {
  return (
    <View style={{ padding: 24, gap: 16 }}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={error ? ui.error : ui.muted}>{error || empty}</Text>
      )}
      {error && retry && <Button title="Try again" onPress={retry} />}
    </View>
  );
}
