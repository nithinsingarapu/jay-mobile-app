import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, Keyboard, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth';
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

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    setError(null);
    try {
      const { error: err, cancelled } = await authService.signInWithOAuth(provider) as any;
      if (cancelled) { setOauthLoading(null); return; }
      if (err) { setError(err.message || 'OAuth failed. Try again.'); setOauthLoading(null); return; }
      router.replace('/onboarding/quiz');
    } catch {
      setError('Something went wrong. Try again?');
      setOauthLoading(null);
    }
  };

  const handleSignup = async () => {
    if (loading) return;
    Keyboard.dismiss();
    setError(null);

    if (!fullName.trim()) { setError("What should JAY call you?"); return; }
    if (!email.trim()) { setError("We need your email — promise we won't spam."); return; }
    if (!password.trim() || password.length < 6) { setError("Password needs at least 6 characters."); return; }

    setLoading(true);
    try {
      const { data, error: err } = await authService.signup({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (err) {
        if (err.message.includes('already registered') || err.message.includes('already exists') || err.message.includes('already been registered')) {
          setError("This email is already registered — switching to sign in...");
          setTimeout(() => router.push(`/onboarding/login?email=${encodeURIComponent(email.trim().toLowerCase())}`), 1500);
          return;
        } else if (err.message.includes('valid email')) {
          setError("That email doesn't look right. Double-check it?");
        } else {
          setError(err.message);
        }
        setLoading(false);
        return;
      }

      if (!data.session) {
        setNeedsConfirmation(true);
        setLoading(false);
        return;
      }

      setLoading(false);
      router.replace('/onboarding/quiz');
    } catch {
      setError("Something went wrong. Try again?");
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32, backgroundColor: colors.systemBackground }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📬</Text>
        <Text style={[styles.title, { color: colors.label }]}>Check your inbox</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
          We sent a magic link to {email}.{'\n'}Click it and you're in. Easy.
        </Text>
        <Text style={[styles.footerHint, { marginTop: 12, color: colors.tertiaryLabel }]}>
          (Check spam if you don't see it)
        </Text>
        <View style={{ marginTop: 32, width: '100%' }}>
          <Button label="Go to sign in" onPress={() => router.push('/onboarding/login')} />
        </View>
      </View>
    );
  }

  const isOAuthBusy = !!oauthLoading;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.systemBackground }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.tertiarySystemFill }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="1.8" strokeLinecap="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </Pressable>

        {/* Header */}
        <Text style={[styles.title, { color: colors.label }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>
          Join the skincare revolution.{'\n'}Your future self will thank you.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.secondaryLabel }]}>Name</Text>
            <TextInput
              style={[styles.input, { color: colors.label, borderColor: colors.separator, backgroundColor: colors.tertiarySystemFill }, fullName && { borderColor: colors.systemBlue }]}
              placeholder="e.g. Priya, Arjun, Sneha..."
              placeholderTextColor={colors.placeholderText}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

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
            <Text style={[styles.label, { color: colors.secondaryLabel }]}>Password</Text>
            <TextInput
              style={[styles.input, { color: colors.label, borderColor: colors.separator, backgroundColor: colors.tertiarySystemFill }, password && { borderColor: colors.systemBlue }]}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.placeholderText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: isDark ? 'rgba(255,59,48,0.1)' : '#FFF5F5', borderColor: isDark ? 'rgba(255,59,48,0.2)' : '#FFDDDD' }]}>
              <Text style={[styles.errorText, { color: colors.systemRed }]}>{error}</Text>
            </View>
          ) : null}

          <Button
            label={loading ? 'Creating account...' : 'Create account'}
            onPress={handleSignup}
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
            disabled={isOAuthBusy}
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
            disabled={isOAuthBusy}
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

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.secondaryLabel }]}>Already have an account? </Text>
          <Pressable onPress={() => router.push(email.trim() ? `/onboarding/login?email=${encodeURIComponent(email.trim().toLowerCase())}` : '/onboarding/login')}>
            <Text style={[styles.footerLink, { color: colors.systemBlue }]}>Sign in</Text>
          </Pressable>
        </View>
        <Text style={[styles.footerHint, { color: colors.tertiaryLabel }]}>No spam. No weird emails. Pinky promise.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 28 },
  centerContent: { alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', fontFamily: 'Outfit-Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontFamily: 'Outfit', marginTop: 8, lineHeight: 22 },

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
  label: { fontSize: 13, fontFamily: 'Outfit-Medium' },
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
