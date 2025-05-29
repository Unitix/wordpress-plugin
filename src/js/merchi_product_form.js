// Wait for both jQuery and Merchi SDK to be ready
import { MERCHI_SDK } from './merchi_sdk';
import { getCookieByName } from './utils';
import { initializeCheckout } from './merchi_checkout_init';

function initializeWhenReady() {
  const merchiSdk = MERCHI_SDK();

  async function uploadFileToMerchi(file) {
    const merchiFile = new merchiSdk.File().fromFormFile(file);
    return new Promise((resolve, reject) => {
      merchiFile.publicCreate((merchiFile) => {
        resolve(merchiFile);
      }, (status, data) => reject(data));
    });
  }

  if (!merchiSdk) {
    window.addEventListener('merchi_sdk_ready', initializeWhenReady);
    return;
  }

  // Ensure SDK is properly initialized
  if (!merchiSdk.Job || !merchiSdk.getJobQuote) {
    return;
  }

  jQuery(document).ready(function($) {
    const merchiProductId = merchiConfig.productId;
    let productJson = {};
    let defaultJobJson = {};
    let productClone = {};

    // Function to create a deep clone of an object
    const deepClone = (obj) => {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch (e) {
        console.error('Deep clone failed:', e);
        return {};
      }
    };

    // Add cart-loader and cart-count elements if not present
    if ($('#cart-loader').length === 0) {
      $('body').prepend('<div id="cart-loader" style="display:none;position:fixed;top:20px;right:20px;z-index:9999;"><div style="width:32px;height:32px;border:4px solid #eee;border-top:4px solid #3498db;border-radius:50%;animation:spin 1s linear infinite;"></div></div>');
    }
    if ($('#cart-count').length === 0) {
      // Add to header if exists, else to body
      if ($('header').length > 0) {
        $('header').append('<span id="cart-count" style="margin-left:16px;font-weight:bold;">0</span>');
      } else {
        $('body').prepend('<span id="cart-count" style="position:fixed;top:20px;left:20px;z-index:9999;font-weight:bold;">0</span>');
      }
    }

    // Function to fetch product details
    function fetchProductDetails() {
      return new Promise((resolve) => {
        const productEnt = new merchiSdk.Product().id(merchiProductId);
        
        productEnt.get(
          (product) => {
            productJson = merchiSdk.toJson(product);
            // Create a deep clone of the original product data
            productClone = deepClone(productJson);
            // Ensure we have a valid defaultJob structure
            defaultJobJson = productJson.defaultJob;

            // Initialize the checkout component
            initializeCheckout(productJson, defaultJobJson);
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
            productClone = deepClone(fallbackData);
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
        costPerUnit,
        taxType,
        totalCost,
        variations = [],
        variationsGroups = [],
      } = response;

      // loop over the variationsGroups
      for (let i = 0; i < variationsGroups.length; i++) {
        const {
          variations = [],
          groupCost = 0,
        } = variationsGroups[i];

        jQuery('label[data-update-label="true"][data-group-index="' + i + '"]').each(function() {
          const $label = jQuery(this);
          const variationFieldId = $label.data('variation-field-id');
          const variation = variations.find(v => v.variationField?.id === variationFieldId);
          updateVariationLabel($label, variation);
        });

        const $groupCostDisplay = jQuery('.group-cost-display[data-group-index="' + (i) + '"]');
        $groupCostDisplay
          .attr('data-group-cost', groupCost)
          .text('Group Cost: $' + groupCost.toFixed(2));
        
        // Update the closest group number
        const $groupFieldSet = $groupCostDisplay.closest('.group-field-set');
        $groupFieldSet.find('.group-number').text(i + 1);
        
        // Update the unit price display
        $groupFieldSet.find('.group-unit-price').text('( $' + costPerUnit.toFixed(2) + ' per unit )');
      }

      jQuery('label[data-update-label="true"][data-group-index="false"]').each(function() {
        const $label = jQuery(this);
        const variationFieldId = $label.data('variation-field-id');
        const variation = variations.find(v => v.variationField?.id === variationFieldId);
        updateVariationLabel($label, variation);
      });

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

        $input.off('change.file-input').on('change.file-input', async function(e) {
          var files = Array.from(this.files);
          
          // --- Maintain a DataTransfer object for this input ---
          if (!$input[0]._dt) {
            $input[0]._dt = new DataTransfer();
          }
          var dt = $input[0]._dt;

          // Add new files, avoiding duplicates by name+size
          for (const file of files) {
            var exists = false;
            for (var i = 0; i < dt.items.length; i++) {
              var f = dt.items[i].getAsFile();
              if (f.name === file.name && f.size === file.size) {
                exists = true;
                break;
              }
            }
            
            if (!exists) {
              try {
                // Upload file to Merchi first
                const merchiFile = await uploadFileToMerchi(file);
                const merchiFileJson = merchiSdk.toJson(merchiFile);
                
                // Add to DataTransfer
                dt.items.add(file);
                
                // Create file box with Merchi data
                var $fileBox = jQuery('<div class="multi-file-box" style="display: flex; align-items: center; margin-bottom: 8px; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); padding: 8px;"></div>');
                
                // Add Merchi file data attributes
                $fileBox.attr({
                  'data-merchi-file': JSON.stringify(merchiFileJson),
                  'data-download-url': merchiFileJson.downloadUrl,
                  'data-view-url': merchiFileJson.viewUrl,
                  'data-mimetype': merchiFileJson.mimetype
                });

                var $removeBtn = jQuery('<span class="file-upload-remove" style="margin-left: 10px; cursor: pointer; font-size: 20px; color: #d00;">&times;</span>');
                $removeBtn.on('click', function(e) {
                  e.stopPropagation();
                  var newDT = new DataTransfer();
                  Array.from(dt.files).forEach(function(f, i) {
                    if (f.name !== file.name || f.size !== file.size) {
                      newDT.items.add(f);
                    }
                  });
                  $input[0]._dt = newDT;
                  $input[0].files = newDT.files;
                  $fileBox.remove();
                  if ($previewArea.find('.multi-file-box').length === 0) {
                    $previewArea.empty();
                  } else {
                    updateFileCount($previewArea);
                  }
                  $input.trigger('change');
                });

                if (file.type.startsWith('image/')) {
                  // Use Merchi viewUrl for images
                  var $img = jQuery('<img />', {
                    src: merchiFileJson.viewUrl,
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
                } else {
                  var $fileIcon = jQuery('<span style="font-size: 32px; margin-right: 10px;">📄</span>');
                  $fileBox.prepend($fileIcon);
                }

                var $fileName = jQuery('<span style="font-weight: bold; font-size:0.5em; color: #333;">' + file.name + '</span>');
                var $downloadBtn = jQuery('<a style="margin-left: 10px; font-size: 18px; text-decoration: none;" href="' + merchiFileJson.downloadUrl + '" download>⬇️</a>');
                
                $fileBox.append($fileName).append($downloadBtn).append($removeBtn);
                $previewArea.append($fileBox);
                
                // Update file count display
                updateFileCount($previewArea);
              } catch (error) {
                console.error('Error processing file:', error);
                // Optionally show error to user
                alert('Failed to upload file: ' + file.name);
              }
            }
          }
          
          // Update input files
          $input[0].files = dt.files;
          
          // Always show icon and instruction
          $wrapper.find('.upload-icon').show();
          $wrapper.find('.upload-instruction, .upload-types').show();
        });
      });
    }

    // Helper function to update file count display
    function updateFileCount($previewArea) {
      const fileCount = $previewArea.find('.multi-file-box').length;
      let $count = $previewArea.find('.file-count-display');
      
      if ($count.length === 0) {
        $count = jQuery('<div class="file-count-display" style="color: #666; font-size: 14px; font-weight:bold; margin-top: 4px;"></div>');
        $previewArea.append($count);
      }
      
      $count.html(
        fileCount + ' file' + (fileCount > 1 ? 's' : '') + 
        ' selected <span style="cursor:pointer;color:#0073aa;" class="toggle-file-list">&#9650;</span>'
      );
      
      $count.find('.toggle-file-list').off('click').on('click', function() {
        $previewArea.toggleClass('collapsed');
        $previewArea.find('.multi-file-box').toggle();
        jQuery(this).html($previewArea.hasClass('collapsed') ? '&#9660;' : '&#9650;');
      });
    }

    function actionDeleteGroup(e) {
      e.preventDefault();
      const $group = jQuery(this).closest(".group-field-set");
      $group.remove();
      updateGroupNumbers();
      // Trigger immediate price calculation
      calculateAndUpdatePrice();
    }

    // Initialize event handlers
    function initializeHandlers() {
      // Remove any existing handlers
      jQuery(document).off('change', '.custom-variation-options input, .custom-variation-options select, .group-quantity');
      jQuery('#add-group-button').off('click');
      jQuery(document).off('click', '.delete-group-button');

      // add loop here
      jQuery('.custom-field input, .custom-field select, .custom-field textarea, .custom-variation-options input, .custom-variation-options select, .custom-variation-options textarea').each(function() {
        const $input = jQuery(this);
        if ($input.attr('data-calculate')) {
          $input.on('change', function() {
            debouncedCalculatePrice();
          });
        }
      });
      
      // Handle quantity changes immediately without debounce
      jQuery(document).on('change', '.group-quantity', calculateAndUpdatePrice);

      // Handle quantity input events (for when user types)
      jQuery(document).on('input', '.group-quantity', calculateAndUpdatePrice);

      // Add group button handler
      jQuery('#add-group-button').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        addNewGroup();
      });

      // Delete group handler with immediate price update
      jQuery(document).on('click', '.delete-group-button', actionDeleteGroup);

      // Replace the file upload preview handler
      // jQuery(document).off('change', 'input[type="file"]');
      // jQuery(document).on('change', 'input[type="file"]', function(e) {
      //   var $input = jQuery(this);
      //   var $wrapper = $input.closest('.custom-upload-wrapper');
      //   var $previewArea = $wrapper.next('.multi-file-upload-preview');
      //   if ($previewArea.length === 0) {
      //     $previewArea = jQuery('<div class="multi-file-upload-preview"></div>');
      //     $wrapper.after($previewArea);
      //   }

      //   $input.off('change.file-input').on('change.file-input', function(e) {
      //     var files = Array.from(this.files);
          
      //     // --- Maintain a DataTransfer object for this input ---
      //     if (!$input[0]._dt) {
      //       $input[0]._dt = new DataTransfer();
      //     }
      //     var dt = $input[0]._dt;

      //     // Add new files, avoiding duplicates by name+size
      //     files.forEach(function(file) {
      //       var exists = false;
      //       for (var i = 0; i < dt.items.length; i++) {
      //         var f = dt.items[i].getAsFile();
      //         if (f.name === file.name && f.size === file.size) {
      //           exists = true;
      //           break;
      //         }
      //       }
      //       if (!exists) dt.items.add(file);
      //     });
      //     // Update input files
      //     $input[0].files = dt.files;

      //     // --- Render preview ---
      //     $previewArea.empty();
      //     var dtFiles = Array.from(dt.files);
      //     if (dtFiles.length > 0) {
      //       dtFiles.forEach(function(file, idx) {
      //         var $fileBox = jQuery('<div class="multi-file-box" style="display: flex; align-items: center; margin-bottom: 8px; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); padding: 8px;"></div>');
      //         var $removeBtn = jQuery('<span class="file-upload-remove" style="margin-left: 10px; cursor: pointer; font-size: 20px; color: #d00;">&times;</span>');
      //         $removeBtn.on('click', function(e) {
      //           e.stopPropagation();
      //           var newDT = new DataTransfer();
      //           dtFiles.forEach(function(f, i) {
      //             if (i !== idx) newDT.items.add(f);
      //           });
      //           $input[0]._dt = newDT;
      //           $input[0].files = newDT.files;
      //           $input.trigger('change');
      //         });
      //         if (file.type.startsWith('image/')) {
      //           var reader = new FileReader();
      //           reader.onload = function(e) {
      //             var $img = jQuery('<img />', {
      //               src: e.target.result,
      //               css: {
      //                 'max-width': '60px',
      //                 'max-height': '60px',
      //                 'object-fit': 'contain',
      //                 'margin-right': '10px',
      //                 'border-radius': '4px',
      //                 'box-shadow': '0 1px 4px rgba(0,0,0,0.08)'
      //               }
      //             });
      //             $fileBox.prepend($img);
      //           };
      //           reader.readAsDataURL(file);
      //         } else {
      //           var $fileIcon = jQuery('<span style="font-size: 32px; margin-right: 10px;">📄</span>');
      //           $fileBox.prepend($fileIcon);
      //         }
      //         var $fileName = jQuery('<span style="font-weight: bold; font-size:0.5em; color: #333;">' + file.name + '</span>');
      //         var $downloadBtn = jQuery('<a style="margin-left: 10px; font-size: 18px; text-decoration: none;" href="#" download>⬇️</a>');
      //         $downloadBtn.on('click', function(ev) {
      //           ev.preventDefault();
      //           var url = URL.createObjectURL(file);
      //           var a = document.createElement('a');
      //           a.href = url;
      //           a.download = file.name;
      //           document.body.appendChild(a);
      //           a.click();
      //           setTimeout(function() { URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
      //         });
      //         $fileBox.append($fileName).append($downloadBtn).append($removeBtn);
      //         $previewArea.append($fileBox);
      //       });
      //       // Show file count
      //       var $count = jQuery('<div style="color: #666; font-size: 14px; font-weight:bold; margin-top: 4px;">' + dtFiles.length + ' file' + (dtFiles.length > 1 ? 's' : '') + ' selected <span style="cursor:pointer;color:#0073aa;" class="toggle-file-list">&#9650;</span></div>');
      //       $previewArea.append($count);
      //       $count.find('.toggle-file-list').on('click', function() {
      //         $previewArea.toggleClass('collapsed');
      //         $previewArea.find('.multi-file-box').toggle();
      //         jQuery(this).html($previewArea.hasClass('collapsed') ? '&#9660;' : '&#9650;');
      //       });
      //     } else {
      //       $previewArea.empty();
      //     }
      //     // Always show icon and instruction
      //     $wrapper.find('.upload-icon').show();
      //     $wrapper.find('.upload-instruction, .upload-types').show();
      //   });
      // });
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

    // Get the Merchi product ID from the page
    jQuery('#get-quote-button').on('click', async function() {
      const formData = await gatherFormData();
      window.toggleMerchiCheckout({...formData});
    });

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
            const newName = name.replace(
              /variationsGroups\[\d+\]/, "variationsGroups[" + index + "]"
            );
            $input.attr("name", newName);
          }
          const { costPerUnit = 0 } = defaultJobJson;
          if ($input.hasClass('group-quantity')) {
            $input.attr('data-group-index', index);
      
            $input.closest('.custom-field')
              .find('label')
              .text('Quantity ($' + costPerUnit.toFixed(2) + ' per unit)');
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
      $group.find('.delete-group-button').off('click.group').on('click.group', actionDeleteGroup);

      $group.find('.delete-group-button').off('click');
      // Delete group handler with immediate price update
      $group.find('.delete-group-button').on('click', actionDeleteGroup);
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
    const addNewGroup = () => {
      // Use the cloned default values
      const { defaultJob = {} } = productClone;
      const { variationsGroups = [] } = defaultJob;
      const defaultGroup = variationsGroups[0];
      const { quantity = 1, variations = [] } = defaultGroup;

      // Always use the first fully structured group as the template
      const $firstGroup = jQuery('.group-field-set').filter(function() {
        return jQuery(this).find('.custom-field').length > 0;
      }).first();

      // if there are no groups then we abort
      if ($firstGroup.length === 0) {
        console.error('No valid group template found for cloning.');
        return;
      }

      // new group index      
      const newGroupIndex = jQuery('.group-field-set').length;

      // Clone the group
      const $newGroup = $firstGroup.clone();

      // Defensive: Remove any direct text nodes that are just numbers
      $newGroup.contents().filter(function() {
        return this.nodeType === 3 && /^\d+$/.test(this.nodeValue.trim());
      }).remove();

      // Defensive: Check if the clone is valid
      if ($newGroup.find('.custom-field').length === 0) {
        console.error('Attempted to clone a malformed group. Aborting.');
        console.log('Malformed group HTML:', $newGroup.html());
        return;
      }

      // Reset and update the new group
      $newGroup.attr("data-group-index", newGroupIndex);
      $newGroup.find(".group-number").text(newGroupIndex);

      // in the new group find all the data-group-index + 1
      $newGroup.find('[data-group-index]').each(function() {
        const $element = jQuery(this);
        $element.attr('data-group-index', newGroupIndex);
      });
      // Also update the group-cost-display's data-group-index
      $newGroup.find('.group-cost-display')
        .attr('data-group-index', newGroupIndex).text('');

      // Update all form elements in the new group and apply default values
      $newGroup.find("input, select, textarea").each(function() {
        const $input = jQuery(this);
        let name = $input.attr("name");
        if (name) {
          name = name.replace(/variationsGroups\[\d+\]/, `variationsGroups[${newGroupIndex}]`);
          $input.attr("name", name);
        }

        // Handle group quantity separately
        if ($input.hasClass('group-quantity')) {
          $input.attr('data-group-index', newGroupIndex).val(quantity);
          $input
            .closest('.custom-field')
            .find('label')
            .html('Quantity <span class="group-unit-price"><span class="loading-spinner"></span></span></label>');
        } else {
          // For variation fields, try to find and apply the default value
          const variationFieldData = $input.data('variation-field');
          if (variationFieldData) {
            const defaultVariation = variations.find(
              v => v.variationField?.id === variationFieldData.id);
            if (defaultVariation) {
              if ($input.is(':checkbox, :radio')) {
                // For checkboxes and radios, check if the value matches
                if (Array.isArray(defaultVariation.value)) {
                  $input.prop('checked', defaultVariation.value.includes($input.val()));
                } else {
                  $input.prop('checked', defaultVariation.value === $input.val());
                }
              } else if ($input.is('select')) {
                // For select elements
                if (Array.isArray(defaultVariation.value)) {
                  $input.val(defaultVariation.value);
                } else {
                  $input.val(defaultVariation.value || '');
                }
              } else if ($input.is('input[type="file"]')) {
                // Skip setting value for file inputs
                // Clear any existing DataTransfer object
                if ($input[0]._dt) {
                  $input[0]._dt = new DataTransfer();
                }
                // Clear the preview area if it exists
                const $previewArea = $input.closest('.custom-upload-wrapper').next('.multi-file-upload-preview');
                if ($previewArea.length) {
                  $previewArea.empty();
                }
              } else if ($input.is('textarea')) {
                // Handle textarea - preserve line breaks and formatting
                $input.val(defaultVariation.value || '');
                $input.trigger('change');
              } else if ($input.is('input[type="color"]')) {
                // Handle color input - ensure valid hex color
                const colorValue = defaultVariation.value || '#000000';
                $input.val(colorValue.startsWith('#') ? colorValue : '#' + colorValue);
                $input.trigger('change');
              } else if ($input.is('input[type="number"]')) {
                // Handle number input - ensure numeric value
                const numValue = parseFloat(defaultVariation.value);
                $input.val(isNaN(numValue) ? '' : numValue);
                $input.trigger('change');
              } else if ($input.is('input[type="text"]')) {
                // Handle text input
                $input.val(defaultVariation.value || '');
                $input.trigger('change');
              }
            } else {
              // If no default value found, reset the input
              if ($input.is(':checkbox, :radio')) {
                $input.prop('checked', false);
              } else if ($input.is('input[type="file"]')) {
                // Skip setting value for file inputs
                // Clear any existing DataTransfer object
                if ($input[0]._dt) {
                  $input[0]._dt = new DataTransfer();
                }
                // Clear the preview area if it exists
                const $previewArea = $input.closest('.custom-upload-wrapper').next('.multi-file-upload-preview');
                if ($previewArea.length) {
                  $previewArea.empty();
                }
              } else if ($input.is('textarea')) {
                $input.val('');
                $input.trigger('change');
              } else if ($input.is('input[type="color"]')) {
                $input.val('#000000');
                $input.trigger('change');
              } else if ($input.is('input[type="number"]')) {
                $input.val('');
                $input.trigger('change');
              } else if ($input.is('input[type="text"]')) {
                $input.val('');
                $input.trigger('change');
              } else {
                $input.val('');
                $input.trigger('change');
              }
            }
          }
        }
      });

      // Show delete button
      $newGroup.find(".delete-group-button").show();

      // Final check before appending
      if ($newGroup.find('.custom-field').length === 0) {
        console.error('Clone lost its fields before appending. Aborting.');
        console.log('Malformed group HTML before append:', $newGroup.html());
        return;
      }
      jQuery("#grouped-fields-container").append($newGroup);

      // Initialize handlers for this new group only
      initializeGroupVariationHandlers($newGroup);
      if (jQuery(".group-field-set").length > 1) {
        jQuery(".delete-group-button").show();
      }
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
        } else if ($input.is('input[type="checkbox"]')) {
          // Collect all checked values as an array
          const $checked = $fieldContainer.find('input[type="checkbox"]:checked');
          if ($checked.length > 1) {
            value = $checked.map(function() { return $(this).val(); }).get();
          } else if ($checked.length === 1) {
            value = $checked.val();
          } else {
            value = null;
          }
        } else if ($input.is('input[type="radio"]')) {
          const $checked = $fieldContainer.find('input[type="radio"]:checked');
          value = $checked.length ? $checked.val() : null;
        } else if ($input.is('input[type="color"]')) {
          value = $input.val();
        } else if ($input.is('input[type="file"]')) {
          // Find the preview area next to the file input wrapper
          const $previewArea = $input.closest('.custom-upload-wrapper').next('.multi-file-upload-preview');
          const variationFiles = [];

          // Process each file box in the preview area
          $previewArea.find('.multi-file-box').each(function() {
            const $fileBox = jQuery(this);
            const merchiFileData = $fileBox.attr('data-merchi-file');
            
            if (merchiFileData) {
              try {
                const merchiFile = JSON.parse(merchiFileData);
                variationFiles.push(merchiFile);
              } catch (e) {
                console.error('Error parsing Merchi file data:', e);
              }
            }
          });

          // Set both the value (file names) and variationFiles
          value = variationFiles.map(file => file.id).join(',');
          // Add the variationFiles array to the variation object
          variationsArray[variationIndex].variationFiles = variationFiles;
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
      if (groupVariationFields.length > 0) {
        jQuery('.group-field-set').each(function(groupIndex) {
          const $group = jQuery(this);
          // Deep clone the variations array for each group
          formData.variationsGroups.push({
            groupCost: parseFloat($group.find('[data-group-cost]').attr('data-group-cost')) || 0,
            quantity: parseInt($group.find('.group-quantity').val()) || 1,
            variations: [...defaultJobJson.variationsGroups[0].variations],
          });

          // Process variations within this group
          processVariations($group, formData.variationsGroups[groupIndex].variations);
        });
      } else {
        // if thee are no groups then we just use the quantity from the quantity input
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
    initialize();

    // Move the click handler here so gatherFormData is in scope
    $(document).on('click', '.single_add_to_cart_button', async function(e) {
      e.preventDefault();
      e.stopImmediatePropagation(); // Ensure only this handler runs
      // Validate form before proceeding
      if (!validateForm()) {
        console.log('Form validation failed');
        return;
      }
      setLoadingState(true);
      try {
        // Gather form data and log it
        const formData = await gatherFormData();
        const { quantity, variationsGroups = [], variations } = formData;

        let cartId = null;
        let totalQuantity = variationsGroups.length ? 0 : quantity;

        // Get the cart in local storage
        const merchiCart = localStorage.getItem('MerchiCart');
        let merchiCartJson;
        try {
          // Convert the cart to JSON
          merchiCartJson = JSON.parse(merchiCart);
          cartId = merchiCartJson.id;
          // Add the new item to the cart
          const cartItems = [...merchiCartJson.cartItems, formData];
          const updatedCart = {...merchiCartJson, cartItems};
          localStorage.setItem('MerchiCart', JSON.stringify(updatedCart));
        } catch (error) {
          console.error('Error parsing MerchiCart:', error);
        }

        let taxAmount = 0;
        // Build cartItems from formData (detailed version)
        const cartItems = [];
        cartItems.push({
          productID: formData.product?.id || '',
          subTotal: formData.cost || 0,
          totalCost: formData.totalCost || 0,
          variations: [],
          objExtras: []
        });

        // Map group variations (variationsGroups)
        if (variationsGroups?.length) {
          variationsGroups.forEach((group, gi) => {
            let groupObj = {};
            let groupExtras = {};
            let loopcount = 0;
            let varQuant = group.quantity || 1;

            if (Array.isArray(group.variations)) {
              group.variations.forEach((variation, vi) => {
                if (variation && (variation.value !== undefined)) {
                  groupObj[vi] = variation.value;
                }
                loopcount = vi + 1;
              });
            }
            groupExtras[loopcount] = varQuant;
            groupExtras['quantity'] = varQuant;
            totalQuantity += varQuant;

            cartItems[0].variations.push(groupObj);
            cartItems[0].objExtras.push(groupExtras);
          });
        }

        // Map standalone variations (if any)
        if (variations?.length) {
          let obj = {};
          let objExtras = {};
          let loopcount = 0;

          formData.variations.forEach((variation, vi) => {
            if (variation && (variation.value !== undefined)) {
              obj[vi] = variation.value;
            }
            loopcount = vi + 1;
          });
          objExtras[loopcount] = totalQuantity;
          objExtras['quantity'] = totalQuantity;

          cartItems[0].variations.push(obj);
          cartItems[0].objExtras.push(objExtras);
        }

        cartItems[0].quantity = totalQuantity;
        const cartPayload = {
          cartId: cartId,
          taxAmount: taxAmount,
          cartItems: cartItems
        };

        console.log('cartPayload being sent to send_id_for_add_cart:', cartPayload);     
        jQuery.ajax({
          method: "POST",
          url: (typeof frontendajax !== 'undefined' ? frontendajax.ajaxurl : '/wp-admin/admin-ajax.php'),
          data: {
            action: "send_id_for_add_cart",
            item: cartPayload,
          },
          success: function (response) {
            setLoadingState(false);
            // Set a flag in sessionStorage to show the success message after reload
            sessionStorage.setItem('merchiCartSuccess', '1');
            // Reload the page and scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.location.reload();
            // Do NOT show the success message here
            // Do NOT submit the form here
            // Cart fragment refresh will happen on reload
          },
          error: function (jqXHR, textStatus, errorThrown) {
            console.error('AJAX Error!', {jqXHR, textStatus, errorThrown});
            setLoadingState(false);
            if (jqXHR && jqXHR.responseText) {
              console.error('AJAX Error Response Text:', jqXHR.responseText);
            }
            alert("Something went wrong, Please try again later");
          },
        });
      } catch (error) {
        console.error('Error in add to cart process:', error);
        setLoadingState(false);
        alert("An error occurred. Please try again.");
      }
    });

    // On page load, show the success message if the flag is set
    if (sessionStorage.getItem('merchiCartSuccess') === '1') {
      sessionStorage.removeItem('merchiCartSuccess');
      showSuccessMessage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Remove malformed group-field-set elements on page load (run ASAP)
    jQuery(function() {
      jQuery('.group-field-set').each(function() {
        if (jQuery(this).find('.custom-field').length === 0) {
          jQuery(this).remove();
        }
      });
    });

    // Debug: Log whenever a new .group-field-set is added to the DOM
    jQuery(function() {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList.contains('group-field-set')) {
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
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
  const $button = jQuery('.single_add_to_cart_button');
  if (isLoading) {
    $button.addClass('loading').prop('disabled', true);
  } else {
    $button.removeClass('loading').prop('disabled', false);
  }
}

// Function to show success message above the product heading
function showSuccessMessage() {
  // Remove any existing message
  const existingMessage = document.querySelector('.merchi-success-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create and show new message
  const message = document.createElement('div');
  message.className = 'merchi-success-message';
  message.innerHTML = `
    <span class="merchi-success-close" tabindex="0" aria-label="Close">&times;</span>
    <span>✓ Product added to cart successfully!</span>
    <a href="/cart/">Go to cart</a>
  `;

  // Find the product heading and insert the message before it
  const heading = document.querySelector('h1, .product_title, .entry-title');
  if (heading && heading.parentNode) {
    heading.parentNode.insertBefore(message, heading);
  } else {
    // fallback
    document.body.prepend(message);
  }

  // Add close button logic
  const closeBtn = message.querySelector('.merchi-success-close');
  closeBtn.onclick = () => message.remove();
  closeBtn.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') message.remove();
  };

  // Remove message after 8 seconds with a 1-second fade
  // setTimeout(() => {
  //   message.style.opacity = '0';
  //   setTimeout(() => message.remove(), 1000);
  // }, 8000);
}
