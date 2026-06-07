import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionsContext';
import { requestSmsPermission, readMobileMoneyTransactions } from '../services/MomoSmsService';
import { SPACING, BORDER_RADIUS } from '../constants/theme';

// ── Ligne de transaction parsée ───────────────────────────────────────────────

const TxRow = ({ tx, selected, onToggle, colors, alreadyImported }) => {
  const isCredit = tx.type === 'entrée';
  const dateStr  = tx.date instanceof Date
    ? tx.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '—';

  return (
    <TouchableOpacity
      style={[
        styles.row,
        { borderBottomColor: colors.divider },
        alreadyImported && { opacity: 0.4 },
      ]}
      onPress={() => !alreadyImported && onToggle()}
      activeOpacity={0.7}
    >
      {/* Checkbox */}
      <View style={[
        styles.checkbox,
        { borderColor: selected ? colors.primary : colors.border },
        selected && { backgroundColor: colors.primary },
      ]}>
        {selected && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>

      {/* Infos */}
      <View style={styles.txInfo}>
        <Text style={[styles.txName, { color: colors.textPrimary }]} numberOfLines={1}>
          {tx.name}
        </Text>
        <Text style={[styles.txDate, { color: colors.placeholder }]}>{dateStr}</Text>
        {alreadyImported && (
          <Text style={[styles.txDuplicate, { color: colors.placeholder }]}>déjà importé</Text>
        )}
      </View>

      {/* Montant */}
      <Text style={[
        styles.txAmount,
        { color: isCredit ? colors.income : colors.expense },
      ]}>
        {isCredit ? '+' : '-'}{tx.montant.toLocaleString('fr-FR')} F
      </Text>
    </TouchableOpacity>
  );
};

// ── Modal principal ───────────────────────────────────────────────────────────

export const MomoImportModal = ({ visible, onClose }) => {
  const { colors }                               = useTheme();
  const { importSmsTransactions, isRefImported } = useTransactions();

  const [status,   setStatus]   = useState('idle');   // 'idle' | 'loading' | 'done' | 'error'
  const [parsed,   setParsed]   = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      setParsed([]);
      setSelected(new Set());
      setStatus('idle');
    }
  }, [visible]);

  const handleRead = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Non disponible', 'La lecture des SMS n\'est disponible que sur Android.');
      return;
    }
    setStatus('loading');
    const granted = await requestSmsPermission();
    if (!granted) {
      setStatus('error');
      setErrorMsg('Permission refusée. Veuillez autoriser l\'accès aux SMS dans les paramètres.');
      return;
    }
    try {
      const txs = await readMobileMoneyTransactions();
      setParsed(txs);
      // Pré-sélectionne tout sauf ceux déjà importés
      const sel = new Set(
        txs
          .filter((tx) => !isRefImported(tx.smsRef ?? ''))
          .map((_, i) => i),
      );
      setSelected(sel);
      setStatus('done');
    } catch (e) {
      setStatus('error');
      setErrorMsg(
        e.message?.includes('NativeModule')
          ? 'Module natif non disponible.\nConstruisez un APK avec "npx expo run:android".'
          : (e.message || 'Erreur inconnue'),
      );
    }
  };

  const toggleAll = () => {
    const importable = parsed
      .map((tx, i) => ({ tx, i }))
      .filter(({ tx }) => !isRefImported(tx.smsRef ?? ''))
      .map(({ i }) => i);
    if (selected.size === importable.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(importable));
    }
  };

  const toggle = (i) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleImport = () => {
    const toImport = [...selected].map((i) => parsed[i]);
    const count = importSmsTransactions(toImport);
    Alert.alert(
      'Import terminé',
      count > 0
        ? `${count} transaction${count > 1 ? 's' : ''} ajoutée${count > 1 ? 's' : ''}.`
        : 'Aucune nouvelle transaction (déjà importées).',
      [{ text: 'OK', onPress: onClose }],
    );
  };

  const importableCount = parsed.filter((tx) => !isRefImported(tx.smsRef ?? '')).length;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>Import SMS</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              MTN MoMo · Moov Money · Celtiis Cash
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Contenu */}
        {status === 'idle' && (
          <View style={styles.center}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Lire les SMS MoMo
            </Text>
            <Text style={[styles.emptyHint, { color: colors.placeholder }]}>
              FinCoach va analyser vos SMS MTN MoMo et vous proposer d'importer les transactions détectées.
            </Text>
            <TouchableOpacity
              style={[styles.readBtn, { backgroundColor: colors.primary }]}
              onPress={handleRead}
              activeOpacity={0.85}
            >
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.readBtnText}>Lire mes SMS</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Lecture des SMS en cours…
            </Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.expense} />
            <Text style={[styles.errorText, { color: colors.expense }]}>Erreur</Text>
            <Text style={[styles.errorMsg, { color: colors.placeholder }]}>{errorMsg}</Text>
            <TouchableOpacity
              style={[styles.readBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
              onPress={handleRead}
              activeOpacity={0.85}
            >
              <Text style={styles.readBtnText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'done' && (
          <>
            {/* Barre de contrôle */}
            <View style={[styles.controlBar, { borderBottomColor: colors.divider }]}>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {parsed.length} SMS détecté{parsed.length > 1 ? 's' : ''}
                {importableCount < parsed.length && ` · ${parsed.length - importableCount} déjà importé(s)`}
              </Text>
              {importableCount > 0 && (
                <TouchableOpacity onPress={toggleAll} activeOpacity={0.7}>
                  <Text style={[styles.selectAllText, { color: colors.primary }]}>
                    {selected.size === importableCount ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {parsed.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="search-outline" size={48} color={colors.placeholder} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  Aucun SMS MoMo trouvé
                </Text>
                <Text style={[styles.emptyHint, { color: colors.placeholder }]}>
                  Vérifiez que vous avez des SMS de MTN MoMo dans votre boîte de réception.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {parsed.map((tx, i) => (
                  <TxRow
                    key={i}
                    tx={tx}
                    selected={selected.has(i)}
                    onToggle={() => toggle(i)}
                    colors={colors}
                    alreadyImported={isRefImported(tx.smsRef ?? '')}
                  />
                ))}
                <View style={{ height: 100 }} />
              </ScrollView>
            )}

            {/* Bouton importer */}
            {selected.size > 0 && (
              <View style={[styles.footer, { borderTopColor: colors.divider, backgroundColor: colors.surface }]}>
                <TouchableOpacity
                  style={[styles.importBtn, { backgroundColor: colors.primary }]}
                  onPress={handleImport}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.importBtnText}>
                    Importer {selected.size} transaction{selected.size > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.marginX, height: 60,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 17, fontWeight: '700' },
  headerSub:    { fontSize: 11, marginTop: 1 },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle:   { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyHint:    { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  loadingText:  { fontSize: 14, marginTop: 12 },
  errorText:    { fontSize: 18, fontWeight: '700' },
  errorMsg:     { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  readBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: BORDER_RADIUS.full, marginTop: 8,
  },
  readBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  controlBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  countText:    { fontSize: 12 },
  selectAllText:{ fontSize: 13, fontWeight: '600' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.marginX, paddingVertical: 14,
    borderBottomWidth: 1, gap: 12,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  txInfo:      { flex: 1, gap: 2 },
  txName:      { fontSize: 14, fontWeight: '600' },
  txDate:      { fontSize: 11 },
  txDuplicate: { fontSize: 10, fontStyle: 'italic' },
  txAmount:    { fontSize: 14, fontWeight: '700', minWidth: 80, textAlign: 'right' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.marginX, borderTopWidth: 1,
  },
  importBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: BORDER_RADIUS.full,
  },
  importBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default MomoImportModal;
