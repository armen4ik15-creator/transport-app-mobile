import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchBar } from '../components/SearchBar';
import { ErrorText, Field, LoadingScreen } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createMaterial, deleteMaterial, listMaterials } from '../api/materials';
import { useAuth } from '../auth/AuthContext';
import { screenUi } from '../styles/screenUi';
import type { Material } from '../types';

export function MaterialsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formVisible, setFormVisible] = useState(false);
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

  const filtered = materials.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    return !q || m.name.toLowerCase().includes(q);
  });

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
      setFormVisible(false);
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

  if (loading && materials.length === 0) return <LoadingScreen label="Загрузка материалов…" />;

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
              title="🧱 Материалы"
              actionLabel={isAdmin ? '+ Добавить' : undefined}
              onAction={isAdmin ? () => setFormVisible(true) : undefined}
            />
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Поиск материала…" />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card} onLongPress={() => isAdmin && onDelete(item.id, item.name)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{item.name}</Text>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  Ед.: {item.unit}
                  {item.price_per_ton != null ? ` · 💰 ${item.price_per_ton} ₽/т` : ''}
                </Text>
              </View>
              {isAdmin ? (
                <Pressable onPress={() => onDelete(item.id, item.name)} hitSlop={8}>
                  <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Материалы пока не добавлены</Text>}
      />

      {isAdmin ? (
        <FormBottomModal
          visible={formVisible}
          title="➕ Новый материал"
          saving={saving}
          onSave={onCreate}
          onClose={() => {
            setFormVisible(false);
            setName('');
            setUnit('т');
            setPrice('');
          }}
        >
          <Field label="Название" value={name} onChangeText={setName} />
          <Field label="Ед. измерения" value={unit} onChangeText={setUnit} />
          <Field label="Цена за тонну (опционально)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        </FormBottomModal>
      ) : null}
    </View>
  );
}
