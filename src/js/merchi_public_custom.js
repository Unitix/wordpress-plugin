import { MERCHI_SDK } from './merchi_sdk';
import { cartEmbed, getCookieByName } from './utils';
import('./merchi_cart_sync.js');

const MERCHI = MERCHI_SDK();
// const site_url = scriptData.site_url

const site_url = '';

// Cookie management system
const COOKIE_MANAGER = {
  // Cookie names
  CART_COOKIE: `cart-${scriptData.merchi_domain}`,
  CART_ID_COOKIE: 'cstCartId',

  // Set cookie with proper domain and path
  setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    const path = 'path=/';
    const domain = window.location.hostname;
    document.cookie = `${name}=${value};${expires};${path};domain=${domain}`;
  },

  // Get cookie value
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  },

  // Remove cookie
  removeCookie(name) {
    this.setCookie(name, '', -1);
  },

  // Clear all cart-related cookies
  clearCartCookies() {
    this.removeCookie(this.CART_COOKIE);
    this.removeCookie(this.CART_ID_COOKIE);
  },

  // Synchronize cookies with localStorage
  syncWithLocalStorage() {
    const merchiCart = localStorage.getItem('MerchiCart');
    if (!merchiCart) {
      this.clearCartCookies();
      return;
    }

    try {
      const cartData = JSON.parse(merchiCart);
      if (cartData.id && cartData.token) {
        this.setCookie(this.CART_COOKIE, `${cartData.id},${cartData.token}`, 1);
        this.setCookie(this.CART_ID_COOKIE, cartData.id, 1);
      } else {
        this.clearCartCookies();
      }
    } catch (error) {
      console.error('Error syncing cookies with localStorage:', error);
      this.clearCartCookies();
    }
  }
};

async function localStorageUpdateCartEnt(cartEnd) {
  const MERCHI = MERCHI_INIT.MERCHI_SDK;
  localStorage.setItem("MerchiCart", JSON.stringify(MERCHI.toJson(cartEnd)));
}

export function cleanVariationJson(v) {
  const {
    variationField = {},
    ...rest
  } = v;

  return {
    ...rest,
    id: undefined,
    variationField: variationField?.id
      ? { id: variationField.id }
      : undefined,
  };
  // const variation = { ...v };
  // variation.variationFiles = v.variationFiles ? v.variationFiles : [];
  // return { ...variation, id: undefined };
}

export function cleanVariationGroupJson(g) {
  const {
    quantity = 0,
    variations = [],
    ...rest
  } = g;
  const _variations = variations.map(cleanVariationJson);
  const _quantity = quantity ? quantity : 0;
  return {
    ...rest,
    quantity: _quantity,
    variations: _variations
  };
}

export async function patchCart(cartJson, embed = cartEmbed) {
  const cleanedCartJson = {
    ...cartJson,
    domain: { id: cartJson.domain.id },
    cartItems: cartJson.cartItems.map(item => ({
      ...item,
      product: { id: item.product.id },
      taxType: item.taxType ? { id: item.taxType.id } : undefined,
      variations: item.variations,
      variationsGroups: (item.variationsGroups || []).map(cleanVariationGroupJson),
    })),
  }
  const cartEnt = MERCHI.fromJson(new MERCHI.Cart(), cleanedCartJson);
  console.log('[patchCart] cleanedCartJson', cleanedCartJson);

  cartEnt.token(cartJson.token);

  // Store the current cart state for potential rollback
  const currentCartState = localStorage.getItem("MerchiCart");

  return new Promise((resolve, reject) => {
    cartEnt.patch(
      (cartEnt) => {
        try {
          const _cartJson = MERCHI.toJson(cartEnt);
          // Update localStorage
          localStorage.setItem("MerchiCart", JSON.stringify(_cartJson));
          // Sync cookies with localStorage
          COOKIE_MANAGER.syncWithLocalStorage();
          resolve(cartEnt);
        } catch (error) {
          // If localStorage update fails, attempt rollback
          if (currentCartState) {
            try {
              localStorage.setItem("MerchiCart", currentCartState);
              COOKIE_MANAGER.syncWithLocalStorage();
            } catch (rollbackError) {
              console.error("Failed to rollback cart state:", rollbackError);
            }
          }
          reject(new Error("Failed to update cart state: " + error.message));
        }
      },
      (status, data) => {
        // If server update fails, attempt rollback
        if (currentCartState) {
          try {
            localStorage.setItem("MerchiCart", currentCartState);
            COOKIE_MANAGER.syncWithLocalStorage();
          } catch (rollbackError) {
            console.error("Failed to rollback cart state:", rollbackError);
          }
        }
        reject(new Error(`Server update failed: ${status} - ${JSON.stringify(data)}`));
      },
      embed
    );
  });
}
// All PATCH requests should now be handled by the backend via send_id_for_add_cart.

function setCookie(name, value, days) {
  COOKIE_MANAGER.setCookie(name, value, days);
}

async function createCart() {
  const domainId = scriptData.merchi_domain;
  const domain = new MERCHI.Domain().id(domainId);
  const cart = new MERCHI.Cart().domain(domain);
  return new Promise((resolve, reject) => {
    cart.create(
      (response) => {
        const c = MERCHI.toJson(response);
        // Set cart data in localStorage
        localStorage.setItem("MerchiCart", JSON.stringify(c));
        // Sync cookies with localStorage
        COOKIE_MANAGER.syncWithLocalStorage();
        resolve(response);
      },
      (status, data) => {
        reject(data);
      },
      cartEmbed
    );
  });
}

export async function getCart(id, token, embed = cartEmbed) {
  const cartEnt = new MERCHI.Cart().id(id).token(token);
  return new Promise((resolve, reject) => {
    cartEnt.get(resolve, (status, data) => reject(data), embed);
  });
}

/**
 * Initializes or synchronizes the Merchi cart.
 * This function assumes that `MERCHI`, `createCart`, `getCart`,
 * and `scriptData` are available in the current scope, likely initialized
 * earlier in `merchi_public_custom.js`.
 *
 * 1. Checks localStorage for an existing cart ('MerchiCart').
 * 2. If no cart in localStorage, calls createCart() to make a new one.
 * 3. If a cart exists in localStorage:
 *    a. Fetches the cart from the server using id/token from localStorage.
 *    b. If fetching fails (e.g., stale data), creates a new cart as a fallback.
 *    c. If fetched cart data differs from localStorage, patches the server cart
 *       with the localStorage data. Updates localStorage with the patched cart.
 *    d. If fetched cart is same as localStorage, uses the fetched/server cart.
 * @returns {Promise<object|null>} A promise that resolves with the Merchi cart entity or null on failure/critical error.
 */
async function initOrSyncCart() {
  // MERCHI, createCart, getCart, scriptData are assumed to be in scope
  if (!MERCHI || !createCart || !getCart || !scriptData) {
    console.error("MERCHI_LOG: Critical dependencies (MERCHI, createCart, getCart, scriptData) not found in scope. Cart initialization failed.");
    return null;
  }

  // Add a lock to prevent concurrent cart operations
  const cartLockKey = 'merchi_cart_operation_lock';
  if (localStorage.getItem(cartLockKey)) {
    console.warn("MERCHI_LOG: Another cart operation is in progress. Waiting...");
    // Wait for a short time and try again
    await new Promise(resolve => setTimeout(resolve, 1000));
    return initOrSyncCart();
  }

  try {
    // Set the lock
    localStorage.setItem(cartLockKey, Date.now().toString());

    const localCartJSONString = localStorage.getItem("MerchiCart");

    if (!localCartJSONString) {
      // CREATE NEW CART No cart in localStorage, create a new one
      try {
        const newCart = await createCart();
        return newCart;
      } catch (error) {
        console.error("MERCHI_LOG: Error during createCart execution:", error);
        return null;
      }
    } else {
      let localCartData;
      try {
        // PARSE LOCAL STORAGE CART DATA
        localCartData = JSON.parse(localCartJSONString);
      } catch (e) {
        // IF ERROR PARSING LOCAL STORAGE CART DATA, CLEAR LOCAL STORAGE AND CREATE NEW CART
        localStorage.removeItem("MerchiCart");
        try {
          const newCart = await createCart();
          return newCart;
        } catch (error) {
          return null;
        }
      }

      // There was an error with the local storage cart data, so we need to create a new cart
      if (!localCartData || !localCartData.id || !localCartData.token) {
        localStorage.removeItem("MerchiCart");
        try {
          const newCart = await createCart();
          console.log("MERCHI_LOG: New cart created after clearing invalid cart data from localStorage.");
          return newCart;
        } catch (error) {
          console.error("MERCHI_LOG: Error during createCart after clearing invalid cart data:", error);
          return null;
        }
      }

      // Get the cart from the server with retry mechanism
      let serverCart;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          serverCart = await getCart(localCartData.id, localCartData.token);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            console.error("MERCHI_LOG: Failed to fetch cart after", maxRetries, "attempts:", error);
            break;
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // If the server cart is not found, we need to create a new cart
      if (!serverCart) {
        localStorage.removeItem("MerchiCart");
        try {
          const newCartFallback = await createCart();
          return newCartFallback;
        } catch (error) {
          console.error("MERCHI_LOG: Error during fallback createCart:", error);
          return null;
        }
      }

      // Server cart fetched successfully
      const serverCartDataForCompare = MERCHI.toJson(serverCart);

      // Compare stringified versions of the local data and server data
      const localCartStringified = JSON.stringify(localCartData);
      const serverCartStringified = JSON.stringify(serverCartDataForCompare);

      if (localCartStringified !== serverCartStringified) {
        try {
          // Use the server version as the source of truth
          const patchedCart = await patchCart(serverCartDataForCompare);
          return patchedCart;
        } catch (error) {
          console.error("MERCHI_LOG: Exception during the cart patch operation:", error);
          // Fallback to the server version if the patch fails
          return serverCart;
        }
      } else {
        return serverCart;
      }
    }
  } finally {
    // Always remove the lock when done
    localStorage.removeItem(cartLockKey);
  }
}

// Example of how it might be called (e.g., on page load or a specific event,
// perhaps within jQuery(document).ready or after MERCHI SDK is confirmed loaded):

jQuery(document).ready(function ($) {
  // Add a flag to track if initOrSyncCart has been called
  if (window.initOrSyncCartCalled) {
    return;
  }
  window.initOrSyncCartCalled = true;

  if (typeof initOrSyncCart === 'function') {
    initOrSyncCart();
  } else {
    console.error('MERCHI_LOG: initOrSyncCart function not defined.');
  }
});

// Function to show success message
function showSuccessMessage() {
  // Remove any existing message
  const existingMessage = document.querySelector('.merchi-success-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create and show new message
  const message = document.createElement('div');
  message.className = 'merchi-success-message';
  message.innerHTML = `
    <span>✓ Product added to cart successfully!</span>
    <a href="${site_url}/cart/">Go to cart</a>
  `;
  document.body.appendChild(message);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Remove message after 5 seconds
  setTimeout(() => {
    message.style.opacity = '0';
    setTimeout(() => message.remove(), 500);
  }, 5000);
}

// document.addEventListener("click", function (event) {
//   var target = event.target;
//   const $button = jQuery('.product-button-add-to-cart');
//   // the observer is used to watch the cart button for a state change on the
//   // disabled attr. We need this because if we mutate the DOM element while
//   // react is in the middle of a state change, the page will crash.
//   const observer = new MutationObserver((mutationsList) => {
//     for (const mutation of mutationsList) {
//       if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
//         // Check if 'disabled' attribute has been removed
//         const isDisabled = mutation.target.hasAttribute('disabled');
//         // When the disabled attr is removed from the button this means that react
//         // has finished with the element; it's now save to use jQuery to change the button
//         if (!isDisabled) {
//           $button.text('Loading...');
//           $button.prop('disabled', true);
//         }
//       }
//     }
//   });

//   if (target?.classList?.contains("product-button-add-to-cart")) {
//     // Ensure target is a valid DOM node before observing
//     if (target instanceof Element) {
//       try {
//         observer.observe(target, { attributes: true });
//       } catch (error) {
//         console.warn('Failed to observe target element:', error);
//         return;
//       }
//     } else {
//       console.warn('Target element is not a valid DOM node');
//       return;
//     }
//     try {
//       setTimeout(function () {
//         // Check if the current page is a single product page
//         // Retrieve the cart cookie to get cart details
//         const cookie = getCookieByName("cart-" + scriptData.merchi_domain);
//         // Parse the cart cookie value
//         const cookieValueArray = cookie.split(",");
//         const id = cookieValueArray[0].trim();
//         const token = cookieValueArray[1].trim();
//         // Create a new Cart instance and fetch the cart details
//         const cartEnt = new MERCHI.Cart().id(id).token(token);
//         cartEnt.get(
//           (cart) => {
//             // Update local storage with cart details
//             localStorageUpdateCartEnt(cart);
//             const cartJson = new MERCHI.toJson(cart);
//             console.log(cartJson);
//             var cartPayload = {};
//             cartPayload["cartId"] = cartJson.id;
//             cartPayload["taxAmount"] = cartJson.taxAmount;
//             cartPayload["cartItems"] = {};
//             // Process each cart item of response
//             cartJson.cartItems.forEach(function (item, itemIndex) {
//               cartPayload["cartItems"][itemIndex] = {
//                 productID: item.product.id,
//                 quantity: item.quantity,
//                 subTotal: item.subtotalCost,
//                 totalCost: item.totalCost,
//               };
//               var obj = {};
//               var objExtras = {};
//               var count = 0;
//               // Process item variations groups if present
//               if (
//                 Array.isArray(item.variationsGroups) &&
//                 item.variationsGroups.length > 0
//               ) {
//                 item.variationsGroups.forEach(function (group, gi) {
//                   cartPayload["cartItems"][itemIndex]["variations"] = [];
//                   cartPayload["cartItems"][itemIndex]["objExtras"] = [];
//                   obj[count] = {};
//                   objExtras[count] = {};
//                   var loopcount = 0;
//                   var varQuant = false;
//                   group.variations.forEach(function (variation, vi) {
//                     if (variation.selectedOptions.length) {
//                       obj[count][vi] = variation.selectedOptions[0].value;
//                     } else if (variation.hasOwnProperty("value")) {
//                       obj[count][vi] = variation.value;
//                     }
//                     varQuant = variation.quantity;
//                     loopcount = vi + 1;
//                   });
//                   objExtras[count][loopcount] = varQuant;
//                   objExtras[count]["quantity"] = varQuant;
//                   count++;
//                   cartPayload["cartItems"][itemIndex]["variations"].push(obj);
//                   cartPayload["cartItems"][itemIndex]["objExtras"].push(
//                     objExtras
//                   );
//                 });
//               }
//               // Process item variations if present
//               if (
//                 Array.isArray(item.variations) &&
//                 item.variations.length > 0
//               ) {
//                 cartPayload["cartItems"][itemIndex]["variations"] = [];
//                 cartPayload["cartItems"][itemIndex]["objExtras"] = [];
//                 obj[count] = {};
//                 objExtras[count] = {};
//                 var loopcount = 0;
//                 var varQuant = false;
//                 item.variations.forEach(function (variation, vi) {
//                   if (variation.selectedOptions.length) {
//                     obj[count][vi] = variation.selectedOptions[0].value;
//                   } else if (variation.hasOwnProperty("value")) {
//                     obj[count][vi] = variation.value;
//                   }
//                   varQuant = variation.quantity;
//                   loopcount = vi + 1;
//                 });
//                 objExtras[count][loopcount] = varQuant;
//                 objExtras[count]["quantity"] = varQuant;
//                 cartPayload["cartItems"][itemIndex]["variations"].push(obj);
//                 cartPayload["cartItems"][itemIndex]["objExtras"].push(
//                   objExtras
//                 );
//               }
//             });
//             // Check if the cart has items
//             if (
//               cartJson.hasOwnProperty("cartItems") &&
//               Array.isArray(cartJson.cartItems) &&
//               cartJson.cartItems.length !== 0
//             ) {
//               // Send cart data to the server using AJAX
//               jQuery.ajax({
//                 method: "POST",
//                 url: frontendajax.ajaxurl,
//                 data: {
//                   action: "send_id_for_add_cart",
//                   item: cartPayload,
//                 },
//                 success: function (response) {
//                   // Show success message
//                   showSuccessMessage();
//                   // On success, restore the original button state
//                   target.parentElement.classList.remove(
//                     "cst-disabled-btn-parent"
//                   );
//                   target.style.display = "block";
//                   // Trigger a refresh of the cart fragments
//                   jQuery(document.body).trigger("wc_fragment_refresh");
//                 },
//                 error: function (error) {
//                   alert("Something went wrong, Please try again later");
//                 },
//               });
//             } else {
//               // If the cart is empty, restore the button state
//               target.parentElement.classList.remove(
//                 "cst-disabled-btn-parent"
//               );
//               target.style.display = "block";
//               target.innerHTML = "Add To Cart";
//             }
//           },
//           (error) => {
//             console.log(error);
//             return null;
//           },
//           cartEmbed
//         );
//       }, 500);
//     } catch (e) {
//       console.error(e);
//     }
//   }
// });

// Function to handle cart item removal
async function handleCartItemRemoval(cartItemKey) {
  const cartLockKey = 'merchi_cart_operation_lock';

  // Check if another cart operation is in progress
  if (localStorage.getItem(cartLockKey)) {
    console.warn("MERCHI_LOG: Another cart operation is in progress. Waiting...");
    // Wait for a short time and try again
    await new Promise(resolve => setTimeout(resolve, 1000));
    return handleCartItemRemoval(cartItemKey);
  }

  try {
    // Set the lock
    localStorage.setItem(cartLockKey, Date.now().toString());

    // Get the current cart from localStorage
    const merchiCart = localStorage.getItem('MerchiCart');
    if (!merchiCart) {
      console.error('No Merchi cart found in localStorage');
      COOKIE_MANAGER.clearCartCookies();
      return;
    }

    const cartJson = JSON.parse(merchiCart);

    // Store the current cart state for potential rollback
    const currentCartState = merchiCart;

    // Filter out the removed item from cartItems
    cartJson.cartItems = cartJson.cartItems.filter(item => item.id !== cartItemKey);

    try {
      // Update the cart using patchCart
      await patchCart(cartJson);

      // If cart is empty, clear both localStorage and cookies
      if (cartJson.cartItems.length === 0) {
        localStorage.removeItem('MerchiCart');
        COOKIE_MANAGER.clearCartCookies();
      }

      // Trigger a refresh of the cart fragments
      jQuery(document.body).trigger("wc_fragment_refresh");
    } catch (error) {
      console.error('Error updating cart:', error);

      // Attempt rollback if the update fails
      try {
        localStorage.setItem('MerchiCart', currentCartState);
        COOKIE_MANAGER.syncWithLocalStorage();
      } catch (rollbackError) {
        console.error('Failed to rollback cart state:', rollbackError);
      }

      // Show error message to user
      jQuery(document.body).trigger('wc_add_to_cart_error', [{
        message: 'Failed to update cart. Please try again.'
      }]);
    }
  } catch (error) {
    console.error('Error handling cart item removal:', error);
    // Show error message to user
    jQuery(document.body).trigger('wc_add_to_cart_error', [{
      message: 'Failed to process cart update. Please try again.'
    }]);
  } finally {
    // Always remove the lock when done
    localStorage.removeItem(cartLockKey);
  }
}

// Add event listener for cart item removal
jQuery(document).on('removed_from_cart', function (event, cartItemKey) {
  handleCartItemRemoval(cartItemKey);
});

// Function to handle Merchi cart item removal response
function handleMerchiCartItemRemoved(response) {
  if (response.success && response.data.event === 'merchi_cart_item_removed') {
    const { item_id, cart_id, cart_length, item_data } = response.data;

    // Get the current cart from localStorage
    const merchiCart = localStorage.getItem('MerchiCart');
    if (!merchiCart) {
      console.error('No Merchi cart found in localStorage');
      return;
    }

    try {
      const cartJson = JSON.parse(merchiCart);

      // Filter out the removed item from cartItems
      cartJson.cartItems = cartJson.cartItems.filter(item => item.id !== item_id);

      // Update the cart using patchCart
      patchCart(cartJson).then(response => {
        if (!response.success) {
          console.error('Error updating cart:', response.error);
          // Show error message to user
          jQuery(document.body).trigger('wc_add_to_cart_error', [{
            message: 'Failed to update cart. Please try again.'
          }]);
          return;
        }

        // If cart is empty, clear localStorage
        if (cart_length <= 1) {
          localStorage.removeItem('MerchiCart');
        }

        // Trigger a refresh of the cart fragments
        jQuery(document.body).trigger("wc_fragment_refresh");
      }).catch(error => {
        console.error('Error updating cart after item removal:', error);
        // Show error message to user
        jQuery(document.body).trigger('wc_add_to_cart_error', [{
          message: 'Failed to update cart. Please try again.'
        }]);
      });
    } catch (error) {
      console.error('Error handling cart item removal:', error);
      // Show error message to user
      jQuery(document.body).trigger('wc_add_to_cart_error', [{
        message: 'Failed to process cart update. Please try again.'
      }]);
    }
  }
}

// Add event listener for the AJAX response
jQuery(document).ajaxSuccess(function (event, xhr, settings) {
  try {
    const response = JSON.parse(xhr.responseText);
    if (response.success && response.data && response.data.event === 'merchi_cart_item_removed') {
      handleMerchiCartItemRemoved(response);
    }
  } catch (error) {
    console.error('Error parsing AJAX response:', error);
  }
});

// Add periodic cookie sync check
setInterval(() => {
  COOKIE_MANAGER.syncWithLocalStorage();
}, 60000); // Check every minute

