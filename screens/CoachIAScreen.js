import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/context/ThemeContext';
import { SPACING, BORDER_RADIUS, getShadow } from '../src/constants/theme';

const API_URL = 'https://fincoachback.onrender.com/api';
const CONV_ID_KEY = 'chatConversationId';

const SUGGESTIONS = ['Mon solde actuel', 'Mes dépenses ce mois', 'Conseils épargne'];

// ── Animated background pulse ─────────────────────────────

const AIPulse = ({ colors }) => {
  const opacity = useRef(new Animated.Value(0.6)).current;
  const scale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1,   duration: 1500, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 1500, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.aiPulse,
        { backgroundColor: `${colors.primary}18`, opacity, transform: [{ scale }] },
      ]}
    />
  );
};

// ── Thinking dots ─────────────────────────────────────────

const ThinkingDots = ({ colors }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeDotAnim = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(840 - delay),
        ])
      );
    const a1 = makeDotAnim(dot1, 0);
    const a2 = makeDotAnim(dot2, 200);
    const a3 = makeDotAnim(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.thinkingRow}>
      {[dot1, dot2, dot3].map((anim, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { backgroundColor: colors.primary, transform: [{ scale: anim }], opacity: anim }]}
        />
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
        {message.time ? (
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{message.time}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.userMsgWrap}>
      <View style={[styles.userBubble, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30` }]}>
        <Text style={[styles.msgText, { color: colors.primary }]}>{message.contenu}</Text>
      </View>
      {message.time ? (
        <Text style={[styles.timeText, { color: colors.textSecondary, textAlign: 'right' }]}>{message.time}</Text>
      ) : null}
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
    <View style={[
      styles.inputBar,
      { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
      shadow.glow(colors.primary),
    ]}>
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

// ── Header ─────────────────────────────────────────────────

const CoachHeader = ({ colors, onClearPress }) => (
  <View style={[styles.header, { backgroundColor: `${colors.surface}CC`, borderBottomColor: colors.borderLight }]}>
    <View style={styles.headerLeft}>
      <View style={[styles.avatarWrap, { borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}12` }]}>
        <MaterialCommunityIcons name="robot-outline" size={18} color={colors.primary} />
      </View>
      <Text style={[styles.headerTitle, { color: colors.primary }]}>Coach IA</Text>
    </View>
    <TouchableOpacity
      style={[styles.headerBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}
      onPress={onClearPress}
      activeOpacity={0.7}
    >
      <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  </View>
);

// ── Helpers SSE ────────────────────────────────────────────

/**
 * Parse les lignes SSE reçues par XHR et retourne les text_delta trouvés.
 */
function parseSseChunk(chunk) {
  const deltas = [];
  let hasTextStart = false;

  const lines = chunk.split('\n');
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const raw = line.slice(6).trim();
    if (!raw || raw === '[DONE]') continue;

    try {
      const event = JSON.parse(raw);
      if (event.type === 'text_start') hasTextStart = true;
      if (event.type === 'text_delta' && typeof event.value === 'string') {
        deltas.push(event.value);
      }
    } catch { /* ligne partielle ou malformée */ }
  }

  return { hasTextStart, deltas };
}

// ── Screen ─────────────────────────────────────────────────

export const CoachIAScreen = ({ navigation }) => {
  const { colors, isDark }              = useTheme();
  const [messages,      setMessages]    = useState([]);
  const [inputText,     setInputText]   = useState('');
  const [isThinking,    setIsThinking]  = useState(false);
  const [isSending,     setIsSending]   = useState(false);
  const [conversationId, setConvId]     = useState(null);
  const scrollRef                       = useRef(null);
  const xhrRef                          = useRef(null);

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

  // ── Récupère le dernier conversation_id depuis le serveur ─
  const fetchLatestConvId = useCallback(async (token) => {
    try {
      const res  = await fetch(`${API_URL}/chat/conversation/latest`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      if (json.conversation_id) {
        await saveConvId(json.conversation_id);
        return json.conversation_id;
      }
    } catch { /* silencieux */ }
    return null;
  }, [saveConvId]);

  // ── Chargement de l'historique ────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const storedId = await AsyncStorage.getItem(CONV_ID_KEY);

      if (!storedId) {
        setMessages([welcomeMsg()]);
        return;
      }

      setConvId(storedId);

      const res  = await fetch(`${API_URL}/chat/conversations/${storedId}/messages`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();

      if (json.success && json.data?.length > 0) {
        setMessages(json.data.map((m, i) => ({
          id:         `hist-${i}`,
          expediteur: m.role === 'user' ? 'utilisateur' : 'agent',
          contenu:    m.content,
          time:       '',
        })));
      } else {
        setMessages([welcomeMsg()]);
      }
    } catch {
      setMessages([welcomeMsg()]);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Efface la conversation ────────────────────────────────
  const handleClear = useCallback(async () => {
    if (xhrRef.current) { xhrRef.current.abort(); xhrRef.current = null; }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const storedId = await AsyncStorage.getItem(CONV_ID_KEY);
      if (storedId) {
        await fetch(`${API_URL}/chat/conversations/${storedId}`, {
          method:  'DELETE',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
      }
    } catch { /* silencieux */ }

    await saveConvId(null);
    setIsThinking(false);
    setIsSending(false);
    setMessages([{
      id: 'cleared', expediteur: 'agent', time: getTime(),
      contenu: "Historique effacé. Comment puis-je vous aider ?",
    }]);
  }, [saveConvId]);

  // ── Envoi du message avec streaming SSE via XHR ───────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    // Affiche le message utilisateur immédiatement
    setMessages(prev => [...prev, {
      id: Date.now().toString(), expediteur: 'utilisateur',
      contenu: text, time: getTime(),
    }]);
    setInputText('');
    setIsSending(true);
    setIsThinking(true);

    const token        = await AsyncStorage.getItem('userToken');
    const currentConvId = await AsyncStorage.getItem(CONV_ID_KEY);
    const streamMsgId  = `stream-${Date.now()}`;
    let   fullContent  = '';
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

      // Crée la bulle de streaming dès le premier text_start ou text_delta
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

      // Finalise la bulle de streaming
      setMessages(prev => prev.map(m =>
        m.id === streamMsgId ? { ...m, isStreaming: false } : m
      ));

      // Si aucun texte n'est arrivé (outils seulement sans réponse)
      if (!streamingStarted) {
        setMessages(prev => [...prev, {
          id: `fallback-${Date.now()}`, expediteur: 'agent',
          contenu: "J'ai analysé vos données. Avez-vous d'autres questions ?",
          time: getTime(),
        }]);
      }

      // Met à jour le conversation_id
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

    xhr.onabort = () => {
      setIsThinking(false);
      setIsSending(false);
    };

    xhr.send(JSON.stringify({
      message:         text,
      conversation_id: currentConvId || undefined,
    }));
  }, [inputText, isSending, fetchLatestConvId]);

  // ── Auto-scroll ───────────────────────────────────────────
  const handleContentSizeChange = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AIPulse colors={colors} />

      <CoachHeader colors={colors} onClearPress={handleClear} />

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
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },

  aiPulse: {
    position: 'absolute',
    width: 288, height: 288, borderRadius: 144,
    top: '50%', left: '50%',
    marginLeft: -144, marginTop: -144,
    zIndex: 0,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX,
    height: 56, borderBottomWidth: 1, zIndex: 10,
  },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.stackMd },
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
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingVertical: SPACING.stackLg,
    gap: SPACING.stackLg,
  },

  coachMsgWrap: { alignItems: 'flex-start', maxWidth: '85%' },
  glassBubble: {
    padding: SPACING.stackMd,
    borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1,
  },
  userMsgWrap: { alignSelf: 'flex-end', alignItems: 'flex-end', maxWidth: '85%' },
  userBubble: {
    padding: SPACING.stackMd,
    borderRadius: 16, borderTopRightRadius: 4, borderWidth: 1,
  },

  msgText:  { fontSize: 14, lineHeight: 20 },
  timeText: { marginTop: 4, fontSize: 11, opacity: 0.6 },

  thinkingIndicator: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.stackMd, paddingVertical: SPACING.stackSm,
    borderRadius: 20, borderWidth: 1, gap: SPACING.stackSm,
  },
  thinkingRow: { flexDirection: 'row', gap: 4 },
  dot:         { width: 6, height: 6, borderRadius: 3 },
  thinkingText: { fontSize: 11, fontWeight: '500', marginLeft: 4 },

  bottomArea: {
    paddingHorizontal: SPACING.marginX,
    paddingBottom: SPACING.stackMd,
    paddingTop: SPACING.stackSm,
    gap: SPACING.stackSm, zIndex: 10,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.stackSm },
  chip: {
    paddingHorizontal: SPACING.stackMd, paddingVertical: SPACING.stackSm,
    borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '500' },

  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: 4, gap: SPACING.stackSm, minHeight: 52,
  },
  input:   { flex: 1, fontSize: 14, paddingVertical: 12, maxHeight: 100 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
});

export default CoachIAScreen;
