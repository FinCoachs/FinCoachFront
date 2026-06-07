import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../src/context/ThemeContext';
import { useTransactions } from '../src/context/TransactionsContext';
import { useCategories } from '../src/context/CategoriesContext';
import { SPACING, BORDER_RADIUS } from '../src/constants/theme';

const { width } = Dimensions.get('window');

// ── Palettes de couleurs de repli ─────────────────────────────────────────────
const FALLBACK_COLORS = [
  '#44f3a9', '#f5b731', '#ff6b6b', '#4ecdc4', '#a78bfa',
  '#fb923c', '#34d399', '#f472b6', '#60a5fa', '#facc15',
];

// ── Helpers période ───────────────────────────────────────────────────────────

const getPeriodRange = (period) => {
  const now   = new Date();
  const start = new Date(now);
  if (period === 'Semaine') {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'Mois') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(now.getMonth() - 2);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
};

const getPrevRange = (period) => {
  const now   = new Date();
  const end   = new Date(now);
  const start = new Date(now);
  if (period === 'Semaine') {
    end.setDate(now.getDate() - 7);
    start.setDate(now.getDate() - 13);
  } else if (period === 'Mois') {
    end.setDate(0); // dernier jour du mois précédent
    start.setMonth(now.getMonth() - 1);
    start.setDate(1);
  } else {
    end.setMonth(now.getMonth() - 2);
    end.setDate(0);
    start.setMonth(now.getMonth() - 5);
    start.setDate(1);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const filterByRange = (txs, range) =>
  txs.filter((t) => {
    const d = new Date(t.date);
    return d >= range.start && d <= range.end;
  });

const pctChange = (curr, prev) => {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
};

// ── Graphique donut SVG ───────────────────────────────────────────────────────

const DONUT_SIZE    = 200;
const CX            = DONUT_SIZE / 2;
const CY            = DONUT_SIZE / 2;
const OUTER_R       = 80;
const INNER_R       = 52;

const toRad = (deg) => (deg * Math.PI) / 180;

const pt = (r, deg) => ({
  x: CX + r * Math.cos(toRad(deg - 90)),
  y: CY + r * Math.sin(toRad(deg - 90)),
});

const segment = (startDeg, endDeg) => {
  if (Math.abs(endDeg - startDeg) >= 359.9) endDeg = startDeg + 359.9;
  const o1 = pt(OUTER_R, startDeg);
  const o2 = pt(OUTER_R, endDeg);
  const i1 = pt(INNER_R, endDeg);
  const i2 = pt(INNER_R, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    'Z',
  ].join(' ');
};

const DonutChart = ({ data, total, colors }) => {
  if (total === 0) {
    return (
      <View style={[styles.donutEmpty, { borderColor: colors.border }]}>
        <Ionicons name="pie-chart-outline" size={36} color={colors.placeholder} />
        <Text style={[styles.donutEmptyText, { color: colors.placeholder }]}>Aucune dépense</Text>
      </View>
    );
  }

  let cumDeg = 0;
  const arcs = data.map((item) => {
    const sweep = (item.value / total) * 360;
    const path  = segment(cumDeg, cumDeg + sweep);
    cumDeg += sweep;
    return { ...item, path };
  });

  return (
    <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
      <G>
        {arcs.map((arc, i) => (
          <Path key={i} d={arc.path} fill={arc.color} />
        ))}
        <SvgText
          x={CX} y={CY - 8}
          textAnchor="middle" fontSize="22" fontWeight="800"
          fill={colors.textPrimary}
        >
          {Math.round((data[0]?.value / total) * 100) || 0}%
        </SvgText>
        <SvgText
          x={CX} y={CY + 12}
          textAnchor="middle" fontSize="11"
          fill={colors.textSecondary}
        >
          {data[0]?.label || ''}
        </SvgText>
      </G>
    </Svg>
  );
};

// ── Barre de catégorie ────────────────────────────────────────────────────────

const CatBar = ({ item, total, colors }) => {
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
  return (
    <View style={styles.catBarRow}>
      <View style={[styles.catDot, { backgroundColor: item.color }]} />
      <View style={styles.catBarInfo}>
        <View style={styles.catBarTop}>
          <Text style={[styles.catBarLabel, { color: colors.textPrimary }]} numberOfLines={1}>{item.label}</Text>
          <Text style={[styles.catBarPct, { color: colors.textSecondary }]}>{pct}%</Text>
        </View>
        <View style={[styles.catTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
          <View style={[styles.catFill, { width: `${pct}%`, backgroundColor: item.color }]} />
        </View>
        <Text style={[styles.catBarAmount, { color: colors.textSecondary }]}>
          {item.value.toLocaleString('fr-FR')} FCFA
        </Text>
      </View>
    </View>
  );
};

// ── Carte comparaison ─────────────────────────────────────────────────────────

const CompareCard = ({ label, current, previous, colorPos, colorNeg, colors }) => {
  const diff = pctChange(current, previous);
  const isUp = diff >= 0;
  const col  = isUp ? colorPos : colorNeg;
  return (
    <View style={[styles.compareItem, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
      <Text style={[styles.compareLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.compareAmount, { color: colors.textPrimary }]}>
        {current.toLocaleString('fr-FR')}
      </Text>
      <Text style={[styles.compareCurrency, { color: colors.placeholder }]}>FCFA</Text>
      <View style={[styles.compareChip, { backgroundColor: `${col}18` }]}>
        <Ionicons name={isUp ? 'arrow-up' : 'arrow-down'} size={11} color={col} />
        <Text style={[styles.compareChipText, { color: col }]}>{Math.abs(diff)}%</Text>
      </View>
    </View>
  );
};

// ── Écran principal ───────────────────────────────────────────────────────────

export const ReportsScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { transactions }   = useTransactions();
  const { categories }     = useCategories();

  const [period, setPeriod] = useState('Mois');
  const PERIODS = ['Semaine', 'Mois', '3 mois'];

  const range     = useMemo(() => getPeriodRange(period), [period]);
  const prevRange = useMemo(() => getPrevRange(period),   [period]);

  const current = useMemo(() => filterByRange(transactions, range),     [transactions, range]);
  const prev    = useMemo(() => filterByRange(transactions, prevRange), [transactions, prevRange]);

  const totalExpense     = useMemo(() => current.filter(t => t.type === 'dépense').reduce((s, t) => s + t.montant, 0), [current]);
  const totalIncome      = useMemo(() => current.filter(t => t.type === 'entrée').reduce((s, t) => s + t.montant, 0),  [current]);
  const prevTotalExpense = useMemo(() => prev.filter(t => t.type === 'dépense').reduce((s, t) => s + t.montant, 0),     [prev]);
  const prevTotalIncome  = useMemo(() => prev.filter(t => t.type === 'entrée').reduce((s, t) => s + t.montant, 0),      [prev]);

  // Dépenses groupées par catégorie
  const catData = useMemo(() => {
    const map = {};
    current
      .filter(t => t.type === 'dépense')
      .forEach(t => { map[t.categorie] = (map[t.categorie] || 0) + t.montant; });

    const catColorMap = {};
    categories.forEach(c => { catColorMap[c.libelle] = c.color; });

    return Object.entries(map)
      .map(([label, value], i) => ({
        label, value,
        color: catColorMap[label] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [current, categories]);

  const periodLabel = {
    Semaine: '7 derniers jours',
    Mois:    'Ce mois-ci',
    '3 mois':'3 derniers mois',
  }[period];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Statistiques</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{periodLabel}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Sélecteur de période */}
      <View style={[styles.periodRow, { borderBottomColor: colors.divider }]}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.periodChip,
              { borderColor: p === period ? colors.primary : colors.border },
              p === period && { backgroundColor: `${colors.primary}15` },
            ]}
            onPress={() => setPeriod(p)}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodChipText, { color: p === period ? colors.primary : colors.textSecondary }]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Résumé dépenses / revenus */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.expense}12`, borderColor: `${colors.expense}30` }]}>
            <Ionicons name="arrow-up-circle-outline" size={22} color={colors.expense} />
            <Text style={[styles.summaryCardLabel, { color: colors.expense }]}>DÉPENSES</Text>
            <Text style={[styles.summaryCardAmount, { color: colors.expense }]}>
              {totalExpense.toLocaleString('fr-FR')}
            </Text>
            <Text style={[styles.summaryCardCurr, { color: `${colors.expense}99` }]}>FCFA</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: `${colors.income}12`, borderColor: `${colors.income}30` }]}>
            <Ionicons name="arrow-down-circle-outline" size={22} color={colors.income} />
            <Text style={[styles.summaryCardLabel, { color: colors.income }]}>REVENUS</Text>
            <Text style={[styles.summaryCardAmount, { color: colors.income }]}>
              {totalIncome.toLocaleString('fr-FR')}
            </Text>
            <Text style={[styles.summaryCardCurr, { color: `${colors.income}99` }]}>FCFA</Text>
          </View>
        </View>

        {/* Donut + légende */}
        {catData.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Répartition des dépenses</Text>

            <View style={styles.donutRow}>
              <DonutChart data={catData} total={totalExpense} colors={colors} />

              <View style={styles.legend}>
                {catData.slice(0, 5).map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.legendLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Barres par catégorie */}
        {catData.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Par catégorie</Text>
            {catData.map((item) => (
              <CatBar key={item.label} item={item} total={totalExpense} colors={colors} />
            ))}
          </View>
        )}

        {/* Comparaison période précédente */}
        <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Vs période précédente
          </Text>
          <View style={styles.compareRow}>
            <CompareCard
              label="Dépenses"
              current={totalExpense}
              previous={prevTotalExpense}
              colorPos={colors.expense}
              colorNeg={colors.income}
              colors={colors}
            />
            <CompareCard
              label="Revenus"
              current={totalIncome}
              previous={prevTotalIncome}
              colorPos={colors.income}
              colorNeg={colors.expense}
              colors={colors}
            />
          </View>
          <Text style={[styles.compareHint, { color: colors.placeholder }]}>
            {period === 'Semaine' ? 'Comparé aux 7 jours précédents'
              : period === 'Mois' ? 'Comparé au mois précédent'
              : 'Comparé aux 3 mois précédents'}
          </Text>
        </View>

        {/* État vide global */}
        {catData.length === 0 && totalIncome === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={52} color={colors.placeholder} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Aucune donnée</Text>
            <Text style={[styles.emptyHint, { color: colors.placeholder }]}>
              Ajoutez ou importez des transactions pour voir vos statistiques.
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX, height: 60,
    borderBottomWidth: 1,
  },
  backBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSub:   { fontSize: 11, marginTop: 1 },

  periodRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: SPACING.marginX, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  periodChip: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1,
  },
  periodChipText: { fontSize: 13, fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.stackLg,
    gap: SPACING.stackLg,
  },

  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1, borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
    padding: SPACING.stackMd, gap: 4, alignItems: 'flex-start',
  },
  summaryCardLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  summaryCardAmount: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  summaryCardCurr:   { fontSize: 11, fontWeight: '500' },

  sectionCard: {
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1,
    padding: SPACING.stackLg, gap: SPACING.stackMd,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, marginBottom: 4 },

  donutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  donutEmpty: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  donutEmptyText: { fontSize: 11 },

  legend:      { flex: 1, gap: 10, paddingLeft: 12 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, flex: 1 },

  catBarRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  catDot:    { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  catBarInfo: { flex: 1, gap: 4 },
  catBarTop: { flexDirection: 'row', justifyContent: 'space-between' },
  catBarLabel:  { fontSize: 13, fontWeight: '600', flex: 1 },
  catBarPct:    { fontSize: 12, fontWeight: '600' },
  catTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  catFill:  { height: '100%', borderRadius: 3 },
  catBarAmount: { fontSize: 11 },

  compareRow: { flexDirection: 'row', gap: 12 },
  compareItem: {
    flex: 1, borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
    padding: SPACING.stackMd, gap: 2,
  },
  compareLabel:    { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  compareAmount:   { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  compareCurrency: { fontSize: 10, fontWeight: '500', marginBottom: 4 },
  compareChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    alignSelf: 'flex-start',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20,
  },
  compareChipText: { fontSize: 11, fontWeight: '700' },
  compareHint:     { fontSize: 11, textAlign: 'center', marginTop: 2 },

  emptyState: {
    alignItems: 'center', paddingVertical: 48, gap: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptyHint:  { fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});

export default ReportsScreen;
