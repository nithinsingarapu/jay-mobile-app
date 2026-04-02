/**
 * AddStepSheet — bottom sheet for adding a step to a routine.
 * Collects category, product (search or custom), frequency, wait time, and notes.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../lib/theme';
import { SPACE, RADIUS } from '../../../constants/theme';
import { routineService } from '../../../services/routine';
import type { SearchProduct } from '../../../types/routine';

// ── Constants ───────────────────────────────────────────────────────────

const CATEGORIES = [
  'cleanser',
  'toner',
  'serum',
  'moisturizer',
  'sunscreen',
  'treatment',
  'eye_cream',
  'face_oil',
  'exfoliant',
  'mask',
  'essence',
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
type Frequency = (typeof FREQUENCIES)[number]['value'];

// ── Types ───────────────────────────────────────────────────────────────

interface AddStepSheetProps {
  sheetRef: React.RefObject<BottomSheet | null>;
  routineId: string;
  onAdded: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatCategory(cat: string): string {
  return cat
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ───────────────────────────────────────────────────────────

export function AddStepSheet({ sheetRef, routineId, onAdded }: AddStepSheetProps) {
  const { colors } = useTheme();
  const snapPoints = useMemo(() => ['90%'], []);

  // State
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);
  const [customProductName, setCustomProductName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [waitTime, setWaitTime] = useState('');
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch products when category changes
  useEffect(() => {
    if (!selectedCategory) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setProductsLoading(true);
    setSelectedProduct(null);
    setCustomProductName('');
    setSearchQuery('');

    routineService
      .searchProducts(selectedCategory)
      .then((res) => {
        if (!cancelled) setProducts(res);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  // Filtered products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  const handleAdd = useCallback(async () => {
    if (!selectedCategory || submitting) return;
    setSubmitting(true);
    try {
      await routineService.addStep(routineId, {
        category: selectedCategory,
        product_id: selectedProduct?.id,
        custom_product_name: customProductName.trim() || undefined,
        frequency,
        wait_time_seconds: waitTime ? parseInt(waitTime, 10) : undefined,
        notes: notes.trim() || undefined,
      });
      onAdded();
      // Reset form
      setSelectedCategory(null);
      setSelectedProduct(null);
      setCustomProductName('');
      setSearchQuery('');
      setFrequency('daily');
      setWaitTime('');
      setNotes('');
    } catch {
      // Parent can handle errors via store / toast
    } finally {
      setSubmitting(false);
    }
  }, [selectedCategory, selectedProduct, customProductName, frequency, waitTime, notes, routineId, submitting, onAdded]);

  // Backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[s.handle, { backgroundColor: colors.systemGray4 }]}
      backgroundStyle={{ backgroundColor: colors.secondarySystemBackground }}
    >
      <BottomSheetScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={[s.title, { color: colors.label }]}>Add Step</Text>

        {/* ── Category ──────────────────────────────────────────────── */}
        <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>CATEGORY</Text>
        <View style={[s.groupedTable, { backgroundColor: colors.tertiarySystemBackground }]}>
          {CATEGORIES.map((cat, idx) => (
            <Pressable
              key={cat}
              style={[
                s.groupedRow,
                idx < CATEGORIES.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.separator,
                },
                selectedCategory === cat && { backgroundColor: colors.systemBlue + '14' },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  s.rowLabel,
                  { color: colors.label },
                  selectedCategory === cat && { color: colors.systemBlue },
                ]}
              >
                {formatCategory(cat)}
              </Text>
              {selectedCategory === cat && (
                <Ionicons name="checkmark" size={20} color={colors.systemBlue} />
              )}
            </Pressable>
          ))}
        </View>

        {/* ── Product ───────────────────────────────────────────────── */}
        {selectedCategory && (
          <>
            <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>PRODUCT</Text>

            <BottomSheetTextInput
              style={[
                s.input,
                {
                  backgroundColor: colors.tertiarySystemBackground,
                  color: colors.label,
                },
              ]}
              placeholder="Search products..."
              placeholderTextColor={colors.placeholderText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {productsLoading ? (
              <ActivityIndicator
                style={s.loader}
                color={colors.systemBlue}
              />
            ) : (
              <View style={[s.groupedTable, { backgroundColor: colors.tertiarySystemBackground }]}>
                {filteredProducts.map((product, idx) => {
                  const isSelected = selectedProduct?.id === product.id;
                  return (
                    <Pressable
                      key={product.id}
                      style={[
                        s.groupedRow,
                        s.productRow,
                        idx < filteredProducts.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.separator,
                        },
                        isSelected && { backgroundColor: colors.systemBlue + '14' },
                      ]}
                      onPress={() => {
                        setSelectedProduct(isSelected ? null : product);
                        setCustomProductName('');
                      }}
                    >
                      <View style={s.productInfo}>
                        <Text style={[s.productBrand, { color: colors.secondaryLabel }]}>
                          {product.brand}
                        </Text>
                        <Text
                          style={[
                            s.productName,
                            { color: colors.label },
                            isSelected && { color: colors.systemBlue },
                          ]}
                          numberOfLines={1}
                        >
                          {product.name}
                        </Text>
                        <Text style={[s.productPrice, { color: colors.secondaryLabel }]}>
                          {'\u20B9'}{product.price_inr}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={colors.systemBlue} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Custom product fallback */}
            <BottomSheetTextInput
              style={[
                s.input,
                {
                  backgroundColor: colors.tertiarySystemBackground,
                  color: colors.label,
                  marginTop: SPACE.md,
                },
              ]}
              placeholder="or add custom product name"
              placeholderTextColor={colors.placeholderText}
              value={customProductName}
              onChangeText={(text) => {
                setCustomProductName(text);
                if (text.trim()) setSelectedProduct(null);
              }}
            />
          </>
        )}

        {/* ── Frequency ─────────────────────────────────────────────── */}
        <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>FREQUENCY</Text>
        <View style={[s.groupedTable, { backgroundColor: colors.tertiarySystemBackground }]}>
          {FREQUENCIES.map((opt, idx) => (
            <Pressable
              key={opt.value}
              style={[
                s.groupedRow,
                idx < FREQUENCIES.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.separator,
                },
                frequency === opt.value && { backgroundColor: colors.systemBlue + '14' },
              ]}
              onPress={() => setFrequency(opt.value)}
            >
              <Text
                style={[
                  s.rowLabel,
                  { color: colors.label },
                  frequency === opt.value && { color: colors.systemBlue },
                ]}
              >
                {opt.label}
              </Text>
              {frequency === opt.value && (
                <Ionicons name="checkmark" size={20} color={colors.systemBlue} />
              )}
            </Pressable>
          ))}
        </View>

        {/* ── Wait time ─────────────────────────────────────────────── */}
        <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>WAIT TIME</Text>
        <BottomSheetTextInput
          style={[
            s.input,
            {
              backgroundColor: colors.tertiarySystemBackground,
              color: colors.label,
            },
          ]}
          placeholder="Seconds (optional)"
          placeholderTextColor={colors.placeholderText}
          value={waitTime}
          onChangeText={setWaitTime}
          keyboardType="numeric"
        />

        {/* ── Notes ─────────────────────────────────────────────────── */}
        <Text style={[s.sectionHeader, { color: colors.secondaryLabel }]}>NOTES</Text>
        <BottomSheetTextInput
          style={[
            s.input,
            s.textArea,
            {
              backgroundColor: colors.tertiarySystemBackground,
              color: colors.label,
            },
          ]}
          placeholder="Optional notes..."
          placeholderTextColor={colors.placeholderText}
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />

        {/* ── Add button ────────────────────────────────────────────── */}
        <Pressable
          style={[
            s.addBtn,
            { backgroundColor: colors.systemBlue },
            (!selectedCategory || submitting) && { opacity: 0.5 },
          ]}
          onPress={handleAdd}
          disabled={!selectedCategory || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={s.addBtnText}>Add to Routine</Text>
          )}
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  content: {
    paddingHorizontal: SPACE.xl,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    marginBottom: SPACE.lg,
    marginTop: SPACE.sm,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Outfit',
    fontWeight: '400',
    letterSpacing: 0.07,
    textTransform: 'uppercase',
    marginTop: SPACE.lg,
    marginBottom: SPACE.sm,
    paddingLeft: SPACE.lg,
  },
  groupedTable: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  input: {
    height: 44,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.md,
    fontSize: 15,
    fontFamily: 'Outfit',
    marginBottom: SPACE.md,
  },
  textArea: {
    minHeight: 80,
    paddingTop: SPACE.md,
    textAlignVertical: 'top',
  },
  loader: {
    marginVertical: SPACE.lg,
  },
  productRow: {
    paddingVertical: SPACE.md,
  },
  productInfo: {
    flex: 1,
  },
  productBrand: {
    fontSize: 12,
    fontFamily: 'Outfit',
  },
  productName: {
    fontSize: 15,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 13,
    fontFamily: 'Outfit',
    marginTop: 2,
  },
  addBtn: {
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.xxl,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
    fontWeight: '600',
  },
});
