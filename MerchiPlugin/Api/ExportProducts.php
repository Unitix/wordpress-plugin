<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */
namespace MerchiPlugin\Api;

use \MerchiPlugin\Base\BaseController;
// use Automattic\WooCommerce\Client;
// use Automattic\WooCommerce\HttpClient\HttpClientException;

function product_to_json($product) {
  $images = [];
  $result = ['name' => $product->name,
             'description' => $product->description,
             'featureImageUrl' => null,
             'price' => $product->regular_price];
   if ($product->image_id) {
     $result['featureImageUrl'] = wp_get_attachment_image_url($product->image_id, 'full');
   }
   if ($product->gallery_image_ids) {
     foreach ($product->gallery_image_ids as $image) {
       array_push($images, wp_get_attachment_image_url($image, 'full'));
     } 

   }
   $result['imageUrls'] = $images;
   return $result;
}

class ExportProducts extends BaseController {

	public function register() {
		add_action( 'wp_ajax_export_products', [ $this, 'export_products' ] );
	}

	public function export_products() {
    $options = ['limit' => -1];
    $products = wc_get_products($options);
    $product_data = [];
    foreach ($products as $product) {
      array_push($product_data, product_to_json($product));
    }
    $result = ['products' => $product_data];
    if( get_option( 'merchi_staging_mode' ) == 'yes' ) {
      $api_secret = esc_attr( get_option( 'staging_merchi_api_secret' ) );
      $merchi_url = 'https://api.staging.merchi.co/v6/domains/import/woocommerce/';
    }
    else {
      $api_secret = esc_attr( get_option( 'merchi_api_secret' ) );
      $merchi_url = 'https://api.merchi.co/v6/domains/import/woocommerce/';
    }
    $args = [
      'body' => [
        'data' => json_encode($result),
        'api_secret' => $api_secret
      ]
    ];
    $response = wp_remote_post($merchi_url, $args);
    $status = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body( $response );
    if ($status == 201) {
      echo "Exported all products!";
    } else {
      echo "Server error: " . $body;
    }
		wp_die();
	}
}
