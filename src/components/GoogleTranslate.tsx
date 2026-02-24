import { useEffect, useRef, useState } from 'react';
import { hideGoogleTranslateNotification } from '@/hooks/useGoogleTranslate';

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: () => void;
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

    useEffect(() => {
        // Hide the notification bar
        hideGoogleTranslateNotification();

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
                setIsLoaded(true);
                // Apply translation after script loads
                if (targetLanguage && !hasTranslatedRef.current) {
                    applyTranslation(targetLanguage);
                }
            };
            document.body.appendChild(script);
        } else if (window.google && window.google.translate) {
            setIsLoaded(true);
            if (targetLanguage) {
                applyTranslation(targetLanguage);
            }
        }
    }, []);

    useEffect(() => {
        if (isLoaded && targetLanguage && !hasTranslatedRef.current) {
            applyTranslation(targetLanguage);
        }
    }, [targetLanguage, isLoaded]);

    const applyTranslation = (lang: string) => {
        if (!lang || lang === 'pt') {
            // Reset to original language
            const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (select) {
                select.value = '';
                select.dispatchEvent(new Event('change'));
            }
            hasTranslatedRef.current = false;
            return;
        }

        const googleLang = LANGUAGE_CODES[lang] || lang;

        // Wait for the element to be ready
        const tryTranslate = () => {
            const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (select) {
                select.value = googleLang;
                select.dispatchEvent(new Event('change'));
                hasTranslatedRef.current = true;
                onLanguageChange?.(lang);

                // Re-hide notification after translation
                setTimeout(() => {
                    hideGoogleTranslateNotification();
                }, 1000);
            } else {
                // Try again if not ready
                setTimeout(tryTranslate, 500);
            }
        };

        tryTranslate();
    };

    // This component doesn't render anything visible
    // It just loads Google Translate and applies translation
    return null;
}

// Standalone function to translate the page
export function translatePage(targetLang: string): void {
    const googleLang = LANGUAGE_CODES[targetLang] || targetLang;

    const tryTranslate = () => {
        const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (select) {
            select.value = googleLang;
            select.dispatchEvent(new Event('change'));
            hideGoogleTranslateNotification();
        } else {
            // Try again if not ready
            setTimeout(tryTranslate, 500);
        }
    };

    // Wait for Google Translate to load
    const checkAndTranslate = () => {
        if (window.google && window.google.translate) {
            tryTranslate();
        } else {
            setTimeout(checkAndTranslate, 500);
        }
    };

    checkAndTranslate();
}

// Standalone function to reset translation
export function resetTranslation(): void {
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
        select.value = '';
        select.dispatchEvent(new Event('change'));
    }
}
