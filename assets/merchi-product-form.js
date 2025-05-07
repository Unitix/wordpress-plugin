// Wait for both jQuery and Merchi SDK to be ready
function initializeWhenReady() {
  const merchiSdk = window.MERCHI_SDK;
  if (!merchiSdk) {
    window.addEventListener('merchi_sdk_ready', initializeWhenReady);
    return;
  }

  // Ensure SDK is properly initialized
  if (!merchiSdk) {
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
      if (!merchiSdk) throw new Error('Merchi SDK is not loaded');

      try {
        if (!defaultJobJson) {
          throw new Error('No defaultJos json.');
        }

        const jobEnt = merchiSdk.fromJson(new merchiSdk.Job(), defaultJobJson);

        // Initialize empty arrays for variations and groups
        jobEnt.variations([]);
        jobEnt.variationsGroups([]);

        // Process variation groups
        const { job } = formData;
        console.log(job, 'what is this');
        if (job && job.variationsGroups) {
          const variationsGroups = [];
          job.variationsGroups.forEach(group => {
            if (group?.variations) {
              const variations = [];
              const groupEntity = new merchiSdk.VariationsGroup()
                .quantity(parseInt(group.quantity) || 1)
                .variations([]);

              group.variations.forEach(variation => {
                console.log(variation, 'what is this variation');
                if (variation?.variationField) {
                  const variationEntity = new merchiSdk.Variation()
                    .value(variation.value)
                  const variationField = new merchiSdk.VariationField()
                    .id(parseInt(variation.variationField.id));
                  variationEntity.variationField(variationField);
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
            jobEnt.variationsGroups(variationsGroups);
          }
        }

        // Process standalone variations
        if (job?.variations) {
          const variations = [];
          job.variations.forEach(variation => {
            if (variation?.variationField) {
              const variationEntity = new merchiSdk.Variation()
                .value(variation.value);
              const variationField = new merchiSdk.VariationField()
                .id(parseInt(variation.variationField.id));
              variationEntity.variationField(variationField);
              variations.push(variationEntity);
            }
          });

          if (variations.length > 0) {
            jobEnt.variations(variations);
          }
        }

        return jobEnt;
      } catch (error) {
        console.log(error, 'what is this error');
        throw error;
      }
    }

    // Function to calculate and update price
    function calculateAndUpdatePrice() {
      const formData = gatherFormData();
      let totalPrice = 0;
      
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
          const unitCost = parseFloat($input.data('variation-unit-cost')) || 0;
          const optionTotal = unitCost * quantity;
          localTotalPrice += optionTotal;
        });
      }

      $('.price-amount').text('$' + totalPrice.toFixed(2));

      // Create job entity for API call (but don't use its price)
      const jobEntity = createJobFromForm(formData);
      if (!jobEntity) {
        // If job entity creation fails, use local calculation
        $('.price-amount').text('$' + localTotalPrice.toFixed(2));
        return;
      }

      // Make the API call to get the quote
      try {
        console.log('tryy getquote', jobEntity);
        merchiSdk.getJobQuote(
          jobEntity,
          (response) => {
            // Use the quote price if available, otherwise fallback to local calculation
            let finalPrice = localTotalPrice;
            
            // Check for quote price in different possible locations
            console.log('in success');
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
        console.log('in error', error);
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
          name = name.replace(/job.variationsGroups\[\d+\]/, `job.variationsGroups[${newGroupIndex}]`);
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
      $(document).off('change', '#custom-variation-options input, #custom-variation-options select, .group-quantity');
      $('#add-group-button').off('click');
      $(document).off('click', '.delete-group-button');

      // Add form change handler with debounce
      $(document).on('change', '#custom-variation-options input, #custom-variation-options select', function() {
        debouncedCalculatePrice();
      });

      // Handle quantity changes immediately without debounce
      $(document).on('change', '.group-quantity', function() {
        debouncedCalculatePrice();
      });

      // Handle quantity input events (for when user types)
      $(document).on('input', '.group-quantity', function() {
        debouncedCalculatePrice();
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
            const newName = name.replace(/job.variationsGroups\[\d+\]/, "job.variationsGroups[" + newIndex + "]");
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
          const variationFieldId = $input.data('variation-field-id');
          const fieldType = parseInt($input.data('field-type'));
          const variationFieldData = $input.data('variation-field');

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
              fieldType: fieldType,
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
      $('#custom-variation-options .custom-field').each(function() {
        const $container = $(this);
        const $input = $container.find('input, select, textarea').first();
        const variationFieldId = $input.data('variation-field-id');
        const fieldType = parseInt($input.data('field-type'));
        const variationFieldData = $input.data('variation-field');
    
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
            fieldType: fieldType,
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