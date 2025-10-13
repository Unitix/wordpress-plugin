// Wait for both jQuery and Merchi SDK to be ready
import { MERCHI_SDK } from './merchi_sdk';
import { initializeCheckout } from './merchi_checkout_init';

function isSelectableVariation(variationField) {
  return [2, 6, 7, 9, 11].includes(variationField.fieldType);
}

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

            // Always update price displays and price range after title
            updatePriceDisplays(productJson.bestPrice, productJson.unitPrice);
            updatePriceRangeAfterTitle(productJson.bestPrice, productJson.unitPrice);

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

    // Function to update price range display after product title
    function updatePriceRangeAfterTitle(bestPrice, unitPrice) {
      if (bestPrice && unitPrice) {
        // Find or create the price range display element
        let $priceRangeDisplay = $('.merchi-price-range-display');
        if ($priceRangeDisplay.length === 0) {
          // Create the element after product title
          $('.product_title').after('<div class="merchi-price-range-display"></div>');
          $priceRangeDisplay = $('.merchi-price-range-display');
        }

        if (bestPrice !== unitPrice) {
          // Show price range with tooltip
          $priceRangeDisplay.html(
            `<span class="price-range-text">$${bestPrice.toFixed(2)} <span class="price-separator">—</span> $${unitPrice.toFixed(2)} per unit</span> ` +
            `<span class="price-tooltip-icon" data-tooltip="Unit price varies depending on the quantity you choose, with discounts applied at higher quantities.">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="17" r="1" fill="currentColor"/>
              </svg>
            </span>`
          );
        } else {
          // Show only unit price when no best price
          $priceRangeDisplay.html(
            `<span class="price-range-text">$${unitPrice.toFixed(2)} per unit</span>`
          );
        }
      }
    }

    // Simple function to update price displays with best price
    function updatePriceDisplays(bestPrice, unitPrice) {
      // Update all quantity field price displays
      $('.group-quantity').each(function (index) {
        const $input = $(this);
        const $priceSpan = $input.closest('.custom-field').find('.group-unit-price');

        // Use unitPrice from Merchi SDK instead of data attribute
        const currentUnitPrice = unitPrice || parseFloat($input.attr('data-unit-price'));

        // Show current unit price next to quantity buttons, no parentheses
        const newText = `$${currentUnitPrice.toFixed(2)} per unit`;
        $priceSpan.html(newText);
      });
    }

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

    // Sort selectable options by their position, falling back to name/value
    function sortOptionsByPosition(options) {
      if (!Array.isArray(options)) return [];
      return options.slice().sort((a, b) => {
        const posA = a && a.position;
        const posB = b && b.position;

        const hasPosA = typeof posA === 'number';
        const hasPosB = typeof posB === 'number';

        if (hasPosA && hasPosB) {
          if (posA === posB) return 0;
          return posA < posB ? -1 : 1;
        }
        if (hasPosA) return -1;
        if (hasPosB) return 1;

        const nameA = (a && (a.value || a.name || '')) + '';
        const nameB = (b && (b.value || b.name || '')) + '';
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
    }

    // Helper function to render field HTML in JavaScript (mirrors PHP rendering logic)
    function renderFieldHtml(newVariation, namePrefix, fieldIndex, isGroup = false, groupIndex = 0) {
      const {
        onceOffCost = 0,
        unitCost = 0,
        selectableOptions = [],
        value,
        variationField = {},
        variationFiles = [],
      } = newVariation;

      const {
        id: fieldId,
        name: label,
        fieldType,
        required = false,
        placeholder = '',
        instructions = '',
        multipleSelect = false,
      } = variationField;

      const slug = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fieldName = namePrefix + '.variations[' + fieldIndex + ']';
      const requiredAttr = required ? 'required' : '';
      const requiredClass = required ? ' data-required="true"' : '';
      function isOptionSelected(option) {
        if (!value || value === '') return false;
        const valueArray = value.split(',');
        return valueArray.includes(option.optionId);
      }

      // Create variation field data for JavaScript
      const variationFieldJson = JSON.stringify(variationField).replace(/"/g, '&quot;');
      const calculateAttr = isSelectableVariation(variationField) ? ' data-calculate="true"' : '';
      const commonDataAttrs = ` data-variation-field='${variationFieldJson}'${calculateAttr}`;

      // Cost label helper
      const costLabel = () => {
        let label = '';
        if (unitCost > 0) {
          label += ` + ( $${unitCost.toFixed(2)} per unit )`;
        }
        if (onceOffCost > 0) {
          label += ` + ( $${onceOffCost.toFixed(2)} once off )`;
        }
        return label;
      };

      // Cost label helper
      const costLabelForOption = (option) => {
        let label = '';
        const { onceOffCost, unitCost } = option;
        if (unitCost > 0) {
          label += ` + ( $${unitCost.toFixed(2)} per unit )`;
        }
        if (onceOffCost > 0) {
          label += ` + ( $${onceOffCost.toFixed(2)} once off )`;
        }
        return label;
      };

      const sortedOptions = sortOptionsByPosition(selectableOptions);
      let html = `<div class="custom-field"${requiredClass}>`;

      switch (fieldType) {
        case 1: // TEXT
          html += `<label for="${fieldName}">${label}${costLabel()}</label>`;
          html += `
            <input
              type="text"
              name="${fieldName}"
              placeholder="${placeholder}" 
              ${requiredAttr}${commonDataAttrs}
              class="input-text"
            />`;
          break;

        case 2: // SELECT
          html += `<label for="${fieldName}">${label}</label>`;
          if (multipleSelect) {
            html += `<select multiple id="${fieldName}" name="${fieldName}"${commonDataAttrs} class="select">`;
          } else {
            html += `<select id="${fieldName}" name="${fieldName}"${commonDataAttrs} class="select">`;
          }
          sortedOptions.forEach((option, index) => {
            const selected = index === 0 && !multipleSelect ? 'selected' : '';
            const isEnabled = option.isVisible && option.available;
            const optionCost = costLabelForOption(option);
            const disabledAttr = !isEnabled ? 'disabled' : '';
            html += `
              <option
                value="${option.optionId}"
                ${selected}
                ${disabledAttr}
                data-variation-field-value="${option.optionId}"
              >
                ${option.value}${optionCost}
              </option>`;
          });
          html += '</select>';
          break;

        case 3: // FILE
          html += `<label for="${fieldName}">${label}${costLabel()}</label>`;
          html += `<label class="custom-upload-wrapper">
            <div class="upload-icon">📎</div>
            <div class="upload-instruction">Drop file here or click to browse</div>
            <div class="upload-types">.jpeg, .jpg, .gif, .png, .pdf</div>
            <input type="file" name="${fieldName}" multiple ${requiredAttr} accept=".jpeg,.jpg,.gif,.png,.pdf"${commonDataAttrs} class="input-file"/>
          </label>`;
          // Render existing files if any
          if (Array.isArray(variationFiles) && variationFiles.length > 0) {
            html += '<div class="multi-file-upload-preview">';
            variationFiles.forEach(function (merchiFile) {
              const merchiFileJson = typeof merchiFile === 'string' ? JSON.parse(merchiFile) : merchiFile;
              const fileName = merchiFileJson.originalFilename || merchiFileJson.name || 'Unknown file';
              const isImage = merchiFileJson.mimetype && merchiFileJson.mimetype.startsWith('image/');
              const downloadUrl = merchiFileJson.downloadUrl || merchiFileJson.viewUrl;

              html += `
                <div class="multi-file-box" style="
                  display: flex; 
                  align-items: center; 
                  margin-bottom: 8px; 
                  background: #fff; 
                  border-radius: 6px; 
                  box-shadow: 0 1px 4px rgba(0,0,0,0.06); 
                  padding: 8px;
                " 
                data-merchi-file='${JSON.stringify(merchiFileJson)}'
                data-download-url="${downloadUrl}"
                data-view-url="${merchiFileJson.viewUrl}"
                data-mimetype="${merchiFileJson.mimetype}"
              >`;

              if (isImage && merchiFileJson.viewUrl) {
                html += `
                  <img src="${merchiFileJson.viewUrl}" style="
                    max-width: 60px; 
                    max-height: 60px; 
                    object-fit: contain; 
                    margin-right: 10px; 
                    border-radius: 4px; 
                    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
                  " />`;
              } else {
                html += '<span style="font-size: 32px; margin-right: 10px;">📄</span>';
              }

              html += `
                  <span style="
                    font-weight: bold; 
                    font-size: 0.9em; 
                    color: #333; 
                    flex-grow: 1;
                  ">
                    ${fileName}
                  </span>`;

              if (downloadUrl) {
                html += `
                    <a href="${downloadUrl}" 
                       download="${fileName}"
                       style="
                         margin-left: 10px; 
                         font-size: 18px; 
                         text-decoration: none; 
                         color: #0073aa;
                       "
                       title="Download file"
                    >
                      ⬇️
                    </a>
                  `;
              }

              // Add remove button
              html += `
                  <span class="file-upload-remove" style="
                    margin-left: 10px; 
                    cursor: pointer; 
                    font-size: 20px; 
                    color: #d00;
                  " 
                  title="Remove file"
                  data-file-id="${merchiFileJson.id}">
                    &times;
                  </span>
                `;

              html += '</div>';
            });
            html += '</div>';
          }
          break;

        case 4: // TEXTAREA
          html += `<label for="${fieldName}">${label}${costLabel()}</label>`;
          html += `<textarea name="${fieldName}" placeholder="${placeholder}" ${requiredAttr}${commonDataAttrs} class="input-textarea"></textarea>`;
          break;

        case 5: // NUMBER
          html += `<label for="${fieldName}">${label}${costLabel()}</label>`;
          html += `<input type="number" name="${fieldName}" placeholder="${placeholder}" ${requiredAttr}${commonDataAttrs} class="input-number"/>`;
          break;

        case 6: // CHECKBOX
          html += `<label for="${fieldName}">${label}</label>`;
          html += '<div class="checkbox-options-container">';
          sortedOptions.forEach(option => {
            const isEnabled = option.isVisible && option.available;
            const checked = isOptionSelected(option) ? 'checked' : '';
            const optionCost = costLabelForOption(option);
            const disabledAttr = !isEnabled ? 'disabled' : '';
            html += `
                <div class="checkbox-option">
                  <label for="${fieldName}" class="checkbox-label">
                    <input
                      type="checkbox"
                      name="${fieldName}"
                      value="${option.optionId}"${checked}${commonDataAttrs}
                      data-variation-field-value="${option.optionId}"
                      class="input-checkbox"
                      ${disabledAttr}
                    />
                    <span class="option-label">${option.value}${optionCost}</span>
                  </label>
                </div>`;
          });
          html += '</div>';
          break;

        case 7: // RADIO
          html += `<label for="${fieldName}">${label}</label>`;
          html += '<div class="radio-options-container">';
          sortedOptions.forEach((option) => {
            const isEnabled = option.isVisible && option.available;
            const checked = isOptionSelected(option) ? 'checked' : '';
            const optionCost = costLabelForOption(option);
            const disabledAttr = !isEnabled ? 'disabled' : '';
            html += `
                <div class="radio-option">
                  <label class="radio-label" for="${fieldName}">
                    <input
                      type="radio"
                      name="${fieldName}"
                      value="${option.optionId}"
                      ${checked}${commonDataAttrs}
                      data-variation-field-value="${option.optionId}"
                      class="input-radio"
                      ${disabledAttr}
                    />
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
          const inputType = multipleSelect ? 'checkbox' : 'radio';
          html += `
            <label
              for="${slug}"
              data-group-index="${labelGroupIndex}"
              data-update-label="true"
              data-variation-field-id="${fieldId}"
            >
              ${label} ${costLabel()}
            </label>`;
          html += `<div class="group-variation-container" name="${fieldName}"${commonDataAttrs}>`;
          html += '<div class="image-select-options-container">';
          sortedOptions.forEach((option, optionIndex) => {
            const checked = isOptionSelected(option) ? 'checked' : '';
            const isEnabled = option.isVisible && option.available;
            const disabledAttr = !isEnabled ? 'disabled' : '';
            const radioInputId = `${fieldName}-option-${option.optionId}`;
            html += `
                <div class="image-select-option">
                  <input
                    ${disabledAttr}
                    type="${inputType}"
                    id="${radioInputId}"
                    name="${fieldName}"
                    value="${option.optionId}"
                    ${checked}${commonDataAttrs}
                    data-variation-field-value="${option.optionId}"
                    data-update-label="true"
                    data-field-type="image-select"
                  />
                  <label class="image-select-label" for="${radioInputId}">
                    <span class="image-select-checkmark"></span>
                    ${option.linkedFile ? `<img src="${option.linkedFile.viewUrl}" alt="${option.value}" />` : ''}
                    <span class="option-label">${option.value}</span>
                  </label>
                </div>`;
          });
          html += '</div>';
          html += '</div>';
          break;

        case 10: // COLOR
          html += `<label for="${fieldName}">${label}${costLabel()}</label>`;
          html += `<input type="color" id="${fieldName}" name="${fieldName}" ${requiredAttr}${commonDataAttrs} class="input-color"/>`;
          break;

        case 11: // COLOR_SELECT
          const colorInputType = multipleSelect ? 'checkbox' : 'radio';
          html += `
            <label
              for="${fieldName}"
              data-group-index="${isGroup ? groupIndex : 'false'}"
              data-update-label="true"
              data-variation-field-id="${fieldId}"
            >
              ${label} ${costLabel()}
            </label>`;
          html += '<div class="color-options-grid">';
          sortedOptions.forEach((option) => {
            const isEnabled = option.isVisible && option.available;
            const checked = isOptionSelected(option) ? 'checked' : '';
            const disabledAttr = !isEnabled ? 'disabled' : '';
            html += `
              <label class="color-option" for="${fieldName}" data-full-name="${option.value}">
                <input
                  type="${colorInputType}"
                  name="${fieldName}"
                  value="${option.optionId}"
                  ${checked}${commonDataAttrs}
                  data-variation-field-value="${option.optionId}"
                  data-field-type="colour-select"
                  ${disabledAttr}
                />
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
          html += `<label for="${fieldName}">${label}${costLabel()}</label>`;
          html += `
            <input
              type="text"
              name="${fieldName}"
              placeholder="${placeholder}" 
              ${requiredAttr}${commonDataAttrs}
              class="input-text"
            />`;
          break;
      }

      html += '</div>';
      return html;
    }

    // Helper function to check if variation fields have changed
    function hasVariationsChanged(currentVariations, responseVariations) {
      if (currentVariations.length !== responseVariations.length) {
        return true;
      }

      for (let i = 0; i < currentVariations.length; i++) {
        const current = currentVariations[i];
        const response = responseVariations[i];

        // Compare variation field properties
        const currentField = current.variationField || current;
        const responseField = response.variationField || response;

        // Compare key properties that would affect rendering
        if (currentField.id !== responseField.id ||
          currentField.fieldType !== responseField.fieldType ||
          currentField.options?.length !== responseField.options?.length ||
          currentField.required !== responseField.required) {
          return true;
        }

        // Compare variation values
        if (current.value !== response.value) {
          return true;
        }
      }
      return false;
    }

    // Helper function to apply variation values to rendered fields
    function applyVariationValue($container, variation, skipTrigger = false) {
      const { value, variationField } = variation;
      const variationFieldId = variationField.id;

      if (value === undefined || value === null || value === '') return;

      // Find the field with matching variation field ID
      const $field = $container.find('[data-variation-field]').filter(function () {
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

          let checkboxValues = [];
          if (Array.isArray(value)) {
            checkboxValues = value;
          } else if (typeof value === 'string' && value.length > 0) {
            checkboxValues = value.split(',').map(v => v.trim()).filter(v => v);
          }

          checkboxValues.forEach(val => {
            $checkboxContainer.find(`input[type="checkbox"][value="${val}"]`).prop('checked', true);
          });
          break;

        case 7: // RADIO
        case 9: // IMAGE_SELECT 
        case 11: // COLOR_SELECT
          const $inputContainer = $field.closest('.custom-field');

          // Handle multiple select (checkboxes) vs single select (radios)
          if (fieldData.multipleSelect) {
            // Uncheck all checkboxes first
            $inputContainer.find('input[type="checkbox"]').prop('checked', false);
            const values = value.split(',');

            if (values.length > 1) {
              values.forEach(val => {
                $inputContainer.find(`input[type="checkbox"][value="${val}"]`).prop('checked', true);
              });
            } else if (values.length === 1) {
              $inputContainer.find(`input[type="checkbox"][value="${values[0]}"]`).prop('checked', true);
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
          // We skip file render because they've already been rendered by renderFieldHtml
          break;

        case 8: // INSTRUCTIONS
          // Instructions don't have values
          break;

        default:
          console.log('Unknown field type for value application:', fieldType);
          break;
      }

      if (!skipTrigger) {
        $field.trigger('change');
      }
    }

    async function reRenderForm(response) {
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
        const currentVariations = await processVariations($independentContainer);

        if (hasVariationsChanged(currentVariations, variations)) {
          hasChanges = true;

          // Re-render independent variations
          let independentHtml = '';
          variations.forEach((variation, index) => {
            if (variation.variationField) {
              independentHtml += renderFieldHtml(variation, 'custom_fields', index);
            }
          });

          if (independentHtml) {
            $independentContainer.html(independentHtml);

            // Apply current values from response to newly rendered fields
            variations.forEach((variation) => {
              if (variation.variationField && variation.value !== undefined && variation.value !== null) {
                applyVariationValue($independentContainer, variation, true);
              }
            });

            // Re-initialize event handlers for the re-rendered independent variations
            initializeVariationFields($independentContainer);
            initializeFileUploadVariations($independentContainer);
            initializeImageSelectVariations($independentContainer);
            initializeColorSelectVariations($independentContainer);
          }
        }
      }

      // Check group variations for changes  
      const $groupsContainer = jQuery('#grouped-fields-container');
      if ($groupsContainer.length > 0 && variationsGroups.length > 0) {
        const currentGroupVariations = [];
        const $groups = $groupsContainer.find('.group-field-set');

        for (let i = 0; i < $groups.length; i++) {
          const $group = jQuery($groups[i]);
          const groupVariations = await processVariations($group);
          currentGroupVariations.push(groupVariations);
        }

        hasChanges = true;

        // Re-render group variations
        let groupsHtml = '<h3>Grouped Options</h3>';

        variationsGroups.forEach((group, groupIndex) => {
          const { variations: groupVariations = [], quantity = 1, groupCost = 0 } = group;

          groupsHtml += `<div class="group-field-set" data-group-index="${groupIndex}">`;
          groupsHtml += `<h4>Group <span class="group-number">${groupIndex + 1}</span></h4>`;

          // Add variation fields for this group FIRST
          groupVariations.forEach((variation, variationIndex) => {
            if (variation.variationField) {
              groupsHtml += renderFieldHtml(
                variation,
                `variationsGroups[${groupIndex}]`,
                variationIndex,
                true,
                groupIndex
              );
            }
          });

          // Add group quantity field AFTER variation fields (to match PHP rendering)
          const { costPerUnit = 0 } = defaultJobJson;
          const quantityInputId = `group-quantity-${groupIndex}`;
          groupsHtml += `
            <div class="custom-field">
              <label for="${quantityInputId}">Quantity</label>
              <div class="quantity">
                <div class="number-button">
                  <input type="button" value="-" class="minus" data-group-index="${groupIndex}">
                  <input type="number" class="qty group-quantity" id="${quantityInputId}" name="variationsGroups[${groupIndex}].quantity" value="${quantity}" min="1" data-group-index="${groupIndex}" aria-label="Product quantity" step="1" inputmode="numeric" autocomplete="off">
                  <input type="button" value="+" class="plus" data-group-index="${groupIndex}">
                </div>
                <span class="group-unit-price">( $${costPerUnit.toFixed(2)} per unit )</span>
              </div>
            </div>`;

          groupsHtml += `
            <div
              class="group-cost-display"
              data-group-index="${groupIndex}"
              data-group-cost="${groupCost}"
            >
              Group Cost: $${groupCost.toFixed(2)}
            </div>`;
          groupsHtml += `
            <button
              type="button"
              class="button wp-element-button delete-group-button"
              ${variationsGroups.length === 1 ? 'style="display: none;"' : ''}
            >
              Delete Group
            </button>`;
          groupsHtml += '</div>';
        });

        $groupsContainer.html(groupsHtml);

        // Apply current values from response to newly rendered group fields
        variationsGroups.forEach((group, groupIndex) => {
          const { variations: groupVariations = [] } = group;
          const $groupContainer = $groupsContainer.find(`.group-field-set[data-group-index="${groupIndex}"]`);

          groupVariations.forEach((variation) => {
            if (variation.variationField && variation.value !== undefined && variation.value !== null) {
              applyVariationValue($groupContainer, variation, true);
            }
          });

          // Re-initialize event handlers for this re-rendered group
          initializeGroupVariationHandlers($groupContainer);
        });

      }
      // Re-bind quantity buttons after re-rendering (must be after group handlers)
      if (hasChanges) {
        bindQuantityButtons();
      }
    }

    async function onGetJobQuoteSuccess(response) {
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
      await reRenderForm(response);

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

        // Update the unit price display - only show current price, no price range
        const priceDisplay = `$${costPerUnit.toFixed(2)} per unit`;
        $groupFieldSet.find('.group-unit-price').html(priceDisplay);
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

    // Helper function to get MOQ settings
    function getMOQSettings() {
      const $groupedContainer = jQuery('#grouped-fields-container');
      const minimumPerGroup = $groupedContainer.length > 0 ? $groupedContainer.attr('data-minimum-per-group') === 'true' : false;
      const groupCount = jQuery('.group-quantity').length;
      return { minimumPerGroup, groupCount };
    }

    // Helper function to validate and correct quantity for a single input
    function validateAndCorrectQuantity($input, context = 'change') {
      const { minimumPerGroup, groupCount } = getMOQSettings();

      if (minimumPerGroup) {
        // Each group must meet minimum quantity
        const minimumQuantity = parseInt($input.attr('min')) || 1;
        const currentValue = parseInt($input.val());

        if (!isNaN(currentValue) && currentValue < minimumQuantity) {
          $input.val(minimumQuantity);
          if (context === 'blur') {
            calculateAndUpdatePrice();
          }
        }
      } else {
        // Accumulative mode: different logic based on group count
        if (groupCount === 1) {
          // Case A: Only one group - this group must meet MOQ
          const minimumQuantity = productJson.minimum || 1;
          const currentValue = parseInt($input.val());

          if (!isNaN(currentValue) && currentValue < minimumQuantity) {
            $input.val(minimumQuantity);
            if (context === 'blur') {
              calculateAndUpdatePrice();
            }
          }
        } else {
          // Case B: Multiple groups - only enforce minimum of 1 per group
          const currentValue = parseInt($input.val());
          if (!isNaN(currentValue) && currentValue < 1) {
            $input.val(1);
            if (context === 'blur') {
              calculateAndUpdatePrice();
            }
          }
        }
      }
    }

    // Helper function to get initial quantity for new group
    function getInitialQuantityForNewGroup() {
      const { minimumPerGroup } = getMOQSettings();
      const currentGroupCount = jQuery('.group-quantity').length;
      const minimumQuantity = productJson.minimum || 1;

      if (minimumPerGroup) {
        return { val: minimumQuantity, min: minimumQuantity };
      } else {
        if (currentGroupCount === 0) {
          return { val: minimumQuantity, min: minimumQuantity };
        } else {
          return { val: 1, min: 1 };
        }
      }
    }

    // Initialize event handlers
    function initializeHandlers() {
      // Remove ALL handlers (not just namespaced ones) to prevent conflicts with WooCommerce/theme scripts
      jQuery(document).off('click', '.quantity .plus');
      jQuery(document).off('click', '.quantity .minus');
      jQuery(document).off('blur.merchi', '.group-quantity');
      jQuery(document).off('input.merchi', '.group-quantity');
      jQuery(document).off('click.merchi', '.delete-group-button');

      // Also remove handlers directly on the buttons themselves
      jQuery('.quantity .plus').off('click');
      jQuery('.quantity .minus').off('click');

      // initialise event handlers for variations
      initializeVariations();

      // initialise event handlers for groups
      const $groups = jQuery('.group-field-set');
      for (let i = 0; i < $groups.length; i++) {
        initializeGroupVariationHandlers(jQuery($groups[i]));
      }


      // Enforce minimum quantity on blur
      jQuery(document).on('blur.merchi', '.group-quantity', function () {
        const $input = jQuery(this);

        if ($input.attr('data-calculate') === 'true') {
          $input.on('change', debouncedCalculatePrice);
        }

        validateAndCorrectQuantity($input, 'blur');
      });

      // Handle quantity input events (for when user types)
      jQuery(document).on('input.merchi', '.group-quantity', calculateAndUpdatePrice);

      jQuery('.add-group-button').off('click');

      // Add group button handler
      jQuery('.add-group-button').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        addNewGroup();
      });

      // Delete group handler with immediate price update
      jQuery(document).on('click.merchi', '.delete-group-button', actionDeleteGroup);

      // Bind directly to existing buttons (not using delegation to ensure priority)
      bindQuantityButtons();
    }

    // Separate function to bind quantity button handlers
    function bindQuantityButtons() {
      // Plus button handler - bind directly to elements for highest priority
      jQuery('.quantity .plus').off('click').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const $button = jQuery(this);
        const $input = $button.siblings('.group-quantity');
        const currentValue = parseInt($input.val()) || 0;
        $input.val(currentValue + 1);
        calculateAndUpdatePrice();
        return false;
      });

      // Minus button handler - bind directly to elements for highest priority
      jQuery('.quantity .minus').off('click').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const $button = jQuery(this);
        const $input = $button.siblings('.group-quantity');
        const currentValue = parseInt($input.val()) || 0;
        const minValue = parseInt($input.attr('min')) || 1;
        if (currentValue > minValue) {
          $input.val(currentValue - 1);
          calculateAndUpdatePrice();
        }
        return false;
      });
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

    function initializeColorSelectVariations($container) {
      $container.find('.color-option').each(function () {
        const $option = jQuery(this);
        const $input = $option.find('input');
        $option.off('click.color-select').on('click.color-select', function (e) {
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

        // Only attach handler if data-calculate is explicitly true
        if ($input.attr('data-calculate') === 'true') {
          $input.on('change.calculate', debouncedCalculatePrice);
        }
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

            // Update label to show only "Quantity" without price
            $input.closest('.custom-field')
              .find('label')
              .html('Quantity');
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

    // Sets all the event listeners for the variations
    function initializeVariations() {
      // Initialize priority fields (File upload & Text input)
      const $priorityFieldsContainer = jQuery('.priority-fields-section');
      initializeVariationFields($priorityFieldsContainer);
      initializeFileUploadVariations($priorityFieldsContainer);

      // Initialize other standalone variations
      const $variationsContainer = jQuery('.custom-variation-options');
      // Initialize calculate inputs
      initializeVariationFields($variationsContainer);
      // Initialize file inputs
      initializeFileUploadVariations($variationsContainer);
      // Initialize image select options
      initializeImageSelectVariations($variationsContainer);
      // Initialize color select options
      initializeColorSelectVariations($variationsContainer);
    }

    // Sets all the event listeners for the group variations
    function initializeGroupVariationHandlers($group) {
      // Initialize calculate inputs
      initializeVariationFields($group);

      // Initialize image select options
      initializeImageSelectVariations($group);

      // Initialize color select options
      initializeColorSelectVariations($group);

      // Initialize file inputs
      initializeFileUploadVariations($group);

      // Bind group-quantity change for this group
      $group.find('.group-quantity').off('change.group').on('change.group', function () {
        const $input = jQuery(this);
        validateAndCorrectQuantity($input, 'change');
        calculateAndUpdatePrice();
      });
      $group.find('.delete-group-button').off('click.group').on('click.group', actionDeleteGroup);

      $group.find('.delete-group-button').off('click');
      // Delete group handler with immediate price update
      $group.find('.delete-group-button').on('click', actionDeleteGroup);
    }

    // Function to add a new group
    const addNewGroup = () => {
      // Use the cloned default values
      const { defaultJob = {} } = productClone;
      const { variationsGroups = [] } = defaultJob;
      const defaultGroup = variationsGroups[0];
      const { variations = [] } = defaultGroup;

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
          $input.attr('data-group-index', newGroupIndex);

          const initialQuantity = getInitialQuantityForNewGroup();
          $input.val(initialQuantity.val);
          $input.attr('min', initialQuantity.min);

          $input
            .closest('.custom-field')
            .find('label')
            .html('Quantity');
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
      // Rebind quantity buttons for the new group
      bindQuantityButtons();
      calculateAndUpdatePrice();
    }


    // Function to process variations from a container
    async function processVariations($container) {
      const variations = [];
      $container.find('.custom-field').each(function () {
        const $fieldContainer = jQuery(this);
        const $input = $fieldContainer.find('input, select, textarea').first();
        const variationField = $input.data('variation-field');

        // if there is no variation field then we skip
        if (!variationField) return;

        const variation = { variationField };

        function getCheckedValues($fieldContainer) {
          const $checked = $fieldContainer.find('input[type="checkbox"]:checked, input[type="radio"]:checked');
          if ($checked.length > 1) {
            return $checked.map(function () { return jQuery(this).val(); }).get().join(',');
          } else if ($checked.length === 1) {
            return $checked.val();
          } else {
            return null;
          }
        }

        switch (variationField.fieldType) {
          case 1: // TEXT
          case 4: // TEXTAREA  
          case 5: // NUMBER
            variation.value = $input.val();
            break;

          case 2: // SELECT
            variation.value = $input.val();
            break;

          case 3: // FILE
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
            variation.value = variationFiles.map(file => file.id).join(',');
            variation.variationFiles = variationFiles;
            break;

          case 6: // CHECKBOX
            // Collect all checked values as an array
            variation.value = getCheckedValues($fieldContainer);
            break;

          case 7: // RADIO
            const $checkedRadio = $fieldContainer.find('input[type="radio"]:checked');
            variation.value = $checkedRadio.length ? $checkedRadio.val() : null;
            break;

          case 9: // IMAGE_SELECT
            // Collect all checked values as an array
            variation.value = getCheckedValues($fieldContainer);
            break;

          case 10: // COLOR
            variation.value = $input.val();
            break;

          case 11: // COLOR_SELECT
            variation.value = getCheckedValues($fieldContainer);
            break;

          default:
            // Fallback to input value
            variation.value = $input.val();
            break;
        }

        variations.push(variation);
      });
      return variations;
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
        variations: [],
      };

      // Process group variations
      if (groupVariationFields && groupVariationFields.length > 0) {
        const $groups = jQuery('.group-field-set');
        for (let groupIndex = 0; groupIndex < $groups.length; groupIndex++) {
          const $group = jQuery($groups[groupIndex]);

          // Use processVariations to handle the group fields consistently
          const groupVariations = await processVariations($group);

          formData.variationsGroups.push({
            groupCost: parseFloat($group.find('[data-group-cost]').attr('data-group-cost')) || 0,
            quantity: parseInt($group.find('.group-quantity').val()) || 1,
            variations: groupVariations
          });
        }
      } else {
        // if there are no groups then we just use the quantity from the quantity input
        const minimumQuantity = productJson.minimum || 1;
        formData.quantity = parseInt(jQuery('input.qty').val()) || minimumQuantity;
      }

      // Process priority fields (File upload & Text input)
      const priorityVariations = await processVariations(jQuery('.priority-fields-section'));

      // Process standalone variations
      const standaloneVariations = await processVariations(jQuery('.custom-variation-options'));

      // Combine priority fields and standalone variations
      formData.variations = [...priorityVariations, ...standaloneVariations];

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

  // Validate quantities based on minimumPerGroup setting
  const $groupedContainer = jQuery('#grouped-fields-container');
  const minimumPerGroup = $groupedContainer.length > 0 ? $groupedContainer.attr('data-minimum-per-group') === 'true' : false;
  const groupCount = jQuery('.group-quantity').length;

  if (minimumPerGroup) {
    // Each group must meet minimum quantity
    jQuery('.group-quantity').each(function () {
      const $input = jQuery(this);
      const quantity = parseInt($input.val());
      const minimumQuantity = parseInt($input.attr('min')) || 1;
      if (isNaN(quantity) || quantity < minimumQuantity) {
        errors.push(`Each group quantity must be at least ${minimumQuantity}`);
        $input.addClass('field-error');
      } else {
        $input.removeClass('field-error');
      }
    });
  } else {
    if (groupCount === 1) {
      const $input = jQuery('.group-quantity').first();
      const quantity = parseInt($input.val());
      // Get minimum from the input's min attribute or default to 1
      const minimumQuantity = parseInt($input.attr('min')) || 1;
      if (isNaN(quantity) || quantity < minimumQuantity) {
        errors.push(`Quantity must be at least ${minimumQuantity}`);
        $input.addClass('field-error');
      } else {
        $input.removeClass('field-error');
      }
    } else if (groupCount > 1) {
      let totalQuantity = 0;
      jQuery('.group-quantity').each(function () {
        const $input = jQuery(this);
        const quantity = parseInt($input.val()) || 0;
        totalQuantity += quantity;
        $input.removeClass('field-error');
      });

      const minimumQuantity = parseInt(jQuery('.group-quantity').first().attr('min')) || 1;
      if (totalQuantity < minimumQuantity) {
        errors.push(`Total quantity across all groups must be at least ${minimumQuantity} (currently ${totalQuantity})`);
        jQuery('.group-quantity').addClass('field-error');

        // Check if error message already exists, if not add it
        if (jQuery('.moq-error-message').length === 0) {
          jQuery('.group-quantity').each(function () {
            const $input = jQuery(this);
            const $quantityContainer = $input.closest('.quantity');
            $quantityContainer.after(`<div class="moq-error-message" style="color: #d00; font-size: 12px; margin-top: 4px;">The total quantity of all groups must be at least ${minimumQuantity}</div>`);
          });
        }
      } else {
        jQuery('.moq-error-message').remove();
      }
    }
  }

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
    // Clear all MOQ error messages when validation passes
    jQuery('.moq-error-message').remove();
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

jQuery(function ($) {
  var $container = $('.single-product div.product').first();
  var $gallery = $container.find('.woocommerce-product-gallery').first();
  var $summary = $container.find('.summary.entry-summary').first();
  if (!$container.length || !$gallery.length || !$summary.length) return;

  var $placeholder = $gallery.next('.wc-gallery-placeholder');
  if (!$placeholder.length) {
    $gallery.after('<div class="wc-gallery-placeholder" aria-hidden="true"></div>');
  }

  function isMobileDevice() {
    return window.innerWidth < 768;
  }

  function topOffset() {
    var o = 16;
    var $admin = $('#wpadminbar'); if ($admin.length) o += $admin.outerHeight();
    var $hdr = $('.site-header.is-sticky, .site-header.sticky, .sticky-header, .navbar, #masthead, .elementor-sticky--active').first();
    if ($hdr.length) o += $hdr.outerHeight();
    document.documentElement.style.setProperty('--gallery-pin-top', o + 'px');
    return o;
  }

  function update() {
    if (isMobileDevice()) {
      $gallery.removeClass('wc-gallery--fixed wc-gallery--stuck');
      return;
    }

    var off = topOffset();
    var EXTRA = 100;
    var gTop = $gallery.offset().top;
    var gLeft = $gallery.offset().left;
    var gW = $gallery.outerWidth();
    var gH = $gallery.outerHeight();
    var sTop = $summary.offset().top;
    var sH = $summary.outerHeight();
    var cTop = $container.offset().top;
    var y = window.pageYOffset || document.documentElement.scrollTop;

    var doc = document.documentElement.style;
    doc.setProperty('--gallery-pin-width', gW + 'px');
    doc.setProperty('--gallery-pin-height', gH + 'px');
    doc.setProperty('--gallery-pin-left', (gLeft - (window.pageXOffset || 0)) + 'px');

    var MIN = 20;
    var startFix = Math.max(gTop - (off + EXTRA), cTop + MIN);
    var stopAt = (sTop + sH) - gH - (off + EXTRA);

    if (y < startFix) {
      $gallery.removeClass('wc-gallery--fixed wc-gallery--stuck');
      return;
    }
    if (y >= stopAt) {
      $gallery.removeClass('wc-gallery--fixed').addClass('wc-gallery--stuck');
      doc.setProperty('--gallery-abs-top', ((sTop + sH) - gH - cTop) + 'px');
      doc.setProperty('--gallery-abs-left', (gLeft - $container.offset().left) + 'px');
      return;
    }
    $gallery.removeClass('wc-gallery--stuck').addClass('wc-gallery--fixed');
    doc.setProperty('--gallery-pin-left', (gLeft - (window.pageXOffset || 0)) + 'px');
  }

  $(window).on('scroll resize load', update);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(update);
    ro.observe($summary[0]);
    ro.observe($gallery[0]);
  }
  update();
});
