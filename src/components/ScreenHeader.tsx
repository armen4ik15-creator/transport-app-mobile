import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { screenUi } from '../styles/screenUi';
import { colors } from '../theme';

interface ScreenHeaderProps {
  title: string;
  pageTitle?: string;
  showBack?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  showPageTitle?: boolean;
  onBack?: () => void;
}

export function ScreenHeader({
  title,
  pageTitle,
  showBack,
  actionLabel,
  onAction,
  showPageTitle = true,
  onBack,
}: ScreenHeaderProps) {
  const navigation = useNavigation();
  const canGoBack = showBack ?? navigation.canGoBack();
  const showBackButton = Boolean(onBack) || canGoBack;
  const displayPageTitle = pageTitle ?? title;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigation.goBack();
  };

  return (
    <View>
      {showPageTitle ? (
        <Text
          style={{
            fontSize: 26,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 8,
          }}
        >
          {displayPageTitle}
        </Text>
      ) : null}
      <View style={screenUi.header}>
        {showBackButton ? (
          <Pressable onPress={handleBack} hitSlop={8}>
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
    </View>
  );
}
