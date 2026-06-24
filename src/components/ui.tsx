import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import type { ReactNode } from 'react';
import { colors, radii, spacing } from '../theme';

export { colors as theme };

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  if (!scroll) return <View style={[styles.screen, style]}>{children}</View>;
  return (
    <ScrollView
      style={[styles.screen, style]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export const Title = ({ children }: { children: ReactNode }) => (
  <Text style={styles.title}>{children}</Text>
);

export const Subtitle = ({ children }: { children: ReactNode }) => (
  <Text style={styles.subtitle}>{children}</Text>
);

export const Card = ({ children }: { children: ReactNode }) => (
  <View style={styles.card}>{children}</View>
);

export const ErrorText = ({ message }: { message: string | null }) =>
  message ? <Text style={styles.error}>{message}</Text> : null;

export const LoadingScreen = ({ label = 'Загрузка…' }: { label?: string }) => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>{label}</Text>
  </View>
);

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...props} />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        (loading || disabled) && styles.primaryBtnDisabled,
        pressed && !disabled && styles.primaryBtnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function MenuButton({
  label,
  onPress,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'secondary' | 'danger';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuBtn,
        variant === 'secondary' && styles.menuBtnSecondary,
        variant === 'danger' && styles.menuBtnDanger,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.menuBtnText, variant === 'danger' && { color: colors.loss }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export const EmptyText = ({ text = 'Нет данных' }: { text?: string }) => (
  <Text style={styles.empty}>{text}</Text>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: spacing.md, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  primaryBtnPressed: { opacity: 0.9 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  menuBtn: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuBtnSecondary: { backgroundColor: colors.surface },
  menuBtnDanger: { backgroundColor: `${colors.loss}22`, borderColor: `${colors.loss}55` },
  menuBtnText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  error: { color: colors.loss, marginTop: 8, fontSize: 14 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: { marginTop: 12, color: colors.textMuted },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 15 },
});
