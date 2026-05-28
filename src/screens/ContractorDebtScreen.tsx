import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FilterChipRow } from '../components/FilterChipRow';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listContractors } from '../api/contractors';
import {
  createContractorPayment,
  deleteContractorPayment,
  getContractorDebtSummary,
  listContractorPayments,
} from '../api/contractorPayments';
import { screenUi } from '../styles/screenUi';
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
  const [formVisible, setFormVisible] = useState(false);
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

  const contractorChips = useMemo(
    () => [
      { id: 'all', label: '🏢 Все' },
      ...contractors.map((c) => ({ id: String(c.id), label: c.name })),
    ],
    [contractors]
  );

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
      setFormVisible(false);
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

  if (loading && payments.length === 0 && summary.length === 0) return <LoadingScreen label="Загрузка долгов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="🏦 Долги контрагентов" actionLabel="+ Оплата" onAction={() => setFormVisible(true)} />
            <Text style={screenUi.filterLabel}>Контрагент:</Text>
            <FilterChipRow
              items={contractorChips}
              activeId={selectedContractorId == null ? 'all' : String(selectedContractorId)}
              onSelect={(id) => setSelectedContractorId(id === 'all' ? null : Number(id))}
            />
            {selectedSummary ? (
              <View style={screenUi.summaryBar}>
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Начислено</Text>
                  <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>
                    {selectedSummary.accrued.toFixed(0)} ₽
                  </Text>
                </View>
                <View style={screenUi.sumDivider} />
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Долг</Text>
                  <Text style={[screenUi.sumValue, { color: '#ef4444' }]}>
                    {selectedSummary.debt.toFixed(0)} ₽
                  </Text>
                </View>
              </View>
            ) : null}
            {summary.length > 0 ? (
              <View style={[screenUi.card, { marginBottom: 8 }]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
                  📋 Общий реестр долгов
                </Text>
                {summary.slice(0, 5).map((item) => (
                  <Text key={item.contractor_id} style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                    {item.contractor_name}: {item.debt.toFixed(0)} ₽
                  </Text>
                ))}
              </View>
            ) : null}
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card} onLongPress={() => onDelete(item.id)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{item.contractor_name}</Text>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#16a34a' }}>{item.amount.toFixed(2)} ₽</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>#{item.id} · {item.created_at}</Text>
            {item.note ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4, fontStyle: 'italic' }}>{item.note}</Text>
            ) : null}
            <Pressable onPress={() => onDelete(item.id)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#ef4444', fontSize: 13 }}>🗑 Удалить</Text>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Оплат контрагентам пока нет</Text>}
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Новая оплата"
        saveLabel="Сохранить оплату"
        saving={saving}
        onSave={onCreatePayment}
        onClose={() => {
          setFormVisible(false);
          setForm(initialForm);
        }}
      >
        <Text style={screenUi.fieldLabel}>Контрагент</Text>
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
      </FormBottomModal>
    </View>
  );
}
