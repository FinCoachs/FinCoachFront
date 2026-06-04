import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useTransactions } from '../src/context/TransactionsContext';
import { AppHeader } from '../src/components';


const TODAY     = new Date();
const YESTERDAY = new Date(TODAY);
YESTERDAY.setDate(TODAY.getDate() - 1);

// Filtres principaux (Module 4 : période, type, source)
const FILTERS = ['Tout', 'Ce mois', 'Dépenses', 'Revenus', 'Banque', 'MoMo', 'Espèces'];

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
  const today = new Date();

  switch (filter) {
    case 'Dépenses': result = result.filter((t) => t.type === 'dépense'); break;
    case 'Revenus':  result = result.filter((t) => t.type === 'entrée');  break;
    case 'Banque':   result = result.filter((t) => t.source !== 'MoMo' && t.source !== 'Liquidité'); break;
    case 'MoMo':     result = result.filter((t) => t.source === 'MoMo');       break;
    case 'Espèces':  result = result.filter((t) => t.source === 'Liquidité');  break;
    case 'Ce mois':
      result = result.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      });
      break;
    default: break;
  }

  if (categorie && categorie !== 'Toutes') {
    result = result.filter((t) => t.categorie === categorie);
  }

  return result;
};

// ============================================
// SUB-COMPONENTS
// ============================================

const Header = () => <AppHeader title="Transactions" />;

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

  // Résumé mensuel — calculé sur la liste complète, sans filtre
  const monthlySummary = useMemo(() => {
    const today   = new Date();
    const monthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const revenues = monthTxs
      .filter((t) => t.type === 'entrée')
      .reduce((sum, t) => sum + t.montant, 0);
    const expenses = monthTxs
      .filter((t) => t.type === 'dépense')
      .reduce((sum, t) => sum + t.montant, 0);
    return { revenues, expenses, net: revenues - expenses };
  }, [transactions]);

  // Catégories extraites dynamiquement des transactions existantes
  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.categorie).filter(Boolean));
    return ['Toutes', ...Array.from(cats)];
  }, [transactions]);

  const groups = useMemo(() => {
    let list = applyFilters(transactions, activeFilter, activeCategory);
    if (search.trim()) {
      list = list.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return groupByDate(list);
  }, [transactions, activeFilter, activeCategory, search]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <Header />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.screenTitle}>Mes Transactions</Text>

        {/* Module 5 — Résumé mensuel */}
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

        {/* Filtres principaux : période, type, source */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filtres catégories (Module 4) */}
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
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },

  // Chips catégorie (2ème rang, style distinct)
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
