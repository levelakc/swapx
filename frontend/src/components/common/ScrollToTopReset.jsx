import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTopReset() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force immediate scroll to top without any smooth behavior
    window.scrollTo(0, 0);
    // Also try document.documentElement just in case
    document.documentElement.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
