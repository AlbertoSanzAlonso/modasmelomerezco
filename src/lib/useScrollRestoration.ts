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
      let timeoutId: NodeJS.Timeout;
      
      const lastId = sessionStorage.getItem(`lastId-${key}`);
      let attempts = 0;
      const maxAttempts = 30; // Increased attempts
      
      const tryScroll = () => {
        const targetElement = lastId ? document.getElementById(`product-${lastId}`) : null;
        
        // If we have a target element, we use its position. 
        // Otherwise we use the absolute saved position.
        const targetPos = targetElement 
          ? (targetElement.getBoundingClientRect().top + window.scrollY - 250) 
          : parseInt(savedPos);
          
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        
        // Success conditions:
        // 1. Found the element we were looking for
        // 2. The document is tall enough to reach the saved position
        // 3. We exhausted attempts (fallback)
        const isReady = targetElement || (docHeight >= targetPos + winHeight);

        if (isReady || attempts >= maxAttempts) {
          window.scrollTo({
            top: Math.max(0, targetPos),
            behavior: 'instant' as ScrollBehavior
          });
          
          isRestoring.current = false;
          // Clear lastId after restoration
          sessionStorage.removeItem(`lastId-${key}`);
        } else {
          attempts++;
          timeoutId = setTimeout(tryScroll, 100);
        }
      };

      timeoutId = setTimeout(tryScroll, 100);
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        isRestoring.current = false;
      };
    }
  }, [key, dependency, navType, state]);
};

