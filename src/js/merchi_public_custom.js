import { MERCHI_SDK } from './merchi_sdk';
import { cartEmbed, getCookieByName } from './utils';

const MERCHI = MERCHI_SDK();
// const site_url = scriptData.site_url

const site_url = '';

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
  return new Promise((resolve, reject) => {
    cartEnt.patch((cartEnt) => {
      const _cartJson = MERCHI.toJson(cartEnt);
      // save the patched cart to local storage
      localStorage.setItem("MerchiCart", JSON.stringify(_cartJson));
      resolve(cartEnt);
    }, (status, data) => reject(data), embed);
  });
}

// All PATCH requests should now be handled by the backend via send_id_for_add_cart.

function setCookie(name, value, days) {
  var ajax_url = frontendajax.ajaxurl;
  var ajax_data = {
    action: "cst_remove_cookie",
    cookieName: name,
  };
  jQuery.post(ajax_url, ajax_data, function (response) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
  });
}

async function createCart() {
  const domainId = scriptData.merchi_domain;
  const domain = new MERCHI.Domain().id(domainId);
  const cart = new MERCHI.Cart().domain(domain);
  return new Promise((resolve, reject) => {
    cart.create(
      (response) => {
        const c = MERCHI.toJson(response);
        // Set cart cookie here. The cart cookie is a combo od the cart id and the cart token.
        setCookie("cart-" + scriptData.merchi_domain, `${c.id},${c.token}`, 1);
        localStorage.setItem("MerchiCart", JSON.stringify(c));
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

    // Get the cart from the server
    let serverCart;
    try {
      // Assuming getCart uses default embed options if third param is null/undefined.
      serverCart = await getCart(localCartData.id, localCartData.token);
    } catch (error) {
      console.error("MERCHI_LOG: Exception occurred while calling getCart:", error);
    }

    // If the server cart is not found, we need to create a new cart
    if (!serverCart) {
      localStorage.removeItem("MerchiCart");
      // Consider clearing cookie
      try {
        const newCartFallback = await createCart();
        return newCartFallback;
      } catch (error) {
        console.error("MERCHI_LOG: Error during fallback createCart:", error);
        return null;
      }
    }

    // Server cart fetched successfully. getCart should have updated localStorage.
    const serverCartDataForCompare = MERCHI.toJson(serverCart); // Get plain JS object from server cart entity

    // Compare stringified versions of the local data (parsed from storage) and server data (from toJson)
    const localCartStringified = JSON.stringify(localCartData); // localCartData is already a JS object
    const serverCartStringified = JSON.stringify(serverCartDataForCompare);

    if (localCartStringified !== serverCartStringified) {
      // IF the local cart data is different from the server cart data, we need to patch the server cart
      // Ensure id and token are on the entity for the patch.
      // MERCHI.fromJson should handle this. If not, one might need:
      // cartEntityToPatch.id(localCartData.id).token(localCartData.token);

      try {
        // Promisify the patch call
        const patchedCart = await patchCart(localCartData);
        return patchedCart;
      } catch (error) {
         console.error("MERCHI_LOG: Exception during the cart patch operation promise:", error);
         // Fallback to the server version if the patch call itself (promisified part) fails.
         return serverCart; 
      }

    } else {
      // getCart should have updated localStorage with serverCart's data.
      return serverCart;
    }
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

jQuery(document).ready(function($) {
  // Listen for cart item removal
  $(document.body).on('removed_from_cart', function(event, fragments, cart_hash, $button) {
      // const cartItemKey = $button.data('cart_item_key');
      // const cartLength = Object.keys(fragments['div.widget_shopping_cart_content'] || {}).length;
      
      // // Make AJAX call to our custom endpoint
      // $.ajax({
      //     url: scriptData.ajaxurl,
      //     type: 'POST',
      //     data: {
      //         action: 'cst_cart_item_after_remove',
      //         item_id: cartItemKey,
      //         cart_length: cartLength
      //     },
      //     success: function(response) {
      //         console.log('Cart item removed:', response);
      //         // Handle any additional actions after successful removal
      //     },
      //     error: function(xhr, status, error) {
      //         console.error('Error removing cart item:', error);
      //     }
      // });
      console.log('cart was removed....');
  });
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
