import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  Modal, FlatList, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/context/ThemeContext';
import { SPACING, getShadow } from '../src/constants/theme';

const API_URL = 'https://fincoachback.onrender.com/api';
const CONV_ID_KEY = 'chatConversationId';

const SUGGESTIONS = ['Mon solde actuel', 'Mes dépenses ce mois', 'Conseils épargne'];

// ── Helpers ────────────────────────────────────────────────

function parseSseChunk(chunk) {
  const deltas = [];
  let hasTextStart = false;
  for (const line of chunk.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const raw = line.slice(6).trim();
    if (!raw || raw === '[DONE]') continue;
    try {
      const event = JSON.parse(raw);
      if (event.type === 'text_start') hasTextStart = true;
      if (event.type === 'text_delta' && typeof event.delta === 'string') deltas.push(event.delta);
    } catch { /* ligne partielle */ }
  }
  return { hasTextStart, deltas };
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now   = new Date();
  const diffMs = now - date;
  const diffH  = diffMs / (1000 * 60 * 60);
  if (diffH < 1)  return 'À l\'instant';
  if (diffH < 24) return `Il y a ${Math.floor(diffH)}h`;
  const diffD = diffMs / (1000 * 60 * 60 * 24);
  if (diffD < 7)  return `Il y a ${Math.floor(diffD)}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ── Animated background pulse ─────────────────────────────

const AIPulse = ({ colors }) => {
  const opacity = useRef(new Animated.Value(0.6)).current;
  const scale   = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1,   duration: 1500, useNativeDriver: true }),
        Animated.timing(scale,   { toValue: 1.1, duration: 1500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
        Animated.timing(scale,   { toValue: 1,   duration: 1500, useNativeDriver: true }),
      ]),
    ]));
    anim.start();
    return () => anim.stop();
  }, [opacity, scale]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.aiPulse, { backgroundColor: `${colors.primary}18`, opacity, transform: [{ scale }] }]}
    />
  );
};

// ── Thinking dots ─────────────────────────────────────────

const ThinkingDots = ({ colors }) => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.delay(840 - i * 200),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={styles.thinkingRow}>
      {dots.map((anim, i) => (
        <Animated.View key={i} style={[styles.dot, { backgroundColor: colors.primary, transform: [{ scale: anim }], opacity: anim }]} />
      ))}
    </View>
  );
};

// ── Message bubble ─────────────────────────────────────────

const MessageBubble = ({ message, colors, isDark }) => {
  const shadow  = getShadow(isDark);
  const isCoach = message.expediteur === 'agent';
  if (isCoach) {
    return (
      <View style={styles.coachMsgWrap}>
        <View style={[styles.glassBubble, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }, shadow.sm]}>
          <Text style={[styles.msgText, { color: colors.onSurface }]}>{message.contenu}</Text>
          {message.isStreaming && <ThinkingDots colors={colors} />}
        </View>
        {!!message.time && <Text style={[styles.timeText, { color: colors.textSecondary }]}>{message.time}</Text>}
      </View>
    );
  }
  return (
    <View style={styles.userMsgWrap}>
      <View style={[styles.userBubble, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30` }]}>
        <Text style={[styles.msgText, { color: colors.primary }]}>{message.contenu}</Text>
      </View>
      {!!message.time && <Text style={[styles.timeText, { color: colors.textSecondary, textAlign: 'right' }]}>{message.time}</Text>}
    </View>
  );
};

// ── Thinking indicator ─────────────────────────────────────

const ThinkingIndicator = ({ colors }) => (
  <View style={[styles.thinkingIndicator, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
    <MaterialCommunityIcons name="robot-outline" size={18} color={colors.primary} />
    <ThinkingDots colors={colors} />
    <Text style={[styles.thinkingText, { color: `${colors.primary}CC` }]}>Le Coach réfléchit...</Text>
  </View>
);

// ── Suggestion chips ───────────────────────────────────────

const SuggestionChips = ({ onPress, colors }) => (
  <View style={styles.chipsRow}>
    {SUGGESTIONS.map((s) => (
      <TouchableOpacity
        key={s}
        style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
        onPress={() => onPress(s)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, { color: colors.textSecondary }]}>{s}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Input bar ─────────────────────────────────────────────

const InputBar = ({ value, onChange, onSend, disabled, colors, isDark }) => {
  const shadow = getShadow(isDark);
  return (
    <View style={[styles.inputBar, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }, shadow.glow(colors.primary)]}>
      <TextInput
        style={[styles.input, { color: colors.textPrimary }]}
        placeholder="Posez une question à votre Coach..."
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChange}
        multiline
        returnKeyType="send"
        onSubmitEditing={onSend}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: disabled ? colors.border : colors.primary }]}
        onPress={onSend}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-up" size={18} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
};

// ── Conversation History Modal ─────────────────────────────

const HistoryModal = ({ visible, conversations, currentId, colors, isDark, onSelect, onNew, onDelete, onClose }) => {
  const shadow = getShadow(isDark);

  const renderItem = ({ item }) => {
    const isActive = item.id === currentId;
    return (
      <View style={[
        styles.convRow,
        { backgroundColor: isActive ? `${colors.primary}15` : colors.surface, borderColor: isActive ? `${colors.primary}40` : colors.borderLight },
      ]}>
        <TouchableOpacity style={styles.convMain} onPress={() => onSelect(item)} activeOpacity={0.7}>
          <View style={[styles.convIcon, { backgroundColor: `${colors.primary}15` }]}>
            <MaterialCommunityIcons name="chat-outline" size={16} color={colors.primary} />
          </View>
          <View style={styles.convInfo}>
            <Text style={[styles.convTitle, { color: isActive ? colors.primary : colors.textPrimary }]} numberOfLines={1}>
              {item.title || 'Conversation'}
            </Text>
            <Text style={[styles.convDate, { color: colors.textSecondary }]}>
              {formatRelativeDate(item.updated_at)}
            </Text>
          </View>
          {isActive && (
            <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.convDelete} onPress={() => onDelete(item.id)} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>

          {/* Handle */}
          <View style={[styles.modalHandle, { backgroundColor: colors.borderLight }]} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Historique</Text>
            <TouchableOpacity
              style={[styles.newConvBtn, { backgroundColor: colors.primary }]}
              onPress={onNew}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color={colors.onPrimary} />
              <Text style={[styles.newConvText, { color: colors.onPrimary }]}>Nouvelle</Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          {conversations.length === 0 ? (
            <View style={styles.emptyHistory}>
              <MaterialCommunityIcons name="chat-off-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyHistoryText, { color: colors.textSecondary }]}>
                Aucune conversation pour l'instant
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.convList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── Header ─────────────────────────────────────────────────

const CoachHeader = ({ colors, onHistoryPress, onNewPress }) => (
  <View style={[styles.header, { backgroundColor: `${colors.surface}CC`, borderBottomColor: colors.borderLight }]}>
    <View style={styles.headerLeft}>
      <View style={[styles.avatarWrap, { borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}12` }]}>
        <MaterialCommunityIcons name="robot-outline" size={18} color={colors.primary} />
      </View>
      <Text style={[styles.headerTitle, { color: colors.primary }]}>Coach IA</Text>
    </View>
    <View style={styles.headerActions}>
      <TouchableOpacity
        style={[styles.headerBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}
        onPress={onHistoryPress}
        activeOpacity={0.7}
      >
        <Ionicons name="time-outline" size={18} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.headerBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}
        onPress={onNewPress}
        activeOpacity={0.7}
      >
        <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  </View>
);

// ── Screen ─────────────────────────────────────────────────

export const CoachIAScreen = ({ navigation }) => {
  const { colors, isDark }                = useTheme();
  const [messages,       setMessages]     = useState([]);
  const [inputText,      setInputText]    = useState('');
  const [isThinking,     setIsThinking]   = useState(false);
  const [isSending,      setIsSending]    = useState(false);
  const [conversationId, setConvId]       = useState(null);
  const [conversations,  setConversations] = useState([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const scrollRef = useRef(null);
  const xhrRef    = useRef(null);

  const getTime = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const welcomeMsg = () => ({
    id: 'welcome', expediteur: 'agent', time: getTime(),
    contenu: "Bonjour ! Je suis FinCoach, votre assistant financier personnel. Comment puis-je vous aider aujourd'hui ?",
  });

  // ── Persiste conversation_id ──────────────────────────────
  const saveConvId = useCallback(async (id) => {
    setConvId(id);
    if (id) await AsyncStorage.setItem(CONV_ID_KEY, id);
    else     await AsyncStorage.removeItem(CONV_ID_KEY);
  }, []);

  // ── Charge la liste des conversations ────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res   = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json  = await res.json();
      if (json.success) setConversations(json.data);
    } catch { /* silencieux */ }
  }, []);

  // ── Charge les messages d'une conversation ───────────────
  const loadMessages = useCallback(async (convId) => {
    if (!convId) { setMessages([welcomeMsg()]); return; }
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res   = await fetch(`${API_URL}/chat/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json  = await res.json();
      if (json.success && json.data?.length > 0) {
        setMessages(json.data.map((m, i) => ({
          id: `hist-${i}`,
          expediteur: m.role === 'user' ? 'utilisateur' : 'agent',
          contenu: m.content,
          time: '',
        })));
      } else {
        setMessages([welcomeMsg()]);
      }
    } catch {
      setMessages([welcomeMsg()]);
    }
  }, []);

  // ── Init au montage ───────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const storedId = await AsyncStorage.getItem(CONV_ID_KEY);
      if (storedId) setConvId(storedId);
      await Promise.all([loadMessages(storedId), loadConversations()]);
    };
    init();
  }, []);

  // ── Rafraîchit le conversation_id après envoi ─────────────
  const fetchLatestConvId = useCallback(async (token) => {
    try {
      const res  = await fetch(`${API_URL}/chat/conversation/latest`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      if (json.conversation_id) {
        await saveConvId(json.conversation_id);
        await loadConversations();
        return json.conversation_id;
      }
    } catch { /* silencieux */ }
    return null;
  }, [saveConvId, loadConversations]);

  // ── Nouvelle conversation ──────────────────────────────────
  const handleNew = useCallback(async () => {
    if (xhrRef.current) { xhrRef.current.abort(); xhrRef.current = null; }
    await saveConvId(null);
    setIsThinking(false);
    setIsSending(false);
    setMessages([welcomeMsg()]);
    setHistoryVisible(false);
  }, [saveConvId]);

  // ── Sélection d'une conversation depuis l'historique ──────
  const handleSelectConversation = useCallback(async (conv) => {
    if (xhrRef.current) { xhrRef.current.abort(); xhrRef.current = null; }
    setIsThinking(false);
    setIsSending(false);
    setHistoryVisible(false);
    await saveConvId(conv.id);
    await loadMessages(conv.id);
  }, [saveConvId, loadMessages]);

  // ── Suppression d'une conversation ────────────────────────
  const handleDeleteConversation = useCallback(async (convId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_URL}/chat/conversations/${convId}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
    } catch { /* silencieux */ }

    setConversations(prev => prev.filter(c => c.id !== convId));

    // Si c'est la conversation active, on repart à zéro
    if (convId === conversationId) {
      await saveConvId(null);
      setMessages([welcomeMsg()]);
      setHistoryVisible(false);
    }
  }, [conversationId, saveConvId]);

  // ── Envoi du message avec streaming SSE ──────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(), expediteur: 'utilisateur',
      contenu: text, time: getTime(),
    }]);
    setInputText('');
    setIsSending(true);
    setIsThinking(true);

    const token         = await AsyncStorage.getItem('userToken');
    const currentConvId = await AsyncStorage.getItem(CONV_ID_KEY);
    const streamMsgId   = `stream-${Date.now()}`;
    let   fullContent   = '';
    let   streamingStarted = false;

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', `${API_URL}/chat/messages`);
    xhr.setRequestHeader('Authorization',  `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type',   'application/json');
    xhr.setRequestHeader('Accept',         'text/event-stream');

    let processedLength = 0;

    xhr.onprogress = () => {
      const newChunk = xhr.responseText.slice(processedLength);
      processedLength = xhr.responseText.length;
      const { hasTextStart, deltas } = parseSseChunk(newChunk);

      if ((hasTextStart || deltas.length > 0) && !streamingStarted) {
        streamingStarted = true;
        setIsThinking(false);
        setMessages(prev => [...prev, {
          id: streamMsgId, expediteur: 'agent',
          contenu: '', time: getTime(), isStreaming: true,
        }]);
      }

      if (deltas.length > 0) {
        fullContent += deltas.join('');
        setMessages(prev => prev.map(m =>
          m.id === streamMsgId ? { ...m, contenu: fullContent } : m
        ));
      }
    };

    xhr.onload = async () => {
      setIsThinking(false);
      setIsSending(false);
      setMessages(prev => prev.map(m =>
        m.id === streamMsgId ? { ...m, isStreaming: false } : m
      ));
      if (!streamingStarted) {
        setMessages(prev => [...prev, {
          id: `fallback-${Date.now()}`, expediteur: 'agent', time: getTime(),
          contenu: "J'ai analysé vos données. Avez-vous d'autres questions ?",
        }]);
      }
      await fetchLatestConvId(token);
    };

    xhr.onerror = () => {
      setIsThinking(false);
      setIsSending(false);
      if (!streamingStarted) {
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`, expediteur: 'agent', time: getTime(),
          contenu: "Impossible de joindre le serveur. Vérifiez votre connexion.",
        }]);
      }
    };

    xhr.onabort = () => { setIsThinking(false); setIsSending(false); };

    xhr.send(JSON.stringify({
      message:         text,
      conversation_id: currentConvId || undefined,
    }));
  }, [inputText, isSending, fetchLatestConvId]);

  const handleContentSizeChange = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AIPulse colors={colors} />

      <CoachHeader
        colors={colors}
        onHistoryPress={() => { loadConversations(); setHistoryVisible(true); }}
        onNewPress={handleNew}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={handleContentSizeChange}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} colors={colors} isDark={isDark} />
          ))}
          {isThinking && <ThinkingIndicator colors={colors} />}
        </ScrollView>

        <View style={styles.bottomArea}>
          <SuggestionChips onPress={setInputText} colors={colors} />
          <InputBar
            value={inputText}
            onChange={setInputText}
            onSend={handleSend}
            disabled={isSending}
            colors={colors}
            isDark={isDark}
          />
        </View>
      </KeyboardAvoidingView>

      <HistoryModal
        visible={historyVisible}
        conversations={conversations}
        currentId={conversationId}
        colors={colors}
        isDark={isDark}
        onSelect={handleSelectConversation}
        onNew={handleNew}
        onDelete={handleDeleteConversation}
        onClose={() => setHistoryVisible(false)}
      />
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },

  aiPulse: {
    position: 'absolute', width: 288, height: 288, borderRadius: 144,
    top: '50%', left: '50%', marginLeft: -144, marginTop: -144, zIndex: 0,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX, height: 56, borderBottomWidth: 1, zIndex: 10,
  },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.stackMd },
  headerActions: { flexDirection: 'row', gap: SPACING.stackSm },
  avatarWrap: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },

  scroll:        { flex: 1, zIndex: 1 },
  scrollContent: { paddingHorizontal: SPACING.marginX, paddingVertical: SPACING.stackLg, gap: SPACING.stackLg },

  coachMsgWrap: { alignItems: 'flex-start', maxWidth: '85%' },
  glassBubble:  { padding: SPACING.stackMd, borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1 },
  userMsgWrap:  { alignSelf: 'flex-end', alignItems: 'flex-end', maxWidth: '85%' },
  userBubble:   { padding: SPACING.stackMd, borderRadius: 16, borderTopRightRadius: 4, borderWidth: 1 },

  msgText:  { fontSize: 14, lineHeight: 20 },
  timeText: { marginTop: 4, fontSize: 11, opacity: 0.6 },

  thinkingIndicator: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: SPACING.stackMd, paddingVertical: SPACING.stackSm,
    borderRadius: 20, borderWidth: 1, gap: SPACING.stackSm,
  },
  thinkingRow:  { flexDirection: 'row', gap: 4 },
  dot:          { width: 6, height: 6, borderRadius: 3 },
  thinkingText: { fontSize: 11, fontWeight: '500', marginLeft: 4 },

  bottomArea: {
    paddingHorizontal: SPACING.marginX, paddingBottom: SPACING.stackMd,
    paddingTop: SPACING.stackSm, gap: SPACING.stackSm, zIndex: 10,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.stackSm },
  chip: { paddingHorizontal: SPACING.stackMd, paddingVertical: SPACING.stackSm, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '500' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 4, gap: SPACING.stackSm, minHeight: 52,
  },
  input:   { flex: 1, fontSize: 14, paddingVertical: 12, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // ── Modal historique ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, maxHeight: '75%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX, paddingVertical: SPACING.stackMd,
  },
  modalTitle:   { fontSize: 18, fontWeight: '700' },
  newConvBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  newConvText:  { fontSize: 13, fontWeight: '600' },

  convList: { paddingHorizontal: SPACING.marginX, gap: SPACING.stackSm, paddingBottom: 8 },
  convRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  convMain:   { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  convIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  convInfo:   { flex: 1 },
  convTitle:  { fontSize: 14, fontWeight: '600' },
  convDate:   { fontSize: 11, marginTop: 2 },
  activeDot:  { width: 8, height: 8, borderRadius: 4 },
  convDelete: { padding: 12 },

  emptyHistory: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyHistoryText: { fontSize: 14 },
});

export default CoachIAScreen;
