import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import { resolvePhotoLocalUri } from '../utils/photoUrl';
import { colors } from '../theme';

interface RemoteImageProps {
  filePath: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

/** Загружает фото ТТН через API (с токеном) — для превью в списках. */
export function RemoteImage({ filePath, style, resizeMode = 'cover' }: RemoteImageProps) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLocalUri(null);
    setFailed(false);

    resolvePhotoLocalUri(filePath)
      .then((uri) => {
        if (!cancelled) setLocalUri(uri);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  if (failed) {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text style={{ fontSize: 11, color: colors.textMuted }}>Нет превью</Text>
      </View>
    );
  }

  if (!localUri) {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  return <Image source={{ uri: localUri }} style={style} resizeMode={resizeMode} />;
}
