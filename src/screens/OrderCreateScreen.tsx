import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton, PrimaryButton } from '../components/ui';
import { listDrivers } from '../api/drivers';
import { listContractors } from '../api/contractors';
import { createOrder, createOrdersBulk } from '../api/orders';
import { createOrderTemplate, listOrderTemplates } from '../api/orderTemplates';
import { apiErrorMessage } from '../api/client';
import { listMaterials } from '../api/materials';
import { screenUi } from '../styles/screenUi';
import { withFallback } from '../utils/safeRequest';
import type { Contractor, Driver, Material, OrderTemplate } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderCreate'>;

export function OrderCreateScreen({ navigation, route }: Props) {
  const templateId = route.params?.templateId;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(templateId ?? null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [createForAllDrivers, setCreateForAllDrivers] = useState(false);
  const [contractorId, setContractorId] = useState<number | null>(null);
  const [taskName, setTaskName] = useState('');
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [plannedVolume, setPlannedVolume] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loadAddress, setLoadAddress] = useState('');
  const [unloadAddress, setUnloadAddress] = useState('');
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('м3');
  const [driverRate, setDriverRate] = useState('');
  const [companyRate, setCompanyRate] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ds, cs, ts, ms] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(() => listContractors(), []),
        withFallback(() => listOrderTemplates(), []),
        withFallback(() => listMaterials(), []),
      ]);
      setDrivers(ds);
      setContractors(cs);
      setTemplates(ts);
      setMaterials(ms);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!templateId || templates.length === 0) return;
    const tpl = templates.find((item) => item.id === templateId);
    if (!tpl) return;
    setSelectedTemplateId(tpl.id);
    if (tpl.contractor_id) setContractorId(tpl.contractor_id);
    setMaterial(tpl.material ?? '');
    setUnit(tpl.unit ?? 'м3');
    setQuantity(tpl.default_quantity != null ? String(tpl.default_quantity) : '');
    setDriverRate(tpl.driver_rate != null ? String(tpl.driver_rate) : '');
    setCompanyRate(tpl.company_rate != null ? String(tpl.company_rate) : '');
    setDistanceKm(tpl.distance_km != null ? String(tpl.distance_km) : '');
    setNotes(tpl.notes ?? '');
    setDescription(tpl.description ?? '');
    setLoadAddress(tpl.load_address ?? '');
    setUnloadAddress(tpl.unload_address ?? '');
  }, [templateId, templates]);

  const onSubmit = async () => {
    if (!driverId || !contractorId) {
      if (!createForAllDrivers) {
        Alert.alert('Заполните', 'Выберите водителя и контрагента');
        return;
      }
    }
    if (!contractorId) {
      Alert.alert('Заполните', 'Выберите контрагента');
      return;
    }
    setSaving(true);
    try {
      const qty = quantity.trim() ? Number(quantity.replace(',', '.')) : null;
      const parsedDriverRate = driverRate.trim() ? Number(driverRate.replace(',', '.')) : null;
      const parsedCompanyRate = companyRate.trim() ? Number(companyRate.replace(',', '.')) : null;
      const parsedDistance = distanceKm.trim() ? Number(distanceKm.replace(',', '.')) : null;
      const parsedPlanned = plannedVolume.trim() ? Number(plannedVolume.replace(',', '.')) : null;
      const payload = {
        contractor_id: contractorId,
        task_name: taskName.trim() || undefined,
        sender: sender.trim() || undefined,
        receiver: receiver.trim() || undefined,
        total_planned_volume: Number.isFinite(parsedPlanned as number) ? parsedPlanned : null,
        material: material.trim() || undefined,
        quantity: Number.isFinite(qty as number) ? qty : null,
        unit: unit.trim() || undefined,
        driver_rate: Number.isFinite(parsedDriverRate as number) ? parsedDriverRate : null,
        company_rate: Number.isFinite(parsedCompanyRate as number) ? parsedCompanyRate : null,
        distance_km: Number.isFinite(parsedDistance as number) ? parsedDistance : null,
        notes: notes.trim() || undefined,
        description: description.trim() || undefined,
        load_address: loadAddress.trim() || undefined,
        unload_address: unloadAddress.trim() || undefined,
      };
      if (createForAllDrivers) {
        await createOrdersBulk({ ...payload, driver_ids: drivers.map((item) => item.id) });
      } else {
        await createOrder({ ...payload, driver_id: driverId as number });
      }
      if (saveAsTemplate && templateName.trim()) {
        await createOrderTemplate({
          name: templateName.trim(),
          contractor_id: contractorId,
          material: material.trim() || undefined,
          unit: unit.trim() || undefined,
          default_quantity: Number.isFinite(qty as number) ? qty : null,
          driver_rate: Number.isFinite(parsedDriverRate as number) ? parsedDriverRate : null,
          company_rate: Number.isFinite(parsedCompanyRate as number) ? parsedCompanyRate : null,
          distance_km: Number.isFinite(parsedDistance as number) ? parsedDistance : null,
          notes: notes.trim() || undefined,
          description: description.trim() || undefined,
          load_address: loadAddress.trim() || undefined,
          unload_address: unloadAddress.trim() || undefined,
        });
      }
      Alert.alert('Готово', createForAllDrivers ? 'Задачи созданы для всех водителей' : 'Заказ создан', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen label="Загрузка формы…" />;

  return (
    <View style={screenUi.container}>
      <ScrollView contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="➕ Новый заказ" />
        <ErrorText message={error} />

        <View style={screenUi.card}>
          <Text style={screenUi.fieldLabel}>📋 Шаблон заказа</Text>
          <MenuButton
            label={selectedTemplateId ? 'Сбросить шаблон' : 'Без шаблона'}
            onPress={() => {
              setSelectedTemplateId(null);
              setMaterial('');
              setUnit('м3');
              setQuantity('');
              setDriverRate('');
              setCompanyRate('');
              setDistanceKm('');
              setNotes('');
              setDescription('');
              setLoadAddress('');
              setUnloadAddress('');
            }}
            variant="secondary"
          />
          {templates.map((tpl) => (
            <MenuButton
              key={tpl.id}
              label={`${selectedTemplateId === tpl.id ? '✅ ' : ''}${tpl.name}`}
              onPress={() => {
                setSelectedTemplateId(tpl.id);
                if (tpl.contractor_id) setContractorId(tpl.contractor_id);
                setMaterial(tpl.material ?? '');
                setUnit(tpl.unit ?? 'м3');
                setQuantity(tpl.default_quantity != null ? String(tpl.default_quantity) : '');
                setDriverRate(tpl.driver_rate != null ? String(tpl.driver_rate) : '');
                setCompanyRate(tpl.company_rate != null ? String(tpl.company_rate) : '');
                setDistanceKm(tpl.distance_km != null ? String(tpl.distance_km) : '');
                setNotes(tpl.notes ?? '');
                setDescription(tpl.description ?? '');
                setLoadAddress(tpl.load_address ?? '');
                setUnloadAddress(tpl.unload_address ?? '');
              }}
              variant={selectedTemplateId === tpl.id ? 'default' : 'secondary'}
            />
          ))}
        </View>

        <View style={screenUi.card}>
          <Text style={screenUi.fieldLabel}>👤 Водитель</Text>
          <MenuButton
            label={createForAllDrivers ? '✅ Назначить всем водителям' : 'Назначить всем водителям'}
            onPress={() => setCreateForAllDrivers((prev) => !prev)}
            variant={createForAllDrivers ? 'default' : 'secondary'}
          />
          {drivers.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#6b7280' }}>Нет водителей — создайте в разделе «Водители»</Text>
          ) : (
            drivers.map((d) => (
              <MenuButton
                key={d.id}
                label={`${driverId === d.id ? '✅ ' : ''}${d.full_name} (${d.car_number || 'без номера'})`}
                onPress={() => {
                  setCreateForAllDrivers(false);
                  setDriverId(d.id);
                }}
                variant={driverId === d.id ? 'default' : 'secondary'}
              />
            ))
          )}
        </View>

        <View style={screenUi.card}>
          <Text style={screenUi.fieldLabel}>🏢 Контрагент</Text>
          {contractors.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#6b7280' }}>Нет контрагентов — создайте в разделе «Контрагенты»</Text>
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
        </View>

        <Field label="Описание" value={description} onChangeText={setDescription} />
        <Field label="Название задачи" value={taskName} onChangeText={setTaskName} />
        <Field label="Отправитель" value={sender} onChangeText={setSender} />
        <Field label="Получатель" value={receiver} onChangeText={setReceiver} />
        <Field label="📍 Адрес погрузки" value={loadAddress} onChangeText={setLoadAddress} />
        <Field label="📍 Адрес разгрузки" value={unloadAddress} onChangeText={setUnloadAddress} />
        <Field label="🧱 Материал" value={material} onChangeText={setMaterial} />

        <View style={screenUi.card}>
          <Text style={screenUi.fieldLabel}>Справочник материалов</Text>
          {materials.slice(0, 10).map((m) => (
            <MenuButton
              key={m.id}
              label={`${material === m.name ? '✅ ' : ''}${m.name}`}
              onPress={() => {
                setMaterial(m.name);
                setUnit(m.unit);
              }}
              variant={material === m.name ? 'default' : 'secondary'}
            />
          ))}
        </View>

        <Field label="Количество (м3/т)" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
        <Field label="Плановый объём" value={plannedVolume} onChangeText={setPlannedVolume} keyboardType="decimal-pad" />
        <Field label="Ед. измерения" value={unit} onChangeText={setUnit} placeholder="м3 / т / рейс" />
        <Field label="Ставка водителя за единицу" value={driverRate} onChangeText={setDriverRate} keyboardType="decimal-pad" />
        <Field label="Ставка компании за единицу" value={companyRate} onChangeText={setCompanyRate} keyboardType="decimal-pad" />
        <Field label="Плечо, км" value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad" />
        <Field label="Примечание" value={notes} onChangeText={setNotes} />

        <View style={screenUi.card}>
          <MenuButton
            label={saveAsTemplate ? '✅ Сохранить как новый шаблон' : 'Сохранить как новый шаблон'}
            onPress={() => setSaveAsTemplate((prev) => !prev)}
            variant={saveAsTemplate ? 'default' : 'secondary'}
          />
          {saveAsTemplate ? (
            <Field label="Название шаблона" value={templateName} onChangeText={setTemplateName} placeholder="Например: Песок - город" />
          ) : null}
        </View>

        <PrimaryButton label="✅ Создать заказ" onPress={onSubmit} loading={saving} />
      </ScrollView>
    </View>
  );
}
