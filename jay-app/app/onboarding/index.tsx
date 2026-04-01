import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../lib/theme';

const jayLogo = require('../../assets/Jay-logo.png');
const jayLogoDark = require('../../assets/jay-darkmode-logo.png');

const TAGLINES = [
  'Your skin has trust issues.\nJAY gets it.',
  'Finally, skincare advice that\ndoesn\'t cost ₹2,000/hour.',
  'Your skin\'s new best friend.\n(Sorry, moisturizer.)',
  'Built for Indian skin.\nBecause Google doesn\'t get it.',
  'AI-powered skincare.\nPersonalized for you.',
  'Decode ingredients.\nBuild smarter routines.',
];

function RotatingTagline({ taglines, colors }: { taglines: string[]; colors: any }) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out + slide up
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setIndex((prev) => (prev + 1) % taglines.length);
        slideAnim.setValue(10);
        // Fade in + slide down into place
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [taglines.length]);

  return (
    <View style={styles.taglineWrap}>
      <Animated.Text
        style={[
          styles.tagline,
          { color: colors.secondaryLabel, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {taglines[index]}
      </Animated.Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, onboardingComplete } = useUserStore();
  const { colors, isDark } = useTheme();

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
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(30)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ctaSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(ctaOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24, backgroundColor: colors.systemBackground }]}>
      {/* Top section with logo */}
      <View style={styles.topSection}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
          <Image
            source={isDark ? jayLogoDark : jayLogo}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentSlide }] }}>
          <RotatingTagline taglines={TAGLINES} colors={colors} />
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View style={[styles.bottomSection, { opacity: ctaOpacity, transform: [{ translateY: ctaSlide }] }]}>
        {isAuthenticated ? (
          <>
            <Button label="Continue →" onPress={handleContinue} />
            <Text style={[styles.footerNote, { color: colors.tertiaryLabel }]}>Welcome back. Your skin remembers you.</Text>
          </>
        ) : (
          <>
            <Button label="Get Started — It's Free" onPress={() => router.push('/onboarding/signup')} />
            <Pressable onPress={() => router.push('/onboarding/login')} style={[styles.signinBtn, { borderColor: colors.separator }]}>
              <Text style={[styles.signinText, { color: colors.label }]}>I Already Have an Account</Text>
            </Pressable>
            <Text style={[styles.footerNote, { color: colors.secondaryLabel }]}>No credit card. No spam. Just better skin.</Text>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  topSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { marginBottom: 16, alignItems: 'center' },
  logo: { width: 420, height: 420 },
  taglineWrap: { height: 50, justifyContent: 'center', alignItems: 'center' },
  tagline: { fontSize: 16, textAlign: 'center', lineHeight: 24, fontFamily: 'Outfit-Medium' },

  bottomSection: { gap: 12, paddingBottom: 8 },
  signinBtn: { alignItems: 'center', paddingVertical: 14, borderWidth: 1, borderRadius: 14 },
  signinText: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  footerNote: { fontSize: 12, textAlign: 'center', fontFamily: 'Outfit', marginTop: 4 },
});
