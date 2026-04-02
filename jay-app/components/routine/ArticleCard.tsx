import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE } from '../../constants/theme';

interface ArticleCardProps {
  article: { title: string; subtitle: string; gradient: [string, string] };
  onPress?: () => void;
}

export default function ArticleCard({ article, onPress }: ArticleCardProps) {
  const { colors } = useTheme();
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.outer, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.container, { backgroundColor: colors.secondarySystemBackground }]}
      >
        <View style={[styles.gradientArea, { backgroundColor: article.gradient[0] }]} />
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.label }]} numberOfLines={2}>
            {article.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryLabel }]} numberOfLines={2}>
            {article.subtitle}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: SPACE.lg,
    marginBottom: 10,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    minHeight: 80,
    overflow: 'hidden',
  },
  gradientArea: {
    width: 90,
  },
  content: {
    flex: 1,
    padding: SPACE.md,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
});
