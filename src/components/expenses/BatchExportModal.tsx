import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { DateRangePicker } from '../DateRangePicker';
import { screenUi } from '../../styles/screenUi';
import { todayIso } from '../../utils/datePeriods';
import type { ExpenseRecord } from '../../types';
import { colors } from '../../theme';

interface BatchExportModalProps {
  visible: boolean;
  records: ExpenseRecord[];
  exporting: boolean;
  onClose: () => void;
  onExportToday: () => void;
  onExportPeriod: (from: string, to: string) => void;
}

function countInPeriod(records: ExpenseRecord[], from: string, to: string): number {
  return records.filter((item) => {
    if (from && item.exp_date < from) return false;
    if (to && item.exp_date > to) return false;
    return true;
  }).length;
}

export function BatchExportModal({
  visible,
  records,
  exporting,
  onClose,
  onExportToday,
  onExportPeriod,
}: BatchExportModalProps) {
  const today = todayIso();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const todayCount = useMemo(() => countInPeriod(records, today, today), [records, today]);
  const periodPreviewCount = useMemo(() => countInPeriod(records, from, to), [from, records, to]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={screenUi.modalOverlay}>
        <View style={screenUi.modalSheet}>
          <Text style={screenUi.modalTitle}>📤 Экспорт расходов</Text>

          <Pressable
            onPress={onExportToday}
            disabled={exporting}
            style={[screenUi.saveBtn, { marginBottom: 12 }, exporting && { opacity: 0.6 }]}
          >
            <Text style={screenUi.saveBtnText}>
              {exporting
                ? 'Экспорт…'
                : `📅 Экспорт за сегодня (${todayCount} записей)`}
            </Text>
          </Pressable>

          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted, marginBottom: 8 }}>
            Произвольный период
          </Text>
          <DateRangePicker from={from} to={to} onChangeFrom={setFrom} onChangeTo={setTo} />

          <View
            style={{
              backgroundColor: colors.surfaceElevated,
              borderRadius: 10,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 13, color: colors.textMuted }}>
              Записей в текущем списке:{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>{periodPreviewCount}</Text>
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              Экспорт выгрузит все расходы за выбранный период
            </Text>
          </View>

          <Pressable
            onPress={() => onExportPeriod(from, to)}
            disabled={exporting || !from || !to}
            style={[screenUi.saveBtn, exporting && { opacity: 0.6 }]}
          >
            <Text style={screenUi.saveBtnText}>
              {exporting ? 'Скачивание…' : '⬇️ Скачать Excel за период'}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={screenUi.cancelBtn}>
            <Text style={screenUi.cancelBtnText}>Отмена</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
