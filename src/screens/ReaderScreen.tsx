import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Modal, Animated, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLibraryStore } from '../store/libraryStore';
import { useSettingsStore } from '../store/settingsStore';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { Feather } from '@expo/vector-icons';
import { copyPlainText } from '../utils/sharing';

export const ReaderScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { books, addQuote } = useLibraryStore();
  const { fontFamily, fontSize, lineHeight, theme, toggleTheme } = useSettingsStore();
  
  const book = books.find(b => b.id === id);
  const webViewRef = useRef<WebView>(null);
  
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [base64Content, setBase64Content] = useState<string>('');
  
  // Selection UI State
  const [selectedText, setSelectedText] = useState<string>('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (book) {
      loadBookData();
    }
  }, [book]);

  const loadBookData = async () => {
    if (!book) return;
    try {
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(book.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setBase64Content(base64);
    } catch (e) {
      console.error("Failed to load book data", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Animate the action bar in or out
    Animated.spring(slideAnim, {
      toValue: selectedText.length > 0 ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [selectedText]);

  // The injected JavaScript uses a debouncer to avoid spamming messages,
  // and detects clicks outside to clear the selection.
  const injectedJavaScript = `
    let selectionTimeout;
    document.addEventListener('selectionchange', function() {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(function() {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'selection',
          text: text
        }));
      }, 300); // 300ms debounce
    });

    // Clear selection if tapping outside
    document.addEventListener('touchstart', function(e) {
      // Allow a tiny delay so actual selection logic isn't interrupted
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection.toString().length === 0) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'selection',
            text: ''
          }));
        }
      }, 100);
    });
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'selection') {
        setSelectedText(data.text);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveQuote = () => {
    if (book && selectedText) {
      addQuote({
        id: Date.now().toString(),
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        text: selectedText,
        createdAt: Date.now()
      });
      // Clear selection UI
      setSelectedText('');
      // Tell webview to clear actual selection
      webViewRef.current?.injectJavaScript('window.getSelection().removeAllRanges(); true;');
    }
  };

  const handleCopyQuote = () => {
    if (book && selectedText) {
      copyPlainText(selectedText, book.title, book.author);
      setSelectedText('');
      webViewRef.current?.injectJavaScript('window.getSelection().removeAllRanges(); true;');
    }
  };

  if (!book) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Typography>Book not found</Typography>
        <Button title="Go Back" onPress={() => router.back()} className="mt-4" />
      </View>
    );
  }

  const bgColor = theme === 'light' ? '#FDFBF7' : '#1D2021';
  const textColor = theme === 'light' ? '#2C2A28' : '#EBDBB2';
  const selectionColor = theme === 'light' ? '#C39738' : '#D79921';
  const fontFam = fontFamily === 'Playfair Display' || fontFamily === 'EB Garamond' ? 'serif' : 'sans-serif';

  // For the MVP, we embed a minimal epub.js script from a reliable CDN.
  // In a production app, this would be bundled locally.
  const generateHtml = () => `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
        <style>
          body {
            background-color: ${bgColor};
            color: ${textColor};
            margin: 0;
            padding: 0;
            overflow: hidden; /* epubjs handles scrolling */
            width: 100vw;
            height: 100vh;
          }
          #viewer {
            width: 100%;
            height: 100%;
          }
        </style>
      </head>
      <body>
        <div id="viewer"></div>
        <script>
          // We wait for the base64 content to be injected
          let book;
          let rendition;
          
          function initEpub(base64Data) {
            try {
              // Convert base64 to ArrayBuffer
              var binary_string = window.atob(base64Data);
              var len = binary_string.length;
              var bytes = new Uint8Array(len);
              for (var i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
              }
              var buffer = bytes.buffer;

              book = ePub(buffer);
              rendition = book.renderTo("viewer", {
                width: "100%",
                height: "100%",
                spread: "none",
                manager: "continuous",
                flow: "scrolled"
              });
              
              rendition.themes.default({
                "body": {
                  "background": "${bgColor} !important",
                  "color": "${textColor} !important",
                  "font-family": "${fontFam} !important",
                  "font-size": "${fontSize}px !important",
                  "line-height": "${lineHeight} !important",
                  "padding": "24px !important"
                },
                "::selection": {
                  "background": "${selectionColor} !important",
                  "color": "${bgColor} !important"
                }
              });

              rendition.display();

              // Pass selection events from the iframe up to the parent window
              rendition.on("selected", function(cfiRange, contents) {
                const selection = contents.window.getSelection();
                const text = selection.toString().trim();
                if (text.length > 0) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'selection',
                    text: text
                  }));
                }
              });

              // Also hook up touch events inside the iframe to clear selection
              rendition.on("touchstart", function(event, contents) {
                setTimeout(() => {
                  const selection = contents.window.getSelection();
                  if (selection.toString().length === 0) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'selection',
                      text: ''
                    }));
                  }
                }, 100);
              });

            } catch(err) {
              document.body.innerHTML = "<h2 style='padding:24px'>Error loading EPUB: " + err.message + "</h2>";
            }
          }
          
          // Inform RN that we are ready
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        </script>
      </body>
    </html>
  `;

  // We inject the base64 data only after the webview is ready
  const handleReadyMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready' && base64Content) {
        webViewRef.current?.injectJavaScript(`initEpub("${base64Content}"); true;`);
        setLoading(false);
      } else if (data.type === 'selection') {
        setSelectedText(data.text);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row justify-between items-center p-4 pt-14 bg-surface border-b border-border-subtle shadow-sm z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Feather name="chevron-left" size={24} color={theme === 'light' ? '#2C2A28' : '#EBDBB2'} />
        </TouchableOpacity>
        <Typography variant="h3" numberOfLines={1} className="flex-1 text-center mx-4">{book.title}</Typography>
        <TouchableOpacity onPress={() => setShowSettings(true)} className="p-2">
          <Feather name="settings" size={22} color={theme === 'light' ? '#2C2A28' : '#EBDBB2'} />
        </TouchableOpacity>
      </View>

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: generateHtml() }}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleReadyMessage}
        style={{ backgroundColor: bgColor }}
      />

      {loading && (
        <View className="absolute inset-0 justify-center items-center bg-background z-20">
          <ActivityIndicator size="large" color={selectionColor} />
          <Typography className="mt-4" color="muted">Loading book contents...</Typography>
        </View>
      )}

      {/* Non-Intrusive Action Bar for Selection */}
      <Animated.View 
        style={{ 
          transform: [{ 
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [350, 0] // Slide entirely off-screen
            }) 
          }] 
        }}
        className="absolute bottom-0 left-0 right-0 bg-surface-elevated rounded-t-3xl shadow-lg border-t border-border-subtle px-6 py-6 pb-10 z-30"
      >
        <View className="flex-row justify-between items-center mb-4">
          <Typography variant="h3" className="flex-1">Text Selected</Typography>
          <TouchableOpacity onPress={() => {
            setSelectedText('');
            webViewRef.current?.injectJavaScript('window.getSelection().removeAllRanges(); true;');
          }}>
            <Feather name="x" size={24} color={theme === 'light' ? '#2C2A28' : '#EBDBB2'} />
          </TouchableOpacity>
        </View>
        <Typography variant="bodySmall" color="secondary" numberOfLines={2} className="mb-6 italic">
          "{selectedText}"
        </Typography>
        <View className="flex-row justify-end space-x-4">
          <Button title="Copy" iconName="copy" variant="secondary" onPress={handleCopyQuote} className="flex-1 mr-2" />
          <Button title="Quote" iconName="bookmark" variant="primary" onPress={handleSaveQuote} className="flex-1 ml-2" />
        </View>
      </Animated.View>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="fade">
        <View className="flex-1 justify-end bg-black/40">
          <TouchableOpacity className="flex-1" onPress={() => setShowSettings(false)} />
          <View className="bg-surface-elevated p-8 rounded-t-3xl shadow-lg border-t border-border-subtle max-h-[80%]">
            <Typography variant="h2" className="mb-6">Reading Settings</Typography>
            
            {/* Theme Toggle */}
            <View className="flex-row justify-between items-center mb-4 bg-surface p-4 rounded-xl border border-border-subtle">
              <View className="flex-row items-center">
                <Feather name={theme === 'light' ? 'sun' : 'moon'} size={20} color={selectionColor} />
                <Typography variant="body" className="ml-3 font-medium">Theme</Typography>
              </View>
              <Button 
                title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'} 
                onPress={toggleTheme} 
                size="sm" 
                variant="ghost" 
              />
            </View>

            {/* Typography Controls */}
            <View className="mb-6 bg-surface p-4 rounded-xl border border-border-subtle">
              <View className="flex-row items-center mb-4">
                <Feather name="type" size={20} color={selectionColor} />
                <Typography variant="body" className="ml-3 font-medium">Typography</Typography>
              </View>
              
              <View className="flex-row justify-between items-center mb-4">
                <Typography variant="bodySmall" color="secondary">Font</Typography>
                <TouchableOpacity onPress={() => useSettingsStore.getState().setFontFamily(fontFamily === 'EB Garamond' ? 'Playfair Display' : fontFamily === 'Playfair Display' ? 'Inter' : 'EB Garamond')}>
                  <Typography variant="bodySmall" color="primary" className="font-bold">{fontFamily}</Typography>
                </TouchableOpacity>
              </View>
              
              <View className="flex-row justify-between items-center mb-4">
                <Typography variant="bodySmall" color="secondary">Size</Typography>
                <View className="flex-row items-center space-x-4">
                  <TouchableOpacity onPress={() => useSettingsStore.getState().setFontSize(Math.max(12, fontSize - 2))} className="px-3 py-1 bg-surface-elevated rounded-md">
                    <Typography variant="bodySmall">-</Typography>
                  </TouchableOpacity>
                  <Typography variant="bodySmall" className="w-6 text-center">{fontSize}</Typography>
                  <TouchableOpacity onPress={() => useSettingsStore.getState().setFontSize(Math.min(32, fontSize + 2))} className="px-3 py-1 bg-surface-elevated rounded-md ml-4">
                    <Typography variant="bodySmall">+</Typography>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View className="flex-row justify-between items-center">
                <Typography variant="bodySmall" color="secondary">Spacing</Typography>
                <View className="flex-row items-center space-x-4">
                  <TouchableOpacity onPress={() => useSettingsStore.getState().setLineHeight(Math.max(1.2, lineHeight - 0.2))} className="px-3 py-1 bg-surface-elevated rounded-md">
                    <Typography variant="bodySmall">-</Typography>
                  </TouchableOpacity>
                  <Typography variant="bodySmall" className="w-6 text-center">{lineHeight.toFixed(1)}</Typography>
                  <TouchableOpacity onPress={() => useSettingsStore.getState().setLineHeight(Math.min(2.5, lineHeight + 0.2))} className="px-3 py-1 bg-surface-elevated rounded-md ml-4">
                    <Typography variant="bodySmall">+</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <Button title="Close" onPress={() => setShowSettings(false)} size="lg" className="mt-2" />
          </View>
        </View>
      </Modal>
    </View>
  );
};
