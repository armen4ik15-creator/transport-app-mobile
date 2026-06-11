import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface CollapsiblePanelProps {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export function CollapsiblePanel({
  title,
  subtitle,
  defaultExpanded = true,
  children,
}: CollapsiblePanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={{ marginBottom: 8 }}>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 8,
          paddingHorizontal: 4,
        }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{title}</Text>
          {subtitle ? (
            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{subtitle}</Text>
          ) : null}
        </View>
        <Text style={{ fontSize: 16, color: '#2563eb', fontWeight: '700' }}>
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>
      {expanded ? <View>{children}</View> : null}
    </View>
  );
}
