import { useEffect } from 'react';
import ct from 'countries-and-timezones';

export const backendUri = 'https://api.merchi.co/';
export const websocketServer = 'https://websockets.merchi.co/';

export const stagingBackendUri = 'https://api.staging.merchi.co/';
export const stagingWebsocketServer = 'https://websockets.staging.merchi.co/';

export const cartShipmentQuote = {
  shipmentMethod: { originAddress: {}, taxType: {} },
};

export const optionsEmbed = {
  options: {
    linkedFile: {},
    variationCostDiscountGroup: {},
    variationUnitCostDiscountGroup: {},
  },
  variationCostDiscountGroup: {},
  variationUnitCostDiscountGroup: {},
};

export const variationsEmbed = {
  selectedOptions: {},
  variationField: optionsEmbed,
  variationFiles: {},
};

export const variationsGroupsEmbed = {
  variations: variationsEmbed,
};

export const productWithImagesEmbed = {
  domain: { company: { defaultTaxType: {}, taxTypes: {} } },
  featureImage: {},
  groupVariationFields: { options: { linkedFile: {} } },
  images: {},
  independentVariationFields: { options: { linkedFile: {} } },
  taxType: {},
};

export const cartEmbed = {
  cartItems: {
    product: productWithImagesEmbed,
    taxType: {},
    variations: variationsEmbed,
    variationsGroups: variationsGroupsEmbed,
  },
  client: { emailAddresses: {}, profilePicture: {} },
  clientCompany: {},
  domain: {
    company: {
      defaultTaxType: {},
      isStripeAccountEnabled: {},
      taxTypes: {},
    },
  },
  invoice: {},
  receiverAddress: {},
  shipmentGroups: {
    cartItems: { product: {} },
    quotes: cartShipmentQuote,
    selectedQuote: cartShipmentQuote,
  },
  discountItems: {},
};

export function getCookieByName(name) {
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }

  return null; // Cookie not found
}

// ============================================================================
// WooCommerce Form Input Style Control - Handles input active states
// ============================================================================
export default function useWooActive() {
  useEffect(() => {
    const INPUT = '.wc-block-components-text-input__input';
    const WRAP = '.wc-block-components-text-input';

    function toggle(el, force) {
      const w = el.closest(WRAP);
      if (w) w.classList.toggle('is-active', force ?? !!el.value);
    }

    function recheckAll() {
      document.querySelectorAll(INPUT).forEach(input => {
        const isFocused = document.activeElement === input;
        toggle(input, isFocused || undefined);
      });
    }

    function handleEvent(e) {
      if (!e.target.matches(INPUT)) return;
      toggle(e.target, e.type === 'focusin' || undefined);
    }

    let timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(recheckAll, 20);
    });

    ['focusin', 'focusout', 'input', 'change'].forEach(event => {
      document.addEventListener(event, handleEvent);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ['class']
    });

    recheckAll();

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      ['focusin', 'focusout', 'input', 'change'].forEach(event => {
        document.removeEventListener(event, handleEvent);
      });
    };
  }, []);
}

// ============================================================================
// WordPress API Utilities - Handle WP REST API and WooCommerce Store API
// ============================================================================
export function getWpApiRoot() {
  if (window.wpApiSettings?.root) return wpApiSettings.root;
  const link = document.querySelector('link[rel="https://api.w.org/"]')?.href;
  if (link) return link.endsWith('/') ? link : link + '/';

  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);

  if (segments.length > 0 && segments[0] !== 'wp-json') {
    return `/${segments[0]}/wp-json/`;
  }

  return '/wp-json/';
}

// WooCommerce Store API Nonce Management
let wooNonceCache = '';

export async function fetchWooNonce() {
  const r = await fetch(
    `${getWpApiRoot()}wc/store/v1/cart`,
    { credentials: 'same-origin' }
  );
  wooNonceCache =
    r.headers.get('x-wc-store-api-nonce') ||
    r.headers.get('nonce') || '';
  return wooNonceCache;
}

export async function ensureWooNonce() {
  if (wooNonceCache) return wooNonceCache;

  const metaNonce = document
    .querySelector('meta[name="woocommerce-store-api-nonce"]')
    ?.content;
  if (metaNonce) {
    wooNonceCache = metaNonce;
    return wooNonceCache;
  }

  return fetchWooNonce();
}

export function updateWooNonce(res) {
  const n =
    res.headers?.get?.('x-wc-store-api-nonce') ||
    res.headers?.get?.('nonce');
  if (n) wooNonceCache = n;
}

// ============================================================================
// Product Variations Utilities - Handle product options and variation groups
// ============================================================================
export const shouldShow = (v) => {
  if (Array.isArray(v.selectedOptions) && v.selectedOptions.length) return true;
  if (typeof v.value === 'string' && v.value.trim() !== '') return true;
  if (typeof v.value === 'number') return true;
  return false;
};

export const buildOptionMap = (product = {}) => {
  const fields = [
    ...(product.groupVariationFields || []),
    ...(product.independentVariationFields || []),
  ];
  const map = new Map();
  fields.forEach((f) =>
    (f.options || []).forEach((o) => map.set(String(o.id), o.value))
  );
  return map;
};

// ============================================================================
// Geographic and Country Utilities - Handle country codes and browser location
// ============================================================================
// Convert country name to ISO code
export const toIso = (val = '') =>
  typeof val === 'string'
    ? val.toUpperCase()
    : (val && val.iso2 ? val.iso2.toUpperCase() : '');

export function getCountryFromBrowser() {
  if (typeof window === 'undefined') return null;

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

  if (tz) {
    const tzInfo = ct.getTimezone(tz);
    if (tzInfo?.countries?.length) {
      const locale = navigator.language || '';
      const locMatch = locale.match(/-([A-Z]{2})$/i)?.[1]?.toUpperCase();
      const chosen =
        tzInfo.countries.find(c => c === locMatch) ||
        tzInfo.countries[0];
      return chosen;
    }
  }

  const locale =
    Intl.DateTimeFormat().resolvedOptions().locale ||
    navigator.language || '';
  const m = locale.match(/-([A-Z]{2})$/i);
  if (m) return m[1].toUpperCase();

  return null;
}

// ============================================================================
// Cart Data Processing Utilities - Handle cart data cleaning and restoration
// ============================================================================
export function cleanShipmentGroups(cartJson = {}) {
  if (!Array.isArray(cartJson.shipmentGroups)) return cartJson;

  return {
    ...cartJson,
    shipmentGroups: cartJson.shipmentGroups.filter(
      (g) => Array.isArray(g.cartItems) && g.cartItems.length > 0
    ),
  };
}

export function sanitizeCart(raw) {
  const cleaned = { ...raw };

  cleaned.receiverAddress = null;
  cleaned.shipmentGroups = [];
  cleaned.selectedQuote = null;

  cleaned.shipmentSubtotalCost = 0;
  cleaned.shipmentTaxAmount = 0;
  cleaned.shipmentTotalCost = 0;

  return cleaned;
}

export function ciKey(ci) {
  const id = ci?.product?.id ?? ci?.productID ?? ci?.product;
  const vg = JSON.stringify(
    (ci?.variationsGroups || []).map(g =>
      (g.variations || []).map(v => [
        v?.variationField?.id ?? v?.variationField?.name ?? v?.variationField?.label ?? '',
        v?.value ?? ''
      ])
    )
  );
  return `${id}::${vg}`;
}

export function mergeCartProducts(nextCart, prevCart) {
  if (!prevCart?.cartItems?.length || !nextCart?.cartItems?.length) return nextCart;

  const bucket = new Map();
  prevCart.cartItems.forEach(oldCI => {
    const k = ciKey(oldCI);
    if (!bucket.has(k)) bucket.set(k, []);
    bucket.get(k).push(oldCI);
  });

  const mergedItems = nextCart.cartItems.map(newCI => {
    const k = ciKey(newCI);
    const arr = bucket.get(k);
    const oldCI = arr && arr.length ? arr.shift() : null;
    if (!oldCI) return newCI;

    const p = newCI.product;
    const onlyId = (typeof p === 'number') || (p && Object.keys(p).length === 1 && 'id' in p);

    return onlyId
      ? { ...newCI, product: oldCI.product }
      : { ...newCI, product: { ...oldCI.product, ...p } };
  });

  return { ...nextCart, cartItems: mergedItems };
}
