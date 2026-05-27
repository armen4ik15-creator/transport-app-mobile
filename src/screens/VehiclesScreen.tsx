import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, EmptyText, ErrorText, Field, LoadingScreen, MenuButton, PrimaryButton, Subtitle, Title } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createVehicle, deleteVehicle, listVehicles } from '../api/vehicles';
import { useAuth } from '../auth/AuthContext';
import type { Vehicle } from '../types';

export function VehiclesScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setVehicles(await listVehicles());
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить автомобили'));
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
    if (!isAdmin) return;
    if (!plate.trim()) {
      Alert.alert('Ошибка', 'Введите госномер');
      return;
    }
    const parsedCapacity = capacity.trim() ? Number(capacity.replace(',', '.')) : null;
    setSaving(true);
    try {
      await createVehicle({
        plate_number: plate.trim().toUpperCase(),
        model: model.trim() || undefined,
        capacity: parsedCapacity != null && Number.isFinite(parsedCapacity) ? parsedCapacity : null,
      });
      setPlate('');
      setModel('');
      setCapacity('');
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось добавить автомобиль'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (item: Vehicle) => {
    if (!isAdmin) return;
    Alert.alert('Удалить автомобиль?', item.plate_number, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVehicle(item.id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить автомобиль'));
          }
        },
      },
    ]);
  };

  if (loading && vehicles.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Автомобили</Title>
            <Subtitle>Справочник автопарка</Subtitle>
            <ErrorText message={error} />
            {isAdmin ? (
              <Card>
                <Title>Добавить автомобиль</Title>
                <Field label="Госномер" value={plate} onChangeText={setPlate} />
                <Field label="Модель" value={model} onChangeText={setModel} />
                <Field label="Грузоподъёмность" value={capacity} onChangeText={setCapacity} keyboardType="decimal-pad" />
                <PrimaryButton label="Сохранить" onPress={onCreate} loading={saving} />
              </Card>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Title>{item.plate_number}</Title>
            <Subtitle>
              {item.model ?? 'Модель не указана'}
              {item.capacity != null ? ` · ${item.capacity}` : ''}
            </Subtitle>
            {isAdmin ? (
              <MenuButton label="Удалить" onPress={() => onDelete(item)} variant="danger" />
            ) : null}
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Автомобилей пока нет" />}
      />
    </View>
  );
}
