import { useEffect } from 'react';

/**
 * Custom hook to set document title and language based on environment variables.
 * Falls back to `El Pato Chat` for title and `es` for language if environment variables are not set.
 */
export const useDocumentConfig = () => {
  useEffect(() => {
    // Get values from environment variables, falling back to defaults
    const title = import.meta.env.VITE_APP_TITLE || 'El Pato Chat';
    const lang = import.meta.env.VITE_APP_LANG || 'es';

    // Update document title and language
    if (title && document.title !== title) {
      document.title = title;
    }

    if (lang && document.documentElement.lang !== lang) {
      document.documentElement.lang = lang;
    }
  }, []);
};
