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
		add_action( 'wp', [ $this, 'remove_product_content' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_merchi_scripts' ] );
	}

	public function enqueue_merchi_scripts() {
		if (is_product()) {
			wp_enqueue_script(
				'merchi-product-form',
				plugin_dir_url(dirname(dirname(__FILE__))) . 'assets/merchi-product-form.js',
				array('jquery'),
				'1.0.0',
				true
			);

			// Add Merchi configuration data
			wp_localize_script('merchi-product-form', 'merchiConfig', array(
				'apiKey' => get_option('merchi_api_key'),
				'domainId' => get_option('merchi_domain_id'),
				'apiUrl' => get_option('merchi_staging_mode') === 'yes' ? 'https://api.staging.merchi.co/' : 'https://api.merchi.co/',
				'productId' => get_post_meta(get_the_ID(), 'product_id', true)
			));
		}
	}

	public function custom_display_independent_attributes() {
    global $product;

    $product_id = $product->get_id();
    $fields = get_post_meta($product_id, '_merchi_ordered_fields', true);

    if (empty($fields) || !is_array($fields)) return;

    echo '<div id="custom-variation-options merchi-product-form">';

    foreach ($fields as $field) {
        $type = $field['type'];
        $label = esc_html($field['label']);
        $slug = esc_attr($field['slug']);
        $required = !empty($field['required']) ? 'required' : '';
        $fieldType = intval($field['fieldType']);
        $fieldID = intval($field['fieldID']);

        echo '<div class="custom-field">';
        echo "<label for='{$slug}'>{$label}</label>";

        if ($type === 'attribute' && !empty($field['taxonomy'])) {
					$terms = get_terms(['taxonomy' => $field['taxonomy'], 'hide_empty' => false]);
					if ($terms) {
							$has_images = false;
							foreach ($terms as $term) {
									if (get_term_meta($term->term_id, 'taxonomy_image', true)) {
											$has_images = true;
											break;
									}
							}
			
							$is_multiple = !empty($field['multipleSelect']);
			
							echo '<div class="custom-attribute-options" data-attribute="' . esc_attr($field['taxonomy']) . '">';
			
							if ($is_multiple) {
									if ($has_images) {
											foreach ($terms as $term) {
													$image_id = get_term_meta($term->term_id, 'taxonomy_image', true);
													$image_url = $image_id ? wp_get_attachment_url($image_id) : '';
													$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
			
													echo '<label class="custom-attribute-option">';
													echo '<input type="checkbox" name="' . esc_attr($field['taxonomy']) . '[]" value="' . esc_attr($term->slug) . '" data-variation-field-id="'.esc_attr($fieldID).'" data-variation-field-value="' . esc_attr($variation_option_id) . '"/>';
													if ($image_url) {
															echo '<img src="' . esc_url($image_url) . '" class="attribute-image">';
													}
													echo '<span class="option-label">' . esc_html($term->name) . '</span>';
													echo '</label>';
											}
									} else {
											echo '<select multiple name="' . esc_attr($field['taxonomy']) . '[]" class="custom-select-multi" data-variation-field-id="'.esc_attr($fieldID).'">';
											foreach ($terms as $term) {
												$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
													echo '<option value="' . esc_attr($term->slug) . '" data-variation-field-value="' . esc_attr($variation_option_id) . '">' . esc_html($term->name) . '</option>';
											}
											echo '</select>';
									}
							} else {
									foreach ($terms as $index => $term) {
											$image_id = get_term_meta($term->term_id, 'taxonomy_image', true);
											$image_url = $image_id ? wp_get_attachment_url($image_id) : '';
											$is_checked = $index === 0 ? 'checked' : '';
											$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
											echo '<label class="custom-attribute-option">';
											echo '<input type="radio" name="' . esc_attr($field['taxonomy']) . '" data-variation-field-id="'.esc_attr($fieldID).'" value="' . esc_attr($term->slug) . '" ' . $is_checked . ' data-variation-field-value="' . esc_attr($variation_option_id) . '"/>';
											if ($image_url) {
													echo '<img src="' . esc_url($image_url) . '" class="attribute-image">';
											}
											echo '<span class="option-label">' . esc_html($term->name) . '</span>';
											echo '</label>';
									}
							}
			
							echo '</div>';
					}
			} elseif ($type === 'meta') {
            $placeholder = esc_attr($field['placeholder'] ?? '');
            $instructions = esc_html($field['instructions'] ?? '');
						$field_id = esc_attr($fieldID);
            switch ($fieldType) {
                case 1: echo "<input type='text' id='{$slug}' name='custom_fields[{$slug}]' placeholder='{$placeholder}' {$required} data-variation-field-id='{$field_id}'/>"; break;
                case 3: echo "<label class='custom-upload-wrapper'><div class='upload-icon'>📎</div><div class='upload-instruction'>Drop file here or click to browse</div><div class='upload-types'>.jpeg, .jpg, .gif, .png, .pdf</div><input type='file' id='{$slug}' name='custom_fields[{$slug}]' {$required} data-variation-field-id='{$field_id}' accept='.jpeg,.jpg,.gif,.png,.pdf'/></label>"; break;
                case 4: echo "<textarea id='{$slug}' name='custom_fields[{$slug}]' placeholder='{$placeholder}' {$required} data-variation-field-id='{$field_id}'></textarea>"; break;
                case 5: echo "<input type='number' id='{$slug}' name='custom_fields[{$slug}]' placeholder='{$placeholder}' {$required} data-variation-field-id='{$field_id}'/>"; break;
                case 10: echo "<input type='color' id='{$slug}' name='custom_fields[{$slug}]' {$required} data-variation-field-id='{$field_id}'/>"; break;
                case 8: echo "<p class='field-instructions'>{$instructions}</p>"; break;
                default: echo "<input type='text' id='{$slug}' name='custom_fields[{$slug}]' placeholder='{$placeholder}' {$required} data-variation-field-id='{$field_id}'/>"; break;
            }
        }

        echo '</div>';
    }

    echo '</div>';
	}

	public function custom_display_grouped_attributes() {
		global $product;

    $product_id = $product->get_id();
    $group_fields_template = get_post_meta($product_id, '_group_variation_field_template', true);

    if (empty($group_fields_template)) return;

    echo '<div id="grouped-fields-container merchi-product-form">';
    echo '<h3>Grouped Options</h3>';

    echo '<div class="group-field-set" data-group-index="1">';
    echo '<h4>Group <span class="group-number">1</span></h4>';
    foreach ($group_fields_template as $field) {
        if ($field['type'] === 'attribute') {
            echo $this->render_attribute_field($field, "group_fields[1]");
        } else {
            echo $this->render_meta_field($field, "group_fields[1]");
        }
    }
    echo '<button type="button" class="delete-group-button" style="display: none;">Delete Group</button>';
    echo '</div>';

    echo '</div>';

    echo '<button type="button" id="add-group-button">+ New Group</button>';
}


private function render_attribute_field($field, $name_prefix) {
	$terms = get_terms(['taxonomy' => $field['taxonomy'], 'hide_empty' => false]);

	if (empty($terms)) return '';

	$slug = esc_attr($field['slug']);
	$label = esc_html($field['label']);
	$field_id = esc_html($field['fieldID']);
	$is_multiple = !empty($field['multipleSelect']);

	$html = '<div class="custom-field">';
	$html .= "<label for='{$slug}'>{$label}</label>";

	if ($is_multiple) {
			$html .= '<select multiple name="' . $name_prefix . '[' . $slug . '][]" data-variation-field-id="'.esc_attr($field_id).'">';
			foreach ($terms as $term) {
					$html .= '<option value="' . esc_attr($term->slug) . '">' . esc_html($term->name) . '</option>';
			}
			$html .= '</select>';
	} else {
			foreach ($terms as $index => $term) {
					$is_checked = $index === 0 ? 'checked' : '';
					$variation_option_id = get_term_meta($term->term_id, 'variation_option_id', true);
					$html .= '<label class="custom-attribute-option">';
					$html .= '<input type="radio" name="' . $name_prefix . '[' . $slug . ']" value="' . esc_attr($term->slug) . '" ' . $is_checked . ' data-variation-field-id="'.esc_attr($field_id).'" data-variation-field-value="' . esc_attr($variation_option_id) . '"/>';
					$html .= '<span class="option-label">' . esc_html($term->name) . '</span>';
					$html .= '</label>';
			}
	}

	$html .= '</div>';
	return $html;
}

private function render_meta_field($field, $name_prefix) {
	$slug = esc_attr($field['slug']);
	$label = esc_html($field['label']);
	$fieldType = intval($field['fieldType']);
	$field_id = esc_html($field['fieldID']);
	$placeholder = esc_attr($field['placeholder'] ?? '');
	$instructions = esc_html($field['instructions'] ?? '');
	$required = !empty($field['required']) ? 'required' : '';

	$html = '<div class="custom-field">';
	$html .= "<label for='{$slug}'>{$label}</label>";

	switch ($fieldType) {
			case 1: $html .= "<input type='text' name='{$name_prefix}[{$slug}]' data-variation-field-id='{$field_id}' placeholder='{$placeholder}' {$required} />"; break;
			case 3: $html .= "<label class='custom-upload-wrapper'><div class='upload-icon'>📎</div><div class='upload-instruction'>Drop file here or click to browse</div><div class='upload-types'>.jpeg, .jpg, .gif, .png, .pdf</div><input type='file' name='{$name_prefix}[{$slug}]' {$required} data-variation-field-id='{$field_id}' accept='.jpeg,.jpg,.gif,.png,.pdf'/></label>"; break;
			case 4: $html .= "<textarea name='{$name_prefix}[{$slug}]' data-variation-field-id='{$field_id}' placeholder='{$placeholder}' {$required}></textarea>"; break;
			case 5: $html .= "<input type='number' name='{$name_prefix}[{$slug}]' data-variation-field-id='{$field_id}' placeholder='{$placeholder}' {$required} />"; break;
			case 10: $html .= "<input type='color' name='{$name_prefix}[{$slug}]' data-variation-field-id='{$field_id}' {$required} />"; break;
			case 8: $html .= "<p class='field-instructions'>{$instructions}</p>"; break;
			default: $html .= "<input type='text' name='{$name_prefix}[{$slug}]' placeholder='{$placeholder}' data-variation-field-id='{$field_id}' {$required} />"; break;
	}

	$html .= '</div>';
	return $html;
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
}
