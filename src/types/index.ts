export type BookType = 'EPUB' | 'PDF';

export interface Book {
  id: string;
  title: string;
  author: string;
  uri: string;
  type: BookType;
  progress: number; // 0 to 1
  lastRead: number; // timestamp
}

export interface Quote {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  text: string;
  cfi?: string; // For EPUB location
  page?: number; // For PDF location
  createdAt: number;
}
