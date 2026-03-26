<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin\PublicPages;

use \MerchiPlugin\Base\BaseController;

class ProductPage extends BaseController {


	public function register() {
		add_action('woocommerce_before_add_to_cart_button', [ $this, 'render_variation_fields_in_order' ], 20 );
		add_action('woocommerce_before_add_to_cart_button', [ $this, 'display_default_quantity' ], 27 );
		add_action('woocommerce_before_add_to_cart_button', [ $this, 'display_total_price' ], 30 );
		add_action('woocommerce_before_add_to_cart_button', [ $this, 'display_action_buttons_container_start' ], 35 );
		add_action('woocommerce_after_add_to_cart_button', [ $this, 'display_buy_now_button' ], 5 );
		add_action('woocommerce_after_add_to_cart_button', [ $this, 'display_quote_button' ], 10 );
		add_action('woocommerce_after_add_to_cart_button', [ $this, 'display_action_buttons_container_end' ], 20 );
		add_action( 'wp', [ $this, 'remove_product_content' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_merchi_scripts' ] );
		add_filter( 'woocommerce_quantity_input_args', [ $this, 'remove_quantity_field' ], 10, 2 );
		add_filter( 'woocommerce_loop_add_to_cart_link', [ $this, 'add_loading_spinner_to_button' ], 10, 2 );
		add_filter( 'woocommerce_single_add_to_cart_button', [ $this, 'add_loading_spinner_to_button' ], 10, 2 );
	}

	public function render_variation_fields_in_order() {
		global $product;
		$product_id = $product->get_id();
		
		$groups_first = get_post_meta($product_id, 'groupsFirst', true);
		$groups_first = filter_var($groups_first, FILTER_VALIDATE_BOOLEAN);
			
		if ($groups_first) {
			$this->custom_display_grouped_attributes();
			$this->custom_display_independent_attributes();
		} else {
			$this->custom_display_independent_attributes();
			$this->custom_display_grouped_attributes();
		}
	}

	public function enqueue_merchi_scripts() {
		// Only load on single product pages
		if (!is_product()) {
			return;
		}

		// Check if this is a Merchi product (has product_id meta)
		$merchi_product_id = get_post_meta(get_the_ID(), 'product_id', true);
		if (empty($merchi_product_id)) {
			return;
		}
		
		$staging_mode = get_option('merchi_staging_mode');
		if ($staging_mode === 'yes') {
			// $merchi_backend_uri = 'https://staging.merchi.co/static/js/dist/merchi-init.js';
			wp_enqueue_script(
				'merchi-init-frontend',
				'https://staging.merchi.co/static/js/dist/merchi-init.js',
				array(),
				null,
				true
			);

		} else {
			wp_enqueue_script(
				'merchi-init-frontend',
				'https://merchi.co/static/js/dist/merchi-init.js',
				array(),
				null,
				true
			);
		}
		// load Merchi SDK
		wp_enqueue_script(
			'merchi_sdk',
			plugin_dir_url(dirname(dirname(__FILE__))) . 'dist/js/merchi_sdk.js',
			array('merchi-init-frontend'),
			'1.0.0',
			true
		);

		wp_enqueue_script(
			'merchi_checkout_init',
			plugin_dir_url(dirname(dirname(__FILE__))) . 'dist/js/merchi_checkout_init.js',
			['merchi_sdk'],
			null,
			true
		);

		wp_enqueue_script(
			'merchi_product_form',
			plugin_dir_url(dirname(dirname(__FILE__))) . 'dist/js/merchi_product_form.js',
			['jquery', 'merchi_sdk', 'merchi_checkout_init'],
			null,
			true
		);

		// Localize the script with AJAX URL
		wp_localize_script(
			'merchi_product_form',
			'frontendajax',
			array(
				'ajaxurl' => admin_url('admin-ajax.php')
			)
		);

		// Get the correct configuration based on staging mode
		$merchi_domain = $staging_mode === 'yes' ? get_option('staging_merchi_url') : get_option('merchi_url');
		$merchi_url = $staging_mode === 'yes' ? 'https://api.staging.merchi.co/' : 'https://api.merchi.co/';

		// Debug logging (only log when actually loading scripts)
		error_log('Merchi Configuration:');
		error_log('Environment: ' . ($staging_mode === 'yes' ? 'Staging' : 'Production'));
		error_log('API URL: ' . $merchi_url);
		error_log('Domain ID: ' . $merchi_domain);
		error_log('Product ID: ' . $merchi_product_id);

		// Add Merchi configuration data
		wp_localize_script('merchi_product_form', 'merchiConfig', array(
			'domainId' => $merchi_domain,
			'apiUrl' => $merchi_url,
			'productId' => $merchi_product_id,
			'stagingMode' => $staging_mode === 'yes',
			'backendUri' => $merchi_url
		));

		// Verify configuration
		if (empty($merchi_domain)) {
			error_log('Warning: Merchi Domain ID is empty');
		}
	}

	public function custom_display_instruction_fields_first() {
		global $product;
		$product_id = $product->get_id();
		$fields = get_post_meta($product_id, '_merchi_ordered_fields', true);
		if (empty($fields) || !is_array($fields)) return;

		// find instruction fields that should be shown first
		$instructionFields = [];
		foreach ($fields as $index => $field) {
			if (intval($field['fieldType']) === 8) {
				$instructionFields[] = ['field' => $field, 'index' => $index];
			}
		}

		if (!empty($instructionFields)) {
			echo '<div class="custom-variation-options merchi-product-form instruction-fields-first">';
			foreach ($instructionFields as $item) {
				echo $this->render_meta_field($item['field'], 'custom_fields', $item['index']);
			}
			echo '</div>';
		}
	}

	public function custom_display_independent_attributes() {
    global $product;

    $product_id = $product->get_id();
    $fields = get_post_meta($product_id, '_merchi_ordered_fields', true);

    if (empty($fields) || !is_array($fields)) return;

    // Sort fields by position before rendering
    usort($fields, function($a, $b) {
        return ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
    });

    // check if product has dynamic fields
    $has_dynamic_fields = $this->has_dynamic_fields($product_id);

    if ($has_dynamic_fields) {
        // show loading spinner for products with dynamic fields
        echo '<div class="custom-variation-options merchi-product-form" data-initial-render="true">';
        echo '<div class="merchi-fields-loading-spinner" style="padding: 20px; text-align: center;">';
        echo '<div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #333; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
        echo '</div>';
        echo '<div class="merchi-fields-content" style="display: none;">';
        
        foreach ($fields as $index => $field) {
            if ($field['type'] === 'attribute') {
                echo $this->render_attribute_field($field, 'custom_fields', false, $index);
            } else {
                echo $this->render_meta_field($field, 'custom_fields', $index);
            }
        }
        
        echo '</div>';
        echo '</div>';
        echo '<style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>';
    } else {
        echo '<div class="custom-variation-options merchi-product-form">';
        
        foreach ($fields as $index => $field) {
            if ($field['type'] === 'attribute') {
                echo $this->render_attribute_field($field, 'custom_fields', false, $index);
            } else {
                echo $this->render_meta_field($field, 'custom_fields', $index);
            }
        }
        
        echo '</div>';
    }

    // Add the checkout container
    echo '<div id="merchi-checkout-container"></div>';
	}

	private function has_dynamic_fields($product_id) {
		$merchi_product_data = get_post_meta($product_id, '_merchi_product_data', true);		
		if (empty($merchi_product_data['product'])) {
			return false;
		}
		
		$product_data = $merchi_product_data['product'];
		$fields_to_check = [];
		if (!empty($product_data['independentVariationFields'])) {
			$fields_to_check = array_merge($fields_to_check, $product_data['independentVariationFields']);
		}
		
		foreach ($fields_to_check as $field) {
			if (!empty($field['selectedBy'])) {
				return true;
			}
		}		
		return false;
	}

	public function custom_display_grouped_attributes() {
		global $product;

		$product_id = $product->get_id();
		$group_fields_template = get_post_meta($product_id, '_group_variation_field_template', true);
		$unit_price = $product->get_price() ?: '0';
		
		// Get minimum quantity from Merchi product data
		$merchi_product_data = get_post_meta($product_id, '_merchi_product_data', true);
		$minimum_quantity = 1; // Default minimum
		if (!empty($merchi_product_data['product']['minimum'])) {
			$minimum_quantity = intval($merchi_product_data['product']['minimum']);
		}

		if (empty($group_fields_template)) return;

		// Sort group fields by position before rendering
		usort($group_fields_template, function($a, $b) {
			return ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
		});

		echo '<div id="grouped-fields-container" class="merchi-product-form">';
		echo '<h2 class="grouped-options-heading">Grouped Options:</h2>';

		echo '<div class="group-field-set" data-group-index="0">';
		echo '<h4>Group <span class="group-number">1</span></h4>';
		
		foreach ($group_fields_template as $field_index => $field) {
			if ($field['type'] === 'attribute') {
				echo $this->render_attribute_field($field, "variationsGroups[0]", true, $field_index);
			} else {
				echo $this->render_meta_field($field, "variationsGroups[0]", $field_index);
			}
		}
		
		// Add group quantity field after variation fields
		echo '<div class="custom-field">';
		if ($minimum_quantity > 1) {
			echo '<label for="quantity">Quantity <span class="price-tooltip-icon" data-tooltip="This product requires a minimum order of ' . esc_attr($minimum_quantity) . ' units">
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
					<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<circle cx="12" cy="17" r="1" fill="currentColor"/>
				</svg>
			</span></label>';
		} else {
			echo '<label for="quantity">Quantity</label>';
		}
		echo '<div class="quantity">';
		echo '<div class="number-button">';
		echo '<input type="button" value="-" class="minus" data-group-index="0">';
		echo '<input type="number" id="quantity" class="qty group-quantity" name="variationsGroups[0].quantity" value="' . esc_attr($minimum_quantity) . '" min="' . esc_attr($minimum_quantity) . '" data-unit-price="' . esc_attr($unit_price) . '" data-group-index="0" aria-label="Product quantity" step="1" inputmode="numeric" autocomplete="off">';
		echo '<input type="button" value="+" class="plus" data-group-index="0">';
		echo '</div>';
		echo '<span class="group-unit-price"><span class="loading-spinner"></span></span>';
		echo '</div>';
		echo '</div>';
		
		echo '<div class="group-cost-display" data-group-index="0" data-group-cost="0"><span class="loading-spinner"></span></div>';
		echo '<button type="button" class="button wp-element-button delete-group-button" style="display: none;">Delete Group</button>';
		echo '</div>';

		$this->display_new_group_button();

		echo '</div>';
	}

	public function display_action_buttons_container_start() {
		echo '<div class="merchi-action-buttons-container">';
	}

	public function display_action_buttons_container_end() {
		echo '</div>';
	}

	public function display_new_group_button() {
		$product_id = get_the_ID();
		$group_fields_template = get_post_meta($product_id, '_group_variation_field_template', true);
		
		// Only show if there are group variation fields
		if (!empty($group_fields_template)) {
			echo '<div class="merchi-new-group-container">';
			echo '<button type="button" class="button wp-element-button add-group-button">+ NEW GROUP</button>';
			echo '</div>';
		}
	}

	public function display_default_quantity() {
		global $product;
		if (!empty(get_post_meta($product->get_id(), '_group_variation_field_template', true))) return;
		
		$unit_price = $product->get_price() ?: '0';
		
		// Get minimum quantity from Merchi product data
		$product_id = $product->get_id();
		$merchi_product_data = get_post_meta($product_id, '_merchi_product_data', true);
		$minimum_quantity = 1; // Default minimum
		if (!empty($merchi_product_data['product']['minimum'])) {
			$minimum_quantity = intval($merchi_product_data['product']['minimum']);
		}
		
		echo '<div class="custom-field">';
		if ($minimum_quantity > 1) {
			echo '<label for="quantity">Quantity <span class="price-tooltip-icon" data-tooltip="This product requires a minimum order of ' . esc_attr($minimum_quantity) . ' units">
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
					<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<circle cx="12" cy="17" r="1" fill="currentColor"/>
				</svg>
			</span></label>';
		} else {
			echo '<label for="quantity">Quantity</label>';
		}
		echo '
			<div class="quantity">
				<div class="number-button">
					<input type="button" value="-" class="minus" data-group-index="0">
					<input type="number" id="quantity" class="qty group-quantity" name="quantity" value="' . esc_attr($minimum_quantity) . '" min="' . esc_attr($minimum_quantity) . '" data-unit-price="' . esc_attr($unit_price) . '" data-group-index="0" aria-label="Product quantity" step="1" inputmode="numeric" autocomplete="off">
					<input type="button" value="+" class="plus" data-group-index="0">
				</div>
				<span class="group-unit-price">$' . esc_html($unit_price) . ' per unit</span>
			</div>
		</div>';
	}

	private function get_variation_field_options($field) {
			if (!empty($field['taxonomy'])) {
					// Attribute field: fetch terms only for current product
					$product_id = get_the_ID();
					$taxonomy = $field['taxonomy'];
					$terms = wc_get_product_terms($product_id, $taxonomy, [
						'fields'   => 'all',
						'orderby'  => 'menu_order', // hint WooCommerce
						'order'    => 'ASC',
					]);

					// Enforce ordering using saved term meta if needed
					if (!empty($terms) && is_array($terms)) {
						usort($terms, function($a, $b) use ($taxonomy) {
							$posA = get_term_meta($a->term_id, 'position', true);
							$posB = get_term_meta($b->term_id, 'position', true);
							$hasPosA = ($posA !== '' && $posA !== null);
							$hasPosB = ($posB !== '' && $posB !== null);

							if ($hasPosA && $hasPosB) {
								$pa = intval($posA); $pb = intval($posB);
								if ($pa === $pb) return 0;
								return ($pa < $pb) ? -1 : 1;
							}

							// Fallback to WooCommerce order_pa_{taxonomy}
							$orderKey = 'order_' . $taxonomy;
							$oa = get_term_meta($a->term_id, $orderKey, true);
							$ob = get_term_meta($b->term_id, $orderKey, true);
							$hasOA = ($oa !== '' && $oa !== null);
							$hasOB = ($ob !== '' && $ob !== null);
							if ($hasOA && $hasOB) {
								$ia = intval($oa); $ib = intval($ob);
								if ($ia === $ib) return 0;
								return ($ia < $ib) ? -1 : 1;
							}

							// Final fallback to natural name
							return strnatcasecmp($a->name, $b->name);
						});
					}

					return $terms;
			} else if (!empty($field['options'])) {
					// Meta field: return options sorted by their 'position' value
					$options = $field['options'];
					if (is_array($options)) {
						usort($options, function($a, $b) {
							$posA = is_array($a) ? ($a['position'] ?? null) : (is_object($a) ? ($a->position ?? null) : null);
							$posB = is_array($b) ? ($b['position'] ?? null) : (is_object($b) ? ($b->position ?? null) : null);

							if ($posA === null && $posB === null) {
								$nameA = is_array($a) ? ($a['name'] ?? ($a['label'] ?? '')) : (is_object($a) ? ($a->name ?? ($a->label ?? '')) : '');
								$nameB = is_array($b) ? ($b['name'] ?? ($b['label'] ?? '')) : (is_object($b) ? ($b->name ?? ($b->label ?? '')) : '');
								return strnatcasecmp((string) $nameA, (string) $nameB);
							}

							if ($posA === null) { return 1; }
							if ($posB === null) { return -1; }
							if ($posA == $posB) { return 0; }
							return ($posA < $posB) ? -1 : 1;
						});
					}
					return $options;
			}
			return [];
	}

	private function check_field_costs($field_type, $field = null, $terms = []) {
			$has_cost = false;

			// Check for costs based on field type
			if (in_array($field_type, [1, 3, 4, 5, 10])) {
					// For simple field types, check field's variationCost and variationUnitCost
					$variation_cost = floatval($field['variationCost'] ?? 0);
					$variation_unit_cost = floatval($field['variationUnitCost'] ?? 0);
					$has_cost = ($variation_cost > 0 || $variation_unit_cost > 0);
			} else if (in_array($field_type, [2, 6, 7, 9, 11])) {
					// For field types with options, check each option's costs
					foreach ($terms as $term) {
							$variation_cost = floatval(get_term_meta($term->term_id, 'variationCost', true) ?? 0);
							$variation_unit_cost = floatval(get_term_meta($term->term_id, 'variationUnitCost', true) ?? 0);
							if ($variation_cost > 0 || $variation_unit_cost > 0) {
									$has_cost = true;
									break;
							}
					}
			}

			return $has_cost;
	}

	private function cost_label_content($variation_unit_cost, $variation_cost) {
			$label = '';
			
			// Add unit cost if it exists
			if ($variation_unit_cost > 0) {
					$label .= ' + ( $' . number_format($variation_unit_cost, 2) . ' per unit )';
			}
			
			// Add fixed cost if it exists
			if ($variation_cost > 0) {
					$label .= ' + ( $' . number_format($variation_cost, 2) . ' once off )';
			}
			
			return $label;
	}

	private function get_default_option_value($field_id) {
		global $product;
		$product_id = $product->get_id();
		$merchi_product_data = get_post_meta($product_id, '_merchi_product_data', true);
		
		if (!empty($merchi_product_data['product'])) {
			$product_data = $merchi_product_data['product'];
			$fields_to_check = [];
			
			if (!empty($product_data['groupVariationFields'])) {
				$fields_to_check = array_merge($fields_to_check, $product_data['groupVariationFields']);
			}
			if (!empty($product_data['independentVariationFields'])) {
				$fields_to_check = array_merge($fields_to_check, $product_data['independentVariationFields']);
			}
			
			foreach ($fields_to_check as $field) {
				if ($field['id'] == $field_id && !empty($field['options'])) {
					foreach ($field['options'] as $option) {
						if (!empty($option['default'])) {
							return $option['value'];
						}
					}
				}
			}
		}
		return null;
	}

	private function render_attribute_field($field, $name_prefix, $is_group = false, $field_index = 0) {
			$terms = $this->get_variation_field_options($field);
			if (empty($terms)) return '';

			$slug = esc_attr($field['slug']);
			$label = esc_html($field['label']);
			$field_id = esc_html($field['fieldID']);
			$is_multiple = !empty($field['multipleSelect']);
			$field_type = intval($field['fieldType']);
			$field_name = $name_prefix . '.variations[' . $field_index . ']';

			// Get default option value from original JSON data
			$default_option_value = $this->get_default_option_value($field_id);

			// Check for costs using the new function
			$has_cost = $this->check_field_costs($field_type, $field, $terms);

			// Build options array for the variation field
			$options = array();
			foreach ($terms as $term) {
					$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
					$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
					$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
					$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
					$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
					$colour = get_term_meta($term->term_id, 'colour', true);
					
					$options[] = array(
							'id' => intval($variation_option_id),
							'value' => $term->name,
							'currency' => get_term_meta($term->term_id, 'currency', true) ?: 'AUD',
							'position' => get_term_meta($term->term_id, 'position', true) ?: '0',
							'variationCost' => $variation_cost,
							'variationUnitCost' => $variation_unit_cost,
							'colour' => $colour
					);
			}

			// Create variation field data object
			$variation_field_data = array(
					'id' => intval($field_id),
					'name' => $label,
					'position' => intval($field['position'] ?? 0),
					'required' => !empty($field['required']),
					'placeholder' => $field['placeholder'] ?? '',
					'fieldType' => $field_type,
					'sellerProductEditable' => !empty($field['sellerProductEditable']),
					'multipleSelect' => $is_multiple,
					'options' => $options,
					'instructions' => $field['instructions'] ?? '',
					'isHtml' => !empty($field['isHtml']),
			);

			// Encode variation field data for data attribute
			$variation_field_json = esc_attr(json_encode($variation_field_data));

			$html = '<div class="custom-field' . (!empty($field['required']) ? '" data-required="true"' : '"') . '>';

			// Add variation field data to all input elements
			$common_data_attrs = ' data-variation-field=\''.$variation_field_json.'\'';

			$instructions_markup = $this->variation_field_instructions_markup($field);

			// SELECT field type (2)
			if ($field_type === 2) {
					$html .= "<label for='{$slug}'>{$label}</label>";
					$html .= $instructions_markup;
					if ($is_multiple) {
							$html .= '<select multiple id="' . $slug . '" name="' . $field_name . '" ' . $common_data_attrs . ' data-calculate="' . ($has_cost ? 'true' : 'false') . '" class="select">';
							foreach ($terms as $term) {
									$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
									$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
									$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
									$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
									$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
									$html .= '<option value="' . esc_attr($variation_option_id) . '" data-variation-field-value="' . esc_attr($variation_option_id) . '">' 
											. esc_html($term->name) 
											. $this->cost_label_content($variation_unit_cost, $variation_cost)
											. '</option>';
							}
							$html .= '</select>';
					} else {
							$html .= '<select id="' . $slug . '" name="' . $field_name . '"' . $common_data_attrs . ' data-calculate="' . ($has_cost ? 'true' : 'false') . '" class="select">';
							foreach ($terms as $index => $term) {
									$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
									$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
									$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
									$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
									$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
									// Normalize whitespace for comparison
									$normalized_term_name = preg_replace('/\s+/', ' ', trim($term->name));
									$normalized_default_value = $default_option_value ? preg_replace('/\s+/', ' ', trim($default_option_value)) : '';
									$is_selected = (strtolower($normalized_term_name) === strtolower($normalized_default_value)) ? 'selected' : '';
									$html .= '<option value="' . esc_attr($variation_option_id) . '" ' . $is_selected . ' data-variation-field-value="' . esc_attr($variation_option_id) . '">' 
											. esc_html($term->name) 
											. $this->cost_label_content($variation_unit_cost, $variation_cost)
											. '</option>';
							}
							$html .= '</select>';
					}
		} 
		// CHECKBOX type (6)
		else if ($field_type === 6) {
			$html .= "<div class='field-label'>{$label}</div>";
				$html .= $instructions_markup;
				$html .= '<div class="checkbox-options-container">';
					foreach ($terms as $index => $term) {
							$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
							$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
							$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
							$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
							$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
							$checkbox_id = ($index === 0) ? $slug : $slug . '_' . $term->term_id;
							$html .= '<div class="checkbox-option">';
							$html .= '<label class="checkbox-label" for="' . $checkbox_id . '">';
							$html .= '<input type="checkbox" id="' . $checkbox_id . '" name="' . $field_name . '" value="' .esc_attr($variation_option_id) . '"' . $common_data_attrs . ' data-variation-field-value="' . esc_attr($variation_option_id) . '" data-variation-unit-cost="' . esc_attr($variation_unit_cost) . '" data-calculate="' . ($has_cost ? 'true' : 'false') . '" class="input-checkbox"/>';
							$html .= '<span class="option-label">' . esc_html($term->name) 
									. $this->cost_label_content($variation_unit_cost, $variation_cost)
									. '</span>';
							$html .= '</label>';
							$html .= '</div>';
					}
					$html .= '</div>';
		} 
		// RADIO type (7)
		else if ($field_type === 7) {
				$html .= "<div class='field-label'>{$label}</div>";
				$html .= $instructions_markup;
				$html .= '<div class="radio-options-container">';
					foreach ($terms as $index => $term) {
							$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
							$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
							$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
							$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
							$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
							// Normalize whitespace for comparison
							$normalized_term_name = preg_replace('/\s+/', ' ', trim($term->name));
							$normalized_default_value = $default_option_value ? preg_replace('/\s+/', ' ', trim($default_option_value)) : '';
							$is_checked = (strtolower($normalized_term_name) === strtolower($normalized_default_value)) ? 'checked' : '';
							$radio_id = ($index === 0) ? $slug : $slug . '_' . $index;
							$html .= '<div class="radio-option">';
							$html .= '<label class="radio-label" for="' . $radio_id . '">';
							$html .= '<input type="radio" id="' . $radio_id . '" name="' . $field_name . '" value="' . esc_attr($variation_option_id) . '" ' . $is_checked . $common_data_attrs . ' data-variation-field-value="' . esc_attr($variation_option_id) . '" data-variation-unit-cost="' . esc_attr($variation_unit_cost) . '" data-calculate="' . ($has_cost ? 'true' : 'false') . '" class="input-radio" />';
							$html .= '<span class="option-label">' . esc_html($term->name) 
									. $this->cost_label_content($variation_unit_cost, $variation_cost)
									. '</span>';
							$html .= '</label>';
							$html .= '</div>';
					}
					$html .= '</div>';
		}
		// IMAGE_SELECT type (9)
		else if ($field_type === 9) {
				$label_group_index = $is_group ? '0' : 'false';
				$html .= "<div class='field-label' data-group-index='{$label_group_index}' data-update-label='true' data-variation-field-id='{$field_id}'>{$label}</div>";
				$html .= $instructions_markup;
				$is_multiple = !empty($field['multipleSelect']);
					$input_type = $is_multiple ? 'checkbox' : 'radio';
					$html .= '<div class="group-variation-container" name="job.variationsGroups[0].variations[1]"' . $common_data_attrs . '>';
					$html .= '<div class="image-select-options-container">';
					foreach ($terms as $index => $term) {
							$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
							$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
							$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
							$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
							$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
							// Get image URL from term meta
							$image_url = get_term_meta($term->term_id, 'linkedFile.viewUrl', true);
							if (!$image_url) {
									$image_url = get_term_meta($term->term_id, 'linkedFile_viewUrl', true);
							}
							if (!$image_url) {
									$image_url = get_term_meta($term->term_id, 'linkedFileViewUrl', true);
							}
							$html .= '<div class="image-select-option">';
							$normalized_term_name = preg_replace('/\s+/', ' ', trim($term->name));
							$normalized_default_value = $default_option_value ? preg_replace('/\s+/', ' ', trim($default_option_value)) : '';
							$is_match = (strtolower($normalized_term_name) === strtolower($normalized_default_value));
							$will_be_checked = ($is_match && !$is_multiple);
							$image_id = ($index === 0) ? $slug : $slug . '_' . $term->term_id;
							
							$html .= '<input type="' . $input_type . '" 
													id="' . $image_id . '"
													name="' . $field_name . '" 
													value="' . esc_attr($variation_option_id) . '"' . 
													$common_data_attrs . ' 
													data-variation-field-value="' . esc_attr($variation_option_id) . '"
													data-variation-unit-cost="' . esc_attr($variation_unit_cost) . '"
													data-update-label="true"
													data-calculate="' . ($has_cost ? 'true' : 'false') . '"
													data-field-type="image-select"
													' . ($will_be_checked ? 'checked' : '') . ' />';
							$html .= '<label class="image-select-label" for="' . $image_id . '">';
							$html .= '<span class="image-select-checkmark"></span>';
							if ($image_url) {
									$html .= '<img src="' . esc_url($image_url) . '" alt="' . esc_attr($term->name) . '" />';
							}
							$html .= '<span class="option-label">' . esc_html($term->name) . '</span>';
							$html .= '</label>';
							$html .= '</div>';
					}
					$html .= '</div>';
					$html .= '</div>';
		}
		// COLOUR_SELECT type (11)
		else if ($field_type === 11) {
				$label_group_index = $is_group ? '0' : 'false';
				$html .= "<div class='field-label' data-group-index='{$label_group_index}' data-update-label='true' data-variation-field-id='{$field_id}'>{$label}</div>";
				$html .= $instructions_markup;
				$is_multiple = !empty($field['multipleSelect']);
					$input_type = $is_multiple ? 'checkbox' : 'radio';
					$html .= '<div class="color-options-grid">';
					foreach ($terms as $index => $term) {
							$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
							// Normalize whitespace for comparison
							$normalized_term_name = preg_replace('/\s+/', ' ', trim($term->name));
							$normalized_default_value = $default_option_value ? preg_replace('/\s+/', ' ', trim($default_option_value)) : '';
							$is_checked = (strtolower($normalized_term_name) === strtolower($normalized_default_value)) ? 'checked' : '';
							$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
							$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
							$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
							$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
							$color = get_term_meta($term->term_id, 'colour', true);
							$color_id = ($index === 0) ? $slug : $slug . '_' . $index;
							$html .= '<label class="color-option" for="' . $color_id . '" data-full-name="' . esc_attr($term->name) . '">';
							$html .= '<input type="' . $input_type . '" id="' . $color_id . '" name="' . $field_name . '" value="' . esc_attr($variation_option_id) . '" ' . ($is_multiple ? '' : $is_checked) . $common_data_attrs . ' data-variation-field-value="' . esc_attr($variation_option_id) . '" data-variation-unit-cost="' . esc_attr($variation_unit_cost) . '" data-calculate="' . ($has_cost ? 'true' : 'false') . '" data-field-type="colour-select"/>';
							$html .= '<div class="color-option-inner">';
							$html .= '<span class="color-indicator" style="background-color: ' . esc_attr($color) . ';"></span>';
							$html .= '<span class="checkmark">✓</span>';
							$html .= '</div>';
							$html .= '<span class="color-name">' . esc_html($term->name) . '</span>';
							$html .= '</label>';
					}
					$html .= '</div>';
			}

			$html .= '</div>';
			return $html;
	}

	private function parse_draft_js_instruction_text( $instructions_raw ) {
		if ( ! is_string( $instructions_raw ) || $instructions_raw === '' ) {
			return '';
		}
		$parsed = json_decode( $instructions_raw, true );
		if ( ! is_array( $parsed ) || empty( $parsed['blocks'] ) || ! is_array( $parsed['blocks'] ) ) {
			return (string) $instructions_raw;
		}
		$lines = array();
		foreach ( $parsed['blocks'] as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}
			$text = isset( $block['text'] ) ? trim( (string) $block['text'] ) : '';
			if ( $text !== '' ) {
				$lines[] = $text;
			}
		}
		return implode( "\n", $lines );
	}

	/**
	 * Markup for variation field instructions (below title, above inputs).
	 *
	 * @param array $field Template field (attribute or meta).
	 */
	private function variation_field_instructions_markup( array $field ) {
		$raw = $field['instructions'] ?? '';
		if ( $raw === '' || $raw === null ) {
			return '';
		}
		$is_html = ! empty( $field['isHtml'] );
		if ( $is_html ) {
			$inner = $this->sanitize_instruction_html( (string) $raw );
		} else {
			$inner = nl2br( esc_html( $this->parse_draft_js_instruction_text( (string) $raw ) ) );
		}
		if ( $inner === '' ) {
			return '';
		}
		$wrapper = $is_html ? 'div' : 'p';
		return '<' . $wrapper . " class='field-instructions'>" . $inner . '</' . $wrapper . '>';
	}

	private function sanitize_instruction_html($html) {
		$allowed_tags = array(
			'h1' => array('class' => array(), 'id' => array()),
			'h2' => array('class' => array(), 'id' => array()),
			'h3' => array('class' => array(), 'id' => array()),
			'h4' => array('class' => array(), 'id' => array()),
			'h5' => array('class' => array(), 'id' => array()),
			'h6' => array('class' => array(), 'id' => array()),
			'p' => array('class' => array(), 'id' => array()),
			'br' => array(),
			'strong' => array('class' => array()),
			'b' => array('class' => array()),
			'em' => array('class' => array()),
			'i' => array('class' => array()),
			'u' => array('class' => array()),
			'ul' => array('class' => array()),
			'ol' => array('class' => array()),
			'li' => array('class' => array()),
			'span' => array('class' => array()),
			'div' => array('class' => array()),
			'a' => array('href' => array(), 'class' => array(), 'title' => array(), 'target' => array(), 'rel' => array()),
			'blockquote' => array('class' => array()),
			'code' => array('class' => array()),
			'pre' => array('class' => array()),
		);
		return wp_kses($html, $allowed_tags);
	}

	public function render_meta_field($field, $name_prefix, $field_index = null) {
		$slug = esc_attr($field['slug']);
		$fieldType = intval($field['fieldType']);
		$field_id = esc_html($field['fieldID']);
		$placeholder = esc_attr($field['placeholder'] ?? '');
		$is_html = !empty($field['isHtml']);
		
		$label = $is_html ? $this->sanitize_instruction_html($field['label'] ?? '') : esc_html($field['label'] ?? '');
		$instructions = $is_html ? $this->sanitize_instruction_html($field['instructions'] ?? '') : esc_html($field['instructions'] ?? '');
		
		$required = !empty($field['required']) ? 'required' : '';

		// Check for costs using the new function
		$has_cost = $this->check_field_costs($fieldType, $field);

		// Build $variation_field_data and $variation_field_json for meta fields
		$variation_field_data = array(
			'id' => intval($field_id),
			'name' => $label,
			'position' => intval($field['position'] ?? 0),
			'required' => !empty($field['required']),
			'placeholder' => $placeholder,
			'fieldType' => $fieldType,
			'sellerProductEditable' => !empty($field['sellerProductEditable']),
			'multipleSelect' => !empty($field['multipleSelect']),
			'options' => $this->get_variation_field_options($field),
			'instructions' => $field['instructions'] ?? '',
			'isHtml' => $is_html
		);
		$variation_field_json = esc_attr(json_encode($variation_field_data));
		$variation_unit_cost = $field['variationUnitCost'] ?? 0;
		$variation_cost = $field['variationCost'] ?? 0;

		$class_attr = 'custom-field';
		
		if ($slug === 'delivery_options_do_not') {
			$class_attr .= ' delivery-description-field';
		}
		
		// Add required attribute if needed
		$required_attr = !empty($field['required']) ? ' data-required="true"' : '';
		
		$html = '<div class="' . $class_attr . '"' . $required_attr . '>';
		// Only add for attribute if it's not an instruction field (case 8)
		if ($fieldType !== 8) {
			$html .= "<label for='{$slug}'>{$label} {$this->cost_label_content($variation_unit_cost, $variation_cost)}</label>";
			$html .= $this->variation_field_instructions_markup( $field );
		} else {
			$html .= "<div class='field-label'>{$label} {$this->cost_label_content($variation_unit_cost, $variation_cost)}</div>";
		}
		$field_name = $name_prefix . '.variations[' . $field_index . ']';

		// Use get_variation_field_options for meta fields with options
		$options = $this->get_variation_field_options($field);
		if (!empty($options)) {
			// Render as select dropdown for meta fields with options
			$html .= "<select id='{$slug}' name='{$field_name}' {$required} data-variation-field='{$variation_field_json}'>";
			foreach ($options as $option) {
				// Option can be array or string
				if (is_array($option)) {
					$value = esc_attr($option['value'] ?? $option['id'] ?? '');
					$label = esc_html($option['label'] ?? $option['value'] ?? $option['id'] ?? '');
					$is_selected = !empty($option['default']) ? 'selected' : '';
				} else {
					$value = esc_attr($option);
					$label = esc_html($option);
					$is_selected = '';
				}
				$html .= "<option value='{$value}' {$is_selected}>{$label}</option>";
			}
			$html .= "</select>";
		} else {
			switch ($fieldType) {
				case 1: $html .= "<input type='text' id='{$slug}' name='{$field_name}' placeholder='{$placeholder}' {$required} data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "' class='input-text'/>"; break;
				case 3: $html .= "<label class='custom-upload-wrapper' for='{$slug}'><div class='upload-icon'>📎</div><div class='upload-instruction'>Drop file here or click to browse</div><div class='upload-types'>.jpeg, .jpg, .gif, .png, .pdf</div><input type='file' id='{$slug}' name='{$field_name}' multiple {$required} accept='.jpeg,.jpg,.gif,.png,.pdf' data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "' class='input-file'/></label>"; break;
				case 4: $html .= "<textarea id='{$slug}' name='{$field_name}' placeholder='{$placeholder}' {$required} data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "' class='input-textarea'></textarea>"; break;
				case 5: $html .= "<input type='number' id='{$slug}' name='{$field_name}' placeholder='{$placeholder}' {$required} data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "' class='input-number'/>"; break;
				case 10: $html .= "<input type='color' id='{$slug}' name='{$field_name}' {$required} data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "' class='input-color'/>"; break;
				case 8: 
					$wrapper = $is_html ? 'div' : 'p';
					$html .= "<{$wrapper} class='field-instructions' data-variation-field='{$variation_field_json}'>{$instructions}</{$wrapper}>";
					break;
				default: $html .= "<input type='text' id='{$slug}' name='{$field_name}' placeholder='{$placeholder}' {$required} data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "' class='input-text'/>"; break;
			}
		}

		$html .= '</div>';
		return $html;
	}

	public function display_total_price() {
		echo '<div class="price-display-container">';
		echo '<div class="price-label">Total Price:</div>';
		echo '<div class="price-amount"><span class="loading-spinner"></span>Calculating...</div>';
		echo '</div>';
	}

	public function remove_product_content() {
		remove_action( 'woocommerce_after_single_product_summary', 'woocommerce_output_related_products', 20 );
		//remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_title', 5 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_rating', 10 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_price', 10 );
		//remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_excerpt', 20 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_sharing', 50 );
		//remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
		//remove_action( 'woocommerce_simple_add_to_cart', 'woocommerce_simple_add_to_cart', 30 );
		remove_action( 'woocommerce_grouped_add_to_cart', 'woocommerce_grouped_add_to_cart', 30 );
		remove_action( 'woocommerce_variable_add_to_cart', 'woocommerce_variable_add_to_cart', 30 );
		remove_action( 'woocommerce_external_add_to_cart', 'woocommerce_external_add_to_cart', 30 );
		remove_action( 'woocommerce_single_variation', 'woocommerce_single_variation', 10 );
		remove_action( 'woocommerce_single_variation', 'woocommerce_single_variation_add_to_cart_button', 20 );
	}

	public function remove_quantity_field($args, $product) {
		$product_id = $product->get_id();
		$group_fields_template = get_post_meta($product_id, '_group_variation_field_template', true);

		// If there are group variation fields, hide the quantity field
		if (!empty($group_fields_template)) {
			$args['min_value'] = 1;
			$args['max_value'] = 1;
			$args['input_value'] = 1;
			$args['style'] = 'display: none;';
			$args['class'] = 'product-quantity';
		}
		return $args;
	}

	/**
	 * Add loading spinner to add to cart button
	 */
	public function add_loading_spinner_to_button($button_html, $product) {
		// Add loading spinner span
		$spinner = '<span class="loading-spinner"></span>';
		
		// Insert spinner before the button text
		$button_html = str_replace('>', '>' . $spinner, $button_html);
		
		// Add product-button-add-to-cart class if not present
		if (strpos($button_html, 'product-button-add-to-cart') === false) {
			$button_html = str_replace('class="', 'class="product-button-add-to-cart ', $button_html);
		}
		
		return $button_html;
	}

	public function display_buy_now_button() {
		global $product;

		$product_id = get_the_ID();
		$merchi_product_id = get_post_meta($product_id, 'product_id', true);
		$allow_payment_upfront = get_post_meta($product_id, 'allowPaymentUpfront', true);

		if (!$merchi_product_id || !$allow_payment_upfront) {
			return;
		}

		// Add the Buy Now button between Add to Cart and Get Quote
		echo '<button type="button" ' .
			'class="button wp-element-button single_buy_now_button" ' .
			'id="buy-now-button">' .
			'Buy Now' .
			'</button>';
	}

	public function display_quote_button() {
		global $product;

		$product_id = get_the_ID();
		$merchi_product_id = get_post_meta($product_id, 'product_id', true);
		$allow_quotation = get_post_meta($product_id, 'allowQuotation', true);

		if (!$merchi_product_id || !$allow_quotation) {
			return;
		}

		// Add the Get Quote button in the same line as Add to Cart
		echo '<button type="button" ' .
			'class="button wp-element-button single_get_quote_button" ' .
			'id="get-quote-button">' .
			'Get quote' .
			'</button>';
	}
}
