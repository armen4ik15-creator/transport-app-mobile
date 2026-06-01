import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOrderTripState } from '../hooks/useOrderTripState';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';

interface DriverTripActionCardProps {
  orderId: number;
  taskLabel?: string;
  compact?: boolean;
}

export function DriverTripActionCard({ orderId, taskLabel, compact = false }: DriverTripActionCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { activeTrip, completedCount, nextAction, loading } = useOrderTripState(orderId);

  const openTrip = (action: 'loading' | 'unloading') => {
    navigation.navigate('TripCreate', { orderId, openAction: action });
  };

  if (loading) {
    return (
      <View style={[screenUi.card, { alignItems: 'center', paddingVertical: 16 }]}>
        <ActivityIndicator color="#2563eb" />
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
          borderColor: isUnloading ? '#f59e0b' : '#2563eb',
          backgroundColor: isUnloading ? '#fffbeb' : '#eff6ff',
        },
      ]}
    >
      {!compact ? (
        <>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4 }}>
            🚛 Рейс по заказу #{orderId}
          </Text>
          {taskLabel ? (
            <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: 8 }}>{taskLabel}</Text>
          ) : null}
        </>
      ) : null}

      <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{stepHint}</Text>

      {activeTrip ? (
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#b45309', marginBottom: 10 }}>
          ⏳ Рейс #{activeTrip.id} — ожидает разгрузку
        </Text>
      ) : null}

      <Pressable
        onPress={() => openTrip(isUnloading ? 'unloading' : 'loading')}
        style={{
          backgroundColor: isUnloading ? '#16a34a' : '#2563eb',
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
        <Text style={{ color: '#2563eb', fontSize: 13, fontWeight: '600' }}>
          📋 История рейсов ({completedCount})
        </Text>
      </Pressable>
    </View>
  );
}
