import { Text, View, type ViewProps } from 'react-native';
import { colors } from '../theme';

interface ScreenHeroProps extends ViewProps {
  title: string;
  subtitle?: string;
}

export function ScreenHero({ title, subtitle, style, ...rest }: ScreenHeroProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.primaryMuted,
          borderRadius: 14,
          padding: 18,
          marginBottom: 14,
        },
        style,
      ]}
      {...rest}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>{title}</Text>
      {subtitle ? (
        <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
