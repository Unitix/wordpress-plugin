<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin\PublicPages;

use \MerchiPlugin\Base\BaseController;

class ProductPage extends BaseController {


	public function register() {
		add_action('woocommerce_before_add_to_cart_button', [ $this, 'custom_display_grouped_attributes' ], 10 );
		add_action('woocommerce_before_add_to_cart_button', [ $this, 'custom_display_independent_attributes' ], 20 );
		add_action('woocommerce_before_add_to_cart_button', [ $this, 'display_total_price' ], 30 );
		add_action('woocommerce_after_add_to_cart_button', [ $this, 'display_quote_button' ], 10 );
		add_action( 'wp', [ $this, 'remove_product_content' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_merchi_scripts' ] );
		add_filter( 'woocommerce_quantity_input_args', [ $this, 'remove_quantity_field' ], 10, 2 );
		add_filter( 'woocommerce_loop_add_to_cart_link', [ $this, 'add_loading_spinner_to_button' ], 10, 2 );
		add_filter( 'woocommerce_single_add_to_cart_button', [ $this, 'add_loading_spinner_to_button' ], 10, 2 );
		
		// Register REST API endpoint
		add_action('rest_api_init', function () {
			register_rest_route('merchi/v1', '/price-estimate', array(
				'methods' => 'POST',
				'callback' => [ $this, 'proxy_price_estimate' ],
				'permission_callback' => '__return_true', // Make endpoint public
				'args' => array(
					'product_id' => array(
						'required' => true,
						'type' => 'string',
						'sanitize_callback' => 'sanitize_text_field'
					)
				)
			));
		});

		// Add CORS headers for REST API
		add_action('rest_api_init', function() {
			remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
			add_filter('rest_pre_serve_request', function($value) {
				header('Access-Control-Allow-Origin: *');
				header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
				header('Access-Control-Allow-Credentials: true');
				header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
				return $value;
			});
		});
	}

	public function enqueue_merchi_scripts() {
		if (is_product()) {
			wp_enqueue_script(
				'merchi_sdk',
				plugin_dir_url(dirname(dirname(__FILE__))) . 'dist/js/merchi_sdk.js',
				array(),
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

			// Get the correct configuration based on staging mode
			$staging_mode = get_option('merchi_staging_mode');
			$merchi_domain = $staging_mode === 'yes' ? get_option('staging_merchi_url') : get_option('merchi_url');
			$merchi_secret = $staging_mode === 'yes' ? get_option('staging_merchi_api_secret') : get_option('merchi_api_secret');
			$merchi_url = $staging_mode === 'yes' ? 'https://api.staging.merchi.co/' : 'https://api.merchi.co/';

			// Debug logging
			error_log('Merchi Configuration:');
			error_log('Environment: ' . ($staging_mode === 'yes' ? 'Staging' : 'Production'));
			error_log('API URL: ' . $merchi_url);
			error_log('Domain ID: ' . $merchi_domain);
			error_log('Product ID: ' . get_post_meta(get_the_ID(), 'product_id', true));

			// Add Merchi configuration data
			wp_localize_script('merchi_product_form', 'merchiConfig', array(
				'domainId' => $merchi_domain,
				'apiUrl' => $merchi_url,
				'productId' => get_post_meta(get_the_ID(), 'product_id', true),
				'stagingMode' => $staging_mode === 'yes',
				'backendUri' => $merchi_url
			));

			// Verify configuration
			if (empty($merchi_secret)) {
				error_log('Warning: Merchi API Secret is empty');
			}
			if (empty($merchi_domain)) {
				error_log('Warning: Merchi Domain ID is empty');
			}
			if (empty(get_post_meta(get_the_ID(), 'product_id', true))) {
				error_log('Warning: Merchi Product ID is empty');
			}

			// Add SDK initialization script
			$sdk_init_script = sprintf(
				'<script>
					document.addEventListener("DOMContentLoaded", function() {
						// Only initialize if SDK is not already initialized
						if (typeof merchi !== "undefined" && !merchi.isInitialized) {
							// const sdkConfig = {
							// 	backendUri: "%s",
							// 	hasSessionToken: false,
							// 	hasRequiredMethods: true
							// };
							
							// Initialize SDK
							// merchi.init(sdkConfig);
						}

						// Expose initializeCheckout for the Get Quote button
						if (typeof merchiCheckoutInit !== "undefined" && typeof merchiCheckoutInit.initializeCheckout === "function") {
							window.initializeCheckout = merchiCheckoutInit.initializeCheckout;
						}
					});
				</script>',
				esc_js($merchi_url)
			);

			// Add the SDK initialization script
			add_action('wp_footer', function() use ($sdk_init_script) {
				echo $sdk_init_script;
			});
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

    echo '<div class="custom-variation-options merchi_product_form">';

    foreach ($fields as $field) {
        if ($field['type'] === 'attribute') {
            echo $this->render_attribute_field($field, 'custom_fields');
        } else {
            echo $this->render_meta_field($field, 'custom_fields');
        }
    }

    echo '</div>';

    // Add the checkout container
    echo '<div id="merchi-checkout-container"></div>';
	}

	public function custom_display_grouped_attributes() {
		global $product;

		$product_id = $product->get_id();
		$group_fields_template = get_post_meta($product_id, '_group_variation_field_template', true);
		$unit_price = $product->get_price() ?: '0';

		if (empty($group_fields_template)) return;

		// Sort group fields by position before rendering
		usort($group_fields_template, function($a, $b) {
			return ($a['position'] ?? 0) <=> ($b['position'] ?? 0);
		});

		echo '<div id="grouped-fields-container" class="merchi_product_form">';
		echo '<h3>Grouped Options</h3>';

		echo '<div class="group-field-set" data-group-index="1">';
		echo '<h4>Group <span class="group-number">1</span></h4>';
		
		// Add group quantity field inside the group container
		echo '<div class="custom-field">';
		echo '<label>Group (1) quantity ($' . number_format((float)$unit_price, 2) . ' unit price)</label>';
		echo '<input type="number" class="group-quantity" name="group_fields[1][quantity]" value="1" min="1" data-unit-price="' . esc_attr($unit_price) . '" data-group-index="1">';
		echo '</div>';

		foreach ($group_fields_template as $field) {
			if ($field['type'] === 'attribute') {
				echo $this->render_attribute_field($field, "group_fields[1]", true);
			} else {
				echo $this->render_meta_field($field, "group_fields[1]");
			}
		}
		echo '<div class="group-cost-display" data-group-index="1"></div>';
		echo '<button type="button" class="delete-group-button" style="display: none;">Delete Group</button>';
		echo '</div>';

		echo '</div>';

		// Add Group button container
		echo '<div class="merchi-buttons-container">';
		echo '<button type="button" class="add-group-button">+ New Group</button>';
		echo '</div>';
	}


	private function get_variation_field_options($field) {
			if (!empty($field['taxonomy'])) {
					// Attribute field: fetch terms from taxonomy
					return get_terms([
							'taxonomy' => $field['taxonomy'],
							'hide_empty' => false
					]);
			} else if (!empty($field['options'])) {
					// Meta field: return options array if present (customize as needed)
					return $field['options'];
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

	private function render_attribute_field($field, $name_prefix, $is_group = false) {
			$terms = $this->get_variation_field_options($field);
			if (empty($terms)) return '';

			$slug = esc_attr($field['slug']);
			$label = esc_html($field['label']);
			$field_id = esc_html($field['fieldID']);
			$is_multiple = !empty($field['multipleSelect']);
			$field_type = intval($field['fieldType']);

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
					'options' => $options
			);

			// Encode variation field data for data attribute
			$variation_field_json = esc_attr(json_encode($variation_field_data));

			$html = '<div class="custom-field">';

			// Add variation field data to all input elements
			$common_data_attrs = ' data-variation-field=\''.$variation_field_json.'\'';

			// SELECT field type (2)
			if ($field_type === 2) {
					$html .= "<label for='{$slug}'>{$label}</label>";
					if ($is_multiple) {
							$html .= '<select multiple name="' . $name_prefix . '[' . $slug . '][]"' . $common_data_attrs . ' data-calculate="' . ($has_cost ? 'true' : 'false') . '">';
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
							$html .= '<select name="' . $name_prefix . '[' . $slug . ']"' . $common_data_attrs . ' data-calculate="' . ($has_cost ? 'true' : 'false') . '">';
							foreach ($terms as $index => $term) {
									$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
									$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
									$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
									$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
									$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
									$is_selected = $index === 0 ? 'selected' : '';
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
				$html .= "<label for='{$slug}'>{$label}</label>";
					$html .= '<div class="checkbox-options-container">';
					foreach ($terms as $term) {
							$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
							$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
							$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
							$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
							$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
							$html .= '<div class="checkbox-option">';
							$html .= '<label class="checkbox-label">';
							$html .= '<input type="checkbox" name="' . $name_prefix . '[' . $slug . '][]" value="' .esc_attr($variation_option_id) . '"' . $common_data_attrs . ' data-variation-field-value="' . esc_attr($variation_option_id) . '" data-variation-unit-cost="' . esc_attr($variation_unit_cost) . '" data-calculate="' . ($has_cost ? 'true' : 'false') . '"/>';
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
					$html .= "<label for='{$slug}'>{$label}</label>";
					$html .= '<div class="radio-options-container">';
					foreach ($terms as $index => $term) {
							$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
							$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
							$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
							$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
							$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
							$is_checked = $index === 0 ? 'checked' : '';
							$html .= '<div class="radio-option">';
							$html .= '<label class="radio-label">';
							$html .= '<input type="radio" name="' . $name_prefix . '[' . $slug . ']" value="' . esc_attr($variation_option_id) . '" ' . $is_checked . $common_data_attrs . ' data-variation-field-value="' . esc_attr($variation_option_id) . '" data-variation-unit-cost="' . esc_attr($variation_unit_cost) . '" data-calculate="' . ($has_cost ? 'true' : 'false') . '" />';
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
					$html .= "<label for='{$slug}' data-group-index='{$label_group_index}' data-update-label='true' data-variation-field-id='{$field_id}'>{$label}</label>";
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
							$html .= '<input type="' . $input_type . '" 
													name="' . $name_prefix . '[' . $slug . ']' . ($is_multiple ? '[]' : '') . '" 
													value="' . esc_attr($variation_option_id) . '"' . 
													$common_data_attrs . ' 
													data-variation-field-value="' . esc_attr($variation_option_id) . '"
													data-variation-unit-cost="' . esc_attr($variation_unit_cost) . '"
													data-update-label="true"
													data-calculate="' . ($has_cost ? 'true' : 'false') . '"
													' . ($index === 0 && !$is_multiple ? 'checked' : '') . ' />';
							$html .= '<label class="image-select-label">';
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
					$html .= "<label for='{$slug}' data-group-index='{$label_group_index}' data-update-label='true' data-variation-field-id='{$field_id}'>{$label}</label>";
					$is_multiple = !empty($field['multipleSelect']);
					$input_type = $is_multiple ? 'checkbox' : 'radio';
					$html .= '<div class="color-options-grid">';
					foreach ($terms as $index => $term) {
							$is_checked = $index === 0 ? 'checked' : '';
							$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
							$variation_unit_cost = get_term_meta($term->term_id, 'variationUnitCost', true);
							$variation_unit_cost = is_numeric($variation_unit_cost) ? floatval($variation_unit_cost) : 0.0;
							$variation_cost = get_term_meta($term->term_id, 'variationCost', true);
							$variation_cost = is_numeric($variation_cost) ? floatval($variation_cost) : 0.0;
							$color = get_term_meta($term->term_id, 'colour', true);
							$input_name = $name_prefix . '[' . $slug . ']' . ($is_multiple ? '[]' : '');
							$html .= '<label class="color-option">';
							$html .= '<input type="' . $input_type . '" name="' . $input_name . '" value="' . esc_attr($variation_option_id) . '" ' . ($is_multiple ? '' : $is_checked) . $common_data_attrs . ' data-variation-field-value="' . esc_attr($variation_option_id) . '" data-variation-unit-cost="' . esc_attr($variation_unit_cost) . '" data-calculate="' . ($has_cost ? 'true' : 'false') . '"/>';
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

	public function render_meta_field($field, $name_prefix) {
		$slug = esc_attr($field['slug']);
		$label = esc_html($field['label']);
		$fieldType = intval($field['fieldType']);
		$field_id = esc_html($field['fieldID']);
		$placeholder = esc_attr($field['placeholder'] ?? '');
		$instructions = esc_html($field['instructions'] ?? '');
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
			'options' => $this->get_variation_field_options($field)
		);
		$variation_field_json = esc_attr(json_encode($variation_field_data));
		$variation_unit_cost = $field['variationUnitCost'] ?? 0;
		$variation_cost = $field['variationCost'] ?? 0;

		$html = '<div class="custom-field">';
		$html .= "<label for='{$slug}'>{$label} {$this->cost_label_content($variation_unit_cost, $variation_cost)}</label>";

		// Use get_variation_field_options for meta fields with options
		$options = $this->get_variation_field_options($field);
		if (!empty($options)) {
			// Render as select dropdown for meta fields with options
			$html .= "<select name='{$name_prefix}[{$slug}]' {$required} data-variation-field='{$variation_field_json}'>";
			foreach ($options as $option) {
				// Option can be array or string
				if (is_array($option)) {
					$value = esc_attr($option['value'] ?? $option['id'] ?? '');
					$label = esc_html($option['label'] ?? $option['value'] ?? $option['id'] ?? '');
				} else {
					$value = esc_attr($option);
					$label = esc_html($option);
				}
				$html .= "<option value='{$value}'>{$label}</option>";
			}
			$html .= "</select>";
		} else {
			switch ($fieldType) {
				case 1: $html .= "<input type='text' name='{$name_prefix}[{$slug}]' placeholder='{$placeholder}' {$required} data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "' />"; break;
				case 3: $html .= "<label class='custom-upload-wrapper'><div class='upload-icon'>📎</div><div class='upload-instruction'>Drop file here or click to browse</div><div class='upload-types'>.jpeg, .jpg, .gif, .png, .pdf</div><input type='file' name='{$name_prefix}[{$slug}][]' multiple {$required} accept='.jpeg,.jpg,.gif,.png,.pdf' data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "'/></label>"; break;
				case 4: $html .= "<textarea name='{$name_prefix}[{$slug}]' placeholder='{$placeholder}' {$required} data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "'></textarea>"; break;
				case 5: $html .= "<input type='number' name='{$name_prefix}[{$slug}]' placeholder='{$placeholder}' {$required} data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "' />"; break;
				case 10: $html .= "<input type='color' name='{$name_prefix}[{$slug}]' {$required} data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "' />"; break;
				case 8: $html .= "<p class='field-instructions'>{$instructions}</p>"; break;
				default: $html .= "<input type='text' name='{$name_prefix}[{$slug}]' placeholder='{$placeholder}' {$required} data-variation-field='{$variation_field_json}' data-calculate='" . ($has_cost ? 'true' : 'false') . "' />"; break;
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

	public function proxy_price_estimate($request) {
		// Get the request body
		$body = $request->get_json_params();
		
		// Get Merchi configuration
		$staging_mode = get_option('merchi_staging_mode');
		$merchi_url = $staging_mode === 'yes' ? 'https://api.staging.merchi.co/' : 'https://api.merchi.co/';
		$merchi_secret = $staging_mode === 'yes' ? get_option('staging_merchi_api_secret') : get_option('merchi_api_secret');
		$merchi_domain = $staging_mode === 'yes' ? get_option('staging_merchi_url') : get_option('merchi_url');

		// Get product ID from request body or query params
		$product_id = $body['product_id'] ?? $request->get_param('product_id');
		if (!$product_id) {
			return new WP_Error('missing_product_id', 'Product ID is required', array('status' => 400));
		}

		// Add SDK logging script
		$sdk_log_script = sprintf(
			'<script>
				// Log SDK initialization
				console.log("Setting backendUri to:", "%s");
				
				const sdkConfig = {
					backendUri: "%s",
					hasSessionToken: false,
					hasRequiredMethods: true
				};
				
				console.log("Merchi SDK initialized with config:", sdkConfig);
				
				// Log API request details
				console.group("Merchi API Request");
				console.log("Product ID:", "%s");
				console.log("Domain ID:", "%s");
				console.log("Staging Mode:", %s);
			</script>',
			esc_js($merchi_url),
			esc_js($merchi_url),
			esc_js($product_id),
			esc_js($merchi_domain),
			$staging_mode === 'yes' ? 'true' : 'false'
		);

		// First, get the product details using the SDK approach
		$product_api_url = $merchi_url . 'v6/products/' . $product_id . '/?skip_rights=y';
		$product_response = wp_remote_get($product_api_url, array(
			'headers' => array(
				'Content-Type' => 'application/json',
				'Authorization' => 'ApiKey ' . $merchi_secret,
				'X-Domain-Id' => $merchi_domain,
				'Accept' => 'application/json'
			),
			'timeout' => 30,
			'sslverify' => !$staging_mode
		));

		if (is_wp_error($product_response)) {
			return new WP_Error('product_fetch_error', $product_response->get_error_message(), array('status' => 500));
		}

		$product_data = json_decode(wp_remote_retrieve_body($product_response), true);
		if (!isset($product_data['product'])) {
			return new WP_Error('no_product_data', 'No product data found in response', array('status' => 500));
		}

		// Prepare the request body using the SDK's defaultJob structure
		$request_body = array(
			'job' => array(
				'domain' => array('id' => $merchi_domain),
				'product' => array(
					'id' => $product_id,
					'groupVariationFields' => $product_data['product']['groupVariationFields'] ?? [],
					'independentVariationFields' => $product_data['product']['independentVariationFields'] ?? []
				),
				'variations' => array(),
				'variationsGroups' => array(),
				'jobType' => 1,
				'currency' => 'AUD',
				'costPerUnit' => $product_data['product']['unitPrice'] ?? 0,
				'limitedStock' => true,
				'inventoriesStatus' => 3,
				'inventoryCount' => 0,
				'inventorySufficient' => false,
				'items' => array(),
				'needsGroupBuy' => false,
				'needsInventory' => false,
				'needsSupplyChainRequest' => false
			)
		);

		// Merge with any existing body data
		if (isset($body['job'])) {
			$request_body['job'] = array_merge($request_body['job'], $body['job']);
		}

		// Define embed parameters matching the SDK structure
		$embed = array(
			'component' => new stdClass(),
			'defaultJob' => new stdClass(),
			'domain' => array(
				'activeTheme' => array('mainCss' => new stdClass()),
				'logo' => new stdClass()
			),
			'draftTemplates' => array('file' => new stdClass()),
			'groupBuyStatus' => new stdClass(),
			'groupVariationFields' => array(
				'options' => array(
					'linkedFile' => new stdClass()
				)
			),
			'images' => new stdClass(),
			'independentVariationFields' => array(
				'options' => array(
					'linkedFile' => new stdClass()
				)
			),
			'publicFiles' => new stdClass(),
			'variations' => array(),
			'variationsGroups' => array()
		);

		// Encode embed parameters
		$embed_json = json_encode($embed);
		$embed_encoded = urlencode($embed_json);

		// Construct Merchi API URL with embed parameters
		$merchi_api_url = $merchi_url . 'v6/specialised-order-estimate/?skip_rights=y&product_id=' . $product_id . '&embed=' . $embed_encoded;

		// Make request to Merchi API
		$response = wp_remote_post($merchi_api_url, array(
			'headers' => array(
				'Content-Type' => 'application/json',
				'Authorization' => 'ApiKey ' . $merchi_secret,
				'X-Domain-Id' => $merchi_domain,
				'Accept' => 'application/json'
			),
			'body' => json_encode($request_body),
			'timeout' => 30,
			'sslverify' => !$staging_mode
		));

		// Check for wp_remote_post errors
		if (is_wp_error($response)) {
			return new WP_Error('merchi_api_error', $response->get_error_message(), array('status' => 500));
		}

		// Get response data
		$response_code = wp_remote_retrieve_response_code($response);
		$response_body = wp_remote_retrieve_body($response);
		
		// Parse response body
		$data = json_decode($response_body, true);

		// Add SDK logging script to response
		$data['_sdk_log_script'] = $sdk_log_script;

		// Handle non-200 responses
		if ($response_code !== 200) {
			return new WP_Error(
				'merchi_api_error',
				'Merchi API returned error: ' . $response_code,
				array('status' => $response_code)
			);
		}

		// Parse and return response
		if (json_last_error() !== JSON_ERROR_NONE) {
			return new WP_Error('json_decode_error', 'Failed to decode API response', array('status' => 500));
		}

		return new WP_REST_Response($data, 200);
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

	public function display_quote_button() {
		global $product;
		
		// Only run on product pages
		if (!is_product()) {
			return;
		}
		
		$product_id = get_the_ID();
		$merchi_product_id = get_post_meta($product_id, 'product_id', true);
		
		if (!$merchi_product_id) {
			return;
		}
		
		// Get staging mode from options
		$staging_mode = get_option('merchi_staging_mode');
		$merchi_url = $staging_mode === 'yes' ? 'https://api.staging.merchi.co/' : 'https://api.merchi.co/';
		$merchi_secret = $staging_mode === 'yes' ? get_option('staging_merchi_api_secret') : get_option('merchi_api_secret');
		$merchi_domain = $staging_mode === 'yes' ? get_option('staging_merchi_url') : get_option('merchi_url');
		
		// Get product details to check allowQuotation
		$product_api_url = $merchi_url . 'v6/products/' . $merchi_product_id . '/?skip_rights=y';
		$product_response = wp_remote_get($product_api_url, array(
			'headers' => array(
				'Content-Type' => 'application/json',
				'Authorization' => 'ApiKey ' . $merchi_secret,
				'X-Domain-Id' => $merchi_domain,
				'Accept' => 'application/json'
			),
			'timeout' => 30,
			'sslverify' => !$staging_mode
		));
		
		if (is_wp_error($product_response)) {
			return;
		}
		
		$product_data = json_decode(wp_remote_retrieve_body($product_response), true);
		
		if (!isset($product_data['product']) || !isset($product_data['product']['allowQuotation'])) {
			return;
		}
		
		// Check if product allows quotation
		if ($product_data['product']['allowQuotation']) {
			// Add CSS styles for the Get Quote button
			
			echo '<button type="button" ' .
				'class="button wp-element-button single_get_quote_button" ' .
				'id="get-quote-button">' .
				'Get quote' .
				'</button>';
			?>
			<?php
		}
	}
}
