/**
 * SkyRush Production Environment & Endpoint Resolver
 * Tiered Hierarchy: Query Param -> Runtime Window Config -> Vite Build Env -> Localhost Fallback
 */

// Trusted host patterns for query parameter override security
const ALLOWED_HOST_SUFFIXES = [
  'skyrush.cc',
  'onrender.com',
  'localhost',
  '127.0.0.1',
];

/**
 * Validates whether an external URL is safe against token-stealing injection attacks
 */
function isSafeServerUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some(suffix => hostname === suffix || hostname.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

export function resolveServerUrl() {
  // 1. URL Query Parameter Override (Useful for Casino Aggregator iFrames e.g. ?server=https://api.skyrush.cc)
  if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    const candidate = params.get('server') || params.get('serverUrl') || params.get('api');
    if (candidate && isSafeServerUrl(candidate)) {
      return candidate.replace(/\/+$/, '');
    }
  }

  // 2. Runtime Injected Window Config (Used for Docker / Kubernetes container runtime injection)
  if (typeof window !== 'undefined' && window.__SKYRUSH_CONFIG__?.SERVER_URL) {
    return window.__SKYRUSH_CONFIG__.SERVER_URL.replace(/\/+$/, '');
  }

  // 3. Vite Build-Time Environment Variable
  if (import.meta.env?.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '');
  }

  // 4. Localhost / Dev fallback
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      return 'http://localhost:3000';
    }
    // 5. Production Same-Origin fallback (when hosted behind an Nginx reverse proxy)
    return window.location.origin;
  }

  return 'http://localhost:3000';
}

export const SERVER_BASE_URL = resolveServerUrl();
