<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin\ShoppingCart;

use \MerchiPlugin\Base\BaseController;

class ShoppingCartInject extends BaseController {


	public function register() {
		add_action( 'wp_enqueue_scripts', [ $this, 'inject_merchi_cart' ] );
	}


	public function inject_merchi_cart() {
				wp_enqueue_script( 'merchi_cart', $this->plugin_url . 'assets/merchi_cart.js' );
		if( get_option( 'merchi_staging_mode' ) == 'yes' ) {
			$merchi_url = get_option( 'staging_merchi_url' );
		}
		else {
			$merchi_url = get_option( 'merchi_url' );
		}
		error_log( $merchi_url );
		$script_data = [
			'mountPointClass' => get_option( 'merchi_mount_point_id' ),
			'storeId'         => $merchi_url,
		];
		wp_localize_script( 'merchi_cart', 'merchiCartScriptOptions', $script_data );
	}
}
