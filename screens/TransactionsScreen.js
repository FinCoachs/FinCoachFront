import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useTransactions } from '../src/context/TransactionsContext';
import { AppHeader, MomoImportModal } from '../src/components';


const TODAY     = new Date();
const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(TODAY.getDate() - 1);

const TYPE_FILTERS = ['Revenus', 'Dépenses'];

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// ── Sélecteur mois / année ────────────────────────────────

const MonthYearPicker = ({ visible, month, year, onSelect, onClose, colors }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose} />
    <View style={[pickerStyles.sheet, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
      {/* Année */}
      <View style={pickerStyles.yearRow}>
        <TouchableOpacity onPress={() => onSelect(month, year - 1)} style={pickerStyles.yearBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[pickerStyles.yearText, { color: colors.textPrimary }]}>{year}</Text>
        <TouchableOpacity
          onPress={() => onSelect(month, year + 1)}
          style={pickerStyles.yearBtn}
          activeOpacity={0.7}
          disabled={year >= new Date().getFullYear()}
        >
          <Ionicons name="chevron-forward" size={20} color={year >= new Date().getFullYear() ? colors.placeholder : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Grille mois */}
      <View style={pickerStyles.monthGrid}>
        {MOIS.map((m, i) => {
          const active = i === month && year === year;
          const isFuture = year === new Date().getFullYear() && i > new Date().getMonth();
          return (
            <TouchableOpacity
              key={m}
              disabled={isFuture}
              onPress={() => { onSelect(i, year); onClose(); }}
              style={[
                pickerStyles.monthCell,
                i === month && { backgroundColor: colors.primary },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                pickerStyles.monthText,
                { color: isFuture ? colors.placeholder : i === month ? colors.onPrimary : colors.textSecondary },
              ]}>
                {m}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  </Modal>
);

const pickerStyles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute', top: 70, right: 16,
    borderRadius: 16, borderWidth: 1,
    padding: 16, width: 240,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
  },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  yearBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  yearText: { fontSize: 16, fontWeight: '700' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  monthCell: {
    width: '30%', paddingVertical: 8,
    borderRadius: 8, alignItems: 'center',
  },
  monthText: { fontSize: 12, fontWeight: '600' },
});

// ============================================
// HELPERS
// ============================================

const dateKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
};

const dateLabel = (d) => {
  const dt = new Date(d);
  if (dateKey(dt) === dateKey(TODAY)) return "AUJOURD'HUI";
  if (dateKey(dt) === dateKey(YESTERDAY)) return 'HIER';
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }).toUpperCase();
};

const groupByDate = (list) => {
  const map = {};
  list.forEach((t) => {
    const key = dateKey(t.date);
    if (!map[key]) {
      map[key] = { key, label: dateLabel(t.date), items: [], total: 0 };
    }
    map[key].items.push(t);
    map[key].total += t.type === 'entrée' ? t.montant : -t.montant;
  });
  return Object.values(map);
};

const applyFilters = (list, filter, categorie) => {
  let result = list;
  if (filter === 'Dépenses') result = result.filter((t) => t.type === 'dépense');
  if (filter === 'Revenus')  result = result.filter((t) => t.type === 'entrée');
  if (categorie && categorie !== 'Toutes') {
    result = result.filter((t) => t.categorie === categorie);
  }
  return result;
};

// ============================================
// SUB-COMPONENTS
// ============================================


// Module 5 — Résumé mensuel
const MonthlySummaryCard = ({ revenues, expenses, net }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const raw   = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const label = raw.charAt(0).toUpperCase() + raw.slice(1);
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Résumé — {label}</Text>
      <View style={styles.summaryRow}>

        <View style={styles.summaryCol}>
          <View style={[styles.summaryDot, { backgroundColor: colors.income }]} />
          <Text style={styles.summaryLabel}>Revenus</Text>
          <Text style={[styles.summaryAmount, styles.incomeText]}>
            +{revenues.toLocaleString('fr-FR')}
          </Text>
          <Text style={styles.summaryCurrency}>FCFA</Text>
        </View>

        <View style={styles.summarySep} />

        <View style={styles.summaryCol}>
          <View style={[styles.summaryDot, { backgroundColor: colors.expense }]} />
          <Text style={styles.summaryLabel}>Dépenses</Text>
          <Text style={[styles.summaryAmount, styles.expenseText]}>
            -{expenses.toLocaleString('fr-FR')}
          </Text>
          <Text style={styles.summaryCurrency}>FCFA</Text>
        </View>

        <View style={styles.summarySep} />

        <View style={styles.summaryCol}>
          <View style={[styles.summaryDot, { backgroundColor: net >= 0 ? colors.income : colors.expense }]} />
          <Text style={styles.summaryLabel}>Net</Text>
          <Text style={[styles.summaryAmount, net >= 0 ? styles.incomeText : styles.expenseText]}>
            {net >= 0 ? '+' : '-'}{Math.abs(net).toLocaleString('fr-FR')}
          </Text>
          <Text style={styles.summaryCurrency}>FCFA</Text>
        </View>

      </View>
    </View>
  );
};

const SourceBadge = ({ source }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const isMomo    = source === 'MoMo';
  const isEspeces = source === 'Liquidité';
  return (
    <View style={[
      styles.badge,
      isMomo    ? styles.badgeMomo    :
      isEspeces ? styles.badgeEspeces :
                  styles.badgeBank,
    ]}>
      <Text style={[styles.badgeText, isMomo ? styles.badgeTextMomo : styles.badgeTextBank]}>
        {source}
      </Text>
    </View>
  );
};

const CategoryBadge = ({ categorie }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.categoryBadge}>
      <Text style={styles.categoryBadgeText}>{categorie}</Text>
    </View>
  );
};

const TransactionRow = ({ item }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const isDepense = item.type === 'dépense';
  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionRow}>
        <Text style={styles.transactionName}>{item.name}</Text>
        <Text style={[styles.transactionAmount, isDepense ? styles.expenseText : styles.incomeText]}>
          {isDepense ? '- ' : '+ '}{item.montant.toLocaleString('fr-FR')}
        </Text>
      </View>
      <View style={styles.badgesRow}>
        <CategoryBadge categorie={item.categorie} />
        <SourceBadge source={item.source} />
      </View>
    </View>
  );
};

const GroupHeader = ({ label, total }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const isPositive = total >= 0;
  return (
    <View style={styles.groupHeader}>
      <Text style={styles.groupLabel}>{label}</Text>
      <Text style={[styles.groupTotal, isPositive ? styles.incomeText : styles.expenseText]}>
        {isPositive ? '+ ' : '- '}{Math.abs(total).toLocaleString('fr-FR')} FCFA
      </Text>
    </View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

export const TransactionsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const { transactions } = useTransactions();

  const [search, setSearch]                 = useState('');
  const [activeFilter, setActiveFilter]     = useState('Tout');
  const [activeCategory, setActiveCategory] = useState('Toutes');
  const [pickerVisible, setPickerVisible]   = useState(false);
  const [momoVisible,   setMomoVisible]     = useState(false);
  const [viewMode,      setViewMode]        = useState('Mois'); // 'Semaine' | 'Mois'
  const [selMonth, setSelMonth]             = useState(new Date().getMonth());
  const [selYear,  setSelYear]              = useState(new Date().getFullYear());

  // Plage selon le mode (Semaine = 7 derniers jours, Mois = mois sélectionné)
  const weekStart = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const inPeriod = (date) => {
    const d = new Date(date);
    if (viewMode === 'Semaine') return d >= weekStart;
    return d.getMonth() === selMonth && d.getFullYear() === selYear;
  };

  const periodLabel = useMemo(() => {
    if (viewMode === 'Semaine') return '7 derniers jours';
    const raw = new Date(selYear, selMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [viewMode, selMonth, selYear]);

  // Résumé de la période active
  const monthlySummary = useMemo(() => {
    const periodTxs = transactions.filter((t) => inPeriod(t.date));
    const revenues = periodTxs.filter((t) => t.type === 'entrée').reduce((sum, t) => sum + t.montant, 0);
    const expenses = periodTxs.filter((t) => t.type === 'dépense').reduce((sum, t) => sum + t.montant, 0);
    return { revenues, expenses, net: revenues - expenses };
  }, [transactions, viewMode, selMonth, selYear]);

  // Catégories extraites dynamiquement des transactions existantes
  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.categorie).filter(Boolean));
    return ['Toutes', ...Array.from(cats)];
  }, [transactions]);

  const groups = useMemo(() => {
    let list = applyFilters(transactions, activeFilter, activeCategory);
    list = list.filter((t) => inPeriod(t.date));
    if (search.trim()) {
      list = list.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
    }
    return groupByDate(list);
  }, [transactions, activeFilter, activeCategory, search, viewMode, selMonth, selYear]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <AppHeader
        title="Transactions"
        subtitle={periodLabel}
        rightContent={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.monthBtn, { backgroundColor: colors.inputBg, borderColor: colors.borderLight }]}
              onPress={() => setMomoVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.monthBtnLabel, { color: colors.textSecondary }]}>SMS</Text>
            </TouchableOpacity>
            {viewMode === 'Mois' && (
              <TouchableOpacity
                style={[styles.monthBtn, { backgroundColor: colors.inputBg, borderColor: colors.borderLight }]}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Ionicons name="chevron-down" size={13} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <MonthYearPicker
        visible={pickerVisible}
        month={selMonth}
        year={selYear}
        onSelect={(m, y) => { setSelMonth(m); setSelYear(y); }}
        onClose={() => setPickerVisible(false)}
        colors={colors}
      />

      <MomoImportModal
        visible={momoVisible}
        onClose={() => setMomoVisible(false)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>Mes Transactions</Text>

        {/* Toggle Semaine / Mois */}
        <View style={[styles.viewToggle, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
          {['Semaine', 'Mois'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.viewToggleBtn,
                viewMode === m && { backgroundColor: colors.primary },
              ]}
              onPress={() => setViewMode(m)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.viewToggleTxt,
                { color: viewMode === m ? colors.onPrimary : colors.textSecondary },
              ]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Résumé de la période */}
        <MonthlySummaryCard
          revenues={monthlySummary.revenues}
          expenses={monthlySummary.expenses}
          net={monthlySummary.net}
        />

        {/* Recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une transaction…"
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filtres type : Revenus / Dépenses */}
        <View style={styles.typeFiltersRow}>
          {TYPE_FILTERS.map((f) => {
            const active    = activeFilter === f;
            const isRevenu  = f === 'Revenus';
            const dotColor  = isRevenu ? colors.income : colors.expense;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.typeChip,
                  { borderColor: active ? dotColor : colors.borderLight },
                  active && { backgroundColor: `${dotColor}12` },
                ]}
                onPress={() => setActiveFilter(active ? 'Tout' : f)}
                activeOpacity={0.7}
              >
                <View style={[styles.typeDot, { backgroundColor: dotColor, opacity: active ? 1 : 0.45 }]} />
                <Text style={[styles.typeChipText, { color: active ? dotColor : colors.textSecondary }]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filtres catégories */}
        <View style={styles.catSection}>
          <Text style={[styles.catSectionLabel, { color: colors.textSecondary }]}>Catégorie</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, styles.catChip, activeCategory === cat && styles.catChipActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterChipText,
                  activeCategory === cat ? styles.catChipTextActive : styles.catChipText,
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Groupes de transactions */}
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.placeholder} />
            <Text style={styles.emptyText}>Aucune transaction trouvée</Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.key} style={styles.group}>
              <GroupHeader label={group.label} total={group.total} />
              <View style={styles.groupItems}>
                {group.items.map((item) => (
                  <TransactionRow key={item.id} item={item} />
                ))}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color={colors.onPrimary} />
      </TouchableOpacity>

    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  monthBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  monthBtnLabel: { fontSize: 12, fontWeight: '600' },

  viewToggle: {
    flexDirection: 'row', borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, padding: 3, alignSelf: 'flex-start',
  },
  viewToggleBtn: {
    paddingHorizontal: 18, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  viewToggleTxt: { fontSize: 13, fontWeight: '700' },


  // ── Scroll ─────────────────────────────────
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.stackLg,
    gap: SPACING.stackMd,
  },

  // ── Titre ──────────────────────────────────
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // ── Carte résumé mensuel ───────────────────
  summaryCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  summaryCurrency: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summarySep: {
    width: 1,
    height: 44,
    backgroundColor: colors.border,
  },

  // ── Recherche ──────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },

  // ── Filtres type (Revenus / Dépenses) ──────
  typeFiltersRow: {
    flexDirection: 'row',
    gap: SPACING.stackSm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Section catégorie ───────────────────────
  catSection: {
    gap: SPACING.stackSm,
  },
  catSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── Chips de filtre ────────────────────────
  filtersScroll: {
    marginHorizontal: -SPACING.marginX,
  },
  filtersContent: {
    paddingHorizontal: SPACING.marginX,
    gap: 8,
    paddingBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Chips catégorie
  catChip: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: 'rgba(68, 243, 169, 0.1)',
    borderColor: colors.primary,
  },
  catChipText: {
    color: colors.placeholder,
  },
  catChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // ── Groupes ────────────────────────────────
  group: {
    gap: SPACING.stackMd,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.placeholder,
  },
  groupTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupItems: {
    gap: SPACING.stackSm,
  },

  // ── Carte transaction ──────────────────────
  transactionCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  expenseText: { color: colors.expense },
  incomeText:  { color: colors.income },

  // ── Badges ─────────────────────────────────
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeMomo: {
    backgroundColor: '#ffcc00',
  },
  badgeBank: {
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeEspeces: {
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeTextMomo: { color: '#000000' },
  badgeTextBank: { color: colors.textPrimary },

  // ── État vide ──────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.placeholder,
  },

  // ── FAB ────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 80,
    right: SPACING.marginX,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 40,
  },
});

export default TransactionsScreen;
