import { useState, useEffect } from 'react';

export function useResponsiveOrientation() {
  const [isLandscape, setIsLandscape] = useState(
    window.matchMedia("(orientation: landscape)").matches
  );

  useEffect(() => {
    const handleOrientation = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches);
    };

    const mediaQuery = window.matchMedia("(orientation: landscape)");
    mediaQuery.addEventListener('change', handleOrientation);

    return () => {
      mediaQuery.removeEventListener('change', handleOrientation);
    };
  }, []);

  return isLandscape;
}
