import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FilterChipRow } from '../components/FilterChipRow';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { FormBottomModal } from '../components/FormBottomModal';
import { FinanceSummaryBar } from '../components/ListScreenParts';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
import {
  createSalaryPayment,
  deleteSalaryPayment,
  getSalaryAccruedPreview,
  getSalaryDebts,
  getSalarySummary,
  listSalaryPayments,
} from '../api/salary';
import { screenUi } from '../styles/screenUi';
import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';
import { formatDateTimeRu, getReportPeriodBounds } from '../utils/datePeriods';
import { withFallback } from '../utils/safeRequest';
import type {
  Driver,
  DriverDebtSummary,
  DriverPaymentMethod,
  DriverPaymentRecord,
  DriverPaymentType,
  DriverSalarySummary,
} from '../types';

const initialSummary: DriverSalarySummary = {
  driver_id: 0,
  gross: 0,
  paid: 0,
  deducted: 0,
  debt: 0,
};

const defaultMonth = getReportPeriodBounds('month');

const initialForm = {
  driver_id: 0,
  type: 'salary' as DriverPaymentType,
  method: 'cash' as DriverPaymentMethod,
  amount: '',
  period_start: defaultMonth.from,
  period_end: defaultMonth.to,
  note: '',
};

type SalaryTab = 'payments' | 'accruals' | 'debts';
type SalaryListItem = DriverPaymentRecord | DriverDebtSummary;

const SALARY_TABS = [
  { id: 'payments' as const, label: '💳 Выплаты' },
  { id: 'accruals' as const, label: '📈 Начисления' },
  { id: 'debts' as const, label: '⚖️ Долги' },
];

const paymentTypeLabels: Record<DriverPaymentType, string> = {
  salary: '💵 Зарплата',
  advance: '💳 Аванс',
  bonus: '🎁 Премия',
  deduction: '➖ Удержание',
};

const paymentMethodLabels: Record<DriverPaymentMethod, string> = {
  cash: '💵 Наличные',
  noncash: '🏦 Безнал',
};

export function SalaryScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [records, setRecords] = useState<DriverPaymentRecord[]>([]);
  const [debts, setDebts] = useState<DriverDebtSummary[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState(defaultMonth.from);
  const [dateTo, setDateTo] = useState(defaultMonth.to);
  const [summary, setSummary] = useState<DriverSalarySummary>(initialSummary);
  const [form, setForm] = useState(initialForm);
  const [formVisible, setFormVisible] = useState(false);
  const [previewAccrued, setPreviewAccrued] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SalaryTab>('payments');

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === selectedDriverId) ?? null,
    [drivers, selectedDriverId]
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      const summaryParams =
        dateFrom.trim() && dateTo.trim() ? { from: dateFrom.trim(), to: dateTo.trim() } : undefined;

      const [driversData, recordsData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(() => listSalaryPayments(selectedDriverId ?? undefined), []),
      ]);
      setDrivers(driversData);
      setRecords(recordsData);
      setDebts(await withFallback(() => getSalaryDebts(), []));
      if (selectedDriverId) {
        setSummary(
          await withFallback(() => getSalarySummary(selectedDriverId, summaryParams), initialSummary)
        );
      } else {
        setSummary(initialSummary);
      }
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить зарплаты'));
    }
  }, [selectedDriverId, dateFrom, dateTo]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  useEffect(() => {
    if (!formVisible || !form.driver_id || !form.period_start || !form.period_end) {
      setPreviewAccrued(null);
      return;
    }

    let cancelled = false;
    getSalaryAccruedPreview(form.driver_id, form.period_start, form.period_end)
      .then((data) => {
        if (!cancelled) setPreviewAccrued(data.net);
      })
      .catch(() => {
        if (!cancelled) setPreviewAccrued(null);
      });

    return () => {
      cancelled = true;
    };
  }, [formVisible, form.driver_id, form.period_start, form.period_end]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const driverChips = useMemo(
    () => [
      { id: 'all', label: '👥 Все' },
      ...drivers.map((d) => ({ id: String(d.id), label: d.full_name ?? d.email })),
    ],
    [drivers]
  );

  const openForm = () => {
    setForm({
      ...initialForm,
      period_start: dateFrom.trim() || defaultMonth.from,
      period_end: dateTo.trim() || defaultMonth.to,
      driver_id: selectedDriverId ?? 0,
    });
    setFormVisible(true);
  };

  const onCreate = async () => {
    const amount = Number(form.amount.replace(',', '.'));
    if (!form.driver_id) {
      Alert.alert('Ошибка', 'Выберите водителя');
      return;
    }
    if (!form.period_start.trim() || !form.period_end.trim()) {
      Alert.alert('Ошибка', 'Укажите период начисления');
      return;
    }
    if (form.period_start > form.period_end) {
      Alert.alert('Ошибка', 'Начало периода не может быть позже конца');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }

    setSaving(true);
    try {
      await createSalaryPayment({
        driver_id: form.driver_id,
        type: form.type,
        amount,
        method: form.type === 'deduction' ? undefined : form.method,
        period_start: form.period_start.trim(),
        period_end: form.period_end.trim(),
        note: form.note.trim() || undefined,
      });
      setForm(initialForm);
      setFormVisible(false);
      await load();
      Alert.alert('Готово', 'Выплата сохранена');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить выплату'));
    } finally {
      setSaving(false);
    }
  };

  const onExportExcel = async () => {
    if (!dateFrom.trim() || !dateTo.trim()) {
      Alert.alert('Период', 'Укажите даты «с» и «по» для выгрузки табеля');
      return;
    }
    setExporting(true);
    try {
      const query = buildExportQuery({
        date_from: dateFrom.trim(),
        date_to: dateTo.trim(),
        driver_id: selectedDriverId ?? undefined,
      });
      await downloadAndShareExcel(`/export/salary${query}`, 'zarplatny_tabel.xlsx');
    } finally {
      setExporting(false);
    }
  };

  const onDelete = (id: number) => {
    Alert.alert('Удалить выплату?', `Запись #${id} будет удалена`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSalaryPayment(id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить выплату'));
          }
        },
      },
    ]);
  };

  if (loading && records.length === 0) return <LoadingScreen label="Загрузка зарплат…" />;

  return (
    <View style={screenUi.container}>
      <FlatList<SalaryListItem>
        data={activeTab === 'payments' ? records : debts}
        keyExtractor={(item) =>
          activeTab === 'payments'
            ? String((item as DriverPaymentRecord).id)
            : String((item as DriverDebtSummary).driver_id)
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="💵 Зарплаты" actionLabel="+ Выплата" onAction={openForm} />
            <ScreenHero title="💼 Зарплатный учёт" subtitle="Выплаты, начисления по рейсам, долги" />
            <FilterChipRow items={SALARY_TABS} activeId={activeTab} onSelect={setActiveTab} />
            <DateRangePicker
              from={dateFrom}
              to={dateTo}
              onChangeFrom={setDateFrom}
              onChangeTo={setDateTo}
            />
            <Text style={screenUi.filterLabel}>Водитель:</Text>
            <FilterChipRow
              items={driverChips}
              activeId={selectedDriverId == null ? 'all' : String(selectedDriverId)}
              onSelect={(id) => setSelectedDriverId(id === 'all' ? null : Number(id))}
            />
            {selectedDriver ? (
              <FinanceSummaryBar
                revenue={summary.gross}
                paid={summary.paid}
                debt={summary.debt}
                revenueLabel="Начислено"
                paidLabel="Выплачено"
                debtLabel="Остаток"
              />
            ) : null}
            {debts.length > 0 ? (
              <View style={[screenUi.card, { marginBottom: 8 }]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
                  📋 Задолженность водителям
                </Text>
                {debts.slice(0, 5).map((item) => (
                  <Text key={item.driver_id} style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                    {item.driver_name ?? `#${item.driver_id}`}: {item.debt.toFixed(0)} ₽
                  </Text>
                ))}
              </View>
            ) : null}
            <ExcelExportButton
              loading={exporting}
              label="📥 Зарплатный табель Excel"
              onPress={() => void onExportExcel()}
            />
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              Формат как в бухгалтерии: начислено по рейсам, нал/безнал, долг
            </Text>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === 'payments') {
            const payment = item as DriverPaymentRecord;
            return (
              <Pressable style={[screenUi.card, { borderRadius: 14 }]} onLongPress={() => onDelete(payment.id)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>{payment.driver_name}</Text>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#16a34a' }}>{payment.amount} ₽</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  {paymentTypeLabels[payment.type]}
                  {payment.method ? ` · ${paymentMethodLabels[payment.method]}` : ''}
                </Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  📅 {formatDateTimeRu(payment.created_at)}
                </Text>
              </Pressable>
            );
          }

          const debt = item as DriverDebtSummary;
          const accent = activeTab === 'accruals' ? debt.gross : debt.debt;
          const accentColor = activeTab === 'accruals' ? '#2563eb' : debt.debt > 0 ? '#ef4444' : '#16a34a';
          return (
            <View style={[screenUi.card, { borderRadius: 14, borderLeftWidth: 4, borderLeftColor: accentColor }]}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>
                {debt.driver_name ?? `#${debt.driver_id}`}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: accentColor, marginTop: 6 }}>
                {accent.toFixed(0)} ₽
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                Начислено: {debt.gross.toFixed(0)} ₽ · Выплачено: {debt.paid.toFixed(0)} ₽
              </Text>
              {activeTab === 'debts' ? (
                <View style={{ marginTop: 8 }}>
                  <StatusBadge
                    label={debt.debt > 0 ? 'Есть долг' : 'Закрыто'}
                    color={debt.debt > 0 ? '#ef4444' : '#16a34a'}
                  />
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={screenUi.emptyText}>
            {activeTab === 'payments' ? 'Выплат пока нет' : 'Данных пока нет'}
          </Text>
        }
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Новая выплата"
        saveLabel="Сохранить выплату"
        saving={saving}
        onSave={onCreate}
        onClose={() => {
          setFormVisible(false);
          setForm(initialForm);
        }}
      >
        <Text style={screenUi.fieldLabel}>Водитель</Text>
        {drivers.map((d) => (
          <MenuButton
            key={d.id}
            label={`${form.driver_id === d.id ? '✅ ' : ''}${d.full_name ?? d.email}`}
            onPress={() => setForm((prev) => ({ ...prev, driver_id: d.id }))}
            variant={form.driver_id === d.id ? 'default' : 'secondary'}
          />
        ))}
        <Field
          label="Начало периода (YYYY-MM-DD)"
          value={form.period_start}
          onChangeText={(value) => setForm((prev) => ({ ...prev, period_start: value }))}
        />
        <Field
          label="Конец периода (YYYY-MM-DD)"
          value={form.period_end}
          onChangeText={(value) => setForm((prev) => ({ ...prev, period_end: value }))}
        />
        {previewAccrued != null ? (
          <Text style={{ fontSize: 13, color: '#2563eb', marginBottom: 8, fontWeight: '600' }}>
            Начислено по рейсам за период: {previewAccrued.toFixed(0)} ₽
          </Text>
        ) : null}
        <Field
          label="Сумма выплаты, ₽"
          value={form.amount}
          onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
          keyboardType="decimal-pad"
        />
        {form.type !== 'deduction' ? (
          <>
            <Text style={screenUi.fieldLabel}>Способ выплаты</Text>
            {(Object.keys(paymentMethodLabels) as DriverPaymentMethod[]).map((method) => (
              <MenuButton
                key={method}
                label={`${form.method === method ? '✅ ' : ''}${paymentMethodLabels[method]}`}
                onPress={() => setForm((prev) => ({ ...prev, method }))}
                variant={form.method === method ? 'default' : 'secondary'}
              />
            ))}
          </>
        ) : null}
        <Field
          label="Комментарий"
          value={form.note}
          onChangeText={(value) => setForm((prev) => ({ ...prev, note: value }))}
        />
        <Text style={screenUi.fieldLabel}>Тип операции</Text>
        {(Object.keys(paymentTypeLabels) as DriverPaymentType[]).map((type) => (
          <MenuButton
            key={type}
            label={`${form.type === type ? '✅ ' : ''}${paymentTypeLabels[type]}`}
            onPress={() => setForm((prev) => ({ ...prev, type }))}
            variant={form.type === type ? 'default' : 'secondary'}
          />
        ))}
      </FormBottomModal>
    </View>
  );
}
