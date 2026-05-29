import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FilterChipRow } from '../components/FilterChipRow';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { listDrivers } from '../api/drivers';
import {
  createSalaryPayment,
  deleteSalaryPayment,
  getSalaryDebts,
  getSalarySummary,
  listSalaryPayments,
} from '../api/salary';
import { screenUi } from '../styles/screenUi';
import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';
import { withFallback } from '../utils/safeRequest';
import type {
  Driver,
  DriverDebtSummary,
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

const initialForm = {
  driver_id: 0,
  type: 'salary' as DriverPaymentType,
  amount: '',
  note: '',
};

const paymentTypeLabels: Record<DriverPaymentType, string> = {
  salary: '💵 Зарплата',
  advance: '💳 Аванс',
  bonus: '🎁 Премия',
  deduction: '➖ Удержание',
};

export function SalaryScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [records, setRecords] = useState<DriverPaymentRecord[]>([]);
  const [debts, setDebts] = useState<DriverDebtSummary[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [summary, setSummary] = useState<DriverSalarySummary>(initialSummary);
  const [form, setForm] = useState(initialForm);
  const [formVisible, setFormVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === selectedDriverId) ?? null,
    [drivers, selectedDriverId]
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      const [driversData, recordsData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(() => listSalaryPayments(selectedDriverId ?? undefined), []),
      ]);
      setDrivers(driversData);
      setRecords(recordsData);
      setDebts(await withFallback(() => getSalaryDebts(), []));
      if (selectedDriverId) {
        setSummary(await withFallback(() => getSalarySummary(selectedDriverId), initialSummary));
      } else {
        setSummary(initialSummary);
      }
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить зарплаты'));
    }
  }, [selectedDriverId]);

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

  const driverChips = useMemo(
    () => [
      { id: 'all', label: '👥 Все' },
      ...drivers.map((d) => ({ id: String(d.id), label: d.full_name ?? d.email })),
    ],
    [drivers]
  );

  const onCreate = async () => {
    const amount = Number(form.amount.replace(',', '.'));
    if (!form.driver_id) {
      Alert.alert('Ошибка', 'Выберите водителя');
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
        note: form.note.trim() || undefined,
      });
      setForm(initialForm);
      setFormVisible(false);
      await load();
      Alert.alert('Успех', 'Выплата сохранена');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить выплату'));
    } finally {
      setSaving(false);
    }
  };

  const onExportExcel = async () => {
    setExporting(true);
    try {
      const query = buildExportQuery({
        date_from: dateFrom.trim() || undefined,
        date_to: dateTo.trim() || undefined,
        driver_id: selectedDriverId ?? undefined,
      });
      await downloadAndShareExcel(`/export/salary${query}`, 'zarplata.xlsx');
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
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="💵 Зарплаты" actionLabel="+ Выплата" onAction={() => setFormVisible(true)} />
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
            {selectedDriver && (
              <View style={screenUi.summaryBar}>
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Начислено</Text>
                  <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{summary.gross.toFixed(0)} ₽</Text>
                </View>
                <View style={screenUi.sumDivider} />
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Долг</Text>
                  <Text style={[screenUi.sumValue, { color: '#ef4444' }]}>{summary.debt.toFixed(0)} ₽</Text>
                </View>
              </View>
            )}
            {debts.length > 0 ? (
              <View style={[screenUi.card, { marginBottom: 8 }]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
                  📋 Реестр задолженности
                </Text>
                {debts.slice(0, 5).map((item) => (
                  <Text key={item.driver_id} style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                    {item.driver_name ?? `#${item.driver_id}`}: {item.debt.toFixed(0)} ₽
                  </Text>
                ))}
              </View>
            ) : null}
            <ExcelExportButton loading={exporting} onPress={() => void onExportExcel()} />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card} onLongPress={() => onDelete(item.id)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                {item.driver_name}
                {item.driver_car_number ? ` (${item.driver_car_number})` : ''}
              </Text>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#2563eb' }}>{item.amount} ₽</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              #{item.id} · {paymentTypeLabels[item.type]} · {item.created_at}
            </Text>
            {item.note ? (
              <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4, fontStyle: 'italic' }}>{item.note}</Text>
            ) : null}
            <Pressable onPress={() => onDelete(item.id)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#ef4444', fontSize: 13 }}>🗑 Удалить</Text>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Записей по зарплатам пока нет</Text>}
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
          label="Сумма"
          value={form.amount}
          onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
          keyboardType="decimal-pad"
        />
        <Field
          label="Комментарий"
          value={form.note}
          onChangeText={(value) => setForm((prev) => ({ ...prev, note: value }))}
        />
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
