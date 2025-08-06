// import { patchCart } from './merchi_public_custom.js';

const PATCH_DISABLED = false;

const fpWoo = (it) => {
  const vars = {};
  (it.item_data || []).forEach(d => {
    // if (d?.name && d?.value && d.name !== 'Quantity') {
    //   vars[d.name.trim().toLowerCase()] = String(d.value).trim().toLowerCase();
    // }
    if (d?.name && d?.value) {
      vars[d.name.trim().toLowerCase().replace(/\s+/g, ' ')] =
        String(d.value).trim().toLowerCase();
    }
  });
  return [
    String(it.sku),
    String(it.quantity ?? 1),
    JSON.stringify(Object.entries(vars).sort())
  ].join('|');
};

const fpMerchi = (ci) => {
  const vars = {};
  (ci.variationsGroups || []).forEach(g =>
    (g.variations || []).forEach(v => {
      // const n = v?.variationField?.name ?? v?.variationField?.id ?? '';
      const field = v?.variationField || {};
      const n = field.label ?? field.labelText ?? field.name ?? field.id ?? '';
      if (n) vars[n.trim().toLowerCase()] = String(v.value).trim().toLowerCase();
    })
  );
  return [
    String(ci.product?.id),
    String(ci.quantity ?? 1),
    JSON.stringify(Object.entries(vars).sort())
  ].join('|');
};

function reorderIfNeeded(wooItems, merchi) {
  const buckets = {};
  (merchi.cartItems || []).forEach(ci => {
    const fp = fpMerchi(ci);
    (buckets[fp] ||= []).push(ci);
  });

  const aligned = [];
  for (const w of wooItems) {
    const fp = fpWoo(w);
    if (buckets[fp]?.length) {
      aligned.push(buckets[fp].shift());
    } else {
      const skuQty = `${w.sku}|${w.quantity ?? 1}`;
      const k = Object.keys(buckets).find(k => k.startsWith(skuQty) && buckets[k].length);
      if (k) aligned.push(buckets[k].shift());
      else return false;
    }
  }
  merchi.cartItems = aligned;
  return true;
}

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

  // const wooSkus = new Set(items.map(i => String(i.sku)));
  if (!Array.isArray(merchi.cartItems)) merchi.cartItems = [];

  // const fpQuota = (items || []).reduce((acc, it) => {
  //   const fp = fpWoo(it);
  //   acc[fp] = (acc[fp] || 0) + 1;
  //   return acc;
  // }, {});

  const before = merchi.cartItems.length;

  if (before > items.length) {
    // merchi.cartItems = merchi.cartItems.slice(0, items.length);
    const buckets = {};
    (merchi.cartItems || []).forEach(ci => {
      const fp = fpMerchi(ci);
      (buckets[fp] ||= []).push(ci);
    });

    const newCart = [];
    (items || []).forEach(w => {
      const fp = fpWoo(w);
      if (buckets[fp]?.length) {
        newCart.push(buckets[fp].shift());
      } else {
        const skuQty = String(w.sku) + '|' + String(w.quantity ?? 1);
        const anyKey = Object.keys(buckets).find(k =>
          k.startsWith(skuQty) && buckets[k].length
        );
        if (anyKey) newCart.push(buckets[anyKey].shift());
      }
    });

    merchi.cartItems = newCart;
  } else if (before === items.length) {
    reorderIfNeeded(items, merchi);
  }

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
