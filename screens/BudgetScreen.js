import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { CategoryModal, AppHeader } from '../src/components';
import { useCategories } from '../src/context/CategoriesContext';
import { useTransactions } from '../src/context/TransactionsContext';

const BAR_H = 48;

// ============================================
// HELPERS — règle colorimétrique du doc :
//   vert < 70% / orange 70–90% / rouge ≥ 90%
// ============================================

const getPct = (depense, plafond) =>
  plafond > 0 ? Math.min(Math.round((depense / plafond) * 100), 100) : 0;

// Ces couleurs sont sémantiques (état budget), pas thématiques — restent hardcodées
const COLOR_OK      = '#44f3a9';
const COLOR_WARNING = '#ffba4b';
const COLOR_DANGER  = '#ff6b6b';

const getBarColor = (pct) => {
  if (pct >= 90) return COLOR_DANGER;
  if (pct >= 70) return COLOR_WARNING;
  return COLOR_OK;
};

// ============================================
// SUB-COMPONENTS
// ============================================

const GlobalSummaryCard = ({ totalDepense, totalBudget }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const pct       = getPct(totalDepense, totalBudget);
  const remaining = totalBudget - totalDepense;
  const barColor  = getBarColor(pct);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View>
          <Text style={styles.summaryCaption}>DÉPENSES TOTALES</Text>
          <View style={styles.summaryAmountRow}>
            <Text style={styles.summaryAmount}>{totalDepense.toLocaleString('fr-FR')}</Text>
            <Text style={styles.summaryCurrency}> FCFA</Text>
          </View>
        </View>
        <View style={styles.summaryIconWrap}>
          <Ionicons name="wallet" size={24} color={colors.primary} />
        </View>
      </View>

      <View style={styles.summaryProgressWrap}>
        <View style={styles.summaryProgressLabels}>
          <Text style={styles.summaryProgressLeft}>{pct}% de votre budget utilisé</Text>
          <Text style={styles.summaryProgressRight}>
            {totalBudget.toLocaleString('fr-FR')} FCFA total
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={styles.summaryRemainingText}>
          Il vous reste{' '}
          <Text style={styles.summaryRemainingBold}>
            {remaining.toLocaleString('fr-FR')} FCFA
          </Text>{' '}
          pour finir le mois.
        </Text>
      </View>
    </View>
  );
};

const AlertBanner = ({ items }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  if (items.length === 0) return null;
  return (
    <View style={styles.alertBanner}>
      <View style={styles.alertBannerRow}>
        <Ionicons name="warning" size={15} color={COLOR_WARNING} />
        <Text style={styles.alertBannerTitle}>
          {items.length > 1 ? 'Alertes budget' : 'Alerte budget'}
        </Text>
      </View>
      {items.map((cat) => {
        const pct   = getPct(cat.depense, cat.plafond);
        const color = getBarColor(pct);
        return (
          <Text key={cat.id} style={styles.alertBannerItem}>
            {'· '}
            <Text style={styles.alertBannerCatName}>{cat.libelle}</Text>
            {' atteint '}
            <Text style={[styles.alertBannerPct, { color }]}>{pct}%</Text>
            {' de son plafond'}
          </Text>
        );
      })}
    </View>
  );
};

const CategoryItem = ({ cat }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const pct      = getPct(cat.depense, cat.plafond);
  const barColor = getBarColor(pct);
  const fillH    = (pct / 100) * BAR_H;
  const amtColor = pct >= 90 ? COLOR_DANGER : pct >= 70 ? COLOR_WARNING : colors.textSecondary;

  return (
    <View style={styles.catItem}>
      <View style={[styles.catColorBadge, { backgroundColor: `${cat.color}20`, borderColor: `${cat.color}50` }]}>
        <View style={[styles.catColorDot, { backgroundColor: cat.color }]} />
      </View>

      <View style={styles.catInfo}>
        <View style={styles.catNameRow}>
          <Text style={styles.catName}>{cat.libelle}</Text>
          {pct >= 90 && <Ionicons name="warning"              size={13} color={COLOR_DANGER}  style={styles.catAlert} />}
          {pct >= 70 && pct < 90 && <Ionicons name="alert-circle-outline" size={13} color={COLOR_WARNING} style={styles.catAlert} />}
        </View>
        <Text style={[styles.catAmounts, { color: amtColor }]}>
          {cat.depense.toLocaleString('fr-FR')} / {cat.plafond.toLocaleString('fr-FR')} FCFA
        </Text>
      </View>

      <View style={styles.miniBarWrap}>
        <Text style={[styles.miniBarPct, { color: amtColor }]}>{pct}%</Text>
        <View style={styles.miniBarTrack}>
          <View style={[styles.miniBarFill, { height: fillH, backgroundColor: barColor }]} />
        </View>
      </View>
    </View>
  );
};

// ============================================
// MAIN SCREEN
// ============================================

export const BudgetScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const { categories: allCategories, addCategory } = useCategories();
  const { transactions }                           = useTransactions();

  const [createVisible, setCreateVisible] = useState(false);

  // Catégories avec plafond défini — dépenses calculées depuis les vraies transactions
  const budgetCategories = allCategories
    .filter((c) => c.plafond != null && c.plafond > 0)
    .map((c) => {
      const depense = transactions
        .filter((t) => t.categorie === c.libelle && t.type === 'dépense')
        .reduce((sum, t) => sum + t.montant, 0);
      return { ...c, depense };
    });

  const totalBudget  = budgetCategories.reduce((s, c) => s + c.plafond,  0);
  const totalDepense = budgetCategories.reduce((s, c) => s + c.depense, 0);
  const alertItems   = budgetCategories.filter((c) => getPct(c.depense, c.plafond) >= 70);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* ── Header ── */}
      <AppHeader title="Budgets" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlobalSummaryCard totalDepense={totalDepense} totalBudget={totalBudget} />

        <AlertBanner items={alertItems} />

        {/* Liste des catégories */}
        <View style={styles.catCard}>
          <View style={styles.catCardHeader}>
            <Text style={styles.catCardTitle}>Catégories</Text>
            {/* Bouton "+" pour créer une catégorie */}
            <TouchableOpacity
              style={styles.addCatBtn}
              onPress={() => setCreateVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.addCatBtnText}>Nouvelle</Text>
            </TouchableOpacity>
          </View>

          {budgetCategories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune catégorie de dépense.</Text>
              <Text style={styles.emptyHint}>Appuyez sur "Nouvelle" pour en créer une.</Text>
            </View>
          ) : (
            budgetCategories.map((cat, i) => (
              <View key={cat.id}>
                <CategoryItem cat={cat} />
                {i < budgetCategories.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal — Créer une catégorie */}
      <CategoryModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSave={(newCat) => addCategory(newCat)}
      />


    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // ── Scroll ─────────────────────────────────
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.stackLg,
    gap: SPACING.stackMd,
  },

  // ── Résumé global ──────────────────────────
  summaryCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.stackLg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: SPACING.stackMd,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryCaption: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4,
  },
  summaryAmountRow: { flexDirection: 'row', alignItems: 'flex-end' },
  summaryAmount:   { fontSize: 36, fontWeight: '700', color: colors.textPrimary, letterSpacing: -1 },
  summaryCurrency: { fontSize: 16, fontWeight: '500', color: colors.placeholder, marginBottom: 6 },
  summaryIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(68,243,169,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryProgressWrap: { gap: 8 },
  summaryProgressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryProgressLeft:  { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  summaryProgressRight: { fontSize: 11, fontWeight: '700', color: colors.primary },
  progressTrack: {
    height: 10, backgroundColor: colors.surfaceContainerHigh,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden',
  },
  progressFill:  { height: '100%', borderRadius: BORDER_RADIUS.full },
  summaryRemainingText: { fontSize: 13, color: colors.placeholder, marginTop: 2 },
  summaryRemainingBold: { color: colors.textPrimary, fontWeight: '700' },

  // ── Alertes ────────────────────────────────
  alertBanner: {
    backgroundColor: 'rgba(255,186,75,0.07)',
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,186,75,0.2)',
    gap: 6,
  },
  alertBannerRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  alertBannerTitle:  { fontSize: 13, fontWeight: '700', color: COLOR_WARNING },
  alertBannerItem:   { fontSize: 12, color: colors.placeholder, paddingLeft: 2 },
  alertBannerCatName:{ color: colors.textPrimary, fontWeight: '600' },
  alertBannerPct:    { fontWeight: '700' },

  // ── Carte liste catégories ─────────────────
  catCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  catCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.stackLg,
    paddingVertical: SPACING.stackMd,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  catCardTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(68,243,169,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(68,243,169,0.25)',
  },
  addCatBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  // ── Item catégorie ─────────────────────────
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.stackLg,
    paddingVertical: SPACING.stackMd,
    gap: SPACING.stackMd,
  },
  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: SPACING.stackLg },
  catColorBadge: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  catColorDot: { width: 20, height: 20, borderRadius: 10 },
  catInfo: { flex: 1, gap: 4 },
  catNameRow: { flexDirection: 'row', alignItems: 'center' },
  catName:  { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  catAlert: { marginLeft: 6 },
  catAmounts: { fontSize: 11, fontWeight: '500' },

  // ── Mini barre verticale ───────────────────
  miniBarWrap:  { alignItems: 'center', gap: 4 },
  miniBarPct:   { fontSize: 11, fontWeight: '700' },
  miniBarTrack: {
    width: 16, height: BAR_H,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden',
  },
  miniBarFill:  { width: '100%', borderRadius: 8 },

  // ── État vide ──────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 6 },
  emptyText:  { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  emptyHint:  { fontSize: 12, color: colors.placeholder },
});

export default BudgetScreen;
