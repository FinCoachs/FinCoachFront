import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { id: 'Dashboard',    label: 'Accueil',     lib: 'ionicons',  icon: 'home-outline',     iconActive: 'home'    },
  { id: 'Transactions', label: 'Transactions', lib: 'community', icon: 'receipt-outline',  iconActive: 'receipt' },
  { id: 'Budget',       label: 'Budget',       lib: 'ionicons',  icon: 'wallet-outline',   iconActive: 'wallet'  },
  { id: 'CoachIA',      label: 'Coach IA',     lib: 'community', icon: 'robot-outline',    iconActive: 'robot'   },
  { id: 'Profile',      label: 'Profil',       lib: 'ionicons',  icon: 'person-outline',   iconActive: 'person'  },
];

const IMPLEMENTED = ['Dashboard', 'Transactions', 'Budget'];

const NavIcon = ({ item, isActive, colors }) => {
  const color = isActive ? colors.primary : colors.placeholder;
  const name  = isActive ? item.iconActive : item.icon;
  if (item.lib === 'community') {
    return <MaterialCommunityIcons name={name} size={22} color={color} />;
  }
  return <Ionicons name={name} size={22} color={color} />;
};

export const BottomNavBar = ({ activeScreen, navigation }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeScreen === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => {
              if (isActive) return;
              if (!IMPLEMENTED.includes(item.id)) {
                Alert.alert(
                  'Bientôt disponible',
                  `L'écran "${item.label}" arrive prochainement.`,
                  [{ text: 'OK' }],
                );
                return;
              }
              navigation.navigate(item.id);
            }}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <NavIcon item={item} isActive={isActive} colors={colors} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  iconWrap: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  iconWrapActive: {
    backgroundColor: `${colors.primary}1F`,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.placeholder,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default BottomNavBar;
