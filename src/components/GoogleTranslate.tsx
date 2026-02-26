import { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: () => void;
        googletag: any;
    }
}

interface GoogleTranslateProps {
    targetLanguage?: string;
    onLanguageChange?: (lang: string) => void;
}

// Google language codes mapping
const LANGUAGE_CODES: Record<string, string> = {
    'pt': 'pt',
    'en': 'en',
    'fr': 'fr',
    'es': 'es',
    'ar': 'ar',
    'zh': 'zh-CN',
    'ln': 'ln'
};

export function GoogleTranslate({ targetLanguage, onLanguageChange }: GoogleTranslateProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const hasTranslatedRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Define the callback
        window.googleTranslateElementInit = () => {
            setIsLoaded(true);
        };

        // Load the script if not already loaded
        if (!document.querySelector('script[src*="translate.google.com"]')) {
            const script = document.createElement('script');
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            script.onload = () => {
                console.log('Google Translate script loaded');
                setIsLoaded(true);
            };
            script.onerror = (error) => {
                console.error('Failed to load Google Translate:', error);
            };
            document.body.appendChild(script);
        } else if (window.google && window.google.translate) {
            setIsLoaded(true);
        }

        // Add CSS to hide the notification
        const style = document.createElement('style');
        style.id = 'google-translate-hide-style';
        style.textContent = `
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
      .goog-te-menu-frame {
        display: none !important;
      }
    `;
        if (!document.getElementById('google-translate-hide-style')) {
            document.head.appendChild(style);
        }
    }, []);

    useEffect(() => {
        if (isLoaded && targetLanguage && !hasTranslatedRef.current && containerRef.current) {
            // Clear any existing content
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            // Create new translate element
            try {
                const translateElement = new window.google.translate.TranslateElement(
                    {
                        pageLanguage: 'pt',
                        includedLanguages: 'pt,en,fr,es,ar,zh-CN,ln',
                        layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                        autoDisplay: false
                    },
                    containerRef.current.id
                );

                // Wait for the dropdown to be created then set the language
                setTimeout(() => {
                    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                    console.log('Found select:', select);
                    if (select) {
                        const langCode = LANGUAGE_CODES[targetLanguage] || targetLanguage;
                        select.value = langCode;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        hasTranslatedRef.current = true;
                        onLanguageChange?.(targetLanguage);
                        console.log('Translation applied:', langCode);
                    } else {
                        console.log('Select not found, trying again...');
                        // Retry
                        setTimeout(() => {
                            const retrySelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                            if (retrySelect) {
                                const langCode = LANGUAGE_CODES[targetLanguage] || targetLanguage;
                                retrySelect.value = langCode;
                                retrySelect.dispatchEvent(new Event('change', { bubbles: true }));
                                hasTranslatedRef.current = true;
                                onLanguageChange?.(targetLanguage);
                            }
                        }, 1000);
                    }
                }, 1500);
            } catch (error) {
                console.error('Error creating translate element:', error);
            }
        }
    }, [isLoaded, targetLanguage, onLanguageChange]);

    return (
        <div
            id="google_translate_element"
            ref={containerRef}
            style={{ display: 'none' }}
        />
    );
}

// Standalone function to translate the page - call this after the component mounts
export function translatePage(targetLang: string): void {
    const googleLang = LANGUAGE_CODES[targetLang] || targetLang;
    console.log('Attempting to translate to:', googleLang);

    const tryTranslate = () => {
        const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        console.log('Found select element:', select);

        if (select) {
            select.value = googleLang;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Translation set to:', googleLang);

            // Hide notification again
            const banner = document.querySelector('.goog-te-banner-frame') as HTMLElement;
            if (banner) banner.style.display = 'none';
        } else {
            console.log('Select not found, will retry...');
            // Try again
            setTimeout(tryTranslate, 1000);
        }
    };

    // Wait a bit for the element to be ready
    setTimeout(tryTranslate, 2000);
}

// Standalone function to reset translation
export function resetTranslation(): void {
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
        select.value = '';
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }
}
