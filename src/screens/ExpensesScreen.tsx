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
import { BatchExportModal } from '../components/expenses/BatchExportModal';
import { DateRangePicker } from '../components/DateRangePicker';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { ExpenseFormModal, type VehicleOption } from '../components/expenses/ExpenseFormModal';
import { FilterChipRow } from '../components/FilterChipRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { Fab, Pill } from '../components/ui-kit';
import { LoadingScreen } from '../components/ui';
import { RemoteImage } from '../components/RemoteImage';
import {
  ALL_EXPENSE_TYPES,
  getExpenseStatusLabel,
  getExpenseTypeIcon,
  getExpenseTypeLabel,
  PERIOD_FILTERS,
  PERIOD_LABELS,
  type PeriodFilter,
} from '../constants/expenseTypes';
import {
  approveExpense,
  createExpense,
  createExpenseWithPhoto,
  deleteExpense,
  listExpenses,
  rejectExpense,
} from '../api/expenses';
import { listDrivers } from '../api/drivers';
import { apiErrorMessage } from '../api/client';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';
import { formatMoney, getPeriodBounds, todayIso } from '../utils/datePeriods';
import { buildExportQuery, downloadAndShareExcel } from '../utils/exportUtils';
import { withFallback } from '../utils/safeRequest';
import { useAuth } from '../auth/AuthContext';
import type { ExpenseMethod, ExpenseRecord, ExpenseStatus } from '../types';

function statusTone(status: ExpenseStatus | null | undefined): 'warning' | 'positive' | 'danger' | 'neutral' {
  if (status === 'pending') return 'warning';
  if (status === 'rejected') return 'danger';
  if (status === 'approved') return 'positive';
  return 'neutral';
}

function resolveStatus(record: ExpenseRecord): ExpenseStatus {
  return record.status ?? 'approved';
}

function canDriverEdit(record: ExpenseRecord): boolean {
  return record.source === 'driver' && resolveStatus(record) === 'pending';
}

function canDriverDelete(record: ExpenseRecord): boolean {
  return canDriverEdit(record);
}

function countRecordsInPeriod(records: ExpenseRecord[], from: string, to: string): number {
  return records.filter((item) => {
    if (from && item.exp_date < from) return false;
    if (to && item.exp_date > to) return false;
    return true;
  }).length;
}

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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [carFilter, setCarFilter] = useState<string>('');
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);
  const [exporting, setExporting] = useState(false);
  const [batchExportVisible, setBatchExportVisible] = useState(false);

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
    const periodBounds = getPeriodBounds(periodFilter);
    const from = dateFrom.trim() || periodBounds.from;
    const to = dateTo.trim() || periodBounds.to;
    return records.filter((item) => {
      if (from && item.exp_date < from) return false;
      if (to && item.exp_date > to) return false;
      if (typeFilter !== 'all' && item.exp_type !== typeFilter) return false;
      if (carFilter && item.car_number !== carFilter) return false;
      return true;
    });
  }, [carFilter, dateFrom, dateTo, periodFilter, records, typeFilter]);

  const exportBounds = useMemo(() => {
    const periodBounds = getPeriodBounds(periodFilter);
    return {
      from: dateFrom.trim() || periodBounds.from,
      to: dateTo.trim() || periodBounds.to,
    };
  }, [dateFrom, dateTo, periodFilter]);

  const runExport = async (from: string, to: string, filename: string) => {
    setExporting(true);
    try {
      const query = buildExportQuery({
        date_from: from,
        date_to: to,
        driver_id: isAdmin ? undefined : driver?.id,
      });
      await downloadAndShareExcel(`/export/expenses${query}`, filename);
      setBatchExportVisible(false);
    } finally {
      setExporting(false);
    }
  };

  const onExportExcel = async () => {
    await runExport(exportBounds.from ?? todayIso(), exportBounds.to ?? todayIso(), 'rashody.xlsx');
  };

  const onExportToday = async () => {
    const today = todayIso();
    await runExport(today, today, `rashody_${today}.xlsx`);
  };

  const onExportPeriod = async (from: string, to: string) => {
    if (!from || !to) {
      Alert.alert('Период', 'Укажите даты «С» и «По»');
      return;
    }
    const count = countRecordsInPeriod(records, from, to);
    if (count === 0) {
      Alert.alert('Нет данных', 'За выбранный период расходов не найдено');
      return;
    }
    await runExport(from, to, `rashody_${from}_${to}.xlsx`);
  };

  const openBatchExport = () => {
    setBatchExportVisible(true);
  };

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
    if (!isAdmin && !canDriverEdit(record)) {
      Alert.alert('Нельзя изменить', 'Редактирование доступно только для расходов на проверке');
      return;
    }
    setEditingRecord(record);
    setFormVisible(true);
  };

  const onReviewApprove = (record: ExpenseRecord) => {
    Alert.alert('Одобрить расход?', `${formatMoney(record.amount)} ₽ — ${getExpenseTypeLabel(record.exp_type)}`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Одобрить',
        onPress: async () => {
          try {
            await approveExpense(record.id);
            await load();
            Alert.alert('Готово', 'Расход одобрен, сумма учтена в компенсации');
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось одобрить расход'));
          }
        },
      },
    ]);
  };

  const onReviewReject = (record: ExpenseRecord) => {
    const submitReject = async (reason?: string) => {
      const trimmed = reason?.trim();
      if (!trimmed) {
        Alert.alert('Ошибка', 'Причина отклонения обязательна');
        return;
      }
      try {
        await rejectExpense(record.id, trimmed);
        await load();
        Alert.alert('Готово', 'Расход отклонён');
      } catch (e) {
        Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось отклонить расход'));
      }
    };

    Alert.prompt
      ? Alert.prompt('Отклонить расход', 'Укажите причину отклонения', [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Отклонить',
            style: 'destructive',
            onPress: (reason?: string) => void submitReject(reason),
          },
        ])
      : Alert.alert('Отклонить расход', 'Отклонить без указания причины?', [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Отклонить',
            style: 'destructive',
            onPress: () => void submitReject('Отклонено администратором'),
          },
        ]);
  };

  const onSave = async (payload: {
    exp_date: string;
    exp_type: string;
    method: ExpenseMethod;
    amount: number;
    comment?: string;
    car_number?: string;
    driver_id?: number;
    photoUri?: string | null;
  }) => {
    setSaving(true);
    try {
      if (editingRecord) {
        await deleteExpense(editingRecord.id);
      }

      if (payload.photoUri) {
        await createExpenseWithPhoto({
          exp_date: payload.exp_date,
          exp_type: payload.exp_type,
          amount: payload.amount,
          comment: payload.comment,
          car_number: payload.car_number,
          driver_id: payload.driver_id,
          photoUri: payload.photoUri,
        });
      } else if (isAdmin) {
        await createExpense(payload);
      } else {
        await createExpense({
          exp_date: payload.exp_date,
          exp_type: payload.exp_type,
          amount: payload.amount,
          comment: payload.comment,
          driver_id: payload.driver_id,
        });
      }

      setFormVisible(false);
      setEditingRecord(null);
      await load();
      Alert.alert(
        'Готово',
        isAdmin
          ? editingRecord
            ? 'Расход обновлён'
            : 'Расход добавлен'
          : 'Расход отправлен на проверку'
      );
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось сохранить расход'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (record: ExpenseRecord) => {
    if (!isAdmin && !canDriverDelete(record)) {
      Alert.alert('Нельзя удалить', 'Удаление доступно только для расходов на проверке');
      return;
    }
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
      <FlatList
        data={displayedRecords}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="💸 Расходы"
              showBack={navigation.canGoBack()}
              onBack={() => navigation.goBack()}
              actionLabel="+ Добавить"
              onAction={openCreate}
            />

            <CollapsiblePanel
              title="Фильтры"
              subtitle={`${displayedRecords.length} записей · ${formatMoney(totalAmount)} ₽`}
              defaultExpanded
            >
              <FilterChipRow items={periodChips} activeId={periodFilter} onSelect={setPeriodFilter} />
              <DateRangePicker
                from={dateFrom}
                to={dateTo}
                onChangeFrom={setDateFrom}
                onChangeTo={setDateTo}
              />
              <FilterChipRow items={typeChips} activeId={typeFilter} onSelect={setTypeFilter} />
              {isAdmin ? (
                <FilterChipRow items={carChips} activeId={carFilter} onSelect={setCarFilter} />
              ) : null}

              <View style={screenUi.summaryBar}>
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Записей</Text>
                  <Text style={[screenUi.sumValue, { color: colors.primary }]}>
                    {displayedRecords.length}
                  </Text>
                </View>
                <View style={screenUi.sumDivider} />
                <View style={screenUi.sumItem}>
                  <Text style={screenUi.sumLabel}>Итого расходы</Text>
                  <Text style={[screenUi.sumValue, { color: colors.loss }]}>
                    {formatMoney(totalAmount)} ₽
                  </Text>
                </View>
              </View>

              <Text style={screenUi.hint}>Нажмите — редактировать · Удерживайте — удалить</Text>
              <ExcelExportButton
                label="📤 Экспорт за период (фильтры)"
                loading={exporting}
                onPress={() => void onExportExcel()}
              />
              <Pressable onPress={openBatchExport} style={[screenUi.secondaryBtn, { marginTop: 8 }]}>
                <Text style={screenUi.secondaryBtnText}>
                  📅 Пакетный экспорт (сегодня / период)
                </Text>
              </Pressable>
            </CollapsiblePanel>
          </View>
        }
        ListEmptyComponent={
          <Text style={screenUi.emptyText}>Нет расходов за выбранный период</Text>
        }
        renderItem={({ item }) => {
          const status = resolveStatus(item);
          const showReviewActions =
            isAdmin && item.source === 'driver' && status === 'pending';

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
                    <Text style={screenUi.cardTitleSm}>
                      {getExpenseTypeLabel(item.exp_type)}
                    </Text>
                    <Text style={screenUi.cardMeta}>
                      {item.exp_date}
                      {item.driver_name ? ` · ${item.driver_name}` : ''}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      <Pill tone={statusTone(status)}>{getExpenseStatusLabel(status)}</Pill>
                      {item.source === 'driver' ? <Pill tone="info">👤 Водитель</Pill> : null}
                      {isAdmin && item.method ? (
                        <Pill tone={item.method === 'cash' ? 'warning' : 'info'}>
                          {item.method === 'cash' ? '💵 Нал' : '💳 Безнал'}
                        </Pill>
                      ) : null}
                      {item.car_number ? (
                        <Pill tone="neutral">🚗 {item.car_number}</Pill>
                      ) : null}
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[screenUi.sumValue, { color: colors.loss }]}>
                    {formatMoney(item.amount)} ₽
                  </Text>
                  {(isAdmin || canDriverDelete(item)) ? (
                    <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                      <Text style={screenUi.dangerIcon}>🗑</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
              {item.photo_path ? (
                <RemoteImage
                  filePath={item.photo_path}
                  style={{ width: '100%', height: 120, borderRadius: 8, marginTop: 10 }}
                />
              ) : null}
              {item.comment ? (
                <Text style={screenUi.cardComment}>
                  📝 {item.comment}
                </Text>
              ) : null}
              {status === 'rejected' && item.rejection_reason ? (
                <Text style={[screenUi.cardComment, { color: colors.loss }]}>
                  ❌ {item.rejection_reason}
                </Text>
              ) : null}
              {showReviewActions ? (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <Pressable
                    onPress={() => onReviewApprove(item)}
                    style={[screenUi.secondaryBtn, { flex: 1, marginBottom: 0 }]}
                  >
                    <Text style={{ color: colors.profit, fontWeight: '600', textAlign: 'center' }}>
                      ✓ Одобрить
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onReviewReject(item)}
                    style={[screenUi.secondaryBtn, { flex: 1, marginBottom: 0 }]}
                  >
                    <Text style={{ color: colors.loss, fontWeight: '600', textAlign: 'center' }}>
                      ✕ Отклонить
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />

      <Fab label="Расход" icon="➕" onPress={openCreate} />

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

      <BatchExportModal
        visible={batchExportVisible}
        records={records}
        exporting={exporting}
        onClose={() => setBatchExportVisible(false)}
        onExportToday={() => void onExportToday()}
        onExportPeriod={(from, to) => void onExportPeriod(from, to)}
      />
    </View>
  );
}
