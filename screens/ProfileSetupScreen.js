import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useUser } from '../src/context/UserContext';
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert } from 'react-native';
import { Input } from '../src/components';

// ── Données du formulaire ─────────────────────

const STATUTES = [
  { id: 'etudiant',   label: 'Étudiant',              icon: 'school-outline'        },
  { id: 'salarie',    label: 'Salarié',                icon: 'briefcase-outline'     },
  { id: 'freelance',  label: 'Freelance / Auto-entrepreneur', icon: 'laptop-outline' },
  { id: 'autre',      label: 'Autre',                  icon: 'person-outline'        },
];

const INCOME_RANGES = [
  { id: 'lt50',    label: '< 50 000',      sub: 'FCFA / mois' },
  { id: '50_150',  label: '50k – 150k',    sub: 'FCFA / mois' },
  { id: '150_350', label: '150k – 350k',   sub: 'FCFA / mois' },
  { id: '350_700', label: '350k – 700k',   sub: 'FCFA / mois' },
  { id: 'gt700',   label: '> 700 000',     sub: 'FCFA / mois' },
];

const ACCOUNT_TYPES = [
  { id: 'boa',    label: 'BOA Bénin',   icon: 'business-outline',       color: '#003366' },
  { id: 'momo',   label: 'MTN MoMo',   icon: 'phone-portrait-outline',  color: '#FFC300' },
  { id: 'moov',   label: 'Moov Money', icon: 'phone-portrait-outline',  color: '#E87722' },
  { id: 'cash',   label: 'Espèces',    icon: 'cash-outline',            color: '#2E7D32' },
];

const GOALS = [
  { id: 'save',    label: 'Épargner',              icon: 'trending-up-outline'   },
  { id: 'track',   label: 'Suivre mes dépenses',   icon: 'analytics-outline'     },
  { id: 'budget',  label: 'Gérer mes budgets',     icon: 'wallet-outline'        },
  { id: 'invest',  label: 'Investir',              icon: 'bar-chart-outline'     },
];

const HOUSEHOLDS = [
  { id: 'single',  label: 'Seul(e)',           icon: 'person-outline'         },
  { id: 'couple',  label: 'En couple',         icon: 'people-outline'         },
  { id: 'family',  label: 'Avec enfants',      icon: 'home-outline'           },
  { id: 'extended',label: 'Famille élargie',   icon: 'people-circle-outline'  },
];

// ── Composants réutilisables ──────────────────

const SectionHeader = ({ step, title, subtitle }) => {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 4, marginBottom: 4 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: colors.primary }}>
        ÉTAPE {step}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.onSurface }}>{title}</Text>
      {subtitle && (
        <Text style={{ fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 18 }}>{subtitle}</Text>
      )}
    </View>
  );
};

// Chip simple (sélection unique)
const Chip = ({ label, icon, active, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        chipStyles.chip,
        { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}14` : colors.inputBg },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && <Ionicons name={icon} size={16} color={active ? colors.primary : colors.textSecondary} />}
      <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? colors.primary : colors.textSecondary }}>
        {label}
      </Text>
      {active && <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 'auto' }} />}
    </TouchableOpacity>
  );
};

// Chip multi-sélection (comptes)
const AccountChip = ({ item, active, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        chipStyles.accountChip,
        { borderColor: active ? item.color : colors.border, backgroundColor: active ? `${item.color}14` : colors.inputBg },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[chipStyles.accountDot, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={14} color="#fff" />
      </View>
      <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color: active ? item.color : colors.textSecondary, flex: 1 }}>
        {item.label}
      </Text>
      {active && <Ionicons name="checkmark-circle" size={16} color={item.color} />}
    </TouchableOpacity>
  );
};

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1.5,
  },
  accountChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1.5,
  },
  accountDot: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Écran principal ───────────────────────────

export const ProfileSetupScreen = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const { updateUser } = useUser();
  const styles = getStyles(colors);

  const signupData = route.params?.signupData || {};

  const [status,    setStatus]    = useState('salarie');
  const [income,    setIncome]    = useState('');
  const [accounts,  setAccounts]  = useState([]);
  const [goal,      setGoal]      = useState('budget');
  const [household, setHousehold] = useState('single');
  const [accountNumber, setAccountNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleAccount = (id) =>
    setAccounts(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  const isComplete = status && income && accounts.length > 0 && goal && household && accountNumber.trim() !== '';

  const handleFinish = async () => {
    if (!isComplete) return;

    setIsLoading(true);
    try {
      const profilData = JSON.stringify({ status, income, accounts, goal, household });
      
      // Envoi de la requête d'inscription avec les infos de profil
      const response = await api.post('/register', {
        name: signupData.fullName?.trim() || 'Utilisateur',
        email: signupData.email?.trim() || '',
        password: signupData.password || '',
        password_confirmation: signupData.confirmPassword || '',
        phone: accountNumber,
        profil: profilData
      });

      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
      }

      updateUser({ 
        fullName: signupData.fullName?.trim() || '', 
        email: signupData.email?.trim() || '' 
      });
      
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      Alert.alert(
        "Erreur d'inscription", 
        error.response?.data?.message || "Une erreur est survenue lors de la création du compte."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.glowEmerald} />
      <View style={styles.glowGold} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>FinCoach</Text>
          <Text style={styles.headerSub}>Votre profil financier</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Barre de progression */}
      <View style={styles.progressBar}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor: i < [accountNumber, status, income, accounts.length, goal, household].filter(Boolean).length
                  ? colors.primary : colors.border,
                width: i < [accountNumber, status, income, accounts.length, goal, household].filter(Boolean).length ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Section 1 : Numéro de Compte ── */}
          <View style={styles.section}>
            <SectionHeader
              step="1"
              title="Numéro de compte"
              subtitle="Le numéro de téléphone associé à vos opérations."
            />
            <Input
              label="Numéro de compte" placeholder="+229 -- -- -- --"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="phone-pad"
              icon={<Ionicons name="call-outline" size={20} color={colors.textSecondary} />}
            />
          </View>

          {/* ── Section 2 : Statut ── */}
          <View style={styles.section}>
            <SectionHeader
              step="2"
              title="Votre situation"
              subtitle="Cela nous aide à adapter vos catégories de dépenses."
            />
            <View style={styles.chipList}>
              {STATUTES.map(s => (
                <Chip key={s.id} label={s.label} icon={s.icon} active={status === s.id} onPress={() => setStatus(s.id)} />
              ))}
            </View>
          </View>

          {/* ── Section 3 : Revenus ── */}
          <View style={styles.section}>
            <SectionHeader
              step="3"
              title="Tranche de revenu mensuel"
              subtitle="Confidentiel — utilisé uniquement pour calibrer vos budgets et recommandations IA."
            />
            <View style={styles.incomeGrid}>
              {INCOME_RANGES.map(r => {
                const active = income === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.incomeCard, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}14` : colors.inputBg }]}
                    onPress={() => setIncome(r.id)}
                    activeOpacity={0.8}
                  >
                    {active && <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={styles.incomeCheck} />}
                    <Text style={{ fontSize: 14, fontWeight: '700', color: active ? colors.primary : colors.textPrimary }}>
                      {r.label}
                    </Text>
                    <Text style={{ fontSize: 10, color: active ? colors.primary : colors.textSecondary }}>
                      {r.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Section 4 : Comptes ── */}
          <View style={styles.section}>
            <SectionHeader
              step="4"
              title="Vos comptes à suivre"
              subtitle="Sélectionnez les sources que vous utilisez. Plusieurs choix possibles."
            />
            <View style={styles.chipList}>
              {ACCOUNT_TYPES.map(a => (
                <AccountChip
                  key={a.id}
                  item={a}
                  active={accounts.includes(a.id)}
                  onPress={() => toggleAccount(a.id)}
                />
              ))}
            </View>
          </View>

          {/* ── Section 5 : Objectif ── */}
          <View style={styles.section}>
            <SectionHeader
              step="5"
              title="Objectif principal"
              subtitle="Votre coach IA adaptera ses conseils à cet objectif."
            />
            <View style={styles.chipList}>
              {GOALS.map(g => (
                <Chip key={g.id} label={g.label} icon={g.icon} active={goal === g.id} onPress={() => setGoal(g.id)} />
              ))}
            </View>
          </View>

          {/* ── Section 6 : Foyer ── */}
          <View style={styles.section}>
            <SectionHeader
              step="6"
              title="Situation du foyer"
              subtitle="Aide l'IA à estimer vos charges incompressibles."
            />
            <View style={styles.householdGrid}>
              {HOUSEHOLDS.map(h => {
                const active = household === h.id;
                return (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.householdCard, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}14` : colors.inputBg }]}
                    onPress={() => setHousehold(h.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={h.icon} size={24} color={active ? colors.primary : colors.textSecondary} />
                    <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color: active ? colors.primary : colors.textSecondary, textAlign: 'center' }}>
                      {h.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        {!isComplete && (
          <Text style={styles.footerHint}>
            {accounts.length === 0 ? 'Sélectionnez au moins un compte' : 'Complétez toutes les étapes'}
          </Text>
        )}
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 8 }} />
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isComplete ? colors.primary : colors.surfaceContainerHigh },
            ]}
            onPress={handleFinish}
            activeOpacity={0.85}
            disabled={!isComplete}
          >
            <Text style={[styles.submitText, { color: isComplete ? colors.onPrimary : colors.textSecondary }]}>
              Commencer avec FinCoach
            </Text>
            <Ionicons name="arrow-forward" size={20} color={isComplete ? colors.onPrimary : colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────

const getStyles = (colors) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  glowEmerald: {
    position: 'absolute', top: 0, right: 0, width: 280, height: 280,
    backgroundColor: 'rgba(68, 243, 169, 0.05)', borderRadius: BORDER_RADIUS.full,
  },
  glowGold: {
    position: 'absolute', bottom: 100, left: -40, width: 300, height: 300,
    backgroundColor: 'rgba(248, 189, 69, 0.04)', borderRadius: BORDER_RADIUS.full,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.marginX, height: 60,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { ...TYPOGRAPHY.sizes.headlineMd, fontSize: 18, color: colors.primary, fontWeight: '800' },
  headerSub:   { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  progressBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
  },
  progressDot: { height: 4, borderRadius: 2 },

  scrollContent: { paddingHorizontal: SPACING.marginX, paddingTop: SPACING.stackMd, gap: SPACING.stackLg },

  section:      { gap: SPACING.stackMd },
  chipList:     { gap: SPACING.stackSm },

  incomeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  incomeCard: {
    width: '47%', borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 14,
    gap: 2, position: 'relative',
  },
  incomeCheck: { position: 'absolute', top: 8, right: 8 },

  householdGrid: { flexDirection: 'row', gap: 10 },
  householdCard: {
    flex: 1, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5, paddingVertical: 16,
    alignItems: 'center', gap: 6,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.marginX,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.divider,
    gap: 8,
  },
  footerHint: {
    fontSize: 12, color: colors.textSecondary,
    textAlign: 'center', fontStyle: 'italic',
  },
  submitButton: {
    height: 54, borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  submitText: { fontSize: 16, fontWeight: '700' },
});

export default ProfileSetupScreen;
