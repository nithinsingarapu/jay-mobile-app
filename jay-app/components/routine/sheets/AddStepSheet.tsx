/**
 * AddStepSheet — Smart step builder with ambient JAY assistance.
 *
 * Flow:
 * 1. User picks category → products load + JAY auto-picks best product
 * 2. JAY's pick is highlighted with ✨ badge, all fields auto-filled
 * 3. User can pick a different product → all fields auto-update for that product
 * 4. All fields are editable — JAY's suggestions are defaults, not locks
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView, BottomSheetTextInput, BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../../lib/theme';
import { SPACE, RADIUS } from '../../../constants/theme';
import { routineService } from '../../../services/routine';
import type { SearchProduct } from '../../../types/routine';

// ── Constants ───────────────────────────────────────────────────────────

const CATEGORIES = [
  'cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen',
  'treatment', 'eye_cream', 'face_oil', 'exfoliant', 'mask',
  'essence', 'lip_balm', 'spot_treatment',
] as const;

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'every_other_day', label: 'Every other day' },
  { value: '2x_week', label: '2x / week' },
  { value: '3x_week', label: '3x / week' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as_needed', label: 'As needed' },
] as const;

type Category = (typeof CATEGORIES)[number];

function fmtCat(cat: string) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Props ───────────────────────────────────────────────────────────────

interface AddStepSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  routineId: string;
  routineContext?: string; // e.g. "Post Workout afternoon routine"
  onAdded: () => void;
}

// ═══════════════════════════════════════════════════════════════════════
export function AddStepSheet({ sheetRef, routineId, routineContext, onAdded }: AddStepSheetProps) {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ['92%'], []);

  // ── State ────────────────────────────────────────────────────────────
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected product (user's choice or JAY's pick)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [customProductName, setCustomProductName] = useState('');

  // JAY's recommendation
  const [jayPickId, setJayPickId] = useState<number | null>(null);
  const [jayReasoning, setJayReasoning] = useState('');
  const [jayLoading, setJayLoading] = useState(false);

  // Auto-filled fields (updated when product changes)
  const [instruction, setInstruction] = useState('');
  const [waitTime, setWaitTime] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // ── Category change → fetch products + JAY pick (parallel) ─────────
  useEffect(() => {
    if (!category) {
      setProducts([]);
      setJayPickId(null);
      setJayReasoning('');
      return;
    }

    let cancelled = false;
    setProductsLoading(true);
    setSelectedProductId(null);
    setCustomProductName('');
    setSearchQuery('');
    setJayPickId(null);
    setJayReasoning('');
    setInstruction('');
    setWaitTime('');
    setFrequency('daily');
    setNotes('');

    // Fetch products
    const fetchProducts = routineService.searchProducts(category)
      .then(res => { if (!cancelled) setProducts(res); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setProductsLoading(false); });

    // JAY picks best product (parallel)
    setJayLoading(true);
    const jayPick = routineService.assistPickProduct({
      category,
      routine_context: routineContext || `Adding ${fmtCat(category)} step`,
    }).then(res => {
      if (cancelled) return;
      if (res.product_id) {
        setJayPickId(res.product_id);
        setSelectedProductId(res.product_id);
        setJayReasoning(res.reasoning || '');
      }
    }).catch(() => {}).finally(() => { if (!cancelled) setJayLoading(false); });

    Promise.all([fetchProducts, jayPick]);

    return () => { cancelled = true; };
  }, [category]);

  // ── When selected product changes → auto-fill instruction + wait ───
  useEffect(() => {
    if (!category) return;
    const product = products.find(p => p.id === selectedProductId);
    const productName = product?.name || customProductName || fmtCat(category);

    if (!productName || productName === fmtCat(category)) return;

    let cancelled = false;
    routineService.assistSuggestInstruction({
      category,
      product_name: productName,
      session: 'morning',
    }).then(res => {
      if (cancelled) return;
      if (res.instruction) setInstruction(res.instruction);
      if (res.wait_time_seconds != null) setWaitTime(String(res.wait_time_seconds));
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [selectedProductId, category]);

  // ── Filtered products ──────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // ── Handlers ───────────────────────────────────────────────────────
  const selectProduct = useCallback((productId: number) => {
    setSelectedProductId(prev => prev === productId ? null : productId);
    setCustomProductName('');
  }, []);

  const handleAdd = useCallback(async () => {
    if (!category || submitting) return;
    setSubmitting(true);
    try {
      await routineService.addStep(routineId, {
        category,
        product_id: selectedProductId || undefined,
        custom_product_name: customProductName.trim() || undefined,
        instruction: instruction.trim() || undefined,
        frequency,
        wait_time_seconds: waitTime ? parseInt(waitTime, 10) : undefined,
        notes: notes.trim() || undefined,
      });
      onAdded();
      // Reset
      setCategory(null);
      setSelectedProductId(null);
      setCustomProductName('');
      setSearchQuery('');
      setInstruction('');
      setWaitTime('');
      setFrequency('daily');
      setNotes('');
      setJayPickId(null);
      setJayReasoning('');
    } catch {} finally {
      setSubmitting(false);
    }
  }, [category, selectedProductId, customProductName, instruction, frequency, waitTime, notes, routineId, submitting, onAdded]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} pressBehavior="close" />
    ), [],
  );

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[$.handle, { backgroundColor: colors.systemGray4 }]}
      backgroundStyle={{ backgroundColor: colors.secondarySystemBackground }}
    >
      <BottomSheetScrollView contentContainerStyle={$.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <Text style={[$.title, { color: colors.label }]}>Add Step</Text>

        {/* ── Category ───────────────────────────────────────────── */}
        <Text style={[$.label, { color: colors.secondaryLabel }]}>STEP TYPE</Text>
        <View style={[$.table, { backgroundColor: colors.tertiarySystemFill }]}>
          {CATEGORIES.map((cat, i) => {
            const active = category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  $.row,
                  i < CATEGORIES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
                  active && { backgroundColor: colors.systemBlue + '08' },
                ]}
              >
                <Text style={[$.rowText, { color: active ? colors.systemBlue : colors.label }]}>
                  {fmtCat(cat)}
                </Text>
                {active && (
                  <Svg width={18} height={18} viewBox="0 0 20 20">
                    <Path d="M4 10.5L8 14.5L16 5.5" stroke={colors.systemBlue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </Svg>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Product (shown after category selected) ─────────── */}
        {category && (
          <>
            <Text style={[$.label, { color: colors.secondaryLabel }]}>
              PRODUCT {jayLoading ? '· JAY is picking...' : jayPickId ? '· ✨ JAY\'s pick highlighted' : ''}
            </Text>

            {/* JAY's reasoning */}
            {jayReasoning ? (
              <View style={[$.reasonBox, { backgroundColor: colors.systemBlue + '06', borderColor: colors.systemBlue + '15' }]}>
                <Text style={[$.reasonText, { color: colors.secondaryLabel }]}>🤖 {jayReasoning}</Text>
              </View>
            ) : null}

            {/* Search */}
            <BottomSheetTextInput
              style={[$.input, { backgroundColor: colors.tertiarySystemFill, color: colors.label }]}
              placeholder="Search products..."
              placeholderTextColor={colors.placeholderText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Product list */}
            {productsLoading ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={colors.systemBlue} />
            ) : (
              <View style={[$.table, { backgroundColor: colors.tertiarySystemFill }]}>
                {filteredProducts.map((p, i) => {
                  const isSelected = selectedProductId === p.id;
                  const isJayPick = jayPickId === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => selectProduct(p.id)}
                      style={[
                        $.row, $.productRow,
                        i < filteredProducts.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
                        isSelected && { backgroundColor: colors.systemBlue + '08' },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[$.productBrand, { color: colors.secondaryLabel }]}>{p.brand}</Text>
                          {isJayPick && (
                            <View style={[$.jayBadge, { backgroundColor: colors.systemBlue + '15' }]}>
                              <Text style={[$.jayBadgeText, { color: colors.systemBlue }]}>✨ JAY's pick</Text>
                            </View>
                          )}
                        </View>
                        <Text numberOfLines={1} style={[$.productName, { color: isSelected ? colors.systemBlue : colors.label }]}>
                          {p.name}
                        </Text>
                        <Text style={[$.productPrice, { color: colors.tertiaryLabel }]}>
                          {p.price_inr ? `₹${p.price_inr}` : 'Price TBD'}
                          {p.rating ? ` · ★${p.rating}` : ''}
                        </Text>
                      </View>
                      {isSelected && (
                        <Svg width={18} height={18} viewBox="0 0 20 20">
                          <Path d="M4 10.5L8 14.5L16 5.5" stroke={colors.systemBlue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </Svg>
                      )}
                    </Pressable>
                  );
                })}
                {filteredProducts.length === 0 && !productsLoading && (
                  <Text style={[$.emptyText, { color: colors.tertiaryLabel }]}>No products found</Text>
                )}
              </View>
            )}

            {/* Custom product */}
            <BottomSheetTextInput
              style={[$.input, { backgroundColor: colors.tertiarySystemFill, color: colors.label, marginTop: SPACE.sm }]}
              placeholder="or enter custom product name"
              placeholderTextColor={colors.placeholderText}
              value={customProductName}
              onChangeText={t => { setCustomProductName(t); if (t.trim()) setSelectedProductId(null); }}
            />
          </>
        )}

        {/* ── How to Apply (auto-filled by JAY) ──────────────── */}
        {category && (
          <>
            <Text style={[$.label, { color: colors.secondaryLabel }]}>HOW TO APPLY</Text>
            <BottomSheetTextInput
              style={[$.input, $.textArea, { backgroundColor: colors.tertiarySystemFill, color: colors.label }]}
              placeholder="JAY will auto-fill this when you pick a product..."
              placeholderTextColor={colors.placeholderText}
              value={instruction}
              onChangeText={setInstruction}
              multiline
              textAlignVertical="top"
            />
          </>
        )}

        {/* ── Frequency ──────────────────────────────────────── */}
        {category && (
          <>
            <Text style={[$.label, { color: colors.secondaryLabel }]}>FREQUENCY</Text>
            <View style={[$.chipRow]}>
              {FREQUENCIES.map(f => {
                const active = frequency === f.value;
                return (
                  <Pressable
                    key={f.value}
                    onPress={() => setFrequency(f.value)}
                    style={[$.chip, { backgroundColor: active ? colors.systemBlue : colors.tertiarySystemFill }]}
                  >
                    <Text style={[$.chipText, { color: active ? '#FFF' : colors.label }]}>{f.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* ── Wait Time ──────────────────────────────────────── */}
        {category && (
          <>
            <Text style={[$.label, { color: colors.secondaryLabel }]}>WAIT TIME (SECONDS)</Text>
            <BottomSheetTextInput
              style={[$.input, { backgroundColor: colors.tertiarySystemFill, color: colors.label }]}
              placeholder="0"
              placeholderTextColor={colors.placeholderText}
              value={waitTime}
              onChangeText={setWaitTime}
              keyboardType="numeric"
            />
          </>
        )}

        {/* ── Notes ───────────────────────────────────────────── */}
        {category && (
          <>
            <Text style={[$.label, { color: colors.secondaryLabel }]}>NOTES (OPTIONAL)</Text>
            <BottomSheetTextInput
              style={[$.input, $.textArea, { backgroundColor: colors.tertiarySystemFill, color: colors.label }]}
              placeholder="Any notes for yourself..."
              placeholderTextColor={colors.placeholderText}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </>
        )}

        {/* ── Add Button ─────────────────────────────────────── */}
        <Pressable
          style={[$.addBtn, { backgroundColor: colors.systemBlue }, (!category || submitting) && { opacity: 0.4 }]}
          onPress={handleAdd}
          disabled={!category || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={$.addBtnText}>Add to Routine</Text>
          )}
        </Pressable>

        <View style={{ height: 30 }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ═══════════════════════════════════════════════════════════════════════
const $ = StyleSheet.create({
  handle: { width: 36, height: 5, borderRadius: 2.5 },
  content: { paddingHorizontal: SPACE.xl, paddingBottom: 40 },
  title: { fontSize: 22, fontFamily: 'Outfit-Bold', marginBottom: SPACE.lg, marginTop: SPACE.sm },
  label: {
    fontSize: 11, fontFamily: 'Outfit-SemiBold', letterSpacing: 0.5,
    textTransform: 'uppercase', marginTop: SPACE.lg, marginBottom: SPACE.sm,
  },
  table: { borderRadius: RADIUS.sm, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', minHeight: 44,
    paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md,
  },
  rowText: { flex: 1, fontSize: 15, fontFamily: 'Outfit' },
  input: {
    height: 44, borderRadius: RADIUS.sm, paddingHorizontal: SPACE.md,
    fontSize: 15, fontFamily: 'Outfit', marginBottom: SPACE.sm,
  },
  textArea: { minHeight: 70, paddingTop: SPACE.md, textAlignVertical: 'top' },
  productRow: { paddingVertical: 10 },
  productBrand: { fontSize: 11, fontFamily: 'Outfit' },
  productName: { fontSize: 15, fontFamily: 'Outfit-Medium', marginTop: 1 },
  productPrice: { fontSize: 12, fontFamily: 'Outfit', marginTop: 2 },
  jayBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  jayBadgeText: { fontSize: 9, fontFamily: 'Outfit-SemiBold' },
  reasonBox: {
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
    borderRadius: 8, borderWidth: 1, marginBottom: SPACE.sm,
  },
  reasonText: { fontSize: 12, fontFamily: 'Outfit', lineHeight: 17 },
  emptyText: { padding: 16, textAlign: 'center', fontSize: 13, fontFamily: 'Outfit' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACE.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  chipText: { fontSize: 13, fontFamily: 'Outfit-Medium' },
  addBtn: {
    height: 50, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: SPACE.xxl,
  },
  addBtnText: { color: '#FFF', fontSize: 17, fontFamily: 'Outfit-SemiBold' },
});
