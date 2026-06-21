import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOrderTripState } from '../hooks/useOrderTripState';
import type { RootStackParamList } from '../navigation/types';
import type { OrderTripSnapshot } from '../utils/orderTripMap';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';

interface DriverTripActionCardProps {
  orderId: number;
  taskLabel?: string;
  compact?: boolean;
  tripSnapshot?: OrderTripSnapshot;
}

export function DriverTripActionCard({
  orderId,
  taskLabel,
  compact = false,
  tripSnapshot,
}: DriverTripActionCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const hookState = useOrderTripState(orderId, { enabled: !tripSnapshot });
  const activeTrip = tripSnapshot?.activeTrip ?? hookState.activeTrip;
  const completedCount = tripSnapshot?.completedCount ?? hookState.completedCount;
  const nextAction = tripSnapshot?.nextAction ?? hookState.nextAction;
  const loading = tripSnapshot ? false : hookState.loading;

  const openTrip = (action: 'loading' | 'unloading') => {
    navigation.navigate('TripCreate', { orderId, openAction: action });
  };

  if (loading) {
    return (
      <View style={[screenUi.card, { alignItems: 'center', paddingVertical: 16 }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const isUnloading = nextAction === 'unloading';
  const stepHint = isUnloading
    ? 'Шаг 2 из 2: заполните разгрузку, объём и фото ТТН'
    : 'Шаг 1 из 2: отметьте прибытие на погрузку';

  return (
    <View
      style={[
        screenUi.card,
        {
          borderWidth: 2,
          borderColor: isUnloading ? colors.warning : colors.primary,
          backgroundColor: isUnloading ? 'rgba(251,140,0,0.12)' : 'rgba(26,115,232,0.12)',
        },
      ]}
    >
      {!compact ? (
        <>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
            🚛 Рейс по заказу #{orderId}
          </Text>
          {taskLabel ? (
            <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 8 }}>{taskLabel}</Text>
          ) : null}
        </>
      ) : null}

      <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 10 }}>{stepHint}</Text>

      {activeTrip ? (
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.warning, marginBottom: 10 }}>
          ⏳ Рейс #{activeTrip.id} — ожидает разгрузку
        </Text>
      ) : null}

      <Pressable
        onPress={() => openTrip(isUnloading ? 'unloading' : 'loading')}
        style={{
          backgroundColor: isUnloading ? colors.profit : colors.primary,
          borderRadius: 12,
          paddingVertical: compact ? 12 : 16,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: compact ? 14 : 16, fontWeight: '800' }}>
          {isUnloading ? '✅ ЗАВЕРШИТЬ РАЗГРУЗКУ' : '📦 НАЧАТЬ ПОГРУЗКУ'}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('TripCreate', { orderId })}
        style={{ paddingVertical: 10, alignItems: 'center' }}
      >
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
          📋 История рейсов ({completedCount})
        </Text>
      </Pressable>
    </View>
  );
}
