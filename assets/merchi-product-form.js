// Wait for both jQuery and Merchi SDK to be ready
function initializeWhenReady() {
  if (!window.MERCHI_SDK) {
    window.addEventListener('merchi_sdk_ready', initializeWhenReady);
    return;
  }

  // Ensure SDK is properly initialized
  if (!window.MERCHI_SDK.Job || !window.MERCHI_SDK.getJobQuote) {
    return;
  }

jQuery(document).ready(function($) {
    // Debug mode configuration
    const debugMode = window.merchiConfig && window.merchiConfig.debugMode || false;
    
    // Logging helper
    const log = {
      debug: function(...args) {
        if (debugMode) {
        }
      },
      error: function(...args) {
      }
    };

  // Get the Merchi product ID from the page
  const merchiProductId = merchiConfig.productId;
  const merchiApiUrl = merchiConfig.apiUrl;
  let productJson = null;
  let defaultJobJson = null;

    // Function to fetch product details
    function fetchProductDetails() {
      return new Promise((resolve) => {
        const productEnt = new MERCHI_SDK.Product().id(merchiProductId);
        
        productEnt.get(
          (product) => {
            productJson = window.MERCHI_SDK.toJson(product);
            // Ensure we have a valid defaultJob structure
            defaultJobJson = productJson.defaultJob;
            resolve(productJson);
          },
          (error) => {
            const fallbackData = { 
              id: parseInt(merchiProductId),
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
    let lastFormData = null;
    let lastCalculationTime = 0;
    const DEBOUNCE_DELAY = 300; // 300ms debounce
    const MIN_CALCULATION_INTERVAL = 500; // Minimum 500ms between calculations
    
    // Function to debounce price calculations with rate limiting
    function debouncedCalculatePrice() {
      const now = Date.now();
      clearTimeout(priceCalculationTimeout);
      
      // If we recently calculated, delay more
      if (now - lastCalculationTime < MIN_CALCULATION_INTERVAL) {
        priceCalculationTimeout = setTimeout(calculateAndUpdatePrice, DEBOUNCE_DELAY);
        return;
      }
      
      calculateAndUpdatePrice();
    }

    // Function to create a job structure based on form data
    function createJobFromForm(formData) {
      if (!window.MERCHI_SDK) {
        throw new Error('Merchi SDK is not loaded');
      }
      
      if (!productJson) {
        return null;
      }

      try {
        // Get domain_id from various possible sources
        const domainId = defaultJobJson.domain_id ||
                        (formData.job && formData.job.domain && formData.job.domain.id) ||
                        merchiConfig.domainId;

        // Get product_id from various possible sources
        const productId = defaultJobJson.product_id ||
                         (formData.job && formData.job.product && formData.job.product.id) ||
                         merchiProductId;

        if (!domainId || !productId) {
          throw new Error('Missing required domain or product ID');
        }

        // Create a new job entity using the SDK
        const jobEntity = new window.MERCHI_SDK.Job();
        
        // Set the domain
        const domain = new window.MERCHI_SDK.Domain();
        domain.id(parseInt(domainId));
        jobEntity.domain(domain);

        // Set the product
        const product = new window.MERCHI_SDK.Product();
        product.id(parseInt(productId));
        jobEntity.product(product);

        // Initialize empty arrays for variations and groups
        jobEntity.variations([]);
        jobEntity.variationsGroups([]);

        // Process variation groups
        if (formData.job && formData.job.variations_groups) {
          const variationsGroups = [];
          formData.job.variations_groups.forEach(group => {
            if (group && group.variations) {
              const groupEntity = new window.MERCHI_SDK.VariationsGroup();
              groupEntity.quantity(parseInt(group.quantity) || 1);
              
              const variations = [];
              group.variations.forEach(variation => {
                if (variation && variation.value && variation.variationField) {
                  const variationEntity = new window.MERCHI_SDK.Variation();
                  const variationField = new window.MERCHI_SDK.VariationField();
                  variationField.id(parseInt(variation.variationField.id));
                  variationEntity.variationField(variationField);
                  variationEntity.value(variation.value);
                  variations.push(variationEntity);
                }
              });

              if (variations.length > 0) {
                groupEntity.variations(variations);
                variationsGroups.push(groupEntity);
              }
            }
          });

          if (variationsGroups.length > 0) {
            jobEntity.variationsGroups(variationsGroups);
          }
        }

        // Process standalone variations
        if (formData.job && formData.job.variations) {
          const variations = [];
          formData.job.variations.forEach(variation => {
            if (variation && variation.value && variation.variationField) {
              const variationEntity = new window.MERCHI_SDK.Variation();
              const variationField = new window.MERCHI_SDK.VariationField();
              variationField.id(parseInt(variation.variationField.id));
              variationEntity.variationField(variationField);
              variationEntity.value(variation.value);
              variations.push(variationEntity);
            }
          });

          if (variations.length > 0) {
            jobEntity.variations(variations);
          }
        }

        return jobEntity;
      } catch (error) {
        throw error;
      }
    }

    // Utility function to deeply compare two objects and log differences
    function logObjectDifferences(obj1, obj2, path = '') {
      // Skip comparison if either object is undefined/null
      if (!obj1 || !obj2) {
        return;
      }

      // Only compare specific fields we care about
      const fieldsToCompare = [
        'id',
        'name',
        'unitPrice',
        'costPerUnit',
        'currency',
        'quantity',
        'totalPrice'
      ];

      if (typeof obj1 !== typeof obj2) {
        // Only log type mismatches for fields we care about
        if (fieldsToCompare.includes(path.split('.').pop())) {
          console.warn(`Type mismatch at ${path}:`, obj1, obj2);
        }
        return;
      }

      if (typeof obj1 !== 'object') {
        if (obj1 !== obj2 && fieldsToCompare.includes(path.split('.').pop())) {
          console.warn(`Difference at ${path}:`, obj1, obj2);
        }
        return;
      }

      const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
      for (const key of keys) {
        // Only compare fields we care about
        if (fieldsToCompare.includes(key)) {
          logObjectDifferences(obj1 ? obj1[key] : undefined, obj2 ? obj2[key] : undefined, path ? `${path}.${key}` : key);
        }
      }
    }

    // Function to calculate and update price
    function calculateAndUpdatePrice() {
      const formData = gatherFormData();
      
      // Skip if form data hasn't changed
      const formDataStr = JSON.stringify(formData);
      if (lastFormData === formDataStr) {
        return;
      }
      lastFormData = formDataStr;

      // Calculate local price as fallback
      let localTotalPrice = 0;
      const $groups = $('.group-field-set');
      const groupCount = $groups.length;

      // Calculate local price for each group
      for (let i = 0; i < groupCount; i++) {
        const $group = $groups.eq(i);
        const quantity = parseInt($group.find('.group-quantity').val()) || 1;
        const wooCommercePrice = parseFloat($group.find('.group-quantity').data('unit-price')) || 0;
        const groupTotal = quantity * wooCommercePrice;
        localTotalPrice += groupTotal;

        // Add option prices for this group
        const $checkedInputs = $group.find('input:checked');
        $checkedInputs.each(function() {
          const $input = $(this);
          const selectedVariationId = $input.data('variation-field-value');
          let variationCost = 0;
          // Find the matching variation in productJson.variations
          if (productJson && productJson.variations) {
            const matchedVariation = productJson.variations.find(v => v.id == selectedVariationId);
            if (matchedVariation && typeof matchedVariation.cost === 'number') {
              variationCost = matchedVariation.cost;
            }
          }
          const optionTotal = variationCost * quantity;
          localTotalPrice += optionTotal;
        });
      }

      // Create job entity for API call
      const jobEntity = createJobFromForm(formData);
      if (!jobEntity) {
        // If job entity creation fails, use local calculation
        $('.price-amount').text('$' + localTotalPrice.toFixed(2));
        return;
      }

      // Make the API call to get the quote
      try {
        window.MERCHI_SDK.getJobQuote(
          jobEntity,
          (response) => {
            // Use the quote price if available, otherwise fallback to local calculation
            let finalPrice = localTotalPrice;
            
            // Check for quote price in different possible locations
            if (response) {
              let apiUnitPrice = null;
              if (response.quote && typeof response.quote.totalPrice === 'number') {
                finalPrice = response.quote.totalPrice;
              } else if (response.totalPrice && typeof response.totalPrice === 'number') {
                finalPrice = response.totalPrice;
              } else if (response.costPerUnit && typeof response.costPerUnit === 'number') {
                apiUnitPrice = response.costPerUnit;
                // Compare with UI unit price
                const uiUnitPrice = parseFloat($('.group-quantity').first().data('unit-price')) || 0;
                if (Math.abs(apiUnitPrice - uiUnitPrice) < 0.01) {
                  finalPrice = apiUnitPrice * totalQuantity;
                } else {
                  // Fallback to UI price if API price is not correct
                  finalPrice = uiUnitPrice * totalQuantity;
                }
              }
            }
            
            $('.price-amount').text('$' + finalPrice.toFixed(2));
          },
          (error) => {
            // On error, use local calculation
            $('.price-amount').text('$' + localTotalPrice.toFixed(2));
          }
        );
      } catch (error) {
        // On exception, use local calculation
        $('.price-amount').text('$' + localTotalPrice.toFixed(2));
      }
    }

    // Function to add a new group
    function addNewGroup() {
      // Get the first group as template
      const $firstGroup = $(".group-field-set").first();
      const newGroupIndex = $(".group-field-set").length + 1;
      
      // Clone the group
      const $newGroup = $firstGroup.clone();
      
      // Reset and update the new group
      $newGroup
        .attr("data-group-index", newGroupIndex)
        .find(".group-number")
        .text(newGroupIndex);
      
      // Update all form elements in the new group
      $newGroup.find("input, select, textarea").each(function() {
        const $input = $(this);
        
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
      $("#grouped-fields-container").append($newGroup);
      
      // Show all delete buttons if more than one group
      if ($(".group-field-set").length > 1) {
        $(".delete-group-button").show();
      }

      // Trigger immediate price calculation
      calculateAndUpdatePrice();
    }

    // Initialize event handlers
    function initializeHandlers() {
      // Remove any existing handlers
      $(document).off('change', '.custom-variation-options input, .custom-variation-options select, .group-quantity');
      $('#add-group-button').off('click');
      $(document).off('click', '.delete-group-button');

      // Add form change handler with debounce
      $(document).on('change', '.custom-variation-options input, .custom-variation-options select', function() {
        debouncedCalculatePrice();
      });

      // Handle quantity changes immediately without debounce
      $(document).on('change', '.group-quantity', function() {
        calculateAndUpdatePrice();
      });

      // Handle quantity input events (for when user types)
      $(document).on('input', '.group-quantity', function() {
        calculateAndUpdatePrice();
      });

      // Add group button handler
      $('#add-group-button').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        addNewGroup();
      });

      // Delete group handler with immediate price update
      $(document).on('click', '.delete-group-button', function(e) {
        e.preventDefault();
        const $group = $(this).closest(".group-field-set");
        $group.remove();
        updateGroupNumbers();
        // Trigger immediate price calculation
        calculateAndUpdatePrice();
      });

      // Replace the file upload preview handler
      $(document).off('change', 'input[type="file"]');
      $(document).on('change', 'input[type="file"]', function(e) {
        var $input = $(this);
        var files = Array.from(this.files);
        var $wrapper = $input.closest('.custom-upload-wrapper');
        var $previewArea = $wrapper.next('.multi-file-upload-preview');
        if ($previewArea.length === 0) {
          $previewArea = $('<div class="multi-file-upload-preview"></div>');
          $wrapper.after($previewArea);
        }

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
            var $fileBox = $('<div class="multi-file-box" style="display: flex; align-items: center; margin-bottom: 8px; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); padding: 8px;"></div>');
            var $removeBtn = $('<span class="file-upload-remove" style="margin-left: 10px; cursor: pointer; font-size: 20px; color: #d00;">&times;</span>');
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
                var $img = $('<img />', {
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
              var $fileIcon = $('<span style="font-size: 32px; margin-right: 10px;">📄</span>');
              $fileBox.prepend($fileIcon);
            }
            var $fileName = $('<span style="font-weight: bold; font-size:0.5em; color: #333;">' + file.name + '</span>');
            var $downloadBtn = $('<a style="margin-left: 10px; font-size: 18px; text-decoration: none;" href="#" download>⬇️</a>');
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
          var $count = $('<div style="color: #666; font-size: 14px; font-weight:bold; margin-top: 4px;">' + dtFiles.length + ' file' + (dtFiles.length > 1 ? 's' : '') + ' selected <span style="cursor:pointer;color:#0073aa;" class="toggle-file-list">&#9650;</span></div>');
          $previewArea.append($count);
          $count.find('.toggle-file-list').on('click', function() {
            $previewArea.toggleClass('collapsed');
            $previewArea.find('.multi-file-box').toggle();
            $(this).html($previewArea.hasClass('collapsed') ? '&#9660;' : '&#9650;');
          });
        } else {
          $previewArea.empty();
        }
        // Always show icon and instruction
        $wrapper.find('.upload-icon').show();
        $wrapper.find('.upload-instruction, .upload-types').show();
      });
    }

    function updateGroupNumbers() {
      $(".group-field-set").each(function(index) {
        const newIndex = index + 1;
        const $group = $(this);
        
        $group.attr("data-group-index", newIndex);
        $group.find(".group-number").text(newIndex);
        
        $group.find("input, select, textarea").each(function() {
          const $input = $(this);
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
      const $deleteButtons = $(".delete-group-button");
      if ($(".group-field-set").length === 1) {
        $deleteButtons.hide();
      } else {
        $deleteButtons.show();
      }

      // Trigger immediate price calculation after updating group numbers
      calculateAndUpdatePrice();
    }

    function updateGroupLabel($input) {
      const groupIndex = $input.data('group-index');
      const unitPrice = parseFloat($input.data('unit-price'));
      $input.closest('.custom-field')
            .find('label')
            .text('Group (' + groupIndex + ') quantity ($' + unitPrice.toFixed(2) + ' unit price)');
    }

    // Function to gather form data with proper group handling
    function gatherFormData() {
      const formData = {
        job: {
          domain: {
            id: parseInt(merchiConfig.domainId)
          },
          product: {
            id: parseInt(merchiProductId)
          },
          variations: [],
          variationsGroups: []
        }
      };

      // Process variation groups
      $('.group-field-set').each(function(groupIndex) {
        const $group = $(this);
        const groupQuantity = parseInt($group.find('.group-quantity').val()) || 1;
        
        const groupData = {
          quantity: groupQuantity,
          variations: []
        };

        // Process variations within this group
        $group.find('.custom-field').each(function() {
          const $container = $(this);
          const $input = $container.find('input, select, textarea').first();
          const variationFieldData = $input.data('variation-field');
          const variationFieldId = variationFieldData && variationFieldData.id;
  
          if (!variationFieldId) return;
  
          // Get the value based on input type
          let value = null;
          if ($input.is('select')) {
            value = $input.val();
          } else if ($input.is('input[type="text"], input[type="number"], textarea')) {
            value = $input.val();
          } else if ($input.is('input[type="radio"], input[type="checkbox"]')) {
            const $checked = $container.find('input:checked');
            if ($checked.length) {
              value = $checked.data('option-id') || $checked.data('variation-field-value') || $checked.val();
            }
          } else if ($input.is('input[type="color"]')) {
            value = $input.val();
          }

          if (value !== null) {
            // Create complete variation field data
            const variationField = {
              id: variationFieldId,
              name: $input.data('field-name') || '',
              position: parseInt($input.data('position')) || 0,
              required: $input.data('required') === true,
              placeholder: $input.data('placeholder') || '',
              fieldType: parseInt($input.data('field-type')) || 0,
              sellerProductEditable: $input.data('seller-product-editable') === true,
              multipleSelect: $input.data('multiple-select') === true,
              options: []
            };

            // Get options from the API response data stored in the input
            if (variationFieldData && variationFieldData.options) {
              variationField.options = variationFieldData.options.map(option => ({
                id: parseInt(option.id),
                value: option.value,
                currency: option.currency || 'AUD',
                position: parseInt(option.position) || 0,
                variationCost: parseFloat(option.variationCost) || 0,
                variationUnitCost: parseFloat(option.variationUnitCost) || 0
              }));
            }

            // Create variation data with nested structure
            const variationData = {
              value: value,
              variationField: variationField
            };

            groupData.variations.push(variationData);
          }
        });

        // Only add group if it has variations or a quantity
        if (groupData.variations.length > 0 || groupData.quantity > 1) {
          formData.job.variationsGroups.push(groupData);
        }
      });

      // Process standalone variations (outside groups)
      $('.custom-variation-options .custom-field').each(function() {
        const $container = $(this);
        const $input = $container.find('input, select, textarea').first();
        const variationFieldData = $input.data('variation-field');
        const variationFieldId = variationFieldData && variationFieldData.id;
    
        if (!variationFieldId) return;
    
        // Get the value based on input type
        let value = null;
        if ($input.is('select')) {
          value = $input.val();
        } else if ($input.is('input[type="text"], input[type="number"], textarea')) {
          value = $input.val();
        } else if ($input.is('input[type="radio"], input[type="checkbox"]')) {
          const $checked = $container.find('input:checked');
          if ($checked.length) {
            value = $checked.data('option-id') || $checked.data('variation-field-value') || $checked.val();
          }
        } else if ($input.is('input[type="color"]')) {
          value = $input.val();
        }

        if (value !== null) {
          // Create complete variation field data
          const variationField = {
            id: variationFieldId,
            name: $input.data('field-name') || '',
            position: parseInt($input.data('position')) || 0,
            required: $input.data('required') === true,
            placeholder: $input.data('placeholder') || '',
            fieldType: parseInt($input.data('field-type')) || 0,
            sellerProductEditable: $input.data('seller-product-editable') === true,
            multipleSelect: $input.data('multiple-select') === true,
            options: []
          };

          // Get options from the API response data stored in the input
          if (variationFieldData && variationFieldData.options) {
            variationField.options = variationFieldData.options.map(option => ({
              id: parseInt(option.id),
              value: option.value,
              currency: option.currency || 'AUD',
              position: parseInt(option.position) || 0,
              variationCost: parseFloat(option.variationCost) || 0,
              variationUnitCost: parseFloat(option.variationUnitCost) || 0
            }));
          }

          // Create variation data with nested structure
          const variationData = {
            value: value,
            variationField: variationField
          };

          formData.job.variations.push(variationData);
        }
      });

      // Add total quantity to the form data to ensure cache invalidation on quantity changes
      formData.totalQuantity = $('.group-quantity').toArray().reduce((sum, input) => {
        return sum + (parseInt($(input).val()) || 1);
      }, 0);

      return formData;
    }

    function updateVariationOptionPrices() {
      let variationsMap = {};
      let groups = productJson && productJson.defaultJob && productJson.defaultJob.variationsGroups;
      if (Array.isArray(groups) && groups.length > 0) {
        groups.forEach(group => {
          if (Array.isArray(group.variations)) {
            group.variations.forEach(variation => {
              if (variation.value !== undefined) {
                variationsMap[variation.value] = variation;
              }
            });
          }
        });
      }
      if (Object.keys(variationsMap).length === 0) {
        return;
      }
      $('[data-variation-field-value]').each(function() {
        const $input = $(this);
        const variationValue = $input.data('variation-field-value');
        const matchedVariation = variationsMap[variationValue];
        if (matchedVariation && typeof matchedVariation.cost === 'number') {
          const $label = $input.closest('label').find('.option-label, .image-title, .color-name');
          if ($label.length) {
            $label.each(function() {
              const labelText = $(this).text().replace(/\(\+.*\)/, '');
              $(this).text(labelText.trim() + ` (+ $${matchedVariation.cost.toFixed(2)} per unit)`);
            });
          }
        }
      });
    }

    // Function to initialize
    function initialize() {
      fetchProductDetails()
        .then(() => {
          // Wait until productJson and productJson.variations are available
          if (!productJson || !productJson.variations) {
            setTimeout(() => {
              updateVariationOptionPrices();
            }, 100);
          } else {
            updateVariationOptionPrices();
          }
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
    $(document).ready(initialize);
  });
}

// Start initialization
initializeWhenReady();