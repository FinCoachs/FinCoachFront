import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../src/constants/theme';
import { Button, Input, GlassCard } from '../src/components';

export const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    password: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
      valid = false;
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
      valid = false;
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'adresse email est requise";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'adresse email n'est pas valide";
      valid = false;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
      valid = false;
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      valid = false;
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignup = () => {
    if (validate()) {
      console.log('Signup successful:', formData);
      navigation.navigate('ProfileSetup');
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleGoogleLogin = () => {
    console.log('Google login');
  };

  const handleBiometricLogin = () => {
    console.log('Biometric login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Background Glows */}
      <View style={styles.glowEmerald} />
      <View style={styles.glowGold} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding & Header */}
        <View style={styles.brandingContainer}>
          <Text style={styles.brandingLogo}>FinCoach</Text>
          <Text style={styles.title}>Rejoignez FinCoach</Text>
          <Text style={styles.subtitle}>Prenez le contrôle de votre argent dès aujourd'hui</Text>
        </View>

        {/* Registration Form Card */}
        <GlassCard style={styles.formCard}>
          <Input
            label="Nom"
            placeholder="Ex: Dupont"
            value={formData.lastName}
            onChangeText={(value) => {
              updateField('lastName', value);
              if (errors.lastName) setErrors(prev => ({ ...prev, lastName: null }));
            }}
            error={errors.lastName}
            icon={<Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />}
          />

          <Input
            label="Prénom"
            placeholder="Ex: Jean"
            value={formData.firstName}
            onChangeText={(value) => {
              updateField('firstName', value);
              if (errors.firstName) setErrors(prev => ({ ...prev, firstName: null }));
            }}
            error={errors.firstName}
            icon={<Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />}
          />

          <Input
            label="Email"
            placeholder="jean.dupont@email.com"
            value={formData.email}
            onChangeText={(value) => {
              updateField('email', value);
              if (errors.email) setErrors(prev => ({ ...prev, email: null }));
            }}
            keyboardType="email-address"
            error={errors.email}
            icon={<Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />}
          />

          <Input
            label="Numéro de téléphone"
            placeholder="+229 -- -- -- --"
            value={formData.phone}
            onChangeText={(value) => {
              updateField('phone', value);
              if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
            }}
            keyboardType="phone-pad"
            error={errors.phone}
            icon={<Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />}
          />

          <Input
            label="Mot de passe"
            placeholder="••••••••••••"
            value={formData.password}
            onChangeText={(value) => {
              updateField('password', value);
              if (errors.password) setErrors(prev => ({ ...prev, password: null }));
            }}
            secureTextEntry
            error={errors.password}
            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />}
          />

          {/* Checkbox Condition */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => {
              const newVal = !formData.acceptTerms;
              updateField('acceptTerms', newVal);
              if (newVal && errors.acceptTerms) {
                setErrors(prev => ({ ...prev, acceptTerms: null }));
              }
            }}
            activeOpacity={0.8}
          >
            <View style={[
              styles.checkbox, 
              formData.acceptTerms && styles.checkboxChecked,
              errors.acceptTerms && { borderColor: COLORS.error }
            ]}>
              {formData.acceptTerms && <Ionicons name="checkmark" size={14} color={COLORS.background} />}
            </View>
            <Text style={styles.checkboxLabel}>
              J'accepte les{' '}
              <Text style={styles.termsLink}>conditions d'utilisation</Text>
            </Text>
          </TouchableOpacity>
          {errors.acceptTerms && (
            <Text style={styles.checkboxErrorText}>{errors.acceptTerms}</Text>
          )}

          {/* Submit Button */}
          <Button
            title="Créer mon compte"
            onPress={handleSignup}
            variant="primary"
            icon={<Ionicons name="arrow-forward" size={20} color={COLORS.background} />}
            iconPosition="right"
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Logins */}
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/logoext/image.png')}
                style={styles.googleIcon}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleBiometricLogin}
              activeOpacity={0.8}
            >
              <Ionicons name="finger-print-outline" size={24} color={COLORS.onSurface} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Footer Link */}
        <View style={styles.loginRedirect}>
          <Text style={styles.loginText}>Déjà un compte ? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>

        {/* Aesthetic Card - Secured & Private */}
        <View style={styles.aestheticCard}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbLpEXzSqG3qnXodAbHL1E0cImbrjpoYcyFGtz9uMpgHicN-KLwkYbEZzX-LJxIjXiLc4aZ4B2HYSRyXrV446eGguDWu8eCSpPx8HNodLibd9JgnkZi4adwAgpO8sbp-98wdGQO4wrY-h0GpdqT8b8Y2umKOIDODiEuRksuprgRIFFHI5EzsNsuOYmTjmSRJLkrc4u72yhvhwD5Aa5iV1NpGdUIkVh5vn8tMgPs1itzsTzAuydRSd8yYguEV6jL7CxRdUrwt0QKsNb' }}
            style={styles.aestheticImage}
            resizeMode="cover"
          />
          <View style={styles.aestheticOverlay}>
            <Text style={styles.aestheticTitle}>SÉCURISÉ & PRIVÉ</Text>
            <Text style={styles.aestheticSubtitle}>
              Cryptage de niveau bancaire certifié pour vos données
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  glowEmerald: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: 500,
    height: 500,
    backgroundColor: 'rgba(0, 214, 143, 0.08)',
    borderRadius: BORDER_RADIUS.full,
  },
  glowGold: {
    position: 'absolute',
    bottom: '-10%',
    left: '-10%',
    width: 600,
    height: 600,
    backgroundColor: 'rgba(248, 189, 69, 0.06)',
    borderRadius: BORDER_RADIUS.full,
  },
  header: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.sm,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingBottom: SPACING.xxl + 40,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.stackLg,
  },
  brandingLogo: {
    ...TYPOGRAPHY.sizes.headlineLg,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: SPACING.base,
  },
  title: {
    ...TYPOGRAPHY.sizes.headlineLg,
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.sizes.bodyMd,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: SPACING.base,
    maxWidth: 300,
  },
  formCard: {
    padding: SPACING.marginX,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 30, 53, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: SPACING.stackLg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.stackMd,
    paddingLeft: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0F1E35',
    marginRight: SPACING.stackSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    ...TYPOGRAPHY.sizes.bodyMd,
    color: COLORS.onSurfaceVariant,
  },
  checkboxErrorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: -SPACING.stackSm,
    marginBottom: SPACING.stackMd,
    marginLeft: 4,
  },
  termsLink: {
    color: COLORS.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.stackLg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dividerText: {
    ...TYPOGRAPHY.sizes.labelSm,
    color: 'rgba(220, 226, 248, 0.4)',
    paddingHorizontal: SPACING.md,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.stackMd,
  },
  socialButton: {
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(15, 30, 53, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  loginRedirect: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.stackLg,
  },
  loginText: {
    ...TYPOGRAPHY.sizes.bodyMd,
    color: COLORS.onSurfaceVariant,
  },
  loginLink: {
    ...TYPOGRAPHY.sizes.bodyMd,
    color: COLORS.primary,
    fontWeight: '700',
  },
  aestheticCard: {
    height: 120,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    position: 'relative',
    backgroundColor: 'rgba(15, 30, 53, 0.5)',
    marginBottom: SPACING.stackLg,
  },
  aestheticImage: {
    width: '100%',
    height: '100%',
    opacity: 0.25,
  },
  aestheticOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.stackMd,
    backgroundColor: 'rgba(8, 15, 30, 0.4)',
  },
  aestheticTitle: {
    ...TYPOGRAPHY.sizes.labelCaps,
    color: COLORS.primary,
    marginBottom: SPACING.base,
    letterSpacing: 2,
  },
  aestheticSubtitle: {
    ...TYPOGRAPHY.sizes.labelSm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default SignupScreen;