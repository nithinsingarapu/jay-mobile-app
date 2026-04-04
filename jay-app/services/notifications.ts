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
  { title: 'Rise and glow! ☀️', body: "Your skin waited all night for this moment. Let's not disappoint it." },
  { title: 'Good morning, gorgeous 🌅', body: "SPF isn't optional today. Neither is that vitamin C." },
  { title: 'Skin o\'clock! ⏰', body: "Your morning routine called — it misses you." },
  { title: 'GM! Your skin says hi 👋', body: "Cleanser → Serum → Moisturizer → SPF. You know the drill." },
  { title: 'Wake up, buttercup 🌻', body: "The sun's already damaging collagen out there. Armor up!" },
  { title: 'Plot twist: you\'re glowing ✨', body: "But only if you do your AM routine first." },
  { title: 'Your skin has entered the chat 💬', body: "It wants cleanser, vitamin C, and SPF. In that order." },
  { title: 'Skincare before scrolling 📱', body: "Your face will thank you. Instagram can wait 5 minutes." },
  { title: 'Breaking news 📰', body: "Local skin found looking AMAZING after morning routine. Film at 11." },
  { title: 'JAY here 🤖', body: "Gentle reminder: your moisturizer is feeling lonely on the shelf." },
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
  { title: 'PM routine time 🌙', body: "Your skin does 70% of its repair while you sleep. Don't send it in unprepared." },
  { title: 'Skin recovery mode 💤', body: "Double cleanse → Treatment → Moisturizer. Your skin will wake up grateful." },
  { title: 'Night shift starts now 🔬', body: "Retinol and your pillow have a date. Don't be late." },
  { title: 'Friendly reminder from JAY 🤖', body: "Sleeping in makeup is a hate crime against your pores. Just saying." },
  { title: 'Confession time 🙈', body: "Your PM routine takes 5 minutes. That TikTok scroll? 47 minutes." },
  { title: 'Your skin\'s bedtime story 📖', body: "Once upon a time, someone cleansed and moisturized before bed. They had amazing skin. The end." },
  { title: 'Last call for skincare 🛎️', body: "The bar is closing. Your moisturizer is waiting. Let's do this." },
  { title: 'Nighttime = repair time 🔧', body: "Ceramides, retinol, and 8 hours of sleep. The holy trinity." },
  { title: 'JAY\'s nightly nudge 💫', body: "Tomorrow's glow is tonight's routine. Don't skip it." },
  { title: 'Did you know? 🧪', body: "Skin cell turnover peaks between 11pm-4am. Give it the tools it needs." },
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
  channelId = 'routine-reminders',
): Promise<string> {
  const msg = pickRandom(messages);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      sound: 'default',
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
    const id = await scheduleDaily(s.morning.hour, s.morning.minute, MORNING_MESSAGES);
    scheduledIds.push(id);
  }
  if (s.afternoon.enabled) {
    const id = await scheduleDaily(s.afternoon.hour, s.afternoon.minute, AFTERNOON_MESSAGES);
    scheduledIds.push(id);
  }
  if (s.evening.enabled) {
    const id = await scheduleDaily(s.evening.hour, s.evening.minute, EVENING_MESSAGES);
    scheduledIds.push(id);
  }
  if (s.night.enabled) {
    const id = await scheduleDaily(s.night.hour, s.night.minute, NIGHT_MESSAGES);
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
