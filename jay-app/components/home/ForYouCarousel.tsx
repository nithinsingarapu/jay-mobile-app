import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { useContentStore } from '../../stores/contentStore';

export function ForYouCarousel() {
  const { colors } = useTheme();
  const router = useRouter();
  const articles = useContentStore((s) => s.articles);
  const loadArticles = useContentStore((s) => s.loadArticles);

  useEffect(() => {
    if (articles.length === 0) loadArticles('skincare');
  }, []);

  const onPress = (sourceUrl?: string) => {
    if (sourceUrl) {
      Linking.openURL(sourceUrl);
    }
  };

  const onSeeAll = () => {
    router.push('/(tabs)/discover' as any);
  };

  if (articles.length === 0) return null;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={[s.title, { color: colors.label }]}>For you</Text>
        <Pressable onPress={onSeeAll}>
          <Text style={[s.seeAll, { color: colors.systemBlue }]}>See all</Text>
        </Pressable>
      </View>
      <FlatList
        data={articles.slice(0, 8)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={248}
        decelerationRate="fast"
        contentContainerStyle={s.listContent}
        keyExtractor={(item) => item.slug}
        renderItem={({ item }) => {
          const hasImage = !!item.image_url && item.image_url.startsWith('http');
          return (
            <Pressable
              style={[s.card, !hasImage && { backgroundColor: '#1A2A3A' }]}
              onPress={() => onPress(item.source_url)}
            >
              {hasImage && (
                <>
                  <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={StyleSheet.absoluteFillObject}
                    locations={[0.2, 1]}
                  />
                </>
              )}
              <View style={s.cardContent}>
                {item.type && (
                  <Text style={s.category}>{item.type.replace(/_/g, ' ').toUpperCase()}</Text>
                )}
                <Text numberOfLines={2} style={s.cardTitle}>{item.title}</Text>
                <View style={s.cardFooter}>
                  {item.source_name && (
                    <Text numberOfLines={1} style={s.source}>{item.source_name}</Text>
                  )}
                  <Text style={s.readTime}>{item.read_time_minutes ?? 5} min</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  seeAll: { fontSize: 13, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  listContent: { gap: 12, marginHorizontal: -20, paddingHorizontal: 20 },
  card: {
    width: 236,
    borderRadius: 14,
    minHeight: 160,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 16,
  },
  category: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    fontFamily: 'Outfit-SemiBold',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
    color: '#FFF',
    fontFamily: 'Outfit-SemiBold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  source: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Outfit',
    flex: 1,
    marginRight: 8,
  },
  readTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Outfit',
  },
});
