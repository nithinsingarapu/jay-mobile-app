import React, { useEffect, useCallback, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { useDiscoverStore } from '../../stores/discoverStore';

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
  const loadProducts = useDiscoverStore((s) => s.loadProducts);
  const loadBrands = useDiscoverStore((s) => s.loadBrands);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
    loadBrands();
  }, []);

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
        {/* Title */}
        <Text style={[styles.title, { color: colors.label }]}>Discover</Text>

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
  title: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.37,
    paddingHorizontal: 20,
  },
  searchWrap: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
});
