let offset = 0;
let loadingData = false;
let hasMoreProducts = true;
let currentRequest = null;
var domainId = scriptData.merchi_domain;
// console.log(domainId);
const selectedValueDisplay = document.getElementById("selected_value_display");
const customValueField = document.getElementById("custom_value_field");
const hiddenProductIdField = document.getElementById("hidden_product_id");
const hiddenProductNameField = document.getElementById("hidden_product_name");
const hiddenProductNameprice = document.getElementById("hidden_regular_price");
const $fetchProductLoadingElement = document.querySelector(".search-icon");
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
  const $searchProductsLoaderIcon = jQuery(".cst-loader");
  const $fetchProductLoadingElement = jQuery(".search-icon");
  $searchProductsLoaderIcon.show();
  $fetchProductLoadingElement.hide();
  const limit = 25;
  const apiUrl = scriptData.merchi_url;
  const apiKey = scriptData.merchi_secret;
  const domainId = scriptData.merchi_domain;
  const wooProductId = scriptData.woo_product_id; // Get the current product ID
  const searchTerm = jQuery("#custom_value_field").val();

  if (loadingData || !hasMoreProducts) {
    return;
  }

  if (currentRequest) {
    currentRequest.abort(); // Abort the previous request
  }

  currentRequest = jQuery.ajax({
    url: frontendajax.ajaxurl, // WordPress AJAX URL
    type: "POST",
    data: {
      action: "fetch_products", // Action name defined in PHP
      apiUrl: apiUrl,
      apiKey: apiKey,
      domainId: domainId,
      wooProductId: wooProductId,
      limit,
      offset,
      q: encodeURIComponent(searchTerm),
    },
    beforeSend: function () {
      loadingData = true;
    },
    success: (response) => {
      if (response.success && response.data.products.length > 0) {
        const { products } = response.data;
        const dropdownContent = jQuery("#search_results");
        products.forEach((item) => {
          const { product } = item;
          const { bestPrice, id, name } = product;
          const div = jQuery("<div>");
          div.text(name);
          div.addClass("search-result");
          div.on("click", function () {
            jQuery("#custom_value_field").val(name);
            hiddenProductIdField.value = id;
            hiddenProductNameField.value = name;
            hiddenProductNameprice.value = bestPrice;
            selectedValueDisplay.textContent = name;
            selectedValueDisplay.style.display = "inline-block";
            customValueField.style.display = "inline-block";
            dropdownContent.hide();
            jQuery.ajax({
              url: frontendajax.ajaxurl,
              type: "POST",
              data: {
                action: "save_product_meta",
                wooProductId: wooProductId,
                selectedId: id,
                selectedName: name,
                selectedPrice: bestPrice,
              },
              success: function (response) {
                if (response.success) {
                  console.log("Product meta saved successfully");
                } else {
                  console.error(
                    "Failed to save product meta:",
                    response.data.message
                  );
                }
              },
              error: function (error) {
                console.error("Error saving product meta:", error);
              },
            });
          });
          dropdownContent.append(div);
        });
        $searchProductsLoaderIcon.hide();
        $fetchProductLoadingElement.hide();
        dropdownContent.show();

        offset += limit;
      } else {
        hasMoreProducts = false; // Set flag to false if no more products
        loadingData = false;
        $fetchProductLoadingElement.hide();
        $searchProductsLoaderIcon.hide();
      }
    },
    complete: () => {
      loadingData = false;
      $fetchProductLoadingElement.hide();
      $searchProductsLoaderIcon.hide();
    },
    error: (error) => {
      console.error("Error fetching products:", error);
      loadingData = false;
      $fetchProductLoadingElement.hide();
      $searchProductsLoaderIcon.hide();
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
        //location.reload();
      }
    },
    error: function (error) {
      console.error("Error attaching media:", error);
    },
  });
}

function spinner() {
  var postId = jQuery("#post_ID").val();
  jQuery.ajax({
    method: "POST",
    url: frontendajax.ajaxurl, // Assuming frontendajax.ajaxurl contains the correct URL
    data: {
      action: "save_flag_for_show_meta",
      postId: postId,
    },
    success: function (response) {
      if (response && response === "success") {
        var elements = document.getElementsByClassName("show-after-selection");
        for (var i = 0; i < elements.length; i++) {
          elements[i].style.display = "block";
        }
      } else {
        console.log("Failed to update meta.");
      }
    },
    error: function (error) {
      console.error("Error updating meta:", error);
    },
  });

  document.getElementsByClassName("loader")[0].style.display = "block";
  document.getElementsByClassName("wrap")[0].style.filter = "blur(1.5px)";
}

//gc code start here
jQuery(document).ready(function ($) {
  $("#remove_selected_value").on("click", function () {
    // Hide the 'selected_value_display' element
    $("#selected_value_display").hide();
    $(this).hide();
    // Show the 'search_box' element
    $("#search_box").show();
    // Reset the input field and hidden fields
    $("#custom_value_field").val("");
    hiddenProductIdField.value = "";
    hiddenProductNameField.value = "";
    hiddenProductNameprice.value = "";
  });

  $("#bulk-action-selector-top").change(function () {
    var selectedValue = $(this).val();
    if (selectedValue === "bulk_import") {
      $("#doaction").attr("type", "button");
    }
  });

  jQuery("#doaction").on("click", function () {
    // Get the selected action value
    var selectedAction = $("#bulk-action-selector-top").val();
    // Check if the selected value is "bulk_import"
    if (selectedAction === "bulk_import") {
      var checkedValues = [];
      $('input[name="product[]"]').each(function () {
        // Check if the checkbox is checked
        if ($(this).is(":checked")) {
          // If checked, push its value to the checkedValues array
          checkedValues.push($(this).val());
        }
      });
      jQuery.ajax({
        method: "POST",
        url: frontendajax.ajaxurl,
        data: {
          action: "gc_create_product_background_process",
          checkedValues: checkedValues,
        },
        success: function (response) {
          var jsonResponse = JSON.parse(response);
          if (jsonResponse.success == true) {
            alert(
              "Products are currently being imported/synced. Please wait, you will be notified once the task has been completed."
            );
          }
        },
        error: function (error) {
          console.error("Error updating meta:", error);
        },
      });
    }
  });
  //gc code end here

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

    if (fieldValue !== "") {
      // Check if searchResults is not empty before trying to call show()
      if (searchResults.length > 0) {
        searchResults.show();
      }
    }
  });

  function yourMethod() {
    document.getElementsByClassName("wrap")[0].style.filter = "blur(2.5px)";
    document.getElementsByClassName("loader")[0].style.display = "block";
    $("#loader").css("margin-top", "-50px");
  }

  if (jQuery(".post-new-php.post-type-product").length > 0) {
    jQuery("#publish").trigger("click");
    document.getElementsByClassName("wrap")[0].style.filter = "blur(2.5px)";
    yourMethod();
  }
  jQuery("#wp-admin-bar-new-content").on("click", function () {
    setTimeout(function () {
      if (jQuery(".post-new-php.post-type-product").length > 0) {
        jQuery("#publish").trigger("click");
      }
    }, 5000);
  });

  jQuery(document).ready(function ($) {
    // Find the li element with the title "Add New"
    var addNewLi = $("ul.wp-submenu.wp-submenu-wrap li").filter(function () {
      return $(this).text().trim() === "Add New";
    });

    // Attach click event handler to the "Add New" li
    addNewLi.on("click", function (event) {
      if (addNewLi.length > 0) {
        $(".wrap").append('<div class="loader"></div>');
      }
      yourMethod();
    });

    $(".page-title-action").on("click", function () {
      if ($(this).text() === "Add New") {
        console.log("The button text is 'Add New'");
        yourMethod();
      } else {
        console.log("The button text is not 'Add New'");
      }
    });

    function yourMethod() {
      document.getElementsByClassName("wrap")[0].style.filter = "blur(2.5px)";
      // document.getElementsByClassName("loader")[0].style.display = "block";
      $("#loader").css("margin-top", "-50px");
    }
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
      const apiUrl = `${scriptData.merchi_url}v6/products/${hiddenProductId}/?apiKey=${apiKey}&inDomain=${domainId}&embed={"featureImage":{},"images":{}}&skip_rights=y`;

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

  jQuery(document).ready(function ($) {
    $(".if_import").on("click", function (e) {
      var buttonText = $(this).text().trim();
      if (buttonText === "Import") {
        // Change button text to 'Importing...'
        $(this).text("Importing...");
      }
    });
  });
});
