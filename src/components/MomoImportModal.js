import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionsContext';
import { useAccounts } from '../context/AccountContext';
import { useCategories } from '../context/CategoriesContext';
import { requestSmsPermission, readMobileMoneyTransactions } from '../services/MomoSmsService';
import { SPACING, BORDER_RADIUS } from '../constants/theme';

// ── Badge opérateur ───────────────────────────────────────────────────────────

const OPERATOR_COLORS = {
  // Mobile Money
  mtn:      '#FFCC00',
  moov:     '#0070B8',
  celtiis:  '#E30613',
  // Banques — couleur verte foncée commune pour les distinguer du MoMo
  ecobank:  '#006633',
  boa:      '#003087',
  uba:      '#CC0000',
  nsia:     '#004B87',
  orabank:  '#FF6600',
  atlantic: '#003366',
  bsic:     '#006DB7',
  coris:    '#8B0000',
  gtbank:   '#FF6600',
  access:   '#E87722',
  bhbf:     '#1A5276',
  brs:      '#27AE60',
  bgd:      '#2E86C1',
  cbi:      '#6C3483',
  batl:     '#17202A',
};

const OPERATOR_ABBR = {
  // Mobile Money
  mtn:      'MTN',
  moov:     'MOV',
  celtiis:  'CEL',
  // Banques
  ecobank:  'ECO',
  boa:      'BOA',
  uba:      'UBA',
  nsia:     'NSI',
  orabank:  'ORA',
  atlantic: 'ATL',
  bsic:     'BSI',
  coris:    'COR',
  gtbank:   'GTB',
  access:   'ACC',
  bhbf:     'BHB',
  brs:      'BRS',
  bgd:      'BGD',
  cbi:      'CBI',
  batl:     'BAT',
};

// ── Ligne de transaction parsée ───────────────────────────────────────────────

const TxRow = ({ tx, selected, onToggle, colors, alreadyImported }) => {
  const isCredit  = tx.type === 'entrée';
  const dateStr   = tx.date instanceof Date
    ? tx.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '—';
  const opColor   = OPERATOR_COLORS[tx.operator] ?? colors.primary;
  const opAbbr    = OPERATOR_ABBR[tx.operator]   ?? '??';

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
      {/* Badge opérateur */}
      <View style={[styles.opBadge, { backgroundColor: opColor }]}>
        <Text style={styles.opBadgeText}>{opAbbr}</Text>
      </View>

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

// ── Helpers ───────────────────────────────────────────────────────────────────

// Cherche le meilleur compte existant pour un opérateur/source donné
const findMatchingAccount = (accounts, source, operator) => {
  const srcLow = (source || '').toLowerCase();
  const opLow  = (operator || '').toLowerCase();
  // Mots-clés extraits (ex: "BOA Bénin" → ["boa", "bénin"])
  const srcWords = srcLow.split(/\s+/).filter(w => w.length > 2);
  return accounts.find(a => {
    const nameLow = a.name.toLowerCase();
    return (
      nameLow.includes(srcLow) ||
      srcLow.includes(nameLow) ||
      nameLow.includes(opLow) ||
      srcWords.some(w => nameLow.includes(w))
    );
  }) ?? null;
};

// Mappe la catégorie SMS → catégorie backend
const findCategory = (tx, categories) => {
  const name = (tx.name || '').toLowerCase();
  if (tx.type === 'entrée') {
    return categories.find(c => /transfert|virement/i.test(c.libelle))
        ?? categories.find(c => /salaire|revenu/i.test(c.libelle))
        ?? categories[0];
  }
  if (/retrait/i.test(name)) {
    return categories.find(c => /espèce|cash/i.test(c.libelle))
        ?? categories.find(c => /transfert/i.test(c.libelle))
        ?? categories[0];
  }
  if (/paiement|achat/i.test(name)) {
    return categories.find(c => /shopping|alimentation/i.test(c.libelle))
        ?? categories[0];
  }
  return categories.find(c => /transfert/i.test(c.libelle)) ?? categories[0];
};

// ── Modal principal ───────────────────────────────────────────────────────────

export const MomoImportModal = ({ visible, onClose }) => {
  const { colors }                                           = useTheme();
  const { addTransaction, markSmsRefImported, isRefImported } = useTransactions();
  const { accounts, addAccount }                             = useAccounts();
  const { categories }                                       = useCategories();

  const [status,   setStatus]   = useState('idle');
  // 'idle' | 'loading' | 'done' | 'importing' | 'error'
  const [parsed,   setParsed]   = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    if (visible) {
      setParsed([]);
      setSelected(new Set());
      setStatus('idle');
      setProgress({ done: 0, total: 0 });
    }
  }, [visible]);

  // ── Lecture SMS ─────────────────────────────────────────────────────────────

  const handleRead = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Non disponible', 'La lecture des SMS est uniquement disponible sur Android.');
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
      // Pré-sélectionner seulement les transactions des 30 derniers jours
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const sel = new Set(
        txs
          .map((tx, i) => ({ tx, i }))
          .filter(({ tx }) =>
            !isRefImported(tx.smsRef ?? '') &&
            tx.date instanceof Date &&
            tx.date.getTime() >= thirtyDaysAgo,
          )
          .map(({ i }) => i),
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

  // ── Sélection ──────────────────────────────────────────────────────────────

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

  // ── Import avec sauvegarde backend ────────────────────────────────────────

  const handleImport = async () => {
    const toImport = [...selected]
      .map((i) => parsed[i])
      .filter((tx) => !isRefImported(tx.smsRef ?? ''));

    if (!toImport.length) { onClose(); return; }

    // Vérifier que des catégories existent
    if (!categories || categories.length === 0) {
      Alert.alert(
        'Catégories manquantes',
        'Aucune catégorie disponible. Créez d\'abord au moins une catégorie dans l\'application.',
      );
      setStatus('done');
      return;
    }

    setStatus('importing');
    setProgress({ done: 0, total: toImport.length });

    // Étape 1 : trouver ou créer les comptes manquants
    const accountCache = {};  // source → compte_id

    const uniqueSources = [...new Set(toImport.map((tx) => tx.source))];
    for (const source of uniqueSources) {
      const existing = findMatchingAccount(
        accounts,
        source,
        toImport.find((t) => t.source === source)?.operator,
      );

      if (existing) {
        accountCache[source] = existing.id;
      } else {
        const sampleTx = toImport.find((t) => t.source === source);
        try {
          const created = await addAccount({
            libelle:       source,
            numero:        null,
            solde_initial: sampleTx?.balance ?? 0,
          });
          accountCache[source] = created?.id ?? null;
          if (!created?.id) {
            console.warn('[MomoImport] addAccount returned no id for source:', source);
          }
        } catch (e) {
          const detail = e?.response?.data?.message ?? e?.message;
          console.warn('[MomoImport] addAccount failed for', source, ':', detail);
          accountCache[source] = null;
        }
      }
    }

    // Étape 2 : importer chaque transaction vers le backend
    let done = 0;
    let errors = 0;
    let lastErrorDetail = '';
    // Catégorie de fallback = première catégorie disponible
    const fallbackCat = categories[0];

    for (const tx of toImport) {
      const compteId = accountCache[tx.source] ?? null;

      // compte_id est requis côté backend
      if (!compteId) {
        errors++;
        if (!lastErrorDetail) lastErrorDetail = `Compte introuvable pour "${tx.source}"`;
        setProgress({ done: done + errors, total: toImport.length });
        continue;
      }

      try {
        const cat = findCategory(tx, categories) ?? fallbackCat;
        // Rejeter les IDs locaux non synchronisés (ex: 'local_1234')
        const catId = cat?.id != null && !String(cat.id).startsWith('local_') ? cat.id : null;
        if (!catId) throw new Error('Catégories non synchronisées avec le serveur. Reconnectez-vous.');
        await addTransaction({
          montant:      tx.montant,
          date:         tx.date,
          description:  tx.name,
          type:         tx.type === 'entrée' ? 'revenu' : 'depense',
          categorie_id: catId,
          compte_id:    compteId,
        });
        markSmsRefImported(tx.smsRef ?? `sms_${tx.date?.getTime()}`);
        done++;
      } catch (e) {
        errors++;
        const detail =
          e?.response?.data?.message ??
          e?.response?.data?.error ??
          (e?.response?.data ? JSON.stringify(e.response.data) : null) ??
          e?.message ??
          'Erreur inconnue';
        console.warn('[MomoImport] addTransaction failed:', detail, '\nPayload:', {
          montant: tx.montant, type: tx.type, compte_id: compteId,
        });
        if (!lastErrorDetail) lastErrorDetail = detail;
      }
      setProgress({ done: done + errors, total: toImport.length });
    }

    const successMsg = done > 0
      ? `${done} transaction${done > 1 ? 's' : ''} ajoutée${done > 1 ? 's' : ''}${errors > 0 ? `\n${errors} échouée${errors > 1 ? 's' : ''}` : ''}.`
      : `Aucune transaction importée.\n\n${lastErrorDetail || 'Vérifiez votre connexion réseau.'}`;

    Alert.alert('Import terminé', successMsg, [{ text: 'OK', onPress: onClose }]);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const importableCount   = parsed.filter((tx) => !isRefImported(tx.smsRef ?? '')).length;
  const alreadyImportedCount = parsed.length - importableCount;

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
              MoMo · Moov · Celtiis · Ecobank · BOA · UBA · NSIA · +
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* ── État : idle ── */}
        {status === 'idle' && (
          <View style={styles.center}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Importer mes transactions SMS
            </Text>
            <Text style={[styles.emptyHint, { color: colors.placeholder }]}>
              FinCoach va lire vos SMS de MTN MoMo, Moov Money, Celtiis Cash et de vos banques (Ecobank, BOA, UBA, NSIA, Orabank, Atlantic, Coris, BSIC…), puis vous proposer d'importer les transactions détectées.
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

        {/* ── État : loading ── */}
        {status === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Analyse des SMS en cours…
            </Text>
          </View>
        )}

        {/* ── État : error ── */}
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

        {/* ── État : importing ── */}
        {status === 'importing' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Import en cours…
            </Text>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {progress.done} / {progress.total} transaction{progress.total > 1 ? 's' : ''}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.placeholder }]}>
              Les comptes manquants sont créés automatiquement.
            </Text>
          </View>
        )}

        {/* ── État : done ── */}
        {status === 'done' && (
          <>
            <View style={[styles.controlBar, { borderBottomColor: colors.divider }]}>
              <View>
                <Text style={[styles.countText, { color: colors.textSecondary }]}>
                  {parsed.length} SMS · {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
                </Text>
                {alreadyImportedCount > 0 && (
                  <Text style={[styles.countHint, { color: colors.placeholder }]}>
                    {alreadyImportedCount} déjà importé{alreadyImportedCount > 1 ? 's' : ''}
                  </Text>
                )}
              </View>
              {importableCount > 0 && (
                <TouchableOpacity onPress={toggleAll} activeOpacity={0.7}>
                  <Text style={[styles.selectAllText, { color: colors.primary }]}>
                    {selected.size === importableCount ? 'Tout désélect.' : 'Tout sélect.'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {parsed.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="search-outline" size={48} color={colors.placeholder} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  Aucun SMS financier trouvé
                </Text>
                <Text style={[styles.emptyHint, { color: colors.placeholder }]}>
                  Vérifiez que vous avez des SMS de MTN MoMo, Moov Money, Celtiis Cash ou de votre banque.
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
  closeBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter:{ flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub:   { fontSize: 11, marginTop: 1 },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle:  { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyHint:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  loadingText: { fontSize: 14, marginTop: 12 },
  errorText:   { fontSize: 18, fontWeight: '700' },
  errorMsg:    { fontSize: 13, textAlign: 'center', lineHeight: 20 },

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
  countText:     { fontSize: 12 },
  countHint:     { fontSize: 10, marginTop: 1 },
  selectAllText: { fontSize: 13, fontWeight: '600' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.marginX, paddingVertical: 14,
    borderBottomWidth: 1, gap: 10,
  },
  opBadge: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  opBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
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
