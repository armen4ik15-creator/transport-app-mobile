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

const colors = {
  bg: '#f4f6f8',
  card: '#ffffff',
  primary: '#1a5fb4',
  primaryDark: '#0d3d7a',
  text: '#1c1c1e',
  muted: '#6b7280',
  border: '#e5e7eb',
  danger: '#c01c28',
};

export const theme = colors;

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
      <TextInput style={styles.input} placeholderTextColor={colors.muted} {...props} />
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
        <ActivityIndicator color="#fff" />
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
      <Text style={[styles.menuBtnText, variant === 'danger' && { color: colors.danger }]}>
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
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: colors.muted, marginBottom: 4 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnPressed: { backgroundColor: colors.primaryDark },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  menuBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuBtnSecondary: { backgroundColor: '#eef2ff' },
  menuBtnDanger: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  menuBtnText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  error: { color: colors.danger, marginTop: 8, fontSize: 14 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: { marginTop: 12, color: colors.muted },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 24, fontSize: 15 },
});
