import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, TextInput, Keyboard, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Polyline, Polygon, Rect } from 'react-native-svg';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { useRoutineStore } from '../../stores/routineStore';
import { useUserStore } from '../../stores/userStore';
import { useTheme } from '../../lib/theme';
import { routineService, type SearchProduct } from '../../services/routine';

const HW = StyleSheet.hairlineWidth;

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const store = useRoutineStore();
  const { user } = useUserStore();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [screen, setScreen] = useState<'main' | 'types' | 'generating' | 'result' | 'addStep'>('main');
  const [selectedType, setSelectedType] = useState('complete');
  const [types, setTypes] = useState<Record<string, any>>({});
  const [addStepCategory, setAddStepCategory] = useState('');
  const [addStepName, setAddStepName] = useState('');
  const [addStepProducts, setAddStepProducts] = useState<SearchProduct[]>([]);
  const [addStepProductsLoading, setAddStepProductsLoading] = useState(false);
  const [addStepSelectedProduct, setAddStepSelectedProduct] = useState<SearchProduct | null>(null);
  const [addStepSearch, setAddStepSearch] = useState('');
  const [skipModalStep, setSkipModalStep] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<{ message: string; severity: string }[]>([]);

  useEffect(() => {
    store.init();
    routineService.getTypes().then(setTypes).catch(() => {});
  }, []);

  // Auto-fetch products when category changes in Add Step
  useEffect(() => {
    if (!addStepCategory) { setAddStepProducts([]); return; }
    setAddStepProductsLoading(true);
    setAddStepSelectedProduct(null);
    setAddStepSearch('');
    routineService.searchProducts(addStepCategory)
      .then(setAddStepProducts)
      .catch(() => setAddStepProducts([]))
      .finally(() => setAddStepProductsLoading(false));
  }, [addStepCategory]);

  // Load conflicts for current routine
  useEffect(() => {
    if (!currentRoutine?.steps?.length) { setConflicts([]); return; }
    routineService.validate({
      steps: currentRoutine.steps.map(s => ({ category: s.category, product_name: s.product_name || s.custom_product_name })),
      period: store.activePeriod,
    }).then(r => setConflicts(r.conflicts || [])).catch(() => setConflicts([]));
  }, [currentRoutine?.id, store.activePeriod]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await store.refresh();
    setRefreshing(false);
  }, []);

  const [showActions, setShowActions] = useState(false);
  const hasRoutine = store.amRoutine || store.pmRoutine;
  const currentRoutine = store.activePeriod === 'am' ? store.amRoutine : store.pmRoutine;
  const todayStatus = store.activePeriod === 'am' ? store.amTodayStatus : store.pmTodayStatus;

  // ── Reset routine (deactivate both, show empty state) ──────────────
  const handleResetRoutine = useCallback(async () => {
    try {
      if (store.amRoutine) await routineService.deactivate(store.amRoutine.id);
      if (store.pmRoutine) await routineService.deactivate(store.pmRoutine.id);
      await store.init();
      setShowActions(false);
    } catch (e) { console.error(e); }
  }, [store.amRoutine, store.pmRoutine]);

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
    const stepData: Record<string, unknown> = { category: addStepCategory };
    if (addStepSelectedProduct) {
      stepData.product_id = addStepSelectedProduct.id;
    } else if (addStepName) {
      stepData.custom_product_name = addStepName;
    }
    await store.addStep(currentRoutine.id, stepData);
    setAddStepCategory('');
    setAddStepName('');
    setAddStepSelectedProduct(null);
    setAddStepSearch('');
    setScreen('main');
  }, [addStepCategory, addStepName, addStepSelectedProduct, currentRoutine]);

  // ══════════════════════════════════════════════════════════════════════
  // TYPE SELECTOR
  // ══════════════════════════════════════════════════════════════════════
  if (screen === 'types') {
    const rec = _getRecommended(user);
    return (
      <View style={[$.screen, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <SubHeader title="Choose a type" onBack={() => setScreen('main')} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={[$.introText, { color: colors.secondaryLabel }]}>Pick a routine structure. JAY recommends one based on your skin profile.</Text>
          {Object.entries(types).map(([id, t]: [string, any]) => (
            <Pressable key={id} style={[$.typeCard, { borderColor: colors.separator }, selectedType === id && { borderWidth: 1.5, borderColor: colors.systemBlue }]} onPress={() => setSelectedType(id)}>
              <View style={$.typeTop}>
                <Text style={[$.typeName, { color: colors.label }]}>{t.name}</Text>
                {id === rec ? <Badge text="RECOMMENDED" black /> : <Badge text={`${t.max_steps} steps`} />}
              </View>
              <Text style={[$.typeDesc, { color: colors.secondaryLabel }]}>{t.description}</Text>
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
      <View style={[$.screen, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <SubHeader title="Building your routine" onBack={() => setScreen('main')} />
        <View style={$.centerFull}>
          <Spinner />
          <Text style={[$.genTitle, { color: colors.label }]}>JAY is building your routine...</Text>
          <Text style={[$.genSub, { color: colors.secondaryLabel }]}>Reading profile, searching products, checking conflicts</Text>
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
      <View style={[$.screen, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <SubHeader title="JAY's recommendation" onBack={() => setScreen('main')} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={$.genHeader}>
            <View style={[$.jayAv, { backgroundColor: colors.systemIndigo }]}><Text style={$.jayJ}>J</Text></View>
            <View><Text style={[$.genMsg, { color: colors.label }]}>Built for your {user.skinType || 'unique'} skin</Text><Text style={[$.genMsgSub, { color: colors.secondaryLabel }]}>Targets {user.primaryConcerns.slice(0, 2).map(c => c.replace('_', ' ')).join(' + ') || 'your goals'}</Text></View>
          </View>
          <View style={$.metaRow}>
            <MetaCard value={`₹${Math.round(gen.total_monthly_cost)}`} label="MONTHLY COST" />
            <MetaCard value={`${gen.steps.length}`} label="TOTAL STEPS" />
            <MetaCard value={`${gen.conflicts_checked.length}`} label="CONFLICTS" />
          </View>
          {groups.map((g) => (
            <View key={g.label}>
              <View style={[$.secLabel, { borderTopColor: colors.separator }]}><View style={[$.dot, { backgroundColor: colors.systemBlue }]} /><Text style={[$.secLabelText, { color: colors.secondaryLabel }]}>{g.label}</Text></View>
              {g.steps.map((step: any, i: number) => (
                <Animated.View key={i} entering={FadeInUp.duration(200).delay(i * 50)} style={[$.step, { borderBottomColor: colors.separator }]}>
                  <View style={[$.stepNum, { backgroundColor: colors.systemBlue }]}><Text style={$.stepNumText}>{i + 1}</Text></View>
                  <View style={$.stepBody}>
                    <Text style={[$.stepTitle, { color: colors.label }]}>{_fmt(step.category)}</Text>
                    <Text style={[$.stepProduct, { color: colors.secondaryLabel }]}>{step.product_brand ? `${step.product_brand} — ` : ''}{step.product_name || 'Custom product'}{step.product_price ? ` · ₹${step.product_price}` : ''}</Text>
                    {step.why_this_product ? <Text style={[$.whyTag, { color: colors.tertiaryLabel }]}>{step.why_this_product}</Text> : null}
                    {step.wait_time_seconds ? <View style={[$.waitPill, { backgroundColor: colors.tertiarySystemFill }]}><Text style={[$.waitText, { color: colors.secondaryLabel }]}>Wait {Math.round(step.wait_time_seconds / 60)} min</Text></View> : null}
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
    const filteredProducts = addStepSearch
      ? addStepProducts.filter(p => p.name.toLowerCase().includes(addStepSearch.toLowerCase()) || p.brand.toLowerCase().includes(addStepSearch.toLowerCase()))
      : addStepProducts;
    return (
      <View style={[$.screen, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
        <SubHeader title="Add a step" onBack={() => { setScreen('main'); setAddStepSelectedProduct(null); setAddStepSearch(''); }} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={[$.inputLabel, { color: colors.secondaryLabel }]}>Category</Text>
          <View style={$.chipRow}>
            {categories.map((c) => (
              <Pressable key={c} style={[$.chip, { backgroundColor: colors.tertiarySystemFill }, addStepCategory === c && { backgroundColor: colors.systemBlue }]} onPress={() => setAddStepCategory(c)}>
                <Text style={[$.chipText, { color: colors.label }, addStepCategory === c && { color: '#fff' }]}>{_fmt(c)}</Text>
              </Pressable>
            ))}
          </View>

          {addStepCategory ? (
            <>
              <Text style={[$.inputLabel, { color: colors.secondaryLabel }]}>Pick a product</Text>
              <TextInput
                style={[$.textInput, { color: colors.label, borderColor: colors.separator, backgroundColor: colors.tertiarySystemFill }]}
                placeholder={`Search ${_fmt(addStepCategory).toLowerCase()}s...`}
                placeholderTextColor={colors.placeholderText}
                value={addStepSearch}
                onChangeText={setAddStepSearch}
              />
              {addStepProductsLoading ? (
                <ActivityIndicator color={colors.label} style={{ marginVertical: 16 }} />
              ) : filteredProducts.length > 0 ? (
                <View style={{ gap: 6 }}>
                  {filteredProducts.map((product) => {
                    const selected = addStepSelectedProduct?.id === product.id;
                    return (
                      <Pressable key={product.id} onPress={() => { setAddStepSelectedProduct(selected ? null : product); setAddStepName(''); }}
                        style={[$.productCard, { backgroundColor: colors.secondarySystemBackground, borderColor: colors.separator }, selected && { borderColor: colors.systemBlue, borderWidth: 1.5 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[$.productBrand, { color: colors.secondaryLabel }]}>{product.brand}</Text>
                          <Text style={[$.productName, { color: colors.label }]}>{product.name}</Text>
                          <Text style={[$.productPrice, { color: colors.tertiaryLabel }]}>₹{product.price_inr}</Text>
                        </View>
                        {selected ? <View style={[$.productCheck, { backgroundColor: colors.systemBlue }]}><Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><Polyline points="20 6 9 17 4 12" /></Svg></View> : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={[$.noResults, { color: colors.tertiaryLabel }]}>No products found — enter a name below</Text>
              )}
              <View style={[$.orDivider, { borderBottomColor: colors.separator }]}>
                <Text style={[$.orText, { color: colors.tertiaryLabel, backgroundColor: colors.systemBackground }]}>or enter manually</Text>
              </View>
            </>
          ) : null}

          <Text style={[$.inputLabel, { color: colors.secondaryLabel }]}>Product name (optional)</Text>
          <TextInput
            style={[$.textInput, { color: colors.label, borderColor: colors.separator, backgroundColor: colors.tertiarySystemFill }, addStepSelectedProduct && { opacity: 0.4 }]}
            placeholder="e.g. CeraVe Foaming Cleanser" placeholderTextColor={colors.placeholderText}
            value={addStepSelectedProduct ? `${addStepSelectedProduct.brand} — ${addStepSelectedProduct.name}` : addStepName}
            onChangeText={(t) => { setAddStepName(t); setAddStepSelectedProduct(null); }}
            editable={!addStepSelectedProduct}
          />
          <Button label="Add step" onPress={handleAddStep} disabled={!addStepCategory} />
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // MAIN SCREEN
  // ══════════════════════════════════════════════════════════════════════
  return (
    <View style={[$.screen, { paddingTop: insets.top, backgroundColor: colors.systemBackground }]}>
      <View style={[$.header, { borderBottomColor: colors.separator }]}>
        <View style={$.headerMain}>
          <Pressable onPress={() => router.back()} style={$.backBtn}><Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg></Pressable>
          <Text style={[$.headerTitle, { color: colors.label }]}>My Routine</Text>
          <View style={{ flex: 1 }} />
          {hasRoutine && (
            <Pressable onPress={() => setShowActions(!showActions)} style={[$.headerActionBtn, { backgroundColor: colors.quaternarySystemFill }]}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="2" strokeLinecap="round">
                <Circle cx="12" cy="5" r="1" /><Circle cx="12" cy="12" r="1" /><Circle cx="12" cy="19" r="1" />
              </Svg>
            </Pressable>
          )}
        </View>
        <View style={$.tabBar}>
          {(['today', 'routine', 'stats'] as const).map((t) => (
            <Pressable key={t} style={[$.tab, store.activeTab === t && { borderBottomColor: colors.systemBlue }]} onPress={() => store.setActiveTab(t)}>
              <Text style={[$.tabText, { color: colors.secondaryLabel }, store.activeTab === t && { color: colors.systemBlue, fontWeight: '600' }]}>
                {t === 'today' ? 'Today' : t === 'routine' ? 'My routine' : 'Stats'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Actions dropdown ──────────────────────────────────── */}
      {showActions && (
        <Pressable style={$.actionsOverlay} onPress={() => setShowActions(false)}>
          <View style={[$.actionsMenu, { backgroundColor: colors.secondarySystemBackground, borderColor: colors.separator }]}>
            <Pressable style={$.actionItem} onPress={() => { setShowActions(false); handleBuildWithJay(); }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.systemBlue} strokeWidth="1.5" strokeLinecap="round"><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>
              <View style={{ flex: 1 }}><Text style={[$.actionTitle, { color: colors.label }]}>Rebuild with JAY</Text><Text style={[$.actionSub, { color: colors.secondaryLabel }]}>AI creates a new personalized routine</Text></View>
            </Pressable>
            <Pressable style={$.actionItem} onPress={() => { setShowActions(false); handleAddCurrent(); }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.secondaryLabel} strokeWidth="1.5" strokeLinecap="round"><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>
              <View style={{ flex: 1 }}><Text style={[$.actionTitle, { color: colors.label }]}>Start fresh (manual)</Text><Text style={[$.actionSub, { color: colors.secondaryLabel }]}>Log what you already use</Text></View>
            </Pressable>
            <Pressable style={$.actionItem} onPress={() => { setShowActions(false); setScreen('types'); }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.secondaryLabel} strokeWidth="1.5" strokeLinecap="round"><Rect x={3} y={3} width={7} height={7} /><Rect x={14} y={3} width={7} height={7} /><Rect x={3} y={14} width={7} height={7} /><Rect x={14} y={14} width={7} height={7} /></Svg>
              <View style={{ flex: 1 }}><Text style={[$.actionTitle, { color: colors.label }]}>Choose a template</Text><Text style={[$.actionSub, { color: colors.secondaryLabel }]}>Essential, Complete, Glass Skin, Anti-Acne</Text></View>
            </Pressable>
            <View style={[$.actionDivider, { backgroundColor: colors.separator }]} />
            <Pressable style={$.actionItem} onPress={() => { setShowActions(false); handleResetRoutine(); }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.systemRed} strokeWidth="1.5" strokeLinecap="round"><Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></Svg>
              <Text style={[$.actionTitle, { color: colors.systemRed }]}>Delete current routine</Text>
            </Pressable>
          </View>
        </Pressable>
      )}

      {/* Loading */}
      {store.isLoading ? (
        <View style={$.centerFull}><ActivityIndicator color={colors.label} /><Text style={[$.loadText, { color: colors.secondaryLabel }]}>Loading...</Text></View>
      ) : null}

      {/* ── TODAY TAB ───────────────────────────────────────────────── */}
      {!store.isLoading && store.activeTab === 'today' && !hasRoutine && (
        <ScrollView contentContainerStyle={$.emptyWrap} showsVerticalScrollIndicator={false}>
          <View style={[$.emptyIcon, { backgroundColor: colors.tertiarySystemFill }]}><Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={colors.secondaryLabel} strokeWidth="1.5" strokeLinecap="round"><Circle cx={12} cy={12} r={10} /><Polyline points="12 6 12 12 16 14" /></Svg></View>
          <Text style={[$.emptyTitle, { color: colors.label }]}>No routine yet</Text>
          <Text style={[$.emptyDesc, { color: colors.secondaryLabel }]}>Build your first skincare routine — JAY can create one for you based on your skin profile.</Text>
          <OptCard icon="bolt" black title="Build with JAY" sub="AI creates a personalized routine from your profile" onPress={() => handleBuildWithJay()} />
          <OptCard icon="pencil" title="Add current routine" sub="Log what you already use" onPress={handleAddCurrent} />
          <OptCard icon="grid" title="Choose a template" sub="Essential, Complete, Glass Skin, or Anti-Acne" onPress={() => setScreen('types')} />
        </ScrollView>
      )}

      {!store.isLoading && store.activeTab === 'today' && hasRoutine && (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.label} />} contentContainerStyle={{ paddingBottom: 20 }}>
          <PeriodToggle value={store.activePeriod} onChange={store.setActivePeriod} />

          {store.streak.current_streak > 0 ? (
            <View style={[$.streakBar, { backgroundColor: colors.secondarySystemBackground }]}><Text style={[$.streakNum, { color: colors.label }]}>{store.streak.current_streak}</Text><View><Text style={[$.streakTitle, { color: colors.label }]}>{store.streak.current_streak} day streak</Text><Text style={[$.streakSub, { color: colors.secondaryLabel }]}>Keep it going!</Text></View></View>
          ) : null}

          {todayStatus ? (
            <View style={$.ringWrap}>
              <Svg width={100} height={100} viewBox="0 0 100 100">
                <Circle cx={50} cy={50} r={42} fill="none" stroke={colors.tertiarySystemFill} strokeWidth={5} />
                <Circle cx={50} cy={50} r={42} fill="none" stroke={colors.systemBlue} strokeWidth={5}
                  strokeDasharray={264} strokeDashoffset={264 - (264 * todayStatus.completion_percentage / 100)}
                  strokeLinecap="round" transform="rotate(-90 50 50)" />
              </Svg>
              <View style={$.ringLabel}><Text style={[$.ringPct, { color: colors.label }]}>{todayStatus.completed_steps}/{todayStatus.total_steps}</Text><Text style={[$.ringSub, { color: colors.secondaryLabel }]}>STEPS</Text></View>
            </View>
          ) : null}
          {(() => { const totalSec = currentRoutine?.steps.reduce((sum, s) => sum + (s.wait_time_seconds || 0), 0) || 0; const mins = Math.ceil(totalSec / 60); return mins > 0 ? <Text style={[$.routineTime, { color: colors.tertiaryLabel }]}>~{mins} min with wait times</Text> : null; })()}

          {currentRoutine && currentRoutine.steps.length > 0 ? currentRoutine.steps.map((step) => {
            const ss = todayStatus?.steps.find(s => s.step_id === step.id);
            const done = ss?.completed ?? false;
            const skipped = ss?.skipped ?? false;
            return (
              <Pressable key={step.id} style={[$.step, { borderBottomColor: colors.separator }]}
                onPress={() => !done && !skipped && store.completeStep(step.id)}
                onLongPress={() => !done && !skipped && setSkipModalStep(step.id)}>
                <View style={[$.check, { borderColor: colors.separator }, done && { backgroundColor: colors.systemBlue, borderColor: colors.systemBlue }, skipped && { backgroundColor: colors.systemOrange + '30', borderColor: colors.systemOrange }]}>
                  {done ? <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><Polyline points="20 6 9 17 4 12" /></Svg> : null}
                </View>
                <View style={$.stepBody}>
                  <Text style={[$.stepTitle, { color: colors.label }, (done || skipped) && { opacity: 0.5 }]}>{_fmt(step.category)}</Text>
                  <Text style={[$.stepProduct, { color: colors.secondaryLabel }]}>{_productDisplay(step)}</Text>
                  {step.instruction ? <Text style={[$.stepInst, { color: colors.secondaryLabel }]}>{step.instruction}</Text> : null}
                  {step.wait_time_seconds ? <View style={[$.waitPill, { backgroundColor: colors.tertiarySystemFill }]}><Text style={[$.waitText, { color: colors.secondaryLabel }]}>Wait {Math.round(step.wait_time_seconds / 60)} min</Text></View> : null}
                </View>
                {done && ss?.completed_at ? <Text style={[$.freqBadge, { color: colors.secondaryLabel }]}>{new Date(ss.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  : step.frequency !== 'daily' ? <Text style={$.freqBadge}>{step.frequency.replace(/_/g, ' ')}</Text> : null}
              </Pressable>
            );
          }) : currentRoutine ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 30 }}>
              <Text style={[$.emptyTitle, { color: colors.label }]}>No steps yet</Text>
              <Text style={[$.emptyDesc, { marginBottom: 16, color: colors.secondaryLabel }]}>Add steps to your {store.activePeriod.toUpperCase()} routine</Text>
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
                <Text style={[$.secLabelText, { color: colors.secondaryLabel }]}>{currentRoutine.routine_type.replace(/_/g, ' ').toUpperCase()} — {currentRoutine.steps.length} STEPS</Text>
                {currentRoutine.total_monthly_cost ? <Text style={{ fontSize: 13, fontWeight: '700', fontFamily: 'Outfit-Bold', color: colors.label }}>₹{currentRoutine.total_monthly_cost}/mo</Text> : null}
              </View>
              {/* Conflict warnings */}
              {conflicts.length > 0 && (
                <View style={[$.conflictBanner, { backgroundColor: colors.systemOrange + '15' }]}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.systemOrange} strokeWidth="2" strokeLinecap="round"><Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><Path d="M12 9v4M12 17h.01" /></Svg>
                  <View style={{ flex: 1 }}>
                    <Text style={[$.conflictTitle, { color: colors.systemOrange }]}>Ingredient conflicts detected</Text>
                    {conflicts.map((c, i) => <Text key={i} style={[$.conflictText, { color: colors.secondaryLabel }]}>• {c.message}</Text>)}
                  </View>
                </View>
              )}
              {currentRoutine.steps.map((step, i) => (
                <View key={step.id} style={[$.step, { borderBottomColor: colors.separator }]}>
                  <View style={[$.stepNum, { backgroundColor: colors.systemBlue }]}><Text style={$.stepNumText}>{i + 1}</Text></View>
                  <View style={$.stepBody}>
                    <Text style={[$.stepTitle, { color: colors.label }]}>{_fmt(step.category)}</Text>
                    <Text style={[$.stepProduct, { color: colors.secondaryLabel }]}>{_productDisplay(step)}{step.product_price ? ` · ₹${step.product_price}` : ''}</Text>
                    {step.notes || step.why_this_product ? <Text style={[$.whyTag, { color: colors.tertiaryLabel }]}>{step.why_this_product || step.notes}</Text> : null}
                    {step.instruction ? <Text style={[$.stepInst, { color: colors.secondaryLabel }]}>{step.instruction}</Text> : null}
                  </View>
                  <Pressable hitSlop={8} onPress={() => Alert.alert('Remove step', `Remove ${_fmt(step.category)} from your routine?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => store.removeStep(currentRoutine.id, step.id) },
                  ])}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.tertiaryLabel} strokeWidth="1.5" strokeLinecap="round"><Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></Svg>
                  </Pressable>
                </View>
              ))}
              {/* Add step button */}
              <Pressable style={[$.addStepBtn, { borderColor: colors.separator }]} onPress={() => setScreen('addStep')}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.secondaryLabel} strokeWidth="1.8" strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>
                <Text style={[$.addStepText, { color: colors.secondaryLabel }]}>Add a step</Text>
              </Pressable>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={[$.loadText, { color: colors.secondaryLabel }]}>No {store.activePeriod.toUpperCase()} routine</Text>
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

      {/* ── Skip step modal ────────────────────────────────────────── */}
      <Modal visible={!!skipModalStep} transparent animationType="fade" onRequestClose={() => setSkipModalStep(null)}>
        <Pressable style={$.skipOverlay} onPress={() => setSkipModalStep(null)}>
          <View style={[$.skipSheet, { backgroundColor: colors.secondarySystemBackground }]}>
            <Text style={[$.skipTitle, { color: colors.label }]}>What would you like to do?</Text>
            <Pressable style={[$.skipOption, { backgroundColor: colors.systemBlue + '12' }]} onPress={() => { if (skipModalStep) store.completeStep(skipModalStep); setSkipModalStep(null); }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.systemBlue} strokeWidth="2" strokeLinecap="round"><Polyline points="20 6 9 17 4 12" /></Svg>
              <Text style={[$.skipOptionText, { color: colors.systemBlue }]}>Mark as complete</Text>
            </Pressable>
            {[['Ran out of product', 'ran_out'], ['Skin irritated', 'skin_irritated'], ['No time today', 'no_time']].map(([label, reason]) => (
              <Pressable key={reason} style={[$.skipOption, { backgroundColor: colors.systemOrange + '10' }]} onPress={() => { if (skipModalStep) store.completeStep(skipModalStep, true, reason); setSkipModalStep(null); }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.systemOrange} strokeWidth="2" strokeLinecap="round"><Path d="M18 6L6 18M6 6l12 12" /></Svg>
                <Text style={[$.skipOptionText, { color: colors.systemOrange }]}>Skip — {label}</Text>
              </Pressable>
            ))}
            <Pressable style={[$.skipCancel, { backgroundColor: colors.tertiarySystemFill }]} onPress={() => setSkipModalStep(null)}>
              <Text style={[$.skipCancelText, { color: colors.secondaryLabel }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[$.subHeader, { borderBottomColor: colors.separator }]}>
      <Pressable onPress={onBack} style={$.backBtn}><Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.label} strokeWidth="1.8" strokeLinecap="round"><Path d="M15 18l-6-6 6-6" /></Svg></Pressable>
      <Text style={[$.subHeaderTitle, { color: colors.label }]}>{title}</Text>
    </View>
  );
}

function PeriodToggle({ value, onChange }: { value: string; onChange: (p: 'am' | 'pm') => void }) {
  const { colors } = useTheme();
  return (
    <View style={[$.periodToggle, { backgroundColor: colors.tertiarySystemFill }]}>
      <Pressable style={[$.periodBtn, value === 'am' && { backgroundColor: colors.systemBlue }]} onPress={() => onChange('am')}><Text style={[$.periodText, { color: colors.secondaryLabel }, value === 'am' && { color: '#fff' }]}>Morning</Text></Pressable>
      <Pressable style={[$.periodBtn, value === 'pm' && { backgroundColor: colors.systemBlue }]} onPress={() => onChange('pm')}><Text style={[$.periodText, { color: colors.secondaryLabel }, value === 'pm' && { color: '#fff' }]}>Night</Text></Pressable>
    </View>
  );
}

function OptCard({ icon, black, title, sub, onPress }: { icon: string; black?: boolean; title: string; sub: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable style={[$.optCard, { borderColor: colors.separator }]} onPress={onPress}>
      <View style={[$.optIcon, { backgroundColor: colors.tertiarySystemFill }, black && { backgroundColor: colors.systemBlue }]}>
        {icon === 'bolt' ? <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={black ? '#fff' : colors.secondaryLabel} strokeWidth="1.5" strokeLinecap="round"><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>
          : icon === 'pencil' ? <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.secondaryLabel} strokeWidth="1.5" strokeLinecap="round"><Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></Svg>
          : <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.secondaryLabel} strokeWidth="1.5" strokeLinecap="round"><Rect x={3} y={3} width={7} height={7} /><Rect x={14} y={3} width={7} height={7} /><Rect x={3} y={14} width={7} height={7} /><Rect x={14} y={14} width={7} height={7} /></Svg>}
      </View>
      <View style={{ flex: 1 }}><Text style={[$.optTitle, { color: colors.label }]}>{title}</Text><Text style={[$.optSub, { color: colors.secondaryLabel }]}>{sub}</Text></View>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.tertiaryLabel} strokeWidth="1.5"><Path d="M9 18l6-6-6-6" /></Svg>
    </Pressable>
  );
}

function Badge({ text, black }: { text: string; black?: boolean }) {
  const { colors } = useTheme();
  return <View style={[$.badge, { backgroundColor: colors.quaternarySystemFill }, black && { backgroundColor: colors.systemBlue }]}><Text style={[$.badgeText, { color: colors.secondaryLabel }, black && { color: '#fff' }]}>{text}</Text></View>;
}

function MetaCard({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return <View style={[$.metaItem, { backgroundColor: colors.secondarySystemBackground }]}><Text style={[$.metaVal, { color: colors.label }]}>{value}</Text><Text style={[$.metaLabel, { color: colors.secondaryLabel }]}>{label}</Text></View>;
}

function Spinner() {
  const rot = useSharedValue(0);
  useEffect(() => { rot.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false); }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return <Animated.View style={[$.spinner, style]} />;
}

function StatsTab() {
  const store = useRoutineStore();
  const { colors } = useTheme();
  useEffect(() => { store.loadStats(30); store.loadCost(); }, []);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={$.statsHero}><Text style={[$.statsNum, { color: colors.label }]}>{store.streak.current_streak}</Text><Text style={[$.statsLabel, { color: colors.secondaryLabel }]}>DAY STREAK</Text></View>
      {store.stats ? (
        <View style={$.statGrid}>
          <View style={[$.statCard, { backgroundColor: colors.secondarySystemBackground }]}><Text style={[$.statVal, { color: colors.label }]}>{store.stats.adherence_percentage}%</Text><Text style={[$.statLbl, { color: colors.secondaryLabel }]}>ADHERENCE</Text></View>
          <View style={[$.statCard, { backgroundColor: colors.secondarySystemBackground }]}><Text style={[$.statVal, { color: colors.label }]}>{store.stats.current_streak}</Text><Text style={[$.statLbl, { color: colors.secondaryLabel }]}>CURRENT STREAK</Text></View>
          <View style={[$.statCard, { backgroundColor: colors.secondarySystemBackground }]}><Text style={[$.statVal, { color: colors.label }]}>{store.stats.longest_streak}</Text><Text style={[$.statLbl, { color: colors.secondaryLabel }]}>LONGEST STREAK</Text></View>
          <View style={[$.statCard, { backgroundColor: colors.secondarySystemBackground }]}><Text style={[$.statVal, { color: colors.label }]}>{store.stats.skipped_count}</Text><Text style={[$.statLbl, { color: colors.secondaryLabel }]}>SKIPPED</Text></View>
        </View>
      ) : <ActivityIndicator color={colors.label} style={{ marginTop: 24 }} />}
      {store.costData ? (
        <View style={[$.costRow, { borderTopColor: colors.separator }]}><Text style={{ fontSize: 14, fontWeight: '700', fontFamily: 'Outfit-Bold', color: colors.label }}>Total monthly</Text><Text style={{ fontSize: 18, fontWeight: '700', fontFamily: 'Outfit-Bold', color: colors.label }}>₹{store.costData.total_monthly_cost}</Text></View>
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
  screen: { flex: 1 },
  centerFull: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  loadText: { fontSize: 13, color: '#8E8E93', fontFamily: 'Outfit' },

  header: { borderBottomWidth: HW },
  headerMain: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  headerTitle: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3, fontFamily: 'Outfit-SemiBold' },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#000' },
  tabText: { fontSize: 12, fontWeight: '500', color: '#636366', fontFamily: 'Outfit-Medium' },
  tabTextActive: { color: '#8E8E93', fontWeight: '600', fontFamily: 'Outfit-SemiBold' },

  headerActionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionsOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 50 },
  actionsMenu: { position: 'absolute', top: 100, right: 16, left: 16, borderRadius: 14, borderWidth: HW, padding: 6, zIndex: 51, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
  actionTitle: { fontSize: 14, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  actionSub: { fontSize: 11, fontFamily: 'Outfit', marginTop: 1, lineHeight: 15 },
  actionDivider: { height: HW, marginHorizontal: 14, marginVertical: 2 },

  subHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: HW, borderBottomColor: '#E5E5E5' },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  subHeaderTitle: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },

  periodToggle: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 16, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 3 },
  periodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  periodBtnAct: { backgroundColor: '#000' },
  periodText: { fontSize: 13, fontWeight: '500', color: '#8E8E93', fontFamily: 'Outfit-Medium' },
  periodTextAct: { color: '#fff' },

  streakBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 12, padding: 12, paddingHorizontal: 16, backgroundColor: '#F5F5F5', borderRadius: 12 },
  streakNum: { fontSize: 22, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  streakTitle: { fontSize: 12, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  streakSub: { fontSize: 11, color: '#8E8E93', fontFamily: 'Outfit' },

  ringWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8, marginBottom: 16 },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  ringPct: { fontSize: 28, fontWeight: '700', letterSpacing: -1, fontFamily: 'Outfit-Bold' },
  ringSub: { fontSize: 10, color: '#8E8E93', fontWeight: '500', textTransform: 'uppercase' as const, letterSpacing: 1.5, fontFamily: 'Outfit-Medium' },

  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: HW, borderBottomColor: '#F5F5F5' },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkDone: { backgroundColor: '#000', borderColor: '#000' },
  checkSkip: { backgroundColor: '#F5F5F5' },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNumText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  stepProduct: { fontSize: 12, color: '#8E8E93', fontFamily: 'Outfit', marginTop: 2 },
  stepInst: { fontSize: 11, color: '#8E8E93', fontFamily: 'Outfit', marginTop: 3, lineHeight: 16 },
  waitPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: '#F5F5F5', borderRadius: 100, alignSelf: 'flex-start' as const },
  waitText: { fontSize: 10, color: '#8E8E93', fontWeight: '500', fontFamily: 'Outfit-Medium' },
  freqBadge: { fontSize: 9, fontWeight: '600', color: '#636366', textTransform: 'uppercase' as const, letterSpacing: 1, fontFamily: 'Outfit-SemiBold', position: 'absolute' as const, right: 20, top: 16 },
  whyTag: { fontSize: 10, color: '#8E8E93', fontStyle: 'italic' as const, marginTop: 4, lineHeight: 14, fontFamily: 'Outfit' },

  addStepBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 12, paddingVertical: 12, borderWidth: 1, borderStyle: 'dashed' as any, borderColor: '#E5E5E5', borderRadius: 12 },
  addStepText: { fontSize: 13, fontWeight: '500', color: '#8E8E93', fontFamily: 'Outfit-Medium' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 30 },
  emptyIcon: { width: 72, height: 72, backgroundColor: '#F5F5F5', borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'Outfit-SemiBold', marginBottom: 8, textAlign: 'center' as const },
  emptyDesc: { fontSize: 13, color: '#8E8E93', fontFamily: 'Outfit', lineHeight: 20, textAlign: 'center' as const, marginBottom: 32, maxWidth: 260 },
  optCard: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: HW, borderColor: '#E5E5E5', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, marginBottom: 10 },
  optIcon: { width: 42, height: 42, backgroundColor: '#F5F5F5', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optTitle: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  optSub: { fontSize: 11, color: '#8E8E93', fontFamily: 'Outfit', marginTop: 2, lineHeight: 16 },

  // Types
  introText: { fontSize: 13, color: '#8E8E93', fontFamily: 'Outfit', lineHeight: 20, paddingHorizontal: 20, paddingVertical: 12 },
  typeCard: { borderWidth: HW, borderColor: '#E5E5E5', borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 10 },
  typeCardSel: { borderWidth: 1.5, borderColor: '#000' },
  typeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeName: { fontSize: 15, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  typeDesc: { fontSize: 12, color: '#8E8E93', fontFamily: 'Outfit', lineHeight: 17, marginTop: 6 },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#F5F5F5' },
  badgeBlack: { backgroundColor: '#000' },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 1, color: '#8E8E93', fontFamily: 'Outfit-Bold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, backgroundColor: '#F5F5F5' },
  chipSel: { backgroundColor: '#000' },
  chipText: { fontSize: 10, fontWeight: '500', color: '#8E8E93', fontFamily: 'Outfit-Medium' },
  chipTextSel: { color: '#fff' },

  // Generating
  spinner: { width: 56, height: 56, borderWidth: 2.5, borderColor: 'rgba(120,120,128,0.12)', borderTopColor: '#007AFF', borderRadius: 28, marginBottom: 24 },
  genTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Outfit-SemiBold', textAlign: 'center' as const },
  genSub: { fontSize: 13, color: '#8E8E93', fontFamily: 'Outfit', textAlign: 'center' as const, lineHeight: 20 },

  // Generated result
  genHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  jayAv: { width: 36, height: 36, backgroundColor: '#000', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  jayJ: { color: '#fff', fontSize: 14, fontWeight: '800' },
  genMsg: { fontSize: 14, fontWeight: '600', fontFamily: 'Outfit-SemiBold' },
  genMsgSub: { fontSize: 12, color: '#8E8E93', fontFamily: 'Outfit', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 16 },
  metaItem: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10, alignItems: 'center' },
  metaVal: { fontSize: 18, fontWeight: '700', fontFamily: 'Outfit-Bold' },
  metaLabel: { fontSize: 9, color: '#8E8E93', textTransform: 'uppercase' as const, letterSpacing: 1.5, fontFamily: 'Outfit-SemiBold', marginTop: 2 },
  genActions: { paddingHorizontal: 20, gap: 8, marginTop: 16 },
  secLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 8, borderTopWidth: HW, borderTopColor: '#E5E5E5', marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#000' },
  secLabelText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: 2, fontFamily: 'Outfit-SemiBold', color: '#8E8E93' },

  // Stats
  statsHero: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  statsNum: { fontSize: 52, fontWeight: '700', letterSpacing: -2, fontFamily: 'Outfit-Bold' },
  statsLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: 2, color: '#8E8E93', fontFamily: 'Outfit-SemiBold', marginTop: 4 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 20, marginTop: 16 },
  statCard: { width: '47%', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14 },
  statVal: { fontSize: 28, fontWeight: '700', letterSpacing: -1, fontFamily: 'Outfit-Bold' },
  statLbl: { fontSize: 10, color: '#8E8E93', textTransform: 'uppercase' as const, letterSpacing: 1.5, fontFamily: 'Outfit-SemiBold', marginTop: 2 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, marginTop: 16, borderTopWidth: 1.5, borderTopColor: '#000' },

  // Routine time
  routineTime: { fontSize: 12, fontFamily: 'Outfit', textAlign: 'center' as const, marginBottom: 12 },

  // Conflict banner
  conflictBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 20, marginBottom: 12, padding: 14, borderRadius: 12 },
  conflictTitle: { fontSize: 13, fontWeight: '600', fontFamily: 'Outfit-SemiBold', marginBottom: 4 },
  conflictText: { fontSize: 12, fontFamily: 'Outfit', lineHeight: 18 },

  // Skip modal
  skipOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  skipSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, gap: 8 },
  skipTitle: { fontSize: 17, fontWeight: '600', fontFamily: 'Outfit-SemiBold', textAlign: 'center' as const, marginBottom: 8 },
  skipOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 },
  skipOptionText: { fontSize: 15, fontWeight: '500', fontFamily: 'Outfit-Medium' },
  skipCancel: { alignItems: 'center', paddingVertical: 14, borderRadius: 12, marginTop: 4 },
  skipCancelText: { fontSize: 15, fontWeight: '500', fontFamily: 'Outfit-Medium' },

  // Product search in Add Step
  productCard: { flexDirection: 'row', alignItems: 'center', borderWidth: HW, borderRadius: 12, padding: 14, gap: 12 },
  productBrand: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: 1, fontFamily: 'Outfit-SemiBold' },
  productName: { fontSize: 14, fontWeight: '500', fontFamily: 'Outfit-Medium', marginTop: 2 },
  productPrice: { fontSize: 12, fontFamily: 'Outfit', marginTop: 3 },
  productCheck: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  noResults: { fontSize: 13, fontFamily: 'Outfit', textAlign: 'center' as const, paddingVertical: 16 },
  orDivider: { borderBottomWidth: HW, alignItems: 'center' as const, marginVertical: 4 },
  orText: { fontSize: 11, fontFamily: 'Outfit-Medium', paddingHorizontal: 12, position: 'relative' as const, top: 7 },

  // Add step
  inputLabel: { fontSize: 13, color: '#8E8E93', fontFamily: 'Outfit-Medium', marginBottom: 4 },
  textInput: { borderWidth: HW, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: 'Outfit', color: '#8E8E93', backgroundColor: '#FAFAFA' },
});
