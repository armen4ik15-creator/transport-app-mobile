import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, Field, LoadingScreen } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createOrderTemplate, deleteOrderTemplate, listOrderTemplates, updateOrderTemplate } from '../api/orderTemplates';
import type { OrderTemplate } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { screenUi } from '../styles/screenUi';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTemplates'>;

export function OrderTemplatesScreen({ navigation }: Props) {
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [material, setMaterial] = useState('');
  const [unit, setUnit] = useState('м3');
  const [quantity, setQuantity] = useState('');
  const [driverRate, setDriverRate] = useState('');
  const [companyRate, setCompanyRate] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [loadAddress, setLoadAddress] = useState('');
  const [unloadAddress, setUnloadAddress] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      setTemplates(await listOrderTemplates());
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить шаблоны заказов'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
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
  };

  const openCreate = () => {
    resetForm();
    setFormVisible(true);
  };

  const openEdit = (item: OrderTemplate) => {
    setEditingId(item.id);
    setName(item.name);
    setMaterial(item.material ?? '');
    setUnit(item.unit ?? 'м3');
    setQuantity(item.default_quantity != null ? String(item.default_quantity) : '');
    setDriverRate(item.driver_rate != null ? String(item.driver_rate) : '');
    setCompanyRate(item.company_rate != null ? String(item.company_rate) : '');
    setDistanceKm(item.distance_km != null ? String(item.distance_km) : '');
    setNotes(item.notes ?? '');
    setDescription(item.description ?? '');
    setLoadAddress(item.load_address ?? '');
    setUnloadAddress(item.unload_address ?? '');
    setFormVisible(true);
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название шаблона');
      return;
    }
    const parsedQty = quantity.trim() ? Number(quantity.replace(',', '.')) : null;
    const parsedDriverRate = driverRate.trim() ? Number(driverRate.replace(',', '.')) : null;
    const parsedCompanyRate = companyRate.trim() ? Number(companyRate.replace(',', '.')) : null;
    const parsedDistance = distanceKm.trim() ? Number(distanceKm.replace(',', '.')) : null;

    const payload = {
      name: name.trim(),
      material: material.trim() || undefined,
      unit: unit.trim() || undefined,
      default_quantity: Number.isFinite(parsedQty as number) ? parsedQty : null,
      driver_rate: Number.isFinite(parsedDriverRate as number) ? parsedDriverRate : null,
      company_rate: Number.isFinite(parsedCompanyRate as number) ? parsedCompanyRate : null,
      distance_km: Number.isFinite(parsedDistance as number) ? parsedDistance : null,
      notes: notes.trim() || undefined,
      description: description.trim() || undefined,
      load_address: loadAddress.trim() || undefined,
      unload_address: unloadAddress.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editingId != null) {
        await updateOrderTemplate(editingId, payload);
      } else {
        await createOrderTemplate(payload);
      }
      resetForm();
      setFormVisible(false);
      await load();
      Alert.alert('Готово', editingId != null ? 'Шаблон обновлён' : 'Шаблон заказа создан');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить шаблон'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (item: OrderTemplate) => {
    Alert.alert('Удалить шаблон?', item.name, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteOrderTemplate(item.id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить шаблон'));
          }
        },
      },
    ]);
  };

  if (loading && templates.length === 0) return <LoadingScreen label="Загрузка шаблонов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="Шаблоны заказов"
              showPageTitle={false}
              actionLabel="Добавить"
              onAction={openCreate}
            />
            <ScreenHero title="🗂 Шаблоны заказов" subtitle="Быстрое создание типовых задач" />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={screenUi.card}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>#{item.id}</Text>
            {item.material ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>🧱 {item.material}</Text>
            ) : null}
            {item.driver_rate != null ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>💰 {item.driver_rate} ₽</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 }}>
              <Pressable
                onPress={() => navigation.navigate('OrderCreate', { templateId: item.id })}
                style={{ flex: 1, backgroundColor: '#2563eb', paddingVertical: 8, borderRadius: 7, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Создать заказ</Text>
              </Pressable>
              <Pressable
                onPress={() => openEdit(item)}
                style={{ flex: 1, backgroundColor: '#7c3aed', paddingVertical: 8, borderRadius: 7, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Изменить</Text>
              </Pressable>
              <Pressable
                onPress={() => onDelete(item)}
                style={{ width: 44, backgroundColor: '#ef4444', paddingVertical: 8, borderRadius: 7, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>🗑</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Шаблонов заказов пока нет</Text>}
      />

      <FormBottomModal
        visible={formVisible}
        title={editingId != null ? '✏️ Редактировать шаблон' : '➕ Шаблон заказа'}
        saveLabel={editingId != null ? 'Сохранить' : 'Создать шаблон'}
        saving={saving}
        onSave={onSave}
        onClose={() => {
          setFormVisible(false);
          resetForm();
        }}
      >
        <Field label="Название шаблона" value={name} onChangeText={setName} />
        <Field label="Материал" value={material} onChangeText={setMaterial} />
        <Field label="Ед. измерения" value={unit} onChangeText={setUnit} />
        <Field label="Количество" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
        <Field label="Ставка водителя" value={driverRate} onChangeText={setDriverRate} keyboardType="decimal-pad" />
        <Field label="Ставка компании" value={companyRate} onChangeText={setCompanyRate} keyboardType="decimal-pad" />
        <Field label="Плечо, км" value={distanceKm} onChangeText={setDistanceKm} keyboardType="decimal-pad" />
        <Field label="Описание" value={description} onChangeText={setDescription} />
        <Field label="Адрес погрузки" value={loadAddress} onChangeText={setLoadAddress} />
        <Field label="Адрес разгрузки" value={unloadAddress} onChangeText={setUnloadAddress} />
        <Field label="Примечание" value={notes} onChangeText={setNotes} />
      </FormBottomModal>
    </View>
  );
}
