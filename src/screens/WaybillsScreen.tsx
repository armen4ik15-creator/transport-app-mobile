import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Card, EmptyText, ErrorText, Field, LoadingScreen, MenuButton, PrimaryButton, Subtitle, Title } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listOrders } from '../api/orders';
import { createWaybill, deleteWaybill, listWaybills } from '../api/waybills';
import { withFallback } from '../utils/safeRequest';
import type { Order, Waybill } from '../types';

export function WaybillsScreen() {
  const [rows, setRows] = useState<Waybill[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [number, setNumber] = useState('');
  const [date, setDate] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [waybills, ordersData] = await Promise.all([
        withFallback(() => listWaybills(), []),
        withFallback(() => listOrders(), []),
      ]);
      setRows(waybills);
      setOrders(ordersData);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить путевые листы'));
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

  const pickFile = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Доступ', 'Разрешите доступ к галерее');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    setFileUri(result.assets[0].uri);
  };

  const onCreate = async () => {
    if (!orderId || !number.trim()) {
      Alert.alert('Ошибка', 'Выберите заказ и введите номер');
      return;
    }
    setSaving(true);
    try {
      await createWaybill({
        order_id: orderId,
        number: number.trim(),
        date: date.trim() || undefined,
        fileUri: fileUri || null,
      });
      setNumber('');
      setDate('');
      setFileUri('');
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать путевой лист'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (id: number) => {
    Alert.alert('Удалить путевой лист?', `#${id}`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWaybill(id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить путевой лист'));
          }
        },
      },
    ]);
  };

  if (loading && rows.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Путевые листы</Title>
            <Subtitle>Реестр путевых листов по заказам</Subtitle>
            <ErrorText message={error} />
            <Card>
              <Title>Новый путевой лист</Title>
              <Subtitle>Выберите заказ</Subtitle>
              {orders.slice(0, 15).map((item) => (
                <MenuButton
                  key={item.id}
                  label={`${orderId === item.id ? '✅ ' : ''}Заказ #${item.id}`}
                  onPress={() => setOrderId(item.id)}
                  variant={orderId === item.id ? 'default' : 'secondary'}
                />
              ))}
              <Field label="Номер путевого листа" value={number} onChangeText={setNumber} />
              <Field label="Дата (YYYY-MM-DD)" value={date} onChangeText={setDate} />
              <MenuButton label={fileUri ? 'Файл выбран' : 'Прикрепить файл'} onPress={pickFile} variant="secondary" />
              <PrimaryButton label="Сохранить" onPress={onCreate} loading={saving} />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Title>#{item.id} · {item.number}</Title>
            <Subtitle>Заказ #{item.order_id} · {item.date}</Subtitle>
            {item.contractor_name ? <Subtitle>Контрагент: {item.contractor_name}</Subtitle> : null}
            {item.file_path ? <Subtitle>Файл: {item.file_path}</Subtitle> : null}
            <MenuButton label="Удалить" onPress={() => onDelete(item.id)} variant="danger" />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Путевых листов пока нет" />}
      />
    </View>
  );
}
