import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;


const STORAGE_KEY = 'myvideos_lists_v1';
const DEFAULT_LISTS = [{ id: 'fav', name: 'Favorites', videos: [] }];

let asyncStorageModule = null;

function getAsyncStorage() {
  if (asyncStorageModule !== null) return asyncStorageModule;
  try {
    asyncStorageModule = require('@react-native-async-storage/async-storage').default;
  } catch {
    asyncStorageModule = undefined;
  }
  return asyncStorageModule;
}

async function readListsFromStorage() {
  const AsyncStorage = getAsyncStorage();
  if (AsyncStorage) {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  if (typeof globalThis.localStorage !== 'undefined') {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  return null;
}

async function writeListsToStorage(lists) {
  const serialized = JSON.stringify(lists);
  const AsyncStorage = getAsyncStorage();
  if (AsyncStorage) {
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
    return;
  }

  if (typeof globalThis.localStorage !== 'undefined') {
    globalThis.localStorage.setItem(STORAGE_KEY, serialized);
  }
}

function extractYoutubeId(url) {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(normalized);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
}

export default function App() {
  const [lists, setLists] = useState(DEFAULT_LISTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [newListInput, setNewListInput] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSavedLists = async () => {
      try {
        const savedLists = await readListsFromStorage();
        if (isMounted && savedLists && Array.isArray(savedLists)) {
          setLists(savedLists);
        }
      } catch {
        Alert.alert('Storage error', 'Could not load your saved folders.');
      } finally {
        if (isMounted) setIsReady(true);
      }
    };

    loadSavedLists();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const persistLists = async () => {
      try {
        await writeListsToStorage(lists);
      } catch {
        Alert.alert('Storage error', 'Could not save your folders.');
      }
    };

    persistLists();
  }, [lists, isReady]);

  const totalVideos = useMemo(
    () => lists.reduce((acc, list) => acc + list.videos.length, 0),
    [lists],
  );

  const addList = () => {
    const trimmed = newListInput.trim();
    if (!trimmed) return;
    const exists = lists.some((list) => list.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      Alert.alert('List already exists', 'Choose another list name.');
      return;
    }
    setLists((prev) => [...prev, { id: `${Date.now()}`, name: trimmed, videos: [] }]);
    setNewListInput('');
  };

  const addVideoToList = (listId) => {
    const trimmed = urlInput.trim();
    const videoId = extractYoutubeId(trimmed);

    if (!trimmed || !YOUTUBE_REGEX.test(trimmed) || !videoId) {
      Alert.alert('Invalid URL', 'Paste a valid YouTube link first.');
      return;
    }

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              videos: [
                {
                  id: `${Date.now()}`,
                  title: `YouTube video (${videoId})`,
                  url: watchUrl,
                },
                ...list.videos,
              ],
            }
          : list,
      ),
    );
    setUrlInput('');
    setShowAddModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>MyVideos</Text>
        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>＋</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Lists · {totalVideos} videos</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {lists.map((list) => (
          <View key={list.id} style={styles.listCard}>
            <Text style={styles.listName}>{list.name}</Text>
            <Text style={styles.listMeta}>{list.videos.length} videos</Text>
            {list.videos.length === 0 ? (
              <Text style={styles.empty}>This list is empty</Text>
            ) : (
              list.videos.map((video) => (
                <Pressable key={video.id} style={styles.videoRow} onPress={() => Linking.openURL(video.url)}>
                  <Text style={styles.videoTitle} numberOfLines={1}>{video.title}</Text>
                  <Text style={styles.videoUrl} numberOfLines={1}>{video.url}</Text>
                </Pressable>
              ))
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Paste URL and choose list</Text>
            <TextInput
              style={styles.input}
              placeholder="https://youtu.be/..."
              placeholderTextColor="#9f9f9f"
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
            />

            <View style={styles.newListRow}>
              <TextInput
                style={[styles.input, styles.newListInput]}
                placeholder="Create new list"
                placeholderTextColor="#9f9f9f"
                value={newListInput}
                onChangeText={setNewListInput}
              />
              <Pressable style={styles.smallAction} onPress={addList}>
                <Text style={styles.smallActionText}>Create</Text>
              </Pressable>
            </View>

            {lists.map((list) => (
              <Pressable key={list.id} style={styles.modalListButton} onPress={() => addVideoToList(list.id)}>
                <Text style={styles.modalListText}>{list.name}</Text>
              </Pressable>
            ))}

            <Pressable style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040404', paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#7d22ff', fontSize: 40, fontWeight: '800' },
  addButton: { backgroundColor: '#7d22ff', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: -2 },
  sectionTitle: { color: '#f2f2f2', marginTop: 20, marginBottom: 10, fontSize: 22, fontWeight: '700' },
  scrollContent: { paddingBottom: 30 },
  listCard: { backgroundColor: '#232323', borderRadius: 18, padding: 14, marginBottom: 14 },
  listName: { color: '#fff', fontSize: 24, fontWeight: '700' },
  listMeta: { color: '#b8b8b8', marginBottom: 10 },
  empty: { color: '#8f8f8f', fontStyle: 'italic' },
  videoRow: { backgroundColor: '#3b3b3b', borderRadius: 12, padding: 10, marginBottom: 8 },
  videoTitle: { color: '#fff', fontWeight: '600' },
  videoUrl: { color: '#bdbdbd', fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  modalBody: { backgroundColor: '#525252', borderRadius: 18, padding: 16 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  input: { backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, marginBottom: 10, color: '#111' },
  newListRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  newListInput: { flex: 1, marginBottom: 0 },
  smallAction: { backgroundColor: '#7d22ff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  smallActionText: { color: '#fff', fontWeight: '700' },
  modalListButton: { backgroundColor: '#efefef', borderRadius: 12, padding: 12, marginTop: 8 },
  modalListText: { fontSize: 18, fontWeight: '600' },
  cancelButton: { alignSelf: 'center', marginTop: 16 },
  cancelText: { color: '#fff' },
});
