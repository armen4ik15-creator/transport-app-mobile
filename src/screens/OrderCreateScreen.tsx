import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Card,
  ErrorText,
  Field,
  LoadingScreen,
  MenuButton,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../components/ui';
import { listDrivers } from '../api/drivers';
import { listContractors } from '../api/contractors';
import { createOrder } from '../api/orders';
import { apiErrorMessage } from '../api/client';
import type { Contractor, Driver } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderCreate'>;

export function OrderCreateScreen({ navigation }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [contractorId, setContractorId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loadAddress, setLoadAddress] = useState('');
  const [unloadAddress, setUnloadAddress] = useState('');
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ds, cs] = await Promise.all([listDrivers(), listContractors()]);
      setDrivers(ds);
      setContractors(cs);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async () => {
    if (!driverId || !contractorId) {
      Alert.alert('Заполните', 'Выберите водителя и контрагента');
      return;
    }
    setSaving(true);
    try {
      const qty = quantity.trim() ? Number(quantity.replace(',', '.')) : null;
      await createOrder({
        driver_id: driverId,
        contractor_id: contractorId,
        material: material.trim() || undefined,
        quantity: Number.isFinite(qty as number) ? qty : null,
        notes: notes.trim() || undefined,
        description: description.trim() || undefined,
        load_address: loadAddress.trim() || undefined,
        unload_address: unloadAddress.trim() || undefined,
      });
      Alert.alert('Готово', 'Заказ создан', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f4f6f8' }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Title>Новый заказ</Title>
      <ErrorText message={error} />

      <Subtitle>Водитель</Subtitle>
      <Card>
        {drivers.length === 0 ? (
          <Subtitle>Нет водителей — создайте в разделе «Водители»</Subtitle>
        ) : (
          drivers.map((d) => (
            <MenuButton
              key={d.id}
              label={`${driverId === d.id ? '✅ ' : ''}${d.full_name} (${d.car_number || 'без номера'})`}
              onPress={() => setDriverId(d.id)}
              variant={driverId === d.id ? 'default' : 'secondary'}
            />
          ))
        )}
      </Card>

      <Subtitle>Контрагент</Subtitle>
      <Card>
        {contractors.length === 0 ? (
          <Subtitle>Нет контрагентов — создайте в разделе «Контрагенты»</Subtitle>
        ) : (
          contractors.map((c) => (
            <MenuButton
              key={c.id}
              label={`${contractorId === c.id ? '✅ ' : ''}${c.name}`}
              onPress={() => setContractorId(c.id)}
              variant={contractorId === c.id ? 'default' : 'secondary'}
            />
          ))
        )}
      </Card>

      <Field label="Описание" value={description} onChangeText={setDescription} />
      <Field label="Адрес погрузки" value={loadAddress} onChangeText={setLoadAddress} />
      <Field label="Адрес разгрузки" value={unloadAddress} onChangeText={setUnloadAddress} />
      <Field label="Материал" value={material} onChangeText={setMaterial} />
      <Field label="Количество (м3/т)" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
      <Field label="Примечание" value={notes} onChangeText={setNotes} />

      <PrimaryButton label="Создать заказ" onPress={onSubmit} loading={saving} />
      <MenuButton label="← Назад" onPress={() => navigation.goBack()} variant="secondary" />
    </ScrollView>
  );
}
