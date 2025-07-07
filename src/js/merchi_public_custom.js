import { MERCHI_SDK } from './merchi_sdk';
import { cartEmbed } from './utils';

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

export async function patchCart(cartJson, embed = cartEmbed) {
  const cleanedCartJson = {
    ...cartJson,
    domain: {id: cartJson.domain.id},
    cartItems: cartJson.cartItems.map(item => ({
      ...item,
      product: {id: item.product.id},
      taxType: item.taxType ? {id: item.taxType.id} : undefined,
      variations: item.variations,
      variationsGroups: item.variationsGroups,
    })),
  }
  const cartEnt = MERCHI.fromJson(new MERCHI.Cart(), cleanedCartJson);
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

// Add periodic cookie sync check
setInterval(() => {
  COOKIE_MANAGER.syncWithLocalStorage();
}, 60000); // Check every minute
