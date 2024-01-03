let offset = 0;
let loadingData = false;
let hasMoreProducts = true;
let currentRequest = null;
const selectedValueDisplay = document.getElementById("selected_value_display");
const customValueField = document.getElementById("custom_value_field");
const hiddenProductIdField = document.getElementById("hidden_product_id");
const hiddenProductNameField = document.getElementById("hidden_product_name");
const hiddenProductNameprice = document.getElementById("hidden_regular_price");
const searchIcon = document.querySelector(".search-icon");
const searchResults = document.getElementById("search_results");
function handleInput() {
  clearTimeout(jQuery.data(this, "timer"));
  const dropdownContent = jQuery("#search_results");
  dropdownContent.html("");
  dropdownContent.hide();
  const timeout = setTimeout(function () {
    offset = 0; // Reset offset when user starts typing
    hasMoreProducts = true;
    fetchProducts(); // Call the function to fetch products
  }, 500);
  jQuery(this).data("timer", timeout);
}

function searchProductsByTerm(products, searchTerm) {
  searchTerm = searchTerm.toLowerCase();
  let foundProducts = [];

  for (let i = 0; i < products.length; i++) {
    const productName = products[i].product.name.toLowerCase();
    if (productName.includes(searchTerm)) {
      const { id, name, bestPrice } = products[i].product;
      const prod = {
        id: id,
        name: name,
        bestPrice: bestPrice,
      };
      foundProducts.push(prod);
    }
  }
  return foundProducts;
}

function fetchProducts() {
  const cstloader = jQuery(".cst-loader");
  const searchIcon = jQuery(".search-icon");
  cstloader.show();
  searchIcon.hide();
  const limit = 1000;
  const apiKey = scriptData.merchi_secret;
  const apiUrl = `${scriptData.merchi_url}v6/products/?apiKey=${apiKey}&limit=${limit}&offset=${offset}`;
  const searchTerm = jQuery("#custom_value_field").val();

  if (loadingData || !hasMoreProducts) {
    return;
  }

  if (currentRequest) {
    currentRequest.abort(); // Abort the previous request
  }

  currentRequest = jQuery.ajax({
    url: apiUrl,
    type: "GET",
    beforeSend: function () {
      loadingData = true;
    },
    success: function (response) {
      if (response.products.length > 0) {
        const dropdownContent = jQuery("#search_results");

        const foundProds = searchProductsByTerm(response.products, searchTerm);
        foundProds.forEach((product) => {
          const productName = product.name;
          const div = jQuery("<div>");
          div.text(productName);
          div.addClass("search-result");
          div.on("click", function () {
            jQuery("#custom_value_field").val(productName);
            hiddenProductIdField.value = product.id;
            hiddenProductNameField.value = productName;
            hiddenProductNameprice.value = product.bestPrice;
            selectedValueDisplay.textContent = name;
            selectedValueDisplay.style.display = "inline-block";
            // removeSelectedValue.style.display = "inline-block";
            customValueField.style.display = "inline-block";
            dropdownContent.hide();
          });
          dropdownContent.append(div);
        });
        cstloader.hide();
        searchIcon.show();
        dropdownContent.show();

        offset += limit;
      } else {
        hasMoreProducts = false; // Set flag to false if no more products
      }
    },
    complete: function () {
      loadingData = false;
    },
    error: function (error) {
      console.error("Error fetching products:", error);
    },
  });
}

function attachprodcuttitle(product_title, product_id) {
  var postId = jQuery("#post_ID").val();
  jQuery.ajax({
    method: "POST",
    url: frontendajax.ajaxurl,
    data: {
      action: "prodct_title_attach",
      product_title: product_title,
      postId: postId,
      product_id: product_id,
      //msg: msg,
    },
    success: function (response) {},
    error: function (error) {
      console.error("Error attaching product_title:", error);
    },
  });
}

function attachfeatureMedia(imageUrl, inputString, msg) {
  var postId = jQuery("#post_ID").val();
  jQuery.ajax({
    method: "POST",
    url: frontendajax.ajaxurl,
    data: {
      action: "media_featureimage_attach",
      image_url: imageUrl,
      postId: postId,
      mimetype: inputString,
      msg: msg,
    },
    success: function (response) {
      if (response) {
        document.getElementById("_thumbnail_id").value = response;
        jQuery("#_thumbnail_id").trigger("change");
      }
    },
    error: function (error) {
      console.error("Error attaching media:", error);
    },
  });
}

function attachMedia(imageUrl, inputString, msg) {
  var postId = jQuery("#post_ID").val();
  jQuery.ajax({
    method: "POST",
    url: frontendajax.ajaxurl,
    data: {
      action: "media_image_attach",
      image_url: imageUrl,
      postId: postId,
      mimetype: inputString,
      msg: msg,
    },
    success: function (response) {
      if (response) {
        document.getElementById("product_image_gallery").value = response;
        jQuery("#product_image_gallery").trigger("change");
        document.getElementsByClassName("loader")[0].style.display = "none";
        document.getElementsByClassName("wrap")[0].style.filter = "none";
      }
    },
    error: function (error) {
      console.error("Error attaching media:", error);
    },
  });
}

function spinner() {
  document.getElementsByClassName("loader")[0].style.display = "block";
  document.getElementsByClassName("wrap")[0].style.filter = "blur(1.5px)";
}

jQuery(document).ready(function ($) {
  jQuery(document).on("click", function (event) {
    const searchResults = jQuery("#search_results");
    const customValueField = jQuery("#custom_value_field");

    // Check if the click is outside the search results and custom value field
    if (
      !searchResults.is(event.target) &&
      !customValueField.is(event.target) &&
      searchResults.has(event.target).length === 0
    ) {
      searchResults.hide(); // Close the dropdown
    }
  });

  jQuery("#custom_value_field").on("click", function () {
    const fieldValue = jQuery(this).val().trim();

    // Show the dropdown if the text box has a value
    if (fieldValue !== "") {
      searchResults.show();
    }
  });

  if (jQuery(".post-new-php.post-type-product").length > 0) {
    jQuery("#publish").trigger("click");
  }
  jQuery("#wp-admin-bar-new-content").on("click", function () {
    setTimeout(function () {
      if (jQuery(".post-new-php.post-type-product").length > 0) {
        jQuery("#publish").trigger("click");
      }
    }, 5000);
  });

  // Event listener for user input
  jQuery("#custom_value_field").on("input", handleInput);

  if (searchResults) {
    jQuery("#search_results").on("scroll", function () {
      const contentHeight = this.scrollHeight;
      const visibleHeight = this.clientHeight;
      const scrollPosition = this.scrollTop;

      if (contentHeight - (scrollPosition + visibleHeight) < 100) {
        fetchProducts();
      }
    });

    jQuery(document).on("click", ".search-result", function (event) {
      const hiddenProductId = jQuery("#hidden_product_id").val();
      const apiKey = scriptData.merchi_secret;
      const apiUrl = `${scriptData.merchi_url}v6/products/${hiddenProductId}/?apiKey=${apiKey}&embed={"featureImage":{},"images":{}}&skip_rights=y`;

      jQuery.ajax({
        url: apiUrl,
        type: "GET",
        success: function (data) {
          if (data && data.product) {
            const product_title = data.product.name;
            const product_id = data.product.id;
            if (product_title) {
              attachprodcuttitle(product_title, product_id);
            } else {
              const msg = "Images not available";
              jQuery(".loader").eq(0).hide();
              jQuery(".wrap").eq(0).css("filter", "none");
              attachfeatureMedia(msg);
            }

            const featureImage = data.product.featureImage;
            if (
              featureImage &&
              featureImage.downloadUrl &&
              featureImage.mimetype
            ) {
              const inputString = featureImage.mimetype;
              const parts = inputString.split("/");
              const fileType = parts[1];
              const url = `${scriptData.merchi_url}v6/product-public-file/download/${featureImage.id}.${fileType}`;
              attachfeatureMedia(url, inputString);
            } else {
              const msg = "Images not available";
              jQuery(".loader").eq(0).hide();
              jQuery(".wrap").eq(0).css("filter", "none");
              attachfeatureMedia(msg);
            }

            const imagesArray = data.product.images;
            if (Array.isArray(imagesArray)) {
              for (const image of imagesArray) {
                if (image && image.downloadUrl && image.mimetype) {
                  const inputString = image.mimetype;
                  const parts = inputString.split("/");
                  const fileType = parts[1];
                  const url = `${scriptData.merchi_url}v6/product-public-file/download/${image.id}.${fileType}`;
                  attachMedia(url, inputString);
                } else {
                  const msg = "Images not available";
                  jQuery(".loader").eq(0).hide();
                  jQuery(".wrap").eq(0).css("filter", "none");
                  attachMedia(msg);
                }
              }
            }
          }
        },
        error: function (error) {
          console.error("Error fetching data:", error);
        },
      });
    });
  }
});
