import { useState, useRef, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useCategories } from '../src/context/CategoriesContext';

const { width } = Dimensions.get('window');

// Budget fictif en attente de l'intégration backend
const MOCK_BUDGET = 450_000;

// ============================================
// DATA
// ============================================


const SOURCES = [
  { id: 'banque',    label: 'Banque',    sub: 'BOA ... 8821', icon: 'bank-outline',  lib: 'community' },
  { id: 'liquidite', label: 'Liquidité', sub: 'Portefeuille',  icon: 'cash-outline', lib: 'ionicons'  },
];

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

const SourceCard = ({ source, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.sourceCard, isSelected && styles.sourceCardSelected]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.sourceCardTop}>
      <View style={[styles.sourceIconWrap, isSelected && styles.sourceIconSelected]}>
        {source.lib === 'community' ? (
          <MaterialCommunityIcons
            name={source.icon}
            size={20}
            color={isSelected ? COLORS.primary : COLORS.textSecondary}
          />
        ) : (
          <Ionicons
            name={source.icon}
            size={20}
            color={isSelected ? COLORS.primary : COLORS.textSecondary}
          />
        )}
      </View>
      <View style={[styles.radio, isSelected && styles.radioSelected]}>
        {isSelected && <View style={styles.radioDot} />}
      </View>
    </View>
    <View>
      <Text style={styles.sourceLabel}>{source.label}</Text>
      <Text style={styles.sourceSub}>{source.sub}</Text>
    </View>
  </TouchableOpacity>
);

const CategoryChip = ({ label, color, isActive, onPress }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      isActive
        ? [styles.chipActive, { borderColor: color }]
        : styles.chipInactive,
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.chipDot, { backgroundColor: color }]} />
    <Text style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ============================================
// NUMPAD
// ============================================

const NumPad = ({ onPress }) => (
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
                <Ionicons name="backspace-outline" size={24} color={COLORS.textPrimary} />
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

// ============================================
// MAIN SCREEN
// ============================================

export const AddTransactionScreen = ({ navigation }) => {
  const { categories: allCategories } = useCategories();

  const [type, setType]               = useState('depense');
  const [source, setSource]           = useState('banque');
  const [rawAmount, setRawAmount]     = useState('');
  const [description, setDescription] = useState('');
  const [numpadVisible, setNumpadVisible] = useState(false);

  // Catégories filtrées selon le type de transaction courant
  const filteredCategories = useMemo(
    () => allCategories.filter((c) =>
      type === 'depense' ? c.type === 'depense' : c.type === 'entree'
    ),
    [allCategories, type],
  );

  const [category, setCategory] = useState(
    () => allCategories.filter((c) => c.type === 'depense')[0]?.libelle || '',
  );

  const scrollRef = useRef(null);

  // ── Type toggle ───────────────────────────
  const handleTypeChange = (newType) => {
    setType(newType);
    const cats = allCategories.filter((c) =>
      newType === 'depense' ? c.type === 'depense' : c.type === 'entree'
    );
    setCategory(cats[0]?.libelle || '');
  };

  // ── Numpad logic ──────────────────────────
  const handleNumPress = (key) => {
    if (key === '⌫') {
      setRawAmount((prev) => prev.slice(0, -1));
      return;
    }
    if (key === ',' && rawAmount.includes(',')) return;
    if (key !== ',' && rawAmount === '0') {
      setRawAmount(key);
      return;
    }
    const decimalPart = rawAmount.split(',')[1];
    if (decimalPart !== undefined && decimalPart.length >= 2) return;
    const intPart = rawAmount.split(',')[0];
    if (!rawAmount.includes(',') && intPart.length >= 10) return;
    setRawAmount((prev) => prev + key);
  };

  // ── Save ──────────────────────────────────
  const handleSave = () => {
    const numeric = parseFloat(rawAmount.replace(',', '.')) || 0;
    if (numeric === 0) return;
    navigation.navigate('Transactions', {
      newTransaction: {
        id: Date.now(),
        name: description.trim() || (type === 'depense' ? 'Dépense' : 'Revenu'),
        montant: numeric,
        type: type === 'depense' ? 'dépense' : 'entrée',
        categorie: category,
        source: source === 'banque' ? 'BOA' : 'Liquidité',
        date: new Date(),
      },
    });
  };

  // ── Derived ───────────────────────────────
  const isDepense       = type === 'depense';
  const hasAmount       = rawAmount.length > 0 && rawAmount !== '0';
  const parsedAmount    = parseFloat(rawAmount.replace(',', '.')) || 0;
  const remainingBudget = isDepense ? MOCK_BUDGET - parsedAmount : MOCK_BUDGET + parsedAmount;
  const isOverBudget    = remainingBudget < 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isDepense ? 'Nouvelle dépense' : 'Nouveau revenu'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Solde restant ── */}
      <View style={styles.budgetHero}>
        <Text style={styles.budgetLabel}>SOLDE DISPONIBLE</Text>
        <Text style={[styles.budgetAmount, isOverBudget && styles.budgetAmountOver]}>
          {remainingBudget.toLocaleString('fr-FR')}{' '}
          <Text style={[styles.budgetCurrency, isOverBudget && styles.budgetAmountOver]}>FCFA</Text>
        </Text>
        {hasAmount && (
          <View style={styles.budgetDeltaRow}>
            <Ionicons
              name={isDepense ? 'arrow-down' : 'arrow-up'}
              size={12}
              color={isDepense ? '#ff6b6b' : '#00d68f'}
            />
            <Text style={[styles.budgetDelta, { color: isDepense ? '#ff6b6b' : '#00d68f' }]}>
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
            onPress={() => handleTypeChange('depense')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, isDepense && styles.toggleTextActive]}>Dépense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isDepense && styles.toggleBtnIncomeActive]}
            onPress={() => handleTypeChange('revenu')}
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
              color={numpadVisible ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Source */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {isDepense ? 'Source de paiement' : 'Source du dépôt'}
          </Text>
          <View style={styles.sourcesGrid}>
            {SOURCES.map((s) => (
              <SourceCard
                key={s.id}
                source={s}
                isSelected={source === s.id}
                onPress={() => setSource(s.id)}
              />
            ))}
          </View>
        </View>

        {/* Catégorie */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Catégorie</Text>
          <View style={styles.chipsWrap}>
            {filteredCategories.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={cat.libelle}
                color={cat.color}
                isActive={category === cat.libelle}
                onPress={() => setCategory(cat.libelle)}
              />
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder={isDepense ? 'Ex : loyer' : 'Ex : augmentation'}
              placeholderTextColor="rgba(186, 203, 190, 0.4)"
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

            {/* Barre d'état du numpad */}
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
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <NumPad onPress={handleNumPress} />
          </>
        )}

        {/* Bouton enregistrer */}
        <TouchableOpacity
          style={[styles.saveBtn, !hasAmount && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!hasAmount}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={!hasAmount ? COLORS.textSecondary : '#003822'}
          />
          <Text style={[styles.saveBtnText, !hasAmount && styles.saveBtnTextDisabled]}>
            {isDepense ? 'Enregistrer la dépense' : 'Enregistrer le revenu'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const KEY_SIZE = (width - SPACING.marginX * 2 - 16) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ─────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // ── Budget hero ────────────────────────────
  budgetHero: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: SPACING.marginX,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 4,
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  budgetAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  budgetAmountOver: {
    color: '#ff6b6b',
  },
  budgetCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  budgetDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  budgetDelta: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Scroll ─────────────────────────────────
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.stackMd,
    paddingBottom: SPACING.stackLg,
    gap: SPACING.stackLg,
  },

  // ── Toggle ─────────────────────────────────
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#191f2f',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleBtnIncomeActive: {
    backgroundColor: '#00d68f',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: '#003822',
    fontWeight: '700',
  },

  // ── Sections ───────────────────────────────
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },

  // ── Montant input ──────────────────────────
  montantInput: {
    height: 52,
    backgroundColor: '#0F1E35',
    borderRadius: 14,
    paddingHorizontal: SPACING.marginX,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  montantInputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(68, 243, 169, 0.04)',
  },
  montantValue: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  montantPlaceholder: {
    color: 'rgba(186, 203, 190, 0.4)',
    fontWeight: '400',
    fontSize: 15,
  },

  // ── Sources ────────────────────────────────
  sourcesGrid: {
    flexDirection: 'row',
    gap: SPACING.gutter,
  },
  sourceCard: {
    flex: 1,
    height: 104,
    backgroundColor: '#191f2f',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-between',
  },
  sourceCardSelected: {
    backgroundColor: 'rgba(68, 243, 169, 0.07)',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  sourceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sourceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceIconSelected: {
    backgroundColor: 'rgba(68, 243, 169, 0.15)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.primary },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  sourceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sourceSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // ── Category chips ─────────────────────────
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.full,
  },
  chipActive: {
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: '#00d68f',
    shadowColor: '#00d68f',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  chipInactive: {
    backgroundColor: '#151b2b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#ffffff', fontWeight: '700' },
  chipTextInactive: { color: COLORS.textSecondary },

  // ── Description ────────────────────────────
  inputWrap: {
    height: 52,
    backgroundColor: '#0F1E35',
    borderRadius: 14,
    paddingHorizontal: SPACING.marginX,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  textInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    padding: 0,
  },

  // ── Zone bas fixe ───────────────────────────
  bottomArea: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.marginX,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },

  // ── Barre numpad ───────────────────────────
  numpadToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  numpadToolbarAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  numpadToolbarEmpty: {
    color: 'rgba(68, 243, 169, 0.3)',
  },
  numpadDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(68, 243, 169, 0.08)',
  },
  numpadDoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ── NumPad ─────────────────────────────────
  numpad: {
    gap: 8,
    marginBottom: 12,
  },
  numpadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  numpadKey: {
    width: KEY_SIZE,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#0F1E35',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  numpadKeyText: {
    fontSize: 22,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  numpadKeyComma: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // ── Bouton enregistrer ─────────────────────
  saveBtn: {
    height: 52,
    backgroundColor: '#00d68f',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#00d68f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#191f2f',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#003822',
  },
  saveBtnTextDisabled: {
    color: COLORS.textSecondary,
  },
});

export default AddTransactionScreen;
