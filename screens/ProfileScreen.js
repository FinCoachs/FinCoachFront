import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useUser } from '../src/context/UserContext';
import { SPACING, BORDER_RADIUS, getShadow } from '../src/constants/theme';

// ── Données mock ──────────────────────────────────────────

const MOCK_ACCOUNTS = [
  { id: 'boa',  name: 'BOA Bénin' },
  { id: 'momo', name: 'MTN MoMo'  },
];

// ── Paramètres & Support ──────────────────────────────────

const SETTINGS = [
  { id: 'security',      icon: 'shield-outline',       label: 'Sécurité' },
  { id: 'notifications', icon: 'notifications-outline', label: 'Notifications' },
];

const SUPPORT = [
  { id: 'faq',   icon: 'help-circle-outline', label: 'Aide & FAQ' },
];

// ── Avatar initiale ───────────────────────────────────────

const Avatar = ({ colors, initial }) => (
  <View style={[styles.avatarOuter, { borderColor: `${colors.primary}40` }]}>
    <View style={[styles.avatarInner, { backgroundColor: `${colors.primary}20` }]}>
      <Text style={[styles.avatarInitial, { color: colors.primary }]}>{initial || '?'}</Text>
    </View>
  </View>
);

// ── Compte item ───────────────────────────────────────────

const AccountItem = ({ account, onDelete, colors, isDark, isLast }) => {
  const shadow = getShadow(isDark);
  return (
    <View style={[
      styles.accountRow,
      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider },
    ]}>
      <View style={[styles.accountDot, { backgroundColor: colors.primary }]} />
      <Text style={[styles.accountName, { color: colors.textPrimary }]}>{account.name}</Text>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() =>
          Alert.alert(
            'Supprimer le compte',
            `Retirer "${account.name}" de votre profil ?`,
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(account.id) },
            ],
          )
        }
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={16} color={colors.expense} />
      </TouchableOpacity>
    </View>
  );
};

// ── Ligne paramètre ───────────────────────────────────────

const SettingRow = ({ item, colors, isLast }) => (
  <TouchableOpacity
    style={[
      styles.settingRow,
      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider },
    ]}
    activeOpacity={0.7}
    onPress={() => Alert.alert(item.label, 'Disponible prochainement.', [{ text: 'OK' }])}
  >
    <View style={styles.settingLeft}>
      <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceContainerHigh }]}>
        <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{item.label}</Text>
    </View>
    <View style={styles.settingRight}>
      {item.value && (
        <Text style={[styles.settingValue, { color: colors.primary }]}>{item.value}</Text>
      )}
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </View>
  </TouchableOpacity>
);

// ── Section wrapper ───────────────────────────────────────

const Section = ({ label, children, colors }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{label}</Text>
    <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      {children}
    </View>
  </View>
);

// ── Screen ─────────────────────────────────────────────────

export const ProfileScreen = ({ navigation }) => {
  const { colors, isDark }      = useTheme();
  const { user, initial, updateUser } = useUser();
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);

  const removeAccount = (id) =>
    setAccounts((prev) => prev.filter((a) => a.id !== id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Profil</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Avatar colors={colors} initial={initial} />
          <View style={styles.heroInfo}>
            <Text style={[styles.heroName, { color: colors.textPrimary }]}>
              {user.fullName || 'Mon profil'}
            </Text>
            <Text style={[styles.heroEmail, { color: colors.textSecondary }]}>
              {user.email || '—'}
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.editBtn, { color: colors.primary }]}>ÉDITER LE PROFIL</Text>
          </TouchableOpacity>
        </View>

        {/* Vos comptes */}
        <Section label="VOS COMPTES" colors={colors}>
          {accounts.length === 0 ? (
            <View style={styles.emptyAccounts}>
              <Text style={[styles.emptyText, { color: colors.placeholder }]}>Aucun compte ajouté</Text>
            </View>
          ) : (
            accounts.map((acc, i) => (
              <AccountItem
                key={acc.id}
                account={acc}
                onDelete={removeAccount}
                colors={colors}
                isDark={isDark}
                isLast={i === accounts.length - 1}
              />
            ))
          )}
        </Section>

        {/* Paramètres */}
        <Section label="PARAMÈTRES" colors={colors}>
          {SETTINGS.map((item, i) => (
            <SettingRow
              key={item.id}
              item={item}
              colors={colors}
              isLast={i === SETTINGS.length - 1}
            />
          ))}
        </Section>

        {/* Support */}
        <Section label="SUPPORT" colors={colors}>
          {SUPPORT.map((item, i) => (
            <SettingRow
              key={item.id}
              item={item}
              colors={colors}
              isLast={i === SUPPORT.length - 1}
            />
          ))}
        </Section>

        {/* Déconnexion */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.7}
          onPress={() => Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Déconnexion', style: 'destructive',
              onPress: () => {
                updateUser({ fullName: '', email: '' });
                navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
              },
            },
          ])}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.expense} />
          <Text style={[styles.logoutText, { color: colors.expense }]}>Déconnexion</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX,
    height: 60, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.stackLg,
    gap: SPACING.stackLg,
    paddingBottom: SPACING.stackLg,
  },

  // ── Hero ────────────────────────────────────
  hero: { alignItems: 'center', gap: SPACING.stackSm },
  avatarOuter: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 2, padding: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: {
    width: '100%', height: '100%', borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '800' },
  heroInfo:  { alignItems: 'center', gap: 4, marginTop: 4 },
  heroName:  { fontSize: 20, fontWeight: '600', letterSpacing: -0.2 },
  heroEmail: { fontSize: 13 },
  editBtn:   { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 4 },

  // ── Section ─────────────────────────────────
  section: { gap: SPACING.stackSm },
  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase',
    paddingLeft: 2,
  },
  sectionCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // ── Compte row ──────────────────────────────
  accountRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.stackLg,
    paddingVertical: SPACING.stackMd,
    gap: SPACING.stackMd,
  },
  accountDot: { width: 8, height: 8, borderRadius: 4 },
  accountName: { flex: 1, fontSize: 15, fontWeight: '600' },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyAccounts: { paddingVertical: SPACING.stackMd, alignItems: 'center' },
  emptyText:     { fontSize: 13 },

  // ── Setting row ─────────────────────────────
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.stackLg,
    paddingVertical: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.stackMd },
  settingIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { fontSize: 15 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 12, fontWeight: '700' },

  // ── Logout ──────────────────────────────────
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.stackSm,
    paddingVertical: SPACING.stackMd,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});

export default ProfileScreen;
