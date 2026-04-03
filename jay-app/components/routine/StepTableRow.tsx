import React from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTheme } from '../../lib/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/* ---------- helpers ---------- */

function formatWait(seconds: number): string {
  if (seconds >= 60 && seconds <= 120) return '1-2 min';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)} min`;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h}:${m.toString().padStart(2, '0')}`;
}

/* ---------- props ---------- */

interface StepTableRowProps {
  category: string;
  productName?: string | null;
  completed: boolean;
  skipped: boolean;
  completedAt?: string | null;
  waitTimeSeconds?: number | null;
  frequency?: string;
  isLast: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

/* ---------- component ---------- */

export default function StepTableRow({
  category,
  productName,
  completed,
  skipped,
  completedAt,
  waitTimeSeconds,
  frequency,
  isLast,
  onPress,
  onLongPress,
}: StepTableRowProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleCheckboxPress = () => {
    if (completed || skipped) return;
    scale.value = withSpring(1.12, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  /* ---- checkbox ---- */

  const renderCheckbox = () => {
    if (completed) {
      return (
        <AnimatedTouchable
          style={[
            styles.checkbox,
            { backgroundColor: colors.systemGreen, borderColor: colors.systemGreen },
            animatedStyle,
          ]}
          activeOpacity={0.7}
          onPress={handleCheckboxPress}
        >
          <Svg width={22} height={22} viewBox="0 0 22 22">
            <Path
              d="M4.5 11.5L8.5 15.5L17.5 5.5"
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </AnimatedTouchable>
      );
    }

    if (skipped) {
      return (
        <AnimatedTouchable
          style={[
            styles.checkbox,
            { backgroundColor: colors.systemOrange, borderColor: colors.systemOrange },
            animatedStyle,
          ]}
          activeOpacity={0.7}
          onPress={handleCheckboxPress}
        >
          <Svg width={22} height={22} viewBox="0 0 22 22">
            <Line
              x1={6}
              y1={11}
              x2={16}
              y2={11}
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </Svg>
        </AnimatedTouchable>
      );
    }

    return (
      <AnimatedTouchable
        style={[
          styles.checkbox,
          { borderColor: colors.systemGray4, backgroundColor: 'transparent' },
          animatedStyle,
        ]}
        activeOpacity={0.7}
        onPress={handleCheckboxPress}
      >
        {null}
      </AnimatedTouchable>
    );
  };

  /* ---- right info ---- */

  const renderInfo = () => {
    if (completed && completedAt) {
      return (
        <Text style={[styles.completedTime, { color: colors.systemGreen }]}>
          {formatTime(completedAt)}
        </Text>
      );
    }

    if (waitTimeSeconds != null && waitTimeSeconds > 0) {
      return (
        <View
          style={[
            styles.pill,
            { backgroundColor: colors.systemBlue + '10' },
          ]}
        >
          <Text style={[styles.pillText, { color: colors.systemBlue }]}>
            ⏱ {formatWait(waitTimeSeconds)}
          </Text>
        </View>
      );
    }

    if (frequency && frequency !== 'daily') {
      const label =
        frequency.charAt(0).toUpperCase() + frequency.slice(1);
      return (
        <View
          style={[
            styles.pill,
            { backgroundColor: colors.tertiaryLabel + '10' },
          ]}
        >
          <Text style={[styles.pillText, { color: colors.tertiaryLabel }]}>
            {label}
          </Text>
        </View>
      );
    }

    return null;
  };

  /* ---- render ---- */

  const interactive = !completed && !skipped;

  return (
    <View>
      <Pressable
        style={styles.row}
        onPress={interactive ? onPress : undefined}
        onLongPress={interactive ? onLongPress : undefined}
        delayLongPress={500}
      >
        {renderCheckbox()}

        <View style={styles.content}>
          <Text
            style={[
              styles.category,
              { color: completed ? colors.secondaryLabel : colors.label },
            ]}
          >
            {category}
          </Text>
          {productName ? (
            <Text
              style={[
                styles.productName,
                {
                  color: completed
                    ? colors.tertiaryLabel
                    : colors.secondaryLabel,
                },
              ]}
            >
              {productName}
            </Text>
          ) : null}
        </View>

        {renderInfo()}
      </Pressable>

      {!isLast && (
        <View
          style={[
            styles.separator,
            { backgroundColor: colors.separator },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  category: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
  },
  productName: {
    fontSize: 13,
    fontFamily: 'Outfit',
  },
  completedTime: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
  },
  separator: {
    height: 0.33,
    marginLeft: 50,
  },
});
