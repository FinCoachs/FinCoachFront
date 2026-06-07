import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { SPACING, BORDER_RADIUS, getShadow } from '../src/constants/theme';

// ── Données ───────────────────────────────────────────────

const RECOMMANDATIONS = [
  {
    id: '1',
    categorie: 'Alertes',
    label: 'ALERTE BUDGET',
    iconLib: 'community',
    icon: 'lightning-bolt',
    texte: "Votre budget 'Loisirs' approche de sa limite (92% consommé). Évitez les dépenses non essentielles cette semaine pour rester dans vos objectifs.",
    temps: 'Il y a 2h',
  },
  {
    id: '2',
    categorie: 'Épargne',
    label: 'CONSEIL ÉPARGNE',
    iconLib: 'community',
    icon: 'piggy-bank',
    texte: "Vous avez 125 000 FCFA dormant sur votre compte courant depuis 15 jours. Placez-les sur votre compte épargne pour générer des intérêts.",
    temps: 'Il y a 5h',
  },
  {
    id: '3',
    categorie: 'Alertes',
    label: 'ACTIVITÉ INHABITUELLE',
    iconLib: 'ionicons',
    icon: 'alert-circle',
    texte: "Une transaction de 45 000 FCFA via MoMo a été détectée à 03:00 du matin. S'agit-il bien de vous ?",
    temps: 'Hier',
  },
  {
    id: '4',
    categorie: 'Dépenses',
    label: 'OPTIMISATION ABONNEMENT',
    iconLib: 'ionicons',
    icon: 'trending-down',
    texte: "Vous payez deux abonnements de streaming musical. En combinant ces services, vous pourriez économiser 2 500 FCFA par mois.",
    temps: 'Hier',
  },
  {
    id: '5',
    categorie: 'Épargne',
    label: 'OBJECTIF ATTEINT',
    iconLib: 'ionicons',
    icon: 'rocket',
    texte: "Félicitations ! Votre fonds d'urgence a atteint 50% de son objectif. Continuez ainsi pour une sécurité financière totale.",
    temps: '2 jours',
  },
  {
    id: '6',
    categorie: 'Alertes',
    label: 'PRÉVISION FACTURE',
    iconLib: 'ionicons',
    icon: 'calendar',
    texte: "Votre facture d'électricité SBEE est prévue pour dans 3 jours (approx. 22 000 FCFA). Prévoyez les fonds nécessaires.",
    temps: '3 jours',
  },
];

const FILTRES = ['Tout', 'Dépenses', 'Épargne', 'Alertes'];

// ── Icon helper ───────────────────────────────────────────

const Icon = ({ lib, name, size, color }) =>
  lib === 'community'
    ? <MaterialCommunityIcons name={name} size={size} color={color} />
    : <Ionicons name={name} size={size} color={color} />;

// ── Carte recommandation ──────────────────────────────────

const RecoCard = ({ item, colors, isDark }) => {
  const shadow = getShadow(isDark);
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }, shadow.sm]}>
      {/* Accent gauche jaune */}
      <View style={[styles.accentBar, { backgroundColor: colors.secondary }]} />

      <View style={styles.cardContent}>
        {/* En-tête */}
        <View style={styles.cardHeader}>
          <View style={styles.cardLabelRow}>
            <Icon lib={item.iconLib} name={item.icon} size={18} color={colors.secondary} />
            <Text style={[styles.cardLabel, { color: colors.secondary }]}>{item.label}</Text>
          </View>
          <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{item.temps}</Text>
        </View>

        {/* Texte */}
        <Text style={[styles.cardText, { color: colors.onSurface ?? colors.textPrimary }]}>
          {item.texte}
        </Text>
      </View>
    </View>
  );
};

// ── Screen ─────────────────────────────────────────────────

export const RecommandationsScreen = ({ navigation }) => {
  const { colors, isDark }        = useTheme();
  const [search,  setSearch]      = useState('');
  const [filtre,  setFiltre]      = useState('Tout');

  const items = useMemo(() => {
    let list = RECOMMANDATIONS;
    if (filtre !== 'Tout') list = list.filter(r => r.categorie === filtre);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.texte.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filtre, search]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: `${colors.surface}CC`, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Recommandations</Text>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Barre de recherche */}
        <View style={[styles.searchWrap, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Rechercher une recommandation..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtresRow}
          style={styles.filtresScroll}
        >
          {FILTRES.map(f => {
            const active = filtre === f;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filtreChip,
                  active
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.cardBg, borderColor: colors.border, borderWidth: 1 },
                ]}
                onPress={() => setFiltre(f)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.filtreText,
                  { color: active ? colors.onPrimary : colors.textSecondary },
                ]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Liste */}
        {items.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="robot-confused-outline" size={48} color={colors.placeholder} />
            <Text style={[styles.emptyText, { color: colors.placeholder }]}>Aucune recommandation trouvée</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map(item => (
              <RecoCard key={item.id} item={item} colors={colors} isDark={isDark} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
    height: 56,
    borderBottomWidth: 1,
  },
  headerBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },

  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.stackMd,
    paddingBottom: SPACING.stackLg * 2,
    gap: SPACING.stackLg,
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 14,
    borderWidth: 1, paddingHorizontal: SPACING.stackMd,
    gap: SPACING.stackSm,
  },
  searchInput: { flex: 1, fontSize: 14 },

  filtresScroll: { marginHorizontal: -SPACING.marginX },
  filtresRow: {
    paddingHorizontal: SPACING.marginX,
    gap: SPACING.stackSm,
    paddingBottom: 2,
  },
  filtreChip: {
    paddingHorizontal: SPACING.stackLg, paddingVertical: SPACING.stackSm,
    borderRadius: BORDER_RADIUS.full,
  },
  filtreText: { fontSize: 12, fontWeight: '600' },

  list: { gap: SPACING.stackMd },

  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: { width: 3 },
  cardContent: {
    flex: 1,
    padding: SPACING.stackMd,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cardLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  cardTime:     { fontSize: 11, fontWeight: '500', marginLeft: 8 },
  cardText:     { fontSize: 14, lineHeight: 21 },

  empty: {
    alignItems: 'center', paddingVertical: 64, gap: 12,
  },
  emptyText: { fontSize: 14 },
});

export default RecommandationsScreen;
