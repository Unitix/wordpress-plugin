
// export function fixStoreApiCartData() {
//   const key = 'storeApiCartData';
//   const raw = localStorage.getItem(key);
//   console.log('[CartFix] Starting fixStoreApiCartData');

//   if (!raw) {
//     console.log('[CartFix] No storeApiCartData found in localStorage');
//     return;
//   }

//   let cart;
//   try {
//     cart = JSON.parse(raw);
//   } catch (e) {
//     console.warn('Failed to parse storeApiCartData', e);
//     return;
//   }

//   if (!cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
//     console.log('No items found in cart');
//     return;
//   }

//   let totalItemsIncTax = 0;
//   cart.items.forEach((item, index) => {
//     console.log(`[CartFix] Processing item ${index}:`, item);

//     const p = item.prices;
//     const t = item.totals;

//     console.log(`[CartFix] Item ${index} before fix - price: ${p.price}, sale_price: ${p.sale_price}, regular_price: ${p.regular_price}`);

//     const incTax = Number(p.regular_price);
//     const qty = Number(item.quantity) || 1;
//     const line = incTax * qty;

//     // fix price
//     p.price = String(incTax);
//     p.sale_price = String(incTax);

//     if (p.raw_prices) {
//       p.raw_prices.price = String(incTax * 10000);
//       p.raw_prices.sale_price = String(incTax * 10000);
//     }

//     t.line_subtotal = String(line);
//     t.line_subtotal_tax = "0";
//     t.line_total = String(line);
//     t.line_total_tax = "0";

//     console.log(`[CartFix] Item ${index} after fix - price: ${p.price}, sale_price: ${p.sale_price}, regular_price: ${p.regular_price}`);

//     totalItemsIncTax += line;
//   });

//   const ct = cart.totals;
//   ct.total_items = String(totalItemsIncTax);
//   ct.total_price = String(totalItemsIncTax);
//   ct.total_items_tax = "0";
//   ct.total_tax = "0";

//   console.log('[CartFix] Updated cart totals:', ct);
//   localStorage.setItem(key, JSON.stringify(cart));

//   // 
//   // const savedData = localStorage.getItem(key);
//   // const savedCart = JSON.parse(savedData);
//   // console.log('[CartFix] Verification - saved cart items:', savedCart.items.map(item => ({
//   //   price: item.prices.price,
//   //   sale_price: item.prices.sale_price,
//   //   regular_price: item.prices.regular_price
//   // })));

//   try {
//     // trigger a storage event, let other components know the data has been updated
//     window.dispatchEvent(new StorageEvent('storage', {
//       key: key,
//       oldValue: raw,
//       newValue: JSON.stringify(cart),
//       storageArea: localStorage
//     }));
//     console.log('[CartFix] Dispatched storage event');

//     // trigger WooCommerce event
//     if (window.jQuery) {
//       window.jQuery(document.body).trigger('wc_fragment_refresh');
//       console.log('[CartFix] Triggered wc_fragment_refresh');
//     }
//   } catch (error) {
//     console.warn('[CartFix] Error triggering events:', error);
//   }
// }
