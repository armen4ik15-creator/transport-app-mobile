import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
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
import { listContractors } from '../api/contractors';
import {
  createContractorPayment,
  deleteContractorPayment,
  getContractorDebtSummary,
  listContractorPayments,
} from '../api/contractorPayments';
import { withFallback } from '../utils/safeRequest';
import type { Contractor, ContractorDebtSummary, ContractorPaymentRecord } from '../types';

const initialForm = {
  contractor_id: 0,
  amount: '',
  note: '',
};

export function ContractorDebtScreen() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [summary, setSummary] = useState<ContractorDebtSummary[]>([]);
  const [payments, setPayments] = useState<ContractorPaymentRecord[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSummary = useMemo(
    () => summary.find((item) => item.contractor_id === selectedContractorId) ?? null,
    [selectedContractorId, summary]
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      const [contractorsData, summaryData, paymentsData] = await Promise.all([
        withFallback(() => listContractors(), []),
        withFallback(() => getContractorDebtSummary(), []),
        withFallback(() => listContractorPayments(selectedContractorId ?? undefined), []),
      ]);
      setContractors(contractorsData);
      setSummary(summaryData);
      setPayments(paymentsData);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить долги контрагентов'));
    }
  }, [selectedContractorId]);

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

  const onCreatePayment = async () => {
    const amount = Number(form.amount.replace(',', '.'));
    if (!form.contractor_id) {
      Alert.alert('Ошибка', 'Выберите контрагента');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    setSaving(true);
    try {
      await createContractorPayment({
        contractor_id: form.contractor_id,
        amount,
        note: form.note.trim() || undefined,
      });
      setForm(initialForm);
      await load();
      Alert.alert('Успех', 'Оплата контрагенту сохранена');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить оплату'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (id: number) => {
    Alert.alert('Удалить оплату?', `Запись #${id} будет удалена`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteContractorPayment(id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить оплату'));
          }
        },
      },
    ]);
  };

  if (loading && payments.length === 0 && summary.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Долги контрагентов</Title>
            <Subtitle>Начисления по заказам и фактические оплаты</Subtitle>
            <ErrorText message={error} />

            <Card>
              <Subtitle>Фильтр по контрагенту</Subtitle>
              <MenuButton
                label={selectedContractorId ? 'Показать всех' : 'Все контрагенты'}
                onPress={() => setSelectedContractorId(null)}
                variant="secondary"
              />
              {contractors.map((contractor) => (
                <MenuButton
                  key={contractor.id}
                  label={`${selectedContractorId === contractor.id ? '✅ ' : ''}${contractor.name}`}
                  onPress={() => setSelectedContractorId(contractor.id)}
                  variant={selectedContractorId === contractor.id ? 'default' : 'secondary'}
                />
              ))}
              <MenuButton label="Обновить" onPress={load} variant="secondary" />
              {selectedSummary ? (
                <>
                  <Subtitle>Начислено: {selectedSummary.accrued.toFixed(2)} ₽</Subtitle>
                  <Subtitle>Оплачено: {selectedSummary.paid.toFixed(2)} ₽</Subtitle>
                  <Title>Долг: {selectedSummary.debt.toFixed(2)} ₽</Title>
                </>
              ) : null}
            </Card>

            <Card>
              <Title>Новая оплата</Title>
              <Subtitle>Контрагент</Subtitle>
              {contractors.map((contractor) => (
                <MenuButton
                  key={contractor.id}
                  label={`${form.contractor_id === contractor.id ? '✅ ' : ''}${contractor.name}`}
                  onPress={() => setForm((prev) => ({ ...prev, contractor_id: contractor.id }))}
                  variant={form.contractor_id === contractor.id ? 'default' : 'secondary'}
                />
              ))}
              <Field
                label="Сумма оплаты"
                value={form.amount}
                onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
                keyboardType="decimal-pad"
              />
              <Field
                label="Комментарий"
                value={form.note}
                onChangeText={(value) => setForm((prev) => ({ ...prev, note: value }))}
              />
              <PrimaryButton label="Сохранить оплату" onPress={onCreatePayment} loading={saving} />
            </Card>

            <Card>
              <Title>Общий реестр долгов</Title>
              {summary.slice(0, 20).map((item) => (
                <Subtitle key={item.contractor_id}>
                  {item.contractor_name}: долг {item.debt.toFixed(2)} ₽ (начислено {item.accrued.toFixed(2)} ₽, оплачено {item.paid.toFixed(2)} ₽)
                </Subtitle>
              ))}
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>
              #{item.id} · {item.amount.toFixed(2)} ₽
            </Subtitle>
            <Title>{item.contractor_name}</Title>
            <Subtitle>{item.created_at}</Subtitle>
            {item.note ? <Subtitle>{item.note}</Subtitle> : null}
            <MenuButton label="Удалить" onPress={() => onDelete(item.id)} variant="danger" />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Оплат контрагентам пока нет" />}
      />
    </View>
  );
}
