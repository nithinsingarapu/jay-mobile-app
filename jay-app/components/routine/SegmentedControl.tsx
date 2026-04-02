import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '../../lib/theme';

interface SegmentedControlProps {
  segments: string[];
  active: number;
  onChange: (i: number) => void;
}

export default function SegmentedControl({
  segments,
  active,
  onChange,
}: SegmentedControlProps) {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const segmentWidth = useRef(0);

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: active * segmentWidth.current,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [active, translateX]);

  const onLayout = (e: LayoutChangeEvent) => {
    const totalWidth = e.nativeEvent.layout.width;
    segmentWidth.current = totalWidth / segments.length;
    translateX.setValue(active * segmentWidth.current);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.secondarySystemFill }]}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.secondarySystemBackground,
            width: `${100 / segments.length}%` as unknown as number,
            transform: [{ translateX }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 2,
          },
        ]}
      />
      {segments.map((label, i) => (
        <TouchableOpacity
          key={label}
          activeOpacity={0.7}
          style={styles.segment}
          onPress={() => onChange(i)}
        >
          <Text
            style={[
              styles.label,
              {
                color: i === active ? colors.label : colors.secondaryLabel,
                fontFamily: i === active ? 'Outfit-SemiBold' : 'Outfit-Medium',
              },
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    bottom: 2,
    borderRadius: 6,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    letterSpacing: -0.08,
  },
});
