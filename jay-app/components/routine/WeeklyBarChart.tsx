import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_BAR_HEIGHT = 80;
const BAR_WIDTH = (SCREEN_WIDTH - 80) / 7 - 6;

interface BarDatum {
  day: string;
  value: number;
}

interface WeeklyBarChartProps {
  data: BarDatum[];
}

function Bar({
  item,
  index,
  colors,
}: {
  item: BarDatum;
  index: number;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(
      index * 50,
      withTiming(item.value / 100, { duration: 400 }),
    );
  }, [item.value, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: progress.value * MAX_BAR_HEIGHT,
  }));

  const barColor =
    item.value === 100
      ? colors.systemBlue
      : item.value > 0
        ? colors.systemGray3
        : colors.systemGray5;

  return (
    <View style={s.barColumn}>
      <View style={s.barTrack}>
        <Animated.View
          style={[
            s.bar,
            animatedStyle,
            { backgroundColor: barColor, width: BAR_WIDTH },
          ]}
        />
      </View>
      <Text style={[s.dayLabel, { color: colors.tertiaryLabel }]}>
        {item.day}
      </Text>
    </View>
  );
}

export function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        s.container,
        { backgroundColor: colors.secondarySystemBackground },
      ]}
    >
      <View style={s.row}>
        {data.map((item, index) => (
          <Bar key={item.day} item={item} index={index} colors={colors} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barColumn: {
    alignItems: 'center',
  },
  barTrack: {
    height: MAX_BAR_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
    minHeight: 2,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    marginTop: 6,
  },
});
