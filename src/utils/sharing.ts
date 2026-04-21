import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

export const sharePlainText = async (text: string, title: string, author: string) => {
  try {
    const formattedText = `"${text}"\n\n— ${author}, ${title}`;
    
    // We can't share plain text directly using expo-sharing easily on all platforms,
    // so we'll copy to clipboard and notify, or use Share from react-native.
    // Let's use react-native Share instead for text!
    const { Share } = require('react-native');
    await Share.share({
      message: formattedText,
    });
  } catch (error) {
    console.error('Error sharing text:', error);
    Alert.alert('Error', 'Failed to share text');
  }
};

export const copyPlainText = async (text: string, title: string, author: string) => {
  try {
    const formattedText = `"${text}"\n\n— ${author}, ${title}`;
    await Clipboard.setStringAsync(formattedText);
    Alert.alert('Copied', 'Quote copied to clipboard');
  } catch (error) {
    console.error('Error copying text:', error);
    Alert.alert('Error', 'Failed to copy text');
  }
};

export const shareImageUri = async (uri: string) => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('Sharing not available', 'Sharing is not available on this device');
      return;
    }
    
    await Sharing.shareAsync(uri, {
      dialogTitle: 'Share Quote',
      mimeType: 'image/png',
    });
  } catch (error) {
    console.error('Error sharing image:', error);
    Alert.alert('Error', 'Failed to share image');
  }
};
