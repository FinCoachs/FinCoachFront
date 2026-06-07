import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { SPACING, BORDER_RADIUS, getShadow } from '../src/constants/theme';

// ── Mock data ─────────────────────────────────────────────

const INITIAL_MESSAGES = [
  {
    id: '1',
    role: 'coach',
    text: "Bonjour ! Je viens d'analyser vos dépenses de la semaine au Marché Dantokpa. Vous avez optimisé votre budget transport de 12% par rapport au mois dernier. Souhaitez-vous que j'ajuste votre objectif d'épargne ?",
    time: '09:41',
  },
  {
    id: '2',
    role: 'user',
    text: 'C\'est une excellente nouvelle ! Oui, place les économies dans mon coffre "Études".',
    time: '09:42',
  },
];

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
    const makeDotAnim = (dot, initialDelay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(initialDelay),
          Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(1400 - initialDelay - 560),
        ])
      );

    const a1 = makeDotAnim(dot1, 0);
    const a2 = makeDotAnim(dot2, 160);
    const a3 = makeDotAnim(dot3, 320);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.thinkingRow}>
      {[dot1, dot2, dot3].map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: colors.primary, transform: [{ scale: anim }], opacity: anim },
          ]}
        />
      ))}
    </View>
  );
};

// ── Message bubble ─────────────────────────────────────────

const MessageBubble = ({ message, colors, isDark }) => {
  const shadow   = getShadow(isDark);
  const isCoach  = message.role === 'coach';

  if (isCoach) {
    return (
      <View style={styles.coachMsgWrap}>
        <View style={[
          styles.glassBubble,
          { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
          shadow.sm,
        ]}>
          <Text style={[styles.msgText, { color: colors.onSurface }]}>{message.text}</Text>
        </View>
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>{message.time}</Text>
      </View>
    );
  }

  return (
    <View style={styles.userMsgWrap}>
      <View style={[
        styles.userBubble,
        { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30` },
      ]}>
        <Text style={[styles.msgText, { color: colors.primary }]}>{message.text}</Text>
      </View>
      <Text style={[styles.timeText, { color: colors.textSecondary, textAlign: 'right' }]}>
        {message.time}
      </Text>
    </View>
  );
};

// ── Thinking indicator ─────────────────────────────────────

const ThinkingIndicator = ({ colors }) => (
  <View style={[
    styles.thinkingIndicator,
    { backgroundColor: colors.glassBg, borderColor: colors.glassBorder },
  ]}>
    <MaterialCommunityIcons name="robot-outline" size={18} color={colors.primary} />
    <ThinkingDots colors={colors} />
    <Text style={[styles.thinkingText, { color: `${colors.primary}CC` }]}>
      Le Coach réfléchit...
    </Text>
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

const InputBar = ({ value, onChange, onSend, colors, isDark }) => {
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
      />
      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: colors.primary }]}
        onPress={onSend}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-up" size={18} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
};

// ── Header ─────────────────────────────────────────────────

const CoachHeader = ({ colors, onHistoryPress }) => (
  <View style={[styles.header, { backgroundColor: `${colors.surface}CC`, borderBottomColor: colors.borderLight }]}>
    <View style={styles.headerLeft}>
      <View style={[styles.avatarWrap, { borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}12` }]}>
        <Text style={[styles.avatarText, { color: colors.primary }]}>A</Text>
      </View>
      <Text style={[styles.headerTitle, { color: colors.primary }]}>Coach IA</Text>
    </View>
    <TouchableOpacity
      style={[styles.historyBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}
      onPress={onHistoryPress}
      activeOpacity={0.7}
    >
      <Ionicons name="time-outline" size={20} color={colors.primary} />
    </TouchableOpacity>
  </View>
);

// ── Screen ─────────────────────────────────────────────────

export const CoachIAScreen = ({ navigation }) => {
  const { colors, isDark }        = useTheme();
  const [messages, setMessages]   = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(true);
  const scrollRef                 = useRef(null);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text, time: now }]);
    setInputText('');
    setIsThinking(true);

    setTimeout(() => {
      setIsThinking(false);
      const replyTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'coach',
          text: "J'ai bien pris en compte votre demande. Je vais analyser vos finances et vous préparer une réponse personnalisée.",
          time: replyTime,
        },
      ]);
    }, 2000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <AIPulse colors={colors} />

      <CoachHeader colors={colors} onHistoryPress={() => navigation?.navigate('Recommandations')} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
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
    height: 56,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.stackMd },
  avatarWrap: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:  { fontSize: 14, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  historyBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
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
    borderRadius: 16, borderTopLeftRadius: 4,
    borderWidth: 1,
  },

  userMsgWrap: { alignSelf: 'flex-end', alignItems: 'flex-end', maxWidth: '85%' },
  userBubble: {
    padding: SPACING.stackMd,
    borderRadius: 16, borderTopRightRadius: 4,
    borderWidth: 1,
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
  dot: { width: 6, height: 6, borderRadius: 3 },
  thinkingText: { fontSize: 11, fontWeight: '500', marginLeft: 4 },

  bottomArea: {
    paddingHorizontal: SPACING.marginX,
    paddingBottom: SPACING.stackMd,
    paddingTop: SPACING.stackSm,
    gap: SPACING.stackSm,
    zIndex: 10,
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
    paddingHorizontal: 4, gap: SPACING.stackSm,
    minHeight: 52,
  },
  input: {
    flex: 1, fontSize: 14,
    paddingVertical: 12, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
});

export default CoachIAScreen;
