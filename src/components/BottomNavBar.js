import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

const NAV_ITEMS = [
  {
    id: 'Dashboard',
    label: 'Accueil',
    lib: 'ionicons',
    icon: 'home-outline',
    iconActive: 'home',
  },
  {
    id: 'Transactions',
    label: 'Transactions',
    lib: 'community',
    icon: 'receipt-outline',
    iconActive: 'receipt',
  },
  {
    id: 'Budget',
    label: 'Budget',
    lib: 'ionicons',
    icon: 'wallet-outline',
    iconActive: 'wallet',
  },
  {
    id: 'CoachIA',
    label: 'Coach IA',
    lib: 'community',
    icon: 'robot-outline',
    iconActive: 'robot',
  },
  {
    id: 'Profile',
    label: 'Profil',
    lib: 'ionicons',
    icon: 'person-outline',
    iconActive: 'person',
  },
];

// Écrans réellement implémentés dans le navigateur
const IMPLEMENTED = ['Dashboard', 'Transactions'];

const NavIcon = ({ item, isActive }) => {
  const color = isActive ? COLORS.primary : 'rgba(186, 203, 190, 0.5)';
  const name  = isActive ? item.iconActive : item.icon;

  if (item.lib === 'community') {
    return <MaterialCommunityIcons name={name} size={22} color={color} />;
  }
  return <Ionicons name={name} size={22} color={color} />;
};

export const BottomNavBar = ({ activeScreen, navigation }) => (
  <View style={styles.container}>
    {NAV_ITEMS.map((item) => {
      const isActive = activeScreen === item.id;
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.item}
          activeOpacity={0.75}
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
          {/* Fond pill derrière l'icône active */}
          <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
            <NavIcon item={item} isActive={isActive} />
          </View>

          <Text style={[styles.label, isActive && styles.labelActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    backgroundColor: 'rgba(10, 16, 30, 0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },

  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },

  // Fond capsule derrière l'icône
  iconWrap: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(68, 243, 169, 0.13)',
  },

  label: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(186, 203, 190, 0.5)',
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default BottomNavBar;
