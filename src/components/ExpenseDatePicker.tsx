import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';
import { todayIso } from '../utils/datePeriods';

interface ExpenseDatePickerProps {
  value: string;
  onChange: (iso: string) => void;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseIsoDate(value: string): { year: number; month: number; day: number } {
  const now = new Date();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }
  return { year: parsed.getFullYear(), month: parsed.getMonth(), day: parsed.getDate() };
}

function yesterdayIso(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function formatDisplayRu(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Выберите дату';
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function ExpenseDatePicker({ value, onChange }: ExpenseDatePickerProps) {
  const [expanded, setExpanded] = useState(false);
  const initial = parseIsoDate(value);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; iso?: string }> = [];
    for (let i = 0; i < offset; i += 1) cells.push({ day: null });
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, iso: toIsoDate(year, month, day) });
    }
    return cells;
  }, [month, year]);

  const monthLabel = new Date(year, month, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const pickDate = (iso: string) => {
    onChange(iso);
    setExpanded(false);
    const parsed = parseIsoDate(iso);
    setYear(parsed.year);
    setMonth(parsed.month);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={screenUi.fieldLabel}>Дата *</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <Pressable
          onPress={() => pickDate(todayIso())}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: value === todayIso() ? 'rgba(26,115,232,0.15)' : colors.surfaceElevated,
            borderWidth: 1,
            borderColor: value === todayIso() ? colors.primary : colors.border,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>Сегодня</Text>
        </Pressable>
        <Pressable
          onPress={() => pickDate(yesterdayIso())}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: value === yesterdayIso() ? 'rgba(26,115,232,0.15)' : colors.surfaceElevated,
            borderWidth: 1,
            borderColor: value === yesterdayIso() ? colors.primary : colors.border,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>Вчера</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        style={{
          borderWidth: 1,
          borderColor: expanded ? colors.primary : colors.border,
          backgroundColor: colors.surface,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Дата расхода</Text>
          <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600', marginTop: 2 }}>
            {formatDisplayRu(value)}
          </Text>
        </View>
        <Text style={{ fontSize: 16, color: colors.primary }}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {expanded ? (
        <View
          style={{
            marginTop: 8,
            borderRadius: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 10,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable onPress={() => shiftMonth(-1)} hitSlop={8}>
              <Text style={{ fontSize: 18, color: colors.primary }}>‹</Text>
            </Pressable>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.text,
                textTransform: 'capitalize',
              }}
            >
              {monthLabel}
            </Text>
            <Pressable onPress={() => shiftMonth(1)} hitSlop={8}>
              <Text style={{ fontSize: 18, color: colors.primary }}>›</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {WEEKDAY_LABELS.map((label) => (
              <Text
                key={label}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 11,
                  color: colors.textMuted,
                  fontWeight: '600',
                }}
              >
                {label}
              </Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            {days.map((cell, index) => {
              const selected = cell.iso === value;
              return (
                <Pressable
                  key={`${cell.iso ?? 'empty'}-${index}`}
                  disabled={!cell.day}
                  onPress={() => cell.iso && pickDate(cell.iso)}
                  style={{
                    width: `${100 / 7}%`,
                    aspectRatio: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cell.day ? (
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? colors.primary : 'transparent',
                      }}
                    >
                      <Text style={{ color: selected ? colors.text : colors.textMuted, fontSize: 13 }}>
                        {cell.day}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
