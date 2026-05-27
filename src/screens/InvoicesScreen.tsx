import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Card, EmptyText, ErrorText, Field, LoadingScreen, MenuButton, PrimaryButton, Subtitle, Title } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createInvoice, deleteInvoice, listInvoices } from '../api/invoices';
import { listOrders } from '../api/orders';
import type { Invoice, Order } from '../types';

export function InvoicesScreen() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [number, setNumber] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [invoices, ordersData] = await Promise.all([listInvoices(), listOrders()]);
      setRows(invoices);
      setOrders(ordersData);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить счета'));
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
      Alert.alert('Ошибка', 'Выберите заказ и введите номер счета');
      return;
    }
    const parsedAmount = amount.trim() ? Number(amount.replace(',', '.')) : null;
    setSaving(true);
    try {
      await createInvoice({
        order_id: orderId,
        number: number.trim(),
        date: date.trim() || undefined,
        amount: parsedAmount != null && Number.isFinite(parsedAmount) ? parsedAmount : null,
        fileUri: fileUri || null,
      });
      setNumber('');
      setDate('');
      setAmount('');
      setFileUri('');
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать счет'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (id: number) => {
    Alert.alert('Удалить счет?', `#${id}`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteInvoice(id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить счет'));
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
            <Title>Счета</Title>
            <Subtitle>Реестр счетов по заказам</Subtitle>
            <ErrorText message={error} />
            <Card>
              <Title>Новый счет</Title>
              <Subtitle>Выберите заказ</Subtitle>
              {orders.slice(0, 15).map((item) => (
                <MenuButton
                  key={item.id}
                  label={`${orderId === item.id ? '✅ ' : ''}Заказ #${item.id}`}
                  onPress={() => setOrderId(item.id)}
                  variant={orderId === item.id ? 'default' : 'secondary'}
                />
              ))}
              <Field label="Номер счета" value={number} onChangeText={setNumber} />
              <Field label="Дата (YYYY-MM-DD)" value={date} onChangeText={setDate} />
              <Field label="Сумма" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
              <MenuButton label={fileUri ? 'Файл выбран' : 'Прикрепить файл'} onPress={pickFile} variant="secondary" />
              <PrimaryButton label="Сохранить" onPress={onCreate} loading={saving} />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Title>#{item.id} · {item.number}</Title>
            <Subtitle>Заказ #{item.order_id} · {item.date}</Subtitle>
            {item.amount != null ? <Subtitle>Сумма: {item.amount} ₽</Subtitle> : null}
            {item.contractor_name ? <Subtitle>Контрагент: {item.contractor_name}</Subtitle> : null}
            {item.file_path ? <Subtitle>Файл: {item.file_path}</Subtitle> : null}
            <MenuButton label="Удалить" onPress={() => onDelete(item.id)} variant="danger" />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Счетов пока нет" />}
      />
    </View>
  );
}
