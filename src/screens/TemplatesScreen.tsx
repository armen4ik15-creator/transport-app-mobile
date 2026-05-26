import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
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
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from '../api/templates';
import type { DocumentTemplate, DocumentType } from '../types';

const initialForm = {
  id: '',
  name: '',
  type: 'waybill' as DocumentType,
  content: '',
};

function templateTypeLabel(type: DocumentType): string {
  if (type === 'waybill') return 'Путевой лист';
  if (type === 'invoice') return 'Счёт';
  return 'Акт';
}

export function TemplatesScreen() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setTemplates(await listTemplates());
    } catch (e) {
      setError(apiErrorMessage(e, 'Не удалось загрузить шаблоны'));
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

  const onCreate = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      Alert.alert('Ошибка', 'Укажите имя и контент шаблона');
      return;
    }
    setSaving(true);
    try {
      await createTemplate({
        name: form.name.trim(),
        type: form.type,
        content: form.content,
      });
      setForm(initialForm);
      await load();
      Alert.alert('Успех', 'Шаблон создан');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось создать шаблон'));
    } finally {
      setSaving(false);
    }
  };

  const onUpdate = async () => {
    const id = Number(form.id);
    if (!Number.isFinite(id) || id <= 0) {
      Alert.alert('Ошибка', 'Укажите ID шаблона для обновления');
      return;
    }
    if (!form.name.trim() && !form.content.trim()) {
      Alert.alert('Ошибка', 'Укажите хотя бы name или content');
      return;
    }
    setSaving(true);
    try {
      await updateTemplate(id, {
        name: form.name.trim() || undefined,
        type: form.type,
        content: form.content.trim() || undefined,
      });
      setForm(initialForm);
      await load();
      Alert.alert('Успех', 'Шаблон обновлён');
    } catch (e) {
      Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось обновить шаблон'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (item: DocumentTemplate) => {
    Alert.alert('Удалить шаблон?', `${item.name}`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTemplate(item.id);
            await load();
          } catch (e) {
            Alert.alert('Ошибка', apiErrorMessage(e, 'Не удалось удалить шаблон'));
          }
        },
      },
    ]);
  };

  if (loading && templates.length === 0) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f4f6f8' }}>
      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            <Title>Шаблоны документов</Title>
            <Subtitle>Создание и редактирование шаблонов</Subtitle>
            <ErrorText message={error} />
            <Card>
              <Field
                label="Template ID (для обновления)"
                value={form.id}
                onChangeText={(value) => setForm((prev) => ({ ...prev, id: value }))}
                keyboardType="number-pad"
              />
              <Field
                label="Название"
                value={form.name}
                onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
              />
              <Field
                label="Контент (HTML или текст)"
                value={form.content}
                onChangeText={(value) => setForm((prev) => ({ ...prev, content: value }))}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{ minHeight: 110 }}
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
              <PrimaryButton label="Создать" onPress={onCreate} loading={saving} />
              <MenuButton label="Обновить по ID" onPress={onUpdate} variant="secondary" />
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Subtitle>
              #{item.id} · {templateTypeLabel(item.type)}
            </Subtitle>
            <Title>{item.name}</Title>
            <Subtitle>{item.created_at}</Subtitle>
            <Subtitle>{item.content}</Subtitle>
            <MenuButton label="Удалить" onPress={() => onDelete(item)} variant="danger" />
          </Card>
        )}
        ListEmptyComponent={<EmptyText text="Шаблонов пока нет" />}
      />
    </View>
  );
}
