import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { Button } from '../src/components';

export const WelcomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.bottomGlow} />

      <View style={styles.header}>
        <View style={styles.geometricBg}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.arc1} />
        </View>

        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            <Text style={styles.logoFin}>Fin</Text>
            <Text style={styles.logoCoach}>Coach</Text>
          </Text>
        </View>

        <View style={styles.bannerCard}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-DVsM4HBMDJvv8V7btsUawvZUB4IapqbmMmw-vtEz8_UQMaVQwFoNhfQ3ekcioEJhQLutntIcW0LBIHEP6VD9waxRkctlzkTP3RG5sysmVguAnIkTtUSYHdaZsUf-uzF1sGJ8SjsTcUyvYsVkLiNw50jSZd-xI55u9epjikSCmpRvWomLBMw9Gv72a6YheifIph5yYtRLsC5synY8gzAELu2bVgZPKwlwTz9ehL1a0zCBHybPZFMateM2SurRNJtMp2QiF0SvD6ZY' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerFadeOverlay} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Votre argent, enfin sous contrôle.</Text>
        <Text style={styles.subtitle}>
          Banque et Mobile Money réunis dans un seul coach intelligent.
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <Button title="Créer un compte"      onPress={() => navigation.navigate('Signup')} variant="primary" />
          <Button title="J'ai déjà un compte"  onPress={() => navigation.navigate('Login')}  variant="secondary" />
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>GRATUIT · SÉCURISÉ · 100% CONFIDENTIEL</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={{ height: SPACING.base }} />
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors, isDark) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.background },
  bottomGlow: {
    position: 'absolute', bottom: 0, alignSelf: 'center',
    width: 200, height: 60,
    backgroundColor: `${colors.primary}1A`,
    borderRadius: BORDER_RADIUS.full,
  },

  header: {
    height: 353, position: 'relative',
    alignItems: 'center', justifyContent: 'center',
    paddingTop: SPACING.stackLg,
  },
  geometricBg: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', zIndex: 0 },
  circle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#00D68F', opacity: isDark ? 0.15 : 0.10, top: -50, left: -50,
  },
  circle2: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#f8bd45', opacity: isDark ? 0.12 : 0.08, top: 40, right: -30,
  },
  arc1: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    borderWidth: 40, borderColor: 'rgba(0, 214, 143, 0.08)', top: -150, right: -100,
  },

  logoContainer: { zIndex: 10, flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.stackMd },
  logoText:      { ...TYPOGRAPHY.sizes.headlineLg, fontSize: 32, fontWeight: '700' },
  logoFin:       { color: colors.onSurface },
  logoCoach:     { color: colors.primary },

  bannerCard: {
    width: '80%', height: 192, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
    zIndex: 10, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  bannerImage:       { width: '100%', height: '100%', opacity: isDark ? 0.6 : 0.8 },
  bannerFadeOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: isDark ? 'rgba(8, 15, 30, 0.3)' : 'rgba(238, 243, 255, 0.15)',
  },

  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: SPACING.marginX, zIndex: 10,
  },
  title: {
    ...TYPOGRAPHY.sizes.headlineLg, color: colors.onSurface,
    textAlign: 'center', marginBottom: SPACING.stackSm,
  },
  subtitle: {
    ...TYPOGRAPHY.sizes.bodyLg, color: colors.onSurfaceVariant,
    textAlign: 'center', maxWidth: 280, lineHeight: 24,
  },

  footer:           { paddingHorizontal: SPACING.marginX, paddingBottom: SPACING.stackLg, zIndex: 10 },
  buttonContainer:  { gap: SPACING.stackMd, marginBottom: SPACING.stackLg },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.gutter },
  dividerLine:      { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText:      { ...TYPOGRAPHY.sizes.labelSm, color: colors.placeholder, letterSpacing: 1.5, textTransform: 'uppercase' },
});

export default WelcomeScreen;
