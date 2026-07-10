import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { DateRangePicker } from '../components/DateRangePicker';
import { FilterChipRow } from '../components/FilterChipRow';
import { RemoteImage } from '../components/RemoteImage';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, LoadingScreen, MenuButton } from '../components/ui';
import { getAllPhotos, dedupePhotoRecords, type GetAllPhotosParams } from '../api/photos';
import { apiErrorMessage } from '../api/client';
import { deleteTripPhoto } from '../api/trips';
import { listDrivers } from '../api/drivers';
import { listOrders } from '../api/orders';
import { useAuth } from '../auth/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';
import { downloadPhotoForShare, resolvePhotoLocalUri } from '../utils/photoUrl';
import { withFallback } from '../utils/safeRequest';
import type { Driver, Order, TtnPhotoRecord } from '../types';

const PAGE_SIZE = 40;
const GRID_GAP = 8;
const HORIZONTAL_PADDING = 16;

function yearBounds(): { from: string; to: string } {
  const year = new Date().getFullYear();
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

function formatPhotoDate(value: string | null): string {
  if (!value) return '—';
  return value.slice(0, 10);
}

function photoKey(photo: TtnPhotoRecord): string {
  return `${photo.source}-${photo.trip_id ?? photo.id}-${photo.file_path}`;
}

function canDeletePhoto(
  photo: TtnPhotoRecord,
  isAdmin: boolean,
  currentDriverId: number | null,
): boolean {
  if (photo.source !== 'trip' || photo.trip_id == null) return isAdmin;
  if (isAdmin) return true;
  return currentDriverId != null && photo.driver_id === currentDriverId;
}

export function AllPhotosScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, driver } = useAuth();
  const isAdmin = user?.role === 'admin';
  const currentDriverId = driver?.id ?? null;
  const initialBounds = yearBounds();
  const [photos, setPhotos] = useState<TtnPhotoRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState(initialBounds.from);
  const [dateTo, setDateTo] = useState(initialBounds.to);
  const [appliedFilters, setAppliedFilters] = useState<GetAllPhotosParams>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<TtnPhotoRecord | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  const itemWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return (screenWidth - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
  }, []);

  const loadMeta = useCallback(async () => {
    const [driverData, orderData] = await Promise.all([
      withFallback(() => listDrivers(), []),
      withFallback(() => listOrders(), []),
    ]);
    setDrivers(driverData);
    setOrders(orderData);
  }, []);

  const fetchPhotos = useCallback(async (filters: GetAllPhotosParams, offset: number, append: boolean) => {
    try {
      setError(null);
      const batch = await getAllPhotos({
        ...filters,
        limit: PAGE_SIZE,
        offset,
      });
      setPhotos((prev) =>
        append ? dedupePhotoRecords([...prev, ...batch]) : dedupePhotoRecords(batch),
      );
      setHasMore(batch.length === PAGE_SIZE);
    } catch (e) {
      const message = apiErrorMessage(e, 'Не удалось загрузить фотографии');
      setError(message);
      if (!append) {
        Alert.alert('Ошибка', message);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadMeta();
      if (!cancelled) {
        await fetchPhotos({}, 0, false);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPhotos, loadMeta]);

  useEffect(() => {
    if (!previewPhoto) {
      setPreviewUri(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    resolvePhotoLocalUri(previewPhoto.file_path)
      .then((uri) => {
        if (!cancelled) setPreviewUri(uri);
      })
      .catch(() => {
        if (!cancelled) setPreviewUri(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [previewPhoto]);

  const onDeletePhoto = () => {
    if (!previewPhoto || previewPhoto.source !== 'trip' || previewPhoto.trip_id == null) {
      Alert.alert('Удаление', 'Удаление доступно только для фото рейсов.');
      return;
    }
    if (!canDeletePhoto(previewPhoto, isAdmin, currentDriverId)) {
      Alert.alert('Удаление', 'Недостаточно прав для удаления этого фото.');
      return;
    }
    Alert.alert('Удалить фото?', 'Рейс останется зачтённым в зарплате. Будет удалено только фото.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setDeletingPhoto(true);
            try {
              await deleteTripPhoto(previewPhoto.trip_id as number);
              setPreviewPhoto(null);
              setHasMore(true);
              await fetchPhotos(appliedFilters, 0, false);
            } catch (e) {
              Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить фото'));
            } finally {
              setDeletingPhoto(false);
            }
          })();
        },
      },
    ]);
  };

  const onSharePhoto = async () => {
    if (!previewPhoto) return;
    setSavingPhoto(true);
    try {
      const localUri = await downloadPhotoForShare(previewPhoto.file_path, previewPhoto.id);
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Готово', `Файл сохранён:\n${localUri}`);
        return;
      }
      await Sharing.shareAsync(localUri, {
        mimeType: 'image/jpeg',
        dialogTitle: `ТТН заказ #${previewPhoto.order_id}`,
      });
    } catch (shareError) {
      const message =
        shareError instanceof Error ? shareError.message : 'Не удалось сохранить фото';
      Alert.alert('Ошибка', message);
    } finally {
      setSavingPhoto(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setHasMore(true);
    await Promise.all([loadMeta(), fetchPhotos(appliedFilters, 0, false)]);
    setRefreshing(false);
  };

  const onApplyFilters = async () => {
    const nextFilters: GetAllPhotosParams = {
      driver_id: driverId ?? undefined,
      order_id: orderId ?? undefined,
      date_from: dateFrom.trim() || undefined,
      date_to: dateTo.trim() || undefined,
    };
    setAppliedFilters(nextFilters);
    setLoading(true);
    setHasMore(true);
    await fetchPhotos(nextFilters, 0, false);
    setLoading(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || loading || !hasMore || photos.length === 0) return;
    setLoadingMore(true);
    await fetchPhotos(appliedFilters, photos.length, true);
    setLoadingMore(false);
  };

  const driverChips = useMemo(
    () => [
      { id: 'all', label: '👥 Все' },
      ...drivers.map((driver) => ({
        id: String(driver.id),
        label: driver.full_name ?? driver.email,
      })),
    ],
    [drivers]
  );

  const orderOptions = useMemo(() => {
    return orders.filter((order) => {
      if (driverId != null && order.driver_id !== driverId) return false;
      return true;
    });
  }, [driverId, orders]);

  const pickOrder = () => {
    Alert.alert('Заказ', undefined, [
      {
        text: 'Все заказы',
        onPress: () => setOrderId(null),
      },
      ...orderOptions.slice(0, 20).map((order) => ({
        text: `#${order.id} · ${order.contractor_name ?? order.task_name ?? 'Заказ'}`,
        onPress: () => setOrderId(order.id),
      })),
      { text: 'Отмена', style: 'cancel' as const },
    ]);
  };

  const orderFilterLabel = useMemo(() => {
    if (orderId == null) return 'Все заказы';
    const order = orders.find((item) => item.id === orderId);
    if (!order) return `Заказ #${orderId}`;
    return `#${order.id} · ${order.contractor_name ?? order.task_name ?? 'Заказ'}`;
  }, [orderId, orders]);

  if (loading && photos.length === 0) {
    return <LoadingScreen label="Загрузка фотографий…" />;
  }

  return (
    <View style={screenUi.container}>
      <FlatList
        data={photos}
        keyExtractor={photoKey}
        numColumns={2}
        columnWrapperStyle={{ gap: GRID_GAP, marginBottom: GRID_GAP }}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={[screenUi.content, { paddingHorizontal: 0 }]}>
            <ScreenHeader
              title="Фото ТТН"
              showBack
              onBack={() => navigation.goBack()}
              showPageTitle={false}
            />

            <CollapsiblePanel
              title="Фильтры"
              subtitle={`${photos.length} фото · ${dateFrom} — ${dateTo}`}
              defaultExpanded
            >
              <Text style={screenUi.filterLabel}>Водитель:</Text>
              <FilterChipRow
                items={driverChips}
                activeId={driverId == null ? 'all' : String(driverId)}
                onSelect={(id) => setDriverId(id === 'all' ? null : Number(id))}
              />

              <Text style={screenUi.filterLabel}>Заказ:</Text>
              <Pressable onPress={pickOrder} style={screenUi.selectField}>
                <Text style={{ fontSize: 14, color: colors.text }}>📦 {orderFilterLabel}</Text>
              </Pressable>

              <DateRangePicker
                from={dateFrom}
                to={dateTo}
                onChangeFrom={setDateFrom}
                onChangeTo={setDateTo}
              />

              <MenuButton label="🔍 Применить фильтр" onPress={onApplyFilters} variant="secondary" />
            </CollapsiblePanel>

            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Найдено</Text>
                <Text style={[screenUi.sumValue, { color: colors.primary }]}>{photos.length}</Text>
              </View>
            </View>

            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setPreviewPhoto(item)}
            style={{
              width: itemWidth,
              backgroundColor: colors.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <RemoteImage
              filePath={item.file_path}
              style={{ width: '100%', height: itemWidth * 0.75 }}
              resizeMode="cover"
            />
            <View style={{ padding: 8 }}>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                {formatPhotoDate(item.uploaded_at)}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                {item.driver_name ?? '—'}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                {item.trip_id != null ? `Рейс #${item.trip_id}` : `Заказ #${item.order_id}`}
                {item.ttn_number ? ` · ТТН ${item.ttn_number}` : ''}
              </Text>
              {item.photo_available === false ? (
                <Text style={{ fontSize: 10, color: '#d97706', marginTop: 2 }}>⚠️ Файл на сервере отсутствует</Text>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <Text style={screenUi.emptyText}>Фотографии ТТН не найдены</Text>
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} /> : null
        }
      />

      <Modal visible={previewPhoto != null} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: colors.overlay,
            justifyContent: 'center',
          }}
        >
          <Pressable
            onPress={() => setPreviewPhoto(null)}
            style={{ position: 'absolute', top: 48, right: 20, zIndex: 2, padding: 8 }}
          >
            <Text style={{ color: colors.text, fontSize: 28 }}>✕</Text>
          </Pressable>

          {previewPhoto ? (
            <>
              {previewLoading ? (
                <ActivityIndicator color={colors.primary} size="large" />
              ) : previewUri ? (
                <Image
                  source={{ uri: previewUri }}
                  style={{ width: '100%', height: '70%' }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 24 }}>
                  Не удалось загрузить превью
                </Text>
              )}
              <View style={{ padding: 20 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                  {previewPhoto.trip_id != null
                    ? `Рейс #${previewPhoto.trip_id}`
                    : `Заказ #${previewPhoto.order_id}`}
                </Text>
                <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                  {previewPhoto.driver_name ?? '—'} · {formatPhotoDate(previewPhoto.uploaded_at)}
                  {previewPhoto.ttn_number ? ` · ТТН ${previewPhoto.ttn_number}` : ''}
                </Text>
                <Pressable
                  onPress={() => void onSharePhoto()}
                  disabled={savingPhoto || previewPhoto.photo_available === false}
                  style={[screenUi.saveBtn, { marginTop: 16 }, (savingPhoto || previewPhoto.photo_available === false) && { opacity: 0.7 }]}
                >
                  <Text style={screenUi.saveBtnText}>
                    {savingPhoto ? 'Сохранение…' : '📤 Сохранить / Поделиться'}
                  </Text>
                </Pressable>
                {canDeletePhoto(previewPhoto, isAdmin, currentDriverId) ? (
                  <Pressable
                    onPress={onDeletePhoto}
                    disabled={deletingPhoto}
                    style={[screenUi.saveBtn, { marginTop: 10, backgroundColor: '#7f1d1d' }, deletingPhoto && { opacity: 0.7 }]}
                  >
                    <Text style={screenUi.saveBtnText}>
                      {deletingPhoto ? 'Удаление…' : '🗑 Удалить фото'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
