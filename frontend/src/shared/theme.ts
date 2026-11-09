import { StyleSheet } from "react-native";
export const colors = {
  bg: "#FAF8F5",
  ink: "#202820",
  muted: "#73796F",
  primary: "#246B45",
  line: "#E3E5DB",
  white: "#FFFFFF",
  accent: "#F0DFC1",
};
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 18, paddingBottom: 36 },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -1,
  },
  heading: { fontSize: 21, fontWeight: "700", color: colors.ink },
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.ink,
  },
  error: { color: "#B63727", fontSize: 14, lineHeight: 21 },
});
export const money = (paise: number) => `₹${(paise / 100).toFixed(2)}`;
