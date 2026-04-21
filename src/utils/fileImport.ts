import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Book, BookType } from '../types';

export const importBook = async (): Promise<Book | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/epub+zip'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const { uri, name, mimeType } = asset;

    const id = Date.now().toString();
    const newUri = `${FileSystem.documentDirectory}${id}_${name}`;

    await FileSystem.copyAsync({
      from: uri,
      to: newUri,
    });

    // Basic type inference if mimeType is missing
    let type: BookType = 'EPUB';
    if (mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
      type = 'PDF';
    }

    // In a full implementation, we'd parse the EPUB/PDF metadata here.
    // For MVP, we'll use the filename as title and 'Unknown Author'.
    const title = name.replace(/\.[^/.]+$/, ''); // Remove extension

    return {
      id,
      title,
      author: 'Unknown Author',
      uri: newUri,
      type,
      progress: 0,
      lastRead: 0,
    };
  } catch (error) {
    console.error('Error importing book:', error);
    return null;
  }
};
