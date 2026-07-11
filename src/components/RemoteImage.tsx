import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import { resolvePhotoLocalUri } from '../utils/photoUrl';
import { colors } from '../theme';

interface RemoteImageProps {
  filePath: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  missingOnServer?: boolean;
}

/** Загружает фото ТТН через API (с токеном) — для превью в списках. */
export function RemoteImage({
  filePath,
  style,
  resizeMode = 'cover',
  missingOnServer = false,
}: RemoteImageProps) {
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

  if (failed || missingOnServer) {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
          },
        ]}
      >
        <Text style={{ fontSize: 10, color: '#d97706', textAlign: 'center' }}>
          ⚠️ Файл на сервере отсутствует
        </Text>
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
