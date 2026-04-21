import React, { useRef } from 'react';
import { View, FlatList, Alert } from 'react-native';
import { useLibraryStore } from '../store/libraryStore';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { sharePlainText, copyPlainText, shareImageUri } from '../utils/sharing';
import { Button } from '../components/ui/Button';
import ViewShot from 'react-native-view-shot';
import { Feather } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';

export const HighlightsScreen = () => {
  const { quotes } = useLibraryStore();
  const { theme } = useSettingsStore();
  
  // Store refs for each quote card
  const viewShotRefs = useRef<{ [key: string]: ViewShot | null }>({});

  const handleShareText = (quote: any) => {
    sharePlainText(quote.text, quote.bookTitle, quote.bookAuthor);
  };

  const handleCopyText = (quote: any) => {
    copyPlainText(quote.text, quote.bookTitle, quote.bookAuthor);
  };

  const handleShareImage = async (id: string) => {
    const viewShot = viewShotRefs.current[id];
    if (viewShot && viewShot.capture) {
      try {
        const uri = await viewShot.capture();
        await shareImageUri(uri);
      } catch (e) {
        Alert.alert('Error', 'Failed to generate image');
      }
    }
  };

  const renderQuote = ({ item }: { item: any }) => (
    <View className="mb-8">
      <ViewShot 
        ref={(ref: any) => { viewShotRefs.current[item.id] = ref; }}
        options={{ format: 'png', quality: 0.9 }}
      >
        <Card elevated className="p-8 border-none bg-surface">
          <Typography variant="body" className="mb-6 italic text-lg leading-loose text-center">
            "{item.text}"
          </Typography>
          <View className="items-center border-t border-border-subtle pt-4 mx-4">
            <Typography variant="bodySmall" font="ui" className="uppercase tracking-widest font-semibold mb-1">
              {item.bookAuthor}
            </Typography>
            <Typography variant="bodySmall" color="secondary" font="ui">
              {item.bookTitle}
            </Typography>
          </View>
        </Card>
      </ViewShot>
      
      <View className="flex-row justify-center mt-4 space-x-4">
        <Button title="Copy" iconName="copy" variant="ghost" size="sm" onPress={() => handleCopyText(item)} />
        <Button title="Share Text" iconName="share-2" variant="ghost" size="sm" onPress={() => handleShareText(item)} />
        <Button title="Save Image" iconName="image" variant="ghost" size="sm" onPress={() => handleShareImage(item.id)} />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background p-5 pt-16">
      <Typography variant="h1" className="mb-8 text-center">Highlights</Typography>
      
      {quotes.length === 0 ? (
        <View className="flex-1 justify-center items-center pb-20">
          <Feather name="bookmark" size={64} color={theme === 'light' ? '#D1C7B7' : '#504945'} style={{ marginBottom: 24 }} />
          <Typography variant="h2" className="mb-2">No highlights yet</Typography>
          <Typography color="muted" className="text-center px-4">
            Select text while reading to save your favorite quotes here.
          </Typography>
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.id}
          renderItem={renderQuote}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
};
