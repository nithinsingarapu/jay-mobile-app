import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../lib/theme';
import { SPACE } from '../../constants/theme';
import RoutineTypeCard from './RoutineTypeCard';

interface CategoryRowProps {
  title: string;
  templates: any[];
  onTemplatePress: (id: string) => void;
  onSeeAll?: () => void;
}

export default function CategoryRow({
  title,
  templates,
  onTemplatePress,
  onSeeAll,
}: CategoryRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.label }]}>{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll} hitSlop={8}>
            <Text style={[styles.seeAll, { color: colors.systemBlue }]}>
              See All
            </Text>
          </Pressable>
        )}
      </View>

      {/* Horizontal list */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {templates.map((template) => (
          <RoutineTypeCard
            key={template.id}
            template={template}
            onPress={() => onTemplatePress(template.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACE.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    marginBottom: SPACE.md,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
  seeAll: {
    fontSize: 15,
    fontFamily: 'Outfit',
  },
  scrollContent: {
    paddingHorizontal: SPACE.lg,
    gap: 12,
  },
});
