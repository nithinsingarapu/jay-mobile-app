/**
 * JAY Routine Notifications — Local scheduled reminders.
 *
 * JAY's personality: Humorous, caring, fun, never naggy.
 * Like a witty best friend who genuinely cares about your skin.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIF_SETTINGS_KEY = '@jay_notification_settings';
const SCHEDULED_IDS_KEY = '@jay_scheduled_notif_ids';

// ══════════════════════════════════════════════════════════════════════
// JAY'S NOTIFICATION MESSAGES — personality-driven, never boring
// ══════════════════════════════════════════════════════════════════════

const MORNING_MESSAGES = [
  { title: 'Rise and glow! ☀️', body: "Your skin waited all night for this moment. Open JAY and check off your steps!" },
  { title: 'Good morning, gorgeous 🌅', body: "SPF isn't optional today. Log your morning routine in JAY 🧴" },
  { title: 'Skin o\'clock! ⏰', body: "Your morning routine called — it misses you. Tap to log it." },
  { title: 'GM! Your skin says hi 👋', body: "Cleanser → Serum → Moisturizer → SPF. Open JAY to track." },
  { title: 'Wake up, buttercup 🌻', body: "The sun's already damaging collagen. Armor up and log it in JAY!" },
  { title: 'Plot twist: you\'re glowing ✨', body: "But only if you do your AM routine first. Tap to start." },
  { title: 'Your skin has entered the chat 💬', body: "It wants cleanser, vitamin C, and SPF. Open JAY to check them off." },
  { title: 'Skincare before scrolling 📱', body: "5 minutes in JAY > 47 minutes on Instagram. Log your routine!" },
  { title: 'Breaking news 📰', body: "Local skin looks AMAZING after logging morning routine in JAY. You next?" },
  { title: 'JAY here 🤖', body: "Your moisturizer is feeling lonely. Open the app and give it purpose." },
];

const AFTERNOON_MESSAGES = [
  { title: 'SPF check! ☀️', body: "It's been a few hours. Your sunscreen is basically ghosting you now." },
  { title: 'Midday skin SOS 🆘', body: "That morning SPF? Gone. Time for a touch-up, bestie." },
  { title: 'Your skin called collect 📞', body: "It says the UV rays are winning. Quick SPF reapply?" },
  { title: 'Afternoon glow check ✨', body: "Blot, mist, SPF. 30 seconds. Your future self says thanks." },
  { title: 'Fun fact 🧠', body: "SPF effectiveness drops 50% after 2 hours. Not-so-fun for your skin." },
  { title: 'Quick pit stop 🏎️', body: "Lip balm + SPF spray = 15 seconds of skin insurance." },
];

const EVENING_MESSAGES = [
  { title: 'Evening wind-down 🌆', body: "The day's pollution is literally sitting on your face right now." },
  { title: 'Pre-night prep 🧴', body: "A quick cleanse now = your PM routine working 2x harder later." },
  { title: 'Your skin after 5pm 😮‍💨', body: "It's been through a lot today. Show it some love." },
];

const NIGHT_MESSAGES = [
  { title: 'PM routine time 🌙', body: "Your skin repairs while you sleep. Open JAY and log your steps before bed!" },
  { title: 'Skin recovery mode 💤', body: "Double cleanse → Treatment → Moisturizer. Tap to check them off in JAY." },
  { title: 'Night shift starts now 🔬', body: "Retinol and your pillow have a date. Log it in JAY — don't be late." },
  { title: 'Friendly reminder from JAY 🤖', body: "Sleeping in makeup is a hate crime against your pores. Open JAY, do the thing." },
  { title: 'Confession time 🙈', body: "PM routine: 5 min. TikTok scroll: 47 min. Open JAY and be the hero." },
  { title: 'Your skin\'s bedtime story 📖', body: "Once upon a time, someone logged their PM routine in JAY. They had amazing skin. The end." },
  { title: 'Last call for skincare 🛎️', body: "The bar is closing. Open JAY and check off your night steps." },
  { title: 'Nighttime = repair time 🔧', body: "Ceramides + retinol + logging in JAY. The actual holy trinity." },
  { title: 'JAY\'s nightly nudge 💫', body: "Tomorrow's glow is tonight's routine. Tap to log it now." },
  { title: 'Did you know? 🧪', body: "Skin turnover peaks 11pm-4am. Open JAY and prep your skin for repair mode." },
];

const STREAK_MESSAGES = [
  { title: '🔥 Streak alert!', body: "You're on a {streak}-day streak! Don't break the chain!" },
  { title: 'Consistency queen 👑', body: "{streak} days of skincare greatness. Keep this energy." },
  { title: '{streak} days strong 💪', body: "Your skin is literally glowing from the consistency. Science says so." },
];

const MISSED_MESSAGES = [
  { title: 'No judgment, just vibes 🫶', body: "You missed yesterday. That's okay. Today is a fresh start." },
  { title: 'JAY noticed something 👀', body: "Your routine missed you yesterday. It's been staring at the bathroom shelf." },
  { title: 'Plot hole detected 🕵️', body: "Yesterday's skincare chapter was blank. Let's write today's." },
];

// ── Helper: pick random message ──────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatStreakMessage(streak: number): { title: string; body: string } {
  const msg = pickRandom(STREAK_MESSAGES);
  return {
    title: msg.title.replace('{streak}', String(streak)),
    body: msg.body.replace('{streak}', String(streak)),
  };
}

// ══════════════════════════════════════════════════════════════════════
// NOTIFICATION SETTINGS
// ══════════════════════════════════════════════════════════════════════

export interface NotificationSettings {
  enabled: boolean;
  morning: { enabled: boolean; hour: number; minute: number };
  afternoon: { enabled: boolean; hour: number; minute: number };
  evening: { enabled: boolean; hour: number; minute: number };
  night: { enabled: boolean; hour: number; minute: number };
  streakReminders: boolean;
  missedReminders: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  morning: { enabled: true, hour: 7, minute: 0 },
  afternoon: { enabled: false, hour: 13, minute: 0 },
  evening: { enabled: false, hour: 17, minute: 30 },
  night: { enabled: true, hour: 21, minute: 0 },
  streakReminders: true,
  missedReminders: true,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIF_SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
  // Reschedule all notifications with new settings
  await scheduleAllRoutineNotifications(settings);
}

// ══════════════════════════════════════════════════════════════════════
// PERMISSION + SETUP
// ══════════════════════════════════════════════════════════════════════

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('[Notifications] Must use physical device');
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('routine-reminders', {
      name: 'Routine Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0A84FF',
      sound: 'default',
    });
  }
}

// ══════════════════════════════════════════════════════════════════════
// SCHEDULING
// ══════════════════════════════════════════════════════════════════════

async function cancelAllScheduled() {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, '[]');
  } catch {}
}

async function scheduleDaily(
  hour: number,
  minute: number,
  messages: { title: string; body: string }[],
  session: string,
  channelId = 'routine-reminders',
): Promise<string> {
  const msg = pickRandom(messages);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body + '\n\nTap to open JAY and log your routine →',
      sound: 'default',
      data: { screen: 'routine', session, action: 'log' },
      ...(Platform.OS === 'android' ? { channelId } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return id;
}

export async function scheduleAllRoutineNotifications(
  settings?: NotificationSettings,
): Promise<void> {
  const s = settings || await getNotificationSettings();
  if (!s.enabled) {
    await cancelAllScheduled();
    return;
  }

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await cancelAllScheduled();

  const scheduledIds: string[] = [];

  if (s.morning.enabled) {
    const id = await scheduleDaily(s.morning.hour, s.morning.minute, MORNING_MESSAGES, 'morning');
    scheduledIds.push(id);
  }
  if (s.afternoon.enabled) {
    const id = await scheduleDaily(s.afternoon.hour, s.afternoon.minute, AFTERNOON_MESSAGES, 'afternoon');
    scheduledIds.push(id);
  }
  if (s.evening.enabled) {
    const id = await scheduleDaily(s.evening.hour, s.evening.minute, EVENING_MESSAGES, 'evening');
    scheduledIds.push(id);
  }
  if (s.night.enabled) {
    const id = await scheduleDaily(s.night.hour, s.night.minute, NIGHT_MESSAGES, 'night');
    scheduledIds.push(id);
  }

  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduledIds));
  console.log(`[JAY Notifications] Scheduled ${scheduledIds.length} daily reminders`);
}

// ── One-off notifications ────────────────────────────────────────────

export async function sendStreakNotification(streak: number) {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.streakReminders) return;

  const msg = formatStreakMessage(streak);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      sound: 'default',
    },
    trigger: null, // immediate
  });
}

export async function sendMissedNotification() {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.missedReminders) return;

  const msg = pickRandom(MISSED_MESSAGES);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 10, // 10 hours after last expected routine
    },
  });
}

// ── Init (call on app start) ─────────────────────────────────────────

export async function initNotifications() {
  configureNotifications();
  const settings = await getNotificationSettings();
  if (settings.enabled) {
    await scheduleAllRoutineNotifications(settings);
  }
}
