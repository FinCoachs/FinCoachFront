/**
 * AppHeader — en-tête commun à tous les écrans principaux.
 *
 * Structure fixe :
 *   [Titre + sous-titre optionnel]   [actions contextuelles] [🌙/☀]
 *
 * Props :
 *   title        string       Titre de la page (ex : "Transactions")
 *   subtitle     string?      Texte secondaire sous le titre (ex : la date)
 *   rightContent ReactNode?   Boutons contextuels avant le toggle (ex : mois)
 *   avatarLabel  string?      Initiale de l'avatar (Dashboard seulement)
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../constants/theme';

export const AppHeader = ({ title, subtitle, rightContent, avatarLabel, showThemeToggle = false }) => {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View style={[
      styles.header,
      { backgroundColor: colors.surface, borderBottomColor: colors.divider },
    ]}>
      {/* ── Gauche ── */}
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* ── Droite ── */}
      <View style={styles.right}>
        {rightContent ?? null}

        {showThemeToggle && (
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.inputBg, borderColor: colors.borderLight }]}
            onPress={toggleTheme}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={17}
              color={isDark ? '#F5B731' : colors.primary}
            />
          </TouchableOpacity>
        )}

        {/* Avatar initiale — Dashboard seulement */}
        {avatarLabel ? (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
              {avatarLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: SPACING.marginX,
    borderBottomWidth: 1,
  },
  left:     { flex: 1, gap: 2 },
  title:    { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 11, fontWeight: '400' },

  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  avatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
});

export default AppHeader;
