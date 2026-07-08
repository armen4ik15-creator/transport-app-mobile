import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionTitle } from '../components/ui-kit';
import { ErrorText, LoadingScreen, MenuButton, PrimaryButton } from '../components/ui';
import { getBackupStatus, runBackup, type BackupStatus } from '../api/backups';
import { apiErrorMessage, getApiBaseUrl } from '../api/client';
import { getStoredToken } from '../storage/sessionStorage';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { colors, spacing } from '../theme';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function BackupsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [running, setRunning] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getBackupStatus();
      setStatus(data);
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить статус бэкапов'));
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

  const onRunBackup = async () => {
    setRunning(true);
    try {
      const result = await runBackup(true);
      Alert.alert(
        'Готово',
        `Архив ${result.filename} создан (${formatBytes(result.sizeBytes)})`
      );
      await load();
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать резервную копию'));
    } finally {
      setRunning(false);
    }
  };

  const onDownload = async (filename: string) => {
    setDownloading(filename);
    try {
      const apiBase = await getApiBaseUrl();
      const token = await getStoredToken();
      const url = `${apiBase}/backups/download/${encodeURIComponent(filename)}`;
      const targetUri = `${FileSystem.cacheDirectory ?? ''}${filename}`;
      const result = await FileSystem.downloadAsync(url, targetUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (result.status !== 200) {
        throw new Error(`Сервер вернул код ${result.status}`);
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/zip',
          dialogTitle: filename,
        });
      } else {
        Alert.alert('Сохранено', result.uri);
      }
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось скачать архив'));
    } finally {
      setDownloading(null);
    }
  };

  if (loading && !status) {
    return <LoadingScreen label="Загрузка…" />;
  }

  const remote = status?.remote;

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <ScreenHeader title="Резервные копии" showBack onBack={() => navigation.goBack()} />

      <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 }}>
        Полный архив: база данных, все ТТН, документы, реестры и журнал действий. Хранится на сервере и
        (при настройке) в облаке S3.
      </Text>

      <ErrorText message={error} />

      <View style={screenUi.card}>
        <SectionTitle>Статус</SectionTitle>
        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
          Автобэкап: {status?.enabled ? `каждые ${status.intervalHours} ч.` : 'выключен'}
        </Text>
        {status?.cronSchedule ? (
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
            Ежедневно по cron: {status.cronSchedule}
          </Text>
        ) : null}
        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
          {status?.running ? '⏳ Выполняется…' : '✅ Готов к запуску'}
        </Text>
        {status?.storage ? (
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
            Диск /data: {status.storage.data_dir_writable ? '✅ запись' : '⚠️ нет записи'} · файлов uploads:{' '}
            {status.storage.uploads_file_count}
          </Text>
        ) : null}
        {status?.latest ? (
          <Text style={{ color: colors.text, fontSize: 13, marginTop: 8 }}>
            Последний: {formatDate(status.latest.createdAt)} · {formatBytes(status.latest.sizeBytes)}
          </Text>
        ) : (
          <Text style={{ color: colors.warning, fontSize: 13, marginTop: 8 }}>Бэкапов пока нет</Text>
        )}
      </View>

      {(status?.storage?.warnings?.length ?? 0) > 0 ? (
        <View style={[screenUi.card, { marginTop: spacing.sm, borderColor: colors.warning, borderWidth: 1 }]}>
          <SectionTitle>Внимание</SectionTitle>
          {(status?.storage?.warnings ?? []).map((warning) => (
            <Text key={warning} style={{ fontSize: 12, color: colors.warning, marginTop: 6, lineHeight: 18 }}>
              • {warning}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={[screenUi.card, { marginTop: spacing.sm }]}>
        <SectionTitle>Облачное хранилище</SectionTitle>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
          S3: {remote?.s3 ? '✅ настроено' : '⚠️ не настроено'}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
          Webhook: {remote?.webhook ? '✅' : '—'}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
          Telegram: {remote?.telegram ? '✅' : '—'}
        </Text>
        {!remote?.s3 ? (
          <Text style={{ fontSize: 12, color: colors.warning, marginTop: 8, lineHeight: 18 }}>
            Для защиты от потери сервера настройте S3 в переменных окружения (см. docs/BACKUP.md).
          </Text>
        ) : null}
      </View>

      <PrimaryButton
        label={running || status?.running ? 'Создание копии…' : 'Создать резервную копию сейчас'}
        onPress={onRunBackup}
        loading={running || Boolean(status?.running)}
        disabled={!status?.enabled}
      />

      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }}>
        Локальные архивы на сервере
      </Text>

      {(status?.backups ?? []).length === 0 ? (
        <Text style={screenUi.emptyText}>Архивы не найдены</Text>
      ) : (
        (status?.backups ?? []).map((item) => (
          <View key={item.filename} style={[screenUi.card, { marginBottom: spacing.sm }]}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.filename}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              {formatDate(item.createdAt)} · {formatBytes(item.sizeBytes)}
            </Text>
            {item.manifest?.uploads ? (
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                Файлов ТТН/документов: {item.manifest.uploads.file_count}
              </Text>
            ) : null}
            <Pressable
              onPress={() => void onDownload(item.filename)}
              disabled={downloading === item.filename}
              style={[screenUi.secondaryBtn, { marginTop: 10, marginBottom: 0 }]}
            >
              <Text style={screenUi.secondaryBtnText}>
                {downloading === item.filename ? 'Скачивание…' : '📥 Скачать на телефон'}
              </Text>
            </Pressable>
          </View>
        ))
      )}

      {(status?.s3Backups ?? []).length > 0 ? (
        <>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }}>
            Архивы в облаке S3
          </Text>
          {(status?.s3Backups ?? []).map((item) => (
            <View key={item.key} style={[screenUi.card, { marginBottom: spacing.sm }]}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.key}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                {item.lastModified ? formatDate(item.lastModified) : '—'} · {formatBytes(item.sizeBytes)}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      <MenuButton label="Обновить список" onPress={onRefresh} variant="secondary" />
    </ScrollView>
  );
}
