import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
import { createTrip, listTrips } from '../api/trips';
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
      setTtnNumber('');
      setVolume('');
      setNote('');
      setPhotoUri(null);
      await load();
      Alert.alert('Готово', 'Рейс сохранён');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить рейс'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={trips}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Рейсы по заказу #{orderId}</Title>
            <ErrorText message={error} />
            <Card>
              <Subtitle>Этап рейса</Subtitle>
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
              <Subtitle>{photoUri ? 'Фото выбрано' : 'Фото не выбрано'}</Subtitle>
              <PrimaryButton label="Сохранить рейс" onPress={onSave} loading={saving} />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>
              #{item.id} · {TRIP_STAGE_LABEL[item.stage]} · {item.created_at}
            </Subtitle>
            {item.ttn_number ? <Subtitle>ТТН: {item.ttn_number}</Subtitle> : null}
            {item.volume != null ? <Subtitle>Объём: {item.volume}</Subtitle> : null}
            {item.note ? <Subtitle>Комментарий: {item.note}</Subtitle> : null}
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Пока нет рейсов по этому заказу" />}
      />
    </View>
  );
}
