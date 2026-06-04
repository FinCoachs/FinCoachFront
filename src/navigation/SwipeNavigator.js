/**
 * SwipeNavigator — navigation par balayage horizontal
 *
 * Animation 100% native — zéro lag JS :
 *   Animated.event({ useNativeDriver: true }) connecte le scroll PagerView
 *   directement au thread natif. Aucune donnée ne passe par le JS bridge
 *   pendant le glissement.
 *
 * Règle hooks : chaque onglet = composant TabItem séparé.
 */

import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Dimensions, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../context/ThemeContext';

import { DashboardScreen }    from '../../screens/DashboardScreen';
import { TransactionsScreen } from '../../screens/TransactionsScreen';
import { BudgetScreen }       from '../../screens/BudgetScreen';

// ── Config ────────────────────────────────────

const { width: W } = Dimensions.get('window');

const TABS = [
  { label: 'Accueil',      lib: 'ionicons',  icon: 'home-outline',    iconActive: 'home'    },
  { label: 'Transactions', lib: 'community', icon: 'receipt-outline', iconActive: 'receipt' },
  { label: 'Budget',       lib: 'ionicons',  icon: 'wallet-outline',  iconActive: 'wallet'  },
  { label: 'Coach IA',     lib: 'community', icon: 'robot-outline',   iconActive: 'robot'   },
  { label: 'Profil',       lib: 'ionicons',  icon: 'person-outline',  iconActive: 'person'  },
];

const SWIPEABLE = 3;
const TAB_W     = W / TABS.length;

// ── Icônes ────────────────────────────────────

const Icon = ({ tab, active, color }) => {
  const name = active ? tab.iconActive : tab.icon;
  return tab.lib === 'community'
    ? <MaterialCommunityIcons name={name} size={22} color={color} />
    : <Ionicons               name={name} size={22} color={color} />;
};

// ── Onglet individuel ─────────────────────────
// scrollX est un Animated.Value natif — toutes les interpolations
// s'exécutent sur le thread natif (useNativeDriver: true).

const TabItem = ({ tab, idx, scrollX, activePage, onPress }) => {
  const { colors } = useTheme();
  const isSwipeable = idx < SWIPEABLE;

  // Onglets non balayables : affichage statique
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

  // ── Interpolations natives (zéro JS pendant le geste) ──

  // Opacité : 1 au centre, 0.45 à ±1
  const opacity = scrollX.interpolate({
    inputRange:  [idx - 1, idx, idx + 1],
    outputRange: [0.45, 1, 0.45],
    extrapolate: 'clamp',
  });

  // Scale : légèrement agrandi quand actif
  const scale = scrollX.interpolate({
    inputRange:  [idx - 1, idx, idx + 1],
    outputRange: [0.88, 1.06, 0.88],
    extrapolate: 'clamp',
  });

  // Crossfade icône active ↔ inactive
  const activeIconOpacity = scrollX.interpolate({
    inputRange:  [idx - 0.4, idx, idx + 0.4],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });
  const inactiveIconOpacity = scrollX.interpolate({
    inputRange:  [idx - 0.4, idx, idx + 0.4],
    outputRange: [1, 0, 1],
    extrapolate: 'clamp',
  });

  // Couleur du label interpolée (natif)
  const labelColor = scrollX.interpolate({
    inputRange:  [idx - 1, idx, idx + 1],
    outputRange: [colors.textSecondary, colors.primary, colors.textSecondary],
    extrapolate: 'clamp',
  });

  return (
    <TouchableOpacity
      style={styles.tabItem}
      activeOpacity={0.75}
      onPress={() => onPress(idx)}
    >
      <Animated.View style={[styles.iconWrap, { opacity, transform: [{ scale }] }]}>
        {/* Icône inactive */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.iconCenter, { opacity: inactiveIconOpacity }]}>
          <Icon tab={tab} active={false} color={colors.textSecondary} />
        </Animated.View>
        {/* Icône active */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.iconCenter, { opacity: activeIconOpacity }]}>
          <Icon tab={tab} active={true} color={colors.primary} />
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[styles.tabLabel, { color: labelColor, opacity }]}>
        {tab.label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

// ── Navbar ────────────────────────────────────

const AnimatedNavBar = ({ scrollX, activePage, onTabPress, colors }) => {
  const insets = useSafeAreaInsets();

  // Indicateur glissant : suit le scroll nativement
  const indicatorX = scrollX.interpolate({
    inputRange:  [0, 1, 2],
    outputRange: [0, TAB_W, TAB_W * 2],
    extrapolate: 'clamp',
  });

  return (
    <View style={[
      styles.navbar,
      { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom },
    ]}>
      {/* Ligne colorée en haut */}
      <Animated.View style={[
        styles.activeLine,
        { backgroundColor: colors.primary, transform: [{ translateX: indicatorX }] },
      ]} />

      {/* Capsule de fond */}
      <Animated.View style={[
        styles.pill,
        { backgroundColor: `${colors.primary}14`, transform: [{ translateX: indicatorX }] },
      ]} />

      {TABS.map((tab, idx) => (
        <TabItem
          key={tab.label}
          tab={tab}
          idx={idx}
          scrollX={scrollX}
          activePage={activePage}
          onPress={onTabPress}
        />
      ))}
    </View>
  );
};

// ── SwipeNavigator ────────────────────────────

export const SwipeNavigator = ({ navigation }) => {
  const { colors } = useTheme();
  const pagerRef   = useRef(null);

  // Deux valeurs natives séparées → combinées en scrollX
  // Animated.event les met à jour directement sur le thread natif
  const position = useRef(new Animated.Value(0)).current;
  const offset   = useRef(new Animated.Value(0)).current;
  const scrollX  = Animated.add(position, offset);

  const [activePage, setActivePage] = useState(0);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        overdrag
        onPageScroll={Animated.event(
          [{ nativeEvent: { position, offset } }],
          { useNativeDriver: true },
        )}
        onPageSelected={(e) => {
          setActivePage(e.nativeEvent.position);
        }}
      >
        <View key="0" style={styles.page}><DashboardScreen    navigation={navigation} /></View>
        <View key="1" style={styles.page}><TransactionsScreen navigation={navigation} /></View>
        <View key="2" style={styles.page}><BudgetScreen       navigation={navigation} /></View>
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
