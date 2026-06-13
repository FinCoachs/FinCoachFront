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

const SUGGESTIONS = ['Calculer mon reste à vivre', 'Rapport mensuel', 'Conseils MoMo'];

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
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>{message.time}</Text>
      </View>
    );
  }

  return (
    <View style={styles.userMsgWrap}>
      <View style={[styles.userBubble, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30` }]}>
        <Text style={[styles.msgText, { color: colors.primary }]}>{message.contenu}</Text>
      </View>
      <Text style={[styles.timeText, { color: colors.textSecondary, textAlign: 'right' }]}>{message.time}</Text>
    </View>
  );
};

// ── Thinking indicator (avant que le stream démarre) ───────

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

const CoachHeader = ({ colors, onHistoryPress, onClearPress }) => (
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
        <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.headerBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}
        onPress={onClearPress}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  </View>
);

// ── Screen ─────────────────────────────────────────────────

export const CoachIAScreen = ({ navigation }) => {
  const { colors, isDark }          = useTheme();
  const [messages,   setMessages]   = useState([]);
  const [inputText,  setInputText]  = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSending,  setIsSending]  = useState(false);
  const scrollRef                   = useRef(null);

  const getTime = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const welcomeMsg = () => ({
    id:         'welcome',
    expediteur: 'agent',
    contenu:    "Bonjour ! Je suis FinCoach, votre assistant financier personnel. Comment puis-je vous aider aujourd'hui ?",
    time:       getTime(),
  });

  const formatMessages = (raw) =>
    raw.map((m) => ({
      ...m,
      time: new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }));

  // Chargement de l'historique
  const loadHistory = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res   = await fetch(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        setMessages(formatMessages(json.data));
      } else {
        setMessages([welcomeMsg()]);
      }
    } catch {
      setMessages([welcomeMsg()]);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Efface l'historique
  const handleClear = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_URL}/messages`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* silencieux */ }
    setMessages([{
      id:         'cleared',
      expediteur: 'agent',
      contenu:    "Historique effacé. Comment puis-je vous aider ?",
      time:       getTime(),
    }]);
  }, []);

  // Envoi du message et attente de la réponse JSON
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setMessages(prev => [...prev, {
      id:         Date.now().toString(),
      expediteur: 'utilisateur',
      contenu:    text,
      time:       getTime(),
    }]);
    setInputText('');
    setIsSending(true);
    setIsThinking(true);

    try {
      const token = await AsyncStorage.getItem('userToken');

      const res = await fetch(`${API_URL}/messages`, {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept:         'application/json',
        },
        body: JSON.stringify({ contenu: text }),
      });

      const json = await res.json();

      setIsThinking(false);

      if (json.success && json.data) {
        setMessages(prev => [...prev, {
          id:         json.data.id,
          expediteur: 'agent',
          contenu:    json.data.contenu,
          time:       getTime(),
        }]);
      } else {
        throw new Error('Réponse invalide');
      }
    } catch {
      setIsThinking(false);
      setMessages(prev => [...prev, {
        id:         `err-${Date.now()}`,
        expediteur: 'agent',
        contenu:    "Je rencontre une difficulté technique. Veuillez réessayer.",
        time:       getTime(),
      }]);
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AIPulse colors={colors} />

      <CoachHeader
        colors={colors}
        onHistoryPress={() => navigation?.navigate('Recommandations')}
        onClearPress={handleClear}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
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
