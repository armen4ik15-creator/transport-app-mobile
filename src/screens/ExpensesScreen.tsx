import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ExpenseFormModal, type VehicleOption } from '../components/expenses/ExpenseFormModal';
import { FilterChipRow } from '../components/FilterChipRow';
import { LoadingScreen } from '../components/ui';
import {
  ALL_EXPENSE_TYPES,
  getExpenseTypeIcon,
  getExpenseTypeLabel,
  PERIOD_FILTERS,
  PERIOD_LABELS,
  type PeriodFilter,
} from '../constants/expenseTypes';
import { createExpense, deleteExpense, listExpenses } from '../api/expenses';
import { listDrivers } from '../api/drivers';
import { apiErrorMessage } from '../api/client';
import { screenUi } from '../styles/screenUi';
import { formatMoney, getPeriodBounds } from '../utils/datePeriods';
import { withFallback } from '../utils/safeRequest';
import { useAuth } from '../auth/AuthContext';
import type { ExpenseMethod, ExpenseRecord } from '../types';

export function ExpensesScreen() {
  const navigation = useNavigation();
  const { user, driver } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [carFilter, setCarFilter] = useState<string>('');
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);

  const load = useCallback(async () => {
    try {
      const params = isAdmin
        ? {}
        : driver?.id
          ? { driver_id: driver.id }
          : {};
      const [expenseData, driverData] = await Promise.all([
        withFallback(() => listExpenses(params), []),
        isAdmin ? withFallback(() => listDrivers(), []) : Promise.resolve([]),
      ]);
      setRecords(expenseData);
      setVehicles(
        driverData
          .filter((item) => Boolean(item.car_number))
          .map((item) => ({
            carNumber: item.car_number as string,
            driverName: item.full_name ?? item.email,
          }))
      );
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось загрузить расходы'));
    }
  }, [driver?.id, isAdmin]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const displayedRecords = useMemo(() => {
    const { from, to } = getPeriodBounds(periodFilter);
    return records.filter((item) => {
      if (from && item.exp_date < from) return false;
      if (to && item.exp_date > to) return false;
      if (typeFilter !== 'all' && item.exp_type !== typeFilter) return false;
      if (carFilter && item.car_number !== carFilter) return false;
      return true;
    });
  }, [carFilter, periodFilter, records, typeFilter]);

  const totalAmount = displayedRecords.reduce((sum, item) => sum + item.amount, 0);

  const periodChips = PERIOD_FILTERS.map((id) => ({ id, label: PERIOD_LABELS[id] }));
  const typeChips = [
    { id: 'all', label: 'Все типы' },
    ...ALL_EXPENSE_TYPES.map((item) => ({
      id: item.value,
      label: `${item.icon} ${item.label}`,
    })),
  ];
  const carChips = [
    { id: '', label: '🚛 Все машины' },
    ...vehicles.map((item) => ({ id: item.carNumber, label: item.carNumber })),
  ];

  const openCreate = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };

  const openEdit = (record: ExpenseRecord) => {
    setEditingRecord(record);
    setFormVisible(true);
  };

  const onSave = async (payload: {
    exp_date: string;
    exp_type: string;
    method: ExpenseMethod;
    amount: number;
    comment?: string;
    car_number?: string;
    driver_id?: number;
  }) => {
    setSaving(true);
    try {
      if (editingRecord) {
        await deleteExpense(editingRecord.id);
      }
      await createExpense(payload);
      setFormVisible(false);
      setEditingRecord(null);
      await load();
      Alert.alert('Готово', editingRecord ? 'Расход обновлён' : 'Расход добавлен');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить расход'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (record: ExpenseRecord) => {
    Alert.alert(
      'Удалить расход?',
      `${getExpenseTypeLabel(record.exp_type)} — ${formatMoney(record.amount)} ₽`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(record.id);
              await load();
            } catch (e) {
              Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить'));
            }
          },
        },
      ]
    );
  };

  if (loading && records.length === 0) {
    return <LoadingScreen label="Загрузка расходов…" />;
  }

  return (
    <View style={screenUi.container}>
      <View style={screenUi.content}>
        <View style={screenUi.header}>
          {navigation.canGoBack() ? (
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={screenUi.back}>← Назад</Text>
            </Pressable>
          ) : (
            <View style={{ width: 72 }} />
          )}
          <Text style={screenUi.title}>Расходы</Text>
          <Pressable style={screenUi.addBtn} onPress={openCreate}>
            <Text style={screenUi.addBtnText}>+ Добавить</Text>
          </Pressable>
        </View>

        <FilterChipRow items={periodChips} activeId={periodFilter} onSelect={setPeriodFilter} />
        <FilterChipRow items={typeChips} activeId={typeFilter} onSelect={setTypeFilter} />
        {isAdmin ? (
          <FilterChipRow items={carChips} activeId={carFilter} onSelect={setCarFilter} />
        ) : null}

        <View style={screenUi.summaryBar}>
          <View style={screenUi.sumItem}>
            <Text style={screenUi.sumLabel}>Записей</Text>
            <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>
              {displayedRecords.length}
            </Text>
          </View>
          <View style={screenUi.sumDivider} />
          <View style={screenUi.sumItem}>
            <Text style={screenUi.sumLabel}>Итого расходы</Text>
            <Text style={[screenUi.sumValue, { color: '#ef4444' }]}>
              {formatMoney(totalAmount)} ₽
            </Text>
          </View>
        </View>

        <Text style={screenUi.hint}>Нажмите — редактировать · Удерживайте — удалить</Text>
      </View>

      <FlatList
        data={displayedRecords}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={screenUi.emptyText}>Нет расходов за выбранный период</Text>
        }
        renderItem={({ item }) => {
          const methodText =
            item.method === 'cash' ? '💵 Нал' : item.method === 'noncash' ? '💳 Безнал' : '—';
          const carInfo = item.car_number ? `🚗 ${item.car_number}` : 'Общие';
          return (
            <Pressable
              style={screenUi.card}
              onPress={() => openEdit(item)}
              onLongPress={() => onDelete(item)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Text style={{ fontSize: 22 }}>{getExpenseTypeIcon(item.exp_type)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                      {getExpenseTypeLabel(item.exp_type)}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {item.exp_date} · {methodText} · {carInfo}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#ef4444' }}>
                    {formatMoney(item.amount)} ₽
                  </Text>
                  <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                    <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
                  </Pressable>
                </View>
              </View>
              {item.comment ? (
                <Text style={{ fontSize: 12, color: '#4b5563', marginTop: 6, fontStyle: 'italic' }}>
                  📝 {item.comment}
                </Text>
              ) : null}
            </Pressable>
          );
        }}
      />

      <ExpenseFormModal
        visible={formVisible}
        editingRecord={editingRecord}
        vehicles={vehicles}
        isAdmin={isAdmin}
        defaultDriverId={driver?.id ?? 0}
        saving={saving}
        onClose={() => {
          setFormVisible(false);
          setEditingRecord(null);
        }}
        onSave={onSave}
      />
    </View>
  );
}
