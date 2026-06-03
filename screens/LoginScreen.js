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
import { Button, Input } from '../src/components';

export const LoginScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = "L'email ou le numéro de téléphone est requis";
      valid = false;
    }
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = () => {
    if (validate()) {
      console.log('Login success (no redirection per user choice):', formData);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password');
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Decorative background glows */}
      <View style={styles.glowEmerald} />
      <View style={styles.glowGold} />

      {/* Top Navigation Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
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
        {/* Wordmark Logo & Welcome Text */}
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

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Input
            placeholder="Email ou Téléphone"
            value={formData.emailOrPhone}
            onChangeText={(value) => {
              updateField('emailOrPhone', value);
              if (errors.emailOrPhone) setErrors(prev => ({ ...prev, emailOrPhone: null }));
            }}
            keyboardType="email-address"
            error={errors.emailOrPhone}
            icon={<Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />}
            style={styles.inputField}
          />
          
          <Input
            placeholder="Mot de passe"
            value={formData.password}
            onChangeText={(value) => {
              updateField('password', value);
              if (errors.password) setErrors(prev => ({ ...prev, password: null }));
            }}
            secureTextEntry
            error={errors.password}
            icon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />}
            style={styles.inputField}
          />

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
            activeOpacity={0.8}
          >
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <Button
            title="Se connecter"
            onPress={handleLogin}
            variant="primary"
            style={styles.loginButton}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OU CONTINUER AVEC</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Logins - Using logoext image for Google */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity
            style={styles.socialButtonCircle}
            onPress={() => console.log('Google Sign-in')}
            activeOpacity={0.8}
          >
            <Image
              source={require('../assets/logoext/image.png')}
              style={styles.socialIconImage}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButtonCircle}
            onPress={() => console.log('Apple Sign-in')}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-apple" size={24} color={COLORS.textWhite} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer redirection */}
      <View style={styles.footer}>
        <Text style={styles.signupText}>
          Nouveau sur FinCoach ?{' '}
          <Text style={styles.signupLink} onPress={handleSignup}>
            Créer un compte
          </Text>
        </Text>
      </View>
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
    top: 0,
    right: 0,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(68, 243, 169, 0.04)',
    borderRadius: BORDER_RADIUS.full,
  },
  glowGold: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 250,
    height: 250,
    backgroundColor: 'rgba(188, 135, 9, 0.04)',
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
  },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingBottom: SPACING.xxl,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.stackLg,
  },
  logoText: {
    ...TYPOGRAPHY.sizes.headlineLg,
    fontSize: 32,
    fontWeight: '700',
  },
  logoFin: {
    color: COLORS.onSurface,
  },
  logoCoach: {
    color: COLORS.primary,
  },
  title: {
    ...TYPOGRAPHY.sizes.headlineMd,
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },
  subtitle: {
    ...TYPOGRAPHY.sizes.bodyMd,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: SPACING.stackLg,
  },
  inputField: {
    backgroundColor: COLORS.surfaceLighter,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.stackLg,
    marginTop: SPACING.base,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.sizes.labelSm,
    color: COLORS.onSurfaceVariant,
  },
  loginButton: {
    backgroundColor: COLORS.primaryContainer,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.stackLg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    ...TYPOGRAPHY.sizes.labelSm,
    color: 'rgba(220, 226, 248, 0.5)',
    paddingHorizontal: SPACING.md,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.stackLg,
    marginBottom: SPACING.xl,
  },
  socialButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surfaceLighter,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  footer: {
    paddingBottom: SPACING.stackLg,
    alignItems: 'center',
  },
  signupText: {
    ...TYPOGRAPHY.sizes.bodyMd,
    color: COLORS.onSurfaceVariant,
  },
  signupLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default LoginScreen;