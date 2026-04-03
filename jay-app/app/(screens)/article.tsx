/**
 * Article Screen — Renders tips, ingredient spotlights, and science articles.
 * Pushed via articleId + articleType route params.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { SPACE, RADIUS } from '../../constants/theme';
import {
  TIPS,
  INGREDIENT_SPOTLIGHTS,
  SCIENCE_ARTICLES,
  getSpotlightById,
} from '../../data/learnContent';
import {
  FEATURED_ARTICLES,
  EXPERT_ARTICLES,
  GUIDE_ARTICLES,
  POPULAR_READS,
  INGREDIENT_SPOTLIGHTS as DISCOVER_SPOTLIGHTS,
  INGREDIENT_DICTIONARY,
} from '../../data/mockDiscoverContent';

type ArticleType = 'tip' | 'spotlight' | 'science' | 'discover';

export default function ArticleScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { articleId, articleType } = useLocalSearchParams<{
    articleId: string;
    articleType: ArticleType;
  }>();

  // ── Look up content based on type ──────────────────────────────────
  const content = React.useMemo(() => {
    if (!articleId || !articleType) return null;

    switch (articleType) {
      case 'science': {
        const article = SCIENCE_ARTICLES.find(a => a.id === articleId);
        if (!article) return null;
        return {
          title: article.title,
          subtitle: article.subtitle,
          body: article.body,
          type: 'science' as const,
        };
      }
      case 'spotlight': {
        const spotlight = getSpotlightById(articleId);
        if (!spotlight) return null;
        return {
          title: `${spotlight.emoji} ${spotlight.name}`,
          subtitle: spotlight.subtitle,
          body: spotlight.description,
          type: 'spotlight' as const,
          concentrations: spotlight.concentrations,
          pairsWith: spotlight.pairsWith,
          avoidWith: spotlight.avoidWith,
        };
      }
      case 'tip': {
        const tip = TIPS.find(t => t.id === articleId);
        if (!tip) return null;
        return {
          title: `${tip.emoji} ${tip.title}`,
          subtitle: 'Quick tip',
          body: tip.body,
          type: 'tip' as const,
        };
      }
      case 'discover': {
        // Search articles first
        const allArticles = [...FEATURED_ARTICLES, ...EXPERT_ARTICLES, ...GUIDE_ARTICLES, ...POPULAR_READS];
        const article = allArticles.find(a => a.id === articleId);
        if (article) {
          return {
            title: article.title,
            subtitle: article.author
              ? `${article.author}${article.authorCredentials ? ' · ' + article.authorCredentials : ''} · ${article.readTime}`
              : article.readTime,
            body: article.body,
            type: 'discover' as const,
          };
        }
        // Search ingredient spotlights
        const spotl = DISCOVER_SPOTLIGHTS.find(s => s.id === articleId);
        if (spotl) {
          return {
            title: `${spotl.emoji} ${spotl.ingredientName}`,
            subtitle: spotl.tagline,
            body: spotl.summary,
            type: 'discover' as const,
          };
        }
        // Search ingredient dictionary
        const dictEntry = INGREDIENT_DICTIONARY.find(d => d.id === articleId);
        if (dictEntry) {
          return {
            title: `${dictEntry.emoji} ${dictEntry.name}`,
            subtitle: dictEntry.category,
            body: dictEntry.oneLiner,
            type: 'discover' as const,
          };
        }
        return null;
      }
      default:
        return null;
    }
  }, [articleId, articleType]);

  // ── Not found ──────────────────────────────────────────────────────
  if (!content) {
    return (
      <View style={[s.root, { backgroundColor: colors.systemBackground, paddingTop: insets.top }]}>
        <View style={s.notFound}>
          <Pressable onPress={() => router.back()} style={s.notFoundBack}>
            <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
              <Path d="M9 1L1 9l8 8" stroke={colors.systemBlue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={{ color: colors.systemBlue, fontSize: 17, fontFamily: 'Outfit', marginLeft: 6 }}>Back</Text>
          </Pressable>
          <View style={s.notFoundCenter}>
            <Text style={[s.notFoundText, { color: colors.secondaryLabel }]}>
              Article not found
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Split body into paragraphs ─────────────────────────────────────
  const paragraphs = content.body.split('\n\n');

  // ── Main ───────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: colors.systemBackground }]}>
      {/* ── Nav Bar ────────────────────────────────────────────── */}
      <View style={[s.navBar, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <Pressable onPress={() => router.back()} style={s.navLeft} hitSlop={8}>
          <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
            <Path d="M9 1L1 9l8 8" stroke={colors.systemBlue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={[s.navText, { color: colors.systemBlue }]}>Learn</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingHorizontal: SPACE.xl, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title ─────────────────────────────────────────────── */}
        <Text style={[s.title, { color: colors.label }]}>{content.title}</Text>

        {/* ── Subtitle ──────────────────────────────────────────── */}
        <Text style={[s.subtitle, { color: colors.secondaryLabel }]}>{content.subtitle}</Text>

        {/* ── Body paragraphs ───────────────────────────────────── */}
        {paragraphs.map((para, i) => (
          <Text key={i} style={[s.bodyParagraph, { color: colors.secondaryLabel }]}>
            {para}
          </Text>
        ))}

        {/* ── Spotlight extras ──────────────────────────────────── */}
        {content.type === 'spotlight' && (
          <>
            {/* Concentrations */}
            {content.concentrations ? (
              <>
                <Text style={[s.sectionHeader, { color: colors.label }]}>Concentrations</Text>
                <Text style={[s.sectionBody, { color: colors.secondaryLabel }]}>
                  {content.concentrations}
                </Text>
              </>
            ) : null}

            {/* Pairs well with */}
            {content.pairsWith && content.pairsWith.length > 0 && (
              <>
                <Text style={[s.sectionHeader, { color: colors.label }]}>Pairs well with</Text>
                <View style={[s.groupedTable, { backgroundColor: colors.secondaryGroupedBackground }]}>
                  {content.pairsWith.map((item, i) => (
                    <View key={i}>
                      <View style={s.listRow}>
                        <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                          <Path d="M3 9.5l4 4 8-8" stroke="#30D158" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                        <Text style={[s.listRowText, { color: colors.label }]}>{item}</Text>
                      </View>
                      {i < content.pairsWith!.length - 1 && (
                        <View style={[s.separator, { backgroundColor: colors.separator }]} />
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Avoid combining with */}
            {content.avoidWith && content.avoidWith.length > 0 && (
              <>
                <Text style={[s.sectionHeader, { color: colors.label }]}>Avoid combining with</Text>
                <View style={[s.groupedTable, { backgroundColor: colors.secondaryGroupedBackground }]}>
                  {content.avoidWith.map((item, i) => (
                    <View key={i}>
                      <View style={s.listRow}>
                        <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                          <Path d="M4 4l10 10M14 4L4 14" stroke="#FF453A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                        <Text style={[s.listRowText, { color: colors.label }]}>{item}</Text>
                      </View>
                      {i < content.avoidWith!.length - 1 && (
                        <View style={[s.separator, { backgroundColor: colors.separator }]} />
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Nav Bar ────────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 44,
    paddingHorizontal: SPACE.lg,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navText: {
    fontSize: 17,
    fontFamily: 'Outfit',
  },

  // ── Title ──────────────────────────────────────────────────────────
  title: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    letterSpacing: 0.36,
    marginTop: SPACE.lg,
    lineHeight: 34,
  },

  // ── Subtitle ───────────────────────────────────────────────────────
  subtitle: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: SPACE.sm,
  },

  // ── Body ───────────────────────────────────────────────────────────
  bodyParagraph: {
    fontSize: 17,
    fontFamily: 'Outfit',
    lineHeight: 27,
    letterSpacing: -0.41,
    marginTop: SPACE.lg,
  },

  // ── Section headers (spotlight extras) ─────────────────────────────
  sectionHeader: {
    fontSize: 20,
    fontFamily: 'Outfit-SemiBold',
    fontWeight: '600',
    letterSpacing: 0.38,
    marginTop: 28,
    marginBottom: SPACE.sm,
  },
  sectionBody: {
    fontSize: 15,
    fontFamily: 'Outfit',
    lineHeight: 22,
  },

  // ── Grouped table ──────────────────────────────────────────────────
  groupedTable: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },

  // ── List rows ──────────────────────────────────────────────────────
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    gap: SPACE.sm,
  },
  listRowText: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },

  // ── Separator ──────────────────────────────────────────────────────
  separator: {
    height: 0.33,
    marginLeft: 42,
  },

  // ── Not Found ──────────────────────────────────────────────────────
  notFound: {
    flex: 1,
  },
  notFoundBack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACE.lg,
    gap: 6,
  },
  notFoundCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 17,
    fontFamily: 'Outfit',
  },

  // ── Scroll ─────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
});
