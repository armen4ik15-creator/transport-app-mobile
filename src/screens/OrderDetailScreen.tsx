import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader } from '../components/ScreenHeader';
import { DriverTripActionCard } from '../components/DriverTripActionCard';
import { ErrorText, LoadingScreen, MenuButton, PrimaryButton } from '../components/ui';
import { getOrder, deleteOrder, updateOrderStatus, uploadOrderPhoto } from '../api/orders';
import { apiErrorMessage, getServerHost } from '../api/client';
import { STATUS_LABEL, TRIP_STAGE_LABEL, type OrderStatus, type OrderWithPhotos } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../auth/AuthContext';
import { createOrderTemplateFromOrder } from '../api/orderTemplates';
import { invalidateCache } from '../utils/apiCache';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const STATUSES: OrderStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

export function OrderDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
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

  if (loading) return <LoadingScreen label="Загрузка заказа…" />;
  if (!order) {
    return (
      <View style={[screenUi.container, screenUi.content]}>
        <ScreenHeader title="📦 Заказ" />
        <ErrorText message={error ?? 'Заказ не найден'} />
      </View>
    );
  }

  return (
    <View style={screenUi.container}>
      <ScrollView contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]}>
        <ScreenHeader title={`📦 Заказ #${order.id}`} />

        <View
          style={{
            backgroundColor: order.is_active ? '#eff6ff' : '#fef3c7',
            borderRadius: 8,
            padding: 10,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: order.is_active ? colors.primary : '#fcd34d',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: order.is_active ? colors.primary : '#92400e' }}>
            {STATUS_LABEL[order.status]} · {order.is_active ? '✅ Активен' : '📦 Архив'}
          </Text>
        </View>

        {isAdmin ? (
          <View style={screenUi.card}>
            <MenuButton label="✏️ Редактировать заказ" onPress={() => navigation.navigate('OrderEdit', { id: order.id })} />
            <MenuButton
              label="🗑 Удалить заказ"
              variant="danger"
              onPress={() => {
                Alert.alert('Удалить заказ?', `Заказ #${order.id} будет удалён безвозвратно`, [
                  { text: 'Отмена', style: 'cancel' },
                  {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                      setBusy(true);
                      try {
                        await deleteOrder(id);
                        invalidateCache('admin:');
                        invalidateCache('dashboard:');
                        invalidateCache('driver:');
                        navigation.goBack();
                      } catch (e) {
                        Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить заказ'));
                      } finally {
                        setBusy(false);
                      }
                    },
                  },
                ]);
              }}
            />
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
          </View>
        ) : null}

        <View style={screenUi.card}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>{order.contractor_name ?? '—'}</Text>
          {order.task_name ? (
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>📋 {order.task_name}</Text>
          ) : null}
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}>
            👤 {order.driver_name ?? '—'}
            {order.driver_car_number ? ` · 🚚 ${order.driver_car_number}` : ''}
          </Text>
          {order.material ? (
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>🧱 {order.material}</Text>
          ) : null}
          {order.quantity != null ? (
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 2 }}>⚖️ {order.quantity} {order.unit ?? ''}</Text>
          ) : null}
          {order.driver_rate != null ? (
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 2 }}>💰 Ставка: {order.driver_rate} ₽</Text>
          ) : null}
          {order.load_address ? (
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>📍 {order.load_address} → {order.unload_address ?? '—'}</Text>
          ) : null}
          {order.notes ? (
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' }}>📝 {order.notes}</Text>
          ) : null}
        </View>

        {!isAdmin ? (
          <View style={{ marginBottom: 12 }}>
            <DriverTripActionCard
              orderId={order.id}
              taskLabel={order.task_name ?? order.material ?? undefined}
            />
          </View>
        ) : null}

        {isAdmin ? (
          <View style={screenUi.card}>
            <PrimaryButton
              label={`🧾 Рейсы и ТТН (${order.trips.length})`}
              onPress={() => navigation.navigate('TripCreate', { orderId: order.id })}
            />
            <MenuButton label="📄 Путевые листы" onPress={() => navigation.navigate('Waybills')} variant="secondary" />
            <MenuButton label="🧮 Счета" onPress={() => navigation.navigate('Invoices')} variant="secondary" />
          </View>
        ) : null}

        {isAdmin
          ? order.trips.map((trip) => (
              <View key={trip.id} style={screenUi.card}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                  Рейс #{trip.id} · {TRIP_STAGE_LABEL[trip.stage]}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{trip.created_at}</Text>
                {trip.ttn_number ? (
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>📄 ТТН: {trip.ttn_number}</Text>
                ) : null}
                {trip.volume != null ? (
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>⚖️ {trip.volume}</Text>
                ) : null}
                {trip.photo_path ? (
                  <Image
                    source={{ uri: `${fileHost}${trip.photo_path}` }}
                    style={{ width: '100%', height: 180, borderRadius: 8, marginTop: 8 }}
                    resizeMode="cover"
                  />
                ) : null}
              </View>
            ))
          : null}

        {isAdmin ? (
          <>
            <Text style={screenUi.fieldLabel}>Сменить статус</Text>
            {STATUSES.map((s) => (
              <MenuButton
                key={s}
                label={`${order.status === s ? '✅ ' : ''}${STATUS_LABEL[s]}`}
                onPress={() => onSetStatus(s)}
                variant={order.status === s ? 'default' : 'secondary'}
              />
            ))}

            <Text style={[screenUi.fieldLabel, { marginTop: 12 }]}>📷 Фото ({order.photos.length})</Text>
            <View style={screenUi.card}>
              <PrimaryButton label="📷 Снять фото" onPress={() => onAttachPhoto('camera')} loading={busy} />
              <MenuButton label="🖼 Из галереи" onPress={() => onAttachPhoto('library')} variant="secondary" />
            </View>
            {order.photos.map((p) => (
              <View key={p.id} style={screenUi.card}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{p.uploaded_at}</Text>
                <Image
                  source={{ uri: `${fileHost}${p.file_path}` }}
                  style={{ width: '100%', height: 220, borderRadius: 8, marginTop: 8 }}
                  resizeMode="cover"
                />
              </View>
            ))}
          </>
        ) : null}

        <ErrorText message={error} />
      </ScrollView>
    </View>
  );
}
