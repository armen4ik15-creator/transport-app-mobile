import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DateRangePicker } from '../components/DateRangePicker';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { FilterChipRow } from '../components/FilterChipRow';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createFinance, getDriverBalance, listFinances } from '../api/finances';
import { listOrders } from '../api/orders';
import { listDrivers } from '../api/drivers';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';
import { formatDateTimeRu, getReportPeriodBounds } from '../utils/datePeriods';
import { withFallback } from '../utils/safeRequest';
import type { Driver, DriverBalance, FinanceRecord, Order } from '../types';
import { colors } from '../theme';

const defaultMonth = getReportPeriodBounds('month');

const initialForm = {
  driver_id: 0,
  type: 'income' as 'income' | 'expense',
  amount: '',
  description: '',
  order_id: 0,
};

export function AdminFinancesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState(defaultMonth.from);
  const [dateTo, setDateTo] = useState(defaultMonth.to);
  const [balance, setBalance] = useState<DriverBalance | null>(null);
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

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const date = item.created_at.slice(0, 10);
      if (dateFrom && date < dateFrom) return false;
      if (dateTo && date > dateTo) return false;
      return true;
    });
  }, [records, dateFrom, dateTo]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [driversData, financesData, ordersData] = await Promise.all([
        withFallback(() => listDrivers(), []),
        withFallback(() => listFinances(selectedDriverId ?? undefined), []),
        withFallback(() => listOrders(), []),
      ]);
      setDrivers(driversData);
      setRecords(financesData);
      setOrders(ordersData);
      if (selectedDriverId) {
        setBalance(await withFallback(() => getDriverBalance(selectedDriverId), null));
      } else {
        setBalance(null);
      }
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить финансы'));
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
    const driverId = Number(form.driver_id);
    const amount = Number(form.amount);
    if (!driverId || !Number.isFinite(driverId)) {
      Alert.alert('Ошибка', 'Выберите водителя');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Ошибка', 'Введите корректную сумму');
      return;
    }
    const orderId = form.order_id > 0 ? form.order_id : null;

    setSaving(true);
    try {
      await createFinance({
        driver_id: driverId,
        type: form.type,
        amount,
        description: form.description.trim() || undefined,
        order_id: orderId,
      });
      setForm(initialForm);
      setFormVisible(false);
      await load();
      Alert.alert('Готово', 'Операция добавлена');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать операцию'));
    } finally {
      setSaving(false);
    }
  };

  const onExportExcel = async () => {
    if (!dateFrom.trim() || !dateTo.trim()) {
      Alert.alert('Период', 'Укажите даты для отчёта');
      return;
    }
    setExporting(true);
    try {
      const query = buildExportQuery({
        date_from: dateFrom.trim(),
        date_to: dateTo.trim(),
        driver_id: selectedDriverId ?? undefined,
      });
      await downloadAndShareExcel(`/export/financial-report${query}`, 'finansovy_otchet.xlsx');
    } finally {
      setExporting(false);
    }
  };

  if (loading && records.length === 0) return <LoadingScreen label="Загрузка финансов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="💰 Финансы"
              actionLabel="+ Операция"
              onAction={() => setFormVisible(true)}
            />
            <ScreenHero title="💼 Финансовые операции" subtitle="Доходы и расходы водителей" />
            <DateRangePicker from={dateFrom} to={dateTo} onChangeFrom={setDateFrom} onChangeTo={setDateTo} />
            <Text style={screenUi.filterLabel}>Водитель:</Text>
            <FilterChipRow
              items={driverChips}
              activeId={selectedDriverId == null ? 'all' : String(selectedDriverId)}
              onSelect={(id) => setSelectedDriverId(id === 'all' ? null : Number(id))}
            />
            {selectedDriver && balance ? (
              <View style={screenUi.summaryBar}>
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Доход</Text>
                  <Text style={[screenUi.sumValue, { color: colors.profit }]}>{balance.income} ₽</Text>
                </View>
                <View style={screenUi.sumDivider} />
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Расход</Text>
                  <Text style={[screenUi.sumValue, { color: colors.loss }]}>{balance.expense} ₽</Text>
                </View>
                <View style={screenUi.sumDivider} />
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Баланс</Text>
                  <Text style={[screenUi.sumValue, { color: colors.primary }]}>{balance.balance} ₽</Text>
                </View>
              </View>
            ) : null}
            <ExcelExportButton
              label="📊 Скачать финансовый отчёт Excel"
              loading={exporting}
              onPress={() => void onExportExcel()}
            />
            <MenuButton
              label="📈 Полный финансовый отчёт"
              onPress={() => navigation.navigate('FinanceReport')}
              variant="secondary"
            />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={[screenUi.card, { borderRadius: 14, borderLeftWidth: 4, borderLeftColor: item.type === 'income' ? colors.profit : colors.loss }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                {item.type === 'income' ? '💵 Доход' : '💸 Расход'}
              </Text>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '800',
                  color: item.type === 'income' ? colors.profit : colors.loss,
                }}
              >
                {item.type === 'income' ? '+' : '−'}
                {item.amount} ₽
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>
              👤 {item.driver_name}
              {item.driver_car_number ? ` · ${item.driver_car_number}` : ''}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              📅 {formatDateTimeRu(item.created_at)}
            </Text>
            {item.order_id ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>📦 Заказ #{item.order_id}</Text>
            ) : null}
            {item.description ? (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' }}>
                {item.description}
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Операций за период нет</Text>}
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Новая операция"
        saveLabel="Добавить"
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
        <Field label="Сумма" value={form.amount} onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))} keyboardType="decimal-pad" />
        <Field label="Описание" value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <MenuButton label={form.type === 'income' ? '✅ Доход' : 'Доход'} onPress={() => setForm((p) => ({ ...p, type: 'income' }))} variant={form.type === 'income' ? 'default' : 'secondary'} />
          </View>
          <View style={{ flex: 1 }}>
            <MenuButton label={form.type === 'expense' ? '✅ Расход' : 'Расход'} onPress={() => setForm((p) => ({ ...p, type: 'expense' }))} variant={form.type === 'expense' ? 'default' : 'secondary'} />
          </View>
        </View>
        {orders.slice(0, 8).map((o) => (
          <MenuButton
            key={o.id}
            label={`${form.order_id === o.id ? '✅ ' : ''}Заказ #${o.id}`}
            onPress={() => setForm((p) => ({ ...p, order_id: o.id }))}
            variant={form.order_id === o.id ? 'default' : 'secondary'}
          />
        ))}
      </FormBottomModal>
    </View>
  );
}
