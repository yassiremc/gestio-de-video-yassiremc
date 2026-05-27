import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
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
} from 'react-native';

const starterFolders = [
  { id: 'favourites', name: 'Favourites', cover: 'https://i.imgur.com/QM7Z7wA.png', videos: [] },
];

const isValidYoutubeUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
  return pattern.test(url.trim());
};

const getYoutubeId = (url) => {
  const trimmed = url.trim();
  const short = trimmed.match(/youtu\.be\/([^?&/]+)/i);
  if (short?.[1]) return short[1];

  const long = trimmed.match(/[?&]v=([^?&/]+)/i);
  if (long?.[1]) return long[1];

  const embed = trimmed.match(/embed\/([^?&/]+)/i);
  return embed?.[1] || '';
};

const folderCountLabel = (count) => `${count} Video${count === 1 ? '' : 's'}`;

export default function App() {
  const [folders, setFolders] = useState(starterFolders);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [pendingMoveVideo, setPendingMoveVideo] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [newFolderInput, setNewFolderInput] = useState('');

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) || null,
    [folders, selectedFolderId]
  );

  const openAddModal = () => {
    setUrlInput('');
    setNewFolderInput('');
    setIsAddModalVisible(true);
  };

  const createFolder = () => {
    const trimmed = newFolderInput.trim();
    if (!trimmed) return;

    if (folders.some((folder) => folder.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Folder already exists', 'Choose a different name.');
      return;
    }

    const newFolder = {
      id: `folder-${Date.now()}`,
      name: trimmed,
      cover: 'https://i.imgur.com/FiQ7vZx.png',
      videos: [],
    };

    setFolders((prev) => [...prev, newFolder]);
    setNewFolderInput('');
  };

  const addVideoToFolder = (folderId) => {
    if (!isValidYoutubeUrl(urlInput)) {
      Alert.alert('Invalid URL', 'Paste a valid YouTube URL.');
      return;
    }

    const id = getYoutubeId(urlInput);
    const video = {
      id: `video-${Date.now()}`,
      youtubeUrl: urlInput.trim(),
      youtubeId: id,
      title: id ? `YouTube video ${id}` : 'YouTube video',
      thumbnail: id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : 'https://i.imgur.com/FiQ7vZx.png',
      duration: '--:--',
    };

    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderId ? { ...folder, videos: [...folder.videos, video] } : folder
      )
    );

    setIsAddModalVisible(false);
    setUrlInput('');
  };

  const deleteFolder = (folderId) => {
    Alert.alert('Delete folder', 'Delete this folder and all videos inside?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
          if (selectedFolderId === folderId) setSelectedFolderId(null);
        },
      },
    ]);
  };

  const deleteVideo = (videoId) => {
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === selectedFolderId
          ? { ...folder, videos: folder.videos.filter((video) => video.id !== videoId) }
          : folder
      )
    );
  };

  const moveVideo = (targetFolderId) => {
    if (!pendingMoveVideo || !selectedFolderId || selectedFolderId === targetFolderId) {
      setIsMoveModalVisible(false);
      return;
    }

    setFolders((prev) => {
      const sourceFolder = prev.find((f) => f.id === selectedFolderId);
      const videoToMove = sourceFolder?.videos.find((video) => video.id === pendingMoveVideo);
      if (!videoToMove) return prev;

      return prev.map((folder) => {
        if (folder.id === selectedFolderId) {
          return { ...folder, videos: folder.videos.filter((video) => video.id !== pendingMoveVideo) };
        }
        if (folder.id === targetFolderId) {
          return { ...folder, videos: [...folder.videos, videoToMove] };
        }
        return folder;
      });
    });

    setPendingMoveVideo(null);
    setIsMoveModalVisible(false);
  };

  const renderFolderCard = ({ item }) => (
    <Pressable style={styles.folderCard} onPress={() => setSelectedFolderId(item.id)}>
      <Image source={{ uri: item.cover }} style={styles.folderCover} />
      <View style={styles.folderTextWrap}>
        <Text style={styles.folderTitle}>{item.name}</Text>
        <Text style={styles.folderSub}>{folderCountLabel(item.videos.length)}</Text>
      </View>
      <Pressable onPress={() => deleteFolder(item.id)} style={styles.smallIconBtn}>
        <Text style={styles.smallIconText}>✕</Text>
      </Pressable>
    </Pressable>
  );

  const renderVideoRow = ({ item }) => (
    <View style={styles.videoRow}>
      <Image source={{ uri: item.thumbnail }} style={styles.videoThumb} />
      <View style={styles.videoTextWrap}>
        <Text numberOfLines={1} style={styles.videoTitle}>{item.title}</Text>
        <Text style={styles.videoSub}>{item.duration}</Text>
      </View>
      <View style={styles.videoActions}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => {
            setPendingMoveVideo(item.id);
            setIsMoveModalVisible(true);
          }}
        >
          <Text style={styles.actionText}>⇄</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => deleteVideo(item.id)}>
          <Text style={styles.actionText}>🗑</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {!selectedFolder ? (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.header}>MyVideos</Text>
            <Pressable style={styles.addBtn} onPress={openAddModal}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.sectionTitle}>Lists</Text>

          <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.folderList}
            renderItem={renderFolderCard}
            ListEmptyComponent={<Text style={styles.emptyText}>THE LIST IS EMPTY. ADD YOUR FIRST VIDEO.</Text>}
          />
        </>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Pressable onPress={() => setSelectedFolderId(null)}>
              <Text style={styles.backBtn}>‹ Lists</Text>
            </Pressable>
            <Pressable style={styles.addBtn} onPress={openAddModal}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.selectedBanner}>
            <Image source={{ uri: selectedFolder.cover }} style={styles.selectedCover} />
            <Text style={styles.selectedTitle}>{selectedFolder.name}</Text>
            <Text style={styles.folderSub}>{folderCountLabel(selectedFolder.videos.length)}</Text>
          </View>

          <FlatList
            data={selectedFolder.videos}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.videoList}
            renderItem={renderVideoRow}
          />
        </>
      )}

      <Modal visible={isAddModalVisible} transparent animationType="fade" onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Paste the URL and choose the list</Text>
            <TextInput
              placeholder="https://youtu.be/..."
              placeholderTextColor="#aaa"
              value={urlInput}
              onChangeText={setUrlInput}
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Create new List"
              placeholderTextColor="#ddd"
              value={newFolderInput}
              onChangeText={setNewFolderInput}
              style={styles.input}
            />
            <Pressable onPress={createFolder} style={styles.createListBtn}>
              <Text style={styles.createListText}>Create list</Text>
            </Pressable>

            <FlatList
              data={folders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable style={styles.folderPick} onPress={() => addVideoToFolder(item.id)}>
                  <Text style={styles.folderPickText}>{item.name}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={isMoveModalVisible} transparent animationType="slide" onRequestClose={() => setIsMoveModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Move video to</Text>
            {folders
              .filter((folder) => folder.id !== selectedFolderId)
              .map((folder) => (
                <Pressable key={folder.id} style={styles.folderPick} onPress={() => moveVideo(folder.id)}>
                  <Text style={styles.folderPickText}>{folder.name}</Text>
                </Pressable>
              ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030303', paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  header: { color: '#8d16e6', fontSize: 42, fontWeight: '700' },
  addBtn: { backgroundColor: '#7410d8', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  sectionTitle: { color: '#ddd', fontSize: 30, fontWeight: '700', marginVertical: 10 },
  folderList: { paddingBottom: 20, gap: 14 },
  folderCard: { backgroundColor: '#2f2f35', borderRadius: 20, padding: 10, alignItems: 'center', flexDirection: 'row', borderWidth: 1, borderColor: '#494949' },
  folderCover: { width: 56, height: 56, borderRadius: 12, marginRight: 12 },
  folderTextWrap: { flex: 1 },
  folderTitle: { color: '#fff', fontSize: 28, fontWeight: '700' },
  folderSub: { color: '#bcbcbc', fontSize: 16 },
  smallIconBtn: { padding: 8 },
  smallIconText: { color: '#ddd', fontSize: 16 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 70, fontSize: 22, fontWeight: '700' },
  backBtn: { color: '#ddd', fontSize: 22, fontWeight: '600' },
  selectedBanner: { alignItems: 'center', backgroundColor: '#3f3f45', borderRadius: 20, padding: 14, marginVertical: 14 },
  selectedCover: { width: 110, height: 110, borderRadius: 10, marginBottom: 8 },
  selectedTitle: { color: '#8d16e6', fontSize: 32, fontWeight: '700' },
  videoList: { gap: 10, paddingBottom: 30 },
  videoRow: { backgroundColor: '#585858', borderRadius: 14, padding: 8, flexDirection: 'row', alignItems: 'center' },
  videoThumb: { width: 72, height: 56, borderRadius: 6, marginRight: 10 },
  videoTextWrap: { flex: 1 },
  videoTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  videoSub: { color: '#c6c6c6' },
  videoActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: '#2a2a2a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  actionText: { color: '#fff', fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 22 },
  modalCard: { backgroundColor: '#6a6a6a', borderRadius: 24, padding: 18, maxHeight: '80%' },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: '#2f2f2f', color: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  createListBtn: { alignSelf: 'flex-start', backgroundColor: '#7410d8', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  createListText: { color: '#fff', fontWeight: '700' },
  folderPick: { backgroundColor: '#ddd', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8 },
  folderPickText: { color: '#171717', fontSize: 18, fontWeight: '700' },
});
