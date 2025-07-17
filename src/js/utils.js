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

// Woo Store Nonce helper
let wooNonceCache = '';

export async function fetchWooNonce() {
  const r = await fetch('/wp-json/wc/store/v1/cart', { credentials: 'same-origin' });
  wooNonceCache = r.headers.get('Nonce') || '';
  return wooNonceCache;
}

export async function ensureWooNonce() {
  if (wooNonceCache) return wooNonceCache;
  return fetchWooNonce();
}

export function updateWooNonce(res) {
  const n = res.headers?.get?.('Nonce');
  if (n) wooNonceCache = n;
}

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

export function cleanShipmentGroups(cartJson = {}) {
  if (!Array.isArray(cartJson.shipmentGroups)) return cartJson;

  return {
    ...cartJson,
    shipmentGroups: cartJson.shipmentGroups.filter(
      (g) => Array.isArray(g.cartItems) && g.cartItems.length > 0
    ),
  };
}


