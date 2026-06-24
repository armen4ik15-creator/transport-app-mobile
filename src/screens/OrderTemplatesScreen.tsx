import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createOrderTemplate, deleteOrderTemplate, listOrderTemplates } from '../api/orderTemplates';
import type { OrderTemplate } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTemplates'>;

export function OrderTemplatesScreen({ navigation }: Props) {
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
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

  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название шаблона');
      return;
    }
    const parsedQty = quantity.trim() ? Number(quantity.replace(',', '.')) : null;
    const parsedDriverRate = driverRate.trim() ? Number(driverRate.replace(',', '.')) : null;
    const parsedCompanyRate = companyRate.trim() ? Number(companyRate.replace(',', '.')) : null;
    const parsedDistance = distanceKm.trim() ? Number(distanceKm.replace(',', '.')) : null;

    setSaving(true);
    try {
      await createOrderTemplate({
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
      });
      resetForm();
      setFormVisible(false);
      await load();
      Alert.alert('Готово', 'Шаблон заказа создан');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать шаблон'));
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
            <ScreenHeader title="📦 Шаблоны заказов" actionLabel="+ Создать" onAction={() => setFormVisible(true)} />
            <ScreenHero title="🗂 Шаблоны заказов" subtitle="Быстрое создание типовых задач" />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={screenUi.card}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>#{item.id}</Text>
            {item.material ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>🧱 {item.material}</Text>
            ) : null}
            {item.driver_rate != null ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>💰 {item.driver_rate} ₽</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: colors.surfaceElevated, paddingTop: 10 }}>
              <Pressable
                onPress={() => navigation.navigate('OrderCreate', { templateId: item.id })}
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 8, borderRadius: 7, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Создать заказ</Text>
              </Pressable>
              <Pressable
                onPress={() => onDelete(item)}
                style={{ flex: 1, backgroundColor: colors.loss, paddingVertical: 8, borderRadius: 7, alignItems: 'center' }}
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
        title="➕ Шаблон заказа"
        saveLabel="Создать шаблон"
        saving={saving}
        onSave={onCreate}
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
