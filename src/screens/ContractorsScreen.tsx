import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
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
import {
  createContractor,
  deleteContractor,
  listContractors,
} from '../api/contractors';
import { apiErrorMessage } from '../api/client';
import type { Contractor } from '../types';

export function ContractorsScreen() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
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
      setName('');
      setType('company');
      setPhone('');
      setAddress('');
      setShowForm(false);
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

  if (loading && contractors.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={contractors}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Контрагенты ({contractors.length})</Title>
            <ErrorText message={error} />
            {showForm ? (
              <Card>
                <Field label="Название *" value={name} onChangeText={setName} />
                <Field label="Тип (company/individual/gov)" value={type} onChangeText={setType} />
                <Field label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <Field label="Адрес" value={address} onChangeText={setAddress} />
                <PrimaryButton label="Сохранить" onPress={onCreate} loading={creating} />
                <MenuButton label="Отмена" onPress={() => setShowForm(false)} variant="secondary" />
              </Card>
            ) : (
              <MenuButton label="➕ Добавить контрагента" onPress={() => setShowForm(true)} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>#{item.id}</Subtitle>
            <Title>{item.name}</Title>
            <Subtitle>Тип: {item.type}</Subtitle>
            {item.phone ? <Subtitle>📞 {item.phone}</Subtitle> : null}
            {item.address ? <Subtitle>📍 {item.address}</Subtitle> : null}
            <MenuButton label="🗑 Удалить" onPress={() => onDelete(item)} variant="danger" />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Контрагентов пока нет" />}
      />
    </View>
  );
}
