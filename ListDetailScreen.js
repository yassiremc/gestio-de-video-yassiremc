import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { VideoContext } from "./App";

export default function ListDetailScreen() {
  const { lists } = useContext(VideoContext);
  const route = useRoute();
  const navigation = useNavigation();

  const list = lists.find((l) => l.id === route.params.listId);

  if (!list) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emptyTitle}>List not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{list.name}</Text>

        {list.videos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No videos yet</Text>
            <Text style={styles.emptySubtitle}>Add your first video from +</Text>
          </View>
        ) : (
          <FlatList
            data={list.videos}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={styles.videoItem}
                onPress={() =>
                  navigation.navigate("Player", {
                    url: item.url,
                    videoId: item.videoId,
                    title: item.title,
                  })
                }
              >
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} />

                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.videoSubtitle} numberOfLines={1}>
                    {item.author || "YouTube"}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  title: { color: "#fff", fontSize: 22, marginBottom: 20, fontWeight: "700", marginTop: 4 },
  emptyBox: {
    marginTop: 80,
    alignItems: "center",
    opacity: 0.7,
  },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  emptySubtitle: { color: "#777", marginTop: 8 },
  listContent: { paddingBottom: 30 },
  videoItem: {
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    flexDirection: "row",
  },
  thumb: {
    width: 120,
    height: 78,
    backgroundColor: "#111",
  },
  videoInfo: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  videoTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  videoSubtitle: { color: "#aaa", marginTop: 6, fontSize: 12 },
});
