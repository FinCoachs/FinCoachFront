import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { COLORS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { BottomNavBar } from '../src/components';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.marginX * 2 - 40;
const CHART_HEIGHT = 100;

// ============================================
// DATA
// ============================================

const ACCOUNTS = [
  {
    id: 'boa',
    name: 'BOA Bénin',
    type: 'Courant',
    balance: '320 000',
    brandColor: '#003366',
    brandText: 'BOA',
    textColor: '#ffffff',
  },
  {
    id: 'momo',
    name: 'MTN MoMo',
    type: 'Portefeuille',
    balance: '167 350',
    brandColor: '#FFCC00',
    brandText: 'MoMo',
    textColor: '#000000',
  },
];

const BUDGETS = [
  {
    id: 'alimentation',
    name: 'Alimentation',
    spent: 45,
    total: 100,
    unit: 'k',
    percentage: 45,
    color: '#ffd08e',
  },
  {
    id: 'transport',
    name: 'Transport',
    spent: 24,
    total: 30,
    unit: 'k',
    percentage: 80,
    color: COLORS.primary,
  },
];

const TRANSACTIONS = [
  {
    id: 1,
    name: 'Restaurant Maquis',
    date: "Aujourd'hui, 14:30",
    amount: -8500,
    isExpense: true,
  },
  {
    id: 2,
    name: 'Transport commun',
    date: 'Hier, 08:15',
    amount: -500,
    isExpense: true,
  },
  {
    id: 3,
    name: 'Salaire Juillet',
    date: '28 Juil., 09:00',
    amount: 250000,
    isExpense: false,
  },
  {
    id: 4,
    name: 'Canal+ Bénin',
    date: '25 Juil., 18:20',
    amount: -12000,
    isExpense: true,
  },
];

// ============================================
// HEADER
// ============================================

const Header = ({ userName }) => {
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerGreeting}>Bonjour, {userName} 👋</Text>
        <Text style={styles.headerDate}>{dateStr}</Text>
      </View>
      <View style={styles.avatarWrapper}>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdgoPSLD6l-TaBn5pVdYRmnkbpbzwYVrTmFbl3iseK-jADPzQ8MIi98FmZkJbWvrgPccVM7-bqAD3Gqnlwn6G_WIdmbVxENWBnXH9rJnsKqkcHVBwm0cUG89hw7XaUH9i1ElMhjiLhDpJ8IetubAQoDnChcogfJDrPpbk519h9sd0WED56uIVXic5eKIUMgEqC20MUZFxYVAKPIfpgJWalk28sjyRvYi7rAslC4NyqDm_-dNbKWfDnejsH1MI9FmT1ZzF8qQtldE8m',
          }}
          style={styles.avatar}
        />
      </View>
    </View>
  );
};

// ============================================
// BALANCE CARD WITH SVG CHART
// ============================================

const BalanceCard = () => (
  <View style={styles.balanceCard}>
    <View style={styles.balanceRow}>
      <View>
        <Text style={styles.balanceLabel}>SOLDE TOTAL</Text>
        <Text style={styles.balanceAmount}>
          487 350 <Text style={styles.balanceCurrency}>FCFA</Text>
        </Text>
      </View>
      <View style={styles.trendBadge}>
        <Ionicons name="trending-up" size={16} color={COLORS.primary} />
        <Text style={styles.trendText}>+3.2%</Text>
      </View>
    </View>

    <View style={styles.chartWrapper}>
      <Svg
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        preserveAspectRatio="none"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        style={styles.chartSvg}
      >
        <Defs>
          <LinearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0%" stopColor="#00D68F" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#00D68F" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path
          d={[
            `M0 80`,
            `Q ${CHART_WIDTH * 0.083} 75, ${CHART_WIDTH * 0.167} 85`,
            `T ${CHART_WIDTH * 0.333} 60`,
            `T ${CHART_WIDTH * 0.5} 70`,
            `T ${CHART_WIDTH * 0.667} 40`,
            `T ${CHART_WIDTH * 0.833} 55`,
            `T ${CHART_WIDTH} 30`,
            `V ${CHART_HEIGHT} H 0 Z`,
          ].join(' ')}
          fill="url(#chartGradient)"
        />
        <Path
          d={[
            `M0 80`,
            `Q ${CHART_WIDTH * 0.083} 75, ${CHART_WIDTH * 0.167} 85`,
            `T ${CHART_WIDTH * 0.333} 60`,
            `T ${CHART_WIDTH * 0.5} 70`,
            `T ${CHART_WIDTH * 0.667} 40`,
            `T ${CHART_WIDTH * 0.833} 55`,
            `T ${CHART_WIDTH} 30`,
          ].join(' ')}
          fill="none"
          stroke="#00D68F"
          strokeLinecap="round"
          strokeWidth={2.5}
        />
      </Svg>
      <View style={styles.chartLabels}>
        <Text style={styles.chartLabel}>1 oct.</Text>
        <Text style={styles.chartLabel}>15 oct.</Text>
        <Text style={styles.chartLabel}>Aujourd'hui</Text>
      </View>
    </View>
  </View>
);

// ============================================
// ACCOUNT CARD
// ============================================

const AccountCard = ({ account }) => (
  <View style={styles.accountCard}>
    <View style={styles.accountLeft}>
      <View style={[styles.accountLogo, { backgroundColor: account.brandColor }]}>
        <Text style={[styles.accountLogoText, { color: account.textColor }]}>
          {account.brandText}
        </Text>
      </View>
      <View>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountType}>{account.type}</Text>
      </View>
    </View>
    <Text style={styles.accountBalance}>
      {account.balance} <Text style={styles.currencySmall}>FCFA</Text>
    </Text>
  </View>
);

// ============================================
// BUDGET CARD
// ============================================

const BudgetCard = ({ budget }) => (
  <View style={styles.budgetCard}>
    <View style={styles.budgetHeader}>
      <Text style={styles.budgetName}>{budget.name}</Text>
      <Text style={styles.budgetPercent}>{budget.percentage}%</Text>
    </View>
    <Text style={styles.budgetAmount}>
      {budget.spent}{budget.unit} / {budget.total}{budget.unit} FCFA
    </Text>
    <View style={styles.budgetBarBg}>
      <View
        style={[
          styles.budgetBarFill,
          { width: `${budget.percentage}%`, backgroundColor: budget.color },
        ]}
      />
    </View>
  </View>
);

// ============================================
// TRANSACTION ITEM
// ============================================

const TransactionItem = ({ transaction, isLast }) => (
  <View style={[styles.transactionItem, isLast && { borderBottomWidth: 0 }]}>
    <View>
      <Text style={styles.transactionName}>{transaction.name}</Text>
      <Text style={styles.transactionDate}>{transaction.date}</Text>
    </View>
    <Text style={[
      styles.transactionAmount,
      transaction.isExpense ? styles.expenseText : styles.incomeText,
    ]}>
      {transaction.isExpense ? '- ' : '+ '}
      {Math.abs(transaction.amount).toLocaleString('fr-FR')} FCFA
    </Text>
  </View>
);

// ============================================
// MAIN SCREEN
// ============================================

export const DashboardScreen = ({ navigation }) => {

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <Header userName="Alex" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Solde total + graphique */}
        <BalanceCard />

        {/* Vos Comptes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vos Comptes</Text>
          <View style={styles.accountsList}>
            {ACCOUNTS.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </View>
        </View>

        {/* Actions Rapides */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionItem} activeOpacity={0.8}>
            <View style={styles.quickActionBtn}>
              <Ionicons name="add" size={26} color={COLORS.background} />
            </View>
            <Text style={styles.quickActionLabel}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {/* Budgets */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Budgets</Text>
            <TouchableOpacity activeOpacity={0.8}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.budgetsScroll}
            contentContainerStyle={styles.budgetsScrollContent}
          >
            {BUDGETS.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} />
            ))}
          </ScrollView>
        </View>

        {/* Dernières Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernières Transactions</Text>
          <View style={styles.transactionsList}>
            {TRANSACTIONS.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                isLast={index === TRANSACTIONS.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomNavBar activeScreen="Dashboard" navigation={navigation} />
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Header ──────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.marginX,
    height: 56,
    backgroundColor: 'rgba(12, 19, 34, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerGreeting: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerDate: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(186, 203, 190, 0.7)',
    marginTop: 2,
  },
  avatarWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(68, 243, 169, 0.2)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },

  // ── Scroll ──────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.stackLg,
    paddingBottom: SPACING.stackLg,
    gap: SPACING.stackLg,
  },

  // ── Balance Card ────────────────────────────
  balanceCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.7,
  },
  balanceCurrency: {
    fontSize: 20,
    fontWeight: '400',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(68, 243, 169, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.primary,
  },
  chartWrapper: {
    marginTop: 8,
  },
  chartSvg: {
    // drop-shadow via react-native-svg filter n'est pas supporté sur toutes plateformes
    // l'effet est obtenu par la couleur du trait
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  chartLabel: {
    fontSize: 11,
    color: 'rgba(186, 203, 190, 0.4)',
  },

  // ── Section ─────────────────────────────────
  section: {
    gap: SPACING.stackMd,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAll: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.primary,
  },

  // ── Accounts ────────────────────────────────
  accountsList: {
    gap: SPACING.stackSm,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountLogoText: {
    fontSize: 10,
    fontWeight: '700',
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  accountType: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  currencySmall: {
    fontSize: 12,
    fontWeight: '400',
  },

  // ── Quick Actions ────────────────────────────
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.stackMd,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionBtn: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },

  // ── Budgets ─────────────────────────────────
  budgetsScroll: {
    marginHorizontal: -SPACING.marginX,
  },
  budgetsScrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingBottom: 8,
    gap: 16,
  },
  budgetCard: {
    minWidth: 180,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  budgetPercent: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  budgetAmount: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  budgetBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Transactions ─────────────────────────────
  transactionsList: {
    gap: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  transactionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  transactionDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  expenseText: {
    color: '#FF5A5A',
  },
  incomeText: {
    color: COLORS.primary,
  },

});

export default DashboardScreen;
