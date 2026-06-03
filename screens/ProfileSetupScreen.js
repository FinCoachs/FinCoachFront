import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../src/constants/theme';

const STATUTES = ['Étudiant', 'Salarié', 'Freelance / Entrepreneur', 'Autre'];
const GOALS = ['Épargner', 'Suivre mes dépenses', 'Gérer mes budgets', 'Investir'];

export const ProfileSetupScreen = ({ navigation }) => {
  const [selectedStatus, setSelectedStatus] = useState('Salarié');
  const [selectedGoal, setSelectedGoal] = useState('Gérer mes budgets');

  const handleFinish = () => {
    console.log('Profile configured:', {
      status: selectedStatus,
      goal: selectedGoal,
    });
    // On redirige vers Login (ou l'accueil le moment venu)
    navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Background Decorative Glows */}
      <View style={styles.glowEmerald} />
      <View style={styles.glowGold} />

      {/* Top Header App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FinCoach</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Header Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Configurez votre profil financier</Text>
            <Text style={styles.heroSubtitle}>
              Ces informations nous permettent de personnaliser vos budgets et vos recommandations d'IA.
            </Text>
          </View>

          {/* Section 1: Professional Status */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>VOTRE SITUATION ACTUELLE</Text>
            <Text style={styles.sectionQuestion}>Quel est votre statut socio-professionnel ?</Text>
            <View style={styles.chipsContainer}>
              {STATUTES.map((item) => {
                const isActive = selectedStatus === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      isActive ? styles.chipActive : styles.chipInactive,
                    ]}
                    onPress={() => setSelectedStatus(item)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 2: Financial Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>VOTRE OBJECTIF PRINCIPAL</Text>
            <Text style={styles.sectionQuestion}>Quel est votre objectif financier principal ?</Text>
            <View style={styles.chipsContainer}>
              {GOALS.map((item) => {
                const isActive = selectedGoal === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      isActive ? styles.chipActive : styles.chipInactive,
                    ]}
                    onPress={() => setSelectedGoal(item)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Padding to prevent overlap with fixed footer */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Footer Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Finaliser mon profil</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
        </TouchableOpacity>
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
    width: 350,
    height: 350,
    backgroundColor: 'rgba(248, 189, 69, 0.03)',
    borderRadius: BORDER_RADIUS.full,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX,
    height: 56,
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
  headerTitle: {
    ...TYPOGRAPHY.sizes.headlineLg,
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '700',
  },
  headerRightSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: 24,
  },
  heroSection: {
    marginBottom: 36,
  },
  heroTitle: {
    ...TYPOGRAPHY.sizes.headlineLg,
    color: COLORS.onSurface,
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.sizes.bodyMd,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  section: {
    marginBottom: 40,
  },
  sectionLabel: {
    ...TYPOGRAPHY.sizes.labelCaps,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xs,
  },
  sectionQuestion: {
    ...TYPOGRAPHY.sizes.bodyLg,
    color: COLORS.onSurface,
    fontWeight: '500',
    marginBottom: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipInactive: {
    backgroundColor: COLORS.surfaceContainer || '#191f2f',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  chipText: {
    ...TYPOGRAPHY.sizes.labelSm,
    fontSize: 13,
  },
  chipTextActive: {
    color: COLORS.background,
    fontWeight: '700',
  },
  chipTextInactive: {
    color: COLORS.onSurfaceVariant,
  },
  walletsContainer: {
    gap: 16,
  },
  walletCardPressable: {
    width: '100%',
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  walletLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTextContainer: {
    flex: 1,
  },
  walletName: {
    ...TYPOGRAPHY.sizes.bodyLg,
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  walletSub: {
    ...TYPOGRAPHY.sizes.labelSm,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1E35',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.marginX,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
    paddingTop: 16,
  },
  submitButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileSetupScreen;
