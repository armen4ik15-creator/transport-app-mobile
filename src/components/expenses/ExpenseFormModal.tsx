import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ExpenseDatePicker } from '../ExpenseDatePicker';
import { ALL_EXPENSE_TYPES } from '../../constants/expenseTypes';
import { screenUi } from '../../styles/screenUi';
import { colors } from '../../theme';
import { todayIso } from '../../utils/datePeriods';
import type { ExpenseMethod, ExpenseRecord } from '../../types';

export interface VehicleOption {
  carNumber: string;
  driverName: string;
}

interface ExpenseFormModalProps {
  visible: boolean;
  editingRecord: ExpenseRecord | null;
  vehicles: VehicleOption[];
  isAdmin: boolean;
  defaultDriverId: number;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: {
    exp_date: string;
    exp_type: string;
    method: ExpenseMethod;
    amount: number;
    comment?: string;
    car_number?: string;
    driver_id?: number;
  }) => Promise<void>;
}

interface FormState {
  exp_date: string;
  exp_type: string;
  method: ExpenseMethod | '';
  amount: string;
  car_number: string;
  comment: string;
}

const EMPTY_FORM: FormState = {
  exp_date: todayIso(),
  exp_type: '',
  method: '',
  amount: '',
  car_number: '',
  comment: '',
};

export function ExpenseFormModal({
  visible,
  editingRecord,
  vehicles,
  isAdmin,
  defaultDriverId,
  saving,
  onClose,
  onSave,
}: ExpenseFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [invoiceUri, setInvoiceUri] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (editingRecord) {
      setForm({
        exp_date: editingRecord.exp_date,
        exp_type: editingRecord.exp_type,
        method: editingRecord.method ?? '',
        amount: String(editingRecord.amount),
        car_number: editingRecord.car_number ?? '',
        comment: editingRecord.comment ?? '',
      });
    } else {
      setForm({ ...EMPTY_FORM, exp_date: todayIso() });
    }
    setInvoiceUri(null);
  }, [visible, editingRecord]);

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setInvoiceUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Нет доступа', 'Разрешите доступ к камере');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setInvoiceUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!form.exp_type) {
      Alert.alert('Ошибка', 'Выберите тип расхода');
      return;
    }
    if (form.method !== 'cash' && form.method !== 'noncash') {
      Alert.alert('Ошибка', 'Выберите способ оплаты');
      return;
    }
    const amount = Number(form.amount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.exp_date)) {
      Alert.alert('Ошибка', 'Дата должна быть в формате ГГГГ-ММ-ДД');
      return;
    }

    const commentParts = [form.comment.trim()];
    if (invoiceUri) commentParts.push('[фото счёта]');

    await onSave({
      exp_date: form.exp_date,
      exp_type: form.exp_type,
      method: form.method,
      amount,
      comment: commentParts.filter(Boolean).join(' ') || undefined,
      car_number: form.car_number.trim() || undefined,
      driver_id: isAdmin ? undefined : defaultDriverId,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={screenUi.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={screenUi.modalSheet}>
          <Text style={screenUi.modalTitle}>
            {editingRecord ? 'Редактировать расход' : 'Новый расход'}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={screenUi.fieldLabel}>Счёт на оплату (необязательно)</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              <Pressable
                onPress={pickFromGallery}
                style={[screenUi.secondaryBtn, { flex: 1, marginBottom: 0 }]}
              >
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>
                  📁 Галерея
                </Text>
              </Pressable>
              <Pressable
                onPress={takePhoto}
                style={[screenUi.secondaryBtn, { flex: 1, marginBottom: 0 }]}
              >
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>
                  📷 Камера
                </Text>
              </Pressable>
            </View>
            {invoiceUri ? (
              <Image
                source={{ uri: invoiceUri }}
                style={{ width: '100%', height: 140, borderRadius: 8, marginBottom: 10 }}
                resizeMode="cover"
              />
            ) : null}

            <ExpenseDatePicker
              value={form.exp_date}
              onChange={(iso) => setForm((prev) => ({ ...prev, exp_date: iso }))}
            />

            <Text style={screenUi.fieldLabel}>Тип расхода *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              {ALL_EXPENSE_TYPES.map(({ value, label, icon }) => {
                const active = form.exp_type === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setForm((prev) => ({ ...prev, exp_type: value }))}
                    style={[
                      screenUi.typeTile,
                      active ? screenUi.typeTileActive : screenUi.typeTileIdle,
                    ]}
                  >
                    <Text style={{ fontSize: 18, marginBottom: 3 }}>{icon}</Text>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 11,
                        color: active ? colors.primary : colors.textMuted,
                        textAlign: 'center',
                        lineHeight: 14,
                        fontWeight: active ? '600' : '400',
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={screenUi.fieldLabel}>Способ оплаты *</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
              {(
                [
                  ['cash', '💵 Наличные'],
                  ['noncash', '💳 Безнал'],
                ] as const
              ).map(([value, label]) => {
                const active = form.method === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setForm((prev) => ({ ...prev, method: value }))}
                    style={[
                      screenUi.actionBtn,
                      {
                        backgroundColor: active ? colors.primary : colors.surfaceElevated,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        paddingVertical: 12,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: active ? colors.text : colors.textMuted,
                        fontWeight: active ? '600' : '400',
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={screenUi.fieldLabel}>Сумма (₽) *</Text>
            <TextInput
              style={screenUi.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.amount}
              onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
              placeholderTextColor={colors.textMuted}
            />

            {isAdmin ? (
              <>
                <Text style={screenUi.fieldLabel}>Машина</Text>
                <Pressable
                  onPress={() => setForm((prev) => ({ ...prev, car_number: '' }))}
                  style={[
                    screenUi.optionTile,
                    form.car_number === '' ? screenUi.optionTileActive : screenUi.optionTileIdle,
                  ]}
                >
                  <Text style={{ color: colors.text }}>Общие (без машины)</Text>
                </Pressable>
                {vehicles.map((vehicle) => {
                  const active = form.car_number === vehicle.carNumber;
                  return (
                    <Pressable
                      key={vehicle.carNumber}
                      onPress={() =>
                        setForm((prev) => ({ ...prev, car_number: vehicle.carNumber }))
                      }
                      style={[
                        screenUi.optionTile,
                        active ? screenUi.optionTileActive : screenUi.optionTileIdle,
                      ]}
                    >
                      <Text style={{ color: colors.text }}>
                        🚗 {vehicle.carNumber} ({vehicle.driverName})
                      </Text>
                    </Pressable>
                  );
                })}
              </>
            ) : null}

            <Text style={screenUi.fieldLabel}>Комментарий</Text>
            <TextInput
              style={[screenUi.input, { height: 72, textAlignVertical: 'top' }]}
              placeholder="Необязательно..."
              multiline
              value={form.comment}
              onChangeText={(value) => setForm((prev) => ({ ...prev, comment: value }))}
              placeholderTextColor={colors.textMuted}
            />
          </ScrollView>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[screenUi.saveBtn, saving && { opacity: 0.6 }]}
          >
            <Text style={screenUi.saveBtnText}>
              {saving ? 'Сохранение…' : editingRecord ? 'Сохранить изменения' : 'Добавить расход'}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={screenUi.cancelBtn}>
            <Text style={screenUi.cancelBtnText}>Отмена</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
