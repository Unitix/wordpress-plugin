import { MERCHI_SDK } from './merchi_sdk';
import {
  cartShipmentQuote,
  cartEmbed,
  getCookieByName,
} from './utils';

const stripe = '';
let elements;
const MERCHI = MERCHI_SDK();
// const site_url = scriptData.site_url
const site_url = '';

async function localStorageUpdateCartEnt(cartEnd) {
  const MERCHI = MERCHI_INIT.MERCHI_SDK;
  localStorage.setItem("MerchiCart", JSON.stringify(MERCHI.toJson(cartEnd)));
}

function localStorageDeleteCartEnt() {
  // TODO clear the cart cookie as well
  localStorage.removeItem("MerchiCart");
}

function initializeStripe() {
  var billing_values = frontendajax.billing_values;
  if (!frontendajax.stripeSecret) {
    return false;
  }
  const clientSecret = frontendajax.stripeSecret;
  elements = stripe.elements({ clientSecret });
  const linkAuthenticationElement = elements.create("linkAuthentication");
  linkAuthenticationElement.mount("#link-authentication-element");

  const paymentElementOptions = {
    layout: "tabs",
    defaultValues: {
      billingDetails: {
        email: billing_values ? billing_values.billing_email : "",
      },
    },
    fields: {
      billingDetails: {
        name: "never",
        email: "never",
        phone: "never",
        address: "never",
      },
    },
  };

  const paymentElement = elements.create("payment", paymentElementOptions);
  paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);
  const {
    billing_email = "",
    billing_first_name = "",
    billing_phone = "",
    billing_address_1 = "",
    billing_address_2 = "",
    billing_city = "",
    billing_country = "",
    billing_postcode = "",
    billing_state = "",
  } = frontendajax.billing_values;
  const clientSecret = frontendajax.stripeSecret;
  elems = stripe.elements({ clientSecret });

  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // TODO Make sure to change this to your payment completion page
      return_url: "https://staging.unitix.com.au/checkout/?confirm=yes",
      receipt_email: billing_email,
      payment_method_data: {
        billing_details: {
          email: billing_email,
          name: billing_first_name,
          phone: billing_phone,
          address: {
            line1: billing_address_1,
            line2: billing_address_2,
            city: billing_city,
            country: billing_country,
            postal_code: billing_postcode,
            state: billing_state,
          },
        },
      },
    },
    redirect: "if_required",
  });

  // This point will only be reached if there is an immediate error when
  // confirming the payment. Otherwise, your customer will be redirected to
  // your `return_url`. For some payment methods like iDEAL, your customer will
  // be redirected to an intermediate site first to authorize the payment, then
  // redirected to the `return_url`.
  if (
    error &&
    (error.type === "card_error" || error.type === "validation_error")
  ) {
    showMessage(error.message);
  } else if (paymentIntent && paymentIntent.status === "succeeded") {
    showMessage("Payment succeeded");
    successCallback();
  } else {
    showMessage("An unexpected error occurred.");
  }

  setLoading(false);
}

// Fetches the payment intent status after payment submission
async function checkStatus() {
  const clientSecret = frontendajax.stripeSecret;

  if (!clientSecret) {
    return;
  }

  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

  switch (paymentIntent.status) {
    case "succeeded":
      showMessage("Payment succeeded!");
      break;
    case "processing":
      showMessage("Your payment is processing.");
      break;
    case "requires_payment_method":
      showMessage("Payment method is loading, please wait.");
      break;
    default:
      showMessage("Something went wrong.");
      break;
  }
}

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageContainer.textContent = "";
  }, 4000);
}

// Show a spinner on payment submission
function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#submit").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#submit").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}

// --- DISABLED: All direct PATCH requests to Merchi API must go through backend ---
// The following code is commented out to prevent direct PATCH from browser:
//
// async function updateShipmentMethod(index, quoteIndex) {
//   jQuery(".checkout-navigation .button").attr("disabled", "disabled");
//   const embed = {
//     shipmentGroups: {
//       cartItems: { product: {} },
//       quotes: cartShipmentQuote,
//       selectedQuote: cartShipmentQuote,
//     },
//   };
//   var token = false;
//   var id = false;
//   const cookieValue = getCookieByName("cart-" + scriptData.merchi_domain);
//   if (cookieValue) {
//     const cookieArray = cookieValue.split(",");
//     token = cookieArray[1].trim();
//     id = cookieArray[0].trim();
//   }
//   const cart = new MERCHI.Cart();
//   cart.id(id);
//   cart.token(token);
//   cart.get(
//     (cartEnt) => {
//       const qEnt = cartEnt.shipmentGroups()[index].quotes()[quoteIndex];
//       cartEnt.shipmentGroups()[index].selectedQuote(qEnt, {});
//       cartEnt.patch(
//         (response) => {
//           localStorageUpdateCartEnt(cartEnt);
//           jQuery.ajax({
//             type: "POST",
//             url: frontendajax.ajaxurl,
//             data: {
//               action: "cst_add_shipping",
//               shippingCost: qEnt._totalCost,
//             },
//             success: function (response) {
//               jQuery("body").trigger("update_checkout");
//               jQuery(".checkout-navigation .button").removeAttr("disabled");
//             },
//           });
//         },
//         (error) => console.log(JSON.stringify(error)),
//         embed
//       );
//     },
//     (error) => console.log(JSON.stringify(error)),
//     embed
//   );
// }
//
// export async function patchCart(cartJson, embed = cartEmbed) {
//   const cleanedCartJson = {
//     ...cartJson,
//     domain: {id: cartJson.domain.id},
//     cartItems: cartJson.cartItems.map(item => ({
//       ...item,
//       product: {id: item.product.id},
//       taxType: item.taxType ? {id: item.taxType.id} : undefined,
//       variations: item.variations,
//       variationsGroups: item.variationsGroups,
//     })),
//   }
//   const cartEnt = MERCHI.fromJson(new MERCHI.Cart(), cleanedCartJson);
//   cartEnt.token(cartJson.token);
//   return new Promise((resolve, reject) => {
//     cartEnt.patch((cartEnt) => {
//       const _cartJson = MERCHI.toJson(cartEnt);
//       // save the patched cart to local storage
//       localStorage.setItem("MerchiCart", JSON.stringify(_cartJson));
//       resolve(cartEnt);
//     }, (status, data) => reject(data), embed);
//   });
// }
//
// All PATCH requests should now be handled by the backend via send_id_for_add_cart.

function getQueryStringParameter(name) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(window.location.href);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

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

const successCallback = function () {
  const checkoutForm = jQuery("form.woocommerce-checkout");
  // submit the form now
  checkoutForm.submit();
};

// jQuery(document).ready(function ($) {

//     var groupIndex = 1;

//     $("#add-group-button").on('click', function() {
//         groupIndex++;
//         var newGroup = $(".group-field-set").first().clone();
//         newGroup.attr("data-group-index", groupIndex);
//         newGroup.find(".group-number").text(groupIndex);

//         newGroup.find("input, select, textarea").each(function() {
//             var name = $(this).attr("name");
//             if (name) {
//                 name = name.replace("group_fields[1]", "group_fields[" + groupIndex + "]");
//                 $(this).attr("name", name);
//             }
//         });
//         newGroup.find(".delete-group-button").show();
//         $("#grouped-fields-container").append(newGroup);
//     });

//     $(document).on("click", ".delete-group-button", function() {
//         $(this).closest(".group-field-set").remove();
//         updateGroupNumbers();
//     });

//     function updateGroupNumbers() {
//         $(".group-field-set").each(function(index) {
//             var newIndex = index + 1;
//             $(this).attr("data-group-index", newIndex);
//             $(this).find(".group-number").text(newIndex);
//             $(this).find("input, select, textarea").each(function() {
//                 var name = $(this).attr("name");
//                 if (name) {
//                     name = name.replace(/group_fields\[\d+\]/, "group_fields[" + newIndex + "]");
//                     $(this).attr("name", name);
//                 }
//             });
//         });

//         if ($(".group-field-set").length === 1) {
//             $(".group-field-set .delete-group-button").hide();
//         } else {
//             $(".group-field-set .delete-group-button").show();
//         }
//     });


//   jQuery('.custom-attribute-option').on('click', function () {
//     var parent = jQuery(this).closest('.custom-attribute-options');
//     parent.find('input').prop('checked', false); // Uncheck all
//     parent.find('.custom-checkmark').hide(); // Hide all checkmarks

//     jQuery(this).find('input').prop('checked', true).trigger('change'); // Check the clicked input
//     jQuery(this).find('.custom-checkmark').show(); // Show checkmark
//   });

//   if (1 == getQueryStringParameter("step")) {
//     jQuery("#billing_email").trigger("blur");
//   }

//   jQuery(document).on("cst_clear_cart", function () {
//     //console.log("Cart Cleared!!!");
//   });

//   // Disable button using JavaScript
//   jQuery(document).on("click", ".cst-disabled-btn-parent", function (event) {
//     event.preventDefault(); // Prevents the default click action
//     return false;
//   });

//   const cookieSet = getCookieByName("cart-" + scriptData.merchi_domain);
//   if (!cookieSet) {
//     createCart();
//   }

//   var notice = document.createElement("div"),
//       noticeUl = document.createElement("ul");

//   noticeUl.classList.add("woocommerce-error");
//   noticeUl.setAttribute("role", "alert");
//   notice.classList.add("woocommerce-NoticeGroup");
//   notice.classList.add("woocommerce-NoticeGroup-checkout");
//   jQuery(document).on("click", ".cst-order-place-button", function (e) {
//     e.preventDefault();
//     var isValid = true;
//     var errors = [];
//     // Validate each billing field
//     jQuery('input[name^="billing_"]').each(function () {
//       if (jQuery(this).parents("p.form-row").hasClass("validate-required")) {
//         if (jQuery(this).val() === "") {
//           // Show error message for empty field
//           var fieldName = jQuery(this).attr("data-cstname");
//           errors.push(fieldName);
//           isValid = false;
//         } else {
//           // Clear error message if field is filled
//           var fieldName = jQuery(this).attr("name");
//           var index = errors.indexOf(fieldName);
//           if (index !== -1) {
//             errors.splice(index, 1); // Remove error message from array
//           }
//         }
//       }
//     });
//     if (!isValid && errors.length > 0) {
//       errors.forEach(function (error) {
//         var noticeLi = document.createElement("li");
//         var noticeStrong = document.createElement("strong");
//         noticeLi.append(noticeStrong);
//         noticeStrong.innerHTML = error;
//         noticeLi.append(" is a required field");
//         noticeUl.append(noticeLi);
//       });
//       notice.append(noticeUl);
//       document.querySelector(".woocommerce-notices-wrapper").prepend(notice);
//     } else {
//       jQuery(".cst-stripe-payment-button").trigger("click");
//       return false;
//     }
//   });

//   jQuery(document.body).on("updated_checkout", function () {
//     var paymentForm = document.querySelector("#payment-form");
//     if (paymentForm) {
//       initializeStripe();
//       checkStatus();
//       paymentForm.addEventListener("submit", handleSubmit);
//     }
//   });

//   var ccode = false;
//   $(document.body).on("updated_checkout", function (data) {
//     var ajax_url = frontendajax.ajaxurl,
//         ajax_data = {
//           action: "append_country_prefix_in_billing_phone",
//           country_code: $("#billing_country").val(),
//         };
//     $.post(ajax_url, ajax_data, function (response) {
//       ccode = response;
//       $("#billing_phone").val(response);
//       $("#billing_phone").keydown(function (e) {
//         var oldvalue = frontendajax.telephoneInput
//           ? frontendajax.telephoneInput
//           : $(this).val();
//         var field = this;
//         setTimeout(function () {
//           if (field.value.indexOf(ccode) !== 0) {
//             $(field).val(oldvalue);
//           }
//         }, 1);
//       });
//     });
//   }); 

//   document.addEventListener("click", function (event) {
//     var target = event.target;
//     const $button = jQuery('.product-button-add-to-cart');
//     // the observer is used to watch the cart button for a state change on the
//     // disabled attr. We need this because if we mutate the DOM element while
//     // react is in the middle of a state change, the page will crash.
//     const observer = new MutationObserver((mutationsList) => {
//       for (const mutation of mutationsList) {
//         if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
//           // Check if 'disabled' attribute has been removed
//           const isDisabled = mutation.target.hasAttribute('disabled');
//           // When the disabled attr is removed from the button this means that react
//           // has finished with the element; it's now save to use jQuery to change the button
//           if (!isDisabled) {
//             $button.text('Loading...');
//             $button.prop('disabled', true);
//           }
//         }
//       }
//     });

//     if (target?.classList?.contains("product-button-add-to-cart")) {
//       // Ensure target is a valid DOM node before observing
//       if (target instanceof Element) {
//         try {
//           observer.observe(target, { attributes: true });
//         } catch (error) {
//           console.warn('Failed to observe target element:', error);
//           return;
//         }
//       } else {
//         console.warn('Target element is not a valid DOM node');
//         return;
//       }
//       try {
//         setTimeout(function () {
//           // Check if the current page is a single product page
//           if (scriptData.is_single_product) {
//             // Retrieve the cart cookie to get cart details
//             const cookie = getCookieByName("cart-" + scriptData.merchi_domain);
//            // Parse the cart cookie value
//             const cookieValueArray = cookie.split(",");
//             const id = cookieValueArray[0].trim();
//             const token = cookieValueArray[1].trim();
//              // Create a new Cart instance and fetch the cart details
//             const cartEnt = new MERCHI.Cart().id(id).token(token);
//             cartEnt.get(
//               (cart) => {
//                 // Update local storage with cart details
//                 localStorageUpdateCartEnt(cart);
//                 const cartJson = new MERCHI.toJson(cart);
//                 console.log(cartJson);
//                 var cartPayload = {};
//                 cartPayload["cartId"] = cartJson.id;
//                 cartPayload["taxAmount"] = cartJson.taxAmount;
//                 cartPayload["cartItems"] = {};
//                 // Process each cart item of responce
//                 cartJson.cartItems.forEach(function (item, itemIndex) {
//                   cartPayload["cartItems"][itemIndex] = {
//                     productID: item.product.id,
//                     quantity: item.quantity,
//                     subTotal: item.subtotalCost,
//                     totalCost: item.totalCost,
//                   };
//                   var obj = {};
//                   var objExtras = {};
//                   var count = 0;
//                    // Process item variations groups if present
//                   // Get the selected value of responce and assing in cartPayload array
//                   if (
//                     Array.isArray(item.variationsGroups) &&
//                     item.variationsGroups.length > 0
//                   ) {
//                     item.variationsGroups.forEach(function (group, gi) {
//                       cartPayload["cartItems"][itemIndex]["variations"] = [];
//                       cartPayload["cartItems"][itemIndex]["objExtras"] = [];
//                       obj[count] = {};
//                       objExtras[count] = {};
//                       var loopcount = 0;
//                       var varQuant = false;
//                       group.variations.forEach(function (variation, vi) {
//                         if (variation.selectedOptions.length) {
//                           obj[count][vi] = variation.selectedOptions[0].value;
//                         } else if (variation.hasOwnProperty("value")) {
//                           obj[count][vi] = variation.value;
//                         }
//                         varQuant = variation.quantity;
//                         loopcount = vi + 1;
//                       });
//                       objExtras[count][loopcount] = varQuant;
//                       objExtras[count]["quantity"] = varQuant;
//                       count++;
//                       cartPayload["cartItems"][itemIndex]["variations"].push(obj);
//                       cartPayload["cartItems"][itemIndex]["objExtras"].push(
//                         objExtras
//                       );
//                     });
//                   } 
//                   // Process item variations if present
//                   // Get the selected value of responce and assing in cartPayload array
//                   if (
//                     Array.isArray(item.variations) &&
//                     item.variations.length > 0
//                   ) {
//                     cartPayload["cartItems"][itemIndex]["variations"] = [];
//                     cartPayload["cartItems"][itemIndex]["objExtras"] = [];
//                     obj[count] = {};
//                     objExtras[count] = {};
//                     var loopcount = 0;
//                     var varQuant = false;
//                     item.variations.forEach(function (variation, vi) {
//                       if (variation.selectedOptions.length) {
//                         obj[count][vi] = variation.selectedOptions[0].value;
//                       } else if (variation.hasOwnProperty("value")) {
//                         obj[count][vi] = variation.value;
//                       }
//                       varQuant = variation.quantity;
//                       loopcount = vi + 1;
//                     });
//                     objExtras[count][loopcount] = varQuant;
//                     objExtras[count]["quantity"] = varQuant;
//                     cartPayload["cartItems"][itemIndex]["variations"].push(obj);
//                     cartPayload["cartItems"][itemIndex]["objExtras"].push(
//                       objExtras
//                     );
//                   }
//                 });
//                 // Check if the cart has items
//                 if (
//                   cartJson.hasOwnProperty("cartItems") &&
//                   Array.isArray(cartJson.cartItems) &&
//                   cartJson.cartItems.length !== 0
//                 ) {
//                   //$('#overlay').show(); // Show overlay
//                   //$('#product-loader').show(); // Show loader
//                   // Send cart data to the server using AJAX
//                   jQuery.ajax({
//                     method: "POST",
//                     url: frontendajax.ajaxurl,
//                     data: {
//                       action: "send_id_for_add_cart",
//                       item: cartPayload,
//                     },
//                     success: function (response) {
//                       window.location.href = site_url + '/cart/';
//                       // On success, restore the original button state
//                       target.parentElement.classList.remove(
//                         "cst-disabled-btn-parent"
//                       );
//                       target.style.display = "block";
//                       clonedElement.remove();
//                       // Trigger a refresh of the cart fragments
//                       jQuery(document.body).trigger("wc_fragment_refresh");
//                       setTimeout(function () {
//                         // Redirect to the cart page after a short delay
//                         jQuery(document.body).trigger("wc_fragment_refresh");
//                         window.location.href = site_url + '/cart/';
//                       }, 500);
//                       //$('#overlay').hide(); // Show overlay
//                       //$('#product-loader').hide(); // Show loader
//                     },
//                     error: function (error) {
//                       // On error, show an alert to the user
//                       //$('#overlay').hide(); // Show overlay
//                       //$('#product-loader').hide(); // Show loader
//                       alert("Something went wrong, Please try again later");
//                     },
//                   });
//                 } else {
//                   // If the cart is empty, restore the button state
//                   target.parentElement.classList.remove(
//                     "cst-disabled-btn-parent"
//                   );
//                   target.style.display = "block";
//                   target.innerHTML = "Add To Cart";
//                   clonedElement.remove();
//                 }
//               },
//               (error) => {
//                 // Handle errors from fetching cart details
//                 console.log(error);
//                 return null;
//               },
//               cartEmbed
//             );
//           }
//         }, 500); // Simulate a delay
//       } catch (e) {
//         console.error(e)
//       }
//     }
//   });

//   jQuery(document).on("click", ".remove.remove-product", function (e) {
//     e.preventDefault();
//     var $this = jQuery(this);
//     var item_id = $this.data("cart_id");
//     var classes = $this.parents(".cart_item").attr("class");
//     classes = classes.split(" ");
//     classes = classes[2].split("_");
//     var actual_pos = parseInt(classes[2]);
//     $this.closest("li").find(".ajax-loading").show();
//     const cookieValue = getCookieByName("cart-" + scriptData.merchi_domain);
//     jQuery.ajax({
//       type: "POST",
//       dataType: "json",
//       url: theme.ajax_url,
//       data: {
//         action: "cst_cart_item_after_remove",
//         item_id: item_id,
//         cart_length: jQuery(".cst_cart_item").length,
//       },
//       success: function (response) {
//         if (
//           1 == jQuery(".cst_cart_item").length ||
//           0 == jQuery(".cst_cart_item").length
//         ) {
//           localStorageDeleteCartEnt();
//         }
//         const cookieArray = cookieValue.split(",");
//         const id = cookieArray[0].trim();
//         const token = cookieArray[1].trim();
//         const MERCHI = MERCHI_INIT.MERCHI_SDK;
//         const cart = new MERCHI.Cart();
//         const variationsEmbed = {
//           selectedOptions: {},
//           variationField: {
//             options: {
//               linkedFile: {},
//               variationCostDiscountGroup: {},
//               variationUnitCostDiscountGroup: {},
//             },
//             variationCostDiscountGroup: {},
//             variationUnitCostDiscountGroup: {},
//           },
//           variationFiles: {},
//         };

//         const variationsGroupsEmbed = {
//           variations: variationsEmbed,
//         };
//         const embedd = {
//           receiverAddress: {},
//           client: {},
//           cartItems: {
//             product: {},
//             variations: variationsEmbed,
//             variationsGroups: variationsGroupsEmbed,
//           },
//         };
//         cart.id(id);
//         cart.token(token);
//         cart.get(
//           (data) => {
//             var ccart = data;
//             var cartItems = ccart.cartItems();
//             cartItems.splice(actual_pos, 1);
//             ccart.cartItems(cartItems);
//             ccart.patch(
//               (response) => {},
//               (status, data) => console.log(`Error ${status}: ${data}`),
//               undefined,
//               5
//             );
//           },
//           (error) => console.log(JSON.stringify(error)),
//           embedd
//         );
//       },
//     });
//   });
// });


async function createCart() {
  const domainId = scriptData.merchi_domain; // TODO REMOCE THIS WHEN DONE
  const domain = new MERCHI.Domain().id(domainId);
  const cart = new MERCHI.Cart().domain(domain);
  return new Promise((resolve, reject) => {
    cart.create(
      (response) => {
        const c = MERCHI.toJson(response);
        // Set cart cookie here
        setCookie("cart-" + scriptData.merchi_domain, c.id + "," + c.token, 1);
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
  // ... other existing ready code ...
  if (typeof initOrSyncCart === 'function') {
    initOrSyncCart();
  } else {
    console.error('MERCHI_LOG: initOrSyncCart function not defined.');
  }
});

// UI handler for updating shipment method via AJAX to backend
export function updateShipmentMethod(index, quoteIndex) {
  showCartLoader();
  const data = {
    action: "update_shipment_method",
    shipment_group_index: index,
    quote_index: quoteIndex
  };
  
  jQuery.ajax({
    type: "POST",
    url: frontendajax.ajaxurl,
    data: data,
    success: function(response) {
      hideCartLoader();
      if (response.success) {
        // Update UI with new cart data
        if (response.cart) {
          updateCartDisplay(response.cart);
          // Trigger WooCommerce update if needed
          jQuery("body").trigger("update_checkout");
        }
      } else {
        console.error("Failed to update shipment method:", response.error);
        alert("Failed to update shipment method. Please try again.");
      }
    },
    error: function(xhr, status, error) {
      hideCartLoader();
      console.error("Error updating shipment method:", error);
      alert("Error updating shipment method. Please try again.");
    }
  });
}

// UI handler for patching the cart via AJAX to backend
export function patchCartAJAX(cartPayload) {
  showCartLoader();
  
  // Ensure payload matches Merchi's structure
  const merchiPayload = {
    cartItems: cartPayload.cartItems ? cartPayload.cartItems.map(item => ({
      id: item.id,
      productID: item.product.id,
      quantity: item.quantity,
      variations: item.variations || [],
      objExtras: item.objExtras || []
    })) : [],
    shipmentGroups: cartPayload.shipmentGroups || []
  };
  
  jQuery.ajax({
    type: "POST",
    url: frontendajax.ajaxurl,
    data: {
      action: "patch_merchi_cart",
      cart: merchiPayload
    },
    success: function(response) {
      hideCartLoader();
      if (response.success) {
        // Update UI with new cart data
        if (response.cart) {
          updateCartDisplay(response.cart);
          // Save to localStorage if needed
          localStorage.setItem("MerchiCart", JSON.stringify(response.cart));
        }
      } else {
        console.error("Failed to update cart:", response.error);
        alert("Failed to update cart. Please try again.");
      }
    },
    error: function(xhr, status, error) {
      hideCartLoader();
      console.error("Error updating cart:", error);
      alert("Error updating cart. Please try again.");
    }
  });
}

// Helper function to update cart display
function updateCartDisplay(cart) {
  // Update cart count
  const cartCount = document.getElementById('cart-count');
  if (cartCount && cart.cartItems) {
    const totalItems = cart.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
  }
  
  // Update cart items list if it exists
  const cartItemsList = document.getElementById('cart-items-list');
  if (cartItemsList && cart.cartItems) {
    // Clear existing items
    cartItemsList.innerHTML = '';
    
    // Add new items
    cart.cartItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.innerHTML = `
        <span class="item-name">${item.product.name || 'Product'}</span>
        <span class="item-quantity">x${item.quantity}</span>
        <span class="item-price">$${item.totalCost.toFixed(2)}</span>
      `;
      cartItemsList.appendChild(itemElement);
    });
  }
  
  // Update total cost if element exists
  const totalCost = document.getElementById('cart-total-cost');
  if (totalCost && cart.totalCost !== undefined) {
    totalCost.textContent = `$${cart.totalCost.toFixed(2)}`;
  }
}

// Helper functions for loader and cart display (implement as needed)
function showCartLoader() {
  // Show a loader/spinner with id 'cart-loader'
  const loader = document.getElementById('cart-loader');
  if (loader) loader.style.display = 'block';
}
function hideCartLoader() {
  // Hide the loader/spinner with id 'cart-loader'
  const loader = document.getElementById('cart-loader');
  if (loader) loader.style.display = 'none';
}


