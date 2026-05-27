import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { VideoContext } from "./App";

export default function MainMenu() {
  const { lists, ready } = useContext(VideoContext);
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            MyVideos
          </Text>
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate("AddUrl")}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Lists</Text>

        {!ready ? <Text style={styles.loading}>Loading...</Text> : null}

        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>THE LIST IS EMPTY</Text>
              <Text style={styles.emptySubtitle}>ADD YOUR FIRST VIDEO</Text>
              <Pressable
                style={styles.ctaButton}
                onPress={() => navigation.navigate("AddUrl")}
              >
                <Text style={styles.ctaButtonText}>Go Up</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.listItem}
              onPress={() =>
                navigation.navigate("ListDetail", { listId: item.id })
              }
            >
              <View style={styles.iconContainer}>
                <Ionicons name="heart" size={26} color="#fff" />
              </View>

              <View style={styles.listTextWrap}>
                <Text style={styles.listTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.listSubtitle}>{item.videos.length} Videos</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#a855f7", fontSize: 28, fontWeight: "bold", flexShrink: 1, paddingRight: 8 },
  addButton: {
    backgroundColor: "#7c3aed",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: { color: "#fff", marginTop: 24, opacity: 0.8, marginBottom: 8 },
  loading: { color: "#666", marginBottom: 8 },
  listContent: { paddingBottom: 24 },
  listItem: {
    flexDirection: "row",
    backgroundColor: "#1f1f1f",
    padding: 14,
    borderRadius: 16,
    marginTop: 14,
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "#a855f7",
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  listTextWrap: { flex: 1 },
  listTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  listSubtitle: { color: "#aaa", fontSize: 12 },
  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyTitle: { color: "#4b5563", fontWeight: "700", letterSpacing: 1 },
  emptySubtitle: { color: "#374151", marginTop: 4, marginBottom: 16 },
  ctaButton: {
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ctaButtonText: { color: "#2563eb", fontWeight: "600" },
});
