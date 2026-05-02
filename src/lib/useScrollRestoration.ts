import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Hook to restore scroll position when navigating back to a page.
 * @param key Unique key for the page (e.g. category name or 'home')
 * @param dependency Optional dependency that signals content has loaded (e.g. products array)
 */
export const useScrollRestoration = (key: string, dependency?: any) => {
  const { pathname, state } = useLocation();
  const navType = useNavigationType();

  // Save scroll position before navigating away
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scrollPos-${key}`, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [key]);

  // Restore scroll position
  useEffect(() => {
    const savedPos = sessionStorage.getItem(`scrollPos-${key}`);
    const shouldRestore = navType === 'POP' || (state as any)?.fromProduct;

    if (savedPos && parseInt(savedPos) > 0 && shouldRestore) {
      // We use a slightly longer timeout to ensure the DOM has rendered
      // especially for lists with images
      const timeout = setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedPos),
          behavior: 'instant' as ScrollBehavior
        });
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [key, dependency, navType, state]); // Run when key, dependency, navigation type or state changes
};
