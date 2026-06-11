import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useUser } from '../src/context/UserContext';
import { Button, Input } from '../src/components';
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// ─── Remplacez par vos IDs depuis Google Cloud Console ──────────────────────
// https://console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0
const GOOGLE_CLIENT_IDS = {
  webClientId:     '500247802578-13cve6899n87n65096r2b01m71f4t6a6.apps.googleusercontent.com',
  androidClientId: '500247802578-13cve6899n87n65096r2b01m71f4t6a6.apps.googleusercontent.com',
};

export const LoginScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { updateUser, user } = useUser();
  const styles = getStyles(colors);

  const [formData, setFormData] = useState({ emailOrPhone: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [, response, promptGoogleAsync] = Google.useAuthRequest({
    clientId:        GOOGLE_CLIENT_IDS.webClientId,
    androidClientId: GOOGLE_CLIENT_IDS.androidClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (!token) return;
      fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((info) => {
          updateUser({ fullName: info.name || '', email: info.email || '' });
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        })
        .catch(() => Alert.alert('Erreur', 'Impossible de récupérer les informations Google.'));
    } else if (response?.type === 'error') {
      Alert.alert('Erreur Google', response.error?.message || 'Connexion annulée.');
    }
  }, [response]);

  const handleGoogleLogin = () => {
    if (GOOGLE_CLIENT_IDS.webClientId.startsWith('VOTRE_')) {
      Alert.alert(
        'Configuration requise',
        'Les identifiants Google OAuth ne sont pas encore configurés.\nConsultez Google Cloud Console pour créer vos Client IDs.',
      );
      return;
    }
    promptGoogleAsync();
  };

  const updateField = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const newErrors = {};
    if (!formData.emailOrPhone.trim()) newErrors.emailOrPhone = "L'email ou le numéro de téléphone est requis";
    if (!formData.password)            newErrors.password      = 'Le mot de passe est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (validate()) {
      setIsLoading(true);
      try {
        const email = formData.emailOrPhone.trim();
        const response = await api.post('/login', {
          email: email,
          password: formData.password,
        });

        if (response.data.token) {
          await AsyncStorage.setItem('userToken', response.data.token);
        }

        if (response.data.user) {
          updateUser({ 
            email: response.data.user.email, 
            fullName: response.data.user.name || '' 
          });
        } else {
          updateUser({ email, fullName: user.fullName || email.split('@')[0] });
        }
        
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } catch (error) {
        Alert.alert(
          'Erreur de connexion', 
          error.response?.data?.message || 'Identifiants incorrects ou problème serveur.'
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.glowEmerald} />
      <View style={styles.glowGold} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.welcomeHeader}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              <Text style={styles.logoFin}>Fin</Text>
              <Text style={styles.logoCoach}>Coach</Text>
            </Text>
          </View>
          <Text style={styles.title}>Bon retour parmi nous</Text>
          <Text style={styles.subtitle}>Connectez-vous pour suivre vos finances</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            placeholder="Email ou Téléphone"
            value={formData.emailOrPhone}
            onChangeText={(v) => { updateField('emailOrPhone', v); if (errors.emailOrPhone) setErrors(p => ({ ...p, emailOrPhone: null })); }}
            keyboardType="email-address"
            error={errors.emailOrPhone}
            icon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            style={styles.inputField}
          />
          <Input
            placeholder="Mot de passe"
            value={formData.password}
            onChangeText={(v) => { updateField('password', v); if (errors.password) setErrors(p => ({ ...p, password: null })); }}
            secureTextEntry
            error={errors.password}
            icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            style={styles.inputField}
          />

          <TouchableOpacity style={styles.forgotPassword} onPress={() => {}} activeOpacity={0.8}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: SPACING.base }} />
          ) : (
            <Button title="Se connecter" onPress={handleLogin} variant="primary" />
          )}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OU CONTINUER AVEC</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={styles.socialButtonCircle} activeOpacity={0.8} onPress={handleGoogleLogin}>
            <Image source={require('../assets/logoext/image.png')} style={styles.socialIconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButtonCircle} activeOpacity={0.8}>
            <Ionicons name="logo-apple" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.signupText}>
          Nouveau sur FinCoach ?{' '}
          <Text style={styles.signupLink} onPress={() => navigation.navigate('Signup')}>
            Créer un compte
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.background },
  glowEmerald: {
    position: 'absolute', top: 0, right: 0, width: 300, height: 300,
    backgroundColor: 'rgba(68, 243, 169, 0.06)', borderRadius: BORDER_RADIUS.full,
  },
  glowGold: {
    position: 'absolute', bottom: 0, left: 0, width: 250, height: 250,
    backgroundColor: 'rgba(188, 135, 9, 0.05)', borderRadius: BORDER_RADIUS.full,
  },
  header:      { paddingHorizontal: SPACING.marginX, paddingTop: SPACING.sm, zIndex: 10 },
  backButton:  {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.glassBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  scrollView:   { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.marginX, paddingBottom: SPACING.xxl },

  welcomeHeader: { alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.xl },
  logoContainer: { marginBottom: SPACING.stackLg },
  logoText:      { ...TYPOGRAPHY.sizes.headlineLg, fontSize: 32, fontWeight: '700' },
  logoFin:       { color: colors.onSurface },
  logoCoach:     { color: colors.primary },
  title:         { ...TYPOGRAPHY.sizes.headlineMd, color: colors.onSurface, textAlign: 'center', marginBottom: SPACING.base },
  subtitle:      { ...TYPOGRAPHY.sizes.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },

  formContainer:      { marginBottom: SPACING.stackLg },
  inputField:         { backgroundColor: colors.inputBg, borderColor: colors.border },
  forgotPassword:     { alignSelf: 'flex-end', marginBottom: SPACING.stackLg, marginTop: SPACING.base },
  forgotPasswordText: { ...TYPOGRAPHY.sizes.labelSm, color: colors.onSurfaceVariant },

  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.stackLg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { ...TYPOGRAPHY.sizes.labelSm, color: colors.placeholder, paddingHorizontal: SPACING.md },

  socialButtonsContainer: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.stackLg, marginBottom: SPACING.xl },
  socialButtonCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  socialIconImage: { width: 24, height: 24, resizeMode: 'contain' },

  footer:     { paddingBottom: SPACING.stackLg, alignItems: 'center' },
  signupText: { ...TYPOGRAPHY.sizes.bodyMd, color: colors.onSurfaceVariant },
  signupLink: { color: colors.primary, fontWeight: '700' },
});

export default LoginScreen;
