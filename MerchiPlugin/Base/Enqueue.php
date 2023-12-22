<?php declare(strict_types=1);
/**
 * @package MerchiPlugin
 */

namespace MerchiPlugin\Base;

use \MerchiPlugin\Base\BaseController;

class Enqueue extends BaseController {
	public function register() {
		add_action( 'wp_enqueue_scripts', [ $this, 'do_enqueue' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'admin_enqueue' ] );
	}


	public function do_enqueue() {
		wp_enqueue_style( 'styles', $this->plugin_url . 'assets/merchi_styles.css' );
		wp_enqueue_script( 'scripts', $this->plugin_url . 'assets/scripts.js' );
		$mount_point = get_option( 'merchi_mount_point_id' );
		$css         = ".$mount_point {visibility: hidden;}";
		wp_add_inline_style( 'styles', $css );
		if( get_option( 'merchi_staging_mode' ) == 'yes' ) {
			$merchi_init = 'https://staging.merchi.co/static/js/dist/merchi-init.js';
		}
		else {
			$merchi_init = 'https://merchi.co/static/js/dist/merchi-init.js';
		}
		wp_enqueue_script(
			'merchi_init',
			$merchi_init,
			$ver = null
		);
		wp_enqueue_script(
			'merchi_sdk',
			$this->plugin_url . 'assets/merchi_sdk.js',
			[ 'merchi_init' ]
		);

	}


	public function admin_enqueue() {
		if( get_option( 'merchi_staging_mode' ) == 'yes' ) {
			$merchi_url = get_option( 'staging_merchi_url' );
			$merchi_init = 'https://staging.merchi.co/static/js/dist/merchi-init.js';
		}
		else {
			$merchi_url = get_option( 'merchi_url' );
			$merchi_init = 'https://merchi.co/static/js/dist/merchi-init.js';
		}
		wp_enqueue_script(
			'merchi_init',
			$merchi_init,
			$ver = null
		);
		wp_enqueue_script(
			'merchi_sdk',
			$this->plugin_url . 'assets/merchi_sdk.js',
			[ 'merchi_init' ]
		);
		$merchi_plugin_object = [
			'merchiStoreName' => $merchi_url,
		];

		wp_enqueue_style( 'styles',  $this->plugin_url . 'assets/merchi_styles_admin.css' );
		wp_enqueue_script( 'merchi_plugin_val', $this->plugin_url . 'assets/scripts.js' );
		wp_localize_script( 'merchi_plugin_val', 'merchiObject', $merchi_plugin_object );
		wp_enqueue_script( 'ajax_script', $this->plugin_url . 'assets/create_merchi_products.js', [ 'jquery' ] );
		wp_localize_script(
			'ajax_script',
			'create_merchi_products',
			[
				'ajax_url'    => admin_url( 'admin-ajax.php' ),
				'check_nonce' => wp_create_nonce( 'merchi-nonce' ),
			]
		);
		wp_enqueue_script( 'export_ajax_script', $this->plugin_url . 'assets/export_products.js', [ 'jquery' ] );
		wp_localize_script(
			'export_ajax_script',
			'export_products',
			[
				'ajax_url'    => admin_url( 'admin-ajax.php' ),
				'check_nonce' => wp_create_nonce( 'merchi-nonce' ),
			]
		);

	}
}
