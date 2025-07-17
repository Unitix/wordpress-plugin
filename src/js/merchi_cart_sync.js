// import { patchCart } from './merchi_public_custom.js';

const PATCH_DISABLED = false;

// SKU Filtering && clear cart Logic
async function reconcileMerchiWithStore({ items }) {
  if (!Array.isArray(items)) return;

  // woo cart empty: sync clear merchi cart
  if (items.length === 0) {
    const raw = localStorage.getItem('MerchiCart');
    if (!raw) return;
    const merchi = JSON.parse(raw);
    if (merchi.cartItems.length === 0) return;

    merchi.cartItems = [];
    merchi.cartItemsSubtotalCost = 0;
    merchi.cartItemsTaxAmount = 0;
    merchi.cartItemsTotalCost = 0;
    localStorage.setItem('MerchiCart', JSON.stringify(merchi));
    try {
      window.COOKIE_MANAGER?.syncWithLocalStorage?.();
    } catch (error) {
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

  merchi.cartItemsSubtotalCost = merchi.cartItems.reduce(
    (s, i) => s + (i.subtotalCost ?? i.cost ?? 0), 0);
  merchi.cartItemsTotalCost = merchi.cartItems.reduce(
    (s, i) => s + (i.totalCost ?? i.subtotalCost ?? i.cost ?? 0), 0);
  merchi.cartItemsTaxAmount = merchi.cartItems.reduce(
    (s, i) => s + (i.taxAmount ?? 0), 0);

  localStorage.setItem('MerchiCart', JSON.stringify(merchi));
  try {
    window.COOKIE_MANAGER?.syncWithLocalStorage?.();
  } catch (error) {
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
    reconcileMerchiWithStore({ items: [] });
    prevLen = 0;
    lastSignature = '';
    return;
  }

  const sig = JSON.stringify(items.map(i => [i.sku, i.quantity]).sort());
  if (sig !== lastSignature) {
    lastSignature = sig;
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
