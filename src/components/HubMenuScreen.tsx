import { ScrollView, Text, View } from 'react-native';
import { HubMenuCard } from './HubMenuCard';
import { ScreenHero } from './ScreenHero';
import { screenUi } from '../styles/screenUi';

export interface HubMenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  accentColor: string;
  onPress: () => void;
  danger?: boolean;
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
      <ScreenHero title={title} subtitle={subtitle} />
      {sections.map((section) => (
        <View key={section.title} style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginLeft: 2 }}>
            {section.title}
          </Text>
          {section.items.map((item) => (
            <HubMenuCard
              key={`${section.title}-${item.title}`}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              accentColor={item.accentColor}
              onPress={item.onPress}
              danger={item.danger}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
