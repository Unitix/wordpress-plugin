// Wait for both jQuery and Merchi SDK to be ready
import { MERCHI_SDK } from './merchi_sdk';
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

  jQuery(document).ready(function ($) {

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
              domain: { id: merchiConfig.domainId },
              defaultJob: {
                domain: { id: merchiConfig.domainId },
                product: { id: merchiProductId },
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
              activeTheme: { mainCss: {} },
              logo: {}
            },
            draftTemplates: { file: {} },
            groupBuyStatus: {},
            groupVariationFields: { options: { linkedFile: {} } },
            images: {},
            independentVariationFields: { options: { linkedFile: {} } },
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
      const taxText = taxName ? `inc ${taxName} (${taxPercent}%)` : 'inc tax';
      return `$${totalCost.toFixed(2)} ${taxText}`;
    }

    // Helper function to render field HTML in JavaScript (mirrors PHP rendering logic)
    function renderFieldHtml(variationField, namePrefix, fieldIndex, isGroup = false, groupIndex = 0) {
      const {
        id: fieldId,
        name: label,
        fieldType,
        required = false,
        placeholder = '',
        instructions = '',
        multipleSelect = false,
        options = [],
        variationCost = 0,
        variationUnitCost = 0
      } = variationField;

      const slug = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fieldName = namePrefix + '.variations[' + fieldIndex + ']';
      const requiredAttr = required ? 'required' : '';
      const requiredClass = required ? ' data-required="true"' : '';

      // Create variation field data for JavaScript
      const variationFieldJson = JSON.stringify(variationField).replace(/"/g, '&quot;');
      const commonDataAttrs = ` data-variation-field='${variationFieldJson}' data-calculate="true"`;

      // Cost label helper
      const costLabel = () => {
        let label = '';
        if (variationUnitCost > 0) {
          label += ` + ( $${variationUnitCost.toFixed(2)} per unit )`;
        }
        if (variationCost > 0) {
          label += ` + ( $${variationCost.toFixed(2)} once off )`;
        }
        return label;
      };

      let html = `<div class="custom-field"${requiredClass}>`;

      switch (fieldType) {
        case 1: // TEXT
          html += `<label for="${slug}">${label}${costLabel()}</label>`;
          html += `<input type="text" name="${fieldName}" placeholder="${placeholder}" ${requiredAttr}${commonDataAttrs} class="input-text"/>`;
          break;

        case 2: // SELECT
          html += `<label for="${slug}">${label}</label>`;
          if (multipleSelect) {
            html += `<select multiple name="${fieldName}"${commonDataAttrs} class="select">`;
          } else {
            html += `<select name="${fieldName}"${commonDataAttrs} class="select">`;
          }
          options.forEach((option, index) => {
            const selected = index === 0 && !multipleSelect ? 'selected' : '';
            const optionCost = costLabel();
            html += `<option value="${option.id}" ${selected} data-variation-field-value="${option.id}">${option.value}${optionCost}</option>`;
          });
          html += '</select>';
          break;

        case 3: // FILE
          html += `<label for="${slug}">${label}${costLabel()}</label>`;
          html += `<label class="custom-upload-wrapper">
            <div class="upload-icon">📎</div>
            <div class="upload-instruction">Drop file here or click to browse</div>
            <div class="upload-types">.jpeg, .jpg, .gif, .png, .pdf</div>
            <input type="file" name="${fieldName}" multiple ${requiredAttr} accept=".jpeg,.jpg,.gif,.png,.pdf"${commonDataAttrs} class="input-file"/>
          </label>`;
          break;

        case 4: // TEXTAREA
          html += `<label for="${slug}">${label}${costLabel()}</label>`;
          html += `<textarea name="${fieldName}" placeholder="${placeholder}" ${requiredAttr}${commonDataAttrs} class="input-textarea"></textarea>`;
          break;

        case 5: // NUMBER
          html += `<label for="${slug}">${label}${costLabel()}</label>`;
          html += `<input type="number" name="${fieldName}" placeholder="${placeholder}" ${requiredAttr}${commonDataAttrs} class="input-number"/>`;
          break;

        case 6: // CHECKBOX
          html += `<label for="${slug}">${label}</label>`;
          html += '<div class="checkbox-options-container">';
          options.forEach(option => {
            const optionCost = costLabel();
            html += `
              <div class="checkbox-option">
                <label class="checkbox-label">
                  <input type="checkbox" name="${fieldName}" value="${option.id}"${commonDataAttrs} data-variation-field-value="${option.id}" class="input-checkbox"/>
                  <span class="option-label">${option.value}${optionCost}</span>
                </label>
              </div>`;
          });
          html += '</div>';
          break;

        case 7: // RADIO
          html += `<label for="${slug}">${label}</label>`;
          html += '<div class="radio-options-container">';
          options.forEach((option, index) => {
            const checked = index === 0 ? 'checked' : '';
            const optionCost = costLabel();
            html += `
              <div class="radio-option">
                <label class="radio-label">
                  <input type="radio" name="${fieldName}" value="${option.id}" ${checked}${commonDataAttrs} data-variation-field-value="${option.id}" class="input-radio"/>
                  <span class="option-label">${option.value}${optionCost}</span>
                </label>
              </div>`;
          });
          html += '</div>';
          break;

        case 8: // INSTRUCTIONS
          html += `<p class="field-instructions">${instructions}</p>`;
          break;

        case 9: // IMAGE_SELECT
          const labelGroupIndex = isGroup ? groupIndex : 'false';
          html += `<label for="${slug}" data-group-index="${labelGroupIndex}" data-update-label="true" data-variation-field-id="${fieldId}">${label}</label>`;
          const inputType = multipleSelect ? 'checkbox' : 'radio';
          html += `<div class="group-variation-container" name="${fieldName}"${commonDataAttrs}>`;
          html += '<div class="image-select-options-container">';
          options.forEach((option, index) => {
            const checked = index === 0 && !multipleSelect ? 'checked' : '';
            html += `
              <div class="image-select-option">
                <input type="${inputType}" name="${fieldName}" value="${option.id}" ${checked}${commonDataAttrs} data-variation-field-value="${option.id}" data-update-label="true"/>
                <label class="image-select-label">
                  <span class="image-select-checkmark"></span>
                  ${option.image ? `<img src="${option.image}" alt="${option.value}" />` : ''}
                  <span class="option-label">${option.value}</span>
                </label>
              </div>`;
          });
          html += '</div>';
          html += '</div>';
          break;

        case 10: // COLOR
          html += `<label for="${slug}">${label}${costLabel()}</label>`;
          html += `<input type="color" name="${fieldName}" ${requiredAttr}${commonDataAttrs} class="input-color"/>`;
          break;

        case 11: // COLOR_SELECT
          html += `<label for="${slug}" data-group-index="${isGroup ? groupIndex : 'false'}" data-update-label="true" data-variation-field-id="${fieldId}">${label}</label>`;
          const colorInputType = multipleSelect ? 'checkbox' : 'radio';
          html += '<div class="color-options-grid">';
          options.forEach((option, index) => {
            const checked = index === 0 && !multipleSelect ? 'checked' : '';
            html += `
              <label class="color-option">
                <input type="${colorInputType}" name="${fieldName}" value="${option.id}" ${checked}${commonDataAttrs} data-variation-field-value="${option.id}" data-field-type="colour-select"/>
                <div class="color-option-inner">
                  <span class="color-indicator" style="background-color: ${option.colour || '#000000'};"></span>
                  <span class="checkmark">✓</span>
                </div>
                <span class="color-name">${option.value}</span>
              </label>`;
          });
          html += '</div>';
          break;

        default:
          html += `<label for="${slug}">${label}${costLabel()}</label>`;
          html += `<input type="text" name="${fieldName}" placeholder="${placeholder}" ${requiredAttr}${commonDataAttrs} class="input-text"/>`;
          break;
      }

      html += '</div>';
      return html;
    }

    // Helper function to check if variation fields have changed
    function hasVariationFieldsChanged(currentFields, responseFields) {
      if (currentFields.length !== responseFields.length) {
        return true;
      }

      for (let i = 0; i < currentFields.length; i++) {
        const current = currentFields[i];
        const response = responseFields[i];
        
        // Compare key properties that would affect rendering
        if (current.id !== response.id || 
            current.fieldType !== response.fieldType ||
            current.options?.length !== response.options?.length ||
            current.required !== response.required) {
          return true;
        }
      }
      return false;
    }

    // Helper function to apply variation values to rendered fields
    function applyVariationValue($container, variationFieldId, value) {
      // Find the field with matching variation field ID
      const $field = $container.find('[data-variation-field]').filter(function() {
        const fieldData = jQuery(this).data('variation-field');
        return fieldData && fieldData.id === variationFieldId;
      });

      if ($field.length === 0) return;

      const fieldData = $field.data('variation-field');
      const fieldType = fieldData.fieldType;

      // Apply value based on field type
      switch (fieldType) {
        case 1: // TEXT
        case 4: // TEXTAREA  
        case 5: // NUMBER
        case 10: // COLOR
          if ($field.is('input, textarea')) {
            $field.val(value || '');
          }
          break;

        case 2: // SELECT
          if ($field.is('select')) {
            if (Array.isArray(value)) {
              $field.val(value);
            } else {
              $field.val(value || '');
            }
          }
          break;

        case 6: // CHECKBOX
          const $checkboxContainer = $field.closest('.custom-field');
          // Uncheck all first
          $checkboxContainer.find('input[type="checkbox"]').prop('checked', false);
          
          if (Array.isArray(value)) {
            value.forEach(val => {
              $checkboxContainer.find(`input[type="checkbox"][value="${val}"]`).prop('checked', true);
            });
          } else if (value) {
            $checkboxContainer.find(`input[type="checkbox"][value="${value}"]`).prop('checked', true);
          }
          break;

        case 7: // RADIO
        case 9: // IMAGE_SELECT 
        case 11: // COLOR_SELECT
          const $inputContainer = $field.closest('.custom-field');
          
          // Handle multiple select (checkboxes) vs single select (radios)
          if (fieldData.multipleSelect) {
            // Uncheck all checkboxes first
            $inputContainer.find('input[type="checkbox"]').prop('checked', false);
            
            if (Array.isArray(value)) {
              value.forEach(val => {
                $inputContainer.find(`input[type="checkbox"][value="${val}"]`).prop('checked', true);
              });
            } else if (value) {
              $inputContainer.find(`input[type="checkbox"][value="${value}"]`).prop('checked', true);
            }
          } else {
            // Uncheck all radios first
            $inputContainer.find('input[type="radio"]').prop('checked', false);
            
            if (value) {
              $inputContainer.find(`input[type="radio"][value="${value}"]`).prop('checked', true);
            }
          }
          break;

        case 3: // FILE
          // For file fields, we can't set the value directly, but we can show existing files
          // This would require more complex logic to recreate file previews
          console.log('File field value application not implemented in reRenderForm');
          break;

        case 8: // INSTRUCTIONS
          // Instructions don't have values
          break;

        default:
          console.log('Unknown field type for value application:', fieldType);
          break;
      }

      // Trigger change event to update any dependent calculations
      $field.trigger('change');
    }

    function reRenderForm(response) {
      // This function takes the response from the price calculation, checks the variations to see
      // if any dynamic fields have changed and if we need to render a different set of fields
      // and then re-renders the form.
      const {
        variations = [],
        variationsGroups = [],
      } = response;

      let hasChanges = false;

      // Check independent variations for changes
      const $independentContainer = jQuery('.custom-variation-options');
      if ($independentContainer.length > 0) {
        const currentFields = [];
        $independentContainer.find('[data-variation-field]').each(function() {
          const fieldData = jQuery(this).data('variation-field');
          if (fieldData) currentFields.push(fieldData);
        });

        const responseFields = variations.map(v => v.variationField).filter(Boolean);
        
        if (hasVariationFieldsChanged(currentFields, responseFields)) {
          hasChanges = true;
          
          // Re-render independent variations
          let independentHtml = '';
          variations.forEach((variation, index) => {
            if (variation.variationField) {
              independentHtml += renderFieldHtml(variation.variationField, 'custom_fields', index);
            }
          });
          
          if (independentHtml) {
            $independentContainer.html(independentHtml);
            
            // Apply current values from response to newly rendered fields
            variations.forEach((variation, index) => {
              if (variation.variationField && variation.value !== undefined && variation.value !== null) {
                applyVariationValue($independentContainer, variation.variationField.id, variation.value);
              }
            });
          }
        }
      }

      // Check group variations for changes  
      const $groupsContainer = jQuery('#grouped-fields-container');
      if ($groupsContainer.length > 0 && variationsGroups.length > 0) {
        const currentGroupFields = [];
        $groupsContainer.find('.group-field-set').each(function(groupIndex) {
          const groupFields = [];
          jQuery(this).find('[data-variation-field]').each(function() {
            const fieldData = jQuery(this).data('variation-field');
            if (fieldData) groupFields.push(fieldData);
          });
          currentGroupFields.push(groupFields);
        });

        // Check if group structure has changed
        let groupsChanged = false;
        if (currentGroupFields.length !== variationsGroups.length) {
          groupsChanged = true;
        } else {
          for (let i = 0; i < variationsGroups.length; i++) {
            const responseGroupFields = variationsGroups[i].variations.map(v => v.variationField).filter(Boolean);
            if (hasVariationFieldsChanged(currentGroupFields[i] || [], responseGroupFields)) {
              groupsChanged = true;
              break;
            }
          }
        }

        if (groupsChanged) {
          hasChanges = true;
          
          // Re-render group variations
          let groupsHtml = '<h3>Grouped Options</h3>';
          
          variationsGroups.forEach((group, groupIndex) => {
            const { variations: groupVariations = [], quantity = 1, groupCost = 0 } = group;
            
            groupsHtml += `<div class="group-field-set" data-group-index="${groupIndex}">`;
            groupsHtml += `<h4>Group <span class="group-number">${groupIndex + 1}</span></h4>`;
            
            // Add group quantity field
            const { costPerUnit = 0 } = defaultJobJson;
            groupsHtml += `
              <div class="custom-field">
                <label>Quantity <span class="group-unit-price">( $${costPerUnit.toFixed(2)} per unit )</span></label>
                <input type="number" class="qty group-quantity" name="variationsGroups[${groupIndex}].quantity" value="${quantity}" min="1" data-group-index="${groupIndex}">
              </div>`;
            
            // Add variation fields for this group
            groupVariations.forEach((variation, variationIndex) => {
              if (variation.variationField) {
                groupsHtml += renderFieldHtml(
                  variation.variationField, 
                  `variationsGroups[${groupIndex}]`, 
                  variationIndex, 
                  true, 
                  groupIndex
                );
              }
            });
            
            groupsHtml += `<div class="group-cost-display" data-group-index="${groupIndex}" data-group-cost="${groupCost}">Group Cost: $${groupCost.toFixed(2)}</div>`;
            groupsHtml += `<button type="button" class="button wp-element-button delete-group-button" ${variationsGroups.length === 1 ? 'style="display: none;"' : ''}>Delete Group</button>`;
            groupsHtml += '</div>';
          });
          
          $groupsContainer.html(groupsHtml);
          
          // Apply current values from response to newly rendered group fields
          variationsGroups.forEach((group, groupIndex) => {
            const { variations: groupVariations = [] } = group;
            const $groupContainer = $groupsContainer.find(`.group-field-set[data-group-index="${groupIndex}"]`);
            
            groupVariations.forEach((variation) => {
              if (variation.variationField && variation.value !== undefined && variation.value !== null) {
                applyVariationValue($groupContainer, variation.variationField.id, variation.value);
              }
            });
          });
        }
      }

      // If we made changes, reinitialize handlers
      if (hasChanges) {
        // Reinitialize all handlers for the updated form
        initializeHandlers();
        
        // Trigger a price calculation to update costs
        setTimeout(() => {
          calculateAndUpdatePrice();
        }, 100);
      }
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

      // Check if we need to re-render the form due to dynamic field changes
      reRenderForm(response);

      // loop over the variationsGroups
      for (let i = 0; i < variationsGroups.length; i++) {
        const {
          variations = [],
          groupCost = 0,
        } = variationsGroups[i];

        jQuery('label[data-update-label="true"][data-group-index="' + i + '"]').each(function () {
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

      jQuery('label[data-update-label="true"][data-group-index="false"]').each(function () {
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
      $container.find('input[type="file"]').each(function () {
        const $input = jQuery(this);
        const $wrapper = $input.closest('.custom-upload-wrapper');
        let $previewArea = $wrapper.next('.multi-file-upload-preview');

        if ($previewArea.length === 0) {
          $previewArea = jQuery('<div class="multi-file-upload-preview"></div>');
          $wrapper.after($previewArea);
        }

        // drag and drop
        $wrapper.off('dragover.file-drop dragenter.file-drop dragleave.file-drop drop.file-drop')
          .on('dragover.file-drop dragenter.file-drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $wrapper.addClass('drag-over');
          })
          .on('dragleave.file-drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (!$wrapper[0].contains(e.relatedTarget)) {
              $wrapper.removeClass('drag-over');
            }
          })
          .on('drop.file-drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            $wrapper.removeClass('drag-over');

            const files = e.originalEvent.dataTransfer.files;
            if (files.length > 0) {
              // Create a new FileList and assign it to the input, then trigger change
              const dt = new DataTransfer();
              for (let i = 0; i < files.length; i++) {
                dt.items.add(files[i]);
              }
              $input[0].files = dt.files;
              $input.trigger('change');
            }
          });

        $input.off('change.file-input').on('change.file-input', async function (e) {
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
                // Store Merchi file data on the file object for later preview rendering
                file._merchiFileJson = merchiFileJson;
              } catch (error) {
                console.error('Error processing file:', error);
                alert('Failed to upload file: ' + file.name);
              }
            }
          }

          // Update input files
          $input[0].files = dt.files;

          // Re-render the preview area to show all files in dt.files
          $previewArea.empty();
          Array.from(dt.files).forEach(function (file) {
            var merchiFileJson = file._merchiFileJson;
            if (!merchiFileJson) return; // Only show files with Merchi data
            var $fileBox = jQuery('<div class="multi-file-box" style="display: flex; align-items: center; margin-bottom: 8px; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); padding: 8px;"></div>');
            $fileBox.attr({
              'data-merchi-file': JSON.stringify(merchiFileJson),
              'data-download-url': merchiFileJson.downloadUrl,
              'data-view-url': merchiFileJson.viewUrl,
              'data-mimetype': merchiFileJson.mimetype
            });
            var $removeBtn = jQuery('<span class="file-upload-remove" style="margin-left: 10px; cursor: pointer; font-size: 20px; color: #d00;">&times;</span>');
            $removeBtn.on('click', function (e) {
              e.stopPropagation();
              var newDT = new DataTransfer();
              Array.from(dt.files).forEach(function (f) {
                if (f.name !== file.name || f.size !== file.size) {
                  newDT.items.add(f);
                }
              });
              $input[0]._dt = newDT;
              $input[0].files = newDT.files;
              // Re-render preview area after removal
              $previewArea.empty();
              Array.from(newDT.files).forEach(function (f) {
                var mfj = f._merchiFileJson;
                if (!mfj) return;
                var $fb = jQuery('<div class="multi-file-box" style="display: flex; align-items: center; margin-bottom: 8px; background: #fff; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); padding: 8px;"></div>');
                $fb.attr({
                  'data-merchi-file': JSON.stringify(mfj),
                  'data-download-url': mfj.downloadUrl,
                  'data-view-url': mfj.viewUrl,
                  'data-mimetype': mfj.mimetype
                });
                if (f.type && f.type.startsWith('image/')) {
                  var $img = jQuery('<img />', {
                    src: mfj.viewUrl,
                    css: {
                      'max-width': '60px',
                      'max-height': '60px',
                      'object-fit': 'contain',
                      'margin-right': '10px',
                      'border-radius': '4px',
                      'box-shadow': '0 1px 4px rgba(0,0,0,0.08)'
                    }
                  });
                  $fb.prepend($img);
                } else {
                  var $fileIcon = jQuery('<span style="font-size: 32px; margin-right: 10px;">📄</span>');
                  $fb.prepend($fileIcon);
                }
                var $fileName = jQuery('<span style="font-weight: bold; font-size:0.5em; color: #333;">' + f.name + '</span>');
                var $downloadBtn = jQuery('<a style="margin-left: 10px; font-size: 18px; text-decoration: none;" href="' + mfj.downloadUrl + '" download>⬇️</a>');
                $fb.append($fileName).append($downloadBtn);
                $previewArea.append($fb);
              });
              updateFileCount($previewArea);
              $input.trigger('change');
            });
            if (file.type && file.type.startsWith('image/')) {
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
          });
          updateFileCount($previewArea);

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

      $count.find('.toggle-file-list').off('click').on('click', function () {
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
      jQuery('.custom-field input, .custom-field select, .custom-field textarea, .custom-variation-options input, .custom-variation-options select, .custom-variation-options textarea').each(function () {
        const $input = jQuery(this);
        if ($input.attr('data-calculate')) {
          $input.on('change', debouncedCalculatePrice);
        }
      });

      // Handle quantity changes immediately without debounce
      jQuery(document).on('change', '.group-quantity', calculateAndUpdatePrice);

      // Handle quantity input events (for when user types)
      jQuery(document).on('input', '.group-quantity', calculateAndUpdatePrice);

      // Add group button handler
      jQuery('#add-group-button').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        addNewGroup();
      });

      // Delete group handler with immediate price update
      jQuery(document).on('click', '.delete-group-button', actionDeleteGroup);
    }

    function initializeImageSelectVariations($container) {
      $container.find('.image-select-option').each(function () {
        const $option = jQuery(this);
        const $input = $option.find('input');
        $option.off('click.image-select').on('click.image-select', function (e) {
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
      $container.find('input[data-calculate], select[data-calculate], textarea[data-calculate]').each(function () {
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
    jQuery('#get-quote-button').on('click', async function () {
      if (!validateForm()) {
        console.log('Form validation failed');
        return;
      }
      const formData = await gatherFormData();
      window.toggleMerchiCheckout({ ...formData });
    });

    // When deleteing a group we update each group index and name
    function updateGroupNumbers() {
      jQuery(".group-field-set").each(function (index) {
        const newIndex = index + 1;
        const $group = jQuery(this);

        $group.attr("data-group-index", newIndex);
        $group.find(".group-number").text(newIndex);

        $group.find("input, select, textarea").each(function () {
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
      const $firstGroup = jQuery('.group-field-set').filter(function () {
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
      $newGroup.contents().filter(function () {
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
      $newGroup.find('[data-group-index]').each(function () {
        const $element = jQuery(this);
        $element.attr('data-group-index', newGroupIndex);
      });
      // Also update the group-cost-display's data-group-index
      $newGroup.find('.group-cost-display')
        .attr('data-group-index', newGroupIndex).text('');

      // Update all form elements in the new group and apply default values
      $newGroup.find("input, select, textarea").each(function () {
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
      jQuery('.add-group-button').on('click', function (e) {
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
          $quantityInput.on('change', function (e) {
            calculateAndUpdatePrice();
          });

          // Also bind to input event for immediate feedback
          $quantityInput.on('input', function (e) {
            calculateAndUpdatePrice();
          });
        }
      }
    }

    // Function to process variations from a container
    function processVariations($container, variationsArray) {
      if (!Array.isArray(variationsArray)) {
        return;
      }

      $container.find('.custom-field').each(function () {
        const $fieldContainer = jQuery(this);
        const $input = $fieldContainer.find('input, select, textarea').first();
        const variationFieldData = $input.data('variation-field');
        const variationFieldId = variationFieldData?.id;

        if (!variationFieldId) return;

        // Find the index of the variation by matching the variationFieldId
        const variationIndex = variationsArray.findIndex(v => v?.variationField?.id === variationFieldId);

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
            value = $checked.map(function () { return $(this).val(); }).get();
          } else if ($checked.length === 1) {
            value = $checked.val();
          } else {
            value = null;
          }
        } else if ($input.is('input[type="radio"]')) {
          // Check if this specific field container has colour-select inputs
          const $fieldContainer = $input.closest('.custom-field');
          const $colourSelectInputs = $fieldContainer.find('input[data-field-type="colour-select"]');
          if ($colourSelectInputs.length > 0) {
            // This is a colour-select field
            const $checked = $fieldContainer.find('input[data-field-type="colour-select"]:checked');
            value = $checked.length ? $checked.val() : null;
          } else {
            // Handle regular radio fields
            const $checked = $fieldContainer.find('input[type="radio"]:checked');
            value = $checked.length ? $checked.val() : null;
          }
        } else if ($input.is('input[type="color"]')) {
          value = $input.val();
        } else if ($input.is('input[type="file"]')) {
          // Find the preview area next to the file input wrapper
          const $previewArea = $input.closest('.custom-upload-wrapper').next('.multi-file-upload-preview');
          const variationFiles = [];

          // Process each file box in the preview area
          $previewArea.find('.multi-file-box').each(function () {
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

          // Store the full file objects for cart and API
          value = variationFiles;
          variationsArray[variationIndex].variationFiles = variationFiles;
        }

        // Update the value of the variation
        variationsArray[variationIndex].value = value;

        if (!Array.isArray(variationsArray[variationIndex].variationFiles)) {
          variationsArray[variationIndex].variationFiles = [];
        }
      });
    }

    // Function to gather form data with proper group handling
    async function gatherFormData() {
      // Add defensive checks for defaultJobJson
      if (!defaultJobJson || !defaultJobJson.product) {
        console.error('Product data not loaded yet');
        return {
          variationsGroups: [],
          variations: []
        };
      }

      // Process variation groups
      const { groupVariationFields = [] } = defaultJobJson.product;

      const formData = {
        ...defaultJobJson,
        variationsGroups: [],
        variations: Array.isArray(defaultJobJson.variations) ? [...defaultJobJson.variations] : []
      };

      // Process group variations
      if (groupVariationFields && groupVariationFields.length > 0) {
        jQuery('.group-field-set').each(function (groupIndex) {
          const $group = jQuery(this);
          const groupVariations = [];

          // For each field in this group, get the field ID and value
          $group.find('.custom-field').each(function () {
            const $input = jQuery(this).find('input, select, textarea').first();
            const variationFieldData = $input.data('variation-field');
            if (!variationFieldData) return;

            let value = $input.val();
            let variationFilesForGroup = undefined; // Initialize here
            // Handle checkboxes, radios, files, etc. as in your processVariations
            if ($input.is('select')) {
              value = $input.val();
            } else if ($input.is('input[type="text"], input[type="number"], textarea')) {
              value = $input.val();
            } else if ($input.is('input[type="checkbox"]')) {
              // Collect all checked values as an array
              const $checked = $group.find('input[type="checkbox"]:checked');
              if ($checked.length > 1) {
                value = $checked.map(function () { return $(this).val(); }).get();
              } else if ($checked.length === 1) {
                value = $checked.val();
              } else {
                value = null;
              }
            } else if ($input.is('input[type="radio"]')) {
              // Check if this specific field container has colour-select inputs
              const $fieldContainer = $input.closest('.custom-field');
              const $colourSelectInputs = $fieldContainer.find('input[data-field-type="colour-select"]');
              if ($colourSelectInputs.length > 0) {
                // This is a colour-select field
                const $checked = $fieldContainer.find('input[data-field-type="colour-select"]:checked');
                value = $checked.length ? $checked.val() : null;
              } else {
                // This is a regular radio field
                const $checked = $fieldContainer.find('input[type="radio"]:checked');
                value = $checked.length ? $checked.val() : null;
              }
            } else if ($input.is('input[type="color"]')) {
              value = $input.val();
            } else if ($input.is('input[type="file"]')) {
              // Find the preview area next to the file input wrapper
              const $previewArea = $input.closest('.custom-upload-wrapper').next('.multi-file-upload-preview');
              const variationFiles = [];
              $previewArea.find('.multi-file-box').each(function () {
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
              // Store the full file objects for cart and API
              value = variationFiles;
              variationFilesForGroup = variationFiles;
            }

            groupVariations.push({
              variationField: {
                id: variationFieldData.id,
                name: variationFieldData.name
              },
              value: value,
              // ...(variationFilesForGroup ? { variationFiles: variationFilesForGroup } : {})
              variationFiles: variationFilesForGroup ?? [],
            });
          });

          formData.variationsGroups.push({
            groupCost: parseFloat($group.find('[data-group-cost]').attr('data-group-cost')) || 0,
            quantity: parseInt($group.find('.group-quantity').val()) || 1,
            variations: groupVariations
          });
        });
      } else {
        // if there are no groups then we just use the quantity from the quantity input
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
    $(document).on('click', '.single_add_to_cart_button', async function (e) {
      e.preventDefault();
      e.stopImmediatePropagation(); // Ensure only this handler runs
      // Validate form before proceeding
      if (!validateForm()) {
        console.log('Form validation failed');
        focusFirstFormError();
        return;
      }
      setLoadingState(true);
      try {
        // Gather form data and log it
        const merchiCartItemJson = await gatherFormData();
        const { quantity, variationsGroups = [], variations = [] } = merchiCartItemJson;

        let cartId = null;

        // use querySelector to get the main image and assign it to featureImage
        const pageImg = document.querySelector(
          '.woocommerce-product-gallery__image img, .woocommerce-product-gallery__wrapper img, meta[property="og:image"]'
        )?.src;

        if (pageImg && !merchiCartItemJson.product.featureImage) {
          merchiCartItemJson.product.featureImage = { viewUrl: pageImg };
        }

        let merchiCartJson = localStorage.getItem('MerchiCart');
        const cartData = merchiCartJson ? JSON.parse(merchiCartJson) : null;
        // If no cart exists, create a new one
        if (!cartData) {
          try {
            await initOrSyncCart();
          } catch (error) {
            alert("Failed to initialize cart. Please try again.");
            setLoadingState(false);
            return;
          }
          merchiCartJson = localStorage.getItem('MerchiCart');
          cartData = merchiCartJson ? JSON.parse(merchiCartJson) : null;
        }

        merchiCartItemJson.cart = cartData ? {
          id: cartData.id,
          token: cartData.token
        } : null;

        const cartPayload = {
          merchiCartItemJson,
        };

        jQuery.ajax({
          method: "POST",
          url: (typeof frontendajax !== 'undefined' ? frontendajax.ajaxurl : '/wp-admin/admin-ajax.php'),
          data: {
            action: "send_id_for_add_cart",
            item: cartPayload,
          },
          dataType: "json",
          success: function (response) {
            setLoadingState(false);

            if (response.success && response.merchiCart) {
              localStorage.setItem('MerchiCart', JSON.stringify(response.merchiCart));
            }
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
            console.error('AJAX Error!', { jqXHR, textStatus, errorThrown });
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
    jQuery(function () {
      jQuery('.group-field-set').each(function () {
        if (jQuery(this).find('.custom-field').length === 0) {
          jQuery(this).remove();
        }
      });
    });

    // Debug: Log whenever a new .group-field-set is added to the DOM
    jQuery(function () {
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
  $form.find('.custom-field[data-required="true"]').each(function () {
    const $container = jQuery(this);
    const $input = $container.find('input, select, textarea').first();
    const fieldName = $input.data('field-name') || 'Field';
    // Remove any previous per-field error message
    $container.find('.field-error-message').remove();
    if ($input.is('input[type="radio"], input[type="checkbox"]')) {
      const $checked = $container.find('input:checked');
      if ($checked.length === 0) {
        errors.push(`${fieldName} is required`);
        $container.addClass('field-error');
        $container.append(`<div class="field-error-message">${fieldName} is required</div>`);
      } else {
        $container.removeClass('field-error');
      }
    } else if (!$input.val()) {
      errors.push(`${fieldName} is required`);
      $input.addClass('field-error');
      $input.after(`<div class="field-error-message">${fieldName} is required</div>`);
    } else {
      $input.removeClass('field-error');
    }
  });

  // Validate quantities
  jQuery('.group-quantity').each(function () {
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
    $errorContainer.html('<div class="form-error">Please enter the required fields</div>');
    return false;
  } else {
    $errorContainer.remove();
    return true;
  }
}

function focusFirstFormError() {
  const $form = jQuery('.merchi-product-form');
  const $err = $form.find('.field-error, .woocommerce-invalid, [aria-invalid="true"], .error, .has-error').first();
  if (!$err.length) return false;

  let el = $err[0];
  const inner = el.matches('input,select,textarea,button,[tabindex]') ? el : el.querySelector('input,select,textarea,button,[tabindex]');
  if (inner) el = inner;

  const hadTab = el.hasAttribute('tabindex');
  if (!hadTab) el.setAttribute('tabindex', '-1');

  // foucs first, do not scroll
  try {
    el.focus({ preventScroll: true });
  } catch (e) {
    try { el.focus(); } catch (_) { }
  }

  const wpbar = document.getElementById('wpadminbar');
  const header = document.querySelector('.site-header.is-sticky, .site-header.sticky, .sticky-header');
  const EXTRA = 30;
  const offset = (wpbar ? wpbar.offsetHeight : 0) + (header ? header.offsetHeight : 0) + EXTRA;

  const rect = el.getBoundingClientRect();
  const absTop = rect.top + window.pageYOffset;
  const visibleH = Math.max(0, window.innerHeight - offset);

  // set the element in the middle of the viewport
  let desiredScrollY = absTop - (offset + Math.max(0, (visibleH - rect.height) / 2));
  const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  desiredScrollY = Math.min(maxScrollY, Math.max(0, desiredScrollY));

  window.scrollTo({ top: desiredScrollY, behavior: 'smooth' });

  if (!hadTab) setTimeout(() => el.removeAttribute('tabindex'), 600);
  return true;
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

  const cartUrl = (window.scriptData && window.scriptData.cartUrl) || '/cart/';

  // Create and show new message
  const message = document.createElement('div');
  message.className = 'merchi-success-message';
  message.innerHTML = `
    <span class="merchi-success-close" tabindex="0" aria-label="Close">&times;</span>
    <span>✓ Product added to cart successfully!</span>
    <a href="${cartUrl}">Go to cart</a>
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
}
