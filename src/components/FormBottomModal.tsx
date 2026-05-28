import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { screenUi } from '../styles/screenUi';

interface FormBottomModalProps {
  visible: boolean;
  title: string;
  children: ReactNode;
  saveLabel?: string;
  saving?: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function FormBottomModal({
  visible,
  title,
  children,
  saveLabel = 'Сохранить',
  saving = false,
  onSave,
  onClose,
}: FormBottomModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={screenUi.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={screenUi.modalSheet}>
          <Text style={screenUi.modalTitle}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          <Pressable
            onPress={onSave}
            disabled={saving}
            style={[screenUi.saveBtn, saving && { opacity: 0.6 }]}
          >
            <Text style={screenUi.saveBtnText}>{saving ? 'Сохранение…' : saveLabel}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={screenUi.cancelBtn}>
            <Text style={screenUi.cancelBtnText}>Отмена</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
