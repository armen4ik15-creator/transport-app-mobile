import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { FilterChipRow } from '../components/FilterChipRow';
import { FormBottomModal } from '../components/FormBottomModal';
import { ContractorFinanceRow, FinanceSummaryBar } from '../components/ListScreenParts';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listContractors } from '../api/contractors';
import {
  createContractorPayment,
  deleteContractorPayment,
  getContractorDebtSummary,
  listContractorPayments,
} from '../api/contractorPayments';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { formatDateTimeRu, formatMoney } from '../utils/datePeriods';
import { withFallback } from '../utils/safeRequest';
import type { Contractor, ContractorDebtSummary, ContractorPaymentRecord } from '../types';

const initialForm = {
  contractor_id: 0,
  amount: '',
  note: '',
};

type ContractorDebtRoute = RouteProp<RootStackParamList, 'ContractorDebt'>;

export function ContractorDebtScreen() {
  const route = useRoute<ContractorDebtRoute>();
  const initialContractorId = route.params?.contractorId ?? null;

  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [summary, setSummary] = useState<ContractorDebtSummary[]>([]);
  const [payments, setPayments] = useState<ContractorPaymentRecord[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<number | null>(initialContractorId);
  const [form, setForm] = useState(() => ({
    ...initialForm,
    contractor_id: initialContractorId ?? 0,
  }));
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSummary = useMemo(
    () => summary.find((item) => item.contractor_id === selectedContractorId) ?? null,
    [selectedContractorId, summary]
  );

  const totalsSummary = useMemo(
    () =>
      summary.reduce(
        (acc, row) => ({
          contractor_id: 0,
          contractor_name: 'Все контрагенты',
          accrued: acc.accrued + row.accrued,
          paid: acc.paid + row.paid,
          debt: acc.debt + row.debt,
        }),
        { contractor_id: 0, contractor_name: 'Все контрагенты', accrued: 0, paid: 0, debt: 0 }
      ),
    [summary]
  );

  const displaySummary = selectedSummary ?? totalsSummary;

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
      setError(apiErrorMessage(e, 'Не удалось загрузить оплаты контрагентов'));
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

  const openPaymentForm = (contractorId?: number) => {
    setForm({
      ...initialForm,
      contractor_id: contractorId ?? selectedContractorId ?? 0,
    });
    setFormVisible(true);
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
      setFormVisible(false);
      await load();
      Alert.alert('Готово', 'Оплата от контрагента сохранена');
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

  if (loading && payments.length === 0 && summary.length === 0) {
    return <LoadingScreen label="Загрузка оплат…" />;
  }

  return (
    <View style={screenUi.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="💳 Оплаты контрагентов"
              actionLabel="+ Оплата"
              onAction={() => openPaymentForm()}
            />
            <ScreenHero
              title="🏦 Баланс контрагентов"
              subtitle={
                selectedSummary
                  ? `${selectedSummary.contractor_name} · навезли / оплатили / долг`
                  : 'Сводка по всем контрагентам'
              }
            />

            <FinanceSummaryBar
              revenue={displaySummary.accrued}
              paid={displaySummary.paid}
              debt={displaySummary.debt}
              revenueLabel="Навезли"
              paidLabel="Оплатили"
              debtLabel="Остаток"
            />

            <Text style={screenUi.filterLabel}>Контрагент:</Text>
            <FilterChipRow
              items={contractorChips}
              activeId={selectedContractorId == null ? 'all' : String(selectedContractorId)}
              onSelect={(id) => setSelectedContractorId(id === 'all' ? null : Number(id))}
            />

            {summary.length > 0 && selectedContractorId == null ? (
              <View style={[screenUi.card, { marginBottom: 12 }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
                  📋 По контрагентам
                </Text>
                {summary.map((item) => (
                  <Pressable
                    key={item.contractor_id}
                    onPress={() => setSelectedContractorId(item.contractor_id)}
                    style={{
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderTopColor: '#f3f4f6',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                      {item.contractor_name}
                    </Text>
                    <ContractorFinanceRow
                      accrued={item.accrued}
                      paid={item.paid}
                      debt={item.debt}
                      compact
                    />
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
              🧾 История оплат
              {selectedSummary ? ` · ${selectedSummary.contractor_name}` : ''}
            </Text>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card} onLongPress={() => onDelete(item.id)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                  {item.contractor_name}
                </Text>
                <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                  📅 {formatDateTimeRu(item.created_at)}
                </Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#16a34a' }}>
                +{formatMoney(item.amount)} ₽
              </Text>
            </View>
            {item.note ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 6, fontStyle: 'italic' }}>
                {item.note}
              </Text>
            ) : null}
            <Pressable onPress={() => onDelete(item.id)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#ef4444', fontSize: 13 }}>🗑 Удалить</Text>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={screenUi.emptyText}>
            Оплат пока нет. Нажмите «+ Оплата», когда контрагент переведёт деньги.
          </Text>
        }
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Оплата от контрагента"
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
          label="Сумма оплаты, ₽"
          value={form.amount}
          onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
          keyboardType="decimal-pad"
        />
        <Field
          label="Комментарий (необязательно)"
          value={form.note}
          onChangeText={(value) => setForm((prev) => ({ ...prev, note: value }))}
        />
      </FormBottomModal>
    </View>
  );
}
