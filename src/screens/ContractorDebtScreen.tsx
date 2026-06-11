import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ExpenseDatePicker } from '../components/ExpenseDatePicker';
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
import { formatDateTimeRu, formatMoney, todayIso } from '../utils/datePeriods';
import { withFallback } from '../utils/safeRequest';
import type { Contractor, ContractorDebtSummary, ContractorPaymentRecord } from '../types';

const initialForm = {
  contractor_id: 0,
  amount: '',
  payment_date: todayIso(),
  note: '',
};

type ContractorDebtRoute = RouteProp<RootStackParamList, 'ContractorDebt'>;

function paymentStatusLabel(debt: number, paid: number): { text: string; color: string } {
  if (debt <= 0 && paid > 0) return { text: '✅ Оплачено', color: '#16a34a' };
  if (paid > 0 && debt > 0) return { text: '⏳ Частично', color: '#d97706' };
  return { text: '❌ Не оплачено', color: '#ef4444' };
}

function paymentButtonLabel(debt: number, paid: number): string {
  if (debt <= 0 && paid > 0) return '➕ Доп. оплата';
  if (paid > 0) return '💳 Доплатить';
  return '💳 Оплатить';
}

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
  const statusInfo = paymentStatusLabel(displaySummary.debt, displaySummary.paid);
  const footerButtonLabel = selectedSummary
    ? paymentButtonLabel(selectedSummary.debt, selectedSummary.paid)
    : '➕ Привязать платёж';

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
      payment_date: todayIso(),
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.payment_date)) {
      Alert.alert('Ошибка', 'Укажите дату оплаты');
      return;
    }
    setSaving(true);
    try {
      await createContractorPayment({
        contractor_id: form.contractor_id,
        amount,
        payment_date: form.payment_date,
        note: form.note.trim() || undefined,
      });
      setForm({ ...initialForm, payment_date: todayIso() });
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="💳 Оплаты контрагентов" />
            <ScreenHero
              title="🏦 Баланс контрагентов"
              subtitle={
                selectedSummary
                  ? `${selectedSummary.contractor_name} · навезли / оплатили / долг`
                  : 'Сводка по всем контрагентам'
              }
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: statusInfo.color }}>
                {statusInfo.text}
              </Text>
              {selectedSummary && selectedSummary.paid > 0 ? (
                <Text style={{ fontSize: 13, color: '#6b7280' }}>
                  Последняя оплата: {formatMoney(selectedSummary.paid)} ₽
                </Text>
              ) : null}
            </View>

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

            {summary.length > 0 ? (
              <View style={[screenUi.card, { marginBottom: 12 }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 }}>
                  📋 По контрагентам
                </Text>
                {summary.map((item) => {
                  const rowStatus = paymentStatusLabel(item.debt, item.paid);
                  const rowButtonLabel = paymentButtonLabel(item.debt, item.paid);
                  return (
                    <View
                      key={item.contractor_id}
                      style={{
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderTopColor: '#f3f4f6',
                      }}
                    >
                      <Pressable onPress={() => setSelectedContractorId(item.contractor_id)}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                          {item.contractor_name}
                        </Text>
                        <Text style={{ fontSize: 12, color: rowStatus.color, marginBottom: 6 }}>
                          {rowStatus.text}
                          {item.paid > 0 ? ` · оплачено ${formatMoney(item.paid)} ₽` : ''}
                        </Text>
                        <ContractorFinanceRow
                          accrued={item.accrued}
                          paid={item.paid}
                          debt={item.debt}
                          compact
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => openPaymentForm(item.contractor_id)}
                        style={{
                          marginTop: 8,
                          alignSelf: 'flex-start',
                          backgroundColor: item.debt > 0 ? '#2563eb' : '#f3f4f6',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: item.debt > 0 ? '#ffffff' : '#374151',
                          }}
                        >
                          {rowButtonLabel}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
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
                  📅 {item.payment_date ?? formatDateTimeRu(item.created_at).slice(0, 10)}
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
            Оплат пока нет. Нажмите «Привязать платёж», когда контрагент переведёт деньги.
          </Text>
        }
      />

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        }}
      >
        <Pressable
          onPress={() => openPaymentForm()}
          style={{
            backgroundColor: displaySummary.debt > 0 ? '#2563eb' : '#16a34a',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>{footerButtonLabel}</Text>
        </Pressable>
      </View>

      <FormBottomModal
        visible={formVisible}
        title="➕ Привязать платёж"
        saveLabel="Сохранить оплату"
        saving={saving}
        onSave={onCreatePayment}
        onClose={() => {
          setFormVisible(false);
          setForm({ ...initialForm, payment_date: todayIso() });
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
        <ExpenseDatePicker
          value={form.payment_date}
          onChange={(iso) => setForm((prev) => ({ ...prev, payment_date: iso }))}
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
