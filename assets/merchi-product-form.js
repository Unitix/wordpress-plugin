jQuery(document).ready(function($) {
    // Get the Merchi product ID from the page
    const merchiProductId = $('#merchi-product-id').val();
    const merchiApiUrl = $('#merchi-api-url').val();

    // Function to serialize form data
    function serializeFormData() {
        const formData = {};
        $('.merchi-product-form select, .merchi-product-form input[type="checkbox"], .merchi-product-form input[type="radio"]').each(function() {
            const field = $(this);
            const name = field.attr('name');
            
            if (name) {
                if (field.is('select')) {
                    formData[name] = field.val();
                } else if (field.is('input[type="checkbox"]')) {
                    // For checkboxes, only include if checked
                    if (field.is(':checked')) {
                        formData[name] = field.val();
                    }
                } else if (field.is('input[type="radio"]')) {
                    // For radio buttons, only include if checked
                    if (field.is(':checked')) {
                        formData[name] = field.val();
                    }
                }
            }
        });
        return formData;
    }

    // Function to update price via Merchi API
    function updatePrice(formData) {
        $.ajax({
            url: merchiApiUrl + 'v6/products/' + merchiProductId + '/specialised-order-estimate/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify({
                formData: formData
            }),
            success: function(response) {
                if (response && response.price) {
                    // Update the price display
                    $('#merchi-product-price').text(response.price.toFixed(2));
                    
                    // Update WooCommerce price if needed
                    if (typeof wc_price !== 'undefined') {
                        $('.woocommerce-Price-amount').text(wc_price(response.price));
                    }
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

    // Listen for form changes on select, checkbox, and radio inputs
    $('.merchi-product-form').on('change', 'select, input[type="checkbox"], input[type="radio"]', function() {
        const formData = serializeFormData();
        debouncedUpdatePrice(formData);
    });
});
