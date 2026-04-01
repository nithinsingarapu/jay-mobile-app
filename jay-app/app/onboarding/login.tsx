import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, Keyboard, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../lib/theme';

function AppleLogo({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
  );
}

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { email: prefillEmail } = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setError(null);
    try {
      const { error: err, cancelled } = await authService.signInWithOAuth(provider) as any;
      if (cancelled) { setOauthLoading(null); return; }
      if (err) { setError(err.message || 'OAuth failed. Try again.'); setOauthLoading(null); return; }
      // Auth state change listener will handle navigation
      const start = Date.now();
      const waitForProfile = () => {
        const state = useUserStore.getState();
        if (state.backendProfile) {
          setOauthLoading(null);
          router.replace(state.onboardingComplete ? '/(tabs)' : '/onboarding/quiz');
        } else if (Date.now() - start > 5000) {
          setOauthLoading(null);
          router.replace('/onboarding/quiz');
        } else {
          setTimeout(waitForProfile, 200);
        }
      };
      setTimeout(waitForProfile, 300);
    } catch {
      setError('Something went wrong. Try again?');
      setOauthLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError("Enter your email first, then tap forgot password."); return; }
    setLoading(true);
    const { error: err } = await authService.resetPassword(email.trim().toLowerCase());
    setLoading(false);
    if (err) { setError(err.message); return; }
    setResetSent(true);
  };

  const handleLogin = async () => {
    if (loading) return;
    Keyboard.dismiss();
    setError(null);

    if (!email.trim()) { setError("We need your email to find you."); return; }
    if (!password.trim()) { setError("Password can't be empty — we checked."); return; }

    setLoading(true);
    try {
      const { error: err } = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (err) {
        if (err.message.includes('Invalid login')) {
          setError("Wrong email or password. Happens to the best of us.");
        } else if (err.message.includes('Email not confirmed')) {
          setError("Check your inbox — you need to confirm your email first.");
        } else {
          setError(err.message);
        }
        setLoading(false);
        return;
      }

      const start = Date.now();
      const waitForProfile = () => {
        const state = useUserStore.getState();
        if (state.backendProfile) {
          setLoading(false);
          router.replace(state.onboardingComplete ? '/(tabs)' : '/onboarding/quiz');
        } else if (Date.now() - start > 5000) {
          setLoading(false);
          router.replace('/onboarding/quiz');
        } else {
          setTimeout(waitForProfile, 200);
        }
      };
      setTimeout(waitForProfile, 300);
    } catch {
      setError("Something went wrong. Give it another shot?");
      setLoading(false);
    }
  };

  const isOAuthBusy = !!oauthLoading;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.systemBackground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.tertiarySystemFill }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="1.8" strokeLinecap="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </Pressable>

        <Text style={[styles.title, { color: colors.label }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>Your skin missed you. Seriously.</Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.secondaryLabel }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: colors.label, borderColor: colors.separator, backgroundColor: colors.tertiarySystemFill }, email && { borderColor: colors.systemBlue }]}
              placeholder="your@email.com"
              placeholderTextColor={colors.placeholderText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.secondaryLabel }]}>Password</Text>
              <Pressable onPress={handleForgotPassword}>
                <Text style={[styles.forgotLink, { color: colors.systemBlue }]}>Forgot password?</Text>
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, { color: colors.label, borderColor: colors.separator, backgroundColor: colors.tertiarySystemFill }, password && { borderColor: colors.systemBlue }]}
              placeholder="Your password"
              placeholderTextColor={colors.placeholderText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {resetSent ? (
            <View style={[styles.successBox, { backgroundColor: isDark ? 'rgba(52,199,89,0.1)' : '#F0FFF0', borderColor: isDark ? 'rgba(52,199,89,0.2)' : '#C8E6C9' }]}>
              <Text style={[styles.successText, { color: colors.systemGreen }]}>Password reset link sent to {email}. Check your inbox!</Text>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: isDark ? 'rgba(255,59,48,0.1)' : '#FFF5F5', borderColor: isDark ? 'rgba(255,59,48,0.2)' : '#FFDDDD' }]}>
              <Text style={[styles.errorText, { color: colors.systemRed }]}>{error}</Text>
            </View>
          ) : null}

          <Button
            label={loading ? 'Signing you in...' : 'Sign in'}
            onPress={handleLogin}
            disabled={loading || isOAuthBusy}
            loading={loading}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
          <Text style={[styles.dividerText, { color: colors.tertiaryLabel }]}>or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
        </View>

        {/* OAuth buttons */}
        <View style={styles.oauthSection}>
          <Pressable
            style={[styles.oauthBtn, { backgroundColor: isDark ? '#fff' : '#000' }]}
            onPress={() => handleOAuth('apple')}
            disabled={isOAuthBusy || loading}
          >
            {oauthLoading === 'apple' ? (
              <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} />
            ) : (
              <>
                <AppleLogo color={isDark ? '#000' : '#fff'} />
                <Text style={[styles.oauthBtnText, { color: isDark ? '#000' : '#fff' }]}>Continue with Apple</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.oauthBtn, { backgroundColor: colors.secondarySystemBackground, borderWidth: 1, borderColor: colors.separator }]}
            onPress={() => handleOAuth('google')}
            disabled={isOAuthBusy || loading}
          >
            {oauthLoading === 'google' ? (
              <ActivityIndicator size="small" color={colors.label} />
            ) : (
              <>
                <GoogleLogo />
                <Text style={[styles.oauthBtnText, { color: colors.label }]}>Continue with Google</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.secondaryLabel }]}>Don't have an account? </Text>
          <Pressable onPress={() => router.push('/onboarding/signup')}>
            <Text style={[styles.footerLink, { color: colors.systemBlue }]}>Create one</Text>
          </Pressable>
        </View>
        <Text style={[styles.footerHint, { color: colors.tertiaryLabel }]}>Your data is safe with JAY. Always.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', fontFamily: 'Outfit-Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: 'Outfit', marginTop: 8 },

  oauthSection: { gap: 10, marginTop: 28 },
  oauthBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderRadius: 14,
  },
  oauthBtnText: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 24, marginBottom: 4 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 13, fontFamily: 'Outfit' },

  form: { gap: 16, marginTop: 16 },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontFamily: 'Outfit-Medium' },
  forgotLink: { fontSize: 12, fontFamily: 'Outfit-SemiBold' },
  successBox: { borderRadius: 10, padding: 12, borderWidth: 0.5 },
  successText: { fontSize: 13, fontFamily: 'Outfit-Medium', lineHeight: 18 },
  input: {
    borderWidth: 0.5, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontFamily: 'Outfit',
  },
  errorBox: { borderRadius: 10, padding: 12, borderWidth: 0.5 },
  errorText: { fontSize: 13, fontFamily: 'Outfit-Medium', lineHeight: 18 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14, fontFamily: 'Outfit' },
  footerLink: { fontSize: 14, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  footerHint: { fontSize: 12, textAlign: 'center', marginTop: 12, fontFamily: 'Outfit' },
});
