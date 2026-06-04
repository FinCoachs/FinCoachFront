import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ topInset = 0 }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.bubble,
        { top: topInset + 12 },
        isDark ? styles.bubbleDark : styles.bubbleLight,
      ]}
      onPress={toggleTheme}
      activeOpacity={0.75}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={17}
        color={isDark ? '#ffba4b' : '#4a6080'}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  bubbleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  bubbleLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default ThemeToggle;
