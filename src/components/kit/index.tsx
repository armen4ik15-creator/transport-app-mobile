import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '../../theme';
import { rub } from '../../utils/format';

export { rub };

/** Текстовые иконки вместо Feather — без нативных шрифтов, стабильнее в release APK. */
const ICON_GLYPHS = {
  'activity': '📈',
  'arrow-left': '←',
  'bar-chart-2': '📊',
  'bell': '🔔',
  'box': '📦',
  'briefcase': '💼',
  'check': '✓',
  'chevron-right': '›',
  'clipboard': '📋',
  'copy': '📋',
  'credit-card': '💳',
  'dollar-sign': '💰',
  'download': '⬇',
  'eye': '👁',
  'eye-off': '🙈',
  'file-text': '📄',
  'folder': '📁',
  'globe': '🌐',
  'help-circle': '?',
  'home': '🏠',
  'image': '🖼',
  'inbox': '📥',
  'lock': '🔒',
  'mail': '✉',
  'map-pin': '📍',
  'package': '📦',
  'plus': '+',
  'refresh-cw': '↻',
  'save': '💾',
  'search': '🔍',
  'trending-down': '▼',
  'trending-up': '▲',
  'truck': '🚚',
  'user': '👤',
  'users': '👥',
} as const;

export type KitIconName = keyof typeof ICON_GLYPHS;

const tabular = { fontFamily: 'monospace' as const };

export function KitIcon({
  name,
  size = 20,
  color = colors.textMuted,
}: {
  name: KitIconName;
  size?: number;
  color?: string;
}) {
  const glyph = ICON_GLYPHS[name] ?? ICON_GLYPHS['help-circle'];
  return (
    <Text
      style={{
        fontSize: Math.round(size * 0.9),
        lineHeight: size,
        color,
        minWidth: size,
        textAlign: 'center',
      }}
    >
      {glyph}
    </Text>
  );
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 4,
        paddingBottom: spacing.sm,
        paddingHorizontal: 2,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{children}</Text>
      {action}
    </View>
  );
}

export function AppHeader({
  title,
  subtitle,
  initials,
  showBell = true,
  notifications = 0,
  onNotifications,
  onLogout,
  onBack,
}: {
  title: string;
  subtitle?: string;
  initials?: string;
  showBell?: boolean;
  notifications?: number;
  onNotifications?: () => void;
  onLogout?: () => void;
  onBack?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.sm,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      {onBack ? (
        <Pressable onPress={onBack} style={{ padding: 8, marginTop: 4 }}>
          <KitIcon name="arrow-left" color={colors.textMuted} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, lineHeight: 28 }} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {showBell && onNotifications ? (
          <Pressable
            onPress={onNotifications}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KitIcon name="bell" />
            {notifications > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.loss,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{notifications}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
        {initials ? (
          <Pressable
            onPress={onLogout}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{initials}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function StatCard({
  icon,
  iconColor = colors.primary,
  label,
  value,
  valueColor = colors.text,
  onPress,
}: {
  icon: KitIconName;
  iconColor?: string;
  label: string;
  value: ReactNode;
  valueColor?: string;
  onPress?: () => void;
}) {
  const shellStyle = {
    width: '48%',
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 12,
  } as const;

  const body = (
    <>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.md,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KitIcon name={icon} color={iconColor} />
      </View>
      <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 18 }}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text
          style={[tabular, { fontSize: 24, fontWeight: '700', color: valueColor, lineHeight: 28 }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={shellStyle}>
        {body}
      </Pressable>
    );
  }
  return <View style={shellStyle}>{body}</View>;
}

export function PnLCard({
  label,
  profit,
  revenue,
  expenses,
  trend,
}: {
  label: string;
  profit: number;
  revenue: number;
  expenses: number;
  trend?: number | null;
}) {
  const positive = profit >= 0;
  const up = trend != null && trend >= 0;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        minWidth: 0,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: colors.textMuted }}>{label}</Text>
        {trend != null ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
              backgroundColor: up ? colors.profitMuted : colors.lossMuted,
              borderRadius: radii.full,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <KitIcon name={up ? 'trending-up' : 'trending-down'} size={12} color={up ? colors.profit : colors.loss} />
            <Text style={[tabular, { fontSize: 11, fontWeight: '600', color: up ? colors.profit : colors.loss }]}>
              {Math.abs(trend)}%
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[tabular, { fontSize: 22, fontWeight: '700', color: positive ? colors.profit : colors.loss, marginTop: 6 }]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {rub(profit)}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>прибыль</Text>
      <View style={{ marginTop: 12, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Выручка</Text>
          <Text style={[tabular, { fontSize: 11, color: colors.text }]}>{rub(revenue)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Расходы</Text>
          <Text style={[tabular, { fontSize: 11, color: colors.text }]}>{rub(expenses)}</Text>
        </View>
      </View>
    </View>
  );
}

export type DonutSlice = { label: string; value: number; color: string };

const DONUT_COLORS = [colors.primary, colors.profit, colors.warning, colors.loss, colors.accent];

export function DonutChart({ data, total }: { data: DonutSlice[]; total?: number }) {
  const sum = total ?? data.reduce((s, d) => s + d.value, 0);
  const slices = data.filter((d) => d.value > 0).slice(0, 5);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          borderWidth: 12,
          borderColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <Text style={{ fontSize: 9, color: colors.textMuted, textTransform: 'uppercase' }}>Расходы</Text>
        <Text
          style={[tabular, { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {rub(sum)}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        {slices.map((d, i) => (
          <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: d.color || DONUT_COLORS[i % DONUT_COLORS.length],
              }}
            />
            <Text style={{ flex: 1, fontSize: 11, color: colors.textMuted }} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={[tabular, { fontSize: 11, fontWeight: '600', color: colors.text }]}>{rub(d.value)}</Text>
          </View>
        ))}
        {slices.length === 0 ? (
          <Text style={{ fontSize: 12, color: colors.textMuted }}>Нет расходов за период</Text>
        ) : null}
      </View>
      </View>
      {slices.length > 0 ? (
        <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: spacing.sm }}>
          {slices.map((d, i) => (
            <View
              key={`bar-${d.label}`}
              style={{
                flex: sum > 0 ? d.value / sum : 0,
                backgroundColor: d.color || DONUT_COLORS[i % DONUT_COLORS.length],
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ListRow({
  icon,
  iconColor = colors.primary,
  accent,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  icon?: KitIconName;
  iconColor?: string;
  accent?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        marginBottom: spacing.sm,
        overflow: 'hidden',
      }}
    >
      {accent ? (
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: accent }} />
      ) : null}
      {icon ? (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <KitIcon name={icon} color={iconColor} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? <KitIcon name="chevron-right" size={18} color={colors.textMuted} />}
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
  return content;
}

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: radii.full,
              backgroundColor: active ? colors.primary : colors.surface,
              borderWidth: active ? 0 : 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: active ? '#fff' : colors.textMuted }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SearchBar({
  placeholder = 'Поиск',
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: spacing.sm,
      }}
    >
      <KitIcon name="search" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={{ flex: 1, fontSize: 14, color: colors.text, padding: 0 }}
      />
    </View>
  );
}

const STATUS_STYLES = {
  new: { bg: colors.primaryMuted, text: colors.primaryLight },
  active: { bg: colors.profitMuted, text: colors.profit },
  done: { bg: colors.profitMuted, text: colors.profit },
  warning: { bg: colors.warningMuted, text: colors.warning },
  loss: { bg: colors.lossMuted, text: colors.loss },
  muted: { bg: colors.surfaceElevated, text: colors.textMuted },
} as const;

export function StatusPill({
  label,
  tone = 'muted',
}: {
  label: string;
  tone?: keyof typeof STATUS_STYLES;
}) {
  const s = STATUS_STYLES[tone];
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: s.text }}>{label}</Text>
    </View>
  );
}

export function FAB({
  label,
  icon = 'plus',
  onPress,
  style,
}: {
  label?: string;
  icon?: KitIconName;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          position: 'absolute',
          right: spacing.md,
          bottom: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.primary,
          borderRadius: radii.full,
          paddingHorizontal: 20,
          paddingVertical: 14,
          elevation: 8,
          shadowColor: colors.primary,
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
        style,
      ]}
    >
      <KitIcon name={icon} color="#fff" />
      {label ? <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{label}</Text> : null}
    </Pressable>
  );
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
}: {
  icon?: KitIconName;
  title: string;
  description?: string;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: spacing.lg }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: radii.lg,
          backgroundColor: colors.surfaceElevated,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <KitIcon name={icon} size={28} />
      </View>
      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>{title}</Text>
      {description ? (
        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>{description}</Text>
      ) : null}
    </View>
  );
}

export function ProfileCard({ title, subtitle, icon = 'home' }: { title: string; subtitle: string; icon?: KitIconName }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.primaryMuted,
        borderWidth: 1,
        borderColor: `${colors.primary}66`,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radii.md,
          backgroundColor: `${colors.primary}33`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KitIcon name={icon} color={colors.primaryLight} size={24} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export function OptiSyncBanner() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.primaryMuted,
        borderWidth: 1,
        borderColor: `${colors.primary}66`,
        borderRadius: radii.lg,
        padding: 14,
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radii.md,
          backgroundColor: `${colors.primary}33`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KitIcon name="refresh-cw" color={colors.primaryLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Синхронизация Opti</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>Топливные транзакции</Text>
      </View>
      <StatusPill label="Активно" tone="active" />
    </View>
  );
}

export function KitTextField({
  label,
  icon,
  secure,
  ...props
}: { label: string; icon: KitIconName; secure?: boolean } & TextInputProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <KitIcon name={icon} />
        <TextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure}
          style={{ flex: 1, fontSize: 16, color: colors.text, padding: 0 }}
          {...props}
        />
      </View>
    </View>
  );
}

export function LoadingInline() {
  return <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />;
}

export function DriverTaskStepper({ activeStep }: { activeStep: number }) {
  const steps: { key: string; label: string; icon: KitIconName }[] = [
    { key: 'load', label: 'Погрузка', icon: 'package' },
    { key: 'unload', label: 'Разгрузка', icon: 'map-pin' },
    { key: 'ttn', label: 'ТТН', icon: 'file-text' },
  ];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: spacing.md }}>
      {steps.map((s, i) => {
        const done = i < activeStep;
        const active = i === activeStep;
        return (
          <View key={s.key} style={{ flex: i < steps.length - 1 ? 1 : undefined, flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ alignItems: 'center', width: 72 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: active ? colors.primary : done ? colors.profit : colors.border,
                  backgroundColor: active ? colors.primary : done ? colors.profit : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {done ? (
                  <KitIcon name="check" color="#fff" size={18} />
                ) : (
                  <KitIcon name={s.icon} color={active ? '#fff' : colors.textMuted} size={18} />
                )}
              </View>
              <Text
                style={{
                  fontSize: 11,
                  marginTop: 4,
                  color: active ? colors.primaryLight : colors.textMuted,
                  fontWeight: active ? '700' : '500',
                }}
              >
                {s.label}
              </Text>
            </View>
            {i < steps.length - 1 ? (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: i < activeStep ? colors.profit : colors.border,
                  marginTop: 20,
                  marginHorizontal: 4,
                }}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function PrimaryButton({ label, onPress, loading }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={{
        backgroundColor: colors.primary,
        borderRadius: radii.lg,
        paddingVertical: 16,
        alignItems: 'center',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{label}</Text>
      )}
    </Pressable>
  );
}
