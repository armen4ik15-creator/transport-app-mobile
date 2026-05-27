import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  ErrorText,
  LoadingScreen,
  MenuButton,
  PrimaryButton,
  Subtitle,
  Title,
} from '../components/ui';
import { getOrder, updateOrderStatus, uploadOrderPhoto } from '../api/orders';
import { apiErrorMessage, getServerHost } from '../api/client';
import { STATUS_LABEL, TRIP_STAGE_LABEL, type OrderStatus, type OrderWithPhotos } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { createOrderTemplateFromOrder } from '../api/orderTemplates';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const STATUSES: OrderStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

export function OrderDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithPhotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileHost, setFileHost] = useState('http://localhost:3000');

  useEffect(() => {
    getServerHost().then(setFileHost).catch(() => setFileHost('http://localhost:3000'));
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      setOrder(await getOrder(id));
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onSetStatus = (status: OrderStatus) => {
    Alert.alert('Сменить статус?', STATUS_LABEL[status], [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Сменить',
        onPress: async () => {
          setBusy(true);
          try {
            await updateOrderStatus(id, status);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const onAttachPhoto = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Доступ', 'Разрешите доступ в настройках');
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    setBusy(true);
    try {
      await uploadOrderPhoto(id, result.assets[0].uri);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!order) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: '#f4f6f8' }}>
        <ErrorText message={error ?? 'Заказ не найден'} />
        <MenuButton label="← Назад" onPress={() => navigation.goBack()} variant="secondary" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f4f6f8' }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Title>Заказ #{order.id}</Title>
      <Subtitle>Статус: {STATUS_LABEL[order.status]}</Subtitle>
      {user?.role === 'admin' ? (
        <Card>
          <MenuButton label="✏️ Редактировать заказ" onPress={() => navigation.navigate('OrderEdit', { id: order.id })} />
          <MenuButton
            label="💾 Сохранить как шаблон"
            onPress={async () => {
              try {
                await createOrderTemplateFromOrder(
                  order.id,
                  `Заказ #${order.id} (${new Date().toISOString().slice(0, 10)})`
                );
                Alert.alert('Готово', 'Шаблон сохранён');
              } catch (e) {
                Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить шаблон'));
              }
            }}
            variant="secondary"
          />
        </Card>
      ) : null}

      <Card>
        <Subtitle>Контрагент</Subtitle>
        <Title>{order.contractor_name ?? '—'}</Title>
        {order.task_name ? <Subtitle>Задача: {order.task_name}</Subtitle> : null}
        {order.sender ? <Subtitle>Отправитель: {order.sender}</Subtitle> : null}
        {order.receiver ? <Subtitle>Получатель: {order.receiver}</Subtitle> : null}
        {order.total_planned_volume != null ? <Subtitle>Плановый объём: {order.total_planned_volume}</Subtitle> : null}
        <Subtitle>Водитель</Subtitle>
        <Title>
          {order.driver_name ?? '—'}
          {order.driver_car_number ? ` (${order.driver_car_number})` : ''}
        </Title>
        {order.material ? <Subtitle>Материал: {order.material}</Subtitle> : null}
        {order.quantity != null ? <Subtitle>Количество: {order.quantity}</Subtitle> : null}
        {order.unit ? <Subtitle>Ед. изм.: {order.unit}</Subtitle> : null}
        {order.driver_rate != null ? <Subtitle>Ставка водителя: {order.driver_rate}</Subtitle> : null}
        {order.company_rate != null ? <Subtitle>Ставка компании: {order.company_rate}</Subtitle> : null}
        {order.distance_km != null ? <Subtitle>Плечо, км: {order.distance_km}</Subtitle> : null}
        <Subtitle>Активен: {order.is_active ? 'Да' : 'Нет'}</Subtitle>
        {order.notes ? <Subtitle>Примечание: {order.notes}</Subtitle> : null}
        {order.load_address ? <Subtitle>Погрузка: {order.load_address}</Subtitle> : null}
        {order.unload_address ? <Subtitle>Разгрузка: {order.unload_address}</Subtitle> : null}
        {order.description ? <Subtitle>{order.description}</Subtitle> : null}
      </Card>

      <Card>
        <PrimaryButton
          label={`🧾 Рейсы и ТТН (${order.trips.length})`}
          onPress={() => navigation.navigate('TripCreate', { orderId: order.id })}
        />
        <MenuButton
          label="📄 Путевые листы"
          onPress={() => navigation.navigate('Waybills')}
          variant="secondary"
        />
        <MenuButton
          label="🧮 Счета"
          onPress={() => navigation.navigate('Invoices')}
          variant="secondary"
        />
      </Card>

      {order.trips.map((trip) => (
        <Card key={trip.id}>
          <Subtitle>
            Рейс #{trip.id} · {TRIP_STAGE_LABEL[trip.stage]} · {trip.created_at}
          </Subtitle>
          {trip.ttn_number ? <Subtitle>ТТН: {trip.ttn_number}</Subtitle> : null}
          {trip.volume != null ? <Subtitle>Объём: {trip.volume}</Subtitle> : null}
          {trip.note ? <Subtitle>Комментарий: {trip.note}</Subtitle> : null}
          {trip.photo_path ? (
            <Image
              source={{ uri: `${fileHost}${trip.photo_path}` }}
              style={{ width: '100%', height: 180, borderRadius: 8, marginTop: 8 }}
              resizeMode="cover"
            />
          ) : null}
        </Card>
      ))}

      <Subtitle>Сменить статус</Subtitle>
      {STATUSES.map((s) => (
        <MenuButton
          key={s}
          label={`${order.status === s ? '✅ ' : ''}${STATUS_LABEL[s]}`}
          onPress={() => onSetStatus(s)}
          variant={order.status === s ? 'default' : 'secondary'}
        />
      ))}

      <Subtitle>Фото ({order.photos.length})</Subtitle>
      <Card>
        <PrimaryButton label="📷 Снять фото" onPress={() => onAttachPhoto('camera')} loading={busy} />
        <MenuButton label="🖼 Из галереи" onPress={() => onAttachPhoto('library')} variant="secondary" />
      </Card>
      {order.photos.map((p) => (
        <Card key={p.id}>
          <Subtitle>{p.uploaded_at}</Subtitle>
          <Image
            source={{ uri: `${fileHost}${p.file_path}` }}
            style={{ width: '100%', height: 220, borderRadius: 8, marginTop: 8 }}
            resizeMode="cover"
          />
        </Card>
      ))}

      <ErrorText message={error} />
      <MenuButton label="← Назад" onPress={() => navigation.goBack()} variant="secondary" />
    </ScrollView>
  );
}
