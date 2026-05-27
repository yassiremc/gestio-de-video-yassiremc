import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { VideoContext } from "./App";
import { createYouTubeThumbnailUrl, tryLoadVideoMeta } from "./youtube";

export default function SelectListScreen() {
  const { lists, setLists } = useContext(VideoContext);
  const [newListName, setNewListName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { url, videoId } = route.params;

  const createList = () => {
    const name = newListName.trim();
    if (!name) {
      return;
    }

    const alreadyExists = lists.some(
      (list) => list.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      setError("Ya existe una lista con ese nombre.");
      return;
    }

    setLists((prev) => [
      ...prev,
      { id: Date.now().toString(), name, videos: [] },
    ]);

    setNewListName("");
    setError("");
  };

  const addVideoToList = async (listId) => {
    if (saving) {
      return;
    }

    setSaving(true);

    const meta = await tryLoadVideoMeta(url, videoId);
    const video = {
      id: Date.now().toString(),
      url,
      videoId,
      title: meta?.title || `Video ${videoId}`,
      thumbnail: meta?.thumbnail || createYouTubeThumbnailUrl(videoId),
      author: meta?.author || "",
      createdAt: Date.now(),
    };

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              videos: [video, ...list.videos],
            }
          : list
      )
    );

    navigation.reset({
      index: 0,
      routes: [{ name: "MainMenu" }],
    });
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title} numberOfLines={2}>Choose a list</Text>
        <Text style={styles.subtitle}>Paste the URL and choose the list</Text>

        <View style={styles.createRow}>
          <TextInput
            style={styles.input}
            value={newListName}
            onChangeText={(text) => {
              setNewListName(text);
              if (error) {
                setError("");
              }
            }}
            placeholder="Create new list"
            placeholderTextColor="#666"
          />
          <Pressable style={styles.createButton} onPress={createList}>
            <Text style={styles.createButtonText}>Create</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {lists.map((list) => (
          <Pressable
            key={list.id}
            style={styles.item}
            onPress={() => addVideoToList(list.id)}
          >
            <Text style={styles.itemText} numberOfLines={1}>{list.name}</Text>
            <Text style={styles.itemCount}>{list.videos.length} Videos</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { color: "#fff", marginBottom: 6, fontSize: 20, fontWeight: "600", marginTop: 4 },
  subtitle: { color: "#aaa", marginBottom: 16 },
  createRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  input: {
    flex: 1,
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    paddingHorizontal: 12,
    color: "#fff",
  },
  createButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  createButtonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#f87171", marginBottom: 12 },
  item: {
    backgroundColor: "#1f1f1f",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemText: { color: "#fff", fontWeight: "600" },
  itemCount: { color: "#aaa", fontSize: 12, marginTop: 2 },
});
