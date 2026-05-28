import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createTrip, listTrips } from '../api/trips';
import { screenUi } from '../styles/screenUi';
import { TRIP_STAGE_LABEL, type TripRecord, type TripStage } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'TripCreate'>;

export function TripCreateScreen({ route }: Props) {
  const { orderId } = route.params;
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [stage, setStage] = useState<TripStage>('loading');
  const [ttnNumber, setTtnNumber] = useState('');
  const [volume, setVolume] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

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
    setStage('loading');
    setTtnNumber('');
    setVolume('');
    setNote('');
    setPhotoUri(null);
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
        stage,
        ttn_number: ttnNumber.trim() || undefined,
        volume: parsedVolume,
        note: note.trim() || undefined,
        photoUri,
      });
      resetForm();
      setFormVisible(false);
      await load();
      Alert.alert('Готово', 'Рейс сохранён');
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
        data={trips}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title={`🧾 Рейсы #${orderId}`}
              actionLabel="+ Рейс"
              onAction={() => setFormVisible(true)}
            />
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Рейсов</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{trips.length}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
              #{item.id} · {TRIP_STAGE_LABEL[item.stage]}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{item.created_at}</Text>
            {item.ttn_number ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>📄 ТТН: {item.ttn_number}</Text>
            ) : null}
            {item.volume != null ? (
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#2563eb', marginTop: 4 }}>⚖️ {item.volume}</Text>
            ) : null}
            {item.note ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4, fontStyle: 'italic' }}>{item.note}</Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Пока нет рейсов по этому заказу</Text>}
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Новый рейс"
        saveLabel="Сохранить рейс"
        saving={saving}
        onSave={onSave}
        onClose={() => {
          setFormVisible(false);
          resetForm();
        }}
      >
        <Text style={screenUi.fieldLabel}>Этап рейса</Text>
        <MenuButton
          label={`${stage === 'loading' ? '✅ ' : ''}${TRIP_STAGE_LABEL.loading}`}
          onPress={() => setStage('loading')}
          variant={stage === 'loading' ? 'default' : 'secondary'}
        />
        <MenuButton
          label={`${stage === 'unloading' ? '✅ ' : ''}${TRIP_STAGE_LABEL.unloading}`}
          onPress={() => setStage('unloading')}
          variant={stage === 'unloading' ? 'default' : 'secondary'}
        />
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
