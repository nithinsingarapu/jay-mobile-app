import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/auth';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSignup = async () => {
    if (loading) return;
    Keyboard.dismiss();
    setError(null);

    if (!fullName.trim()) { setError("What should JAY call you?"); return; }
    if (!email.trim()) { setError("We need your email — promise we won't spam."); return; }
    if (!password.trim() || password.length < 6) { setError("Password needs at least 6 characters. Make it strong like your skincare game."); return; }

    setLoading(true);
    try {
      const { data, error: err } = await authService.signup({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (err) {
        // Friendlier error messages
        if (err.message.includes('already registered') || err.message.includes('already exists') || err.message.includes('already been registered')) {
          setError("This email is already registered — switching to sign in...");
          setTimeout(() => router.push(`/onboarding/login?email=${encodeURIComponent(email.trim().toLowerCase())}`), 1500);
          return; // Don't reset loading — we're redirecting
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

      // Session created — go to quiz
      setLoading(false);
      router.replace('/onboarding/quiz');
    } catch {
      setError("Something went wrong. Try again?");
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📬</Text>
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.subtitle}>
          We sent a magic link to {email}.{'\n'}Click it and you're in. Easy.
        </Text>
        <Text style={[styles.footerHint, { marginTop: 12 }]}>
          (Check spam if you don't see it — we promise we're not sketchy)
        </Text>
        <View style={{ marginTop: 32, width: '100%' }}>
          <Button label="Go to sign in" onPress={() => router.push('/onboarding/login')} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </Pressable>

        {/* Header */}
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Join the skincare revolution.{'\n'}Your future self will thank you.
        </Text>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>What's your name?</Text>
            <TextInput
              style={[styles.input, fullName && styles.inputFilled]}
              placeholder="e.g. Priya, Arjun, Sneha..."
              placeholderTextColor="#C0C0C0"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

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
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, password && styles.inputFilled]}
              placeholder="Min 6 characters — make it good"
              placeholderTextColor="#C0C0C0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label={loading ? 'Creating your account...' : 'Create account'}
            onPress={handleSignup}
            disabled={loading}
            loading={loading}
          />
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push(email.trim() ? `/onboarding/login?email=${encodeURIComponent(email.trim().toLowerCase())}` : '/onboarding/login')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
        <Text style={styles.footerHint}>No spam. No weird emails. Pinky promise.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 28 },
  centerContent: { alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', fontFamily: 'Outfit-Bold', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#666', fontFamily: 'Outfit', marginTop: 8, lineHeight: 22 },
  form: { gap: 18, marginTop: 32 },
  field: { gap: 6 },
  label: { fontSize: 13, color: '#555', fontFamily: 'Outfit-Medium' },
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
