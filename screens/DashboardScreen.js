import { useMemo, useState, useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { SPACING, BORDER_RADIUS, getShadow } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useUser } from '../src/context/UserContext';
import { useTransactions } from '../src/context/TransactionsContext';
import { useCategories } from '../src/context/CategoriesContext';
import { useAccounts } from '../src/context/AccountContext';
import { AppHeader } from '../src/components';

const { width } = Dimensions.get('window');
const CHART_W = width - SPACING.marginX * 2 - 32;
const CHART_H = 90;


// ── Helpers ───────────────────────────────────────────────

const formatAmount = (n) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 0 });

const formatDate = (date) => {
  const d    = new Date(date);
  const now  = new Date();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())  return "Aujourd'hui";
  if (d.toDateString() === yest.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const getPctColor = (pct) =>
  pct >= 90 ? '#FF5C5C' : pct >= 70 ? '#F5B731' : '#3DE8A0';

// ── Graphique dynamique ───────────────────────────────────

const buildChartPath = (transactions, w, h) => {
  const DAYS = 7;
  const today = new Date();

  const dailyNets = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (DAYS - 1 - i));
    const dStr = d.toDateString();
    return transactions
      .filter(t => new Date(t.date).toDateString() === dStr)
      .reduce((sum, t) => sum + (t.type === 'entrée' ? t.montant : -t.montant), 0);
  });

  let running = 0;
  const values = dailyNets.map(n => { running += n; return running; });

  const minV = Math.min(0, ...values);
  const maxV = Math.max(0, ...values);

  if (maxV === 0 && minV === 0) {
    // Courbe décorative si aucune donnée
    const y = h * 0.65;
    const line = `M0 ${y} C${(w*0.25).toFixed(1)} ${(y*0.75).toFixed(1)},${(w*0.55).toFixed(1)} ${(h*0.5).toFixed(1)},${w.toFixed(1)} ${(h*0.28).toFixed(1)}`;
    return { line, area: `${line} V${h} H0 Z` };
  }

  const range = maxV - minV;
  const pad   = h * 0.12;
  const yOf   = v => h - pad - ((v - minV) / range) * (h - 2 * pad);
  const xOf   = i => (i / (DAYS - 1)) * w;
  const pts   = values.map((v, i) => ({ x: xOf(i), y: yOf(v) }));

  let line = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const dx = (pts[i].x - pts[i - 1].x) * 0.4;
    line += ` C${(pts[i-1].x+dx).toFixed(1)} ${pts[i-1].y.toFixed(1)},${(pts[i].x-dx).toFixed(1)} ${pts[i].y.toFixed(1)},${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return { line, area: `${line} V${h} H0 Z` };
};

// ── Bouton pulsé vers les statistiques ────────────────────

const PulseButton = ({ onPress }) => {
  const { colors } = useTheme();
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.18, duration: 750, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,    duration: 750, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5,  duration: 750, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1,    duration: 750, useNativeDriver: true }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Animated.View style={[
        pulseStyles.btn,
        { backgroundColor: colors.primary, shadowColor: colors.primary },
        { transform: [{ scale }], opacity },
      ]}>
        <Ionicons name="bar-chart" size={20} color={colors.onPrimary} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const pulseStyles = StyleSheet.create({
  btn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 14, elevation: 8,
  },
});

// ── Header ────────────────────────────────────────────────

const Header = () => {
  const { firstName, initial } = useUser();
  const date     = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const subtitle = date.charAt(0).toUpperCase() + date.slice(1);
  const name     = firstName || 'vous';
  return (
    <AppHeader
      title={`Bonjour, ${name} 👋`}
      subtitle={subtitle}
      avatarLabel={initial || '?'}
      showThemeToggle
    />
  );
};

// ── Carte solde ───────────────────────────────────────────

const BalanceCard = ({ totalBalance, monthlyIncome, monthlyExpense, transactions, onStatsPress }) => {
  const { colors, isDark } = useTheme();
  const s      = getStyles(colors, isDark);
  const shadow = getShadow(isDark);

  const { line: linePath, area: areaPath } = useMemo(
    () => buildChartPath(transactions, CHART_W, CHART_H),
    [transactions],
  );

  return (
    <View style={[s.balanceCard, shadow.md]}>
      <View style={s.balanceTop}>
        <View>
          <Text style={s.balanceLabel}>SOLDE CONSOLIDÉ</Text>
          <Text style={s.balanceAmount}>
            {formatAmount(totalBalance)}{' '}
            <Text style={s.balanceCurrency}>FCFA</Text>
          </Text>
        </View>
        <PulseButton onPress={onStatsPress} />
      </View>

      {/* Graphique dynamique */}
      <Svg width={CHART_W} height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0%"   stopColor={colors.primaryDark} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={colors.primaryDark} stopOpacity="0"    />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#grad)" />
        <Path d={linePath} fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
      </Svg>

      {/* Résumé mensuel inline */}
      <View style={s.balanceStats}>
        <View style={s.statItem}>
          <View style={[s.statDot, { backgroundColor: colors.income }]} />
          <View>
            <Text style={s.statLabel}>Revenus</Text>
            <Text style={[s.statValue, { color: colors.income }]}>+{formatAmount(monthlyIncome)}</Text>
          </View>
        </View>
        <View style={s.statSep} />
        <View style={s.statItem}>
          <View style={[s.statDot, { backgroundColor: colors.expense }]} />
          <View>
            <Text style={s.statLabel}>Dépenses</Text>
            <Text style={[s.statValue, { color: colors.expense }]}>-{formatAmount(monthlyExpense)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ── Carte compte ──────────────────────────────────────────

const AccountCard = ({ account }) => {
  const { colors, isDark } = useTheme();
  const s      = getStyles(colors, isDark);
  const shadow = getShadow(isDark);
  return (
    <View style={[s.accountCard, shadow.sm]}>
      <View style={[s.accountBadge, { backgroundColor: account.bg }]}>
        <Text style={[s.accountBadgeText, { color: account.textColor }]}>{account.abbr}</Text>
      </View>
      <View style={s.accountInfo}>
        <Text style={s.accountName}>{account.name}</Text>
        <Text style={s.accountType}>{account.typeLabel}</Text>
      </View>
      <View style={s.accountBalanceWrap}>
        <Text style={s.accountBalance}>{formatAmount(account.balance)}</Text>
        <Text style={s.accountCurrency}>FCFA</Text>
      </View>
    </View>
  );
};

// ── Carte budget ──────────────────────────────────────────

const BudgetCard = ({ cat }) => {
  const { colors, isDark } = useTheme();
  const s        = getStyles(colors, isDark);
  const barColor = getPctColor(cat.pct);
  return (
    <View style={[s.budgetCard, getShadow(isDark).sm]}>
      <View style={[s.budgetDotWrap, { backgroundColor: `${cat.color}22` }]}>
        <View style={[s.budgetDot, { backgroundColor: cat.color }]} />
      </View>
      <Text style={s.budgetName}>{cat.libelle}</Text>
      <Text style={s.budgetSub}>
        {formatAmount(cat.spent)} / {formatAmount(cat.plafond)}
      </Text>
      <View style={s.budgetTrack}>
        <View style={[s.budgetFill, { width: `${cat.pct}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[s.budgetPct, { color: barColor }]}>{cat.pct}%</Text>
    </View>
  );
};

// ── Item transaction ──────────────────────────────────────

const TxItem = ({ tx, catColor, isLast }) => {
  const { colors, isDark } = useTheme();
  const s        = getStyles(colors, isDark);
  const isDepense = tx.type === 'dépense';
  return (
    <View style={[s.txRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
      <View style={[s.txIconWrap, { backgroundColor: `${catColor}20` }]}>
        <View style={[s.txIconDot, { backgroundColor: catColor }]} />
      </View>
      <View style={s.txInfo}>
        <Text style={s.txName} numberOfLines={1}>{tx.name}</Text>
        <Text style={s.txDate}>{formatDate(tx.date)} · {tx.source}</Text>
      </View>
      <Text style={[s.txAmount, { color: isDepense ? colors.expense : colors.income }]}>
        {isDepense ? '−' : '+'}{formatAmount(tx.montant)}
      </Text>
    </View>
  );
};

// ── Section header ────────────────────────────────────────

const SectionTitle = ({ title }) => {
  const { colors } = useTheme();
  const s = getStyles(colors);
  return <Text style={s.sectionTitle}>{title}</Text>;
};

// ── Modal — Ajouter un compte ─────────────────────────────

const AddAccountModal = ({ visible, onClose, onAdd }) => {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors);

  const [name,   setName]   = useState('');
  const [numero, setNumero] = useState('');
  const [solde,  setSolde]  = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(''); setNumero(''); setSolde(''); };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Veuillez saisir un nom pour ce compte.');
      return;
    }
    if (!numero.trim() || numero.trim().length < 8) {
      Alert.alert('Numéro invalide', 'Le numéro de compte doit contenir au moins 8 caractères.');
      return;
    }
    const solde_initial = parseFloat(solde.replace(/\s/g, '').replace(',', '.')) || 0;
    setSaving(true);
    try {
      await onAdd({ name: name.trim(), numero: numero.trim(), solde_initial });
      reset();
      onClose();
    } catch (_) {
      Alert.alert('Erreur', 'Impossible de créer le compte. Vérifiez votre connexion.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.modalOverlay}
      >
        <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={onClose} />

        <View style={[s.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />

          <View style={s.modalHeader}>
            <Text style={[s.modalTitle, { color: colors.textPrimary }]}>Nouveau compte</Text>
            <TouchableOpacity onPress={onClose} style={[s.modalClose, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Nom */}
          <Text style={[s.modalLabel, { color: colors.textSecondary }]}>NOM DU COMPTE</Text>
          <View style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="create-outline" size={18} color={colors.textSecondary} style={{ marginLeft: 14 }} />
            <TextInput
              style={[s.modalInputText, { color: colors.textPrimary }]}
              placeholder="Ex : BOA Bénin, Wave, Caisse..."
              placeholderTextColor={colors.placeholder}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Numéro de compte */}
          <Text style={[s.modalLabel, { color: colors.textSecondary }]}>NUMÉRO DE COMPTE</Text>
          <View style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="card-outline" size={18} color={colors.textSecondary} style={{ marginLeft: 14 }} />
            <TextInput
              style={[s.modalInputText, { color: colors.textPrimary }]}
              placeholder="Min. 8 caractères"
              placeholderTextColor={colors.placeholder}
              value={numero}
              onChangeText={setNumero}
              autoCapitalize="characters"
            />
          </View>

          {/* Solde initial (optionnel) */}
          <Text style={[s.modalLabel, { color: colors.textSecondary }]}>
            SOLDE INITIAL (FCFA) — <Text style={{ fontStyle: 'italic' }}>optionnel</Text>
          </Text>
          <View style={[s.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="cash-outline" size={18} color={colors.textSecondary} style={{ marginLeft: 14 }} />
            <TextInput
              style={[s.modalInputText, { color: colors.textPrimary }]}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              value={solde}
              onChangeText={setSolde}
              keyboardType="numeric"
            />
            <Text style={[s.modalInputSuffix, { color: colors.placeholder }]}>FCFA</Text>
          </View>

          {/* Bouton */}
          <TouchableOpacity
            style={[s.modalSaveBtn, { backgroundColor: saving ? colors.border : colors.primary, ...(!saving && getShadow(isDark).glow(colors.primary)) }]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            <Ionicons name={saving ? 'hourglass-outline' : 'checkmark-circle'} size={20} color={colors.onPrimary} />
            <Text style={[s.modalSaveBtnText, { color: colors.onPrimary }]}>
              {saving ? 'Création...' : 'Ajouter ce compte'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Écran principal ───────────────────────────────────────

export const DashboardScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors);

  const { transactions, operatorBalances, reload: reloadTx }         = useTransactions();
  const { categories,                     reload: reloadCats }        = useCategories();
  const { accounts, addAccount, totalBalance, reload: reloadAccounts } = useAccounts();

  const [modalVisible, setModalVisible] = useState(false);

  // Recharge toutes les données dès l'affichage de l'écran (l'utilisateur est authentifié)
  useEffect(() => {
    reloadAccounts();
    reloadTx();
    reloadCats();
  }, []);

  // 4 transactions les plus récentes
  const recentTxs = transactions.slice(0, 4);

  // Calcul du résumé mensuel
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const now   = new Date();
    const month = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      monthlyIncome:  month.filter(t => t.type === 'entrée').reduce((sum, t) => sum + t.montant, 0),
      monthlyExpense: month.filter(t => t.type === 'dépense').reduce((sum, t) => sum + t.montant, 0),
    };
  }, [transactions]);

  // Catégories avec plafond + dépenses calculées
  const budgetItems = useMemo(() =>
    categories
      .filter(c => c.plafond != null && c.plafond > 0)
      .slice(0, 3)
      .map(cat => {
        const spent = transactions
          .filter(t => t.categorie === cat.libelle && t.type === 'dépense')
          .reduce((sum, t) => sum + t.montant, 0);
        return { ...cat, spent, pct: Math.min(Math.round((spent / cat.plafond) * 100), 100) };
      }),
    [transactions, categories],
  );


  // Map catégorie → couleur pour les transactions
  const catColorMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.libelle] = c.color; });
    return map;
  }, [categories]);

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <Header />

      <AddAccountModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={({ name, numero, solde_initial }) => addAccount({ libelle: name, numero, solde_initial })}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Solde */}
        <BalanceCard
          totalBalance={totalBalance}
          monthlyIncome={monthlyIncome}
          monthlyExpense={monthlyExpense}
          transactions={transactions}
          onStatsPress={() => navigation.navigate('Reports')}
        />

        {/* Comptes */}
        <View style={s.section}>
          <SectionTitle title="Mes Comptes" />
          <View style={s.accountsList}>
            {accounts.map(a => <AccountCard key={a.id} account={a} />)}
          </View>
        </View>

        {/* Ajouter un compte */}
        <TouchableOpacity
          style={[s.addBtn, getShadow(isDark).glow(colors.primary)]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="card-outline" size={22} color={colors.onPrimary} />
          <Text style={s.addBtnText}>Ajouter un compte</Text>
        </TouchableOpacity>

        {/* Budgets */}
        {budgetItems.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Budgets du mois" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.hScroll}
              contentContainerStyle={s.hScrollContent}
            >
              {budgetItems.map(cat => <BudgetCard key={cat.id} cat={cat} />)}
            </ScrollView>
          </View>
        )}

        {/* Transactions récentes */}
        <View style={s.section}>
          <SectionTitle title="Transactions récentes" />
          {recentTxs.length === 0 ? (
            <View style={s.emptyTx}>
              <Ionicons name="receipt-outline" size={36} color={colors.placeholder} />
              <Text style={s.emptyTxText}>Aucune transaction</Text>
            </View>
          ) : (
            <View style={[s.txCard, getShadow(isDark).sm]}>
              {recentTxs.map((tx, i) => (
                <TxItem
                  key={tx.id}
                  tx={tx}
                  catColor={catColorMap[tx.categorie] || colors.primary}
                  isLast={i === recentTxs.length - 1}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────

const getStyles = (colors) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  scroll:       { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.stackMd,
    gap: SPACING.stackLg,
    paddingBottom: SPACING.stackLg,
  },


  // Balance card
  balanceCard: {
    backgroundColor: colors.cardBg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.stackLg,
    borderWidth: 1, borderColor: colors.border,
    gap: SPACING.stackMd,
  },
  balanceTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: colors.textSecondary, marginBottom: 6 },
  balanceAmount:  { fontSize: 34, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  balanceCurrency:{ fontSize: 16, fontWeight: '500', color: colors.textSecondary },

  balanceStats:  { flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.stackSm },
  statItem:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statDot:       { width: 8, height: 8, borderRadius: 4 },
  statLabel:     { fontSize: 10, color: colors.textSecondary, fontWeight: '500' },
  statValue:     { fontSize: 13, fontWeight: '700' },
  statSep:       { width: 1, height: 28, backgroundColor: colors.divider, marginHorizontal: SPACING.md },

  // Section
  section:      { gap: SPACING.stackSm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.2 },

  // Account cards
  accountsList: { gap: SPACING.stackSm },
  accountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  accountBadge: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  accountBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  accountInfo:      { flex: 1 },
  accountName:      { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  accountType:      { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  accountBalanceWrap: { alignItems: 'flex-end' },
  accountBalance:   { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  accountCurrency:  { fontSize: 10, color: colors.textSecondary, marginTop: 1 },

  // Stats button
  statsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, gap: 8,
  },
  statsBtnText: { flex: 1, fontSize: 14, fontWeight: '700', marginLeft: 4 },

  // Add button
  addBtn: {
    height: 52, borderRadius: BORDER_RADIUS.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },

  // Budget cards
  hScroll:       { marginHorizontal: -SPACING.marginX },
  hScrollContent: { paddingHorizontal: SPACING.marginX, gap: 12, paddingBottom: 4 },
  budgetCard: {
    width: 160, backgroundColor: colors.cardBg,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  budgetDotWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  budgetDot:   { width: 16, height: 16, borderRadius: 8 },
  budgetName:  { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  budgetSub:   { fontSize: 10, color: colors.textSecondary },
  budgetTrack: {
    height: 6, backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 3, overflow: 'hidden',
  },
  budgetFill:  { height: '100%', borderRadius: 3 },
  budgetPct:   { fontSize: 11, fontWeight: '700', textAlign: 'right' },

  // Transactions
  txCard: {
    backgroundColor: colors.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 12, gap: 12,
  },
  txIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  txIconDot: { width: 14, height: 14, borderRadius: 7 },
  txInfo:    { flex: 1 },
  txName:    { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  txDate:    { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  txAmount:  { fontSize: 14, fontWeight: '700' },

  // Empty
  emptyTx:     { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTxText: { fontSize: 13, color: colors.placeholder },

  // ── Modal ─────────────────────────────────────────────────
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: SPACING.marginX,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    gap: SPACING.stackMd,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalClose: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  modalLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.inputBg,
    alignItems: 'center', paddingVertical: 12, gap: 8,
    position: 'relative',
  },
  typeIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  typeLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  typeDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
  },
  modalInput: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5, gap: 8,
  },
  modalInputText: { flex: 1, fontSize: 15, paddingRight: SPACING.md },
  modalInputSuffix: { fontSize: 12, fontWeight: '600', paddingRight: SPACING.md },
  modalSaveBtn: {
    height: 52, borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 4,
  },
  modalSaveBtnText: { fontSize: 16, fontWeight: '700' },
});

export default DashboardScreen;
