import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BORDER_RADIUS, SPACING } from '../constants/theme';

export const GlassCard = ({ children, style }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const getStyles = (colors, isDark) => StyleSheet.create({
  card: {
    backgroundColor: colors.glassBg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...Platform.select({
      ios: {
        shadowColor: isDark ? '#000' : '#1a3060',
        shadowOffset: { width: 0, height: isDark ? 8 : 4 },
        shadowOpacity: isDark ? 0.4 : 0.08,
        shadowRadius: isDark ? 16 : 12,
      },
      android: {
        elevation: isDark ? 12 : 4,
      },
    }),
  },
});

export default GlassCard;
