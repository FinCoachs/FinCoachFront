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
import { Button, Input, GlassCard } from '../src/components';
import api from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

// ─── Mêmes IDs que LoginScreen — remplacez avec vos Client IDs Google ────────
const GOOGLE_CLIENT_IDS = {
  webClientId:     'VOTRE_WEB_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'VOTRE_ANDROID_CLIENT_ID.apps.googleusercontent.com',
};

export const SignupScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { updateUser }     = useUser();
  const styles             = getStyles(colors);

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', acceptTerms: false,
  });
  const [errors, setErrors] = useState({});

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
          navigation.navigate('ProfileSetup');
        })
        .catch(() => Alert.alert('Erreur', 'Impossible de récupérer les informations Google.'));
    } else if (response?.type === 'error') {
      Alert.alert('Erreur Google', response.error?.message || 'Connexion annulée.');
    }
  }, [response]);

  const handleGoogleSignup = () => {
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
    const e = {};
    if (!formData.fullName.trim())  e.fullName = 'Le nom complet est requis';
    if (!formData.email.trim())     e.email    = "L'adresse email est requise";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "L'adresse email n'est pas valide";
    if (!formData.password)         e.password = 'Le mot de passe est requis';
    else if (formData.password.length < 6) e.password = 'Au moins 6 caractères';
    if (!formData.confirmPassword)  e.confirmPassword = 'Veuillez confirmer le mot de passe';
    else if (formData.confirmPassword !== formData.password) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!formData.acceptTerms)      e.acceptTerms = 'Vous devez accepter les conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = () => {
    if (validate()) {
      navigation.navigate('ProfileSetup', { signupData: formData });
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
        <View style={styles.brandingContainer}>
          <Text style={styles.brandingLogo}>FinCoach</Text>
          <Text style={styles.title}>Rejoignez FinCoach</Text>
          <Text style={styles.subtitle}>Prenez le contrôle de votre argent dès aujourd'hui</Text>
        </View>

        <GlassCard style={styles.formCard}>
          <Input
            label="Nom complet" placeholder="Ex: Jean Dupont"
            value={formData.fullName}
            onChangeText={(v) => { updateField('fullName', v); if (errors.fullName) setErrors(p => ({ ...p, fullName: null })); }}
            error={errors.fullName}
            icon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Email" placeholder="jean.dupont@email.com"
            value={formData.email}
            onChangeText={(v) => { updateField('email', v); if (errors.email) setErrors(p => ({ ...p, email: null })); }}
            keyboardType="email-address"
            error={errors.email}
            icon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Mot de passe" placeholder="••••••••••••"
            value={formData.password}
            onChangeText={(v) => { updateField('password', v); if (errors.password) setErrors(p => ({ ...p, password: null })); }}
            secureTextEntry
            error={errors.password}
            icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
          />
          <Input
            label="Confirmer le mot de passe" placeholder="••••••••••••"
            value={formData.confirmPassword}
            onChangeText={(v) => { updateField('confirmPassword', v); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: null })); }}
            secureTextEntry
            error={errors.confirmPassword}
            icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
          />

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => { updateField('acceptTerms', !formData.acceptTerms); if (errors.acceptTerms) setErrors(p => ({ ...p, acceptTerms: null })); }}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, formData.acceptTerms && styles.checkboxChecked, errors.acceptTerms && { borderColor: colors.error }]}>
              {formData.acceptTerms && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
            </View>
            <Text style={styles.checkboxLabel}>
              J'accepte les <Text style={styles.termsLink}>conditions d'utilisation</Text>
            </Text>
          </TouchableOpacity>
          {errors.acceptTerms && <Text style={styles.checkboxErrorText}>{errors.acceptTerms}</Text>}

          <Button
            title="Continuer" onPress={handleSignup} variant="primary"
            icon={<Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />}
            iconPosition="right"
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8} onPress={handleGoogleSignup}>
              <Image source={require('../assets/logoext/image.png')} style={styles.googleIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Ionicons name="finger-print-outline" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.loginRedirect}>
          <Text style={styles.loginText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aestheticCard}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbLpEXzSqG3qnXodAbHL1E0cImbrjpoYcyFGtz9uMpgHicN-KLwkYbEZzX-LJxIjXiLc4aZ4B2HYSRyXrV446eGguDWu8eCSpPx8HNodLibd9JgnkZi4adwAgpO8sbp-98wdGQO4wrY-h0GpdqT8b8Y2umKOIDODiEuRksuprgRIFFHI5EzsNsuOYmTjmSRJLkrc4u72yhvhwD5Aa5iV1NpGdUIkVh5vn8tMgPs1itzsTzAuydRSd8yYguEV6jL7CxRdUrwt0QKsNb' }}
            style={styles.aestheticImage}
            resizeMode="cover"
          />
          <View style={styles.aestheticOverlay}>
            <Text style={styles.aestheticTitle}>SÉCURISÉ & PRIVÉ</Text>
            <Text style={styles.aestheticSubtitle}>Cryptage de niveau bancaire certifié pour vos données</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  glowEmerald: {
    position: 'absolute', top: '-10%', right: '-10%', width: 500, height: 500,
    backgroundColor: 'rgba(0, 214, 143, 0.07)', borderRadius: BORDER_RADIUS.full,
  },
  glowGold: {
    position: 'absolute', bottom: '-10%', left: '-10%', width: 600, height: 600,
    backgroundColor: 'rgba(248, 189, 69, 0.05)', borderRadius: BORDER_RADIUS.full,
  },
  header: { paddingHorizontal: SPACING.marginX, paddingTop: SPACING.sm, zIndex: 10 },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.glassBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  scrollView:    { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: SPACING.marginX, paddingBottom: SPACING.xxl + 40 },

  brandingContainer: { alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.stackLg },
  brandingLogo: { ...TYPOGRAPHY.sizes.headlineLg, color: colors.primary, fontWeight: '700', marginBottom: SPACING.base },
  title:        { ...TYPOGRAPHY.sizes.headlineLg, color: colors.onSurface, textAlign: 'center' },
  subtitle:     { ...TYPOGRAPHY.sizes.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: SPACING.base, maxWidth: 300 },

  formCard: {
    padding: SPACING.marginX, borderRadius: 20, marginBottom: SPACING.stackLg,
    backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder,
  },

  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.stackMd, paddingLeft: 4 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2,
    borderColor: colors.border, backgroundColor: colors.inputBg,
    marginRight: SPACING.stackSm, justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked:   { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel:     { ...TYPOGRAPHY.sizes.bodyMd, color: colors.onSurfaceVariant },
  checkboxErrorText: { color: colors.error, fontSize: 12, marginTop: -SPACING.stackSm, marginBottom: SPACING.stackMd, marginLeft: 4 },
  termsLink:         { color: colors.primary },

  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.stackLg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { ...TYPOGRAPHY.sizes.labelSm, color: colors.placeholder, paddingHorizontal: SPACING.md },

  socialButtonsContainer: { flexDirection: 'row', gap: SPACING.stackMd },
  socialButton: {
    flex: 1, height: 52, borderRadius: 14,
    backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  googleIcon: { width: 24, height: 24 },

  loginRedirect: { flexDirection: 'row', justifyContent: 'center', marginBottom: SPACING.stackLg },
  loginText:     { ...TYPOGRAPHY.sizes.bodyMd, color: colors.onSurfaceVariant },
  loginLink:     { ...TYPOGRAPHY.sizes.bodyMd, color: colors.primary, fontWeight: '700' },

  aestheticCard: {
    height: 120, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
    position: 'relative', backgroundColor: colors.glassBg,
    marginBottom: SPACING.stackLg,
  },
  aestheticImage:   { width: '100%', height: '100%', opacity: 0.25 },
  aestheticOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center',
    padding: SPACING.stackMd, backgroundColor: 'rgba(8, 15, 30, 0.35)',
  },
  aestheticTitle:    { ...TYPOGRAPHY.sizes.labelCaps, color: colors.primary, marginBottom: SPACING.base, letterSpacing: 2 },
  aestheticSubtitle: { ...TYPOGRAPHY.sizes.labelSm, color: colors.onSurfaceVariant, textAlign: 'center' },
});

export default SignupScreen;
