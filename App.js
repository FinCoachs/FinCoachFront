import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { CategoriesProvider, useCategories } from './src/context/CategoriesContext';
import { TransactionsProvider, useTransactions } from './src/context/TransactionsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { UserProvider } from './src/context/UserContext';

// ── Surveillant des budgets ───────────────────────────────────────────────────
// Affiche une alerte in-app quand un budget franchit 80% ou 100%
// (les notifications push nécessitent un development build, pas Expo Go)

const BudgetWatcher = () => {
  const { transactions } = useTransactions();
  const { categories }   = useCategories();
  const prevPcts         = useRef({});

  useEffect(() => {
    categories.forEach((cat) => {
      if (!cat.plafond || cat.plafond <= 0) return;

      const spent = transactions
        .filter((t) => t.categorie === cat.libelle && t.type === 'dépense')
        .reduce((sum, t) => sum + t.montant, 0);

      const pct  = Math.round((spent / cat.plafond) * 100);
      const prev = prevPcts.current[cat.id] ?? 0;

      if (pct >= 100 && prev < 100) {
        Alert.alert(
          `⚠️ Budget dépassé — ${cat.libelle}`,
          `Vous avez utilisé 100% de votre budget.\n${spent.toLocaleString('fr-FR')} / ${cat.plafond.toLocaleString('fr-FR')} FCFA`,
          [{ text: 'OK' }],
        );
      } else if (pct >= 80 && prev < 80) {
        Alert.alert(
          `🔔 Budget bientôt épuisé — ${cat.libelle}`,
          `Vous avez utilisé ${pct}% de votre budget.\nIl reste ${(cat.plafond - spent).toLocaleString('fr-FR')} FCFA.`,
          [{ text: 'OK' }],
        );
      }

      prevPcts.current[cat.id] = pct;
    });
  }, [transactions, categories]);

  return null;
};

// ── Contenu principal ─────────────────────────────────────────────────────────

const AppContent = () => {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BudgetWatcher />
      <AppNavigator />
    </>
  );
};

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <TransactionsProvider>
            <CategoriesProvider>
              <AppContent />
            </CategoriesProvider>
          </TransactionsProvider>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
