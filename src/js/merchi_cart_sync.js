import { patchCart } from './merchi_public_custom.js';

const PATCH_DISABLED = false;

function logCartCounts(label = '') {
  try {
    const merchiLen = JSON.parse(localStorage.MerchiCart || '{}')
      .cartItems?.length ?? 'N/A';
    const wooLen = JSON.parse(localStorage.storeApiCartData || '{}')
      .items?.length ?? 'N/A';
    console.log(`[MerchiSync] ${label}  MerchiCart:${merchiLen}  storeApiCartData:${wooLen}`);
  } catch (e) {
    console.warn('[MerchiSync] logCartCounts error:', e);
  }
}

// SKU Filtering && clear cart Logic
function reconcileMerchiWithStore({ items }) {
  if (!Array.isArray(items)) return;

  // woo cart empty: sync clear merchi cart
  if (items.length === 0) {
    const raw = localStorage.getItem('MerchiCart');
    if (!raw) return;
    const merchi = JSON.parse(raw);
    if (merchi.cartItems.length === 0) return;

    merchi.cartItems = [];
    localStorage.setItem('MerchiCart', JSON.stringify(merchi));
    try { window.COOKIE_MANAGER?.syncWithLocalStorage?.(); } catch { }
    console.log('[MerchiSync] after reconcile (cart emptied)');
    logCartCounts('after reconcile');
    if (!PATCH_DISABLED) {
      patchCart(merchi)
        .then(() => console.log('[MerchiSync] PATCH OK - cart emptied'))
        .catch(e => console.warn('[MerchiSync] patchCart error:', e.response?.status || e));
    }
    return;
  }

  // woo cart has items: filter by sku
  const raw = localStorage.getItem('MerchiCart');
  if (!raw) return;
  const merchi = JSON.parse(raw);

  const wooSkus = new Set(items.map(i => String(i.sku)));
  const before = merchi.cartItems.length;
  merchi.cartItems = merchi.cartItems.filter(ci =>
    wooSkus.has(String(ci.product?.id))
  );
  if (merchi.cartItems.length === before) return;

  localStorage.setItem('MerchiCart', JSON.stringify(merchi));
  try { window.COOKIE_MANAGER?.syncWithLocalStorage?.(); } catch { }
  console.log('[MerchiSync] after reconcile');
  logCartCounts('after reconcile');
  if (!PATCH_DISABLED) {
    patchCart(merchi)
      .then(() => console.log('[MerchiSync] PATCH OK - items filtered'))
      .catch(e => console.warn('[MerchiSync] patchCart error:', e.response?.status || e));
  }
}

let lastSignature = '';
let prevLen = 0;

setInterval(() => {
  const woo = JSON.parse(localStorage.storeApiCartData || '{}');
  const items = Array.isArray(woo.items) ? woo.items : [];
  const len = items.length;

  // first load && woo not written yet: skip
  if (prevLen === 0 && len === 0) return;

  // woo has items && now empty: clear merchi cart
  if (len === 0 && prevLen > 0) {
    console.log('[POLL] Woo items len = 0 → empty cart');
    reconcileMerchiWithStore({ items: [] });
    prevLen = 0;
    lastSignature = '';
    return;
  }

  const sig = JSON.stringify(items.map(i => [i.sku, i.quantity]).sort());
  if (sig !== lastSignature) {
    lastSignature = sig;
    console.log('[POLL] Woo items len =', len);
    reconcileMerchiWithStore({ items });
  }
  prevLen = len;
}, 300);

document.addEventListener('wc-blocks_removed_from_cart', () =>
  reconcileMerchiWithStore(
    JSON.parse(localStorage.storeApiCartData || '{}')
  )
);

jQuery(document.body).on('removed_from_cart', () =>
  reconcileMerchiWithStore(
    JSON.parse(localStorage.storeApiCartData || '{}')
  )
);
