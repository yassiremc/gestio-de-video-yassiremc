import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Image,
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
import { useMemo, useState } from 'react';

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

function extractYoutubeId(url) {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(normalized);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.split('/').filter(Boolean)[0] || null;
    if (parsed.hostname.includes('youtube.com')) return parsed.searchParams.get('v');
  } catch {
    return null;
  }
  return null;
}

const makeVideo = (videoId) => ({
  id: `${Date.now()}-${Math.random()}`,
  videoId,
  title: `YouTube video (${videoId})`,
  url: `https://www.youtube.com/watch?v=${videoId}`,
  embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`,
  thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
});

export default function App() {
  const [folders, setFolders] = useState([{ id: 'fav', name: 'Favorites', videos: [] }]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [newFolderInput, setNewFolderInput] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const totalVideos = useMemo(() => folders.reduce((acc, folder) => acc + folder.videos.length, 0), [folders]);
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) || null;

  const addFolder = () => {
    const trimmed = newFolderInput.trim();
    if (!trimmed) return;
    if (folders.some((folder) => folder.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Carpeta existente', 'Elige otro nombre.');
      return;
    }
    setFolders((prev) => [...prev, { id: `${Date.now()}`, name: trimmed, videos: [] }]);
    setNewFolderInput('');
  };

  const addVideoToFolder = (folderId) => {
    const trimmed = urlInput.trim();
    const videoId = extractYoutubeId(trimmed);
    if (!trimmed || !YOUTUBE_REGEX.test(trimmed) || !videoId) {
      Alert.alert('URL inválida', 'Pega un link válido de YouTube.');
      return;
    }

    setFolders((prev) => prev.map((folder) => (folder.id === folderId ? { ...folder, videos: [makeVideo(videoId), ...folder.videos] } : folder)));
    setUrlInput('');
    setShowAddModal(false);
  };

  const renameFolder = (folderId) => {
    const folder = folders.find((item) => item.id === folderId);
    if (!folder) return;
    Alert.prompt('Renombrar carpeta', 'Nuevo nombre:', (value) => {
      const nextName = value?.trim();
      if (!nextName) return;
      setFolders((prev) => prev.map((item) => (item.id === folderId ? { ...item, name: nextName } : item)));
    }, 'plain-text', folder.name);
  };

  const deleteFolder = (folderId) => {
    Alert.alert('Eliminar carpeta', 'Se borrará la carpeta con todos sus videos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
          if (selectedFolderId === folderId) setSelectedFolderId(null);
        },
      },
    ]);
  };

  const moveFolder = (folderId, direction) => {
    setFolders((prev) => {
      const index = prev.findIndex((f) => f.id === folderId);
      if (index < 0) return prev;
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const deleteVideo = (videoId) => {
    if (!selectedFolderId) return;
    setFolders((prev) => prev.map((folder) => (folder.id !== selectedFolderId ? folder : { ...folder, videos: folder.videos.filter((video) => video.id !== videoId) })));
  };

  const moveVideoToFolder = (videoId, targetFolderId) => {
    if (!selectedFolderId || selectedFolderId === targetFolderId) return;
    const sourceFolder = folders.find((f) => f.id === selectedFolderId);
    const video = sourceFolder?.videos.find((v) => v.id === videoId);
    if (!video) return;

    setFolders((prev) => prev.map((folder) => {
      if (folder.id === selectedFolderId) return { ...folder, videos: folder.videos.filter((v) => v.id !== videoId) };
      if (folder.id === targetFolderId) return { ...folder, videos: [video, ...folder.videos] };
      return folder;
    }));
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

      {!selectedFolder ? (
        <>
          <Text style={styles.sectionTitle}>Carpetas · {totalVideos} videos</Text>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {folders.map((folder, index) => (
              <Pressable key={folder.id} style={styles.listCard} onPress={() => setSelectedFolderId(folder.id)}>
                <Text style={styles.listName}>{folder.name}</Text>
                <Text style={styles.listMeta}>{folder.videos.length} videos</Text>
                <View style={styles.rowActions}>
                  <Pressable style={styles.smallAction} onPress={() => renameFolder(folder.id)}><Text style={styles.smallActionText}>Renombrar</Text></Pressable>
                  <Pressable style={styles.smallAction} onPress={() => moveFolder(folder.id, 'up')} disabled={index === 0}><Text style={styles.smallActionText}>↑</Text></Pressable>
                  <Pressable style={styles.smallAction} onPress={() => moveFolder(folder.id, 'down')} disabled={index === folders.length - 1}><Text style={styles.smallActionText}>↓</Text></Pressable>
                  <Pressable style={[styles.smallAction, styles.deleteAction]} onPress={() => deleteFolder(folder.id)}><Text style={styles.smallActionText}>Borrar</Text></Pressable>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : (
        <>
          <View style={styles.folderHeader}>
            <Pressable onPress={() => setSelectedFolderId(null)}><Text style={styles.backButton}>← Volver</Text></Pressable>
            <Text style={styles.sectionTitle}>{selectedFolder.name}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {selectedFolder.videos.length === 0 ? <Text style={styles.empty}>Esta carpeta está vacía</Text> : selectedFolder.videos.map((video) => (
              <View key={video.id} style={styles.videoRow}>
                <Pressable onPress={() => setSelectedVideo(video)}>
                  <Text style={styles.videoTitle}>{video.title}</Text>
                  <Image source={{ uri: video.thumbnail }} style={styles.videoThumb} resizeMode="cover" />
                  <Text style={styles.videoUrl} numberOfLines={1}>{video.url}</Text>
                </Pressable>
                <View style={styles.rowActions}>
                  {folders.filter((f) => f.id !== selectedFolderId).slice(0, 1).map((target) => (
                    <Pressable key={target.id} style={styles.smallAction} onPress={() => moveVideoToFolder(video.id, target.id)}><Text style={styles.smallActionText}>Mover a {target.name}</Text></Pressable>
                  ))}
                  <Pressable style={[styles.smallAction, styles.deleteAction]} onPress={() => deleteVideo(video.id)}><Text style={styles.smallActionText}>Borrar</Text></Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><View style={styles.modalBody}>
          <Text style={styles.modalTitle}>Pega URL y elige carpeta</Text>
          <TextInput style={styles.input} placeholder="https://youtu.be/..." placeholderTextColor="#9f9f9f" value={urlInput} onChangeText={setUrlInput} autoCapitalize="none" />
          <View style={styles.newListRow}>
            <TextInput style={[styles.input, styles.newListInput]} placeholder="Nueva carpeta" placeholderTextColor="#9f9f9f" value={newFolderInput} onChangeText={setNewFolderInput} />
            <Pressable style={styles.smallAction} onPress={addFolder}><Text style={styles.smallActionText}>Crear</Text></Pressable>
          </View>
          {folders.map((folder) => <Pressable key={folder.id} style={styles.modalListButton} onPress={() => addVideoToFolder(folder.id)}><Text style={styles.modalListText}>{folder.name}</Text></Pressable>)}
          <Pressable style={styles.cancelButton} onPress={() => setShowAddModal(false)}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        </View></View>
      </Modal>

      <Modal visible={!!selectedVideo} transparent animationType="slide" onRequestClose={() => setSelectedVideo(null)}>
        <View style={styles.modalOverlay}><View style={styles.videoModalBody}>
          <Text style={styles.modalTitle}>{selectedVideo?.title}</Text>
          <Image source={{ uri: selectedVideo?.thumbnail }} style={styles.playerThumb} resizeMode="cover" />
          <Text style={styles.videoUrl}>Pulsa en reproducir para abrir el video inmediatamente.</Text>
          <Pressable
            style={styles.playButton}
            onPress={() => {
              if (selectedVideo?.url) Linking.openURL(selectedVideo.url);
            }}
          >
            <Text style={styles.smallActionText}>▶ Reproducir</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={() => setSelectedVideo(null)}><Text style={styles.cancelText}>Cerrar</Text></Pressable>
        </View></View>
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
  folderHeader: { marginTop: 10 },
  backButton: { color: '#b9b9b9', fontWeight: '600' },
  scrollContent: { paddingBottom: 30 },
  listCard: { backgroundColor: '#232323', borderRadius: 18, padding: 14, marginBottom: 14 },
  listName: { color: '#fff', fontSize: 24, fontWeight: '700' },
  listMeta: { color: '#b8b8b8', marginBottom: 10 },
  empty: { color: '#8f8f8f', fontStyle: 'italic' },
  videoRow: { backgroundColor: '#3b3b3b', borderRadius: 12, padding: 10, marginBottom: 8 },
  videoTitle: { color: '#fff', fontWeight: '600' },
  videoUrl: { color: '#bdbdbd', fontSize: 12, marginTop: 6 },
  videoThumb: { width: '100%', height: 170, borderRadius: 10, marginTop: 8 },
  playerThumb: { width: '100%', height: 220, borderRadius: 12, marginVertical: 8 },
  playButton: { backgroundColor: '#7d22ff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start' },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  modalBody: { backgroundColor: '#525252', borderRadius: 18, padding: 16 },
  videoModalBody: { backgroundColor: '#252525', borderRadius: 18, padding: 16 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  input: { backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, marginBottom: 10, color: '#111' },
  newListRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  newListInput: { flex: 1, marginBottom: 0 },
  smallAction: { backgroundColor: '#7d22ff', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  deleteAction: { backgroundColor: '#962a2a' },
  smallActionText: { color: '#fff', fontWeight: '700' },
  modalListButton: { backgroundColor: '#efefef', borderRadius: 12, padding: 12, marginTop: 8 },
  modalListText: { fontSize: 18, fontWeight: '600' },
  cancelButton: { alignSelf: 'center', marginTop: 16 },
  cancelText: { color: '#fff' },
});
