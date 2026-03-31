import { create } from 'zustand';
import { mockDiaryEntries } from '../constants/mockData';
import type { DiaryEntry } from '../types';

interface DiaryState {
  entries: DiaryEntry[];
  addEntry: (entry: DiaryEntry) => void;
  getEntryByDate: (date: string) => DiaryEntry | undefined;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: mockDiaryEntries,
  addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),
  getEntryByDate: (date) => get().entries.find((e) => e.date === date),
}));
