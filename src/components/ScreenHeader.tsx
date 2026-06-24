import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { screenUi } from '../styles/screenUi';
import { colors, radii, spacing } from '../theme';

interface ScreenHeaderProps {
  title: string;
  pageTitle?: string;
  subtitle?: string;
  showBack?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  showPageTitle?: boolean;
  onBack?: () => void;
}

/** Заголовок экрана в стиле app-header из transport-company-app-ref. */
export function ScreenHeader({
  title,
  pageTitle,
  subtitle,
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

  if (showPageTitle && !showBackButton && !actionLabel) {
    return (
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: spacing.sm,
          marginBottom: spacing.sm,
          marginHorizontal: -spacing.md,
          paddingHorizontal: spacing.md,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            lineHeight: 22,
          }}
          numberOfLines={1}
        >
          {displayPageTitle}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.sm,
        marginBottom: spacing.sm,
      }}
    >
      {showPageTitle ? (
        <Text
          style={{
            fontSize: 18,
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
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: radii.full,
              backgroundColor: colors.secondary,
            }}
          >
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
