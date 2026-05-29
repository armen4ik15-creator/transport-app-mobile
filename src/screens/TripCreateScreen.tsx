import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createTrip, isTripCompleted, isTripInProgress, listTrips } from '../api/trips';
import { screenUi } from '../styles/screenUi';
import { TRIP_STAGE_LABEL, TRIP_STATUS_LABEL, type TripRecord } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TripCreate'>;

function tripStatusLabel(trip: TripRecord): string {
  if (isTripCompleted(trip)) return TRIP_STATUS_LABEL.completed;
  if (isTripInProgress(trip)) return TRIP_STATUS_LABEL.loading;
  return TRIP_STAGE_LABEL[trip.stage];
}

export function TripCreateScreen({ route }: Props) {
  const { orderId } = route.params;
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'loading' | 'unloading'>('loading');
  const [ttnNumber, setTtnNumber] = useState('');
  const [volume, setVolume] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const activeTrip = useMemo(
    () => trips.find((trip) => isTripInProgress(trip)) ?? null,
    [trips]
  );
  const completedTrips = useMemo(
    () => trips.filter((trip) => isTripCompleted(trip)),
    [trips]
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      setTrips(await listTrips({ order_id: orderId }));
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить рейсы'));
    }
  }, [orderId]);

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

  const onPickPhoto = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Доступ', 'Разрешите доступ в настройках устройства');
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    setPhotoUri(result.assets[0].uri);
  };

  const resetForm = () => {
    setTtnNumber('');
    setVolume('');
    setNote('');
    setPhotoUri(null);
  };

  const openLoadingForm = () => {
    if (activeTrip) {
      Alert.alert('Рейс в работе', 'Сначала завершите разгрузку текущего рейса');
      return;
    }
    setFormMode('loading');
    resetForm();
    setFormVisible(true);
  };

  const openUnloadingForm = () => {
    if (!activeTrip) {
      Alert.alert('Погрузка', 'Сначала отметьте погрузку');
      return;
    }
    setFormMode('unloading');
    resetForm();
    setFormVisible(true);
  };

  const onSave = async () => {
    const parsedVolume = volume.trim() ? Number(volume.replace(',', '.')) : null;
    if (parsedVolume != null && !Number.isFinite(parsedVolume)) {
      Alert.alert('Ошибка', 'Объём должен быть числом');
      return;
    }

    setSaving(true);
    try {
      await createTrip({
        order_id: orderId,
        action: formMode,
        ttn_number: ttnNumber.trim() || undefined,
        volume: parsedVolume,
        note: note.trim() || undefined,
        photoUri,
      });
      resetForm();
      setFormVisible(false);
      await load();
      Alert.alert(
        'Готово',
        formMode === 'loading' ? 'Погрузка отмечена. Теперь завершите разгрузку.' : 'Рейс завершён'
      );
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить рейс'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen label="Загрузка рейсов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={completedTrips}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title={`🧾 Рейсы #${orderId}`} />
            <View style={{ gap: 8, marginBottom: 12 }}>
              <MenuButton
                label="📦 Начать погрузку"
                onPress={openLoadingForm}
                variant={activeTrip ? 'secondary' : 'default'}
              />
              <MenuButton
                label="✅ Завершить разгрузку"
                onPress={openUnloadingForm}
                variant={activeTrip ? 'default' : 'secondary'}
              />
            </View>
            {activeTrip ? (
              <View style={[screenUi.card, { marginBottom: 12, borderColor: '#f59e0b', borderWidth: 1 }]}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#b45309' }}>
                  ⏳ Рейс #{activeTrip.id} — ожидает разгрузку
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{activeTrip.created_at}</Text>
              </View>
            ) : null}
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Завершено</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{completedTrips.length}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
              #{item.id} · {tripStatusLabel(item)}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {item.completed_at ?? item.created_at}
            </Text>
            {item.ttn_number ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>📄 ТТН: {item.ttn_number}</Text>
            ) : null}
            {item.volume != null ? (
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#2563eb', marginTop: 4 }}>
                ⚖️ {item.volume} {item.unit ?? 'т'}
              </Text>
            ) : null}
            {item.material ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>🧱 {item.material}</Text>
            ) : null}
            {item.load_address ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>📍 {item.load_address}</Text>
            ) : null}
            {item.note ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4, fontStyle: 'italic' }}>{item.note}</Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={screenUi.emptyText}>Завершённых рейсов пока нет. Начните с погрузки.</Text>
        }
      />

      <FormBottomModal
        visible={formVisible}
        title={formMode === 'loading' ? '📦 Погрузка' : '✅ Разгрузка'}
        saveLabel={formMode === 'loading' ? 'Отметить погрузку' : 'Завершить рейс'}
        saving={saving}
        onSave={onSave}
        onClose={() => {
          setFormVisible(false);
          resetForm();
        }}
      >
        <Field label="Номер ТТН" value={ttnNumber} onChangeText={setTtnNumber} />
        <Field label="Объём" value={volume} onChangeText={setVolume} keyboardType="decimal-pad" />
        <Field label="Комментарий" value={note} onChangeText={setNote} />
        <MenuButton label="📷 Камера" onPress={() => onPickPhoto('camera')} variant="secondary" />
        <MenuButton label="🖼 Галерея" onPress={() => onPickPhoto('library')} variant="secondary" />
        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
          {photoUri ? '✅ Фото выбрано' : 'Фото не выбрано'}
        </Text>
      </FormBottomModal>
    </View>
  );
}
