import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { listContractors } from '../../api/contractors';
import { listDrivers } from '../../api/drivers';
import { createOrder } from '../../api/orders';
import { apiErrorMessage } from '../../api/client';
import { screenUi } from '../../styles/screenUi';
import { withFallback } from '../../utils/safeRequest';
import type { Contractor, Driver } from '../../types';
import { colors } from '../../theme';

interface OrderCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface FormState {
  task_name: string;
  driver_id: number | null;
  contractor_id: number | null;
  contractor_name: string;
  material: string;
  load_address: string;
  unload_address: string;
  distance_km: string;
  unit: string;
  total_planned_volume: string;
  company_rate: string;
  driver_rate: string;
  sender: string;
  receiver: string;
}

const EMPTY_FORM: FormState = {
  task_name: '',
  driver_id: null,
  contractor_id: null,
  contractor_name: '',
  material: '',
  load_address: '',
  unload_address: '',
  distance_km: '',
  unit: 'м3',
  total_planned_volume: '',
  company_rate: '',
  driver_rate: '',
  sender: '',
  receiver: '',
};

export function OrderCreateModal({ visible, onClose, onCreated }: OrderCreateModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadReferences = useCallback(async () => {
    setLoadingRefs(true);
    try {
      const [driverData, contractorData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(() => listContractors(), []),
      ]);
      setDrivers(driverData);
      setContractors(contractorData);
    } finally {
      setLoadingRefs(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setForm(EMPTY_FORM);
    void loadReferences();
  }, [visible, loadReferences]);

  const resolveContractorId = (): number | null => {
    if (form.contractor_id) return form.contractor_id;
    const name = form.contractor_name.trim().toLowerCase();
    if (!name) return null;
    const match = contractors.find((item) => item.name.toLowerCase() === name);
    return match?.id ?? null;
  };

  const handleCreate = async () => {
    if (!form.driver_id) {
      Alert.alert('Ошибка', 'Выберите водителя');
      return;
    }
    const contractorId = resolveContractorId();
    if (!contractorId) {
      Alert.alert('Ошибка', 'Выберите или введите существующего заказчика');
      return;
    }
    if (!form.material.trim()) {
      Alert.alert('Ошибка', 'Введите материал');
      return;
    }
    if (!form.load_address.trim() || !form.unload_address.trim()) {
      Alert.alert('Ошибка', 'Укажите адреса погрузки и выгрузки');
      return;
    }
    const distance = Number(form.distance_km.replace(',', '.'));
    const companyRate = Number(form.company_rate.replace(',', '.'));
    const driverRate = Number(form.driver_rate.replace(',', '.'));
    if (!Number.isFinite(distance) || distance <= 0) {
      Alert.alert('Ошибка', 'Введите расстояние');
      return;
    }
    if (!Number.isFinite(companyRate) || companyRate <= 0) {
      Alert.alert('Ошибка', 'Введите ставку компании');
      return;
    }
    if (!Number.isFinite(driverRate) || driverRate <= 0) {
      Alert.alert('Ошибка', 'Введите ставку водителя');
      return;
    }

    const planned = form.total_planned_volume.trim()
      ? Number(form.total_planned_volume.replace(',', '.'))
      : null;

    setSaving(true);
    try {
      await createOrder({
        driver_id: form.driver_id,
        contractor_id: contractorId,
        task_name: form.task_name.trim() || undefined,
        material: form.material.trim(),
        load_address: form.load_address.trim(),
        unload_address: form.unload_address.trim(),
        distance_km: distance,
        unit: form.unit,
        total_planned_volume: Number.isFinite(planned as number) ? planned : null,
        company_rate: companyRate,
        driver_rate: driverRate,
        sender: form.sender.trim() || undefined,
        receiver: form.receiver.trim() || undefined,
        is_active: true,
      });
      onCreated();
      onClose();
      Alert.alert('Готово', 'Задача создана');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать задачу'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={screenUi.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={screenUi.modalSheet}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <Text style={screenUi.modalTitle}>Новая задача</Text>

          <TextInput
            style={screenUi.input}
            placeholder="Название задачи (необязательно)"
            value={form.task_name}
            onChangeText={(value) => setForm((prev) => ({ ...prev, task_name: value }))}
            placeholderTextColor="#9ca3af"
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
            }}
          >
            <Text style={screenUi.fieldLabel}>Водитель *</Text>
            <Pressable onPress={() => void loadReferences()}>
              <Text style={{ color: colors.primary, fontSize: 13 }}>
                {loadingRefs ? 'Загрузка…' : 'Обновить'}
              </Text>
            </Pressable>
          </View>
          {drivers.length === 0 ? (
            <Text style={{ color: colors.textMuted, fontStyle: 'italic', marginBottom: 12 }}>
              Список водителей пуст. Нажмите «Обновить» или дождитесь загрузки.
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {drivers.map((driver) => {
                const active = form.driver_id === driver.id;
                return (
                  <Pressable
                    key={driver.id}
                    onPress={() => setForm((prev) => ({ ...prev, driver_id: driver.id }))}
                    style={{
                      backgroundColor: active ? colors.primary : colors.surfaceElevated,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ color: active ? '#ffffff' : colors.text, fontSize: 14 }}>
                      {driver.full_name ?? driver.email}
                      {driver.car_number ? ` (${driver.car_number})` : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={screenUi.fieldLabel}>Заказчик *</Text>
          {contractors.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {contractors.map((contractor) => {
                const active = form.contractor_id === contractor.id;
                return (
                  <Pressable
                    key={contractor.id}
                    onPress={() =>
                      setForm((prev) => ({
                        ...prev,
                        contractor_id: contractor.id,
                        contractor_name: contractor.name,
                      }))
                    }
                    style={{
                      backgroundColor: active ? colors.primary : colors.surfaceElevated,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ color: active ? '#ffffff' : colors.text, fontSize: 14 }}>
                      {contractor.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <TextInput
            style={screenUi.input}
            placeholder="Введите название заказчика *"
            value={form.contractor_name}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, contractor_name: value, contractor_id: null }))
            }
            placeholderTextColor="#9ca3af"
          />

          <Text style={screenUi.fieldLabel}>Материал *</Text>
          <TextInput
            style={screenUi.input}
            placeholder="Материал *"
            value={form.material}
            onChangeText={(value) => setForm((prev) => ({ ...prev, material: value }))}
            placeholderTextColor="#9ca3af"
          />

          <Text style={screenUi.fieldLabel}>Адрес погрузки *</Text>
          <TextInput
            style={screenUi.input}
            placeholder="Адрес погрузки *"
            value={form.load_address}
            onChangeText={(value) => setForm((prev) => ({ ...prev, load_address: value }))}
            placeholderTextColor="#9ca3af"
          />

          <Text style={screenUi.fieldLabel}>Адрес выгрузки *</Text>
          <TextInput
            style={screenUi.input}
            placeholder="Адрес выгрузки *"
            value={form.unload_address}
            onChangeText={(value) => setForm((prev) => ({ ...prev, unload_address: value }))}
            placeholderTextColor="#9ca3af"
          />

          <Text style={screenUi.fieldLabel}>Расстояние (км) *</Text>
          <TextInput
            style={screenUi.input}
            placeholder="Расстояние (км) *"
            keyboardType="decimal-pad"
            value={form.distance_km}
            onChangeText={(value) => setForm((prev) => ({ ...prev, distance_km: value }))}
            placeholderTextColor="#9ca3af"
          />

          <Text style={screenUi.fieldLabel}>Ед. изм.</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {(['м3', 'т'] as const).map((unit) => {
              const active = form.unit === unit;
              return (
                <Pressable
                  key={unit}
                  onPress={() => setForm((prev) => ({ ...prev, unit }))}
                  style={{
                    flex: 1,
                    backgroundColor: active ? colors.primary : colors.surfaceElevated,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: active ? '#ffffff' : colors.text, fontWeight: '600' }}>
                    {unit}
                  </Text>
                </Pressable>
              );
            })}
            <TextInput
              style={[screenUi.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Плановый объём"
              keyboardType="decimal-pad"
              value={form.total_planned_volume}
              onChangeText={(value) =>
                setForm((prev) => ({ ...prev, total_planned_volume: value }))
              }
              placeholderTextColor="#9ca3af"
            />
          </View>

          <Text style={screenUi.fieldLabel}>Ставка компании (руб/ед) *</Text>
          <TextInput
            style={screenUi.input}
            placeholder="Ставка компании (руб/ед) *"
            keyboardType="decimal-pad"
            value={form.company_rate}
            onChangeText={(value) => setForm((prev) => ({ ...prev, company_rate: value }))}
            placeholderTextColor="#9ca3af"
          />

          <Text style={screenUi.fieldLabel}>Ставка водителя (руб/рейс) *</Text>
          <TextInput
            style={screenUi.input}
            placeholder="Ставка водителя (руб/рейс) *"
            keyboardType="decimal-pad"
            value={form.driver_rate}
            onChangeText={(value) => setForm((prev) => ({ ...prev, driver_rate: value }))}
            placeholderTextColor="#9ca3af"
          />

          <Text style={screenUi.fieldLabel}>Отправитель (необязательно)</Text>
          <TextInput
            style={screenUi.input}
            placeholder="Отправитель (необязательно)"
            value={form.sender}
            onChangeText={(value) => setForm((prev) => ({ ...prev, sender: value }))}
            placeholderTextColor="#9ca3af"
          />

          <Text style={screenUi.fieldLabel}>Получатель (необязательно)</Text>
          <TextInput
            style={screenUi.input}
            placeholder="Получатель (необязательно)"
            value={form.receiver}
            onChangeText={(value) => setForm((prev) => ({ ...prev, receiver: value }))}
            placeholderTextColor="#9ca3af"
          />

          <Pressable
            onPress={handleCreate}
            disabled={saving}
            style={[screenUi.saveBtn, saving && { opacity: 0.6 }]}
          >
            <Text style={screenUi.saveBtnText}>
              {saving ? 'Создание…' : 'Создать задачу'}
            </Text>
          </Pressable>
          <Pressable onPress={onClose} style={screenUi.cancelBtn}>
            <Text style={screenUi.cancelBtnText}>Отмена</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
