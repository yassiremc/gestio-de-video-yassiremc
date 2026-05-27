import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

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

function ytThumb(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function ytEmbed(videoId) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`;
}

export default function App() {
  const [lists, setLists] = useState([{ id: 'fav', name: 'Favorites', videos: [] }]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [newListInput, setNewListInput] = useState('');
  const [renameListId, setRenameListId] = useState(null);
  const [renameListInput, setRenameListInput] = useState('');
  const [activeVideoId, setActiveVideoId] = useState(null);

  const selectedList = lists.find((list) => list.id === selectedListId) || null;
  const activeVideo = selectedList?.videos.find((video) => video.id === activeVideoId) || null;

  const totalVideos = useMemo(() => lists.reduce((acc, list) => acc + list.videos.length, 0), [lists]);

  const addList = () => {
    const trimmed = newListInput.trim();
    if (!trimmed) return;

    const exists = lists.some((list) => list.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      Alert.alert('List already exists', 'Choose another name.');
      return;
    }

    setLists((prev) => [...prev, { id: `${Date.now()}`, name: trimmed, videos: [] }]);
    setNewListInput('');
  };

  const deleteList = (listId) => {
    Alert.alert('Delete list', 'This will remove the folder and all videos.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setLists((prev) => prev.filter((list) => list.id !== listId));
          if (selectedListId === listId) setSelectedListId(null);
        },
      },
    ]);
  };

  const moveList = (listId, direction) => {
    setLists((prev) => {
      const idx = prev.findIndex((list) => list.id === listId);
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  const renameList = () => {
    const trimmed = renameListInput.trim();
    if (!renameListId || !trimmed) return;

    setLists((prev) => prev.map((list) => (list.id === renameListId ? { ...list, name: trimmed } : list)));
    setRenameListId(null);
    setRenameListInput('');
  };

  const addVideoToList = (listId) => {
    const trimmed = urlInput.trim();
    const videoId = extractYoutubeId(trimmed);

    if (!trimmed || !YOUTUBE_REGEX.test(trimmed) || !videoId) {
      Alert.alert('Invalid URL', 'Paste a valid YouTube URL first.');
      return;
    }

    const video = {
      id: `${Date.now()}`,
      videoId,
      title: `Video ${videoId}`,
      thumbnail: ytThumb(videoId),
      embedUrl: ytEmbed(videoId),
    };

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, videos: [video, ...list.videos] } : list,
      ),
    );

    setUrlInput('');
    setShowAddModal(false);
  };

  const deleteVideo = (videoId) => {
    if (!selectedListId) return;
    setLists((prev) =>
      prev.map((list) =>
        list.id === selectedListId
          ? { ...list, videos: list.videos.filter((video) => video.id !== videoId) }
          : list,
      ),
    );
  };

  const moveVideoToOtherList = (videoId, targetListId) => {
    if (!selectedListId || selectedListId === targetListId) return;

    const sourceList = lists.find((list) => list.id === selectedListId);
    const video = sourceList?.videos.find((item) => item.id === videoId);
    if (!video) return;

    setLists((prev) =>
      prev.map((list) => {
        if (list.id === selectedListId) {
          return { ...list, videos: list.videos.filter((item) => item.id !== videoId) };
        }
        if (list.id === targetListId) {
          return { ...list, videos: [video, ...list.videos] };
        }
        return list;
      }),
    );
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

      {!selectedList && (
        <>
          <Text style={styles.sectionTitle}>Lists · {totalVideos} videos</Text>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {lists.map((list, index) => (
              <Pressable key={list.id} style={styles.listCard} onPress={() => setSelectedListId(list.id)}>
                <Text style={styles.listName}>{list.name}</Text>
                <Text style={styles.listMeta}>{list.videos.length} videos</Text>
                <View style={styles.rowActions}>
                  <Pressable onPress={() => moveList(list.id, 'up')}><Text style={styles.action}>↑</Text></Pressable>
                  <Pressable onPress={() => moveList(list.id, 'down')}><Text style={styles.action}>↓</Text></Pressable>
                  <Pressable onPress={() => { setRenameListId(list.id); setRenameListInput(list.name); }}><Text style={styles.action}>Rename</Text></Pressable>
                  <Pressable onPress={() => deleteList(list.id)}><Text style={[styles.action, styles.delete]}>Delete</Text></Pressable>
                </View>
                <Text style={styles.openHint}>Tap card to open folder #{index + 1}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {selectedList && (
        <>
          <View style={styles.folderHeader}>
            <Pressable onPress={() => setSelectedListId(null)}><Text style={styles.back}>← Back</Text></Pressable>
            <Text style={styles.folderTitle}>{selectedList.name}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {selectedList.videos.map((video) => (
              <View key={video.id} style={styles.videoCard}>
                <Pressable onPress={() => setActiveVideoId(video.id)}>
                  <View style={styles.thumbBlock}>
                    <Text style={styles.thumbLabel}>Miniatura</Text>
                    <Text numberOfLines={1} style={styles.thumbUrl}>{video.thumbnail}</Text>
                  </View>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                </Pressable>

                <View style={styles.rowActions}>
                  <Pressable onPress={() => deleteVideo(video.id)}><Text style={[styles.action, styles.delete]}>Delete</Text></Pressable>
                  {lists
                    .filter((list) => list.id !== selectedListId)
                    .map((list) => (
                      <Pressable key={list.id} onPress={() => moveVideoToOtherList(video.id, list.id)}>
                        <Text style={styles.action}>Move → {list.name}</Text>
                      </Pressable>
                    ))}
                </View>
              </View>
            ))}
            {selectedList.videos.length === 0 && <Text style={styles.empty}>No videos in this folder.</Text>}
          </ScrollView>
        </>
      )}

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Paste URL and choose list</Text>
            <TextInput style={styles.input} placeholder="https://youtu.be/..." value={urlInput} onChangeText={setUrlInput} autoCapitalize="none" />
            <View style={styles.newListRow}>
              <TextInput style={[styles.input, styles.newListInput]} placeholder="Create new list" value={newListInput} onChangeText={setNewListInput} />
              <Pressable style={styles.smallAction} onPress={addList}><Text style={styles.smallActionText}>Create</Text></Pressable>
            </View>
            {lists.map((list) => (
              <Pressable key={list.id} style={styles.modalListButton} onPress={() => addVideoToList(list.id)}><Text style={styles.modalListText}>{list.name}</Text></Pressable>
            ))}
            <Pressable style={styles.cancelButton} onPress={() => setShowAddModal(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(renameListId)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Rename folder</Text>
            <TextInput style={styles.input} value={renameListInput} onChangeText={setRenameListInput} />
            <Pressable style={styles.modalListButton} onPress={renameList}><Text style={styles.modalListText}>Save</Text></Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setRenameListId(null)}><Text style={styles.cancelText}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(activeVideo)} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <Pressable onPress={() => setActiveVideoId(null)} style={{ padding: 12 }}><Text style={{ color: '#fff' }}>Close</Text></Pressable>
          {activeVideo && <WebView source={{ uri: activeVideo.embedUrl }} allowsFullscreenVideo />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040404', paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#7d22ff', fontSize: 40, fontWeight: '800' },
  addButton: { backgroundColor: '#7d22ff', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#fff', fontSize: 30, fontWeight: '800' },
  sectionTitle: { color: '#f2f2f2', marginTop: 16, marginBottom: 10, fontSize: 22, fontWeight: '700' },
  scrollContent: { paddingBottom: 20 },
  listCard: { backgroundColor: '#232323', borderRadius: 18, padding: 14, marginBottom: 14 },
  listName: { color: '#fff', fontSize: 24, fontWeight: '700' },
  listMeta: { color: '#b8b8b8', marginBottom: 8 },
  openHint: { color: '#9b9b9b' },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  action: { color: '#c9a6ff', fontWeight: '700' },
  delete: { color: '#ff7f7f' },
  folderHeader: { marginTop: 16, marginBottom: 8 },
  back: { color: '#c9a6ff', marginBottom: 8 },
  folderTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  videoCard: { backgroundColor: '#2f2f2f', borderRadius: 14, padding: 12, marginBottom: 10 },
  thumbBlock: { backgroundColor: '#4c4c4c', borderRadius: 10, padding: 8 },
  thumbLabel: { color: '#fff', fontWeight: '700' },
  thumbUrl: { color: '#ccc', fontSize: 12 },
  videoTitle: { color: '#fff', fontSize: 16, marginTop: 8 },
  empty: { color: '#8f8f8f', fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  modalBody: { backgroundColor: '#525252', borderRadius: 18, padding: 16 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  input: { backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, marginBottom: 10 },
  newListRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  newListInput: { flex: 1, marginBottom: 0 },
  smallAction: { backgroundColor: '#7d22ff', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  smallActionText: { color: '#fff', fontWeight: '700' },
  modalListButton: { backgroundColor: '#efefef', borderRadius: 12, padding: 12, marginTop: 8 },
  modalListText: { fontSize: 18, fontWeight: '600' },
  cancelButton: { alignSelf: 'center', marginTop: 16 },
  cancelText: { color: '#fff' },
});
