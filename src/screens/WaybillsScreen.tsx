import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listOrders } from '../api/orders';
import { createWaybill, deleteWaybill, listWaybills } from '../api/waybills';
import { screenUi } from '../styles/screenUi';
import { withFallback } from '../utils/safeRequest';
import type { Order, Waybill } from '../types';

export function WaybillsScreen() {
  const [rows, setRows] = useState<Waybill[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formVisible, setFormVisible] = useState(false);
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

  const resetForm = () => {
    setOrderId(null);
    setNumber('');
    setDate('');
    setFileUri('');
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
      resetForm();
      setFormVisible(false);
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

  if (loading && rows.length === 0) return <LoadingScreen label="Загрузка путевых листов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📄 Путевые листы" actionLabel="+ Создать" onAction={() => setFormVisible(true)} />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card} onLongPress={() => onDelete(item.id)}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
              #{item.id} · {item.number}
            </Text>
            <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
              Заказ #{item.order_id} · {item.date}
            </Text>
            {item.contractor_name ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>🏢 {item.contractor_name}</Text>
            ) : null}
            <Pressable onPress={() => onDelete(item.id)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#ef4444', fontSize: 13 }}>🗑 Удалить</Text>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Путевых листов пока нет</Text>}
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Новый путевой лист"
        saving={saving}
        onSave={onCreate}
        onClose={() => {
          setFormVisible(false);
          resetForm();
        }}
      >
        <Text style={screenUi.fieldLabel}>Выберите заказ</Text>
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
        <MenuButton label={fileUri ? '✅ Файл выбран' : '📎 Прикрепить файл'} onPress={pickFile} variant="secondary" />
      </FormBottomModal>
    </View>
  );
}
