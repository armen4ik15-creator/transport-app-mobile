import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, EmptyText, ErrorText, Field, LoadingScreen, MenuButton, PrimaryButton, Subtitle, Title } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createMaterial, deleteMaterial, listMaterials } from '../api/materials';
import { useAuth } from '../auth/AuthContext';
import type { Material } from '../types';

export function MaterialsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [materials, setMaterials] = useState<Material[]>([]);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('т');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setMaterials(await listMaterials());
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить материалы'));
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
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название материала');
      return;
    }
    const parsedPrice = price.trim() ? Number(price.replace(',', '.')) : null;
    setSaving(true);
    try {
      await createMaterial({
        name: name.trim(),
        unit: unit.trim() || 'т',
        price_per_ton: parsedPrice != null && Number.isFinite(parsedPrice) ? parsedPrice : null,
      });
      setName('');
      setUnit('т');
      setPrice('');
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать материал'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (id: number, materialName: string) => {
    if (!isAdmin) return;
    Alert.alert('Удалить материал?', materialName, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMaterial(id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить материал'));
          }
        },
      },
    ]);
  };

  if (loading && materials.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={materials}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Материалы</Title>
            <Subtitle>Справочник материалов и базовых ставок</Subtitle>
            <ErrorText message={error} />
            {isAdmin ? (
              <Card>
                <Title>Добавить материал</Title>
                <Field label="Название" value={name} onChangeText={setName} />
                <Field label="Ед. измерения" value={unit} onChangeText={setUnit} />
                <Field label="Цена за тонну (опционально)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
                <PrimaryButton label="Сохранить" onPress={onCreate} loading={saving} />
              </Card>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Title>{item.name}</Title>
            <Subtitle>
              Ед.: {item.unit} {item.price_per_ton != null ? `· ${item.price_per_ton} ₽/т` : ''}
            </Subtitle>
            {isAdmin ? (
              <MenuButton label="Удалить" onPress={() => onDelete(item.id, item.name)} variant="danger" />
            ) : null}
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Материалы пока не добавлены" />}
      />
    </View>
  );
}
