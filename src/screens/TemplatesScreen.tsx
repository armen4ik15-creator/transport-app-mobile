import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FormBottomModal } from '../components/FormBottomModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { ScreenHero } from '../components/ScreenHero';
import { ErrorText, Field, LoadingScreen, MenuButton } from '../components/ui';
import { apiErrorMessage } from '../api/client';
import { createTemplate, deleteTemplate, listTemplates, updateTemplate } from '../api/templates';
import { screenUi } from '../styles/screenUi';
import type { DocumentTemplate, DocumentType } from '../types';

const initialForm = {
  id: '',
  name: '',
  type: 'waybill' as DocumentType,
  content: '',
};

function templateTypeLabel(type: DocumentType): string {
  if (type === 'waybill') return '📄 Путевой лист';
  if (type === 'invoice') return '🧮 Счёт';
  return '📋 Акт';
}

export function TemplatesScreen() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [form, setForm] = useState(initialForm);
  const [formVisible, setFormVisible] = useState(false);
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
      await createTemplate({ name: form.name.trim(), type: form.type, content: form.content });
      setForm(initialForm);
      setFormVisible(false);
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
      setFormVisible(false);
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

  if (loading && templates.length === 0) return <LoadingScreen label="Загрузка шаблонов…" />;

  return (
    <View style={screenUi.container}>
      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={screenUi.content}>
            <ScreenHeader title="📋 Шаблоны документов" actionLabel="+ Создать" onAction={() => setFormVisible(true)} />
            <ScreenHero title="📄 Word-шаблоны" subtitle="Печать путевых, счетов и актов" />
            <ErrorText message={error} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={screenUi.card} onLongPress={() => onDelete(item)}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              #{item.id} · {templateTypeLabel(item.type)} · {item.created_at}
            </Text>
            <Text style={{ fontSize: 13, color: '#4b5563', marginTop: 6 }} numberOfLines={2}>
              {item.content}
            </Text>
            <Pressable onPress={() => onDelete(item)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#ef4444', fontSize: 13 }}>🗑 Удалить</Text>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={screenUi.emptyText}>Шаблонов пока нет</Text>}
      />

      <FormBottomModal
        visible={formVisible}
        title="➕ Шаблон документа"
        saveLabel="Создать"
        saving={saving}
        onSave={onCreate}
        onClose={() => {
          setFormVisible(false);
          setForm(initialForm);
        }}
      >
        <Field
          label="Template ID (для обновления)"
          value={form.id}
          onChangeText={(value) => setForm((prev) => ({ ...prev, id: value }))}
          keyboardType="number-pad"
        />
        <Field label="Название" value={form.name} onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} />
        <Field
          label="Контент (HTML или текст)"
          value={form.content}
          onChangeText={(value) => setForm((prev) => ({ ...prev, content: value }))}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{ minHeight: 110 }}
        />
        {(['waybill', 'invoice', 'act'] as DocumentType[]).map((t) => (
          <MenuButton
            key={t}
            label={form.type === t ? `✅ ${templateTypeLabel(t)}` : templateTypeLabel(t)}
            onPress={() => setForm((prev) => ({ ...prev, type: t }))}
            variant={form.type === t ? 'default' : 'secondary'}
          />
        ))}
        <MenuButton label="🔄 Обновить по ID" onPress={onUpdate} variant="secondary" />
      </FormBottomModal>
    </View>
  );
}
