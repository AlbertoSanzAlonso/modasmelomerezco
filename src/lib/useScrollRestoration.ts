import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Hook to restore scroll position when navigating back to a page.
 * @param key Unique key for the page (e.g. category name or 'home')
 * @param dependency Optional dependency that signals content has loaded (e.g. products array)
 */
export const useScrollRestoration = (key: string, dependency?: any) => {
  const { state } = useLocation();
  const navType = useNavigationType();
  const isRestoring = useRef(false);

  // Save scroll position before navigating away
  useEffect(() => {
    const handleScroll = () => {
      // Don't save position if we are currently restoring it
      if (isRestoring.current) return;
      
      const currentScroll = window.scrollY;
      // Only save if we have scrolled a bit (avoid saving 0 if page is still loading)
      if (currentScroll > 0) {
        sessionStorage.setItem(`scrollPos-${key}`, currentScroll.toString());
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [key]);

  // Restore scroll position
  useEffect(() => {
    const savedPos = sessionStorage.getItem(`scrollPos-${key}`);
    const shouldRestore = navType === 'POP' || (state as any)?.fromProduct;

    if (savedPos && parseInt(savedPos) > 0 && shouldRestore) {
      isRestoring.current = true;
      
      const lastId = sessionStorage.getItem(`lastId-${key}`);
      
      // Attempt restoration with retries to wait for layout/images
      let attempts = 0;
      const maxAttempts = 20;
      
      const tryScroll = () => {
        const targetElement = lastId ? document.getElementById(`product-${lastId}`) : null;
        const targetPos = targetElement 
          ? (targetElement.getBoundingClientRect().top + window.scrollY - 200) // Scroll to element with some offset
          : parseInt(savedPos);
          
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        
        // If we found the target element OR the document is tall enough OR we've tried many times
        if (targetElement || docHeight >= targetPos + winHeight || attempts >= maxAttempts) {
          window.scrollTo({
            top: Math.max(0, targetPos),
            behavior: 'instant' as ScrollBehavior
          });
          
          // Small delay before allowing saving again to avoid race conditions
          setTimeout(() => {
            isRestoring.current = false;
            // Clear lastId after restoration so it doesn't stick
            sessionStorage.removeItem(`lastId-${key}`);
          }, 100);
        } else {
          attempts++;
          setTimeout(tryScroll, 100);
        }
      };

      // Initial delay to let the first render happen
      const initialTimeout = setTimeout(tryScroll, 150);
      return () => {
        clearTimeout(initialTimeout);
        isRestoring.current = false;
      };
    }
  }, [key, dependency, navType, state]);
};

