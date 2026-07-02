import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, LoadingScreen } from '../components/ui';
import { apiErrorMessage, getServerHost } from '../api/client';
import { listVehicles } from '../api/vehicles';
import {
  deleteVehicleDocument,
  listVehicleDocuments,
  uploadVehicleDocument,
} from '../api/vehicleDocuments';
import type { RootStackParamList } from '../navigation/types';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';
import { formatDateTimeRu } from '../utils/datePeriods';
import {
  VEHICLE_DOCUMENT_ICONS,
  VEHICLE_DOCUMENT_LABELS,
  VEHICLE_DOCUMENT_TYPES,
} from '../utils/vehicleDocumentTypes';
import type { Vehicle, VehicleDocument, VehicleDocumentType } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDocuments'>;

export function VehicleDocumentsScreen({ route }: Props) {
  const initialVehicleId = route.params?.vehicleId;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(initialVehicleId ?? null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingType, setUploadingType] = useState<VehicleDocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileHost, setFileHost] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      const vehicleRows = await listVehicles();
      setVehicles(vehicleRows);
      const vehicleId = selectedVehicleId ?? initialVehicleId ?? vehicleRows[0]?.id ?? null;
      if (vehicleId != null && selectedVehicleId == null) {
        setSelectedVehicleId(vehicleId);
      }
      if (vehicleId == null) {
        setDocuments([]);
        return;
      }
      setDocuments(await listVehicleDocuments(vehicleId));
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить документы'));
    }
  }, [initialVehicleId, selectedVehicleId]);

  useEffect(() => {
    if (selectedVehicleId == null) return;
    void load();
  }, [selectedVehicleId, load]);

  useFocusEffect(
    useCallback(() => {
      void getServerHost().then(setFileHost).catch(() => setFileHost(''));
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const docsByType = useMemo(() => {
    const map = new Map<VehicleDocumentType, VehicleDocument>();
    documents.forEach((doc) => {
      if (!map.has(doc.doc_type)) map.set(doc.doc_type, doc);
    });
    return map;
  }, [documents]);

  const selectedVehicle = vehicles.find((item) => item.id === selectedVehicleId) ?? null;

  const pickVehicle = () => {
    if (vehicles.length === 0) {
      Alert.alert('Нет автомобилей', 'Сначала добавьте автомобиль в справочник');
      return;
    }
    Alert.alert('Автомобиль', undefined, [
      ...vehicles.map((vehicle) => ({
        text: vehicle.plate_number,
        onPress: () => setSelectedVehicleId(vehicle.id),
      })),
      { text: 'Отмена', style: 'cancel' as const },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pickAndUpload = async (docType: VehicleDocumentType, source: 'camera' | 'library') => {
    if (selectedVehicleId == null) return;
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Доступ', 'Разрешите доступ к камере или галерее');
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingType(docType);
    try {
      await uploadVehicleDocument({
        vehicle_id: selectedVehicleId,
        doc_type: docType,
        fileUri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType ?? undefined,
      });
      await load();
      Alert.alert('Готово', `${VEHICLE_DOCUMENT_LABELS[docType]} загружен`);
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось загрузить документ'));
    } finally {
      setUploadingType(null);
    }
  };

  const uploadForType = (docType: VehicleDocumentType) => {
    if (selectedVehicleId == null) {
      Alert.alert('Выберите автомобиль');
      return;
    }
    Alert.alert('Загрузить документ', VEHICLE_DOCUMENT_LABELS[docType], [
      { text: 'Камера', onPress: () => void pickAndUpload(docType, 'camera') },
      { text: 'Галерея', onPress: () => void pickAndUpload(docType, 'library') },
      { text: 'Отмена', style: 'cancel' },
    ]);
  };

  const openDocument = (doc: VehicleDocument) => {
    const url = doc.file_path.startsWith('http') ? doc.file_path : `${fileHost}${doc.file_path}`;
    void Linking.openURL(url).catch(() => Alert.alert('Ошибка', 'Не удалось открыть файл'));
  };

  const removeDocument = (doc: VehicleDocument) => {
    Alert.alert('Удалить документ?', VEHICLE_DOCUMENT_LABELS[doc.doc_type], [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVehicleDocument(doc.id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить'));
          }
        },
      },
    ]);
  };

  if (loading && vehicles.length === 0) {
    return <LoadingScreen label="Загрузка документов…" />;
  }

  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <ScreenHeader title="📁 Документы на авто" />
      <ScreenHero title="Документы машины" subtitle="СТС, ПТС, договор, страховка, паспорт водителя" />
      <ErrorText message={error} />

      <Pressable onPress={pickVehicle} style={[screenUi.card, { marginBottom: 12 }]}>
        <Text style={{ fontSize: 13, color: colors.textMuted }}>Автомобиль</Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 4 }}>
          {selectedVehicle?.plate_number ?? 'Выберите автомобиль'}
        </Text>
      </Pressable>

      {VEHICLE_DOCUMENT_TYPES.map((docType) => {
        const doc = docsByType.get(docType);
        const busy = uploadingType === docType;
        return (
          <View key={docType} style={[screenUi.card, { marginBottom: 10 }]}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {VEHICLE_DOCUMENT_ICONS[docType]} {VEHICLE_DOCUMENT_LABELS[docType]}
            </Text>
            {doc ? (
              <>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
                  Загружен: {formatDateTimeRu(doc.created_at)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <Pressable
                    onPress={() => openDocument(doc)}
                    style={[screenUi.actionBtn, { flex: 1, backgroundColor: colors.primary }]}
                  >
                    <Text style={screenUi.actionBtnText}>Открыть</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeDocument(doc)}
                    style={[screenUi.actionBtn, { flex: 1, backgroundColor: colors.loss }]}
                  >
                    <Text style={screenUi.actionBtnText}>Удалить</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>Не загружен</Text>
            )}
            <Pressable
              onPress={() => uploadForType(docType)}
              disabled={busy || selectedVehicleId == null}
              style={[
                screenUi.actionBtn,
                {
                  marginTop: 10,
                  backgroundColor: colors.accent,
                  opacity: busy || selectedVehicleId == null ? 0.6 : 1,
                },
              ]}
            >
              <Text style={screenUi.actionBtnText}>{busy ? 'Загрузка…' : doc ? 'Заменить' : 'Загрузить'}</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
