import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import type { SmartCollection } from '../../types/discover';
import SectionHeader from './SectionHeader';

interface SmartCollectionScrollProps {
  collections: SmartCollection[];
  active: string | null;
  onSelect: (id: string | null) => void;
}

export default function SmartCollectionScroll({
  collections,
  active,
  onSelect,
}: SmartCollectionScrollProps) {
  const { colors } = useTheme();

  return (
    <>
      <SectionHeader title="Smart Collections" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {collections.map((collection) => {
          const isActive = active === collection.id;
          return (
            <Pressable
              key={collection.id}
              onPress={() => onSelect(isActive ? null : collection.id)}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive
                    ? `${colors.systemBlue}26`
                    : colors.secondarySystemBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isActive ? colors.systemBlue : colors.label,
                  },
                ]}
              >
                {collection.emoji} {collection.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
});
