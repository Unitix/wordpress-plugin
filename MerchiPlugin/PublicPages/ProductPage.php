<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin\PublicPages;

use \MerchiPlugin\Base\BaseController;

class ProductPage extends BaseController {


	public function register() {
		// Inject Merchi product into product page.
		//add_filter( 'woocommerce_single_product_summary', [ $this, 'inject_merchi_product' ], 98 );
		// Remove product content based on category
		add_action('woocommerce_before_add_to_cart_button', [ $this, 'custom_product_attributes_dropdowns' ] );
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

	public function custom_product_attributes_dropdowns() {
    global $product;

    $product_id = $product->get_id();
    $attributes = get_post_meta($product_id, '_product_attributes', true);

    if (empty($attributes) || !is_array($attributes)) {
        return;
    }

    echo '<div id="custom-variation-options" class="merchi-product-form">';

    foreach ($attributes as $taxonomy => $attribute) {
        if ($attribute['is_taxonomy']) {
            $terms = get_terms(array('taxonomy' => $taxonomy, 'hide_empty' => false));

            if (!empty($terms)) {
                echo '<label for="' . esc_attr($taxonomy) . '">' . wc_attribute_label($taxonomy) . ':</label>';
                echo '<select class="custom-variation-select" name="' . esc_attr($taxonomy) . '" id="' . esc_attr($taxonomy) . '">';

                foreach ($terms as $index => $term) {
                    echo '<option value="' . esc_attr($term->slug) . '"' . ($index === 0 ? ' selected' : '') . '>' . esc_html($term->name) . '</option>';
                }

                echo '</select>';
            }
        }
    }

    echo '</div>';

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
