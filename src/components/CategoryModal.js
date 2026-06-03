import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { COLOR_OPTIONS } from '../constants/categories';

// ── Chip de couleur ────────────────────────

const ColorChip = ({ color, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.colorChip, isSelected && styles.colorChipSelected]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.colorSwatch, { backgroundColor: color }]} />
    {isSelected && (
      <Ionicons name="checkmark" size={14} color="#003822" style={StyleSheet.absoluteFill} />
    )}
  </TouchableOpacity>
);

// ── Modal principale ───────────────────────

export const CategoryModal = ({ visible, onClose, onSave, initialValues = null }) => {
  const isEdit = initialValues !== null;

  const [libelle,  setLibelle]  = useState('');
  const [plafond,  setPlafond]  = useState('');
  const [color,    setColor]    = useState(COLOR_OPTIONS[0]);
  const [type,     setType]     = useState('depense');

  // Pré-remplir les champs en mode édition
  useEffect(() => {
    if (visible) {
      setLibelle(initialValues?.libelle  ?? '');
      setPlafond(initialValues?.plafond != null ? String(initialValues.plafond) : '');
      setColor(initialValues?.color  ?? COLOR_OPTIONS[0]);
      setType(initialValues?.type   ?? 'depense');
    }
  }, [visible]);

  const reset = () => {
    setLibelle(''); setPlafond('');
    setColor(COLOR_OPTIONS[0]); setType('depense');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = () => {
    const trimmed = libelle.trim();
    if (!trimmed) return;
    onSave({
      libelle: trimmed,
      plafond: type === 'depense' ? (parseInt(plafond.replace(/\s/g, ''), 10) || 0) : null,
      color,
      type,
    });
    reset();
    onClose();
  };

  const canSave = libelle.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrap}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* En-tête */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
            {/* Type */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>TYPE</Text>
              <View style={styles.toggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, type === 'depense' && styles.toggleBtnDepense]}
                  onPress={() => setType('depense')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleText, type === 'depense' && styles.toggleTextActive]}>
                    Dépense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, type === 'entree' && styles.toggleBtnEntree]}
                  onPress={() => setType('entree')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleText, type === 'entree' && styles.toggleTextActive]}>
                    Revenu
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Nom */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>NOM</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : Électricité"
                  placeholderTextColor="rgba(186, 203, 190, 0.4)"
                  value={libelle}
                  onChangeText={setLibelle}
                  maxLength={30}
                  autoFocus={!isEdit}
                />
              </View>
            </View>

            {/* Plafond — dépenses uniquement */}
            {type === 'depense' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PLAFOND MENSUEL (FCFA)</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex : 25 000"
                    placeholderTextColor="rgba(186, 203, 190, 0.4)"
                    value={plafond}
                    onChangeText={setPlafond}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.hint}>
                  Déclenche l'alerte budget quand ce seuil est atteint.
                </Text>
              </View>
            )}

            {/* Couleur */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>COULEUR</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((c) => (
                  <ColorChip
                    key={c}
                    color={c}
                    isSelected={color === c}
                    onPress={() => setColor(c)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Bouton */}
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={canSave ? COLORS.background : COLORS.textSecondary}
            />
            <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
              {isEdit ? 'Enregistrer les modifications' : 'Créer la catégorie'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#0F1E35',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '92%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX,
    paddingVertical: SPACING.stackMd,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.stackMd,
    paddingBottom: SPACING.stackMd,
    gap: SPACING.stackLg,
  },

  // ── Champs ─────────────────────────────────
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: 11,
    color: 'rgba(186,203,190,0.5)',
  },
  inputWrap: {
    height: 52,
    backgroundColor: '#191f2f',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.stackMd,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  input: {
    fontSize: 15,
    color: COLORS.textPrimary,
    padding: 0,
  },

  // ── Toggle ─────────────────────────────────
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#191f2f',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  toggleBtnDepense: { backgroundColor: COLORS.primary },
  toggleBtnEntree:  { backgroundColor: '#00d68f' },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: { color: '#003822', fontWeight: '700' },

  // ── Chips couleur ───────────────────────────
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#191f2f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  colorChipSelected: {
    borderColor: COLORS.textPrimary,
  },
  colorSwatch: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  // ── Bouton ─────────────────────────────────
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    marginHorizontal: SPACING.marginX,
    marginTop: SPACING.stackMd,
    backgroundColor: '#00d68f',
    borderRadius: 12,
    shadowColor: '#00d68f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#191f2f',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#003822',
  },
  saveBtnTextDisabled: { color: COLORS.textSecondary },
});

export default CategoryModal;
