const stripe = Stripe(scriptData.merchi_stripe_api_key);
let elements;
const MERCHI = MERCHI_INIT.MERCHI_SDK;
const site_url = scriptData.site_url
//  console.log(site_url+'/cart');

const cartShipmentQuote = {
  shipmentMethod: { originAddress: {}, taxType: {} },
};

const optionsEmbed = {
  options: {
    linkedFile: {},
    variationCostDiscountGroup: {},
    variationUnitCostDiscountGroup: {},
  },
  variationCostDiscountGroup: {},
  variationUnitCostDiscountGroup: {},
};

const variationsEmbed = {
  selectedOptions: {},
  variationField: optionsEmbed,
  variationFiles: {},
};

const variationsGroupsEmbed = {
  variations: variationsEmbed,
};

const productWithImagesEmbed = {
  domain: { company: { defaultTaxType: {}, taxTypes: {} } },
  featureImage: {},
  groupVariationFields: { options: { linkedFile: {} } },
  images: {},
  independentVariationFields: { options: { linkedFile: {} } },
  taxType: {},
};

const cartEmbed = {
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
};

function makeMerchiCartEnt(data) {
  if (Array.isArray(data)) {
    const entities = data.map((v) => makeMerchiJsEnt("cart", v));
    return entities;
  }
  return MERCHI.fromJson(new MERCHI.Cart(), data);
}

async function createCart() {
  const domainId = scriptData.merchi_domain; // TODO REMOCE THIS WHEN DONE
  const domain = new MERCHI.Domain().id(domainId);
  const cart = new MERCHI.Cart().domain(domain);
  return cart.create(
    (response) => {
      const c = MERCHI.toJson(response);
      // Set cart cookie here
      setCookie("cart-" + scriptData.merchi_domain, c.id + "," + c.token, 1);
      localStorage.setItem("MerchiCart", JSON.stringify(c));
      return response;
    },
    (status, data) => {
      console.log(`Error ${status}: ${data}`);
      return null;
    },
    cartEmbed
  );
}

function getCartEnt(id, token, embed) {
  const cartEnt = new MERCHI.Cart().id(id).token(token);
  return cartEnt;
}

async function getCart(id, token, embed) {
  const cartEnt = new MERCHI.Cart().id(id).token(token);
  return cartEnt.get(
    (cart) => {
      localStorage.setItem("MerchiCart", MERCHI.toJson(cart));
      return cart;
    },
    (error) => {
      console.log(error);
      return null;
    },
    embed || cartEmbed
  );
}

async function initMerchiCartLocalStorage(cookie) {
  // Try and get the cookie
  if (cookie) {
    const cookieValueArray = cookie.split(",");
    const id = cookieValueArray[0].trim();
    const token = cookieValueArray[1].trim();
    const cartEnt = await getCart(id, token);
    return cartEnt;
  } else {
    const cartEnt = await createCart();
    return cartEnt;
  }
}

async function localStorageGetCartEnt() {
  // Get the cart json from local storage
  const merchiCartJson = JSON.parse(localStorage.getItem("MerchiCart"));
  if (merchiCartJson) {
    // If there is a cart in local storage then we convert it to a Merchi Cart entity
    return makeMerchiCartEnt(merchiCartJson);
  } else {
    // If there is no cart in local storage then we initicalise a new cart
    var cookie = getCookieByName("cart-" + scriptData.merchi_domain);
    return await initMerchiCartLocalStorage(cookie);
  }
}

async function localStorageUpdateCartEnt(cartEnd) {
  const MERCHI = MERCHI_INIT.MERCHI_SDK;
  localStorage.setItem("MerchiCart", JSON.stringify(MERCHI.toJson(cartEnd)));
}

function localStorageDeleteCartEnt() {
  // TODO clear the cart cookie as well
  localStorage.removeItem("MerchiCart");
}

function makeMerchiJsEnt(entName, data) {
  const MERCHI = MERCHI_INIT.MERCHI_SDK;
  if (Array.isArray(data)) {
    const entities = data.map((v) => makeMerchiJsEnt(entName, v));
    return entities;
  }
  const jobEntity = MERCHI.fromJson(new MERCHI[entName](), data);
  return jobEntity;
}

async function patchRecieverAddress(cart, address, step) {
  address = makeMerchiJsEnt("Address", address);
  const cartEnt = await localStorageGetCartEnt();
  cart.receiverAddress(address);
  cart.patch(
    (response) => {
      localStorageUpdateCartEnt(cartEnt);
      document.location.href = frontendajax.checkouturl + "?step=" + step;
    },
    (status, data) => console.log(`Error ${status}: ${data}`),
    undefined,
    5
  );
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
  var billing_values = frontendajax.billing_values;
  setLoading(true);
  const clientSecret = frontendajax.stripeSecret;
  elems = stripe.elements({ clientSecret });

  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // TODO Make sure to change this to your payment completion page
      return_url: "https://staging.unitix.com.au/checkout/?confirm=yes",
      receipt_email: billing_values ? billing_values.billing_email : "",
      payment_method_data: {
        billing_details: {
          email: billing_values ? billing_values.billing_email : "",
          name: billing_values ? billing_values.billing_first_name : "",
          phone: billing_values ? billing_values.billing_phone : "",
          address: {
            line1: billing_values ? billing_values.billing_address_1 : "",
            line2: billing_values ? billing_values.billing_address_2 : "",
            city: billing_values ? billing_values.billing_city : "",
            country: billing_values ? billing_values.billing_country : "",
            postal_code: billing_values ? billing_values.billing_postcode : "",
            state: billing_values ? billing_values.billing_state : "",
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

function getCookieByName(name) {
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }

  return null; // Cookie not found
}

function captureEmail(input) {
  var email = input.value;
  document.querySelector(".captured-email").value = email;
}

async function addClientToCart(cart, userId) {
  const embed = { client: { emailAddresses: {}, profilePicture: {} } };
  const user = new MERCHI.User().id(userId);
  cart.client(user);
  cart.patch(
    (response) => {
      localStorageUpdateCartEnt(response);
    },
    (status, data) => console.log(`Error ${status}: ${data}`),
    embed
  );
}

async function updateShipmentMethod(index, quoteIndex) {
  jQuery(".checkout-navigation .button").attr("disabled", "disabled");
  const embed = {
    shipmentGroups: {
      cartItems: { product: {} },
      quotes: cartShipmentQuote,
      selectedQuote: cartShipmentQuote,
    },
  };
  var token = false;
  var id = false;
  const cookieValue = getCookieByName("cart-" + scriptData.merchi_domain);
  if (cookieValue) {
    const cookieArray = cookieValue.split(",");
    token = cookieArray[1].trim();
    id = cookieArray[0].trim();
  }
  const cart = new MERCHI.Cart();
  cart.id(id);
  cart.token(token);
  cart.get(
    (cartEnt) => {
      const qEnt = cartEnt.shipmentGroups()[index].quotes()[quoteIndex];
      cartEnt.shipmentGroups()[index].selectedQuote(qEnt, {});
      cartEnt.patch(
        (response) => {
          localStorageUpdateCartEnt(cartEnt);
          jQuery.ajax({
            type: "POST",
            url: frontendajax.ajaxurl,
            data: {
              action: "cst_add_shipping",
              shippingCost: qEnt._totalCost,
            },
            success: function (response) {
              jQuery("body").trigger("update_checkout");
              jQuery(".checkout-navigation .button").removeAttr("disabled");
            },
          });
        },
        (error) => console.log(JSON.stringify(error)),
        embed
      );
    },
    (error) => console.log(JSON.stringify(error)),
    embed
  );
}

function navigateStep(step) {
  jQuery(".checkout-navigation .button").attr("disabled", "disabled");
  if (
    document.getElementById("captured_email") &&
    "" !== document.getElementById("captured_email").value
  ) {
    var requiredElems = document.getElementsByClassName("validate-required");
    if (document.getElementsByClassName("woocommerce-NoticeGroup")[0]) {
      document.getElementsByClassName("woocommerce-NoticeGroup")[0].remove();
    }

    var notice = document.createElement("div");
    var noticeUl = document.createElement("ul");
    var error = false;
    noticeUl.classList.add("woocommerce-error");
    noticeUl.setAttribute("role", "alert");
    notice.classList.add("woocommerce-NoticeGroup");
    notice.classList.add("woocommerce-NoticeGroup-checkout");

    for (var i = 0; i < requiredElems.length; i++) {
      if (requiredElems.item(i)) {
        var noticeLi = document.createElement("li");
        var noticeStrong = document.createElement("strong");
        noticeLi.append(noticeStrong);
        var actualInputElem = requiredElems
          .item(i)
          .getElementsByClassName("woocommerce-input-wrapper")[0]
          .getElementsByClassName("input-text")[0];
        var actualSelectElem = requiredElems
          .item(i)
          .getElementsByClassName("woocommerce-input-wrapper")[0]
          .getElementsByClassName("select2-hidden-accessible")[0];
        if (actualInputElem && !actualInputElem.value) {
          noticeStrong.innerHTML = requiredElems
            .item(i)
            .getElementsByClassName("woocommerce-input-wrapper")[0]
            .getElementsByClassName("input-text")[0]
            .getAttribute("data-cstname");
          noticeLi.append(" is a required field");
          noticeUl.append(noticeLi);
          error = true;
        } else if (actualSelectElem && !actualSelectElem.value) {
          noticeStrong.innerHTML = requiredElems
            .item(i)
            .getElementsByClassName("woocommerce-input-wrapper")[0]
            .getElementsByClassName("select2-hidden-accessible")[0]
            .getAttribute("data-cstname");
          noticeLi.append(" is a required field");
          noticeUl.append(noticeLi);
          error = true;
        }
      }
    }
    if (error) {
      notice.append(noticeUl);
      document.querySelector(".woocommerce-notices-wrapper").prepend(notice);
      window.scrollTo({ top: 0, behavior: "smooth" });
      jQuery(".checkout-navigation .button").removeAttr("disabled");
    } else {
      var email = document.getElementById("captured_email").value;
      var billing_address_1 = document.getElementById("billing_address_1")
        ? document.getElementById("billing_address_1").value
        : false;
      var billing_address_2 = document.getElementById("billing_address_2")
        ? document.getElementById("billing_address_2").value
        : false;
      var billing_city = document.getElementById("billing_city")
        ? document.getElementById("billing_city").value
        : false;
      var billing_state = document.getElementById("billing_state")
        ? document.getElementById("billing_state").value
        : false;
      var country = document.getElementById("billing_country")
        ? document.getElementById("billing_country").value
        : false;
      var postcode = document.getElementById("billing_postcode")
        ? document.getElementById("billing_postcode").value
        : false;
      var phone = document.getElementById("billing_phone")
        ? document.getElementById("billing_phone").value
        : false;
      var fname = document.getElementById("billing_first_name")
        ? document.getElementById("billing_first_name").value
        : false;
      const cookieValue = getCookieByName("cart-" + scriptData.merchi_domain);
      var token = false;
      var id = false;
      //console.log(phone);
      if (cookieValue) {
        const cookieArray = cookieValue.split(",");
        token = cookieArray[1].trim();
        id = cookieArray[0].trim();
      }
      if (step === 2 && email) {
        // Check user registration if moving to Step 2
        var postData = jQuery("#cst-woocommerce-checkout").serialize();
        jQuery.ajax({
          url: frontendajax.ajaxurl,
          type: "POST",
          data: {
            action: "check_user_registration",
            fname: fname,
            email: email,
            postcode: postcode,
            country: country,
            phone: phone,
            token: token,
            id: id,
            postData: postData,
          },
          success: function (response) {
            var resp = JSON.parse(response);
            if (resp.resp === "error") {
              var notice = document.createElement("div");
              var noticeUl = document.createElement("ul");
              noticeUl.classList.add("woocommerce-error");
              noticeUl.setAttribute("role", "alert");
              notice.classList.add("woocommerce-NoticeGroup");
              notice.classList.add("woocommerce-NoticeGroup-checkout");
              var noticeLi = document.createElement("li");
              var noticeStrong = document.createElement("strong");
              noticeLi.append(noticeStrong);
              noticeLi.append(resp.msg);
              noticeUl.append(noticeLi);
              notice.append(noticeUl);
              document
                .querySelector(".woocommerce-notices-wrapper")
                .prepend(notice);
              window.scrollTo({ top: 0, behavior: "smooth" });
              jQuery(".checkout-navigation .button").removeAttr("disabled");
            } else if (resp.resp === "registered" && resp.user_id) {
              const MERCHI = MERCHI_INIT.MERCHI_SDK;
              const ccart = new MERCHI.Cart();
              const address = {
                lineOne: billing_address_1,
                lineTwo: billing_address_2,
                city: billing_city,
                state: billing_state,
                country: country,
                postcode: postcode,
              };
              ccart.id(id);
              ccart.token(token);
              addClientToCart(ccart, resp.user_id);
              patchRecieverAddress(ccart, address, step);
            }
          },
          error: function (error) {
            console.log(error);
          },
        });
      }
    }
  } else {
    document.location.href = frontendajax.checkouturl + "?step=" + step;
  }
}

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

function emptyCookie(cookieName) {
  var ajax_url = frontendajax.ajaxurl;
  var ajax_data = {
    action: "cst_remove_cookie",
    cookieName: cookieName,
  };
  jQuery.post(ajax_url, ajax_data, function (response) {
    //console.log(response);
  });
}

const successCallback = function () {
  const checkoutForm = jQuery("form.woocommerce-checkout");
  // submit the form now
  checkoutForm.submit();
};

function getButtonByText(buttons, text) {
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].innerHTML === text) {
      return buttons[i]; // Return the button element if inner text matches
    }
  }
  return null; // Return null if no matching button is found
}

jQuery(document).ready(function ($) {
  if (1 == getQueryStringParameter("step")) {
    jQuery("#billing_email").trigger("blur");
  }

  jQuery(document).on("cst_clear_cart", function () {
    //console.log("Cart Cleared!!!");
  });

  // Disable button using JavaScript
  jQuery(document).on("click", ".cst-disabled-btn-parent", function (event) {
    event.preventDefault(); // Prevents the default click action
    return false;
  });

  const cookieSet = getCookieByName("cart-" + scriptData.merchi_domain);
  if (!cookieSet) {
    createCart();
  }

  var notice = document.createElement("div"),
      noticeUl = document.createElement("ul");

  noticeUl.classList.add("woocommerce-error");
  noticeUl.setAttribute("role", "alert");
  notice.classList.add("woocommerce-NoticeGroup");
  notice.classList.add("woocommerce-NoticeGroup-checkout");
  jQuery(document).on("click", ".cst-order-place-button", function (e) {
    e.preventDefault();
    var isValid = true;
    var errors = [];
    // Validate each billing field
    jQuery('input[name^="billing_"]').each(function () {
      if (jQuery(this).parents("p.form-row").hasClass("validate-required")) {
        if (jQuery(this).val() === "") {
          // Show error message for empty field
          var fieldName = jQuery(this).attr("data-cstname");
          errors.push(fieldName);
          isValid = false;
        } else {
          // Clear error message if field is filled
          var fieldName = jQuery(this).attr("name");
          var index = errors.indexOf(fieldName);
          if (index !== -1) {
            errors.splice(index, 1); // Remove error message from array
          }
        }
      }
    });
    if (!isValid && errors.length > 0) {
      errors.forEach(function (error) {
        var noticeLi = document.createElement("li");
        var noticeStrong = document.createElement("strong");
        noticeLi.append(noticeStrong);
        noticeStrong.innerHTML = error;
        noticeLi.append(" is a required field");
        noticeUl.append(noticeLi);
      });
      notice.append(noticeUl);
      document.querySelector(".woocommerce-notices-wrapper").prepend(notice);
    } else {
      jQuery(".cst-stripe-payment-button").trigger("click");
      return false;
    }
  });

  jQuery(document.body).on("updated_checkout", function () {
    var paymentForm = document.querySelector("#payment-form");
    if (paymentForm) {
      initializeStripe();
      checkStatus();
      paymentForm.addEventListener("submit", handleSubmit);
    }
  });

  var ccode = false;
  $(document.body).on("updated_checkout", function (data) {
    var ajax_url = frontendajax.ajaxurl,
      country_code = $("#billing_country").val();
    var ajax_data = {
      action: "append_country_prefix_in_billing_phone",
      country_code: $("#billing_country").val(),
    };
    $.post(ajax_url, ajax_data, function (response) {
      ccode = response;
      $("#billing_phone").val(response);
      $("#billing_phone").keydown(function (e) {
        var oldvalue = frontendajax.telephoneInput
          ? frontendajax.telephoneInput
          : $(this).val();
        var field = this;
        setTimeout(function () {
          if (field.value.indexOf(ccode) !== 0) {
            $(field).val(oldvalue);
          }
        }, 1);
      });
    });
  });

  async function patchWooCart(cartPayload) {
    await jQuery.ajax({
      method: "POST",
      url: frontendajax.ajaxurl,
      data: {
        action: "send_id_for_add_cart",
        item: cartPayload,
      },
      success: function (response) {
        window.location.href = site_url + '/cart/';
      },
      error: function (error) {
        throw "Something went wrong, Please try again later";
      },
    });
  }

 



  document.addEventListener("click", function (event) {
    var target = event.target;
	console.log('cst_tar', target.innerText);
    const $button = jQuery('.product-button-add-to-cart');
    // the observer is used to watch the cart button for a state change on the
    // disabled attr. We need this because if we mutate the DOM element while
    // react is in the middle of a state change, the page will crash.
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
          // Check if 'disabled' attribute has been removed
          const isDisabled = mutation.target.hasAttribute('disabled');
          // When the disabled attr is removed from the button this means that react
          // has finished with the element; it's now save to use jQuery to change the button
          if (!isDisabled) {
            $button.text('Loading...');
            $button.prop('disabled', true);
          }
        }
      }
    });
    if (target?.classList?.contains("product-button-add-to-cart")){
      // Start observing the target node
      observer.observe(target, { attributes: true });
      try {
        setTimeout(function () {
          // Check if the current page is a single product page
          if (scriptData.is_single_product) {
            // Retrieve the cart cookie to get cart details
            const cookie = getCookieByName("cart-" + scriptData.merchi_domain);
           // Parse the cart cookie value
            const cookieValueArray = cookie.split(",");
            const id = cookieValueArray[0].trim();
            const token = cookieValueArray[1].trim();
             // Create a new Cart instance and fetch the cart details
            const cartEnt = new MERCHI.Cart().id(id).token(token);
            cartEnt.get(
              (cart) => {
                // Update local storage with cart details
                localStorageUpdateCartEnt(cart);
                const cartJson = new MERCHI.toJson(cart);
                console.log(cartJson);
                var cartPayload = {};
                cartPayload["cartId"] = cartJson.id;
                cartPayload["taxAmount"] = cartJson.taxAmount;
                cartPayload["cartItems"] = {};
                // Process each cart item of responce
                cartJson.cartItems.forEach(function (item, itemIndex) {
                  cartPayload["cartItems"][itemIndex] = {
                    productID: item.product.id,
                    quantity: item.quantity,
                    subTotal: item.subtotalCost,
                    totalCost: item.totalCost,
                  };
                  var obj = {};
                  var objExtras = {};
                  var count = 0;
                   // Process item variations groups if present
                  // Get the selected value of responce and assing in cartPayload array
                  if (
                    Array.isArray(item.variationsGroups) &&
                    item.variationsGroups.length > 0
                  ) {
                    item.variationsGroups.forEach(function (group, gi) {
                      cartPayload["cartItems"][itemIndex]["variations"] = [];
                      cartPayload["cartItems"][itemIndex]["objExtras"] = [];
                      obj[count] = {};
                      objExtras[count] = {};
                      var loopcount = 0;
                      var varQuant = false;
                      group.variations.forEach(function (variation, vi) {
                        if (variation.selectedOptions.length) {
                          obj[count][vi] = variation.selectedOptions[0].value;
                        } else if (variation.hasOwnProperty("value")) {
                          obj[count][vi] = variation.value;
                        }
                        varQuant = variation.quantity;
                        loopcount = vi + 1;
                      });
                      objExtras[count][loopcount] = varQuant;
                      objExtras[count]["quantity"] = varQuant;
                      count++;
                      cartPayload["cartItems"][itemIndex]["variations"].push(obj);
                      cartPayload["cartItems"][itemIndex]["objExtras"].push(
                        objExtras
                      );
                    });
                  } 
                  // Process item variations if present
                  // Get the selected value of responce and assing in cartPayload array
                  if (
                    Array.isArray(item.variations) &&
                    item.variations.length > 0
                  ) {
                    cartPayload["cartItems"][itemIndex]["variations"] = [];
                    cartPayload["cartItems"][itemIndex]["objExtras"] = [];
                    obj[count] = {};
                    objExtras[count] = {};
                    var loopcount = 0;
                    var varQuant = false;
                    item.variations.forEach(function (variation, vi) {
                      if (variation.selectedOptions.length) {
                        obj[count][vi] = variation.selectedOptions[0].value;
                      } else if (variation.hasOwnProperty("value")) {
                        obj[count][vi] = variation.value;
                      }
                      varQuant = variation.quantity;
                      loopcount = vi + 1;
                    });
                    objExtras[count][loopcount] = varQuant;
                    objExtras[count]["quantity"] = varQuant;
                    cartPayload["cartItems"][itemIndex]["variations"].push(obj);
                    cartPayload["cartItems"][itemIndex]["objExtras"].push(
                      objExtras
                    );
                  }
                });
                // Check if the cart has items
                if (
                  cartJson.hasOwnProperty("cartItems") &&
                  Array.isArray(cartJson.cartItems) &&
                  cartJson.cartItems.length !== 0
                ) {
                  //$('#overlay').show(); // Show overlay
                  //$('#product-loader').show(); // Show loader
                  // Send cart data to the server using AJAX
                  jQuery.ajax({
                    method: "POST",
                    url: frontendajax.ajaxurl,
                    data: {
                      action: "send_id_for_add_cart",
                      item: cartPayload,
                    },
                    success: function (response) {
                      window.location.href = site_url + '/cart/';
                      // On success, restore the original button state
                      target.parentElement.classList.remove(
                        "cst-disabled-btn-parent"
                      );
                      target.style.display = "block";
                      clonedElement.remove();
                      // Trigger a refresh of the cart fragments
                      jQuery(document.body).trigger("wc_fragment_refresh");
                      setTimeout(function () {
                        // Redirect to the cart page after a short delay
                        jQuery(document.body).trigger("wc_fragment_refresh");
                        window.location.href = site_url + '/cart/';
                      }, 500);
                      //$('#overlay').hide(); // Show overlay
                      //$('#product-loader').hide(); // Show loader
                    },
                    error: function (error) {
                      // On error, show an alert to the user
                      //$('#overlay').hide(); // Show overlay
                      //$('#product-loader').hide(); // Show loader
                      alert("Something went wrong, Please try again later");
                    },
                  });
                } else {
                  // If the cart is empty, restore the button state
                  target.parentElement.classList.remove(
                    "cst-disabled-btn-parent"
                  );
                  target.style.display = "block";
                  target.innerHTML = "Add To Cart";
                  clonedElement.remove();
                }
              },
              (error) => {
                // Handle errors from fetching cart details
                console.log(error);
                return null;
              },
              cartEmbed
            );
          }
        }, 500); // Simulate a delay
      } catch (e) {
        console.error(e)
      }
    }
  });











  jQuery(document).on("click", ".remove.remove-product", function (e) {
    e.preventDefault();
    var $this = jQuery(this);
    var item_id = $this.data("cart_id");
    var classes = $this.parents(".cart_item").attr("class");
    classes = classes.split(" ");
    classes = classes[2].split("_");
    var actual_pos = parseInt(classes[2]);
    $this.closest("li").find(".ajax-loading").show();
    const cookieValue = getCookieByName("cart-" + scriptData.merchi_domain);
    jQuery.ajax({
      type: "POST",
      dataType: "json",
      url: theme.ajax_url,
      data: {
        action: "cst_cart_item_after_remove",
        item_id: item_id,
        cart_length: jQuery(".cst_cart_item").length,
      },
      success: function (response) {
        if (
          1 == jQuery(".cst_cart_item").length ||
          0 == jQuery(".cst_cart_item").length
        ) {
          localStorageDeleteCartEnt();
        }
        const cookieArray = cookieValue.split(",");
        const id = cookieArray[0].trim();
        const token = cookieArray[1].trim();
        const MERCHI = MERCHI_INIT.MERCHI_SDK;
        const cart = new MERCHI.Cart();
        const variationsEmbed = {
          selectedOptions: {},
          variationField: {
            options: {
              linkedFile: {},
              variationCostDiscountGroup: {},
              variationUnitCostDiscountGroup: {},
            },
            variationCostDiscountGroup: {},
            variationUnitCostDiscountGroup: {},
          },
          variationFiles: {},
        };

        const variationsGroupsEmbed = {
          variations: variationsEmbed,
        };
        const embedd = {
          receiverAddress: {},
          client: {},
          cartItems: {
            product: {},
            variations: variationsEmbed,
            variationsGroups: variationsGroupsEmbed,
          },
        };
        cart.id(id);
        cart.token(token);
        cart.get(
          (data) => {
            var ccart = data;
            var cartItems = ccart.cartItems();
            cartItems.splice(actual_pos, 1);
            ccart.cartItems(cartItems);
            ccart.patch(
              (response) => {},
              (status, data) => console.log(`Error ${status}: ${data}`),
              undefined,
              5
            );
          },
          (error) => console.log(JSON.stringify(error)),
          embedd
        );
      },
    });
  });
});
