import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, TextInput, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Polyline, Polygon, Rect } from 'react-native-svg';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { useRoutineStore } from '../../stores/routineStore';
import { useUserStore } from '../../stores/userStore';
import { routineService } from '../../services/routine';

const HW = StyleSheet.hairlineWidth;

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useRoutineStore();
  const { user } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  const [screen, setScreen] = useState<'main' | 'types' | 'generating' | 'result' | 'addStep'>('main');
  const [selectedType, setSelectedType] = useState('complete');
  const [types, setTypes] = useState<Record<string, any>>({});
  const [addStepCategory, setAddStepCategory] = useState('');
  const [addStepName, setAddStepName] = useState('');

  useEffect(() => {
    store.init();
    routineService.getTypes().then(setTypes).catch(() => {});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await store.refresh();
    setRefreshing(false);
  }, []);

  const hasRoutine = store.amRoutine || store.pmRoutine;
  const currentRoutine = store.activePeriod === 'am' ? store.amRoutine : store.pmRoutine;
  const todayStatus = store.activePeriod === 'am' ? store.amTodayStatus : store.pmTodayStatus;

  // ── Build with JAY ─────────────────────────────────────────────────────
  const handleBuildWithJay = useCallback(async (type?: string) => {
    setScreen('generating');
    const result = await store.generateRoutine({ routine_type: type || 'auto' });
    if (result) setScreen('result');
    else setScreen('main'); // Failed — go back
  }, []);

  const handleSaveGenerated = useCallback(async () => {
    const ok = await store.saveGeneratedRoutine();
    setScreen('main');
    store.setActiveTab('today');
  }, []);

  // ── Template selection ─────────────────────────────────────────────────
  const handleSelectType = useCallback(async (typeId: string) => {
    try {
      await routineService.create({ period: 'am', routine_type: typeId, name: `${types[typeId]?.name || typeId} AM` });
      await routineService.create({ period: 'pm', routine_type: typeId, name: `${types[typeId]?.name || typeId} PM` });
      await store.init();
      setScreen('main');
      store.setActiveTab('routine');
    } catch (e) { console.error(e); setScreen('main'); }
  }, [types]);

  // ── Add current routine ────────────────────────────────────────────────
  const handleAddCurrent = useCallback(async () => {
    try {
      await routineService.create({ period: 'am', routine_type: 'custom', name: 'My AM routine' });
      await routineService.create({ period: 'pm', routine_type: 'custom', name: 'My PM routine' });
      await store.init();
      store.setActiveTab('routine');
    } catch (e) { console.error(e); }
  }, []);

  // ── Add step to current routine ────────────────────────────────────────
  const handleAddStep = useCallback(async () => {
    if (!addStepCategory || !currentRoutine) return;
    Keyboard.dismiss();
    await store.addStep(currentRoutine.id, {
      category: addStepCategory,
      custom_product_name: addStepName || undefined,
    });
    setAddStepCategory('');
    setAddStepName('');
    setScreen('main');
  }, [addStepCategory, addStepName, currentRoutine]);

  // ══════════════════════════════════════════════════════════════════════
  // TYPE SELECTOR
  // ══════════════════════════════════════════════════════════════════════
  if (screen === 'types') {
    const rec = _getRecommended(user);
    return (
      <View style={[$.screen, { paddingTop: insets.top }]}>
        <SubHeader title="Choose a type" onBack={() => setScreen('main')} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={$.introText}>Pick a routine structure. JAY recommends one based on your skin profile.</Text>
          {Object.entries(types).map(([id, t]: [string, any]) => (
            <Pressable key={id} style={[$.typeCard, selectedType === id && $.typeCardSel]} onPress={() => setSelectedType(id)}>
              <View style={$.typeTop}>
                <Text style={$.typeName}>{t.name}</Text>
                {id === rec ? <Badge text="RECOMMENDED" black /> : <Badge text={`${t.max_steps} steps`} />}
              </View>
              <Text style={$.typeDesc}>{t.description}</Text>
              {t.am_template?.length > 0 ? (
                <View style={$.chipRow}>{t.am_template.slice(0, 5).map((c: string) => (
                  <View key={c} style={$.chip}><Text style={$.chipText}>{c.replace(/_/g, ' ')}</Text></View>
                ))}</View>
              ) : null}
            </Pressable>
          ))}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <Button label={`Continue with ${types[selectedType]?.name || selectedType}`} onPress={() => handleSelectType(selectedType)} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // GENERATING
  // ══════════════════════════════════════════════════════════════════════
  if (screen === 'generating') {
    return (
      <View style={[$.screen, { paddingTop: insets.top }]}>
        <SubHeader title="Building your routine" onBack={() => setScreen('main')} />
        <View style={$.centerFull}>
          <Spinner />
          <Text style={$.genTitle}>JAY is building your routine...</Text>
          <Text style={$.genSub}>Reading profile, searching products, checking conflicts</Text>
        </View>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // GENERATED RESULT
  // ══════════════════════════════════════════════════════════════════════
  if (screen === 'result' && store.generatedRoutine) {
    const gen = store.generatedRoutine;
    const amSteps = gen.steps.filter((s: any) => s.period === 'am');
    const pmSteps = gen.steps.filter((s: any) => s.period === 'pm');
    const groups = amSteps.length > 0 || pmSteps.length > 0
      ? [{ label: `Morning — ${amSteps.length} steps`, steps: amSteps }, { label: `Night — ${pmSteps.length} steps`, steps: pmSteps }].filter(g => g.steps.length > 0)
      : [{ label: `Routine — ${gen.steps.length} steps`, steps: gen.steps }];

    return (
      <View style={[$.screen, { paddingTop: insets.top }]}>
        <SubHeader title="JAY's recommendation" onBack={() => setScreen('main')} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={$.genHeader}>
            <View style={$.jayAv}><Text style={$.jayJ}>J</Text></View>
            <View><Text style={$.genMsg}>Built for your {user.skinType || 'unique'} skin</Text><Text style={$.genMsgSub}>Targets {user.primaryConcerns.slice(0, 2).map(c => c.replace('_', ' ')).join(' + ') || 'your goals'}</Text></View>
          </View>
          <View style={$.metaRow}>
            <MetaCard value={`₹${Math.round(gen.total_monthly_cost)}`} label="MONTHLY COST" />
            <MetaCard value={`${gen.steps.length}`} label="TOTAL STEPS" />
            <MetaCard value={`${gen.conflicts_checked.length}`} label="CONFLICTS" />
          </View>
          {groups.map((g) => (
            <View key={g.label}>
              <View style={$.secLabel}><View style={$.dot} /><Text style={$.secLabelText}>{g.label}</Text></View>
              {g.steps.map((step: any, i: number) => (
                <Animated.View key={i} entering={FadeInUp.duration(200).delay(i * 50)} style={$.step}>
                  <View style={$.stepNum}><Text style={$.stepNumText}>{i + 1}</Text></View>
                  <View style={$.stepBody}>
                    <Text style={$.stepTitle}>{_fmt(step.category)}</Text>
                    <Text style={$.stepProduct}>{step.product_brand ? `${step.product_brand} — ` : ''}{step.product_name || 'Custom product'}{step.product_price ? ` · ₹${step.product_price}` : ''}</Text>
                    {step.why_this_product ? <Text style={$.whyTag}>{step.why_this_product}</Text> : null}
                    {step.wait_time_seconds ? <View style={$.waitPill}><Text style={$.waitText}>Wait {Math.round(step.wait_time_seconds / 60)} min</Text></View> : null}
                  </View>
                  {step.frequency && step.frequency !== 'daily' ? <Text style={$.freqBadge}>{step.frequency_days?.join(' ') || step.frequency}</Text> : null}
                </Animated.View>
              ))}
            </View>
          ))}
          <View style={$.genActions}>
            <Button label="Save this routine" onPress={handleSaveGenerated} />
            <Button label="Regenerate" variant="outline" onPress={() => handleBuildWithJay()} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // ADD STEP
  // ══════════════════════════════════════════════════════════════════════
  if (screen === 'addStep') {
    const categories = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'treatment', 'exfoliant', 'eye_cream', 'face_oil', 'essence', 'oil_cleanser', 'spot_treatment', 'sleeping_mask', 'lip_balm'];
    return (
      <View style={[$.screen, { paddingTop: insets.top }]}>
        <SubHeader title="Add a step" onBack={() => setScreen('main')} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Text style={$.inputLabel}>Category</Text>
          <View style={$.chipRow}>
            {categories.map((c) => (
              <Pressable key={c} style={[$.chip, addStepCategory === c && $.chipSel]} onPress={() => setAddStepCategory(c)}>
                <Text style={[$.chipText, addStepCategory === c && $.chipTextSel]}>{_fmt(c)}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={$.inputLabel}>Product name (optional)</Text>
          <TextInput style={$.textInput} placeholder="e.g. CeraVe Foaming Cleanser" placeholderTextColor="#CCC" value={addStepName} onChangeText={setAddStepName} />
          <Button label="Add step" onPress={handleAddStep} disabled={!addStepCategory} />
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // MAIN SCREEN
  // ══════════════════════════════════════════════════════════════════════
  return (
    <View style={[$.screen, { paddingTop: insets.top }]}>
      <View style={$.header}>
        <View style={$.headerMain}>
          <Pressable onPress={() => router.back()} style={$.backBtn}><Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg></Pressable>
          <Text style={$.headerTitle}>My Routine</Text>
        </View>
        <View style={$.tabBar}>
          {(['today', 'routine', 'stats'] as const).map((t) => (
            <Pressable key={t} style={[$.tab, store.activeTab === t && $.tabActive]} onPress={() => store.setActiveTab(t)}>
              <Text style={[$.tabText, store.activeTab === t && $.tabTextActive]}>
                {t === 'today' ? 'Today' : t === 'routine' ? 'My routine' : 'Stats'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Loading */}
      {store.isLoading ? (
        <View style={$.centerFull}><ActivityIndicator color="#000" /><Text style={$.loadText}>Loading...</Text></View>
      ) : null}

      {/* ── TODAY TAB ───────────────────────────────────────────────── */}
      {!store.isLoading && store.activeTab === 'today' && !hasRoutine && (
        <ScrollView contentContainerStyle={$.emptyWrap} showsVerticalScrollIndicator={false}>
          <View style={$.emptyIcon}><Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round"><Circle cx={12} cy={12} r={10} /><Polyline points="12 6 12 12 16 14" /></Svg></View>
          <Text style={$.emptyTitle}>No routine yet</Text>
          <Text style={$.emptyDesc}>Build your first skincare routine — JAY can create one for you based on your skin profile.</Text>
          <OptCard icon="bolt" black title="Build with JAY" sub="AI creates a personalized routine from your profile" onPress={() => handleBuildWithJay()} />
          <OptCard icon="pencil" title="Add current routine" sub="Log what you already use" onPress={handleAddCurrent} />
          <OptCard icon="grid" title="Choose a template" sub="Essential, Complete, Glass Skin, or Anti-Acne" onPress={() => setScreen('types')} />
        </ScrollView>
      )}

      {!store.isLoading && store.activeTab === 'today' && hasRoutine && (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />} contentContainerStyle={{ paddingBottom: 20 }}>
          <PeriodToggle value={store.activePeriod} onChange={store.setActivePeriod} />

          {store.streak.current_streak > 0 ? (
            <View style={$.streakBar}><Text style={$.streakNum}>{store.streak.current_streak}</Text><View><Text style={$.streakTitle}>{store.streak.current_streak} day streak</Text><Text style={$.streakSub}>Keep it going!</Text></View></View>
          ) : null}

          {todayStatus ? (
            <View style={$.ringWrap}>
              <Svg width={100} height={100} viewBox="0 0 100 100">
                <Circle cx={50} cy={50} r={42} fill="none" stroke="#F5F5F5" strokeWidth={5} />
                <Circle cx={50} cy={50} r={42} fill="none" stroke="#000" strokeWidth={5}
                  strokeDasharray={264} strokeDashoffset={264 - (264 * todayStatus.completion_percentage / 100)}
                  strokeLinecap="round" transform="rotate(-90 50 50)" />
              </Svg>
              <View style={$.ringLabel}><Text style={$.ringPct}>{todayStatus.completed_steps}/{todayStatus.total_steps}</Text><Text style={$.ringSub}>STEPS</Text></View>
            </View>
          ) : null}

          {currentRoutine && currentRoutine.steps.length > 0 ? currentRoutine.steps.map((step) => {
            const ss = todayStatus?.steps.find(s => s.step_id === step.id);
            const done = ss?.completed ?? false;
            const skipped = ss?.skipped ?? false;
            return (
              <Pressable key={step.id} style={$.step} onPress={() => !done && !skipped && store.completeStep(step.id)}>
                <View style={[$.check, done && $.checkDone, skipped && $.checkSkip]}>
                  {done ? <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><Polyline points="20 6 9 17 4 12" /></Svg> : null}
                </View>
                <View style={$.stepBody}>
                  <Text style={[$.stepTitle, (done || skipped) && { opacity: 0.5 }]}>{_fmt(step.category)}</Text>
                  <Text style={$.stepProduct}>{_productDisplay(step)}</Text>
                  {step.instruction ? <Text style={$.stepInst}>{step.instruction}</Text> : null}
                  {step.wait_time_seconds ? <View style={$.waitPill}><Text style={$.waitText}>Wait {Math.round(step.wait_time_seconds / 60)} min</Text></View> : null}
                </View>
                {done && ss?.completed_at ? <Text style={[$.freqBadge, { color: '#000' }]}>{new Date(ss.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  : step.frequency !== 'daily' ? <Text style={$.freqBadge}>{step.frequency.replace(/_/g, ' ')}</Text> : null}
              </Pressable>
            );
          }) : currentRoutine ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 30 }}>
              <Text style={$.emptyTitle}>No steps yet</Text>
              <Text style={[$.emptyDesc, { marginBottom: 16 }]}>Add steps to your {store.activePeriod.toUpperCase()} routine</Text>
              <Button label="Add a step" onPress={() => setScreen('addStep')} />
              <View style={{ height: 8 }} />
              <Button label="Build with JAY instead" variant="outline" onPress={() => handleBuildWithJay()} />
            </View>
          ) : null}

          {todayStatus && todayStatus.remaining_steps > 0 ? (
            <View style={{ paddingHorizontal: 20, marginTop: 12 }}><Button label="Complete all remaining" variant="outline" onPress={store.completeAllSteps} /></View>
          ) : null}
        </ScrollView>
      )}

      {/* ── MY ROUTINE TAB ──────────────────────────────────────────── */}
      {!store.isLoading && store.activeTab === 'routine' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <PeriodToggle value={store.activePeriod} onChange={store.setActivePeriod} />
          {currentRoutine ? (
            <>
              <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={$.secLabelText}>{currentRoutine.routine_type.replace(/_/g, ' ').toUpperCase()} — {currentRoutine.steps.length} STEPS</Text>
                {currentRoutine.total_monthly_cost ? <Text style={{ fontSize: 13, fontWeight: '700', fontFamily: 'Outfit-Bold' }}>₹{currentRoutine.total_monthly_cost}/mo</Text> : null}
              </View>
              {currentRoutine.steps.map((step, i) => (
                <View key={step.id} style={$.step}>
                  <View style={$.stepNum}><Text style={$.stepNumText}>{i + 1}</Text></View>
                  <View style={$.stepBody}>
                    <Text style={$.stepTitle}>{_fmt(step.category)}</Text>
                    <Text style={$.stepProduct}>{_productDisplay(step)}{step.product_price ? ` · ₹${step.product_price}` : ''}</Text>
                    {step.notes || step.why_this_product ? <Text style={$.whyTag}>{step.why_this_product || step.notes}</Text> : null}
                    {step.instruction ? <Text style={$.stepInst}>{step.instruction}</Text> : null}
                  </View>
                  {step.frequency !== 'daily' ? <Text style={$.freqBadge}>{step.frequency_days?.join(' ') || step.frequency.replace(/_/g, ' ')}</Text> : null}
                </View>
              ))}
              {/* Add step button */}
              <Pressable style={$.addStepBtn} onPress={() => setScreen('addStep')}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>
                <Text style={$.addStepText}>Add a step</Text>
              </Pressable>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={$.loadText}>No {store.activePeriod.toUpperCase()} routine</Text>
              <View style={{ marginTop: 16, gap: 8, width: '80%' }}>
                <Button label="Build with JAY" onPress={() => handleBuildWithJay()} />
                <Button label="Choose a template" variant="outline" onPress={() => setScreen('types')} />
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── STATS TAB ───────────────────────────────────────────────── */}
      {!store.isLoading && store.activeTab === 'stats' && <StatsTab />}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={$.subHeader}>
      <Pressable onPress={onBack} style={$.backBtn}><Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg></Pressable>
      <Text style={$.subHeaderTitle}>{title}</Text>
    </View>
  );
}

function PeriodToggle({ value, onChange }: { value: string; onChange: (p: 'am' | 'pm') => void }) {
  return (
    <View style={$.periodToggle}>
      <Pressable style={[$.periodBtn, value === 'am' && $.periodBtnAct]} onPress={() => onChange('am')}><Text style={[$.periodText, value === 'am' && $.periodTextAct]}>Morning</Text></Pressable>
      <Pressable style={[$.periodBtn, value === 'pm' && $.periodBtnAct]} onPress={() => onChange('pm')}><Text style={[$.periodText, value === 'pm' && $.periodTextAct]}>Night</Text></Pressable>
    </View>
  );
}

function OptCard({ icon, black, title, sub, onPress }: { icon: string; black?: boolean; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable style={$.optCard} onPress={onPress}>
      <View style={[$.optIcon, black && { backgroundColor: '#000' }]}>
        {icon === 'bolt' ? <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={black ? '#fff' : '#666'} strokeWidth="1.5" strokeLinecap="round"><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>
          : icon === 'pencil' ? <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round"><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>
          : <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round"><Rect x={3} y={3} width={7} height={7} /><Rect x={14} y={3} width={7} height={7} /><Rect x={3} y={14} width={7} height={7} /><Rect x={14} y={14} width={7} height={7} /></Svg>}
      </View>
      <View style={{ flex: 1 }}><Text style={$.optTitle}>{title}</Text><Text style={$.optSub}>{sub}</Text></View>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5"><Path d="M9 18l6-6-6-6" /></Svg>
    </Pressable>
  );
}

function Badge({ text, black }: { text: string; black?: boolean }) {
  return <View style={[$.badge, black && $.badgeBlack]}><Text style={[$.badgeText, black && { color: '#fff' }]}>{text}</Text></View>;
}

function MetaCard({ value, label }: { value: string; label: string }) {
  return <View style={$.metaItem}><Text style={$.metaVal}>{value}</Text><Text style={$.metaLabel}>{label}</Text></View>;
}

function Spinner() {
  const rot = useSharedValue(0);
  useEffect(() => { rot.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false); }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return <Animated.View style={[$.spinner, style]} />;
}

function StatsTab() {
  const store = useRoutineStore();
  useEffect(() => { store.loadStats(30); store.loadCost(); }, []);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={$.statsHero}><Text style={$.statsNum}>{store.streak.current_streak}</Text><Text style={$.statsLabel}>DAY STREAK</Text></View>
      {store.stats ? (
        <View style={$.statGrid}>
          <View style={$.statCard}><Text style={$.statVal}>{store.stats.adherence_percentage}%</Text><Text style={$.statLbl}>ADHERENCE</Text></View>
          <View style={$.statCard}><Text style={$.statVal}>{store.stats.current_streak}</Text><Text style={$.statLbl}>CURRENT STREAK</Text></View>
          <View style={$.statCard}><Text style={$.statVal}>{store.stats.longest_streak}</Text><Text style={$.statLbl}>LONGEST STREAK</Text></View>
          <View style={$.statCard}><Text style={$.statVal}>{store.stats.skipped_count}</Text><Text style={$.statLbl}>SKIPPED</Text></View>
        </View>
      ) : <ActivityIndicator color="#000" style={{ marginTop: 24 }} />}
      {store.costData ? (
        <View style={$.costRow}><Text style={{ fontSize: 14, fontWeight: '700', fontFamily: 'Outfit-Bold' }}>Total monthly</Text><Text style={{ fontSize: 18, fontWeight: '700', fontFamily: 'Outfit-Bold' }}>₹{store.costData.total_monthly_cost}</Text></View>
      ) : null}
    </ScrollView>
  );
}

function _productDisplay(step: any): string {
  if (step.product_brand && step.product_name) return `${step.product_brand} — ${step.product_name}`;
  if (step.product_name) return step.product_name;
  if (step.custom_product_name) return step.custom_product_name;
  return 'No product assigned';
}

function _fmt(cat: string): string {
  const m: Record<string, string> = { cleanser: 'Cleanser', oil_cleanser: 'Oil cleanser', toner: 'Toner', essence: 'Essence', serum: 'Serum', treatment: 'Treatment', eye_cream: 'Eye cream', spot_treatment: 'Spot treatment', exfoliant: 'Exfoliant', moisturizer: 'Moisturizer', face_oil: 'Face oil', sleeping_mask: 'Sleeping mask', sunscreen: 'Sunscreen SPF 50', lip_balm: 'Lip balm' };
  return m[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function _getRecommended(user: any): string {
  if (user.primaryConcerns?.includes('acne')) return 'anti_acne';
  return 'complete';
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const $ = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  centerFull: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  loadText: { fontSize: 13, color: '#999', fontFamily: 'Outfit' },

  header: { borderBottomWidth: HW, borderBottomColor: '#E5E5E5' },
  headerMain: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  headerTitle: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3, fontFamily: 'Outfit-SemiBold' },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#000' },
  tabText: { fontSize: 12, fontWeight: '500', color: '#CCC', fontFamily: 'Outfit-Medium' },
  tabTextActive: { color: '#000', fontWeight: '600', fontFamily: 'Outfit-SemiBold' },

  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: HW, borderBottomColor: '#E5E5E5' },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  subHeaderTitle: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },

  periodToggle: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 16, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 3 },
  periodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  periodBtnAct: { backgroundColor: '#000' },
  periodText: { fontSize: 13, fontWeight: '500', color: '#999', fontFamily: 'Outfit-Medium' },
  periodTextAct: { color: '#fff' },

  streakBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 12, padding: 12, paddingHorizontal: 16, backgroundColor: '#F5F5F5', borderRadius: 12 },
  streakNum: { fontSize: 22, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  streakTitle: { fontSize: 12, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  streakSub: { fontSize: 11, color: '#999', fontFamily: 'Outfit' },

  ringWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8, marginBottom: 16 },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  ringPct: { fontSize: 28, fontWeight: '700', letterSpacing: -1, fontFamily: 'Outfit-Bold' },
  ringSub: { fontSize: 10, color: '#999', fontWeight: '500', textTransform: 'uppercase' as const, letterSpacing: 1.5, fontFamily: 'Outfit-Medium' },

  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: HW, borderBottomColor: '#F5F5F5' },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkDone: { backgroundColor: '#000', borderColor: '#000' },
  checkSkip: { backgroundColor: '#F5F5F5' },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNumText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  stepProduct: { fontSize: 12, color: '#666', fontFamily: 'Outfit', marginTop: 2 },
  stepInst: { fontSize: 11, color: '#999', fontFamily: 'Outfit', marginTop: 3, lineHeight: 16 },
  waitPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: '#F5F5F5', borderRadius: 100, alignSelf: 'flex-start' as const },
  waitText: { fontSize: 10, color: '#999', fontWeight: '500', fontFamily: 'Outfit-Medium' },
  freqBadge: { fontSize: 9, fontWeight: '600', color: '#CCC', textTransform: 'uppercase' as const, letterSpacing: 1, fontFamily: 'Outfit-SemiBold', position: 'absolute' as const, right: 20, top: 16 },
  whyTag: { fontSize: 10, color: '#999', fontStyle: 'italic' as const, marginTop: 4, lineHeight: 14, fontFamily: 'Outfit' },

  addStepBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 12, paddingVertical: 12, borderWidth: 1, borderStyle: 'dashed' as any, borderColor: '#E5E5E5', borderRadius: 12 },
  addStepText: { fontSize: 13, fontWeight: '500', color: '#999', fontFamily: 'Outfit-Medium' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 30 },
  emptyIcon: { width: 72, height: 72, backgroundColor: '#F5F5F5', borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'Outfit-SemiBold', marginBottom: 8, textAlign: 'center' as const },
  emptyDesc: { fontSize: 13, color: '#999', fontFamily: 'Outfit', lineHeight: 20, textAlign: 'center' as const, marginBottom: 32, maxWidth: 260 },
  optCard: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: HW, borderColor: '#E5E5E5', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, marginBottom: 10 },
  optIcon: { width: 42, height: 42, backgroundColor: '#F5F5F5', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  optSub: { fontSize: 11, color: '#999', fontFamily: 'Outfit', marginTop: 2, lineHeight: 16 },

  // Types
  introText: { fontSize: 13, color: '#999', fontFamily: 'Outfit', lineHeight: 20, paddingHorizontal: 20, paddingVertical: 12 },
  typeCard: { borderWidth: HW, borderColor: '#E5E5E5', borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 10 },
  typeCardSel: { borderWidth: 1.5, borderColor: '#000' },
  typeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeName: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  typeDesc: { fontSize: 12, color: '#999', fontFamily: 'Outfit', lineHeight: 17, marginTop: 6 },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#F5F5F5' },
  badgeBlack: { backgroundColor: '#000' },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 1, color: '#999', fontFamily: 'Outfit-Bold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#F5F5F5' },
  chipSel: { backgroundColor: '#000' },
  chipText: { fontSize: 10, fontWeight: '500', color: '#666', fontFamily: 'Outfit-Medium' },
  chipTextSel: { color: '#fff' },

  // Generating
  spinner: { width: 56, height: 56, borderWidth: 2.5, borderColor: '#F5F5F5', borderTopColor: '#000', borderRadius: 28, marginBottom: 24 },
  genTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Outfit-SemiBold', textAlign: 'center' as const },
  genSub: { fontSize: 13, color: '#999', fontFamily: 'Outfit', textAlign: 'center' as const, lineHeight: 20 },

  // Generated result
  genHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  jayAv: { width: 36, height: 36, backgroundColor: '#000', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  jayJ: { color: '#fff', fontSize: 14, fontWeight: '800' },
  genMsg: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  genMsgSub: { fontSize: 12, color: '#999', fontFamily: 'Outfit', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 16 },
  metaItem: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10, alignItems: 'center' },
  metaVal: { fontSize: 18, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  metaLabel: { fontSize: 9, color: '#999', textTransform: 'uppercase' as const, letterSpacing: 1.5, fontFamily: 'Outfit-SemiBold', marginTop: 2 },
  genActions: { paddingHorizontal: 20, gap: 8, marginTop: 16 },
  secLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 8, borderTopWidth: HW, borderTopColor: '#E5E5E5', marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#000' },
  secLabelText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: 2, fontFamily: 'Outfit-SemiBold', color: '#999' },

  // Stats
  statsHero: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  statsNum: { fontSize: 52, fontWeight: '700', letterSpacing: -2, fontFamily: 'Outfit-Bold' },
  statsLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: 2, color: '#999', fontFamily: 'Outfit-SemiBold', marginTop: 4 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginTop: 16 },
  statCard: { width: '47%', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14 },
  statVal: { fontSize: 28, fontWeight: '700', letterSpacing: -1, fontFamily: 'Outfit-Bold' },
  statLbl: { fontSize: 10, color: '#999', textTransform: 'uppercase' as const, letterSpacing: 1.5, fontFamily: 'Outfit-SemiBold', marginTop: 2 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, marginTop: 16, borderTopWidth: 1.5, borderTopColor: '#000' },

  // Add step
  inputLabel: { fontSize: 13, color: '#555', fontFamily: 'Outfit-Medium', marginBottom: 4 },
  textInput: { borderWidth: HW, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: 'Outfit', color: '#000', backgroundColor: '#FAFAFA' },
});
