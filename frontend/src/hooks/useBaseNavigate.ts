import { useCallback } from 'react';
import { useNavigate as useRRNavigate, NavigateOptions, To } from 'react-router-dom';

/**
 * Wrapper around React Router's useNavigate that prefixes routes with the
 * Vite BASE_URL when navigating to absolute paths. This ensures navigation
 * works correctly when the application is served from a sub-path.
 */
export default function useBaseNavigate() {
  const navigate = useRRNavigate();
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  return useCallback(
    (to: To, options?: NavigateOptions) => {
      if (typeof to === 'string') {
        const target = to.startsWith('/') && base !== '' && base !== '/' ? `${base}${to}` : to;
        navigate(target, options);
      } else if (typeof to === 'object' && to !== null && 'pathname' in to && typeof to.pathname === 'string') {
        const pathname = to.pathname.startsWith('/') && base !== '' && base !== '/' ? `${base}${to.pathname}` : to.pathname;
        navigate({ ...to, pathname }, options);
      } else {
        navigate(to, options);
      }
    },
    [navigate, base],
  );
}
