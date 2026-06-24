import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton, PrimaryButton } from '../components/ui';
import { listDrivers } from '../api/drivers';
import { listContractors } from '../api/contractors';
import { createOrder, createOrdersBulk } from '../api/orders';
import { createOrderTemplate, listOrderTemplates } from '../api/orderTemplates';
import { apiErrorMessage } from '../api/client';
import { listMaterials } from '../api/materials';
import { useAuth } from '../auth/AuthContext';
import { invalidateCache } from '../utils/apiCache';
import { screenUi } from '../styles/screenUi';
import type { Contractor, Driver, Material, OrderTemplate } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderCreate'>;

type ListLoadState = 'loading' | 'ready' | 'error';

function ListStatusMessage({
  state,
  error,
  emptyMessage,
  onRetry,
}: {
  state: ListLoadState;
  error: string | null;
  emptyMessage: string;
  onRetry: () => void;
}) {
  if (state === 'loading') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ fontSize: 13, color: colors.textMuted }}>Загрузка…</Text>
      </View>
    );
  }
  if (state === 'error') {
    return (
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, color: colors.loss }}>
          {error ?? 'Не удалось загрузить данные с сервера'}
        </Text>
        <MenuButton label="🔄 Повторить загрузку" onPress={onRetry} variant="secondary" />
      </View>
    );
  }
  return <Text style={{ fontSize: 13, color: colors.textMuted }}>{emptyMessage}</Text>;
}

export function OrderCreateScreen({ navigation, route }: Props) {
  const templateId = route.params?.templateId;
  const { dataReloadToken } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [driversState, setDriversState] = useState<ListLoadState>('loading');
  const [contractorsState, setContractorsState] = useState<ListLoadState>('loading');
  const [templatesState, setTemplatesState] = useState<ListLoadState>('loading');
  const [materialsState, setMaterialsState] = useState<ListLoadState>('loading');
  const [driversError, setDriversError] = useState<string | null>(null);
  const [contractorsError, setContractorsError] = useState<string | null>(null);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeDrivers = useMemo(
    () => drivers.filter((item) => item.is_active),
    [drivers]
  );

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setInitialLoading(true);
    }
    setDriversState('loading');
    setContractorsState('loading');
    setTemplatesState('loading');
    setMaterialsState('loading');
    setDriversError(null);
    setContractorsError(null);
    setTemplatesError(null);
    setMaterialsError(null);

    const [driversResult, contractorsResult, templatesResult, materialsResult] =
      await Promise.allSettled([
        listDrivers(),
        listContractors(),
        listOrderTemplates(),
        listMaterials(),
      ]);

    if (driversResult.status === 'fulfilled') {
      setDrivers(driversResult.value);
      setDriversState('ready');
    } else {
      setDrivers([]);
      setDriversState('error');
      setDriversError(apiErrorMessage(driversResult.reason, 'Не удалось загрузить водителей'));
    }

    if (contractorsResult.status === 'fulfilled') {
      setContractors(contractorsResult.value);
      setContractorsState('ready');
    } else {
      setContractors([]);
      setContractorsState('error');
      setContractorsError(apiErrorMessage(contractorsResult.reason, 'Не удалось загрузить контрагентов'));
    }

    if (templatesResult.status === 'fulfilled') {
      setTemplates(templatesResult.value);
      setTemplatesState('ready');
    } else {
      setTemplates([]);
      setTemplatesState('error');
      setTemplatesError(apiErrorMessage(templatesResult.reason, 'Не удалось загрузить шаблоны'));
    }

    if (materialsResult.status === 'fulfilled') {
      setMaterials(materialsResult.value);
      setMaterialsState('ready');
    } else {
      setMaterials([]);
      setMaterialsState('error');
      setMaterialsError(apiErrorMessage(materialsResult.reason, 'Не удалось загрузить материалы'));
    }

    setInitialLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  useEffect(() => {
    if (dataReloadToken > 0) {
      void load({ silent: true });
    }
  }, [dataReloadToken, load]);

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
    if (!createForAllDrivers && !driverId) {
      Alert.alert('Заполните', 'Выберите водителя');
      return;
    }
    if (!contractorId) {
      Alert.alert('Заполните', 'Выберите контрагента');
      return;
    }
    if (createForAllDrivers) {
      if (driversState === 'loading') {
        Alert.alert('Подождите', 'Список водителей ещё загружается');
        return;
      }
      if (driversState === 'error') {
        Alert.alert('Ошибка', driversError ?? 'Не удалось загрузить водителей. Нажмите «Повторить загрузку».');
        return;
      }
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
        const activeDriverIds = activeDrivers.map((item) => item.id);
        if (activeDriverIds.length === 0) {
          Alert.alert('Нет водителей', 'Нет активных водителей для назначения');
          setSaving(false);
          return;
        }
        const created = await createOrdersBulk({ ...payload, driver_ids: activeDriverIds });
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
        Alert.alert(
          'Готово',
          `Создано ${created.length} заказов — по одному на каждого активного водителя`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        invalidateCache('admin:');
        invalidateCache('dashboard:');
        invalidateCache('driver:');
      } else {
        await createOrder({ ...payload, driver_id: driverId as number });
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
        Alert.alert('Готово', 'Заказ создан', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        invalidateCache('admin:');
        invalidateCache('dashboard:');
        invalidateCache('driver:');
      }
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const reloadDrivers = () => {
    setDriversState('loading');
    setDriversError(null);
    void listDrivers()
      .then((items) => {
        setDrivers(items);
        setDriversState('ready');
      })
      .catch((e) => {
        setDrivers([]);
        setDriversState('error');
        setDriversError(apiErrorMessage(e, 'Не удалось загрузить водителей'));
      });
  };

  const reloadContractors = () => {
    setContractorsState('loading');
    setContractorsError(null);
    void listContractors()
      .then((items) => {
        setContractors(items);
        setContractorsState('ready');
      })
      .catch((e) => {
        setContractors([]);
        setContractorsState('error');
        setContractorsError(apiErrorMessage(e, 'Не удалось загрузить контрагентов'));
      });
  };

  const formLoadError =
    driversState === 'error' || contractorsState === 'error'
      ? [driversError, contractorsError].filter(Boolean).join(' · ')
      : null;

  if (initialLoading && drivers.length === 0 && contractors.length === 0) {
    return <LoadingScreen label="Загрузка формы…" />;
  }

  return (
    <View style={screenUi.container}>
      <ScrollView contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]} keyboardShouldPersistTaps="always">
        <ScreenHeader title="➕ Новый заказ" showPageTitle={false} />
        <ErrorText message={formLoadError} />

        <View style={screenUi.card}>
          <Text style={screenUi.fieldLabel}>📋 Шаблон заказа</Text>
          {templatesState === 'error' ? (
            <ErrorText message={templatesError} />
          ) : null}
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
          {createForAllDrivers ? (
            driversState === 'loading' ? (
              <ListStatusMessage
                state="loading"
                error={null}
                emptyMessage=""
                onRetry={reloadDrivers}
              />
            ) : driversState === 'error' ? (
              <ListStatusMessage
                state="error"
                error={driversError}
                emptyMessage=""
                onRetry={reloadDrivers}
              />
            ) : activeDrivers.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textMuted }}>
                Нет активных водителей — добавьте или активируйте водителей в разделе «Водители»
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: colors.profit }}>
                Будет создано {activeDrivers.length}{' '}
                {activeDrivers.length === 1 ? 'заказ' : activeDrivers.length < 5 ? 'заказа' : 'заказов'} для{' '}
                {activeDrivers.length}{' '}
                {activeDrivers.length === 1 ? 'активного водителя' : 'активных водителей'}
              </Text>
            )
          ) : driversState === 'loading' ? (
            <ListStatusMessage state="loading" error={null} emptyMessage="" onRetry={reloadDrivers} />
          ) : driversState === 'error' ? (
            <ListStatusMessage
              state="error"
              error={driversError}
              emptyMessage=""
              onRetry={reloadDrivers}
            />
          ) : drivers.length === 0 ? (
            <Text style={{ fontSize: 13, color: colors.textMuted }}>
              Нет водителей — создайте в разделе «Водители»
            </Text>
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
          {contractorsState === 'loading' ? (
            <ListStatusMessage state="loading" error={null} emptyMessage="" onRetry={reloadContractors} />
          ) : contractorsState === 'error' ? (
            <ListStatusMessage
              state="error"
              error={contractorsError}
              emptyMessage=""
              onRetry={reloadContractors}
            />
          ) : contractors.length === 0 ? (
            <Text style={{ fontSize: 13, color: colors.textMuted }}>
              Нет контрагентов — создайте в разделе «Контрагенты»
            </Text>
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
          {materialsState === 'error' ? <ErrorText message={materialsError} /> : null}
          {materialsState === 'loading' ? (
            <ListStatusMessage state="loading" error={null} emptyMessage="" onRetry={() => void load({ silent: true })} />
          ) : materials.length === 0 ? (
            <Text style={{ fontSize: 13, color: colors.textMuted }}>
              Справочник пуст. Добавьте материалы в разделе «Ещё → Материалы».
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {materials.map((m) => {
                const active = material === m.name;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      setMaterial(m.name);
                      setUnit(m.unit);
                    }}
                    style={{
                      backgroundColor: active ? colors.primary : colors.textMuted,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.textMuted,
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: active ? '700' : '500' }}>
                      {m.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
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
