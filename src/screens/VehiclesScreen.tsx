import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { SearchBar } from '../components/SearchBar';
import { ErrorText, Field, LoadingScreen } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createVehicle, deleteVehicle, listVehicles } from '../api/vehicles';
import { useAuth } from '../auth/AuthContext';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { Vehicle } from '../types';

export function VehiclesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formVisible, setFormVisible] = useState(false);
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

  const filtered = vehicles.filter((v) => {
    const q = searchQuery.trim().toLowerCase();
    return !q || v.plate_number.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q);
  });

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
      setFormVisible(false);
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

  if (loading && vehicles.length === 0) return <LoadingScreen label="Загрузка автомобилей…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="🚛 Автомобили"
              actionLabel={isAdmin ? '+ Добавить' : undefined}
              onAction={isAdmin ? () => setFormVisible(true) : undefined}
            />
            <ScreenHero
              title="🚛 Парк автомобилей"
              subtitle={`${filtered.length} в справочнике`}
            />
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Поиск по номеру…" />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={screenUi.card}
            onPress={() => navigation.navigate('VehicleDocuments', { vehicleId: item.id })}
            onLongPress={() => isAdmin && onDelete(item)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{item.plate_number}</Text>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  {item.model ?? 'Модель не указана'}
                  {item.capacity != null ? ` · ⚖️ ${item.capacity}` : ''}
                </Text>
                <Text style={{ fontSize: 12, color: colors.primary, marginTop: 6 }}>📁 Документы машины</Text>
              </View>
              {isAdmin ? (
                <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                  <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Автомобилей пока нет</Text>}
      />

      {isAdmin ? (
        <FormBottomModal
          visible={formVisible}
          title="➕ Новый автомобиль"
          saving={saving}
          onSave={onCreate}
          onClose={() => {
            setFormVisible(false);
            setPlate('');
            setModel('');
            setCapacity('');
          }}
        >
          <Field label="Госномер" value={plate} onChangeText={setPlate} />
          <Field label="Модель" value={model} onChangeText={setModel} />
          <Field label="Грузоподъёмность" value={capacity} onChangeText={setCapacity} keyboardType="decimal-pad" />
        </FormBottomModal>
      ) : null}
    </View>
  );
}
