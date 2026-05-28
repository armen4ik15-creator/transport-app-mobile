import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { deleteDocument, listDocuments, uploadDocument } from '../api/documents';
import { listOrders } from '../api/orders';
import { screenUi } from '../styles/screenUi';
import { withFallback } from '../utils/safeRequest';
import { useAuth } from '../auth/AuthContext';
import type { DocumentRecord, DocumentType, Order } from '../types';

const initialForm = {
  order_id: 0,
  type: 'waybill' as DocumentType,
  fileUri: '',
};

function getDocTypeLabel(type: DocumentType): string {
  if (type === 'waybill') return '📄 Путевой лист';
  if (type === 'invoice') return '🧮 Счёт';
  return '📋 Акт';
}

export function DocumentsScreen() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [docsData, ordersData] = await Promise.all([
        withFallback(() => listDocuments(), []),
        withFallback(() => listOrders(), []),
      ]);
      setDocuments(docsData);
      setOrders(ordersData);
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
      Alert.alert('Ошибка', 'Выберите заказ');
      return;
    }
    if (!form.fileUri) {
      Alert.alert('Ошибка', 'Выберите фото документа');
      return;
    }
    setUploading(true);
    try {
      await uploadDocument({ order_id: orderId, type: form.type, fileUri: form.fileUri });
      setForm(initialForm);
      setFormVisible(false);
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

  if (loading && documents.length === 0) return <LoadingScreen label="Загрузка документов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={documents}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader
              title="📑 Документы"
              actionLabel="+ Загрузить"
              onAction={() => setFormVisible(true)}
            />
            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
              {user?.role === 'admin' ? 'Все загруженные документы' : 'Ваши документы по заказам'}
            </Text>
            <View style={screenUi.summaryBar}>
              <View style={screenUi.sumItem}>
                <Text style={screenUi.sumLabel}>Документов</Text>
                <Text style={[screenUi.sumValue, { color: '#2563eb' }]}>{documents.length}</Text>
              </View>
            </View>
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
              {getDocTypeLabel(item.type)} · Заказ #{item.order_id}
            </Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>#{item.id} · {item.created_at}</Text>
            <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>👤 {item.created_by_email}</Text>
            {user?.role === 'admin' ? (
              <Pressable onPress={() => onDelete(item)} style={{ marginTop: 8 }}>
                <Text style={{ color: '#ef4444', fontSize: 13 }}>🗑 Удалить</Text>
              </Pressable>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Документов пока нет</Text>}
      />

      <FormBottomModal
        visible={formVisible}
        title="📤 Загрузить документ"
        saveLabel="Загрузить"
        saving={uploading}
        onSave={onUpload}
        onClose={() => {
          setFormVisible(false);
          setForm(initialForm);
        }}
      >
        <Field
          label="ID заказа"
          value={String(form.order_id || '')}
          onChangeText={(value) => {
            const parsed = Number(value);
            setForm((prev) => ({ ...prev, order_id: Number.isFinite(parsed) ? parsed : 0 }));
          }}
          keyboardType="number-pad"
        />
        {orders.slice(0, 12).map((order) => (
          <MenuButton
            key={order.id}
            label={`${form.order_id === order.id ? '✅ ' : ''}Заказ #${order.id} · ${order.contractor_name ?? '—'}`}
            onPress={() => setForm((prev) => ({ ...prev, order_id: order.id }))}
            variant={form.order_id === order.id ? 'default' : 'secondary'}
          />
        ))}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['waybill', 'invoice', 'act'] as DocumentType[]).map((t) => (
            <View key={t} style={{ flex: 1 }}>
              <MenuButton
                label={form.type === t ? `✅ ${getDocTypeLabel(t)}` : getDocTypeLabel(t)}
                onPress={() => setForm((prev) => ({ ...prev, type: t }))}
                variant={form.type === t ? 'default' : 'secondary'}
              />
            </View>
          ))}
        </View>
        <MenuButton label="📷 Камера" onPress={() => pickDocumentImage('camera')} variant="secondary" />
        <MenuButton label="🖼 Галерея" onPress={() => pickDocumentImage('library')} variant="secondary" />
        <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
          {form.fileUri ? '✅ Файл выбран' : 'Файл не выбран'}
        </Text>
      </FormBottomModal>
    </View>
  );
}
