import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { CategoriesProvider } from './src/context/CategoriesContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <CategoriesProvider>
        <StatusBar barStyle="light-content" backgroundColor="#080F1E" />
        <AppNavigator />
      </CategoriesProvider>
    </SafeAreaProvider>
  );
}
