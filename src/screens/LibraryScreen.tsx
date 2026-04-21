import React from 'react';
import { View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useLibraryStore } from '../store/libraryStore';
import { importBook } from '../utils/fileImport';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Typography } from '../components/ui/Typography';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';

export const LibraryScreen = () => {
  const { books, addBook, removeBook } = useLibraryStore();
  const { appTheme, toggleAppTheme } = useSettingsStore();
  const router = useRouter();

  const handleImport = async () => {
    const book = await importBook();
    if (book) {
      addBook(book);
    }
  };

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Delete Book', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeBook(id) },
    ]);
  };

  const renderBook = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="mb-4"
      onPress={() => router.push(`/reader/${item.id}`)}
      activeOpacity={0.8}
    >
      <Card elevated>
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Typography variant="h3" numberOfLines={1} className="mb-1">{item.title}</Typography>
            <Typography variant="bodySmall" color="secondary" className="mb-3">{item.author}</Typography>
            
            <View className="flex-row items-center">
              <View className="h-1.5 flex-1 bg-border-subtle rounded-full overflow-hidden mr-3">
                <View 
                  className="h-full bg-primary" 
                  style={{ width: `${Math.max(item.progress * 100, 2)}%` }} 
                />
              </View>
              <Typography variant="bodySmall" color="muted">
                {Math.round(item.progress * 100)}%
              </Typography>
            </View>
          </View>
          <View className="items-center justify-between">
            <View className="items-center justify-center bg-surface w-12 h-12 rounded-md border border-border-subtle mb-2">
              <Typography variant="bodySmall" color="muted" font="ui" className="font-bold text-[10px]">
                {item.type}
              </Typography>
            </View>
            <TouchableOpacity onPress={() => confirmDelete(item.id, item.title)} className="p-2">
              <Feather name="trash-2" size={18} color="#CC241D" />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 p-5 pt-16">
      <View className="flex-row justify-between items-center mb-8">
        <Typography variant="h1">Library</Typography>
        <View className="flex-row space-x-2">
          <Button iconName={appTheme === 'light' ? 'moon' : 'sun'} onPress={toggleAppTheme} size="sm" variant="ghost" title="" />
          <Button title="Import" iconName="plus" onPress={handleImport} size="sm" variant="ghost" />
        </View>
      </View>

      {books.length === 0 ? (
        <View className="flex-1 justify-center items-center pb-20">
          <Feather name="book-open" size={64} color={appTheme === 'light' ? '#D1C7B7' : '#504945'} style={{ marginBottom: 24 }} />
          <Typography variant="h2" className="mb-2">Your library is empty</Typography>
          <Typography color="muted" className="mb-8 text-center px-4">
            Import your favorite EPUBs or PDFs to start reading.
          </Typography>
          <Button title="Import Book" iconName="download" onPress={handleImport} size="lg" />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={renderBook}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
};
