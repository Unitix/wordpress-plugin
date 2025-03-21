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
				'apiUrl' => get_option('merchi_staging_mode') === 'yes' ? 'https://staging.merchi.co/' : 'https://merchi.co/',
				'productId' => get_post_meta(get_the_ID(), 'product_id', true)
			));
		}
	}

	public function custom_display_attribute_smart_checkboxes() {
    global $product;

    $product_id = $product->get_id();
    $attributes = get_post_meta($product_id, '_product_attributes', true);
    $independent_variation_fields = get_post_meta($product_id, '_merchi_independent_variation_fields', true);
    $group_variation_fields = get_post_meta($product_id, '_merchi_group_variation_fields', true);

    if (empty($attributes) || !is_array($attributes)) {
        return;
    }

    echo '<div id="custom-variation-options" class="merchi-product-form">';

    foreach ($attributes as $taxonomy => $attribute) {
			if ($attribute['is_taxonomy']) {
					$terms = get_terms(array('taxonomy' => $taxonomy, 'hide_empty' => false));

<<<<<<< HEAD
            if (!empty($terms)) {
                // Find the corresponding variation field ID
                $variation_field_id = '';
                if (!empty($independent_variation_fields)) {
                    foreach ($independent_variation_fields as $field) {
                        if ($field->name === $taxonomy) {
                            $variation_field_id = $field->id;
                            break;
                        }
                    }
                }
                
                if (empty($variation_field_id) && !empty($group_variation_fields)) {
                    foreach ($group_variation_fields as $group) {
                        foreach ($group->fields as $field) {
                            if ($field->name === $taxonomy) {
                                $variation_field_id = $field->id;
                                break 2;
                            }
                        }
                    }
                }

                echo '<label for="' . esc_attr($taxonomy) . '">' . wc_attribute_label($taxonomy) . ':</label>';
                echo '<select class="custom-variation-select" 
                    name="' . esc_attr($taxonomy) . '" 
                    id="' . esc_attr($taxonomy) . '"
                    data-variation-field-id="' . esc_attr($variation_field_id) . '">';
=======
					if (!empty($terms)) {
							echo '<h4>' . wc_attribute_label($taxonomy) . '</h4>';
							echo '<div class="custom-attribute-options" data-attribute="' . esc_attr($taxonomy) . '">';
>>>>>>> 0699940c52f98f53ce6715f29ab66288cb0386ce

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
<<<<<<< HEAD

    echo '<p id="custom-price-display">Price: $<span id="merchi-product-price">10</span></p>';
    echo '<p id="merchi-price-error" style="color: red; display: none;"></p>';
}


	public function inject_merchi_product() {
		global $product;

		// Display the product title
    woocommerce_template_single_title();

		// SKU used as Merchi ID. We are checking to see if Merchi ID exists. If so fetch Merchi product.
		if ($product->get_meta('product_id') !== '') {

			$sync_keys = array(
				'redirect_after_success_url' => 'redirectAfterSuccessUrl',
				'redirect_after_quote_success_url' => 'redirectAfterQuoteSuccessUrl',
				'redirect_with_value' => 'redirectWithValue',
				'hide_info' => 'hideInfo',
				'hide_preview' => 'hidePreview',
				'hide_price' => 'hidePrice',
				'hide_title' => 'hideTitle',
				'hide_calculated_price' => 'hideCalculatedPrice',
				'include_bootstrap' => 'includeBootstrap',
				'not_include_default_css' => 'notIncludeDefaultCss',
				'invoice_redirect' => 'invoiceRedirect',
				'load_theme' => 'loadTheme',
				'mount_point_id' => 'mountPointId',
				'single_column' => 'singleColumn',
				'quote_requested_redirect' => 'quoteRequestedRedirect',
				'google_api_public_key' => 'googleApiPublicKey',
				'allow_add_to_cart' => 'allowAddToCart',
				'hide_drafting' => 'hideDrafting',
			);
			
			$atts = array(
				'id' => $product->get_meta('product_id'),
				'redirect_after_success_url' => $product->get_meta('redirectAfterSuccessUrl'),
				'redirect_after_quote_success_url' => $product->get_meta('redirectAfterQuoteSuccessUrl'),
				'redirect_with_value' => $product->get_meta('redirectWithValue'),
				'hide_info' => $product->get_meta('hideInfo'),
				'hide_preview' => $product->get_meta('hidePreview'),
				'hide_price' =>  $product->get_meta('hidePrice'),
				'hide_title' => $product->get_meta('hideTitle'),
				'hide_calculated_price' => $product->get_meta('hideCalculatedPrice'),
				'include_bootstrap' => $product->get_meta('includeBootstrap'),
				'not_include_default_css' => $product->get_meta('notIncludeDefaultCss'),
				'invoice_redirect' => $product->get_meta('invoiceRedirect'),
				'load_theme' => $product->get_meta('loadTheme'),
				'mount_point_id' => $product->get_meta('mountPointId'),
				'single_column' => $product->get_meta('singleColumn'),
				'quote_requested_redirect' => $product->get_meta('quoteRequestedRedirect'),
				'google_api_public_key' => $product->get_meta('googleApiPublicKey'),
				'allow_add_to_cart' => $product->get_meta('allowAddToCart'),
				'hide_drafting' => $product->get_meta('hideDrafting')
			);

			if( get_option( 'merchi_staging_mode' ) == 'yes' ) {

				$url = 'https://staging.merchi.co';
			}
			else {
				
				$url = 'https://merchi.co';
			}

			$src = $url . '/static/product_embed/js/product.embed.js?product=' . $atts['id'];

			foreach( $atts as $key => $atr ){
					if("id" == $key ) { continue;
					}
					if("" == $atr || !$atr ) { continue;
					}
					$src .='&'.$sync_keys[$key]."=".$atr;
			}
				
			$content = '<div class="merchi-product-form-container"><script type="text/javascript" data-name="product-embed" src="'.$src.'"></script></div>';
			echo $content;
		} else {
			echo 'Merchi product not found.';
		}
=======
>>>>>>> 0699940c52f98f53ce6715f29ab66288cb0386ce
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
