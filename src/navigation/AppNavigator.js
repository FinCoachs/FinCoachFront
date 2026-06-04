import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  WelcomeScreen,
  SignupScreen,
  LoginScreen,
  ProfileSetupScreen,
  AddTransactionScreen,
} from '../../screens';
import { SwipeNavigator } from './SwipeNavigator';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

const buildNavTheme = (isDark, colors) => ({
  ...(isDark ? DarkTheme : DefaultTheme),
  colors: {
    ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
    primary:      colors.primary,
    background:   colors.background,
    card:         colors.background,
    text:         colors.textPrimary,
    border:       'transparent',
    notification: colors.primary,
  },
});

export const AppNavigator = () => {
  const { isDark, colors } = useTheme();

  return (
    <NavigationContainer theme={buildNavTheme(isDark, colors)}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* ── Flux d'authentification ── */}
        <Stack.Screen name="Welcome"      component={WelcomeScreen} />
        <Stack.Screen name="Signup"       component={SignupScreen} />
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

        {/* ── Onglets principaux : balayage géré par SwipeNavigator ── */}
        <Stack.Screen
          name="Main"
          component={SwipeNavigator}
          options={{ animation: 'fade' }}
        />

        {/* ── Sous-écran modal ── */}
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
