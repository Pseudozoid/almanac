import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Modal, Animated, Alert } from 'react-native';
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
  
  // Use readerTheme instead of appTheme
  const { fontFamily, fontSize, lineHeight, readerTheme, toggleReaderTheme, appTheme } = useSettingsStore();
  
  const book = books.find(b => b.id === id);
  const webViewRef = useRef<WebView>(null);
  
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [base64Content, setBase64Content] = useState<string>('');
  
  // Selection UI State
  const [selectedText, setSelectedText] = useState<string>('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Calculate current style variables
  const bgColor = readerTheme === 'dark' ? '#1D2021' : '#FDFBF7';
  const textColor = readerTheme === 'dark' ? '#EBDBB2' : '#2C2A28';
  const selectionColor = readerTheme === 'dark' ? '#D79921' : '#C39738';
  const fontFam = fontFamily === 'Playfair Display' || fontFamily === 'EB Garamond' ? 'serif' : 'sans-serif';

  useEffect(() => {
    if (book) {
      loadBookData();
    }
  }, [book]);

  const loadBookData = async () => {
    if (!book) return;
    try {
      const base64 = await FileSystem.readAsStringAsync(book.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setBase64Content(base64);
    } catch (e) {
      console.error("Failed to load book data", e);
      setLoading(false);
      Alert.alert("Error", "Could not load the book file.");
    }
  };

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedText.length > 0 ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [selectedText]);

  // Dynamically update styles without unmounting the webview
  useEffect(() => {
    if (!loading && webViewRef.current) {
      const stylePayload = { bgColor, textColor, selectionColor, fontFam, fontSize, lineHeight };
      webViewRef.current.injectJavaScript(`
        if (typeof updateStyles === 'function') {
          updateStyles(${JSON.stringify(stylePayload)});
        }
        true;
      `);
    }
  }, [bgColor, textColor, selectionColor, fontFam, fontSize, lineHeight, loading]);

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
      }, 300);
    });

    document.addEventListener('touchstart', function(e) {
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
      if (data.type === 'ready' && base64Content) {
        // Init with appropriate parser
        if (book?.type === 'PDF') {
          webViewRef.current?.injectJavaScript(`initPdf("${base64Content}"); true;`);
        } else {
          webViewRef.current?.injectJavaScript(`initEpub("${base64Content}"); true;`);
        }
        setLoading(false);
      } else if (data.type === 'selection') {
        setSelectedText(data.text);
      } else if (data.type === 'error') {
        console.error("WebView Error:", data.message);
        Alert.alert("Error", "Failed to parse the document.");
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
      setSelectedText('');
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

  // Memoize HTML so changes to theme/fonts don't remount the WebView
  const htmlContent = useMemo(() => {
    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
          <style id="dynamic-styles"></style>
          <style>
            body {
              margin: 0;
              padding: 0;
              width: 100vw;
              height: 100vh;
              overflow-x: hidden;
            }
            #viewer {
              width: 100%;
              height: 100%;
              overflow-y: auto;
            }
            /* PDF Text Container Styles */
            .pdf-page {
              margin-bottom: 2em;
              padding: 0 24px;
            }
            .pdf-page p {
              text-indent: 1.5em;
              text-align: justify;
              margin-bottom: 1em;
            }
          </style>
        </head>
        <body>
          <div id="viewer"></div>
          <script>
            let bookEpub;
            let rendition;
            let currentStyles = { bgColor: '${bgColor}', textColor: '${textColor}', selectionColor: '${selectionColor}', fontFam: '${fontFam}', fontSize: ${fontSize}, lineHeight: ${lineHeight} };
            
            function updateStyles(styles) {
              currentStyles = styles;
              const { bgColor, textColor, selectionColor, fontFam, fontSize, lineHeight } = styles;
              
              document.body.style.backgroundColor = bgColor;
              document.body.style.color = textColor;
              document.body.style.fontFamily = fontFam;
              document.body.style.fontSize = fontSize + 'px';
              document.body.style.lineHeight = lineHeight;
              
              document.getElementById('dynamic-styles').innerHTML = "::selection { background: " + selectionColor + " !important; color: " + bgColor + " !important; }";
              
              if (rendition) {
                const themeName = "theme-" + Date.now();
                rendition.themes.register(themeName, {
                  "body": {
                    "background": bgColor + " !important",
                    "color": textColor + " !important",
                    "font-family": fontFam + " !important",
                    "font-size": fontSize + "px !important",
                    "line-height": lineHeight + " !important",
                    "padding": "24px !important"
                  },
                  "p, div, span, h1, h2, h3, h4, h5, h6, li, a": {
                    "color": textColor + " !important",
                    "background": "transparent !important",
                    "font-family": fontFam + " !important"
                  },
                  "::selection": {
                    "background": selectionColor + " !important",
                    "color": bgColor + " !important"
                  }
                });
                rendition.themes.select(themeName);
              }
            }

            // Apply initial styles
            updateStyles(currentStyles);

            function base64ToUint8Array(base64) {
              var binary_string = window.atob(base64);
              var len = binary_string.length;
              var bytes = new Uint8Array(len);
              for (var i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
              }
              return bytes;
            }

            function initEpub(base64Data) {
              try {
                var bytes = base64ToUint8Array(base64Data);
                bookEpub = ePub(bytes.buffer);
                rendition = bookEpub.renderTo("viewer", {
                  width: "100%",
                  height: "100%",
                  spread: "none",
                  manager: "continuous",
                  flow: "scrolled"
                });
                
                // Set overrides instead of just default theme so it updates dynamically
                updateStyles(currentStyles);

                rendition.display();

                rendition.on("selected", function(cfiRange, contents) {
                  const selection = contents.window.getSelection();
                  const text = selection.toString().trim();
                  if (text.length > 0) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selection', text: text }));
                  }
                });

                rendition.on("touchstart", function(event, contents) {
                  setTimeout(() => {
                    const selection = contents.window.getSelection();
                    if (selection.toString().length === 0) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selection', text: '' }));
                    }
                  }, 100);
                });

              } catch(err) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
              }
            }

            async function initPdf(base64Data) {
              try {
                // Remove epubjs strict overflow to allow standard scrolling for PDF divs
                document.body.style.overflow = 'auto';
                
                var bytes = base64ToUint8Array(base64Data);
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                
                const loadingTask = pdfjsLib.getDocument({data: bytes});
                const pdf = await loadingTask.promise;
                
                const viewer = document.getElementById('viewer');
                viewer.innerHTML = ''; 
                
                // Extract text from first 50 pages for MVP performance
                const maxPages = Math.min(pdf.numPages, 50);
                
                for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                  const page = await pdf.getPage(pageNum);
                  const textContent = await page.getTextContent();
                  
                  const pageDiv = document.createElement('div');
                  pageDiv.className = 'pdf-page';
                  
                  let lastY = -1;
                  let p = document.createElement('p');
                  
                  for (let item of textContent.items) {
                    // Start new paragraph if Y coordinate drops significantly
                    if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 12) {
                      pageDiv.appendChild(p);
                      p = document.createElement('p');
                    }
                    p.textContent += item.str + ' ';
                    lastY = item.transform[5];
                  }
                  pageDiv.appendChild(p);
                  viewer.appendChild(pageDiv);
                }
                
                if (pdf.numPages > 50) {
                  const warning = document.createElement('p');
                  warning.style.textAlign = 'center';
                  warning.style.fontStyle = 'italic';
                  warning.textContent = '... (Only first 50 pages loaded for preview) ...';
                  viewer.appendChild(warning);
                }
                
              } catch(err) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
              }
            }
            
            // Inform RN that we are ready
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
          </script>
        </body>
      </html>
    `;
  }, []); // Empty dependency array prevents WebView from remounting!

  return (
    <View className="flex-1">
      <View className="flex-row justify-between items-center p-4 pt-14 bg-surface border-b border-border-subtle shadow-sm z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Feather name="chevron-left" size={24} color={appTheme === 'light' ? '#2C2A28' : '#EBDBB2'} />
        </TouchableOpacity>
        <Typography variant="h3" numberOfLines={1} className="flex-1 text-center mx-4">{book.title}</Typography>
        <TouchableOpacity onPress={() => setShowSettings(true)} className="p-2">
          <Feather name="settings" size={22} color={appTheme === 'light' ? '#2C2A28' : '#EBDBB2'} />
        </TouchableOpacity>
      </View>

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
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
              outputRange: [350, 0]
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
            <Feather name="x" size={24} color={appTheme === 'light' ? '#2C2A28' : '#EBDBB2'} />
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
            
            {/* Theme Toggle (Reader Specific) */}
            <View className="flex-row justify-between items-center mb-4 bg-surface p-4 rounded-xl border border-border-subtle">
              <View className="flex-row items-center">
                <Feather name={readerTheme === 'light' ? 'sun' : 'moon'} size={20} color={selectionColor} />
                <Typography variant="body" className="ml-3 font-medium">Reader Theme</Typography>
              </View>
              <Button 
                title={readerTheme === 'light' ? 'Switch to Dark' : 'Switch to Light'} 
                onPress={toggleReaderTheme} 
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
