import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Hook to restore scroll position when navigating back to a page.
 * @param key Unique key for the page (e.g. category name or 'home')
 * @param dependency Optional dependency that signals content has loaded (e.g. products array)
 */
export const useScrollRestoration = (key: string, dependency?: any) => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  // Save scroll position before navigating away
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scrollPos-${key}`, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [key]);

  // Restore scroll position when navigating back (POP)
  useEffect(() => {
    if (navType === 'POP') {
      const savedPos = sessionStorage.getItem(`scrollPos-${key}`);
      if (savedPos) {
        // We use a small timeout to ensure the DOM has rendered if dependency is not provided
        // or if we want to be extra safe with React's rendering cycle.
        const timeout = setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedPos),
            behavior: 'instant' as ScrollBehavior
          });
        }, 50);
        return () => clearTimeout(timeout);
      }
    }
  }, [key, navType, dependency]);
};
