import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, Pressable, ScrollView,
  Platform, Keyboard, ActivityIndicator,
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
  const flatRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    <View style={[$.screen, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={$.header}>
        <View style={$.headerMain}>
          <View style={$.headerLeft}>
            <Pressable onPress={onBack} style={$.headerBackBtn}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg>
            </Pressable>
            <View style={$.jayHeaderAvatar}><Text style={$.jayHeaderJ}>J</Text></View>
            <View>
              <Text style={$.headerTitle}>JAY</Text>
              <Text style={[$.headerSub, store.isStreaming && { color: '#000', fontWeight: '500' }]}>
                {store.isStreaming ? 'Thinking...' : 'Knows your skin profile'}
              </Text>
            </View>
          </View>
          <View style={$.headerRight}>
            <Pressable onPress={onOpenHistory} style={$.headerBtn}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round"><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></Svg>
            </Pressable>
            <Pressable onPress={() => store.newChat()} style={$.headerBtn}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round"><Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" /></Svg>
            </Pressable>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={$.modeBar}>
          {MODES.map((m) => (
            <Pressable key={m} style={[$.modeChip, store.mode === m && $.modeChipActive]} onPress={() => store.setMode(m)}>
              <Text style={[$.modeChipText, store.mode === m && $.modeChipTextActive]}>{m}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── Body ───────────────────────────────────────── */}
      {isEmpty ? (
        <View style={{ flex: 1 }}>
          <EmptyState user={user} onSend={send} />
        </View>
      ) : store.isLoading ? (
        <View style={$.centerWrap}>
          <ActivityIndicator size="small" color="#000" />
          <Text style={$.loadingText}>Loading conversation...</Text>
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
              <View style={$.contextBanner}>
                <View style={$.contextDot} />
                <Text style={$.contextText}>Using your profile: <Text style={$.contextBold}>{contextLine}</Text></Text>
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

      {/* ── Input bar ──────────────────────────────────── */}
      <View style={[$.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={$.inputRow}>
          <View style={[$.inputField, store.isStreaming && { opacity: 0.4 }]}>
            <TextInput
              style={$.inputText}
              placeholder={store.isStreaming ? 'JAY is responding...' : 'Ask JAY anything...'}
              placeholderTextColor="#CCC"
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
              editable={!store.isStreaming}
            />
          </View>
          <Pressable
            style={[$.sendBtn, (!input.trim() || store.isStreaming) && $.sendBtnOff]}
            onPress={() => send()}
            disabled={!input.trim() || store.isStreaming}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
              <Path d="M22 2L11 13" /><Path d="M22 2l-7 20-4-9-9-4z" />
            </Svg>
          </Pressable>
        </View>
      </View>
    </View>
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
    <View style={[$.screen, { paddingTop: insets.top }]}>
      <View style={$.historyHeader}>
        <Pressable onPress={onBack} style={$.headerBackBtn}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg>
        </Pressable>
        <Text style={$.historyTitle}>Conversations</Text>
        <Pressable onPress={onNew} style={$.newChatCircle}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <Line x1="12" y1="5" x2="12" y2="19" /><Line x1="5" y1="12" x2="19" y2="12" />
          </Svg>
        </Pressable>
      </View>

      {conversations.length === 0 ? (
        <View style={$.centerWrap}>
          <Text style={{ fontSize: 36 }}>💬</Text>
          <Text style={$.emptyHistTitle}>No conversations yet</Text>
          <Text style={$.loadingText}>Start a new chat with JAY</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}>
          {groups.map((g) => (
            <View key={g.label}>
              <Text style={$.groupLabel}>{g.label.toUpperCase()}</Text>
              {g.items.map((c) => (
                <Pressable key={c.id} style={$.chatRow} onPress={() => onSelect(c.id)}>
                  <View style={$.chatRowAvatar}><Text style={$.chatRowJ}>J</Text></View>
                  <View style={$.chatRowContent}>
                    <Text style={$.chatRowTitle} numberOfLines={1}>{c.title || 'New conversation'}</Text>
                    <Text style={$.chatRowPreview} numberOfLines={1}>{c.last_message_preview || 'No messages yet'}</Text>
                  </View>
                  <View style={$.chatRowMeta}>
                    <Text style={$.chatRowTime}>
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
        <Text style={$.emptyTitle}>{name ? `Hey ${name}!` : 'Hey there!'}</Text>
        <Text style={$.emptyDesc}>
          {ctx ? `I know your skin — ${ctx}. Ask me anything or pick a topic.` : "I'm your personal skincare expert. Ask me anything."}
        </Text>
      </View>
      <View style={$.emptyPrompts}>
        {cards.map((card, i) => (
          <Animated.View key={card.title} entering={FadeInUp.duration(250).delay(i * 70)}>
            <Pressable style={$.emptyCard} onPress={() => onSend(card.sub)}>
              <View style={$.emptyCardIcon}><CardIcon type={card.icon} /></View>
              <View style={$.emptyCardText}>
                <Text style={$.emptyCardTitle}>{card.title}</Text>
                <Text style={$.emptyCardSub}>"{card.sub}"</Text>
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
  const c = "#666"; const w = 18;
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
  return (
    <Animated.View entering={FadeInUp.duration(200)} style={$.msgJay}>
      <View style={$.jayAvatar}><Text style={$.jayAvatarJ}>J</Text></View>
      <View style={$.msgJayContent}>
        <View style={$.bubbleJay}>
          <Text style={$.bubbleJayText}>{msg.text}{msg.isStreaming ? <BlinkCursor /> : null}</Text>
        </View>
        {isLast && !msg.isStreaming ? (
          <View style={$.msgActions}>
            <Pressable style={$.msgAction} onPress={onCopy} hitSlop={6}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round"><Rect x="9" y="9" width="13" height="13" rx="2" /><Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></Svg>
            </Pressable>
            {onRetry ? <Pressable style={$.msgAction} onPress={onRetry} hitSlop={6}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round"><Path d="M1 4v6h6M23 20v-6h-6" /><Path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /></Svg>
            </Pressable> : null}
            <Text style={$.msgActionLabel}>{copied ? 'Copied!' : ''}</Text>
          </View>
        ) : null}
        <Text style={$.msgTime}>{msg.timestamp}</Text>
        {followUps ? (
          <View style={$.suggestions}>{followUps.map((f) => (
            <Pressable key={f} style={$.suggestionChip} onPress={() => onFollowUp(f)}>
              <Text style={$.suggestionText}>{f}</Text>
            </Pressable>
          ))}</View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function UserBubble({ text, time }: { text: string; time: string }) {
  return (
    <Animated.View entering={FadeInUp.duration(200)} style={$.msgUser}>
      <View style={$.bubbleUser}><Text style={$.bubbleUserText}>{text}</Text></View>
      <Text style={[$.msgTime, $.msgTimeRight]}>{time}</Text>
    </Animated.View>
  );
}

function ThinkingIndicator() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={$.msgJay}>
      <View style={$.jayAvatar}><Text style={$.jayAvatarJ}>J</Text></View>
      <View style={$.thinkingBubble}><ThinkingDots /></View>
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
  const op = useSharedValue(1);
  useEffect(() => { op.value = withRepeat(withSequence(withTiming(0, { duration: 500, easing: Easing.steps(2) }), withTiming(1, { duration: 500, easing: Easing.steps(2) })), -1, false); }, []);
  const st = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.Text style={[{ color: '#000', fontWeight: '700' }, st]}>{' |'}</Animated.Text>;
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const $ = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: { borderBottomWidth: HW, borderBottomColor: '#E5E5E5' },
  headerMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBackBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  jayHeaderAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  jayHeaderJ: { color: '#fff', fontSize: 14, fontWeight: '700' },
  headerTitle: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2, fontFamily: 'Outfit-SemiBold' },
  headerSub: { fontSize: 11, color: '#999', fontFamily: 'Outfit', marginTop: 1 },
  headerRight: { flexDirection: 'row', gap: 4 },
  headerBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  // Mode chips
  modeBar: { paddingHorizontal: 16, paddingBottom: 12, gap: 6 },
  modeChip: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 100, borderWidth: HW, borderColor: '#E5E5E5' },
  modeChipActive: { backgroundColor: '#000', borderColor: '#000' },
  modeChipText: { fontSize: 11, fontWeight: '500', color: '#999', fontFamily: 'Outfit-Medium' },
  modeChipTextActive: { color: '#fff' },

  // Context banner
  contextBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, paddingHorizontal: 14, backgroundColor: '#F8F8F8', borderRadius: 10, marginHorizontal: 4, marginBottom: 12 },
  contextDot: { width: 5, height: 5, backgroundColor: '#000', borderRadius: 3 },
  contextText: { fontSize: 11, color: '#999', fontFamily: 'Outfit', lineHeight: 16 },
  contextBold: { color: '#000', fontWeight: '500', fontFamily: 'Outfit-Medium' },

  // Center
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#999', fontFamily: 'Outfit' },

  // Messages
  msgList: { paddingHorizontal: 16, paddingTop: 16 },
  msgJay: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 20 },
  jayAvatar: { width: 26, height: 26, backgroundColor: '#000', borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  jayAvatarJ: { color: '#fff', fontSize: 11, fontWeight: '800' },
  msgJayContent: { flex: 1, maxWidth: 280, gap: 6 },
  bubbleJay: { backgroundColor: '#F5F5F5', borderTopLeftRadius: 2, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  bubbleJayText: { fontSize: 13.5, lineHeight: 22, color: '#222', fontFamily: 'Outfit' },

  msgUser: { alignItems: 'flex-end', marginBottom: 20 },
  bubbleUser: { backgroundColor: '#000', borderTopLeftRadius: 16, borderTopRightRadius: 2, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, paddingHorizontal: 14, paddingVertical: 12, maxWidth: 265 },
  bubbleUserText: { fontSize: 13.5, lineHeight: 22, color: '#fff', fontFamily: 'Outfit' },

  msgTime: { fontSize: 10, color: '#CCC', fontFamily: 'Outfit', marginTop: 2 },
  msgTimeRight: { textAlign: 'right' as const },

  msgActions: { flexDirection: 'row', gap: 2, alignItems: 'center', marginTop: 4 },
  msgAction: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', opacity: 0.25 },
  msgActionLabel: { fontSize: 10, color: '#CCC', marginLeft: 4, fontFamily: 'Outfit' },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  suggestionChip: { paddingVertical: 7, paddingHorizontal: 14, borderWidth: HW, borderColor: '#E5E5E5', borderRadius: 100 },
  suggestionText: { fontSize: 12, color: '#666', fontFamily: 'Outfit' },

  thinkingBubble: { backgroundColor: '#F5F5F5', borderTopLeftRadius: 2, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, padding: 14 },
  thinkDot: { width: 6, height: 6, backgroundColor: '#CCC', borderRadius: 3 },

  streamingBar: { alignItems: 'center', paddingVertical: 6 },
  stopBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 18, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 100 },
  stopIcon: { width: 10, height: 10, borderWidth: 1.5, borderColor: '#fff', borderRadius: 2 },
  stopText: { fontSize: 12, fontWeight: '500', color: '#fff', fontFamily: 'Outfit-Medium' },

  // Input bar
  inputBar: { borderTopWidth: HW, borderTopColor: '#E5E5E5', backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  inputField: { flex: 1, minHeight: 36, maxHeight: 120, backgroundColor: '#F5F5F5', borderRadius: 20, justifyContent: 'center' },
  inputText: { paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 9 : 7, fontSize: 14, fontFamily: 'Outfit', color: '#000', maxHeight: 120 },
  sendBtn: { width: 34, height: 34, backgroundColor: '#000', borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { backgroundColor: '#E5E5E5' },

  // Empty state
  emptyWrap: { paddingTop: 40, paddingHorizontal: 24 },
  emptyCenter: { alignItems: 'center', marginBottom: 32 },
  emptyLogo: { width: 64, height: 64, backgroundColor: '#000', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyLogoJ: { color: '#fff', fontSize: 24, fontWeight: '800' },
  emptyTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'Outfit-SemiBold', letterSpacing: -0.3, marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#999', fontFamily: 'Outfit', lineHeight: 20, textAlign: 'center' },
  emptyPrompts: { gap: 8 },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: HW, borderColor: '#E5E5E5', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16 },
  emptyCardIcon: { width: 36, height: 36, backgroundColor: '#F5F5F5', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyCardText: { flex: 1 },
  emptyCardTitle: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  emptyCardSub: { fontSize: 11, color: '#999', fontFamily: 'Outfit', marginTop: 2 },
  emptyHistTitle: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold', marginTop: 12 },

  // History
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: HW, borderBottomColor: '#E5E5E5' },
  historyTitle: { fontSize: 22, fontWeight: '600', fontFamily: 'Outfit-SemiBold', letterSpacing: -0.3, flex: 1, marginLeft: 10 },
  newChatCircle: { width: 36, height: 36, backgroundColor: '#000', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  groupLabel: { fontSize: 10, fontWeight: '600', color: '#999', letterSpacing: 2, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6, fontFamily: 'Outfit-SemiBold' },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: HW, borderBottomColor: '#F5F5F5' },
  chatRowAvatar: { width: 40, height: 40, backgroundColor: '#000', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chatRowJ: { color: '#fff', fontSize: 16, fontWeight: '800' },
  chatRowContent: { flex: 1, minWidth: 0 },
  chatRowTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  chatRowPreview: { fontSize: 12, color: '#999', fontFamily: 'Outfit', marginTop: 2 },
  chatRowMeta: { alignItems: 'flex-end', gap: 4 },
  chatRowTime: { fontSize: 11, color: '#CCC', fontFamily: 'Outfit' },
  chatRowBadge: { width: 18, height: 18, backgroundColor: '#000', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  chatRowBadgeText: { color: '#fff', fontSize: 9, fontWeight: '600' },
});
