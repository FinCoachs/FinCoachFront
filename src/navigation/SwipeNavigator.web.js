import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../context/ThemeContext';

import { DashboardScreen }    from '../../screens/DashboardScreen';
import { TransactionsScreen } from '../../screens/TransactionsScreen';
import { BudgetScreen }       from '../../screens/BudgetScreen';
import { CoachIAScreen }      from '../../screens/CoachIAScreen';
import { ProfileScreen }      from '../../screens/ProfileScreen';

const { width: W } = Dimensions.get('window');

const TABS = [
  { label: 'Accueil',      lib: 'ionicons',  icon: 'home-outline',           iconActive: 'home'            },
  { label: 'Transactions', lib: 'ionicons',  icon: 'swap-horizontal-outline', iconActive: 'swap-horizontal' },
  { label: 'Budget',       lib: 'ionicons',  icon: 'wallet-outline',          iconActive: 'wallet'          },
  { label: 'Coach IA',     lib: 'community', icon: 'robot-outline',           iconActive: 'robot'           },
  { label: 'Profil',       lib: 'ionicons',  icon: 'person-outline',          iconActive: 'person'          },
];

const SCREENS = [DashboardScreen, TransactionsScreen, BudgetScreen, CoachIAScreen, ProfileScreen];

const Icon = ({ tab, active, color }) => {
  const name = active ? tab.iconActive : tab.icon;
  return tab.lib === 'community'
    ? <MaterialCommunityIcons name={name} size={22} color={color} />
    : <Ionicons               name={name} size={22} color={color} />;
};

export const SwipeNavigator = ({ navigation }) => {
  const { colors } = useTheme();
  const insets     = useSafeAreaInsets();
  const [activePage, setActivePage] = useState(0);

  const ActiveScreen = SCREENS[activePage];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <ActiveScreen navigation={navigation} />
      </View>

      <View style={[
        styles.navbar,
        { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom },
      ]}>
        {TABS.map((tab, idx) => {
          const isActive = activePage === idx;
          const color    = isActive ? colors.primary : colors.textSecondary;
          return (
            <TouchableOpacity
              key={tab.label}
              style={styles.tabItem}
              activeOpacity={0.75}
              onPress={() => setActivePage(idx)}
            >
              <View style={[styles.iconWrap, isActive && { backgroundColor: `${colors.primary}14`, borderRadius: 8 }]}>
                <Icon tab={tab} active={isActive} color={color} />
              </View>
              <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 2,
  },
  tabItem: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, gap: 2,
  },
  iconWrap: {
    width: 44, height: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  tabLabel: { fontSize: 10, fontWeight: '600' },
});

export default SwipeNavigator;
