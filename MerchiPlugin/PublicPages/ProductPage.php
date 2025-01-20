<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin\PublicPages;

use \MerchiPlugin\Base\BaseController;

class ProductPage extends BaseController {


	public function register() {
		// Inject Merchi product into product page.
		add_filter( 'woocommerce_single_product_summary', [ $this, 'inject_merchi_product' ], 98 );
		// Remove product content based on category
		add_action( 'wp', [ $this, 'remove_product_content' ] );
	}


	public function inject_merchi_product() {
		global $product;
		// SKU used as Merchi ID. We are checking to see if Merchi ID exists. If so fetch Merchi product.
		if ($product->get_sku() !== '') {

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
				'id' => $product->get_meta('merchi_id'),
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
				
			$content = '<script type="text/javascript" data-name="product-embed" src="'.$src.'"></script>';
      echo $content;
		} else {
			echo 'Merchi product not found.';
		}
	}


	public function remove_product_content() {
		remove_action( 'woocommerce_after_single_product_summary', 'woocommerce_output_related_products', 20 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_title', 5 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_rating', 10 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_price', 10 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_excerpt', 20 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_sharing', 50 );
		remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_add_to_cart', 30 );
		remove_action( 'woocommerce_simple_add_to_cart', 'woocommerce_simple_add_to_cart', 30 );
		remove_action( 'woocommerce_grouped_add_to_cart', 'woocommerce_grouped_add_to_cart', 30 );
		remove_action( 'woocommerce_variable_add_to_cart', 'woocommerce_variable_add_to_cart', 30 );
		remove_action( 'woocommerce_external_add_to_cart', 'woocommerce_external_add_to_cart', 30 );
		remove_action( 'woocommerce_single_variation', 'woocommerce_single_variation', 10 );
		remove_action( 'woocommerce_single_variation', 'woocommerce_single_variation_add_to_cart_button', 20 );
	}


}

