import { ScrollView, Text, View } from 'react-native';
import { MenuButton, Subtitle } from './ui';
import { ScreenHeader } from './ScreenHeader';
import { screenUi } from '../styles/screenUi';

export interface HubMenuItem {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'secondary' | 'danger';
}

export interface HubMenuSection {
  title: string;
  items: HubMenuItem[];
}

interface HubMenuScreenProps {
  title: string;
  subtitle?: string;
  sections: HubMenuSection[];
}

export function HubMenuScreen({ title, subtitle, sections }: HubMenuScreenProps) {
  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title={title} showBack={false} />
      {subtitle ? (
        <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>{subtitle}</Text>
      ) : null}
      {sections.map((section) => (
        <View key={section.title} style={screenUi.card}>
          <Subtitle>{section.title}</Subtitle>
          {section.items.map((item) => (
            <MenuButton
              key={item.label}
              label={item.label}
              onPress={item.onPress}
              variant={item.variant ?? 'secondary'}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
