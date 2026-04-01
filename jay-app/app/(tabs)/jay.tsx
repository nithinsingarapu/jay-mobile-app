import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, Pressable, ScrollView,
  Platform, Keyboard, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Line, Circle, Polyline } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
  FadeInUp, FadeIn, Easing,
} from 'react-native-reanimated';
import { useChatStore, type ChatMessage, type ConversationSummary } from '../../stores/chatStore';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../lib/theme';
import { RichText } from '../../components/chat/RichText';
import { useAudioRecorder, RecordingPresets, requestMicPermission, setAudioModeAsync, transcribeAudio } from '../../services/speech';
import * as Haptics from 'expo-haptics';

const HW = StyleSheet.hairlineWidth;
const MODES = ['General', 'Routine help', 'Product research', 'Ingredient check'];

function getFollowUps(t: string): string[] {
  const l = t.toLowerCase();
  const c: string[] = [];
  if (l.includes('routine') || l.includes('step')) c.push('Apply this to my routine');
  if (l.includes('₹') || l.includes('price')) c.push('Any cheaper alternatives?');
  if (l.includes('retinol') || l.includes('vitamin c') || l.includes('niacinamide')) c.push('What to avoid mixing with it?');
  if (l.includes('moisturizer') || l.includes('sunscreen') || l.includes('serum')) c.push('Which brand do you recommend?');
  if (l.includes('breakout') || l.includes('acne')) c.push('Is this purging or a breakout?');
  if (c.length < 2) c.push('Tell me more');
  if (c.length < 2) c.push('What else should I know?');
  return c.slice(0, 3);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN — switches between HISTORY view and CHAT view
// ══════════════════════════════════════════════════════════════════════════════
export default function JayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useChatStore();
  const { user } = useUserStore();
  const [view, setView] = useState<'chat' | 'history'>('chat');

  useEffect(() => { store.initConversation(); store.loadConversations(); }, []);

  const openHistory = () => { store.loadConversations(); setView('history'); };
  const openChat = (id?: string) => {
    if (id) store.openConversation(id);
    setView('chat');
  };
  const startNewChat = () => { store.newChat(); setView('chat'); };

  if (view === 'history') {
    return <HistoryView insets={insets} conversations={store.conversations} onSelect={openChat} onNew={startNewChat} onBack={() => setView('chat')} onDelete={store.deleteConversation} />;
  }

  return <ChatView insets={insets} store={store} user={user} onOpenHistory={openHistory} onBack={() => router.replace('/(tabs)')} />;
}

// ══════════════════════════════════════════════════════════════════════════════
// CHAT VIEW
// ══════════════════════════════════════════════════════════════════════════════
function ChatView({ insets, store, user, onOpenHistory, onBack }: any) {
  const { colors, isDark } = useTheme();
  const flatRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modeOpen, setModeOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulsing animation for mic button
  const micPulse = useSharedValue(1);
  const micPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micPulse.value }],
  }));

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      micPulse.value = withTiming(1, { duration: 200 });
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setIsRecording(false);
      setIsTranscribing(true);

      recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = recorder.uri;
      if (uri) {
        try {
          const text = await transcribeAudio(uri);
          if (text.trim()) {
            setIsTranscribing(false);
            setRecordSec(0);
            send(text);
            return;
          }
        } catch (e: any) {
          console.error('[JAY Voice] Transcription error:', e.message);
        }
      }
      setIsTranscribing(false);
      setRecordSec(0);
    } else {
      // Start recording
      try {
        const granted = await requestMicPermission();
        if (!granted) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setIsRecording(true);
        setRecordSec(0);

        // Pulsing animation
        micPulse.value = withRepeat(
          withSequence(
            withTiming(1.25, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          ),
          -1, true
        );

        // Duration timer
        timerRef.current = setInterval(() => setRecordSec((s) => s + 1), 1000);

        await recorder.prepareToRecordAsync();
        recorder.record();
      } catch (e: any) {
        console.error('[JAY Voice] Recording error:', e.message);
        setIsRecording(false);
        micPulse.value = withTiming(1, { duration: 200 });
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      }
    }
  };

  useEffect(() => {
    const t = setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [store.messages.length]);

  const send = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || store.isStreaming) return;
    Keyboard.dismiss();
    setInput('');
    store.sendMessage(msg);
  };

  const copy = (text: string, id: string) => {
    Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const isEmpty = store.messages.length === 0 && !store.isLoading;
  const contextLine = [user.skinType, ...user.primaryConcerns.slice(0, 2).map((c: string) => c.replace('_', ' '))].filter(Boolean).join(', ');

  return (
    <KeyboardAvoidingView style={[$.screen, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={[$.header, { borderBottomColor: colors.separator }]}>
        <View style={$.headerMain}>
          <View style={$.headerLeft}>
            <Pressable onPress={onBack} style={$.headerBackBtn}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg>
            </Pressable>
            <View style={[$.jayHeaderAvatar, { backgroundColor: colors.systemIndigo }]}><Text style={$.jayHeaderJ}>J</Text></View>
            <View>
              <Text style={[$.headerTitle, { color: colors.label }]}>JAY</Text>
              <Text style={[$.headerSub, { color: colors.secondaryLabel }, store.isStreaming && { color: colors.label, fontWeight: '500' }]}>
                {store.isStreaming ? 'Thinking...' : 'Knows your skin profile'}
              </Text>
            </View>
          </View>
          <View style={$.headerRight}>
            <Pressable onPress={onOpenHistory} style={$.headerBtn}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="1.8" strokeLinecap="round"><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></Svg>
            </Pressable>
            <Pressable onPress={() => store.newChat()} style={$.headerBtn}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="1.8" strokeLinecap="round"><Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" /></Svg>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Body ───────────────────────────────────────── */}
      {isEmpty ? (
        <View style={{ flex: 1 }}>
          <EmptyState user={user} onSend={send} />
        </View>
      ) : store.isLoading ? (
        <View style={$.centerWrap}>
          <ActivityIndicator size="small" color={colors.label} />
          <Text style={[$.loadingText, { color: colors.secondaryLabel }]}>Loading conversation...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          style={{ flex: 1 }}
          data={store.messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={$.msgList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            contextLine ? (
              <View style={[$.contextBanner, { backgroundColor: colors.tertiarySystemFill }]}>
                <View style={[$.contextDot, { backgroundColor: colors.systemGreen }]} />
                <Text style={[$.contextText, { color: colors.secondaryLabel }]}>Using your profile: <Text style={[$.contextBold, { color: colors.label }]}>{contextLine}</Text></Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            const isLast = item.role === 'jay' && index === store.messages.length - 1;
            return item.role === 'jay' ? (
              <JayBubble
                msg={item} isLast={isLast}
                onCopy={() => copy(item.text, item.id)} copied={copiedId === item.id}
                onRetry={isLast && !store.isStreaming ? () => {
                  const lu = [...store.messages].reverse().find((m: ChatMessage) => m.role === 'user');
                  if (lu) send(lu.text);
                } : undefined}
                followUps={isLast && !store.isStreaming && !item.isStreaming ? getFollowUps(item.text) : undefined}
                onFollowUp={send}
              />
            ) : (
              <UserBubble text={item.text} time={item.timestamp} />
            );
          }}
          ListFooterComponent={store.isTyping ? <ThinkingIndicator /> : <View style={{ height: 8 }} />}
        />
      )}

      {/* ── Stop generating ────────────────────────────── */}
      {store.isStreaming ? (
        <Animated.View entering={FadeIn.duration(200)} style={$.streamingBar}>
          <Pressable style={$.stopBtn} onPress={store.stopGenerating}>
            <View style={$.stopIcon} /><Text style={$.stopText}>Stop generating</Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* ── Mode dropdown overlay ─────────────────────── */}
      {modeOpen && (
        <Pressable style={$.modeOverlay} onPress={() => setModeOpen(false)} />
      )}

      {/* ── Input bar ──────────────────────────────────── */}
      <View style={[$.inputBar, { paddingBottom: Math.max(insets.bottom, 12), borderTopColor: colors.separator, backgroundColor: colors.systemBackground }]}>
        {/* Mode dropdown (floats above input) */}
        {modeOpen && (
          <Animated.View entering={FadeIn.duration(150)} style={[$.modePickerExpanded, { backgroundColor: colors.secondarySystemBackground, borderColor: colors.separator }]}>
            {MODES.map((m) => (
              <Pressable
                key={m}
                style={[$.modeOption, store.mode === m && { backgroundColor: colors.systemBlue + '15' }]}
                onPress={() => { store.setMode(m); setModeOpen(false); }}
              >
                <View style={[$.modeOptionDot, { backgroundColor: store.mode === m ? colors.systemBlue : colors.systemGray3 }]} />
                <Text style={[$.modeOptionText, { color: store.mode === m ? colors.systemBlue : colors.label }]}>{m}</Text>
                {store.mode === m && (
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.systemBlue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <Polyline points="20 6 9 17 4 12" />
                  </Svg>
                )}
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Recording / transcribing banner */}
        {(isRecording || isTranscribing) && (
          <View style={[$.voiceBanner, { backgroundColor: isRecording ? colors.systemRed + '12' : colors.systemBlue + '12' }]}>
            <View style={$.voiceBannerTop}>
              <View style={[$.recordingDot, { backgroundColor: isRecording ? colors.systemRed : colors.systemBlue }]} />
              <Text style={[$.recordingText, { color: isRecording ? colors.systemRed : colors.systemBlue }]}>
                {isRecording
                  ? `Recording  ${Math.floor(recordSec / 60)}:${String(recordSec % 60).padStart(2, '0')}`
                  : 'Transcribing...'}
              </Text>
              {isTranscribing && <ActivityIndicator size="small" color={colors.systemBlue} style={{ marginLeft: 4 }} />}
            </View>
            {isRecording && (
              <Text style={[$.liveTextHint, { color: colors.tertiaryLabel }]}>Tap the stop button when done</Text>
            )}
          </View>
        )}

        {/* Input box */}
        <View style={[$.inputBox, { backgroundColor: colors.tertiarySystemFill, borderColor: colors.separator }]}>
          {/* Text area */}
          <TextInput
            style={[$.inputText, { color: colors.label }]}
            placeholder={isRecording ? 'Listening...' : isTranscribing ? 'Processing...' : store.isStreaming ? 'JAY is responding...' : 'Ask JAY anything...'}
            placeholderTextColor={colors.placeholderText}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            onKeyPress={(e) => {
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !(e.nativeEvent as any).shiftKey) {
                e.preventDefault(); send();
              }
            }}
            returnKeyType="send"
            blurOnSubmit={false}
            multiline maxLength={2000}
            editable={!store.isStreaming && !isRecording && !isTranscribing}
          />

          {/* Bottom toolbar: [mode pill] ——spacer—— [mic] [send] */}
          <View style={$.inputToolbar}>
            <Pressable style={[$.modePill, { backgroundColor: colors.quaternarySystemFill }]} onPress={() => setModeOpen(!modeOpen)}>
              <View style={[$.modePickerDot, { backgroundColor: colors.systemBlue }]} />
              <Text style={[$.modePillText, { color: colors.secondaryLabel }]}>{store.mode}</Text>
              <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={colors.tertiaryLabel} strokeWidth="3" strokeLinecap="round">
                <Path d={modeOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
              </Svg>
            </Pressable>

            <View style={{ flex: 1 }} />

            <Animated.View style={micPulseStyle}>
              <Pressable
                style={[$.micBtn, { backgroundColor: isRecording ? colors.systemRed : 'transparent' }]}
                onPress={toggleRecording}
                disabled={store.isStreaming || isTranscribing}
                hitSlop={6}
              >
                {isRecording ? (
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.5">
                    <Rect x="6" y="6" width="12" height="12" rx="2" />
                  </Svg>
                ) : (
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.secondaryLabel} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <Line x1="12" y1="19" x2="12" y2="23" />
                    <Line x1="8" y1="23" x2="16" y2="23" />
                  </Svg>
                )}
              </Pressable>
            </Animated.View>

            <Pressable
              style={[$.sendBtn, { backgroundColor: colors.systemBlue }, (!input.trim() || store.isStreaming || isRecording) && { backgroundColor: colors.quaternarySystemFill }]}
              onPress={() => send()}
              disabled={!input.trim() || store.isStreaming || isRecording}
              hitSlop={6}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <Path d="M22 2L11 13" /><Path d="M22 2l-7 20-4-9-9-4z" />
              </Svg>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HISTORY VIEW — conversation list grouped by date
// ══════════════════════════════════════════════════════════════════════════════
function HistoryView({ insets, conversations, onSelect, onNew, onBack, onDelete }: {
  insets: any; conversations: ConversationSummary[];
  onSelect: (id: string) => void; onNew: () => void; onBack: () => void;
  onDelete: (id: string) => void;
}) {
  const { colors } = useTheme();
  // Group conversations by date
  const groups: { label: string; items: ConversationSummary[] }[] = [];
  const today = new Date(); const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const todayStr = today.toDateString(); const yesterdayStr = yesterday.toDateString();

  const todayItems: ConversationSummary[] = [];
  const yesterdayItems: ConversationSummary[] = [];
  const olderItems: ConversationSummary[] = [];

  for (const c of conversations) {
    const d = new Date(c.updated_at).toDateString();
    if (d === todayStr) todayItems.push(c);
    else if (d === yesterdayStr) yesterdayItems.push(c);
    else olderItems.push(c);
  }
  if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (olderItems.length) groups.push({ label: 'Earlier', items: olderItems });

  return (
    <View style={[$.screen, { paddingTop: insets.top, backgroundColor: colors.groupedBackground }]}>
      <View style={[$.historyHeader, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={onBack} style={$.headerBackBtn}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.systemBlue} strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg>
        </Pressable>
        <Text style={[$.historyTitle, { color: colors.label }]}>Conversations</Text>
        <Pressable onPress={onNew} style={[$.newChatCircle, { backgroundColor: colors.systemBlue }]}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" />
          </Svg>
        </Pressable>
      </View>

      {conversations.length === 0 ? (
        <View style={$.centerWrap}>
          <Text style={{ fontSize: 36 }}>💬</Text>
          <Text style={[$.emptyHistTitle, { color: colors.label }]}>No conversations yet</Text>
          <Text style={[$.loadingText, { color: colors.secondaryLabel }]}>Start a new chat with JAY</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
          {groups.map((g) => (
            <View key={g.label}>
              <Text style={[$.groupLabel, { color: colors.tertiaryLabel }]}>{g.label.toUpperCase()}</Text>
              {g.items.map((c) => (
                <Pressable key={c.id} style={[$.chatRow, { borderBottomColor: colors.separator }]} onPress={() => onSelect(c.id)}>
                  <View style={$.chatRowAvatar}><Text style={$.chatRowJ}>J</Text></View>
                  <View style={$.chatRowContent}>
                    <Text style={[$.chatRowTitle, { color: colors.label }]} numberOfLines={1}>{c.title || 'New conversation'}</Text>
                    <Text style={[$.chatRowPreview, { color: colors.secondaryLabel }]} numberOfLines={1}>{c.last_message_preview || 'No messages yet'}</Text>
                  </View>
                  <View style={$.chatRowMeta}>
                    <Text style={[$.chatRowTime, { color: colors.tertiaryLabel }]}>
                      {new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {c.message_count > 0 ? (
                      <View style={$.chatRowBadge}><Text style={$.chatRowBadgeText}>{c.message_count}</Text></View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════
function EmptyState({ user, onSend }: { user: any; onSend: (t: string) => void }) {
  const { colors } = useTheme();
  const name = user.name ? user.name.split(' ')[0] : '';
  const ctx = [user.skinType?.toLowerCase(), ...user.primaryConcerns.slice(0, 2).map((c: string) => c.replace('_', ' '))].filter(Boolean).join(', ');

  const cards = [
    { icon: 'ingredient', title: 'Check ingredient compatibility', sub: 'Can I mix salicylic acid with niacinamide?' },
    { icon: 'routine', title: 'Build my routine', sub: 'Create an AM routine for acne-prone skin' },
    { icon: 'dupe', title: 'Find a dupe', sub: "What's a cheaper alternative to Drunk Elephant?" },
    { icon: 'research', title: 'Research a product', sub: 'Is Minimalist Vitamin C actually good?' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={$.emptyWrap} showsVerticalScrollIndicator={false}>
      <View style={$.emptyCenter}>
        <View style={$.emptyLogo}><Text style={$.emptyLogoJ}>J</Text></View>
        <Text style={[$.emptyTitle, { color: colors.label }]}>{name ? `Hey ${name}!` : 'Hey there!'}</Text>
        <Text style={[$.emptyDesc, { color: colors.secondaryLabel }]}>
          {ctx ? `I know your skin — ${ctx}. Ask me anything or pick a topic.` : "I'm your personal skincare expert. Ask me anything."}
        </Text>
      </View>
      <View style={$.emptyPrompts}>
        {cards.map((card, i) => (
          <Animated.View key={card.title} entering={FadeInUp.duration(250).delay(i * 70)}>
            <Pressable style={[$.emptyCard, { backgroundColor: colors.secondarySystemBackground }]} onPress={() => onSend(card.sub)}>
              <View style={[$.emptyCardIcon, { backgroundColor: colors.tertiarySystemFill }]}><CardIcon type={card.icon} /></View>
              <View style={$.emptyCardText}>
                <Text style={[$.emptyCardTitle, { color: colors.label }]}>{card.title}</Text>
                <Text style={[$.emptyCardSub, { color: colors.secondaryLabel }]}>"{card.sub}"</Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>
      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

function CardIcon({ type }: { type: string }) {
  const { colors: tc } = useTheme();
  const c = tc.secondaryLabel; const w = 18;
  if (type === 'ingredient') return <Svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><Path d="M10 2v7.5a2 2 0 01-.2.9L4.7 20.6a1 1 0 00.9 1.4h12.8a1 1 0 00.9-1.4l-5.1-10.2a2 2 0 01-.2-.9V2" /><Path d="M8.5 2h7" /></Svg>;
  if (type === 'routine') return <Svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></Svg>;
  if (type === 'dupe') return <Svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><Path d="M16 3l5 5-5 5" /><Path d="M21 8H9" /><Path d="M8 21l-5-5 5-5" /><Path d="M3 16h12" /></Svg>;
  return <Svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><Circle cx="11" cy="11" r="8" /><Path d="M21 21l-4.35-4.35" /></Svg>;
}

// ══════════════════════════════════════════════════════════════════════════════
// BUBBLES
// ══════════════════════════════════════════════════════════════════════════════
function JayBubble({ msg, isLast, onCopy, copied, onRetry, followUps, onFollowUp }: {
  msg: ChatMessage; isLast: boolean; onCopy: () => void; copied: boolean;
  onRetry?: () => void; followUps?: string[]; onFollowUp: (t: string) => void;
}) {
  const { colors: c } = useTheme();
  return (
    <Animated.View entering={FadeInUp.duration(200)} style={$.msgJay}>
      <View style={$.jayAvatar}><Text style={$.jayAvatarJ}>J</Text></View>
      <View style={$.msgJayContent}>
        <View style={[$.bubbleJay, { backgroundColor: c.secondarySystemBackground }]}>
          <RichText text={msg.text} color={c.label} accentColor={c.systemIndigo} />
          {msg.isStreaming ? <Text style={[$.bubbleJayText, { color: c.label }]}><BlinkCursor /></Text> : null}
        </View>
        {isLast && !msg.isStreaming ? (
          <View style={$.msgActions}>
            <Pressable style={$.msgAction} onPress={onCopy} hitSlop={6}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c.secondaryLabel} strokeWidth="1.5" strokeLinecap="round"><Rect x="9" y="9" width="13" height="13" rx="2" /><Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></Svg>
            </Pressable>
            {onRetry ? <Pressable style={$.msgAction} onPress={onRetry} hitSlop={6}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c.secondaryLabel} strokeWidth="1.5" strokeLinecap="round"><Path d="M1 4v6h6M23 20v-6h-6" /><Path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></Svg>
            </Pressable> : null}
            <Text style={[$.msgActionLabel, { color: c.tertiaryLabel }]}>{copied ? 'Copied!' : ''}</Text>
          </View>
        ) : null}
        <Text style={[$.msgTime, { color: c.tertiaryLabel }]}>{msg.timestamp}</Text>
        {followUps ? (
          <View style={$.suggestions}>{followUps.map((f) => (
            <Pressable key={f} style={[$.suggestionChip, { backgroundColor: c.quaternarySystemFill }]} onPress={() => onFollowUp(f)}>
              <Text style={[$.suggestionText, { color: c.systemBlue }]}>{f}</Text>
            </Pressable>
          ))}</View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function UserBubble({ text, time }: { text: string; time: string }) {
  const { colors: c } = useTheme();
  return (
    <Animated.View entering={FadeInUp.duration(200)} style={$.msgUser}>
      <View style={[$.bubbleUser, { backgroundColor: c.systemBlue }]}><Text style={$.bubbleUserText}>{text}</Text></View>
      <Text style={[$.msgTime, $.msgTimeRight, { color: c.tertiaryLabel }]}>{time}</Text>
    </Animated.View>
  );
}

function ThinkingIndicator() {
  const { colors: c } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(200)} style={$.msgJay}>
      <View style={$.jayAvatar}><Text style={$.jayAvatarJ}>J</Text></View>
      <View style={[$.thinkingBubble, { backgroundColor: c.secondarySystemBackground }]}><ThinkingDots /></View>
    </Animated.View>
  );
}
function ThinkingDots() {
  const d1 = useSharedValue(0.3); const d2 = useSharedValue(0.3); const d3 = useSharedValue(0.3);
  useEffect(() => {
    d1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, true);
    setTimeout(() => { d2.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, true); }, 200);
    setTimeout(() => { d3.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, true); }, 400);
  }, []);
  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));
  return <View style={{ flexDirection: 'row', gap: 4 }}><Animated.View style={[$.thinkDot, s1]} /><Animated.View style={[$.thinkDot, s2]} /><Animated.View style={[$.thinkDot, s3]} /></View>;
}

function BlinkCursor() {
  const { colors } = useTheme();
  const op = useSharedValue(1);
  useEffect(() => { op.value = withRepeat(withSequence(withTiming(0, { duration: 500, easing: Easing.steps(2) }), withTiming(1, { duration: 500, easing: Easing.steps(2) })), -1, false); }, []);
  const st = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.Text style={[{ color: colors.secondaryLabel, fontWeight: '700' }, st]}>{' |'}</Animated.Text>;
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
// Colors are applied inline via `colors` from useTheme(). StyleSheet has only structural values.
const $ = StyleSheet.create({
  screen: { flex: 1 },

  header: { borderBottomWidth: HW },
  headerMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBackBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  jayHeaderAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  jayHeaderJ: { color: '#fff', fontSize: 14, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.41, fontFamily: 'Outfit-SemiBold' },
  headerSub: { fontSize: 13, fontFamily: 'Outfit', marginTop: 1 },
  headerRight: { flexDirection: 'row', gap: 4 },
  headerBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  modeOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  modePickerDot: { width: 6, height: 6, borderRadius: 3 },
  modePickerExpanded: { marginBottom: 6, borderRadius: 12, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, zIndex: 20 },
  modeOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  modeOptionDot: { width: 6, height: 6, borderRadius: 3 },
  modeOptionText: { fontSize: 14, fontFamily: 'Outfit-Medium', fontWeight: '500', flex: 1 },

  contextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, paddingHorizontal: 14, borderRadius: 10, marginHorizontal: 4, marginBottom: 12 },
  contextDot: { width: 5, height: 5, borderRadius: 3 },
  contextText: { fontSize: 13, fontFamily: 'Outfit', lineHeight: 18 },
  contextBold: { fontWeight: '500', fontFamily: 'Outfit-Medium' },

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 15, fontFamily: 'Outfit' },

  msgList: { paddingHorizontal: 16, paddingTop: 16 },
  msgJay: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 20 },
  jayAvatar: { width: 26, height: 26, backgroundColor: '#5856D6', borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  jayAvatarJ: { color: '#fff', fontSize: 11, fontWeight: '800' },
  msgJayContent: { flex: 1, maxWidth: 280, gap: 6 },
  bubbleJay: { borderTopLeftRadius: 4, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  bubbleJayText: { fontSize: 15, lineHeight: 22, fontFamily: 'Outfit' },

  msgUser: { alignItems: 'flex-end', marginBottom: 20 },
  bubbleUser: { borderTopLeftRadius: 18, borderTopRightRadius: 4, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, paddingHorizontal: 14, paddingVertical: 12, maxWidth: 265 },
  bubbleUserText: { fontSize: 15, lineHeight: 22, color: '#fff', fontFamily: 'Outfit' },

  msgTime: { fontSize: 11, fontFamily: 'Outfit', marginTop: 2 },
  msgTimeRight: { textAlign: 'right' as const },

  msgActions: { flexDirection: 'row', gap: 2, alignItems: 'center', marginTop: 4 },
  msgAction: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', opacity: 0.3 },
  msgActionLabel: { fontSize: 11, marginLeft: 4, fontFamily: 'Outfit' },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  suggestionChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 100 },
  suggestionText: { fontSize: 13, fontFamily: 'Outfit' },

  thinkingBubble: { borderTopLeftRadius: 4, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, padding: 14 },
  thinkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8E8E93' },

  streamingBar: { alignItems: 'center', paddingVertical: 6 },
  stopBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 18, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 100 },
  stopIcon: { width: 10, height: 10, borderWidth: 1.5, borderColor: '#fff', borderRadius: 2 },
  stopText: { fontSize: 13, fontWeight: '500', color: '#fff', fontFamily: 'Outfit-Medium' },

  inputBar: { paddingHorizontal: 12, paddingTop: 8, zIndex: 20 },
  inputBox: { borderRadius: 22, borderWidth: HW, paddingTop: 4, paddingHorizontal: 14, paddingBottom: 6 },
  inputText: { fontSize: 15, fontFamily: 'Outfit', maxHeight: 100, minHeight: 32, paddingVertical: Platform.OS === 'ios' ? 6 : 4 },
  inputToolbar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  modePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100 },
  modePillText: { fontSize: 12, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  micBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  voiceBanner: { paddingHorizontal: 14, paddingVertical: 10, marginBottom: 6, borderRadius: 12, marginHorizontal: 4 },
  voiceBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4 },
  recordingText: { fontSize: 13, fontFamily: 'Outfit-SemiBold', fontWeight: '600' },
  liveText: { fontSize: 15, fontFamily: 'Outfit', lineHeight: 21, marginTop: 6 },
  liveTextHint: { fontSize: 14, fontFamily: 'Outfit', fontStyle: 'italic', marginTop: 4 },

  emptyWrap: { paddingTop: 40, paddingHorizontal: 20 },
  emptyCenter: { alignItems: 'center', marginBottom: 32 },
  emptyLogo: { width: 64, height: 64, backgroundColor: '#5856D6', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyLogoJ: { color: '#fff', fontSize: 24, fontWeight: '800' },
  emptyTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Outfit-Bold', letterSpacing: -0.3, marginBottom: 8 },
  emptyDesc: { fontSize: 15, fontFamily: 'Outfit', lineHeight: 22, textAlign: 'center' },
  emptyPrompts: { gap: 8 },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16 },
  emptyCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyCardText: { flex: 1 },
  emptyCardTitle: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  emptyCardSub: { fontSize: 13, fontFamily: 'Outfit', marginTop: 2 },
  emptyHistTitle: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold', marginTop: 12 },

  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: HW },
  historyTitle: { fontSize: 22, fontWeight: '700', fontFamily: 'Outfit-Bold', letterSpacing: -0.3, flex: 1, marginLeft: 10 },
  newChatCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  groupLabel: { fontSize: 13, fontWeight: '400', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6, fontFamily: 'Outfit' },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: HW },
  chatRowAvatar: { width: 40, height: 40, backgroundColor: '#5856D6', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chatRowJ: { color: '#fff', fontSize: 16, fontWeight: '800' },
  chatRowContent: { flex: 1, minWidth: 0 },
  chatRowTitle: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  chatRowPreview: { fontSize: 13, fontFamily: 'Outfit', marginTop: 2 },
  chatRowMeta: { alignItems: 'flex-end', gap: 4 },
  chatRowTime: { fontSize: 13, fontFamily: 'Outfit' },
  chatRowBadge: { width: 18, height: 18, backgroundColor: '#5856D6', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  chatRowBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
});
