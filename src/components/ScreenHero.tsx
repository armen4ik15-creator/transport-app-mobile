import { Text, View, type ViewProps } from 'react-native';

interface ScreenHeroProps extends ViewProps {
  title: string;
  subtitle?: string;
}

export function ScreenHero({ title, subtitle, style, ...rest }: ScreenHeroProps) {
  return (
    <View
      style={[
        {
          backgroundColor: '#1e3a5f',
          borderRadius: 14,
          padding: 18,
          marginBottom: 14,
        },
        style,
      ]}
      {...rest}
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#ffffff' }}>{title}</Text>
      {subtitle ? (
        <Text style={{ fontSize: 14, color: '#cbd5e1', marginTop: 4 }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
