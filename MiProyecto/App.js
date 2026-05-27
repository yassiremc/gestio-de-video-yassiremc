import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system';

const STORAGE_FILE = `${FileSystem.documentDirectory}myvideos-data.json`;
const PLACEHOLDER_COVER = 'https://i.imgur.com/FiQ7vZx.png';

const defaultFolders = [
  { id: 'favourites', name: 'Favourites', cover: 'https://i.imgur.com/QM7Z7wA.png', videos: [] },
];

const isValidYoutubeUrl = (url) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(url.trim());

const getYoutubeId = (url) => {
  const cleaned = url.trim();
  const short = cleaned.match(/youtu\.be\/([^?&/]+)/i);
  if (short?.[1]) return short[1];
  const long = cleaned.match(/[?&]v=([^?&/]+)/i);
  if (long?.[1]) return long[1];
  const embed = cleaned.match(/embed\/([^?&/]+)/i);
  return embed?.[1] || '';
};

const toCount = (n) => `${n} Video${n === 1 ? '' : 's'}`;

export default function App() {
  const [folders, setFolders] = useState(defaultFolders);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [videoToMove, setVideoToMove] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [newFolderInput, setNewFolderInput] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = await FileSystem.readAsStringAsync(STORAGE_FILE);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) setFolders(parsed);
        }
      } catch (error) {
        console.warn('Storage load error', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
FileSystem.writeAsStringAsync(STORAGE_FILE, JSON.stringify(folders)).catch(() => {});
  }, [folders]);

  const activeFolder = useMemo(() => folders.find((f) => f.id === activeFolderId) || null, [folders, activeFolderId]);

  const createFolder = () => {
    const name = newFolderInput.trim();
    if (!name) return;
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('List already exists', 'Use a different name.');
      return;
    }

    setFolders((prev) => [...prev, { id: `folder-${Date.now()}`, name, cover: PLACEHOLDER_COVER, videos: [] }]);
    setNewFolderInput('');
  };

  const addVideo = (folderId) => {
    if (!isValidYoutubeUrl(urlInput)) {
      Alert.alert('The url is not valid', 'Paste a valid YouTube URL.');
      return;
    }

    const youtubeId = getYoutubeId(urlInput);
    const newVideo = {
      id: `video-${Date.now()}`,
      youtubeUrl: urlInput.trim(),
      youtubeId,
      title: youtubeId ? `Video ${youtubeId}` : 'YouTube Video',
      channel: 'YouTube',
      duration: '--:--',
      thumbnail: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : PLACEHOLDER_COVER,
    };

    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, videos: [...f.videos, newVideo] } : f)));
    setUrlInput('');
    setAddOpen(false);
  };

  const deleteFolder = (folderId) => {
    Alert.alert('Delete list', 'Delete this list and all its videos?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setFolders((prev) => prev.filter((f) => f.id !== folderId));
          if (activeFolderId === folderId) setActiveFolderId(null);
        },
      },
    ]);
  };

  const deleteVideo = (videoId) => {
    setFolders((prev) => prev.map((f) => (f.id === activeFolderId ? { ...f, videos: f.videos.filter((v) => v.id !== videoId) } : f)));
  };

  const moveVideo = (targetFolderId) => {
    if (!videoToMove || !activeFolderId) return;

    setFolders((prev) => {
      const source = prev.find((f) => f.id === activeFolderId);
      const video = source?.videos.find((v) => v.id === videoToMove);
      if (!video) return prev;

      return prev.map((f) => {
        if (f.id === activeFolderId) return { ...f, videos: f.videos.filter((v) => v.id !== videoToMove) };
        if (f.id === targetFolderId) return { ...f, videos: [...f.videos, video] };
        return f;
      });
    });

    setMoveOpen(false);
    setVideoToMove(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {!activeFolder ? (
        <>
          <View style={styles.topRow}>
            <Text style={styles.title}>MyVideos</Text>
            <Pressable style={styles.plusBtn} onPress={() => setAddOpen(true)}><Text style={styles.plusText}>+</Text></Pressable>
          </View>
          <Text style={styles.subtitle}>Lists</Text>

          <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.folderList}
            renderItem={({ item }) => (
              <Pressable style={styles.folderRow} onPress={() => setActiveFolderId(item.id)}>
                <Image source={{ uri: item.cover }} style={styles.folderIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.folderName}>{item.name}</Text>
                  <Text style={styles.folderCount}>{toCount(item.videos.length)}</Text>
                </View>
                <Pressable onPress={() => deleteFolder(item.id)} style={styles.deleteSmall}><Text style={styles.deleteSmallText}>✕</Text></Pressable>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>THE LIST IS EMPTY{`\n`}ADD YOUR FIRST VIDEO</Text>}
          />
        </>
      ) : (
        <>
          <View style={styles.topRow}>
            <Pressable onPress={() => setActiveFolderId(null)}><Text style={styles.back}>‹ Lists</Text></Pressable>
            <Pressable style={styles.plusBtn} onPress={() => setAddOpen(true)}><Text style={styles.plusText}>+</Text></Pressable>
          </View>

          <View style={styles.hero}>
            <Image source={{ uri: activeFolder.cover }} style={styles.heroImage} />
            <Text style={styles.heroTitle}>{activeFolder.name}</Text>
            <Text style={styles.folderCount}>{toCount(activeFolder.videos.length)}</Text>
          </View>

          <FlatList
            data={activeFolder.videos}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.videoList}
            renderItem={({ item }) => (
              <Pressable style={styles.videoRow} onPress={() => Linking.openURL(item.youtubeUrl)}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.videoTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.videoMeta} numberOfLines={1}>{item.channel}</Text>
                </View>
                <View style={styles.actions}>
                  <Pressable style={styles.actionBtn} onPress={() => { setVideoToMove(item.id); setMoveOpen(true); }}><Text style={styles.actionTxt}>⇄</Text></Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => deleteVideo(item.id)}><Text style={styles.actionTxt}>🗑</Text></Pressable>
                </View>
              </Pressable>
            )}
          />
        </>
      )}

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Paste the URL and choose the list</Text>
            <TextInput style={styles.input} placeholder="https://youtu.be/....." placeholderTextColor="#d0d0d0" value={urlInput} onChangeText={setUrlInput} autoCapitalize="none" />
            <TextInput style={styles.inputLight} placeholder="Create new List" placeholderTextColor="#4f4f4f" value={newFolderInput} onChangeText={setNewFolderInput} />
            <Pressable style={styles.createBtn} onPress={createFolder}><Text style={styles.createText}>Create</Text></Pressable>
            <FlatList
              data={folders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <Pressable style={styles.pick} onPress={() => addVideo(item.id)}><Text style={styles.pickText}>{item.name}</Text></Pressable>}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={moveOpen} transparent animationType="slide" onRequestClose={() => setMoveOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Move video to</Text>
            {folders.filter((f) => f.id !== activeFolderId).map((f) => (
              <Pressable key={f.id} style={styles.pick} onPress={() => moveVideo(f.id)}><Text style={styles.pickText}>{f.name}</Text></Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030303', paddingHorizontal: 16 },
  topRow: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#8d16e6', fontSize: 44, fontWeight: '700' },
  plusBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#7714da', alignItems: 'center', justifyContent: 'center' },
  plusText: { color: '#fff', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#ddd', fontSize: 33, fontWeight: '700', marginVertical: 10 },
  folderList: { gap: 12, paddingBottom: 20 },
  folderRow: { backgroundColor: '#2f2f35', borderColor: '#545454', borderWidth: 1, borderRadius: 22, padding: 10, flexDirection: 'row', alignItems: 'center' },
  folderIcon: { width: 56, height: 56, borderRadius: 12, marginRight: 10 },
  folderName: { color: '#fff', fontSize: 33, fontWeight: '700' },
  folderCount: { color: '#c5c5c5', fontSize: 17 },
  deleteSmall: { padding: 6 },
  deleteSmallText: { color: '#fff' },
  empty: { color: '#3f3f3f', textAlign: 'center', fontSize: 33, fontWeight: '700', marginTop: 90 },
  back: { color: '#f0f0f0', fontSize: 24, fontWeight: '600' },
  hero: { borderRadius: 18, backgroundColor: '#3f3f45', alignItems: 'center', padding: 10, marginVertical: 12 },
  heroImage: { width: 102, height: 102, borderRadius: 8, marginBottom: 8 },
  heroTitle: { color: '#8d16e6', fontSize: 30, fontWeight: '700' },
  videoList: { gap: 8, paddingBottom: 20 },
  videoRow: { borderRadius: 14, backgroundColor: '#636363', padding: 8, flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 73, height: 56, borderRadius: 6, marginRight: 8 },
  videoTitle: { color: '#fff', fontWeight: '600', fontSize: 15 },
  videoMeta: { color: '#e5e5e5', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { backgroundColor: '#2f2f2f', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 7 },
  actionTxt: { color: '#fff' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 22 },
  modal: { backgroundColor: '#686868', borderRadius: 26, padding: 14, maxHeight: '80%' },
  modalTitle: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#5b5b5b', borderRadius: 18, color: '#fff', paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8 },
  inputLight: { backgroundColor: '#f1f1f1', borderRadius: 18, color: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 11, marginBottom: 8 },
  createBtn: { alignSelf: 'flex-end', backgroundColor: '#7714da', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8 },
  createText: { color: '#fff', fontWeight: '700' },
  pick: { backgroundColor: '#ebebeb', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  pickText: { fontSize: 34, color: '#222', fontWeight: '700' },
});
