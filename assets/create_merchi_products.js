jQuery(document).ready(function ($) {
  var limit = 25;
  var totalAvailable = 0;
  var allProducts = [];
  var embed = {
    featureImage: {},
    images: {},
    domain: { company: {} },
  };
  var allowedExtensions = {
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
    "image/png": "png",
  };
  
  function downloadMerchiImageReturnData(file) {
    var mimetype = file.mimetype() ? file.mimetype() : null,
      downloadSrc = $('#merchi_base_url').length ? $('#merchi_base_url').val() + "v6/product-public-file/download/" : "https://api.merchi.co/v6/product-public-file/download/",
      extension = mimetype ? allowedExtensions[mimetype] : null;
    return extension
      ? { src: `${downloadSrc}${file.id()}.${extension}` }
      : null;
  }

  function convertMerchiProductImages(merchiProduct) {
    return merchiProduct.images()
      ? merchiProduct.images().map(downloadMerchiImageReturnData)
      : [];
  }

  function convertedMerchiProducts(products) {
    var _products = [],
      i,
      j,
      arraySize = limit,
      arrayOfProductArrays = [];
    if (products) {
      for (i = 0; i < products.length; i++) {
        var merchiProduct = products[i],
          merchiProductImages;
        if (merchiProduct.json && merchiProduct.json === "product") {
          merchiProductImages = convertMerchiProductImages(merchiProduct);
		  // console.log(merchiProductImages);
          _products.push({
            description: merchiProduct.description(),
            price: merchiProduct.unitPrice(),
            name: merchiProduct.name(),
            regular_price: merchiProduct.unitPrice(),
            images: merchiProductImages,
            sku: merchiProduct.id(),
			      merchi_updated: merchiProduct.updated(),
          });
        }
      }
    }
    // for (j = 0; j < _products.length; j += arraySize) {
    //   arrayOfProductArrays.push(_products.slice(j, j + arraySize));
    // }
    return _products;
  }

  function injectProductsIntoDB(products) {
    $("#merchi-sync-products").prop("disabled", true);
    var msg = `Merchi products have been fetched and saved into products.`;
    $.ajax({
      type: "post",
      dataType: 'json',
      url: create_merchi_products.ajax_url,
      data: {
        action: "create_merchi_products",
        products: products,
        _ajax_nonce: create_merchi_products.nonce,
      },
      success: function (_data) {
        // console.log(_data);
        $("#merchi-fetch-button").html("Fetch");
        $("#merchi-fetch-button").prop("disabled", false);
        $("#merchi-progress").val(0);
        $("#merchi-sync-products").prop("disabled", false);
        window.scrollTo( 0, 0 );
        if(_data['products'] > 0){
          $('.plugin-error-list').html('');
          $('.plugin-import-errors').hide();
          toast(_data['products']);
        }
        if(_data['errors']){
          $('.plugin-import-errors').show();
          $('.plugin-error-list').html(_data['errors']);
        }
        return;
      },
      error: function (MLHttpRequest, textStatus, errorThrown) {
        console.error(errorThrown);
        $("#merchi-fetch-button").html("Fetch");
        $("#merchi-fetch-button").prop("disabled", false);
        $("#merchi-progress").val(0);
        $("#merchi-sync-products").prop("disabled", false);
        return;
      },
    });
  }
  
  var merchiProducts = [];
  function selectMerchiProducts(products) {
    var msg = `Merchi products have been fetched and saved into products.`;
	  merchiProducts = products;
    $.ajax({
      type: "post",
      dataType: 'json',
      url: create_merchi_products.ajax_url,
      data: {
        action: "select_merchi_products",
        products: products,
        _ajax_nonce: create_merchi_products.nonce,
      },
      success: function (_data) {
        // console.log(_data);
        if(_data['table_content']) {
          $('.plugin-table').html(_data['table_content']);
          $('.plugin-table-wrap').show();
          setTimeout(function () {
            $("#merchi-fetch-button").html("Fetch");
            $("#merchi-fetch-button").prop("disabled", false);
            $("#merchi-progress").val(0);
          }, 1000);
        }
        if(_data['errors']) {
          $('.plugin-import-errors').show();
          $('.plugin-error-list').html(_data['errors']);
          $("#merchi-fetch-button").prop("disabled", false);
          $('.plugin-table-wrap').hide();
        }
      },
      error: function (MLHttpRequest, textStatus, errorThrown) {
        console.error(errorThrown);
      },
    });
  }
  
  $("#merchi-sync-products").click(function () {
    var skus = [];
    var products = [];
    $('.plugin-table .merchi_checkbox').each(function (index, checkBox) {
      if($(checkBox).is(':checked')) {
        skus.push($(checkBox).data('sku'));
      }
    });
    $(merchiProducts.create).each(function (index, product) {
      if($.inArray(product['sku'], skus) !== -1) {
        ////////////////////////////////////////////////////////////////////
        // if( index == 0 ){
        //   product['name'] = '';
        // }
        // if( index == 1 ){
        //   product['price'] = '';
        // }
        // if( index == 2 ){
        //   product['regular_price'] = '';
        // }
        // if( index == 3 ){
        //   product['regular_price'] = '';
        //   product['name'] = '';
        // }
        /////////////////////////////////////////////////////////////////////
        products.push(product);
      }
    });
    totalAvailable = products.length;
    if( products.length > 0 ) {
      injectProductsIntoDB({ create: products });
    }
  });

  $(".plugin-bulk-checkbox").change(function () {
    $('.plugin-table .merchi_checkbox').each(function (index, checkBox) {
      if($(checkBox).data('status') == 'new-product') {
        if($('#merchi-all-products').is(':checked') || $('#merchi-new-products').is(':checked')) {
          $(checkBox).prop('checked', true);
        }
        else {
          $(checkBox).prop('checked', false);
        }
      }
      if($(checkBox).data('status') == 'new-data') {
        if($('#merchi-all-products').is(':checked') || $('#merchi-new-data').is(':checked')) {
          $(checkBox).prop('checked', true);
        }
        else {
          $(checkBox).prop('checked', false);
        }
      }
      if($(checkBox).data('status') == 'up-to-date') {
        if($('#merchi-all-products').is(':checked')) {
          $(checkBox).prop('checked', true);
        }
        else {
          $(checkBox).prop('checked', false);
        }
      }
    });
  });

  $("#merchi-fetch-button").click(function () {
    $("#merchi-fetch-button").html("Fetching...");
    $("#merchi-fetch-button").prop("disabled", true);
    $("#merchi-all-products").prop('checked', false);
    $("#merchi-new-products").prop('checked', false);
    $("#merchi-new-data").prop('checked', false);
    $(".merchi_checkbox").prop('checked', false);
    $('.plugin-error-list').html('');
    $('.plugin-import-errors').hide();
    // Check how many merchi product there are
    MERCHI_SDK.products.get(
      function (data) {
        prepereProducts(data.meta.available);
      },
      function (status, data) {
        console.error(status, data);
        alert("Can not connect to merchi check console.");
      },
      {
        embed: {},
        inDomain: merchiObject.merchiStoreName,
        publicOnly: true,
      }
    );
  });

  // 
  async function prepereProducts(productTotal) {
    var available = productTotal;
    allProducts = [];
    var offset = 0;
    var num = Math.floor(productTotal/limit) + 1;
    for (j = 0; j < num; j++) {
      try {
        const data = await fetchProducts(offset);
        allProducts = [...allProducts, ...data];
        offset += limit;
        available -= limit;
        $("#merchi-progress").val((1 - available / productTotal) * 100);
      } catch (error) {
        // console.log(error);
      }
    }

    var _products = convertedMerchiProducts(allProducts);
    selectMerchiProducts({ create: _products });
  }

  function fetchProducts(offset) {
    return new Promise((resolve,reject)=>{
      MERCHI_SDK.products.get(
        resolve,
        (data, offset)=>{
          reject(new Error("There was an error fetching products from Merchi\nPlease check the console for more info."));
        },
        {
          embed: embed,
          inDomain: merchiObject.merchiStoreName,
          limit: limit,
          offset: offset,
          publicOnly: true,
        }
      );
    });
  }

  // Show toast
  function toast($products) {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar");
    // Set text inside snackbar DIV
    $("#snackbar").text($products + " Merchi products created/updated.");
    // Add the "show" class to DIV
    x.className = "show";
    // After 3 seconds, remove the show class from DIV
    setTimeout(function () {
      x.className = x.className.replace("show", "");
    }, 3000);
  }
});
