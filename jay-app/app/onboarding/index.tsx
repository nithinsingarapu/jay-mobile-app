import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../stores/userStore';

const { width } = Dimensions.get('window');

const TAGLINES = [
  'Your skin has trust issues.\nJAY gets it.',
  'Finally, skincare advice that\ndoesn\'t cost ₹2,000/hour.',
  'Your skin\'s new best friend.\n(Sorry, moisturizer.)',
  'Built for Indian skin.\nBecause Google doesn\'t get it.',
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, onboardingComplete } = useUserStore();

  const handleContinue = () => {
    if (isAuthenticated && onboardingComplete) {
      router.replace('/(tabs)');
    } else if (isAuthenticated && !onboardingComplete) {
      router.replace('/onboarding/quiz');
    } else {
      router.push('/onboarding/signup');
    }
  };

  // Animations
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(30)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // Content slides up
      Animated.parallel([
        Animated.timing(contentSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      // CTA slides up
      Animated.parallel([
        Animated.timing(ctaSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(ctaOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const tagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      {/* Top section with logo */}
      <View style={styles.topSection}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoJ}>J</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentSlide }] }}>
          <Text style={styles.brandName}>JAY</Text>
          <Text style={styles.tagline}>{tagline}</Text>
        </Animated.View>
      </View>

      {/* Features strip */}
      <Animated.View style={[styles.featuresStrip, { opacity: contentOpacity }]}>
        {[
          { emoji: '🔬', label: 'Research products' },
          { emoji: '🧴', label: 'Build routines' },
          { emoji: '📊', label: 'Track your skin' },
          { emoji: '🤖', label: 'AI skincare chat' },
        ].map((f) => (
          <View key={f.label} style={styles.featureItem}>
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Bottom CTA */}
      <Animated.View style={[styles.bottomSection, { opacity: ctaOpacity, transform: [{ translateY: ctaSlide }] }]}>
        {isAuthenticated ? (
          <>
            <Button label="Continue →" onPress={handleContinue} />
            <Text style={styles.footerNote}>Welcome back. Your skin remembers you.</Text>
          </>
        ) : (
          <>
            <Button label="Get started — it's free" onPress={() => router.push('/onboarding/signup')} />
            <Pressable onPress={() => router.push('/onboarding/login')} style={styles.signinBtn}>
              <Text style={styles.signinText}>I already have an account</Text>
            </Pressable>
            <Text style={styles.footerNote}>No credit card. No spam. Just better skin.</Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 28 },
  topSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { marginBottom: 24 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  logoJ: { fontSize: 38, fontWeight: '900', fontFamily: 'Outfit-Bold', color: '#fff' },
  brandName: { fontSize: 48, fontWeight: '900', letterSpacing: 10, fontFamily: 'Outfit-Bold', textAlign: 'center' },
  tagline: { fontSize: 16, color: '#666', marginTop: 16, textAlign: 'center', lineHeight: 24, fontFamily: 'Outfit-Medium' },

  featuresStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#E5E5E5', marginBottom: 28 },
  featureItem: { alignItems: 'center', flex: 1 },
  featureEmoji: { fontSize: 22, marginBottom: 6 },
  featureLabel: { fontSize: 11, color: '#666', fontFamily: 'Outfit-Medium', textAlign: 'center' },

  bottomSection: { gap: 14, paddingBottom: 8 },
  signinBtn: { alignItems: 'center', paddingVertical: 14, borderWidth: 0.5, borderColor: '#E5E5E5', borderRadius: 12 },
  signinText: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold', color: '#000' },
  footerNote: { fontSize: 12, color: '#999', textAlign: 'center', fontFamily: 'Outfit', marginTop: 4 },
});
