import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { DiscoverArticle } from '../../types/discover';

interface HeroCardProps {
  article: DiscoverArticle;
  onPress: () => void;
}

export default function HeroCard({ article, onPress }: HeroCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, { backgroundColor: article.gradient[0] }]}
      >
        {/* Tag pill */}
        <View style={[styles.tag, { backgroundColor: colors.systemBlue }]}>
          <Text style={styles.tagText}>FEATURED</Text>
        </View>

        {/* Bottom content */}
        <View style={styles.bottom}>
          <View style={styles.bottomLeft}>
            <Text numberOfLines={2} style={styles.title}>
              {article.title}
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {article.subtitle}
            </Text>
          </View>
          <View style={styles.readTimePill}>
            <Text style={styles.readTimeText}>{article.readTime}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
  card: {
    height: 200,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    color: '#FFF',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Outfit',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  readTimePill: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readTimeText: {
    fontSize: 11,
    fontFamily: 'Outfit',
    color: '#FFF',
  },
});
