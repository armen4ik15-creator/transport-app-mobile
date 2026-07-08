import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { FormBottomModal } from '../components/FormBottomModal';

import { ScreenHeader } from '../components/ScreenHeader';

import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';

import { apiErrorMessage } from '../api/client';

import { createTrip, deleteTrip, hasTripPhoto, isTripCompleted, isTripInProgress, isTripPhotoMissingOnServer, listTrips, needsTripPhotoAttach, uploadTripPhoto } from '../api/trips';
import { useAuth } from '../auth/AuthContext';

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

  const navigation = useNavigation<NativeStackScreenProps<RootStackParamList, 'TripCreate'>['navigation']>();

  const { user } = useAuth();

  const { orderId, openAction } = route.params;

  const [trips, setTrips] = useState<TripRecord[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);

  const [formMode, setFormMode] = useState<'loading' | 'unloading'>('loading');

  const [ttnNumber, setTtnNumber] = useState('');

  const [volume, setVolume] = useState('');

  const [note, setNote] = useState('');

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const autoOpenedRef = useRef(false);

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
      return () => {
        autoOpenedRef.current = false;
      };
    }, [])
  );

  useFocusEffect(

    useCallback(() => {

      setLoading(true);

      load().finally(() => setLoading(false));

    }, [load])

  );

  useFocusEffect(

    useCallback(() => {

      if (!openAction || loading || autoOpenedRef.current) return;

      if (openAction === 'loading' && !activeTrip) {
        autoOpenedRef.current = true;

        setFormMode('loading');

        resetForm();

        setFormVisible(true);

        return;

      }

      if (openAction === 'unloading' && activeTrip) {
        autoOpenedRef.current = true;

        setFormMode('unloading');

        resetForm();

        setFormVisible(true);

      }

    }, [openAction, loading, activeTrip])

  );



  const onRefresh = async () => {

    setRefreshing(true);

    await load();

    setRefreshing(false);

  };



  const onPickPhoto = async (source: 'camera' | 'library'): Promise<string | null> => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Доступ', 'Разрешите доступ в настройках устройства');
      return null;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0].uri;
  };

  const attachPhotoToTrip = async (tripId: number) => {
    Alert.alert('Фото ТТН', 'Откуда добавить фото?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Камера',
        onPress: () => {
          void (async () => {
            const uri = await onPickPhoto('camera');
            if (!uri) return;
            await saveTripPhoto(tripId, uri);
          })();
        },
      },
      {
        text: 'Галерея',
        onPress: () => {
          void (async () => {
            const uri = await onPickPhoto('library');
            if (!uri) return;
            await saveTripPhoto(tripId, uri);
          })();
        },
      },
    ]);
  };

  const saveTripPhoto = async (tripId: number, uri: string) => {
    setSaving(true);
    try {
      await uploadTripPhoto(tripId, uri);
      await load();
      Alert.alert('Готово', 'Фото ТТН прикреплено. Рейс будет учтён в зарплате.');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось прикрепить фото'));
    } finally {
      setSaving(false);
    }
  };

  const showMissingPhotoAlert = (tripId: number) => {
    Alert.alert(
      'Рейс сохранён',
      'Рейс не будет учтён в зарплате. Прикрепите фото ТТН.',
      [
        { text: 'Позже', style: 'cancel' },
        {
          text: 'Прикрепить фото',
          onPress: () => {
            void attachPhotoToTrip(tripId);
          },
        },
      ]
    );
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



  const isAdmin = user?.role === 'admin';

  const canDeleteTrip = (trip: TripRecord): boolean => {

    if (isAdmin) return true;

    return isTripInProgress(trip);

  };



  const onDeleteTrip = (trip: TripRecord) => {

    if (!canDeleteTrip(trip)) return;

    Alert.alert(

      'Удалить рейс?',

      'Вы уверены? Рейс будет удалён, заказ останется.',

      [

        { text: 'Отмена', style: 'cancel' },

        {

          text: 'Удалить',

          style: 'destructive',

          onPress: async () => {

            setDeleting(true);

            try {

              await deleteTrip(trip.id);

              navigation.goBack();

            } catch (e) {

              Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить рейс'));

            } finally {

              setDeleting(false);

            }

          },

        },

      ]

    );

  };



  const onSave = async () => {

    const parsedVolume = volume.trim() ? Number(volume.replace(',', '.')) : null;

    if (parsedVolume != null && !Number.isFinite(parsedVolume)) {

      Alert.alert('Ошибка', 'Объём должен быть числом');

      return;

    }



    setSaving(true);

    try {

      const savedTrip = await createTrip({

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

      if (formMode === 'unloading' && isTripCompleted(savedTrip) && !hasTripPhoto(savedTrip)) {
        showMissingPhotoAlert(savedTrip.id);
        return;
      }

      Alert.alert(

        'Готово',

        formMode === 'loading' ? 'Погрузка отмечена. Теперь завершите разгрузку.' : 'Рейс завершён'

      );

    } catch (e) {

      const message = apiErrorMessage(e, 'Не удалось сохранить рейс');

      if (axios.isAxiosError(e) && e.response?.status === 409) {
        Alert.alert('Номер ТТН', message);
        return;
      }

      Alert.alert('Ошибка', message);

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

                {canDeleteTrip(activeTrip) ? (

                  <Pressable

                    onPress={() => onDeleteTrip(activeTrip)}

                    disabled={deleting}

                    style={{ marginTop: 10, alignSelf: 'flex-start', opacity: deleting ? 0.6 : 1 }}

                  >

                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#ef4444' }}>🗑 Удалить рейс</Text>

                  </Pressable>

                ) : null}

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

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>

              <View style={{ flex: 1 }}>

                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>

                  #{item.id} · {tripStatusLabel(item)}

                </Text>

                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>

                  {item.completed_at ?? item.created_at}

                </Text>

              </View>

              {canDeleteTrip(item) ? (

                <Pressable

                  onPress={() => onDeleteTrip(item)}

                  disabled={deleting}

                  hitSlop={8}

                  style={{ opacity: deleting ? 0.6 : 1 }}

                >

                  <Text style={{ fontSize: 18, color: '#ef4444' }}>🗑</Text>

                </Pressable>

              ) : null}

            </View>

            {item.ttn_number ? (

              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>📄 ТТН: {item.ttn_number}</Text>

            ) : null}

            <Text style={{ fontSize: 13, color: hasTripPhoto(item) ? '#16a34a' : '#d97706', marginTop: 4 }}>
              {hasTripPhoto(item)
                ? '✅ Зачтён в зарплате'
                : isTripPhotoMissingOnServer(item)
                  ? '⚠️ Фото потеряно на сервере — прикрепите заново'
                  : '⚠️ Не зачтён — нет фото ТТН'}
            </Text>

            {needsTripPhotoAttach(item) ? (
              <Pressable
                onPress={() => void attachPhotoToTrip(item.id)}
                style={{ marginTop: 8, alignSelf: 'flex-start' }}
              >
                <Text style={{ fontSize: 13, color: '#2563eb', fontWeight: '600' }}>
                  {isTripPhotoMissingOnServer(item) ? '📷 Прикрепить фото ТТН заново' : '📷 Прикрепить фото ТТН'}
                </Text>
              </Pressable>
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

        <Field label="Номер ТТН (необязательно)" value={ttnNumber} onChangeText={setTtnNumber} />

        <Field label="Объём" value={volume} onChangeText={setVolume} keyboardType="decimal-pad" />

        <Field label="Комментарий" value={note} onChangeText={setNote} />

        <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
          Фото ТТН необязательно — можно пропустить, если на погрузке не выдали накладную
        </Text>

        <MenuButton label="📷 Камера" onPress={() => void onPickPhoto('camera').then((uri) => uri && setPhotoUri(uri))} variant="secondary" />

        <MenuButton label="🖼 Галерея" onPress={() => void onPickPhoto('library').then((uri) => uri && setPhotoUri(uri))} variant="secondary" />

        {photoUri ? (
          <MenuButton label="✕ Убрать фото" onPress={() => setPhotoUri(null)} variant="secondary" />
        ) : null}

        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>

          {photoUri ? '✅ Фото выбрано' : 'Фото не выбрано — можно сохранить без фото'}

        </Text>

      </FormBottomModal>

    </View>

  );

}


