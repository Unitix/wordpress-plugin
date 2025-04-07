jQuery(document).ready(function($) {
  // Get the Merchi product ID from the page
  const merchiProductId = merchiConfig.productId;
  const merchiApiUrl = merchiConfig.apiUrl;

  

  // Function to set nested object value
  function setNestedValue(obj, path, value) {
      const keys = path.split('.');
      let current = obj;

      for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          // Handle array notation in keys (e.g., variations[1])
          const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
          if (arrayMatch) {
              const arrayKey = arrayMatch[1];
              const arrayIndex = parseInt(arrayMatch[2]);
              if (!current[arrayKey]) {
                  current[arrayKey] = [];
              }
              if (!current[arrayKey][arrayIndex]) {
                  current[arrayKey][arrayIndex] = {};
              }
              current = current[arrayKey][arrayIndex];
          } else {
              if (!current[key]) {
                  current[key] = {};
              }
              current = current[key];
          }
      }

      const lastKey = keys[keys.length - 1];
      const arrayMatch = lastKey.match(/(\w+)\[(\d+)\]/);
      if (arrayMatch) {
          const arrayKey = arrayMatch[1];
          const arrayIndex = parseInt(arrayMatch[2]);
          if (!current[arrayKey]) {
              current[arrayKey] = [];
          }
          current[arrayKey][arrayIndex] = value;
      } else {
          current[lastKey] = value;
      }
  }

  // Function to serialize form data
  function serializeFormData() {
    const data = {};
  
    // Get quantity from input
    const quantity = $('input[name="quantity"]').val();
    if (quantity) {
      data['quantity'] = quantity;
    }
  
    // Static product ID
    data['product-0-id'] = 47308;
    data['product-count'] = 1;
  
    let variationIndex = 0;
  
    // Loop over each .custom-attribute-option and extract valid fields
    $('.custom-attribute-option').each(function() {
      const container = $(this);
      const field = container.find('select, input[type="checkbox"], input[type="radio"]');
      const variationFieldId = field.attr('data-variation-field-id');
  
      if (!variationFieldId) return;
  
      let fieldValue;
  
      if (field.is('select')) {
        // Get selected option's data-variation-field-value
        const selectedOption = field.find('option:selected');
        fieldValue = selectedOption.data('variation-field-value');
      } else if (field.is('input[type="checkbox"]') || field.is('input[type="radio"]')) {
        if (field.is(':checked')) {
          fieldValue = field.data('variation-field-value');
        }
      }
  
      // Only add if value is present
      if (fieldValue !== undefined) {
        data[`variations-${variationIndex}-value`] = fieldValue;
        data[`variations-${variationIndex}-variationField-0-id`] = variationFieldId;
        variationIndex++; // Increment only if valid entry added
      }
    });
  
    // Convert to FormData
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }
  
    return formData;
  }  
  

  function createFormDataFromFlatObject(data) {
    const formData = new FormData();
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        formData.append(key, data[key]);
      }
    }
    return formData;
  }

  // Function to update price via Merchi API
  function updatePrice(formData) {
      $.ajax({
          url: merchiApiUrl + 'v6/specialised-order-estimate/?skip_rights=y&product_id='+ merchiProductId,
          method: 'POST',
          data: formData,
          processData: false,
          contentType: false, // Important: Let browser set multipart/form-data headers
          success: function(response) {
            console.log('Merchi Response', response);
              if (response && response.price) {
                  console.log('Merchi Product Price', response.price);
              }
          },
          error: function(xhr, status, error) {
              console.error('Error updating price:', error);
              // Show error message to user
              $('#merchi-price-error').text('Error updating price. Please try again.').show();
          }
      });
  }

  // Debounce function to limit API calls
  function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
          const later = () => {
              clearTimeout(timeout);
              func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
      };
  }

  // Debounced version of updatePrice
  const debouncedUpdatePrice = debounce(function(formData) {
      updatePrice(formData);
  }, 500);

  console.log("We are ready herw!!");

  // Listen for form changes on select, checkbox, and radio inputs
  $('.custom-attribute-option').on('change', 'input[type="radio"]', function() {
    console.log("We are ready herw again!!");
      const formData = serializeFormData();
      debouncedUpdatePrice(formData);
  });
});