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
      <View style={[screenUi.header, { gap: 8 }]}>
        {showBackButton ? (
          <Pressable onPress={handleBack} hitSlop={8} style={{ minWidth: 56, maxWidth: 88, flexShrink: 0 }}>
            <Text style={screenUi.back} numberOfLines={1}>
              ← Назад
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 56 }} />
        )}
        <Text style={[screenUi.title, { flex: 1, textAlign: 'center' }]} numberOfLines={2}>
          {title}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            style={[screenUi.addBtn, { minWidth: 56, maxWidth: 96, flexShrink: 0 }]}
            onPress={onAction}
          >
            <Text style={screenUi.addBtnText} numberOfLines={1}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>
    </View>
  );
}
