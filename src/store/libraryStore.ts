import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, Quote } from '../types';

interface LibraryState {
  books: Book[];
  quotes: Quote[];
  addBook: (book: Book) => void;
  removeBook: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  addQuote: (quote: Quote) => void;
  removeQuote: (id: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      books: [],
      quotes: [],
      addBook: (book) => set((state) => ({ books: [...state.books, book] })),
      removeBook: (id) =>
        set((state) => ({
          books: state.books.filter((b) => b.id !== id),
          quotes: state.quotes.filter((q) => q.bookId !== id),
        })),
      updateProgress: (id, progress) =>
        set((state) => ({
          books: state.books.map((b) =>
            b.id === id ? { ...b, progress, lastRead: Date.now() } : b
          ),
        })),
      addQuote: (quote) => set((state) => ({ quotes: [...state.quotes, quote] })),
      removeQuote: (id) =>
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        })),
    }),
    {
      name: 'almanac-library-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
