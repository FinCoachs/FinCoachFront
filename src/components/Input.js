import { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BORDER_RADIUS, SPACING } from '../constants/theme';

export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  style,
  containerStyle,
}) => {
  const { colors } = useTheme();
  const styles     = getStyles(colors);

  const [isFocused,    setIsFocused]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error     && styles.inputError,
        style,
      ]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(v => !v)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
  inputError:   { borderColor: colors.error,   backgroundColor: `${colors.error}08`   },
  icon:         { paddingLeft: SPACING.md },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: SPACING.md,
    ...Platform.select({ web: { outlineStyle: 'none' } }),
  },
  eyeButton: { paddingRight: SPACING.md },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginLeft: 4,
  },
});

export default Input;
