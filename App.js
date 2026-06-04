import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { CategoriesProvider } from './src/context/CategoriesContext';
import { TransactionsProvider } from './src/context/TransactionsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const AppContent = () => {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TransactionsProvider>
          <CategoriesProvider>
            <AppContent />
          </CategoriesProvider>
        </TransactionsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
