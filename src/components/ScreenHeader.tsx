import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { screenUi } from '../styles/screenUi';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function ScreenHeader({
  title,
  showBack,
  actionLabel,
  onAction,
}: ScreenHeaderProps) {
  const navigation = useNavigation();
  const canGoBack = showBack ?? navigation.canGoBack();

  return (
    <View style={screenUi.header}>
      {canGoBack ? (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={screenUi.back}>← Назад</Text>
        </Pressable>
      ) : (
        <View style={{ width: 72 }} />
      )}
      <Text style={screenUi.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable style={screenUi.addBtn} onPress={onAction}>
          <Text style={screenUi.addBtnText}>{actionLabel}</Text>
        </Pressable>
      ) : (
        <View style={{ width: 72 }} />
      )}
    </View>
  );
}
