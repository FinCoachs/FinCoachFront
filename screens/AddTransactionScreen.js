import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useCategories } from '../src/context/CategoriesContext';
import { useTransactions } from '../src/context/TransactionsContext';
import { useAccounts } from '../src/context/AccountContext';

const { width } = Dimensions.get('window');

const NUM_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', '⌫'],
];

// ============================================
// HELPERS
// ============================================

const formatDisplay = (raw) => {
  if (!raw) return '0';
  const parts = raw.split(',');
  const intFormatted = parseInt(parts[0] || '0', 10).toLocaleString('fr-FR');
  return parts.length > 1 ? `${intFormatted},${parts[1]}` : intFormatted;
};

// ============================================
// SUB-COMPONENTS
// ============================================

const SourceCard = ({ account, isSelected, onPress }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const isMomo = /momo|mtn|moov|wave|flooz/i.test(account.name);
  const isCash = /espèce|espece|cash|liquid/i.test(account.name);
  const icon   = isMomo ? 'phone-portrait-outline' : isCash ? 'cash-outline' : 'card-outline';

  return (
    <TouchableOpacity
      style={[styles.sourceCard, isSelected && styles.sourceCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.sourceCardTop}>
        <View style={[styles.sourceIconWrap, isSelected && styles.sourceIconSelected]}>
          <Ionicons name={icon} size={20} color={isSelected ? colors.primary : colors.textSecondary} />
        </View>
        <View style={[styles.radio, isSelected && styles.radioSelected]}>
          {isSelected && <View style={styles.radioDot} />}
        </View>
      </View>
      <View>
        <Text style={styles.sourceLabel} numberOfLines={1}>{account.name}</Text>
        <Text style={styles.sourceSub} numberOfLines={1}>
          {account.numero ? `…${account.numero.slice(-4)}` : account.typeLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const CategoryChip = ({ cat, isActive, onPress }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isActive ? [styles.chipActive, { borderColor: cat.color }] : styles.chipInactive,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
      <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
        {cat.libelle}
      </Text>
    </TouchableOpacity>
  );
};

// ============================================
// NUMPAD
// ============================================

const NumPad = ({ onPress }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.numpad}>
      {NUM_ROWS.map((row, ri) => (
        <View key={ri} style={styles.numpadRow}>
          {row.map((key) => {
            const isBackspace = key === '⌫';
            return (
              <TouchableOpacity
                key={key}
                style={styles.numpadKey}
                onPress={() => onPress(key)}
                activeOpacity={0.6}
              >
                {isBackspace ? (
                  <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
                ) : (
                  <Text style={[styles.numpadKeyText, key === ',' && styles.numpadKeyComma]}>
                    {key}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

export const AddTransactionScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const { categories: allCategories }    = useCategories();
  const { addTransaction }               = useTransactions();
  const { accounts, totalBalance }       = useAccounts();

  const [type, setType]               = useState('depense');
  const [rawAmount, setRawAmount]     = useState('');
  const [description, setDescription] = useState('');
  const [numpadVisible, setNumpadVisible] = useState(false);
  const [isSaving, setIsSaving]       = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    () => allCategories[0]?.id ?? null,
  );
  const [selectedCompteId, setSelectedCompteId] = useState(
    () => accounts[0]?.id ?? null,
  );

  const scrollRef = useRef(null);

  // ── Numpad logic ──────────────────────────
  const handleNumPress = (key) => {
    if (key === '⌫') { setRawAmount(prev => prev.slice(0, -1)); return; }
    if (key === ',' && rawAmount.includes(',')) return;
    if (key !== ',' && rawAmount === '0') { setRawAmount(key); return; }
    const decimalPart = rawAmount.split(',')[1];
    if (decimalPart !== undefined && decimalPart.length >= 2) return;
    const intPart = rawAmount.split(',')[0];
    if (!rawAmount.includes(',') && intPart.length >= 10) return;
    setRawAmount(prev => prev + key);
  };

  // ── Save ──────────────────────────────────
  const handleSave = async () => {
    const numeric = parseFloat(rawAmount.replace(',', '.')) || 0;
    if (numeric === 0) return;

    if (!selectedCategoryId) {
      Alert.alert('Catégorie requise', 'Veuillez sélectionner ou créer une catégorie.');
      return;
    }
    if (!selectedCompteId) {
      Alert.alert('Compte requis', 'Veuillez d\'abord ajouter un compte financier.');
      return;
    }

    setIsSaving(true);
    try {
      await addTransaction({
        montant:      numeric,
        date:         new Date(),
        description:  description.trim() || null,
        type,
        categorie_id: selectedCategoryId,
        compte_id:    selectedCompteId,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.message || 'Impossible d\'enregistrer la transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Derived ───────────────────────────────
  const isDepense    = type === 'depense';
  const hasAmount    = rawAmount.length > 0 && rawAmount !== '0';
  const parsedAmount = parseFloat(rawAmount.replace(',', '.')) || 0;

  const selectedAccount  = accounts.find(a => a.id === selectedCompteId);
  const displayBalance   = selectedAccount ? selectedAccount.balance : totalBalance;
  const remainingBalance = isDepense ? displayBalance - parsedAmount : displayBalance + parsedAmount;
  const isOverBudget     = remainingBalance < 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isDepense ? 'Nouvelle dépense' : 'Nouveau revenu'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Solde du compte sélectionné ── */}
      <View style={styles.budgetHero}>
        <Text style={styles.budgetLabel}>
          {selectedAccount ? `SOLDE — ${selectedAccount.name.toUpperCase()}` : 'SOLDE TOTAL'}
        </Text>
        <Text style={[styles.budgetAmount, isOverBudget && styles.budgetAmountOver]}>
          {remainingBalance.toLocaleString('fr-FR')}{' '}
          <Text style={[styles.budgetCurrency, isOverBudget && styles.budgetAmountOver]}>FCFA</Text>
        </Text>
        {hasAmount && (
          <View style={styles.budgetDeltaRow}>
            <Ionicons
              name={isDepense ? 'arrow-down' : 'arrow-up'}
              size={12}
              color={isDepense ? colors.error : colors.income}
            />
            <Text style={[styles.budgetDelta, { color: isDepense ? colors.error : colors.income }]}>
              {isDepense ? '−' : '+'}{parsedAmount.toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
        )}
      </View>

      {/* ── Formulaire ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, isDepense && styles.toggleBtnActive]}
            onPress={() => setType('depense')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, isDepense && styles.toggleTextActive]}>Dépense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isDepense && styles.toggleBtnIncomeActive]}
            onPress={() => setType('revenu')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, !isDepense && styles.toggleTextActive]}>Revenu</Text>
          </TouchableOpacity>
        </View>

        {/* Montant */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Montant</Text>
          <TouchableOpacity
            style={[styles.montantInput, numpadVisible && styles.montantInputFocused]}
            onPress={() => setNumpadVisible(true)}
            activeOpacity={1}
          >
            <Text style={[styles.montantValue, !hasAmount && styles.montantPlaceholder]}>
              {hasAmount ? `${formatDisplay(rawAmount)} FCFA` : 'Ex : 5 000 FCFA'}
            </Text>
            <Ionicons
              name="calculator-outline"
              size={18}
              color={numpadVisible ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Compte source */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {isDepense ? 'Source de paiement' : 'Compte de dépôt'}
          </Text>
          {accounts.length === 0 ? (
            <View style={styles.emptyAccounts}>
              <Text style={[styles.emptyAccountsText, { color: colors.placeholder }]}>
                Aucun compte — ajoutez-en un depuis l'accueil.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sourcesScroll}>
              <View style={styles.sourcesGrid}>
                {accounts.map(acc => (
                  <SourceCard
                    key={acc.id}
                    account={acc}
                    isSelected={selectedCompteId === acc.id}
                    onPress={() => setSelectedCompteId(acc.id)}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Catégorie */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Catégorie</Text>
          {allCategories.length === 0 ? (
            <Text style={[styles.emptyAccountsText, { color: colors.placeholder }]}>
              Aucune catégorie — créez-en une depuis Budgets.
            </Text>
          ) : (
            <View style={styles.chipsWrap}>
              {allCategories.map(cat => (
                <CategoryChip
                  key={cat.id}
                  cat={cat}
                  isActive={selectedCategoryId === cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder={isDepense ? 'Ex : loyer' : 'Ex : salaire'}
              placeholderTextColor={colors.placeholder}
              value={description}
              onChangeText={setDescription}
              onFocus={() => {
                setNumpadVisible(false);
                scrollRef.current?.scrollToEnd({ animated: true });
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* ── Zone fixe en bas ── */}
      <View style={styles.bottomArea}>
        {numpadVisible && (
          <>
            <View style={styles.divider} />
            <View style={styles.numpadToolbar}>
              <Text style={[styles.numpadToolbarAmount, !hasAmount && styles.numpadToolbarEmpty]}>
                {hasAmount ? `${formatDisplay(rawAmount)} FCFA` : '0 FCFA'}
              </Text>
              <TouchableOpacity
                style={styles.numpadDoneBtn}
                onPress={() => setNumpadVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.numpadDoneText}>Terminé</Text>
                <Ionicons name="checkmark" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <NumPad onPress={handleNumPress} />
          </>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, (!hasAmount || isSaving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!hasAmount || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={!hasAmount ? colors.textSecondary : colors.onPrimary} />
              <Text style={[styles.saveBtnText, !hasAmount && styles.saveBtnTextDisabled]}>
                {isDepense ? 'Enregistrer la dépense' : 'Enregistrer le revenu'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const KEY_SIZE = (width - SPACING.marginX * 2 - 16) / 3;

const getStyles = (colors) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX, height: 56,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },

  budgetHero: {
    alignItems: 'center', paddingVertical: 20, paddingHorizontal: SPACING.marginX,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 4,
  },
  budgetLabel:      { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.textSecondary, textTransform: 'uppercase' },
  budgetAmount:     { fontSize: 36, fontWeight: '700', color: colors.primary, letterSpacing: -1 },
  budgetAmountOver: { color: colors.error },
  budgetCurrency:   { fontSize: 18, fontWeight: '600', color: colors.primary },
  budgetDeltaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  budgetDelta:      { fontSize: 13, fontWeight: '600' },

  scrollView:    { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.marginX, paddingTop: SPACING.stackMd, paddingBottom: SPACING.stackLg, gap: SPACING.stackLg },

  toggle: {
    flexDirection: 'row', backgroundColor: colors.inputBg,
    borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.borderLight,
  },
  toggleBtn:             { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  toggleBtnActive:       { backgroundColor: colors.primary },
  toggleBtnIncomeActive: { backgroundColor: colors.income },
  toggleText:            { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive:      { color: colors.onPrimary, fontWeight: '700' },

  section:      { gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.textSecondary, textTransform: 'uppercase' },

  montantInput: {
    height: 52, backgroundColor: colors.cardBg, borderRadius: 14,
    paddingHorizontal: SPACING.marginX, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: colors.borderLight,
  },
  montantInputFocused: { borderColor: colors.primary, backgroundColor: 'rgba(68, 243, 169, 0.04)' },
  montantValue:        { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  montantPlaceholder:  { color: colors.placeholder, fontWeight: '400', fontSize: 15 },

  sourcesScroll: { marginHorizontal: -SPACING.marginX },
  sourcesGrid:   { flexDirection: 'row', gap: SPACING.gutter, paddingHorizontal: SPACING.marginX },
  sourceCard: {
    width: 130, height: 104, backgroundColor: colors.inputBg,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border, justifyContent: 'space-between',
  },
  sourceCardSelected: {
    backgroundColor: 'rgba(68, 243, 169, 0.07)', borderColor: colors.primary,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  sourceCardTop:    { flexDirection: 'row', justifyContent: 'space-between' },
  sourceIconWrap:   { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  sourceIconSelected:{ backgroundColor: 'rgba(68, 243, 169, 0.15)' },
  radio:            { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected:    { borderColor: colors.primary },
  radioDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  sourceLabel:      { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  sourceSub:        { fontSize: 10, color: colors.textSecondary, marginTop: 2 },

  emptyAccounts:     { paddingVertical: 12 },
  emptyAccountsText: { fontSize: 13 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BORDER_RADIUS.full },
  chipActive:       { backgroundColor: colors.background, borderWidth: 2, elevation: 3 },
  chipInactive:     { backgroundColor: colors.surfaceContainerHigh, borderWidth: 1, borderColor: colors.borderLight },
  chipDot:          { width: 8, height: 8, borderRadius: 4 },
  chipText:         { fontSize: 13, fontWeight: '500' },
  chipTextActive:   { color: colors.textPrimary, fontWeight: '700' },
  chipTextInactive: { color: colors.textSecondary },

  inputWrap: {
    height: 52, backgroundColor: colors.cardBg, borderRadius: 14,
    paddingHorizontal: SPACING.marginX, justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderLight,
  },
  textInput: { fontSize: 15, color: colors.textPrimary, padding: 0 },

  bottomArea: {
    backgroundColor: colors.background,
    paddingHorizontal: SPACING.marginX,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
  },
  divider: { height: 1, backgroundColor: colors.divider, marginBottom: 10 },

  numpadToolbar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  numpadToolbarAmount: { fontSize: 22, fontWeight: '700', color: colors.primary, letterSpacing: -0.5 },
  numpadToolbarEmpty:  { color: 'rgba(68, 243, 169, 0.3)' },
  numpadDoneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: 'rgba(68, 243, 169, 0.08)',
  },
  numpadDoneText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  numpad:       { gap: 8, marginBottom: 12 },
  numpadRow:    { flexDirection: 'row', gap: 8 },
  numpadKey: {
    width: KEY_SIZE, height: 52, borderRadius: 12,
    backgroundColor: colors.cardBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderLight,
  },
  numpadKeyText:  { fontSize: 22, fontWeight: '500', color: colors.textPrimary },
  numpadKeyComma: { fontSize: 26, fontWeight: '700', color: colors.textSecondary },

  saveBtn: {
    height: 52, backgroundColor: colors.primaryDark, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  saveBtnDisabled:     { backgroundColor: colors.inputBg, shadowOpacity: 0, elevation: 0 },
  saveBtnText:         { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
  saveBtnTextDisabled: { color: colors.textSecondary },
});

export default AddTransactionScreen;
