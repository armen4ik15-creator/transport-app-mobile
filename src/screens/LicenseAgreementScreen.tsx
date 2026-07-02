import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const LICENSE_TEXT = `
ЛИЦЕНЗИОННОЕ СОГЛАШЕНИЕ ReestrPro

1. Назначение. Приложение предназначено для учёта перевозок, заказов и финансов транспортной компании.

2. Конфиденциальность. Вы обязуетесь не передавать учётные данные третьим лицам и не пытаться обойти технические средства защиты приложения.

3. Доступ. Администратор вправе ограничить или прекратить доступ к сервису при нарушении правил или подозрении на несанкционированное использование.

4. Данные. Бизнес-данные хранятся на сервере компании. Вы несёте ответственность за корректность вводимой информации.

5. Обновления. Приложение может получать обновления по воздуху (OTA) для исправления ошибок и улучшения безопасности.

6. Ограничение ответственности. ПО предоставляется «как есть». Разработчик не несёт ответственности за убытки, вызванные перебоями связи или действиями третьих лиц.

7. Согласие. Нажимая «Принимаю», вы подтверждаете, что прочитали и согласны с условиями использования ReestrPro.
`.trim();

interface LicenseAgreementScreenProps {
  onAccept: () => void;
}

export function LicenseAgreementScreen({ onAccept }: LicenseAgreementScreenProps) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Лицензионное соглашение</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const atEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - 24;
          if (atEnd) setScrolledToEnd(true);
        }}
        scrollEventThrottle={16}
      >
        <Text style={styles.text}>{LICENSE_TEXT}</Text>
      </ScrollView>
      <Pressable
        style={[styles.button, !scrolledToEnd && styles.buttonDisabled]}
        disabled={!scrolledToEnd}
        onPress={onAccept}
      >
        <Text style={styles.buttonText}>Принимаю</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  text: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
