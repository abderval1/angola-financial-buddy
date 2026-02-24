import { useEffect, useCallback, useRef } from 'react';

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: () => void;
    }
}

const GOOGLE_TRANSLATE_API_URL = '//translate.google.com/translate_a/element.js';

export function useGoogleTranslate() {
    const isLoadedRef = useRef(false);

    const loadGoogleTranslate = useCallback(() => {
        if (isLoadedRef.current) return Promise.resolve();

        return new Promise<void>((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector('script[src*="translate.google.com"]')) {
                isLoadedRef.current = true;
                resolve();
                return;
            }

            // Create and load the Google Translate script
            const script = document.createElement('script');
            script.src = GOOGLE_TRANSLATE_API_URL;
            script.async = true;
            script.onload = () => {
                isLoadedRef.current = true;
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Google Translate'));
            };
            document.body.appendChild(script);
        });
    }, []);

    const translatePage = useCallback(async (targetLang: string) => {
        try {
            await loadGoogleTranslate();

            // Wait for google to be available
            if (!window.google || !window.google.translate) {
                // Give it a bit more time
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (window.google && window.google.translate) {
                const translateElement = new window.google.translate.TranslateElement(
                    {
                        pageLanguage: 'auto',
                        includedLanguages: 'pt,en,fr,es,ar,zh,ln',
                        layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                        autoDisplay: false
                    },
                    'google_translate_element'
                );

                // Set the language after element is created
                setTimeout(() => {
                    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                    if (select) {
                        select.value = targetLang;
                        select.dispatchEvent(new Event('change'));
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Translation error:', error);
        }
    }, [loadGoogleTranslate]);

    const resetTranslation = useCallback(async () => {
        try {
            await loadGoogleTranslate();

            const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (select) {
                select.value = '';
                select.dispatchEvent(new Event('change'));
            }
        } catch (error) {
            console.error('Reset translation error:', error);
        }
    }, [loadGoogleTranslate]);

    return {
        translatePage,
        resetTranslation,
        loadGoogleTranslate
    };
}

// Helper function to hide the Google Translate notification
export function hideGoogleTranslateNotification() {
    const style = document.createElement('style');
    style.id = 'google-translate-hide-style';
    const cssContent = `
    .goog-te-banner-frame {
      display: none !important;
    }
    .skiptranslate {
      display: none !important;
    }
    body {
      top: 0 !important;
    }
    #goog-gt-tt {
      display: none !important;
    }
    .goog-text-highlight {
      background: none !important;
      box-shadow: none !important;
    }
  `;
    style.textContent = cssContent;

    if (!document.getElementById('google-translate-hide-style')) {
        document.head.appendChild(style);
    }
}
