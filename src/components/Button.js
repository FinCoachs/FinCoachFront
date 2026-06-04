import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const styles     = getStyles(colors);

  const btnStyle  = variant === 'secondary' ? styles.secondaryButton
                  : variant === 'outline'   ? styles.outlineButton
                  :                           styles.primaryButton;

  const txtStyle  = variant === 'secondary' ? styles.secondaryText
                  : variant === 'outline'   ? styles.outlineText
                  :                           styles.primaryText;

  return (
    <TouchableOpacity
      style={[styles.button, btnStyle, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
      ) : (
        <>
          {icon && iconPosition === 'left'  && icon}
          <Text style={[styles.text, txtStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (colors) => StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  text:          { fontSize: 16, fontWeight: '600' },
  primaryText:   { color: colors.onPrimary,    fontWeight: '700' },
  secondaryText: { color: colors.textPrimary,  fontWeight: '600' },
  outlineText:   { color: colors.primary,      fontWeight: '600' },
  disabled:      { opacity: 0.45 },
});

export default Button;
