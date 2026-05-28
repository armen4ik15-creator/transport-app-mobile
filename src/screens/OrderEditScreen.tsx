import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card, Field, LoadingScreen, MenuButton, PrimaryButton, Subtitle, Title } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listContractors } from '../api/contractors';
import { listDrivers } from '../api/drivers';
import { getOrder, updateOrder } from '../api/orders';
import { withFallback } from '../utils/safeRequest';
import type { Contractor, Driver } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderEdit'>;

export function OrderEditScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [driverId, setDriverId] = useState<number | null>(null);
  const [contractorId, setContractorId] = useState<number | null>(null);
  const [taskName, setTaskName] = useState('');
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [plannedVolume, setPlannedVolume] = useState('');
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [driverRate, setDriverRate] = useState('');
  const [companyRate, setCompanyRate] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loadAddress, setLoadAddress] = useState('');
  const [unloadAddress, setUnloadAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    try {
      const [order, driversData, contractorsData] = await Promise.all([
        getOrder(id),
        withFallback(() => listDrivers(), []),
        withFallback(() => listContractors(), []),
      ]);
    setDrivers(driversData);
    setContractors(contractorsData);
    setDriverId(order.driver_id ?? null);
    setContractorId(order.contractor_id ?? null);
    setTaskName(order.task_name ?? '');
    setSender(order.sender ?? '');
    setReceiver(order.receiver ?? '');
    setPlannedVolume(order.total_planned_volume != null ? String(order.total_planned_volume) : '');
    setMaterial(order.material ?? '');
    setQuantity(order.quantity != null ? String(order.quantity) : '');
    setUnit(order.unit ?? '');
    setDriverRate(order.driver_rate != null ? String(order.driver_rate) : '');
    setCompanyRate(order.company_rate != null ? String(order.company_rate) : '');
    setDistanceKm(order.distance_km != null ? String(order.distance_km) : '');
    setDescription(order.description ?? '');
    setNotes(order.notes ?? '');
    setLoadAddress(order.load_address ?? '');
    setUnloadAddress(order.unload_address ?? '');
    setAmount(order.amount != null ? String(order.amount) : '');
    setIsActive(Boolean(order.is_active));
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось загрузить заказ'));
    }
  }, [id]);

  useEffect(() => {
    load()
      .catch((e) => Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось загрузить заказ')))
      .finally(() => setLoading(false));
  }, [load]);

  const onSave = async () => {
    if (!driverId || !contractorId) {
      Alert.alert('Ошибка', 'Выберите водителя и контрагента');
      return;
    }
    setSaving(true);
    try {
      await updateOrder(id, {
        driver_id: driverId,
        contractor_id: contractorId,
        task_name: taskName.trim() || undefined,
        sender: sender.trim() || undefined,
        receiver: receiver.trim() || undefined,
        total_planned_volume: plannedVolume.trim() ? Number(plannedVolume.replace(',', '.')) : null,
        material: material.trim() || undefined,
        quantity: quantity.trim() ? Number(quantity.replace(',', '.')) : null,
        unit: unit.trim() || undefined,
        driver_rate: driverRate.trim() ? Number(driverRate.replace(',', '.')) : null,
        company_rate: companyRate.trim() ? Number(companyRate.replace(',', '.')) : null,
        distance_km: distanceKm.trim() ? Number(distanceKm.replace(',', '.')) : null,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        load_address: loadAddress.trim() || undefined,
        unload_address: unloadAddress.trim() || undefined,
        amount: amount.trim() ? Number(amount.replace(',', '.')) : null,
        is_active: isActive,
      });
      Alert.alert('Готово', 'Заказ обновлён', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось обновить заказ'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f4f6f8' }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Title>Редактирование заказа #{id}</Title>
      <Subtitle>Поля заказа, статусы активности и ставки</Subtitle>

      <Card>
        <Subtitle>Водитель</Subtitle>
        {drivers.map((d) => (
          <MenuButton
            key={d.id}
            label={`${driverId === d.id ? '✅ ' : ''}${d.full_name ?? d.email}`}
            onPress={() => setDriverId(d.id)}
            variant={driverId === d.id ? 'default' : 'secondary'}
          />
        ))}
      </Card>

      <Card>
        <Subtitle>Контрагент</Subtitle>
        {contractors.map((c) => (
          <MenuButton
            key={c.id}
            label={`${contractorId === c.id ? '✅ ' : ''}${c.name}`}
            onPress={() => setContractorId(c.id)}
            variant={contractorId === c.id ? 'default' : 'secondary'}
          />
        ))}
      </Card>

      <Field label="Название задачи" value={taskName} onChangeText={setTaskName} />
      <Field label="Отправитель" value={sender} onChangeText={setSender} />
      <Field label="Получатель" value={receiver} onChangeText={setReceiver} />
      <Field label="Плановый объём" value={plannedVolume} onChangeText={setPlannedVolume} keyboardType="decimal-pad" />
      <Field label="Материал" value={material} onChangeText={setMaterial} />
      <Field label="Количество" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
      <Field label="Ед. измерения" value={unit} onChangeText={setUnit} />
      <Field label="Ставка водителя" value={driverRate} onChangeText={setDriverRate} keyboardType="decimal-pad" />
      <Field label="Ставка компании" value={companyRate} onChangeText={setCompanyRate} keyboardType="decimal-pad" />
      <Field label="Плечо, км" value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad" />
      <Field label="Описание" value={description} onChangeText={setDescription} />
      <Field label="Примечание" value={notes} onChangeText={setNotes} />
      <Field label="Погрузка" value={loadAddress} onChangeText={setLoadAddress} />
      <Field label="Разгрузка" value={unloadAddress} onChangeText={setUnloadAddress} />
      <Field label="Сумма заказа" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

      <Card>
        <Subtitle>Активность задачи</Subtitle>
        <MenuButton
          label={isActive ? '✅ Активный заказ' : 'Активный заказ'}
          onPress={() => setIsActive(true)}
          variant={isActive ? 'default' : 'secondary'}
        />
        <MenuButton
          label={!isActive ? '✅ В архиве (неактивен)' : 'В архиве (неактивен)'}
          onPress={() => setIsActive(false)}
          variant={!isActive ? 'default' : 'secondary'}
        />
      </Card>

      <PrimaryButton label="Сохранить изменения" onPress={onSave} loading={saving} />
      <MenuButton label="← Назад" onPress={() => navigation.goBack()} variant="secondary" />
    </ScrollView>
  );
}
