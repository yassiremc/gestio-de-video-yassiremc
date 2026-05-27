import React from "react";
import { View, Text, StyleSheet, Linking, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { createYouTubeEmbedUrl } from "./youtube";

export default function VideoPlayerScreen() {
  const { url, videoId, title } = useRoute().params;

  if (!videoId) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.error}>No se encontro un ID de YouTube valido.</Text>
          <Pressable style={styles.linkButton} onPress={() => Linking.openURL(url)}>
            <Text style={styles.linkButtonText}>Open in browser</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title || "YouTube Video"}
        </Text>
        <View style={styles.playerWrapper}>
          <WebView
            source={{ uri: createYouTubeEmbedUrl(videoId) }}
            style={styles.webview}
            javaScriptEnabled
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 20 },
  title: {
    color: "#fff",
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  playerWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#111",
    borderRadius: 12,
    overflow: "hidden",
  },
  webview: { flex: 1 },
  error: { color: "#f87171", marginBottom: 16 },
  linkButton: {
    backgroundColor: "#7c3aed",
    padding: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  linkButtonText: { color: "#fff", fontWeight: "600" },
});
