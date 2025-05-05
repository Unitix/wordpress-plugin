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
                domaini: {id: merchiConfig.domainId},
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

    // Function to calculate and update price
    function calculateAndUpdatePrice() {
      const formData = gatherFormData();
      
      // Skip if form data hasn't changed
      const formDataStr = JSON.stringify(formData);
      if (lastFormData === formDataStr) {
        return;
      }
      lastFormData = formDataStr;

      // Get the WooCommerce product price from the quantity input
      const wooCommercePrice = parseFloat($('.group-quantity').first().data('unit-price')) || 0;

      // Calculate total price based on groups
      let totalPrice = 0;
      const $groups = $('.group-field-set');
      const groupCount = $groups.length;

      // Calculate price for each group
      for (let i = 0; i < groupCount; i++) {
        const $group = $groups.eq(i);
        const quantity = parseInt($group.find('.group-quantity').val()) || 1;
        const groupTotal = quantity * wooCommercePrice;
        totalPrice += groupTotal;

        // Add option prices for this group
        const $checkedInputs = $group.find('input:checked');
        $checkedInputs.each(function() {
          const $input = $(this);
          const unitCost = parseFloat($input.data('variation-unit-cost')) || 0;
          const optionTotal = unitCost * quantity;
          totalPrice += optionTotal;
        });
      }

      $('.price-amount').text('$' + totalPrice.toFixed(2));

      // Create job entity for API call (but don't use its price)
      console.log(formData, 'what is this james?');
      const jobEntity = createJobFromForm(formData);
      if (!jobEntity) {
        return;
      }

      // Still make the API call to keep the backend in sync
      try {
        window.MERCHI_SDK.getJobQuote(
          jobEntity,
          (response) => {},
          (error) => {}
        );
      } catch (error) {
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
      $(document).off('change', '#custom-variation-options input, #custom-variation-options select, .group-quantity');
      $('#add-group-button').off('click');
      $(document).off('click', '.delete-group-button');

      // Add form change handler with debounce
      $(document).on('change', '#custom-variation-options input, #custom-variation-options select', function() {
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

    // Function to initialize
    function initialize() {
      fetchProductDetails()
        .then(() => {
          mapProductDataToForm();
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