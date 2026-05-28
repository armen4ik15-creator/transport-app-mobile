import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchBar } from '../components/SearchBar';
import { ErrorText, Field, LoadingScreen } from '../components/ui';
import { createContractor, deleteContractor, listContractors } from '../api/contractors';
import { apiErrorMessage } from '../api/client';
import { screenUi } from '../styles/screenUi';
import type { Contractor } from '../types';

export function ContractorsScreen() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('company');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setContractors(await listContractors());
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось загрузить');
      setError(msg);
      Alert.alert('Ошибка', msg);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return contractors;
    return contractors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
    );
  }, [contractors, searchQuery]);

  const resetForm = () => {
    setName('');
    setType('company');
    setPhone('');
    setAddress('');
  };

  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Заполните', 'Название обязательно');
      return;
    }
    setCreating(true);
    try {
      await createContractor({
        name: name.trim(),
        type,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      resetForm();
      setFormVisible(false);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const onDelete = (c: Contractor) => {
    Alert.alert('Удалить?', c.name, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteContractor(c.id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e));
          }
        },
      },
    ]);
  };

  if (loading && contractors.length === 0) return <LoadingScreen label="Загрузка контрагентов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="💰 Контрагенты"
              showBack={false}
              actionLabel="+ Добавить"
              onAction={() => setFormVisible(true)}
            />
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Поиск по названию…" />
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Всего</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{contractors.length}</Text>
              </View>
              <View style={screenUi.sumDivider} />
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Показано</Text>
                <Text style={[screenUi.sumValue, { color: '#16a34a' }]}>{filtered.length}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card} onLongPress={() => onDelete(item)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  #{item.id} · {item.type}
                </Text>
                {item.phone ? (
                  <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>📞 {item.phone}</Text>
                ) : null}
                {item.address ? (
                  <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>📍 {item.address}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={screenUi.emptyText}>Контрагентов пока нет</Text>
        }
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Новый контрагент"
        saving={creating}
        onSave={onCreate}
        onClose={() => {
          setFormVisible(false);
          resetForm();
        }}
      >
        <Field label="Название *" value={name} onChangeText={setName} />
        <Field label="Тип (company/individual/gov)" value={type} onChangeText={setType} />
        <Field label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Адрес" value={address} onChangeText={setAddress} />
      </FormBottomModal>
    </View>
  );
}
