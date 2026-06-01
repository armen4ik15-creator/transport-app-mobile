import { ScrollView } from 'react-native';
import { HubMenuCard, type HubMenuCardProps } from './HubMenuCard';
import { ScreenHero } from './ScreenHero';
import { screenUi } from '../styles/screenUi';

export type HubCardItem = HubMenuCardProps;

interface HubCardMenuProps {
  title: string;
  subtitle?: string;
  items: HubCardItem[];
}

export function HubCardMenu({ title, subtitle, items }: HubCardMenuProps) {
  return (
    <ScrollView
      style={screenUi.container}
      contentContainerStyle={[screenUi.content, { paddingBottom: 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHero title={title} subtitle={subtitle} />
      {items.map((item) => (
        <HubMenuCard
          key={item.title}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          accentColor={item.accentColor}
          onPress={item.onPress}
        />
      ))}
    </ScrollView>
  );
}
