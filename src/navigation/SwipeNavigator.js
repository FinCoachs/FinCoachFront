/**
 * SwipeNavigator — navigation par balayage horizontal
 *
 * Utilise react-native-reanimated (déjà installé) au lieu de
 * React Native Animated : compatible avec la nouvelle architecture
 * (Fabric / Expo SDK 56 / RN 0.85).
 *
 * Le useSharedValue est mis à jour depuis le JS thread via onPageScroll,
 * et les useAnimatedStyle s'exécutent sur le UI thread de Reanimated.
 */

import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../context/ThemeContext';

import { DashboardScreen }    from '../../screens/DashboardScreen';
import { TransactionsScreen } from '../../screens/TransactionsScreen';
import { BudgetScreen }       from '../../screens/BudgetScreen';
import { CoachIAScreen }      from '../../screens/CoachIAScreen';
import { ProfileScreen }      from '../../screens/ProfileScreen';

// ── Config ────────────────────────────────────

const { width: W } = Dimensions.get('window');

const TABS = [
  { label: 'Accueil',      lib: 'ionicons',  icon: 'home-outline',    iconActive: 'home'    },
  { label: 'Transactions', lib: 'ionicons', icon: 'swap-horizontal-outline', iconActive: 'swap-horizontal' },
  { label: 'Budget',       lib: 'ionicons',  icon: 'wallet-outline',  iconActive: 'wallet'  },
  { label: 'Coach IA',     lib: 'community', icon: 'robot-outline',   iconActive: 'robot'   },
  { label: 'Profil',       lib: 'ionicons',  icon: 'person-outline',  iconActive: 'person'  },
];

const SWIPEABLE = 5;
const TAB_W     = W / TABS.length;

// ── Icônes ────────────────────────────────────

const Icon = ({ tab, active, color }) => {
  const name = active ? tab.iconActive : tab.icon;
  return tab.lib === 'community'
    ? <MaterialCommunityIcons name={name} size={22} color={color} />
    : <Ionicons               name={name} size={22} color={color} />;
};

// ── Onglet individuel ─────────────────────────
// Les hooks Reanimated DOIVENT être appelés avant tout return conditionnel.

const TabItem = ({ tab, idx, isActive, scrollX, onPress }) => {
  const { colors } = useTheme();
  const isSwipeable = idx < SWIPEABLE;

  // Tous les hooks déclarés ici — avant le return conditionnel
  const wrapStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(scrollX.value, [idx - 1, idx, idx + 1], [0.45, 1, 0.45], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(scrollX.value, [idx - 1, idx, idx + 1], [0.88, 1.06, 0.88], Extrapolation.CLAMP) }],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [idx - 0.4, idx, idx + 0.4], [0, 1, 0], Extrapolation.CLAMP),
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [idx - 0.4, idx, idx + 0.4], [1, 0, 1], Extrapolation.CLAMP),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [idx - 1, idx, idx + 1], [0.45, 1, 0.45], Extrapolation.CLAMP),
  }));

  // Onglets non balayables : statique
  if (!isSwipeable) {
    return (
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => Alert.alert(
          'Bientôt disponible',
          `L'écran "${tab.label}" arrive prochainement.`,
          [{ text: 'OK' }],
        )}
      >
        <View style={[styles.iconWrap, { opacity: 0.45 }]}>
          <Icon tab={tab} active={false} color={colors.textSecondary} />
        </View>
        <Text style={[styles.tabLabel, { color: colors.textSecondary, opacity: 0.45 }]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.tabItem}
      activeOpacity={0.75}
      onPress={() => onPress(idx)}
    >
      <Animated.View style={[styles.iconWrap, wrapStyle]}>
        {/* Icône inactive */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.iconCenter, inactiveIconStyle]}>
          <Icon tab={tab} active={false} color={colors.textSecondary} />
        </Animated.View>
        {/* Icône active */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.iconCenter, activeIconStyle]}>
          <Icon tab={tab} active={true} color={colors.primary} />
        </Animated.View>
      </Animated.View>

      {/* color est statique (non-animé) → pas d'erreur native driver */}
      <Animated.Text
        style={[
          styles.tabLabel,
          { color: isActive ? colors.primary : colors.textSecondary },
          labelStyle,
        ]}
      >
        {tab.label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

// ── Navbar ────────────────────────────────────

const AnimatedNavBar = ({ scrollX, activePage, onTabPress, colors }) => {
  const insets = useSafeAreaInsets();

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        scrollX.value,
        [0, 1, 2, 3, 4],
        [0, TAB_W, TAB_W * 2, TAB_W * 3, TAB_W * 4],
        Extrapolation.CLAMP,
      ),
    }],
  }));

  return (
    <View style={[
      styles.navbar,
      { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom },
    ]}>
      {/* Ligne colorée en haut */}
      <Animated.View style={[styles.activeLine, { backgroundColor: colors.primary }, indicatorStyle]} />

      {/* Capsule de fond */}
      <Animated.View style={[styles.pill, { backgroundColor: `${colors.primary}14` }, indicatorStyle]} />

      {TABS.map((tab, idx) => (
        <TabItem
          key={tab.label}
          tab={tab}
          idx={idx}
          isActive={activePage === idx}
          scrollX={scrollX}
          onPress={onTabPress}
        />
      ))}
    </View>
  );
};

// ── SwipeNavigator ────────────────────────────

export const SwipeNavigator = ({ navigation }) => {
  const { colors } = useTheme();
  const pagerRef  = useRef(null);

  // useSharedValue : partagé entre JS thread et UI thread Reanimated
  const scrollX   = useSharedValue(0);
  const [activePage, setActivePage] = useState(0);

  const handlePageScroll = (e) => {
    // Mise à jour sur JS thread → Reanimated propage sur UI thread
    scrollX.value = e.nativeEvent.position + e.nativeEvent.offset;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        overdrag
        onPageScroll={handlePageScroll}
        onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
      >
        <View key="0" style={styles.page}><DashboardScreen    navigation={navigation} /></View>
        <View key="1" style={styles.page}><TransactionsScreen navigation={navigation} /></View>
        <View key="2" style={styles.page}><BudgetScreen       navigation={navigation} /></View>
        <View key="3" style={styles.page}><CoachIAScreen      navigation={navigation} /></View>
        <View key="4" style={styles.page}><ProfileScreen      navigation={navigation} /></View>
      </PagerView>

      <AnimatedNavBar
        scrollX={scrollX}
        activePage={activePage}
        onTabPress={(idx) => pagerRef.current?.setPage(idx)}
        colors={colors}
      />
    </GestureHandlerRootView>
  );
};

// ── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  pager: { flex: 1 },
  page:  { flex: 1 },

  navbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    position: 'relative',
    paddingTop: 2,
  },

  activeLine: {
    position: 'absolute', top: 0, left: 0,
    width: TAB_W, height: 3,
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
  },

  pill: {
    position: 'absolute', top: 0, left: 0,
    width: TAB_W, height: '100%',
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
  iconCenter: {
    alignItems: 'center', justifyContent: 'center',
  },

  tabLabel: { fontSize: 10, fontWeight: '600' },
});

export default SwipeNavigator;
