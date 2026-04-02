import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

interface CompleteAllButtonProps {
  allDone: boolean;
  onPress: () => void;
  loading: boolean;
}

export default function CompleteAllButton({
  allDone,
  onPress,
  loading,
}: CompleteAllButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (loading) return;
    if (!allDone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onPress();
  };

  const bgColor = allDone ? colors.systemGreen : colors.systemBlue;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor }]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={loading || allDone}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>
          {allDone ? 'All Steps Complete \u2713' : 'Complete All Steps'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
    letterSpacing: -0.41,
  },
});
