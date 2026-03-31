import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth';
import { useUserStore } from '../../stores/userStore';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email: prefillEmail } = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(prefillEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

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

      // Success — wait for fetchProfile to actually complete, then navigate
      // onAuthStateChange fires → setApiToken + fetchProfile called
      // We poll the store until profile is loaded (max 5 seconds)
      const start = Date.now();
      const waitForProfile = () => {
        const state = useUserStore.getState();
        if (state.backendProfile) {
          // Profile loaded — navigate based on onboarding state
          setLoading(false);
          if (state.onboardingComplete) {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding/quiz');
          }
        } else if (Date.now() - start > 5000) {
          // Timeout — navigate to quiz as fallback
          setLoading(false);
          router.replace('/onboarding/quiz');
        } else {
          setTimeout(waitForProfile, 200);
        }
      };
      // Start polling after a brief delay for auth state to propagate
      setTimeout(waitForProfile, 300);

    } catch {
      setError("Something went wrong. Give it another shot?");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </Pressable>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Your skin missed you. Seriously.</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, email && styles.inputFilled]}
              placeholder="your@email.com"
              placeholderTextColor="#C0C0C0"
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
              <Text style={styles.label}>Password</Text>
              <Pressable onPress={handleForgotPassword}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </Pressable>
            </View>
            <TextInput
              style={[styles.input, password && styles.inputFilled]}
              placeholder="The one you definitely remember"
              placeholderTextColor="#C0C0C0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {resetSent ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Password reset link sent to {email}. Check your inbox!</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label={loading ? 'Signing you in...' : 'Sign in'}
            onPress={handleLogin}
            disabled={loading}
            loading={loading}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push('/onboarding/signup')}>
            <Text style={styles.footerLink}>Create one</Text>
          </Pressable>
        </View>
        <Text style={styles.footerHint}>Your data is safe with JAY. Always.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 28 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', fontFamily: 'Outfit-Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#666', fontFamily: 'Outfit', marginTop: 8 },
  form: { gap: 18, marginTop: 32 },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: '#555', fontFamily: 'Outfit-Medium' },
  forgotLink: { fontSize: 12, color: '#000', fontFamily: 'Outfit-SemiBold' },
  successBox: { backgroundColor: '#F0FFF0', borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: '#C8E6C9' },
  successText: { fontSize: 13, color: '#2E7D32', fontFamily: 'Outfit-Medium', lineHeight: 18 },
  input: {
    borderWidth: 0.5, borderColor: '#E0E0E0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontFamily: 'Outfit', color: '#000',
    backgroundColor: '#FAFAFA',
  },
  inputFilled: { backgroundColor: '#fff', borderColor: '#000' },
  errorBox: { backgroundColor: '#FFF5F5', borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: '#FFDDDD' },
  errorText: { fontSize: 13, color: '#D32F2F', fontFamily: 'Outfit-Medium', lineHeight: 18 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { fontSize: 14, color: '#999', fontFamily: 'Outfit' },
  footerLink: { fontSize: 14, color: '#000', fontWeight: '700', fontFamily: 'Outfit-Bold' },
  footerHint: { fontSize: 12, color: '#C0C0C0', textAlign: 'center', marginTop: 12, fontFamily: 'Outfit' },
});
