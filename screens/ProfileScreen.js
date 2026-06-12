import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useUser } from '../src/context/UserContext';
import { useAccounts } from '../src/context/AccountContext';
import { SPACING, BORDER_RADIUS } from '../src/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/services/api';

// ── Avatar ────────────────────────────────────────────────

const Avatar = ({ colors, initial, size = 84 }) => (
  <View style={[
    styles.avatarOuter,
    { borderColor: `${colors.primary}40`, width: size, height: size, borderRadius: size / 2 },
  ]}>
    <View style={[styles.avatarInner, { backgroundColor: `${colors.primary}20`, borderRadius: size / 2 - 4 }]}>
      <Text style={[styles.avatarInitial, { color: colors.primary, fontSize: size * 0.38 }]}>
        {initial || '?'}
      </Text>
    </View>
  </View>
);

// ── Ligne de section ──────────────────────────────────────

const Section = ({ label, children, colors }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{label}</Text>
    <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      {children}
    </View>
  </View>
);

// ── Séparateur interne ────────────────────────────────────

const Divider = ({ colors }) => (
  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
);

// ── Screen ────────────────────────────────────────────────

export const ProfileScreen = ({ navigation }) => {
  const { colors, isDark }            = useTheme();
  const { user, updateUser, initial } = useUser();
  const { accounts, deleteAccount }   = useAccounts();

  // ── Panneau actif ─────────────────────────────────────
  const [activePanel, setActivePanel] = useState(null);
  // null | 'editProfile' | 'password' | 'logout' | `delete-${id}`

  const openPanel  = (name) => setActivePanel(name);
  const closePanel = ()     => setActivePanel(null);

  // ── Édition profil ────────────────────────────────────
  const [editName,   setEditName]   = useState('');
  const [editEmail,  setEditEmail]  = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError,  setEditError]  = useState('');

  const openEdit = () => {
    setEditName(user.fullName || '');
    setEditEmail(user.email   || '');
    setEditError('');
    openPanel('editProfile');
  };

  const handleSaveInfo = async () => {
    setEditError('');
    const name  = editName.trim();
    const email = editEmail.trim();
    if (!name)  { setEditError('Le nom est requis.'); return; }
    if (!email) { setEditError("L'email est requis."); return; }
    setEditSaving(true);
    try {
      const res = await api.patch('/user', { name, email });
      if (res.data.success) {
        updateUser({ fullName: res.data.data.name, email: res.data.data.email });
        closePanel();
      }
    } catch (e) {
      setEditError(e.response?.data?.message || 'Impossible de mettre à jour le profil.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Mot de passe ──────────────────────────────────────
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew,     setPwdNew]     = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdSaving,  setPwdSaving]  = useState(false);
  const [pwdError,   setPwdError]   = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const openPassword = () => {
    setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
    setPwdError(''); setPwdSuccess('');
    openPanel('password');
  };

  const handleSavePassword = async () => {
    setPwdError(''); setPwdSuccess('');
    if (!pwdCurrent)                    { setPwdError('Saisir le mot de passe actuel.'); return; }
    if (pwdNew.length < 8)              { setPwdError('Au moins 8 caractères.'); return; }
    if (pwdNew !== pwdConfirm)          { setPwdError('Les mots de passe ne correspondent pas.'); return; }
    setPwdSaving(true);
    try {
      await api.patch('/user/password', {
        current_password:      pwdCurrent,
        password:              pwdNew,
        password_confirmation: pwdConfirm,
      });
      setPwdSuccess('Mot de passe modifié avec succès.');
      setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
    } catch (e) {
      setPwdError(e.response?.data?.message || 'Impossible de modifier le mot de passe.');
    } finally {
      setPwdSaving(false);
    }
  };

  // ── Suppression compte ────────────────────────────────
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError,  setDeleteError]  = useState('');

  const openDelete = (id) => {
    setDeleteError('');
    openPanel(`delete-${id}`);
  };

  const handleDelete = async (id) => {
    setDeleteSaving(true);
    setDeleteError('');
    try {
      await deleteAccount(id);
      closePanel();
    } catch (_) {
      setDeleteError('Impossible de supprimer ce compte.');
    } finally {
      setDeleteSaving(false);
    }
  };

  // ── Déconnexion ───────────────────────────────────────
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try { await api.post('/logout'); } catch (_) {}
    await AsyncStorage.removeItem('userToken');
    updateUser({ fullName: '', email: '' });
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  // ── Render ────────────────────────────────────────────
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
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ── */}
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
          <TouchableOpacity activeOpacity={0.7} onPress={activePanel === 'editProfile' ? closePanel : openEdit}>
            <Text style={[styles.editBtn, { color: colors.primary }]}>
              {activePanel === 'editProfile' ? 'ANNULER' : 'ÉDITER LE PROFIL'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Formulaire édition profil ── */}
        {activePanel === 'editProfile' && (
          <View style={[styles.panel, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>Modifier le profil</Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nom complet</Text>
            <View style={[styles.fieldWrap, { backgroundColor: colors.inputBg, borderColor: colors.borderLight }]}>
              <TextInput
                style={[styles.fieldInput, { color: colors.textPrimary }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Votre nom"
                placeholderTextColor={colors.placeholder}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
            <View style={[styles.fieldWrap, { backgroundColor: colors.inputBg, borderColor: colors.borderLight }]}>
              <TextInput
                style={[styles.fieldInput, { color: colors.textPrimary }]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="votre@email.com"
                placeholderTextColor={colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {!!editError && <Text style={[styles.errorText, { color: colors.error ?? '#ff6b6b' }]}>{editError}</Text>}

            <TouchableOpacity
              style={[styles.panelBtn, { backgroundColor: colors.primary }, editSaving && { opacity: 0.6 }]}
              onPress={handleSaveInfo}
              disabled={editSaving}
              activeOpacity={0.8}
            >
              {editSaving
                ? <ActivityIndicator size="small" color={colors.onPrimary} />
                : <Text style={[styles.panelBtnText, { color: colors.onPrimary }]}>Enregistrer</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── Vos comptes ── */}
        <Section label="VOS COMPTES" colors={colors}>
          {accounts.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={[styles.emptyText, { color: colors.placeholder }]}>Aucun compte ajouté</Text>
            </View>
          ) : (
            accounts.map((acc, i) => {
              const isDeletingThis = activePanel === `delete-${acc.id}`;
              return (
                <View key={acc.id}>
                  <View style={[
                    styles.accountRow,
                    i < accounts.length - 1 && !isDeletingThis && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                  ]}>
                    <View style={[styles.accountDot, { backgroundColor: colors.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.accountName, { color: colors.textPrimary }]}>{acc.name}</Text>
                      {acc.numero && (
                        <Text style={[styles.accountSub, { color: colors.textSecondary }]}>{acc.numero}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.iconBtn, isDeletingThis && { backgroundColor: `${colors.error}15` }]}
                      onPress={() => isDeletingThis ? closePanel() : openDelete(acc.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isDeletingThis ? 'close' : 'trash-outline'}
                        size={16}
                        color={isDeletingThis ? colors.textSecondary : colors.error ?? '#ff6b6b'}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Confirmation suppression inline */}
                  {isDeletingThis && (
                    <View style={[styles.deleteConfirm, { borderColor: colors.divider }]}>
                      <Text style={[styles.deleteConfirmText, { color: colors.textSecondary }]}>
                        Supprimer « {acc.name} » ?
                      </Text>
                      {!!deleteError && (
                        <Text style={[styles.errorText, { color: colors.error ?? '#ff6b6b' }]}>{deleteError}</Text>
                      )}
                      <View style={styles.deleteConfirmRow}>
                        <TouchableOpacity
                          style={[styles.deleteConfirmBtn, { borderColor: colors.borderLight }]}
                          onPress={closePanel}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.deleteConfirmBtnText, { color: colors.textSecondary }]}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.deleteConfirmBtn, { backgroundColor: colors.error ?? '#ff6b6b', borderColor: 'transparent' }]}
                          onPress={() => handleDelete(acc.id)}
                          disabled={deleteSaving}
                          activeOpacity={0.7}
                        >
                          {deleteSaving
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={[styles.deleteConfirmBtnText, { color: '#fff' }]}>Supprimer</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </Section>

        {/* ── Paramètres ── */}
        <Section label="PARAMÈTRES" colors={colors}>
          {/* Sécurité / Mot de passe */}
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={activePanel === 'password' ? closePanel : openPassword}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Ionicons name="shield-outline" size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Sécurité</Text>
            </View>
            <Ionicons
              name={activePanel === 'password' ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Formulaire mot de passe inline */}
          {activePanel === 'password' && (
            <View style={[styles.passwordPanel, { borderTopColor: colors.divider, backgroundColor: colors.inputBg }]}>
              <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>Changer le mot de passe</Text>

              <PasswordField
                label="Mot de passe actuel"
                value={pwdCurrent}
                onChange={setPwdCurrent}
                colors={colors}
              />
              <PasswordField
                label="Nouveau mot de passe"
                value={pwdNew}
                onChange={setPwdNew}
                placeholder="Min. 8 caractères"
                colors={colors}
              />
              <PasswordField
                label="Confirmer le nouveau"
                value={pwdConfirm}
                onChange={setPwdConfirm}
                colors={colors}
              />

              {!!pwdError   && <Text style={[styles.errorText,   { color: colors.error ?? '#ff6b6b' }]}>{pwdError}</Text>}
              {!!pwdSuccess && <Text style={[styles.successText, { color: colors.income ?? '#44f3a9' }]}>{pwdSuccess}</Text>}

              <TouchableOpacity
                style={[styles.panelBtn, { backgroundColor: colors.primary }, pwdSaving && { opacity: 0.6 }]}
                onPress={handleSavePassword}
                disabled={pwdSaving}
                activeOpacity={0.8}
              >
                {pwdSaving
                  ? <ActivityIndicator size="small" color={colors.onPrimary} />
                  : <Text style={[styles.panelBtnText, { color: colors.onPrimary }]}>Modifier le mot de passe</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          <Divider colors={colors} />

          {/* Notifications (placeholder) */}
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Ionicons name="notifications-outline" size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Notifications</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingBadge, { color: colors.textSecondary }]}>Bientôt</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.borderLight} />
            </View>
          </TouchableOpacity>
        </Section>

        {/* ── Support ── */}
        <Section label="SUPPORT" colors={colors}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Ionicons name="help-circle-outline" size={18} color={colors.textSecondary} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Aide & FAQ</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingBadge, { color: colors.textSecondary }]}>Bientôt</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.borderLight} />
            </View>
          </TouchableOpacity>
        </Section>

        {/* ── Déconnexion ── */}
        {activePanel === 'logout' ? (
          <View style={[styles.logoutConfirmBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.logoutConfirmText, { color: colors.textPrimary }]}>
              Confirmer la déconnexion ?
            </Text>
            <View style={styles.logoutConfirmRow}>
              <TouchableOpacity
                style={[styles.logoutConfirmBtn, { borderColor: colors.borderLight }]}
                onPress={closePanel}
                activeOpacity={0.7}
              >
                <Text style={[styles.logoutConfirmBtnText, { color: colors.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutConfirmBtn, { backgroundColor: colors.error ?? '#ff6b6b', borderColor: 'transparent' }]}
                onPress={handleLogout}
                disabled={logoutLoading}
                activeOpacity={0.7}
              >
                {logoutLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={[styles.logoutConfirmBtnText, { color: '#fff' }]}>Déconnecter</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.7}
            onPress={() => openPanel('logout')}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error ?? '#ff6b6b'} />
            <Text style={[styles.logoutText, { color: colors.error ?? '#ff6b6b' }]}>Déconnexion</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Champ mot de passe réutilisable ───────────────────────

const PasswordField = ({ label, value, onChange, placeholder, colors }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.pwdFieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.fieldWrap, { backgroundColor: colors.cardBg, borderColor: colors.borderLight, flexDirection: 'row', alignItems: 'center' }]}>
        <TextInput
          style={[styles.fieldInput, { color: colors.textPrimary, flex: 1 }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || '••••••••'}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={!visible}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setVisible(v => !v)} style={{ paddingHorizontal: 12 }} activeOpacity={0.7}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX, height: 60, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.marginX, paddingTop: SPACING.stackLg, gap: SPACING.stackLg, paddingBottom: SPACING.stackLg },

  // ── Hero ──────────────────────────────────────
  hero:      { alignItems: 'center', gap: SPACING.stackSm },
  avatarOuter: { borderWidth: 2, padding: 3, alignItems: 'center', justifyContent: 'center' },
  avatarInner: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontWeight: '800' },
  heroInfo:  { alignItems: 'center', gap: 4, marginTop: 4 },
  heroName:  { fontSize: 20, fontWeight: '600', letterSpacing: -0.2 },
  heroEmail: { fontSize: 13 },
  editBtn:   { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 4 },

  // ── Panel formulaire ──────────────────────────
  panel: {
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1, padding: SPACING.stackLg, gap: SPACING.stackMd,
  },
  panelTitle:    { fontSize: 15, fontWeight: '700' },
  fieldLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: -4 },
  fieldWrap:     { borderRadius: 12, borderWidth: 1, height: 46, paddingHorizontal: 14, justifyContent: 'center' },
  fieldInput:    { fontSize: 14, padding: 0 },
  panelBtn:      { height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  panelBtnText:  { fontSize: 14, fontWeight: '700' },
  errorText:     { fontSize: 12, textAlign: 'center' },
  successText:   { fontSize: 12, textAlign: 'center' },

  // ── Section ───────────────────────────────────
  section:      { gap: SPACING.stackSm },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', paddingLeft: 2 },
  sectionCard:  { borderRadius: BORDER_RADIUS.xl, borderWidth: 1, overflow: 'hidden' },
  divider:      { height: 1 },

  // ── Compte row ────────────────────────────────
  accountRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.stackLg, paddingVertical: SPACING.stackMd, gap: SPACING.stackMd,
  },
  accountDot:  { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  accountName: { fontSize: 15, fontWeight: '600' },
  accountSub:  { fontSize: 11, marginTop: 2 },
  iconBtn:     { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyRow:    { paddingVertical: SPACING.stackMd, alignItems: 'center' },
  emptyText:   { fontSize: 13 },

  // ── Delete confirm inline ──────────────────────
  deleteConfirm: {
    paddingHorizontal: SPACING.stackLg, paddingBottom: SPACING.stackMd, paddingTop: 4,
    gap: 10, borderTopWidth: 1,
  },
  deleteConfirmText:    { fontSize: 13 },
  deleteConfirmRow:     { flexDirection: 'row', gap: 8 },
  deleteConfirmBtn:     { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  deleteConfirmBtnText: { fontSize: 13, fontWeight: '600' },

  // ── Setting row ───────────────────────────────
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.stackLg, paddingVertical: 14,
  },
  settingLeft:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.stackMd },
  settingIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel:   { fontSize: 15 },
  settingRight:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingBadge:   { fontSize: 11, fontWeight: '600' },

  // ── Password panel ────────────────────────────
  passwordPanel: {
    borderTopWidth: 1, paddingHorizontal: SPACING.stackLg,
    paddingTop: SPACING.stackMd, paddingBottom: SPACING.stackLg, gap: SPACING.stackMd,
  },
  pwdFieldWrap: { gap: 6 },

  // ── Logout ────────────────────────────────────
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.stackSm, paddingVertical: SPACING.stackMd,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
  logoutConfirmBox: {
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1,
    padding: SPACING.stackLg, gap: SPACING.stackMd, alignItems: 'center',
  },
  logoutConfirmText:    { fontSize: 14, fontWeight: '600' },
  logoutConfirmRow:     { flexDirection: 'row', gap: 10, width: '100%' },
  logoutConfirmBtn:     { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  logoutConfirmBtnText: { fontSize: 14, fontWeight: '600' },
});

export default ProfileScreen;
