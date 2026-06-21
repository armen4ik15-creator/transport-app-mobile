import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

interface SplashScreenProps {
  label?: string;
}

/** Branded splash while auth/session bootstrap runs (v0 reference). */
export function SplashScreen({ label = 'Проверка сессии…' }: SplashScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: radii.xl,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: 40 }}>🚛</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>ReestrPro</Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: spacing.sm }}>
        Управление перевозками
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.xl }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
      </View>
    </View>
  );
}

export function useSplashDelay(ms: number, onDone: () => void) {
  useEffect(() => {
    const timer = setTimeout(onDone, ms);
    return () => clearTimeout(timer);
  }, [ms, onDone]);
}
