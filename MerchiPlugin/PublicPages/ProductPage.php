<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin\PublicPages;

use \MerchiPlugin\Base\BaseController;

class ProductPage extends BaseController {


	public function register() {
		add_action('woocommerce_before_add_to_cart_button', [ $this, 'custom_display_attribute_smart_checkboxes' ] );
		add_action( 'wp', [ $this, 'remove_product_content' ] );
	}

	public function custom_display_attribute_smart_checkboxes() {
    global $product;

    $product_id = $product->get_id();
    $attributes = get_post_meta($product_id, '_product_attributes', true);

    if (empty($attributes) || !is_array($attributes)) {
        return;
    }

    echo '<div id="custom-variation-options">';

    foreach ($attributes as $taxonomy => $attribute) {
			if ($attribute['is_taxonomy']) {
					$terms = get_terms(array('taxonomy' => $taxonomy, 'hide_empty' => false));

					if (!empty($terms)) {
							echo '<h4>' . wc_attribute_label($taxonomy) . '</h4>';
							echo '<div class="custom-attribute-options" data-attribute="' . esc_attr($taxonomy) . '">';

							foreach ($terms as $index => $term) {
									$image_id = get_term_meta($term->term_id, 'taxonomy_image', true);
									$image_url = $image_id ? wp_get_attachment_url($image_id) : '';
									$is_checked = $index === 0 ? 'checked' : ''; // Auto-select the first option

									echo '<label class="custom-attribute-option">';
									echo '<input type="radio" name="' . esc_attr($taxonomy) . '" value="' . esc_attr($term->slug) . '" ' . $is_checked . ' />';
									if ($image_url) {
											echo '<img src="' . esc_url($image_url) . '" class="attribute-image">';
									}
									echo '<span class="custom-checkmark"></span>';
									echo '<span class="option-label">' . esc_html($term->name) . '</span>';
									echo '</label>';
							}

							echo '</div>';
					}
			}
    }

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
}
