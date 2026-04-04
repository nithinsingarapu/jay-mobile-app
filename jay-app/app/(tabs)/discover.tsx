import React, { useEffect, useCallback, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgLib, { Path as SvgPath } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import { useDiscoverStore } from '../../stores/discoverStore';
import { useContentStore } from '../../stores/contentStore';

// Shared components
import SearchBar from '../../components/discover/SearchBar';
import DepartmentTabs from '../../components/discover/DepartmentTabs';
import ContentTabs from '../../components/discover/ContentTabs';

// Tab content
import ForYouTab from '../../components/discover/ForYouTab';
import ProductsTab from '../../components/discover/ProductsTab';
import LearnTab from '../../components/discover/LearnTab';

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const activeTab = useDiscoverStore((s) => s.activeTab);
  const department = useDiscoverStore((s) => s.department);
  const loadProducts = useDiscoverStore((s) => s.loadProducts);
  const loadBrands = useDiscoverStore((s) => s.loadBrands);
  const loadAllContent = useContentStore((s) => s.loadAllForDepartment);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
    loadBrands();
  }, []);

  useEffect(() => {
    loadAllContent(department);
  }, [department]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.systemBackground }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.systemBlue}
          />
        }
      >
        {/* Title with back button */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.replace('/(tabs)/' as any)} hitSlop={8} style={styles.backBtn}>
            <SvgLib width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.systemBlue} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <SvgPath d="M15 18l-6-6 6-6" />
            </SvgLib>
          </Pressable>
          <Text style={[styles.title, { color: colors.label }]}>Discover</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <SearchBar onPress={() => router.push('/(screens)/search' as any)} />
        </View>

        {/* Department tabs (global filter) */}
        <DepartmentTabs />

        {/* Content tabs (For You / Products / Learn) */}
        <ContentTabs />

        {/* Tab content */}
        {activeTab === 'forYou' && <ForYouTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'learn' && <LearnTab />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 4,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.37,
  },
  searchWrap: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
});
