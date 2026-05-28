import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FilterDropdown } from '../components/FilterDropdown';
import { FormBottomModal } from '../components/FormBottomModal';
import { EmptyStateButton, FinanceSummaryBar } from '../components/ListScreenParts';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen } from '../components/ui';
import { getContractorDebtSummary } from '../api/contractorPayments';
import { createContractor, deleteContractor, listContractors } from '../api/contractors';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { withFallback } from '../utils/safeRequest';
import type { Contractor, ContractorDebtSummary } from '../types';

type PeriodFilter = 'all' | 'month' | 'quarter' | 'year';
type TypeFilter = 'all' | 'company' | 'individual' | 'gov';

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  all: 'Все время',
  month: 'Этот месяц',
  quarter: 'Этот квартал',
  year: 'Этот год',
};

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: 'Все',
  company: 'Компании',
  individual: 'Физлица',
  gov: 'Госорганы',
};

function isInPeriod(createdAt: string, period: PeriodFilter): boolean {
  if (period === 'all') return true;
  const created = new Date(createdAt);
  const now = new Date();
  if (Number.isNaN(created.getTime())) return true;

  if (period === 'month') {
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }
  if (period === 'quarter') {
    const qNow = Math.floor(now.getMonth() / 3);
    const qCreated = Math.floor(created.getMonth() / 3);
    return created.getFullYear() === now.getFullYear() && qCreated === qNow;
  }
  return created.getFullYear() === now.getFullYear();
}

export function ContractorsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [debtSummary, setDebtSummary] = useState<ContractorDebtSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [formVisible, setFormVisible] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('company');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [contractorData, summaryData] = await Promise.all([
        listContractors(),
        withFallback(() => getContractorDebtSummary(), []),
      ]);
      setContractors(contractorData);
      setDebtSummary(summaryData);
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

  const filtered = useMemo(() => {
    return contractors.filter((contractor) => {
      if (typeFilter !== 'all' && contractor.type !== typeFilter) return false;
      return isInPeriod(contractor.created_at, periodFilter);
    });
  }, [contractors, periodFilter, typeFilter]);

  const financeTotals = useMemo(() => {
    const visibleIds = new Set(filtered.map((item) => item.id));
    const rows = debtSummary.filter((row) => visibleIds.has(row.contractor_id));
    return rows.reduce(
      (acc, row) => ({
        revenue: acc.revenue + row.accrued,
        paid: acc.paid + row.paid,
        debt: acc.debt + row.debt,
      }),
      { revenue: 0, paid: 0, debt: 0 }
    );
  }, [debtSummary, filtered]);

  const resetForm = () => {
    setName('');
    setType('company');
    setPhone('');
    setAddress('');
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
      resetForm();
      setFormVisible(false);
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

  const pickPeriod = () => {
    Alert.alert('Период', undefined, [
      ...(Object.entries(PERIOD_LABELS) as [PeriodFilter, string][]).map(([id, label]) => ({
        text: label,
        onPress: () => setPeriodFilter(id),
      })),
      { text: 'Отмена', style: 'cancel' as const },
    ]);
  };

  const pickType = () => {
    Alert.alert('Тип контрагента', undefined, [
      ...(Object.entries(TYPE_LABELS) as [TypeFilter, string][]).map(([id, label]) => ({
        text: label,
        onPress: () => setTypeFilter(id),
      })),
      { text: 'Отмена', style: 'cancel' as const },
    ]);
  };

  if (loading && contractors.length === 0) {
    return <LoadingScreen label="Загрузка контрагентов…" />;
  }

  return (
    <View style={screenUi.container}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="Контрагенты"
              showBack
              onBack={() => navigation.replace('AdminHome')}
              actionLabel="+"
              onAction={() => setFormVisible(true)}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <FilterDropdown
                icon="📅"
                label={PERIOD_LABELS[periodFilter]}
                onPress={pickPeriod}
              />
              <FilterDropdown icon="👤" label={TYPE_LABELS[typeFilter]} onPress={pickType} />
            </View>
            <FinanceSummaryBar
              revenue={financeTotals.revenue}
              paid={financeTotals.paid}
              debt={financeTotals.debt}
            />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card} onLongPress={() => onDelete(item)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{item.name}</Text>
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  #{item.id} · {item.type}
                </Text>
                {item.phone ? (
                  <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>📞 {item.phone}</Text>
                ) : null}
                {item.address ? (
                  <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 2 }}>📍 {item.address}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyStateButton
            message="Контрагентов нет"
            buttonLabel="+ Добавить первого"
            onPress={() => setFormVisible(true)}
          />
        }
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Новый контрагент"
        saving={creating}
        onSave={onCreate}
        onClose={() => {
          setFormVisible(false);
          resetForm();
        }}
      >
        <Field label="Название *" value={name} onChangeText={setName} />
        <Field label="Тип (company/individual/gov)" value={type} onChangeText={setType} />
        <Field label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Адрес" value={address} onChangeText={setAddress} />
      </FormBottomModal>
    </View>
  );
}
