import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { extractYouTubeVideoId } from "./youtube";

export default function AddUrlScreen() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const navigation = useNavigation();

  const handleContinue = () => {
    const videoId = extractYouTubeVideoId(url);

    if (!videoId) {
      setError("Pega un link valido de YouTube.");
      return;
    }

    setError("");
    navigation.navigate("SelectList", { url: url.trim(), videoId });
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Paste YouTube URL</Text>

          <TextInput
            style={styles.input}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor="#666"
            value={url}
            onChangeText={(text) => {
              setUrl(text);
              if (error) {
                setError("");
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>CHOOSE LIST</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { color: "#fff", fontSize: 18, marginBottom: 12, marginTop: 4 },
  input: {
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
  },
  error: { color: "#f87171", marginTop: 8, marginBottom: 16 },
  button: {
    backgroundColor: "#7c3aed",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
});
