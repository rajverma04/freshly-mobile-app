import { useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useResource } from "../../shared/useResource";
import type { Recipe } from "../../shared/types";
import { ui } from "../../shared/theme";
import { Button } from "../../shared/components/Button";
import { State } from "../../shared/components/State";
export function RecipesScreen() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const { data, loading, error, reload } = useResource<{ results: Recipe[] }>(
    `/recipes?query=${encodeURIComponent(query)}`,
  );
  const [linkError, setLinkError] = useState("");
  return (
    <ScrollView contentContainerStyle={ui.content}>
      <Text style={ui.title}>A little inspiration.</Text>
      <Text style={ui.muted}>
        Recipes powered by Spoonacular. Explore cooking ideas here; order
        available dishes from our menu.
      </Text>
      <TextInput
        accessibilityLabel="Search recipes"
        style={ui.input}
        value={input}
        onChangeText={setInput}
        placeholder="Try pasta, curry, salad…"
        onSubmitEditing={() => setQuery(input)}
      />
      <Button title="Find recipes" onPress={() => setQuery(input)} />
      {!!linkError && <Text style={ui.error}>{linkError}</Text>}
      {loading || error ? (
        <State loading={loading} error={error} retry={reload} />
      ) : data?.results.length ? (
        data.results.map((r) => (
          <View key={r.id} style={ui.card}>
            <Image
              source={{ uri: r.image }}
              style={{ height: 180, borderRadius: 12 }}
            />
            <Text style={ui.heading}>{r.title}</Text>
            <Text style={ui.muted}>
              {r.readyInMinutes || "—"} min · Recipe inspiration
            </Text>
            {r.sourceUrl && /^https?:\/\//.test(r.sourceUrl) && (
              <Button
                title="View original recipe ↗"
                secondary
                onPress={() => {
                  void Linking.openURL(r.sourceUrl!).catch(() =>
                    setLinkError("Could not open recipe link."),
                  );
                }}
              />
            )}
          </View>
        ))
      ) : (
        <State empty="No recipes found. Try another ingredient." />
      )}
    </ScrollView>
  );
}
