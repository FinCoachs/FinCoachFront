import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { CategoriesProvider, useCategories } from './src/context/CategoriesContext';
import { TransactionsProvider, useTransactions } from './src/context/TransactionsContext';
import { AccountProvider } from './src/context/AccountContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { UserProvider } from './src/context/UserContext';
import { NotificationProvider, useNotifications } from './src/context/NotificationContext';

// ── Tâche SMS en arrière-plan (Android uniquement, development build) ─────────
// La constante est définie au top-level pour éviter que le module soit chargé
// conditionnellement (règle des hooks / règle de Task Manager).
const SMS_TASK_NAME = 'FINCOACH_SMS_SCAN';

if (Platform.OS === 'android') {
  try {
    const TaskManager     = require('expo-task-manager');
    const BackgroundFetch = require('expo-background-fetch');
    const { parseMomoSms, detectOperator } = require('./src/services/MomoSmsService');

    // Définir la tâche une seule fois au démarrage du module
    if (!TaskManager.isTaskDefined(SMS_TASK_NAME)) {
      TaskManager.defineTask(SMS_TASK_NAME, async () => {
        try {
          const SmsAndroid  = require('react-native-get-sms-android');
          const OPERATORS   = ['MTN', 'MoMo', 'MOMO', 'Moov', 'MOOV', 'Flooz', 'FLOOZ', 'Celtiis'];

          const smsList = await new Promise((resolve, reject) =>
            SmsAndroid.list(
              JSON.stringify({ box: 'inbox', maxCount: 100, indexFrom: 0 }),
              reject,
              (_count, raw) => resolve(JSON.parse(raw)),
            )
          );

          const momoSms = smsList.filter((m) =>
            OPERATORS.some((s) => (m.address || '').toUpperCase().includes(s.toUpperCase()))
          );

          const parsed = momoSms
            .map((m) => parseMomoSms(m, detectOperator?.(m.address)))
            .filter(Boolean);

          // Les nouveaux SMS seront traités par TransactionsContext au prochain foreground
          if (parsed.length > 0) {
            // Stocker temporairement dans AsyncStorage pour récupération au foreground
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const existing     = JSON.parse((await AsyncStorage.getItem('pending_sms_txs')) || '[]');
            const merged       = [...existing, ...parsed].slice(-200);
            await AsyncStorage.setItem('pending_sms_txs', JSON.stringify(merged));
          }

          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (_) {
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });
    }

    // Enregistrer la tâche (toutes les 15 minutes minimum sur Android)
    BackgroundFetch.registerTaskAsync(SMS_TASK_NAME, {
      minimumInterval:        15 * 60, // 15 minutes
      stopOnTerminate:        false,
      startOnBoot:            true,
    }).catch(() => {});
  } catch (_) {
    // Silencieux en Expo Go (modules natifs non disponibles)
  }
}

// ── Surveillant des budgets (in-app, web-compatible) ─────────────────────────
const BudgetWatcher = () => {
  const { transactions }                      = useTransactions();
  const { categories }                        = useCategories();
  const { loadAlertes }                       = useNotifications();
  const prevPcts                              = useRef({});

  useEffect(() => {
    let triggered = false;

    categories.forEach((cat) => {
      if (!cat.plafond || cat.plafond <= 0) return;

      const spent = transactions
        .filter((t) => t.categorie === cat.libelle && t.type === 'dépense')
        .reduce((sum, t) => sum + t.montant, 0);

      const pct  = Math.round((spent / cat.plafond) * 100);
      const prev = prevPcts.current[cat.id] ?? 0;

      if ((pct >= 100 && prev < 100) || (pct >= 80 && prev < 80)) {
        triggered = true;
      }

      prevPcts.current[cat.id] = pct;
    });

    // Si un seuil a été franchi, recharger les alertes (le push vient du back)
    if (triggered) loadAlertes();
  }, [transactions, categories, loadAlertes]);

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
          <AccountProvider>
            <TransactionsProvider>
              <CategoriesProvider>
                <NotificationProvider>
                  <AppContent />
                </NotificationProvider>
              </CategoriesProvider>
            </TransactionsProvider>
          </AccountProvider>
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
