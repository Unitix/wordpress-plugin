// Wait for both jQuery and Merchi SDK to be ready
function initializeWhenReady() {
  const merchiSdk = window.MERCHI_SDK;
  if (!merchiSdk) {
    window.addEventListener('merchi_sdk_ready', initializeWhenReady);
    return;
  }

  // Ensure SDK is properly initialized
  if (!merchiSdk.Job || !merchiSdk.getJobQuote) {
    return;
  }

  jQuery(document).ready(function($) {
    // Get the Merchi product ID from the page
    const merchiProductId = merchiConfig.productId;
    let productJson = null;
    let defaultJobJson = null;

    // Function to fetch product details
    function fetchProductDetails() {
      return new Promise((resolve) => {
        const productEnt = new merchiSdk.Product().id(merchiProductId);
        
        productEnt.get(
          (product) => {
            productJson = merchiSdk.toJson(product);
            // Ensure we have a valid defaultJob structure
            defaultJobJson = productJson.defaultJob;
            resolve(productJson);
          },
          (error) => {
            const fallbackData = {
              id: parseInt(merchiProductId),
              domain: {id: merchiConfig.domainId},
              defaultJob: {
                domain: {id: merchiConfig.domainId},
                product: {id: merchiProductId},
                variations: [],
                variationsGroups: []
              }
            };
            productJson = fallbackData;
            defaultJobJson = fallbackData.defaultJob;
            resolve(fallbackData);
          },
          {
            component: {},
            defaultJob: {},
            domain: {
              activeTheme: {mainCss: {}},
              logo: {}
            },
            draftTemplates: {file: {}},
            groupBuyStatus: {},
            groupVariationFields: {options: {linkedFile: {}}},
            images: {},
            independentVariationFields: {options: {linkedFile: {}}},
            publicFiles: {},
          },
        );
      });
    }

    // Cache the price calculation timeout and last form data
    let priceCalculationTimeout;
    let lastCalculationTime = 0;
    const DEBOUNCE_DELAY = 300; // 300ms debounce
    const MIN_CALCULATION_INTERVAL = 500; // Minimum 500ms between calculations
      
    // Function to debounce price calculations with rate limiting
    function debouncedCalculatePrice() {
      const now = Date.now();
      clearTimeout(priceCalculationTimeout);
      
      // If we recently calculated, delay more
      if (now - lastCalculationTime < MIN_CALCULATION_INTERVAL) {
        priceCalculationTimeout = setTimeout(() => {
          lastCalculationTime = Date.now();
          calculateAndUpdatePrice();
        }, DEBOUNCE_DELAY);
        return;
      }
      
      // If enough time has passed, calculate immediately
      lastCalculationTime = now;
      calculateAndUpdatePrice();
    }

    // Reusable function to update a variation label
    function updateVariationLabel($label, variation) {
      if (variation) {
        const { onceOffCost, unitCostTotal, variationField } = variation;
        let label = variationField.name;
        const onceOffCostLabel = onceOffCost ? ` + ( $${onceOffCost.toFixed(2)} once off )` : '';
        const unitCostLabel = unitCostTotal ? ` + ( $${unitCostTotal.toFixed(2)} per unit )` : '';
        label += onceOffCostLabel + unitCostLabel;
        $label.text(label);
      }
    }

    function renderPrice(totalCost, countryTax) {
      const tax = countryTax ?? {};
      const { taxName, taxPercent } = tax;
      const taxText = taxName ? `in ${taxName} (${taxPercent}%)` : 'inc tax';
      return `$${totalCost.toFixed(2)} ${taxText}`;
    }

    function onGetJobQuoteSuccess(response) {
      // Use the quote price if available, otherwise fallback to local calculation
      // add loop here
      const {
        taxType,
        totalCost,
        variations = [],
        variationsGroups = [],
      } = response;

      // loop over the variationsGroups
      for (let i = 0; i < variationsGroups.length; i++) {
        const {
          variations = [],
        } = variationsGroups[i];

        jQuery('label[data-update-label="true"][data-group-index="' + i + '"]').each(function() {
          const $label = jQuery(this);
          const variationFieldId = $label.data('variation-field-id');
          const variation = variations.find(v => v.variationField?.id === variationFieldId);
          updateVariationLabel($label, variation);
        });
      }

      jQuery('label[data-update-label="true"][data-group-index="false"]').each(function() {
        const $label = jQuery(this);
        const variationFieldId = $label.data('variation-field-id');
        const variation = variations.find(v => v.variationField?.id === variationFieldId);
        updateVariationLabel($label, variation);
      });
      
      // Update group cost display for each group
      for (let i = 0; i < variationsGroups.length; i++) {
        const group = variationsGroups[i];
        const groupCost = group.groupCost || group.totalCost || 0;
        jQuery('.group-cost-display[data-group-index="' + (i + 1) + '"]').text(
          'Group Cost: $' + groupCost.toFixed(2)
        );
      }

      jQuery('.price-amount').text(renderPrice(totalCost, taxType));
    }

    function onGetJobQuoteError(error) {
      console.log(error, 'this is the error');
      jQuery('.price-amount').text('$0.00');
    }

    function initializeFileUploadVariations($container) {
      $container.find('input[type="file"]').each(function() {
        const $input = jQuery(this);
        const $wrapper = $input.closest('.custom-upload-wrapper');
        let $previewArea = $wrapper.next('.multi-file-upload-preview');
        
        if ($previewArea.length === 0) {
          $previewArea = jQuery('<div class="multi-file-upload-preview"></div>');
          $wrapper.after($previewArea);
        }

        $input.off('change.file-input').on('change.file-input', function(e) {
          var files = Array.from(this.files);
          
          // --- Maintain a DataTransfer object for this input ---
          if (!$input[0]._dt) {
            $input[0]._dt = new DataTransfer();
          }
          var dt = $input[0]._dt;

          // Add new files, avoiding duplicates by name+size
          files.forEach(function(file) {
            var exists = false;
            for (var i = 0; i < dt.items.length; i++) {
              var f = dt.items[i].getAsFile();
              if (f.name === file.name && f.size === file.size) {
                exists = true;
                break;
              }
            }
            if (!exists) dt.items.add(file);
          });
          // Update input files
          $input[0].files = dt.files;

          // --- Render preview ---
          $previewArea.empty();
          var dtFiles = Array.from(dt.files);
          if (dtFiles.length > 0) {
            dtFiles.forEach(function(file, idx) {
              var $fileBox = jQuery('<div class="multi-file-box" style="display: flex; align-items: center; margin-bottom: 8px; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); padding: 8px;"></div>');
              var $removeBtn = jQuery('<span class="file-upload-remove" style="margin-left: 10px; cursor: pointer; font-size: 20px; color: #d00;">&times;</span>');
              $removeBtn.on('click', function(e) {
                e.stopPropagation();
                var newDT = new DataTransfer();
                dtFiles.forEach(function(f, i) {
                  if (i !== idx) newDT.items.add(f);
                });
                $input[0]._dt = newDT;
                $input[0].files = newDT.files;
                $input.trigger('change');
              });
              if (file.type.startsWith('image/')) {
                var reader = new FileReader();
                reader.onload = function(e) {
                  var $img = jQuery('<img />', {
                    src: e.target.result,
                    css: {
                      'max-width': '60px',
                      'max-height': '60px',
                      'object-fit': 'contain',
                      'margin-right': '10px',
                      'border-radius': '4px',
                      'box-shadow': '0 1px 4px rgba(0,0,0,0.08)'
                    }
                  });
                  $fileBox.prepend($img);
                };
                reader.readAsDataURL(file);
              } else {
                var $fileIcon = jQuery('<span style="font-size: 32px; margin-right: 10px;">📄</span>');
                $fileBox.prepend($fileIcon);
              }
              var $fileName = jQuery('<span style="font-weight: bold; font-size:0.5em; color: #333;">' + file.name + '</span>');
              var $downloadBtn = jQuery('<a style="margin-left: 10px; font-size: 18px; text-decoration: none;" href="#" download>⬇️</a>');
              $downloadBtn.on('click', function(ev) {
                ev.preventDefault();
                var url = URL.createObjectURL(file);
                var a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                setTimeout(function() { URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
              });
              $fileBox.append($fileName).append($downloadBtn).append($removeBtn);
              $previewArea.append($fileBox);
            });
            // Show file count
            var $count = jQuery('<div style="color: #666; font-size: 14px; font-weight:bold; margin-top: 4px;">' + dtFiles.length + ' file' + (dtFiles.length > 1 ? 's' : '') + ' selected <span style="cursor:pointer;color:#0073aa;" class="toggle-file-list">&#9650;</span></div>');
            $previewArea.append($count);
            $count.find('.toggle-file-list').on('click', function() {
              $previewArea.toggleClass('collapsed');
              $previewArea.find('.multi-file-box').toggle();
              jQuery(this).html($previewArea.hasClass('collapsed') ? '&#9660;' : '&#9650;');
            });
          } else {
            $previewArea.empty();
          }
          // Always show icon and instruction
          $wrapper.find('.upload-icon').show();
          $wrapper.find('.upload-instruction, .upload-types').show();
        });
      });
    }

    function initializeImageSelectVariations($container) {
      $container.find('.image-select-option').each(function() {
        const $option = jQuery(this);
        const $input = $option.find('input');
        $option.off('click.image-select').on('click.image-select', function(e) {
          e.preventDefault();
          if ($input.is(':radio')) {
            $input.prop('checked', true).trigger('change');
          } else if ($input.is(':checkbox')) {
            $input.prop('checked', !$input.prop('checked')).trigger('change');
          }
        });
      });
    }

    function initializeVariationFields($container) {
      $container.find('input[data-calculate], select[data-calculate], textarea[data-calculate]').each(function() {
        const $input = jQuery(this);
        $input.off('change.calculate'); // Remove previous handler
        $input.on('change.calculate', debouncedCalculatePrice);
      });
    }

    // Function to calculate and update price
    async function calculateAndUpdatePrice() {
      // set loading state on price.
      const $price = jQuery('.price-amount').html();
      if (!$price.includes('loading-spinner')) {
        jQuery('.price-amount').html("<span class='loading-spinner'></span>" + $price);
      }
      const formData = await gatherFormData();
      const jobEntity = merchiSdk.fromJson(new merchiSdk.Job(), formData);

      // Make the API call to get the quote
      try {
        merchiSdk.getJobQuote(jobEntity, onGetJobQuoteSuccess, onGetJobQuoteError);
      } catch (error) {
        // On exception, use local calculation
        jQuery('.price-amount').text(renderPrice(0, null));
      }
    }

    // When deleteing a group we update each group index and name
    function updateGroupNumbers() {
      jQuery(".group-field-set").each(function(index) {
        const newIndex = index + 1;
        const $group = jQuery(this);
        
        $group.attr("data-group-index", newIndex);
        $group.find(".group-number").text(newIndex);
        
        $group.find("input, select, textarea").each(function() {
          const $input = jQuery(this);
          const name = $input.attr("name");
          if (name) {
            const newName = name.replace(/group_fields\[\d+\]/, "group_fields[" + newIndex + "]");
            $input.attr("name", newName);
          }
          
          if ($input.hasClass('group-quantity')) {
            $input.attr('data-group-index', newIndex);
            updateGroupLabel($input);
          }
        });
      });

      // Toggle delete buttons
      const $deleteButtons = jQuery(".delete-group-button");
      if (jQuery(".group-field-set").length === 1) {
        $deleteButtons.hide();
      } else {
        $deleteButtons.show();
      }

      // Trigger immediate price calculation after updating group numbers
      calculateAndUpdatePrice();
    }

    // Function to initialize handlers for a specific group
    function initializeGroupVariationHandlers($group) {
      // Initialize calculate inputs
      initializeVariationFields($group);

      // Initialize image select options
      initializeImageSelectVariations($group);

      // Initialize file inputs
      initializeFileUploadVariations($group);

      // Bind group-quantity change for this group
      $group.find('.group-quantity').off('change.group').on('change.group', calculateAndUpdatePrice);
      $group.find('.delete-group-button').off('click.group').on('click.group', function() {
        $group.remove();
        updateGroupNumbers();
        // Trigger immediate price calculation
        calculateAndUpdatePrice();
      });

      $group.find('.delete-group-button').off('click');
      // Delete group handler with immediate price update
      $group.find('.delete-group-button').on('click', function(e) {
        e.preventDefault();
        const $group = jQuery(this).closest(".group-field-set");
        $group.remove();
        updateGroupNumbers();
        // Trigger immediate price calculation
        calculateAndUpdatePrice();
      });
    }

    function initializeVariations() {
      const $variationsContainer = jQuery('.custom-variation-options');
      // Initialize calculate inputs
      initializeVariationFields($variationsContainer);
      // Initialize file inputs
      initializeFileUploadVariations($variationsContainer);
      // Initialize image select options
      initializeImageSelectVariations($variationsContainer);
    }
  
    // Function to add a new group
    function addNewGroup() {
      // Get the first group as template
      const $firstGroup = jQuery(".group-field-set").first();
      const newGroupIndex = jQuery(".group-field-set").length + 1;

      // Clone the group
      const $newGroup = $firstGroup.clone();

      // Reset and update the new group
      $newGroup
        .attr("data-group-index", newGroupIndex)
        .find(".group-number")
        .text(newGroupIndex);

      // in the new group find all the data-group-index + 1
      $newGroup.find('[data-group-index]').each(function() {
        const $element = jQuery(this);
        const currentIndex = parseInt($element.data('group-index'));
        $element.attr('data-group-index', newGroupIndex);
      });
      
      // Also update the group-cost-display's data-group-index
      $newGroup.find('.group-cost-display').attr('data-group-index', newGroupIndex).text('');
      
      // Update all form elements in the new group
      $newGroup.find("input, select, textarea").each(function() {
        const $input = jQuery(this);
        
        // Update name attribute
        let name = $input.attr("name");
        if (name) {
          name = name.replace(/group_fields\[\d+\]/, `group_fields[${newGroupIndex}]`);
          $input.attr("name", name);
        }
        
        // Handle quantity field
        if ($input.hasClass('group-quantity')) {
          $input
            .attr('data-group-index', newGroupIndex)
            .val(1); // Reset quantity to 1
          
          const unitPrice = parseFloat($input.data('unit-price'));
          $input.closest('.custom-field')
            .find('label')
            .text(`Group (${newGroupIndex}) quantity ($${unitPrice.toFixed(2)} unit price)`);
        } else {
          // Reset other inputs
          if ($input.is(':checkbox, :radio')) {
            $input.prop('checked', false);
          } else {
            $input.val('');
          }
        }
      });

      // Show delete button
      $newGroup.find(".delete-group-button").show();
      
      // Add the new group
      jQuery("#grouped-fields-container").append($newGroup);

      // Initialize handlers for this new group only
      initializeGroupVariationHandlers($newGroup);
      
      // Show all delete buttons if more than one group
      if (jQuery(".group-field-set").length > 1) {
        jQuery(".delete-group-button").show();
      }

      // Trigger immediate price calculation
      calculateAndUpdatePrice();
    }

    // Initialize event handlers
    function initializeHandlers() {
      // Remove any existing handlers

      // initialise event handlers for variations
      initializeVariations();

      // initialise event handlers for groups
      const $groups = jQuery('.group-field-set');
      for (let i = 0; i < $groups.length; i++) {
        initializeGroupVariationHandlers(jQuery($groups[i]));
      }

      jQuery('.add-group-button').off('click');

      // Add group button handler
      jQuery('.add-group-button').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        addNewGroup();
      });

      if (!productJson?.groupVariationFields?.length) {
        // if the product has no group variation fields then we update the value of the quantity
        // field to the productJson.defaultJob.quantity and also set event listners to the quantity field
        const $quantityInput = jQuery('input.qty');
        console.log('Quantity input found:', $quantityInput.length > 0);
        
        if ($quantityInput.length > 0) {
          $quantityInput.val(productJson.defaultJob.quantity);
          
          // Remove any existing handlers
          $quantityInput.off('change');
          
          // Add the new handler
          $quantityInput.on('change', function(e) {
            calculateAndUpdatePrice();
          });
          
          // Also bind to input event for immediate feedback
          $quantityInput.on('input', function(e) {
            calculateAndUpdatePrice();
          });
        }
      }
    }

    function updateGroupLabel($input) {
      const groupIndex = $input.data('group-index');
      const unitPrice = parseFloat($input.data('unit-price'));
      $input.closest('.custom-field')
        .find('label')
        .text('Group (' + groupIndex + ') ($' + unitPrice.toFixed(2) + ' unit price)');
    }

    // Function to process variations from a container
    function processVariations($container, variationsArray) {
      $container.find('.custom-field').each(function() {
        const $fieldContainer = jQuery(this);
        const $input = $fieldContainer.find('input, select, textarea').first();
        const variationFieldData = $input.data('variation-field');
        const variationFieldId = variationFieldData?.id;

        if (!variationFieldId) return;

        // Find the index of the variation by matching the variationFieldId
        const variationIndex = variationsArray.findIndex(v => v.variationField.id === variationFieldId);
        if (variationIndex === -1) return;

        // Get the value based on input type
        let value = null;
        if ($input.is('select')) {
          value = $input.val();
        } else if ($input.is('input[type="text"], input[type="number"], textarea')) {
          value = $input.val();
        } else if ($input.is('input[type="radio"], input[type="checkbox"]')) {
          const $checked = $fieldContainer.find('input:checked');
          if ($checked.length) {
            value = $checked.val();
          }
        } else if ($input.is('input[type="color"]')) {
          value = $input.val();
        }

        // Update the value of the variation
        variationsArray[variationIndex].value = value;
      });
    }

    // Function to gather form data with proper group handling
    async function gatherFormData() {
      // Process variation groups
      const { groupVariationFields } = defaultJobJson.product;

      const formData = {
        ...defaultJobJson,
        variationsGroups: [],
        variations: []
      };

      // Process group variations
      if (groupVariationFields?.length) {
        jQuery('.group-field-set').each(function(groupIndex) {
          const $group = jQuery(this);

          // push the group to the form data and update the quantity
          formData.variationsGroups.push({
            quantity: parseInt($group.find('.group-quantity').val()) || 1,
            variations: [...defaultJobJson.variationsGroups[0].variations],
          });

          // Process variations within this group
          processVariations($group, formData.variationsGroups[groupIndex].variations);
        });
      } else {
        formData.quantity = parseInt(jQuery('input.qty').val()) || 1;
      }

      // Process standalone variations
      processVariations(jQuery('.custom-variation-options'), formData.variations);

      return formData;
    }

    // Function to initialgize
    function initialize() {
      fetchProductDetails()
      .then(() => {
        initializeHandlers();
        calculateAndUpdatePrice();
      })
      .catch(error => {
        initializeHandlers();
      });
    }

    // Remove any existing initialization
    if (window.merchiFormInitialized) {
      return;
    }
    window.merchiFormInitialized = true;

    // Start initialization when document is ready
    jQuery(document).ready(initialize);
  });
}

// Start initialization
initializeWhenReady();

// Function to validate form data
function validateForm() {
    const errors = [];
    const $form = jQuery('.merchi-product-form');
    
    // Validate required fields
    $form.find('.custom-field[data-required="true"]').each(function() {
        const $container = jQuery(this);
        const $input = $container.find('input, select, textarea').first();
        const fieldName = $input.data('field-name') || 'Field';
        
        if ($input.is('input[type="radio"], input[type="checkbox"]')) {
            const $checked = $container.find('input:checked');
            if ($checked.length === 0) {
                errors.push(`${fieldName} is required`);
                $container.addClass('field-error');
            } else {
                $container.removeClass('field-error');
            }
        } else if (!$input.val()) {
            errors.push(`${fieldName} is required`);
            $input.addClass('field-error');
        } else {
            $input.removeClass('field-error');
        }
    });

    // Validate quantities
    jQuery('.group-quantity').each(function() {
        const $input = jQuery(this);
        const quantity = parseInt($input.val());
        if (isNaN(quantity) || quantity < 1) {
            errors.push('Quantity must be at least 1');
            $input.addClass('field-error');
        } else {
            $input.removeClass('field-error');
        }
    });

    // Display errors if any
    const $errorContainer = jQuery('.form-error-container');
    if (errors.length > 0) {
        if ($errorContainer.length === 0) {
            jQuery('<div class="form-error-container"></div>').insertAfter('.merchi-product-form');
        }
        $errorContainer.html(errors.map(error => `<div class="form-error">${error}</div>`).join(''));
        return false;
    } else {
        $errorContainer.remove();
        return true;
    }
}

// Function to handle loading state
function setLoadingState(isLoading) {
    const $button = jQuery('.product-button-add-to-cart');
    if (isLoading) {
        $button.addClass('loading').prop('disabled', true);
    } else {
        $button.removeClass('loading').prop('disabled', false);
    }
}

// Modify the existing click handler
jQuery(document).on('click', '.product-button-add-to-cart', function(e) {
    e.preventDefault();
    
    // Validate form before proceeding
    if (!validateForm()) {
        return;
    }

    setLoadingState(true);

    // Rest of your existing click handler code...
    // Make sure to call setLoadingState(false) in both success and error cases
    try {
        // Your existing code...
        if (scriptData.is_single_product) {
            const cookie = getCookieByName("cart-" + scriptData.merchi_domain);
            // ... rest of the code ...
            
            jQuery.ajax({
                method: "POST",
                url: frontendajax.ajaxurl,
                data: {
                    action: "send_id_for_add_cart",
                    item: cartPayload,
                },
                success: function (response) {
                    setLoadingState(false);
                    window.location.href = site_url + '/cart/';
                },
                error: function (error) {
                    setLoadingState(false);
                    alert("Something went wrong, Please try again later");
                },
            });
        }
    } catch (error) {
        setLoadingState(false);
        console.error(error);
        alert("An error occurred. Please try again.");
    }
});
