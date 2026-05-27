import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import {
  Card,
  EmptyText,
  ErrorText,
  Field,
  LoadingScreen,
  MenuButton,
  PrimaryButton,
  Subtitle,
  Title,
} from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { deleteDocument, listDocuments, uploadDocument } from '../api/documents';
import { useAuth } from '../auth/AuthContext';
import type { DocumentRecord, DocumentType } from '../types';

const initialForm = {
  order_id: '',
  type: 'waybill' as DocumentType,
  fileUri: '',
};

function getDocTypeLabel(type: DocumentType): string {
  if (type === 'waybill') return 'Путевой лист';
  if (type === 'invoice') return 'Счёт';
  return 'Акт';
}

export function DocumentsScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const load = useCallback(async () => {
    try {
      setError(null);
      setDocuments(await listDocuments());
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить документы'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pickDocumentImage = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Доступ', 'Разрешите доступ в настройках');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;
    setForm((prev) => ({ ...prev, fileUri: result.assets[0].uri }));
  };

  const onUpload = async () => {
    const orderId = Number(form.order_id);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      Alert.alert('Ошибка', 'Укажите корректный order_id');
      return;
    }
    if (!form.fileUri) {
      Alert.alert('Ошибка', 'Выберите фото документа');
      return;
    }
    setUploading(true);
    try {
      await uploadDocument({
        order_id: orderId,
        type: form.type,
        fileUri: form.fileUri,
      });
      setForm(initialForm);
      await load();
      Alert.alert('Успех', 'Документ загружен');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось загрузить документ'));
    } finally {
      setUploading(false);
    }
  };

  const onDelete = (item: DocumentRecord) => {
    Alert.alert('Удалить документ?', `#${item.id} · ${getDocTypeLabel(item.type)}`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(item.id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить документ'));
          }
        },
      },
    ]);
  };

  if (loading && documents.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={documents}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Документы</Title>
            <Subtitle>
              {user?.role === 'admin'
                ? 'Все загруженные документы'
                : 'Ваши документы по вашим заказам'}
            </Subtitle>
            <ErrorText message={error} />
            <Card>
              <Title>Загрузить документ</Title>
              <Field
                label="Order ID"
                value={form.order_id}
                onChangeText={(value) => setForm((prev) => ({ ...prev, order_id: value }))}
                keyboardType="number-pad"
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <MenuButton
                    label={form.type === 'waybill' ? '✅ Путевой лист' : 'Путевой лист'}
                    onPress={() => setForm((prev) => ({ ...prev, type: 'waybill' }))}
                    variant={form.type === 'waybill' ? 'default' : 'secondary'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <MenuButton
                    label={form.type === 'invoice' ? '✅ Счёт' : 'Счёт'}
                    onPress={() => setForm((prev) => ({ ...prev, type: 'invoice' }))}
                    variant={form.type === 'invoice' ? 'default' : 'secondary'}
                  />
                </View>
              </View>
              <MenuButton
                label={form.type === 'act' ? '✅ Акт' : 'Акт'}
                onPress={() => setForm((prev) => ({ ...prev, type: 'act' }))}
                variant={form.type === 'act' ? 'default' : 'secondary'}
              />
              <MenuButton label="📷 Камера" onPress={() => pickDocumentImage('camera')} variant="secondary" />
              <MenuButton label="🖼 Галерея" onPress={() => pickDocumentImage('library')} variant="secondary" />
              {form.fileUri ? <Subtitle>Файл выбран</Subtitle> : <Subtitle>Файл не выбран</Subtitle>}
              <PrimaryButton label="Загрузить" onPress={onUpload} loading={uploading} />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>
              #{item.id} · {getDocTypeLabel(item.type)} · Заказ #{item.order_id}
            </Subtitle>
            <Subtitle>Файл: {item.file_path}</Subtitle>
            <Subtitle>Дата: {item.created_at}</Subtitle>
            <Subtitle>Автор: {item.created_by_email}</Subtitle>
            {user?.role === 'admin' ? (
              <MenuButton label="Удалить" onPress={() => onDelete(item)} variant="danger" />
            ) : null}
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Документов пока нет" />}
      />
    </View>
  );
}
