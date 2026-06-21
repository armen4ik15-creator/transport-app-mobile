import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, Field, LoadingScreen, MenuButton, PrimaryButton, Subtitle } from '../components/ui';
import {
  createFuelCard,
  deleteFuelCard,
  getFuelSettings,
  listFuelCards,
  testFuelConnection,
  triggerFuelSync,
  updateFuelSettings,
} from '../api/fuel';
import { listDrivers } from '../api/drivers';
import { apiErrorMessage } from '../api/client';
import type { Driver, FuelCardRecord, FuelDataSourceType } from '../types';
import { screenUi } from '../styles/screenUi';
import { formatFuelSyncLabel } from '../utils/fuelSyncLabel';
import { withFallback } from '../utils/safeRequest';

interface FuelSettingsScreenProps {
  navigation: { goBack: () => void };
}

/** Deferred: not wired in RootNavigator until Opti integration ships. */
export function FuelSettingsScreen({ navigation }: FuelSettingsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<FuelDataSourceType>('mock');
  const [optiLogin, setOptiLogin] = useState('');
  const [optiPassword, setOptiPassword] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncLabel, setSyncLabel] = useState('');
  const [cards, setCards] = useState<FuelCardRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardDriverId, setNewCardDriverId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [settings, cardList, driverList] = await Promise.all([
        getFuelSettings(),
        withFallback(() => listFuelCards(), []),
        withFallback(() => listDrivers(), []),
      ]);
      setDataSource(settings.data_source);
      setOptiLogin(settings.opti_login || '');
      setSyncEnabled(settings.sync_enabled);
      setCards(cardList);
      setDrivers(driverList.filter((d) => d.is_active));
      setNewCardDriverId(driverList[0]?.id ?? null);
      setSyncLabel(
        formatFuelSyncLabel(settings.last_sync_at, settings.last_sync_new_count, settings.last_sync_status)
      );
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить настройки'));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onSaveSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: {
        data_source: FuelDataSourceType;
        opti_login: string;
        sync_enabled: boolean;
        opti_password?: string;
      } = {
        data_source: dataSource,
        opti_login: optiLogin.trim(),
        sync_enabled: syncEnabled,
      };
      if (optiPassword.trim()) payload.opti_password = optiPassword.trim();
      const updated = await updateFuelSettings(payload);
      setSyncLabel(
        formatFuelSyncLabel(updated.last_sync_at, updated.last_sync_new_count, updated.last_sync_status)
      );
      Alert.alert('Сохранено', 'Настройки топливных карт обновлены');
    } catch (e) {
      const msg = apiErrorMessage(e, 'Не удалось сохранить');
      setError(msg);
      Alert.alert('Ошибка', msg);
    } finally {
      setSaving(false);
    }
  };

  const onSyncNow = async () => {
    setSyncing(true);
    try {
      const result = await triggerFuelSync();
      await load();
      Alert.alert('Синхронизация', `Новых заправок: ${result.created ?? 0}`);
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Синхронизация не удалась'));
    } finally {
      setSyncing(false);
    }
  };

  const onTestConnection = async () => {
    try {
      const result = await testFuelConnection();
      Alert.alert(result.ok ? 'Успех' : 'Ошибка', result.message);
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Проверка не удалась'));
    }
  };

  const onAddCard = async () => {
    if (!newCardDriverId || !newCardNumber.trim()) {
      Alert.alert('Ошибка', 'Выберите водителя и укажите номер карты');
      return;
    }
    try {
      await createFuelCard({ driver_id: newCardDriverId, card_number: newCardNumber.trim() });
      setNewCardNumber('');
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось добавить карту'));
    }
  };

  const onDeleteCard = (card: FuelCardRecord) => {
    Alert.alert('Удалить карту?', card.card_number, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteFuelCard(card.id);
              await load();
            } catch (e) {
              Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить'));
            }
          })();
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen label="Загрузка настроек…" />;

  const optiFieldsDisabled = dataSource === 'mock';

  return (
    <ScrollView style={screenUi.container} contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]}>
      <ScreenHeader title="⛽ Топливные карты Opti" onBack={() => navigation.goBack()} />
      <ScreenHero
        title="Интеграция Opti"
        subtitle="Заправки автоматически попадают в расходы и отчёты"
      />
      <Text style={{ color: '#64748b', marginBottom: 12 }}>{syncLabel}</Text>
      <ErrorText message={error} />

      <View style={screenUi.card}>
        <Subtitle>Источник данных</Subtitle>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 12 }}>
          {(['mock', 'opti'] as FuelDataSourceType[]).map((source) => (
            <Text
              key={source}
              onPress={() => setDataSource(source)}
              style={{
                flex: 1,
                textAlign: 'center',
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: dataSource === source ? '#2563eb' : '#e5e7eb',
                color: dataSource === source ? '#fff' : '#111827',
                fontWeight: '600',
              }}
            >
              {source === 'mock' ? 'Имитация' : 'Opti API'}
            </Text>
          ))}
        </View>
        <Field
          label="Логин Opti (opti.ru)"
          value={optiLogin}
          onChangeText={setOptiLogin}
          editable={!optiFieldsDisabled}
          placeholder={optiFieldsDisabled ? 'Доступно при выборе Opti API' : 'email@company.ru'}
          autoCapitalize="none"
        />
        <Field
          label="Пароль Opti"
          value={optiPassword}
          onChangeText={setOptiPassword}
          editable={!optiFieldsDisabled}
          secureTextEntry
          placeholder={optiFieldsDisabled ? '—' : 'Новый пароль (оставьте пустым, чтобы не менять)'}
        />
        <MenuButton
          label={syncEnabled ? '✓ Автосинхронизация включена' : 'Автосинхронизация выключена'}
          onPress={() => setSyncEnabled((v) => !v)}
          variant="secondary"
        />
        <PrimaryButton label="💾 Сохранить настройки" onPress={onSaveSettings} loading={saving} />
        <MenuButton label="🔌 Проверить соединение" onPress={onTestConnection} variant="secondary" />
        <PrimaryButton label="🔄 Синхронизировать сейчас" onPress={onSyncNow} loading={syncing} />
      </View>

      <View style={[screenUi.card, { marginTop: 12 }]}>
        <Subtitle>Карты водителей</Subtitle>
        <Field
          label="Номер топливной карты"
          value={newCardNumber}
          onChangeText={setNewCardNumber}
          placeholder="Например 1234567890123456"
        />
        {drivers.length > 0 ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: '#64748b', marginBottom: 8 }}>Водитель</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {drivers.map((driver) => (
                <Text
                  key={driver.id}
                  onPress={() => setNewCardDriverId(driver.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: newCardDriverId === driver.id ? '#16a34a' : '#e5e7eb',
                    color: newCardDriverId === driver.id ? '#fff' : '#111827',
                  }}
                >
                  {driver.full_name || driver.car_number}
                </Text>
              ))}
            </View>
          </View>
        ) : null}
        <PrimaryButton label="➕ Привязать карту" onPress={onAddCard} />
        {cards.map((card) => (
          <View
            key={card.id}
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 10,
              backgroundColor: '#f9fafb',
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}
          >
            <Text style={{ fontWeight: '700' }}>{card.card_number}</Text>
            <Text style={{ color: '#64748b', marginTop: 4 }}>
              {card.driver_name || 'Водитель'} · {card.car_number || '—'}
            </Text>
            <MenuButton label="Удалить" onPress={() => onDeleteCard(card)} variant="secondary" />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
