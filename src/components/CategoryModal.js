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
import { SPACING, BORDER_RADIUS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { COLOR_OPTIONS } from '../constants/categories';

const ColorChip = ({ color, isSelected, onPress }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <TouchableOpacity
      style={[styles.colorChip, isSelected && styles.colorChipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.colorSwatch, { backgroundColor: color }]}>
        {isSelected && (
          <View style={styles.checkWrap}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const CategoryModal = ({ visible, onClose, onSave, initialValues = null }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const isEdit = initialValues !== null;

  const [libelle, setLibelle] = useState('');
  const [plafond, setPlafond] = useState('');
  const [color,   setColor]   = useState(COLOR_OPTIONS[0]);

  useEffect(() => {
    if (visible) {
      setLibelle(initialValues?.libelle ?? '');
      setPlafond(initialValues?.plafond != null ? String(initialValues.plafond) : '');
      setColor(initialValues?.color ?? COLOR_OPTIONS[0]);
    }
  }, [visible, initialValues]);

  const reset = () => {
    setLibelle('');
    setPlafond('');
    setColor(COLOR_OPTIONS[0]);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = () => {
    const trimmed = libelle.trim();
    if (!trimmed) return;
    onSave({
      libelle: trimmed,
      plafond: parseInt(plafond.replace(/\s/g, ''), 10) || null,
      color,
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

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.body}
          >
            {/* Nom */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>NOM</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : Électricité"
                  placeholderTextColor={colors.placeholder}
                  value={libelle}
                  onChangeText={setLibelle}
                  maxLength={30}
                  autoFocus={!isEdit}
                />
              </View>
            </View>

            {/* Plafond mensuel */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>PLAFOND MENSUEL (FCFA)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex : 25 000  (laisser vide = sans limite)"
                  placeholderTextColor={colors.placeholder}
                  value={plafond}
                  onChangeText={setPlafond}
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.hint}>
                Un plafond active l'alerte budget dans l'écran Budget.
              </Text>
            </View>

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

          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={canSave ? colors.onPrimary : colors.textSecondary}
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

const getStyles = (colors) => StyleSheet.create({
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
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '90%',
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.marginX,
    paddingVertical: SPACING.stackMd,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  body: {
    paddingHorizontal: SPACING.marginX,
    paddingTop: SPACING.stackMd,
    paddingBottom: SPACING.stackMd,
    gap: SPACING.stackLg,
  },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    color: colors.textSecondary, textTransform: 'uppercase',
  },
  hint: { fontSize: 11, color: colors.placeholder },
  inputWrap: {
    height: 52, backgroundColor: colors.inputBg,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.stackMd,
    justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  input: { fontSize: 15, color: colors.textPrimary, padding: 0 },

  // ── Chips couleur ───────────────────────────
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorChip: {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: 2, borderColor: 'transparent',
    overflow: 'hidden',
  },
  colorChipSelected: { borderColor: colors.textPrimary },
  colorSwatch: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  checkWrap: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Bouton ─────────────────────────────────
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52,
    marginHorizontal: SPACING.marginX, marginTop: SPACING.stackMd,
    backgroundColor: colors.primaryDark, borderRadius: 12,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  saveBtnDisabled: { backgroundColor: colors.inputBg, shadowOpacity: 0, elevation: 0 },
  saveBtnText:     { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
  saveBtnTextDisabled: { color: colors.textSecondary },
});

export default CategoryModal;
