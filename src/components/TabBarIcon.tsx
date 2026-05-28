import { Text } from 'react-native';

interface TabBarIconProps {
  emoji: string;
  focused: boolean;
}

export function TabBarIcon({ emoji, focused }: TabBarIconProps) {
  return (
    <Text style={{ fontSize: 22, lineHeight: 26, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
  );
}
