import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  EmptyText,
  ErrorText,
  Field,
  LoadingScreen,
  MenuButton,
  PrimaryButton,
  Subtitle,
  Title,
} from '../components/ui';
import { apiErrorMessage } from '../api/client';
import {
  createOrderTemplate,
  deleteOrderTemplate,
  listOrderTemplates,
} from '../api/orderTemplates';
import type { OrderTemplate } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderTemplates'>;

export function OrderTemplatesScreen({ navigation }: Props) {
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  if (loading && templates.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Шаблоны заказов</Title>
            <Subtitle>Создайте шаблон, затем выберите его при создании заказа</Subtitle>
            <ErrorText message={error} />
            <Card>
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
              <PrimaryButton label="Создать шаблон" onPress={onCreate} loading={saving} />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>#{item.id}</Subtitle>
            <Title>{item.name}</Title>
            {item.material ? <Subtitle>Материал: {item.material}</Subtitle> : null}
            {item.default_quantity != null ? <Subtitle>Количество: {item.default_quantity}</Subtitle> : null}
            {item.driver_rate != null ? <Subtitle>Ставка водителя: {item.driver_rate}</Subtitle> : null}
            {item.company_rate != null ? <Subtitle>Ставка компании: {item.company_rate}</Subtitle> : null}
            {item.distance_km != null ? <Subtitle>Плечо, км: {item.distance_km}</Subtitle> : null}
            <MenuButton
              label="Создать заказ по этому шаблону"
              onPress={() => navigation.navigate('OrderCreate', { templateId: item.id })}
            />
            <MenuButton label="Удалить шаблон" onPress={() => onDelete(item)} variant="danger" />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Шаблонов заказов пока нет" />}
      />
    </View>
  );
}
