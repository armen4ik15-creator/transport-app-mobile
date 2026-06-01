import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FilterChipRow } from '../components/FilterChipRow';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHero } from '../components/ScreenHero';
import { ScreenHeader } from '../components/ScreenHeader';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyStateButton, FinanceSummaryBar } from '../components/ListScreenParts';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { getContractorDebtSummary } from '../api/contractorPayments';
import { createContractor, deleteContractor, listContractors, updateContractor } from '../api/contractors';
import { apiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import {
  apiTypeFromFormRole,
  CONTRACTOR_ROLE_FILTER_ITEMS,
  contractorTypeBadgeColor,
  contractorTypeBadgeLabel,
  formRoleFromApiType,
  matchesContractorRoleFilter,
  type ContractorRoleFilter,
} from '../utils/contractorRoles';
import { withFallback } from '../utils/safeRequest';
import type { Contractor, ContractorDebtSummary } from '../types';

type FormRole = 'customer' | 'supplier' | 'gov';

const initialForm = {
  name: '',
  role: 'customer' as FormRole,
  phone: '',
  address: '',
};

export function ContractorsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [debtSummary, setDebtSummary] = useState<ContractorDebtSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<ContractorRoleFilter>('all');
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

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

  const filtered = useMemo(
    () => contractors.filter((c) => matchesContractorRoleFilter(c.type, roleFilter)),
    [contractors, roleFilter]
  );

  const financeTotals = useMemo(() => {
    const visibleIds = new Set(filtered.map((item) => item.id));
    return debtSummary
      .filter((row) => visibleIds.has(row.contractor_id))
      .reduce(
        (acc, row) => ({
          revenue: acc.revenue + row.accrued,
          paid: acc.paid + row.paid,
          debt: acc.debt + row.debt,
        }),
        { revenue: 0, paid: 0, debt: 0 }
      );
  }, [debtSummary, filtered]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setFormVisible(true);
  };

  const openEdit = (contractor: Contractor) => {
    setEditingId(contractor.id);
    setForm({
      name: contractor.name,
      role: formRoleFromApiType(contractor.type),
      phone: contractor.phone ?? '',
      address: contractor.address ?? '',
    });
    setFormVisible(true);
  };

  const onSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Заполните', 'Название обязательно');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: apiTypeFromFormRole(form.role),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      if (editingId) {
        await updateContractor(editingId, payload);
      } else {
        await createContractor(payload);
      }
      setForm(initialForm);
      setEditingId(null);
      setFormVisible(false);
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e));
    } finally {
      setSaving(false);
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
              onAction={openCreate}
            />
            <ScreenHero
              title="🏢 Контрагенты"
              subtitle={`${filtered.length} в списке · оплаты и долги`}
            />
            <FilterChipRow
              items={CONTRACTOR_ROLE_FILTER_ITEMS}
              activeId={roleFilter}
              onSelect={setRoleFilter}
            />
            <FinanceSummaryBar
              revenue={financeTotals.revenue}
              paid={financeTotals.paid}
              debt={financeTotals.debt}
              revenueLabel="Навезли"
              paidLabel="Оплатили"
              debtLabel="Остаток"
            />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[screenUi.card, { borderRadius: 14 }]}
            onPress={() => navigation.navigate('ContractorDebt', { contractorId: item.id })}
            onLongPress={() => openEdit(item)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827' }}>{item.name}</Text>
                {item.phone ? (
                  <Text style={{ fontSize: 14, color: '#4b5563', marginTop: 6 }}>📞 {item.phone}</Text>
                ) : (
                  <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>Телефон не указан</Text>
                )}
                <View style={{ marginTop: 8 }}>
                  <StatusBadge
                    label={contractorTypeBadgeLabel(item.type)}
                    color={contractorTypeBadgeColor(item.type)}
                  />
                </View>
              </View>
              <Pressable onPress={() => onDelete(item)} hitSlop={8}>
                <Text style={{ color: '#ef4444', fontSize: 16 }}>🗑</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 12, color: '#2563eb', marginTop: 10 }}>💳 Оплаты и долг →</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyStateButton message="Контрагентов нет" buttonLabel="+ Добавить" onPress={openCreate} />
        }
      />

      <FormBottomModal
        visible={formVisible}
        title={editingId ? '✏️ Редактировать контрагента' : '➕ Новый контрагент'}
        saveLabel={editingId ? 'Сохранить' : 'Создать'}
        saving={saving}
        onSave={onSave}
        onClose={() => {
          setFormVisible(false);
          setEditingId(null);
          setForm(initialForm);
        }}
      >
        <Field label="Название *" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
        <Text style={screenUi.fieldLabel}>Тип</Text>
        {(
          [
            { id: 'customer' as FormRole, label: '🏢 Заказчик' },
            { id: 'supplier' as FormRole, label: '📦 Поставщик' },
            { id: 'gov' as FormRole, label: '🏛 Госорган' },
          ] as const
        ).map((option) => (
          <MenuButton
            key={option.id}
            label={`${form.role === option.id ? '✅ ' : ''}${option.label}`}
            onPress={() => setForm((p) => ({ ...p, role: option.id }))}
            variant={form.role === option.id ? 'default' : 'secondary'}
          />
        ))}
        <Field
          label="Телефон"
          value={form.phone}
          onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
          keyboardType="phone-pad"
        />
        <Field
          label="Адрес"
          value={form.address}
          onChangeText={(v) => setForm((p) => ({ ...p, address: v }))}
        />
      </FormBottomModal>
    </View>
  );
}
